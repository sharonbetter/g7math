/**
 * 端到端：用户注册 → 登录态保持 → 登出 → 密码登录 → 错误密码拒绝。
 *
 * 前置：
 *   1. 后端已启动：cd server && npm run dev（开发模式，验证码以 devCode 返回并自动填入）
 *   2. 前端已启动：cd app && npm run dev
 *
 * 运行：node tools/e2e-auth.mjs
 */
import pw from '../app/node_modules/playwright/index.js'

const BASE = 'http://127.0.0.1:5273'
const phone = `138${String(Math.floor(Math.random() * 1e8)).padStart(8, '0')}`
const password = 'test12345'
const name = '端到端测试'

const browser = await pw.chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))

const fail = (msg) => {
  console.error(`✗ ${msg}`)
  process.exitCode = 1
}
const ok = (msg) => console.log(`✓ ${msg}`)

// ---- 1. 未登录应看到登录页（tab：注册） ----
await page.goto(BASE, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('button:text-is("注册")', { timeout: 20_000 })
ok('未登录显示登录页')

// ---- 2. 注册（验证码开发模式自动填入） ----
await page.click('button:text-is("注册")')
await page.fill('input[autocomplete="tel"]', phone)
await page.click('button:has-text("获取验证码")')
await page.waitForFunction(() => {
  const el = document.querySelector('input[placeholder="6 位验证码"]')
  return el && /^\d{6}$/.test(el.value)
}, { timeout: 15_000 })
ok(`验证码已自动填入（${phone}）`)
await page.fill('input[type="password"]', password)
await page.fill('input[placeholder="不填则显示手机号"]', name)
await page.click('button.btn-primary')

// ---- 3. 注册成功应进入首页（登录态生效） ----
await page.waitForSelector('nav a:has-text("课程中心")', { timeout: 20_000 })
ok('注册后进入首页')

const storedSession = await page.evaluate(() => localStorage.getItem('g7math.session.v1'))
if (!storedSession?.includes(phone)) fail('本机会话未写入')
else ok('本机会话已写入')

// ---- 4. 刷新后登录态保持（cookie 会话） ----
await page.reload({ waitUntil: 'domcontentloaded' })
await page.waitForSelector('nav a:has-text("课程中心")', { timeout: 20_000 })
ok('刷新后登录态保持')

// ---- 5. 云端数据接口可用（注册时已完成绑定/上传） ----
const cloud = await page.evaluate(async () => (await fetch('/api/data')).json())
ok(`云端数据可读（updatedAt=${cloud?.updatedAt ?? 'null'}）`)

// ---- 6. 退出登录 → 回到登录页 ----
await page.click('button:text-is("退出")')
await page.waitForSelector('button:text-is("注册")', { timeout: 20_000 })
ok('退出后回到登录页')

// ---- 7. 密码登录 ----
await page.fill('input[autocomplete="tel"]', phone)
await page.fill('input[type="password"]', password)
await page.click('button.btn-primary')
await page.waitForSelector('nav a:has-text("课程中心")', { timeout: 20_000 })
ok('密码登录成功')

// ---- 8. 错误密码应报错 ----
await page.click('button:text-is("退出")')
await page.waitForSelector('button:text-is("注册")', { timeout: 20_000 })
await page.fill('input[autocomplete="tel"]', phone)
await page.fill('input[type="password"]', 'wrongpass1')
await page.click('button.btn-primary')
await page.waitForSelector('text=手机号或密码不正确', { timeout: 15_000 })
ok('错误密码被拒绝')

if (errors.length) {
  fail(`页面报错：${errors.join(' | ')}`)
} else {
  ok('无页面错误')
}

await browser.close()
console.log(process.exitCode ? '\n结果：失败' : '\n结果：全部通过')
