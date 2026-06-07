const { callApi } = require('../../utils/request')
const { setTabSelected } = require('../../utils/tab-bar')
const { goBackToHome } = require('../../utils/nav')
const { toSummary } = require('../../utils/post-content')

Page({
  data: {
    statusBarHeight: 44,
    headerMinHeight: 140,
    posts: []
  },
  onLoad() {
    const sys = wx.getSystemInfoSync()
    const statusBarHeight = sys.statusBarHeight || 44
    this.setData({
      statusBarHeight,
      headerMinHeight: statusBarHeight + 96
    })
  },
  onShow() {
    setTabSelected('/pages/community/index')
    this.load()
  },
  goBack() {
    goBackToHome()
  },
  async load() {
    try {
      const data = await callApi('listPosts', { page: 0, size: 20 })
      const posts = (data.records || []).map(item => ({
        ...item,
        summary: toSummary(item.content)
      }))
      this.setData({ posts })
    } catch (e) {
      this.setData({ posts: [] })
    }
  },
  goCreate() { wx.navigateTo({ url: '/pages/post-create/index' }) },
  goDetail(e) {
    wx.navigateTo({ url: `/pages/post-detail/index?id=${e.currentTarget.dataset.id}` })
  }
})
