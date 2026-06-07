const { callApi } = require('../../utils/request')
const { initSubPageHeader, bindGoBack } = require('../../utils/sub-page')

function formatTime(value) {
  if (!value) return ''
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}`
}

function toSummary(text, len = 80) {
  if (!text) return '点击查看详情'
  const plain = String(text).replace(/\s+/g, ' ').trim()
  return plain.length > len ? plain.slice(0, len) + '…' : plain
}

function enrichNews(list) {
  return (list || []).map(item => ({
    ...item,
    summary: item.summary || toSummary(item.content),
    coverUrl: item.coverUrl || item.imageUrl || '',
    timeText: formatTime(item.publishTime || item.updatedAt || item.createdAt)
  }))
}

Page({
  data: {
    statusBarHeight: 44,
    headerMinHeight: 140,
    newsList: [],
    page: 1,
    hasMore: true,
    loading: false
  },
  onLoad() {
    initSubPageHeader(this)
    bindGoBack(this)
    this.loadMore()
  },
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) this.loadMore()
  },
  async loadMore() {
    if (this.data.loading) return
    this.setData({ loading: true })
    try {
      const page = this.data.page
      const list = await callApi('listNews', { page, pageSize: 10 })
      const enriched = enrichNews(list)
      this.setData({
        newsList: page === 1 ? enriched : this.data.newsList.concat(enriched),
        page: page + 1,
        hasMore: enriched.length >= 10,
        loading: false
      })
    } catch (e) {
      this.setData({ loading: false })
    }
  },
  goDetail(e) {
    wx.navigateTo({ url: `/pages/news-detail/index?id=${e.currentTarget.dataset.id}` })
  }
})
