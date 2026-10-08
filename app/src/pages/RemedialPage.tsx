import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { MathText } from '../components/MathText'
import { BookSource } from '../components/BookSource'
import { Badge, Card, Empty } from '../components/ui'
import { analyzeRound } from '../lib/adaptive'
import { allPoints, loadAllExams, loadLessonFile, useCurriculum } from '../lib/data'
import { TYPE_LABEL, formatDuration, formatGap } from '../lib/grading'
import { makeId, saveRound, useAppData } from '../lib/store'
import type { Lesson, LessonFile, Point, Round } from '../types'
import { buildPracticeExam } from '../lib/adaptive'

const SLIDE_LABEL: Record<string, string> = {
  concept: '概念回顾',
  method: '方法提炼',
  pitfall: '易错提醒',
  book: '新思维拓展',
  example: '典型例题',
}

export default function RemedialPage() {
  const { roundId } = useParams()
  const navigate = useNavigate()
  const data = useAppData()
  const { curriculum } = useCurriculum()
  const round = roundId ? data.rounds[roundId] : undefined
  const [lessonFile, setLessonFile] = useState<LessonFile | null>(null)
  const [busy, setBusy] = useState(false)
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!round) return
    loadLessonFile(round.chapterId).then(setLessonFile)
  }, [round])

  const points = useMemo(() => allPoints(curriculum), [curriculum])
  const lessonMap = useMemo(() => {
    const m = new Map<string, Lesson>()
    lessonFile?.lessons.forEach((l) => m.set(l.pointId, l))
    return m
  }, [lessonFile])

  const analyses = useMemo(
    () => (round ? analyzeRound(round, points, lessonMap) : []),
    [round, points, lessonMap],
  )

  if (!round) return <Empty title="未找到考评记录" />

  const weak: Point[] = Array.from(new Set(round.weakPointIds))
    .map((id) => points.get(id))
    .filter((x): x is Point => !!x)

  const startPractice = async () => {
    setBusy(true)
    try {
      const all = await loadAllExams()
      all.set(round.exam.id, round.exam)
      const plan = buildPracticeExam(round, all)
      const practiceRound: Round = {
        id: makeId(`${plan.exam.id}-r`),
        kind: 'practice',
        round: round.round + 1,
        parentRoundId: round.id,
        chapterId: round.chapterId,
        chapterTitle: round.chapterTitle,
        title: plan.exam.title,
        examId: plan.exam.id,
        startedAt: Date.now(),
        totalMs: 0,
        answers: [],
        wrongQuestionIds: [],
        slowQuestionIds: [],
        weakPointIds: [],
        exam: plan.exam,
      }
      saveRound(practiceRound)
      navigate(`/run/${practiceRound.id}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-5 text-white">
          <div className="text-xs text-violet-100">
            <Link to={`/report/${round.id}`} className="hover:underline">
              考评报告
            </Link>{' '}
            / 专项讲解课件
          </div>
          <h1 className="mt-1 text-lg font-semibold">{round.chapterTitle} · 专项讲解课件</h1>
          <p className="mt-1.5 max-w-3xl text-sm text-violet-50">
            本课件根据你在「{round.title}」中的表现自动生成：针对 {analyses.length} 道问题题目
            （错题 {round.wrongQuestionIds.length} 道、耗时标记题 {round.slowQuestionIds.length} 道）
            与 {weak.length} 个薄弱知识点，逐一剖析错因、重建思路，并给出变式跟进。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 px-6 py-4">
          <button className="btn btn-primary" disabled={busy} onClick={startPractice}>
            {busy ? '正在生成…' : '学完课件，进入专项练习'}
          </button>
          <Link to={`/report/${round.id}`} className="btn">
            返回报告
          </Link>
          <span className="text-xs text-gray-500">
            专项练习将针对上述问题题目生成变式题，完成后再次批改并对比耗时，形成循环。
          </span>
        </div>
      </Card>

      {analyses.length === 0 && (
        <Card className="border-green-200 bg-green-50/60 p-5 text-sm text-green-800">
          本轮没有错题也没有耗时超标的题目，无需专项讲解。
        </Card>
      )}

      {weak.length > 0 && (
        <Card className="p-5">
          <h2 className="text-base font-semibold text-gray-800">一、薄弱知识点精讲</h2>
          <p className="mt-1 text-xs text-gray-500">
            以下按知识点汇总，先回顾核心概念与方法，再对照错题重新理解。
          </p>
          <div className="mt-4 space-y-5">
            {weak.map((p) => {
              const l = lessonMap.get(p.id)
              const related = analyses.filter((a) => a.question.pointIds.includes(p.id))
              const focusSlides = l?.slides.filter((s) =>
                ['concept', 'method', 'pitfall', 'book'].includes(s.kind),
              )
              return (
                <div key={p.id} className="rounded-xl border border-gray-100 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{p.name}</span>
                    <Badge tone="violet">错/超时 {related.length} 题</Badge>
                    <Link to={`/lesson/${p.id}`} className="ml-auto text-xs text-blue-600 hover:underline">
                      查看完整课件 →
                    </Link>
                  </div>
                  <MathText className="mt-2 text-sm text-gray-700" text={p.summary} />
                  <div className="mt-2 rounded-lg bg-gray-50 px-4 py-3">
                    <div className="text-xs font-medium text-gray-500">核心要点</div>
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      {p.keyPoints.map((k, i) => (
                        <li key={i}>
                          <MathText className="text-sm text-gray-700" text={k} />
                        </li>
                      ))}
                    </ul>
                  </div>

                  {focusSlides?.length ? (
                    <div className="mt-3 space-y-2">
                      {focusSlides.slice(0, 3).map((s, i) => (
                        <div key={i} className="rounded-lg border border-violet-100 bg-violet-50/40 px-4 py-3">
                          <div className="text-xs font-medium text-violet-700">
                            {SLIDE_LABEL[s.kind] ?? s.kind} · {s.title}
                          </div>
                          {s.body && <MathText className="mt-1.5 text-sm text-gray-700" text={s.body} />}
                          {s.problem && (
                            <div className="mt-1.5">
                              <MathText className="text-sm text-gray-800" text={s.problem} />
                              {s.solution && (
                                <details className="mt-1.5">
                                  <summary className="cursor-pointer text-xs text-violet-700">查看解答</summary>
                                  <MathText className="mt-1 text-sm text-gray-700" text={s.solution} />
                                </details>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-gray-400">
                      （该知识点课件数据尚未生成，可点击上方「查看完整课件」查看要点。）
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {analyses.length > 0 && (
        <Card className="p-5">
          <h2 className="text-base font-semibold text-gray-800">二、逐题错因剖析与思路重建</h2>
          <div className="mt-4 space-y-4">
            {analyses.map((a, i) => {
              const rec = a.record
              const q = a.question
              const key = rec.questionId
              const shown = revealed[key]
              return (
                <div key={key} className="rounded-xl border border-gray-100">
                  <div className="flex flex-wrap items-center gap-2 border-b border-gray-50 px-4 py-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                      {i + 1}
                    </span>
                    <Badge tone={rec.correct ? 'amber' : 'red'}>
                      {rec.correct ? '耗时超标' : '做错'}
                    </Badge>
                    <span className="text-xs text-gray-500">{TYPE_LABEL[q.type]}</span>
                    <span className="text-xs text-gray-400">
                      用时 {formatDuration(rec.durationMs)}（预计 {formatDuration(q.estimatedSeconds * 1000)}，
                      {formatGap(a.gapMs)}）
                    </span>
                    {q.source?.kind === 'book' && (
                      <Badge tone="violet">源自《探究应用新思维》</Badge>
                    )}
                    {q.source?.kind === 'book' && <BookSource source={q.source} />}
                  </div>
                  <div className="px-4 py-3">
                    <div className="rounded-lg bg-gray-50 px-4 py-3">
                      <MathText className="text-sm text-gray-800" text={q.stem} />
                      {q.options?.map((o, k) => (
                        <MathText key={k} className="mt-0.5 text-sm text-gray-700" text={o} />
                      ))}
                    </div>

                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      <div className="rounded-lg border border-red-100 bg-red-50/40 px-4 py-3">
                        <div className="text-xs font-medium text-red-700">你的答案</div>
                        <MathText className="mt-1 text-sm text-gray-800" text={rec.value || '（未作答）'} />
                      </div>
                      <div className="rounded-lg border border-green-100 bg-green-50/40 px-4 py-3">
                        <div className="text-xs font-medium text-green-700">正确答案</div>
                        <MathText className="mt-1 text-sm text-gray-800" text={q.answer} />
                      </div>
                    </div>

                    {a.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        <span className="text-xs text-gray-500">错因标签：</span>
                        {a.tags.map((t) => (
                          <Badge key={t} tone="red">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {a.reason && (
                      <div className="mt-2 rounded-lg border border-amber-100 bg-amber-50/50 px-4 py-3">
                        <div className="text-xs font-medium text-amber-700">错因剖析</div>
                        <MathText className="mt-1 text-sm text-gray-700" text={a.reason} />
                      </div>
                    )}

                    <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50/40 px-4 py-3">
                      <div className="text-xs font-medium text-blue-700">思路重建</div>
                      <MathText className="mt-1 text-sm text-gray-800" text={q.solution} />
                    </div>

                    {q.rubric?.length ? (
                      <div className="mt-2 text-xs text-gray-500">
                        <span className="font-medium text-gray-600">关键步骤：</span>
                        {q.rubric.join('；')}
                      </div>
                    ) : null}

                    {q.variants?.length ? (
                      <div className="mt-3">
                        <button className="btn !py-1.5 !text-xs" onClick={() => setRevealed({ ...revealed, [key]: !shown })}>
                          {shown ? '收起变式跟进' : '查看变式跟进（专项练习同类题）'}
                        </button>
                        {shown && (
                          <div className="mt-2 space-y-2">
                            {q.variants.map((v, k) => (
                              <div key={k} className="rounded-lg border border-violet-100 bg-violet-50/30 px-4 py-3">
                                <MathText className="text-sm text-gray-800" text={v.stem} />
                                {v.options?.map((o, x) => (
                                  <MathText key={x} className="mt-0.5 text-sm text-gray-700" text={o} />
                                ))}
                                <details className="mt-1.5">
                                  <summary className="cursor-pointer text-xs text-violet-700">查看答案与解析</summary>
                                  <MathText className="mt-1 text-sm font-medium text-gray-900" text={`答案：${v.answer}`} />
                                  <MathText className="mt-1 text-sm text-gray-700" text={v.solution} />
                                </details>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <Card className="p-5">
        <h2 className="text-base font-semibold text-gray-800">三、下一步</h2>
        <p className="mt-1 text-sm text-gray-600">
          完成上面的错因剖析后，点击下方按钮进入<b>专项练习</b>。专项练习由本轮错题与耗时题的变式题、
          同知识点强化题组成，答完后同样会记录耗时、自动批改并生成新的分析，直到没有错题与耗时问题为止。
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="btn btn-primary" disabled={busy} onClick={startPractice}>
            {busy ? '正在生成…' : '生成专项练习并开始'}
          </button>
          <Link to="/progress" className="btn">
            查看学习报告
          </Link>
        </div>
      </Card>
    </div>
  )
}
