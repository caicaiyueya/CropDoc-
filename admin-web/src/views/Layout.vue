<template>
  <el-container class="layout">
    <el-aside width="220px" class="aside">
      <div class="logo">云农智诊</div>
      <el-menu router :default-active="$route.path" background-color="#1b4332" text-color="#fff">
        <el-menu-item index="/dashboard">仪表盘</el-menu-item>
        <el-menu-item index="/banners">轮播公告</el-menu-item>
        <el-menu-item index="/news">农业资讯</el-menu-item>
        <el-menu-item index="/diseases">官方病害库</el-menu-item>
        <el-menu-item index="/posts">社区审核</el-menu-item>
        <el-menu-item index="/users">用户管理</el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <span>智慧农业管理后台</span>
        <el-button link @click="logout">退出</el-button>
      </el-header>
      <el-main><router-view /></el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
function logout() {
  localStorage.removeItem('admin_token')
  router.push('/login')
}
</script>

<style scoped>
.layout { min-height: 100vh; }
.aside { background: #1b4332; }
.logo { color: #fff; font-size: 20px; font-weight: bold; padding: 20px; text-align: center; }
.header { display: flex; justify-content: space-between; align-items: center; background: #fff; border-bottom: 1px solid #eee; }
</style>
