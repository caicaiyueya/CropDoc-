const https = require('https')

function mockDiagnose(cropCn, diseaseName) {
  return {
    cause: `${cropCn}种植区近期温湿度偏高，易诱发${diseaseName}`,
    spread: '风雨传播、病残体传播、田间密植加重蔓延',
    treatment: '及时清除病叶病残体，改善通风透光，合理施肥',
    pesticide: '可选用三唑酮、戊唑醇等，请按当地农技指导用药',
    prevention: '选用抗病品种，轮作倒茬，关键时期预防喷药'
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
      path: u.pathname,
      method: 'POST',
      headers: { ...headers, 'Content-Length': Buffer.byteLength(data) }
    }, (res) => {
      let raw = ''
      res.on('data', chunk => { raw += chunk })
      res.on('end', () => {
        try { resolve(JSON.parse(raw)) } catch (e) { reject(e) }
      })
    })
    req.on('error', reject)
    req.write(data)
    req.end()
  })
}

async function chat(messages, apiKey) {
  if (!apiKey) {
    const last = messages[messages.length - 1].content
    if (last.includes('JSON') || last.includes('json')) {
      return JSON.stringify(mockDiagnose('作物', '病害'))
    }
    return mockChat(last)
  }
  try {
    const result = await httpPost('https://api.deepseek.com/chat/completions', {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    }, {
      model: 'deepseek-chat',
      messages,
      temperature: 0.7
    })
    return result.choices[0].message.content
  } catch (e) {
    const last = messages[messages.length - 1].content
    return mockChat(last)
  }
}

async function autoDiagnose(cropCn, diseaseName, confidence, apiKey) {
  const prompt = `农户种植${cropCn}，识别结果为${diseaseName}（置信度${Math.round(confidence * 100)}%）。请分析：1.发病原因 2.传播途径 3.防治措施 4.推荐药剂 5.预防建议。请以JSON返回字段：cause,spread,treatment,pesticide,prevention。`
  const content = await chat([{ role: 'user', content: prompt }], apiKey)
  try {
    const start = content.indexOf('{')
    const end = content.lastIndexOf('}')
    const json = start >= 0 ? content.substring(start, end + 1) : content
    return JSON.parse(json)
  } catch (e) {
    return { cause: content, spread: '', treatment: '', pesticide: '', prevention: '' }
  }
}

module.exports = { autoDiagnose, chat }
