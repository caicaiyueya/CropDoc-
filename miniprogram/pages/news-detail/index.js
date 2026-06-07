const { callApi } = require('../../utils/request')
const { initSubPageHeader, bindGoBack } = require('../../utils/sub-page')

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
    news: null
  },
  onLoad(options) {
    initSubPageHeader(this)
    bindGoBack(this)
    callApi('getNews', { id: options.id }).then(news => {
      this.setData({
        news: {
          ...news,
          timeText: formatTime(news.publishTime || news.createdAt)
        }
      })
    })
  }
})
