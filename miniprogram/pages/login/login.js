var auth = require('../../lib/auth')
var config = require('../../config')

Page({
  data: {
    name: '',
    busy: false,
    error: '',
    config: config,
    hasServer: !!config.apiBase
  },

  onName: function (e) {
    this.setData({ name: e.detail.value })
  },

  onLogin: function () {
    var that = this
    if (this.data.busy) return
    this.setData({ busy: true, error: '' })
    auth.login(this.data.name).then(function (res) {
      if (!res.ok) {
        that.setData({ busy: false, error: res.message || '登录失败' })
        return
      }
      wx.reLaunch({ url: '/pages/home/home' })
    })
  }
})
