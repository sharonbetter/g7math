/**
 * 计时引擎。
 *
 * 需求口径：
 *  - 选择题：开始时间 = 上一题结束时间（第一题 = 考评开始时间）；结束时间 = 学生选定并提交该题答案的时刻。
 *  - 填空题 / 计算题 / 应用题：开始时间 = 上一题结束时间；结束时间 = 学生提交且答案上传成功的时刻。
 *
 * 因此各题在时间轴上首尾相接，第 n 题的 durationMs = submit(n) − submit(n−1)（n=1 时减考评开始时间）。
 * 另外单独记录「首次作答用时」(firstPickMs) 与「回看额外用时」(revisitMs)，用于更细的耗时点观察。
 */

import type { AnswerRecord, Question, QType } from '../types'

export interface QuestionTiming {
  index: number
  questionId: string
  type: QType
  startedAt: number
  submittedAt: number
  durationMs: number
  firstPickMs?: number
  revisitMs: number
  estimatedSeconds: number
  gapMs: number
}

/** 计算某题的开始时间：第一题为会话开始时间，其余为上一题提交时间 */
export function nextStartedAt(records: AnswerRecord[], sessionStart: number): number {
  if (records.length === 0) return sessionStart
  return records[records.length - 1].submittedAt
}

/** 组装计时明细 */
export function buildTimings(
  records: AnswerRecord[],
  questions: Map<string, Question>,
): QuestionTiming[] {
  return records.map((r, idx) => {
    const q = questions.get(r.questionId)
    const est = q?.estimatedSeconds ?? 0
    return {
      index: idx + 1,
      questionId: r.questionId,
      type: r.type,
      startedAt: r.startedAt,
      submittedAt: r.submittedAt,
      durationMs: r.durationMs,
      firstPickMs: r.firstPickMs,
      revisitMs: r.revisitMs,
      estimatedSeconds: est,
      gapMs: r.durationMs - est * 1000,
    }
  })
}

export function nowMs(): number {
  return Date.now()
}

export function formatClock(ts: number): string {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(
    d.getSeconds(),
  ).padStart(2, '0')}`
}
