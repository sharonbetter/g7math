/**
 * 章节页：按 sections 列出该章全部知识点。
 * 页面参数：?id=章节id（与 examIntro / exams 页一致）。
 * 有课件时点知识点进 lesson 页；底部按钮进章节考评（examIntro）。
 */
var data = require('../../../lib/data')
var store = require('../../../lib/store')
var auth = require('../../../lib/auth')
var content = require('../../content')

Page({
  data: {
    chapterId: '',
    found: true,
    chapter: null,
    sections: [],
    total: 0,
    done: 0,
    pct: 0,
    hasLesson: false,
    hasExam: false,
    mastered: false,
    loopLabel: ''
  },

  onLoad: function (options) {
    var id = (options && (options.id || options.chapter)) || ''
    this.setData({ chapterId: id })
  },

  onShow: function () {
    var session = auth.requireLogin()
    if (!session) return
    this.refresh()
  },

  refresh: function () {
    var chapter = data.findChapter(this.data.chapterId)
    if (!chapter) {
      this.setData({ found: false, chapter: null, sections: [] })
      return
    }

    var d = store.getData()
    var hasLesson = content.chapterIdsWithLessons().indexOf(chapter.id) >= 0
    var hasExam = content.chapterIdsWithExams().indexOf(chapter.id) >= 0
    var total = 0
    var done = 0

    var sections = (chapter.sections || []).map(function (s) {
      var points = (s.points || []).map(function (p) {
        total += 1
        var studied = !!d.studied[p.id]
        if (studied) done += 1
        return {
          id: p.id,
          no: p.no || '',
          name: p.name,
          summary: p.summary || '',
          estimatedMinutes: p.estimatedMinutes,
          studied: studied,
          refText: (p.bookRefs || []).join('、')
        }
      })
      return { id: s.id, no: s.no, title: s.title, points: points }
    })

    var loop = d.loops[chapter.id]
    var mastered = !!(loop && loop.status === 'mastered')

    this.setData({
      found: true,
      chapter: { id: chapter.id, no: chapter.no, title: chapter.title },
      sections: sections,
      total: total,
      done: done,
      pct: total ? Math.round((done / total) * 100) : 0,
      hasLesson: hasLesson,
      hasExam: hasExam,
      mastered: mastered,
      loopLabel: loop && !mastered ? ('提升中 · 第 ' + loop.round + ' 轮') : ''
    })
  },

  goLesson: function (e) {
    if (!this.data.hasLesson) {
      wx.showToast({ title: '该章课件正在生成中', icon: 'none' })
      return
    }
    wx.navigateTo({ url: '/pkgContent/pages/lesson/lesson?point=' + e.currentTarget.dataset.id })
  },

  goExam: function () {
    wx.navigateTo({ url: '/pkgContent/pages/examIntro/examIntro?id=' + this.data.chapterId })
  }
})
