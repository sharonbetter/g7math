/**
 * 端到端：副本纳入战役体系。
 * ① 关卡页 ⚔️ 节点深链到副本大厅并定位 ② 大厅按关卡分组+能量显示
 * ③ 通关训练 → 战报（XP/首通+2⚡）→ 再战重置 ④ 能量入账
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
await e2eLogin(page, '13700000000', '副本测试')
await page.evaluate(() => {
  localStorage.setItem('g7math.session.v1', JSON.stringify({ phone: '13700000000', name: '副本测试' }))
  localStorage.setItem('g7math.user.13700000000.v1', JSON.stringify({ rounds: {}, loops: {}, studied: {}, perfected: {}, energy: 1, calcDone: {}, calcAttempts: {}, questionExplains: {} }))
})

// ① 关卡页副本节点 → 深链
await page.goto('http://127.0.0.1:5273/#/curriculum/7a-c2')
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
const dungeonHref = await page.locator('a[href^="#/calc?chapter="]').first().getAttribute('href')
check(`① 关卡页 ⚔️ 节点深链：${dungeonHref}`, dungeonHref === '#/calc?chapter=7a-c2')
await page.locator('a[title="打开支线任务板"]').first().click()
await page.waitForTimeout(900)
let body = await page.textContent('body')
check('① ⚔️ 节点弹出支线任务板（今日主任务）', body.includes('支线任务板') && body.includes('今日主任务'))
check('① 每日支线三连', body.includes('完成 1 次练习') && body.includes('当日答对 20 题'))
check('① 奖励预告（+10 XP / 首通 +2⚡）', body.includes('+10 XP') && body.includes('+2⚡'))
await page.screenshot({ path: '/tmp/quest-board.png' })
await page.locator('button:has-text("接受任务")').click()
await page.waitForTimeout(1500)
check(`① 接受任务直接进战斗`, page.url().includes('/calc/'))
await page.goto('http://127.0.0.1:5273/#/calc?chapter=7a-c2')
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(2000)

// ② 大厅（档案入口）分组与定位
body = await page.textContent('body')
check('② 副本大厅（分组+能量+首通提示）', body.includes('副本大厅') && body.includes('⚡') && body.includes('第 2 关「棂星门」的支线'))
const focused = await page.evaluate(() => !!document.querySelector('.ring-amber-400'))
check('② ?chapter= 定位高亮', focused)
await page.screenshot({ path: '/tmp/dungeon-hall.png', fullPage: true })

// ③ 通关一练 → 战报（取第一练的答案全对）
const book = await page.evaluate(async () => (await (await fetch('/data/calc/trainings.json')).json()))
const t = book.trainings.find((x) => x.chapterId === '7a-c2')
await page.goto(`http://127.0.0.1:5273/#/calc/${t.id}`)
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
const waves = Math.ceil(t.questions.length / 5)
for (let w = 0; w < waves; w++) {
  const inputs = page.locator('input[placeholder="答案"]')
  const n = await inputs.count()
  for (let i = 0; i < n; i++) await inputs.nth(i).fill(t.questions[w * 5 + i].answer)
  await page.locator('button:has-text("提交")').first().click()
  await page.waitForTimeout(900)
}
await page.waitForTimeout(1200)
body = await page.textContent('body')
check('③ 副本通关战报弹出', body.includes('副本通关！'))
check('③ 战报 XP 行（+10 与 答对）', body.includes('+10 XP') && /答对 \d+\/\d+ 题/.test(body))
check('③ 首通 +2⚡ 能量行', body.includes('+2 ⚡'))
const energy = await page.evaluate(() => JSON.parse(localStorage.getItem('g7math.user.13700000000.v1')).energy)
check(`③ 能量入账（1+2=3）：实际 ${energy}`, energy === 3)
await page.screenshot({ path: '/tmp/dungeon-report.png' })

// ④ 再战重置
await page.locator('button:has-text("再战本副本")').click()
await page.waitForTimeout(800)
body = await page.textContent('body')
const inputsEmpty = await page.evaluate(() => [...document.querySelectorAll('input[placeholder="答案"]')].every(i => !i.value))
check('④ 再战重置（战报关闭+输入清空+波次归1）', !body.includes('副本通关！') && inputsEmpty && body.includes('第 1/'))

// ⑤ 复战（已通过）不再给 ⚡
for (let w = 0; w < waves; w++) {
  const inputs = page.locator('input[placeholder="答案"]')
  const n = await inputs.count()
  for (let i = 0; i < n; i++) await inputs.nth(i).fill(t.questions[w * 5 + i].answer)
  await page.locator('button:has-text("提交")').first().click()
  await page.waitForTimeout(900)
}
await page.waitForTimeout(1200)
body = await page.textContent('body')
const energy2 = await page.evaluate(() => JSON.parse(localStorage.getItem('g7math.user.13700000000.v1')).energy)
check(`⑤ 复战无首通奖励（能量仍 3）：实际 ${energy2}`, energy2 === 3 && !body.includes('+2 ⚡'))

console.log('JS 错误:', errors.length ? errors.slice(0, 2) : '无')
await browser.close()
process.exit(ok.every(Boolean) && errors.length === 0 ? 0 : 1)
