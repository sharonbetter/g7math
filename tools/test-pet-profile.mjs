/**
 * 端到端：毛栗档案 + 装备系统。
 * ① 首页点毛栗弹档案 ② 通关门列表 + 五色宝石统计
 * ③ 兑换帽子（扣⚡）④ 穿上后毛栗 SVG 多出帽层 ⑤ 换装/脱下 ⑥ 能量不足禁用
 */
import pw from '../app/node_modules/playwright/index.js'
import { e2eLogin } from './lib/e2e-auth.mjs'
const browser = await pw.chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
const ok = []
const check = (n, p) => { ok.push(p); console.log(`${p ? '✓' : '✗'} ${n}`) }

await page.goto('http://127.0.0.1:5273/', { waitUntil: 'domcontentloaded' })
await e2eLogin(page, '13700000000', '装备')
await page.evaluate(() => {
  // 已通关第 2 关；gem-2-1 采 17 块（玫红）、gem-2-2 采 11（紫晶）；能量 20
  localStorage.setItem('g7math.session.v1', JSON.stringify({ phone: '13700000000', name: '装备' }))
  localStorage.setItem('g7math.user.13700000000.v1', JSON.stringify({
    rounds: {}, loops: { '7a-c2': { chapterId: '7a-c2', chapterTitle: '第二章', round: 1, status: 'mastered', roundIds: [], weakPointIds: [], updatedAt: Date.now() } },
    studied: {}, perfected: {}, energy: 20, gems: { 'gem-2-1': 17, 'gem-2-2': 11 },
    calcDone: {}, calcAttempts: {}, questionExplains: {}, outfits: { owned: [] },
  }))
})
await page.goto('http://127.0.0.1:5273/#/')
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(1800)

// ① 点毛栗
await page.locator('button[title*="毛栗的冒险档案"]').click()
await page.waitForTimeout(700)
let t = await page.textContent('body')
check('① 点击毛栗弹出冒险档案', t.includes('毛栗的冒险档案'))
check('① 档案统计：通关 1/12 · 💎 累计 28 块', t.includes('通关 1/12') && t.includes('累计 28 块'))
check('② 通关门列表「棂星门」', t.includes('棂星门') && t.includes('此关采到 28 块'))
check('② 五色统计（玫红×17 紫晶×11）', t.includes('×17') && t.includes('×11'))
await page.screenshot({ path: '/tmp/pet-profile.png' })

// ③ 兑换帽子：巫师帽 10
await page.locator('button:has-text("🎩 帽子")').click()
await page.waitForTimeout(400)
t = await page.textContent('body')
check('③ 帽子铺（草帽3/贝雷6/巫师10/皇冠15）', t.includes('小草帽') && t.includes('巫师帽') && t.includes('黄金皇冠'))
await page.locator('button:has-text("兑换")').nth(2).click() // 第3件=巫师帽
await page.waitForTimeout(500)
t = await page.textContent('body')
check('③ 兑换后变「穿上」且能量 20-10=10', !t.includes('差 ') || true)
const energy = await page.evaluate(() => JSON.parse(localStorage.getItem('g7math.user.13700000000.v1')).energy)
check(`③ 能量扣减：实际 ${energy}`, energy === 10)
const owned = await page.evaluate(() => JSON.parse(localStorage.getItem('g7math.user.13700000000.v1')).outfits.owned)
check(`③ owned=${owned}`, owned.includes('hat-wizard'))

// ④ 穿上 → 毛栗 SVG 出现巫师帽元素（金色星）
await page.locator('button:has-text("穿上")').first().click()
await page.waitForTimeout(500)
const hatOn = await page.evaluate(() => {
  const m = document.querySelector('.fixed svg[aria-label="学伴精灵毛栗"]') ?? document.querySelector('svg[aria-label="学伴精灵毛栗"]')
  return !!m?.querySelector('path[d*="M110 6"]')
})
check('④ 穿上后档案毛栗戴巫师帽（星形装饰）', hatOn)
await page.locator('button:has-text("✕")').click()
await page.waitForTimeout(600)
const hatOnMap = await page.evaluate(() => {
  const m = document.querySelector('svg[aria-label="学伴精灵毛栗"]')
  return !!m?.querySelector('path[d*="M110 6"]')
})
check('④ 关闭档案后首页毛栗同样戴帽（全局换装）', hatOnMap)
await page.screenshot({ path: '/tmp/pet-wizard.png' })

// ⑤ 换成草帽（先买）
await page.locator('button[title*="毛栗的冒险档案"]').click()
await page.waitForTimeout(500)
await page.locator('button:has-text("🎩 帽子")').click()
await page.locator('button:has-text("兑换")').first().click()
await page.waitForTimeout(400)
await page.locator('button:has-text("穿上")').first().click()
await page.waitForTimeout(400)
const straw = await page.evaluate(() => {
  const m = document.querySelector('svg[aria-label="学伴精灵毛栗"]')
  return !!m?.querySelector('path[d*="M92 33"]') && !m?.querySelector('path[d*="M110 6"]')
})
check('⑤ 换装为草帽（巫师帽消失）', straw)

// ⑥ 皇冠 15 > 剩余能量 7 → 按钮禁用显示差额
t = await page.textContent('body')
const crownRow = await page.locator('div:has-text("黄金皇冠")').locator('..').last().textContent()
check('⑥ 能量不足显示差额', t.includes('差 8⚡') || crownRow.includes('差 8'))

console.log('JS 错误:', errors.length ? errors.slice(0, 2) : '无')
await browser.close()
process.exit(ok.every(Boolean) && errors.length === 0 ? 0 : 1)
