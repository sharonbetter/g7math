/**
 * 错因分析与专项练习组卷（小程序版，与 app/src/lib/adaptive.ts 一致）。
 */
var grading = require('./grading')

/** 汇总一轮考评中的问题题目（做错 或 耗时异常） */
function analyzeRound(round, points, lessons) {
  var byId = {}
  round.exam.questions.forEach(function (q) { byId[q.id] = q })
  var out = []
  for (var i = 0; i < round.answers.length; i++) {
    var r = round.answers[i]
    var q = byId[r.questionId]
    if (!q) continue
    if (r.photoReview === 'pending') continue
    var slow = grading.isSlow(r.durationMs, q.estimatedSeconds)
    var gapMs = r.durationMs - q.estimatedSeconds * 1000
    if (r.correct && !slow) continue
    var pts = (q.pointIds || []).map(function (id) { return points[id] }).filter(Boolean)
    var les = (q.pointIds || []).map(function (id) { return lessons[id] }).filter(Boolean)
    out.push({
      record: r,
      question: q,
      points: pts,
      lessons: les,
      reason: r.errorReason || (slow ? '本题用时明显超出预计，说明相关方法还不够熟练。' : ''),
      tags: r.errorTags || [],
      slow: slow,
      gapMs: gapMs
    })
  }
  out.sort(function (a, b) {
    if (a.record.correct !== b.record.correct) return a.record.correct ? 1 : -1
    return b.gapMs - a.gapMs
  })
  return out
}

function weakPointsOf(round, points) {
  return (round.weakPointIds || []).map(function (id) { return points[id] }).filter(Boolean)
}

var seq = 0

function variantToQuestion(parent, v, sourceTag, index) {
  seq += 1
  return {
    id: parent.id + '-p' + (sourceTag === 'repeat' ? 'r' : 'v') + index + '-' + seq,
    type: parent.type,
    difficulty: Math.min(5, parent.difficulty + (sourceTag === 'variant' ? 1 : 0)),
    estimatedSeconds: v.estimatedSeconds == null ? parent.estimatedSeconds : v.estimatedSeconds,
    pointIds: parent.pointIds.slice(),
    stem: v.stem,
    options: v.options,
    answer: v.answer,
    solution: v.solution,
    rubric: parent.rubric,
    errorTags: parent.errorTags,
    commonWrong: [],
    source: { kind: 'original' }
  }
}

/**
 * 依据一轮考评的错题与超时题生成专项练习卷：
 * 1) 问题题目的变式；2) 同知识点其他题目的变式；3) 跨章同知识点变式；4) 仍不足则重做原题。
 */
function buildPracticeExam(round, allExams, opts) {
  opts = opts || {}
  var maxSeconds = opts.maxSeconds == null ? 1500 : opts.maxSeconds
  var target = {}
  ;(round.wrongQuestionIds || []).concat(round.slowQuestionIds || []).forEach(function (id) { target[id] = true })
  var questions = round.exam.questions
  var byId = {}
  questions.forEach(function (q) { byId[q.id] = q })
  var origin = {}
  var picked = []
  var usedStems = {}

  function push(q, label) {
    if (usedStems[q.stem]) return
    usedStems[q.stem] = true
    picked.push(q)
    origin[q.id] = label
  }

  Object.keys(target).forEach(function (qid) {
    var q = byId[qid]
    if (!q) return
    ;(q.variants || []).forEach(function (v, i) {
      push(variantToQuestion(q, v, 'variant', i + 1), '错题/超时题变式（原题 ' + q.id + '）')
    })
  })

  var weakPoints = {}
  ;(round.weakPointIds || []).forEach(function (p) { weakPoints[p] = true })
  questions.forEach(function (q) {
    if (target[q.id]) return
    var hit = (q.pointIds || []).some(function (p) { return weakPoints[p] })
    if (!hit) return
    ;(q.variants || []).forEach(function (v, i) {
      push(variantToQuestion(q, v, 'variant', i + 1), '同知识点强化（原题 ' + q.id + '）')
    })
  })

  var otherExams = []
  Object.keys(allExams).forEach(function (k) {
    if (k !== round.exam.id) otherExams.push(allExams[k])
  })
  otherExams.forEach(function (ex) {
    ;(ex.questions || []).forEach(function (q) {
      var hit = (q.pointIds || []).some(function (p) { return weakPoints[p] })
      if (!hit) return
      ;(q.variants || []).forEach(function (v, i) {
        push(variantToQuestion(q, v, 'variant', i + 1), '跨章强化：' + ex.chapterTitle + '（原题 ' + q.id + '）')
      })
    })
  })

  if (picked.length < 6) {
    Object.keys(target).forEach(function (qid) {
      var q = byId[qid]
      if (!q) return
      var copy = {}
      for (var k in q) copy[k] = q[k]
      copy.id = q.id + '-repeat-' + (++seq)
      copy.commonWrong = []
      push(copy, '重做原题（' + q.id + '）')
    })
  }

  picked.sort(function (a, b) {
    return a.difficulty - b.difficulty || a.estimatedSeconds - b.estimatedSeconds
  })
  var limited = []
  var total = 0
  for (var i = 0; i < picked.length; i++) {
    var q = picked[i]
    if (limited.length >= 4 && total + q.estimatedSeconds > maxSeconds) continue
    limited.push(q)
    total += q.estimatedSeconds
    if (total >= maxSeconds && limited.length >= 6) break
  }
  var finalQuestions = limited.length ? limited : picked.slice(0, 8)

  var order = ['choice', 'fill', 'calc', 'applied']
  var labels = {
    choice: '一、选择题（每题只有一个正确选项）',
    fill: '二、填空题',
    calc: '三、计算题（写出必要的计算过程）',
    applied: '四、应用题（写出必要的解答过程）'
  }
  var sections = []
  order.forEach(function (t) {
    var ids = finalQuestions.filter(function (q) { return q.type === t }).map(function (q) { return q.id })
    if (ids.length) sections.push({ id: t, title: labels[t], type: t, questionIds: ids })
  })

  var totalSeconds = finalQuestions.reduce(function (s, q) { return s + q.estimatedSeconds }, 0)
  return {
    exam: {
      id: round.exam.id + '-practice-r' + (round.round + 1),
      chapterId: round.chapterId,
      chapterTitle: round.chapterTitle,
      title: round.chapterTitle + ' · 第 ' + (round.round + 1) + ' 轮专项练习',
      totalEstimatedSeconds: totalSeconds,
      sections: sections,
      questions: finalQuestions
    },
    origin: origin
  }
}

/** 循环状态推进：专项练习全对且无超时 → 掌握 */
function isMastered(round) {
  return (round.wrongQuestionIds || []).length === 0 && (round.slowQuestionIds || []).length === 0
}

module.exports = {
  analyzeRound: analyzeRound,
  weakPointsOf: weakPointsOf,
  buildPracticeExam: buildPracticeExam,
  isMastered: isMastered
}
