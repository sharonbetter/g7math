import { createHmac, randomBytes, randomInt, scryptSync, timingSafeEqual } from 'node:crypto'
import { config } from './config'

// ---------------- 密码：scrypt（node:crypto 内置，无原生编译依赖） ----------------

export function hashPassword(password: string): string {
  const salt = randomBytes(16)
  const key = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 })
  return `scrypt$${salt.toString('base64url')}$${key.toString('base64url')}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, saltB64, keyB64] = stored.split('$')
  if (scheme !== 'scrypt' || !saltB64 || !keyB64) return false
  const key = scryptSync(password, Buffer.from(saltB64, 'base64url'), 64, { N: 16384, r: 8, p: 1 })
  const expected = Buffer.from(keyB64, 'base64url')
  return key.length === expected.length && timingSafeEqual(key, expected)
}

// ---------------- 会话令牌：HMAC-SHA256 签名（无第三方依赖） ----------------

export interface TokenPayload {
  uid: number
  /** 密码版本 = users.password_changed_at，改密码后旧令牌全部失效 */
  pwv: number
  exp: number
}

const b64url = (obj: unknown) => Buffer.from(JSON.stringify(obj)).toString('base64url')

export function signToken(uid: number, pwv: number): string {
  const payload: TokenPayload = { uid, pwv, exp: Date.now() + config.sessionDays * 86_400_000 }
  const body = b64url(payload)
  const sig = createHmac('sha256', config.authSecret).update(body).digest('base64url')
  return `${body}.${sig}`
}

export function verifyToken(token: string): TokenPayload | null {
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  const expected = createHmac('sha256', config.authSecret).update(body).digest('base64url')
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as TokenPayload
    if (typeof payload.uid !== 'number' || typeof payload.pwv !== 'number') return null
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

// ---------------- 短信验证码 ----------------

/** 验证码哈希存储，避免库被拖走后验证码明文泄露 */
export function hashCode(phone: string, code: string): string {
  return createHmac('sha256', config.authSecret).update(`${phone}:${code}`).digest('hex')
}

export function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0')
}

// ---------------- 内存限流（单实例部署足够；换多实例时改用 Redis） ----------------

const hits = new Map<string, number[]>()

/** 滑动窗口：窗口内超过 max 次则拒绝 */
export function allowRate(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  if (hits.size > 10_000) {
    for (const [k, list] of hits) {
      if (list.every((t) => now - t > windowMs)) hits.delete(k)
    }
  }
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
  if (list.length >= max) {
    hits.set(key, list)
    return false
  }
  list.push(now)
  hits.set(key, list)
  return true
}

const loginFails = new Map<string, { count: number; lockedUntil: number }>()

/** 登录连续失败锁定：5 次失败锁 10 分钟。返回剩余锁定毫秒数（0 = 未锁） */
export function loginLockRemaining(key: string): number {
  const rec = loginFails.get(key)
  if (!rec) return 0
  if (rec.lockedUntil > Date.now()) return rec.lockedUntil - Date.now()
  if (rec.lockedUntil && rec.lockedUntil <= Date.now()) loginFails.delete(key)
  return 0
}

export function recordLoginFailure(key: string) {
  const rec = loginFails.get(key)
  const count = (rec?.count ?? 0) + 1
  if (count >= 5) {
    loginFails.set(key, { count: 0, lockedUntil: Date.now() + 10 * 60_000 })
  } else {
    loginFails.set(key, { count, lockedUntil: 0 })
  }
}

export function clearLoginFailure(key: string) {
  loginFails.delete(key)
}

// ---------------- 校验工具 ----------------

export function isValidPhone(phone: string): boolean {
  return /^1\d{10}$/.test(phone)
}

export function passwordProblem(password: string): string | null {
  if (typeof password !== 'string' || password.length < 8) return '密码至少 8 位'
  if (password.length > 72) return '密码过长'
  return null
}
