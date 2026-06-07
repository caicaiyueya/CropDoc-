function callApi(action, data = {}) {
  return new Promise((resolve, reject) => {
    if (!wx.cloud) {
      reject(new Error('云能力不可用'))
      return
    }
    wx.cloud.callFunction({
      name: 'api',
      data: { action, data },
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
        const msg = err.errMsg || '云函数调用失败'
        if (action !== 'login') {
          wx.showToast({ title: '请先开通云开发并部署云函数', icon: 'none' })
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
