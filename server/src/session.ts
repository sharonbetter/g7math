import type { MiddlewareHandler } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { getConnInfo } from '@hono/node-server/conninfo'
import type { Context } from 'hono'
import { config } from './config'
import { signToken, verifyToken } from './authlib'
import { findUserById, publicUser, type UserRow } from './db'

export type AuthEnv = { Variables: { user: UserRow } }

export function clientIp(c: Context): string {
  return getConnInfo(c).remote.address ?? 'unknown'
}

export function setSessionCookie(c: Context, user: UserRow) {
  setCookie(c, config.cookieName, signToken(user.id, user.password_changed_at), {
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
    secure: config.isProd,
    maxAge: config.sessionDays * 86_400,
  })
}

export function clearSessionCookie(c: Context) {
  deleteCookie(c, config.cookieName, { path: '/' })
}

/** 校验会话：有效则把用户行挂到 c.var.user；密码已改/被封禁的旧会话一律 401 */
export const requireAuth: MiddlewareHandler<AuthEnv> = async (c, next) => {
  const token = getCookie(c, config.cookieName)
  const payload = token ? verifyToken(token) : null
  if (!payload) return c.json({ error: '未登录' }, 401)
  const user = findUserById(payload.uid)
  if (!user) return c.json({ error: '未登录' }, 401)
  if (user.status !== 'active') return c.json({ error: '账号已被停用，请联系客服' }, 401)
  if (user.password_changed_at !== payload.pwv) return c.json({ error: '登录已过期，请重新登录' }, 401)
  c.set('user', user)
  await next()
}

export { publicUser }
