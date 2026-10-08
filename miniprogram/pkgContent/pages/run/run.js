var store = require('../../../lib/store')
var auth = require('../../../lib/auth')
var answersLib = require('../../../lib/answers')
var grading = require('../../../lib/grading')
var modelGrade = require('../../../lib/modelGrade')
var content = require('../../content')

function blankCount(stem) {
  var m = String(stem || '').match(/_{3,}/g)
  return m ? m.length : 0
}

function typeLabel(t) {
  return grading.TYPE_LABEL[t] || t
}

function difficultyLabel(d) {
  return grading.DIFFICULTY_LABEL[d] || String(d)
}

function fmt(sec) {
  return grading.formatDuration(sec * 1000)
}

/** 压缩后读成 dataURL，供预览和上传批改使用 */
function compressToDataUrl(filePath) {
  return new Promise(function (resolve) {
    function read(path) {
      wx.getFileSystemManager().readFile({
        filePath: path,
        encoding: 'base64',
        success: function (res) { resolve('data:image/jpeg;base64,' + res.data) },
        fail: function () { resolve('') }
      })
    }
    wx.compressImage({
      src: filePath,
      quality: 58,
      compressedWidth: 820,
      success: function (res) { read(res.tempFilePath) },
      fail: function () { read(filePath) }
    })
  })
}

