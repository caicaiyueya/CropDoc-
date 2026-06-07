const { cloudEnvId } = require('./utils/config')

App({
  globalData: {
    user: null,
    cloudReady: false,
    pendingDetectId: null
  },
  onLaunch() {
    if (!wx.cloud) {
      console.error('当前基础库过低，请升级微信开发者工具')
      return
    }
    const initOptions = { traceUser: true }
    if (cloudEnvId && !['', 'your-cloud-env-id'].includes(cloudEnvId)) {
      initOptions.env = cloudEnvId
    }
    wx.cloud.init(initOptions)
    this.globalData.cloudReady = true

    const user = wx.getStorageSync('user')
    if (user) this.globalData.user = user

    const { login } = require('./utils/request')
    // 先初始化数据库，再登录
    wx.cloud.callFunction({ name: 'init-db' })
      .then(() => login())
      .catch(err => {
        console.warn('初始化或登录失败，请重新上传云函数（所有文件）', err)
        wx.cloud.callFunction({ name: 'api', data: { action: 'setup' } })
          .finally(() => login().catch(() => {}))
      })
  }
})
