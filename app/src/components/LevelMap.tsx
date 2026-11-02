/**
 * 首页关卡地图：满屏一条从左到右的旅程。
 * 12 扇门排成一列，从晨昼走向星夜；一屏放不下，横向滑动探索，
 * 打开时自动滚到当前关卡。门沿丘陵起伏排布，门与门之间路径蜿蜒。
 * 学伴精灵「毛栗」浮在图上：平时在起点讲玩法，悬停某扇门时滑过去介绍那关。
 */
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { allChapters, useCalcBook, useCurriculum } from '../lib/data'
import { useAppData } from '../lib/store'
import { BOSS_STATES, chapterQuest } from '../lib/quests'
import type { ChapterQuest } from '../lib/quests'
import { LevelGate, WorldScenery, gateDesign } from './gate'
import type { GateState } from './gate'
import { TrailSvg } from './trail'
import type { TrailPoint } from './trail'
import { GateTransition } from './GateTransition'
import Mascot, { SpeechBubble } from './Mascot'
import { PetProfile } from './PetProfile'
import type { Chapter, Volume } from '../types'

export interface CampaignEntry {
  levelNo: number
  volume: Volume
  chapter: Chapter
  quest: ChapterQuest
  current: boolean
}

/** 全书 12 关的战役视图（含每关任务状态与当前所在关） */
export function useCampaign(): CampaignEntry[] {
  const { curriculum } = useCurriculum()
  const book = useCalcBook()
  const data = useAppData()
  const entries: CampaignEntry[] = allChapters(curriculum).map((e, i) => ({
    levelNo: i + 1,
    volume: e.volume,
    chapter: e.chapter,
    quest: chapterQuest(e.chapter, book, data),
    current: false,
  }))
  const firstOpen = entries.findIndex((e) => e.quest.state !== 'defeated')
  const cur = firstOpen === -1 ? entries.length - 1 : firstOpen
  if (entries[cur]) entries[cur] = { ...entries[cur], current: true }
  return entries
}

// ---------- 横排几何 ----------

/** 每扇门的槽位宽（px），门体 96→140px 居中 */
const SLOT = 240
const PAD_L = 100
const PAD_R = 120
const TRACK_W = PAD_L + SLOT * 12 + PAD_R
/** 门沿丘陵起伏的基线（%），随关卡波动 */
const yPctOf = (i: number) => 62 + 8 * Math.sin(i * 0.9)
const gateX = (i: number) => PAD_L + SLOT / 2 + i * SLOT

interface HoverTarget {
  entry: CampaignEntry
  x: number
  yPct: number
}

