/**
 * 课程中心：按册（volumes）列出全部章节。
 * 每章显示知识点数、是否有课件 / 考评、是否已掌握与课件进度。
 * 点章节进 chapter 页，点「章节考评」进 examIntro 页。
 */
var data = require('../../../lib/data')
var store = require('../../../lib/store')
var auth = require('../../../lib/auth')
var content = require('../../content')

Page({
  data: {
    totalChapters: 0,
    totalPoints: 0,
    studiedCount: 0,
    masteredCount: 0,
    volumes: []
  },

  onShow: function () {
    var session = auth.requireLogin()
    if (!session) return
    this.refresh()
  },

  refresh: function () {
    var d = store.getData()
    var lessonIds = content.chapterIdsWithLessons()
    var examIds = content.chapterIdsWithExams()

    var totalChapters = 0
    var totalPoints = 0
    var masteredCount = 0

    var volumes = (data.curriculum.volumes || []).map(function (v) {
      var chapters = (v.chapters || []).map(function (c) {
        var ids = data.chapterPointIds(c)
        var done = ids.filter(function (id) { return !!d.studied[id] }).length
        var loop = d.loops[c.id]
        var mastered = !!(loop && loop.status === 'mastered')
        totalChapters += 1
        totalPoints += ids.length
        if (mastered) masteredCount += 1
        return {
          id: c.id,
          no: c.no,
          title: c.title,
          pointCount: ids.length,
          done: done,
          pct: ids.length ? Math.round((done / ids.length) * 100) : 0,
          hasLesson: lessonIds.indexOf(c.id) >= 0,
          hasExam: examIds.indexOf(c.id) >= 0,
          mastered: mastered,
          loopLabel: loop && !mastered ? ('第 ' + loop.round + ' 轮提升中') : ''
        }
      })
      return { id: v.id, name: v.name, chapters: chapters }
    })

    this.setData({
      totalChapters: totalChapters,
      totalPoints: totalPoints,
      studiedCount: Object.keys(d.studied).length,
      masteredCount: masteredCount,
      volumes: volumes
    })
  },

  openChapter: function (e) {
    wx.navigateTo({ url: '/pkgContent/pages/chapter/chapter?id=' + e.currentTarget.dataset.id })
  },

  openExam: function (e) {
    wx.navigateTo({ url: '/pkgContent/pages/examIntro/examIntro?id=' + e.currentTarget.dataset.id })
  },

  openBook: function () {
    wx.navigateTo({ url: '/pkgContent/pages/book/book' })
  }
})
