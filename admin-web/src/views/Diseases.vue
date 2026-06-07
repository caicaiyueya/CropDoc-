<template>
  <div class="page-panel">
    <div class="page-toolbar">
      <h2 class="page-title">官方病害库</h2>
      <el-button type="primary" @click="openDialog()">新增病害</el-button>
    </div>
    <el-table :data="list">
      <el-table-column prop="nameCn" label="病害名称" />
      <el-table-column prop="cropCn" label="作物" width="100" />
      <el-table-column prop="diseaseKey" label="模型Key" width="220" />
      <el-table-column label="推荐" width="80">
        <template #default="{ row }">{{ row.recommend ? '是' : '否' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button link @click="openDialog(row)">编辑</el-button>
          <el-button link type="danger" @click="remove(row._id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-dialog v-model="visible" title="病害编辑" width="600px">
      <el-form label-width="100px">
        <el-form-item label="模型Key"><el-input v-model="form.diseaseKey" /></el-form-item>
        <el-form-item label="作物Key"><el-input v-model="form.crop" /></el-form-item>
        <el-form-item label="作物中文"><el-input v-model="form.cropCn" /></el-form-item>
        <el-form-item label="病害中文"><el-input v-model="form.nameCn" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" /></el-form-item>
        <el-form-item label="首页推荐"><el-switch v-model="form.recommend" /></el-form-item>
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
const form = reactive({ _id: null, diseaseKey: '', crop: '', cropCn: '', nameCn: '', description: '', recommend: false })
async function load() { list.value = await callAdmin('listDiseases') }
function openDialog(row) {
  Object.assign(form, row || { _id: null, diseaseKey: '', crop: '', cropCn: '', nameCn: '', description: '', recommend: false })
  visible.value = true
}
async function save() {
  await callAdmin('saveDisease', { ...form })
  visible.value = false
  load()
}
async function remove(id) { await callAdmin('deleteDisease', { id }); load() }
onMounted(load)
</script>
