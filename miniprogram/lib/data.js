/**
 * 课程大纲访问（主包）。课件、考评卷在内容分包 pkgContent/content.js。
 */
var curriculum = require('../data/curriculum')

function allChapters() {
  var out = []
  ;(curriculum.volumes || []).forEach(function (v) {
    ;(v.chapters || []).forEach(function (c) {
      out.push({ volume: v, chapter: c })
    })
  })
  return out
}

function findChapter(chapterId) {
  var list = allChapters()
  for (var i = 0; i < list.length; i++) {
    if (list[i].chapter.id === chapterId) return list[i].chapter
  }
  return null
}

function allPoints() {
  var map = {}
  ;(curriculum.volumes || []).forEach(function (v) {
    ;(v.chapters || []).forEach(function (c) {
      ;(c.sections || []).forEach(function (s) {
        ;(s.points || []).forEach(function (p) { map[p.id] = p })
      })
    })
  })
  return map
}

function findPoint(pointId) {
  return allPoints()[pointId] || null
}

function pointMapOf(chapter) {
  var map = {}
  ;(chapter.sections || []).forEach(function (s) {
    ;(s.points || []).forEach(function (p) { map[p.id] = p })
  })
  return map
}

function chapterPointIds(chapter) {
  var out = []
  ;(chapter.sections || []).forEach(function (s) {
    ;(s.points || []).forEach(function (p) { out.push(p.id) })
  })
  return out
}

/** 某知识点所在章节，用于从课件页返回 */
function chapterOfPoint(pointId) {
  var list = allChapters()
  for (var i = 0; i < list.length; i++) {
    var ids = chapterPointIds(list[i].chapter)
    if (ids.indexOf(pointId) >= 0) return list[i].chapter
  }
  return null
}

module.exports = {
  curriculum: curriculum,
  allChapters: allChapters,
  findChapter: findChapter,
  allPoints: allPoints,
  findPoint: findPoint,
  pointMapOf: pointMapOf,
  chapterPointIds: chapterPointIds,
  chapterOfPoint: chapterOfPoint
}
