import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { MathText } from '../components/MathText'
import { BookSource } from '../components/BookSource'
import { Badge, Card, Empty, ProgressBar, Stat } from '../components/ui'
import { analyzeRound, buildPracticeRound, weakPointsOf } from '../lib/adaptive'
import { allPoints, loadAllExams, useCurriculum } from '../lib/data'
import { DIFFICULTY_LABEL, TYPE_LABEL, formatDuration, formatGap, isSlow, scoreWithRubric, summarizeRecords } from '../lib/grading'
import { makeId, recordQuestionExplain, saveRound, updateLoop, useAppData } from '../lib/store'
import { buildExplainScenes } from '../lib/explain'
import { loadGuidanceIndex } from '../lib/data'
import type { ExplainScene } from '../lib/explain'
import { ExplainPlayer } from '../components/ExplainPlayer'
import { GuidedSolution } from '../components/GuidedSolution'
import { computeIncentives } from '../lib/incentives'
import type { AnswerRecord, Lesson, Question, Round } from '../types'

function TimingRow({
  q,
  rec,
  index,
}: {
  q: Question
  rec: Round['answers'][number]
  index: number
}) {
  const slow = isSlow(rec.durationMs, q.estimatedSeconds)
  const gap = rec.durationMs - q.estimatedSeconds * 1000
  return (
    <tr className={slow ? 'bg-amber-50/60' : undefined}>
      <td className="py-2 pl-1 tabular-nums text-gray-500">{index}</td>
      <td className="py-2 text-gray-600">{TYPE_LABEL[q.type]}</td>
      <td className="py-2 text-right tabular-nums text-gray-500">{formatDuration(q.estimatedSeconds * 1000)}</td>
      <td className="py-2 text-right tabular-nums font-medium text-gray-800">{formatDuration(rec.durationMs)}</td>
      <td
        className={`py-2 text-right tabular-nums ${gap > 60_000 ? 'font-medium text-amber-700' : 'text-gray-500'}`}
      >
        {formatGap(gap)}
      </td>
      <td className="py-2 text-right">
        {rec.correct ? (
          <span className="text-green-600">✓</span>
        ) : rec.photoReview === 'pending' ? (
          <span className="text-blue-600">照</span>
        ) : (
          <span className="text-red-600">✗</span>
        )}
      </td>
      <td className="py-2 pr-1 text-right">
        {slow ? (
          <Badge tone="amber">耗时标记</Badge>
        ) : rec.correct ? (
          <Badge tone="green">正常</Badge>
        ) : (
          <Badge tone="red">需订正</Badge>
        )}
      </td>
    </tr>
  )
}

