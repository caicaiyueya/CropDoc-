const fs = require('fs')
const path = require('path')

let fileEnv = null
let cloudConfig = null

function loadCloudConfig() {
  if (cloudConfig) return cloudConfig
  try {
    cloudConfig = require('./cloud-config')
  } catch (e) {
    try {
      cloudConfig = require('./llm-config')
    } catch (e2) {
      cloudConfig = {}
    }
  }
  return cloudConfig
}

function loadFileEnv() {
  if (fileEnv) return fileEnv
  try {
    const cfgPath = path.join(__dirname, '..', 'config.json')
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'))
    fileEnv = cfg.env || {}
  } catch (e) {
    fileEnv = {}
  }
  return fileEnv
}

function isPlaceholder(value) {
  if (value === undefined || value === null) return true
  const s = String(value).trim()
  if (!s) return true
  const lower = s.toLowerCase()
  return lower.includes('xxxx')
    || lower.includes('your')
    || lower === 'sk-xxx'
    || lower === 'sk-xxxxxxxx'
}

/**
 * 优先级：cloud-config.js > 云端 process.env（非占位）> config.json env
 */
function getEnv(name, defaultValue = '') {
  const fromCloud = loadCloudConfig()[name]
  if (!isPlaceholder(fromCloud)) {
    return String(fromCloud).trim()
  }

  const runtime = process.env[name]
  if (!isPlaceholder(runtime)) {
    return String(runtime).trim()
  }

  const file = loadFileEnv()[name]
  if (!isPlaceholder(file)) {
    return String(file).trim()
  }

  return defaultValue
}

function isTruthy(value) {
  const v = String(value || '').toLowerCase()
  return v === 'true' || v === '1' || v === 'yes'
}

function isMockDetect() {
  return isTruthy(getEnv('MOCK_DETECT', 'false'))
}

function isMockAi() {
  return isTruthy(getEnv('MOCK_AI', 'false'))
}

function getCloudRunService() {
  return getEnv('CLOUD_RUN_SERVICE', 'ai-service')
}

function getCloudRunEnv() {
  return getEnv('CLOUD_RUN_ENV') || getEnv('WX_CLOUD_RUN_ENV')
}

function getCloudRunBaseUrl() {
  return getEnv('CLOUD_RUN_BASE_URL')
}

function getCloudEnvId() {
  const configured = getEnv('TCB_ENV') || getEnv('CLOUD_ENV_ID') || getEnv('ENV_ID')
  if (configured) return configured

  const runtime = process.env.TCB_ENV || process.env.SCF_NAMESPACE
  if (runtime && !isPlaceholder(runtime)) return String(runtime).trim()

  return ''
}

function getInferenceMode() {
  return (getEnv('INFERENCE_MODE', 'cloud_run') || 'cloud_run').toLowerCase()
}

function getLlmApiKey() {
  return getEnv('DEEPSEEK_API_KEY') || getEnv('LLM_API_KEY') || getEnv('OPENAI_API_KEY')
}

function getLlmModel() {
  return getEnv('LLM_MODEL') || getEnv('DEEPSEEK_MODEL') || 'deepseek-chat'
}

function getLlmApiBase() {
  return getEnv('LLM_API_BASE') || getEnv('DEEPSEEK_API_BASE')
}

function getAiConfigSummary() {
  const apiKey = getLlmApiKey()
  const cfg = loadCloudConfig()
  let keySource = 'none'
  if (!isPlaceholder(cfg.DEEPSEEK_API_KEY)) keySource = 'cloud-config.js'
  else if (!isPlaceholder(process.env.DEEPSEEK_API_KEY)) keySource = 'cloud_env'
  else if (!isPlaceholder(loadFileEnv().DEEPSEEK_API_KEY)) keySource = 'config.json'

  return {
    mockAi: isMockAi(),
    apiKeyConfigured: !!apiKey,
    apiKeyPreview: apiKey ? `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}` : '',
    model: getLlmModel(),
    apiBase: getLlmApiBase() || 'https://api.deepseek.com/v1',
    keySource,
    cloudMockAi: process.env.MOCK_AI || '',
    fileMockAi: loadFileEnv().MOCK_AI || '',
    configMockAi: cfg.MOCK_AI || ''
  }
}

function getDetectConfigSummary() {
  const cfg = loadCloudConfig()
  return {
    mockDetect: isMockDetect(),
    inferenceMode: getInferenceMode(),
    cloudRunService: getCloudRunService(),
    cloudRunEnv: getCloudRunEnv() || '(未配置)',
    cloudRunBaseUrl: getCloudRunBaseUrl() || '(未配置)',
    cloudEnvId: getCloudEnvId() || '(未解析)',
    configSource: !isPlaceholder(cfg.MOCK_DETECT) ? 'cloud-config.js' : 'fallback',
    cloudMockDetect: process.env.MOCK_DETECT || '',
    fileMockDetect: loadFileEnv().MOCK_DETECT || '',
    runtimeTcbEnv: process.env.TCB_ENV || '',
    runtimeScfNamespace: process.env.SCF_NAMESPACE || ''
  }
}

module.exports = {
  getEnv,
  isMockDetect,
  isMockAi,
  getCloudRunService,
  getCloudRunEnv,
  getCloudRunBaseUrl,
  getCloudEnvId,
  getInferenceMode,
  getLlmApiKey,
  getLlmModel,
  getLlmApiBase,
  getAiConfigSummary,
  getDetectConfigSummary,
  isPlaceholder
}
