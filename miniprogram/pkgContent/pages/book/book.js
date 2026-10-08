/**
 * 《探究应用新思维·七年级数学》教辅索引页。
 *
 * 上方是讲次目录（bookIndex().units），点某讲后：
 *   - 显示该讲 OCR 正文（unitText(unit.textFile)，white-space: pre-wrap）
 *   - config.bookPageBase 非空时，按 pdfStart..pdfEnd 渲染原页图
 *     （路径 bookPageBase + '/page_XXXX.jpg'，页码四位补零）
 *   - bookPageBase 为空时只给出一句提示，不产生裂图
 */
var auth = require('../../../lib/auth')
var config = require('../../../config')
var content = require('../../content')

var KIND_LABEL = {
  lesson: '讲次',
  explore: '探究专题',
  answers: '参考答案'
}

/** 页码四位补零：8 -> 0008 */
function pad4(n) {
  var s = String(n)
  while (s.length < 4) s = '0' + s
  return s
}

Page({
  data: {
    book: '',
    author: '',
    pdfPages: 0,
    units: [],
    currentId: '',
    hasCurrent: false,
    current: null,
    pageImages: [],
    text: '',
    hasPages: !!config.bookPageBase
  },

  onLoad: function (options) {
    this.pendingUnit = (options && (options.unit || options.id)) || ''

    var index = content.bookIndex() || { units: [] }
    this.offset = index.printedToPdfOffset || 7

    var units = (index.units || []).map(function (u) {
      return {
        id: u.id,
        category: u.category || '',
        no: u.no || '',
        title: u.title || '',
        kind: u.kind || 'lesson',
        kindLabel: KIND_LABEL[u.kind] || '讲次',
        noText: u.no === '探究' || u.no === '-' || !u.no ? '' : (u.no + ' '),
        printedStart: u.printedStart,
        printedEnd: u.printedEnd,
        pdfStart: u.pdfStart,
        pdfEnd: u.pdfEnd,
        textFile: u.textFile || ''
      }
    })

    this.setData({
      book: index.book || '探究应用新思维·七年级数学',
      author: index.author || '',
      pdfPages: index.pdfPages || 0,
      units: units
    })
  },

  onShow: function () {
    var session = auth.requireLogin()
    if (!session) return
    if (this.data.hasCurrent) return

    var units = this.data.units
    if (!units.length) return

    var target = null
    for (var i = 0; i < units.length; i++) {
      if (units[i].id === this.pendingUnit) target = units[i]
    }
    if (!target) target = units[0]
    this.selectUnit(target.id)
  },

  tapUnit: function (e) {
    this.selectUnit(e.currentTarget.dataset.id)
  },

  selectUnit: function (id) {
    var units = this.data.units
    var unit = null
    for (var i = 0; i < units.length; i++) {
      if (units[i].id === id) unit = units[i]
    }
    if (!unit) return

    var images = []
    if (config.bookPageBase) {
      for (var p = unit.pdfStart; p <= unit.pdfEnd; p++) {
        images.push({
          page: p,
          printed: p - this.offset,
          url: config.bookPageBase + '/page_' + pad4(p) + '.jpg'
        })
      }
    }

    var text = content.unitText(unit.textFile)

    this.setData({
      currentId: unit.id,
      hasCurrent: true,
      current: unit,
      pageImages: images,
      text: text || '（本讲暂无 OCR 文本，请对照原书或原页图像阅读。）'
    })

    wx.pageScrollTo({ scrollTop: 0, duration: 0 })
  }
})
