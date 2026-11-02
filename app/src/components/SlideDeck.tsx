import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { lessonAudioUrl } from '../lib/data'
import { buildNarration } from '../lib/narration'
import { speakChinese, ttsSupported } from '../lib/tts'
import type { Lesson, Slide } from '../types'
import { ProgressiveReveal, ProgressiveExample } from './ProgressiveReveal'

const KIND_META: Record<Slide['kind'], { label: string; tone: string; bar: string; dot: string }> = {
  concept: { label: '概念讲解', tone: 'bg-blue-50 text-blue-700 border-blue-200', bar: 'border-l-blue-400', dot: 'bg-blue-400' },
  example: { label: '例题精讲', tone: 'bg-indigo-50 text-indigo-700 border-indigo-200', bar: 'border-l-indigo-400', dot: 'bg-indigo-400' },
  method: { label: '方法提炼', tone: 'bg-green-50 text-green-700 border-green-200', bar: 'border-l-green-400', dot: 'bg-green-400' },
  pitfall: { label: '易错提醒', tone: 'bg-amber-50 text-amber-700 border-amber-200', bar: 'border-l-amber-400', dot: 'bg-amber-400' },
  book: { label: '新思维拓展', tone: 'bg-violet-50 text-violet-700 border-violet-200', bar: 'border-l-violet-400', dot: 'bg-violet-400' },
}

const RATES = [0.8, 1, 1.2, 1.5]

interface DeckPrefs {
  auto: boolean
  rate: number
  voice: boolean
}

function loadPrefs(): DeckPrefs {
  try {
    const raw = localStorage.getItem('g7math.deck')
    if (raw) return { auto: true, rate: 1, voice: true, ...JSON.parse(raw) }
  } catch {
    /* ignore */
  }
  return { auto: true, rate: 1, voice: true }
}

