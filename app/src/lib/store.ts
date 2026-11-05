import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AppData, CalcAttempt, LoopState, QuestionExplain, Round } from '../types'
import { getSession, useSession, userDataKey } from './auth'

const EMPTY: AppData = { rounds: {}, loops: {}, studied: {}, perfected: {}, calcDone: {}, calcAttempts: {}, questionExplains: {} }

function dataKey(phone: string): string {
  return userDataKey(phone)
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
      perfected: parsed.perfected ?? {},
      energy: parsed.energy ?? 0,
      gems: Object.fromEntries(Object.entries(parsed.gems ?? {}).map(([k, v]) => [k, v > 1e8 ? 1 : v])),
      outfits: parsed.outfits ?? {},
      calcDone: parsed.calcDone ?? {},
      calcAttempts: parsed.calcAttempts ?? {},
      questionExplains: parsed.questionExplains ?? {},
    }
  } catch {
    return null
  }
}

function loadFor(phone: string | null): AppData {
  if (!phone) return { ...EMPTY, rounds: {}, loops: {}, studied: {}, calcDone: {}, calcAttempts: {} }
  return readStored(dataKey(phone)) ?? { ...EMPTY, rounds: {}, loops: {}, studied: {}, calcDone: {}, calcAttempts: {}, questionExplains: {} }
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
  // 错题回炉轮首次完成：+3 能量（打 Boss 前的补给收益）
  const prev = cache.rounds[round.id]
  if (round.kind === 'remedial' && round.finishedAt && !prev?.finishedAt) {
    cache = { ...cache, energy: (cache.energy ?? 0) + 3 }
  }
  cache = { ...cache, rounds: { ...cache.rounds, [round.id]: round } }
  persist()
}

/** 收下能量石战斗的产出：stones 块 = +stones 能量（每颗路径宝石只结算一次） */
export function markGem(gemId: string, stones: number) {
  if (cache.gems?.[gemId] != null) return
  cache = { ...cache, gems: { ...(cache.gems ?? {}), [gemId]: Math.max(0, stones) }, energy: (cache.energy ?? 0) + Math.max(0, stones) }
  persist()
}

/** 用能量石兑换装备 */
export function buyOutfit(outfitId: string, price: number) {
  if (cache.outfits?.owned?.includes(outfitId)) return false
  if ((cache.energy ?? 0) < price) return false
  cache = {
    ...cache,
    energy: (cache.energy ?? 0) - price,
    outfits: { ...(cache.outfits ?? {}), owned: [...(cache.outfits?.owned ?? []), outfitId] },
  }
  persist()
  return true
}

/** 穿戴/脱下装备 */
export function equipOutfit(slot: 'hat' | 'shoes' | 'clothes' | 'skin', outfitId?: string) {
  cache = { ...cache, outfits: { ...(cache.outfits ?? {}), [slot]: outfitId } }
  persist()
}

/** 战前准备消耗能量；余额不足返回 false */
export function spendEnergy(cost: number): boolean {
  if ((cache.energy ?? 0) < cost) return false
  cache = { ...cache, energy: (cache.energy ?? 0) - cost }
  persist()
  return true
}

export function updateLoop(loop: LoopState) {
  cache = { ...cache, loops: { ...cache.loops, [loop.chapterId]: loop } }
  persist()
}

/** 保存单题讲解课件（同题重复生成则覆盖） */
export function recordQuestionExplain(ex: QuestionExplain) {
  cache = { ...cache, questionExplains: { ...(cache.questionExplains ?? {}), [ex.questionId]: ex } }
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
  // 计算副本首次通过：+2 能量（此后再刷不重复给，防刷）
  if (passed && !prev?.passed) {
    cache = { ...cache, energy: (cache.energy ?? 0) + 2 }
  }
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

/** 课末微战全对首过：闪耀点亮（+5 XP） */
export function markPerfected(pointId: string) {
  if (cache.perfected?.[pointId]) return
  cache = { ...cache, perfected: { ...(cache.perfected ?? {}), [pointId]: Date.now() } }
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
      questionExplains: parsed.questionExplains ?? {},
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
