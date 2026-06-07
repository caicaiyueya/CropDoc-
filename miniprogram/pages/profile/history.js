const { callApi } = require('../../utils/request')
const { initSubPageHeader, bindGoBack } = require('../../utils/sub-page')

function formatTime(value) {
  if (!value) return ''
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 16)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}`
}

Page({
  data: {
    statusBarHeight: 44,
    headerMinHeight: 140,
    records: []
  },
  onLoad() {
    initSubPageHeader(this)
    bindGoBack(this)
  },
  onShow() {
    this.load()
  },
  async load() {
    const data = await callApi('detectHistory')
    const records = (data.records || []).map(item => ({
      ...item,
      timeText: formatTime(item.createdAt),
      imageUrl: item.userImage && !String(item.userImage).startsWith('cloud://')
        ? item.userImage
        : ''
    }))
    this.setData({ records })
  }
})
