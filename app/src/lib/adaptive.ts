import type {
  AnswerRecord,
  Exam,
  ExamSection,
  Lesson,
  Point,
  Question,
  QType,
  Round,
  Variant,
} from '../types'
import { isSlow } from './grading'

export interface ErrorAnalysis {
  record: AnswerRecord
  question: Question
  /** 该题所属知识点 */
  points: Point[]
  /** 关联的课件（用于专项讲解） */
  lessons: Lesson[]
  reason: string
  tags: string[]
  slow: boolean
  gapMs: number
}

/** 汇总一轮考评中的问题题目（做错 或 耗时异常） */
export function analyzeRound(
  round: Round,
  points: Map<string, Point>,
  lessons: Map<string, Lesson>,
): ErrorAnalysis[] {
  const byId = new Map(round.exam.questions.map((q) => [q.id, q]))
  const out: ErrorAnalysis[] = []
  for (const r of round.answers) {
    const q = byId.get(r.questionId)
    if (!q) continue
    if (r.photoReview === 'pending') continue
    const slow = isSlow(r.durationMs, q.estimatedSeconds)
    const gapMs = r.durationMs - q.estimatedSeconds * 1000
    if (r.correct && !slow) continue
    const pts = q.pointIds.map((id) => points.get(id)).filter((x): x is Point => !!x)
    out.push({
      record: r,
      question: q,
      points: pts,
      lessons: q.pointIds.map((id) => lessons.get(id)).filter((x): x is Lesson => !!x),
      reason: r.errorReason || (slow ? '本题用时明显超出预计，说明相关方法还不够熟练。' : ''),
      tags: r.errorTags,
      slow,
      gapMs,
    })
  }
  // 先错题，再超时题；错题中按耗时超出程度排序
  return out.sort((a, b) => {
    if (a.record.correct !== b.record.correct) return a.record.correct ? 1 : -1
    return b.gapMs - a.gapMs
  })
}

/** 汇总本轮涉及的薄弱知识点 */
export function weakPointsOf(round: Round, points: Map<string, Point>): Point[] {
  const ids = new Set(round.weakPointIds)
  return Array.from(ids)
    .map((id) => points.get(id))
    .filter((x): x is Point => !!x)
}

let seq = 0

function variantToQuestion(
  parent: Question,
  v: Variant,
  sourceTag: 'variant' | 'repeat',
  index: number,
): Question {
  seq += 1
  const type: QType = parent.type
  return {
    id: `${parent.id}-p${sourceTag === 'repeat' ? 'r' : 'v'}${index}-${seq}`,
    type,
    difficulty: Math.min(5, parent.difficulty + (sourceTag === 'variant' ? 1 : 0)),
    estimatedSeconds: v.estimatedSeconds ?? parent.estimatedSeconds,
    pointIds: [...parent.pointIds],
    stem: v.stem,
    options: v.options,
    answer: v.answer,
    solution: v.solution,
    rubric: parent.rubric,
    errorTags: parent.errorTags,
    commonWrong: [],
    source: { kind: 'original' },
  }
}

export interface PracticePlan {
  exam: Exam
  /** 每道题对应的来源说明，用于报告 */
  origin: Record<string, string>
}

/**
 * 依据一轮考评的错题与超时题生成专项练习卷。
 *
 * 规则：
 *  1. 每道问题题目取其变式（variants）作为专项练习的第一批题目；
 *  2. 若题目数量不足，从同一知识点的其他题目中再取变式补充；
 *  3. 若仍不足，则重做原题（repeat）；
 *  4. 题量上限由总预计耗时控制（默认约 25 分钟）。
 */
