var data = require('../../lib/data')
var store = require('../../lib/store')
var auth = require('../../lib/auth')
var adaptive = require('../../lib/adaptive')
var config = require('../../config')

Page({
  data: {
    totalPoints: 0,
    chapterCount: 0,
    studiedCount: 0,
    studiedPct: 0,
    mastered: 0,
    masteredPct: 0,
    roundCount: 0,
    rounds: [],
    volumes: [],
    userLabel: ''
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
    var chapters = data.allChapters()
    var points = data.allPoints()
    var totalPoints = Object.keys(points).length
    var studiedCount = Object.keys(d.studied).length
    var mastered = Object.keys(d.loops).filter(function (k) { return d.loops[k].status === 'mastered' }).length
    var roundList = store.listRounds()

    var volumes = (data.curriculum.volumes || []).map(function (v) {
      return {
        id: v.id,
        name: v.name,
        chapters: (v.chapters || []).map(function (c) {
          var count = 0
          ;(c.sections || []).forEach(function (s) { count += (s.points || []).length })
          var loop = d.loops[c.id]
          return {
            id: c.id,
            no: c.no,
            title: c.title,
            pointCount: count,
            mastered: !!(loop && loop.status === 'mastered')
          }
        })
      }
    })

    var session = auth.getSession()
    this.setData({
      totalPoints: totalPoints,
      chapterCount: chapters.length,
      studiedCount: studiedCount,
      studiedPct: totalPoints ? Math.round((studiedCount / totalPoints) * 100) : 0,
      mastered: mastered,
      masteredPct: chapters.length ? Math.round((mastered / chapters.length) * 100) : 0,
      roundCount: roundList.length,
      rounds: roundList.slice(0, 4).map(function (r) {
        var answers = r.answers || []
        return {
          id: r.id,
          title: r.title,
          correct: answers.filter(function (a) { return a.correct }).length,
          total: answers.length,
          mastered: adaptive.isMastered(r)
        }
      }),
      volumes: volumes,
      userLabel: session ? (session.name + ' · ' + auth.maskId(session.id)) : ''
    })
  },

  goCurriculum: function () {
    wx.navigateTo({ url: '/pkgContent/pages/curriculum/curriculum' })
  },

  goExams: function () {
    wx.navigateTo({ url: '/pkgContent/pages/exams/exams' })
  },

  goRemedial: function () {
    wx.navigateTo({ url: '/pkgContent/pages/remedial/remedial' })
  },

  openChapter: function (e) {
    wx.navigateTo({ url: '/pkgContent/pages/chapter/chapter?id=' + e.currentTarget.dataset.id })
  },

  openReport: function (e) {
    wx.navigateTo({ url: '/pkgContent/pages/report/report?id=' + e.currentTarget.dataset.id })
  },

  onLogout: function () {
    var that = this
    wx.showModal({
      title: '退出登录',
      content: '退出后学习记录仍保留，下次用同一身份登录还能看到。',
      success: function (res) {
        if (!res.confirm) return
        auth.logout()
        wx.reLaunch({ url: '/pages/login/login' })
        that.setData({})
      }
    })
  }
})
