const { callApi } = require('../../utils/request')
const { setTabSelected } = require('../../utils/tab-bar')
const { goBackToHome } = require('../../utils/nav')

const MENU_ITEMS = [
  { icon: '📋', label: '我的诊断历史', url: '/pages/profile/history' },
  { icon: '⭐', label: '我的收藏', url: '/pages/profile/favorites' },
  { icon: '💬', label: '意见反馈', url: '/pages/profile/feedback' },
  { icon: 'ℹ️', label: '关于我们', url: '/pages/about/index' }
]

Page({
  data: {
    statusBarHeight: 44,
    headerMinHeight: 140,
    user: {},
    menuItems: MENU_ITEMS
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
    setTabSelected('/pages/profile/index')
    this.load()
  },
  goBack() {
    goBackToHome()
  },
  async load() {
    const user = await callApi('getProfile')
    this.setData({ user })
  },
  go(e) { wx.navigateTo({ url: e.currentTarget.dataset.url }) }
})
