/**
 * 计时引擎（小程序版）。
 *
 * 选择题：开始 = 上一题结束（第一题 = 考评开始）；结束 = 选定并提交该题。
 * 填空/计算/应用题：开始 = 上一题结束；结束 = 提交成功。
 */
function nextStartedAt(records, sessionStart) {
  if (!records.length) return sessionStart
  return records[records.length - 1].submittedAt
}

function buildTimings(records, questions) {
  return records.map(function (r, idx) {
    var q = questions[r.questionId]
    var est = (q && q.estimatedSeconds) || 0
    return {
      index: idx + 1,
      questionId: r.questionId,
      type: r.type,
      startedAt: r.startedAt,
      submittedAt: r.submittedAt,
      durationMs: r.durationMs,
      firstPickMs: r.firstPickMs,
      revisitMs: r.revisitMs,
      estimatedSeconds: est,
      gapMs: r.durationMs - est * 1000
    }
  })
}

function nowMs() {
  return Date.now()
}

function formatClock(ts) {
  var d = new Date(ts)
  function pad(n) { return n < 10 ? '0' + n : String(n) }
  return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds())
}

module.exports = {
  nextStartedAt: nextStartedAt,
  buildTimings: buildTimings,
  nowMs: nowMs,
  formatClock: formatClock
}
