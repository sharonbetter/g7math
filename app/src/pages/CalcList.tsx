/**
 * 副本大厅：计算专项按「关卡」分组，与战役体系对齐。
 * 每个关卡一座副本（训练组）：通关练得 XP，**首次通过 +2⚡能量**（战前准备用）。
 * 从关卡页的 ⚔️ 副本节点带 ?chapter= 深链进来，会自动定位并高亮对应副本。
 */
import { useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAppData } from '../lib/store'
import { allChapters, useCalcBook, useCurriculum } from '../lib/data'
import { gateDesign } from '../components/gate'

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
  const { curriculum } = useCurriculum()
  const [params] = useSearchParams()
  const focusChapter = params.get('chapter')
  const focusRef = useRef<HTMLDivElement | null>(null)
  const weak = useWeakSkills()

  useEffect(() => {
    if (focusChapter && focusRef.current) {
      focusRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [focusChapter, book])

  if (!book) return <div className="card p-6 text-sm text-gray-500">正在加载计算专项题库…</div>

  const chapters = allChapters(curriculum)
  const totalPassed = book.trainings.filter((t) => data.calcDone?.[t.id]?.passed).length

  /** 按章节分组的副本（只有配了计算专项的章节有） */
  const groups = [...new Set(book.trainings.map((t) => t.chapterId))].map((chapterId) => {
    const chapter = chapters.find((e) => e.chapter.id === chapterId)?.chapter
    const levelNo = chapters.findIndex((e) => e.chapter.id === chapterId) + 1
    const trainings = book.trainings.filter((t) => t.chapterId === chapterId)
    const modules = [...new Set(trainings.map((t) => t.moduleId))].map((mid) => ({
      module: book.modules.find((m) => m.id === mid),
      items: trainings.filter((t) => t.moduleId === mid),
    }))
    const done = trainings.filter((t) => data.calcDone?.[t.id]).length
    const passed = trainings.filter((t) => data.calcDone?.[t.id]?.passed).length
    return { chapterId, chapter, levelNo, modules, done, passed, total: trainings.length }
  })

  return (
    <div className="space-y-4">
      {/* 大厅头部 */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-950 via-purple-900 to-indigo-900 px-5 py-5 text-white shadow-lg md:px-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-violet-100 ring-1 ring-white/20">
              ⚔️ 副本大厅 · 计算专项
            </span>
            <h1 className="mt-3 text-xl font-bold md:text-2xl">每天刷几页，攒经验攒能量</h1>
            <p className="mt-1.5 text-xs leading-relaxed text-violet-100/80">
              每练通关 +10 XP + 答对数；<b className="text-amber-300">首次通关 +2⚡能量</b>
              ，能量去「战前准备」换思路点拨 / 回炉券 / 时间沙漏。全对且不超时才算通关。
            </p>
          </div>
          <div className="flex gap-2.5">
            <div className="rounded-2xl bg-white/10 px-4 py-2.5 ring-1 ring-white/15 backdrop-blur-sm">
              <div className="text-lg font-bold leading-none tabular-nums">{totalPassed}/{book.trainings.length}</div>
              <div className="mt-1.5 text-[11px] text-violet-100/80">通关训练</div>
            </div>
            <div className="rounded-2xl bg-amber-400/15 px-4 py-2.5 ring-1 ring-amber-300/30 backdrop-blur-sm">
              <div className="text-lg font-bold leading-none text-amber-300 tabular-nums">⚡{data.energy ?? 0}</div>
              <div className="mt-1.5 text-[11px] text-amber-100/70">当前能量</div>
            </div>
          </div>
        </div>
      </section>

      {/* 薄弱技能 */}
      {weak.length > 0 && (
        <section className="card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-gray-800">🎯 薄弱技能（错因聚合）</h2>
            <span className="text-xs text-gray-400">点技能去针对性的变式强化</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {weak.slice(0, 8).map((w) => (
              <Link
                key={w.skill}
                to={`/calc/weak/${encodeURIComponent(w.skill)}`}
                className="rounded-full border border-rose-200 bg-rose-50/60 px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:border-rose-400"
              >
                {w.name} · 错 {w.count}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 按关卡分组的副本 */}
      {groups.map((g) => {
        const focused = focusChapter === g.chapterId
        return (
          <section
            key={g.chapterId}
            ref={focused ? focusRef : undefined}
            className={`card !p-0 overflow-hidden transition ${focused ? 'ring-2 ring-amber-400' : ''}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-50 bg-gradient-to-r from-violet-50/70 to-transparent px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-2xl text-white shadow-sm">
                  ⚔️
                </span>
                <div>
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-[15px] font-bold text-gray-900">
                      {g.chapter ? `${g.chapter.no} ${g.chapter.title}` : g.chapterId} · 副本
                    </span>
                    {g.chapter && (
                      <span className="text-[11px] text-gray-400">
                        第 {g.levelNo} 关「{gateDesign(g.levelNo).name}」的支线
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-gray-500 tabular-nums">
                    {g.done}/{g.total} 已练 · <b className="text-emerald-600">{g.passed} 通关</b>
                    {g.passed === 0 && g.done > 0 && <span className="ml-1 text-amber-600">首通各 +2⚡</span>}
                  </div>
                </div>
              </div>
              <div className="w-40">
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-400 to-purple-500 transition-all"
                    style={{ width: `${g.total ? (g.done / g.total) * 100 : 0}%` }}
                  />
                </div>
                <div className="mt-1 text-right text-[10px] text-gray-400 tabular-nums">{g.done}/{g.total}</div>
              </div>
            </div>

            <div className="divide-y divide-gray-50">
              {g.modules.map(({ module, items }) => (
                <div key={module?.id ?? 'm'} className="px-5 py-3">
                  {g.modules.length > 1 && (
                    <div className="mb-1.5 text-[11px] font-semibold text-violet-500">{module?.name}</div>
                  )}
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    {items.map((t) => {
                      const rec = data.calcDone?.[t.id]
                      return (
                        <Link
                          key={t.id}
                          to={`/calc/${t.id}`}
                          className={`group flex items-center gap-3 rounded-xl border px-3.5 py-2.5 transition ${
                            rec?.passed
                              ? 'border-emerald-200 bg-emerald-50/40 hover:border-emerald-400'
                              : rec
                                ? 'border-amber-200 bg-amber-50/30 hover:border-amber-400'
                                : 'border-gray-100 hover:border-violet-300 hover:bg-violet-50/30'
                          }`}
                        >
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                              rec?.passed
                                ? 'bg-emerald-500 text-white'
                                : rec
                                  ? 'bg-amber-400 text-white'
                                  : 'bg-violet-100 text-violet-600'
                            }`}
                          >
                            {rec?.passed ? '✓' : t.no}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-gray-800">
                              第 {t.no} 练 · {t.questions.length} 题
                            </span>
                            <span className="block text-[11px] text-gray-400">
                              {rec?.passed
                                ? `已通关 · 最佳 ${rec.best}/${rec.total}`
                                : rec
                                  ? `练过 ${rec.count} 次 · 最佳 ${rec.best}/${rec.total}`
                                  : `约 ${t.minutes} 分钟 · 待通关`}
                            </span>
                          </span>
                          {!rec?.passed && (
                            <span className="shrink-0 text-[11px] font-medium text-violet-500 opacity-0 transition group-hover:opacity-100">
                              进入 →
                            </span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