export function SlideDeck({
  chapterId,
  lesson,
  audio,
  completed,
  onClose,
  onMarkStudied,
}: {
  chapterId: string
  lesson: Lesson
  /** manifest 里各页各步的音频时长（ms）；0 / 缺省表示该步没有音频文件 */
  audio: number[][] | null
  completed: boolean
  onClose: () => void
  onMarkStudied: () => void
}) {
  const slides = lesson.slides
  const [prefs, setPrefs] = useState<DeckPrefs>(loadPrefs)
  const [si, setSi] = useState(0)
  const [sti, setSti] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [finished, setFinished] = useState(false)
  const [progress, setProgress] = useState(0)
  const [usingTts, setUsingTts] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const ttsRef = useRef<{ cancel: () => void } | null>(null)
  const prefsRef = useRef(prefs)
  prefsRef.current = prefs

  const savePrefs = (patch: Partial<DeckPrefs>) =>
    setPrefs((p) => {
      const next = { ...p, ...patch }
      try {
        localStorage.setItem('g7math.deck', JSON.stringify(next))
      } catch {
        /* ignore */
      }
      return next
    })

  const slide = slides[si]
  const steps = useMemo(() => (slide ? buildNarration(slide) : []), [slide])
  const step = steps[sti]
  const meta = KIND_META[slide?.kind ?? 'concept'] ?? KIND_META.concept
  const stepHasAudio = !!step && (audio?.[si]?.[sti] ?? 0) > 0
  const audioDurationMs = audio?.[si]?.[sti] ?? 8000

  const stopNarration = useCallback(() => {
    ttsRef.current?.cancel()
    ttsRef.current = null
    audioRef.current?.pause()
  }, [])

  // ---------- 推进 / 后退 ----------
  const advance = useCallback(() => {
    setProgress(0)
    if (sti + 1 < steps.length) {
      setSti(sti + 1)
      return
    }
    if (si + 1 < slides.length) {
      setSi(si + 1)
      setSti(0)
      return
    }
    stopNarration()
    setPlaying(false)
    setFinished(true)
  }, [sti, steps.length, si, slides.length, stopNarration])

  const goBack = useCallback(() => {
    setFinished(false)
    setProgress(0)
    if (sti > 0) {
      setSti(sti - 1)
      return
    }
    if (si > 0) {
      const prevSteps = buildNarration(slides[si - 1])
      setSi(si - 1)
      setSti(Math.max(0, prevSteps.length - 1))
    }
  }, [sti, si, slides])

  // 播放/暂停（同一页内）
  const togglePlay = useCallback(() => {
    if (!step || !prefs.voice) {
      advance()
      return
    }
    if (playing) {
      stopNarration()
      setPlaying(false)
      return
    }
    setPlaying(true)
    if (stepHasAudio) {
      const el = audioRef.current
      if (el) {
        el.playbackRate = prefs.rate
        el.play().catch(() => { /* 状态由 onPlaying/onPause 事件驱动 */ })
      }
    } else {
      startTts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, stepHasAudio, playing, prefs.voice, prefs.rate, advance, stopNarration])

  function startTts() {
    if (!step) return
    if (!ttsSupported()) {
      setPlaying(false)
      return
    }
    setUsingTts(true)
    ttsRef.current = speakChinese(step.text, {
      rate: prefsRef.current.rate,
      onEnd: () => {
        ttsRef.current = null
        if (prefsRef.current.auto) advanceRef.current()
        else setPlaying(false)
      },
      onError: () => {
        ttsRef.current = null
        setPlaying(false)
      },
    })
  }

  const advanceRef = useRef(advance)
  advanceRef.current = advance

  // ---------- 进入某一步：装载并自动讲解 ----------
  useEffect(() => {
    stopNarration()
    setProgress(0)
    if (!step) {
      setUsingTts(false)
      setPlaying(false)
      return
    }
    if (!prefsRef.current.voice) {
      setUsingTts(false)
      setPlaying(false)
      return
    }
    setPlaying(true)
    if (stepHasAudio) {
      setUsingTts(false)
      const el = audioRef.current
      if (!el) return
      el.src = lessonAudioUrl(chapterId, lesson.pointId, si, sti)
      el.playbackRate = prefsRef.current.rate
      el.play().catch(() => { /* 状态由 onPlaying/onPause 事件驱动 */ })
    } else {
      startTts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [si, sti, chapterId, lesson.pointId, stepHasAudio])

  // 声音开关：关掉时立即停
  useEffect(() => {
    if (!prefs.voice) stopNarration()
  }, [prefs.voice, stopNarration])

  // 语速变化作用到正在播放的音频
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = prefs.rate
  }, [prefs.rate])

  // 键盘
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault()
        advance()
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault()
        goBack()
      } else if (e.key === ' ') {
        e.preventDefault()
        togglePlay()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [advance, goBack, onClose, togglePlay])

  // 锁定背景滚动 + 卸载清理
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
      ttsRef.current?.cancel()
      audioRef.current?.pause()
    }
  }, [])

  // 预加载下一步音频
  useEffect(() => {
    const next =
      sti + 1 < steps.length
        ? { s: si, t: sti + 1 }
        : si + 1 < slides.length
          ? { s: si + 1, t: 0 }
          : null
    if (!next) return
    if ((audio?.[next.s]?.[next.t] ?? 0) > 0) {
      const a = new Audio()
      a.preload = 'auto'
      a.src = lessonAudioUrl(chapterId, lesson.pointId, next.s, next.t)
    }
  }, [si, sti, steps.length, slides.length, audio, chapterId, lesson.pointId])

  if (!slide) return null

  const bodyLen = (slide.body ?? slide.problem ?? '').length + (slide.solution?.length ?? 0)
  const textSize = bodyLen > 700 ? 'text-base md:text-lg' : bodyLen > 360 ? 'text-lg md:text-xl' : 'text-xl md:text-2xl'
  const isExample = slide.kind === 'example' && steps.length > 1
  const narrationSource = usingTts ? '浏览器语音' : '婷婷讲解'

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-950/95 text-gray-100">
      {/* 顶部信息条 */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm md:px-6">
        <div className="min-w-0">
          <div className="truncate font-medium text-gray-200">{lesson.title}</div>
          <div className="mt-0.5 text-xs text-gray-500">
            {prefs.voice ? narrationSource : '讲解已静音'} · 第 {si + 1}/{slides.length} 页
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            className="rounded-lg px-2.5 py-1.5 text-xs text-gray-300 hover:bg-white/10"
            onClick={() => savePrefs({ voice: !prefs.voice })}
            title="讲解声音开关"
          >
            {prefs.voice ? '🔊' : '🔇'}
          </button>
          <select
            className="rounded-lg bg-white/10 px-1.5 py-1.5 text-xs text-gray-200 outline-none"
            value={prefs.rate}
            onChange={(e) => savePrefs({ rate: Number(e.target.value) })}
            title="语速"
          >
            {RATES.map((r) => (
              <option key={r} value={r} className="text-gray-900">
                {r}x
              </option>
            ))}
          </select>
          <button
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium ${prefs.auto ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-white/10'}`}
            onClick={() => savePrefs({ auto: !prefs.auto })}
            title="讲解结束后自动进入下一步"
          >
            连播
          </button>
          <button className="rounded-lg px-2.5 py-1.5 text-xs text-gray-300 hover:bg-white/10" onClick={onClose}>
            ✕ 退出
          </button>
        </div>
      </div>

      {/* 幻灯片 */}
      <div className="relative flex min-h-0 flex-1 items-stretch justify-center px-3 pb-2 md:px-6">
        <div className="flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className={`flex items-center gap-3 border-l-8 px-5 pt-5 pb-3 md:px-7 ${meta.bar}`}>
            <span className={`shrink-0 rounded-md border px-2 py-0.5 text-xs font-semibold ${meta.tone}`}>{meta.label}</span>
            <span className="min-w-0 flex-1 text-base font-bold text-gray-900 md:text-xl">{slide.title}</span>
            {isExample && (
              <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                {steps[sti]?.key === 'problem' ? '① 读题 · 先想一想' : '② 听解答'}
              </span>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 text-gray-800 md:px-7">

            {slide.kind === 'example' ? (
              <div className="space-y-4">
                <ProgressiveExample
                  problem={slide.problem ?? slide.body ?? ''}
                  solution={(sti >= 1 || steps.length <= 1) ? slide.solution : undefined}
                  notes={(sti >= 1 || steps.length <= 1) ? slide.notes : undefined}
                  playing={playing}
                  durationMs={stepHasAudio ? audioDurationMs : 12000}
                  className={textSize}
                />
                {sti === 0 && steps.length > 1 && (
                  <div className="text-sm text-gray-400">先自己想一想，按「▶｜下一步」或等语音讲完自动看解答</div>
                )}
              </div>
            ) : slide.kind === 'book' ? (
              <div className={`${textSize} space-y-3`}>
                {slide.bookRef && (
                  <div className={`text-sm font-medium text-violet-600 ${playing ? 'reveal-visible' : 'reveal-hidden'}`}>
                    《{slide.bookRef}》
                  </div>
                )}
                <ProgressiveReveal
                  text={slide.body ?? ''}
                  playing={playing}
                  durationMs={stepHasAudio ? audioDurationMs : 8000}
                  className={textSize}
                />
              </div>
            ) : (
              <ProgressiveReveal
                text={slide.body ?? ''}
                playing={playing}
                durationMs={stepHasAudio ? audioDurationMs : 8000}
                className={textSize}
              />
            )}
          </div>

          {/* 页脚：页面圆点 */}
          <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-5 py-2.5 text-xs text-gray-400 md:px-7">
            <div className="flex flex-wrap gap-1.5">
              {slides.map((s, i) => (
                <button
                  key={i}
                  title={`第 ${i + 1} 页`}
                  className={`h-2 rounded-full transition-all ${
                    i === si
                      ? 'w-6 bg-gray-800'
                      : `w-2 ${KIND_META[s.kind]?.dot ?? 'bg-gray-300'} opacity-60 hover:opacity-100`
                  }`}
                  onClick={() => {
                    setFinished(false)
                    setSi(i)
                    setSti(0)
                  }}
                />
              ))}
            </div>
            <div className="shrink-0">{step ? `${step.label} ${sti + 1}/${steps.length}` : '本页无讲解'} · ←→ 翻页 · 空格 暂停</div>
          </div>
        </div>

        {/* 讲解完毕 */}
        {finished && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-950/80 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center text-gray-800 shadow-2xl">
              <div className="text-4xl">🎉</div>
              <div className="mt-3 text-xl font-bold">本课讲解完毕</div>
              <div className="mt-1 text-sm text-gray-500">
                {lesson.title} · 共 {slides.length} 页
              </div>
              <div className="mt-6 flex flex-col gap-2">
                <button
                  className="btn btn-primary w-full"
                  onClick={() => {
                    setFinished(false)
                    setSi(0)
                    setSti(0)
                  }}
                >
                  重新放映
                </button>
                {!completed && (
                  <button className="btn w-full" onClick={onMarkStudied}>
                    ✓ 标记为已学完
                  </button>
                )}
                <button className="btn w-full" onClick={onClose}>
                  返回阅读模式
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 底部控制条 */}
      <div className="flex items-center gap-3 px-4 py-4 md:px-8">
        <button
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-lg hover:bg-white/20 disabled:opacity-30"
          disabled={si === 0 && sti === 0}
          onClick={goBack}
          title="上一步（←）"
        >
          ⏮
        </button>
        <button
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-600 text-2xl text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500"
          onClick={togglePlay}
          title={prefs.voice ? '播放 / 暂停（空格）' : '下一步（空格）'}
        >
          {playing ? '⏸' : '▶'}
        </button>
        <button
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-lg hover:bg-white/20"
          onClick={advance}
          title="下一步（→）"
        >
          ⏭
        </button>
        <div className="ml-1 min-w-0 flex-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full bg-blue-500 transition-[width] duration-200 ${usingTts && playing ? 'animate-pulse' : ''}`}
              style={usingTts ? { width: playing ? '66%' : '0%' } : { width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <div className="mt-1.5 truncate text-xs text-gray-400">{step ? step.text.slice(0, 80) : '—'}</div>
        </div>
      </div>

      {/* 讲解音频（婷婷预生成；缺失时回退浏览器语音） */}
      <audio
        ref={audioRef}
        onPlaying={() => setPlaying(true)}
        onPause={() => {
          // 音频被外部暂停（非自然结束）→ 同步状态
          const el = audioRef.current
          if (el && el.currentTime < el.duration - 0.1) {
            setPlaying(false)
          }
        }}
        onEnded={() => {
          if (prefs.auto) advance()
          else setPlaying(false)
        }}
        onError={() => {
          // 音频文件缺失 / 损坏 → 本步回退浏览器语音
          if (playing && step && prefs.voice) startTts()
          else if (!playing && step && prefs.voice && ttsSupported()) {
            // 首次装载即 404：同样转语音
            setPlaying(true)
            startTts()
          }
        }}
        onTimeUpdate={(e) => {
          const el = e.currentTarget
          if (el.duration > 0) setProgress(el.currentTime / el.duration)
        }}
      />
    </div>
  )
}
