const { callApi } = require('../../utils/request')
const { initSubPageHeader, bindGoBack } = require('../../utils/sub-page')

Page({
  data: {
    statusBarHeight: 44,
    headerMinHeight: 140,
    disease: null,
    diseaseId: ''
  },
  onLoad(options) {
    initSubPageHeader(this)
    bindGoBack(this)
    const diseaseId = options.id || ''
    this.setData({ diseaseId })
    this.load(diseaseId)
  },
  async load(id) {
    if (!id) return
    try {
      const disease = await callApi('getDisease', { id })
      this.setData({ disease })
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },
  async toggleFavorite() {
    const id = this.data.diseaseId
    if (!id) return
    await callApi('toggleFavorite', { targetType: 'disease', targetId: id })
    this.load(id)
  }
})
