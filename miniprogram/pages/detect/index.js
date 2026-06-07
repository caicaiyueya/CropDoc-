const { callApi, uploadFile } = require('../../utils/request')
const { setTabSelected } = require('../../utils/tab-bar')
const { goBackToHome } = require('../../utils/nav')

const PRIORITY_CROPS = ['Rice', 'Wheat', 'Corn', 'Tomato', 'Cucumber']

function sortCrops(crops) {
  const list = crops || []
  const priority = []
  const rest = []
  list.forEach(item => {
    if (PRIORITY_CROPS.includes(item.key)) priority.push(item)
    else rest.push(item)
  })
  priority.sort((a, b) => PRIORITY_CROPS.indexOf(a.key) - PRIORITY_CROPS.indexOf(b.key))
  rest.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
  return priority.concat(rest)
}

Page({
  data: {
    statusBarHeight: 44,
    headerMinHeight: 140,
    crops: [],
    selectedCrop: '',
    imagePath: '',
    loading: false,
    canSubmit: false
  },
  onLoad() {
    const sys = wx.getSystemInfoSync()
    const statusBarHeight = sys.statusBarHeight || 44
    this.setData({
      statusBarHeight,
      headerMinHeight: statusBarHeight + 96
    })
    this.loadCrops()
  },
  onShow() {
    setTabSelected('/pages/detect/index')
  },
  goBack() {
    goBackToHome()
  },
  async loadCrops() {
    try {
      const crops = sortCrops(await callApi('crops'))
      this.setData({ crops })
    } catch (e) {
      this.setData({ crops: [] })
    }
  },
  selectCrop(e) {
    this.setData({ selectedCrop: e.currentTarget.dataset.key }, this.syncSubmitState)
  },
  chooseImage(e) {
    const sourceType = e.currentTarget.dataset.source === 'camera' ? ['camera'] : ['album']
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType,
      success: (res) => {
        this.setData({ imagePath: res.tempFiles[0].tempFilePath }, this.syncSubmitState)
      }
    })
  },
  removeImage() {
    this.setData({ imagePath: '' }, this.syncSubmitState)
  },
  syncSubmitState() {
    const { selectedCrop, imagePath, loading } = this.data
    this.setData({ canSubmit: !!(selectedCrop && imagePath && !loading) })
  },
  async startDetect() {
    if (!this.data.selectedCrop) {
      wx.showToast({ title: '请先选择作物', icon: 'none' })
      return
    }
    if (!this.data.imagePath) {
      wx.showToast({ title: '请先上传叶片图片', icon: 'none' })
      return
    }
    this.setData({ loading: true, canSubmit: false })
    try {
      const fileID = await uploadFile(this.data.imagePath)
      const result = await callApi('detect', {
        crop: this.data.selectedCrop,
        fileID
      })
      this.setData({ imagePath: '' }, this.syncSubmitState)
      wx.navigateTo({
        url: `/pages/detect-result/index?data=${encodeURIComponent(JSON.stringify(result))}`
      })
    } finally {
      this.setData({ loading: false }, this.syncSubmitState)
    }
  }
})
