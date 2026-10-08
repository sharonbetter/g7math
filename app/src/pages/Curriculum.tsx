import { Link } from 'react-router-dom'
import { Badge, Card, ProgressBar } from '../components/ui'
import { useCurriculum } from '../lib/data'
import { useAppData } from '../lib/store'

export default function CurriculumPage() {
  const { curriculum, error } = useCurriculum()
  const data = useAppData()

  if (error) return <Card className="p-6 text-sm text-red-600">{error}</Card>
  if (!curriculum) return <Card className="p-6 text-sm text-gray-500">正在加载课程大纲…</Card>

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <h1 className="text-lg font-semibold">课程中心</h1>
        <p className="mt-1 text-sm text-gray-500">
          依据《国家中小学智慧教育平台》人教版（2024）七年级数学上、下册教学大纲整理，
          共 {curriculum.volumes.reduce((s, v) => s + v.chapters.length, 0)} 章、
          {curriculum.volumes.reduce(
            (s, v) => s + v.chapters.reduce((t, c) => t + c.sections.reduce((u, x) => u + x.points.length, 0), 0),
            0,
          )}{' '}
          个知识点。每个知识点配套课件讲解，并融合《探究应用新思维·七年级数学》的探究方法。
        </p>
      </Card>

      {curriculum.volumes.map((v) => (
        <div key={v.id} className="space-y-3">
          <h2 className="px-1 text-base font-semibold text-gray-800">{v.name}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {v.chapters.map((c) => {
              const points = c.sections.flatMap((s) => s.points)
              const done = points.filter((p) => data.studied[p.id]).length
              const loop = data.loops[c.id]
              return (
                <Card key={c.id} className="p-4 transition hover:border-blue-200">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to={`/curriculum/${c.id}`}
                        className="text-[15px] font-medium text-gray-900 hover:text-blue-700"
                      >
                        {c.no} {c.title}
                      </Link>
                      <div className="mt-1 text-xs text-gray-500">
                        {c.sections.length} 节 · {points.length} 个知识点
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {loop?.status === 'mastered' ? (
                        <Badge tone="green">已掌握</Badge>
                      ) : loop ? (
                        <Badge tone="amber">第 {loop.round} 轮提升中</Badge>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-xs text-gray-400">
                      <span>课件进度</span>
                      <span>
                        {done}/{points.length}
                      </span>
                    </div>
                    <ProgressBar value={done} max={points.length} />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Link to={`/curriculum/${c.id}`} className="btn btn-primary !py-1.5 !text-[13px]">
                      查看知识点
                    </Link>
                    <Link to={`/exam/${c.id}`} className="btn !py-1.5 !text-[13px]">
                      章节考评
                    </Link>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
