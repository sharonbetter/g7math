var data = require('../../../lib/data')
var store = require('../../../lib/store')
var auth = require('../../../lib/auth')
var content = require('../../content')

Page({
  data: {
    chapters: [],
    readyCount: 0,
    chapterCount: 0
  },

  onShow: function () {
    if (!auth.requireLogin()) return
    this.refresh()
  },

  onPullDownRefresh: function () {
    this.refresh()
    wx.stopPullDownRefresh()
  },

  refresh: function () {
    var d = store.getData()
    var withExam = {}
    content.chapterIdsWithExams().forEach(function (id) { withExam[id] = true })

    var readyCount = 0
    var chapters = data.allChapters().map(function (item) {
      var chapter = item.chapter
      var exam = withExam[chapter.id] ? content.loadExam(chapter.id) : null
      var hasExam = !!(exam && exam.questions && exam.questions.length)
      if (hasExam) readyCount += 1

      var loop = d.loops[chapter.id] || null
      var loopText = '未开始'
      var loopClass = ''
      if (loop && loop.status === 'mastered') {
        loopText = '已掌握'
        loopClass = 'badge-green'
      } else if (loop) {
        loopText = '提升中 · 第 ' + (loop.round || 1) + ' 轮'
        loopClass = 'badge-amber'
      }

      var seconds = exam ? exam.totalEstimatedSeconds || 0 : 0
      return {
        id: chapter.id,
        volumeName: item.volume.name,
        no: chapter.no,
        title: chapter.title,
        pointCount: data.chapterPointIds(chapter).length,
        hasExam: hasExam,
        questionCount: hasExam ? exam.questions.length : 0,
        minutes: Math.max(1, Math.round(seconds / 60)),
        examTitle: exam ? exam.title : '',
        loopText: loopText,
        loopClass: loopClass
      }
    })

    this.setData({ chapters: chapters, readyCount: readyCount, chapterCount: chapters.length })
  },

  openIntro: function (e) {
    var id = e.currentTarget.dataset.id
    if (!id) return
    wx.navigateTo({ url: '/pkgContent/pages/examIntro/examIntro?id=' + id })
  },

  goRemedial: function (e) {
    var ds = e && e.currentTarget ? e.currentTarget.dataset : null
    var id = ds && ds.id ? ds.id : ''
    var url = '/pkgContent/pages/remedial/remedial'
    if (id) url += '?chapter=' + id
    wx.navigateTo({ url: url })
  }
})
