import axios from 'axios'
import { ElMessage } from 'element-plus'
import { cloudHttpBase, cloudApiKey } from './config'

export async function callAdmin(action, data = {}, options = {}) {
  const { silent = false } = options
  if (!cloudHttpBase) {
    ElMessage.error('请配置 VITE_CLOUD_HTTP_BASE 环境变量')
    return Promise.reject(new Error('未配置云函数 HTTP 地址'))
  }
  if (!cloudApiKey) {
    ElMessage.error('请配置 VITE_CLOUD_API_KEY 环境变量')
    return Promise.reject(new Error('未配置 CloudBase API Key'))
  }
  const token = localStorage.getItem('admin_token')
  try {
    const res = await axios.post(
      cloudHttpBase,
      { action, data, token },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${cloudApiKey}`
        }
      }
    )
    const body = res.data?.result ?? res.data
    if (body.code !== 200) {
      if (!silent) ElMessage.error(body.message || '请求失败')
      return Promise.reject(body)
    }
    return body.data
  } catch (err) {
    if (!silent) ElMessage.error(err.response?.data?.message || err.message || '网络错误')
    return Promise.reject(err)
  }
}
