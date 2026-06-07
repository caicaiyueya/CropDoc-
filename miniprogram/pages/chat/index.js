const { setTabSelected } = require('../../utils/tab-bar')

Page({
  onLoad(options) {
    if (options.detectId) {
      getApp().globalData.pendingDetectId = options.detectId
    }
    wx.switchTab({ url: '/pages/diagnose/index' })
  },
  onShow() {
    setTabSelected('/pages/diagnose/index')
  }
})
