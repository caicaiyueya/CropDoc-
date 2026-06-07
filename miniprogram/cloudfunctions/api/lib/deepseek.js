const https = require('https')
const { isMockAi, getLlmApiKey, getLlmModel, getLlmApiBase, getEnv } = require('./env')

function resolveApiUrl() {
  const base = getLlmApiBase()
  if (base) {
    const trimmed = base.replace(/\/$/, '')
    return trimmed.endsWith('/chat/completions')
      ? trimmed
      : `${trimmed}/chat/completions`
  }
  const direct = getEnv('LLM_API_URL') || getEnv('DEEPSEEK_API_URL')
  if (direct) return direct
  return 'https://api.deepseek.com/chat/completions'
}

function mockDiagnose(cropCn, diseaseName) {
  return {
    cause: `${cropCn}种植区近期温湿度偏高，易诱发${diseaseName}`,
    spread: '风雨传播、病残体传播、田间密植加重蔓延',
    treatment: '及时清除病叶病残体，改善通风透光，合理施肥',
    pesticide: '可选用三唑酮、戊唑醇等，请按当地农技指导用药',
    prevention: '选用抗病品种，轮作倒茬，关键时期预防喷药',
    _mock: true
  }
}

function mockChat(message) {
  return `【模拟回答】建议及时观察田间情况，保持通风排水，必要时咨询当地农技站。您的问题是：${message}`
}

function httpPost(url, headers, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body)
    const u = new URL(url)
    const req = https.request({
      hostname: u.hostname,
      port: u.port || 443,
      path: `${u.pathname}${u.search}`,
      method: 'POST',
      headers: { ...headers, 'Content-Length': Buffer.byteLength(data) },
      timeout: 90000
    }, (res) => {
      let raw = ''
      res.on('data', chunk => { raw += chunk })
      res.on('end', () => {
        try {
          const parsed = raw ? JSON.parse(raw) : {}
          if (res.statusCode >= 400) {
            const msg = parsed.error?.message || parsed.message || parsed.msg || raw || `HTTP ${res.statusCode}`
            reject(new Error(msg))
            return
          }
          resolve(parsed)
        } catch (e) {
          reject(new Error(raw || `HTTP ${res.statusCode}`))
        }
      })
    })
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('大模型请求超时，请稍后重试'))
    })
    req.on('error', reject)
    req.write(data)
    req.end()
  })
}

function extractContent(result) {
  const content = result?.choices?.[0]?.message?.content
    || result?.output?.text
    || result?.data?.content
  if (!content) {
    throw new Error('大模型返回内容为空')
  }
  return content
}

function shouldUseMock(apiKey) {
  return isMockAi() || !apiKey
}

async function chat(messages, apiKey) {
  const key = apiKey || getLlmApiKey()
  if (shouldUseMock(key)) {
    if (isMockAi()) {
      const last = messages[messages.length - 1].content
      if (last.includes('JSON') || last.includes('json')) {
        return JSON.stringify(mockDiagnose('作物', '病害'))
      }
      return mockChat(last)
    }
    throw new Error('未配置 DEEPSEEK_API_KEY，请编辑 cloudfunctions/api/lib/cloud-config.js 后重新上传云函数')
  }

  const result = await httpPost(resolveApiUrl(), {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${key}`
  }, {
    model: getLlmModel(),
    messages,
    temperature: 0.7
  })

  return extractContent(result)
}

async function autoDiagnose(cropCn, diseaseName, confidence, apiKey) {
  const prompt = `农户种植${cropCn}，识别结果为${diseaseName}（置信度${Math.round(confidence * 100)}%）。请分析：1.发病原因 2.传播途径 3.防治措施 4.推荐药剂 5.预防建议。请以JSON返回字段：cause,spread,treatment,pesticide,prevention。`
  const content = await chat([{ role: 'user', content: prompt }], apiKey)
  try {
    const start = content.indexOf('{')
    const end = content.lastIndexOf('}')
    const json = start >= 0 ? content.substring(start, end + 1) : content
    const parsed = JSON.parse(json)
    delete parsed._mock
    return parsed
  } catch (e) {
    return { cause: content, spread: '', treatment: '', pesticide: '', prevention: '' }
  }
}

module.exports = { autoDiagnose, chat, shouldUseMock, resolveApiUrl }
