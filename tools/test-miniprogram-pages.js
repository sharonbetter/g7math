#!/usr/bin/env node
/**
 * 小程序页面冒烟测试：用 stub 的 wx/Page 把每个页面真正 require 一遍，
 * 验证模块路径、数据访问与关键逻辑能跑通（微信开发者工具之外的静态检查）。
 *
 * 运行：node tools/test-miniprogram-pages.js
 */
const path = require('path')

const ROOT = path.join(__dirname, '..', 'miniprogram')

// ---------- stub 运行环境 ----------
const storage = {}
global.wx = {
  getStorageSync: (k) => (k in storage ? storage[k] : ''),
  setStorageSync: (k, v) => { storage[k] = v },
  removeStorageSync: (k) => { delete storage[k] },
  login: (o) => o.success && o.success({ code: 'test-code' }),
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

const captured = {}
global.Page = (cfg) => { captured.__last = cfg }
global.Component = () => {}
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

function loadPage(rel) {
  captured.__last = null
  const full = path.join(ROOT, rel)
  delete require.cache[require.resolve(full)]
  require(full)
  return captured.__last
}

const PAGES = [
  'pages/login/login',
  'pages/home/home',
  'pages/progress/progress',
  'pkgContent/pages/curriculum/curriculum',
  'pkgContent/pages/chapter/chapter',
  'pkgContent/pages/lesson/lesson',
  'pkgContent/pages/book/book',
  'pkgContent/pages/exams/exams',
  'pkgContent/pages/examIntro/examIntro',
  'pkgContent/pages/run/run',
  'pkgContent/pages/report/report',
  'pkgContent/pages/remedial/remedial'
]

console.log('=== 页面模块加载 ===')
for (const p of PAGES) {
  try {
    const cfg = loadPage(p)
    ok(p + ' 可加载且注册了 Page', !!(cfg && cfg.data))
  } catch (e) {
    ok(p + ' 可加载', false, e.message)
  }
}

// ---------- 数据访问 ----------
console.log('=== 内容数据 ===')
const dataLib = require(path.join(ROOT, 'lib', 'data'))
const content = require(path.join(ROOT, 'pkgContent', 'content'))

const chapters = dataLib.allChapters()
ok('章节 12 个', chapters.length === 12, '实际 ' + chapters.length)
ok('知识点 114 个', Object.keys(dataLib.allPoints()).length === 114)

const lessonIds = content.chapterIdsWithLessons()
const examIds = content.chapterIdsWithExams()
ok('课件 12 章', lessonIds.length === 12, '实际 ' + lessonIds.length)
ok('考评 12 章', examIds.length === 12, '实际 ' + examIds.length)

const lessonFile = content.loadLessonFile('7a-c1')
ok('能取到 7a-c1 课件', !!(lessonFile && lessonFile.lessons && lessonFile.lessons.length))
ok('7a-c1 课件 11 课', lessonFile.lessons.length === 11, '实际 ' + lessonFile.lessons.length)
ok('每课至少有 7 张 slide', lessonFile.lessons.every((l) => (l.slides || []).length >= 7))
ok('findLesson 能按 pointId 取', !!content.findLesson(lessonFile, '7a-1-01'))

const exam = content.loadExam('7a-c1')
ok('7a-c1 考评 22 题', exam.questions.length === 22, '实际 ' + exam.questions.length)
const typeCount = exam.questions.reduce((m, q) => { m[q.type] = (m[q.type] || 0) + 1; return m }, {})
ok('题型 8/5/5/4', typeCount.choice === 8 && typeCount.fill === 5 && typeCount.calc === 5 && typeCount.applied === 4, JSON.stringify(typeCount))
ok('考评总秒数等于各题之和', exam.totalEstimatedSeconds === exam.questions.reduce((s, q) => s + q.estimatedSeconds, 0))

const allExams = content.loadAllExams()
ok('载入全部考评卷 12 份', Object.keys(allExams).length === 12, '实际 ' + Object.keys(allExams).length)

const book = content.bookIndex()
ok('教辅索引有 units', !!(book && book.units && book.units.length))
const unit = book.units[0]
ok('能取到讲次正文', content.unitText(unit.textFile).length > 50, 'unit=' + unit.no)

// ---------- 会话与存储 ----------
console.log('=== 会话与按用户存储 ===')
const auth = require(path.join(ROOT, 'lib', 'auth'))
const store = require(path.join(ROOT, 'lib', 'store'))

auth.login('测试同学').then((res) => {
  ok('登录成功', res.ok === true, res.message)
  const session = auth.getSession()
  ok('会话有 id', !!session.id)

  store.saveRound({ id: 'r-test', chapterId: '7a-c1', startedAt: Date.now(), answers: [] })
  ok('写入后能读到该轮', !!store.getData().rounds['r-test'])

  // 换用户后数据必须隔离
  auth.logout()
  storage['g7math.localId.v1'] = 'another-user'
  return auth.login('另一个人').then(() => {
    ok('新用户看不到上一个用户的记录', !store.getData().rounds['r-test'])
    store.saveRound({ id: 'r-other', chapterId: '7b-c8', startedAt: Date.now(), answers: [] })
    ok('新用户有自己的记录', !!store.getData().rounds['r-other'])

    // 切回第一个用户
    auth.logout()
    storage['g7math.localId.v1'] = session.id
    return auth.login('测试同学')
  }).then(() => {
    ok('切回原用户能拿回自己的记录', !!store.getData().rounds['r-test'])
    ok('看不到另一个用户的记录', !store.getData().rounds['r-other'])
  })
}).then(() => {
  console.log('\n通过 ' + pass + ' 项，失败 ' + fail + ' 项')
  process.exit(fail === 0 ? 0 : 1)
}).catch((e) => {
  console.error('测试异常：', e)
  process.exit(1)
})
