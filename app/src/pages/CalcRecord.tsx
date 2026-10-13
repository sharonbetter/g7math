import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MathText } from '../components/MathText'
import { useCalcBook } from '../lib/data'
import { formatDuration } from '../lib/grading'
import { useAppData } from '../lib/store'

function fmtClock(ms: number): string {
  const s = Math.floor(ms / 1000)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export default function CalcRecordPage() {
  const { trainingId } = useParams()
  const book = useCalcBook()
  const data = useAppData()
  const training = book?.trainings.find((t) => t.id === trainingId)
  const module = book?.modules.find((m) => m.id === training?.moduleId)
  const attempts = training ? [...(data.calcAttempts?.[training.id] ?? [])].reverse() : []
  const [open, setOpen] = useState<number | null>(0)

  if (!book) return <div className="card p-6 text-sm text-gray-500">正在加载…</div>
  if (!training)
    return (
      <div className="card flex flex-col items-center gap-2 px-6 py-16 text-center">
        <div className="text-base font-medium text-gray-700">未找到该训练</div>
        <Link to="/calc" className="btn btn-primary mt-2">
          返回计算专项
        </Link>
      </div>
    )

  const rec = data.calcDone?.[training.id]

  return (
    <div className="space-y-4">
      {/* 头部 */}
      <section className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <Link to={`/calc/${training.id}`} className="text-xs text-indigo-500 hover:underline">
            ← 返回第{training.no}练 {training.title}
          </Link>
          <h1 className="mt-1 text-lg font-bold text-gray-900">批改记录</h1>
          <div className="mt-1 text-xs text-gray-500">
            {module?.name} · {module?.chapterTitle} · 共 {attempts.length} 轮
            {rec?.passed ? ' · ✓ 已通过' : rec ? ` · 最佳 ${rec.best}/${rec.total}` : ''}
          </div>
        </div>
        <Link to={`/calc/${training.id}`} className="btn btn-primary">
          继续训练
        </Link>
      </section>

      {attempts.length === 0 && (
        <div className="card px-6 py-12 text-center text-sm text-gray-400">
          还没有批改记录，做完一轮提交后就会出现在这里。
        </div>
      )}

      <div className="space-y-2.5">
        {attempts.map((a, idx) => {
          const wrongs = a.items.filter((it) => !it.correct).length
          const slows = a.items.filter((it) => it.slow).length
          const isOpen = open === idx
          return (
            <div key={a.finishedAt} className="card overflow-hidden">
              <button
                className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-left text-[13px] transition hover:bg-gray-50/60"
                onClick={() => setOpen(isOpen ? null : idx)}
              >
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    a.round === 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-violet-50 text-violet-600'
                  }`}
                >
                  {a.round === 0 ? '首轮' : `专项第 ${a.round} 轮`}
                </span>
                <span className="text-gray-500">
                  {new Date(a.finishedAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="font-semibold text-gray-800 tabular-nums">
                  {a.correct}/{a.total} 对
                </span>
                {wrongs > 0 && <span className="text-[11px] font-medium text-rose-500">错 {wrongs}</span>}
                {slows > 0 && <span className="text-[11px] font-medium text-amber-500">⏱ {slows}</span>}
                <span className="text-[11px] text-gray-400">总用时 {fmtClock(a.totalMs)}</span>
                <span className={`ml-auto text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>▾</span>
              </button>
              {isOpen && (
                <div className="divide-y divide-gray-50 border-t border-gray-100/70 bg-gray-50/30 px-4">
                  {a.items.map((it, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-x-2.5 gap-y-1 py-2 text-xs">
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                          !it.correct ? 'bg-rose-500 text-white' : it.slow ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
                        }`}
                      >
                        {!it.correct ? '✕' : it.slow ? '⏱' : '✓'}
                      </span>
                      <span className="text-gray-700">
                        第 {it.no} 题
                        {a.round > 0 && <span className="ml-1 text-[10px] text-violet-400">变式</span>}
                      </span>
                      <MathText className="min-w-0 flex-1 text-[12px] text-gray-500" text={it.stem} />
                      <span className="flex shrink-0 items-center gap-2">
                        {!it.correct && (
                          <span className="text-gray-500">
                            我答 <b className={it.userAnswer.trim() ? 'text-rose-500' : 'text-gray-400'}>{it.userAnswer.trim() || '未作答'}</b>
                            <span className="mx-1">→</span>
                            正确 <b className="text-emerald-600">{it.answer}</b>
                            {it.errorTag && (
                              <span className="ml-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-500">
                                {it.errorTag}
                              </span>
                            )}
                          </span>
                        )}
                        <span className={it.slow ? 'font-medium text-amber-600' : 'text-gray-400'}>
                          {formatDuration(it.ms)}（预计 {it.est}s）
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
