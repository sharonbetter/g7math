import { useEffect, useState } from 'react'

const SESSION_KEY = 'g7math.session.v1'
const USERS_KEY = 'g7math.users.v1'

export interface SessionUser {
  phone: string
  name: string
  createdAt: number
}

const listeners = new Set<() => void>()

function readUsers(): Record<string, SessionUser> {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? (JSON.parse(raw) as Record<string, SessionUser>) : {}
  } catch {
    return {}
  }
}

function readSession(): SessionUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const user = JSON.parse(raw) as SessionUser
    return user?.phone ? user : null
  } catch {
    return null
  }
}

let session: SessionUser | null = readSession()

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

/** 手机号即唯一用户。第一次登录自动建档，之后进入该手机号自己的学习数据。 */
export function login(phoneRaw: string, nameRaw: string): { ok: true } | { ok: false; message: string } {
  const phone = normalizePhone(phoneRaw)
  if (!isValidPhone(phone)) return { ok: false, message: '请输入 11 位手机号，以 1 开头。' }
  const name = nameRaw.trim() || maskPhone(phone)
  const users = readUsers()
  const existing = users[phone]
  const user: SessionUser = existing
    ? { ...existing, name: nameRaw.trim() ? name : existing.name }
    : { phone, name, createdAt: Date.now() }
  users[phone] = user
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  session = user
  notify()
  return { ok: true }
}

export function logout() {
  localStorage.removeItem(SESSION_KEY)
  session = null
  notify()
}
