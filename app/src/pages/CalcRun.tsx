import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MathText } from '../components/MathText'
import { useCalcBook } from '../lib/data'
import { answersMatch } from '../lib/answers'
import { formatDuration, isSlow } from '../lib/grading'
import { diagnoseByModel } from '../lib/diagnose'
import { patchCalcAttempt, recordCalcDone, saveCalcAttempt, useAppData } from '../lib/store'
import type { CalcTraining } from '../types'

const MODULE_COLORS: Record<string, string> = {
  m1: 'from-indigo-600 via-blue-700 to-indigo-600',
  m2: 'from-emerald-600 via-teal-700 to-emerald-600',
  m3: 'from-sky-600 via-cyan-700 to-sky-600',
  m4: 'from-violet-600 via-purple-700 to-violet-600',
  m5: 'from-amber-500 via-orange-600 to-amber-600',
  m6: 'from-rose-500 via-pink-600 to-rose-600',
}

/** 当前轮的一道题：主轮用原题，练习轮用同类型变式 */
interface RoundQ {
  key: string
  /** 主轮题号；练习轮沿用原题号便于对照 */
  no: number
  stem: string
  answer: string
  accepted: string[]
  est: number
  fromIdx: number
  skill?: string | null
  commonWrong?: { answer: string; reason: string; skill?: string | null }[]
}

