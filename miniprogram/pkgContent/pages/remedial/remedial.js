var store = require('../../../lib/store')
var auth = require('../../../lib/auth')
var grading = require('../../../lib/grading')
var adaptive = require('../../../lib/adaptive')
var data = require('../../../lib/data')
var content = require('../../content')

var SLIDE_LABEL = {
  concept: '概念回顾',
  method: '方法提炼',
  pitfall: '易错提醒',
  book: '新思维拓展',
  example: '典型例题'
}

Page({
  data: {
    ready: false,
    round: null,
    wrongCount: 0,
    slowCount: 0,
    weak: [],
    groups: [],
    analyses: [],
    busy: false
  },

  onLoad: function (options) {
    this.roundId = options && options.id
  },

  onShow: function () {
    if (!auth.requireLogin()) return
    this.restore()
  },

  restore: function () {
    var round = this.roundId ? store.getData().rounds[this.roundId] : null
    if (!round) {
      wx.showModal({
        title: '未找到考评记录',
        content: '请先完成一次章节考评。',
        showCancel: false,
        success: function () { wx.navigateBack() }
      })
      return
    }
    this.round = round
    var points = data.allPoints()
    var lessonFile = content.loadLessonFile(round.chapterId)
    var lessonMap = {}
    if (lessonFile && lessonFile.lessons) {
      lessonFile.lessons.forEach(function (l) { lessonMap[l.pointId] = l })
    }
    var qMap = {}
    ;(round.exam.questions || []).forEach(function (q) { qMap[q.id] = q })
    this.qMap = qMap

    var analyses = adaptive.analyzeRound(round, points, lessonMap)
    var weak = adaptive.weakPointsOf(round, points)

    // 按知识点归并：该点的问题题目数、错题数、超时数，以及该点课件里的概念/方法/易错/例题
    var groups = weak.map(function (p) {
      var related = analyses.filter(function (a) {
        return (a.question.pointIds || []).indexOf(p.id) >= 0
      })
      var lesson = lessonMap[p.id]
      var slides = []
      if (lesson && lesson.slides) {
        lesson.slides.forEach(function (s) {
          if (s.kind === 'example' || s.kind === 'book') return
          slides.push({
            kindLabel: SLIDE_LABEL[s.kind] || s.kind,
            title: s.title,
            body: s.body || '',
            problem: s.problem || '',
            solution: s.solution || ''
          })
        })
      }
      return {
        pointId: p.id,
        name: p.name,
        questionCount: related.length,
        wrongCount: related.filter(function (a) { return !a.record.correct }).length,
        slowCount: related.filter(function (a) { return a.slow }).length,
        slides: slides
      }
    })

    this.setData({
      ready: true,
      round: round,
      wrongCount: (round.wrongQuestionIds || []).length,
      slowCount: (round.slowQuestionIds || []).length,
      weak: weak,
      groups: groups,
      analyses: analyses.map(function (a) {
        var gap = a.gapMs
        return {
          qid: a.question.id,
          stem: a.question.stem,
          answer: a.question.answer,
          solution: a.question.solution,
          valueText: a.record.value || '（未作答）',
          errorReason: a.reason,
          correct: !!a.record.correct,
          slow: a.slow,
          gapText: grading.formatGap(gap)
        }
      })
    })
  },

  openLesson: function (e) {
    wx.navigateTo({ url: '/pkgContent/pages/lesson/lesson?point=' + e.currentTarget.dataset.point })
  },

  backReport: function () {
    wx.redirectTo({ url: '/pkgContent/pages/report/report?id=' + this.round.id })
  },

  startPractice: function () {
    if (this.data.busy) return
    this.setData({ busy: true })
    try {
      var all = content.loadAllExams()
      all[this.round.exam.id] = this.round.exam
      var plan = adaptive.buildPracticeExam(this.round, all, {})
      var practiceRound = {
        id: store.makeId(plan.exam.id + '-r'),
        kind: 'practice',
        round: this.round.round + 1,
        parentRoundId: this.round.id,
        chapterId: this.round.chapterId,
        chapterTitle: this.round.chapterTitle,
        title: plan.exam.title,
        examId: plan.exam.id,
        startedAt: Date.now(),
        totalMs: 0,
        answers: [],
        wrongQuestionIds: [],
        slowQuestionIds: [],
        weakPointIds: [],
        exam: plan.exam
      }
      store.saveRound(practiceRound)
      this.setData({ busy: false })
      wx.redirectTo({ url: '/pkgContent/pages/run/run?id=' + practiceRound.id })
    } catch (err) {
      this.setData({ busy: false })
      wx.showToast({ title: '生成失败，请重试', icon: 'none' })
    }
  }
})
