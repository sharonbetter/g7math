import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Badge, Card, Empty } from '../components/ui'
import { allPoints, useCurriculum, useExam } from '../lib/data'
import { DIFFICULTY_LABEL, TYPE_LABEL, formatDuration } from '../lib/grading'
import { makeId, saveRound, spendEnergy, useAppData } from '../lib/store'
import type { QType, Round, RoundBuffs } from '../types'

/** 战前准备的货架：只换信息、机会、体验，绝不换分数；用了都会留痕 */
const SHOP_ITEMS = [
  {
    id: 'intel',
    name: '侦察卷',
    icon: '📜',
    price: 1,
    max: 1,
    desc: '考前看穿 Boss 的知识点分布：每个知识点几道题、哪些还藏在迷雾里。',
  },
  {
    id: 'hints',
    name: '思路点拨',
    icon: '💡',
    price: 1,
    max: 3,
    desc: '考中每题可开一次思路提示。用了的题会标记「借助提示」，不影响判分但拿不到完美卷。',
  },
  {
    id: 'retries',
    name: '回炉券',
    icon: '🔄',
    price: 2,
    max: 2,
    desc: '答错的题当场换一道同构变式重做，重做对了按对计，标记「回炉」。错因当面学会。',
  },
  {
    id: 'hourglasses',
    name: '时间沙漏',
    icon: '⏳',
    price: 1,
    max: 3,
    desc: '对指定题隐藏计时、不标记超时。掌握判定仍看正误，给慢而准的你减压。',
  },
] as const

type ItemId = (typeof SHOP_ITEMS)[number]['id']

