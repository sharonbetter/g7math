var data = require('../../lib/data')
var store = require('../../lib/store')
var auth = require('../../lib/auth')
var adaptive = require('../../lib/adaptive')
var grading = require('../../lib/grading')
var incentives = require('../../lib/incentives')

var MAX_ROUNDS = 10

function pad(n) {
  return n < 10 ? '0' + n : '' + n
}

function formatTime(ts) {
  if (!ts) return '—'
  var d = new Date(ts)
  return (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + pad(d.getHours()) + ':' + pad(d.getMinutes())
}

function pct(a, b) {
  return b ? Math.round((a / b) * 100) : 0
}

Page({
  data: {
    totalPoints: 0,
    studiedCount: 0,
    studiedPct: 0,
    chapterCount: 0,
    masteredCount: 0,
    masteredPct: 0,
    roundCount: 0,
    totalAnswered: 0,
    totalWrong: 0,
    totalSlow: 0,
    totalTimeText: '—',
    rounds: [],
    userLabel: '',
    level: 1,
    levelName: '',
    xpTotal: 0,
    xpInto: 0,
    xpForNext: 0,
    xpToNext: 0,
    nextLevelName: '',
    xpPct: 0,
    streak: 0,
    earnedCount: 0,
    badgeTotal: 0,
    badges: [],
    levels: []
  },

  onShow: function () {
    var session = auth.requireLogin()
    if (!session) return
    this.refresh()
  },

  onPullDownRefresh: function () {
    this.refresh()
    wx.stopPullDownRefresh()
  },

  refresh: function () {
    var d = store.getData()
    var points = data.allPoints()
    var chapters = data.allChapters()
    var totalPoints = Object.keys(points).length
    var studiedCount = Object.keys(d.studied).length
    var masteredCount = Object.keys(d.loops).filter(function (k) {
      return d.loops[k] && d.loops[k].status === 'mastered'
    }).length

    var allRounds = store.listRounds()
    var totalAnswered = 0
    var totalWrong = 0
    var totalSlow = 0
    var totalTime = 0

    var rounds = allRounds.map(function (r) {
      var answers = r.answers || []
      var correct = answers.filter(function (a) { return a.correct }).length
      var wrong = (r.wrongQuestionIds || []).length
      var slow = (r.slowQuestionIds || []).length
      totalAnswered += answers.length
      totalWrong += wrong
      totalSlow += slow
      totalTime += r.totalMs || 0
      return {
        id: r.id,
        title: r.title || r.chapterTitle || '考评',
        timeText: formatTime(r.startedAt),
        correct: correct,
        total: answers.length,
        wrong: wrong,
        slow: slow,
        durationText: grading.formatDuration(r.totalMs || 0),
        mastered: adaptive.isMastered(r)
      }
    })

    var session = auth.getSession()
    var game = incentives.computeIncentives(d)
    this.setData({
      totalPoints: totalPoints,
      studiedCount: studiedCount,
      studiedPct: pct(studiedCount, totalPoints),
      chapterCount: chapters.length,
      masteredCount: masteredCount,
      masteredPct: pct(masteredCount, chapters.length),
      roundCount: allRounds.length,
      totalAnswered: totalAnswered,
      totalWrong: totalWrong,
      totalSlow: totalSlow,
      totalTimeText: totalTime ? grading.formatDuration(totalTime) : '—',
      rounds: rounds.slice(0, MAX_ROUNDS),
      userLabel: session ? (session.name + ' · ' + auth.maskId(session.id)) : '',
      level: game.level,
      levelName: game.levelName,
      xpTotal: game.xp,
      xpInto: game.xpIntoLevel,
      xpForNext: game.xpForNext,
      xpToNext: game.xpToNext,
      nextLevelName: game.nextLevelName,
      xpPct: game.xpForNext ? Math.round((game.xpIntoLevel / game.xpForNext) * 100) : 0,
      streak: game.streak,
      earnedCount: game.earnedCount,
      badgeTotal: game.badges.length,
      badges: game.badges,
      levels: game.levels
    })
  },

  openReport: function (e) {
    var id = e.currentTarget.dataset.id
    if (!id) return
    wx.navigateTo({ url: '/pkgContent/pages/report/report?id=' + id })
  },

  goExams: function () {
    wx.navigateTo({ url: '/pkgContent/pages/exams/exams' })
  },

  onExport: function () {
    var json = store.exportData()
    wx.setClipboardData({
      data: json,
      success: function () {
        wx.showModal({
          title: '已复制学习数据',
          content: '全部学习数据的 JSON 文本已复制到剪贴板，可粘贴到备忘录或聊天窗口保存备份。',
          showCancel: false,
          confirmText: '知道了'
        })
      },
      fail: function () {
        wx.showToast({ title: '复制失败，请重试', icon: 'none' })
      }
    })
  },

  onReset: function () {
    var that = this
    wx.showModal({
      title: '清空当前用户数据',
      content: '将删除当前用户在本机的全部学习数据：考评记录、掌握进度、课件学习记录。此操作不可撤销，建议先导出备份。',
      confirmText: '确认清空',
      confirmColor: '#dc2626',
      success: function (res) {
        if (!res.confirm) return
        store.resetAll()
        that.refresh()
        wx.showToast({ title: '已清空学习数据', icon: 'none' })
      }
    })
  }
})
