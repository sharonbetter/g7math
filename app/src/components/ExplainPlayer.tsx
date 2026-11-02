import { useCallback, useEffect, useRef, useState } from 'react'
import { MathText } from './MathText'
import type { ExplainBlock, ExplainScene } from '../lib/explain'

/**
 * 错题讲解播放器：运行时场景 + 按需 TTS（/api/tts）。
 * 视觉语言与知识点动画课件一致：深色舞台、卡片、随语音逐块揭示。
 */
const TONE: Record<string, string> = {
  gold: 'border-amber-400/40 bg-amber-400/10',
  green: 'border-emerald-400/35 bg-emerald-400/10',
  red: 'border-rose-400/35 bg-rose-400/10',
  violet: 'border-violet-400/35 bg-violet-400/10',
  blue: 'border-sky-400/35 bg-sky-400/10',
  plain: 'border-slate-500/30 bg-slate-500/10',
}

function Block({ b, shown, idx }: { b: ExplainBlock; shown: boolean; idx: number }) {
  const tone = TONE[b.tone ?? 'plain']
  return (
    <div
      className={`rounded-2xl border px-5 py-3.5 transition-all duration-700 ${tone}`}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : 'translateY(22px)',
        pointerEvents: shown ? 'auto' : 'none',
        animationDelay: `${idx * 60}ms`,
      }}
    >
      {b.kind === 'answers' ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-center">
            <div className="text-xs text-rose-300">你的答案</div>
            <div className="mt-1 text-xl font-black text-rose-300">{b.userAnswer}</div>
          </div>
          <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-center">
            <div className="text-xs text-emerald-300">正确答案</div>
            <div className="mt-1 text-xl font-black text-emerald-300">{b.correctAnswer}</div>
          </div>
        </div>
      ) : b.kind === 'steps' ? (
        <div>
          {b.title && <div className="mb-1.5 text-sm font-bold text-emerald-300">{b.title}</div>}
          <ol className="space-y-1.5">
            {(b.steps ?? []).map((s, i) => (
              <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed text-slate-100">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 text-xs font-bold text-emerald-300">
                  {i + 1}
                </span>
                <MathText text={s} className="min-w-0 flex-1 [&_.math-content]:text-slate-100" />
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <div>
          {b.title && <div className="mb-1 text-sm font-bold text-slate-300">{b.title}</div>}
          {b.text && (
            <MathText
              text={b.text}
              className="[&_.math-content]:text-[15px] [&_.math-content]:leading-relaxed [&_.math-content]:text-slate-100"
            />
          )}
        </div>
      )}
    </div>
  )
}

