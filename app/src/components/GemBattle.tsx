/**
 * 能量石：散在关卡路径边的矿石。
 * GemStoneView —— 鹅卵石形的晶石（未采：青光流转；已采：灰石 + ✓）
 * GemBattle   —— 采矿战：一次一题、顶部倒计时进度条；
 *   答对 +1 石并连击（连对第 3/4/5 题当场追加 +3/+4/+5 石）；
 *   超时或答错拿不到该题的石头（不扣已有），连击清零，继续下一题。
 *   5 题打完结算，总石数 = 能量。
 */
import { useEffect, useRef, useState } from 'react'
import { MathText } from './MathText'
import { answersMatch } from '../lib/answers'
import { markGem } from '../lib/store'
import type { GemStone } from '../lib/gems'

/** 宝石色盘：颜色由石头派生，同一路径上的石头颜色各不相同 */
export interface GemColor {
  name: string
  deep: string
  mid: string
  light: string
  glow: string // rgb 三元组，用于光晕
}

const GEM_COLORS: GemColor[] = [
  { name: '青晶石', deep: '#0e7490', mid: '#22d3ee', light: '#a5f3fc', glow: '34,211,238' },
  { name: '紫晶石', deep: '#6b21a8', mid: '#a78bfa', light: '#ddd6fe', glow: '167,139,250' },
  { name: '翡翠石', deep: '#047857', mid: '#34d399', light: '#a7f3d0', glow: '52,211,153' },
  { name: '琥珀石', deep: '#b45309', mid: '#fbbf24', light: '#fde68a', glow: '251,191,36' },
  { name: '玫红石', deep: '#9f1239', mid: '#fb7185', light: '#fecdd3', glow: '251,113,133' },
]

/** 稳定取色：同一路径上的多颗石头颜色错开 */
export function gemColorOf(stone: { levelNo: number; no: number }): GemColor {
  return GEM_COLORS[(stone.levelNo * 31 + stone.no * 7) % GEM_COLORS.length]
}

// ---------- 音效 ----------
let ac: AudioContext | null = null
function tone(freq: number, dur = 0.12, type: OscillatorType = 'triangle', delay = 0) {
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

export function GemStoneView({
  picked,
  size = 46,
  color,
}: {
  picked: boolean
  size?: number
  color?: GemColor
}) {
  const c = color ?? GEM_COLORS[0]
  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      {!picked && <span className="gem-glow absolute inset-[-5px] rounded-full" style={{ '--gem-glow-c': c.glow } as React.CSSProperties} />}
      <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
        {/* 鹅卵石轮廓（不规则圆角） */}
        <path
          d="M20 5.5 C28 4 35 10 34.5 19.5 C34 29 29.5 35.5 20 35.5 C10.5 35.5 5.5 30 5.5 20 C5.5 11 12 7 20 5.5 Z"
          fill={picked ? '#cbd5e1' : c.deep}
          stroke={picked ? '#94a3b8' : c.deep}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* 石面斑纹 */}
        <path
          d="M12 14 C16 11 24 11 28 14 C30 16 29 19 26 19.5 C22 20.5 14 20 11.5 17.5 C10.5 16 10.8 14.8 12 14 Z"
          fill={picked ? '#e2e8f0' : c.mid}
          opacity="0.85"
        />
        <ellipse cx="15.5" cy="26" rx="4.5" ry="3" fill={picked ? '#e2e8f0' : c.mid} opacity="0.6" />
        <ellipse cx="14" cy="12.5" rx="3" ry="2" fill="#ffffff" opacity={picked ? 0.35 : 0.85} />
        <circle cx="27" cy="27" r="1.6" fill={picked ? '#f1f5f9' : c.light} opacity="0.9" />
      </svg>
      {picked && (
        <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow">
          ✓
        </span>
      )}
    </span>
  )
}

type Phase = 'ask' | 'right' | 'wrong' | 'timeout' | 'done'

