import { Link } from 'react-router-dom'
import { Badge, ProgressBar } from '../components/ui'
import { useCurriculum } from '../lib/data'
import { useAppData } from '../lib/store'

/** 章节卡片配色（按章节序号循环） */
const CHAPTER_COLORS = [
  'from-indigo-500 to-blue-500',
  'from-sky-500 to-cyan-500',
  'from-violet-500 to-purple-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
]

export default function CurriculumPage() {
  const { curriculum, error } = useCurriculum()
  const data = useAppData()

  if (error) return <div className="card p-6 text-sm text-rose-600">{error}</div>
  if (!curriculum) return <div className="card p-6 text-sm text-gray-500">正在加载课程大纲…</div>

  const totalChapters = curriculum.volumes.reduce((s, v) => s + v.chapters.length, 0)
  const totalPoints = curriculum.volumes.reduce(
    (s, v) => s + v.chapters.reduce((t, c) => t + c.sections.reduce((u, x) => u + x.points.length, 0), 0),
    0,
  )

  return (
    <div className="space-y-4">
      {/* 页面标题区：融入背景，不再套白卡 */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900">课程中心</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-500">
          依据国家中小学智慧教育平台人教版（2024）七年级数学整理，共 {totalChapters} 章 · {totalPoints}{' '}
          个知识点。每个知识点配套语音讲解课件与分层考评，融合《探究应用新思维》的探究方法。
        </p>
      </div>

      {curriculum.volumes.map((v, vi) => (
        <section key={v.id} className="space-y-4">
          {/* 卷标题：渐变强调条 */}
          <div className="flex items-center gap-3">
            <span className={`h-8 w-1.5 rounded-full bg-gradient-to-b ${CHAPTER_COLORS[vi % CHAPTER_COLORS.length]}`} />
            <h2 className="text-lg font-bold text-gray-900">{v.name}</h2>
            <span className="text-xs text-gray-400">{v.chapters.length} 章</span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {v.chapters.map((c, ci) => {
              const points = c.sections.flatMap((s) => s.points)
              const done = points.filter((p) => data.studied[p.id]).length
              const loop = data.loops[c.id]
              const color = CHAPTER_COLORS[(vi * 3 + ci) % CHAPTER_COLORS.length]
              const chapterNo = parseInt(c.no.replace(/[^0-9]/g, ''), 10) || ci + 1
              return (
                <div key={c.id} className="card card-lift group relative flex gap-3.5 p-4">
                  {/* 大编号色块 */}
                  <div
                    className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br ${color} text-white shadow-md transition-transform duration-200 group-hover:scale-105`}
                  >
                    <span className="text-[9px] font-medium leading-none tracking-widest opacity-80">第</span>
                    <span className="text-xl font-bold leading-none tabular-nums">{chapterNo}</span>
                    <span className="text-[9px] font-medium leading-none tracking-widest opacity-80">章</span>
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      {/* 拉伸链接：整卡可点 */}
                      <Link
                        to={`/curriculum/${c.id}`}
                        className="text-sm font-semibold leading-snug text-gray-900 after:absolute after:inset-0 after:rounded-[18px] after:content-[''] hover:text-indigo-700"
                      >
                        {c.title}
                      </Link>
                      {loop?.status === 'mastered' ? (
                        <Badge tone="green">✓ 已掌握</Badge>
                      ) : loop ? (
                        <Badge tone="amber">第 {loop.round} 轮提升中</Badge>
                      ) : null}
                    </div>

                    <div className="mt-0.5 text-xs text-gray-400">
                      {c.sections.length} 节 · {points.length} 个知识点
                    </div>

                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-[11px] text-gray-400">
                        <span>课件进度</span>
                        <span className="tabular-nums">
                          {done}/{points.length}
                        </span>
                      </div>
                      <ProgressBar value={done} max={points.length} />
                    </div>

                    <div className="mt-auto flex items-center gap-3 pt-3 text-xs">
                      <Link
                        to={`/exam/${c.id}`}
                        className="relative z-10 rounded-full bg-indigo-50 px-3 py-1 font-medium text-indigo-600 transition hover:bg-indigo-100"
                      >
                        章节考评 →
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
