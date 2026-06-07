# 云函数部署说明

## 报错 Cannot find module 'wx-server-sdk' 的解决办法

已在本地执行 `npm install`，每个云函数目录下应有 `node_modules` 文件夹。

### 请重新上传（二选一）

**方式 A（推荐）：云端安装依赖**
1. 右键 `cloudfunctions/api`
2. 选择 **「上传并部署：云端安装依赖」**
3. 对 `admin`、`init-db` 重复同样操作

**方式 B：上传全部文件（含 node_modules）**
1. 右键 `cloudfunctions/api`
2. 选择 **「上传并部署：所有文件」**
3. 对 `admin`、`init-db` 重复同样操作

⚠️ 不要选「上传并部署：仅上传文件」或不带依赖的选项。

### 上传前确认每个云函数目录包含
- index.js
- package.json
- node_modules/（本地 npm install 后生成）

### 验证
云开发控制台 → 云函数 → api → 日志，调用应不再报 wx-server-sdk 缺失。
