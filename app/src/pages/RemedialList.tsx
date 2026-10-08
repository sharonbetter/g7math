import { Link, useSearchParams } from 'react-router-dom'
import { Badge, Card, Empty } from '../components/ui'
import { allChapters, useCurriculum } from '../lib/data'
import { formatDuration } from '../lib/grading'
import { useAppData } from '../lib/store'

export default function RemedialListPage() {
  const { curriculum } = useCurriculum()
  const data = useAppData()
  const [params] = useSearchParams()
  const filter = params.get('chapter')
  const chapters = allChapters(curriculum).filter(({ chapter }) => !filter || chapter.id === filter)

  const withRounds = chapters
    .map(({ volume, chapter }) => {
      const rounds = Object.values(data.rounds)
        .filter((r) => r.chapterId === chapter.id)
        .sort((a, b) => a.startedAt - b.startedAt)
      return { volume, chapter, rounds, loop: data.loops[chapter.id] }
    })
    .filter((x) => x.rounds.length > 0)

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <h1 className="text-lg font-semibold">专项提升</h1>
        <p className="mt-1 text-sm text-gray-500">
          每次考评或专项练习后，系统会把「做错的题」与「实际耗时比预计多用 1 分钟以上的题」汇总为待提升问题，
          生成专项讲解课件与专项练习。循环进行「分析 → 专项讲解 → 专项练习」，直到没有错题与耗时问题。
        </p>
      </Card>

      {withRounds.length === 0 ? (
        <Empty
          title="还没有可提升的记录"
          hint={
            <>
              先完成一次章节考评，系统会自动分析错题与耗时问题。
              <div className="mt-3">
                <Link to="/exams" className="btn btn-primary">
                  去章节考评
                </Link>
              </div>
            </>
          }
        />
      ) : (
        withRounds.map(({ volume, chapter, rounds, loop }) => (
          <Card key={chapter.id} className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs text-gray-400">{volume.name}</div>
                <div className="text-[15px] font-medium text-gray-900">
                  {chapter.no} {chapter.title}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {loop?.status === 'mastered' ? (
                  <Badge tone="green">已掌握</Badge>
                ) : loop ? (
                  <Badge tone="amber">
                    第 {loop.round} 轮 · 待提升 {loop.weakPointIds.length} 个知识点
                  </Badge>
                ) : null}
                <Link to={`/exam/${chapter.id}`} className="btn !py-1.5 !text-[13px]">
                  重新考评
                </Link>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {rounds.map((r) => {
                const correct = r.answers.filter((a) => a.correct).length
                const cleared = r.wrongQuestionIds.length === 0 && r.slowQuestionIds.length === 0
                return (
                  <div
                    key={r.id}
                    className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-100 px-4 py-2.5"
                  >
                    <span className="flex h-6 shrink-0 items-center rounded-md bg-gray-100 px-2 text-xs font-medium text-gray-600">
                      第 {r.round} 轮
                    </span>
                    <Badge tone={r.kind === 'exam' ? 'blue' : 'violet'}>
                      {r.kind === 'exam' ? '章节考评' : '专项练习'}
                    </Badge>
                    <span className="min-w-0 flex-1 truncate text-sm text-gray-700">{r.title}</span>
                    <span className="text-xs tabular-nums text-gray-500">
                      {correct}/{r.answers.length} 正确 · 错 {r.wrongQuestionIds.length} · 超时{' '}
                      {r.slowQuestionIds.length} · 用时 {formatDuration(r.totalMs || 0)}
                    </span>
                    {cleared ? <Badge tone="green">已通过</Badge> : <Badge tone="amber">待提升</Badge>}
                    <div className="flex gap-1.5">
                      <Link to={`/report/${r.id}`} className="btn !py-1 !text-xs">
                        报告
                      </Link>
                      <Link to={`/remedial/${r.id}`} className="btn !py-1 !text-xs">
                        专项讲解
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        ))
      )}
    </div>
  )
}
