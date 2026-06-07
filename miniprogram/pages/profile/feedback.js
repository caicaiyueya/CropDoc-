const { callApi } = require('../../utils/request')
const { initSubPageHeader, bindGoBack } = require('../../utils/sub-page')

Page({
  data: {
    statusBarHeight: 44,
    headerMinHeight: 140,
    content: '',
    contact: '',
    canSubmit: false
  },
  onLoad() {
    initSubPageHeader(this)
    bindGoBack(this)
  },
  onInput(e) {
    const content = e.detail.value
    this.setData({ content, canSubmit: !!content.trim() })
  },
  onContactInput(e) {
    this.setData({ contact: e.detail.value })
  },
  async submit() {
    if (!this.data.content.trim()) {
      wx.showToast({ title: '请填写反馈内容', icon: 'none' })
      return
    }
    await callApi('feedback', this.data)
    wx.showToast({ title: '感谢反馈' })
    setTimeout(() => wx.navigateBack(), 1500)
  }
})
