import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** server/ 目录（src/config.ts 的上上级） */
export const SERVER_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

// 极简 .env 加载：无需额外依赖，已设置的环境变量优先
const envPath = join(SERVER_ROOT, '.env')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (!m) continue
    if (process.env[m[1]] !== undefined) continue
    let v = m[2]
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    process.env[m[1]] = v
  }
}

const isProd = process.env.NODE_ENV === 'production'

const authSecret = process.env.AUTH_SECRET || (isProd ? '' : 'g7math-dev-secret-do-not-use-in-prod')

export const config = {
  port: Number(process.env.PORT || 8787),
  isProd,
  authSecret,
  dbPath: process.env.DB_PATH || join(SERVER_ROOT, 'data', 'g7math.db'),
  cookieName: 'g7sess',
  sessionDays: 30,
  sms: {
    provider: process.env.SMS_PROVIDER || '',
    secretId: process.env.SMS_SECRET_ID || '',
    secretKey: process.env.SMS_SECRET_KEY || '',
    sign: process.env.SMS_SIGN || '',
    templateId: process.env.SMS_TEMPLATE_ID || '',
  },
}

if (!config.authSecret) {
  throw new Error('生产环境必须在 server/.env 配置 AUTH_SECRET（可用 openssl rand -hex 32 生成）')
}
