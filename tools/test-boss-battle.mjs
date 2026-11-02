/**
 * 端到端：Boss 血条迷雾 / 能量商店 / 考中增益 / 完美卷留痕。
 * 全程真实点击，不做 DOM 注入。
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
await e2eLogin(page, '13700000000', '增益测试')
await page.evaluate(() => {
  localStorage.setItem('g7math.session.v1', JSON.stringify({ phone: '13700000000', name: '增益测试' }))
  // 已学第一章 5 个知识点（真实 pointId），能量 5
  localStorage.setItem('g7math.user.13700000000.v1', JSON.stringify({
    rounds: {}, loops: {}, studied: { '7a-1-01': 1, '7a-1-02': 1, '7a-1-03': 1, '7a-1-04': 1, '7a-1-05': 1 },
    energy: 5, calcDone: {}, calcAttempts: {}, questionExplains: {},
  }))
})
await page.goto('http://127.0.0.1:5273/#/curriculum/7a-c1')
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(1500)

// ① Boss 血条
let r = await page.evaluate(() => {
  const bar = [...document.querySelectorAll('span[title^="第"]')].filter(s => s.className.includes('flex-1'))
  return { cells: bar.length, lit: bar.filter(s => s.className.includes('bg-white') && !s.className.includes('/5') && !s.className.includes('/1')).length, fog: bar.filter(s => s.className.includes('bg-gray-400/25')).length }
})
check(`Boss 血条渲染 ${r.cells} 格（=考卷题数），迷雾 ${r.fog} 格`, r.cells >= 20 && r.fog > 0)
const tip = await page.locator('[title*="对应 Boss"]').first().getAttribute('title')
check(`任务节点课前预告：${(tip ?? '').slice(0, 30)}…`, !!tip && tip.includes('对应 Boss'))

// ② 战前准备商店
await page.goto('http://127.0.0.1:5273/#/exam/7a-c1')
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
let body = await page.textContent('body')
check('战前准备商店出现', body.includes('战前准备'))
check('能量余额显示 ⚡5', body.includes('能量 5'))
// 买 1 张回炉券 + 1 个思路点拨 = 3 能量
await page.locator('text=回炉券').locator('..').locator('..').locator('button:has-text("+")').click()
await page.locator('text=思路点拨').locator('..').locator('..').locator('button:has-text("+")').click()
await page.waitForTimeout(300)
// 侦察卷 + 时间沙漏
await page.locator('text=侦察卷').locator('..').locator('..').locator('button:has-text("+")').click()
await page.locator('text=时间沙漏').locator('..').locator('..').locator('button:has-text("+")').click()
await page.waitForTimeout(300)
body = await page.textContent('body')
check('侦察卷点亮情报（知识点分布）', body.includes('卷面情报'))
check('四件套合计 ⚡5', body.includes('⚡5'))
await page.screenshot({ path: '/tmp/boss-shop.png', fullPage: true })
await page.locator('button:has-text("开始答题")').click()
await page.waitForTimeout(1200)

// ③ 考中增益
body = await page.textContent('body')
check('进入答题页，剩余增益徽标（💡 🔄 ⏳）', body.includes('💡') && body.includes('🔄') && body.includes('⏳'))
await page.locator('button:has-text("思路点拨")').click()
await page.waitForTimeout(400)
body = await page.textContent('body')
check('点拨展开且标记「借助提示」', body.includes('借助提示'))
const energyAfter = await page.evaluate(() => JSON.parse(localStorage.getItem('g7math.user.13700000000.v1')).energy)
check(`能量已扣（5-5=0）：实际 ${energyAfter}`, energyAfter === 0)
await page.locator('button:has-text("时间沙漏")').click()
await page.waitForTimeout(400)
body = await page.textContent('body')
check('沙漏生效提示', body.includes('时间沙漏生效中'))
// 找一道带变式的选择题，故意答错触发回炉
const exam = await page.evaluate(async () => (await (await fetch('/data/exams/7a-c1.json')).json()))
const tIdx = exam.questions.findIndex((q) => q.type === 'choice' && (q.variants?.length ?? 0) > 0)
const tq = exam.questions[tIdx]
const answerLetter = (tq.answer ?? 'A').trim()[0].toUpperCase()
const wrongIdx = ['A', 'B', 'C', 'D'].findIndex((l) => l !== answerLetter)
await page.locator(`button[title^="第 ${tIdx + 1} 题"]`).click()
await page.waitForTimeout(400)
await page.locator('.pl-10 button.block').nth(wrongIdx < 0 ? 0 : wrongIdx).click()
await page.locator('button:has-text("提交本题"), button:has-text("提交答案并上传"), button:has-text("提交并批改")').first().click()
await page.waitForTimeout(1200)
// 提交后自动跳下一题，回看本题核对判分
await page.locator(`button[title^="第 ${tIdx + 1} 题"]`).click()
await page.waitForTimeout(600)
body = await page.textContent('body')
check(`第 ${tIdx + 1} 题故意答错，判分「回答错误」出现`, body.includes('回答错误'))
const retryBtn = page.locator('button:has-text("回炉券")')
if (await retryBtn.count()) {
  await retryBtn.first().click()
  await page.waitForTimeout(500)
  body = await page.textContent('body')
  check('回炉重做卡片出现（同构变式）', body.includes('回炉重做'))
  await page.screenshot({ path: '/tmp/boss-retry.png' })
  await page.locator('button:has-text("放弃")').click()
  await page.waitForTimeout(300)
  body = await page.textContent('body')
  check('放弃不消耗回炉券（🔄 剩 1）', body.includes('🔄 1'))
} else {
  check('回炉按钮出现', false)
}

// ④ 留痕披露（注入一轮用过增益的完整轮次看战报）
await page.evaluate(() => {
  const d = JSON.parse(localStorage.getItem('g7math.user.13700000000.v1'))
  const now = Date.now()
  const mk = (qid, correct, i) => ({ questionId: qid, type: 'choice', startedAt: now - 1000 + i, submittedAt: now - 900 + i, durationMs: 1000, value: 'A', revisitMs: 0, revisitCount: 0, correct, score: correct ? 1 : 0, errorTags: [], errorReason: '', index: i, hintUsed: i === 0 ? true : undefined, retried: i === 1 ? true : undefined })
  const qs = d.__exam ? d.__exam.questions : []
  // 借用真实考试卷
  const exam = { id: '7a-c1', chapterId: '7a-c1', chapterTitle: '第一章 有理数', title: '考评', totalEstimatedSeconds: 600, sections: [], questions: window.__qs ?? [] }
  d.rounds['r-buff-test'] = { id: 'r-buff-test', kind: 'exam', round: 1, chapterId: '7a-c1', chapterTitle: '第一章 有理数', title: '增益留痕测试', examId: '7a-c1', startedAt: now - 2000, finishedAt: now - 1000, totalMs: 1000, answers: [], wrongQuestionIds: [], slowQuestionIds: [], weakPointIds: [], exam, buffs: { hints: 3, retries: 1, hourglasses: 1, hintUsed: ['x'], retried: ['y'], hourglassUsed: ['z'] } }
  localStorage.setItem('g7math.user.13700000000.v1', JSON.stringify(d))
})
// 用真实卷子重写该轮（从接口拿）
const examData = await page.evaluate(async () => {
  const res = await fetch('/data/exams/7a-c1.json')
  return res.json()
})
await page.evaluate((exam) => {
  const d = JSON.parse(localStorage.getItem('g7math.user.13700000000.v1'))
  const qs = exam.questions
  const now = Date.now()
  d.rounds['r-buff-test'].exam = exam
  d.rounds['r-buff-test'].answers = qs.map((q, i) => ({ questionId: q.id, type: q.type, startedAt: now - 60000 + i * 100, submittedAt: now - 59000 + i * 100, durationMs: 1000, value: q.answer, revisitMs: 0, revisitCount: 0, correct: true, score: 1, errorTags: [], errorReason: '', index: i, hintUsed: i === 0 ? true : undefined, retried: i === 1 ? true : undefined }))
  d.rounds['r-buff-test'].wrongQuestionIds = []
  d.rounds['r-buff-test'].slowQuestionIds = []
  localStorage.setItem('g7math.user.13700000000.v1', JSON.stringify(d))
}, examData)
await page.goto('http://127.0.0.1:5273/#/report/r-buff-test')
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
body = await page.textContent('body')
check('战报增益留痕披露（思路点拨 ×1 回炉 ×1 时间沙漏 ×1）', body.includes('思路点拨 ×1') && body.includes('回炉 ×1') && body.includes('时间沙漏 ×1'))
check('非完美卷（用过增益不显示 ⭐ 完美卷）', !body.includes('完美卷 ·'))
await page.screenshot({ path: '/tmp/boss-report.png', fullPage: true })

console.log('JS 错误:', errors.length ? errors.slice(0, 2) : '无')
await browser.close()
process.exit(ok.every(Boolean) && errors.length === 0 ? 0 : 1)
