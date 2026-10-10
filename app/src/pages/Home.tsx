import { Link } from 'react-router-dom'
import { Badge, Card, ProgressBar, Stat } from '../components/ui'
import { allChapters, allPoints, useCurriculum } from '../lib/data'
import { isMastered } from '../lib/adaptive'
import { computeIncentives } from '../lib/incentives'
import { useAppData } from '../lib/store'

export default function HomePage() {
  const { curriculum } = useCurriculum()
  const data = useAppData()
  const chapters = allChapters(curriculum)
  const points = allPoints(curriculum)

  const rounds = Object.values(data.rounds)
  const studiedCount = Object.keys(data.studied).length
  const mastered = Object.values(data.loops).filter((l) => l.status === 'mastered').length
  const totalPoints = points.size
  const game = computeIncentives(data)
  const dailyPct = Math.min(100, Math.round((game.todayXp / game.dailyGoal) * 100))

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-6 text-white">
          <h1 className="text-xl font-semibold">七年级数学学习工具</h1>
          <p className="mt-1.5 max-w-3xl text-sm text-blue-50">
            依据国家中小学智慧教育平台人教版（2024）七年级上、下册教学大纲设计知识点课件；
            融合《探究应用新思维·七年级数学》的探究方法；提供分层考评、逐题计时、自动批改、
            错因分析与专项讲解—专项练习的自适应循环。
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 px-5 py-4 md:grid-cols-4">
          <Stat label="知识点总数" value={totalPoints || '—'} hint="人教版 2024 七上 + 七下" />
          <Stat label="已学课件" value={studiedCount} hint={`共 ${totalPoints || '—'} 个`} tone="blue" />
          <Stat label="考评轮次" value={rounds.length} hint="含章节考评与专项练习" />
          <Stat label="已掌握章节" value={mastered} hint="无错题且无超时" tone="green" />
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-5">
        {/* 等级：一条累积进度，只关心当前与下一级 */}
        <Card className="p-5 md:col-span-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold">学习等级</h2>
            <span className="text-xs text-gray-400">经验累积，长期有效</span>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-blue-600 text-white">
              <span className="text-[10px] leading-none opacity-80">LV</span>
              <span className="text-2xl font-semibold leading-tight tabular-nums">{game.level}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-base font-semibold text-gray-900">{game.levelName}</div>
              <div className="mt-1 flex justify-between text-xs text-gray-500">
                <span>累计 {game.xp} 经验</span>
                <span>{game.xpIntoLevel} / {game.xpForNext}</span>
              </div>
              <div className="mt-1.5">
                <ProgressBar value={game.xpIntoLevel} max={game.xpForNext} />
              </div>
              <div className="mt-1.5 text-xs text-gray-500">
                距 Lv.{game.level + 1} {game.nextLevelName} 还差 {game.xpToNext} 经验
              </div>
            </div>
          </div>

          {/* 等级阶梯：只标节点，不做成一堆卡片 */}
          <div className="mt-5 flex items-center">
            {game.levels.map((lv, i) => (
              <div key={lv.level} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium tabular-nums ${
                      lv.current
                        ? 'bg-blue-600 text-white ring-2 ring-blue-200'
                        : lv.reached
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {lv.level}
                  </span>
                  <span className={`mt-1 w-14 text-center text-[10px] leading-tight ${lv.current ? 'font-medium text-blue-700' : 'text-gray-400'}`}>
                    {lv.name}
                  </span>
                </div>
                {i < game.levels.length - 1 && (
                  <div className={`mx-1 mb-4 h-0.5 flex-1 ${lv.reached ? 'bg-blue-200' : 'bg-gray-100'}`} />
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-gray-100 px-3 py-2">
              <div className="text-xs text-gray-500">连续学习</div>
              <div className={`mt-0.5 text-lg font-semibold tabular-nums ${game.studiedToday ? 'text-green-600' : 'text-amber-600'}`}>
                {game.streak} 天
              </div>
              <div className="text-xs text-gray-400">{game.studiedToday ? '今天已打卡' : '今天还没学习'}</div>
            </div>
            <div className="rounded-lg border border-gray-100 px-3 py-2">
              <div className="text-xs text-gray-500">今日目标</div>
              <div className="mt-0.5 text-lg font-semibold tabular-nums text-gray-900">
                {game.todayXp} <span className="text-sm font-normal text-gray-400">/ {game.dailyGoal}</span>
              </div>
              <div className="mt-1">
                <ProgressBar value={game.todayXp} max={game.dailyGoal} tone={dailyPct >= 100 ? 'green' : 'amber'} />
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-400">
            {dailyPct >= 100
              ? '今天的目标完成了，明天再来连续天数会接着涨。'
              : '学 1 个知识点 +10，交一份考评卷 +20，每答对 1 题 +2，掌握一章 +50。'}
          </p>
          <Link to="/curriculum" className="btn btn-primary mt-4">
            {game.todayXp > 0 ? '继续学习，把今天的目标做完' : '开始学习，拿今天的经验'}
          </Link>
        </Card>

        {/* 徽章：一次性成就，与等级是两回事 */}
        <Card className="p-5 md:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">成就徽章</h2>
              <span className="text-xs text-gray-400">达成一次就永久保留</span>
            </div>
            <span className="text-sm font-semibold text-amber-600 tabular-nums">
              {game.earnedCount}<span className="text-gray-400">/{game.badges.length}</span>
            </span>
          </div>

          {game.nextBadges.length > 0 && (
            <div className="mt-4">
              <div className="text-xs font-medium text-gray-500">离你最近的三枚</div>
              <div className="mt-2 space-y-2">
                {game.nextBadges.map((b) => (
                  <div key={b.id} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{b.icon}</span>
                      <span className="flex-1 text-sm font-medium text-gray-900">{b.name}</span>
                      <span className="text-xs text-amber-700 tabular-nums">
                        {b.current}/{b.target}
                      </span>
                    </div>
                    <div className="mt-1.5">
                      <ProgressBar value={b.current} max={b.target} tone={b.pct >= 60 ? 'green' : 'amber'} />
                    </div>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <span className="text-xs text-gray-500">
                        {b.remaining > 0 ? `还差 ${b.remaining} 就能拿到` : '马上就能拿到'}
                      </span>
                      <Link to={b.action === 'curriculum' ? '/curriculum' : b.action === 'exams' ? '/exams' : '/remedial'} className="text-xs font-medium text-blue-700 hover:underline">
                        {b.actionLabel} →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <details className="mt-4">
            <summary className="cursor-pointer text-xs font-medium text-gray-500">
              全部 {game.badges.length} 枚徽章
            </summary>
            <div className="mt-2 space-y-2">
              {game.badges.map((b) => (
                <div
                  key={b.id}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${
                    b.earned ? 'border-amber-200 bg-amber-50' : 'border-gray-100'
                  }`}
                >
                  <span className={`text-xl ${b.earned ? '' : 'opacity-30 grayscale'}`}>{b.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className={`text-sm font-medium ${b.earned ? 'text-gray-900' : 'text-gray-400'}`}>{b.name}</div>
                    <div className="text-xs text-gray-500">{b.desc}</div>
                  </div>
                  {b.earned ? (
                    <span className="shrink-0 text-xs text-amber-600">已获得</span>
                  ) : (
                    <span className="shrink-0 text-xs text-gray-300">未达成</span>
                  )}
                </div>
              ))}
            </div>
          </details>

          <Link to="/progress" className="btn mt-4">
            查看学习报告
          </Link>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold">四步学习闭环</h2>
            <Badge tone="violet">自适应</Badge>
          </div>
          <ol className="mt-3 space-y-2 text-sm text-gray-600">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">1</span>
              <span><b className="text-gray-800">知识点讲解</b>：按大纲章节观看课件，含概念、例题、易错与方法提炼，并附《探究应用新思维》拓展。</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">2</span>
              <span><b className="text-gray-800">章节考评</b>：选择/填空/计算/应用四类题型，由易到难，约 1 小时完成；逐题记录开始与提交时刻，自动批改。</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">3</span>
              <span><b className="text-gray-800">耗时与错因分析</b>：实际耗时比预计多用 1 分钟以上即标记；错题定位到知识点并给出错因。</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">4</span>
              <span><b className="text-gray-800">专项讲解 + 专项练习</b>：针对错题与超时题生成专项课件与变式练习，循环直至无错题、无超时。</span>
            </li>
          </ol>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/curriculum" className="btn btn-primary">开始学习课件</Link>
            <Link to="/exams" className="btn">进入章节考评</Link>
            <Link to="/remedial" className="btn">专项提升</Link>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-base font-semibold">学习进度</h2>
          <div className="mt-4 space-y-4">
            <div>
              <div className="mb-1.5 flex justify-between text-xs text-gray-500">
                <span>课件学习</span>
                <span>{studiedCount} / {totalPoints || '—'}</span>
              </div>
              <ProgressBar value={studiedCount} max={totalPoints || 1} />
            </div>
            <div>
              <div className="mb-1.5 flex justify-between text-xs text-gray-500">
                <span>章节掌握</span>
                <span>{mastered} / {chapters.length || '—'}</span>
              </div>
              <ProgressBar value={mastered} max={chapters.length || 1} tone="green" />
            </div>
          </div>

          <h3 className="mt-5 text-sm font-semibold text-gray-700">最近的考评</h3>
          <div className="mt-2 space-y-2">
            {rounds.length === 0 && (
              <p className="text-sm text-gray-400">还没有考评记录，去「章节考评」做一套吧。</p>
            )}
            {rounds
              .sort((a, b) => b.startedAt - a.startedAt)
              .slice(0, 4)
              .map((r) => {
                const correct = r.answers.filter((a) => a.correct).length
                return (
                  <Link
                    key={r.id}
                    to={`/report/${r.id}`}
                    className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm hover:border-blue-200 hover:bg-blue-50/40"
                  >
                    <span className="truncate text-gray-700">{r.title}</span>
                    <span className="ml-3 flex shrink-0 items-center gap-2 text-xs">
                      <span className="text-gray-500">{correct}/{r.answers.length} 正确</span>
                      {isMastered(r) ? <Badge tone="green">已掌握</Badge> : <Badge tone="amber">待提升</Badge>}
                    </span>
                  </Link>
                )
              })}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="text-base font-semibold">教材章节一览</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          {curriculum?.volumes.map((v) => (
            <div key={v.id}>
              <div className="mb-2 text-sm font-medium text-gray-700">{v.name}</div>
              <div className="grid gap-1.5">
                {v.chapters.map((c) => {
                  const loop = data.loops[c.id]
                  return (
                    <Link
                      key={c.id}
                      to={`/curriculum/${c.id}`}
                      className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm hover:border-blue-200 hover:bg-blue-50/40"
                    >
                      <span className="text-gray-700">
                        {c.no} {c.title}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-400">
                          {c.sections.reduce((s, x) => s + x.points.length, 0)} 个知识点
                        </span>
                        {loop?.status === 'mastered' && <Badge tone="green">已掌握</Badge>}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
