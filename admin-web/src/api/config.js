// 云函数 HTTP 地址（新版 CloudBase HTTP API）
// 示例：https://cloud1-d1gkunv290a5dc6f4.api.tcloudbasegateway.com/v1/functions/admin
export const cloudHttpBase = import.meta.env.VITE_CLOUD_HTTP_BASE || ''
// 环境配置 → API Key 管理 中创建（管理后台服务端调用）
export const cloudApiKey = import.meta.env.VITE_CLOUD_API_KEY || ''
