/** e2e 公共：注册一个随机账号并进入已登录状态（dev 后端返回验证码自动填） */
import pw from '../app/node_modules/playwright/index.js'

export const BASE = 'http://127.0.0.1:5273'

export async function loginFresh(page, { phone, password = 'test12345', name = '端到端' } = {}) {
  const p = phone ?? `139${String(Math.floor(Math.random() * 1e8)).padStart(8, '0')}`
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => (document.body.textContent ?? '').includes('手机号'), null, { timeout: 60000 })
  await page.waitForTimeout(800)
  await page.click('button:text-is("注册")')
  await page.fill('input[autocomplete="tel"]', p)
  await page.click('button:has-text("获取验证码")')
  await page.waitForFunction(() => {
    const el = document.querySelector('input[placeholder="6 位验证码"]')
    return el && /^\d{6}$/.test(el.value)
  }, { timeout: 15000 })
  await page.fill('input[autocomplete="new-password"]', password)
  await page.fill('input[placeholder="不填则显示手机号"]', name)
  await page.click('button:has-text("注册并登录")')
  await page.waitForFunction(() => (document.body.textContent ?? '').includes('首页'), { timeout: 20000 })
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
