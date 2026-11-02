/**
 * 关卡视图：把章节的学习内容翻译成「任务清单 + 守关 Boss」。
 * 与 incentives.ts 同一原则：全部由已有的课件进度、考评轮次和计算专项记录推算，
 * 不另存一份进度，改完任何学习行为后状态自动跟上。
 */
import type { AppData, CalcBook, Chapter, Point, Round } from '../types'
import { comboBonusOf } from './incentives'

export type BossState = 'sleeping' | 'ready' | 'fighting' | 'defeated'

export interface BossStateMeta {
  label: string
  icon: string
}

export const BOSS_STATES: Record<BossState, BossStateMeta> = {
  sleeping: { label: '沉睡中', icon: '🗿' },
  ready: { label: '已苏醒', icon: '⚔️' },
  fighting: { label: '再战中', icon: '🔥' },
  defeated: { label: '已通关', icon: '🏆' },
}

export interface QuestPoint {
  point: Point
  done: boolean
  /** 闪耀点亮：课末微战全对首过 */
  shining?: boolean
}

export interface CalcQuestGroup {
  moduleId: string
  name: string
  total: number
  done: number
  passed: number
}

export interface ChapterQuest {
  state: BossState
  mainPct: number
  /** 唤醒 Boss 还需学完的知识点数 */
  needPoints: number
  points: QuestPoint[]
  studiedCount: number
  calcGroups: CalcQuestGroup[]
  /** 已完成的章节考评轮数（= 挑战次数） */
  attempts: number
  /** 最好一轮：对题数 / 总题数 */
  bestCorrect: number
  bestTotal: number
  /** 出现过「全对且无超时」的一轮 */
  perfect: boolean
  /** 未掌握时的薄弱知识点数 */
  weakPoints: number
  round: number
  /** 本关已累计的经验（口径与 incentives.ts 一致） */
  xp: number
}

/** 唤醒 Boss 的主线任务完成度门槛 */
export const WAKE_RATIO = 0.8

/** 与 incentives.ts 的 xpOfRound 同口径，保持展示与实际入账一致 */
function xpOfRound(r: Round): number {
  const correct = r.answers.filter((a) => a.correct).length
  return 20 + correct * 2 + (r.kind === 'practice' ? 10 : 0)
}

export function chapterQuest(chapter: Chapter, book: CalcBook | null, data: AppData): ChapterQuest {
  const points = chapter.sections.flatMap((s) => s.points)
  const questPoints: QuestPoint[] = points.map((p) => ({
    point: p,
    done: !!data.studied[p.id],
    shining: !!data.perfected?.[p.id],
  }))
  const studiedCount = questPoints.filter((q) => q.done).length
  const mainPct = points.length ? Math.round((studiedCount / points.length) * 100) : 0
  const needPoints = Math.max(0, Math.ceil(points.length * WAKE_RATIO) - studiedCount)

  const trainings = book?.trainings.filter((t) => t.chapterId === chapter.id) ?? []
  const calcGroups: CalcQuestGroup[] = [...new Set(trainings.map((t) => t.moduleId))].map((mid) => {
    const ts = trainings.filter((t) => t.moduleId === mid)
    return {
      moduleId: mid,
      name: book?.modules.find((m) => m.id === mid)?.name ?? mid,
      total: ts.length,
      done: ts.filter((t) => data.calcDone?.[t.id]).length,
      passed: ts.filter((t) => data.calcDone?.[t.id]?.passed).length,
    }
  })

  const rounds = Object.values(data.rounds).filter((r) => r.chapterId === chapter.id && r.finishedAt)
  const examRounds = rounds.filter((r) => r.kind === 'exam')
  const bestRound = rounds.reduce<Round | null>(
    (best, r) => (!best || xpOfRound(r) > xpOfRound(best) ? r : best),
    null,
  )
  const bestCorrect = bestRound ? bestRound.answers.filter((a) => a.correct).length : 0
  const bestTotal = bestRound ? bestRound.exam.questions.length : 0
  const perfect = rounds.some(
    (r) =>
      r.answers.length >= 8 &&
      r.wrongQuestionIds.length === 0 &&
      r.slowQuestionIds.length === 0 &&
      r.answers.every((a) => !a.hintUsed && !a.retried),
  )

  const loop = data.loops[chapter.id]
  const state: BossState =
    loop?.status === 'mastered'
      ? 'defeated'
      : examRounds.length > 0
        ? 'fighting'
        : mainPct >= WAKE_RATIO * 100
          ? 'ready'
          : 'sleeping'

  const practiceBonus = Math.min(2, rounds.filter((r) => r.kind === 'practice').length) * 10
  const chapterCombo = comboBonusOf(points.map((p) => data.studied[p.id]).filter((ts): ts is number => !!ts))
  const shiningCount = points.filter((p) => data.perfected?.[p.id]).length
  const xp =
    studiedCount * 10 +
    shiningCount * 5 +
    chapterCombo +
    (bestRound ? xpOfRound(bestRound) : 0) +
    practiceBonus +
    trainings.filter((t) => data.calcDone?.[t.id]).length * 10 +
    trainings.reduce((s, t) => s + (data.calcDone?.[t.id]?.best ?? 0), 0) +
    (state === 'defeated' ? 50 : 0)

  return {
    state,
    mainPct,
    needPoints,
    points: questPoints,
    studiedCount,
    calcGroups,
    attempts: examRounds.length,
    bestCorrect,
    bestTotal,
    perfect,
    weakPoints: state === 'defeated' ? 0 : (loop?.weakPointIds?.length ?? 0),
    round: loop?.round ?? 0,
    xp,
  }
}
