const { goBackToHome } = require('../../utils/nav')

const LEVEL_CLASS = {
  '轻度': 'mild',
  '中度': 'moderate',
  '重度': 'severe'
}

Page({
  data: {
    statusBarHeight: 44,
    headerMinHeight: 140,
    result: null,
    userImageUrl: '',
    standardImageUrl: '',
    levelClass: 'moderate'
  },
  onLoad(options) {
    const sys = wx.getSystemInfoSync()
    const statusBarHeight = sys.statusBarHeight || 44
    this.setData({
      statusBarHeight,
      headerMinHeight: statusBarHeight + 96
    })

    if (options.data) {
      const result = JSON.parse(decodeURIComponent(options.data))
      result.confidenceText = ((result.confidence || 0) * 100).toFixed(1) + '%'
      if (result.inferenceMock === undefined) {
        result.inferenceMock = result.mock === true
      }
      this.setData({
        result,
        levelClass: LEVEL_CLASS[result.level] || 'moderate'
      })
      this.resolveUserImage(result.userImage)
      this.resolveStandardImage(result.standardImageUrl)
    }
  },
  resolveStandardImage(fileID) {
    if (!fileID) return
    if (fileID.startsWith('http') || fileID.startsWith('/assets/')) {
      this.setData({ standardImageUrl: fileID })
      return
    }
    if (fileID.startsWith('cloud://') && wx.cloud) {
      wx.cloud.getTempFileURL({
        fileList: [fileID],
        success: res => {
          const url = res.fileList[0] && res.fileList[0].tempFileURL
          if (url) this.setData({ standardImageUrl: url })
        }
      })
    }
  },
  resolveUserImage(fileID) {
    if (!fileID) return
    if (fileID.startsWith('cloud://') || fileID.startsWith('http')) {
      if (fileID.startsWith('cloud://') && wx.cloud) {
        wx.cloud.getTempFileURL({
          fileList: [fileID],
          success: res => {
            const url = res.fileList[0] && res.fileList[0].tempFileURL
            if (url) this.setData({ userImageUrl: url })
          },
          fail: () => this.setData({ userImageUrl: '' })
        })
      } else {
        this.setData({ userImageUrl: fileID })
      }
    } else {
      this.setData({ userImageUrl: fileID })
    }
  },
  goBack() {
    goBackToHome()
  },
  goDiagnose() {
    const app = getApp()
    app.globalData.pendingDetectId = this.data.result.detectId
    wx.switchTab({ url: '/pages/diagnose/index' })
  },
  goCommunity() {
    wx.switchTab({ url: '/pages/community/index' })
  }
})
