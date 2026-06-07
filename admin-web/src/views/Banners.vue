<template>
  <div>
    <div class="toolbar">
      <h2>轮播公告</h2>
      <el-button type="primary" @click="openDialog()">新增</el-button>
    </div>
    <el-table :data="list" border>
      <el-table-column prop="title" label="标题" />
      <el-table-column prop="imageUrl" label="图片" />
      <el-table-column prop="sortOrder" label="排序" width="80" />
      <el-table-column label="启用" width="80">
        <template #default="{ row }">{{ row.enabled ? '是' : '否' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button link @click="openDialog(row)">编辑</el-button>
          <el-button link type="danger" @click="remove(row._id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-dialog v-model="visible" title="轮播配置" width="500px">
      <el-form label-width="80px">
        <el-form-item label="标题"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="图片"><el-input v-model="form.imageUrl" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.sortOrder" /></el-form-item>
        <el-form-item label="启用"><el-switch v-model="form.enabled" /></el-form-item>
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
const form = reactive({ _id: null, title: '', imageUrl: '', sortOrder: 0, enabled: true })
async function load() { list.value = await callAdmin('listBanners') }
function openDialog(row) {
  Object.assign(form, row || { _id: null, title: '', imageUrl: '', sortOrder: 0, enabled: true })
  visible.value = true
}
async function save() {
  await callAdmin('saveBanner', { ...form })
  visible.value = false
  load()
}
async function remove(id) { await callAdmin('deleteBanner', { id }); load() }
onMounted(load)
</script>

<style scoped>
.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
</style>
