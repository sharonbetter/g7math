import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AppData, LoopState, Round } from '../types'
import { getSession, useSession } from './auth'

const EMPTY: AppData = { rounds: {}, loops: {}, studied: {} }

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
    }
  } catch {
    return null
  }
}

function loadFor(phone: string | null): AppData {
  if (!phone) return { ...EMPTY, rounds: {}, loops: {}, studied: {} }
  return readStored(dataKey(phone)) ?? { ...EMPTY, rounds: {}, loops: {}, studied: {} }
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
