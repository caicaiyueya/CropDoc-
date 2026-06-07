<template>
  <el-container class="layout">
    <el-aside width="240px" class="aside">
      <div class="brand">
        <div class="brand-pattern"></div>
        <div class="brand-gradient"></div>
        <div class="brand-inner">
          <BrandLogo size="sm" />
          <div class="brand-text">
            <div class="brand-title">云农智诊</div>
            <div class="brand-sub">AI助力智慧农业</div>
          </div>
        </div>
      </div>
      <div class="brand-wave"></div>

      <nav class="side-nav">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ 'nav-item--active': isActive(item.path), 'nav-item--hot': item.hot }"
        >
          <span class="nav-item-indicator"></span>
          <NavIcon :name="item.icon" />
          <span class="nav-item-label">{{ item.label }}</span>
          <span v-if="item.badgeKey && badgeCounts[item.badgeKey]" class="nav-badge">
            {{ badgeCounts[item.badgeKey] > 99 ? '99+' : badgeCounts[item.badgeKey] }}
          </span>
        </router-link>
      </nav>
    </el-aside>

    <el-container class="main-wrap" direction="vertical">
      <el-header class="app-header" height="auto">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentTitle">{{ currentTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <div class="header-title">运营管理后台</div>
          <button type="button" class="logout-btn" @click="logout">退出登录</button>
        </div>
      </el-header>

      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="page-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NavIcon from '../components/NavIcon.vue'
import BrandLogo from '../components/BrandLogo.vue'
import { callAdmin } from '../api/request'

const router = useRouter()
const route = useRoute()

const badgeCounts = ref({ pending: 0 })

const navItems = [
  { path: '/dashboard', icon: 'dashboard', label: '数据概览', hot: true },
  { path: '/banners', icon: 'banners', label: '轮播公告' },
  { path: '/news', icon: 'news', label: '农业资讯' },
  { path: '/diseases', icon: 'diseases', label: '官方病害库' },
  { path: '/posts', icon: 'posts', label: '社区审核', hot: true, badgeKey: 'pending' },
  { path: '/users', icon: 'users', label: '用户管理' }
]

const currentTitle = computed(() => route.meta?.title || '')

function isActive(path) {
  return route.path === path
}

function logout() {
  localStorage.removeItem('admin_token')
  router.push('/login')
}

async function loadBadge() {
  try {
    const data = await callAdmin('dashboard')
    badgeCounts.value.pending = data.pendingPostCount || 0
  } catch {
    badgeCounts.value.pending = 0
  }
}

onMounted(loadBadge)
</script>

<style scoped>
.layout {
  min-height: 100vh;
  background: var(--app-bg);
}

.aside {
  background: #ffffff;
  border-right: 1px solid #eef2ee;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
}

.brand {
  position: relative;
  overflow: hidden;
  min-height: 112px;
}

.brand-pattern {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 22% 88%, rgba(200, 245, 200, 0.45) 0%, transparent 48%),
    radial-gradient(circle at 82% 10%, rgba(255, 255, 255, 0.22) 0%, transparent 42%),
    linear-gradient(155deg, #3cb85e 0%, #48c96a 42%, #5ed47e 100%);
}

.brand-gradient {
  position: absolute;
  inset: 0;
  background: var(--app-hero-gradient);
}

.brand-inner {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 28px 20px 32px;
}

.brand-inner :deep(.brand-logo) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.brand-title {
  color: #ffffff;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 2px;
  line-height: 1.35;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.brand-sub {
  margin-top: 4px;
  color: rgba(255, 255, 255, 0.88);
  font-size: 12px;
  letter-spacing: 0.5px;
}

.brand-wave {
  height: 16px;
  margin-top: -1px;
  background: #ffffff;
  border-radius: 50% 50% 0 0 / 100% 100% 0 0;
  position: relative;
  z-index: 1;
  flex-shrink: 0;
}

.side-nav {
  flex: 1;
  padding: 10px 12px 24px;
  overflow-y: auto;
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  height: 48px;
  padding: 0 14px;
  margin-bottom: 4px;
  border-radius: 12px;
  color: #5a6d5a;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.2s ease, color 0.2s ease, transform 0.18s ease;
}

.nav-item-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%) scaleY(0);
  width: 4px;
  height: 24px;
  border-radius: 0 4px 4px 0;
  background: var(--app-primary);
  transition: transform 0.2s ease;
}

.nav-item:hover {
  background: #f3faf4;
  color: #3d5a3d;
  transform: translateX(2px);
}

.nav-item--hot:hover {
  background: #e8f5e9;
}

.nav-item--active {
  background: #dff0e3 !important;
  color: var(--app-primary) !important;
  font-weight: 700;
  transform: none;
}

.nav-item--active .nav-item-indicator {
  transform: translateY(-50%) scaleY(1);
}

.nav-item--active :deep(.nav-icon) {
  stroke: var(--app-primary);
}

.nav-item-label {
  flex: 1;
  min-width: 0;
}

.nav-badge {
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  background: #ff6b35;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 20px;
  text-align: center;
}

.main-wrap {
  flex: 1;
  min-width: 0;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 16px 28px !important;
  background: #ffffff;
  border-bottom: 1px solid #eef2ee;
  flex-shrink: 0;
}

.header-left {
  min-width: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.header-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--app-text);
  line-height: 1.4;
}

.logout-btn {
  height: 36px;
  padding: 0 18px;
  border: 1px solid rgba(40, 180, 70, 0.28);
  border-radius: 18px;
  background: #ffffff;
  color: var(--app-primary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease, transform 0.12s ease;
}

.logout-btn:hover {
  background: var(--app-primary-light);
  border-color: var(--app-primary);
}

.logout-btn:active {
  transform: scale(0.97);
}

.main-content {
  flex: 1;
  padding: 24px 28px 32px;
  overflow: auto;
}

:deep(.el-breadcrumb__inner) {
  font-weight: 500;
  color: var(--app-text-secondary);
}

:deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: var(--app-primary);
  font-weight: 600;
}

.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
