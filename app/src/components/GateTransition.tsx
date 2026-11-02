/**
 * 穿门转场：点击关卡之门后全屏展示这扇门——
 * 门洞光芒绽放、白光自门后涌入，随后穿过白光进入关卡。
 *
 * 收尾的渐变由 GatePassVeil 完成：它挂在 Layout（路由树之外），
 * 页面在白光最亮的一瞬切换，光幕再缓缓褪去露出新关卡，避免生硬跳变。
 * 点击转场可跳过。
 */
import { useEffect, useRef, useState } from 'react'
import { LevelGate } from './gate'

// ---------- 光幕事件（转场层 → 常驻 Layout 的光幕） ----------

let passListener: (() => void) | null = null

export function onGatePass(fn: () => void) {
  passListener = fn
  return () => {
    if (passListener === fn) passListener = null
  }
}

function emitGatePass() {
  passListener?.()
}

/** 常驻白光幕：页面切换瞬间全白，再渐隐露出新页面 */
export function GatePassVeil() {
  const [state, setState] = useState<'hidden' | 'cover' | 'fade'>('hidden')

  useEffect(() =>
    onGatePass(() => {
      setState('cover')
      // 下一帧再开始渐隐，确保先以全白盖住页面切换
      requestAnimationFrame(() => requestAnimationFrame(() => setState('fade')))
      setTimeout(() => setState('hidden'), 700)
    }), [])

  if (state === 'hidden') return null
  return (
    <div
      className={`pointer-events-none fixed inset-0 z-[70] transition-opacity duration-500 ease-out ${
        state === 'fade' ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        background:
          'radial-gradient(circle at 50% 46%, #ffffff 0%, #fff8e1 55%, #fde68a 100%)',
      }}
      aria-hidden
    />
  )
}

// ---------- 转场主体 ----------

export function GateTransition({
  level,
  gateName,
  onDone,
}: {
  level: number
  gateName: string
  onDone: () => void
}) {
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const t = setTimeout(() => {
      // 白光最亮的一瞬：先点亮光幕盖住切换，再换页
      emitGatePass()
      doneRef.current()
    }, reduced ? 300 : 1450)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center bg-indigo-950/85 backdrop-blur-sm"
      onClick={() => {
        emitGatePass()
        doneRef.current()
      }}
    >
      <div className="gt-gate relative">
        <LevelGate
          level={level}
          state="open"
          size={320}
          className="drop-shadow-[0_0_30px_rgba(253,224,71,0.45)]"
        />
      </div>
      <div className="gt-text mt-6 text-center">
        <div className="text-lg font-bold tracking-wide text-white md:text-xl">
          第 {level} 关 · {gateName}
        </div>
        <div className="mt-1.5 text-xs text-indigo-200/70">门开了，准备进入…（点击跳过）</div>
      </div>
      <div className="gt-flash pointer-events-none absolute inset-0" />
    </div>
  )
}
