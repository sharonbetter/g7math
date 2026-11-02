/**
 * 课内微战役：把「学一课」从看课件变成一场小战斗。
 * - MissionBriefing：进场任务简报（毛栗喊话，预告这课削 Boss 几格血）
 * - FogGuardBattle：课末自测 = 迷雾守卫微战，每题一滴血；
 *   全对首过 = 完美击败（闪耀点亮 +5 XP），答错可当场重试一次，重试通过算普通击败
 * - WarReport：微战报（经验逐条入账、Boss 血条被照亮的动画、连击）
 */
import { useEffect, useRef, useState } from 'react'
import { MathText } from './MathText'
import Mascot from './Mascot'
import type { Lesson } from '../types'

// ---------- 音效（WebAudio 合成，无外部资源，失败静默） ----------

let ac: AudioContext | null = null
function tone(freq: number, dur = 0.12, type: OscillatorType = 'sine', delay = 0) {
  try {
    ac = ac ?? new AudioContext()
    const t = ac.currentTime + delay
    const o = ac.createOscillator()
    const g = ac.createGain()
    o.type = type
    o.frequency.value = freq
    g.gain.setValueAtTime(0.1, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + dur)
    o.connect(g)
    g.connect(ac.destination)
    o.start(t)
    o.stop(t + dur)
  } catch {
    /* 静音环境无妨 */
  }
}
const sfxHit = () => tone(880, 0.1, 'triangle')
const sfxMiss = () => tone(196, 0.18, 'square')
const sfxWin = () => {
  tone(523, 0.12, 'triangle')
  tone(659, 0.12, 'triangle', 0.12)
  tone(784, 0.2, 'triangle', 0.24)
}

// ---------- 迷雾守卫 ----------

function FogGuard({ hp, max, hitAt }: { hp: number; max: number; hitAt: number }) {
  const dead = hp <= 0
  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 120 90"
        className={`w-28 transition-all duration-500 ${dead ? 'scale-50 opacity-0' : ''} ${hitAt ? 'lb-hit' : ''}`}
        aria-label="迷雾守卫"
      >
        {/* 雾团身体 */}
        <path
          d="M28 78 C10 74 8 56 20 48 C14 34 28 22 42 28 C48 12 74 12 82 26 C98 20 112 34 104 48 C118 56 112 74 94 78 Z"
          fill="#4b5675"
          stroke="#37415f"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {/* 眼睛 */}
        <circle cx="46" cy="46" r="9" fill="#fff" />
        <circle cx="76" cy="46" r="9" fill="#fff" />
        <circle cx={dead ? 46 : 48} cy="48" r="4" fill="#232a44" />
        <circle cx={dead ? 76 : 74} cy="48" r="4" fill="#232a44" />
        {/* 嘴 */}
        <path d={dead ? 'M52 64 Q61 58 70 64' : 'M52 62 Q61 70 70 62'} fill="none" stroke="#232a44" strokeWidth="3" strokeLinecap="round" />
      </svg>
      {/* 血点 */}
      <div className="mt-1 flex gap-1.5">
        {Array.from({ length: max }, (_, i) => (
          <span
            key={i}
            className={`h-2.5 w-6 rounded-full transition-all duration-300 ${
              i < hp ? 'bg-rose-400' : 'bg-gray-200'
            } ${i === hp ? 'lb-burst bg-rose-300' : ''}`}
          />
        ))}
      </div>
    </div>
  )
}

// ---------- 任务简报 ----------

export function MissionBriefing({
  pointName,
  chapterTitle,
  bossQs,
  minutes,
  objectives,
  onStart,
}: {
  pointName: string
  chapterTitle: string
  bossQs: number
  minutes: number
  objectives: string[]
  onStart: () => void
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-indigo-950/70 p-4 backdrop-blur-sm">
      <div className="lb-rise w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-center gap-2 text-xs font-medium text-indigo-500">
          <span className="rounded-full bg-indigo-50 px-2.5 py-0.5">📋 任务简报</span>
          <span className="text-gray-400">{chapterTitle}</span>
        </div>
        <h2 className="mt-3 text-xl font-bold text-gray-900">本次任务：拿下「{pointName}」</h2>
        <ul className="mt-3 space-y-1.5 text-sm text-gray-600">
          <li>
            ⏱ 约 {minutes} 分钟 · 完成奖励 <b className="text-amber-600">+10 XP</b>
          </li>
          {bossQs > 0 ? (
            <li>
              👹 本章 Boss 有 <b className="text-rose-500">{bossQs} 道题</b>考它——学完这课，削掉它 {bossQs} 格血
            </li>
          ) : (
            <li>💡 学完它，你的知识版图又亮一块</li>
          )}
          <li>
            🐜 课末有 <b>迷雾守卫微战</b>：3 道题 3 滴血，全对首过 = 完美击败 ⭐ 额外 +5 XP
          </li>
        </ul>
        {objectives.length > 0 && (
          <div className="mt-3 rounded-xl bg-gray-50 px-3.5 py-2.5 text-xs leading-relaxed text-gray-500">
            <MathText className="inline" text={objectives[0]} />
          </div>
        )}
        <button className="btn btn-primary mt-5 w-full !rounded-xl !py-2.5" onClick={onStart}>
          出发 →
        </button>
      </div>
    </div>
  )
}

