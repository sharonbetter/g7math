import { useMemo } from 'react'

/**
 * 轻量图形 DSL：内容文本中以 @@fig {json}@@ 标记嵌入，由 MathText 解析后交给本组件渲染 SVG。
 * 覆盖：幻方网格 / 幻圆 / 条形图 / 扇形图 / 数轴 / 平面直角坐标系。
 */

export type FigureSpec =
  | { type: 'grid'; cells: (string | number)[][]; highlight?: [number, number][] }
  | { type: 'circle'; center: string | number; pairs: [string | number, string | number][] }
  | { type: 'bar'; title?: string; bars: { label: string; value: number | null }[]; unit?: string }
  | { type: 'pie'; title?: string; slices: { label: string; percent: number }[] }
  | { type: 'numberLine'; min: number; max: number; points?: { at: number; label?: string }[] }
  | { type: 'plane'; x?: [number, number]; y?: [number, number]; points?: { x: number; y: number; label?: string }[] }
  | { type: 'thermometer'; marks: { at: number; label: string; tone?: 'cold' | 'warm' }[] }

const PALETTE = ['#6366f1', '#0ea5e9', '#f59e0b', '#10b981', '#f43f5e', '#8b5cf6', '#14b8a6', '#f97316']

function Grid({ cells, highlight = [] }: { cells: (string | number)[][]; highlight?: [number, number][] }) {
  const n = cells.length
  const S = 62
  const W = S * n
  const hl = new Set(highlight.map(([r, c]) => `${r},${c}`))
  return (
    <svg viewBox={`-1 -1 ${W + 2} ${W + 2}`} className="mx-auto max-w-[220px]" role="img">
      {cells.map((row, r) =>
        row.map((v, c) => {
          const x = c * S
          const y = r * S
          const isHl = hl.has(`${r},${c}`)
          return (
            <g key={`${r}-${c}`}>
              <rect
                x={x}
                y={y}
                width={S}
                height={S}
                fill={isHl ? '#eef2ff' : '#ffffff'}
                stroke="#64748b"
                strokeWidth={1.4}
                strokeDasharray={isHl ? '5 3' : undefined}
              />
              <text
                x={x + S / 2}
                y={y + S / 2 + 6}
                textAnchor="middle"
                fontSize={22}
                fontWeight={isHl ? 700 : 500}
                fill={isHl ? '#4f46e5' : '#1f2937'}
              >
                {String(v)}
              </text>
            </g>
          )
        }),
      )}
    </svg>
  )
}

function MagicCircle({ center, pairs }: { center: string | number; pairs: [string | number, string | number][] }) {
  const R = 130
  const cx = 150
  const cy = 150
  const n = pairs.length
  const angle0 = -Math.PI / 2
  return (
    <svg viewBox="0 0 300 300" className="mx-auto max-w-[230px]" role="img">
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#64748b" strokeWidth={2} />
      {pairs.map(([a, b], i) => {
        const ang = angle0 + (i * 2 * Math.PI) / n
        const x1 = cx + R * Math.cos(ang)
        const y1 = cy + R * Math.sin(ang)
        const x2 = cx - R * Math.cos(ang)
        const y2 = cy - R * Math.sin(ang)
        return (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#94a3b8" strokeWidth={1.4} />
            <circle cx={x1} cy={y1} r={22} fill="#eef2ff" stroke="#6366f1" strokeWidth={1.5} />
            <text x={x1} y={y1 + 6} textAnchor="middle" fontSize={17} fontWeight={600} fill="#1f2937">
              {String(a)}
            </text>
            <circle cx={x2} cy={y2} r={22} fill="#eef2ff" stroke="#6366f1" strokeWidth={1.5} />
            <text x={x2} y={y2 + 6} textAnchor="middle" fontSize={17} fontWeight={600} fill="#1f2937">
              {String(b)}
            </text>
          </g>
        )
      })}
      <circle cx={cx} cy={cy} r={26} fill="#fff7ed" stroke="#f59e0b" strokeWidth={2} />
      <text x={cx} y={cy + 7} textAnchor="middle" fontSize={19} fontWeight={700} fill="#b45309">
        {String(center)}
      </text>
    </svg>
  )
}

