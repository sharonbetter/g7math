/**
 * 知识点课件页。
 *
 * 页面参数：?point=xxx 或 ?id=xxx（两者等价，任传其一）。
 * 进入时用 store.markStudied(pointId) 记录已学。
 *
 * 上一课 / 下一课：采用 wx.redirectTo 重新打开本页并换上相邻 point 参数
 * （redirectTo 先关闭当前页再打开，连续切换时页面栈不会越堆越深；返回键回到章节页）。
 */
var data = require('../../../lib/data')
var store = require('../../../lib/store')
var auth = require('../../../lib/auth')
var content = require('../../content')

var SLIDE_LABEL = {
  concept: '概念讲解',
  example: '例题精讲',
  method: '方法提炼',
  pitfall: '易错提醒',
  book: '新思维拓展'
}

var SLIDE_TONE = {
  concept: 'badge-blue',
  example: 'badge-violet',
  method: 'badge-green',
  pitfall: 'badge-amber',
  book: 'badge-violet'
}

/** 复制一份列表并只修改第 index 项，避免直接改 this.data */
function patchItem(list, index, patch) {
  var out = []
  for (var i = 0; i < list.length; i++) {
    var item = {}
    for (var k in list[i]) item[k] = list[i][k]
    if (i === index) {
      for (var p in patch) item[p] = patch[p]
    }
    out.push(item)
  }
  return out
}

function starText(n) {
  var level = Math.max(1, Math.min(3, n || 1))
  var s = ''
  for (var i = 0; i < level; i++) s += '★'
  return s
}

Page({
  data: {
    pointId: '',
    found: true,
    // 课件文件缺失 / 该知识点暂无课件：仍然展示大纲要点
    missing: '',
    chapter: null,
    point: null,
    lesson: null,
    star: '★',
    objectives: [],
    slides: [],
    slideIdx: 0,
    slideTotal: 0,
    slidesDone: false,
    checkQuestions: [],
    prev: null,
    next: null,
    studied: false
  },

  onLoad: function (options) {
    var id = (options && (options.point || options.id)) || ''
    this.setData({ pointId: id })
  },

  onShow: function () {
    var session = auth.requireLogin()
    if (!session) return
    this.refresh()
  },

  refresh: function () {
    var pointId = this.data.pointId
    var chapter = data.chapterOfPoint(pointId)
    if (!chapter) {
      this.setData({ found: false, chapter: null, point: null, lesson: null })
      return
    }

    var point = data.findPoint(pointId) || { id: pointId, name: '知识点', summary: '' }
    var chapterInfo = { id: chapter.id, no: chapter.no, title: chapter.title }

    var file = content.loadLessonFile(chapter.id)
    var lesson = file ? content.findLesson(file, pointId) : null

    if (!lesson) {
      this.setData({
        found: true,
        missing: file ? '该知识点的课件尚未生成。' : '该章课件正在生成中。',
        chapter: chapterInfo,
        point: {
          id: point.id,
          name: point.name,
          summary: point.summary || '',
          keyPoints: point.keyPoints || [],
          estimatedMinutes: point.estimatedMinutes
        },
        lesson: null,
        star: starText(point.difficulty),
        objectives: [],
        slides: [],
        slideIdx: 0,
        slideTotal: 0,
        slidesDone: true,
        checkQuestions: [],
        prev: null,
        next: null,
        studied: false
      })
      return
    }

    // 进入即记录已学
    store.markStudied(pointId)
    var d = store.getData()

    var ordered = data.chapterPointIds(chapter)
    var idx = ordered.indexOf(pointId)
    var prevId = idx > 0 ? ordered[idx - 1] : ''
    var nextId = idx >= 0 && idx < ordered.length - 1 ? ordered[idx + 1] : ''
    var prevPoint = prevId ? data.findPoint(prevId) : null
    var nextPoint = nextId ? data.findPoint(nextId) : null

    var slides = (lesson.slides || []).map(function (s, i) {
      var kind = s.kind || 'concept'
      return {
        id: 'slide-' + i,
        kind: kind,
        label: SLIDE_LABEL[kind] || '讲解',
        tone: SLIDE_TONE[kind] || 'badge-blue',
        title: s.title || '',
        body: s.body || '',
        problem: s.problem || '',
        solution: s.solution || '',
        notes: s.notes || '',
        bookRef: s.bookRef || '',
        visible: i === 0,
        showSolution: false
      }
    })

    var checkQuestions = (lesson.checkQuestions || []).map(function (q, i) {
      return {
        id: 'cq-' + i,
        question: q.question || '',
        answer: q.answer || '',
        shown: false
      }
    })

    this.setData({
      found: true,
      missing: '',
      chapter: chapterInfo,
      point: {
        id: point.id,
        name: point.name,
        summary: point.summary || '',
        keyPoints: point.keyPoints || [],
        estimatedMinutes: point.estimatedMinutes
      },
      lesson: {
        title: lesson.title || point.name,
        durationMinutes: lesson.durationMinutes,
        summary: lesson.summary || ''
      },
      star: starText(point.difficulty),
      objectives: lesson.objectives || [],
      slides: slides,
      slideIdx: 0,
      slideTotal: slides.length,
      slidesDone: slides.length <= 1,
      checkQuestions: checkQuestions,
      prev: prevPoint ? { id: prevPoint.id, name: prevPoint.name } : null,
      next: nextPoint ? { id: nextPoint.id, name: nextPoint.name } : null,
      studied: !!d.studied[pointId]
    })
  },

  /** 逐张展示下一张 slide */
  nextSlide: function () {
    var idx = this.data.slideIdx
    if (idx >= this.data.slideTotal - 1) return
    var to = idx + 1
    this.setData({
      slideIdx: to,
      slides: patchItem(this.data.slides, to, { visible: true }),
      slidesDone: to >= this.data.slideTotal - 1
    })
  },

  /** 回顾课件：收起到只看第一张 */
  restartSlides: function () {
    var slides = []
    for (var i = 0; i < this.data.slides.length; i++) {
      slides.push(patchItem(this.data.slides, i, { visible: i === 0, showSolution: false })[i])
    }
    this.setData({ slides: slides, slideIdx: 0, slidesDone: slides.length <= 1 })
  },

  /** 例题默认收起解答，点按钮展开 */
  showSolution: function (e) {
    var idx = Number(e.currentTarget.dataset.index)
    this.setData({ slides: patchItem(this.data.slides, idx, { showSolution: true }) })
  },

  hideSolution: function (e) {
    var idx = Number(e.currentTarget.dataset.index)
    this.setData({ slides: patchItem(this.data.slides, idx, { showSolution: false }) })
  },

  /** 随堂检测：用 shown 字段控制答案折叠 */
  toggleAnswer: function (e) {
    var idx = Number(e.currentTarget.dataset.index)
    var list = this.data.checkQuestions
    var shown = !(list[idx] && list[idx].shown)
    this.setData({ checkQuestions: patchItem(list, idx, { shown: shown }) })
  },

  /** 同章内切换知识点：redirectTo，见文件头注释 */
  goPoint: function (e) {
    var id = e.currentTarget.dataset.id
    if (!id) return
    wx.redirectTo({ url: '/pkgContent/pages/lesson/lesson?point=' + id })
  },

  goChapter: function () {
    if (!this.data.chapter) return
    wx.navigateTo({ url: '/pkgContent/pages/chapter/chapter?id=' + this.data.chapter.id })
  },

  goExam: function () {
    if (!this.data.chapter) return
    wx.navigateTo({ url: '/pkgContent/pages/examIntro/examIntro?id=' + this.data.chapter.id })
  }
})
