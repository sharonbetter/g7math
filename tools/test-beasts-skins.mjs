/**
 * 端到端：神兽收服 + 精灵形象（真实注册登录 + 服务端数据注入）。
 * ① 通关 3 关 → 3 只神兽绕毛栗转圈 ② 档案神兽图鉴（3 得 9 锁）
 * ③ 形象购买（雪团 8⚡）→ 穿上 → 毛栗全身变色 ④ 掉回原装
 */
import pw from '../app/node_modules/playwright/index.js'
const browser = await pw.chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
const ok = []
const check = (n, p) => { ok.push(p); console.log(`${p ? '✓' : '✗'} ${n}`) }
const { loginFresh, BASE } = await import('./e2e-helpers.mjs')

const phone = await loginFresh(page, { name: '神兽' })

// 注入通关 3 关 + 20 能量（服务端为准）
await page.evaluate(async () => {
  const now = Date.now()
  const loops = {}
  for (const id of ['7a-c1', '7a-c2', '7a-c3'])
    loops[id] = { chapterId: id, chapterTitle: id, round: 1, status: 'mastered', roundIds: ['r'], weakPointIds: [], updatedAt: now }
  const data = { rounds: {}, loops, studied: {}, perfected: {}, energy: 20, gems: {}, calcDone: {}, calcAttempts: {}, questionExplains: {}, outfits: { owned: [] } }
  await fetch('/api/data', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data, updatedAt: now }) })
})
await page.goto(BASE + '/#/')
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(2500)

// ① 神兽环绕首页毛栗
const orbit = await page.evaluate(() => {
  const rot = document.querySelector('.orbit-rot')
  const beasts = rot ? [...rot.children].map((c) => c.title) : []
  return { count: beasts.length, names: beasts }
})
check(`① 首页毛栗身边 ${orbit.count} 只神兽环绕（通关 3 关）${orbit.count === 3 ? '✓ ' + orbit.names.join('/') : '✗ ' + JSON.stringify(orbit.names)}`, orbit.count === 3)
const rotating = await page.evaluate(() => {
  const rot = document.querySelector('.orbit-rot')
  const rev = document.querySelector('.orbit-rev')
  return (rot && getComputedStyle(rot).animationName.includes('orbit')) && (rev && getComputedStyle(rev).animationName.includes('orbit'))
})
check('① 环绕旋转动画（正向+反向抵消保持立正）', rotating)
await page.screenshot({ path: '/tmp/beasts-orbit.png' })

// ② 档案神兽图鉴
await page.locator('button[title*="毛栗的冒险档案"]').click()
await page.waitForTimeout(700)
let t = await page.textContent('body')
check('② 档案头部「已收服神兽 3/12」', t.includes('已收服神兽 3/12'))
await page.locator('button:has-text("🐉 神兽")').click()
await page.waitForTimeout(400)
t = await page.textContent('body')
const gotCount = await page.locator('.grid > div.border-violet-200').count()
check(`② 图鉴 3 只已收服（玉兔/青鸾/玄武）`, t.includes('玉兔') && t.includes('青鸾') && t.includes('玄武') && gotCount === 3)
check('② 未收服 9 只灰显带锁', t.includes('🔒') && t.includes('金龙'))
await page.screenshot({ path: '/tmp/beasts-dex.png' })

// ③ 形象购买 + 穿上
await page.locator('button:has-text("✨ 形象")').click()
await page.waitForTimeout(400)
t = await page.textContent('body')
check('③ 形象铺（雪团/焰尾/竹隐/星夜/鎏金）', t.includes('雪团') && t.includes('焰尾') && t.includes('星夜') && t.includes('鎏金'))
const snowRow = page.locator('div.rounded-xl.border', { hasText: '雪团' }).first()
await snowRow.locator('button:has-text("兑换")').click()
await page.waitForTimeout(500)
await snowRow.locator('button:has-text("穿上")').click()
await page.waitForTimeout(600)
const bodyFill = await page.evaluate(() => {
  const m = document.querySelector('.fixed svg[aria-label="学伴精灵毛栗"]') ?? document.querySelector('svg[aria-label="学伴精灵毛栗"]')
  const ell = [...m.querySelectorAll('ellipse')].find((e) => e.getAttribute('cx') === '110' && e.getAttribute('cy') === '140')
  return ell?.getAttribute('fill')
})
check(`③ 穿雪团后毛栗身体换肤：${bodyFill}`, (bodyFill ?? '').includes('skin-snow'))
const energy = await page.evaluate(() => JSON.parse(localStorage.getItem('g7math.user.' + JSON.parse(localStorage.getItem('g7math.session.v1')).phone + '.v1')).energy)
check(`③ 能量扣减 20-8=12：实际 ${energy}`, energy === 12)
await page.locator('button:has-text("✕")').click()
await page.waitForTimeout(600)
const mapBody = await page.evaluate(() => {
  const m = document.querySelector('svg[aria-label="学伴精灵毛栗"]')
  const ell = [...m.querySelectorAll('ellipse')].find((e) => e.getAttribute('cx') === '110' && e.getAttribute('cy') === '140')
  return ell?.getAttribute('fill')
})
check(`③ 关闭档案首页毛栗同步雪团：${mapBody}`, (mapBody ?? '').includes('skin-snow'))
await page.screenshot({ path: '/tmp/skin-snow.png' })

// ④ 换回原装
await page.locator('button[title*="毛栗的冒险档案"]').click()
await page.waitForTimeout(500)
await page.locator('button:has-text("✨ 形象")').click()
await page.waitForTimeout(300)
const defRow = page.locator('div.rounded-xl.border', { hasText: '毛栗（原装）' }).first()
await defRow.locator('button').first().click().catch(() => {})
await page.waitForTimeout(400)
const backFill = await page.evaluate(() => {
  const m = document.querySelector('svg[aria-label="学伴精灵毛栗"]')
  const ell = [...m.querySelectorAll('ellipse')].find((e) => e.getAttribute('cx') === '110' && e.getAttribute('cy') === '140')
  return ell?.getAttribute('fill')
})
check(`④ 换回原装：${backFill}`, (backFill ?? '').includes('skin-default'))

console.log('JS 错误:', errors.length ? errors.slice(0, 2) : '无')
await browser.close()
process.exit(ok.every(Boolean) && errors.length === 0 ? 0 : 1)
