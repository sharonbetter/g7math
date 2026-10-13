import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Card, Modal, ProgressBar } from '../components/ui'
import { allChapters, allPoints, useCurriculum } from '../lib/data'
import { isMastered } from '../lib/adaptive'
import { computeIncentives } from '../lib/incentives'
import { useAppData } from '../lib/store'

const METHOD_STEPS = [
  {
    title: '知识点讲解',
    desc: '按大纲章节观看课件，含概念、例题、易错与方法提炼，并附《探究应用新思维》拓展。',
    color: 'from-indigo-500 to-blue-500',
  },
  {
    title: '章节考评',
    desc: '选择/填空/计算/应用四类题型，由易到难，约 1 小时完成；逐题记录开始与提交时刻，自动批改。',
    color: 'from-sky-500 to-cyan-500',
  },
  {
    title: '耗时与错因分析',
    desc: '实际耗时比预计多用 1 分钟以上即标记；错题定位到知识点并给出错因。',
    color: 'from-violet-500 to-purple-500',
  },
  {
    title: '专项讲解 + 专项练习',
    desc: '针对错题与超时题生成专项课件与变式练习，循环直至无错题、无超时。',
    color: 'from-emerald-500 to-teal-500',
  },
]

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
  const earnedBadges = game.badges.filter((b) => b.earned)
  const [info, setInfo] = useState<'levels' | 'badges' | null>(null)

  return (
    <div className="space-y-4">
      {/* Hero：深色渐变横幅，数据胶囊内嵌 */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-blue-900 to-indigo-800 px-5 py-6 text-white shadow-xl shadow-indigo-900/25 md:px-7 md:py-7">
        <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-indigo-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-36 -left-20 h-80 w-80 rounded-full bg-sky-400/20 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1.2px, transparent 1.2px)',
            backgroundSize: '26px 26px',
          }}
        />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-indigo-100 ring-1 ring-white/20">
            人教版 2024 · 七上 + 七下 · 融合《探究应用新思维》
          </span>
          <h1 className="mt-3.5 text-xl font-bold tracking-tight md:text-2xl md:leading-tight">
            七年级数学学习工具
          </h1>
          <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-indigo-100/90">
            课件讲解 → 分层考评（逐题计时）→ 自动批改与错因分析 → 专项讲解与练习，循环推进直到全部掌握、没有错题与超时。
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            {[
              { label: '知识点总数', value: totalPoints || '—' },
              { label: '已学课件', value: studiedCount },
              { label: '考评轮次', value: rounds.length },
              { label: '已掌握章节', value: mastered },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl bg-white/10 px-4 py-2.5 ring-1 ring-white/15 backdrop-blur-sm"
              >
                <div className="text-lg font-bold leading-none tabular-nums">{s.value}</div>
                <div className="mt-1.5 text-[11px] text-indigo-100/80">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-7 flex flex-wrap gap-2.5">
            <Link to="/curriculum" className="btn btn-primary !rounded-xl !px-5 !py-2.5 !text-sm">
              {studiedCount > 0 ? '继续学习 →' : '开始学习 →'}
            </Link>
            <Link
              to="/exams"
              className="btn !rounded-xl !border-white/25 !bg-white/10 !px-5 !py-2.5 !text-sm !text-white backdrop-blur-sm hover:!border-white/40 hover:!bg-white/15"
            >
              进入章节考评
            </Link>
          </div>
        </div>
      </section>

      {/* 第一行：学习方法 + 学习进度 */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="p-4 md:col-span-3">
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-semibold">四步学习闭环</h2>
            <Badge tone="violet">自适应</Badge>
          </div>

          {/* 步骤轴 */}
          <div className="mt-4">
            {METHOD_STEPS.map((s, i) => (
              <div key={s.title} className="flex gap-3.5">
                <div className="flex flex-col items-center">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${s.color} text-xs font-bold text-white shadow-sm`}
                  >
                    {i + 1}
                  </span>
                  {i < METHOD_STEPS.length - 1 && (
                    <span className="mt-1 w-px flex-1 bg-gradient-to-b from-indigo-200 to-indigo-100/50" />
                  )}
                </div>
                <div className={i < METHOD_STEPS.length - 1 ? 'pb-4' : ''}>
                  <div className="text-sm font-semibold text-gray-800">{s.title}</div>
                  <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
            <Link to="/curriculum" className="btn btn-primary !py-2 !text-[13px]">
              学习课件
            </Link>
            <Link to="/exams" className="btn !py-2 !text-[13px]">
              章节考评
            </Link>
            <Link to="/remedial" className="btn !py-2 !text-[13px]">
              专项提升
            </Link>
          </div>
        </Card>

        <Card className="p-4 md:col-span-2">
          <h2 className="text-[15px] font-semibold">学习进度</h2>
          {/* 等级与徽章：轻量展示，详情弹窗 */}
          <div className="mt-4 space-y-3">
            <div
              className="flex items-center gap-3"
              title={`下一级「${game.nextLevelName}」还差 ${game.xpToNext} 经验`}
            >
              <span className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-sm shadow-indigo-500/30">
                <span className="text-[8px] font-medium leading-none tracking-widest text-indigo-100">LV</span>
                <span className="text-[15px] font-bold leading-none tabular-nums">{game.level}</span>
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-gray-800">{game.levelName}</span>
                  <span className="shrink-0 text-xs text-gray-400">{game.xp} 经验</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                    style={{ width: `${Math.min(100, Math.round((game.xpIntoLevel / Math.max(1, game.xpForNext)) * 100))}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-0.5 text-xs text-gray-500">徽章</span>
              {earnedBadges.length ? (
                earnedBadges.map((b) => (
                  <span
                    key={b.id}
                    title={`${b.name}：${b.desc}`}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 text-sm shadow-sm"
                  >
                    {b.icon}
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-400">还没有，去学第一课 / 交第一份考评就能拿到</span>
              )}
              {earnedBadges.length > 0 && (
                <span className="ml-1 text-xs text-gray-400 tabular-nums">{earnedBadges.length}/{game.badges.length}</span>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs">
              <button className="font-medium text-indigo-500 transition hover:text-indigo-700 hover:underline" onClick={() => setInfo('levels')}>
                等级说明
              </button>
              <button className="font-medium text-indigo-500 transition hover:text-indigo-700 hover:underline" onClick={() => setInfo('badges')}>
                徽章说明
              </button>
            </div>
          </div>

          {/* 学习进度 */}
          <div className="mt-4 space-y-4 border-t border-gray-100/80 pt-4">
            <div>
              <div className="mb-1.5 flex justify-between text-xs text-gray-500">
                <span>课件学习</span>
                <span className="tabular-nums">{studiedCount} / {totalPoints || '—'}</span>
              </div>
              <ProgressBar value={studiedCount} max={totalPoints || 1} />
            </div>
            <div>
              <div className="mb-1.5 flex justify-between text-xs text-gray-500">
                <span>章节掌握</span>
                <span className="tabular-nums">{mastered} / {chapters.length || '—'}</span>
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
                    className="flex items-center justify-between rounded-xl border border-gray-100/80 px-3 py-2 text-sm transition hover:border-indigo-200 hover:bg-indigo-50/40"
                  >
                    <span className="truncate text-gray-700">{r.title}</span>
                    <span className="ml-3 flex shrink-0 items-center gap-2 text-xs">
                      <span className="tabular-nums text-gray-500">{correct}/{r.answers.length} 正确</span>
                      {isMastered(r) ? <Badge tone="green">已掌握</Badge> : <Badge tone="amber">待提升</Badge>}
                    </span>
                  </Link>
                )
              })}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="text-[15px] font-semibold">教材章节一览</h2>
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
                      className="flex items-center justify-between rounded-xl border border-gray-100/80 px-3 py-2 text-sm transition hover:border-indigo-200 hover:bg-indigo-50/40"
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

      {/* 等级说明弹窗 */}
      <Modal open={info === 'levels'} title="等级说明" onClose={() => setInfo(null)}>
        <p className="mb-3 text-xs text-gray-500">
          经验来源：学 1 个知识点 +10，交一份考评卷 +20，每答对 1 题 +2，掌握一章 +50。当前 Lv.
          {game.level} {game.levelName}，累计 {game.xp} 经验。
        </p>
        <div className="space-y-2">
          {game.levels.map((lv) => (
            <div
              key={lv.level}
              className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 ${
                lv.current
                  ? 'border-indigo-200 bg-indigo-50/70'
                  : lv.reached
                    ? 'border-gray-100 bg-white'
                    : 'border-gray-100/70 bg-gray-50/40'
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold tabular-nums ${
                  lv.current
                    ? 'bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-sm'
                    : lv.reached
                      ? 'bg-indigo-100 text-indigo-600'
                      : 'bg-gray-200/70 text-gray-400'
                }`}
              >
                {lv.level}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm font-semibold ${lv.reached ? 'text-gray-800' : 'text-gray-500'}`}>
                    {lv.name}
                  </span>
                  <span className="shrink-0 text-xs text-gray-400 tabular-nums">{lv.startXp} 经验起</span>
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{lv.desc}</p>
              </div>
              {lv.current && <Badge tone="blue">当前</Badge>}
              {lv.reached && !lv.current && <span className="text-xs text-emerald-500">✓</span>}
            </div>
          ))}
        </div>
      </Modal>

      {/* 徽章说明弹窗 */}
      <Modal open={info === 'badges'} title="徽章说明" onClose={() => setInfo(null)}>
        <p className="mb-3 text-xs text-gray-500">
          徽章达成一次就永久保留。已获得 {earnedBadges.length} / {game.badges.length} 枚。
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {game.badges.map((b) => (
            <div
              key={b.id}
              className={`rounded-xl border px-3 py-2.5 ${
                b.earned ? 'border-amber-200/80 bg-amber-50/60' : 'border-gray-100/80 bg-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg ${
                    b.earned
                      ? 'bg-gradient-to-br from-amber-100 to-orange-100 shadow-sm'
                      : 'bg-gray-100/70 opacity-45 grayscale'
                  }`}
                >
                  {b.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`truncate text-[13px] font-semibold ${b.earned ? 'text-gray-800' : 'text-gray-500'}`}>
                      {b.name}
                    </span>
                    <span className="shrink-0 text-[11px] tabular-nums text-gray-400">
                      {b.current}/{b.target}
                    </span>
                  </div>
                  <div className="mt-1">
                    <ProgressBar value={b.current} max={b.target} tone={b.earned ? 'green' : 'amber'} />
                  </div>
                </div>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-gray-500">{b.desc}</p>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}
