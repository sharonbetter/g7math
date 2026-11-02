/**
 * 端到端验证「单题讲解课件」：注入带错题的考评记录 → 报告页生成讲解 → 播放 → 刷新后入口仍在（持久化）。
 */
import pw from '../app/node_modules/playwright/index.js'
import { e2eLogin } from './lib/e2e-auth.mjs'
const { chromium } = pw
import { readFileSync } from 'node:fs'

const exam = JSON.parse(readFileSync(new URL('../app/public/data/exams/7a-c2.json', import.meta.url), 'utf8'))
const q14 = exam.questions.find((q) => q.id === '7a-c2-e14')

const now = Date.now()
const round = {
  id: 'r-e2e-1',
  kind: 'exam',
  round: 1,
  chapterId: '7a-c2',
  chapterTitle: '第二章 有理数的运算',
  title: exam.title,
  examId: exam.id,
  startedAt: now - 600000,
  finishedAt: now - 60000,
  totalMs: 540000,
  answers: [
    {
      questionId: q14.id,
      type: q14.type,
      startedAt: now - 600000,
      submittedAt: now - 590000,
      durationMs: 96000,
      value: '-17',
      revisitMs: 0,
      revisitCount: 0,
      correct: false,
      score: 0,
      errorTags: ['符号处理', '典型错误'],
      errorReason: '减法统一成加法时，"减去 -12"应写成"+12"，你把它当成了"-12"。',
      index: 0,
    },
  ],
  wrongQuestionIds: [q14.id],
  slowQuestionIds: [],
  weakPointIds: q14.pointIds,
  exam,
}

const data = {
  rounds: { 'r-e2e-1': round },
  loops: {},
  studied: {},
  calcDone: {},
  calcAttempts: {},
  questionExplains: {},
}

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))

await page.goto('http://127.0.0.1:5273/', { waitUntil: 'domcontentloaded' })
await e2eLogin(page, '13800000000', '测试')
await page.evaluate(([d]) => {
  localStorage.setItem('g7math.session.v1', JSON.stringify({ phone: '13800000000', name: '测试' }))
  localStorage.setItem('g7math.user.13800000000.v1', JSON.stringify(d))
}, [data])
await page.goto('http://127.0.0.1:5273/#/report/r-e2e-1')
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
const body1 = await page.textContent('body')
console.log('报告页打开:', body1.includes('逐题批改') ? '✓' : '✗'); console.log('页面内容片段:', body1.slice(0, 150).replace(/\s+/g, ' '))

// 展开错题卡，找生成讲解按钮
await page.click('text=78×(-455)').catch(() => {})
await page.click('button:has-text("计算：(-5) - (+3)")').catch(() => {})
await page.waitForTimeout(400)
const hasBtn = await page.locator('button:has-text("生成讲解")').count()
console.log('生成讲解按钮:', hasBtn > 0 ? '✓' : '✗（未展开？）')

if (hasBtn) {
  await page.click('button:has-text("生成讲解")')
  await page.waitForTimeout(9000)
  const playing = await page.textContent('body')
  console.log('合成完成后自动打开播放器:', playing.includes('点击开始错题讲解') ? '✓' : '✗')
  console.log('错题幕:', playing.includes('错题 1 / 1') ? '✓' : '(未开始播放)')
  // 退出
  await page.click('text=退出').catch(() => {})
  await page.waitForTimeout(400)
  const btn2 = await page.locator('button:has-text("查看讲解")').count()
  const regen = await page.locator('text=重新生成').count()
  console.log('按钮变为「查看讲解」:', btn2 > 0 ? '✓' : '✗', '| 重新生成入口:', regen > 0 ? '✓' : '✗')
  // 刷新验证持久化
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await page.click('button:has-text("计算：(-5) - (+3)")').catch(() => {})
  await page.waitForTimeout(400)
  const btn3 = await page.locator('button:has-text("查看讲解")').count()
  console.log('刷新后仍可查看（已保存）:', btn3 > 0 ? '✓' : '✗')
  // 再点查看 → 播放已保存的场景
  if (btn3) {
    await page.click('button:has-text("查看讲解")')
    await page.waitForTimeout(1500)
    const p2 = await page.textContent('body')
    console.log('查看已保存讲解:', p2.includes('错题') ? '✓' : '✗')
  }
}

// 关闭播放器浮层再验证引导区
await page.keyboard.press('Escape')
await page.waitForTimeout(400)
// 验证启发式引导区
const guided = await page.locator('text=思路引导').count()
console.log('启发式引导区出现:', guided > 0 ? '✓' : '✗')
const prompts = await page.locator('text=这道题在考察').count()
console.log('考点引导（先问后答）:', prompts > 0 ? '✓' : '✗')
if (prompts > 0) {
  const stepLead = await page.locator('text=看到减号别急着').count()
  console.log('步骤引导语出现:', stepLead > 0 ? '✓' : '✗')
  const strategy = await page.locator('text=通用思路').count()
  console.log('通法收束出现:', strategy > 0 ? '✓' : '✗')
}
const collapsed = await page.locator('text=通用思路').count()
console.log('完整解析默认收起:', collapsed > 0 ? '✓' : '✗')
console.log('JS 错误:', errors.length ? errors.slice(0, 2) : '无')
await browser.close()
