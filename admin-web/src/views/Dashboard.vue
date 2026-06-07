<template>
  <div class="dashboard">
    <div class="page-panel">
      <h2 class="page-title">数据概览</h2>
      <p class="page-desc">与小程序共用云数据库，数据实时同步</p>

      <el-row :gutter="20" class="stat-row">
        <el-col v-for="card in statCards" :key="card.key" :xs="24" :sm="12" :md="6">
          <button
            type="button"
            class="stat-card"
            :class="[
              card.variant ? `stat-card--${card.variant}` : '',
              card.link ? 'stat-card--clickable' : 'stat-card--static'
            ]"
            @click="go(card.link)"
          >
            <div class="stat-card-top">
              <NavIcon :name="card.icon" />
              <span v-if="card.badge" class="stat-alert-dot" :title="card.badgeTitle"></span>
            </div>
            <div class="stat-value" :class="{ 'stat-value--warn': card.variant === 'warn' }">
              {{ card.value }}
            </div>
            <div class="stat-label">{{ card.label }}</div>
            <div class="stat-trend" :class="`stat-trend--${card.trendDir}`">
              {{ card.trendText }}
            </div>
          </button>
        </el-col>
      </el-row>
    </div>

    <div class="page-panel quick-panel">
      <h3 class="section-heading">快捷操作</h3>
      <p class="section-desc">常用管理入口，减少跳转步骤</p>
      <div class="quick-actions">
        <button
          v-for="action in quickActions"
          :key="action.path"
          type="button"
          class="quick-btn"
          :class="{ 'quick-btn--alert': action.alert && stats.pendingPostCount > 0 }"
          @click="go(action.path)"
        >
          <NavIcon :name="action.icon" />
          <span>{{ action.label }}</span>
          <span v-if="action.alert && stats.pendingPostCount > 0" class="quick-alert">
            {{ stats.pendingPostCount }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import NavIcon from '../components/NavIcon.vue'
import { callAdmin } from '../api/request'

const router = useRouter()
const stats = ref({})
const trends = ref({})

function formatTrend(item, fallback) {
  if (!item) return fallback
  if (item.text) return `较上周 ${item.text}`
  return fallback
}

const statCards = computed(() => {
  const pending = stats.value.pendingPostCount || 0
  return [
    {
      key: 'users',
      icon: 'users',
      value: stats.value.userCount || 0,
      label: '注册用户',
      trendText: formatTrend(trends.value.users, '较上周 —'),
      trendDir: trends.value.users?.dir || 'flat',
      link: '/users'
    },
    {
      key: 'detects',
      icon: 'detect',
      value: stats.value.detectCount ?? stats.value.todayDetectCount ?? 0,
      label: '识别记录',
      trendText: formatTrend(trends.value.detects, '较上周 —'),
      trendDir: trends.value.detects?.dir || 'flat',
      link: null
    },
    {
      key: 'pending',
      icon: 'posts',
      value: pending,
      label: '待审帖子',
      variant: pending > 0 ? 'warn' : '',
      badge: pending > 0,
      badgeTitle: '有待审内容需处理',
      trendText: pending > 0 ? '需尽快处理' : '暂无待审',
      trendDir: pending > 0 ? 'alert' : 'flat',
      link: '/posts'
    },
    {
      key: 'news',
      icon: 'news',
      value: stats.value.newsCount || 0,
      label: '资讯数量',
      trendText: '内容运营数据',
      trendDir: 'flat',
      link: '/news'
    }
  ]
})

const quickActions = [
  { path: '/posts', icon: 'posts', label: '待审帖子处理', alert: true },
  { path: '/users', icon: 'users', label: '用户管理' },
  { path: '/news', icon: 'news', label: '发布资讯' },
  { path: '/banners', icon: 'banners', label: '轮播公告' }
]

function go(path) {
  if (path) router.push(path)
}

onMounted(async () => {
  const data = await callAdmin('dashboard')
  stats.value = data
  trends.value = data.trends || {}
})
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-desc {
  margin: 8px 0 24px;
  color: var(--app-text-secondary);
  font-size: 14px;
}

.stat-row {
  margin-top: 4px;
}

.stat-card {
  width: 100%;
  text-align: left;
  background: #ffffff;
  border: 1px solid var(--app-border);
  border-radius: 16px;
  padding: 22px 20px 18px;
  margin-bottom: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.stat-card--static {
  cursor: default;
}

.stat-card--static:hover {
  transform: none;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  border-color: var(--app-border);
}

.stat-card--clickable {
  cursor: pointer;
}

.stat-card--clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(40, 180, 70, 0.12);
  border-color: rgba(40, 180, 70, 0.22);
}

.stat-card--clickable:active {
  transform: translateY(0) scale(0.99);
}

.stat-card--warn {
  border-color: rgba(255, 107, 53, 0.22);
  background: linear-gradient(145deg, #ffffff, #fff8f5);
}

.stat-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  color: var(--app-primary);
}

.stat-card-top :deep(.nav-icon) {
  width: 24px;
  height: 24px;
}

.stat-alert-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ff6b35;
  box-shadow: 0 0 0 4px rgba(255, 107, 53, 0.18);
}

.stat-value {
  font-size: 34px;
  font-weight: 700;
  color: #1a9638;
  line-height: 1.15;
}

.stat-value--warn {
  color: #e65100;
}

.stat-label {
  margin-top: 8px;
  font-size: 14px;
  color: var(--app-text-secondary);
}

.stat-trend {
  margin-top: 10px;
  font-size: 12px;
  color: #999999;
}

.stat-trend--up {
  color: #28b446;
}

.stat-trend--down {
  color: #e65100;
}

.stat-trend--alert {
  color: #ff6b35;
  font-weight: 600;
}

.section-heading {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--app-primary);
}

.section-desc {
  margin: 8px 0 20px;
  font-size: 13px;
  color: var(--app-text-secondary);
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 14px;
}

.quick-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 52px;
  padding: 0 16px;
  border: 1px solid var(--app-border);
  border-radius: 14px;
  background: #ffffff;
  color: var(--app-text);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
  transition: background 0.18s ease, border-color 0.18s ease, transform 0.12s ease;
}

.quick-btn :deep(.nav-icon) {
  width: 20px;
  height: 20px;
  color: var(--app-primary);
}

.quick-btn:hover {
  background: #f3faf4;
  border-color: rgba(40, 180, 70, 0.22);
  transform: translateY(-1px);
}

.quick-btn:active {
  transform: scale(0.98);
}

.quick-btn--alert {
  border-color: rgba(255, 107, 53, 0.25);
}

.quick-alert {
  margin-left: auto;
  min-width: 22px;
  height: 22px;
  padding: 0 7px;
  border-radius: 11px;
  background: #ff6b35;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  line-height: 22px;
  text-align: center;
}
</style>
