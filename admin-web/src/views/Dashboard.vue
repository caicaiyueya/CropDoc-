<template>
  <div>
    <h2>数据概览</h2>
    <el-row :gutter="20" style="margin-top:20px">
      <el-col :span="6"><el-card><div class="stat">{{ stats.userCount || 0 }}</div><div>注册用户</div></el-card></el-col>
      <el-col :span="6"><el-card><div class="stat">{{ stats.todayDetectCount || 0 }}</div><div>识别记录</div></el-card></el-col>
      <el-col :span="6"><el-card><div class="stat">{{ stats.pendingPostCount || 0 }}</div><div>待审帖子</div></el-card></el-col>
      <el-col :span="6"><el-card><div class="stat">{{ stats.newsCount || 0 }}</div><div>资讯数量</div></el-card></el-col>
    </el-row>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { callAdmin } from '../api/request'
const stats = ref({})
onMounted(async () => { stats.value = await callAdmin('dashboard') })
</script>

<style scoped>
.stat { font-size: 32px; font-weight: bold; color: #2d6a4f; }
</style>
