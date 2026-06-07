const { callApi } = require('../../utils/request')
const { goBackToHome } = require('../../utils/nav')

const TYPES = [
  { label: '经验分享', value: 'experience' },
  { label: '病害求助', value: 'help' },
  { label: '科普', value: 'science' },
  { label: '一般讨论', value: 'discussion' }
]

Page({
  data: {
    statusBarHeight: 44,
    headerMinHeight: 140,
    title: '',
    content: '',
    postType: 'experience',
    canSubmit: false,
    types: TYPES
  },
  onLoad() {
    const sys = wx.getSystemInfoSync()
    const statusBarHeight = sys.statusBarHeight || 44
    this.setData({
      statusBarHeight,
      headerMinHeight: statusBarHeight + 96
    })
  },
  goBack() {
    goBackToHome()
  },
  updateCanSubmit(title, content) {
    this.setData({ canSubmit: !!(String(title).trim() && String(content).trim()) })
  },
  onTitleInput(e) {
    const title = e.detail.value
    this.setData({ title })
    this.updateCanSubmit(title, this.data.content)
  },
  onContentInput(e) {
    const content = e.detail.value
    this.setData({ content })
    this.updateCanSubmit(this.data.title, content)
  },
  onTypeSelect(e) {
    this.setData({ postType: e.currentTarget.dataset.value })
  },
  async submit() {
    const title = this.data.title.trim()
    const content = this.data.content.trim()
    if (!title || !content) {
      wx.showToast({ title: '请完善帖子标题和内容', icon: 'none' })
      return
    }
    await callApi('createPost', {
      title,
      content,
      postType: this.data.postType
    })
    wx.showToast({ title: '已提交审核' })
    setTimeout(() => wx.navigateBack(), 1500)
  }
})
