import { Link } from 'react-router-dom'
import { Badge, Card } from '../components/ui'
import { allChapters, useCurriculum } from '../lib/data'
import { useAppData } from '../lib/store'

export default function ExamListPage() {
  const { curriculum } = useCurriculum()
  const data = useAppData()
  const chapters = allChapters(curriculum)

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <h1 className="text-lg font-semibold">章节考评</h1>
        <p className="mt-1 text-sm text-gray-500">
          每章一套考评卷，含选择题、填空题、计算题、应用题，由易到难，约 1 小时完成。
          答题时逐题记录开始与提交时刻；交卷后自动批改并生成耗时对比与错因分析。
        </p>
        <div className="mt-3 rounded-lg bg-blue-50/70 px-4 py-3 text-xs leading-relaxed text-blue-800">
          <b>计时规则：</b>每道题的<b>开始时间</b>是上一题的结束时间（第一题从点击「开始答题」算起）；
          选择题的<b>结束时间</b>是你选定并提交该题答案的时刻；填空题、计算题、应用题的结束时间是你提交答案并上传成功的时刻。
          交卷后，实际耗时比预计耗时<b>多用超过 1 分钟</b>的题目会被自动标记。
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {chapters.map(({ volume, chapter }) => {
          const loop = data.loops[chapter.id]
          const history = Object.values(data.rounds)
            .filter((r) => r.chapterId === chapter.id)
            .sort((a, b) => b.startedAt - a.startedAt)
          return (
            <Card key={chapter.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-gray-400">{volume.name}</div>
                  <div className="mt-0.5 text-[15px] font-medium text-gray-900">
                    {chapter.no} {chapter.title}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {chapter.sections.reduce((s, x) => s + x.points.length, 0)} 个知识点
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {loop?.status === 'mastered' ? (
                    <Badge tone="green">已掌握</Badge>
                  ) : loop ? (
                    <Badge tone="amber">第 {loop.round} 轮</Badge>
                  ) : (
                    <Badge>未考评</Badge>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Link to={`/exam/${chapter.id}`} className="btn btn-primary !py-1.5 !text-[13px]">
                  {history.length ? '重新考评' : '开始考评'}
                </Link>
                {loop && (
                  <Link to={`/remedial?chapter=${chapter.id}`} className="btn !py-1.5 !text-[13px]">
                    专项提升
                  </Link>
                )}
              </div>

              {history.length > 0 && (
                <div className="mt-3 border-t border-gray-100 pt-2.5">
                  <div className="mb-1.5 text-xs text-gray-400">历史记录</div>
                  <div className="space-y-1">
                    {history.slice(0, 3).map((r) => {
                      const correct = r.answers.filter((a) => a.correct).length
                      return (
                        <Link
                          key={r.id}
                          to={`/report/${r.id}`}
                          className="flex items-center justify-between rounded-md px-2 py-1 text-xs hover:bg-gray-50"
                        >
                          <span className="truncate text-gray-600">{r.title}</span>
                          <span className="ml-2 shrink-0 tabular-nums text-gray-500">
                            {correct}/{r.answers.length} · 错 {r.wrongQuestionIds.length} · 超时{' '}
                            {r.slowQuestionIds.length}
                          </span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