// ---------- 课末微战 ----------

export function FogGuardBattle({
  lesson,
  pointName,
  onWin,
}: {
  lesson: Lesson
  pointName: string
  /** perfect = 全部自评答对 */
  onWin: (perfect: boolean) => void
}) {
  const qs = lesson.checkQuestions ?? []
  const [idx, setIdx] = useState(0)
  const [hp, setHp] = useState(qs.length)
  const [draft, setDraft] = useState('')
  const [judging, setJudging] = useState(false)
  const [hitAt, setHitAt] = useState(0)
  const [perfect, setPerfect] = useState(true)
  /** 一错即锁 false（state 有渲染时序问题，用 ref 兜底） */
  const perfectRef = useRef(true)
  const [won, setWon] = useState(false)

  if (!qs.length) {
    return (
      <div className="card p-4 text-sm text-gray-400">本课没有配置随堂检测，直接点击上方按钮完成。</div>
    )
  }
  const q = qs[idx]
  const last = idx === qs.length - 1

  const advance = (_nextPerfect: boolean) => {
    if (last) {
      setWon(true)
      setPerfect(perfectRef.current)
      sfxWin()
      setTimeout(() => onWin(perfectRef.current), 900)
    } else {
      setIdx(idx + 1)
      setDraft('')
      setJudging(false)
    }
  }

  const selfRight = () => {
    sfxHit()
    setHitAt(Date.now())
    setHp((h) => Math.max(0, h - 1))
    advance(perfectRef.current)
  }
  const selfWrong = () => {
    sfxMiss()
    perfectRef.current = false
    setPerfect(false)
    advance(false)
  }

  if (won) {
    return (
      <div className="card lb-rise p-5 text-center">
        <div className="text-3xl">{perfect ? '⭐' : '⚔️'}</div>
        <div className="mt-2 text-lg font-bold text-gray-900">{perfect ? '完美击败！' : '击退迷雾守卫'}</div>
        <div className="mt-1 text-xs text-gray-400">
          {perfect ? '全部一次答对，闪耀点亮' : '有题目没答对——正常，回幻灯里再看一眼就是收获'}
        </div>
      </div>
    )
  }

  return (
    <div className="card p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-800">🐜 课末微战 · 迷雾守卫「{pointName}」</h3>
        <span className="text-xs text-gray-400 tabular-nums">
          第 {idx + 1}/{qs.length} 题 · 守卫剩 {hp} 滴血
        </span>
      </div>

      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <FogGuard hp={hp} max={qs.length} hitAt={hitAt} />
        <div className="min-w-0 flex-1">
          <div className="rounded-xl border border-gray-100 px-4 py-3">
            <MathText className="text-sm leading-relaxed text-gray-800" text={q.question} />
          </div>

          {!judging ? (
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={draft}
                autoComplete="off"
                placeholder="先在心里（或纸上）作答，可在此写关键词"
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && setJudging(true)}
              />
              <button className="btn btn-primary !py-2" onClick={() => setJudging(true)}>
                想好了，亮答案
              </button>
            </div>
          ) : (
            <div className="lb-rise mt-3 space-y-2">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3">
                <div className="text-[11px] font-medium text-emerald-600">标准答案</div>
                <MathText className="mt-1 text-sm leading-relaxed text-gray-800" text={q.answer} />
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="btn btn-primary !rounded-xl !py-2 !text-sm" onClick={selfRight}>
                  ✅ 我答对了，削它！
                </button>
                <button className="btn !rounded-xl !py-2 !text-sm" onClick={selfWrong}>
                  ❌ 没答对 / 没把握
                </button>
              </div>
              <p className="text-[11px] text-gray-300">诚实自评：对了才削血、才有闪耀；错题会进你的脑海缓存，比瞎点有用。</p>
            </div>
          )}
        </div>
      </div>
      <p className="mt-3 text-[11px] text-gray-300">全部答对 = 完美击败 ⭐（+5 XP）；有错题 = 击退守卫，普通点亮。都能通关，差别只在闪耀。</p>
    </div>
  )
}

// ---------- 副本通关战报 ----------