export function ExplainPlayer({ scenes, onClose }: { scenes: ExplainScene[]; onClose?: () => void }) {
  const [cur, setCur] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [ttsState, setTtsState] = useState<'idle' | 'loading' | 'ready' | 'fail'>('idle')
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const urlCache = useRef<Map<number, string>>(new Map())
  const lastGo = useRef(0)
  const sceneStart = useRef(Date.now())
  const textTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const n = scenes.length

  // 获取某幕的语音（按幕缓存 blob URL）
  const audioOf = useCallback(async (i: number): Promise<string | null> => {
    const cache = urlCache.current
    if (cache.has(i)) return cache.get(i)!
    setTtsState('loading')
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: scenes[i].narration }),
      })
      if (!res.ok) throw new Error(String(res.status))
      const url = URL.createObjectURL(await res.blob())
      cache.set(i, url)
      setTtsState('ready')
      // 预取下一幕
      if (i + 1 < n && !cache.has(i + 1)) {
        fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: scenes[i + 1].narration }),
        })
          .then((r) => (r.ok ? r.blob() : null))
          .then((b) => {
            if (b) cache.set(i + 1, URL.createObjectURL(b))
          })
          .catch(() => {})
      }
      return url
    } catch {
      setTtsState('fail')
      return null
    }
  }, [scenes, n])

  const go = useCallback(
    async (idx: number) => {
      const target = Math.max(0, Math.min(n - 1, idx))
      setCur(target)
      setProgress(0)
      if (textTimer.current) {
        clearInterval(textTimer.current)
        textTimer.current = null
      }
      sceneStart.current = Date.now()
      const el = audioRef.current
      if (!el) return
      const url = await audioOf(target)
      if (url) {
        el.src = url
        el.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
      } else {
        // 无语音：文字模式，12 秒线性推进
        el.removeAttribute('src')
        textTimer.current = setInterval(() => {
          const t = (Date.now() - sceneStart.current) / 12000
          setProgress(Math.min(1, t))
          if (t >= 1 && textTimer.current) {
            clearInterval(textTimer.current)
            textTimer.current = null
            if (target < n - 1) setTimeout(() => go(target + 1), 300)
          }
        }, 250)
      }
    },
    [audioOf, n],
  )

  const toggle = useCallback(() => {
    const el = audioRef.current
    if (!el || !el.src) return
    if (playing) {
      el.pause()
      setPlaying(false)
    } else {
      el.play().then(() => setPlaying(true)).catch(() => {})
    }
  }, [playing])

  // 键盘 + 结尾自动翻幕
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return onClose?.()
      if (e.key === ' ') {
        e.preventDefault()
        toggle()
      }
      if (e.key === 'ArrowRight' && cur >= 0) go(cur + 1)
      if (e.key === 'ArrowLeft' && cur > 0) go(cur - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cur, go, toggle, onClose])

  const started = cur >= 0
  const scene = started ? scenes[cur] : null
  // 无语音时按进度估算揭示（12 秒/幕线性）
  const shownAt = (at: number) => progress >= at

  return (
    <div className="fixed inset-0 z-50 select-none bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] text-white">
      {/* 顶部圆点 */}
      <div className="fixed left-1/2 top-4 z-20 flex -translate-x-1/2 gap-2.5">
        {scenes.map((_, i) => (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation()
              go(i)
            }}
            className={`h-2.5 w-2.5 rounded-full transition-all ${i === cur ? 'scale-130 bg-indigo-400' : 'bg-white/20 hover:bg-white/40'}`}
          />
        ))}
      </div>

      {onClose && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          className="fixed right-4 top-4 z-20 rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white/70 hover:bg-white/20"
        >
          ✕ 退出
        </button>
      )}

      {/* 舞台 */}
      <div
        className="flex h-full w-full cursor-pointer items-center justify-center p-6 pt-14"
        onClick={() => {
          const now = Date.now()
          if (now - lastGo.current < 300 || !started) return
          lastGo.current = now
          if (cur < n - 1) go(cur + 1)
          else audioRef.current?.pause()
        }}
      >
        {!started ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              go(0)
            }}
            className="text-center"
          >
            <div className="text-6xl">🎬</div>
            <div className="mt-3 text-2xl font-bold text-indigo-300">点击开始错题讲解</div>
            <div className="mt-2 text-sm text-white/40">点击画面翻页 · 空格暂停 · Esc 退出</div>
          </button>
        ) : (
          scene && (
            <div className="max-h-full w-full max-w-4xl space-y-3.5 overflow-y-auto pb-16">
              <div className="text-center">
                <div className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-3xl font-extrabold text-transparent">
                  {scene.title}
                </div>
                {scene.sub && <div className="mt-1 text-sm text-white/40">{scene.sub}</div>}
              </div>
              {scene.blocks.map((b, i) => (
                <Block key={i} b={b} shown={shownAt(b.at)} idx={i} />
              ))}
            </div>
          )
        )}
      </div>

      {/* 底部控制条 */}
      {started && (
        <div className="fixed bottom-5 right-5 z-20 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          <div className="h-1 w-32 overflow-hidden rounded bg-white/15">
            <div className="h-full bg-indigo-400 transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
          {ttsState === 'loading' && <span className="text-xs text-white/40">语音合成中…</span>}
          {ttsState === 'fail' && <span className="text-xs text-white/40">语音不可用 · 文字模式</span>}
          <button
            onClick={toggle}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-500 text-lg text-white hover:bg-indigo-400"
          >
            {playing ? '⏸' : '▶'}
          </button>
        </div>
      )}

      <audio
        ref={audioRef}
        onTimeUpdate={(e) => {
          const el = e.currentTarget
          if (el.duration > 0) setProgress(el.currentTime / el.duration)
        }}
        onEnded={() => {
          setPlaying(false)
          if (cur < n - 1) setTimeout(() => go(cur + 1), 500)
        }}
      />
    </div>
  )
}
