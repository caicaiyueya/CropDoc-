<template>
  <svg
    class="nav-icon"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <!-- 数据概览：首页四宫格 -->
    <template v-if="name === 'dashboard'">
      <rect x="3" y="3" width="8" height="8" rx="2" stroke="currentColor" stroke-width="1.8" />
      <rect x="13" y="3" width="8" height="8" rx="2" stroke="currentColor" stroke-width="1.8" />
      <rect x="3" y="13" width="8" height="8" rx="2" stroke="currentColor" stroke-width="1.8" />
      <rect x="13" y="13" width="8" height="8" rx="2" stroke="currentColor" stroke-width="1.8" />
    </template>

    <!-- 轮播公告：图片轮播 -->
    <template v-else-if="name === 'banners'">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.8" />
      <path d="M3 15L8 11L12 14L16 9L21 14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
      <circle cx="8" cy="9" r="1.5" fill="currentColor" />
    </template>

    <!-- 农业资讯：报纸文档 -->
    <template v-else-if="name === 'news'">
      <path d="M6 4H16L20 8V19C20 20.1 19.1 21 18 21H6C4.9 21 4 20.1 4 19V6C4 4.9 4.9 4 6 4Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M16 4V8H20" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M8 12H16M8 16H13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
    </template>

    <!-- 官方病害库：叶片 -->
    <template v-else-if="name === 'diseases'">
      <path
        d="M12 21C7.5 17.5 5 14 5 10C5 7.2 7.2 5.5 9.5 5.5C10.8 5.5 11.8 6 12 6.8C12.2 6 13.2 5.5 14.5 5.5C16.8 5.5 19 7.2 19 10C19 14 16.5 17.5 12 21Z"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linejoin="round"
      />
      <path d="M12 8.5V16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
    </template>

    <!-- 识别记录：相机 -->
    <template v-else-if="name === 'detect'">
      <path d="M5 8.5H8L9.5 6.5H14.5L16 8.5H19C20.1 8.5 21 9.4 21 10.5V17.5C21 18.6 20.1 19.5 19 19.5H5C3.9 19.5 3 18.6 3 17.5V10.5C3 9.4 3.9 8.5 5 8.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
      <circle cx="12" cy="14" r="3.5" stroke="currentColor" stroke-width="1.8" />
    </template>

    <!-- 社区审核：对话气泡（农友交流） -->
    <template v-else-if="name === 'posts'">
      <path d="M5 5H17C18.1 5 19 5.9 19 7V13C19 14.1 18.1 15 17 15H10L6 18V15H5C3.9 15 3 14.1 3 13V7C3 5.9 3.9 5 5 5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
      <circle cx="8.5" cy="10" r="1" fill="currentColor" />
      <circle cx="12" cy="10" r="1" fill="currentColor" />
      <circle cx="15.5" cy="10" r="1" fill="currentColor" />
    </template>

    <!-- 用户管理：用户头像 -->
    <template v-else-if="name === 'users'">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" stroke-width="1.8" />
      <path d="M5.5 20C5.5 16.5 8.4 14 12 14C15.6 14 18.5 16.5 18.5 20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
    </template>

    <!-- AI 问诊：听诊器 -->
    <template v-else-if="name === 'diagnose'">
      <path d="M6 5V11C6 13.8 8.2 16 11 16H12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
      <path d="M18 5V11C18 13.8 15.8 16 13 16H12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
      <circle cx="12" cy="18.5" r="2.5" stroke="currentColor" stroke-width="1.8" />
      <path d="M12 16V16.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
    </template>

    <!-- 首页：小房子 -->
    <template v-else-if="name === 'home'">
      <path d="M4 11L12 5L20 11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M7 10.5V19H17V10.5" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M10 19V14H14V19" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
    </template>
  </svg>
</template>

<script setup>
defineProps({
  name: { type: String, required: true }
})
</script>

<style scoped>
.nav-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  display: block;
}
</style>
