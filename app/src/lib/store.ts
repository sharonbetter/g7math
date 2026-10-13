import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AppData, CalcAttempt, LoopState, Round } from '../types'
import { getSession, useSession } from './auth'

const EMPTY: AppData = { rounds: {}, loops: {}, studied: {}, calcDone: {}, calcAttempts: {} }

function dataKey(phone: string): string {
  return `g7math.user.${phone}.v1`
}

function readStored(key: string): AppData | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AppData
    return {
      rounds: parsed.rounds ?? {},
      loops: parsed.loops ?? {},
      studied: parsed.studied ?? {},
      calcDone: parsed.calcDone ?? {},
      calcAttempts: parsed.calcAttempts ?? {},
    }
  } catch {
    return null
  }
}

function loadFor(phone: string | null): AppData {
  if (!phone) return { ...EMPTY, rounds: {}, loops: {}, studied: {}, calcDone: {}, calcAttempts: {} }
  return readStored(dataKey(phone)) ?? { ...EMPTY, rounds: {}, loops: {}, studied: {}, calcDone: {}, calcAttempts: {} }
}

undoLegacyMerge()
let cache: AppData = loadFor(getSession()?.phone ?? null)
const listeners = new Set<() => void>()

function persist() {
  const phone = getSession()?.phone
  if (!phone) return
  try {
    localStorage.setItem(dataKey(phone), JSON.stringify(cache))
  } catch (e) {
    console.error('保存学习数据失败（可能是浏览器存储已满）', e)
  }
  listeners.forEach((fn) => fn())
}

function reloadForSession() {
  cache = loadFor(getSession()?.phone ?? null)
  listeners.forEach((fn) => fn())
}

/** 去掉登录功能上线时误塞进某个手机号的旧数据，只执行一次。 */
function undoLegacyMerge() {
  const flag = 'g7math.legacyMigrated.v1'
  const phone = localStorage.getItem(flag)
  if (!phone) return
  localStorage.removeItem(`g7math.user.${phone}.v1`)
  localStorage.removeItem(flag)
  if (getSession()?.phone === phone) cache = loadFor(phone)
}

export function getData(): AppData {
  return cache
}

export function useAppData(): AppData {
  const session = useSession()
  const [, force] = useState(0)
  useEffect(() => {
    reloadForSession()
  }, [session?.phone])
  useEffect(() => {
    const fn = () => force((x) => x + 1)
    listeners.add(fn)
    return () => {
      listeners.delete(fn)
    }
  }, [])
  return cache
}

export function saveRound(round: Round) {
  cache = { ...cache, rounds: { ...cache.rounds, [round.id]: round } }
  persist()
}

export function updateLoop(loop: LoopState) {
  cache = { ...cache, loops: { ...cache.loops, [loop.chapterId]: loop } }
  persist()
}

/** 记录一次计算专项训练的完成（best 取历史最佳；passed 通过后不回退） */
export function recordCalcDone(
  trainingId: string,
  correct: number,
  total: number,
  passed = false,
  passRounds = 0,
) {
  const prev = cache.calcDone?.[trainingId]
  cache.calcDone = {
    ...(cache.calcDone ?? {}),
    [trainingId]: {
      best: Math.max(prev?.best ?? 0, correct),
      total,
      doneAt: Date.now(),
      count: (prev?.count ?? 0) + 1,
      passed: passed || prev?.passed || false,
      passRounds: passed ? (prev?.passRounds ?? passRounds) : prev?.passRounds,
    },
  }
  persist()
}

/** 保存计算专项一轮的逐题批改明细（每训练最多保留最近 8 轮） */
export function saveCalcAttempt(trainingId: string, attempt: CalcAttempt) {
  const list = [...(cache.calcAttempts?.[trainingId] ?? []), attempt].slice(-8)
  cache.calcAttempts = { ...(cache.calcAttempts ?? {}), [trainingId]: list }
  persist()
}

/** 就地修补一条计算专项批改记录（异步模型诊断返回后更新错因） */
export function patchCalcAttempt(trainingId: string, finishedAt: number, items: CalcAttempt['items']) {
  const list = cache.calcAttempts?.[trainingId] ?? []
  const idx = list.findIndex((a) => a.finishedAt === finishedAt)
  if (idx < 0) return
  list[idx] = { ...list[idx], items }
  cache.calcAttempts = { ...(cache.calcAttempts ?? {}), [trainingId]: [...list] }
  persist()
}

export function markStudied(pointId: string) {
  if (cache.studied[pointId]) return
  cache = { ...cache, studied: { ...cache.studied, [pointId]: Date.now() } }
  persist()
}

export function resetAll() {
  cache = { ...EMPTY, rounds: {}, loops: {}, studied: {} }
  persist()
}

export function exportData(): string {
  return JSON.stringify(cache, null, 2)
}

export function importData(json: string): boolean {
  try {
    const parsed = JSON.parse(json) as AppData
    cache = {
      rounds: parsed.rounds ?? {},
      loops: parsed.loops ?? {},
      studied: parsed.studied ?? {},
      calcDone: parsed.calcDone ?? {},
      calcAttempts: parsed.calcAttempts ?? {},
    }
    persist()
    return true
  } catch {
    return false
  }
}

/** 按开始时间倒序列出所有作答轮次 */
export function useRounds(): Round[] {
  const data = useAppData()
  return useMemo(
    () =>
      Object.values(data.rounds).sort((a, b) => b.startedAt - a.startedAt),
    [data],
  )
}

export function useChapterLoop(chapterId: string | undefined): LoopState | undefined {
  const data = useAppData()
  return chapterId ? data.loops[chapterId] : undefined
}

export function useStudyProgress(): { count: number; ids: string[] } {
  const data = useAppData()
  return useMemo(() => {
    const ids = Object.keys(data.studied)
    return { count: ids.length, ids }
  }, [data])
}

/** 生成一个稳定的 id */
export function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export function useRefresh() {
  return useCallback(() => {
    cache = { ...cache }
    persist()
  }, [])
}
