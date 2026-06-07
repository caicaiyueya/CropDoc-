<template>
  <div>
    <h2>社区审核</h2>
    <el-radio-group v-model="status" @change="load" style="margin: 16px 0">
      <el-radio-button label="pending">待审核</el-radio-button>
      <el-radio-button label="approved">已通过</el-radio-button>
    </el-radio-group>
    <el-table :data="list" border>
      <el-table-column prop="title" label="标题" />
      <el-table-column prop="postType" label="类型" width="100" />
      <el-table-column prop="content" label="内容" show-overflow-tooltip />
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button v-if="row.status==='pending'" link type="success" @click="audit(row._id,'approved')">通过</el-button>
          <el-button v-if="row.status==='pending'" link type="danger" @click="audit(row._id,'rejected')">驳回</el-button>
          <el-button link type="danger" @click="remove(row._id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { callAdmin } from '../api/request'
const status = ref('pending')
const list = ref([])
async function load() {
  list.value = await callAdmin('listPosts', { status: status.value })
}
async function audit(id, s) {
  await callAdmin('auditPost', { id, status: s })
  load()
}
async function remove(id) { await callAdmin('deletePost', { id }); load() }
onMounted(load)
</script>
