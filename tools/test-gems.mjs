/**
 * 端到端：能量石采矿战 v2。
 * ① 一题一屏 + 倒计时条 ② 全对 = 5 基础 + 3+4+5 连击 = 17 石/⚡
 * ③ 错第 1 题 = 4 基础 + 3+4 = 11 ④ 石头图标形态（鹅卵石 path）⑤ 持久化
 */
import pw from '../app/node_modules/playwright/index.js'
import { e2eLogin } from './lib/e2e-auth.mjs'
const browser = await pw.chromium.launch()
const page = await browser.newPage({ viewport: { width: 1024, height: 1200 } })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
const ok = []
const check = (n, p) => { ok.push(p); console.log(`${p ? '✓' : '✗'} ${n}`) }

await page.goto('http://127.0.0.1:5273/', { waitUntil: 'domcontentloaded' })
await e2eLogin(page, '13700000000', '采矿')
await page.evaluate(() => {
  localStorage.setItem('g7math.session.v1', JSON.stringify({ phone: '13700000000', name: '采矿' }))
  localStorage.setItem('g7math.user.13700000000.v1', JSON.stringify({ rounds: {}, loops: {}, studied: {}, perfected: {}, energy: 0, gems: {}, calcDone: {}, calcAttempts: {}, questionExplains: {} }))
})
const book = await page.evaluate(async () => (await (await fetch('/data/calc/trainings.json')).json()))
const ansMap = {}
for (const tr of book.trainings) for (const q of tr.questions) ansMap[q.stem.replace(/\s/g, '').slice(0, 10)] = q.answer

const playStone = async (wrongAt = -1) => {
  await page.locator('button[title*="题采矿"]').first().click()
  await page.waitForTimeout(700)
  const results = []
  for (let i = 0; i < 5; i++) {
    await page.waitForSelector('input[placeholder="答案"]', { state: 'visible', timeout: 8000 })
    const stem = (await page.textContent('.lb-rise .rounded-2xl')) ?? ''
    const key = stem.replace(/\s/g, '').slice(0, 10)
    const ans = i === wrongAt ? '必错的答案' : ansMap[key]
    await page.locator('input[placeholder="答案"]').fill(ans || '1')
    await page.locator('button:has-text("提交")').click()
    await page.waitForTimeout(1700)
  }
  await page.waitForTimeout(1600)
  const t = await page.textContent('body')
  const m = t.match(/采到 (\d+) 块能量石/)
  const n = m ? parseInt(m[1]) : -1
  const done = await page.locator('button:has-text("继续探索")').click().catch(() => null)
  await page.waitForTimeout(500)
  return n
}

// 准备：第二章
await page.goto('http://127.0.0.1:5273/#/curriculum/7a-c2')
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(1800)
let t = await page.textContent('body')
check('准备：第二章 3 颗宝石（💎 0/3）', t.includes('💎 0/3'))
const stoneBtns = await page.locator('button[title*="题采矿"]').count()
check(`路径上 ${stoneBtns} 颗鹅卵石宝石`, stoneBtns === 3)
// 图标为鹅卵石（不规则 path），不再是尖钻
const isPebble = await page.evaluate(() => {
  const svg = document.querySelector('button[title*="题采矿"] svg path')
  return svg?.getAttribute('d')?.includes('C') && !svg?.getAttribute('d')?.includes('L 36')
})
check('石头形状为鹅卵石轮廓', isPebble)
await page.screenshot({ path: '/tmp/gems-v2-map.png', fullPage: true })

// ① 一题一屏 + 倒计时
await page.locator('button[title*="题采矿"]').first().click()
await page.waitForTimeout(700)
t = await page.textContent('body')
const oneQ = await page.locator('.lb-rise .rounded-2xl').count()
check('① 一次只显示一题', oneQ === 1 && t.includes('第 1/5 题'))
const bar = await page.locator('.fixed .h-2\\.5 > div').first()
check('① 顶部倒计时进度条存在', (await page.locator('.fixed .h-2\\.5').count()) === 1)
const w1 = await bar.boundingBox()
await page.waitForTimeout(1200)
const w2 = await bar.boundingBox()
check(`① 进度条在走（${Math.round(w1.width)} → ${Math.round(w2.width)}px）`, w2.width < w1.width)
await page.locator('button:has-text("继续探索"), button:has-text("稍后再来")').first().click().catch(() => page.keyboard.press('Escape'))
await page.keyboard.press('Escape')
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(1500)

// ② 全对 = 17（5 + 3+4+5）
const allRight = await playStone(-1)
check(`② 5 题全对采到 ${allRight} 块（应为 17 = 5基础+3+4+5连击）`, allRight === 17)
const st = await page.evaluate(() => JSON.parse(localStorage.getItem('g7math.user.13700000000.v1')))
check(`② 能量入账 ${st.energy}⚡（=17）`, st.energy === 17)
await page.screenshot({ path: '/tmp/gems-v2-done.png' })

// ③ 错第 1 题 = 4 + 3 + 4 = 11
const oneWrong = await playStone(0)
check(`③ 首题答错采到 ${oneWrong} 块（应为 11 = 4基础+3+4连击）`, oneWrong === 11)
const st2 = await page.evaluate(() => JSON.parse(localStorage.getItem('g7math.user.13700000000.v1')))
check(`③ 累计能量 ${st2.energy}⚡（17+11=28）`, st2.energy === 28)

// ④ 第三颗（错第 3 题：前2基础+后2基础+第5连?错第3则combo断，第4、5连不成3连？错第3 → combo0；题4对 combo1、题5对 combo2 → 无连击 → 4 基础）
const midWrong = await playStone(2)
check(`③ 错第 3 题采到 ${midWrong} 块（应为 4，无连击）`, midWrong === 4)

console.log('JS 错误:', errors.length ? errors.slice(0, 2) : '无')
await browser.close()
process.exit(ok.every(Boolean) && errors.length === 0 ? 0 : 1)
