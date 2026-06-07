<template>
  <div class="login-page">
    <el-card class="login-card">
      <h2>云农智诊管理后台</h2>
      <p class="hint">云开发版 · 账号 admin / admin123</p>
      <el-form @submit.prevent="login">
        <el-form-item label="用户名">
          <el-input v-model="form.username" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" show-password />
        </el-form-item>
        <el-button type="primary" style="width:100%" @click="login">登录</el-button>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { callAdmin } from '../api/request'

const router = useRouter()
const form = reactive({ username: 'admin', password: 'admin123' })

async function login() {
  const data = await callAdmin('login', form)
  localStorage.setItem('admin_token', data.token)
  router.push('/dashboard')
}
</script>

<style scoped>
.login-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f0f5f0; }
.login-card { width: 400px; }
h2 { text-align: center; margin-bottom: 8px; color: #2d6a4f; }
.hint { text-align: center; color: #999; font-size: 13px; margin-bottom: 20px; }
</style>
