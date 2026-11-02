/**
 * 端到端：课内微战役（简报 → 课件 → 迷雾守卫微战 → 战报 → 回关卡闪耀点亮）。
 */
import pw from '../app/node_modules/playwright/index.js'
import { e2eLogin } from './lib/e2e-auth.mjs'

const browser = await pw.chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
const ok = []
const check = (name, pass) => { ok.push(pass); console.log(`${pass ? '✓' : '✗'} ${name}`) }

await page.goto('http://127.0.0.1:5273/', { waitUntil: 'domcontentloaded' })
await e2eLogin(page, '13700000000', '微战测试')
await page.evaluate(() => {
  localStorage.setItem('g7math.session.v1', JSON.stringify({ phone: '13700000000', name: '微战测试' }))
  localStorage.setItem('g7math.user.13700000000.v1', JSON.stringify({ rounds: {}, loops: {}, studied: {}, perfected: {}, energy: 0, calcDone: {}, calcAttempts: {}, questionExplains: {} }))
})

// 拿这课的自测答案
const lessonData = await page.evaluate(async () => (await (await fetch('/data/lessons/7a-c1.json')).json()))
const lesson = lessonData.lessons.find((l) => l.pointId === '7a-1-02')
console.log(`课：${lesson.title}，自测 ${lesson.checkQuestions.length} 题`)

await page.goto('http://127.0.0.1:5273/#/lesson/7a-1-02')
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(1500)

// ① 简报
let body = await page.textContent('body')
check('① 任务简报弹出（含目标与微战说明）', body.includes('任务简报') && body.includes('迷雾守卫微战'))
check('① 简报带削血预告（Boss N 道题）', body.includes('道题考它') || body.includes('削掉它'))
await page.screenshot({ path: '/tmp/lb-brief.png' })
await page.locator('button:has-text("出发")').click()
await page.waitForTimeout(500)
body = await page.textContent('body')
check('① 点出发进入课件（简报关闭）', !body.includes('任务简报'))

// ② 微战在场，主按钮被锁
check('② 课末微战出现（迷雾守卫+亮答案）', body.includes('迷雾守卫') && body.includes('亮答案'))
const btnDisabled = await page.locator('button:has-text("通关微战点亮")').isDisabled()
check('② 完成按钮已锁（须先通关微战）', btnDisabled)

// ③ 全部自评答对 → 完美击败
for (let i = 0; i < lesson.checkQuestions.length; i++) {
  await page.locator('button:has-text("亮答案")').click()
  await page.waitForTimeout(250)
  await page.locator('button:has-text("削它")').click()
  await page.waitForTimeout(350)
}
await page.waitForTimeout(1400)
body = await page.textContent('body')
check('③ 完美击败（⭐）', body.includes('完美击败'))
check('③ 战报经验入账（+10 与 +5 完美）', body.includes('+10 XP') && body.includes('+5 XP'))
check('③ 战报 Boss 血条照亮动画', body.includes('血条被照亮'))
await page.screenshot({ path: '/tmp/lb-report.png' })

// ④ 返回关卡：闪耀点亮 + 状态持久
await page.locator('button:has-text("返回关卡")').click()
await page.waitForTimeout(1200)
body = await page.textContent('body')
check('④ 关卡页显示 闪耀点亮 ⭐', body.includes('闪耀点亮'))
const stored = await page.evaluate(() => {
  const d = JSON.parse(localStorage.getItem('g7math.user.13700000000.v1'))
  return { studied: !!d.studied['7a-1-02'], perfected: !!d.perfected?.['7a-1-02'] }
})
check(`④ 持久化：studied=${stored.studied} perfected=${stored.perfected}`, stored.studied && stored.perfected)
await page.screenshot({ path: '/tmp/lb-chapter.png', fullPage: true })

// ⑤ 重试路径：另一课先错一次再对 → 普通点亮（无 ⭐ 额外分）
const lesson2 = lessonData.lessons.find((l) => l.pointId === '7a-1-03')
await page.goto('http://127.0.0.1:5273/#/lesson/7a-1-03')
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.locator('button:has-text("出发")').click()
await page.waitForTimeout(400)
// 第 1 题自评「没答对」，其余自评对 → 击退（无 ⭐）
await page.locator('button:has-text("亮答案")').click()
await page.waitForTimeout(250)
await page.locator('button:has-text("没答对")').click()
await page.waitForTimeout(350)
for (let i = 1; i < lesson2.checkQuestions.length; i++) {
  await page.locator('button:has-text("亮答案")').click()
  await page.waitForTimeout(250)
  await page.locator('button:has-text("削它")').click()
  await page.waitForTimeout(350)
}
await page.waitForTimeout(1200)
body = await page.textContent('body')
check('⑤ 自评有错 = 击退守卫（无 ⭐ 完美行）', body.includes('击退') || body.includes('任务完成'))
const stored2 = await page.evaluate(() => {
  const d = JSON.parse(localStorage.getItem('g7math.user.13700000000.v1'))
  return { s: !!d.studied['7a-1-03'], p: !!d.perfected?.['7a-1-03'] }
})
check(`⑤ 持久化：studied=${stored2.s} perfected=${stored2.p}（应为 true/false）`, stored2.s && !stored2.p)
check('⑤ 战报无 +5 完美奖励', !body.includes('+5 XP') || !body.includes('完美击败 ⭐'))

console.log('JS 错误:', errors.length ? errors.slice(0, 2) : '无')
await browser.close()
process.exit(ok.every(Boolean) && errors.length === 0 ? 0 : 1)
