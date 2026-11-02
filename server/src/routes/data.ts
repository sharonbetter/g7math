import { Hono } from 'hono'
import { db } from '../db'
import { requireAuth, type AuthEnv } from '../session'

export const dataRoutes = new Hono<AuthEnv>()
dataRoutes.use('*', requireAuth)

const MAX_DATA_BYTES = 5 * 1024 * 1024

/** GET /api/data：取云端学习数据（无则 updatedAt 为 null，客户端应上传本机数据完成首次绑定） */
dataRoutes.get('/', (c) => {
  const row = db.prepare('SELECT data, updated_at FROM user_data WHERE user_id = ?').get(c.var.user.id) as
    | { data: string; updated_at: number }
    | undefined
  if (!row) return c.json({ updatedAt: null, data: null })
  return c.json({ updatedAt: row.updated_at, data: JSON.parse(row.data) })
})

/** PUT /api/data：上传学习数据（最后写入胜出；服务端版本更新则返回 409 与云端内容） */
dataRoutes.put('/', async (c) => {
  let body: { data?: unknown; updatedAt?: unknown }
  try {
    body = (await c.req.json()) as typeof body
  } catch {
    return c.json({ error: '请求体不是合法 JSON' }, 400)
  }
  const { data, updatedAt } = body
  if (data === undefined || data === null || typeof data !== 'object') {
    return c.json({ error: '缺少 data' }, 400)
  }
  const clientUpdatedAt = typeof updatedAt === 'number' ? updatedAt : Date.now()
  const serialized = JSON.stringify(data)
  if (Buffer.byteLength(serialized, 'utf8') > MAX_DATA_BYTES) {
    return c.json({ error: '数据超过 5MB 上限' }, 413)
  }

  const row = db.prepare('SELECT updated_at FROM user_data WHERE user_id = ?').get(c.var.user.id) as
    | { updated_at: number }
    | undefined
  if (row && row.updated_at > clientUpdatedAt) {
    const serverRow = db.prepare('SELECT data, updated_at FROM user_data WHERE user_id = ?').get(c.var.user.id) as {
      data: string
      updated_at: number
    }
    return c.json({ error: '云端有更新的数据', updatedAt: serverRow.updated_at, data: JSON.parse(serverRow.data) }, 409)
  }

  db.prepare(
    'INSERT INTO user_data (user_id, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at',
  ).run(c.var.user.id, serialized, clientUpdatedAt)
  return c.json({ ok: true, updatedAt: clientUpdatedAt })
})
