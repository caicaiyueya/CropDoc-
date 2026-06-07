const https = require('https')
const cloud = require('./cloud')

const HF_MODEL_ID = process.env.HF_MODEL_ID || 'Arko007/nfnet-f1-plant-disease'
const HF_API_URL = `https://api-inference.huggingface.co/models/${HF_MODEL_ID}`

function httpsPostBinary(url, token, buffer) {
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/octet-stream',
        'Content-Length': buffer.length
      }
    }, (res) => {
      let raw = ''
      res.on('data', chunk => { raw += chunk })
      res.on('end', () => {
        try {
          const parsed = JSON.parse(raw)
          if (res.statusCode >= 400) {
            const msg = parsed.error || parsed.message || raw
            reject(new Error(typeof msg === 'string' ? msg : JSON.stringify(msg)))
            return
          }
          resolve(parsed)
        } catch (e) {
          reject(new Error(raw || `HTTP ${res.statusCode}`))
        }
      })
    })
    req.on('error', reject)
    req.write(buffer)
    req.end()
  })
}

function pickBestResult(results, crop) {
  const list = Array.isArray(results) ? results : []
  if (!list.length) {
    throw new Error('HuggingFace 未返回识别结果')
  }

  let candidates = list
  if (crop) {
    const prefix = `${crop}__`
    const filtered = list.filter(item => String(item.label || '').startsWith(prefix))
    if (filtered.length) candidates = filtered
  }

  const best = candidates.reduce((a, b) => ((a.score || 0) >= (b.score || 0) ? a : b))
  return {
    disease_key: best.label,
    confidence: best.score || 0.75
  }
}

async function predictImage(fileID, crop, apiToken) {
  if (!apiToken) {
    throw new Error('未配置 HF_API_TOKEN，无法调用 HuggingFace 推理')
  }

  const downloadRes = await cloud.downloadFile({ fileID })
  const buffer = downloadRes.fileContent
  if (!buffer || !buffer.length) {
    throw new Error('无法下载待识别图片')
  }

  const results = await httpsPostBinary(HF_API_URL, apiToken, buffer)
  return pickBestResult(results, crop)
}

module.exports = { predictImage }
