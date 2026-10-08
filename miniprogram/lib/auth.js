/**
 * 用户与会话。
 *
 * 首选微信 openid 作为唯一用户标识：wx.login 拿到 code，交给自己的服务器
 * 调 jscode2session 换取 openid（AppID 和 secret 只能放在服务器，不能进小程序）。
 *
 * 现在还没有服务器，config.apiBase 为空时会退回一个本机生成的稳定 id，
 * 页面功能不受影响，只是换设备不通用。服务器就绪后把 apiBase 填上即可切换。
 */
var config = require('../config')

var USERS_KEY = 'g7math.users.v1'
var SESSION_KEY = 'g7math.session.v1'
var LOCAL_ID_KEY = 'g7math.localId.v1'

var listeners = []
var session = null

function safeGet(key, fallback) {
  try {
    var v = wx.getStorageSync(key)
    return v === '' || v == null ? fallback : v
  } catch (e) {
    return fallback
  }
}

function safeSet(key, value) {
  try {
    wx.setStorageSync(key, value)
    return true
  } catch (e) {
    console.error('写入本地存储失败', e)
    return false
  }
}

function readUsers() {
  return safeGet(USERS_KEY, {}) || {}
}

function readSession() {
  var s = safeGet(SESSION_KEY, null)
  return s && s.id ? s : null
}

function notify() {
  listeners.forEach(function (fn) {
    try {
      fn(session)
    } catch (e) {
      console.error(e)
    }
  })
}

function subscribe(fn) {
  listeners.push(fn)
  return function () {
    listeners = listeners.filter(function (f) { return f !== fn })
  }
}

function randomId() {
  return 'local-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10)
}

/** 本机稳定 id：同一台设备同一微信用户反复进入保持不变 */
function localId() {
  var id = safeGet(LOCAL_ID_KEY, '')
  if (!id) {
    id = randomId()
    safeSet(LOCAL_ID_KEY, id)
  }
  return id
}

function wxLogin() {
  return new Promise(function (resolve, reject) {
    if (!wx.login) return reject(new Error('当前环境不支持微信登录'))
    wx.login({
      success: function (res) {
        if (res && res.code) resolve(res.code)
        else reject(new Error('微信登录未返回 code'))
      },
      fail: function (err) { reject(new Error((err && err.errMsg) || '微信登录失败')) }
    })
  })
}

function requestOpenid(code) {
  return new Promise(function (resolve, reject) {
    wx.request({
      url: config.apiBase + '/login',
      method: 'POST',
      header: { 'content-type': 'application/json' },
      data: { code: code },
      success: function (res) {
        var openid = res && res.data && res.data.openid
        if (res.statusCode === 200 && openid) resolve(openid)
        else reject(new Error('服务器未返回 openid'))
      },
      fail: function (err) { reject(new Error((err && err.errMsg) || '登录请求失败')) }
    })
  })
}

/**
 * 登录。有服务器时用 openid，没有服务器时用本机 id。
 * 返回 { ok, user, message, kind }
 */
function login(displayName) {
  var name = (displayName || '').trim()

  function finish(id, kind) {
    var users = readUsers()
    var users2 = {}
    for (var k in users) users2[k] = users[k]
    var existing = users2[id]
    var user = existing
      ? { id: id, kind: kind, name: name || existing.name, createdAt: existing.createdAt }
      : { id: id, kind: kind, name: name || '微信用户', createdAt: Date.now() }
    users2[id] = user
    safeSet(USERS_KEY, users2)
    safeSet(SESSION_KEY, user)
    session = user
    notify()
    return { ok: true, user: user, kind: kind }
  }

  if (!config.apiBase) {
    return Promise.resolve(finish(localId(), 'local'))
  }

  return wxLogin()
    .then(function (code) { return requestOpenid(code) })
    .then(function (openid) { return finish('wx-' + openid, 'openid') })
    .catch(function (err) {
      return { ok: false, message: err.message || '登录失败，请重试' }
    })
}

function logout() {
  try {
    wx.removeStorageSync(SESSION_KEY)
  } catch (e) {
    /* 忽略 */
  }
  session = null
  notify()
}

function getSession() {
  if (!session) session = readSession()
  return session
}

function requireLogin() {
  var s = getSession()
  if (!s) {
    wx.reLaunch({ url: '/pages/login/login' })
    return null
  }
  return s
}

function maskId(id) {
  if (!id) return ''
  var s = String(id)
  if (s.indexOf('wx-') === 0) return '微信用户 ' + s.slice(3, 9)
  return '本机用户 ' + s.slice(-6)
}

module.exports = {
  login: login,
  logout: logout,
  getSession: getSession,
  requireLogin: requireLogin,
  subscribe: subscribe,
  maskId: maskId
}
