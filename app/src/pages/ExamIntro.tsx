import { Link, useNavigate, useParams } from 'react-router-dom'
import { Badge, Card, Empty } from '../components/ui'
import { useCurriculum, useExam } from '../lib/data'
import { DIFFICULTY_LABEL, TYPE_LABEL, formatDuration } from '../lib/grading'
import { makeId, saveRound, useAppData } from '../lib/store'
import type { QType, Round } from '../types'

export default function ExamIntroPage() {
  const { chapterId } = useParams()
  const navigate = useNavigate()
  const { curriculum } = useCurriculum()
  const { exam, missing } = useExam(chapterId)
  const data = useAppData()

  const chapter = curriculum?.volumes.flatMap((v) => v.chapters).find((c) => c.id === chapterId)

  if (!chapter) return <Empty title="未找到该章节" />
  if (missing)
    return (
      <Empty
        title="该章考评卷正在生成中"
        hint={
          <>
            <div>题库数据文件（data/exams/{chapterId}.json）尚未生成。</div>
            <Link to={`/curriculum/${chapterId}`} className="text-blue-600">
              先去学习本章课件 →
            </Link>
          </>
        }
      />
    )
  if (!exam) return <Card className="p-6 text-sm text-gray-500">正在加载考评卷…</Card>

  const counts = (['choice', 'fill', 'calc', 'applied'] as QType[]).map((t) => ({
    type: t,
    n: exam.questions.filter((q) => q.type === t).length,
    secs: exam.questions.filter((q) => q.type === t).reduce((s, q) => s + q.estimatedSeconds, 0),
  }))

  const loop = data.loops[chapter.id]

  const start = () => {
    const startedAt = Date.now()
    const round: Round = {
      id: makeId(`${exam.id}-r`),
      kind: 'exam',
      round: (loop?.round ?? 0) + 1,
      chapterId: chapter.id,
      chapterTitle: `${chapter.no} ${chapter.title}`,
      title: `${chapter.no} ${chapter.title} · 章节考评`,
      examId: exam.id,
      startedAt,
      totalMs: 0,
      answers: [],
      wrongQuestionIds: [],
      slowQuestionIds: [],
      weakPointIds: [],
      exam,
    }
    saveRound(round)
    navigate(`/run/${round.id}`)
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="text-xs text-gray-400">
          <Link to="/exams" className="hover:text-blue-600">
            章节考评
          </Link>{' '}
          / {chapter.no} {chapter.title}
        </div>
        <h1 className="mt-1 text-lg font-semibold">{exam.title}</h1>
        <p className="mt-1.5 text-sm text-gray-500">
          本卷共 {exam.questions.length} 题，预计用时 {formatDuration(exam.totalEstimatedSeconds * 1000)}
          ，建议在安静环境下一次完成。
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5 md:col-span-2">
          <h2 className="text-sm font-semibold text-gray-800">试卷结构</h2>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400">
                <th className="pb-2 text-left font-normal">题型</th>
                <th className="pb-2 text-right font-normal">题量</th>
                <th className="pb-2 text-right font-normal">预计耗时</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {counts.map((c) => (
                <tr key={c.type}>
                  <td className="py-2 text-gray-700">{TYPE_LABEL[c.type]}</td>
                  <td className="py-2 text-right tabular-nums text-gray-700">{c.n} 题</td>
                  <td className="py-2 text-right tabular-nums text-gray-500">
                    {formatDuration(c.secs * 1000)}
                  </td>
                </tr>
              ))}
              <tr className="font-medium">
                <td className="py-2 text-gray-800">合计</td>
                <td className="py-2 text-right tabular-nums text-gray-800">{exam.questions.length} 题</td>
                <td className="py-2 text-right tabular-nums text-gray-800">
                  {formatDuration(exam.totalEstimatedSeconds * 1000)}
                </td>
              </tr>
            </tbody>
          </table>

          <h3 className="mt-5 text-sm font-semibold text-gray-800">难度分布</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((d) => {
              const n = exam.questions.filter((q) => q.difficulty === d).length
              if (!n) return null
              return (
                <Badge key={d} tone="blue">
                  {DIFFICULTY_LABEL[d]} {n} 题
                </Badge>
              )
            })}
            <Badge tone="violet">
              其中选自《探究应用新思维》
              {exam.questions.filter((q) => q.source?.kind === 'book').length} 题
            </Badge>
          </div>

          <div className="mt-5 rounded-lg bg-gray-50 px-4 py-3 text-xs leading-relaxed text-gray-600">
            <b className="text-gray-700">答题方式：</b>题目按顺序逐题作答，提交本题后自动进入下一题，计时连续衔接。
            选择题点击选项后点「提交本题」；填空题填写答案后点「提交答案并上传」；
            计算题与应用题需填写最终答案，并写出必要的解答过程（可拍照上传手写过程）。
          </div>
        </Card>

        <Card className="flex flex-col p-5">
          <h2 className="text-sm font-semibold text-gray-800">开始考评</h2>
          <ul className="mt-3 space-y-2 text-xs text-gray-600">
            <li>· 点击「开始答题」即开始计时</li>
            <li>· 中途请勿刷新页面，否则当题计时会从上次提交处延续</li>
            <li>· 交卷后立即生成耗时对比与错因分析</li>
            {loop && loop.status !== 'mastered' && (
              <li className="text-amber-600">· 本章处于第 {loop.round} 轮专项提升中</li>
            )}
          </ul>
          <div className="mt-auto pt-5">
            <button className="btn btn-primary w-full" onClick={start}>
              开始答题
            </button>
            {loop && (
              <Link to={`/remedial?chapter=${chapter.id}`} className="btn mt-2 w-full">
                查看专项提升
              </Link>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
