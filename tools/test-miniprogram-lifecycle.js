#!/usr/bin/env node
/**
 * 小程序页面生命周期测试：真正调用各页面的 onLoad / onShow，
 * 检查 setData 出来的数据是否合理。这是微信开发者工具之外能做的最强静态验证。
 *
 * 运行：node tools/test-miniprogram-lifecycle.js
 */
const path = require('path')

const ROOT = path.join(__dirname, '..', 'miniprogram')
const storage = {}

global.wx = {
  getStorageSync: (k) => (k in storage ? storage[k] : ''),
  setStorageSync: (k, v) => { storage[k] = v },
  removeStorageSync: (k) => { delete storage[k] },
  login: (o) => o.success && o.success({ code: 'c' }),
  request: () => {},
  showModal: () => {},
  showToast: () => {},
  navigateTo: () => {},
  redirectTo: () => {},
  reLaunch: () => {},
  navigateBack: () => {},
  setClipboardData: () => {},
  stopPullDownRefresh: () => {},
  pageScrollTo: () => {},
  previewImage: () => {},
  chooseMedia: () => {},
  compressImage: () => {},
  getFileSystemManager: () => ({ readFile: () => {} })
}

let captured = null
global.Page = (cfg) => { captured = cfg }
global.App = () => {}
global.getApp = () => ({ globalData: {} })

let pass = 0
let fail = 0
function ok(name, cond, extra) {
  if (cond) pass++
  else {
    fail++
    console.log('  ✗ ' + name + (extra ? ' — ' + extra : ''))
  }
}

