/**
 * 冒烟：关卡地图（首页）与任务路径（章节页）的渲染。
 * 场景：第 1 关已通关、第 2 关战斗中（考过未掌握），验证岛屿着色、
 * 当前关路标、路径节点与 Boss 状态，并截图供人工核对。
 */
import pw from '../app/node_modules/playwright/index.js'
import { e2eLogin } from './lib/e2e-auth.mjs'

const browser = await pw.chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

const now = Date.now()
const mkAnswers = (n, correct) =>
  Array.from({ length: n }, (_, i) => ({
    questionId: `q${i}`, type: 'fill', startedAt: now - 1000 + i, submittedAt: now - 900 + i,
    durationMs: 1000, value: 'x', revisitMs: 0, revisitCount: 0,
    correct: i < correct, score: i < correct ? 1 : 0, errorTags: [], errorReason: '', index: i,
  }))
const fakeExam = {
  id: 'x', chapterId: '7a-c2', chapterTitle: '第二章', title: 'x', totalEstimatedSeconds: 600,
  sections: [], questions: Array.from({ length: 24 }, (_, i) => ({ id: `q${i}` })),
}
const userData = {
  rounds: {
    'r-c2-1': {
      id: 'r-c2-1', kind: 'exam', round: 1, chapterId: '7a-c2', chapterTitle: '第二章 有理数的运算',
      title: '第二章 有理数的运算 · 章节考评', examId: 'x', startedAt: now - 3600_000,
      finishedAt: now - 3000_000, totalMs: 600_000, answers: mkAnswers(24, 18),
      wrongQuestionIds: ['q18', 'q19'], slowQuestionIds: ['q20'], weakPointIds: ['7a-c2-p3'],
      exam: fakeExam,
    },
  },
  loops: {
    '7a-c1': { chapterId: '7a-c1', chapterTitle: '第一章', round: 1, status: 'mastered', roundIds: ['r1'], weakPointIds: [], updatedAt: now },
    '7a-c2': { chapterId: '7a-c2', chapterTitle: '第二章', round: 1, status: 'remedial', roundIds: ['r-c2-1'], weakPointIds: ['7a-c2-p3'], updatedAt: now },
  },
  studied: {}, calcDone: {}, calcAttempts: {}, questionExplains: {},
}
// c1 通关但没学记录也行（mastered 由 loop 推导）；给 c2 学 10/13 课
const c2Points = [
  '7a-2-01', '7a-2-02', '7a-2-03', '7a-2-04', '7a-2-05', '7a-2-06',
  '7a-2-07', '7a-2-08', '7a-2-09', '7a-2-10',
]
for (const p of c2Points) userData.studied[p] = now

await page.goto('http://127.0.0.1:5273/', { waitUntil: 'domcontentloaded' })
await e2eLogin(page, '13700000000', '地图测试')
await page.evaluate((d) => {
  localStorage.setItem('g7math.session.v1', JSON.stringify({ phone: '13700000000', name: '地图测试' }))
  localStorage.setItem('g7math.user.13700000000.v1', JSON.stringify(d))
}, userData)
await page.goto('http://127.0.0.1:5273/#/')
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(1500)

let body = await page.textContent('body')
const checks = [
  ['地图标题', body.includes('关卡地图')],
  ['穿越之门上下', body.includes('穿越之门 · 上') && body.includes('穿越之门 · 下')],
  ['12 扇门', (await page.locator('svg[data-gate]').count()) >= 12],
  ['门名标签', (await page.locator('text=天安门').count()) >= 1],
  ['通关标记', body.includes('已通关')],
  ['你在这里', body.includes('你在这里')],
  ['继续闯关按钮', body.includes('继续闯关')],
  ['第1关已通关', await page.locator('a[title*="有理数"]').first().getAttribute('title').then(t => (t ?? '').includes('已通关') || body.includes('已通关'))],
]
await page.screenshot({ path: '/tmp/level-map-home.png', fullPage: true })

// 章节任务路径
await page.goto('http://127.0.0.1:5273/#/curriculum/7a-c2')
await page.waitForTimeout(1500)
body = await page.textContent('body')
checks.push(
  ['任务之路标签', body.includes('任务之路')],
  ['Boss 再战中', body.includes('Boss 再战中')],
  ['任务 10/13', body.includes('10/13')],
  ['能量石', body.includes('💎')],
  ['补给任务', body.includes('补给任务')],
  ['再战 Boss 按钮', body.includes('再战 Boss')],
  ['最好成绩', body.includes('18/24')],
)
await page.screenshot({ path: '/tmp/level-map-chapter.png', fullPage: true })

// 移动端视口再截一张
await page.setViewportSize({ width: 390, height: 844 })
await page.goto('http://127.0.0.1:5273/#/curriculum/7a-c1')
await page.waitForTimeout(1500)
await page.screenshot({ path: '/tmp/level-map-chapter-mobile.png', fullPage: true })

let fail = 0
for (const [name, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${name}`)
  if (!ok) fail++
}
console.log('JS 错误:', errors.length ? errors.slice(0, 3) : '无')
await browser.close()
process.exit(fail || errors.length ? 1 : 0)