export default function ExamIntroPage() {
  const { chapterId } = useParams()
  const navigate = useNavigate()
  const { curriculum } = useCurriculum()
  const { exam, missing } = useExam(chapterId)
  const data = useAppData()
  const [pick, setPick] = useState<Record<ItemId, number>>({ intel: 0, hints: 0, retries: 0, hourglasses: 0 })
  const [insufficient, setInsufficient] = useState(false)

  const chapter = curriculum?.volumes.flatMap((v) => v.chapters).find((c) => c.id === chapterId)

  const energy = data.energy ?? 0
  const cost = pick.intel * 1 + pick.hints * 1 + pick.hourglasses * 1 + pick.retries * 2

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

  /** 该章节未完成的考评（中断续做入口） */
  const unfinished = Object.values(data.rounds)
    .filter((r) => r.kind === 'exam' && r.chapterId === chapterId && !r.finishedAt)
    .sort((a, b) => b.startedAt - a.startedAt)[0]

  const counts = (['choice', 'fill', 'calc', 'applied'] as QType[]).map((t) => ({
    type: t,
    n: exam.questions.filter((q) => q.type === t).length,
    secs: exam.questions.filter((q) => q.type === t).reduce((s, q) => s + q.estimatedSeconds, 0),
  }))

  const loop = data.loops[chapter.id]

  /** 侦察卷情报：知识点 → 题数（含是否已在迷雾中） */
  const pointsMap = allPoints(curriculum)
  const pointIntel = [...new Set(exam.questions.flatMap((q) => q.pointIds))].map((pid) => {
    const point = pointsMap.get(pid)
    const fogQs = exam.questions.filter((q) => q.pointIds.includes(pid) && !(q.pointIds ?? []).every((id) => data.studied[id])).length
    return { pid, name: point?.name ?? pid, n: exam.questions.filter((q) => q.pointIds.includes(pid)).length, fogQs }
  })

  const setCount = (id: ItemId, delta: number) => {
    setInsufficient(false)
    setPick((p) => {
      const item = SHOP_ITEMS.find((it) => it.id === id)!
      const next = Math.max(0, Math.min(item.max, p[id] + delta))
      const np = { ...p, [id]: next }
      const c = np.intel * 1 + np.hints * 1 + np.hourglasses * 1 + np.retries * 2
      if (c > energy) return p
      return np
    })
  }

  const start = () => {
    if (cost > 0 && !spendEnergy(cost)) {
      setInsufficient(true)
      return
    }
    const startedAt = Date.now()
    const hasBuffs = cost > 0
    const buffs: RoundBuffs | undefined = hasBuffs
      ? {
          intel: pick.intel > 0 || undefined,
          hints: pick.hints,
          retries: pick.retries,
          hourglasses: pick.hourglasses,
          hintUsed: [],
          retried: [],
          hourglassUsed: [],
        }
      : undefined
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
      buffs,
    }
    saveRound(round)
    navigate(`/run/${round.id}`)
  }

  return (
    <div className="space-y-4">
      {unfinished && (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-l-8 !border-l-amber-400 p-4">
          <div className="min-w-0">
            <div className="text-[15px] font-bold text-gray-900">继续上次未完成的答题</div>
            <div className="mt-0.5 text-xs text-gray-500">
              已答 {unfinished.answers.length}/{unfinished.exam.questions.length} 题 ·
              开始于 {new Date(unfinished.startedAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })} ·
              从中断的那题继续，已提交的答案都保留
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => navigate(`/run/${unfinished.id}`)}>
            继续答题 →
          </button>
        </Card>
      )}
      <Card className="p-4">
        <div className="text-xs text-gray-400">
          <Link to="/exams" className="hover:text-blue-600">
            章节考评
          </Link>{' '}
          / {chapter.no} {chapter.title}
        </div>
        <h1 className="mt-1 text-[15px] font-semibold">{exam.title}</h1>
        <p className="mt-1.5 text-sm text-gray-500">
          本卷共 {exam.questions.length} 题，预计用时 {formatDuration(exam.totalEstimatedSeconds * 1000)}
          ，建议在安静环境下一次完成。
        </p>
      </Card>

      {/* 战前准备：能量商店 */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-gray-800">⚔️ 战前准备</h2>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-600 tabular-nums">
            ⚡ 能量 {energy}
          </span>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-gray-400">
          能量来自支线与补给：
          <Link to="/calc" className="text-indigo-500 hover:underline">计算副本首次通过 +2</Link> ·
          <Link to="/remedial" className="text-indigo-500 hover:underline"> 错题回炉 +3</Link>
          。道具只换「信息、机会、体验」，不改判分；使用都会在战报中留痕。
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {SHOP_ITEMS.map((it) => {
            const n = pick[it.id]
            const disabledAdd = cost + (it.id === 'retries' ? 2 : 1) > energy || n >= it.max
            return (
              <div
                key={it.id}
                className={`rounded-xl border p-3 transition ${n > 0 ? 'border-amber-300 bg-amber-50/50' : 'border-gray-100'}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[13px] font-semibold text-gray-800">
                    {it.icon} {it.name}
                  </div>
                  <span className="text-[11px] font-medium text-amber-600 tabular-nums">
                    ⚡{it.price}/{it.id === 'retries' ? '张' : '个'}
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-gray-500">{it.desc}</p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    className="btn !rounded-lg !px-2.5 !py-1 !text-xs"
                    disabled={n <= 0}
                    onClick={() => setCount(it.id, -1)}
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm font-bold text-gray-800 tabular-nums">{n}</span>
                  <button
                    className="btn !rounded-lg !px-2.5 !py-1 !text-xs"
                    disabled={disabledAdd}
                    onClick={() => setCount(it.id, 1)}
                  >
                    +
                  </button>
                  {n >= it.max && <span className="text-[10px] text-gray-400">已选满</span>}
                </div>
              </div>
            )
          })}
        </div>

        {/* 侦察卷情报 */}
        {pick.intel > 0 && (
          <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/40 p-3">
            <div className="text-xs font-semibold text-indigo-700">📜 卷面情报 · 知识点分布</div>
            <div className="mt-2 grid gap-1 sm:grid-cols-2">
              {pointIntel.map((p) => (
                <div key={p.pid} className="flex items-center justify-between rounded-lg bg-white/80 px-2.5 py-1.5 text-xs">
                  <span className="truncate text-gray-700">{p.name}</span>
                  <span className="ml-2 shrink-0 tabular-nums text-gray-500">
                    {p.n} 题
                    {p.fogQs > 0 && <span className="ml-1 text-amber-600">（{p.fogQs} 题仍在迷雾中）</span>}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-gray-400">迷雾中的题 = 涉及你还没学过的知识点。回关卡里把对应任务点亮，Boss 血格就会照亮。</p>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-3 text-xs">
          <span className="text-gray-500">
            合计消耗 <b className="text-amber-600 tabular-nums">⚡{cost}</b>
            {cost > energy && <span className="ml-1 text-rose-500">（能量不足，去刷支线攒能量）</span>}
          </span>
          {insufficient && <span className="text-rose-500">能量不足</span>}
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4 md:col-span-2">
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

        <Card className="flex flex-col p-4">
          <h2 className="text-sm font-semibold text-gray-800">开始考评</h2>
          <ul className="mt-3 space-y-2 text-xs text-gray-600">
            <li>· 点击「开始答题」即开始计时</li>
            <li>· 中途请勿刷新页面，否则当题计时会从上次提交处延续</li>
            <li>· 交卷后立即生成耗时对比与错因分析</li>
            <li>· 无提示、无回炉、全对不超时 = ⭐ 完美卷</li>
            {loop && loop.status !== 'mastered' && (
              <li className="text-amber-600">· 本章处于第 {loop.round} 轮专项提升中</li>
            )}
          </ul>
          <div className="mt-auto pt-5">
            <button
              title={unfinished ? '注意：你有一份未完成的卷子，将另开一套新卷' : undefined}
              className="btn btn-primary w-full"
              onClick={start}
              disabled={cost > energy}
            >
              开始答题{cost > 0 ? `（消耗 ⚡${cost}）` : ''}
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
