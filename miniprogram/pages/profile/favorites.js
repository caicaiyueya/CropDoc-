const { callApi } = require('../../utils/request')
const { initSubPageHeader, bindGoBack } = require('../../utils/sub-page')

const TYPE_LABEL = { post: '帖子', disease: '病害' }

function formatTime(value) {
  if (!value) return ''
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 16)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

async function resolveCoverUrls(list) {
  if (!list.length || !wx.cloud) return list

  const cloudIDs = [...new Set(
    list
      .map(item => item.coverUrl)
      .filter(url => url && String(url).startsWith('cloud://'))
  )]

  const urlMap = {}
  if (cloudIDs.length) {
    try {
      const res = await wx.cloud.getTempFileURL({ fileList: cloudIDs })
      ;(res.fileList || []).forEach(item => {
        if (item.fileID && item.tempFileURL) urlMap[item.fileID] = item.tempFileURL
      })
    } catch (e) {
      console.warn('收藏封面加载失败', e)
    }
  }

  return list.map(item => {
    const coverUrl = item.coverUrl
    let coverDisplay = ''
    if (coverUrl) {
      if (String(coverUrl).startsWith('cloud://')) {
        coverDisplay = urlMap[coverUrl] || ''
      } else {
        coverDisplay = coverUrl
      }
    }
    return { ...item, coverDisplay }
  })
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
    this.load()
  },
  async load() {
    try {
      const data = await callApi('listFavorites')
      const raw = Array.isArray(data) ? data : (data.records || [])
      const list = await resolveCoverUrls(raw.map(item => ({
        ...item,
        titleText: item.title || `${TYPE_LABEL[item.targetType] || '内容'}收藏`,
        summaryText: item.subtitle || '',
        timeText: formatTime(item.createdAt)
      })))
      this.setData({ list })
    } catch (e) {
      wx.showToast({
        title: (e && e.message) || '加载失败',
        icon: 'none'
      })
    }
  },
  goDetail(e) {
    const { type, id, available } = e.currentTarget.dataset
    if (!id) return
    if (available === 'false' || available === false) {
      wx.showToast({ title: '内容已下架或删除', icon: 'none' })
      return
    }
    if (type === 'post') {
      wx.navigateTo({ url: `/pages/post-detail/index?id=${id}` })
      return
    }
    if (type === 'disease') {
      wx.navigateTo({ url: `/pages/disease-detail/index?id=${id}` })
    }
  }
})
