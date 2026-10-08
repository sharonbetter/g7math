import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { logout, maskPhone, useSession } from '../lib/auth'

export function Card({
  children,
  className = '',
  onClick,
}: {
  children: ReactNode
  className?: string
  onClick?: () => void
}) {
  return (
    <div className={`card ${className}`} onClick={onClick}>
      {children}
    </div>
  )
}

export function Badge({
  children,
  tone = 'gray',
}: {
  children: ReactNode
  tone?: 'gray' | 'blue' | 'green' | 'red' | 'amber' | 'violet'
}) {
  const tones: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-600 border-gray-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    violet: 'bg-violet-50 text-violet-700 border-violet-200',
  }
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  )
}

export function Stat({
  label,
  value,
  hint,
  tone = 'ink',
}: {
  label: string
  value: ReactNode
  hint?: string
  tone?: 'ink' | 'green' | 'red' | 'amber' | 'blue'
}) {
  const colors: Record<string, string> = {
    ink: 'text-gray-900',
    green: 'text-green-600',
    red: 'text-red-600',
    amber: 'text-amber-600',
    blue: 'text-blue-600',
  }
  return (
    <div className="card px-4 py-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`mt-1 text-xl font-semibold tabular-nums ${colors[tone]}`}>{value}</div>
      {hint ? <div className="mt-0.5 text-xs text-gray-400">{hint}</div> : null}
    </div>
  )
}

export function ProgressBar({ value, max, tone = 'blue' }: { value: number; max: number; tone?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  const colors: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    amber: 'bg-amber-500',
  }
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
      <div className={`h-full rounded-full ${colors[tone] ?? colors.blue}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function Empty({ title, hint }: { title: string; hint?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <div className="text-base font-medium text-gray-700">{title}</div>
      {hint ? <div className="max-w-md text-sm text-gray-500">{hint}</div> : null}
    </div>
  )
}

const NAV = [
  { to: '/', label: '首页' },
  { to: '/curriculum', label: '课程中心' },
  { to: '/exams', label: '章节考评' },
  { to: '/remedial', label: '专项提升' },
  { to: '/book', label: '探究新思维' },
  { to: '/progress', label: '学习报告' },
]

export function Layout({ children }: { children: ReactNode }) {
  const loc = useLocation()
  const session = useSession()
  const isRunner = loc.pathname.startsWith('/run/')
  return (
    <div className="min-h-full">
      {!isRunner && (
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-5">
            <Link to="/" className="flex items-center gap-2 text-[15px] font-semibold text-gray-900">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-sm text-white">
                七
              </span>
              七年级数学学习工具
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              {NAV.map((n) => {
                const active = n.to === '/' ? loc.pathname === '/' : loc.pathname.startsWith(n.to)
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    className={`rounded-lg px-3 py-1.5 transition ${
                      active ? 'bg-blue-50 font-medium text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {n.label}
                  </Link>
                )
              })}
            </nav>
            <div className="ml-auto flex items-center gap-3 text-xs text-gray-500">
              {session && (
                <span>
                  {session.name}
                  <span className="ml-1 text-gray-400">{maskPhone(session.phone)}</span>
                </span>
              )}
              <button type="button" className="btn !py-1 !text-xs" onClick={logout}>
                退出
              </button>
            </div>
          </div>
        </header>
      )}
      <main className={isRunner ? '' : 'mx-auto max-w-6xl px-5 py-6'}>
        {children}
      </main>
    </div>
  )
}
