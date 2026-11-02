import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { allChapters, useCalcBook, useCurriculum, useExam } from '../lib/data'
import { BOSS_STATES, WAKE_RATIO, chapterQuest } from '../lib/quests'
import type { BossState } from '../lib/quests'
import { Scenery } from '../components/gate'
import { GemBattle, GemStoneView, gemColorOf } from '../components/GemBattle'
import { gemStones } from '../lib/gems'
import { PetProfile } from '../components/PetProfile'
import { LevelGate, gateDesign } from '../components/gate'
import { TrailSvg } from '../components/trail'
import type { TrailPoint } from '../components/trail'
import Mascot from '../components/Mascot'
import { formatDuration } from '../lib/grading'
import { useAppData } from '../lib/store'

// ---------- 路径节点模型 ----------

type RowKind = 'station' | 'quest' | 'dungeon' | 'gate'

interface TrailRow {
  kind: RowKind
  key: string
  title: string
  sub?: string
  href?: string
  done?: boolean
  current?: boolean
  /** 主线任务序号 */
  no?: number
  /** 知识点的元信息 */
  pointNo?: string
  minutes?: number
  /** 课末微战全对首过：闪耀点亮 */
  shining?: boolean
  /** Boss 节点的状态 */
  bossState?: BossState
  /** Boss 节点：本关关卡号（决定门的规格） */
  bossLevel?: number
}

