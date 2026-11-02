/**
 * 端到端：题库枯竭 → 现场生成专项练习。
 * 注入一轮错题（e14）+ 两轮历史专项练习（把 e14 的两条静态变式都"用掉"），
 * 点「生成专项练习并开始」→ 应触发模型生成 → 跳到答题页，题干是全新同构题。
 */
import pw from '../app/node_modules/playwright/index.js'
import { e2eLogin } from './lib/e2e-auth.mjs'
import { readFileSync } from 'node:fs'
const { chromium } = pw

const exam = JSON.parse(readFileSync(new URL('../app/public/data/exams/7a-c2.json', import.meta.url), 'utf8'))
const q14 = exam.questions.find((q) => q.id === '7a-c2-e14')
const variants = q14.variants ?? []
console.log(`e14 静态变式 ${variants.length} 条，将全部标记为已消耗`)

const now = Date.now()
const rec = {
  questionId: q14.id, type: q14.type, startedAt: now - 300000, submittedAt: now - 240000,
  durationMs: 60000, value: '-17', revisitMs: 0, revisitCount: 0,
  correct: false, score: 0, errorTags: ['符号处理'], errorReason: '符号处理错误', index: 0,
}
const examRound = {
  id: 'r-dep-exam', kind: 'exam', round: 1, chapterId: '7a-c2', chapterTitle: '第二章 有理数的运算',
  title: exam.title, examId: exam.id, startedAt: now - 300000, finishedAt: now - 240000, totalMs: 60000,
  answers: [rec], wrongQuestionIds: [q14.id], slowQuestionIds: [], weakPointIds: q14.pointIds, exam,
}
// 两个历史专项轮：包含 e14 的全部静态变式题干（模拟已练过）
const histRound = (id, stem, i) => ({
  id, kind: 'practice', round: 2 + i, parentRoundId: 'r-dep-exam', chapterId: '7a-c2',
  chapterTitle: '第二章 有理数的运算', title: '历史专项', examId: `${exam.id}-practice`, startedAt: now - 100000,
  totalMs: 0, answers: [], wrongQuestionIds: [], slowQuestionIds: [], weakPointIds: [],
  exam: { id: `${id}-x`, chapterId: '7a-c2', chapterTitle: 't', title: 't', totalEstimatedSeconds: 60, sections: [],
    questions: [{ id: `${id}-q`, type: q14.type, difficulty: q14.difficulty, estimatedSeconds: 60, pointIds: q14.pointIds,
      stem, answer: 'x', solution: 'x' }] },
})

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))

await page.goto('http://127.0.0.1:5273/', { waitUntil: 'domcontentloaded' })
await e2eLogin(page, '13700000000', '枯竭测试')
await page.evaluate(([r, h1, h2]) => {
  localStorage.setItem('g7math.session.v1', JSON.stringify({ phone: '13700000000', name: '枯竭测试' }))
  localStorage.setItem('g7math.user.13700000000.v1', JSON.stringify({
    rounds: { [r.id]: r, [h1.id]: h1, [h2.id]: h2 }, loops: {}, studied: {}, calcDone: {}, calcAttempts: {}, questionExplains: {},
  }))
}, [examRound, histRound('r-hist-1', variants[0]?.stem ?? '', 0), histRound('r-hist-2', variants[1]?.stem ?? '', 1)])
await page.goto('http://127.0.0.1:5273/#/report/r-dep-exam')
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(1200)

console.log('点击「生成专项练习并开始」（静态变式已枯竭，应触发现场生成）…')
await page.click('button:has-text("生成专项练习并开始")')
// 等生成 + 跳转（最长 150 秒）
let onRun = false
let body = ''
for (let i = 0; i < 30; i++) {
  await page.waitForTimeout(5000)
  body = await page.textContent('body')
  if (body.includes('答题') || (await page.url()).includes('/run/')) { onRun = true; break }
}
console.log('进入答题页:', onRun ? '✓' : '✗', '| URL:', await page.url())
const staticStems = variants.map((v) => v.stem)
const newStemShown = !staticStems.some((st) => body.includes(st.slice(0, 15)))
console.log('题目是全新生成（非静态变式）:', newStemShown && body.includes('计算：') ? '✓' : '？')
console.log('JS 错误:', errors.length ? errors.slice(0, 2) : '无')
await browser.close()
