const https = require('https')
const http = require('http')
const { getCloudRunBaseUrl, getCloudRunService } = require('./env')

const SETUP_HINT = '请在 cloud-config.js 配置 CLOUD_RUN_BASE_URL（云托管 → ai-service → 公网访问 → 默认域名，形如 https://ai-service-xxx.sh.run.tcloudbase.com）'

function setRuntimeContext() {
  // HTTP 模式无需 SCF context
}

function discoverInternalBaseUrl() {
  const prefix = getCloudRunService().toUpperCase().replace(/-/g, '_')
  const env = process.env
  const candidates = [
    [`${prefix}_001_PORT_80_TCP_ADDR`, `${prefix}_001_PORT_80_TCP_PORT`],
    [`${prefix}_001_SERVICE_HOST`, `${prefix}_001_SERVICE_PORT`]
  ]
  for (const [addrKey, portKey] of candidates) {
    const addr = env[addrKey]
    if (!addr) continue
    const port = env[portKey] || '80'
    return `http://${addr}:${port}`
  }
  return ''
}

function resolveHttpBaseUrl() {
  const configured = getCloudRunBaseUrl()
  if (configured) return configured
  return discoverInternalBaseUrl()
}

function httpRequest(url, { method = 'GET', data, timeout = 55000, headers = {} }) {
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    const lib = u.protocol === 'https:' ? https : http
    const body = data !== undefined ? JSON.stringify(data) : ''
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    }
    if (body) reqHeaders['Content-Length'] = Buffer.byteLength(body)

    const req = lib.request({
      hostname: u.hostname,
      port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: `${u.pathname}${u.search}`,
      method,
      headers: reqHeaders,
      timeout
    }, (res) => {
      let raw = ''
      res.on('data', chunk => { raw += chunk })
      res.on('end', () => {
        let parsed = raw
        try { parsed = raw ? JSON.parse(raw) : {} } catch (e) { /* keep string */ }
        resolve({
          statusCode: res.statusCode,
          header: res.headers,
          data: parsed
        })
      })
    })

    req.on('timeout', () => {
      req.destroy()
      reject(new Error('云托管 HTTP 请求超时（识别耗时较长时可把云托管最小副本数设为 1）'))
    })
    req.on('error', reject)
    if (body) req.write(body)
    req.end()
  })
}

/**
 * 云函数内通过 HTTP 调用云托管（公网域名或内网服务发现）
 * 说明：小程序 callContainer 最长仅 15 秒，NFNet 识别必须走云函数 HTTP（最长 60 秒）
 */
async function callAiService({ path, method = 'GET', data, timeout = 55000 }) {
  const base = resolveHttpBaseUrl()
  if (!base) {
    throw new Error(SETUP_HINT)
  }

  const normalizedBase = base.replace(/\/$/, '')
  const normalizedPath = path && path.startsWith('/') ? path : `/${path || ''}`
  const url = `${normalizedBase}${normalizedPath}`
  return httpRequest(url, { method, data, timeout })
}

module.exports = {
  callAiService,
  setRuntimeContext,
  resolveHttpBaseUrl,
  SETUP_HINT
}
