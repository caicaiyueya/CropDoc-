const { goBackToHome } = require('./nav')

function initSubPageHeader(page) {
  const sys = wx.getSystemInfoSync()
  const statusBarHeight = sys.statusBarHeight || 44
  page.setData({
    statusBarHeight,
    headerMinHeight: statusBarHeight + 96
  })
}

function bindGoBack(page) {
  page.goBack = function goBack() {
    goBackToHome()
  }
}

module.exports = { initSubPageHeader, bindGoBack }