function fmtClock(ms: number): string {
  const s = Math.floor(ms / 1000)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

function buildRound(training: CalcTraining, round: number, fromIdxs?: number[]): RoundQ[] {
  // 主轮：全部原题；练习轮：问题题的变式（按轮次轮换变式，无变式则复用原题）
  if (round === 0) {
    return training.questions.map((q, i) => ({
      key: `r0-q${i}`,
      no: i + 1,
      stem: q.stem,
      answer: q.answer,
      accepted: q.acceptedAnswers ?? [],
      est: q.estimatedSeconds,
      fromIdx: i,
      skill: q.skill ?? null,
      commonWrong: q.commonWrong ?? [],
    }))
  }
  const idxs = fromIdxs ?? []
  return idxs.map((qi, k) => {
    const q = training.questions[qi]
    const variants = q.variants ?? []
    const v = variants.length ? variants[(round - 1) % variants.length] : null
    return {
      key: `r${round}-q${k}`,
      no: qi + 1,
      stem: v?.stem ?? q.stem,
      answer: v?.answer ?? q.answer,
      accepted: v?.acceptedAnswers ?? q.acceptedAnswers ?? [],
      est: v?.estimatedSeconds ?? q.estimatedSeconds,
      fromIdx: qi,
      skill: (v?.skill ?? q.skill) || null,
      commonWrong: v?.commonWrong ?? q.commonWrong ?? [],
    }
  })
}

export default function CalcRunPage() {
  const { trainingId } = useParams()
  const book = useCalcBook()
  const data = useAppData()
  const training = book?.trainings.find((t) => t.id === trainingId)
  const module = book?.modules.find((m) => m.id === training?.moduleId)

  const [round, setRound] = useState(0)
  const [roundQs, setRoundQs] = useState<RoundQ[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [spent, setSpent] = useState<Record<string, number>>({})
  const [results, setResults] = useState<
    { wrong: boolean; slow: boolean; ms: number; errorTag?: string; skill?: string | null }[] | null
  >(null)
  const [passed, setPassed] = useState(false)
  const [problemIdxs, setProblemIdxs] = useState<number[]>([])
  const [startAt] = useState(() => Date.now())
  const [now, setNow] = useState(() => Date.now())
  const focusRef = useRef<Record<string, number>>({})

  useEffect(() => {
    if (!training) return
    setRound(0)
    setRoundQs(buildRound(training, 0))
    setAnswers({})
    setSpent({})
    setResults(null)
    setPassed(false)
    setProblemIdxs([])
    focusRef.current = {}
  }, [training?.id])

  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(iv)
  }, [])

  /** 结算某题当前聚焦中的耗时 */
  const settle = (keys: string[]) => {
    let delta: Record<string, number> | null = null
    for (const k of keys) {
      const t = focusRef.current[k]
      if (t) {
        delta = delta ?? {}
        delta[k] = Date.now() - t
        delete focusRef.current[k]
      }
    }
    if (delta) setSpent((s) => {
      const next = { ...s }
      for (const [k, d] of Object.entries(delta!)) next[k] = (next[k] ?? 0) + d
      return next
    })
  }

  const summary = useMemo(() => {
    if (!results) return null
    const wrong = results.filter((r) => r.wrong).length
    const slow = results.filter((r) => r.slow && !r.wrong).length
    return { wrong, slow, correct: results.length - wrong }
  }, [results])

  /** 历史批改（最新在前） */
  const attempts = useMemo(
    () => (training ? [...(data.calcAttempts?.[training.id] ?? [])].reverse() : []),
    [data.calcAttempts, training?.id],
  )

  if (!book) return <div className="card p-6 text-sm text-gray-500">正在加载…</div>
  if (!training || !module)
    return (
      <div className="card flex flex-col items-center gap-2 px-6 py-16 text-center">
        <div className="text-base font-medium text-gray-700">未找到该训练</div>
        <Link to="/calc" className="btn btn-primary mt-2">
          返回计算专项
        </Link>
      </div>
    )

  const answered = roundQs.filter((q) => (answers[q.key] ?? '').trim()).length
  const prev = data.calcDone?.[training.id]

  const submit = () => {
    settle(roundQs.map((q) => q.key))
    // 用一次同步快照结算（settle 的 setState 是异步的，这里直接算总账）
    const spentNow: Record<string, number> = { ...spent }
    for (const q of roundQs) {
      const t = focusRef.current[q.key]
      if (t) {
        spentNow[q.key] = (spentNow[q.key] ?? 0) + (Date.now() - t)
        delete focusRef.current[q.key]
      }
    }
    setSpent(spentNow)

    const rs = roundQs.map((q) => {
      const user = answers[q.key] ?? ''
      const ms = spentNow[q.key] ?? 0
      const wrong = !user.trim() || !answersMatch(user, q.answer, q.accepted)
      const slow = !wrong && !!user.trim() && isSlow(ms, q.est)
      // 错因诊断：用户错答与典型错误答案匹配
      let errorTag: string | undefined
      let skill: string | null | undefined
      if (wrong && user.trim()) {
        const hit = (q.commonWrong ?? []).find((c) => answersMatch(user, c.answer))
        errorTag = hit?.reason ?? '__PENDING__' // 未命中规则 → 模型兜底
        skill = hit?.skill ?? q.skill ?? null
      }
      return { wrong, slow, ms, errorTag, skill }
    })
    setResults(rs)
    const problems = rs.map((r, i) => (r.wrong || r.slow ? roundQs[i].fromIdx : -1)).filter((i) => i >= 0)
    setProblemIdxs(problems)

    if (problems.length === 0) {
      // 本轮全对且无超时 → 训练通过
      const correctTotal = rs.length
      setPassed(true)
      recordCalcDone(training.id, correctTotal, training.questions.length, true, round + 1)
    } else {
      recordCalcDone(training.id, rs.filter((r) => !r.wrong).length, training.questions.length)
    }
    // 保存本轮逐题批改明细（历史可回看）
    const finishedAt = Date.now()
    const toItems = (final: typeof rs) =>
      roundQs.map((q, i) => ({
        no: q.no,
        stem: q.stem,
        userAnswer: answers[q.key] ?? '',
        answer: q.answer,
        correct: !final[i].wrong,
        slow: final[i].slow,
        ms: final[i].ms,
        est: q.est,
        errorTag: final[i].errorTag === '__PENDING__' ? 'AI 分析中…' : final[i].errorTag,
        skill: final[i].skill ?? null,
      }))
    saveCalcAttempt(training.id, {
      round,
      finishedAt,
      totalMs: finishedAt - startAt,
      correct: rs.filter((r) => !r.wrong).length,
      total: roundQs.length,
      items: toItems(rs),
    })

    // 规则未命中的错题 → 模型异步诊断，返回后更新界面与记录
    const pending = rs.map((r, i) => (r.errorTag === '__PENDING__' ? i : -1)).filter((i) => i >= 0)
    if (pending.length && book.skillNames) {
      const skills = book.skillNames
      Promise.all(
        pending.map(async (i) => ({
          i,
          d: await diagnoseByModel(roundQs[i].stem, roundQs[i].answer, answers[roundQs[i].key] ?? '', skills),
        })),
      ).then((updates) => {
        const final = rs.map((r, j) => {
          const u = updates.find((x) => x.i === j)
          if (!u) return r
          return {
            ...r,
            errorTag: u.d ? u.d.reason : '计算失误（请对照解析检查）',
            skill: u.d && u.d.skill !== 'other' ? u.d.skill : (r.skill ?? null),
          }
        })
        setResults(final)
        patchCalcAttempt(training.id, finishedAt, toItems(final))
      })
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const startPractice = () => {
    const next = round + 1
    setRound(next)
    setRoundQs(buildRound(training, next, problemIdxs))
    setAnswers({})
    setSpent({})
    setResults(null)
    setPassed(false)
    focusRef.current = {}
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const gradient = MODULE_COLORS[module.id] ?? MODULE_COLORS.m1

  return (
    <div className="space-y-4 pb-24">
      {/* 头部 */}
      <section className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} px-5 py-5 text-white shadow-lg md:px-8`}>
        <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-white/15 blur-3xl" />
        <div className="relative">
          <Link to="/calc" className="text-xs text-white/75 transition hover:text-white">
            ← 计算专项 · {module.name}
          </Link>
          <h1 className="mt-1.5 text-lg font-bold tracking-tight md:text-2xl">
            第{training.no}练 {training.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/85">
            <span className="rounded-full bg-white/15 px-2.5 py-0.5 ring-1 ring-white/15">{training.questions.length} 题</span>
            <span className="rounded-full bg-white/15 px-2.5 py-0.5 ring-1 ring-white/15">建议 {training.minutes} 分钟</span>
            <span className="rounded-full bg-white/15 px-2.5 py-0.5 tracking-tight ring-1 ring-white/15">
              难度 {'★'.repeat(training.difficulty)}
            </span>
            <Link
              to={`/curriculum/${training.chapterId}`}
              className="rounded-full bg-white/15 px-2.5 py-0.5 underline-offset-2 ring-1 ring-white/15 hover:underline"
            >
              {module.chapterTitle}
            </Link>
            {attempts.length > 0 && (
              <Link
                to={`/calc/${training.id}/record`}
                className="rounded-full bg-white/90 px-2.5 py-0.5 font-medium text-indigo-600 shadow-sm transition hover:bg-white"
              >
                📋 批改记录 {attempts.length} 轮 →
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* 结果 / 通过横幅 */}
      {passed && (
        <div className="card flex flex-wrap items-center justify-between gap-4 border-l-8 !border-l-emerald-400 p-5">
          <div>
            <div className="text-lg font-bold text-emerald-600">
              🎉 训练通过{round > 0 ? `（专项练习第 ${round} 轮）` : '（首轮全对且无超时）'}
            </div>
            <div className="mt-1 text-xs text-gray-500">
              全部答对且耗时未超预计（超出预计 1 分钟以上记为超时）。经验已计入，本训练标记为已通过。
            </div>
          </div>
          <Link to="/calc" className="btn btn-primary">
            返回训练列表
          </Link>
        </div>
      )}
      {results && !passed && summary && (
        <div className="card flex flex-wrap items-center justify-between gap-4 border-l-8 !border-l-amber-400 p-5">
          <div>
            <div className="text-lg font-bold text-gray-900">
              答对 {summary.correct} / {roundQs.length} 题
              {summary.wrong > 0 && <span className="ml-2 text-sm font-semibold text-rose-500">错题 {summary.wrong}</span>}
              {summary.slow > 0 && (
                <span className="ml-2 text-sm font-semibold text-amber-500">⏱ 超时 {summary.slow}</span>
              )}
              <span className="ml-3 align-middle text-sm font-normal text-gray-400">总用时 {fmtClock(now - startAt)}</span>
            </div>
            <div className="mt-1 text-xs text-gray-500">
              {round === 0
                ? `错题与超时题（超出预计 1 分钟以上）将生成同类型变式进行专项练习，直到全部答对且不超时。`
                : `本轮仍有问题题，继续下一轮变式练习。`}
              {prev?.best != null && ` · 历史最佳 ${prev.best}/${training.questions.length}`}
            </div>
          </div>
          <button className="btn btn-primary" onClick={startPractice}>
            开始专项练习 · 变式 {problemIdxs.length} 题 →
          </button>
        </div>
      )}

      {/* 当前轮题目 */}
      {round > 0 && !results && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 px-4 py-2.5 text-xs text-indigo-700">
          专项练习第 {round} 轮：以下为错题/超时题的同类型变式，答对且耗时不超过预计即算通过。
        </div>
      )}
      <div className="card divide-y divide-gray-100/70 px-2 py-1">
        {roundQs.map((q, i) => {
          const r = results?.[i]
          return (
            <div
              key={q.key}
              className={`flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2 ${
                r ? (r.wrong ? 'rounded-xl bg-rose-50/50' : r.slow ? 'rounded-xl bg-amber-50/50' : 'rounded-xl bg-emerald-50/40') : ''
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  r?.wrong ? 'bg-rose-500 text-white' : r?.slow ? 'bg-amber-500 text-white' : r ? 'bg-emerald-500 text-white' : 'bg-indigo-50 text-indigo-600'
                }`}
              >
                {r?.wrong ? '✕' : r?.slow ? '⏱' : r ? '✓' : q.no}
              </span>
              <MathText className="min-w-0 max-w-full text-[13px] leading-relaxed text-gray-900" text={q.stem} />
              {!results ? (
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="答案"
                  className="!w-40 shrink-0 !px-2.5 !py-1.5 !text-[13px]"
                  value={answers[q.key] ?? ''}
                  onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))}
                  onFocus={() => {
                    if (!focusRef.current[q.key]) focusRef.current[q.key] = Date.now()
                  }}
                  onBlur={() => settle([q.key])}
                />
              ) : (
                <span className="flex shrink-0 items-center gap-2 text-[11px]">
                  <span className={r!.slow ? 'font-semibold text-amber-600' : 'text-gray-400'}>
                    {formatDuration(r!.ms)} / {q.est}s
                  </span>
                </span>
              )}
              {r?.wrong && (
                <span className="w-full pl-9 text-xs">
                  <span className="text-gray-400">你的答案 </span>
                  <b className={(answers[q.key] ?? '').trim() ? 'text-rose-500' : 'text-gray-400'}>
                    {(answers[q.key] ?? '').trim() || '未作答'}
                  </b>
                  <span className="mx-1.5 text-gray-300">|</span>
                  <span className="text-gray-400">正确答案 </span>
                  <b className="text-emerald-600">{q.answer}</b>
                  {r.errorTag && (
                    <span className="ml-2 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-500">
                      错因：{r.errorTag}
                    </span>
                  )}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* 底部提交条 */}
      {!results && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/60 bg-white/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
            <div className="text-xs text-gray-500">
              {round === 0 ? '' : `专项练习 · 第 ${round} 轮 · `}
              已作答 <b className="tabular-nums text-gray-800">{answered}</b>/{roundQs.length} · 总用时{' '}
              <span className="tabular-nums">{fmtClock(now - startAt)}</span>
              <span className="ml-2 hidden text-gray-400 sm:inline">分数可用 a/b 表示，如 3/4</span>
            </div>
            <div className="flex gap-2">
              <Link to="/calc" className="btn !py-2 !text-[13px]">
                退出
              </Link>
              <button className="btn btn-primary !py-2" disabled={answered === 0} onClick={submit}>
                提交批改
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