function setPath(obj, key, value) {
  const m = /^([^.[]+)(?:\[(\d+)\])?(?:\.(.+))?$/.exec(key)
  if (!m) { obj[key] = value; return }
  const [, head, idx, rest] = m
  if (idx != null && rest) { obj[head] = obj[head] || []; setPath(obj[head][Number(idx)], rest, value); return }
  if (idx != null) { obj[head] = obj[head] || []; obj[head][Number(idx)] = value; return }
  if (rest) { obj[head] = obj[head] || {}; setPath(obj[head], rest, value); return }
  obj[head] = value
}

function loadPage(rel) {
  captured = null
  const full = path.join(ROOT, rel)
  delete require.cache[require.resolve(full)]
  require(full)
  return captured
}

function makeInstance(cfg) {
  const inst = Object.assign({}, cfg)
  inst.data = JSON.parse(JSON.stringify(cfg.data || {}))
  inst.setData = function (patch, cb) {
    for (const k in patch) setPath(inst.data, k, patch[k])
    if (typeof cb === 'function') cb.call(inst)
  }
  return inst
}

async function run(rel, options) {
  const cfg = loadPage(rel)
  const inst = makeInstance(cfg)
  try {
    if (inst.onLoad) await inst.onLoad(options || {})
    if (inst.onShow) await inst.onShow()
    return { inst, error: null }
  } catch (e) {
    return { inst, error: e }
  }
}

const auth = require(path.join(ROOT, 'lib', 'auth'))
const store = require(path.join(ROOT, 'lib', 'store'))
const content = require(path.join(ROOT, 'pkgContent', 'content'))
const dataLib = require(path.join(ROOT, 'lib', 'data'))

;(async () => {
  await auth.login('测试同学')

  // 造一份考评记录，供 run / report / remedial 使用
  const exam = content.loadExam('7a-c1')
  const roundId = 'round-lifecycle'
  const answers = exam.questions.slice(0, 5).map((q, i) => ({
    questionId: q.id, type: q.type, startedAt: Date.now() - 60000, submittedAt: Date.now(),
    durationMs: q.estimatedSeconds * 1000 + (i === 0 ? 120000 : 0),
    value: i === 0 ? '1' : '', work: '过程', correct: i !== 1, score: i !== 1 ? 1 : 0,
    errorTags: i === 1 ? ['计算失误'] : [], errorReason: i === 1 ? '符号写错' : '',
    images: i === 2 ? ['data:image/jpeg;base64,AAAA'] : undefined,
    photoReview: i === 2 ? 'pending' : undefined, revisitMs: 0, index: i + 1
  }))
  store.saveRound({
    id: roundId, kind: 'exam', round: 1, chapterId: '7a-c1', chapterTitle: '第一章 有理数',
    title: exam.title, examId: exam.id, exam, answers, startedAt: Date.now() - 600000,
    finishedAt: Date.now(), totalMs: 600000,
    wrongQuestionIds: [exam.questions[1].id], slowQuestionIds: [exam.questions[0].id],
    weakPointIds: ['7a-1-01']
  })

  console.log('=== 主包页面 ===')
  {
    const { inst, error } = await run('pages/home/home')
    ok('home 无异常', !error, error && error.message)
    ok('home 统计了知识点总数 114', inst.data.totalPoints === 114, String(inst.data.totalPoints))
    ok('home 列出 2 册', inst.data.volumes.length === 2, String(inst.data.volumes.length))
    ok('home 列出 12 章', inst.data.volumes.reduce((s, v) => s + v.chapters.length, 0) === 12)
    ok('home 有最近考评', inst.data.rounds.length >= 1)
    ok('home 有用户标识', !!inst.data.userLabel)
  }
  {
    const { inst, error } = await run('pages/progress/progress')
    ok('progress 无异常', !error, error && error.message)
    ok('progress 有统计', inst.data.roundCount >= 1, String(inst.data.roundCount))
  }

  console.log('=== 浏览类页面 ===')
  {
    const { inst, error } = await run('pkgContent/pages/curriculum/curriculum')
    ok('curriculum 无异常', !error, error && error.message)
    const total = (inst.data.volumes || []).reduce((s, v) => s + (v.chapters || []).length, 0)
    ok('curriculum 列出 12 章', total === 12, String(total))
  }
  {
    const { inst, error } = await run('pkgContent/pages/chapter/chapter', { id: '7a-c1' })
    ok('chapter 无异常', !error, error && error.message)
    const pointTotal = (inst.data.sections || []).reduce((s, x) => s + (x.points || []).length, 0)
    ok('chapter 显示 11 个知识点', pointTotal === 11, String(pointTotal))
    ok('chapter 标记有课件有考评', !!inst.data.hasLesson && !!inst.data.hasExam)
  }
  {
    const { inst, error } = await run('pkgContent/pages/lesson/lesson', { point: '7a-1-01' })
    ok('lesson 无异常', !error, error && error.message)
    ok('lesson 取到课件', !!(inst.data.lesson && inst.data.lesson.title))
    ok('lesson 有 slide', (inst.data.slides || []).length >= 7, String((inst.data.slides || []).length))
    ok('lesson 标记为已学', !!store.getData().studied['7a-1-01'])
  }
  {
    const { inst, error } = await run('pkgContent/pages/book/book')
    ok('book 无异常', !error, error && error.message)
    ok('book 列出讲次', (inst.data.units || []).length === 38, String((inst.data.units || []).length))
  }

  console.log('=== 考评相关页面 ===')
  {
    const { inst, error } = await run('pkgContent/pages/exams/exams')
    ok('exams 无异常', !error, error && error.message)
    ok('exams 列出 12 章', (inst.data.chapters || []).length === 12, String((inst.data.chapters || []).length))
  }
  {
    const { inst, error } = await run('pkgContent/pages/examIntro/examIntro', { id: '7a-c1' })
    ok('examIntro 无异常', !error, error && error.message)
    ok('examIntro 取到考评卷', inst.data.hasExam !== false && inst.data.questionCount === 22, '题数 ' + inst.data.questionCount)
    ok('examIntro 含四类题型统计', (inst.data.counts || []).length === 4, String((inst.data.counts || []).length))
    ok('examIntro 统计书内题', inst.data.bookCount >= 8, String(inst.data.bookCount))
  }
  {
    const { inst, error } = await run('pkgContent/pages/report/report', { id: roundId })
    ok('report 无异常', !error, error && error.message)
    ok('report 有统计', inst.data.answered === 5, String(inst.data.answered))
    ok('report 有逐题列表', (inst.data.items || []).length === 5, String((inst.data.items || []).length))
    ok('report 有耗时对比', (inst.data.timings || []).length === 5)
    ok('report 识别出手写待确认', (inst.data.items || []).some((x) => x.pending))
  }
  {
    const { inst, error } = await run('pkgContent/pages/remedial/remedial', { id: roundId })
    ok('remedial 无异常', !error, error && error.message)
    ok('remedial 有逐题错因', (inst.data.analyses || []).length >= 1, String((inst.data.analyses || []).length))
  }
  {
    const { inst, error } = await run('pkgContent/pages/run/run', { id: roundId })
    ok('run 无异常', !error, error && error.message)
    ok('run 加载 22 题', inst.data.total === 22, String(inst.data.total))
    ok('run 有题号导航 22 个', (inst.data.nums || []).length === 22, String((inst.data.nums || []).length))
    ok('run 恢复到第一道未答题', inst.data.idx === 5, String(inst.data.idx))
    if (inst.onUnload) inst.onUnload()
  }

  console.log('\n通过 ' + pass + ' 项，失败 ' + fail + ' 项')
  process.exit(fail === 0 ? 0 : 1)
})().catch((e) => {
  console.error('测试异常：', e)
  process.exit(1)
})
