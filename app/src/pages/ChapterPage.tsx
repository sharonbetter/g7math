import { Link, useParams } from 'react-router-dom'
import { Badge, Card, Empty } from '../components/ui'
import { useCurriculum } from '../lib/data'
import { useAppData } from '../lib/store'

export default function ChapterPage() {
  const { chapterId } = useParams()
  const { curriculum } = useCurriculum()
  const data = useAppData()

  const chapter = curriculum?.volumes.flatMap((v) => v.chapters).find((c) => c.id === chapterId)
  if (!chapter) return <Empty title="未找到该章节" hint="请返回课程中心重新选择。" />

  const points = chapter.sections.flatMap((s) => s.points)
  const done = points.filter((p) => data.studied[p.id]).length
  const loop = data.loops[chapter.id]

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs text-gray-400">
              <Link to="/curriculum" className="hover:text-blue-600">
                课程中心
              </Link>{' '}
              / {chapter.no}
            </div>
            <h1 className="mt-1 text-lg font-semibold">
              {chapter.no} {chapter.title}
            </h1>
            <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-500">
              <span>共 {points.length} 个知识点</span>
              <span>已学 {done} 个</span>
              {loop && (
                <Badge tone={loop.status === 'mastered' ? 'green' : 'amber'}>
                  {loop.status === 'mastered' ? '已掌握' : `提升中 · 第 ${loop.round} 轮`}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Link to={`/exam/${chapter.id}`} className="btn btn-primary">
              开始章节考评
            </Link>
            {loop && (
              <Link to={`/remedial?chapter=${chapter.id}`} className="btn">
                专项提升
              </Link>
            )}
          </div>
        </div>
      </Card>

      {chapter.sections.map((s) => (
        <Card key={s.id} className="overflow-hidden">
          <div className="border-b border-gray-100 bg-gray-50/60 px-4 py-2.5">
            <span className="text-sm font-medium text-gray-700">
              {s.no} {s.title}
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {s.points.map((p) => (
              <div key={p.id} className="flex items-start gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/lesson/${p.id}`}
                      className="text-sm font-medium text-gray-800 hover:text-blue-700"
                    >
                      {p.name}
                    </Link>
                    {p.no && p.no !== s.no && <span className="text-xs text-gray-400">{p.no}</span>}
                    {data.studied[p.id] && <Badge tone="green">已学</Badge>}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-500">{p.summary}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                    <span>难度 {'★'.repeat(Math.max(1, Math.min(3, p.difficulty)))}</span>
                    <span>· 约 {p.estimatedMinutes} 分钟</span>
                    {p.bookRefs?.length ? (
                      <span className="text-violet-500">· 拓展：{p.bookRefs.join('、')}</span>
                    ) : null}
                  </div>
                </div>
                <Link to={`/lesson/${p.id}`} className="btn !py-1.5 !text-[13px]">
                  学习
                </Link>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  )
}
