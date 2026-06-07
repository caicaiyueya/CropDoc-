const ACTION_TIMEOUT = {
  detect: 60000,
  diagnose: 60000,
  chatSend: 60000,
  aiHealth: 30000
}

function callApi(action, data = {}, options = {}) {
  return new Promise((resolve, reject) => {
    if (!wx.cloud) {
      reject(new Error('云能力不可用'))
      return
    }
    const timeout = options.timeout || ACTION_TIMEOUT[action]
    const callOptions = {
      name: 'api',
      data: { action, data }
    }
    // 识别/问诊走云函数 HTTP，需与 api 云函数 timeout(60s) 对齐
    if (timeout) {
      callOptions.config = { timeout }
    }
    wx.cloud.callFunction({
      ...callOptions,
      success(res) {
        const result = res.result
        if (result && result.code === 200) {
          resolve(result.data)
        } else {
          const msg = result?.message || '请求失败'
          if (action !== 'login') {
            wx.showToast({ title: msg, icon: 'none' })
          }
          reject(result || new Error(msg))
        }
      },
      fail(err) {
        let msg = err.errMsg || '云函数调用失败'
        if (/timeout|超时|504003|-504003/i.test(msg)) {
          if (action === 'diagnose' || action === 'chatSend' || action === 'aiHealth') {
            msg = 'AI 问诊超时：请在云开发控制台将 api 云函数超时设为 60 秒，并重新上传部署'
          } else if (action === 'detect') {
            msg = '识别超时：请配置 CLOUD_RUN_BASE_URL，并将云托管最小副本数设为 1'
          } else {
            msg = '云函数超时：请将 api 云函数超时设为 60 秒并重新上传部署'
          }
        }
        if (action !== 'login') {
          wx.showToast({ title: msg, icon: 'none', duration: 3500 })
        }
        reject(err)
      }
    })
  })
}

function login() {
  return callApi('login').then(data => {
    const app = getApp()
    app.globalData.user = data.user
    wx.setStorageSync('user', data.user)
    return data
  })
}

function uploadFile(filePath) {
  const ext = filePath.match(/\.(\w+)$/) ? filePath.match(/\.(\w+)$/)[1] : 'jpg'
  const cloudPath = `detect/${Date.now()}-${Math.floor(Math.random() * 10000)}.${ext}`
  return new Promise((resolve, reject) => {
    wx.cloud.uploadFile({
      cloudPath,
      filePath,
      success: res => resolve(res.fileID),
      fail: reject
    })
  })
}

module.exports = { callApi, login, uploadFile }
