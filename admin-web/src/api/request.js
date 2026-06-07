import axios from 'axios'
import { ElMessage } from 'element-plus'
import { cloudHttpBase } from './config'

export async function callAdmin(action, data = {}) {
  if (!cloudHttpBase) {
    ElMessage.error('请配置 VITE_CLOUD_HTTP_BASE 环境变量')
    return Promise.reject(new Error('未配置云函数 HTTP 地址'))
  }
  const token = localStorage.getItem('admin_token')
  try {
    const res = await axios.post(cloudHttpBase, { action, data, token })
    const body = res.data
    if (body.code !== 200) {
      ElMessage.error(body.message || '请求失败')
      return Promise.reject(body)
    }
    return body.data
  } catch (err) {
    ElMessage.error(err.response?.data?.message || '网络错误')
    return Promise.reject(err)
  }
}
