# 云农智诊 — 微信云开发版部署指南

## 架构

```
微信小程序 → 云函数 api（业务逻辑 + DeepSeek）
          → 云数据库（NoSQL）
          → 云存储（图片）
          → 云托管 ai-service（MOCK 识别，可选）

Vue 管理后台 → 云函数 admin（HTTP 访问）
```

## 一、准备工作

1. 注册微信小程序，获取 AppID
2. 用**微信开发者工具**打开 `miniprogram` 目录
3. 点击「云开发」→ 开通环境 → 记下**环境 ID**

## 二、配置环境 ID

编辑 `miniprogram/utils/config.js`：

```javascript
module.exports = {
  cloudEnvId: '你的云环境ID'  // 例如 cloud1-xxx
}
```

## 三、创建云数据库集合

在云开发控制台 → 数据库，创建以下集合：

| 集合 | 说明 |
|------|------|
| users | 用户 |
| admins | 管理员 |
| banners | 轮播 |
| diseases | 官方病害库 |
| news | 资讯 |
| posts | 社区帖子 |
| comments | 评论 |
| detect_records | 识别记录 |
| diagnose_records | 诊断记录 |
| chat_sessions | 聊天会话 |
| chat_messages | 聊天消息 |
| favorites | 收藏 |
| feedbacks | 反馈 |

### 建议索引（控制台 → 索引管理）

| 集合 | 索引字段 |
|------|----------|
| banners | enabled↑, sortOrder↑ |
| diseases | recommend↑ |
| news | status↑, publishTime↓ |
| posts | status↑, pinned↓, createdAt↓ |
| detect_records | openid↑, createdAt↓ |
| comments | postId↑, createdAt↑ |
| favorites | openid↑, createdAt↓ |

## 四、部署云函数

### 4.1 安装依赖（首次或更新后必做）

在项目根目录执行，或双击运行：

```
miniprogram/cloudfunctions/install-deps.bat
```

这会在 `api`、`admin`、`init-db`、`cron-news` 四个目录下安装 `wx-server-sdk`。

### 4.2 上传部署（关键）

在微信开发者工具中：

1. 右键 `cloudfunctions` 文件夹 → **当前环境** → 选择你的云环境
2. 右键各云函数 → **上传并部署：所有文件**（**不要**只用「云端安装依赖」，否则易出现 `Cannot find module 'wx-server-sdk'`）

| 云函数 | 用途 |
|--------|------|
| `api` | 用户端全部业务 |
| `admin` | 管理后台 API |
| `init-db` | 初始化集合 + 种子数据（部署后执行一次） |
| `cron-news` | 每日 6:00 定时抓资讯 |

> 已在 `project.config.json` 中开启 `bigPackageSizeSupport` 和 `ignoreUploadUnusedFiles: false`，确保 `node_modules` 能随云函数一起上传。

### 4.3 初始化数据

小程序启动时会自动调用 `init-db`。也可手动测试：

右键 `init-db` → **云函数测试** → 运行，将自动：

- 尝试创建全部数据库集合
- 写入管理员 `admin` / `admin123`
- 写入推荐病害、资讯、Banner、示例帖子

若仍报 `-502005 collection not exists`，请在云开发控制台 → 数据库 → **手动创建**第三节所列集合后，再运行一次 `init-db`。

### 云函数环境变量（api）

在云开发控制台 → 云函数 → api → 版本与配置 → 环境变量：

| 变量 | 值 | 说明 |
|------|-----|------|
| `MOCK_DETECT` | `true` | `true`=云函数内模拟识别；`false`=调云托管 |
| `DEEPSEEK_API_KEY` | 你的 Key | 不配则用模拟诊断/问答 |
| `CLOUD_RUN_SERVICE` | `ai-service` | 云托管服务名 |

## 五、部署云托管（可选）

默认 `MOCK_DETECT=true` 时**无需部署云托管**即可演示识别。

若要使用云托管 MOCK 服务：

```bash
cd cloudcontainer
# 本地测试
pip install -r requirements.txt
python app.py
```

在微信开发者工具 → 云开发 → 云托管 → 新建服务 `ai-service`：

1. 上传 `cloudcontainer` 目录或构建 Docker 镜像
2. 端口：**80**
3. 规格：0.5核1G 即可（MOCK 版）
4. 部署后将 `api` 云函数环境变量 `MOCK_DETECT` 改为 `false`

## 六、管理后台

### 开启 admin 云函数 HTTP 访问

云开发控制台 → 云函数 → `admin` → **HTTP 访问服务** → 开启

复制 HTTP 访问路径，例如：
`https://xxxx.service.tcloudbase.com/admin`

### 启动管理后台

```bash
cd admin-web
npm install
# 创建 .env.local
echo VITE_CLOUD_HTTP_BASE=https://你的admin云函数HTTP地址 > .env.local
npm run dev
```

访问 http://localhost:5173，账号 `admin` / `admin123`

## 七、小程序调试

1. 修改 `project.config.json` 中的 `appid`
2. 确认 `utils/config.js` 中 `cloudEnvId` 正确
3. 勾选「不校验合法域名」
4. 编译运行

### 演示流程

1. 首页 → 查看 Banner、病害推荐、资讯
2. 识别 → 选作物 → 拍照 → 开始识别（MOCK 返回结果）
3. 结果页 → 立即智能诊断（DeepSeek 或模拟）
4. 诊断页 → AI 问诊聊天
5. 社区 → 发帖（待审核）→ 管理后台审核通过
6. 我的 → 诊断历史

## 八、费用说明

- 开发阶段（未上线）：**免费云环境**
- 识别/诊断演示：在免费额度内通常够用
- DeepSeek API：按实际调用计费（可不配置 Key 用模拟）

## 九、目录说明

```
miniprogram/
  cloudfunctions/api/     # 用户端云函数
  cloudfunctions/admin/   # 管理端云函数
  cloudfunctions/init-db/ # 数据初始化
  cloudfunctions/cron-news/
  pages/                  # 已改为 callApi 调用
cloudcontainer/           # 云托管 MOCK 识别服务
admin-web/                # 已改为 callAdmin 调用
```
