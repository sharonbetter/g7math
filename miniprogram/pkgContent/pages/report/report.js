var store = require('../../../lib/store')
var auth = require('../../../lib/auth')
var grading = require('../../../lib/grading')
var adaptive = require('../../../lib/adaptive')
var data = require('../../../lib/data')
var content = require('../../content')
var incentives = require('../../../lib/incentives')

function fmtMs(ms) {
  return grading.formatDuration(ms)
}

function fmtGap(ms) {
  return grading.formatGap(ms)
}

function brief(text, n) {
  var s = String(text || '').replace(/\s+/g, ' ')
  return s.length > n ? s.slice(0, n) + '…' : s
}

Page({
  data: {
    ready: false,
    round: null,
    kindLabel: '',
    finishedText: '未交卷',
    accuracy: 0,
    correctCount: 0,
    answered: 0,
    scorePct: 0,
    wrongCount: 0,
    slowCount: 0,
    actualTotalText: '—',
    estimatedTotalText: '—',
    overTime: false,
    passed: false,
    analyses: [],
    weak: [],
    timings: [],
    items: [],
    level: 1,
    levelName: '',
    xpToNext: 0,
    busy: false
  },

  onLoad: function (options) {
    this.roundId = options && options.id
    this.openMap = {}
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
        content: '请从「章节考评」重新开始。',
        showCancel: false,
        success: function () { wx.navigateBack() }
      })
      return
    }
    this.round = round
    this.questions = round.exam.questions || []
    this.qMap = {}
    this.questions.forEach(function (q) { this.qMap[q.id] = q }, this)
    this.build()
  },

  build: function () {
    var round = this.round
    var game = incentives.computeIncentives(store.getData())
    var answers = round.answers || []
    var points = data.allPoints()
    var analyses = adaptive.analyzeRound(round, points, {})
    var weak = adaptive.weakPointsOf(round, points)

    var answered = answers.length
    var correctCount = answers.filter(function (a) { return a.correct }).length
    var totalScore = answers.reduce(function (s, a) { return s + (a.score || 0) }, 0)
    var estimatedTotal = answers.reduce(function (s, a) {
      var q = this.qMap[a.questionId]
      return s + (q ? q.estimatedSeconds * 1000 : 0)
    }.bind(this), 0)
    var actualTotal = answers.reduce(function (s, a) { return s + (a.durationMs || 0) }, 0)
    var wrongCount = (round.wrongQuestionIds || []).length
    var slowCount = (round.slowQuestionIds || []).length
    var pending = answers.some(function (a) { return a.photoReview === 'pending' })

    var roundKind = round.kind === 'exam' ? '章节考评' : round.kind === 'practice' ? '专项练习' : '专项讲解'

    var timings = answers.map(function (a, i) {
      var q = this.qMap[a.questionId]
      var est = q ? q.estimatedSeconds : 0
      var gap = (a.durationMs || 0) - est * 1000
      return {
        index: i + 1,
        typeLabel: q ? (grading.TYPE_LABEL[q.type] || q.type) : '',
        estimatedText: fmtMs(est * 1000),
        actualText: fmtMs(a.durationMs || 0),
        gapText: fmtGap(gap),
        over: gap > 60000,
        slow: q ? grading.isSlow(a.durationMs || 0, est) : false
      }
    }.bind(this))

    var items = answers.map(function (a, i) {
      var q = this.qMap[a.questionId]
      if (!q) return null
      var est = q.estimatedSeconds
      var gap = (a.durationMs || 0) - est * 1000
      var rubric = q.rubric || []
      var checked = (a.selfRubric || []).slice()
      while (checked.length < rubric.length) checked.push(false)
      return {
        qid: q.id,
        index: i + 1,
        stem: q.stem,
        stemBrief: brief(q.stem, 40),
        options: q.options || [],
        typeLabel: grading.TYPE_LABEL[q.type] || q.type,
        diffLabel: grading.DIFFICULTY_LABEL[q.difficulty] || String(q.difficulty),
        correct: !!a.correct,
        pending: a.photoReview === 'pending',
        slow: grading.isSlow(a.durationMs || 0, est),
        actualText: fmtMs(a.durationMs || 0),
        estimatedText: fmtMs(est * 1000),
        gapText: fmtGap(gap),
        valueText: a.value ? a.value : '（未作答）',
        work: a.work || '',
        images: a.images || [],
        answer: q.answer,
        solution: q.solution,
        errorReason: a.errorReason || '',
        rubric: rubric,
        rubricChecked: checked,
        scorePct: Math.round((a.score || 0) * 100),
        cls: a.photoReview === 'pending' ? 'num-pending' : a.correct ? 'num-right' : 'num-wrong',
        open: !!this.openMap[q.id]
      }
    }.bind(this)).filter(Boolean)

    this.setData({
      ready: true,
      round: round,
      kindLabel: roundKind,
      finishedText: round.finishedAt ? new Date(round.finishedAt).toLocaleString() : '未交卷',
      accuracy: answered ? Math.round((correctCount / answered) * 100) : 0,
      correctCount: correctCount,
      answered: answered,
      scorePct: answered ? Math.round((totalScore / answered) * 100) : 0,
      wrongCount: wrongCount,
      slowCount: slowCount,
      actualTotalText: fmtMs(actualTotal),
      estimatedTotalText: fmtMs(estimatedTotal),
      overTime: actualTotal > estimatedTotal + 60000,
      passed: wrongCount === 0 && slowCount === 0 && !pending,
      analyses: analyses,
      weak: weak,
      timings: timings,
      items: items,
      level: game.level,
      levelName: game.levelName,
      xpToNext: game.xpToNext
    })
  },

  toggleItem: function (e) {
    var i = Number(e.currentTarget.dataset.i)
    var items = this.data.items.slice()
    var item = Object.assign({}, items[i])
    item.open = !item.open
    this.openMap[item.qid] = item.open
    items[i] = item
    this.setData({ items: items })
  },

  previewPhoto: function (e) {
    var src = e.currentTarget.dataset.src
    var qid = e.currentTarget.dataset.qid
    var urls = []
    this.data.items.forEach(function (it) {
      if (it.qid === qid) urls = it.images
    })
    wx.previewImage({ current: src, urls: urls })
  },

  /** 对照解析确认手写照片的对错，并重新汇总本轮结果 */
  confirmPhoto: function (e) {
    var qid = e.currentTarget.dataset.qid
    var accepted = e.currentTarget.dataset.ok === '1' || e.currentTarget.dataset.ok === 1
    var that = this
    var answers = (this.round.answers || []).map(function (a) {
      if (a.questionId !== qid) return a
      var next = Object.assign({}, a)
      next.photoReview = accepted ? 'accepted' : 'rejected'
      next.correct = accepted
      next.score = accepted ? 1 : 0
      next.errorTags = accepted ? [] : ['手写答案有误']
      next.errorReason = accepted
        ? '已对照解析确认手写答案正确。'
        : '已对照解析确认手写答案有误。请按解析订正后再做专项练习。'
      return next
    })
    var summary = grading.summarizeRecords(answers, this.qMap)
    var nextRound = Object.assign({}, this.round, {
      answers: answers,
      wrongQuestionIds: summary.wrongQuestionIds,
      slowQuestionIds: summary.slowQuestionIds,
      weakPointIds: summary.weakPointIds
    })
    store.saveRound(nextRound)

    var pending = answers.some(function (a) { return a.photoReview === 'pending' })
    var cleared = summary.wrongQuestionIds.length === 0 && summary.slowQuestionIds.length === 0 && !pending
    var d = store.getData()
    var existing = d.loops[this.round.chapterId]
    var roundIds = (existing && existing.roundIds ? existing.roundIds : []).slice()
    if (roundIds.indexOf(this.round.id) < 0) roundIds.push(this.round.id)
    store.updateLoop({
      chapterId: this.round.chapterId,
      chapterTitle: this.round.chapterTitle,
      round: this.round.round,
      status: cleared ? 'mastered' : 'remedial',
      roundIds: roundIds,
      weakPointIds: summary.weakPointIds,
      updatedAt: Date.now()
    })

    this.round = nextRound
    this.build()
    wx.showToast({ title: accepted ? '已记为正确' : '已记为错误', icon: 'none' })
    void that
  },

  /** 勾选步骤要点，折算计算过程分 */
  onRubric: function (e) {
    var qid = e.currentTarget.dataset.qid
    var i = Number(e.currentTarget.dataset.ri)
    var item = null
    for (var k = 0; k < this.data.items.length; k++) {
      if (this.data.items[k].qid === qid) { item = this.data.items[k]; break }
    }
    if (!item) return
    var flags = item.rubricChecked.slice()
    flags[i] = e.detail.value.length > 0

    var answers = (this.round.answers || []).map(function (a) {
      if (a.questionId !== qid) return a
      var base = {
        correct: a.correct,
        score: a.score,
        errorTags: a.errorTags || [],
        errorReason: a.errorReason || ''
      }
      var graded = grading.scoreWithRubric(base, flags)
      var next = Object.assign({}, a)
      next.selfRubric = flags
      next.score = graded.score
      next.errorReason = graded.errorReason
      return next
    })
    var nextRound = Object.assign({}, this.round, { answers: answers })
    store.saveRound(nextRound)
    this.round = nextRound
    this.build()
  },

  goRemedial: function () {
    wx.navigateTo({ url: '/pkgContent/pages/remedial/remedial?id=' + this.round.id })
  },

  goExams: function () {
    wx.navigateTo({ url: '/pkgContent/pages/exams/exams' })
  },

  openLesson: function (e) {
    wx.navigateTo({ url: '/pkgContent/pages/lesson/lesson?point=' + e.currentTarget.dataset.point })
  },

  startPractice: function () {
    var that = this
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
      wx.navigateTo({ url: '/pkgContent/pages/run/run?id=' + practiceRound.id })
    } catch (err) {
      this.setData({ busy: false })
      wx.showToast({ title: '生成失败，请重试', icon: 'none' })
      void that
    }
  }
})
