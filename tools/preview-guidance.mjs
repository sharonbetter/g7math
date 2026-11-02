/**
 * 思路引导预览：注入 7a-c2 四道试点题（e10/e11/e12/e14）的错答记录，
 * 打开有界浏览器直接落在报告页，供人工查看效果（不触碰用户真实浏览器数据）。
 * 用法：node tools/preview-guidance.mjs   （看完直接关窗口）
 */
import pw from '../app/node_modules/playwright/index.js'
import { e2eLogin } from './lib/e2e-auth.mjs'
import { readFileSync } from 'node:fs'
const { chromium } = pw

const exam = JSON.parse(readFileSync(new URL('../app/public/data/exams/7a-c2.json', import.meta.url), 'utf8'))
const IDS = ['7a-c2-e10', '7a-c2-e11', '7a-c2-e12', '7a-c2-e14']
const WRONG_ANSWERS = { '7a-c2-e10': '50', '7a-c2-e11': '144000', '7a-c2-e12': '3/4', '7a-c2-e14': '-17' }
const qs = IDS.map((id) => exam.questions.find((q) => q.id === id)).filter(Boolean)

const now = Date.now()
const answers = qs.map((q, i) => ({
  questionId: q.id,
  type: q.type,
  startedAt: now - 600000 + i * 30000,
  submittedAt: now - 570000 + i * 30000,
  durationMs: 30000 + i * 5000,
  value: WRONG_ANSWERS[q.id] ?? '1',
  revisitMs: 0,
  revisitCount: 0,
  correct: false,
  score: 0,
  errorTags: q.errorTags ?? ['原因未知'],
  errorReason: '错误原因未知：从你的答案还看不出具体错在哪一步，这里不乱猜。',
  index: i,
}))

const round = {
  id: 'r-preview-guidance',
  kind: 'exam',
  round: 1,
  chapterId: '7a-c2',
  chapterTitle: '第二章 有理数的运算',
  title: exam.title,
  examId: exam.id,
  startedAt: now - 600000,
  finishedAt: now - 480000,
  totalMs: 120000,
  answers,
  wrongQuestionIds: IDS,
  slowQuestionIds: [],
  weakPointIds: [...new Set(qs.flatMap((q) => q.pointIds))],
  exam,
}

const browser = await chromium.launch({ headless: false })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
const page = await ctx.newPage()
await page.goto('http://127.0.0.1:5273/', { waitUntil: 'domcontentloaded' })
await e2eLogin(page, '13900000000', '预览')
await page.evaluate((r) => {
  localStorage.setItem('g7math.session.v1', JSON.stringify({ phone: '13900000000', name: '预览' }))
  localStorage.setItem('g7math.user.13900000000.v1', JSON.stringify({
    rounds: { [r.id]: r }, loops: {}, studied: {}, calcDone: {}, calcAttempts: {}, questionExplains: {},
  }))
}, round)
await page.goto('http://127.0.0.1:5273/#/report/r-preview-guidance')
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
console.log('预览窗口已打开：报告页 → 逐题批改与错因分析 → 展开任意错题看「🧭 思路引导」')
console.log('看完直接关闭窗口即可（这是独立浏览器，不影响你的数据）')
// 保持进程存活直到用户关窗
browser.on('disconnected', () => process.exit(0))
await new Promise(() => {})
