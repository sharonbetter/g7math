import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MathText } from '../components/MathText'
import { useCalcBook } from '../lib/data'
import { answersMatch } from '../lib/answers'
import { formatDuration, isSlow } from '../lib/grading'
import { diagnoseByModel } from '../lib/diagnose'
import { patchCalcAttempt, saveCalcAttempt, useAppData } from '../lib/store'
import type { CalcPoolQuestion } from '../types'

/** 定向专练一轮的题数 */
const N_QUESTIONS = 8

function fmtClock(ms: number): string {
  const s = Math.floor(ms / 1000)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export default function CalcWeakPage() {
  const { skill } = useParams()
  const book = useCalcBook()
  const data = useAppData()

  // 从技能池选题（优先没做过的；用最近一次 weak 练习里没出现过的）
  const pool = skill ? (book?.skillPools?.[skill] ?? []) : []
  const weakKey = `weak-${skill}`
  const lastStems = useMemo(() => {
    const list = data.calcAttempts?.[weakKey] ?? []
    const stems = new Set<string>()
    for (const a of list) for (const it of a.items) stems.add(it.stem)
    return stems
  }, [data.calcAttempts, weakKey])

  const [questions, setQuestions] = useState<CalcPoolQuestion[]>([])
  const [attempt, setAttempt] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [spent, setSpent] = useState<Record<string, number>>({})
  const [results, setResults] = useState<
    { wrong: boolean; slow: boolean; ms: number; errorTag?: string }[] | null
  >(null)
  const [startAt, setStartAt] = useState(() => Date.now())
  const [now, setNow] = useState(() => Date.now())
  const focusRef = useRef<Record<string, number>>({})

  const pickQuestions = (avoid: Set<string>) => {
    const fresh = pool.filter((q) => !avoid.has(q.stem))
    const src = fresh.length >= N_QUESTIONS ? fresh : pool
    const shuffled = [...src].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, N_QUESTIONS)
  }

  useEffect(() => {
    if (!pool.length) return
    setQuestions(pickQuestions(lastStems))
    setAttempt(0)
    setAnswers({})
    setSpent({})
    setResults(null)
    setStartAt(Date.now())
    focusRef.current = {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skill, pool.length])

  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(iv)
  }, [])

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
    if (delta)
      setSpent((s) => {
        const next = { ...s }
        for (const [k, d] of Object.entries(delta!)) next[k] = (next[k] ?? 0) + d
        return next
      })
  }

  if (!book) return <div className="card p-6 text-sm text-gray-500">正在加载…</div>
  const skillName = (book.skillNames ?? {})[skill ?? ''] ?? skill ?? ''
  if (!skill || pool.length === 0)
    return (
      <div className="card flex flex-col items-center gap-2 px-6 py-16 text-center">
        <div className="text-base font-medium text-gray-700">未找到该薄弱点题池</div>
        <Link to="/calc" className="btn btn-primary mt-2">
          返回计算专项
        </Link>
      </div>
    )

  const answered = questions.filter((_, i) => (answers[`q${i}`] ?? '').trim()).length
  const lastWeak = (data.calcAttempts?.[weakKey] ?? []).slice(-1)[0]
  const lastRec = data.calcDone?.[weakKey]

  const submit = () => {
    settle(questions.map((_, i) => `q${i}`))
    const spentNow: Record<string, number> = { ...spent }
    for (let i = 0; i < questions.length; i++) {
      const k = `q${i}`
      const t = focusRef.current[k]
      if (t) {
        spentNow[k] = (spentNow[k] ?? 0) + (Date.now() - t)
        delete focusRef.current[k]
      }
    }
    setSpent(spentNow)
    const rs = questions.map((q, i) => {
      const user = answers[`q${i}`] ?? ''
      const ms = spentNow[`q${i}`] ?? 0
      const wrong = !user.trim() || !answersMatch(user, q.answer, q.acceptedAnswers)
      const slow = !wrong && !!user.trim() && isSlow(ms, q.estimatedSeconds)
      let errorTag: string | undefined
      if (wrong && user.trim()) {
        const hit = (q.commonWrong ?? []).find((c) => answersMatch(user, c.answer))
        errorTag = hit?.reason ?? '__PENDING__'
      }
      return { wrong, slow, ms, errorTag }
    })
    setResults(rs)
    const finishedAt = Date.now()
    const toItems = (final: typeof rs) =>
      questions.map((q, i) => ({
        no: i + 1,
        stem: q.stem,
        userAnswer: answers[`q${i}`] ?? '',
        answer: q.answer,
        correct: !final[i].wrong,
        slow: final[i].slow,
        ms: final[i].ms,
        est: q.estimatedSeconds,
        errorTag: final[i].errorTag === '__PENDING__' ? 'AI 分析中…' : final[i].errorTag,
        skill,
      }))
    saveCalcAttempt(weakKey, {
      round: attempt,
      finishedAt,
      totalMs: finishedAt - startAt,
      correct: rs.filter((r) => !r.wrong).length,
      total: questions.length,
      items: toItems(rs),
    })

    // 规则未命中 → 模型异步诊断
    const pending = rs.map((r, i) => (r.errorTag === '__PENDING__' ? i : -1)).filter((i) => i >= 0)
    if (pending.length && book.skillNames) {
      const skills = book.skillNames
      Promise.all(
        pending.map(async (i) => ({
          i,
          d: await diagnoseByModel(questions[i].stem, questions[i].answer, answers[`q${i}`] ?? '', skills),
        })),
      ).then((updates) => {
        const final = rs.map((r, j) => {
          const u = updates.find((x) => x.i === j)
          if (!u) return r
          return {
            ...r,
            errorTag: u.d ? u.d.reason : '计算失误（请对照解析检查）',
          }
        })
        setResults(final)
        patchCalcAttempt(weakKey, finishedAt, toItems(final))
      })
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const redo = () => {
    setQuestions(pickQuestions(new Set()))
    setAttempt((n) => n + 1)
    setAnswers({})
    setSpent({})
    setResults(null)
    setStartAt(Date.now())
    focusRef.current = {}
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const correctCount = results ? results.filter((r) => !r.wrong).length : 0

  return (
    <div className="space-y-4 pb-24">
      {/* 头部 */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500 via-pink-600 to-rose-500 px-5 py-5 text-white shadow-lg md:px-7">
        <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-white/15 blur-3xl" />
        <div className="relative">
          <Link to="/calc" className="text-xs text-white/75 transition hover:text-white">
            ← 计算专项 · 定向专练
          </Link>
          <h1 className="mt-1.5 text-lg font-bold tracking-tight md:text-lg">薄弱点专练：{skillName}</h1>
          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-white/85">
            <span className="rounded-full bg-white/15 px-2.5 py-0.5 ring-1 ring-white/15">{questions.length} 题</span>
            <span className="rounded-full bg-white/15 px-2.5 py-0.5 ring-1 ring-white/15">题池 {pool.length} 题</span>
            {lastRec && (
              <span className="rounded-full bg-white/15 px-2.5 py-0.5 ring-1 ring-white/15">
                最近一次 {lastWeak?.correct ?? '?'}/{lastWeak?.total ?? '?'} 对
              </span>
            )}
          </div>
        </div>
      </section>

      {/* 结果横幅 */}
      {results && (
        <div
          className={`card flex flex-wrap items-center justify-between gap-4 border-l-8 p-4 ${
            correctCount === questions.length ? '!border-l-emerald-400' : '!border-l-amber-400'
          }`}
        >
          <div>
            <div className="text-lg font-bold text-gray-900">
              答对 {correctCount} / {questions.length} 题
              <span className="ml-3 align-middle text-sm font-normal text-gray-400">用时 {fmtClock(now - startAt)}</span>
            </div>
            <div className="mt-1 text-xs text-gray-500">
              {correctCount === questions.length
                ? '全对！这个薄弱点可以暂时放心了，隔几天再来复练一次巩固。'
                : '还有错题（已标注错因），换一批同类题继续练，直到全对。'}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn" onClick={redo}>
              换一批再练
            </button>
            <Link to="/calc" className="btn btn-primary">
              返回训练列表
            </Link>
          </div>
        </div>
      )}

      {/* 题目 */}
      <div className="card divide-y divide-gray-100/70 px-2 py-1">
        {questions.map((q, i) => {
          const r = results?.[i]
          return (
            <div
              key={i}
              className={`flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2 ${
                r ? (r.wrong ? 'rounded-xl bg-rose-50/50' : r.slow ? 'rounded-xl bg-amber-50/50' : 'rounded-xl bg-emerald-50/40') : ''
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  r?.wrong ? 'bg-rose-500 text-white' : r?.slow ? 'bg-amber-500 text-white' : r ? 'bg-emerald-500 text-white' : 'bg-rose-50 text-rose-500'
                }`}
              >
                {r?.wrong ? '✕' : r?.slow ? '⏱' : r ? '✓' : i + 1}
              </span>
              <MathText className="min-w-0 max-w-full text-[13px] leading-relaxed text-gray-900" text={q.stem} />
              {!results ? (
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="答案"
                  className="!w-40 shrink-0 !px-2.5 !py-1.5 !text-[13px]"
                  value={answers[`q${i}`] ?? ''}
                  onChange={(e) => setAnswers((a) => ({ ...a, [`q${i}`]: e.target.value }))}
                  onFocus={() => {
                    if (!focusRef.current[`q${i}`]) focusRef.current[`q${i}`] = Date.now()
                  }}
                  onBlur={() => settle([`q${i}`])}
                />
              ) : (
                <span className={`shrink-0 text-[11px] ${r!.slow ? 'font-semibold text-amber-600' : 'text-gray-400'}`}>
                  {formatDuration(r!.ms)} / {q.estimatedSeconds}s
                </span>
              )}
              {r?.wrong && (
                <span className="w-full pl-7 text-xs">
                  <span className="text-gray-400">你的答案 </span>
                  <b className={(answers[`q${i}`] ?? '').trim() ? 'text-rose-500' : 'text-gray-400'}>
                    {(answers[`q${i}`] ?? '').trim() || '未作答'}
                  </b>
                  <span className="mx-1.5 text-gray-300">|</span>
                  <span className="text-gray-400">正确 </span>
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
              已作答 <b className="tabular-nums text-gray-800">{answered}</b>/{questions.length} · 用时{' '}
              <span className="tabular-nums">{fmtClock(now - startAt)}</span>
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
