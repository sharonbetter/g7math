import type {
  AnswerRecord,
  Exam,
  
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
    guidance: v.guidance,
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
 * 依据一轮的错题与超时题生成专项练习卷（异步：可能现场调模型出题）。
 *
 * 口径（2026-10 与用户确认）：
 *  - 每道错题/超时题 → 卷中对应 1 道题
 *  - 静态优先：先取该题（的母题）尚未练过的静态变式
 *  - 题库枯竭（静态变式全用过/没有）→ 调模型现场生成同构变式（含思路引导，双模型审查）
 *  - 生成失败兜底：任一静态变式（已练过再巩固）→ 原题重做
 */
export async function buildPracticeRound(
  round: Round,
  allExams: Map<string, Exam>,
  historyRounds: Round[],
  onProgress?: (done: number, total: number) => void,
): Promise<PracticePlan> {
  const target = [...new Set([...round.wrongQuestionIds, ...round.slowQuestionIds])]
  const byId = new Map(round.exam.questions.map((q) => [q.id, q]))
  const origin: Record<string, string> = {}
  const picked: Question[] = []

  // 已练过的题干（历史所有专项轮 + 本轮刚做过的）——静态变式消耗记录
  const usedStems = new Set<string>()
  for (const r of historyRounds) {
    if (r.kind !== 'practice') continue
    for (const q of r.exam.questions) usedStems.add(q.stem)
  }
  for (const q of round.exam.questions) usedStems.add(q.stem)

  interface Slot {
    q?: Question
    label: string
    parent?: Question
  }
  const slots: Slot[] = []
  const needGen: { parent: Question; slot: Slot }[] = []

  for (const qid of target) {
    const t = byId.get(qid)
    if (!t) continue
    const slot: Slot = { label: '' }
    slots.push(slot)
    const parent = resolveParent(t, allExams)
    slot.parent = parent
    // 静态优先：母题未练过的变式取 1 条
    const avail = (parent.variants ?? []).filter((v) => !usedStems.has(v.stem))
    if (avail.length > 0) {
      const v = avail[0]
      const q = variantToQuestion(parent, v, 'variant', 1)
      slot.q = q
      slot.label = `全新变式（原题 ${parent.id}）`
    } else {
      needGen.push({ parent, slot })
    }
  }

  // 题库枯竭 → 现场生成（并发 2，进度回调）
  let genDone = 0
  onProgress?.(0, needGen.length)
  const queue = [...needGen]
  const workers = Array.from({ length: Math.min(2, queue.length) }, async () => {
    for (;;) {
      const item = queue.shift()
      if (!item) return
      try {
        const r = await fetch('/api/gen-variant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stem: item.parent.stem,
            options: item.parent.options,
            standardAnswer: item.parent.answer,
            standardSolution: item.parent.solution,
            type: item.parent.type,
          }),
        })
        if (!r.ok) throw new Error(String(r.status))
        const data = (await r.json()) as {
          variant: { stem: string; options?: string[]; answer: string; solution: string; guidance?: string }
        }
        const q = variantToQuestion(
          item.parent,
          { ...data.variant, estimatedSeconds: item.parent.estimatedSeconds },
          'variant',
          1,
        )
        item.slot.q = q
        item.slot.label = `现场生成变式（原题 ${item.parent.id}）`
      } catch {
        /* 生成失败 → 走兜底 */
      }
      genDone += 1
      onProgress?.(genDone, needGen.length)
    }
  })
  await Promise.all(workers)

  // 兜底：生成失败的 → 已练过的静态变式 → 原题重做
  let repSeq = 0
  for (const slot of slots) {
    if (slot.q || !slot.parent) continue
    const parent = slot.parent
    const any = (parent.variants ?? [])[0]
    if (any) {
      slot.q = variantToQuestion(parent, any, 'variant', 1)
      slot.label = `变式再巩固（原题 ${parent.id}）`
    } else {
      slot.q = { ...parent, id: `${parent.id}-repeat-${++repSeq}`, commonWrong: [] }
      slot.label = `原题重做（${parent.id}）`
    }
  }

  for (const slot of slots) {
    if (!slot.q) continue
    picked.push(slot.q)
    origin[slot.q.id] = slot.label
  }

  const labels: Record<string, string> = { choice: '选择题', fill: '填空题', calc: '计算题', applied: '应用题' }
  const sections = (['choice', 'fill', 'calc', 'applied'] as const)
    .map((t) => ({
      id: `sec-${t}`,
      title: labels[t],
      type: t,
      questionIds: picked.filter((q) => q.type === t).map((q) => q.id),
    }))
    .filter((sec) => sec.questionIds.length > 0)

  const exam: Exam = {
    id: `${round.exam.id}-practice-r${round.round + 1}`,
    chapterId: round.chapterId,
    chapterTitle: round.chapterTitle,
    title: `${round.chapterTitle} · 第 ${round.round + 1} 轮专项练习`,
    totalEstimatedSeconds: picked.reduce((sum, q) => sum + q.estimatedSeconds, 0),
    sections,
    questions: picked,
  }

  return { exam, origin }
}

/** 从（可能是变式/重做题的）题目解析出静态题库里的母题 */
function resolveParent(q: Question, allExams: Map<string, Exam>): Question {
  const m = q.id.match(/^(.+)-p[r v]\d+-\d+$/)
  if (!m) return q
  for (const ex of allExams.values()) {
    const p = ex.questions.find((x) => x.id === m[1])
    if (p) return p
  }
  return q
}

/** 循环状态推进：专项练习全对且无超时 → 掌握 */
export function isMastered(round: Round): boolean {
  return round.wrongQuestionIds.length === 0 && round.slowQuestionIds.length === 0
}