export default function ChapterPage() {
  const { chapterId } = useParams()
  const { curriculum } = useCurriculum()
  const book = useCalcBook()
  const data = useAppData()
  const { exam } = useExam(chapterId)

  // 路径方向检测（横屏/宽屏切横向布局）
  const [pathEl, setPathEl] = useState<HTMLDivElement | null>(null)
  /** 能量石拾取战斗（点击路径边的宝石弹出） */
  const [gem, setGem] = useState<string | null>(null)
  /** 毛栗档案（点击当前任务旁的毛栗弹出） */
  const [profile, setProfile] = useState(false)
  const [pathW, setPathW] = useState(0)
  useEffect(() => {
    if (!pathEl) return
    const ro = new ResizeObserver(() => setPathW(pathEl.clientWidth))
    ro.observe(pathEl)
    setPathW(pathEl.clientWidth)
    return () => ro.disconnect()
  }, [pathEl])

  const chapters = allChapters(curriculum)
  const idx = chapters.findIndex((e) => e.chapter.id === chapterId)
  const chapter = chapters[idx]?.chapter
  if (!chapter) return <Empty404 />

  const quest = chapterQuest(chapter, book, data)
  const boss = BOSS_STATES[quest.state]
  const nextChapter = chapters[idx + 1]?.chapter
  const examMeta = exam
    ? `${exam.questions.length} 题 · 约 ${formatDuration(exam.totalEstimatedSeconds * 1000)}`
    : '考评卷加载中'

  // ---- Boss 血条（知识迷雾）：考卷每题一格，学过的知识点会把对应血格照亮 ----
  const covRows = (exam?.questions ?? []).map((q) => {
    const ids = q.pointIds ?? []
    const studiedN = ids.filter((id) => data.studied[id]).length
    return {
      id: q.id,
      lit: ids.length > 0 && studiedN === ids.length,
      half: studiedN > 0 && studiedN < ids.length,
    }
  })
  const litCount = covRows.filter((c) => c.lit).length
  const qCountByPoint = new Map<string, number>()
  for (const q of exam?.questions ?? [])
    for (const pid of q.pointIds ?? []) qCountByPoint.set(pid, (qCountByPoint.get(pid) ?? 0) + 1)

  // ---- 构建任务列表（地铁线站点）：小节不再单独成行，课本编号放任务悬停里 ----
  const rows: TrailRow[] = []
  let no = 0
  chapter.sections.forEach((s) => {
    for (const p of s.points) {
      no += 1
      const bossQs = qCountByPoint.get(p.id) ?? 0
      rows.push({
        kind: 'quest',
        key: p.id,
        no,
        title: p.name,
        pointNo: p.no,
        minutes: p.estimatedMinutes,
        sub: bossQs > 0 ? `对应 Boss ${bossQs} 道题` : undefined,
        done: !!data.studied[p.id],
        shining: !!data.perfected?.[p.id],
        href: `/lesson/${p.id}`,
      })
    }
  })
  rows.push({
    kind: 'gate',
    key: 'gate',
    title: `守关 Boss · ${gateDesign(idx + 1).name}`,
    sub: `{${({
      sleeping: `沉睡中 · 还差 ${quest.needPoints} 个任务唤醒`,
      ready: '已苏醒',
      fighting: `再战 · 最好 ${quest.bestCorrect}/${quest.bestTotal}`,
      defeated: `第 ${quest.round} 轮通关`,
    }[quest.state])}` + ' · ' + examMeta,
    href: `/exam/${chapter.id}`,
    done: quest.state === 'defeated',
    bossState: quest.state,
    bossLevel: idx + 1,
  })
  const firstOpen = rows.findIndex((r) => r.kind === 'quest' && !r.done)
  if (firstOpen !== -1) rows[firstOpen] = { ...rows[firstOpen], current: true }
  else if (quest.state !== 'defeated') rows[rows.length - 1] = { ...rows[rows.length - 1], current: true }

  // ---- 路径布局：竖屏纵向蜿蜒；横屏/宽屏横向蜿蜒（左右推进，上下交替） ----
  const horizontal = pathW >= 620 && pathW > window.innerHeight

  const V_NODE = 220
  const V_CUR = 258
  const V_DIV = 72
  const V_GATE = 288
  const H_SLOT = 244
  const H_CUR_SLOT = 272
  const H_DIV_SLOT = 108
  const H_GATE = 300

  const slotOf = (row: TrailRow) => {
    if (row.kind === 'station') return horizontal ? H_DIV_SLOT : V_DIV
    if (row.kind === 'gate') return (horizontal ? H_GATE : V_GATE) + (row.current ? 40 : 0)
    if (row.current) return horizontal ? H_CUR_SLOT : V_CUR
    return horizontal ? H_SLOT : V_NODE
  }
  const slots = rows.map(slotOf)
  const totalMain = 28 + slots.reduce((a, b) => a + b, 0) + 28
  const totalV = slots.reduce((a, b) => a + b, 0) + 24 + 248

  type Step = { row: TrailRow; a: number; b: number; top?: number; h?: number; node: boolean }
  const steps: Step[] = []
  let m = 28
  let v = 248
  let n = 0
  rows.forEach((row, i) => {
    const slot = slots[i]
    if (horizontal) {
      const a = ((m + slot / 2) / totalMain) * 100
      const b = row.kind === 'station' ? 50 : n % 2 === 0 ? 40 : 76
      steps.push({ row, a, b, node: row.kind !== 'station' })
      m += slot
    } else {
      const a = row.kind === 'station' ? 50 : n % 2 === 0 ? 34 : 66
      steps.push({ row, a, b: (v + (row.current ? 96 : 84) / 2) / totalV * 100, top: v, h: slot, node: row.kind !== 'station' })
      v += slot
    }
    if (row.kind !== 'station') n += 1
  })
  const nodeSteps = steps.filter((st) => st.node)
  const pts: TrailPoint[] = nodeSteps.map((st) => ({ x: st.a, y: st.b }))
  const curStepIdx = steps.findIndex((st) => st.row.current)
  const doneUntil = curStepIdx === -1 ? pts.length - 1 : nodeSteps.indexOf(steps[curStepIdx])

  // ---- 能量石：散在路径节点之间（题目只含已学章节） ----
  const stones = book ? gemStones(book).filter((g) => g.levelNo === idx + 1) : []
  const pickedCount = stones.filter((g) => data.gems?.[g.id]).length
  const stonePos = stones.map((st, i) => {
    const n = nodeSteps.length
    if (n < 2) return { st, x: 50, y: 62 }
    const anchorIdx = Math.min(n - 1, Math.max(1, Math.round((n * (i + 1)) / (stones.length + 1))))
    const a = nodeSteps[anchorIdx - 1]
    const b = nodeSteps[anchorIdx]
    if (horizontal) return { st, x: (a.a + b.a) / 2, y: a.b < 50 ? 64 : 34 }
    return { st, x: a.a < 50 ? 58 : 42, y: (a.b + b.b) / 2 }
  })
  return (
    <section
      className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden"
      style={{ height: 'calc(100dvh - 64px)' }}
    >
      <Scenery variant={chapter.id.startsWith('7b') ? 'dusk' : 'day'} />

      {/* 浮动信息：左上（标题与状态） */}
      <div className="absolute left-4 top-4 z-30 max-w-[19rem]">
        <div className="flex flex-wrap items-center gap-1.5">
          <Link
            to="/"
            className="rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-medium text-gray-600 shadow-sm backdrop-blur-sm transition hover:text-indigo-600"
          >
            ← 地图
          </Link>
          <span className="rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-bold text-gray-700 shadow-sm backdrop-blur-sm">
            关卡 {idx + 1}
          </span>
          <span className="rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-medium text-gray-600 shadow-sm backdrop-blur-sm">
            {boss.icon} Boss {boss.label}
          </span>
          <span className="rounded-full bg-amber-50/90 px-2.5 py-1 text-[11px] font-medium text-amber-600 shadow-sm backdrop-blur-sm tabular-nums">
            +{quest.xp} XP
          </span>
          {stones.length > 0 && (
            <span className="rounded-full bg-cyan-50/90 px-2.5 py-1 text-[11px] font-medium text-cyan-700 shadow-sm backdrop-blur-sm tabular-nums">
              💎 {pickedCount}/{stones.length}
            </span>
          )}
        </div>
        <h1 className="mt-2 text-xl font-bold tracking-tight text-gray-900 drop-shadow-sm md:text-2xl">
          {chapter.title}
        </h1>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
          <span className="rounded-full bg-white/60 px-2 py-0.5 font-medium shadow-sm backdrop-blur-sm">
            🚩 本关任务之路 {quest.studiedCount}/{quest.points.length}
          </span>
        </div>

        {/* 进度（竖屏在左上；横屏挪到左下） */}
        {!horizontal && (
        <div className="mt-3 w-60 space-y-2">
          <div>
            <div className="mb-0.5 flex justify-between text-[10px] text-gray-400">
              <span>任务进度</span>
              <span className="tabular-nums">
                {quest.mainPct}%（{Math.round(WAKE_RATIO * 100)}% 唤醒）
              </span>
            </div>
            <div className="relative h-2 overflow-hidden rounded-full bg-white/60 shadow-sm">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${quest.mainPct}%` }} />
              <div className="absolute top-0 h-full w-0.5 bg-gray-500/50" style={{ left: `${WAKE_RATIO * 100}%` }} />
            </div>
          </div>
          {covRows.length > 0 && (
            <div>
              <div className="mb-0.5 flex justify-between text-[10px] text-gray-400">
                <span>👹 Boss 血条</span>
                <span className="tabular-nums">照亮 {litCount}/{covRows.length}</span>
              </div>
              <div className="flex h-2.5 gap-[2px] rounded-full bg-white/60 p-[2px] shadow-sm">
                {covRows.map((c, i) => (
                  <span
                    key={c.id}
                    title={`第 ${i + 1} 题${c.lit ? '（已照亮）' : c.half ? '（半亮）' : '（迷雾中）'}`}
                    className={`h-full flex-1 rounded-sm ${
                      c.lit ? 'bg-emerald-500' : c.half ? 'bg-emerald-500/40' : 'bg-gray-400/25'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        )}
      </div>

      {/* 横屏时进度挪到左下 */}
      {horizontal && (
        <div className="absolute bottom-4 left-4 z-30 w-60 space-y-2">
          <div>
            <div className="mb-0.5 flex justify-between text-[10px] text-gray-400">
              <span>任务进度</span>
              <span className="tabular-nums">
                {quest.mainPct}%（{Math.round(WAKE_RATIO * 100)}% 唤醒）
              </span>
            </div>
            <div className="relative h-2 overflow-hidden rounded-full bg-white/60 shadow-sm">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${quest.mainPct}%` }} />
              <div className="absolute top-0 h-full w-0.5 bg-gray-500/50" style={{ left: `${WAKE_RATIO * 100}%` }} />
            </div>
          </div>
          {covRows.length > 0 && (
            <div>
              <div className="mb-0.5 flex justify-between text-[10px] text-gray-400">
                <span>👹 Boss 血条</span>
                <span className="tabular-nums">照亮 {litCount}/{covRows.length}</span>
              </div>
              <div className="flex h-2.5 gap-[2px] rounded-full bg-white/60 p-[2px] shadow-sm">
                {covRows.map((c, i) => (
                  <span
                    key={c.id}
                    title={`第 ${i + 1} 题${c.lit ? '（已照亮）' : c.half ? '（半亮）' : '（迷雾中）'}`}
                    className={`h-full flex-1 rounded-sm ${
                      c.lit ? 'bg-emerald-500' : c.half ? 'bg-emerald-500/40' : 'bg-gray-400/25'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 毛栗档案 */}
      {profile && <PetProfile onClose={() => setProfile(false)} />}

      {/* 能量石拾取战斗 */}
      {gem && stones.find((g) => g.id === gem) && (
        <GemBattle stone={stones.find((g) => g.id === gem)!} onDone={() => setGem(null)} />
      )}

      {/* 任务之路 */}
      <div ref={setPathEl} className={`h-full w-full ${horizontal ? 'overflow-x-auto overflow-y-hidden' : 'overflow-y-auto'}`}>
        <div
          className="relative"
          style={horizontal ? { width: totalMain, height: '100%' } : { height: totalV }}
        >
          <TrailSvg pts={pts} doneUntil={doneUntil} aheadClass="text-slate-500/90" />
          {stonePos.map(({ st, x, y }) => {
            const picked = !!data.gems?.[st.id]
            return (
              <button
                key={st.id}
                className="absolute z-10 flex flex-col items-center transition-transform duration-200 hover:scale-110"
                style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)' }}
                title={picked ? `${gemColorOf(st).name}（已采）` : `${gemColorOf(st).name} · ${st.qs.length} 题采矿（答对得石换⚡）`}
                onClick={() => {
                  if (!picked) setGem(st.id)
                }}
              >
                <GemStoneView picked={picked} size={horizontal ? 40 : 46} color={gemColorOf(st)} />
              </button>
            )
          })}
          {steps.map((st) =>
            st.row.kind === 'station' ? (
              horizontal ? (
                <div
                  key={st.row.key}
                  className="absolute flex flex-col items-center gap-2"
                  style={{ left: `${st.a}%`, top: `${st.b}%`, transform: 'translate(-50%,-50%)' }}
                >
                  <span className="h-12 w-px bg-violet-300/70" />
                  <span className="text-[11px] font-medium text-violet-400" style={{ writingMode: 'vertical-rl' }}>
                    {st.row.title}
                  </span>
                  <span className="h-12 w-px bg-violet-300/70" />
                </div>
              ) : (
                <div
                  key={st.row.key}
                  className="absolute left-0 flex w-full items-center justify-center gap-2"
                  style={{ top: st.top ? st.top - 248 : undefined, height: st.h }}
                >
                  <span className="h-px w-8 bg-violet-300/70" />
                  <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-medium text-violet-500 shadow-sm backdrop-blur-sm">
                    {st.row.title}
                  </span>
                  <span className="h-px w-8 bg-violet-300/70" />
                </div>
              )
            ) : (
              <PathStep
                key={st.row.key}
                row={st.row}
                horizontal={horizontal}
                a={st.a}
                b={st.b}
                top={st.top != null ? st.top - 248 : undefined}
                h={st.h}
                chapterId={chapter.id}
                nextId={nextChapter?.id}
                nextNo={nextChapter?.no}
                onPetClick={() => setProfile(true)}
              />
            ),
          )}
        </div>
      </div>
    </section>
  )
}

/** 路径上的一个大节点（任务/副本）：竖屏纵向排、横屏横向排 */
function PathStep({
  row,
  horizontal,
  a,
  b,
  top,
  h,
  chapterId,
  nextId,
  nextNo,
  onPetClick,
}: {
  row: TrailRow
  horizontal: boolean
  a: number
  b: number
  top?: number
  h?: number
  chapterId: string
  nextId?: string
  nextNo?: string
  onPetClick?: () => void
}) {
  const current = !!row.current
  const done = !!row.done
  const isDungeon = row.kind === 'dungeon'
  const isGate = row.kind === 'gate'
  const size = isGate ? (current ? 168 : 152) : current ? 122 : 106
  const circleCls = isGate
    ? ''
    : done
      ? '' // 已完成 → 点亮的灯（LitNode 单独渲染）
      : current
        ? 'bg-white text-indigo-600 ring-4 ring-amber-400 shadow-lg shadow-amber-200/60'
        : 'bg-white/90 text-slate-400 ring-2 ring-dashed ring-slate-300'

  const nodeTitle = `${row.title}${row.pointNo ? `（课本 ${row.pointNo}）` : ''}${row.sub ? ` · ${row.sub}` : ''}`
  const nodeEl = isGate ? (
    <Link to={row.href!} className="relative z-10 block transition-transform duration-200 hover:scale-105" title={nodeTitle}>
      <LevelGate
        level={row.bossLevel ?? 1}
        state={done ? 'open' : row.bossState === 'sleeping' ? 'locked' : 'active'}
        size={size}
        className={current ? 'animate-pulse' : ''}
      />
      <span className="absolute -bottom-1 -right-1 flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl shadow-md ring-1 ring-slate-200">
        {{ sleeping: '🗿', ready: '👹', fighting: '🔥', defeated: '🏆' }[row.bossState ?? 'sleeping']}
      </span>
      {done && <span className="absolute -left-1 -top-1 text-2xl">🎉</span>}
    </Link>
  ) : done ? (
    <Link
      to={row.href!}
      className="node-lit relative z-10 flex items-center justify-center rounded-full"
      style={{ width: 76, height: 76 }}
      title={nodeTitle}
    >
      {/* 灯体：琥珀→翠绿渐变 */}
      <span className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-300 via-amber-200 to-amber-100" />
      {/* 白热光核 */}
      <span className="absolute inset-[26%] rounded-full bg-white/95 shadow-inner" />
      {/* 闪耀点亮：四芒星 */}
      {row.shining && (
        <svg viewBox="0 0 40 40" className="node-sparkle absolute inset-[-14%]" aria-hidden>
          <path d="M20 2 L22.5 17.5 L38 20 L22.5 22.5 L20 38 L17.5 22.5 L2 20 L17.5 17.5 Z" fill="#fff" opacity="0.95" />
        </svg>
      )}
      {/* 微光点 */}
      <span className="absolute left-[22%] top-[20%] h-1.5 w-1.5 rounded-full bg-white" />
    </Link>
  ) : (
    <Link
      to={row.href!}
      className={`relative z-10 flex items-center justify-center font-bold tabular-nums ${isDungeon ? 'rounded-[32px]' : 'rounded-full'} ${circleCls}`}
      style={{ width: size, height: size }}
      title={nodeTitle}
    >
      {isDungeon ? (
        <span className="text-5xl">⚔️</span>
      ) : (
        <span className="text-4xl">{row.no}</span>
      )}
      {current && <span className="absolute -inset-2.5 animate-ping rounded-full bg-amber-300/25" />}
    </Link>
  )

  const inner = (
    <>
      {nodeEl}
      <div className="mt-3 w-full text-center">
        <div className={`truncate text-[15px] font-semibold drop-shadow-sm ${done ? 'text-slate-400' : 'text-gray-800'}`}>{row.title}</div>
        <div className="mt-1 text-xs leading-4 text-gray-400">
          {done
            ? row.shining
              ? '⭐ 闪耀点亮'
              : isGate
                ? row.sub
                : '已完成'
            : isDungeon || isGate
              ? row.sub
              : `+10 XP · 约 ${row.minutes ?? 15} 分钟`}
        </div>
        {current && (
          <Link to={row.href!} className="btn btn-primary mt-3 !rounded-xl !px-7 !py-2.5 !text-sm shadow">
            {isGate ? (row.bossState === 'fighting' ? '🔥 再战 Boss' : '⚔️ 挑战 Boss') : '出发'} →
          </Link>
        )}
        {isGate && !current && (
          <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
            {row.bossState === 'fighting' && (
              <>
                <Link to={`/remedial?chapter=${chapterId}`} className="btn !rounded-lg !px-3 !py-1.5 !text-xs">
                  🔧 补给任务
                </Link>
                <Link to={row.href!} className="btn btn-primary !rounded-lg !px-3 !py-1.5 !text-xs">
                  🔥 再战 Boss
                </Link>
              </>
            )}
            {row.bossState === 'defeated' && nextId && (
              <Link to={`/curriculum/${nextId}`} className="btn btn-primary !rounded-lg !px-3 !py-1.5 !text-xs">
                下一关：{nextNo} →
              </Link>
            )}
            {row.bossState === 'sleeping' && (
              <Link to={row.href!} className="text-[11px] text-gray-400 underline-offset-2 hover:text-indigo-500 hover:underline">
                提前侦查 →
              </Link>
            )}
          </div>
        )}
      </div>
      {/* 毛栗：跟着当前节点走；章节通关后守在开门旁庆祝 */}
      {(current || (isGate && done)) && (
        <button
          className={`absolute top-3 z-20 hidden rounded-full transition hover:scale-110 lg:block ${a < 50 ? '-right-20' : '-left-20'}`}
          title="毛栗的冒险档案：通关的门 · 宝石 · 装备"
          onClick={onPetClick}
        >
          <Mascot className="w-14" />
        </button>
      )}
    </>
  )

  if (horizontal) {
    return (
      <div
        className="absolute flex w-52 flex-col items-center"
        style={{ left: `${a}%`, top: `${b}%`, transform: 'translate(-50%,-50%)' }}
      >
        {inner}
      </div>
    )
  }
  return (
    <div className="absolute left-0 w-full" style={{ top, height: h }}>
      <div className="absolute flex w-52 -translate-x-1/2 flex-col items-center" style={{ left: `${a}%` }}>
        {inner}
      </div>
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