export default function ReportPage() {
  const { roundId } = useParams()
  const navigate = useNavigate()
  const data = useAppData()
  const { curriculum } = useCurriculum()
  const round = roundId ? data.rounds[roundId] : undefined
  const [openId, setOpenId] = useState<string | null>(null)
  /** 单题讲解：正在播放的场景（浮层） */
  const [explainPlaying, setExplainPlaying] = useState<ExplainScene[] | null>(null)
  /** 思路引导实时索引：旧轮次快照里的题没有 guidance，渲染时按 id/题干回填 */
  const [guidanceIdx, setGuidanceIdx] = useState<{ byId: Map<string, string>; byStem: Map<string, string> } | null>(null)
  useEffect(() => {
    loadGuidanceIndex().then(setGuidanceIdx).catch(() => {})
  }, [])
  const resolveGuidance = (q: Question): string | undefined =>
    q.guidance ?? guidanceIdx?.byId.get(q.id) ?? guidanceIdx?.byStem.get(q.stem)

  /** 专项练习：现场出题进度（题库枯竭时调模型） */
  const [genPractice, setGenPractice] = useState<{ done: number; total: number } | null>(null)
  /** 单题讲解：语音预合成进度（合成完才打开播放器） */
  const [genProgress, setGenProgress] = useState<{ questionId: string; phase: 'script' | 'tts'; done: number; total: number } | null>(null)

  /** 生成（或重新生成）单题讲解课件：拼装场景 → 预合成全部语音 → 保存并播放 */
  const makeExplain = async (rec: AnswerRecord, q: Question) => {
    if (!round || genProgress) return
    const reason = (rec.errorReason ?? '').trim()
    const known = reason !== '' && !reason.includes('看不出') && !reason.includes('错误原因未知')
    const slowOnly = rec.correct && isSlow(rec.durationMs, q.estimatedSeconds)
    // ① 讲解词：把题库思路引导改写成口语化讲授（点题眼、抛问题、有衔接）
    let narration: { intro: string; compare: string; reason: string; guide: string; closing: string } | null = null
    if (!slowOnly) {
      setGenProgress({ questionId: q.id, phase: 'script', done: 0, total: 1 })
      try {
        const r = await fetch('/api/gen-narration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stem: q.stem,
            standardAnswer: q.answer,
            standardSolution: q.solution,
            guidance: resolveGuidance(q),
            studentAnswer: rec.value,
            standardErrorReason: known ? reason : '',
          }),
        })
        if (r.ok) narration = ((await r.json()) as { narration: typeof narration }).narration ?? null
      } catch {
        /* 失败回退模板讲解词 */
      }
    }

    const scenes = buildExplainScenes(
      {
        chapterTitle: `${round.exam.chapterTitle} · 单题讲解`,
        wrongs: slowOnly
          ? []
          : [
              {
                q,
                userAnswer: rec.value,
                spentSeconds: Math.round(rec.durationMs / 1000),
                diag: known ? { skill: rec.errorTags[0] ?? '错因分析', reason } : null,
                narration,
              },
            ],
        slows: slowOnly
          ? [{ q, spentSeconds: Math.round(rec.durationMs / 1000), estimatedSeconds: q.estimatedSeconds }]
          : [],
        weakPointNames: [],
      },
      { compact: true },
    )
    recordQuestionExplain({
      questionId: q.id,
      roundId: round.id,
      createdAt: Date.now(),
      userAnswer: rec.value,
      scenes,
    })

    // 预合成每一幕的语音（失败不中断——该幕播放时自动降级文字模式）
    setGenProgress({ questionId: q.id, phase: 'tts', done: 0, total: scenes.length })
    let done = 0
    for (const sc of scenes) {
      try {
        await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: sc.narration }),
        })
      } catch {
        /* 忽略：播放器会重试并兜底 */
      }
      done += 1
      setGenProgress({ questionId: q.id, phase: 'tts', done, total: scenes.length })
    }
    setGenProgress(null)
    setExplainPlaying(scenes)
  }
  const [busy, setBusy] = useState(false)

  const points = useMemo(() => allPoints(curriculum), [curriculum])

  const analyses = useMemo(
    () => (round ? analyzeRound(round, points, new Map<string, Lesson>()) : []),
    [round, points],
  )

  if (!round) return <Empty title="未找到考评记录" />

  const qMap = new Map(round.exam.questions.map((q) => [q.id, q]))
  const answered = round.answers.length
  const correct = round.answers.filter((a) => a.correct).length
  const totalScore = round.answers.reduce((s, a) => s + a.score, 0)
  const estimatedTotal = round.answers.reduce(
    (s, a) => s + (qMap.get(a.questionId)?.estimatedSeconds ?? 0) * 1000,
    0,
  )
  const actualTotal = round.answers.reduce((s, a) => s + a.durationMs, 0)
  const accuracy = answered ? Math.round((correct / answered) * 100) : 0
  const weak = weakPointsOf(round, points)
  const game = computeIncentives(data)

  const setRubric = (questionId: string, flags: boolean[]) => {
    const answers = round.answers.map((a) => {
      if (a.questionId !== questionId) return a
      const q = qMap.get(questionId)
      if (!q) return a
      const base = { correct: a.correct, score: a.score, errorTags: a.errorTags, errorReason: a.errorReason }
      const graded = scoreWithRubric(base, flags)
      return { ...a, selfRubric: flags, score: graded.score, errorReason: graded.errorReason }
    })
    saveRound({ ...round, answers })
  }

  const confirmPhoto = (questionId: string, accepted: boolean) => {
    const answers = round.answers.map((a) => {
      if (a.questionId !== questionId) return a
      return {
        ...a,
        photoReview: accepted ? ('accepted' as const) : ('rejected' as const),
        correct: accepted,
        score: accepted ? 1 : 0,
        errorTags: accepted ? [] : ['手写答案有误'],
        errorReason: accepted
          ? '已对照解析确认手写答案正确。'
          : '已对照解析确认手写答案有误。请按解析订正后再做专项练习。',
      }
    })
    const summary = summarizeRecords(answers, qMap)
    const next = { ...round, answers, ...summary }
    saveRound(next)
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
  }

  const startPractice = async () => {
    setBusy(true)
    try {
      const all = await loadAllExams()
      all.set(round.exam.id, round.exam)
      const plan = await buildPracticeRound(round, all, Object.values(data.rounds), (done, total) =>
        setGenPractice(total > 0 ? { done, total } : null),
      )
      setGenPractice(null)
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
      <Card className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs text-gray-400">
              <Link to="/exams" className="hover:text-blue-600">
                章节考评
              </Link>{' '}
              / 考评报告
            </div>
            <h1 className="mt-1 text-[15px] font-semibold">{round.title}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <Badge tone={round.kind === 'exam' ? 'blue' : 'violet'}>
                {round.kind === 'exam' ? '章节考评' : round.kind === 'practice' ? '专项练习' : '专项讲解'}
              </Badge>
              <span>第 {round.round} 轮</span>
              <span>
                交卷时间{' '}
                {round.finishedAt ? new Date(round.finishedAt).toLocaleString('zh-CN') : '未交卷'}
              </span>
              {round.finishedAt && (
                <Badge tone="amber">
                  Lv.{game.level} {game.levelName} · 距下一级还差 {game.xpToNext} 经验
                </Badge>
              )}
            </div>
            {round.finishedAt && round.kind === 'exam' && (() => {
              const usedHint = round.answers.filter((a) => a.hintUsed).length
              const usedRetry = round.answers.filter((a) => a.retried).length
              const usedHg = round.buffs?.hourglassUsed?.length ?? 0
              const perfect =
                answered > 0 &&
                correct === answered &&
                round.wrongQuestionIds.length === 0 &&
                round.slowQuestionIds.length === 0 &&
                usedHint === 0 &&
                usedRetry === 0
              return (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {perfect && (
                    <Badge tone="green">⭐ 完美卷 · 无提示、无回炉、全对不超时</Badge>
                  )}
                  {(usedHint > 0 || usedRetry > 0 || usedHg > 0) && (
                    <span className="text-[11px] text-gray-400">
                      本卷增益留痕：
                      {usedHint > 0 && `思路点拨 ×${usedHint} `}
                      {usedRetry > 0 && `回炉 ×${usedRetry} `}
                      {usedHg > 0 && `时间沙漏 ×${usedHg}`}
                      （不影响判分，但拿不到完美卷）
                    </span>
                  )}
                </div>
              )
            })()}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to={`/remedial/${round.id}`} className="btn btn-primary">
              生成专项讲解课件
            </Link>
            <button className="btn" disabled={busy || analyses.length === 0} onClick={startPractice}>
              {busy ? '正在生成…' : '生成专项练习'}
            </button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="正确率" value={`${accuracy}%`} hint={`${correct} / ${answered} 题`} tone={accuracy >= 80 ? 'green' : 'amber'} />
        <Stat label="得分率" value={`${answered ? Math.round((totalScore / answered) * 100) : 0}%`} hint="含步骤分" />
        <Stat label="错题" value={round.wrongQuestionIds.length} tone={round.wrongQuestionIds.length ? 'red' : 'green'} />
        <Stat label="耗时标记题" value={round.slowQuestionIds.length} tone={round.slowQuestionIds.length ? 'amber' : 'green'} hint="超出预计 1 分钟以上" />
        <Stat
          label="总用时 / 预计"
          value={formatDuration(actualTotal)}
          hint={`预计 ${formatDuration(estimatedTotal)}`}
          tone={actualTotal > estimatedTotal + 60_000 ? 'amber' : 'green'}
        />
      </div>

      {round.wrongQuestionIds.length === 0 && round.slowQuestionIds.length === 0 ? (
        <Card className="border-green-200 bg-green-50/60 p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">🎉</span>
            <div>
              <div className="text-sm font-semibold text-green-800">
                本章本轮全部通过：没有错题，也没有耗时超标的题目。
              </div>
              <p className="mt-1 text-xs text-green-700">
                自适应循环已完成，本章标记为「已掌握」。如需继续巩固，可重新做一次章节考评。
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="border-amber-200 bg-amber-50/60 p-4">
          <div className="text-sm font-semibold text-amber-800">待提升：{analyses.length} 道题</div>
          <p className="mt-1 text-xs text-amber-700">
            其中错题 {round.wrongQuestionIds.length} 道、耗时标记题 {round.slowQuestionIds.length} 道，
            涉及 {weak.length} 个知识点。点击上方「生成专项讲解课件」查看错因剖析，
            再点击「生成专项练习」完成针对性变式训练，直到没有问题题目为止。
          </p>
          {weak.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {weak.map((p) => (
                <Link key={p.id} to={`/lesson/${p.id}`}>
                  <Badge tone="violet">{p.name}</Badge>
                </Link>
              ))}
            </div>
          )}
        </Card>
      )}

      <Card className="p-4">
        <h2 className="text-sm font-semibold text-gray-800">逐题耗时对比</h2>
        <p className="mt-1 text-xs text-gray-500">
          实际耗时 − 预计耗时 &gt; 1 分钟的题目以黄色底纹标记；选择题另给出「首次选择用时」。
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-400">
                <th className="py-2 pl-1 text-left font-normal">题号</th>
                <th className="py-2 text-left font-normal">题型</th>
                <th className="py-2 text-right font-normal">预计</th>
                <th className="py-2 text-right font-normal">实际</th>
                <th className="py-2 text-right font-normal">差值</th>
                <th className="py-2 text-right font-normal">结果</th>
                <th className="py-2 pr-1 text-right font-normal">标记</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {round.answers.map((rec, i) => {
                const q = qMap.get(rec.questionId)
                if (!q) return null
                return <TimingRow key={rec.questionId} q={q} rec={rec} index={i + 1} />
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3 space-y-1 text-xs text-gray-500">
          {round.answers
            .map((rec, i) => ({ rec, i }))
            .filter(({ rec }) => rec.type === 'choice' && rec.firstPickMs != null)
            .slice(0, 12)
            .map(({ rec, i }) => (
              <div key={rec.questionId}>
                第 {i + 1} 题（选择题）：首次选择用时 {formatDuration(rec.firstPickMs ?? 0)}，提交用时{' '}
                {formatDuration(rec.durationMs)}
              </div>
            ))}
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-sm font-semibold text-gray-800">逐题批改与订正</h2>
        <div className="mt-3 space-y-2">
          {round.answers.map((rec, i) => {
            const q = qMap.get(rec.questionId)
            if (!q) return null
            const open = openId === rec.questionId
            const slow = isSlow(rec.durationMs, q.estimatedSeconds)
            return (
              <div
                key={rec.questionId}
                className={`rounded-xl border ${
                  rec.correct && !slow
                    ? 'border-gray-100'
                    : rec.correct
                      ? 'border-amber-200'
                      : 'border-red-200'
                }`}
              >
                <button
                  className="flex w-full items-center gap-3 px-4 py-3 text-left"
                  onClick={() => setOpenId(open ? null : rec.questionId)}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                      rec.photoReview === 'pending'
                        ? 'bg-blue-50 text-blue-700'
                        : rec.correct
                          ? 'bg-green-50 text-green-700'
                          : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 text-sm text-gray-800">{q.stem}</span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                      <span>{TYPE_LABEL[q.type]}</span>
                      <span>{DIFFICULTY_LABEL[q.difficulty]}</span>
                      <span>
                        用时 {formatDuration(rec.durationMs)} / 预计 {formatDuration(q.estimatedSeconds * 1000)}
                      </span>
                      {q.source?.kind === 'book' && <span className="text-violet-500">源自《探究应用新思维》</span>}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    {q.source?.kind === 'book' && <BookSource source={q.source} />}
                    {rec.photoReview === 'pending' ? (
                      <Badge tone="blue">手写待确认</Badge>
                    ) : rec.correct ? (
                      <Badge tone="green">正确</Badge>
                    ) : (
                      <Badge tone="red">错误</Badge>
                    )}
                    {slow && <Badge tone="amber">耗时</Badge>}
                    <span className="text-xs text-gray-400">{open ? '收起' : '展开'}</span>
                  </span>
                </button>

                {open && (
                  <div className="border-t border-gray-100 px-4 py-4">
                    <div className="rounded-lg bg-gray-50 px-4 py-3">
                      <MathText className="text-sm text-gray-800" text={q.stem} />
                      {q.options && (
                        <div className="mt-2 space-y-0.5">
                          {q.options.map((o, k) => (
                            <MathText key={k} className="text-sm text-gray-700" text={o} />
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div className="rounded-lg border border-gray-100 px-4 py-3">
                        <div className="text-xs font-medium text-gray-500">你的答案</div>
                        <MathText className="mt-1 text-sm text-gray-800" text={rec.value || '（未作答）'} />
                        {rec.work && (
                          <>
                            <div className="mt-2 text-xs font-medium text-gray-500">你的过程</div>
                            <MathText className="mt-1 text-sm text-gray-700" text={rec.work} />
                          </>
                        )}
                        {rec.images?.length ? (
                          <div className="mt-2">
                            <div className="text-xs font-medium text-gray-500">手写照片（批改以此为准）</div>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {rec.images.map((src, k) => (
                                <a key={k} href={src} target="_blank" rel="noreferrer">
                                  <img src={src} alt="手写过程" className="h-28 rounded-lg border border-gray-200" />
                                </a>
                              ))}
                            </div>
                            {rec.photoReview === 'pending' && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                <button type="button" className="btn btn-primary" onClick={() => confirmPhoto(rec.questionId, true)}>
                                  手写答案正确
                                </button>
                                <button type="button" className="btn" onClick={() => confirmPhoto(rec.questionId, false)}>
                                  手写答案有误
                                </button>
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>
                      <div className="rounded-lg border border-green-100 bg-green-50/50 px-4 py-3">
                        <div className="text-xs font-medium text-green-700">正确答案</div>
                        <MathText className="mt-1 text-sm font-medium text-gray-900" text={q.answer} />
                      </div>
                    </div>

                    {/* 手写待确认的核对指引保留（这是操作指引，不是错因）；错因数据不再展示，仅用于专项考评题生成 */}
                    {rec.photoReview === 'pending' && (
                      <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50/50 px-4 py-3">
                        <div className="text-xs font-medium text-blue-700">手写答案待确认</div>
                        <MathText className="mt-1 text-sm text-gray-700" text={rec.errorReason} />
                      </div>
                    )}

                    {slow && (
                      <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50/50 px-4 py-3 text-sm text-amber-800">
                        本题用时 {formatDuration(rec.durationMs)}，比预计多用{' '}
                        {formatDuration(rec.durationMs - q.estimatedSeconds * 1000)}
                        ，已超过 1 分钟阈值，说明该知识点的方法还不熟练，建议重点练习。
                      </div>
                    )}

                    {q.rubric?.length ? (
                      <div className="mt-3 rounded-lg border border-gray-100 px-4 py-3">
                        <div className="text-xs font-medium text-gray-600">
                          ⏱ 自评：当时做到了哪些步骤？
                        </div>
                        <div className="mt-0.5 text-[11px] leading-relaxed text-gray-400">
                          做错也有过程分：勾选你当时确实做到的要点，按命中比例折算部分得分。
                        </div>
                        <div className="mt-2 space-y-1.5">
                          {q.rubric.map((r, k) => (
                            <label key={k} className="flex items-start gap-2 text-sm text-gray-700">
                              <input
                                type="checkbox"
                                className="mt-1"
                                checked={rec.selfRubric?.[k] ?? false}
                                onChange={(e) => {
                                  const flags = [...(rec.selfRubric ?? q.rubric!.map(() => false))]
                                  flags[k] = e.target.checked
                                  setRubric(rec.questionId, flags)
                                }}
                              />
                              <MathText className="text-sm text-gray-700" text={r} />
                            </label>
                          ))}
                        </div>
                        <div className="mt-1.5 text-xs text-gray-400">
                          当前得分 {Math.round(rec.score * 100)}%
                        </div>
                      </div>
                    ) : null}
                    <GuidedSolution
                      q={{ ...q, guidance: resolveGuidance(q) }}
                      pointNames={q.pointIds.map((pid) => points.get(pid)?.name ?? '').filter(Boolean)}
                      actions={
                        (() => {
                          const ex = data.questionExplains?.[q.id]
                          const gen = genProgress?.questionId === q.id ? genProgress : null
                          if (gen)
                            return (
                              <span className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-medium text-blue-700">
                                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
                                {gen.phase === 'script' ? '讲解词生成中…' : `语音合成 ${gen.done}/${gen.total}`}
                              </span>
                            )
                          return (
                            <span className="flex items-center gap-2">
                              {ex && (
                                <button
                                  type="button"
                                  className="text-[11px] text-gray-400 hover:text-gray-600"
                                  onClick={() => makeExplain(rec, q)}
                                >
                                  ↻ 重新生成
                                </button>
                              )}
                              <button
                                type="button"
                                className="rounded-full bg-blue-600 px-3 py-1 text-[11px] font-medium text-white hover:bg-blue-500"
                                onClick={() => (ex ? setExplainPlaying(ex.scenes) : makeExplain(rec, q))}
                              >
                                {ex ? '▶ 查看讲解' : '🎬 生成讲解'}
                              </button>
                            </span>
                          )
                        })()
                      }
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {weak.length > 0 && (
        <Card className="p-4">
          <h2 className="text-sm font-semibold text-gray-800">知识点掌握情况</h2>
          <div className="mt-3 space-y-3">
            {weak.map((p) => {
              const qs = round.exam.questions.filter((q) => q.pointIds.includes(p.id))
              const wrong = qs.filter((q) => round.wrongQuestionIds.includes(q.id)).length
              const slowN = qs.filter((q) => round.slowQuestionIds.includes(q.id)).length
              return (
                <div key={p.id}>
                  <div className="flex items-center justify-between text-sm">
                    <Link to={`/lesson/${p.id}`} className="text-gray-800 hover:text-blue-700">
                      {p.name}
                    </Link>
                    <span className="text-xs text-gray-500">
                      错 {wrong} · 超时 {slowN} · 共 {qs.length} 题
                    </span>
                  </div>
                  <div className="mt-1">
                    <ProgressBar
                      value={wrong + slowN}
                      max={Math.max(1, qs.length)}
                      tone={wrong > 0 ? 'amber' : 'blue'}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <div className="flex flex-wrap justify-between gap-2">
        <Link to="/exams" className="btn">
          ← 返回考评列表
        </Link>
        <div className="flex gap-2">
          <Link to={`/remedial/${round.id}`} className="btn">
            专项讲解课件
          </Link>
          <button className="btn btn-primary" disabled={busy || analyses.length === 0} onClick={startPractice}>
            {genPractice
              ? `正在为新题出题 ${genPractice.done}/${genPractice.total}…`
              : busy
                ? '生成中…'
                : '生成专项练习并开始'}
          </button>
        </div>
      </div>
      {explainPlaying && (
        <ExplainPlayer scenes={explainPlaying} onClose={() => setExplainPlaying(null)} />
      )}
    </div>
  )
}
