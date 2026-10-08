var auth = require('./lib/auth')

App({
  globalData: {
    session: null
  },

  onLaunch: function () {
    this.globalData.session = auth.getSession()
  },

  onShow: function () {
    // 会话可能在登录页被写入，这里保持同步
    this.globalData.session = auth.getSession()
  }
})
