import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MathText } from '../components/MathText'
import { Badge, Card, Empty } from '../components/ui'
import { DIFFICULTY_LABEL, TYPE_LABEL, formatDuration, gradeQuestion, summarizeRecords } from '../lib/grading'
import { gradeOpenQuestion } from '../lib/modelGrade'
import { saveRound, updateLoop, useAppData } from '../lib/store'
import { splitNumberedParts } from '../lib/answers'
import type { AnswerRecord, Question, QType, Round } from '../types'

/** 把上传的图片压缩成较小尺寸的 dataURL，避免浏览器存储溢出 */
async function fileToDataUrl(file: File, maxWidth = 900): Promise<string> {
  const raw = await new Promise<string>((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(String(fr.result))
    fr.onerror = reject
    fr.readAsDataURL(file)
  })
  return new Promise<string>((resolve) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) return resolve(raw)
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.62))
    }
    img.onerror = () => resolve(raw)
    img.src = raw
  })
}

function blankCount(stem: string): number {
  const matches = stem.match(/_{3,}/g)
  return matches ? matches.length : 0
}

export default function RunPage() {
  const { roundId } = useParams()
  const navigate = useNavigate()
  const data = useAppData()
  const round = roundId ? data.rounds[roundId] : undefined

  const [answers, setAnswers] = useState<AnswerRecord[]>([])
  const [initialized, setInitialized] = useState(false)
  const [cursor, setCursor] = useState(0)
  const [draft, setDraft] = useState('')
  const [partDrafts, setPartDrafts] = useState<string[]>([])
  const [blanks, setBlanks] = useState<string[]>([''])
  const [work, setWork] = useState('')
  const [images, setImages] = useState<string[]>([])
  const albumInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [firstPickAt, setFirstPickAt] = useState<number | null>(null)
  const [flash, setFlash] = useState(false)
  const [grading, setGrading] = useState(false)
  const [gradeError, setGradeError] = useState('')
  const [, setTick] = useState(0)
  const topRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef(0)
  const spentRef = useRef<Record<string, number>>({})
  const openedAtRef = useRef<Record<string, number>>({})
  const activeSinceRef = useRef(Date.now())

  useEffect(() => {
    if (!round || initialized) return
    const saved = round.answers ?? []
    setAnswers(saved)
    for (const rec of saved) {
      spentRef.current[rec.questionId] = rec.durationMs
      openedAtRef.current[rec.questionId] = rec.startedAt
    }
    const firstOpen = (round.exam.questions ?? []).findIndex((q) => !saved.some((a) => a.questionId === q.id))
    const startAt = firstOpen >= 0 ? firstOpen : 0
    cursorRef.current = startAt
    setCursor(startAt)
    activeSinceRef.current = Date.now()
    setInitialized(true)
  }, [round, initialized])

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  const questions = round?.exam.questions ?? []
  const idx = Math.min(cursor, Math.max(0, questions.length - 1))
  const current: Question | undefined = questions[idx]
  const answerById = useMemo(() => new Map(answers.map((a) => [a.questionId, a])), [answers])

  const blanksNeeded = useMemo(() => (current ? blankCount(current.stem) : 0), [current])
  const partCount = useMemo(() => {
    if (!current || (current.type !== 'applied' && current.type !== 'calc')) return 0
    return splitNumberedParts(current.stem).length
  }, [current])

  useEffect(() => {
    if (!current) return
    const saved = answerById.get(current.id)
    const parts = splitNumberedParts(current.stem)
    if (!saved) {
      setDraft('')
      setWork('')
      setImages([])
      setFirstPickAt(null)
      setBlanks(Array.from({ length: Math.max(1, blanksNeeded) }, () => ''))
      setPartDrafts(Array.from({ length: Math.max(partCount, 0) }, () => ''))
      return
    }
    setWork(saved.work ?? '')
    setImages(saved.images ?? [])
    setFirstPickAt(saved.firstPickAt ?? null)
    if (current.type === 'fill') {
      const bits = saved.value ? saved.value.split('；') : []
      setBlanks(Array.from({ length: Math.max(1, blanksNeeded, bits.length) }, (_, i) => bits[i] ?? ''))
      setDraft('')
      setPartDrafts([])
    } else if (partCount >= 2) {
      const savedParts = splitNumberedParts(saved.value)
      setPartDrafts(Array.from({ length: parts.length }, (_, i) => savedParts[i] ?? ''))
      setDraft('')
      setBlanks([''])
    } else {
      setDraft(saved.value)
      setBlanks([''])
      setPartDrafts([])
    }
  }, [current, blanksNeeded, partCount, answerById])

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [idx])

  const elapsed = round ? Date.now() - round.startedAt : 0
  const currentElapsed = current
    ? (spentRef.current[current.id] ?? 0) + Math.max(0, Date.now() - activeSinceRef.current)
    : 0

  const flushTiming = useCallback((questionId: string | undefined) => {
    if (!questionId) return
    const now = Date.now()
    spentRef.current[questionId] = (spentRef.current[questionId] ?? 0) + Math.max(0, now - activeSinceRef.current)
    if (openedAtRef.current[questionId] == null) openedAtRef.current[questionId] = activeSinceRef.current
    activeSinceRef.current = now
  }, [])

  const goTo = useCallback((next: number) => {
    if (!questions.length) return
    const bounded = Math.max(0, Math.min(questions.length - 1, next))
    flushTiming(questions[cursorRef.current]?.id)
    cursorRef.current = bounded
    setCursor(bounded)
  }, [flushTiming, questions])

  const answerValue = useCallback((): string => {
    if (!current) return ''
    if (current.type === 'choice') return draft
    if (current.type === 'fill') return blanks.filter((b) => b.trim() !== '').length ? blanks.join('；') : ''
    if (partCount >= 2) {
      return partDrafts.map((p, i) => `(${i + 1}) ${p.trim()}`).filter((p) => !/^\(\d+\)\s*$/.test(p)).join('\n')
    }
    return draft
  }, [current, draft, blanks, partCount, partDrafts])

  const canSubmit = useMemo(() => {
    if (!current) return false
    if (images.length > 0) return true
    if (current.type === 'fill') return blanks.some((b) => b.trim() !== '')
    if (partCount >= 2) return partDrafts.some((p) => p.trim() !== '')
    return draft.trim() !== ''
  }, [current, draft, blanks, images.length, partCount, partDrafts])

  const addImageFiles = useCallback(async (list: FileList | null) => {
    const files = Array.from(list ?? [])
    if (!files.length) return
    const urls: string[] = []
    for (const f of files) urls.push(await fileToDataUrl(f))
    setImages((prev) => [...prev, ...urls])
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!round || !current || !canSubmit || grading) return
    flushTiming(current.id)
    const submittedAt = Date.now()
    const value = answerValue()
    const openEnded = current.type === 'calc' || current.type === 'applied'
    let grade
    if (openEnded && (value.trim() || work.trim() || images.length > 0)) {
      setGrading(true)
      setGradeError('')
      try {
        grade = await gradeOpenQuestion(current, value, work, images)
      } catch (e) {
        setGradeError(e instanceof Error ? e.message : '批改失败')
        setGrading(false)
        return
      }
      setGrading(false)
    } else {
      grade = gradeQuestion(current, value, images.length > 0)
    }
    const record: AnswerRecord = {
      questionId: current.id,
      type: current.type,
      startedAt: openedAtRef.current[current.id] ?? submittedAt,
      submittedAt,
      durationMs: spentRef.current[current.id] ?? 0,
      firstPickAt: firstPickAt ?? undefined,
      firstPickMs: firstPickAt != null ? firstPickAt - (openedAtRef.current[current.id] ?? submittedAt) : undefined,
      value,
      work: work || undefined,
      images: images.length ? images : undefined,
      revisitMs: 0,
      revisitCount: 0,
      correct: grade.photoPending ? false : grade.correct,
      score: grade.score,
      errorTags: grade.errorTags,
      errorReason: grade.errorReason,
      photoReview: grade.photoPending ? 'pending' : undefined,
      index: idx + 1,
    }
    const next = questions.map((q) => (q.id === current.id ? record : answerById.get(q.id))).filter((x): x is AnswerRecord => !!x)
    setAnswers(next)
    saveRound({ ...round, answers: next })
    setFlash(true)
    setTimeout(() => setFlash(false), 1200)
    const nextOpen = questions.findIndex((q, i) => i !== idx && !next.some((a) => a.questionId === q.id))
    if (nextOpen >= 0) goTo(nextOpen)
  }, [round, current, canSubmit, grading, answerValue, firstPickAt, work, images, questions, answerById, idx, flushTiming, goTo])

  const handleFinish = useCallback(() => {
    if (!round) return
    const qMap = new Map(round.exam.questions.map((q) => [q.id, q]))
    const summary = summarizeRecords(answers, qMap)
    const finishedRound: Round = {
      ...round,
      answers,
      finishedAt: Date.now(),
      totalMs: Date.now() - round.startedAt,
      ...summary,
    }
    saveRound(finishedRound)
    const cleared = summary.wrongQuestionIds.length === 0 && summary.slowQuestionIds.length === 0
      && answers.every((a) => a.photoReview !== 'pending')
    updateLoop({
      chapterId: round.chapterId,
      chapterTitle: round.chapterTitle,
      round: round.round,
      status: cleared ? 'mastered' : 'remedial',
      roundIds: Array.from(new Set([...(data.loops[round.chapterId]?.roundIds ?? []), round.id])),
      weakPointIds: summary.weakPointIds,
      updatedAt: Date.now(),
    })
    navigate(`/report/${round.id}`)
  }, [round, answers, navigate, data.loops])

  if (!round) return <Empty title="未找到该考评记录" hint="请从「章节考评」重新开始。" />
  if (!initialized) return <Card className="m-6 p-6 text-sm text-gray-500">正在恢复答题进度…</Card>
  if (!current) return null

  const totalEstimated = round.exam.totalEstimatedSeconds
  const unanswered = questions.filter((q) => !answerById.has(q.id)).length
  const isChoice = current.type === 'choice'
  const isFill = current.type === 'fill'
  const isLong = current.type === 'calc' || current.type === 'applied'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-20 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-5 gap-y-2 px-5 py-3">
          <div className="text-sm font-medium text-gray-800">{round.title}</div>
          <div className="text-xs text-gray-500">
            第 <b className="text-gray-800">{idx + 1}</b> / {questions.length} 题
          </div>
          <div className="text-xs text-gray-500">
            本卷已用 <b className="tabular-nums text-gray-800">{formatDuration(elapsed)}</b>
            <span className="text-gray-400"> / 预计 {formatDuration(totalEstimated * 1000)}</span>
          </div>
          <div className="text-xs text-gray-500">
            本题已用 <b className="tabular-nums text-blue-600">{formatDuration(currentElapsed)}</b>
            <span className="text-gray-400"> / 预计 {formatDuration(current.estimatedSeconds * 1000)}</span>
          </div>
          {flash && <Badge tone="green">已提交并上传成功 ✓</Badge>}
          <div className="ml-auto flex items-center gap-2">
            <button className="btn !py-1.5 !text-xs" onClick={handleFinish}>
              {unanswered > 0 ? `交卷（还有 ${unanswered} 题未答）` : '交卷并查看报告'}
            </button>
          </div>
        </div>
        <div className="h-1 w-full bg-gray-100">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${((idx + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div ref={topRef} className="mx-auto max-w-4xl px-5 py-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge tone="blue">{TYPE_LABEL[current.type as QType]}</Badge>
          <Badge>难度 {DIFFICULTY_LABEL[current.difficulty] ?? current.difficulty}</Badge>
          <Badge>预计 {formatDuration(current.estimatedSeconds * 1000)}</Badge>
          {current.source?.kind === 'book' && (
            <Badge tone="violet">
              选自《探究应用新思维》{current.source.ref ? ` · ${current.source.ref}` : ''}
            </Badge>
          )}
          <span className="ml-auto text-xs text-gray-400">{current.id}</span>
        </div>

        <Card className="p-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
              {idx + 1}
            </span>
            <MathText className="flex-1 text-[16px] leading-8 text-gray-900" text={current.stem} />
          </div>

          {isChoice && (
            <div className="mt-4 space-y-2 pl-10">
              {(current.options ?? []).map((opt, i) => {
                const letter = String.fromCharCode(65 + i)
                const active = draft === letter
                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (firstPickAt == null) setFirstPickAt(Date.now())
                      setDraft(letter)
                    }}
                    className={`block w-full rounded-xl border px-4 py-3 text-left transition ${
                      active
                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/40'
                    }`}
                  >
                    <MathText className="text-[15px] text-gray-800" text={opt} />
                  </button>
                )
              })}
            </div>
          )}

          {isFill && (
            <div className="mt-4 space-y-2 pl-10">
              {blanks.map((b, i) => (
                <div key={i} className="flex items-center gap-3">
                  {blanks.length > 1 && (
                    <span className="w-12 shrink-0 text-sm text-gray-500">({i + 1})</span>
                  )}
                  <input
                    type="text"
                    value={b}
                    autoComplete="off"
                    placeholder="在此填写答案"
                    onChange={(e) => {
                      const next = [...blanks]
                      next[i] = e.target.value
                      setBlanks(next)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && canSubmit) handleSubmit()
                    }}
                  />
                </div>
              ))}
              <p className="text-xs text-gray-400">
                多个空按顺序填写；分数可直接写 1/2，也可写 0.5。
              </p>
            </div>
          )}

          {isLong && (
            <div className="mt-4 space-y-3 pl-10">
              <div>
                <div className="mb-1.5 text-xs font-medium text-gray-600">
                  {partCount >= 2 ? '各小问的最终答案（分开填写，用于文字核对）' : '最终答案（用于自动判分，例如 x = 3 或 原式 = -7）'}
                </div>
                {partCount >= 2 ? (
                  <div className="space-y-2">
                    {partDrafts.map((p, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="mt-2 w-10 shrink-0 text-sm text-gray-500">({i + 1})</span>
                        <textarea
                          rows={2}
                          value={p}
                          placeholder={`第 ${i + 1} 问的答案`}
                          onChange={(e) => {
                            const next = [...partDrafts]
                            next[i] = e.target.value
                            setPartDrafts(next)
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={draft}
                    autoComplete="off"
                    placeholder="填写最终答案"
                    onChange={(e) => setDraft(e.target.value)}
                  />
                )}
              </div>
              <div>
                <div className="mb-1.5 text-xs font-medium text-gray-600">
                  解答过程（{current.type === 'calc' ? '写出计算步骤' : '写出设元、列式、求解与作答'}）
                </div>
                <textarea
                  rows={5}
                  value={work}
                  placeholder="在此写出完整过程…"
                  onChange={(e) => setWork(e.target.value)}
                />
              </div>
              <div>
                <div className="mb-1.5 text-xs font-medium text-gray-600">
                  手写过程拍照上传（可选，可多张）
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="btn btn-primary" onClick={() => cameraInputRef.current?.click()}>
                    拍照上传
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => albumInputRef.current?.click()}>
                    从相册选择
                  </button>
                </div>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={async (e) => {
                    await addImageFiles(e.target.files)
                    e.target.value = ''
                  }}
                />
                <input
                  ref={albumInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={async (e) => {
                    await addImageFiles(e.target.files)
                    e.target.value = ''
                  }}
                />
                {images.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {images.map((src, i) => (
                      <div key={i} className="relative">
                        <img src={src} alt="上传的过程" className="h-20 rounded-lg border border-gray-200" />
                        <button
                          className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-700 text-xs text-white"
                          onClick={() => setImages(images.filter((_, k) => k !== i))}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
            <div className="text-xs text-gray-400">
              {gradeError
                ? gradeError
                : isLong
                  ? images.length
                    ? '已上传手写照片。批改以照片为准，文字框只作参考。'
                    : '计算题和应用题提交后，由模型对照标准答案和解析批改。'
                  : '点击题号可查看、修改任意一题。离开题目时本题计时暂停。'}
            </div>
            <button className="btn btn-primary" disabled={!canSubmit || grading} onClick={handleSubmit}>
              {grading ? '模型批改中…' : answerById.has(current.id) ? '保存修改' : isChoice ? '提交本题' : isFill ? '提交答案并上传' : '提交并批改'}
            </button>
          </div>
        </Card>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {questions.map((q, i) => {
            const saved = answerById.get(q.id)
            return (
              <button
                key={q.id}
                type="button"
                title={`第 ${i + 1} 题 · ${TYPE_LABEL[q.type]}`}
                onClick={() => goTo(i)}
                className={`flex h-7 w-7 items-center justify-center rounded-md border text-xs ${
                  i === idx
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : saved
                      ? saved.correct
                        ? 'border-green-200 bg-green-50 text-green-700'
                        : 'border-red-200 bg-red-50 text-red-600'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-blue-300'
                }`}
              >
                {i + 1}
              </button>
            )
          })}
        </div>
        <div className="mt-2 text-xs text-gray-400">
          点击题号可跳到任意一题查看或修改。交卷后可在报告页逐题回看解析。
        </div>
      </div>
    </div>
  )
}
