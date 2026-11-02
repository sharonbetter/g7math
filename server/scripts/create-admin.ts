/**
 * 创建/重置管理员账号：
 *   npm run create-admin -- <手机号> <密码> [姓名]
 * 已存在则改为管理员并重置密码（该账号所有旧会话失效）。
 */
import { randomBytes } from 'node:crypto'
import { db } from '../src/db'
import { hashPassword, isValidPhone, passwordProblem } from '../src/authlib'

const [phone, passwordArg, nameArg] = process.argv.slice(2)

if (!isValidPhone(phone ?? '')) {
  console.error('用法：npm run create-admin -- <11位手机号> <密码(至少8位，可省略自动生成)> [姓名]')
  process.exit(1)
}
const password = passwordArg && !passwordProblem(passwordArg) ? passwordArg : `G7admin-${randomBytes(6).toString('hex')}`
const name = (nameArg ?? '').trim() || '管理员'

const now = Date.now()
const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone)
if (existing) {
  db.prepare('UPDATE users SET password_hash = ?, name = ?, role = ?, password_changed_at = ? WHERE phone = ?').run(
    hashPassword(password),
    name,
    'admin',
    now,
    phone,
  )
  console.log(`已将 ${phone} 重置为管理员（旧登录态已全部失效）`)
} else {
  db.prepare(
    'INSERT INTO users (phone, password_hash, name, role, password_changed_at, created_at) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(phone, hashPassword(password), name, 'admin', now, now)
  console.log(`已创建管理员 ${phone}`)
}
console.log(`姓名：${name}`)
console.log(`密码：${password}`)
