var data = require('../../../lib/data')
var store = require('../../../lib/store')
var auth = require('../../../lib/auth')
var grading = require('../../../lib/grading')
var content = require('../../content')

var TYPE_ORDER = ['choice', 'fill', 'calc', 'applied']
var DIFF_ORDER = [1, 2, 3, 4, 5]

Page({
  data: {
    found: true,
    hasExam: true,
    chapterId: '',
    chapterNo: '',
    chapterTitle: '',
    examTitle: '',
    questionCount: 0,
    pointCount: 0,
    totalTimeText: '—',
    counts: [],
    difficulty: [],
    bookCount: 0,
    loopTip: '',
    busy: false
  },

  onLoad: function (options) {
    if (!auth.requireLogin()) return
    var chapterId = (options && options.id) || ''
    var chapter = data.findChapter(chapterId)

    if (!chapter) {
      this.setData({ found: false })
      return
    }

    var exam = content.loadExam(chapterId)
    if (!exam || !exam.questions || !exam.questions.length) {
      this.setData({
        found: true,
        hasExam: false,
        chapterId: chapter.id,
        chapterNo: chapter.no,
        chapterTitle: chapter.title
      })
      return
    }

    var questions = exam.questions
    var counts = TYPE_ORDER.map(function (t) {
      var list = questions.filter(function (q) { return q.type === t })
      var secs = list.reduce(function (s, q) { return s + (q.estimatedSeconds || 0) }, 0)
      return {
        type: t,
        label: grading.TYPE_LABEL[t] || t,
        n: list.length,
        timeText: grading.formatDuration(secs * 1000)
      }
    })

    var difficulty = []
    DIFF_ORDER.forEach(function (d) {
      var n = questions.filter(function (q) { return q.difficulty === d }).length
      if (n) difficulty.push({ d: d, label: grading.DIFFICULTY_LABEL[d] || String(d), n: n })
    })

    var pointIds = {}
    questions.forEach(function (q) {
      ;(q.pointIds || []).forEach(function (p) { pointIds[p] = true })
    })

    var bookCount = questions.filter(function (q) {
      return q.source && q.source.kind === 'book'
    }).length

    var d = store.getData()
    var loop = d.loops[chapter.id] || null
    var loopTip = ''
    if (loop && loop.status === 'mastered') loopTip = '本章已掌握，本次是重新考评'
    else if (loop) loopTip = '本章处于第 ' + (loop.round || 1) + ' 轮专项提升中'

    this.setData({
      found: true,
      hasExam: true,
      chapterId: chapter.id,
      chapterNo: chapter.no,
      chapterTitle: chapter.title,
      examTitle: exam.title || (chapter.no + ' ' + chapter.title),
      questionCount: questions.length,
      pointCount: Object.keys(pointIds).length,
      totalTimeText: grading.formatDuration((exam.totalEstimatedSeconds || 0) * 1000),
      counts: counts,
      difficulty: difficulty,
      bookCount: bookCount,
      loopTip: loopTip
    })
  },

  onStart: function () {
    if (this.data.busy) return
    var chapter = data.findChapter(this.data.chapterId)
    var exam = content.loadExam(this.data.chapterId)
    if (!chapter || !exam) {
      wx.showToast({ title: '考评卷不可用', icon: 'none' })
      return
    }

    var that = this
    this.setData({ busy: true })

    var round = {
      id: store.makeId('round'),
      kind: 'exam',
      round: 1,
      chapterId: chapter.id,
      chapterTitle: chapter.no + ' ' + chapter.title,
      title: exam.title,
      examId: exam.id,
      exam: exam,
      answers: [],
      startedAt: Date.now(),
      finishedAt: 0,
      totalMs: 0,
      wrongQuestionIds: [],
      slowQuestionIds: [],
      weakPointIds: []
    }
    store.saveRound(round)

    wx.navigateTo({
      url: '/pkgContent/pages/run/run?id=' + round.id,
      fail: function () {
        that.setData({ busy: false })
        wx.showToast({ title: '无法进入答题页', icon: 'none' })
      }
    })
  },

  goChapter: function () {
    wx.navigateTo({ url: '/pkgContent/pages/chapter/chapter?id=' + this.data.chapterId })
  },

  goExams: function () {
    wx.navigateBack({
      fail: function () {
        wx.redirectTo({ url: '/pkgContent/pages/exams/exams' })
      }
    })
  },

  goRemedial: function () {
    wx.navigateTo({ url: '/pkgContent/pages/remedial/remedial?chapter=' + this.data.chapterId })
  }
})
