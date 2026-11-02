import { Hono } from 'hono'
import { db, findUserByPhone, publicUser } from '../db'
import {
  allowRate,
  clearLoginFailure,
  generateCode,
  hashCode,
  isValidPhone,
  loginLockRemaining,
  passwordProblem,
  recordLoginFailure,
  verifyPassword,
  hashPassword,
} from '../authlib'
import { clientIp, clearSessionCookie, setSessionCookie, type AuthEnv } from '../session'
import { config } from '../config'

export const authRoutes = new Hono<AuthEnv>()

const CODE_TTL_MS = 5 * 60_000
const NAME_MAX = 16

function maskPhone(phone: string): string {
  return phone.length === 11 ? `${phone.slice(0, 3)}****${phone.slice(7)}` : phone
}

async function readBody(c: { req: { json(): Promise<unknown> } }): Promise<Record<string, unknown>> {
  try {
    const v = await c.req.json()
    return typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

// ---------------- 短信真实发送（凭证到位后接入；当前占位） ----------------

async function sendSms(phone: string, code: string): Promise<void> {
  if (!config.sms.provider) throw new Error('SMS_NOT_CONFIGURED')
  // TODO(里程碑 3 前)：接腾讯云 SMS SDK（SendSms），参数来自 config.sms
  throw new Error('SMS_NOT_IMPLEMENTED')
}

// ---------------- POST /api/auth/sms/send ----------------

authRoutes.post('/sms/send', async (c) => {
  const ip = clientIp(c)
  if (!allowRate(`sms:ip:${ip}`, 10, 86_400_000)) return c.json({ error: '今日发送次数过多，请明天再试' }, 429)
  if (!allowRate(`sms:ip-short:${ip}`, 5, 60_000)) return c.json({ error: '操作太频繁，请稍后再试' }, 429)

  const body = await readBody(c)
  const phone = String(body.phone ?? '')
  const purpose = body.purpose === 'reset' ? 'reset' : 'register'
  if (!isValidPhone(phone)) return c.json({ error: '请输入正确的 11 位手机号' }, 400)

  const existing = findUserByPhone(phone)
  if (purpose === 'register' && existing) return c.json({ error: '该手机号已注册，请直接登录' }, 409)
  if (purpose === 'reset' && !existing) return c.json({ error: '该手机号尚未注册' }, 404)

  // 同一手机号：60 秒一条、每天最多 5 条
  const now = Date.now()
  const last = db.prepare('SELECT created_at FROM sms_codes WHERE phone = ? ORDER BY id DESC LIMIT 1').get(phone) as
    | { created_at: number }
    | undefined
  if (last && now - last.created_at < 60_000) return c.json({ error: '发送太频繁，请 1 分钟后再试' }, 429)
  const nowD = new Date()
  const dayStart = Date.UTC(nowD.getUTCFullYear(), nowD.getUTCMonth(), nowD.getUTCDate())
  const todayCount = (
    db.prepare('SELECT COUNT(*) AS n FROM sms_codes WHERE phone = ? AND created_at >= ?').get(phone, dayStart) as {
      n: number
    }
  ).n
  if (todayCount >= 5) return c.json({ error: '该手机号今日验证码已达上限' }, 429)

  const code = generateCode()
  db.prepare('INSERT INTO sms_codes (phone, code_hash, purpose, expires_at, created_at, ip) VALUES (?, ?, ?, ?, ?, ?)').run(
    phone,
    hashCode(phone, code),
    purpose,
    now + CODE_TTL_MS,
    now,
    ip,
  )
  db.prepare('DELETE FROM sms_codes WHERE created_at < ?').run(now - 86_400_000)

  // 开发模式（未配置短信且非生产）：验证码直接返回 + 打日志，方便本地联调
  if (!config.sms.provider && !config.isProd) {
    console.log(`[sms] 开发模式验证码 ${phone} → ${code}`)
    return c.json({ ok: true, devCode: code })
  }
  try {
    await sendSms(phone, code)
  } catch {
    return c.json({ error: '短信服务尚未接入，暂时无法发送验证码' }, 503)
  }
  return c.json({ ok: true })
})

/** 校验并消耗一条验证码（只认最新一条未使用、未过期的） */
function consumeSmsCode(phone: string, code: string, purpose: string): boolean {
  const row = db
    .prepare('SELECT id, code_hash FROM sms_codes WHERE phone = ? AND purpose = ? AND used = 0 AND expires_at > ? ORDER BY id DESC LIMIT 1')
    .get(phone, purpose, Date.now()) as { id: number; code_hash: string } | undefined
  if (!row) return false
  if (row.code_hash !== hashCode(phone, code)) return false
  db.prepare('UPDATE sms_codes SET used = 1 WHERE id = ?').run(row.id)
  return true
}

// ---------------- POST /api/auth/register ----------------

authRoutes.post('/register', async (c) => {
  const ip = clientIp(c)
  if (!allowRate(`reg:ip:${ip}`, 10, 3_600_000)) return c.json({ error: '注册操作太频繁，请稍后再试' }, 429)

  const body = await readBody(c)
  const phone = String(body.phone ?? '')
  const code = String(body.code ?? '').trim()
  const password = String(body.password ?? '')
  const name = String(body.name ?? '').trim().slice(0, NAME_MAX)

  if (!isValidPhone(phone)) return c.json({ error: '请输入正确的 11 位手机号' }, 400)
  const pwProblem = passwordProblem(password)
  if (pwProblem) return c.json({ error: pwProblem }, 400)
  if (!consumeSmsCode(phone, code, 'register')) return c.json({ error: '验证码错误或已过期' }, 400)
  if (findUserByPhone(phone)) return c.json({ error: '该手机号已注册，请直接登录' }, 409)

  const now = Date.now()
  let user
  try {
    const info = db
      .prepare('INSERT INTO users (phone, password_hash, name, password_changed_at, created_at, last_login_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(phone, hashPassword(password), name || maskPhone(phone), now, now, now)
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid) as never
  } catch {
    return c.json({ error: '该手机号已注册，请直接登录' }, 409)
  }
  setSessionCookie(c, user)
  return c.json({ ok: true, user: publicUser(user) })
})

// ---------------- POST /api/auth/login ----------------

authRoutes.post('/login', async (c) => {
  const ip = clientIp(c)
  if (!allowRate(`login:ip:${ip}`, 30, 600_000)) return c.json({ error: '尝试过于频繁，请稍后再试' }, 429)

  const body = await readBody(c)
  const phone = String(body.phone ?? '')
  const password = String(body.password ?? '')
  if (!isValidPhone(phone) || !password) return c.json({ error: '请输入手机号和密码' }, 400)

  const lock = loginLockRemaining(`login:${phone}`)
  if (lock > 0) {
    const mins = Math.ceil(lock / 60_000)
    return c.json({ error: `密码错误次数过多，请 ${mins} 分钟后再试` }, 429)
  }

  const user = findUserByPhone(phone)
  if (!user || !verifyPassword(password, user.password_hash)) {
    recordLoginFailure(`login:${phone}`)
    return c.json({ error: '手机号或密码不正确' }, 401)
  }
  if (user.status !== 'active') return c.json({ error: '账号已被停用，请联系客服' }, 403)

  clearLoginFailure(`login:${phone}`)
  db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').run(Date.now(), user.id)
  setSessionCookie(c, user)
  return c.json({ ok: true, user: publicUser(user) })
})

// ---------------- POST /api/auth/reset-password ----------------

authRoutes.post('/reset-password', async (c) => {
  const ip = clientIp(c)
  if (!allowRate(`reset:ip:${ip}`, 10, 3_600_000)) return c.json({ error: '操作太频繁，请稍后再试' }, 429)

  const body = await readBody(c)
  const phone = String(body.phone ?? '')
  const code = String(body.code ?? '').trim()
  const password = String(body.password ?? '')
  if (!isValidPhone(phone)) return c.json({ error: '请输入正确的 11 位手机号' }, 400)
  const pwProblem = passwordProblem(password)
  if (pwProblem) return c.json({ error: pwProblem }, 400)

  const user = findUserByPhone(phone)
  if (!user) return c.json({ error: '该手机号尚未注册' }, 404)
  if (!consumeSmsCode(phone, code, 'reset')) return c.json({ error: '验证码错误或已过期' }, 400)

  // 改密码 → password_changed_at 变化 → 该用户所有旧会话令牌失效
  db.prepare('UPDATE users SET password_hash = ?, password_changed_at = ? WHERE id = ?').run(
    hashPassword(password),
    Date.now(),
    user.id,
  )
  const fresh = findUserByPhone(phone)!
  setSessionCookie(c, fresh)
  return c.json({ ok: true, user: publicUser(fresh) })
})

// ---------------- POST /api/auth/logout ----------------

authRoutes.post('/logout', (c) => {
  clearSessionCookie(c)
  return c.json({ ok: true })
})
