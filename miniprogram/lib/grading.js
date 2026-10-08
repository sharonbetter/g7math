/**
 * 判分与错因（小程序版，与 app/src/lib/grading.ts 一致）。
 */
var answers = require('./answers')

var SLOW_THRESHOLD_MS = 60000

/** 单题批改。hasPhoto 为真时，文字框为空或不匹配都不单独判错。 */
function gradeQuestion(q, rawAnswer, hasPhoto) {
  var user = rawAnswer == null ? '' : String(rawAnswer)
  if (!user.trim() && !hasPhoto) {
    return {
      correct: false,
      score: 0,
      errorTags: ['未作答'],
      errorReason: '本题未作答，未能得分。请对照解析补做一遍，再进入专项练习。'
    }
  }

  var correct = false
  if (user.trim()) {
    correct = q.type === 'choice'
      ? answers.normalizeChoice(user) === answers.normalizeChoice(q.answer)
      : answers.answersMatch(user, q.answer, q.acceptedAnswers)
  }

  if (correct) return { correct: true, score: 1, errorTags: [], errorReason: '' }

  if (hasPhoto) {
    return {
      correct: false,
      score: 0,
      photoPending: true,
      errorTags: ['手写待确认'],
      errorReason: '已上传手写照片，批改以照片为准，不单独采用文字框。请在报告页对照解析确认手写答案。确认前不记入错题。'
    }
  }

  var wrong = null
  var commonWrong = q.commonWrong || []
  for (var i = 0; i < commonWrong.length; i++) {
    var cw = commonWrong[i]
    var hit = q.type === 'choice'
      ? answers.normalizeChoice(cw.answer) === answers.normalizeChoice(user)
      : answers.answersMatch(user, cw.answer)
    if (hit) {
      wrong = cw
      break
    }
  }
  var tags = wrong ? mergeTags(q.errorTags || [], ['典型错误']) : (q.errorTags || ['计算失误'])
  return {
    correct: false,
    score: 0,
    errorTags: tags,
    errorReason: wrong ? wrong.reason : buildGenericReason(q, user)
  }
}

function mergeTags(a, b) {
  var out = a.slice()
  for (var i = 0; i < b.length; i++) {
    if (out.indexOf(b[i]) < 0) out.push(b[i])
  }
  return out
}

function buildGenericReason(q, user) {
  var tags = q.errorTags || []
  var head = tags.length ? '可能的错因：' + tags.join('、') + '。' : ''
  var kind = q.type === 'choice' ? '选项' : '答案'
  return head + '你的' + kind + '是「' + answers.toHalfWidth(user).trim() + '」，与标准答案不一致。请对照解析逐步检查：先看题意理解是否正确，再看关键步骤的符号、运算与条件是否遗漏。'
}

/** 步骤分：按 rubric 自评结果折算 */
function scoreWithRubric(base, selfRubric) {
  if (base.correct) return base
  if (!selfRubric || selfRubric.length === 0) return base
  var hit = selfRubric.filter(Boolean).length
  var ratio = hit / selfRubric.length
  var out = {}
  for (var k in base) out[k] = base[k]
  out.score = Math.round(ratio * 0.8 * 100) / 100
  out.errorReason = ratio > 0
    ? base.errorReason + ' 步骤要点自查命中 ' + hit + '/' + selfRubric.length + '，给予部分分。'
    : base.errorReason
  return out
}

/** 是否标记为“耗时异常”：实际耗时 − 预计耗时 > 1 分钟 */
function isSlow(actualMs, estimatedSeconds) {
  return actualMs - estimatedSeconds * 1000 > SLOW_THRESHOLD_MS
}

function durationGapMs(actualMs, estimatedSeconds) {
  return actualMs - estimatedSeconds * 1000
}

function formatDuration(ms) {
  if (ms == null) return '—'
  var total = Math.max(0, Math.round(ms / 1000))
  var m = Math.floor(total / 60)
  var s = total % 60
  if (m === 0) return s + ' 秒'
  return m + ' 分 ' + (s < 10 ? '0' + s : String(s)) + ' 秒'
}

function formatGap(ms) {
  var sign = ms > 0 ? '+' : ms < 0 ? '−' : '±'
  return sign + formatDuration(Math.abs(ms))
}

function summarizeRecords(records, questions) {
  var wrong = []
  var slow = []
  var weak = {}
  for (var i = 0; i < records.length; i++) {
    var r = records[i]
    var q = questions[r.questionId]
    if (r.photoReview === 'pending') continue
    if (!r.correct) {
      wrong.push(r.questionId)
      var ids = (q && q.pointIds) || []
      for (var a = 0; a < ids.length; a++) weak[ids[a]] = true
    }
    if (q && isSlow(r.durationMs, q.estimatedSeconds)) {
      slow.push(r.questionId)
      var ids2 = q.pointIds || []
      for (var b = 0; b < ids2.length; b++) weak[ids2[b]] = true
    }
  }
  return { wrongQuestionIds: wrong, slowQuestionIds: slow, weakPointIds: Object.keys(weak) }
}

var TYPE_LABEL = { choice: '选择题', fill: '填空题', calc: '计算题', applied: '应用题' }
var DIFFICULTY_LABEL = { 1: '基础', 2: '较易', 3: '中等', 4: '较难', 5: '探究' }

module.exports = {
  SLOW_THRESHOLD_MS: SLOW_THRESHOLD_MS,
  gradeQuestion: gradeQuestion,
  scoreWithRubric: scoreWithRubric,
  isSlow: isSlow,
  durationGapMs: durationGapMs,
  formatDuration: formatDuration,
  formatGap: formatGap,
  summarizeRecords: summarizeRecords,
  TYPE_LABEL: TYPE_LABEL,
  DIFFICULTY_LABEL: DIFFICULTY_LABEL
}