Page({
  data: {
    ready: false,
    title: '',
    idx: 0,
    total: 0,
    progressPct: 0,
    currentId: '',
    stem: '',
    typeLabel: '',
    difficultyLabel: '',
    fromBook: false,
    bookRefText: '',
    isChoice: false,
    isFill: false,
    isLong: false,
    isCalc: false,
    optionsView: [],
    blanks: [],
    partDrafts: [],
    partCount: 0,
    draft: '',
    work: '',
    images: [],
    elapsedText: '0 秒',
    currentElapsedText: '0 秒',
    totalEstimatedText: '—',
    currentEstimatedText: '—',
    flash: false,
    grading: false,
    canSubmit: false,
    submitLabel: '提交本题',
    submitTip: '',
    finishLabel: '交卷',
    nums: []
  },

  onLoad: function (options) {
    this.roundId = options && options.id
    this.spent = {}
    this.openedAt = {}
    this.activeSince = Date.now()
    this.cursor = 0
    this.timer = null
    this.tick = 0
    this.restore()
  },

  onShow: function () {
    if (!auth.requireLogin()) return
    this.activeSince = Date.now()
    this.startTimer()
  },

  onHide: function () {
    this.flush(this.currentQuestionId())
    this.stopTimer()
  },

  onUnload: function () {
    this.flush(this.currentQuestionId())
    this.stopTimer()
  },

  onPullDownRefresh: function () {
    wx.stopPullDownRefresh()
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
    this.byId = {}
    this.questions.forEach(function (q) { this.byId[q.id] = q }, this)

    var saved = round.answers || []
    this.answers = saved.slice()
    var firstOpen = -1
    for (var i = 0; i < this.questions.length; i++) {
      var qid = this.questions[i].id
      var rec = null
      for (var j = 0; j < saved.length; j++) {
        if (saved[j].questionId === qid) { rec = saved[j]; break }
      }
      if (rec) {
        this.spent[qid] = rec.durationMs || 0
        this.openedAt[qid] = rec.startedAt || Date.now()
      } else if (firstOpen < 0) {
        firstOpen = i
      }
    }
    this.cursor = firstOpen >= 0 ? firstOpen : 0
    this.activeSince = Date.now()
    this.setData({ ready: true, title: round.title, total: this.questions.length })
    this.loadCurrent()
    this.startTimer()
  },

  currentQuestionId: function () {
    var q = this.questions && this.questions[this.cursor]
    return q ? q.id : null
  },

  startTimer: function () {
    var that = this
    this.stopTimer()
    this.tickFn = function () {
      that.updateClock()
    }
    this.timer = setInterval(this.tickFn, 1000)
    this.updateClock()
  },

  stopTimer: function () {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  },

  updateClock: function () {
    if (!this.round) return
    var elapsed = Date.now() - this.round.startedAt
    var qid = this.currentQuestionId()
    var spent = (this.spent[qid] || 0) + Math.max(0, Date.now() - this.activeSince)
    var cur = this.questions[this.cursor]
    this.setData({
      elapsedText: grading.formatDuration(elapsed),
      currentElapsedText: grading.formatDuration(spent),
      totalEstimatedText: fmt(this.round.exam.totalEstimatedSeconds),
      currentEstimatedText: cur ? fmt(cur.estimatedSeconds) : '—'
    })
  },

  /** 结束当前题的计时，把这段时间记到该题上 */
  flush: function (questionId) {
    if (!questionId) return
    var now = Date.now()
    this.spent[questionId] = (this.spent[questionId] || 0) + Math.max(0, now - this.activeSince)
    if (this.openedAt[questionId] == null) this.openedAt[questionId] = this.activeSince
    this.activeSince = now
  },

  loadCurrent: function () {
    var q = this.questions[this.cursor]
    if (!q) return
    var rec = this.findRecord(q.id)
    var partCount = 0
    if (q.type === 'calc' || q.type === 'applied') {
      partCount = answersLib.splitNumberedParts(q.stem).length
      if (partCount < 2) partCount = 0
    }

    var optionsView = (q.options || []).map(function (text, i) {
      return { letter: String.fromCharCode(65 + i), text: text, active: false }
    })

    var blanks = []
    var draft = ''
    var partDrafts = []
    var work = ''
    var images = []

    if (rec) {
      work = rec.work || ''
      images = (rec.images || []).map(function (src, i) { return { i: i, src: src } })
      if (q.type === 'fill') {
        var bits = rec.value ? String(rec.value).split('；') : []
        var n = Math.max(1, blankCount(q.stem), bits.length)
        for (var b = 0; b < n; b++) blanks.push({ i: b, v: bits[b] || '' })
      } else if (partCount >= 2) {
        var savedParts = answersLib.splitNumberedParts(rec.value || '')
        for (var p = 0; p < partCount; p++) partDrafts.push({ i: p, v: savedParts[p] || '' })
      } else {
        draft = rec.value || ''
      }
    } else {
      if (q.type === 'fill') {
        var n2 = Math.max(1, blankCount(q.stem))
        for (var b2 = 0; b2 < n2; b2++) blanks.push({ i: b2, v: '' })
      } else if (partCount >= 2) {
        for (var p2 = 0; p2 < partCount; p2++) partDrafts.push({ i: p2, v: '' })
      }
    }

    if (draft && q.type === 'choice') {
      optionsView.forEach(function (o) { o.active = o.letter === draft })
    }

    this.setData({
      idx: this.cursor,
      progressPct: this.questions.length ? Math.round(((this.cursor + 1) / this.questions.length) * 100) : 0,
      currentId: q.id,
      stem: q.stem,
      typeLabel: typeLabel(q.type),
      difficultyLabel: difficultyLabel(q.difficulty),
      fromBook: !!(q.source && q.source.kind === 'book'),
      bookRefText: q.source && q.source.ref ? ' · ' + q.source.ref : '',
      isChoice: q.type === 'choice',
      isFill: q.type === 'fill',
      isLong: q.type === 'calc' || q.type === 'applied',
      isCalc: q.type === 'calc',
      optionsView: optionsView,
      blanks: blanks,
      partDrafts: partDrafts,
      partCount: partCount,
      draft: draft,
      work: work,
      images: images,
      nums: this.buildNums()
    }, this)
    this.refreshSubmitState()
  },

  buildNums: function () {
    var that = this
    return this.questions.map(function (q, i) {
      var rec = that.findRecord(q.id)
      var cls = ''
      if (i === that.cursor) cls = 'num-current'
      else if (rec) cls = rec.photoReview === 'pending' ? 'num-pending' : rec.correct ? 'num-right' : 'num-wrong'
      return { i: i, label: String(i + 1), cls: cls }
    })
  },

  findRecord: function (questionId) {
    for (var i = 0; i < this.answers.length; i++) {
      if (this.answers[i].questionId === questionId) return this.answers[i]
    }
    return null
  },

  /** 当前答题状态 -> 可提交性、按钮文案、提示语 */
  refreshSubmitState: function () {
    var q = this.questions[this.cursor]
    if (!q) return
    var rec = this.findRecord(q.id)
    var hasImage = this.data.images.length > 0
    var can = false
    if (hasImage) can = true
    else if (q.type === 'fill') {
      can = this.data.blanks.some(function (b) { return b.v && b.v.trim() })
    } else if (this.data.partCount >= 2) {
      can = this.data.partDrafts.some(function (p) { return p.v && p.v.trim() })
    } else {
      can = !!(this.data.draft && this.data.draft.trim())
    }

    var isLong = q.type === 'calc' || q.type === 'applied'
    var tip = '点击题号可查看、修改任意一题。离开题目时本题计时暂停。'
    if (this.data.gradeError) tip = this.data.gradeError
    else if (isLong) {
      tip = hasImage
        ? '已上传手写照片。批改以照片为准，文字框只作参考。'
        : '计算题和应用题提交后，由模型对照标准答案和解析批改；未接入批改服务器时先按文字比对。'
    }
    this.setData({
      canSubmit: can,
      submitLabel: this.data.grading
        ? '批改中…'
        : rec ? '保存修改' : q.type === 'choice' ? '提交本题' : q.type === 'fill' ? '提交答案' : '提交并批改',
      submitTip: tip,
      finishLabel: this.unansweredCount() > 0 ? '交卷（还有 ' + this.unansweredCount() + ' 题未答）' : '交卷并查看报告'
    })
  },

  unansweredCount: function () {
    var that = this
    return this.questions.filter(function (q) { return !that.findRecord(q.id) }).length
  },

  // ---------- 输入 ----------
  onSelectOption: function (e) {
    var letter = e.currentTarget.dataset.letter
    var optionsView = this.data.optionsView.map(function (o) {
      return { letter: o.letter, text: o.text, active: o.letter === letter }
    })
    if (this.firstPickAt == null) this.firstPickAt = Date.now()
    this.setData({ draft: letter, optionsView: optionsView }, this.refreshSubmitState)
  },

  onDraftInput: function (e) {
    this.setData({ draft: e.detail.value, gradeError: '' }, this.refreshSubmitState)
  },

  onBlankInput: function (e) {
    var i = e.currentTarget.dataset.i
    var blanks = this.data.blanks.slice()
    blanks[i] = { i: i, v: e.detail.value }
    this.setData({ blanks: blanks, gradeError: '' }, this.refreshSubmitState)
  },

  onPartInput: function (e) {
    var i = e.currentTarget.dataset.i
    var partDrafts = this.data.partDrafts.slice()
    partDrafts[i] = { i: i, v: e.detail.value }
    this.setData({ partDrafts: partDrafts, gradeError: '' }, this.refreshSubmitState)
  },

  onWorkInput: function (e) {
    this.setData({ work: e.detail.value, gradeError: '' }, this.refreshSubmitState)
  },

  onTakePhoto: function () {
    this.chooseImages(['camera'])
  },

  onPickPhoto: function () {
    this.chooseImages(['album'])
  },

  chooseImages: function (sourceType) {
    var that = this
    var remain = 3 - this.data.images.length
    if (remain <= 0) {
      wx.showToast({ title: '最多 3 张', icon: 'none' })
      return
    }
    wx.chooseMedia({
      count: remain,
      mediaType: ['image'],
      sourceType: sourceType,
      sizeType: ['compressed'],
      success: function (res) {
        var files = res.tempFiles || []
        Promise.all(files.map(function (f) { return compressToDataUrl(f.tempFilePath) }))
          .then(function (urls) {
            var list = that.data.images.slice()
            urls.forEach(function (src) {
              if (src) list.push({ i: list.length, src: src })
            })
            that.setData({ images: list }, that.refreshSubmitState)
          })
      },
      fail: function () { /* 用户取消，忽略 */ }
    })
  },

  onRemoveImage: function (e) {
    var i = e.currentTarget.dataset.i
    var list = this.data.images.filter(function (x) { return x.i !== i })
      .map(function (x, k) { return { i: k, src: x.src } })
    this.setData({ images: list }, this.refreshSubmitState)
  },

  onPreviewImage: function (e) {
    var i = e.currentTarget.dataset.i
    var urls = this.data.images.map(function (x) { return x.src })
    wx.previewImage({ current: urls[i], urls: urls })
  },

  // ---------- 题号跳转 ----------
  onGoTo: function (e) {
    var next = Number(e.currentTarget.dataset.i)
    if (isNaN(next) || next === this.cursor) return
    this.flush(this.currentQuestionId())
    this.cursor = Math.max(0, Math.min(this.questions.length - 1, next))
    this.loadCurrent()
    this.updateClock()
    wx.pageScrollTo({ scrollTop: 0, duration: 200 })
  },

  // ---------- 提交 ----------
  answerValue: function () {
    var q = this.questions[this.cursor]
    if (q.type === 'choice') return this.data.draft
    if (q.type === 'fill') {
      var bits = this.data.blanks.map(function (b) { return b.v })
      return bits.some(function (b) { return b && b.trim() }) ? bits.join('；') : ''
    }
    if (this.data.partCount >= 2) {
      return this.data.partDrafts.map(function (p, i) {
        return '(' + (i + 1) + ') ' + String(p.v || '').trim()
      }).filter(function (s) { return !/^\(\d+\)\s*$/.test(s) }).join('\n')
    }
    return this.data.draft
  },

  onSubmit: function () {
    var that = this
    var q = this.questions[this.cursor]
    if (!q || !this.data.canSubmit || this.data.grading) return

    this.flush(q.id)
    var value = this.answerValue()
    var images = this.data.images.map(function (x) { return x.src })
    var openEnded = q.type === 'calc' || q.type === 'applied'
    var hasText = !!(value && value.trim()) || !!(this.data.work && this.data.work.trim())

    function save(grade, note) {
      var spent = that.spent[q.id] || 0
      var rec = {
        questionId: q.id,
        type: q.type,
        startedAt: that.openedAt[q.id] || Date.now(),
        submittedAt: Date.now(),
        durationMs: spent,
        firstPickMs: that.firstPickAt != null ? that.firstPickAt - (that.openedAt[q.id] || that.firstPickAt) : undefined,
        value: value,
        work: that.data.work || undefined,
        images: images.length ? images : undefined,
        revisitMs: 0,
        revisitCount: 0,
        correct: grade.photoPending ? false : grade.correct,
        score: grade.score,
        errorTags: grade.errorTags || [],
        errorReason: grade.errorReason || '',
        photoReview: grade.photoPending ? 'pending' : undefined,
        index: that.cursor + 1
      }
      var next = []
      var replaced = false
      that.answers.forEach(function (a) {
        if (a.questionId === q.id) { next.push(rec); replaced = true }
        else next.push(a)
      })
      if (!replaced) next.push(rec)
      that.answers = next
      store.saveRound(Object.assign({}, that.round, { answers: next }))
      that.setData({ flash: true, gradeError: note || '' })
      setTimeout(function () { that.setData({ flash: false }) }, 1200)
      that.loadCurrent()
      that.autoAdvance()
    }

    if (openEnded && (hasText || images.length)) {
      this.setData({ grading: true, gradeError: '' }, this.refreshSubmitState)
      modelGrade.gradeOpenQuestion(q, value, this.data.work, images)
        .then(function (grade) {
          that.setData({ grading: false })
          save(grade, '')
        })
        .catch(function (err) {
          // 没有批改服务器或请求失败时，退回本地文字比对，保证考评能正常进行
          var grade = grading.gradeQuestion(q, value, images.length > 0)
          that.setData({ grading: false })
          save(grade, (err && err.message ? err.message + ' ' : '') + '（已按本地文字比对判分）')
        })
      return
    }

    save(grading.gradeQuestion(q, value, images.length > 0), '')
  },

  autoAdvance: function () {
    var that = this
    var next = -1
    for (var i = 0; i < this.questions.length; i++) {
      if (i === this.cursor) continue
      if (!that.findRecord(this.questions[i].id)) { next = i; break }
    }
    if (next < 0) return
    this.flush(this.currentQuestionId())
    this.cursor = next
    this.loadCurrent()
    this.updateClock()
  },

  // ---------- 交卷 ----------
  onFinish: function () {
    var that = this
    var unanswered = this.unansweredCount()
    wx.showModal({
      title: '交卷',
      content: unanswered > 0
        ? '还有 ' + unanswered + ' 题未作答，未作答按 0 分计入。确定交卷？'
        : '确定交卷并查看考评报告？',
      success: function (res) {
        if (!res.confirm) return
        that.doFinish()
      }
    })
  },

  doFinish: function () {
    this.flush(this.currentQuestionId())
    this.stopTimer()
    var qMap = {}
    this.questions.forEach(function (q) { qMap[q.id] = q })
    var summary = grading.summarizeRecords(this.answers, qMap)
    var pending = this.answers.some(function (a) { return a.photoReview === 'pending' })
    var cleared = summary.wrongQuestionIds.length === 0 && summary.slowQuestionIds.length === 0 && !pending
    var finishedRound = Object.assign({}, this.round, {
      answers: this.answers,
      finishedAt: Date.now(),
      totalMs: Date.now() - this.round.startedAt,
      wrongQuestionIds: summary.wrongQuestionIds,
      slowQuestionIds: summary.slowQuestionIds,
      weakPointIds: summary.weakPointIds
    })
    store.saveRound(finishedRound)

    var data = store.getData()
    var existing = data.loops[this.round.chapterId]
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

    wx.redirectTo({ url: '/pkgContent/pages/report/report?id=' + this.round.id })
  }
})