export function DungeonReport({
  moduleName,
  chapterTitle,
  correct,
  total,
  firstPass,
  energy,
  onAgain,
  onChapter,
  onClose,
}: {
  moduleName: string
  chapterTitle: string
  correct: number
  total: number
  /** 本训练此前从未通过（这次是首通，+2 能量） */
  firstPass: boolean
  energy: number
  onAgain: () => void
  onChapter: () => void
  onClose: () => void
}) {
  const playedRef = useRef(false)
  useEffect(() => {
    if (playedRef.current) return
    playedRef.current = true
    sfxWin()
  }, [])
  const rows = [
    { label: '副本通关', xp: 10 },
    { label: `答对 ${correct}/${total} 题`, xp: correct },
  ]
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-indigo-950/75 p-4 backdrop-blur-sm">
      <div className="lb-rise w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
        <div className="flex items-center justify-center gap-3">
          <span className="text-4xl">⚔️</span>
          <Mascot className="w-16" />
        </div>
        <div className="mt-2 text-lg font-bold text-gray-900">副本通关！</div>
        <div className="mt-0.5 text-xs text-gray-400">
          {chapterTitle} · {moduleName}
        </div>

        <div className="mt-4 space-y-1.5">
          {rows.map((r, i) => (
            <div
              key={r.label}
              className="lb-rise flex items-center justify-between rounded-xl bg-amber-50/70 px-4 py-2 text-sm"
              style={{ animationDelay: `${0.2 + i * 0.25}s` }}
            >
              <span className="text-gray-600">{r.label}</span>
              <span className="font-bold text-amber-600 tabular-nums">+{r.xp} XP</span>
            </div>
          ))}
          {firstPass && (
            <div
              className="lb-rise flex items-center justify-between rounded-xl bg-indigo-50 px-4 py-2 text-sm"
              style={{ animationDelay: '0.7s' }}
            >
              <span className="font-medium text-indigo-700">首次通关 · 能量</span>
              <span className="font-bold text-indigo-600 tabular-nums">+2 ⚡</span>
            </div>
          )}
        </div>

        <div className="mt-3 text-[11px] text-gray-400 tabular-nums">
          当前能量 ⚡{energy} · 能量可在「战前准备」购买思路点拨 / 回炉券 / 时间沙漏
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button className="btn !rounded-xl !py-2 !text-sm" onClick={onClose}>
            留在本页
          </button>
          <button className="btn !rounded-xl !py-2 !text-sm" onClick={onAgain}>
            再战本副本
          </button>
          <button className="btn btn-primary !rounded-xl !py-2 !text-sm" onClick={onChapter}>
            返回关卡 →
          </button>
        </div>
      </div>
    </div>
  )
}


export function WarReport({
  perfect,
  combo,
  bossQs,
  review = false,
  gainedPerfect = false,
  nextName,
  onContinue,
  onBack,
}: {
  perfect: boolean
  /** 本次完成所处的连击数 */
  combo: number
  bossQs: number
  /** 复习再战模式：不重复给任务经验 */
  review?: boolean
  /** 复习中此前未闪耀、这次全对：补发闪耀 */
  gainedPerfect?: boolean
  nextName?: string
  onContinue: () => void
  onBack: () => void
}) {
  const rows = review
    ? gainedPerfect
      ? [{ label: '补发闪耀 ⭐', xp: 5 }]
      : []
    : [
        { label: '任务点亮', xp: 10 },
        ...(perfect ? [{ label: '完美击败 ⭐', xp: 5 }] : []),
        ...(combo >= 3 ? [{ label: `连学 combo ×${combo}`, xp: 5 }] : []),
      ]
  const title = review ? (gainedPerfect ? '补发闪耀！' : '复习完成') : perfect ? '闪耀点亮！' : '任务完成'
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-indigo-950/75 p-4 backdrop-blur-sm">
      <div className="lb-rise w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
        <div className="text-4xl">{review ? (gainedPerfect ? '⭐' : '🔁') : perfect ? '⭐' : '⚔️'}</div>
        <div className="mt-2 text-lg font-bold text-gray-900">{title}</div>

        {/* 经验入账 */}
        {rows.length > 0 ? (
          <div className="mt-4 space-y-1.5">
            {rows.map((r, i) => (
              <div
                key={r.label}
                className="lb-rise flex items-center justify-between rounded-xl bg-amber-50/70 px-4 py-2 text-sm"
                style={{ animationDelay: `${0.25 + i * 0.3}s` }}
              >
                <span className="text-gray-600">{r.label}</span>
                <span className="font-bold text-amber-600 tabular-nums">+{r.xp} XP</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-xs text-gray-400">复习不重复计经验——手感就是奖励。</p>
        )}

        {/* Boss 血条被照亮 */}
        {bossQs > 0 && (
          <div className="mt-4">
            <div className="text-xs text-gray-500">
              👹 本章 Boss 血条被照亮 <b className="text-gray-800">-{bossQs} 格</b>
            </div>
            <div className="mt-1.5 flex justify-center gap-1">
              {Array.from({ length: bossQs }, (_, i) => (
                <span
                  key={i}
                  className="lb-cell-on h-3 w-5 rounded-sm"
                  style={{ animationDelay: `${0.5 + i * 0.18}s` }}
                />
              ))}
            </div>
          </div>
        )}
        {combo >= 3 && (
          <div className="mt-3 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-500">
            🔥 连学 {combo} 课不停歇，火 力 全 开！
          </div>
        )}

        <div className="mt-5 flex gap-2">
          <button className="btn !rounded-xl !py-2 !text-sm" onClick={onBack}>
            返回关卡
          </button>
          <button className="btn btn-primary !rounded-xl !py-2 !text-sm" onClick={onContinue}>
            {nextName ? `下一课：${nextName} →` : '查看关卡 →'}
          </button>
        </div>
      </div>
    </div>
  )
}