function BarChart({ title, bars, unit = '' }: { title?: string; bars: { label: string; value: number | null }[]; unit?: string }) {
  const W = 360
  const H = 230
  const pad = { l: 40, r: 10, t: 28, b: 34 }
  const maxV = Math.max(...bars.map((b) => b.value ?? 0), 1)
  const step = niceStep(maxV)
  const top = Math.ceil(maxV / step) * step
  const iw = W - pad.l - pad.r
  const ih = H - pad.t - pad.b
  const bw = Math.min(44, (iw / bars.length) * 0.55)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto w-full max-w-[360px]" role="img">
      {title && (
        <text x={W / 2} y={16} textAnchor="middle" fontSize={13} fontWeight={600} fill="#374151">
          {title}
        </text>
      )}
      {Array.from({ length: Math.round(top / step) + 1 }, (_, i) => {
        const y = pad.t + ih - (ih * i * step) / top
        return (
          <g key={i}>
            <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="#e5e7eb" strokeWidth={1} />
            <text x={pad.l - 5} y={y + 4} textAnchor="end" fontSize={10} fill="#9ca3af">
              {i * step}
            </text>
          </g>
        )
      })}
      {bars.map((b, i) => {
        const cx = pad.l + (iw / bars.length) * (i + 0.5)
        const h = b.value == null ? 0 : (ih * b.value) / top
        const y = pad.t + ih - h
        return (
          <g key={i}>
            {b.value == null ? (
              <rect x={cx - bw / 2} y={pad.t + ih - 18} width={bw} height={18} fill="none" stroke="#6366f1" strokeWidth={1.5} strokeDasharray="4 3" />
            ) : (
              <rect x={cx - bw / 2} y={y} width={bw} height={h} rx={3} fill={PALETTE[i % PALETTE.length]} />
            )}
            <text x={cx} y={(b.value == null ? pad.t + ih - 22 : y - 5)} textAnchor="middle" fontSize={11} fontWeight={600} fill="#374151">
              {b.value == null ? '?' : `${b.value}${unit}`}
            </text>
            <text x={cx} y={pad.t + ih + 14} textAnchor="middle" fontSize={11} fill="#6b7280">
              {b.label}
            </text>
          </g>
        )
      })}
      <line x1={pad.l} y1={pad.t + ih} x2={W - pad.r} y2={pad.t + ih} stroke="#9ca3af" strokeWidth={1.5} />
    </svg>
  )
}

function niceStep(max: number): number {
  const raw = max / 4
  const mag = 10 ** Math.floor(Math.log10(raw || 1))
  for (const m of [1, 2, 5, 10]) {
    if (m * mag >= raw) return m * mag
  }
  return 10 * mag
}

function PieChart({ title, slices }: { title?: string; slices: { label: string; percent: number }[] }) {
  const R = 78
  const cx = 100
  const cy = 100
  let acc = 0
  return (
    <svg viewBox="0 0 330 200" className="mx-auto w-full max-w-[330px]" role="img">
      {title && (
        <text x={100} y={16} textAnchor="middle" fontSize={13} fontWeight={600} fill="#374151">
          {title}
        </text>
      )}
      {slices.map((s, i) => {
        const a0 = (acc / 100) * 2 * Math.PI - Math.PI / 2
        acc += s.percent
        const a1 = (acc / 100) * 2 * Math.PI - Math.PI / 2
        const large = a1 - a0 > Math.PI ? 1 : 0
        const x0 = cx + R * Math.cos(a0)
        const y0 = cy + R * Math.sin(a0)
        const x1 = cx + R * Math.cos(a1)
        const y1 = cy + R * Math.sin(a1)
        const mid = (a0 + a1) / 2
        const lx = cx + R * 0.62 * Math.cos(mid)
        const ly = cy + R * 0.62 * Math.sin(mid)
        return (
          <g key={i}>
            <path
              d={`M ${cx} ${cy} L ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1} Z`}
              fill={PALETTE[i % PALETTE.length]}
              stroke="#fff"
              strokeWidth={2}
            />
            <text x={lx} y={ly + 4} textAnchor="middle" fontSize={12} fontWeight={700} fill="#fff">
              {s.percent}%
            </text>
          </g>
        )
      })}
      {slices.map((s, i) => (
        <g key={i} transform={`translate(215, ${34 + i * 22})`}>
          <rect width={12} height={12} rx={2} fill={PALETTE[i % PALETTE.length]} />
          <text x={18} y={10} fontSize={12} fill="#374151">
            {s.label}（{s.percent}%）
          </text>
        </g>
      ))}
    </svg>
  )
}

