const { callApi } = require('../../utils/request')
const { setTabSelected } = require('../../utils/tab-bar')

const DEFAULT_QUICK = [
  { icon: '📷', name: '病虫害识别', path: '/pages/detect/index' },
  { iconType: 'chat', name: 'AI问诊', path: '/pages/diagnose/index' },
  { icon: '👨‍🌾', name: '农友交流', path: '/pages/community/index' },
  { icon: '📋', name: '诊断记录', path: '/pages/profile/history' }
]

const SCIENCE_EMOJI = ['🌾', '🌽', '🌶️', '🍅', '🍇', '🫘']

const CROP_BG = [
  'linear-gradient(135deg, #c8f0c8, #7ed957)',
  'linear-gradient(135deg, #ffe8cc, #ffd6a5)',
  'linear-gradient(135deg, #e8f5e9, #b7e4c7)',
  'linear-gradient(135deg, #fff3e0, #ffcc80)'
]

function formatTime(value) {
  if (!value) return ''
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function toSummary(text, len = 48) {
  if (!text) return '点击查看详情'
  const plain = String(text).replace(/\s+/g, ' ').trim()
  return plain.length > len ? plain.slice(0, len) + '…' : plain
}

function pickCover(item) {
  if (item.coverUrl) return item.coverUrl
  if (item.images) {
    const first = String(item.images).split(',')[0].trim()
    if (first) return first
  }
  return ''
}

function enrichSciencePosts(list) {
  return (list || []).map((item, index) => ({
    ...item,
    coverUrl: pickCover(item),
    thumbEmoji: SCIENCE_EMOJI[index % SCIENCE_EMOJI.length],
    thumbBg: CROP_BG[index % CROP_BG.length]
  }))
}

function enrichNews(list) {
  return (list || []).map(item => ({
    ...item,
    summary: item.summary || toSummary(item.content),
    coverUrl: item.coverUrl || item.imageUrl || pickCover(item),
    timeText: formatTime(item.publishTime || item.updatedAt || item.createdAt)
  }))
}

Page({
  data: {
    statusBarHeight: 44,
    quickMenus: DEFAULT_QUICK,
    scienceSlides: [],
    latestNews: []
  },
  onLoad() {
    const sys = wx.getSystemInfoSync()
    this.setData({ statusBarHeight: sys.statusBarHeight || 44 })
  },
  onShow() {
    setTabSelected('/pages/home/index')
    this.load()
  },
  async load() {
    try {
      const data = await callApi('home')
      this.setData({
        quickMenus: (data.quickMenus || DEFAULT_QUICK).map((item, i) => ({
          ...item,
          ...DEFAULT_QUICK[i],
          icon: DEFAULT_QUICK[i].icon,
          iconType: DEFAULT_QUICK[i].iconType,
          path: DEFAULT_QUICK[i].path
        })),
        scienceSlides: enrichSciencePosts(data.sciencePosts),
        latestNews: enrichNews(data.latestNews)
      })
    } catch (e) {
      console.warn('首页加载失败', e)
      this.setData({ quickMenus: DEFAULT_QUICK })
    }
  },
  goPage(e) {
    const path = e.currentTarget.dataset.path || ''
    if (path.includes('profile/history')) {
      wx.navigateTo({ url: path })
    } else if (path.includes('diagnose') || path.includes('chat')) {
      wx.switchTab({ url: '/pages/diagnose/index' })
    } else {
      wx.switchTab({ url: path })
    }
  },
  goSciencePost(e) {
    const id = e.currentTarget.dataset.id
    if (id) {
      wx.navigateTo({ url: `/pages/post-detail/index?id=${id}` })
    }
  },
  goCommunity() {
    wx.switchTab({ url: '/pages/community/index' })
  },
  goNews(e) {
    wx.navigateTo({ url: `/pages/news-detail/index?id=${e.currentTarget.dataset.id}` })
  },
  goNewsList() {
    wx.navigateTo({ url: '/pages/news-list/index' })
  }
})
