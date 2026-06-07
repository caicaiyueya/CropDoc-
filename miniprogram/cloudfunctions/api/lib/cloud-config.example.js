/**
 * 云函数线上配置模板
 */
module.exports = {
  TCB_ENV: 'cloud1-xxxxxxxx',
  CLOUD_RUN_ENV: 'ai-service-xxxxxxxx',
  CLOUD_RUN_SERVICE: 'ai-service',
  CLOUD_RUN_BASE_URL: 'https://ai-service-xxxx.sh.run.tcloudbase.com',
  MOCK_DETECT: 'false',
  INFERENCE_MODE: 'cloud_run',
  MOCK_AI: 'false',
  DEEPSEEK_API_KEY: 'sk-xxxxxxxx',
  LLM_API_BASE: 'https://tokenhub.tencentmaas.com/v1',
  LLM_MODEL: 'deepseek-v4-pro'
}
