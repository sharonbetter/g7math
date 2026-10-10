/**
 * 游戏式激励：经验、等级、连续学习、今日目标、徽章。
 * 全部由已有的课件进度、考评轮次和章节掌握状态推算，不另存一份进度。
 */
import type { AppData, Round } from '../types'

/** 徽章对应的下一步动作，由各端映射成自己的路由 */
export type BadgeAction = 'curriculum' | 'exams' | 'remedial'

export interface Badge {
  id: string
  name: string
  desc: string
  icon: string
  earned: boolean
  /** 当前进度与目标，用于画进度条和「还差多少」 */
  current: number
  target: number
  pct: number
  /** 还差多少才拿到 */
  remaining: number
  action: BadgeAction
  actionLabel: string
}

export interface LevelStep {
  level: number
  name: string
  desc: string
  startXp: number
  current: boolean
  reached: boolean
}

export interface IncentiveSnapshot {
  xp: number
  level: number
  levelName: string
  levelMax: number
  xpIntoLevel: number
  xpForNext: number
  xpToNext: number
  nextLevelName: string
  streak: number
  studiedToday: boolean
  todayXp: number
  dailyGoal: number
  levels: LevelStep[]
  badges: Badge[]
  earnedCount: number
  /** 引导用：还没拿到、且最接近达成的徽章 */
  nextBadges: Badge[]
}

const DAILY_GOAL = 40

const LEVELS: { name: string; desc: string }[] = [
  { name: '初识数海', desc: '刚开始。看完前几课就能升上来。' },
  { name: '数轴行者', desc: '约学完 5～6 个知识点。' },
  { name: '运算学徒', desc: '约学完一整章并交过一次考评。' },
  { name: '方程猎人', desc: '约两章过关，会和未知数打交道。' },
  { name: '几何探路', desc: '约三到四章，图形题开始上手。' },
  { name: '应用闯关', desc: '约五到六章，应用题能独立列式。' },
  { name: '思维先锋', desc: '约七章，错题回炉成了习惯。' },
  { name: '新思维达人', desc: '约八到九章，多数考评卷能一次过。' },
  { name: '章节征服者', desc: '约十章，掌握章节过半。' },
  { name: '数学探险家', desc: '十二章基本推完，图鉴接近收齐。' },
]

/**
 * 升到下一级所需经验。逐级递增：50、110、180、250……
 * 十二章全推完、成绩不错时累计约 2400 经验，正好走满 10 级。
 */
const NEEDS = [50, 110, 180, 250, 300, 330, 360, 400, 420]

function needFor(level: number): number {
  return NEEDS[level - 1] ?? NEEDS[NEEDS.length - 1]
}

