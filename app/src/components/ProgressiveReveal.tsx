import { useEffect, useRef, useState, useMemo } from 'react'
import { MathText } from './MathText'
import { Figure } from './Figure'
import type { FigureSpec } from './Figure'

/**
 * 板书式逐行递进：短句展示 + 图形内嵌 + 自动分屏。
 *
 * 三项改进：
 * 1. 长内容自动分屏（每屏 ≤ maxPerView 块），满屏后新开一屏
 * 2. @@fig 图形嵌入内容流（不再固定在页底）
 * 3. 文字用"板书模式"：每块只展示核心句（首句或关键短语），完整内容由语音讲述
 */

interface Block {
  id: number
  text: string
  isFig: boolean
  figSpec?: FigureSpec
  /** 板书展示用（精简版） */
  display: string
}

/** 提取板书展示文本：首句，截断到 ~60 字 */
function condense(text: string): string {
  const clean = text.replace(/@@fig\s*\{[^}]*\}\s*@@/g, '').trim()
  if (!clean) return ''
  // 取第一个完整句
  const m = clean.match(/^[^。！？]*[。！？]/)
  let first = m ? m[0] : clean
  // 超长截断
  if (first.length > 60) {
    first = first.slice(0, 58) + '…'
  }
  return first
}

function splitBlocks(raw: string): Block[] {
  const blocks: Block[] = []
  let id = 0
  for (const line of (raw ?? '').split(/\n/)) {
    const t = line.trim()
    if (!t) continue
    if (t.startsWith('@@fig')) {
      try {
        const json = t.replace(/@@fig\s*/, '').replace(/@@$/, '')
        blocks.push({ id: id++, text: t, isFig: true, figSpec: JSON.parse(json), display: '' })
      } catch {
        // 非法 JSON 忽略
      }
    } else {
      blocks.push({ id: id++, text: t, isFig: false, display: condense(t) })
    }
  }
  return blocks
}

/** 分屏：把块分成若干组，每组不超过 maxPerView 块 */
function paginate(blocks: Block[], maxPerView: number = 5): Block[][] {
  const pages: Block[][] = []
  for (let i = 0; i < blocks.length; i += maxPerView) {
    pages.push(blocks.slice(i, i + maxPerView))
  }
  return pages.length ? pages : [[]]
}

const HIDDEN = 'reveal-hidden'
const VISIBLE = 'reveal-visible'

export function ProgressiveReveal({
  text,
  playing,
  durationMs,
  className = '',
  maxPerView = 5,
}: {
  text: string
  playing: boolean
  durationMs: number
  className?: string
  maxPerView?: number
}) {
  const blocks = useMemo(() => splitBlocks(text), [text])
  const pages = useMemo(() => paginate(blocks, maxPerView), [blocks, maxPerView])
  const [pageIdx, setPageIdx] = useState(0)
  const [revealed, setRevealed] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)
  const durationRef = useRef(durationMs)
  durationRef.current = durationMs

  const currentPage = pages[pageIdx] ?? []
  const totalPages = pages.length

  // 重置
  useEffect(() => {
    setPageIdx(0)
    setRevealed(0)
  }, [text])

  // 播放驱动
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (!playing) return

    // 先展示第 0 块
    setRevealed((r) => (r === 0 ? 1 : r))

    // 每页分到的时长
    const pageDuration = durationMs / totalPages
    const pageStartOffset = pageIdx * pageDuration

    startTimeRef.current = Date.now() - pageStartOffset
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current
      // 计算当前应该在哪个页、哪块
      const targetPage = Math.min(totalPages - 1, Math.floor(elapsed / pageDuration))
      const withinPage = elapsed - targetPage * pageDuration
      const blocksInPage = pages[targetPage]?.length ?? 1
      const blockInterval = pageDuration / blocksInPage
      const targetRevealed = Math.min(blocksInPage, Math.floor(withinPage / blockInterval) + 1)

      setPageIdx(targetPage)
      setRevealed(targetRevealed)

      if (targetPage >= totalPages - 1 && targetRevealed >= (pages[totalPages - 1]?.length ?? 0)) {
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
      }
    }, 100)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [playing, durationMs, text]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={className}>
      {/* 当前屏的块 */}
      {currentPage.map((block, i) => {
        const visible = !playing || i < revealed
        if (block.isFig && block.figSpec) {
          return (
            <div key={block.id} className={`${visible ? VISIBLE : HIDDEN} my-3`}>
              <Figure spec={block.figSpec} />
            </div>
          )
        }
        return (
          <div
            key={block.id}
            className={`${visible ? VISIBLE : HIDDEN} mb-3 text-lg font-medium leading-relaxed md:text-xl`}
          >
            <MathText text={block.display} />
          </div>
        )
      })}

      {/* 分屏指示器 */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {pages.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === pageIdx ? 'w-6 bg-indigo-500' : 'w-2 bg-gray-300'}`}
            />
          ))}
          <span className="ml-2 text-xs text-gray-400">
            {pageIdx + 1}/{totalPages} 屏
          </span>
        </div>
      )}
    </div>
  )
}

/** 例题专用 */
export function ProgressiveExample({
  problem,
  solution,
  notes,
  playing,
  durationMs,
  className = '',
}: {
  problem: string
  solution?: string
  notes?: string
  playing: boolean
  durationMs: number
  className?: string
}) {
  const problemMs = Math.round(durationMs * 0.25)
  const solutionMs = solution ? Math.round(durationMs * 0.6) : 0
  const notesMs = notes ? Math.round(durationMs * 0.15) : 0

  return (
    <div className={className}>
      <div className="rounded-xl bg-amber-50/60 px-4 py-3">
        <div className="mb-1 text-sm font-semibold text-amber-700">题目</div>
        <ProgressiveReveal text={problem} playing={playing} durationMs={problemMs} maxPerView={4} />
      </div>
      {solution && (
        <div className="mt-4 rounded-xl bg-green-50/40 px-4 py-3">
          <div className="mb-1 text-sm font-semibold text-green-700">解答</div>
          <ProgressiveReveal text={solution} playing={playing} durationMs={solutionMs} maxPerView={6} />
        </div>
      )}
      {notes && (
        <div className="mt-3 text-sm text-gray-500">
          <ProgressiveReveal text={notes} playing={playing} durationMs={Math.max(notesMs, 1000)} maxPerView={2} />
        </div>
      )}
    </div>
  )
}
