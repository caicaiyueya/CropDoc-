/**
 * 云函数线上配置（随代码上传，优先于云控制台空值）
 * 修改后请：右键 cloudfunctions/api → 上传并部署：所有文件
 */
module.exports = {
  // 云开发环境 ID（数据库/云存储/云函数所在环境）
  TCB_ENV: 'cloud1-d1gkunv290a5dc6f4',

  // 云托管环境 ID（控制台 → 云托管 → 环境 ID，与 cloud1-xxx 不同）
  CLOUD_RUN_ENV: 'ai-service-d9ghejjuh34c4b577',
  CLOUD_RUN_SERVICE: 'ai-service',
  // 必填：云托管公网默认域名（callContainer 仅 15 秒，识别必须走 HTTP）
  // 控制台 → 云托管 → ai-service → 公网访问 → 默认域名
  CLOUD_RUN_BASE_URL: 'https://ai-service-267301-4-1440848964.sh.run.tcloudbase.com',

  // 病虫害识别 → 云托管
  MOCK_DETECT: 'false',
  INFERENCE_MODE: 'cloud_run',

  // AI 问诊 → 大模型
  MOCK_AI: 'false',
  DEEPSEEK_API_KEY: 'sk-i6oQnizIYRa6CDo1yqHyPwLkbLUAgElEW5qNFEFhDkM7lPHP',
  LLM_API_BASE: 'https://tokenhub.tencentmaas.com/v1',
  LLM_MODEL: 'deepseek-v4-pro'
}
