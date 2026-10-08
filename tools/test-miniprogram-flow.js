#!/usr/bin/env node
/**
 * 小程序考评全流程测试：新建一轮考评 → 逐题作答（含拍照题、模型批改降级）→ 交卷 →
 * 检查汇总、错题、耗时标记与 loop 状态，并验证专项练习能生成。
 *
 * 运行：node tools/test-miniprogram-flow.js
 */
const path = require('path')
const ROOT = path.join(__dirname, '..', 'miniprogram')
const storage = {}

global.wx = {
  getStorageSync: (k) => (k in storage ? storage[k] : ''),
  setStorageSync: (k, v) => { storage[k] = v },
  removeStorageSync: (k) => { delete storage[k] },
  login: (o) => o.success && o.success({ code: 'c' }),
  request: (o) => { if (o.fail) o.fail({ errMsg: 'request:fail 未配置服务器' }) },
  showModal: (o) => { if (o.success) o.success({ confirm: true }) },
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

function makeInstance(cfg) {
  const inst = Object.assign({}, cfg)
  inst.data = JSON.parse(JSON.stringify(cfg.data || {}))
  inst.setData = function (patch, cb) {
    for (const k in patch) setPath(inst.data, k, patch[k])
    if (typeof cb === 'function') cb.call(inst)
  }
  return inst
}

function loadPage(rel) {
  captured = null
  const full = path.join(ROOT, rel)
  delete require.cache[require.resolve(full)]
  require(full)
  return captured
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const auth = require(path.join(ROOT, 'lib', 'auth'))
const store = require(path.join(ROOT, 'lib', 'store'))
const content = require(path.join(ROOT, 'pkgContent', 'content'))
const answersLib = require(path.join(ROOT, 'lib', 'answers'))

;(async () => {
  await auth.login('流程测试')

  const exam = content.loadExam('7a-c1')
  const roundId = 'round-flow'
  store.saveRound({
    id: roundId, kind: 'exam', round: 1, chapterId: '7a-c1', chapterTitle: '第一章 有理数',
    title: exam.title, examId: exam.id, exam, answers: [], startedAt: Date.now(),
    finishedAt: 0, totalMs: 0, wrongQuestionIds: [], slowQuestionIds: [], weakPointIds: []
  })

  const runPage = makeInstance(loadPage('pkgContent/pages/run/run'))
  await runPage.onLoad({ id: roundId })
  await runPage.onShow()

  ok('开始时有 22 题未答', runPage.data.total === 22 && runPage.data.idx === 0)

  // 逐题作答：除第 3 题故意答错外，其余填标准答案；另挑一道计算题只交照片不填文字
  const deliberateWrong = new Set([2])
  const photoQuestion = runPage.questions.findIndex((q) => q.type === 'calc')
  ok('找到一道计算题用于照片测试', photoQuestion >= 0, String(photoQuestion))

  let guard = 0
  while (runPage.unansweredCount() > 0 && guard < 60) {
    guard++
    const q = runPage.questions[runPage.cursor]
    const isPhoto = runPage.cursor === photoQuestion

    if (q.type === 'choice') {
      const letter = deliberateWrong.has(runPage.cursor)
        ? String.fromCharCode(65 + ((q.answer.charCodeAt(0) - 65 + 1) % 4))
        : q.answer
      runPage.onSelectOption({ currentTarget: { dataset: { letter } } })
    } else if (q.type === 'fill') {
      const bits = String(q.answer).split('；')
      const blanks = bits.map((v, i) => ({ i, v }))
      runPage.setData({ blanks })
      runPage.refreshSubmitState()
    } else if (isPhoto) {
      // 只交手写照片，不填答案与过程
      runPage.setData({ images: [{ i: 0, src: 'data:image/jpeg;base64,AAAA' }] })
      runPage.refreshSubmitState()
    } else {
      if (runPage.data.partCount >= 2) {
        const parts = answersLib.splitNumberedParts(q.answer)
        runPage.setData({
          partDrafts: parts.map((v, i) => ({ i, v })),
          work: '过程'
        })
      } else {
        runPage.setData({ draft: q.answer, work: '过程' })
      }
      runPage.refreshSubmitState()
    }

    ok('第 ' + (runPage.cursor + 1) + ' 题可提交', runPage.data.canSubmit === true)
    runPage.onSubmit()
    await sleep(30)
  }

  ok('全部 22 题都提交了', runPage.answers.length === 22, String(runPage.answers.length))
  const photoRec = runPage.answers.find((a, x) => x === photoQuestion)
  ok('交照片的题标为待确认', !!photoRec && photoRec.photoReview === 'pending', photoRec && photoRec.photoReview)
  const wrongRecs = runPage.answers.filter((a) => !a.correct && a.photoReview !== 'pending')
  ok('故意答错的题被判错', wrongRecs.length >= 1, '错 ' + wrongRecs.length)
  ok('每道题都记了用时', runPage.answers.every((a) => typeof a.durationMs === 'number' && a.durationMs >= 0))

  // 交卷
  runPage.doFinish()
  const round = store.getData().rounds[roundId]
  ok('交卷后写入 finishedAt', !!round.finishedAt)
  ok('汇总了错题', (round.wrongQuestionIds || []).length >= 1)
  ok('汇总了薄弱知识点', (round.weakPointIds || []).length >= 1)
  ok('待确认照片不计入错题', (round.wrongQuestionIds || []).indexOf(photoRec.questionId) < 0)

  const loop = store.getData().loops['7a-c1']
  ok('生成了 loop 状态', !!loop)
  ok('因错题/待确认而未标记掌握', loop && loop.status === 'remedial', loop && loop.status)

  // 报告页
  const reportPage = makeInstance(loadPage('pkgContent/pages/report/report'))
  await reportPage.onLoad({ id: roundId })
  await reportPage.onShow()
  ok('报告页 22 条记录', reportPage.data.answered === 22, String(reportPage.data.answered))
  ok('报告页未通过（有待确认）', reportPage.data.passed === false)

  // 确认手写照片为正确后，应重新汇总
  const beforeWrong = (store.getData().rounds[roundId].wrongQuestionIds || []).length
  reportPage.confirmPhoto({ currentTarget: { dataset: { qid: photoRec.questionId, ok: '1' } } })
  const after = store.getData().rounds[roundId]
  ok('确认手写正确后该题不再待确认', !after.answers.some((a) => a.photoReview === 'pending'))
  ok('确认后汇总仍有错题（故意答错那题）', (after.wrongQuestionIds || []).length >= 1 && (after.wrongQuestionIds || []).length <= beforeWrong + 1)

  // 专项练习
  reportPage.startPractice()
  const rounds = store.listRounds()
  const practice = rounds.find((r) => r.kind === 'practice')
  ok('生成了专项练习轮次', !!practice)
  ok('专项练习有题目', !!(practice && practice.exam && practice.exam.questions.length > 0), practice && String(practice.exam.questions.length))
  ok('专项练习按题型分节', !!(practice && practice.exam.sections.length > 0))
  ok('专项练习题量不超过 22', !practice || practice.exam.questions.length <= 22)

  console.log('\n通过 ' + pass + ' 项，失败 ' + fail + ' 项')
  process.exit(fail === 0 ? 0 : 1)
})().catch((e) => {
  console.error('测试异常：', e)
  process.exit(1)
})
