/**
 * 内容分包的数据访问：课件、考评卷、教辅索引与讲次正文。
 * 只能被分包内的页面引用（主包不能 require 分包文件）。
 */
var lessons = require('./data/lessons')
var exams = require('./data/exams')
var book = require('./data/book')
var units = require('./data/units')

function chapterIdsWithLessons() {
  return Object.keys(lessons).sort()
}

function chapterIdsWithExams() {
  return Object.keys(exams).sort()
}

function loadLessonFile(chapterId) {
  return lessons[chapterId] || null
}

function loadExam(chapterId) {
  return exams[chapterId] || null
}

/** 全部考评卷，按 exam.id 索引，用于跨章专项强化 */
function loadAllExams() {
  var map = {}
  Object.keys(exams).forEach(function (k) {
    if (exams[k] && exams[k].id) map[exams[k].id] = exams[k]
  })
  return map
}

function findLesson(lessonFile, pointId) {
  if (!lessonFile) return null
  var list = lessonFile.lessons || []
  for (var i = 0; i < list.length; i++) {
    if (list[i].pointId === pointId) return list[i]
  }
  return null
}

function bookIndex() {
  return book.index
}

function bookMapping() {
  return book.mapping
}

/**
 * 取讲次正文。index.json 里的 textFile 形如 'units/代数-1-数形结合话数轴.txt'，
 * 而 units.js 的键是没有目录和扩展名的讲次名，这里做一次归一化。
 */
function unitText(textFile) {
  if (!textFile) return ''
  var key = String(textFile)
    .replace(/^.*\//, '')
    .replace(/\.txt$/, '')
  return units[key] || ''
}

module.exports = {
  chapterIdsWithLessons: chapterIdsWithLessons,
  chapterIdsWithExams: chapterIdsWithExams,
  loadLessonFile: loadLessonFile,
  loadExam: loadExam,
  loadAllExams: loadAllExams,
  findLesson: findLesson,
  bookIndex: bookIndex,
  bookMapping: bookMapping,
  unitText: unitText
}
