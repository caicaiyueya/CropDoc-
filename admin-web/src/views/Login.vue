<template>
  <div class="login-page">
    <div class="login-page-bg" aria-hidden="true"></div>
    <div class="login-bg-pattern" aria-hidden="true"></div>

    <div class="login-shell">
      <header class="login-hero">
        <img class="hero-bg" src="/assets/images/hero-bg.png" alt="" />
        <div class="hero-gradient"></div>
        <div class="hero-content">
          <BrandLogo size="lg" />
          <h1 class="hero-title">云农智诊</h1>
          <p class="hero-subtitle">AI助力智慧农业</p>
        </div>
        <div class="hero-wave"></div>
      </header>

      <section class="login-card">
        <h2 class="form-title">管理员登录</h2>

        <el-form class="login-form" @submit.prevent="login" label-position="top">
          <el-form-item label="用户名" class="form-field">
            <el-input
              v-model="form.username"
              size="large"
              placeholder="请输入用户名"
              clearable
              @input="clearError"
            />
          </el-form-item>

          <el-form-item label="密码" class="form-field">
            <el-input
              v-model="form.password"
              type="password"
              show-password
              size="large"
              placeholder="请输入密码"
              @input="clearError"
              @keyup.enter="login"
            />
          </el-form-item>

          <p v-if="errorMsg" class="form-error" role="alert">{{ errorMsg }}</p>

          <button
            type="submit"
            class="login-btn"
            :class="{ 'login-btn--disabled': !canSubmit, 'login-btn--loading': loading }"
            :disabled="!canSubmit || loading"
          >
            <span v-if="loading" class="login-btn-spinner"></span>
            <span>{{ loading ? '登录中…' : '登录' }}</span>
          </button>
        </el-form>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import BrandLogo from '../components/BrandLogo.vue'
import { callAdmin } from '../api/request'

const router = useRouter()
const form = reactive({ username: '', password: '' })
const loading = ref(false)
const errorMsg = ref('')

const canSubmit = computed(() => Boolean(form.username.trim() && form.password.trim()))

function clearError() {
  if (errorMsg.value) errorMsg.value = ''
}

async function login() {
  if (!canSubmit.value || loading.value) return

  loading.value = true
  errorMsg.value = ''

  try {
    const data = await callAdmin(
      'login',
      { username: form.username.trim(), password: form.password },
      { silent: true }
    )
    localStorage.setItem('admin_token', data.token)
    router.push('/dashboard')
  } catch (err) {
    errorMsg.value = err.message || err.response?.data?.message || '用户名或密码错误，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 0 20px 48px;
  position: relative;
  overflow-x: hidden;
}

/* 与 hero 绿色遮罩衔接的页面背景 */
.login-page-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  background:
    radial-gradient(ellipse 90% 42% at 50% 0%, rgba(40, 180, 70, 0.16) 0%, transparent 62%),
    linear-gradient(
      180deg,
      #dcefe3 0%,
      #e8f5ec 12%,
      #eef6f0 28%,
      #f3f7f4 45%,
      var(--app-bg) 68%,
      var(--app-bg) 100%
    );
}

.login-bg-pattern {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.035;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Cg fill='%2328b446'%3E%3Cpath d='M60 18c-2 8-8 12-8 18a8 8 0 1 0 16 0c0-6-6-10-8-18z'/%3E%3Cpath d='M20 90c0-4 3-8 8-10M100 90c0-4-3-8-8-10' stroke='%2328b446' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/g%3E%3C/svg%3E");
  background-size: 120px 120px;
}

.login-shell {
  width: 100%;
  max-width: 440px;
  position: relative;
  z-index: 1;
}

.login-hero {
  position: relative;
  width: 100%;
  height: 280px;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  z-index: 0;
}

.hero-gradient {
  position: absolute;
  inset: 0;
  background: var(--app-hero-gradient);
  z-index: 1;
}

.hero-content {
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 24px 48px;
  text-align: center;
  color: #ffffff;
}

.hero-content :deep(.brand-logo) {
  margin-bottom: 16px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.18);
}

.hero-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 1px;
  line-height: 1.45;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.18);
}

.hero-subtitle {
  margin: 10px 0 0;
  font-size: 17px;
  font-weight: 500;
  letter-spacing: 0.5px;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

.hero-wave {
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 32px;
  background: #eef6f0;
  border-radius: 50% 50% 0 0 / 100% 100% 0 0;
  z-index: 3;
}

.login-card {
  width: 100%;
  margin-top: -20px;
  padding: 28px 28px 32px;
  background: #ffffff;
  border-radius: var(--app-card-radius);
  border: 1px solid rgba(40, 180, 70, 0.1);
  box-shadow: 0 12px 40px rgba(40, 180, 70, 0.12);
  position: relative;
  z-index: 4;
}

.form-title {
  margin: 0 0 24px;
  text-align: center;
  color: var(--app-primary);
  font-size: 17px;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: 0.5px;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 18px;
}

.login-form :deep(.el-form-item__label) {
  padding-bottom: 8px;
  font-size: 14px;
  font-weight: 400;
  color: var(--app-label-color);
  line-height: 1.5;
}

.login-form :deep(.el-input__wrapper) {
  height: 44px;
  padding: 0 14px;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 0 0 1px var(--app-input-border) inset;
  transition: box-shadow 0.18s ease;
}

.login-form :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #d5ddd5 inset;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--app-primary) inset, 0 0 0 3px rgba(40, 180, 70, 0.12);
}

.login-form :deep(.el-input__inner) {
  font-size: 14px;
  color: var(--app-text);
}

.login-form :deep(.el-input__inner::placeholder) {
  color: var(--app-input-placeholder);
  font-size: 14px;
}

.login-form :deep(.el-input .el-input__password) {
  color: var(--app-text-secondary);
}

.form-error {
  margin: -4px 0 16px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #fff5f0;
  border: 1px solid rgba(255, 107, 53, 0.25);
  color: var(--app-warn-dark);
  font-size: 13px;
  line-height: 1.5;
}

.login-btn {
  width: 100%;
  height: 48px;
  margin-top: 6px;
  border: none;
  border-radius: 12px;
  background: var(--app-btn-gradient);
  color: #ffffff;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 1px;
  box-shadow: var(--app-btn-shadow);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: transform 0.15s ease, opacity 0.15s ease, box-shadow 0.15s ease;
}

.login-btn:not(.login-btn--disabled):not(.login-btn--loading):hover {
  box-shadow: 0 8px 24px rgba(40, 180, 70, 0.34);
}

.login-btn:not(.login-btn--disabled):not(.login-btn--loading):active {
  transform: scale(0.97);
  opacity: 0.92;
}

.login-btn--disabled {
  background: var(--app-btn-disabled);
  box-shadow: none;
  cursor: not-allowed;
  opacity: 1;
}

.login-btn--loading {
  cursor: wait;
  opacity: 0.92;
}

.login-btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (min-width: 768px) {
  .login-page {
    align-items: center;
    padding-top: 24px;
    padding-bottom: 24px;
  }

  .login-shell {
    max-width: 420px;
  }

  .login-hero {
    border-radius: var(--app-card-radius) var(--app-card-radius) 0 0;
  }
}
</style>
