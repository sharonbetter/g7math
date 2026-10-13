/**
 * 浏览器语音合成兜底：课件没有预生成 m4a 时，用 Web Speech API 朗读。
 * 优先选择中文语音（婷婷 / zh-CN），长文本按句子分段排队朗读。
 */
import { splitSentences } from './narration'

export interface SpeakHandle {
  cancel: () => void
}

export interface SpeakOptions {
  /** 语速系数，1 为正常 */
  rate?: number
  onEnd?: () => void
  onError?: () => void
}

let cachedVoice: SpeechSynthesisVoice | null | undefined

function pickChineseVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice !== undefined) return cachedVoice
  if (typeof window === 'undefined' || !window.speechSynthesis) return null
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return null // voices 异步加载，本次先用默认，加载完会缓存
  const score = (v: SpeechSynthesisVoice) => {
    const name = v.name.toLowerCase()
    let s = 0
    if (/tingting|ting-ting|婷婷|xiaoxiao|yunxi|yunyang|meijia/.test(name)) s += 4
    if (v.lang?.toLowerCase().startsWith('zh-cn')) s += 3
    else if (v.lang?.toLowerCase().startsWith('zh')) s += 2
    if (v.localService) s += 1
    return s
  }
  const best = voices
    .map((v) => ({ v, s: score(v) }))
    .filter((x) => x.s > 1)
    .sort((a, b) => b.s - a.s)[0]
  cachedVoice = best ? best.v : null
  return cachedVoice
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoice = undefined
    pickChineseVoice()
  }
}

export function ttsSupported(): boolean {
  return typeof window !== 'undefined' && !!window.speechSynthesis
}

/** 朗读一段文本；返回可取消的句柄。文本为空时立即 onEnd。 */
export function speakChinese(text: string, opts: SpeakOptions = {}): SpeakHandle {
  const { rate = 1, onEnd, onError } = opts
  if (!ttsSupported()) {
    onError?.()
    onEnd?.()
    return { cancel: () => {} }
  }
  const chunks = splitSentences(text)
  const synth = window.speechSynthesis
  synth.cancel()
  const voice = pickChineseVoice()

  let cancelled = false
  let idx = 0
  const total = chunks.length

  const speakNext = () => {
    if (cancelled) return
    if (idx >= total) {
      onEnd?.()
      return
    }
    const u = new SpeechSynthesisUtterance(chunks[idx++])
    u.lang = voice?.lang ?? 'zh-CN'
    if (voice) u.voice = voice
    u.rate = rate
    u.onend = () => setTimeout(speakNext, 120)
    u.onerror = () => {
      if (cancelled) return
      // 跳过出错段落，继续后面的（cancel 也会触发 error）
      if (idx >= total) {
        onError?.()
        onEnd?.()
      } else {
        setTimeout(speakNext, 120)
      }
    }
    synth.speak(u)
  }
  speakNext()

  return {
    cancel: () => {
      cancelled = true
      try {
        synth.cancel()
      } catch {
        /* ignore */
      }
    },
  }
}
