import { Link, useParams } from 'react-router-dom'
import { useCurriculum } from '../lib/data'
import { useAppData } from '../lib/store'

const CHAPTER_COLORS = [
  'from-indigo-500 to-blue-500',
  'from-sky-500 to-cyan-500',
  'from-violet-500 to-purple-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
]

function colorOf(chapterId: string) {
  const n = parseInt(chapterId.replace(/[^0-9]/g, ''), 10) || 1
  return CHAPTER_COLORS[(n - 1) % CHAPTER_COLORS.length]
}

export default function ChapterPage() {
  const { chapterId } = useParams()
  const { curriculum } = useCurriculum()
  const data = useAppData()

  const chapter = curriculum?.volumes.flatMap((v) => v.chapters).find((c) => c.id === chapterId)
  if (!chapter) return <Empty404 />
  const color = colorOf(chapter.id)

  const points = chapter.sections.flatMap((s) => s.points)
  const done = points.filter((p) => data.studied[p.id]).length
  const loop = data.loops[chapter.id]
  const pct = points.length ? Math.round((done / points.length) * 100) : 0

  return (
    <div className="space-y-4">
      {/* 章节横幅 */}
      <section className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${color} px-5 py-5 text-white shadow-lg md:px-8`}>
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1.2px, transparent 1.2px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Link to="/curriculum" className="text-xs text-white/75 transition hover:text-white">
                ← 课程中心
              </Link>
              <h1 className="mt-1.5 text-xl font-bold tracking-tight md:text-[28px]">
                <span className="mr-2 rounded-xl bg-white/15 px-2.5 py-1 align-middle text-[15px] font-semibold ring-1 ring-white/20">
                  {chapter.no}
                </span>
                {chapter.title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/85">
                <span className="rounded-full bg-white/15 px-2.5 py-0.5 ring-1 ring-white/15">
                  {points.length} 个知识点
                </span>
                <span className="rounded-full bg-white/15 px-2.5 py-0.5 ring-1 ring-white/15">已学 {done} 个</span>
                {loop && (
                  <span className="rounded-full bg-white/15 px-2.5 py-0.5 font-medium ring-1 ring-white/15">
                    {loop.status === 'mastered' ? '✓ 已掌握' : `提升中 · 第 ${loop.round} 轮`}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to={`/exam/${chapter.id}`}
                className="btn !rounded-xl !border-white/25 !bg-white/15 !px-4 !py-2 !text-sm !text-white backdrop-blur-sm hover:!border-white/40 hover:!bg-white/20"
              >
                开始章节考评
              </Link>
              {loop && (
                <Link
                  to={`/remedial?chapter=${chapter.id}`}
                  className="btn !rounded-xl !border-white/25 !bg-white/10 !px-4 !py-2 !text-sm !text-white/90 backdrop-blur-sm hover:!border-white/40 hover:!bg-white/15"
                >
                  专项提升
                </Link>
              )}
            </div>
          </div>
          {/* 学习进度条 */}
          <div className="mt-5">
            <div className="mb-1 flex justify-between text-[11px] text-white/70">
              <span>本章节学习进度</span>
              <span className="tabular-nums">{pct}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-white transition-[width] duration-300" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </section>

      {/* 各节知识点：卡片网格 */}
      {chapter.sections.map((s, si) => (
        <section key={s.id} className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-600">
              {si + 1}
            </span>
            <h2 className="text-[15px] font-bold text-gray-900">{s.title}</h2>
            <span className="text-xs text-gray-400">{s.points.length} 个知识点</span>
          </div>

          <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
            {s.points.map((p) => {
              const studied = !!data.studied[p.id]
              return (
                <Link
                  key={p.id}
                  to={`/lesson/${p.id}`}
                  className="card card-lift group flex flex-col gap-2.5 p-4"
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                        studied ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/40' : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {studied ? '✓' : ''}
                    </span>
                    <span className="min-w-0 flex-1 text-sm font-semibold leading-snug text-gray-900 group-hover:text-indigo-700">
                      {p.name}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-xs leading-relaxed text-gray-500">{p.summary}</p>
                  <div className="mt-auto flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-gray-400">
                    <span className="tracking-tight text-amber-500">
                      {'★'.repeat(Math.max(1, Math.min(3, p.difficulty)))}
                      <span className="text-gray-300">{'★'.repeat(3 - Math.max(1, Math.min(3, p.difficulty)))}</span>
                    </span>
                    <span>约 {p.estimatedMinutes} 分钟</span>
                    {p.bookRefs?.length ? <span className="text-violet-500">《探究应用新思维》拓展</span> : null}
                    <span className="ml-auto font-medium text-indigo-500 opacity-0 transition group-hover:opacity-100">
                      学习 →
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}

function Empty404() {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-16 text-center">
      <div className="text-base font-medium text-gray-700">未找到该章节</div>
      <Link to="/curriculum" className="btn btn-primary mt-2">
        返回课程中心
      </Link>
    </div>
  )
}