export default function LevelMap() {
  const entries = useCampaign()
  const data = useAppData()
  const [hover, setHover] = useState<HoverTarget | null>(null)
  const [profile, setProfile] = useState(false)
  const [entering, setEntering] = useState<{ levelNo: number; gateName: string; chapterId: string } | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const navigate = useNavigate()

  const currentIdx = entries.findIndex((e) => e.current)

  // 打开即定位到当前关卡
  useEffect(() => {
    const el = scrollRef.current
    if (!el || currentIdx <= 0) return
    el.scrollLeft = Math.max(0, gateX(currentIdx) - el.clientWidth * 0.4)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries.length])

  if (!entries.length) return null

  const cleared = entries.filter((e) => e.quest.state === 'defeated').length
  const currentLevel = entries[currentIdx]

  // 门与门之间插入中间点，让路径上下蜿蜒
  const pts: TrailPoint[] = []
  entries.forEach((_, i) => {
    pts.push({ x: (gateX(i) / TRACK_W) * 100, y: yPctOf(i) - 12 })
    if (i < entries.length - 1) {
      const midX = ((gateX(i) + gateX(i + 1)) / 2 / TRACK_W) * 100
      const avgY = (yPctOf(i) + yPctOf(i + 1)) / 2 - 12
      pts.push({ x: midX, y: avgY + (i % 2 === 0 ? -10 : 10) })
    }
  })

  /** 毛栗平时轮播的玩法讲解 */
  const tips = [
    '你好呀，我是学伴精灵「毛栗」🐾 每一章都是一关，把鼠标放到任意一扇门上，我带你看看那关有什么！',
    currentLevel
      ? `你现在的进度：第 ${currentLevel.levelNo} 关「${gateDesign(currentLevel.levelNo).name}」· ${currentLevel.chapter.title}，任务 ${currentLevel.quest.studiedCount}/${currentLevel.quest.points.length}。`
      : '从左边第一扇门开始吧！',
    '进入关卡后沿任务路径点亮知识节点，完成 80% 任务，守关 Boss 就会苏醒。',
    '击败 Boss（章节考评达到掌握）就通关，大门敞开透光，向右推进下一关！',
    '打不过 Boss 别灰心——先去「补给任务」回炉错题，练完再战。',
    '⚔️ 是计算副本：每天刷几页攒经验，连续学习点亮徽章！',
  ]

  /** 悬停某扇门时毛栗的讲解 */
  const introOf = (e: CampaignEntry) => {
    const q = e.quest
    const d = gateDesign(e.levelNo)
    const calcN = q.calcGroups.reduce((s, g) => s + g.total, 0)
    const boss =
      q.state === 'defeated'
        ? '🏆 已通关'
        : q.state === 'fighting'
          ? `Boss 再战中（最好 ${q.bestCorrect}/${q.bestTotal}）`
          : q.state === 'ready'
            ? '⚔️ Boss 已苏醒，可挑战'
            : `🗿 Boss 沉睡中，再完成 ${q.needPoints} 个任务即唤醒`
    return (
      <>
        <p className="font-semibold text-gray-800">
          第 {e.levelNo} 关「{d.name}」· {d.title}
        </p>
        <p className="text-gray-500">{d.note}</p>
        <p className="text-gray-500">
          {e.chapter.no} {e.chapter.title}：{q.points.length} 个知识任务
          {calcN ? ` · ${calcN} 个计算副本` : ''} · {boss}
        </p>
      </>
    )
  }

  // 毛栗位置：默认在起点上空（整组收在画面内）；悬停时滑到那扇门旁边（门低则从上方介绍，门高则从下方）
  const petLeft = hover ? Math.min(TRACK_W - 230, Math.max(230, hover.x)) : 200
  const petTop = hover ? (hover.yPct > 62 ? hover.yPct - 34 : hover.yPct + 10) : 22
  const petTail: 'top' | 'bottom' | 'none' = hover ? (hover.yPct > 62 ? 'bottom' : 'top') : 'none'

  return (
    <section className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden" style={{ height: 'calc(100dvh - 64px)' }}>
      <div ref={scrollRef} className="h-full overflow-x-auto overflow-y-hidden">
        <div className="relative h-full" style={{ width: TRACK_W }}>
          <WorldScenery />
          <TrailSvg
            pts={pts}
            doneUntil={currentIdx === -1 ? pts.length - 1 : currentIdx * 2}
            aheadClass="text-indigo-500/80"
            doneClass="text-amber-400"
          />

          {/* 世界标签（沿旅程分布） */}
          <span className="pointer-events-none absolute left-[6%] top-4 z-10 rounded-full bg-white/70 px-3 py-1 text-[11px] font-bold text-sky-700 shadow-sm backdrop-blur-sm">
            穿越之门 · 上
          </span>
          <span className="pointer-events-none absolute left-[58%] top-4 z-10 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-indigo-100 ring-1 ring-white/20 backdrop-blur-sm">
            穿越之门 · 下
          </span>

          {entries.map((entry, i) => (
            <MapGate
              key={entry.chapter.id}
              entry={entry}
              x={gateX(i)}
              yPct={yPctOf(i)}
              onHover={setHover}
              onEnter={(e) =>
                setEntering({
                  levelNo: e.levelNo,
                  gateName: gateDesign(e.levelNo).name,
                  chapterId: e.chapter.id,
                })
              }
            />
          ))}

          {/* 毛栗：浮在图上，悬停关卡时滑过去介绍 */}
          <div
            className="pointer-events-none absolute z-20 flex items-center gap-2 transition-all duration-500 ease-in-out"
            style={{ left: petLeft, top: `${petTop}%`, transform: 'translateX(-50%)' }}
          >
            <button
              className="pointer-events-auto shrink-0 rounded-full transition hover:scale-105"
              title="毛栗的冒险档案：通关的门 · 宝石 · 装备"
              onClick={() => setProfile(true)}
            >
              <Mascot className="w-24 drop-shadow-md md:w-28" />
            </button>
            <SpeechBubble
              key={hover ? hover.entry.chapter.id : 'tips'}
              messages={tips}
              text={hover ? introOf(hover.entry) : undefined}
              tail={petTail}
              dense
            />
          </div>
        </div>
      </div>

      {/* 浮动信息（不随横向滚动移动） */}
      <div className="pointer-events-none absolute left-4 top-4 z-30 flex flex-col items-start gap-2">
        <span className="rounded-full bg-white/75 px-3 py-1 text-xs font-bold text-gray-700 shadow-sm backdrop-blur-sm">
          🗺️ 关卡地图
        </span>
        <span className="rounded-full bg-emerald-50/90 px-3 py-1 text-[11px] font-medium text-emerald-600 shadow-sm tabular-nums">
          🏆 已通关 {cleared}/{entries.length}
        </span>
        <span className="rounded-full bg-amber-50/90 px-3 py-1 text-[11px] font-bold text-amber-600 shadow-sm tabular-nums">
          ⚡ 能量 {data.energy ?? 0}
        </span>
      </div>
      {currentLevel && (
        <Link
          to={`/curriculum/${currentLevel.chapter.id}`}
          onClick={(e) => {
            e.preventDefault()
            setEntering({
              levelNo: currentLevel.levelNo,
              gateName: gateDesign(currentLevel.levelNo).name,
              chapterId: currentLevel.chapter.id,
            })
          }}
          className="btn btn-primary absolute right-4 top-4 z-30 !rounded-xl !px-4 !py-2 !text-[13px] shadow-lg"
        >
          {currentLevel.quest.studiedCount > 0
            ? `继续闯关 · ${gateDesign(currentLevel.levelNo).name} →`
            : '开始闯关 →'}
        </Link>
      )}
      {profile && <PetProfile onClose={() => setProfile(false)} />}

      <span className="pointer-events-none absolute bottom-3 right-4 z-30 rounded-full bg-white/70 px-3 py-1 text-[11px] font-medium text-gray-500 shadow-sm backdrop-blur-sm">
        向右滑动，探访更雄伟的门 →
      </span>

      {/* 穿门转场 */}
      {entering && (
        <GateTransition
          level={entering.levelNo}
          gateName={entering.gateName}
          onDone={() => {
            navigate(`/curriculum/${entering.chapterId}`)
            setEntering(null)
          }}
        />
      )}
    </section>
  )
}

