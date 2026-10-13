import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { logout, maskPhone, useSession } from '../lib/auth'
import { computeIncentives } from '../lib/incentives'
import { useAppData } from '../lib/store'

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
    gray: 'bg-gray-100/90 text-gray-600',
    blue: 'bg-indigo-50 text-indigo-700',
    green: 'bg-emerald-50 text-emerald-700',
    red: 'bg-rose-50 text-rose-700',
    amber: 'bg-amber-50 text-amber-700',
    violet: 'bg-violet-50 text-violet-700',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}
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
    <div className="card px-3.5 py-2.5">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`mt-1 text-lg font-semibold tabular-nums ${colors[tone]}`}>{value}</div>
      {hint ? <div className="mt-0.5 text-xs text-gray-400">{hint}</div> : null}
    </div>
  )
}

export function ProgressBar({ value, max, tone = 'blue' }: { value: number; max: number; tone?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  const colors: Record<string, string> = {
    blue: 'bg-gradient-to-r from-indigo-500 to-blue-500',
    green: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    amber: 'bg-gradient-to-r from-amber-400 to-orange-500',
  }
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100/90">
      <div
        className={`h-full rounded-full transition-[width] duration-300 ${colors[tone] ?? colors.blue}`}
        style={{ width: `${pct}%` }}
      />
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

/** 轻量弹窗：点遮罩或 Esc 关闭 */
export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-gray-950/45 backdrop-blur-sm" onClick={onClose} />
      <div className="card relative flex max-h-[82vh] w-full max-w-lg flex-col !bg-white/95 p-5 shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <h3 className="text-[15px] font-semibold text-gray-900">{title}</h3>
          <button
            className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            onClick={onClose}
            aria-label="关闭"
          >
            ✕
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto pt-4">{children}</div>
      </div>
    </div>
  )
}

const NAV = [
  { to: '/', label: '首页' },
  { to: '/curriculum', label: '课程中心' },
  { to: '/calc', label: '计算专项' },
  { to: '/exams', label: '章节考评' },
  { to: '/remedial', label: '专项提升' },
  { to: '/book', label: '探究新思维' },
  { to: '/progress', label: '学习报告' },
]

export function Layout({ children }: { children: ReactNode }) {
  const loc = useLocation()
  const session = useSession()
  const data = useAppData()
  const game = computeIncentives(data)
  const earnedBadges = game.badges.filter((b) => b.earned)
  const isRunner = loc.pathname.startsWith('/run/')
  return (
    <div className="min-h-full">
      {!isRunner && (
        <header className="sticky top-0 z-20 border-b border-white/60 bg-white/70 backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent" />
          <div className="mx-auto flex h-12 max-w-6xl items-center gap-4 px-4 md:gap-6 md:px-5">
            <Link to="/" className="flex shrink-0 items-center gap-2.5 text-sm font-semibold text-gray-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-sm text-white shadow-md shadow-indigo-500/30">
                七
              </span>
              七年级
            </Link>
            <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {NAV.map((n) => {
                const active = n.to === '/' ? loc.pathname === '/' : loc.pathname.startsWith(n.to)
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    className={`shrink-0 rounded-full px-3.5 py-1.5 transition ${
                      active
                        ? 'bg-gradient-to-r from-indigo-500 to-blue-500 font-medium text-white shadow-sm shadow-indigo-500/30'
                        : 'text-gray-600 hover:bg-white/80 hover:text-gray-900'
                    }`}
                  >
                    {n.label}
                  </Link>
                )
              })}
            </nav>
            <div className="ml-auto flex items-center gap-3 text-xs text-gray-500">
              {session && (
                <Link
                  to="/progress"
                  title="查看完整等级与徽章"
                  className="flex items-center gap-2 rounded-full border border-indigo-100 bg-white/70 py-1 pl-1 pr-3 shadow-sm transition hover:border-indigo-200 hover:shadow"
                >
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 px-1.5 text-[10px] font-semibold text-white">
                    Lv.{game.level}
                  </span>
                  <span className="flex flex-col leading-tight">
                    <span className="text-gray-800">{session.name}</span>
                    <span className="text-[10px] text-gray-400">
                      {maskPhone(session.phone)} · {game.levelName} · 徽章 {game.earnedCount}/{game.badges.length}
                    </span>
                  </span>
                  {earnedBadges.length > 0 && (
                    <span className="ml-1 flex items-center gap-0.5 text-sm">
                      {earnedBadges.slice(0, 6).map((b) => (
                        <span key={b.id} title={`${b.name}：${b.desc}`}>
                          {b.icon}
                        </span>
                      ))}
                      {earnedBadges.length > 6 && (
                        <span className="text-[10px] text-gray-400">+{earnedBadges.length - 6}</span>
                      )}
                    </span>
                  )}
                </Link>
              )}
              <button type="button" className="btn !py-1 !text-xs" onClick={logout}>
                退出
              </button>
            </div>
          </div>
        </header>
      )}
      <main className={isRunner ? '' : 'mx-auto max-w-6xl px-4 py-4 md:px-5'}>
        {children}
      </main>
    </div>
  )
}
