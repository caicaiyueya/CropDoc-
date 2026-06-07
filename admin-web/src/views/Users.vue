<template>
  <div>
    <h2>用户管理</h2>
    <el-table :data="list" border style="margin-top:16px">
      <el-table-column prop="_id" label="ID" width="220" />
      <el-table-column prop="nickname" label="昵称" />
      <el-table-column prop="phone" label="手机号" />
      <el-table-column prop="status" label="状态" width="100" />
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button v-if="row.status==='active'" link type="danger" @click="setStatus(row._id,'disabled')">禁用</el-button>
          <el-button v-else link type="success" @click="setStatus(row._id,'active')">启用</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { callAdmin } from '../api/request'
const list = ref([])
async function load() { list.value = await callAdmin('listUsers') }
async function setStatus(id, status) {
  await callAdmin('updateUserStatus', { id, status })
  load()
}
onMounted(load)
</script>