function NumberLine({ min, max, points = [] }: { min: number; max: number; points?: { at: number; label?: string }[] }) {
  const W = 380
  const pad = 30
  const y = 70
  const x = (v: number) => pad + ((v - min) / (max - min)) * (W - pad * 2)
  const ticks = ticksBetween(min, max)
  return (
    <svg viewBox={`0 0 ${W} 100`} className="mx-auto w-full max-w-[380px]" role="img">
      <defs>
        <marker id="nl-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#475569" />
        </marker>
      </defs>
      <line x1={pad - 14} y1={y} x2={W - pad + 14} y2={y} stroke="#475569" strokeWidth={2} markerEnd="url(#nl-arrow)" markerStart="url(#nl-arrow)" />
      {ticks.map((t) => (
        <g key={t}>
          <line x1={x(t)} y1={y - 5} x2={x(t)} y2={y + 5} stroke="#475569" strokeWidth={1.2} />
          <text x={x(t)} y={y + 20} textAnchor="middle" fontSize={11} fill="#64748b">
            {t}
          </text>
        </g>
      ))}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={x(p.at)} cy={y} r={5.5} fill="#6366f1" stroke="#fff" strokeWidth={1.5} />
          <text x={x(p.at)} y={y - 12} textAnchor="middle" fontSize={13} fontWeight={700} fill="#4f46e5">
            {p.label ?? p.at}
          </text>
        </g>
      ))}
    </svg>
  )
}

function ticksBetween(min: number, max: number): number[] {
  const n = Math.min(12, Math.max(2, max - min))
  const step = (max - min) / n
  return Array.from({ length: n + 1 }, (_, i) => Math.round((min + i * step) * 100) / 100)
}

