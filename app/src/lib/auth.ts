import { useEffect, useState } from 'react'
import { api, ApiError } from './api'

const SESSION_KEY = 'g7math.session.v1'

export interface SessionUser {
  phone: string
  name: string
  role: string
  status?: string
  membershipExpiresAt?: number | null
  createdAt: number
}

const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((fn) => fn())
}

export function normalizePhone(raw: string): string {
  return raw.replace(/[^\d]/g, '')
}

export function isValidPhone(phone: string): boolean {
  return /^1\d{10}$/.test(phone)
}

export function maskPhone(phone: string): string {
  return phone.length === 11 ? `${phone.slice(0, 3)}****${phone.slice(7)}` : phone
}

/** 某用户学习数据在本机的存储键（store.ts 与登录迁移共用，必须同源） */
export function userDataKey(phone: string): string {
  return `g7math.user.${phone}.v1`
}

function readLocalSession(): SessionUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const u = JSON.parse(raw) as SessionUser
    return u?.phone ? u : null
  } catch {
    return null
  }
}

let session: SessionUser | null = readLocalSession()
let ready = false

// 启动时向后端确认会话：
//   200 → 已登录；401 → 未登录；不可达（本地开发没起后端 / 离线）→ 沿用本机会话，本机数据仍可用
void (async () => {
  try {
    const { user } = await api<{ user: SessionUser }>('/api/me')
    session = user
    localStorage.setItem(SESSION_KEY, JSON.stringify(user))
    // cookie 还在但本机没有该账号数据（换设备/清过缓存）→ 从云端拉取
    if (!localStorage.getItem(userDataKey(user.phone))) {
      try {
        const res = await api<{ updatedAt: number | null; data: unknown }>('/api/data')
        if (res.updatedAt != null && res.data) {
          localStorage.setItem(userDataKey(user.phone), JSON.stringify(res.data))
        }
      } catch {
        // 拉取失败不阻断：本机从空数据开始，下次登录会再同步
      }
    }
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      session = null
      localStorage.removeItem(SESSION_KEY)
    } else {
      session = readLocalSession()
    }
  } finally {
    ready = true
    notify()
  }
})()

export function getSession(): SessionUser | null {
  return session
}

export function useSession(): SessionUser | null {
  const [, force] = useState(0)
  useEffect(() => {
    const fn = () => force((x) => x + 1)
    listeners.add(fn)
    return () => {
      listeners.delete(fn)
    }
  }, [])
  return session
}

/** 含启动就绪状态：ready=false 时应用尚未确认登录态，先渲染加载页避免闪登录页 */
export function useAuthState(): { session: SessionUser | null; ready: boolean } {
  const s = useSession()
  return { session: s, ready }
}

/** 登录/注册成功后的收尾：同步学习数据 → 写本机会话 → 通知全局 */
async function establishSession(user: SessionUser) {
  try {
    // 云端有数据 → 取回（换设备/多端一致）；云端没有 → 把本机数据上传（老用户首次绑定账号）
    const res = await api<{ updatedAt: number | null; data: unknown }>('/api/data')
    if (res.updatedAt != null && res.data) {
      localStorage.setItem(userDataKey(user.phone), JSON.stringify(res.data))
    } else {
      const raw = localStorage.getItem(userDataKey(user.phone))
      if (raw) {
        await api('/api/data', { method: 'PUT', body: { data: JSON.parse(raw), updatedAt: Date.now() } })
      }
    }
  } catch {
    // 同步失败不阻断登录：本机数据仍完整可用，之后登录会再同步
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  session = user
  notify()
}

/** 发送短信验证码；开发模式（后端未配置短信）会带 devCode 便于联调 */
export function sendSmsCode(phone: string, purpose: 'register' | 'reset'): Promise<{ devCode?: string }> {
  return api('/api/auth/sms/send', { method: 'POST', body: { phone, purpose } })
}

export async function registerWithCode(arg: {
  phone: string
  code: string
  password: string
  name?: string
}): Promise<void> {
  const { user } = await api<{ user: SessionUser }>('/api/auth/register', { method: 'POST', body: arg })
  await establishSession(user)
}

export async function loginWithPassword(phone: string, password: string): Promise<void> {
  const { user } = await api<{ user: SessionUser }>('/api/auth/login', { method: 'POST', body: { phone, password } })
  await establishSession(user)
}

export async function resetPasswordWithCode(phone: string, code: string, password: string): Promise<void> {
  const { user } = await api<{ user: SessionUser }>('/api/auth/reset-password', {
    method: 'POST',
    body: { phone, code, password },
  })
  await establishSession(user)
}

export function logout() {
  localStorage.removeItem(SESSION_KEY)
  session = null
  notify()
  // 后端不可达（离线）时静默失败
  void api('/api/auth/logout', { method: 'POST' }).catch(() => {})
}
