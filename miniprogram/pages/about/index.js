const { initSubPageHeader, bindGoBack } = require('../../utils/sub-page')

Page({
  data: {
    statusBarHeight: 44,
    headerMinHeight: 140
  },
  onLoad() {
    initSubPageHeader(this)
    bindGoBack(this)
  }
})
