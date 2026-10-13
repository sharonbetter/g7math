import { Link } from 'react-router-dom'
import { useAppData } from '../lib/store'
import { useCalcBook } from '../lib/data'
import type { CalcModule } from '../types'

const MODULE_COLORS = [
  'from-indigo-500 to-blue-500',
  'from-emerald-500 to-teal-500',
  'from-sky-500 to-cyan-500',
  'from-violet-500 to-purple-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
]

/** 从批改记录聚合薄弱技能 */
export function useWeakSkills() {
  const data = useAppData()
  const book = useCalcBook()
  const names = book?.skillNames ?? {}
  const agg = new Map<string, { count: number; lastAt: number }>()
  for (const [tid, attempts] of Object.entries(data.calcAttempts ?? {})) {
    if (tid.startsWith('weak-')) continue
    for (const a of attempts) {
      for (const it of a.items) {
        if (it.correct || !it.skill) continue
        const cur = agg.get(it.skill) ?? { count: 0, lastAt: 0 }
        cur.count += 1
        cur.lastAt = Math.max(cur.lastAt, a.finishedAt)
        agg.set(it.skill, cur)
      }
    }
  }
  return [...agg.entries()]
    .map(([skill, v]) => ({ skill, name: names[skill] ?? skill, ...v }))
    .sort((a, b) => b.count - a.count || b.lastAt - a.lastAt)
}

export default function CalcListPage() {
  const book = useCalcBook()
  const data = useAppData()
  const weak = useWeakSkills()

  if (!book) return <div className="card p-6 text-sm text-gray-500">正在加载计算专项题库…</div>

  const totalDone = book.trainings.filter((t) => data.calcDone?.[t.id]).length
  const totalPassed = book.trainings.filter((t) => data.calcDone?.[t.id]?.passed).length

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900">计算专项训练</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-500">
          依据《一本·初中数学计算题满分训练》（人教版七年级）的训练体系编排：{book.modules.length} 大模块 ·{' '}
          {book.trainings.length} 个训练 · 共 {book.trainings.reduce((s, t) => s + t.questions.length, 0)} 题，
          每个训练对应教材章节，做完自动批改并计入经验。
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
          <span className="rounded-full bg-indigo-50 px-3 py-1 font-medium text-indigo-600">
            已完成 {totalDone}/{book.trainings.length} 个训练
          </span>
          <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-600">
            已通过 {totalPassed} 个（全对且无超时）
          </span>
        </div>
      </div>

      {/* 我的薄弱点：错因自动聚合 */}
      {weak.length > 0 && (
        <div className="card border-l-8 !border-l-rose-400 p-4">
          <h2 className="text-[15px] font-bold text-gray-900">我的薄弱点</h2>
          <p className="mt-0.5 text-xs text-gray-400">由历次批改的错因自动诊断聚合，点击做定向专练</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {weak.slice(0, 8).map((w) => (
              <Link
                key={w.skill}
                to={`/calc/weak/${w.skill}`}
                className="group flex items-center gap-2 rounded-full border border-rose-200/70 bg-rose-50/70 px-3.5 py-1.5 text-xs font-medium text-rose-600 transition hover:border-rose-300 hover:bg-rose-100"
              >
                {w.name}
                <span className="rounded-full bg-rose-500/90 px-1.5 py-px text-[10px] text-white tabular-nums">
                  {w.count}
                </span>
                <span className="text-rose-400 opacity-0 transition group-hover:opacity-100">练 →</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {book.modules.map((m, mi) => (
        <ModuleSection key={m.id} module={m} color={MODULE_COLORS[mi % MODULE_COLORS.length]} />
      ))}
    </div>
  )
}

function ModuleSection({ module: m, color }: { module: CalcModule; color: string }) {
  const data = useAppData()
  const book = useCalcBook()
  if (!book) return null
  const trainings = book.trainings.filter((t) => t.moduleId === m.id)
  const done = trainings.filter((t) => data.calcDone?.[t.id]).length

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className={`h-8 w-1.5 rounded-full bg-gradient-to-b ${color}`} />
        <h2 className="text-lg font-bold text-gray-900">{m.name}</h2>
        <Link
          to={`/curriculum/${m.chapterId}`}
          className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600 transition hover:bg-indigo-100"
        >
          {m.chapterTitle} →
        </Link>
        <span className="text-xs text-gray-400">
          {done}/{trainings.length} 个训练已完成
        </span>
      </div>

      <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
        {trainings.map((t) => {
          const rec = data.calcDone?.[t.id]
          const lastAttempt = (data.calcAttempts?.[t.id] ?? [])[(data.calcAttempts?.[t.id] ?? []).length - 1]
          return (
            <Link key={t.id} to={`/calc/${t.id}`} className="card card-lift group relative flex gap-3.5 p-4">
              <div
                className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br ${color} text-white shadow-md transition-transform duration-200 group-hover:scale-105`}
              >
                <span className="text-[9px] leading-none opacity-80">第{t.no}练</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-gray-900 group-hover:text-indigo-700">
                  {t.title}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-gray-400">
                  <span className="tracking-tight text-amber-500">
                    {'★'.repeat(t.difficulty)}
                    <span className="text-gray-300">{'★'.repeat(3 - t.difficulty)}</span>
                  </span>
                  <span>{t.questions.length} 题</span>
                  <span>约 {t.minutes} 分钟</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {rec?.passed ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600">
                      ✓ 已通过{rec.passRounds && rec.passRounds > 1 ? `（${rec.passRounds} 轮）` : ''}
                    </span>
                  ) : rec ? (
                    <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-600">
                      最佳 {rec.best}/{t.questions.length} · 未通过
                    </span>
                  ) : (
                    <span className="text-[11px] text-gray-300">未开始</span>
                  )}
                  {lastAttempt && (
                    <span className="rounded-full bg-gray-100/80 px-2.5 py-0.5 text-[11px] text-gray-500">
                      最近：{lastAttempt.correct}/{lastAttempt.total} 对
                      {lastAttempt.round > 0 ? ` · 专项第 ${lastAttempt.round} 轮` : ' · 首轮'}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
