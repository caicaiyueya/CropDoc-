const { cloudRunEnv, cloudRunService } = require('./config')

function parseBody(data) {
  if (!data) return null
  if (typeof data === 'string') {
    try { return JSON.parse(data) } catch (e) { return null }
  }
  return data
}

function callContainer({ path, method = 'GET', data, timeout = 60000 }) {
  const env = cloudRunEnv
  const service = cloudRunService
  if (!env || !service) {
    return Promise.reject(new Error('未配置 cloudRunEnv / cloudRunService'))
  }
  if (!wx.cloud || typeof wx.cloud.callContainer !== 'function') {
    return Promise.reject(new Error('当前基础库不支持 wx.cloud.callContainer，请升级微信开发者工具基础库'))
  }

  const payload = {
    config: { env },
    path: path || '/',
    method,
    header: {
      'X-WX-SERVICE': service,
      'content-type': 'application/json'
    },
    timeout
  }
  if (data !== undefined) payload.data = data

  return new Promise((resolve, reject) => {
    wx.cloud.callContainer({
      ...payload,
      success(res) {
        const statusCode = res.statusCode || 0
        const body = parseBody(res.data)
        if (statusCode >= 400) {
          const detail = body?.detail || body?.message || JSON.stringify(body || res.data)
          reject(new Error(`识别服务(${statusCode}): ${detail}`))
          return
        }
        resolve(body || res.data)
      },
      fail(err) {
        reject(new Error(err.errMsg || 'callContainer 调用失败'))
      }
    })
  })
}

async function predictImage(imageUrl, crop) {
  const body = await callContainer({
    path: '/predict',
    method: 'POST',
    data: { image_url: imageUrl, crop },
    timeout: 90000
  })
  if (!body?.disease_key) {
    throw new Error(body?.detail || body?.message || '识别服务返回异常')
  }
  return { ...body, mock: body.mock === true }
}

async function getTempFileURL(fileID) {
  const res = await wx.cloud.getTempFileURL({ fileList: [fileID] })
  const item = res.fileList && res.fileList[0]
  if (!item || !item.tempFileURL) {
    throw new Error(item?.errMsg || '无法获取图片临时地址')
  }
  return item.tempFileURL
}

async function predictFromFileID(fileID, crop) {
  const imageUrl = await getTempFileURL(fileID)
  return predictImage(imageUrl, crop)
}

module.exports = { callContainer, predictImage, predictFromFileID }
