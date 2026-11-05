/** e2e 公共：注册一个随机账号并进入已登录状态（dev 后端返回验证码自动填） */
import pw from '../app/node_modules/playwright/index.js'

export const BASE = 'http://127.0.0.1:5273'

export async function loginFresh(page, { phone, password = 'test12345', name = '端到端' } = {}) {
  const p = phone ?? `139${String(Math.floor(Math.random() * 1e8)).padStart(8, '0')}`
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => (document.body.textContent ?? '').includes('手机号'), null, { timeout: 60000 })
  await page.waitForTimeout(600)
  // API 直注（dev 后端返回 devCode，绕过 UI 等待）
  const result = await page.evaluate(async ([phone, password, name]) => {
    const sms = await fetch('/api/auth/sms/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, purpose: 'register' }) })
    const smsBody = await sms.json()
    if (!smsBody.devCode) return { error: 'no devCode: ' + JSON.stringify(smsBody) }
    const reg = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, code: smsBody.devCode, password, name }) })
    if (!reg.ok) return { error: 'register failed: ' + (await reg.text()).slice(0, 120) }
    return { ok: true }
  }, [p, password, name])
  if (result.error) throw new Error(result.error)
  // 写入前端会话（与 loginPassword 相同路径）
  await page.evaluate(async ([phone, password]) => {
    const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, password }) })
    const { token, user } = await res.json()
    localStorage.setItem('g7math.session.v1', JSON.stringify({ ...user, token }))
  }, [p, password])
  await page.goto(BASE + '/#/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  return p
}

/** 已注册账号的密码登录 */
export async function loginWithPassword(page, phone, password = 'test12345') {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.fill('input[autocomplete="tel"]', phone)
  await page.fill('input[type="password"]', password)
  await page.click('button:text-is("登录")')
  await page.waitForFunction(() => !(document.body.textContent ?? '').includes('手机号密码登录'), { timeout: 20000 })
}
