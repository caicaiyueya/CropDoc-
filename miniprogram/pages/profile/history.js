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

function getRecordFileID(item) {
  return item.imageFileID || item.userImage || ''
}

async function resolveRecordImages(records) {
  const mapped = (records || []).map(item => ({
    ...item,
    timeText: formatTime(item.createdAt),
    imageUrl: ''
  }))
  if (!mapped.length || !wx.cloud) return mapped

  const cloudIDs = [...new Set(
    mapped
      .map(item => getRecordFileID(item))
      .filter(id => String(id).startsWith('cloud://'))
  )]

  const urlMap = {}
  if (cloudIDs.length) {
    try {
      const res = await wx.cloud.getTempFileURL({ fileList: cloudIDs })
      ;(res.fileList || []).forEach(item => {
        if (item.fileID && item.tempFileURL) urlMap[item.fileID] = item.tempFileURL
      })
    } catch (e) {
      console.warn('诊断历史图片加载失败', e)
    }
  }

  return mapped.map(item => {
    const fileID = getRecordFileID(item)
    let imageUrl = ''
    if (fileID) {
      if (String(fileID).startsWith('cloud://')) {
        imageUrl = urlMap[fileID] || ''
      } else {
        imageUrl = fileID
      }
    }
    return { ...item, imageUrl }
  })
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
    try {
      const data = await callApi('detectHistory')
      const records = await resolveRecordImages(data.records || [])
      this.setData({ records })
    } catch (e) {
      wx.showToast({
        title: (e && e.message) || '加载失败',
        icon: 'none'
      })
    }
  }
})
