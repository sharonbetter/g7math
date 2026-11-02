/**
 * 能量石：散在关卡路径边的可拾取资源。
 *
 * 规则：
 * - 题池 = 全书计算题按章节顺序汇总（剔除「数学活动」类模块，另行安排）
 * - 每颗石头 5 题，按池子顺序连续截取；每关 3 颗
 * - 不超前：第 k 关的石头题目必须全部来自第 1..k 章——
 *   第一章没有计算题，自然没有石头；后续关的石头也只会是已学章节的题
 */
import type { CalcBook } from '../types'

export interface GemQ {
  stem: string
  answer: string
  accepted: string[]
  /** 建议用时（秒），作倒计时上限 */
  est: number
}

export interface GemStone {
  /** gem-{levelNo}-{no} */
  id: string
  levelNo: number
  no: number
  qs: GemQ[]
}

const PER_STONE = 5
const PER_LEVEL = 3
/** 7a-c1..c6 → 第 1..6 关；7b-c7..c12 → 第 7..12 关（章号即全书关号，连续） */
function levelOfChapter(chapterId: string): number {
  return parseInt((chapterId.split('c')[1] ?? '0').replace(/[^0-9]/g, ''), 10) || 0
}

/** 全书能量石（按上述规则派生，id 与题目内容稳定） */
export function gemStones(book: CalcBook): GemStone[] {
  // 剔除数学活动类模块（特殊内容，不进能量石池）
  const activityModuleIds = new Set(
    book.modules.filter((m) => (m.name ?? '').includes('数学活动')).map((m) => m.id),
  )
  // 题池：全书按真实章节顺序展开
  const pool: GemQ[] = []
  const poolLevels: number[] = []
  const byChapter = new Map<string, typeof book.trainings>()
  for (const t of book.trainings) {
    if (activityModuleIds.has(t.moduleId)) continue
    const list = byChapter.get(t.chapterId) ?? []
    list.push(t)
    byChapter.set(t.chapterId, list)
  }
  for (const cid of [...byChapter.keys()].sort((a, b) => levelOfChapter(a) - levelOfChapter(b))) {
    for (const t of byChapter.get(cid)!)
      for (const q of t.questions) {
        pool.push({ stem: q.stem, answer: q.answer, accepted: q.acceptedAnswers ?? [], est: q.estimatedSeconds ?? 45 })
        poolLevels.push(levelOfChapter(cid))
      }
  }
  // 截至第 k 关的可用题量
  const cumByLevel: Record<number, number> = {}
  let maxLevel = 0
  for (const lv of poolLevels) maxLevel = Math.max(maxLevel, lv)
  for (let k = 1; k <= maxLevel; k++) cumByLevel[k] = poolLevels.filter((lv) => lv <= k).length

  const stones: GemStone[] = []
  // 每关 3 颗 × 5 题：优先用「本章新增题」（学完就练），不足再从最早未用的旧题补（复习）
  const lastLevel = maxLevel + 1 // 最后一章往往没有新题，补一轮复习石
  let oldCursor = 0
  for (let k = 1; k <= lastLevel; k++) {
    const prevCum = k > 1 ? (cumByLevel[k - 1] ?? 0) : 0
    const curCum = cumByLevel[k] ?? prevCum
    const need = PER_LEVEL * PER_STONE
    const newCount = Math.min(need, curCum - prevCum)
    const fill = need - newCount
    const idxs: number[] = []
    for (let i = 0; i < newCount; i++) idxs.push(prevCum + i)
    for (let i = 0; i < fill && prevCum > 0; i++) idxs.push((oldCursor + i) % prevCum)
    oldCursor += fill
    for (let no = 0; (no + 1) * PER_STONE <= idxs.length; no++) {
      stones.push({
        id: `gem-${k}-${no + 1}`,
        levelNo: k,
        no: no + 1,
        qs: idxs.slice(no * PER_STONE, (no + 1) * PER_STONE).map((i) => pool[i]),
      })
    }
  }
  return stones
}
