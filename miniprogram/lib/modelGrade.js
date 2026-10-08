/**
 * 非客观题（计算题、应用题）交给模型批改。
 *
 * 有手写照片时以照片为准（视觉模型）；没有照片时按文字判。
 * 未配置 config.apiBase 时直接抛出提示，不会误判为错题。
 */
var config = require('../config')

function gradeOpenQuestion(q, studentAnswer, studentWork, images) {
  var pics = (images || []).slice(0, 4)
  var hasText = (studentAnswer && studentAnswer.trim()) || (studentWork && studentWork.trim())

  if (!hasText && !pics.length) {
    return Promise.resolve({
      correct: false,
      score: 0,
      photoPending: true,
      errorTags: ['未作答'],
      errorReason: '本题未作答。请写出答案或上传手写照片后再提交。'
    })
  }

  if (!config.apiBase) {
    return Promise.reject(new Error('还没有接入批改服务器：请在 miniprogram/config.js 填写 apiBase。当前可先上传照片，在报告页对照解析自行确认。'))
  }

  return new Promise(function (resolve, reject) {
    wx.request({
      url: config.apiBase + '/grade',
      method: 'POST',
      timeout: 60000,
      header: { 'content-type': 'application/json' },
      data: {
        stem: q.stem,
        standardAnswer: q.answer,
        standardSolution: q.solution,
        rubric: q.rubric || [],
        studentAnswer: studentAnswer || '',
        studentWork: studentWork || '',
        images: pics
      },
      success: function (res) {
        var d = res.data || {}
        if (res.statusCode !== 200) {
          reject(new Error(d.error || ('批改失败（' + res.statusCode + '）')))
          return
        }
        if (d.unreadable) {
          resolve({
            correct: false,
            score: 0,
            photoPending: true,
            errorTags: ['手写待确认'],
            errorReason: d.reason || '照片无法辨认，请对照解析确认，确认前不记入错题。'
          })
          return
        }
        if (d.correct) {
          resolve({ correct: true, score: 1, errorTags: [], errorReason: d.reason || '' })
          return
        }
        resolve({
          correct: false,
          score: 0,
          errorTags: ['模型批改'],
          errorReason: d.reason || '模型判定与标准答案不一致。'
        })
      },
      fail: function (err) {
        reject(new Error((err && err.errMsg) || '批改请求失败'))
      }
    })
  })
}

module.exports = { gradeOpenQuestion: gradeOpenQuestion }