function Plane({
  x = [-5, 5],
  y = [-5, 5],
  points = [],
}: {
  x?: [number, number]
  y?: [number, number]
  points?: { x: number; y: number; label?: string }[]
}) {
  const S = 220
  const pad = 20
  const toPx = (vx: number, vy: number): [number, number] => [
    pad + ((vx - x[0]) / (x[1] - x[0])) * (S - pad * 2),
    S - pad - ((vy - y[0]) / (y[1] - y[0])) * (S - pad * 2),
  ]
  const [ox, oy] = toPx(0, 0)
  const ticksX = ticksBetween(x[0], x[1]).filter((t) => t !== 0)
  const ticksY = ticksBetween(y[0], y[1]).filter((t) => t !== 0)
  return (
    <svg viewBox={`0 0 ${S} ${S}`} className="mx-auto max-w-[220px]" role="img">
      <rect x={pad} y={pad} width={S - pad * 2} height={S - pad * 2} fill="#f8fafc" stroke="#e2e8f0" />
      {ticksX.map((t) => {
        const [tx] = toPx(t, 0)
        return (
          <g key={`x${t}`}>
            <line x1={tx} y1={oy - 3} x2={tx} y2={oy + 3} stroke="#94a3b8" />
            <text x={tx} y={oy + 13} textAnchor="middle" fontSize={8} fill="#94a3b8">
              {t}
            </text>
          </g>
        )
      })}
      {ticksY.map((t) => {
        const [, ty] = toPx(0, t)
        return (
          <g key={`y${t}`}>
            <line x1={ox - 3} y1={ty} x2={ox + 3} y2={ty} stroke="#94a3b8" />
            <text x={ox - 6} y={ty + 3} textAnchor="end" fontSize={8} fill="#94a3b8">
              {t}
            </text>
          </g>
        )
      })}
      <line x1={pad} y1={oy} x2={S - pad} y2={oy} stroke="#475569" strokeWidth={1.5} />
      <line x1={ox} y1={pad} x2={ox} y2={S - pad} stroke="#475569" strokeWidth={1.5} />
      <text x={S - pad} y={oy - 5} textAnchor="end" fontSize={10} fill="#475569">
        x
      </text>
      <text x={ox + 6} y={pad + 8} fontSize={10} fill="#475569">
        y
      </text>
      {points.map((p, i) => {
        const [px, py] = toPx(p.x, p.y)
        return (
          <g key={i}>
            <circle cx={px} cy={py} r={4.5} fill="#6366f1" stroke="#fff" strokeWidth={1.5} />
            <text x={px + 7} y={py - 6} fontSize={11} fontWeight={700} fill="#4f46e5">
              {p.label ?? `(${p.x},${p.y})`}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function Thermometer({ marks }: { marks: { at: number; label: string; tone?: 'cold' | 'warm' }[] }) {
  const H = 250
  const min = Math.min(...marks.map((m) => m.at), -10)
  const max = Math.max(...marks.map((m) => m.at), 15)
  const top = 30
  const bottom = 210
  const y = (v: number) => bottom - ((v - min) / (max - min)) * (bottom - top)
  return (
    <svg viewBox={`0 0 300 ${H}`} className="mx-auto max-w-[300px]" role="img">
      <rect x={120} y={top - 10} width={24} height={bottom - top + 20} rx={12} fill="#f8fafc" stroke="#94a3b8" strokeWidth={2} />
      <circle cx={132} cy={bottom + 14} r={16} fill="#e2e8f0" stroke="#94a3b8" strokeWidth={2} />
      {marks.map((m, i) => {
        const cold = m.tone !== 'warm'
        const color = cold ? '#0ea5e9' : '#f59e0b'
        return (
          <g key={i}>
            <circle cx={132} cy={y(m.at)} r={6} fill={color} className="fig-pop" style={{ animationDelay: `${i * 0.25}s` }} />
            <line x1={150} y1={y(m.at)} x2={195} y2={y(m.at)} stroke={color} strokeWidth={1.5} strokeDasharray="3 3" />
            <text x={200} y={y(m.at) + 5} fontSize={13} fontWeight={700} fill={color}>
              {m.label}
            </text>
          </g>
        )
      })}
      <line x1={110} y1={y(0)} x2={154} y2={y(0)} stroke="#475569" strokeWidth={1.5} />
      <text x={95} y={y(0) + 4} textAnchor="end" fontSize={11} fill="#475569">
        0℃
      </text>
    </svg>
  )
}

export function Figure({ spec }: { spec: FigureSpec }) {
  const body = useMemo(() => {
    switch (spec.type) {
      case 'grid':
        return <Grid cells={spec.cells} highlight={spec.highlight} />
      case 'circle':
        return <MagicCircle center={spec.center} pairs={spec.pairs} />
      case 'bar':
        return <BarChart title={spec.title} bars={spec.bars} unit={spec.unit} />
      case 'pie':
        return <PieChart title={spec.title} slices={spec.slices} />
      case 'numberLine':
        return <NumberLine min={spec.min} max={spec.max} points={spec.points} />
      case 'plane':
        return <Plane x={spec.x} y={spec.y} points={spec.points} />
      case 'thermometer':
        return <Thermometer marks={spec.marks} />
      default:
        return null
    }
  }, [spec])
  return <div className="my-2 rounded-xl border border-slate-200 bg-white px-3 py-2">{body}</div>
}
