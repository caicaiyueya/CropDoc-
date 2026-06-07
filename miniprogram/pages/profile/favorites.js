const { callApi } = require('../../utils/request')
const { initSubPageHeader, bindGoBack } = require('../../utils/sub-page')

const TYPE_MAP = {
  post: '帖子',
  disease: '病害'
}

function formatTime(value) {
  if (!value) return ''
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 16)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

Page({
  data: {
    statusBarHeight: 44,
    headerMinHeight: 140,
    list: []
  },
  onLoad() {
    initSubPageHeader(this)
    bindGoBack(this)
  },
  onShow() {
    callApi('listFavorites').then(data => {
      const list = (data || []).map(item => ({
        ...item,
        titleText: item.title || `${TYPE_MAP[item.targetType] || '内容'}收藏`,
        typeText: TYPE_MAP[item.targetType] || item.targetType,
        timeText: formatTime(item.createdAt)
      }))
      this.setData({ list })
    })
  },
  goDetail(e) {
    const { type, id } = e.currentTarget.dataset
    if (!id) return
    if (type === 'post') {
      wx.navigateTo({ url: `/pages/post-detail/index?id=${id}` })
      return
    }
    if (type === 'disease') {
      wx.navigateTo({ url: `/pages/disease-detail/index?id=${id}` })
    }
  }
})
