const { callApi } = require('../../utils/request')
const { initSubPageHeader, bindGoBack } = require('../../utils/sub-page')

Page({
  data: {
    statusBarHeight: 44,
    headerMinHeight: 140,
    disease: null
  },
  onLoad(options) {
    initSubPageHeader(this)
    bindGoBack(this)
    callApi('getDisease', { id: options.id }).then(disease => this.setData({ disease }))
  }
})
