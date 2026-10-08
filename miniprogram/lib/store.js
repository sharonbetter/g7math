/**
 * 学习数据存储。每个用户（openid 或本机 id）一份，互不影响。
 */
var auth = require('./auth')

var LAST_ERROR = ''

function empty() {
  return { rounds: {}, loops: {}, studied: {} }
}

function dataKey(userId) {
  return 'g7math.user.' + userId + '.v1'
}

var cache = null
var cacheUser = null
var listeners = []

function normalize(parsed) {
  if (!parsed || typeof parsed !== 'object') return empty()
  return {
    rounds: parsed.rounds || {},
    loops: parsed.loops || {},
    studied: parsed.studied || {}
  }
}

function currentUserId() {
  var s = auth.getSession()
  return s ? s.id : null
}

function load() {
  var uid = currentUserId()
  if (!uid) {
    cache = empty()
    cacheUser = null
    return cache
  }
  if (cache && cacheUser === uid) return cache
  var raw = null
  try {
    raw = wx.getStorageSync(dataKey(uid))
  } catch (e) {
    raw = null
  }
  cache = normalize(raw)
  cacheUser = uid
  return cache
}

function getData() {
  return load()
}

function notify() {
  listeners.forEach(function (fn) {
    try { fn(cache) } catch (e) { console.error(e) }
  })
}

function subscribe(fn) {
  listeners.push(fn)
  return function () {
    listeners = listeners.filter(function (f) { return f !== fn })
  }
}

function persist() {
  var uid = currentUserId()
  if (!uid) return
  try {
    wx.setStorageSync(dataKey(uid), cache)
    LAST_ERROR = ''
  } catch (e) {
    LAST_ERROR = '本地存储写入失败，可能是照片占用过多空间。请在「学习报告」里导出备份后清理。'
    console.error('保存学习数据失败', e)
  }
  notify()
}

function saveRound(round) {
  load()
  var rounds = {}
  for (var k in cache.rounds) rounds[k] = cache.rounds[k]
  rounds[round.id] = round
  cache = { rounds: rounds, loops: cache.loops, studied: cache.studied }
  persist()
}

function updateLoop(loop) {
  load()
  var loops = {}
  for (var k in cache.loops) loops[k] = cache.loops[k]
  loops[loop.chapterId] = loop
  cache = { rounds: cache.rounds, loops: loops, studied: cache.studied }
  persist()
}

function markStudied(pointId) {
  load()
  if (cache.studied[pointId]) return
  var studied = {}
  for (var k in cache.studied) studied[k] = cache.studied[k]
  studied[pointId] = Date.now()
  cache = { rounds: cache.rounds, loops: cache.loops, studied: studied }
  persist()
}

function resetAll() {
  cache = empty()
  persist()
}

function exportData() {
  return JSON.stringify(load(), null, 2)
}

function importData(json) {
  try {
    cache = normalize(JSON.parse(json))
    persist()
    return true
  } catch (e) {
    return false
  }
}

function lastError() {
  return LAST_ERROR
}

/** 按开始时间倒序列出所有作答轮次 */
function listRounds() {
  var d = load()
  return Object.keys(d.rounds)
    .map(function (k) { return d.rounds[k] })
    .sort(function (a, b) { return b.startedAt - a.startedAt })
}

function makeId(prefix) {
  return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7)
}

/** 切换用户后清掉内存缓存，避免串数据 */
auth.subscribe(function () {
  cache = null
  cacheUser = null
})

module.exports = {
  getData: getData,
  subscribe: subscribe,
  saveRound: saveRound,
  updateLoop: updateLoop,
  markStudied: markStudied,
  resetAll: resetAll,
  exportData: exportData,
  importData: importData,
  listRounds: listRounds,
  makeId: makeId,
  lastError: lastError
}