export function buildPracticeExam(
  round: Round,
  allExams: Map<string, Exam>,
  opts: { maxSeconds?: number } = {},
): PracticePlan {
  const maxSeconds = opts.maxSeconds ?? 1500
  const target = new Set([...round.wrongQuestionIds, ...round.slowQuestionIds])
  const questions = round.exam.questions
  const byId = new Map(questions.map((q) => [q.id, q]))
  const origin: Record<string, string> = {}
  const picked: Question[] = []
  const usedStems = new Set<string>()

  const push = (q: Question, label: string) => {
    if (usedStems.has(q.stem)) return
    usedStems.add(q.stem)
    picked.push(q)
    origin[q.id] = label
  }

  // 1) 问题题目的变式
  for (const qid of target) {
    const q = byId.get(qid)
    if (!q) continue
    const vs = q.variants ?? []
    vs.forEach((v, i) => push(variantToQuestion(q, v, 'variant', i + 1), `错题/超时题变式（原题 ${q.id}）`))
  }

  // 2) 同知识点的其他题目的变式
  const weakPoints = new Set(round.weakPointIds)
  for (const q of questions) {
    if (target.has(q.id)) continue
    if (!q.pointIds.some((p) => weakPoints.has(p))) continue
    ;(q.variants ?? []).forEach((v, i) =>
      push(variantToQuestion(q, v, 'variant', i + 1), `同知识点强化（原题 ${q.id}）`),
    )
  }

  // 3) 其他章的同一知识点题目（跨章强化）
  const otherExams = Array.from(allExams.values()).filter((e) => e.id !== round.exam.id)
  for (const ex of otherExams) {
    for (const q of ex.questions) {
      if (!q.pointIds.some((p) => weakPoints.has(p))) continue
      ;(q.variants ?? []).forEach((v, i) =>
        push(variantToQuestion(q, v, 'variant', i + 1), `跨章强化：${ex.chapterTitle}（原题 ${q.id}）`),
      )
    }
  }

  // 4) 仍不足则重做原题
  if (picked.length < 6) {
    for (const qid of target) {
      const q = byId.get(qid)
      if (!q) continue
      push(
        {
          ...q,
          id: `${q.id}-repeat-${++seq}`,
          commonWrong: [],
        },
        `重做原题（${q.id}）`,
      )
    }
  }

  // 按难度排序（由易到难），再按总耗时截断
  picked.sort((a, b) => a.difficulty - b.difficulty || a.estimatedSeconds - b.estimatedSeconds)
  const limited: Question[] = []
  let total = 0
  for (const q of picked) {
    if (limited.length >= 4 && total + q.estimatedSeconds > maxSeconds) continue
    limited.push(q)
    total += q.estimatedSeconds
    if (total >= maxSeconds && limited.length >= 6) break
  }
  const finalQuestions = limited.length ? limited : picked.slice(0, 8)

  const order: QType[] = ['choice', 'fill', 'calc', 'applied']
  const labels: Record<QType, string> = {
    choice: '一、选择题（每题只有一个正确选项）',
    fill: '二、填空题',
    calc: '三、计算题（写出必要的计算过程）',
    applied: '四、应用题（写出必要的解答过程）',
  }
  const sections: ExamSection[] = order
    .map((t) => ({
      id: t,
      title: labels[t],
      type: t,
      questionIds: finalQuestions.filter((q) => q.type === t).map((q) => q.id),
    }))
    .filter((s) => s.questionIds.length > 0)

  const exam: Exam = {
    id: `${round.exam.id}-practice-r${round.round + 1}`,
    chapterId: round.chapterId,
    chapterTitle: round.chapterTitle,
    title: `${round.chapterTitle} · 第 ${round.round + 1} 轮专项练习`,
    totalEstimatedSeconds: finalQuestions.reduce((s, q) => s + q.estimatedSeconds, 0),
    sections,
    questions: finalQuestions,
  }

  return { exam, origin }
}

/** 循环状态推进：专项练习全对且无超时 → 掌握 */
export function isMastered(round: Round): boolean {
  return round.wrongQuestionIds.length === 0 && round.slowQuestionIds.length === 0
}
