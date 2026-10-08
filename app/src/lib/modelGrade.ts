import type { GradeResult, Question } from '../types'

/** 计算题、应用题交给模型。有手写照片时以照片为准。 */
export async function gradeOpenQuestion(
  q: Question,
  studentAnswer: string,
  studentWork: string,
  images: string[] = [],
): Promise<GradeResult> {
  const res = await fetch('/api/grade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      stem: q.stem,
      standardAnswer: q.answer,
      standardSolution: q.solution,
      rubric: q.rubric ?? [],
      studentAnswer,
      studentWork,
      images: images.slice(0, 4),
    }),
  })
  const data = (await res.json()) as { correct?: boolean; unreadable?: boolean; reason?: string; error?: string }
  if (!res.ok) throw new Error(data.error || `批改失败（${res.status}）`)
  if (data.unreadable) {
    return {
      correct: false,
      score: 0,
      photoPending: true,
      errorTags: ['手写待确认'],
      errorReason: data.reason || '照片无法辨认，请对照解析确认，确认前不记入错题。',
    }
  }
  if (data.correct) return { correct: true, score: 1, errorTags: [], errorReason: data.reason || '' }
  return {
    correct: false,
    score: 0,
    errorTags: ['模型批改'],
    errorReason: data.reason || '模型判定与标准答案不一致。',
  }
}