export function GemBattle({ stone, onDone }: { stone: GemStone; onDone: () => void }) {
  const color = gemColorOf(stone)
  const total = stone.qs.length
  const [idx, setIdx] = useState(0)
  const [input, setInput] = useState('')
  const [phase, setPhase] = useState<Phase>('ask')
  const [gems, setGems] = useState(0)
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [flash, setFlash] = useState('')
  const [remain, setRemain] = useState(1) // 剩余时间比例 0~1
  const startRef = useRef(Date.now())
  const q = stone.qs[idx]
  const limit = q?.est ?? 45

  // 每题倒计时
  useEffect(() => {
    if (phase !== 'ask') return
    startRef.current = Date.now()
    const iv = setInterval(() => {
      const r = 1 - (Date.now() - startRef.current) / (limit * 1000)
      if (r <= 0) {
        setRemain(0)
        setPhase('timeout')
        setCombo(0)
        tone(196, 0.2, 'square')
      } else setRemain(r)
    }, 100)
    return () => clearInterval(iv)
  }, [idx, phase, limit])

  // 中场反馈后自动进下一题
  useEffect(() => {
    if (phase !== 'right' && phase !== 'wrong' && phase !== 'timeout') return
    const t = setTimeout(() => {
      if (idx + 1 >= total) {
        setPhase('done')
        markGem(stone.id, gems)
        if (gems > 0) {
          tone(523, 0.12)
          tone(659, 0.12, 'triangle', 0.1)
          tone(784, 0.2, 'triangle', 0.2)
        }
      } else {
        setIdx(idx + 1)
        setInput('')
        setPhase('ask')
      }
    }, phase === 'right' ? 850 : 1400)
    return () => clearTimeout(t)
  }, [phase, idx, total, gems, stone.id])

  const submit = () => {
    if (phase !== 'ask' || !input.trim()) return
    if (answersMatch(input, q.answer, q.accepted)) {
      const nextCombo = combo + 1
      let gain = 1
      let msg = '+1 💎'
      if (nextCombo >= 3) {
        gain += nextCombo
        msg = `+${gain} 💎 连对 ×${nextCombo}！`
        tone(660 + nextCombo * 60, 0.15)
      } else tone(880, 0.1)
      setCombo(nextCombo)
      setMaxCombo((m) => Math.max(m, nextCombo))
      setGems((g) => g + gain)
      setFlash(msg)
      setPhase('right')
    } else {
      setCombo(0)
      setFlash('没拿到的这块石头飞走了…')
      setPhase('wrong')
      tone(196, 0.18, 'square')
    }
  }

  if (phase === 'done') {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-cyan-950/70 p-4 backdrop-blur-sm">
        <div className="lb-rise w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
          <div className="flex flex-wrap justify-center gap-1.5">
            {Array.from({ length: Math.min(gems, 12) }, (_, i) => (
              <span key={i} className="lb-rise" style={{ animationDelay: `${i * 0.06}s` }}>
                <GemStoneView picked={false} size={i === 0 ? 46 : 30} color={GEM_COLORS[(stone.levelNo + i) % GEM_COLORS.length]} />
              </span>
            ))}
          </div>
          <div className="mt-3 text-lg font-bold text-cyan-700">采到 {gems} 块能量石</div>
          <div className="lb-rise mt-2 inline-block rounded-xl bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-600" style={{ animationDelay: '0.3s' }}>
            +{gems} ⚡ 能量
          </div>
          <div className="mt-2 text-xs text-gray-400">
            最高连对 ×{maxCombo}
            {maxCombo >= 3 ? '（连击奖励已计入）' : '（连对 3 题起有额外奖励，再试试）'}
          </div>
          <p className="mt-1 text-[11px] text-gray-300">能量可在「战前准备」换思路点拨 / 回炉券 / 时间沙漏</p>
          <button className="btn btn-primary mt-4 !rounded-xl !py-2 !text-sm" onClick={onDone}>
            继续探索 →
          </button>
        </div>
      </div>
    )
  }

  const barColor = remain > 0.5 ? 'bg-cyan-400' : remain > 0.25 ? 'bg-amber-400' : 'bg-rose-500'

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-cyan-950/70 p-4 backdrop-blur-sm">
      <div className="lb-rise w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        {/* 头部：进度与连击 */}
        <div className="flex items-center justify-between">
          <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: `${color.mid}22`, color: color.deep }}>
            💎 {color.name} · 第 {idx + 1}/{total} 题
          </span>
          <span className={`text-xs font-bold tabular-nums ${combo >= 3 ? 'text-rose-500' : 'text-gray-400'}`}>
            {combo >= 2 ? `🔥 连对 ×${combo}` : `已采 ${gems} 块`}
          </span>
        </div>

        {/* 倒计时进度条 */}
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full transition-[width] duration-100 ease-linear ${barColor}`}
            style={{ width: `${Math.max(0, remain * 100)}%` }}
          />
        </div>
        <div className="mt-1 text-right text-[10px] text-gray-400 tabular-nums">
          {phase === 'ask' ? `${Math.ceil(remain * limit)}s` : phase === 'timeout' ? '时间到' : ''}
        </div>

        {/* 题目（一次只显示一题） */}
        {q && (
          <div
            className={`mt-2 rounded-2xl border px-4 py-4 transition-colors ${
              phase === 'right'
                ? 'border-emerald-300 bg-emerald-50/60'
                : phase === 'wrong'
                  ? 'border-rose-300 bg-rose-50/60'
                  : phase === 'timeout'
                    ? 'border-amber-300 bg-amber-50/60'
                    : 'border-gray-100'
            }`}
          >
            <MathText className="text-[15px] leading-relaxed text-gray-900" text={q.stem} />
            {phase === 'ask' && (
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  autoFocus
                  autoComplete="off"
                  placeholder="答案"
                  className="flex-1"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                />
                <button className="btn btn-primary !py-2 !text-sm" disabled={!input.trim()} onClick={submit}>
                  提交
                </button>
              </div>
            )}
            {phase === 'right' && (
              <div className="lb-rise mt-3 text-center text-sm font-bold text-emerald-600">
                ✓ 答对 {flash}
              </div>
            )}
            {(phase === 'wrong' || phase === 'timeout') && (
              <div className="lb-rise mt-3 text-center text-sm">
                <span className="font-bold text-rose-500">{phase === 'timeout' ? '⏱ 时间到' : '✕ 答错'}</span>
                <span className="ml-1.5 text-gray-500">
                  这块没拿到 · 应为 <MathText className="inline font-semibold" text={q.answer} />
                </span>
              </div>
            )}
          </div>
        )}

        <p className="mt-3 text-center text-[11px] text-gray-300">
          答对 +1 💎，连对第 3/4/5 题当场追加 +3/+4/+5；超时或答错不扣，连击清零
        </p>
      </div>
    </div>
  )
}
