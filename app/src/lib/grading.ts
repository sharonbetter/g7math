import type { AnswerRecord, GradeResult, Question, QType } from '../types'
import { answersMatch, normalizeChoice, toHalfWidth } from './answers'

/** 单题批改。hasPhoto 为真时，文字框为空或不匹配都不单独判错，改由手写照片核对。 */
export function gradeQuestion(q: Question, rawAnswer: string, hasPhoto = false): GradeResult {
  const user = rawAnswer ?? ''
  if (!user.trim() && !hasPhoto) {
    return {
      correct: false,
      score: 0,
      errorTags: ['未作答'],
      errorReason: '本题未作答，未能得分。请对照解析补做一遍，再进入专项练习。',
    }
  }

  let correct = false
  if (user.trim()) {
    correct = q.type === 'choice'
      ? normalizeChoice(user) === normalizeChoice(q.answer)
      : answersMatch(user, q.answer, q.acceptedAnswers)
  }

  if (correct) {
    return { correct: true, score: 1, errorTags: [], errorReason: '' }
  }

  if (hasPhoto) {
    return {
      correct: false,
      score: 0,
      photoPending: true,
      errorTags: ['手写待确认'],
      errorReason: '已上传手写照片，批改以照片为准，不单独采用文字框。请在报告页对照解析确认手写答案。确认前不记入错题。',
    }
  }

  // 命中已知典型错答 → 使用具体错因
  const wrong = (q.commonWrong ?? []).find((cw) => {
    if (q.type === 'choice') return normalizeChoice(cw.answer) === normalizeChoice(user)
    return answersMatch(user, cw.answer)
  })
  const errorTags = wrong ? mergeTags(q.errorTags ?? [], ['典型错误']) : (q.errorTags ?? ['计算失误'])
  const errorReason = wrong
    ? wrong.reason
    : buildGenericReason(q, user)

  return { correct: false, score: 0, errorTags, errorReason }
}

function mergeTags(a: string[], b: string[]): string[] {
  return Array.from(new Set([...a, ...b]))
}

function buildGenericReason(q: Question, user: string): string {
  const tags = q.errorTags ?? []
  const head = tags.length ? `可能的错因：${tags.join('、')}。` : ''
  const kind = q.type === 'choice' ? '选项' : '答案'
  return `${head}你的${kind}是「${toHalfWidth(user).trim()}」，与标准答案不一致。请对照解析逐步检查：先看题意理解是否正确，再看关键步骤的符号、运算与条件是否遗漏。`
}

/** 步骤分：按 rubric 自评结果折算（用于计算题/应用题） */
export function scoreWithRubric(base: GradeResult, selfRubric: boolean[] | undefined): GradeResult {
  if (base.correct) return base
  if (!selfRubric || selfRubric.length === 0) return base
  const hit = selfRubric.filter(Boolean).length
  const ratio = hit / selfRubric.length
  return {
    ...base,
    score: Math.round(ratio * 0.8 * 100) / 100,
    errorReason:
      ratio > 0
        ? `${base.errorReason} 步骤要点自查命中 ${hit}/${selfRubric.length}，给予部分分。`
        : base.errorReason,
  }
}

/** 是否标记为“耗时异常”：实际耗时 − 预计耗时 > 1 分钟 */
export const SLOW_THRESHOLD_MS = 60_000

export function isSlow(actualMs: number, estimatedSeconds: number): boolean {
  return actualMs - estimatedSeconds * 1000 > SLOW_THRESHOLD_MS
}

export function durationGapMs(actualMs: number, estimatedSeconds: number): number {
  return actualMs - estimatedSeconds * 1000
}

export function formatDuration(ms: number | undefined | null): string {
  if (ms == null) return '—'
  const total = Math.max(0, Math.round(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  if (m === 0) return `${s} 秒`
  return `${m} 分 ${String(s).padStart(2, '0')} 秒`
}

export function formatGap(ms: number): string {
  const sign = ms > 0 ? '+' : ms < 0 ? '−' : '±'
  return `${sign}${formatDuration(Math.abs(ms))}`
}

export function summarizeRecords(records: AnswerRecord[], questions: Map<string, Question>) {
  const wrong: string[] = []
  const slow: string[] = []
  const weak = new Set<string>()
  for (const r of records) {
    const q = questions.get(r.questionId)
    if (r.photoReview === 'pending') continue
    if (!r.correct) {
      wrong.push(r.questionId)
      for (const p of q?.pointIds ?? []) weak.add(p)
    }
    if (q && isSlow(r.durationMs, q.estimatedSeconds)) {
      slow.push(r.questionId)
      for (const p of q?.pointIds ?? []) weak.add(p)
    }
  }
  return { wrongQuestionIds: wrong, slowQuestionIds: slow, weakPointIds: Array.from(weak) }
}

export const TYPE_LABEL: Record<QType, string> = {
  choice: '选择题',
  fill: '填空题',
  calc: '计算题',
  applied: '应用题',
}

export const DIFFICULTY_LABEL: Record<number, string> = {
  1: '基础',
  2: '较易',
  3: '中等',
  4: '较难',
  5: '探究',
}
