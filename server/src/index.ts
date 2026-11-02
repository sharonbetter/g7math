import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { config } from './config'
import { publicUser, requireAuth, type AuthEnv } from './session'
import { authRoutes } from './routes/auth'
import { dataRoutes } from './routes/data'

const app = new Hono<AuthEnv>()

app.use(logger())
app.onError((err, c) => {
  console.error('[server] 未捕获错误', err)
  return c.json({ error: '服务器开小差了，请稍后重试' }, 500)
})

app.get('/api/health', (c) => c.json({ ok: true }))

app.route('/api/auth', authRoutes)
app.route('/api/data', dataRoutes)

/** GET /api/me：当前登录用户（含会员信息） */
app.get('/api/me', requireAuth, (c) => c.json({ user: publicUser(c.var.user) }))

serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`[server] g7math 后端已启动 http://127.0.0.1:${info.port}（${config.isProd ? '生产' : '开发'}模式）`)
  if (!config.sms.provider && !config.isProd) {
    console.log('[server] 短信未配置：注册/找回的验证码将以 devCode 返回（仅限开发模式）')
  }
})
