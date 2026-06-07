<template>
  <div>
    <div class="toolbar">
      <h2>农业资讯</h2>
      <el-button type="primary" @click="openDialog()">发布资讯</el-button>
    </div>
    <el-table :data="list" border>
      <el-table-column prop="title" label="标题" />
      <el-table-column prop="source" label="来源" width="120" />
      <el-table-column prop="status" label="状态" width="100" />
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button link @click="openDialog(row)">编辑</el-button>
          <el-button link type="danger" @click="remove(row._id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-dialog v-model="visible" title="资讯编辑" width="600px">
      <el-form label-width="80px">
        <el-form-item label="标题"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="来源"><el-input v-model="form.source" /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status"><el-option label="已发布" value="published" /><el-option label="草稿" value="draft" /></el-select>
        </el-form-item>
        <el-form-item label="内容"><el-input v-model="form.content" type="textarea" :rows="6" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible=false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { callAdmin } from '../api/request'
const list = ref([])
const visible = ref(false)
const form = reactive({ _id: null, title: '', content: '', source: '农业资讯', status: 'published' })
async function load() { list.value = await callAdmin('listNews') }
function openDialog(row) {
  Object.assign(form, row || { _id: null, title: '', content: '', source: '农业资讯', status: 'published' })
  visible.value = true
}
async function save() {
  await callAdmin('saveNews', { ...form })
  visible.value = false
  load()
}
async function remove(id) { await callAdmin('deleteNews', { id }); load() }
onMounted(load)
</script>

<style scoped>
.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
</style>