function dayKey(ts: number): string {
  const d = new Date(ts)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

function todayKey(): string {
  return dayKey(Date.now())
}

function finishedRounds(data: AppData): Round[] {
  return Object.values(data.rounds).filter((r) => r.finishedAt)
}

/**
 * 一轮考评的经验值。
 * 章节考评 20 + 答对题数 × 2；专项练习另加 10。
 */
function xpOfRound(r: Round): number {
  const correct = r.answers.filter((a) => a.correct).length
  const base = 20 + correct * 2
  return r.kind === 'practice' ? base + 10 : base
}

/**
 * 考评经验按「每章取最好的一轮」累计，专项练习每章最多补两轮。
 * 这样反复重做同一章不会无限刷经验，经验只反映真实推进。
 */
function xpFromRounds(rounds: Round[]): number {
  const byChapter = new Map<string, Round[]>()
  for (const r of rounds) {
    const list = byChapter.get(r.chapterId) ?? []
    list.push(r)
    byChapter.set(r.chapterId, list)
  }
  let total = 0
  for (const list of byChapter.values()) {
    const best = Math.max(0, ...list.map(xpOfRound))
    const practiceCount = list.filter((r) => r.kind === 'practice').length
    total += best + Math.min(2, practiceCount) * 10
  }
  return total
}

function levelProgress(xp: number): { level: number; xpIntoLevel: number; xpForNext: number } {
  let level = 1
  let need = needFor(1)
  let remain = xp
  while (remain >= need && level < LEVELS.length) {
    remain -= need
    level += 1
    need = needFor(level)
  }
  return { level, xpIntoLevel: remain, xpForNext: need }
}

function levelTable(currentLevel: number): LevelStep[] {
  let start = 0
  return LEVELS.map((lv, i) => {
    const level = i + 1
    const step: LevelStep = {
      level,
      name: lv.name,
      desc: lv.desc,
      startXp: start,
      current: level === currentLevel,
      reached: level <= currentLevel,
    }
    start += needFor(level)
    return step
  })
}

function streakOf(days: Set<string>): number {
  const today = todayKey()
  const y = new Date()
  y.setDate(y.getDate() - 1)
  const yesterday = dayKey(y.getTime())
  let cursor = days.has(today) ? today : days.has(yesterday) ? yesterday : ''
  if (!cursor) return 0
  let n = 0
  const d = new Date(cursor + 'T12:00:00')
  while (days.has(dayKey(d.getTime()))) {
    n += 1
    d.setDate(d.getDate() - 1)
  }
  return n
}

/** 生成一枚徽章，并把进度换算成百分比与「还差多少」 */
function makeBadge(
  id: string,
  name: string,
  desc: string,
  icon: string,
  current: number,
  target: number,
  action: BadgeAction,
  actionLabel: string,
): Badge {
  const capped = Math.min(current, target)
  return {
    id,
    name,
    desc,
    icon,
    earned: current >= target,
    current: capped,
    target,
    pct: target > 0 ? Math.round((capped / target) * 100) : 0,
    remaining: Math.max(0, target - current),
    action,
    actionLabel,
  }
}

function badgesOf(input: {
  studied: number
  finished: Round[]
  mastered: number
  streak: number
  correct: number
  practice: number
}): Badge[] {
  const perfect = input.finished.some(
    (r) =>
      r.answers.length >= 8 &&
      r.wrongQuestionIds.length === 0 &&
      r.slowQuestionIds.length === 0,
  )
  const steady = input.finished.some(
    (r) => r.answers.length >= 8 && r.slowQuestionIds.length === 0,
  )
  const examCount = input.finished.filter((r) => r.kind === 'exam').length
  const practiceCount = input.practice
  return [
    makeBadge('first-lesson', '第一课', '学完 1 个知识点', '📘', input.studied, 1, 'curriculum', '去学课件'),
    makeBadge('ten-lessons', '十课连击', '学完 10 个知识点', '🔥', input.studied, 10, 'curriculum', '继续学课件'),
    makeBadge('half', '半程行者', '学完 57 个知识点', '🗺️', input.studied, 57, 'curriculum', '继续学课件'),
    makeBadge('all-lessons', '全图鉴', '114 个知识点都学过', '🏆', input.studied, 114, 'curriculum', '继续学课件'),
    makeBadge('first-exam', '首考', '完成 1 次章节考评', '✏️', examCount, 1, 'exams', '去做考评'),
    makeBadge('perfect', '满分卷', '一整轮全对且没有超时', '⭐', perfect ? 1 : 0, 1, 'exams', '去挑战'),
    makeBadge('steady', '稳准', '一整轮（至少 8 题）没有耗时标记', '⏱️', steady ? 1 : 0, 1, 'exams', '去挑战'),
    makeBadge('streak-3', '三日连学', '连续学习 3 天', '📅', input.streak, 3, 'curriculum', '今天学一课'),
    makeBadge('streak-7', '一周不断', '连续学习 7 天', '🗓️', input.streak, 7, 'curriculum', '今天学一课'),
    makeBadge('master-1', '攻下一章', '掌握 1 个章节', '🚩', input.mastered, 1, 'exams', '去拿掌握'),
    makeBadge('master-all', '十二章通关', '12 个章节全部掌握', '👑', input.mastered, 12, 'exams', '去拿掌握'),
    makeBadge('practice', '专项战士', '完成 1 次专项练习', '🎯', practiceCount, 1, 'remedial', '去专项提升'),
    makeBadge('hundred', '百分旅人', '累计答对 100 题', '💯', input.correct, 100, 'exams', '继续答题'),
  ]
}

export function computeIncentives(data: AppData): IncentiveSnapshot {
  const studiedEntries = Object.entries(data.studied)
  const rounds = finishedRounds(data)
  const mastered = Object.values(data.loops).filter((l) => l.status === 'mastered').length
  const correct = rounds.reduce((s, r) => s + r.answers.filter((a) => a.correct).length, 0)
  const practice = rounds.filter((r) => r.kind === 'practice').length

  const xp =
    studiedEntries.length * 10 +
    xpFromRounds(rounds) +
    mastered * 50

  const today = todayKey()
  const todayXp =
    studiedEntries.filter(([, ts]) => dayKey(ts) === today).length * 10 +
    xpFromRounds(rounds.filter((r) => r.finishedAt && dayKey(r.finishedAt) === today))

  const days = new Set<string>()
  for (const [, ts] of studiedEntries) days.add(dayKey(ts))
  for (const r of rounds) if (r.finishedAt) days.add(dayKey(r.finishedAt))
  const streak = streakOf(days)

  const progress = levelProgress(xp)
  const levels = levelTable(progress.level)
  const badges = badgesOf({
    studied: studiedEntries.length,
    finished: rounds,
    mastered,
    streak,
    correct,
    practice,
  })

  return {
    xp,
    level: progress.level,
    levelName: LEVELS[Math.min(progress.level, LEVELS.length) - 1]?.name ?? LEVELS[LEVELS.length - 1].name,
    levelMax: LEVELS.length,
    xpIntoLevel: progress.xpIntoLevel,
    xpForNext: progress.xpForNext,
    xpToNext: Math.max(0, progress.xpForNext - progress.xpIntoLevel),
    nextLevelName:
      progress.level < LEVELS.length ? LEVELS[progress.level].name : '已满级',
    levels,
    streak,
    studiedToday: days.has(today),
    todayXp,
    dailyGoal: DAILY_GOAL,
    badges,
    earnedCount: badges.filter((b) => b.earned).length,
    nextBadges: badges
      .filter((b) => !b.earned)
      .sort((a, b) => b.pct - a.pct || a.remaining - b.remaining)
      .slice(0, 3),
  }
}
