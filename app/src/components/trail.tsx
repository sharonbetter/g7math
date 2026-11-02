/**
 * 闯关路径连接线：
 * - 前方（未走）：一串小足印 🐾，沿曲线每隔一段踩一只、左右脚交替，指向下一个节点
 * - 已走过：实线缎带（白色衬底 + 彩色描边），任何背景上都看得清
 * 节点按百分比定位（x/y 都是 0-100），按实测宽高换算成像素。
 */
import { useEffect, useRef, useState } from 'react'

function pathThrough(pts: Array<[number, number]>): string {
  if (pts.length < 2) return ''
  let d = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i]
    const [x1, y1] = pts[i + 1]
    const my = (y0 + y1) / 2
    d += ` C ${x0} ${my}, ${x1} ${my}, ${x1} ${y1}`
  }
  return d
}

interface Footprint {
  x: number
  y: number
  ang: number
  side: number
}

/** 沿折线每隔 step 踩一只足印（左右交替） */
function sampleFootprints(pts: Array<[number, number]>, step = 42): Footprint[] {
  const out: Footprint[] = []
  if (pts.length < 2) return out
  let carry = step * 0.55
  let side = 1
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i]
    const [x1, y1] = pts[i + 1]
    const dx = x1 - x0
    const dy = y1 - y0
    const len = Math.hypot(dx, dy)
    if (len < 2) continue
    const ux = dx / len
    const uy = dy / len
    let t = carry
    while (t < len - 12) {
      out.push({ x: x0 + ux * t, y: y0 + uy * t, ang: (Math.atan2(dy, dx) * 180) / Math.PI, side })
      side = -side
      t += step
    }
    carry = t - len
  }
  return out
}

export interface TrailPoint {
  /** 水平位置 0-100 */
  x: number
  /** 垂直位置 0-100 */
  y: number
}

/**
 * 覆盖在路径容器上的连接线。
 * doneUntil：已走过路段覆盖到的节点下标（含），-1 表示全部未走。
 */
export function TrailSvg({
  pts,
  doneUntil = -1,
  aheadClass = 'text-slate-500',
  doneClass = 'text-amber-400',
}: {
  pts: TrailPoint[]
  doneUntil?: number
  aheadClass?: string
  doneClass?: string
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const px = pts.map((p) => [(p.x / 100) * size.w, (p.y / 100) * size.h] as [number, number])
  const done = doneUntil >= 1 ? pathThrough(px.slice(0, doneUntil + 1)) : ''
  const aheadStart = doneUntil >= 0 ? doneUntil : 0
  const prints = sampleFootprints(px.slice(aheadStart))

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {size.w > 0 && size.h > 0 && (
        <svg className="absolute left-0 top-0" width={size.w} height={size.h}>
          {/* 足印：白描边衬底，深浅背景都清晰；掌 + 三趾，朝行进方向，左右脚交替 */}
          <g className={aheadClass}>
            {prints.map((p, i) => (
              <g key={i} transform={`translate(${p.x},${p.y}) rotate(${p.ang}) translate(0,${p.side * 3.2})`}>
                <ellipse cx="2" cy="0" rx="5.4" ry="3.1" fill="currentColor" stroke="#fff" strokeOpacity="0.7" strokeWidth="1.4" />
                <circle cx="9.2" cy="-2.6" r="1.6" fill="currentColor" stroke="#fff" strokeOpacity="0.7" strokeWidth="1" />
                <circle cx="10.8" cy="0" r="1.6" fill="currentColor" stroke="#fff" strokeOpacity="0.7" strokeWidth="1" />
                <circle cx="9.2" cy="2.6" r="1.6" fill="currentColor" stroke="#fff" strokeOpacity="0.7" strokeWidth="1" />
              </g>
            ))}
          </g>
          {/* 走过的实线：白色衬底 + 彩色缎带 */}
          {done && (
            <>
              <path d={done} fill="none" stroke="#fff" strokeOpacity="0.75" strokeWidth="9" strokeLinecap="round" />
              <path d={done} fill="none" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" className={doneClass} />
            </>
          )}
        </svg>
      )}
    </div>
  )
}

/** 章节页纵向蛇形路径的水平位置循环（%）：左 → 中 → 右 → 中 */
export const SNAKE_XS = [18, 50, 82, 50]

export function snakeX(i: number): number {
  return SNAKE_XS[i % SNAKE_XS.length]
}