function MapGate({
  entry,
  x,
  yPct,
  onHover,
  onEnter,
}: {
  entry: CampaignEntry
  x: number
  yPct: number
  onHover: (h: HoverTarget | null) => void
  onEnter: (e: CampaignEntry) => void
}) {
  const { chapter, quest, levelNo, current } = entry
  const cleared = quest.state === 'defeated'
  const boss = BOSS_STATES[quest.state]
  const state: GateState = cleared ? 'open' : current ? 'active' : 'locked'
  const dark = x / TRACK_W > 0.55
  const design = gateDesign(levelNo)

  return (
    <Link
      to={`/curriculum/${chapter.id}`}
      onClick={(e) => {
        e.preventDefault()
        onEnter(entry)
      }}
      className="group absolute flex w-44 -translate-x-1/2 flex-col items-center"
      style={{ left: x, bottom: `${100 - yPct}%` }}
      onMouseEnter={() => onHover({ entry, x, yPct })}
      onMouseLeave={() => onHover(null)}
      title={`第 ${levelNo} 关「${design.name}」${design.title}——${design.note}（${chapter.title}：任务 ${quest.studiedCount}/${quest.points.length}，Boss ${boss.label}）`}
    >
      <div className="relative transition-transform duration-200 group-hover:-translate-y-1">
        {current && (
          <span className="absolute -top-6 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-white shadow">
            📍 你在这里
          </span>
        )}
        <LevelGate level={levelNo} state={state} />
        {cleared && (
          <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm shadow">
            🏆
          </span>
        )}
      </div>
      <div className={`mt-1.5 text-xs font-bold ${dark ? 'text-indigo-50' : 'text-gray-700'}`}>{design.name}</div>
      <div className={`w-full truncate text-center text-[11px] ${dark ? 'text-indigo-100/85' : 'text-gray-500'}`}>
        {chapter.title}
      </div>
      <div className={`text-[10px] ${cleared ? 'font-medium text-emerald-400' : dark ? 'text-indigo-200/70' : 'text-gray-400'}`}>
        {cleared ? '已通关' : `${boss.icon} 任务 ${quest.studiedCount}/${quest.points.length}`}
      </div>
    </Link>
  )
}
