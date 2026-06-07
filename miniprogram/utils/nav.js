function goBackToHome() {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    wx.navigateBack({ delta: 1 })
  } else {
    wx.switchTab({ url: '/pages/home/index' })
  }
}

module.exports = { goBackToHome }
