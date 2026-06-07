# 云农智诊 — 微信云开发版部署指南

## 架构

```
微信小程序 → 云函数 api（业务逻辑 + DeepSeek AI 问诊）
          → 云数据库（NoSQL）
          → 云存储（图片）
          → 云托管 ai-service（NFNet-F1 真实识别，推荐）
            或 HuggingFace Inference API（轻量备选）

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

在云开发控制台 → 云函数 → api → 版本与配置 → 环境变量。

参考模板：`miniprogram/cloudfunctions/api/env.example.json`

#### 识别（NFNet-F1）

| 变量 | 推荐值 | 说明 |
|------|--------|------|
| `MOCK_DETECT` | `false` | `true`=本地模拟；`false`=真实识别 |
| `INFERENCE_MODE` | `cloud_run` | `cloud_run`=云托管推理；`hf_api`=HuggingFace API |
| `CLOUD_RUN_SERVICE` | `ai-service` | 云托管服务名（`cloud_run` 模式） |
| `HF_API_TOKEN` | 你的 HF Token | `hf_api` 模式必填，在 [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) 申请 |
| `HF_MODEL_ID` | `Arko007/nfnet-f1-plant-disease` | 模型 ID，一般无需修改 |

#### AI 问诊（大模型）

**推荐做法**：编辑 `cloudfunctions/api/lib/llm-config.js`（随代码上传，线上一定生效）：

```javascript
module.exports = {
  MOCK_AI: 'false',
  DEEPSEEK_API_KEY: '你的Key',
  LLM_API_BASE: 'https://tokenhub.tencentmaas.com/v1',
  LLM_MODEL: 'deepseek-v4-pro'
}
```

也可在云开发控制台 → 云函数 `api` → 环境变量中配置（见 `config.cloud.json`）。

| 变量 | 推荐值 | 说明 |
|------|--------|------|
| `LLM_API_BASE` | `https://tokenhub.tencentmaas.com/v1` | 大模型 API 根地址（OpenAI 兼容） |
| `DEEPSEEK_API_KEY` | 你的 Key | 平台颁发的 API Key |
| `LLM_MODEL` | `deepseek-v4-pro` | 模型名称，按平台文档填写 |
| `MOCK_AI` | `false` | 仅 `true` 时强制模拟；缺 Key 会直接报错而非静默 mock |

> 配置优先级：**llm-config.js** > 云控制台环境变量 > config.json  
> 云函数超时已设为 **60 秒**（大模型响应约 7–20 秒）

**修改后必须**：右键 `cloudfunctions/api` → **上传并部署：所有文件**

**自检**：云函数测试 `{ "action": "aiHealth" }`，期望 `mode: "llm"` 且 `connected: true`。

#### 开发调试（无 Key / 未部署模型时）

| 变量 | 值 |
|------|-----|
| `MOCK_DETECT` | `true` |
| `MOCK_AI` | `true` |

## 五、部署真实识别服务（NFNet-F1）

模型来源：[Arko007/nfnet-f1-plant-disease](https://huggingface.co/Arko007/nfnet-f1-plant-disease)（NFNet-F1，88 类作物病害分类）。

### 方案 A：云托管自部署（推荐，稳定）

**完整步骤见：[DEPLOY-cloudrun.md](./DEPLOY-cloudrun.md)**

快速流程：

```bat
cloudcontainer\deploy-cloudcontainer.bat
```

1. 上传生成的 `cloudcontainer/ai-service.zip` 到云托管服务 `ai-service`
2. 端口 **80**，规格 **2核4G**，环境变量 `MOCK_MODE=false`
3. 全量发布版本，确认 `/health` 返回 `model_ready: true`
4. 云函数 `api` 环境变量：`MOCK_DETECT=false`、`INFERENCE_MODE=cloud_run`
5. 重新上传部署云函数 `api`
6. 云函数测试 `{ "action": "detectHealth" }` 验证联调

### 方案 B：HuggingFace Inference API（轻量，无需自建模型服务）

适合无法部署大镜像的场景：

1. 在 HuggingFace 申请 `HF_API_TOKEN`
2. 云函数环境变量：
   - `MOCK_DETECT=false`
   - `INFERENCE_MODE=hf_api`
   - `HF_API_TOKEN=你的Token`

> 免费 API 有冷启动与速率限制，生产环境建议用方案 A。

## 六、管理后台

### 开启 admin 的 HTTP 访问（新版 CloudBase 控制台）

你截图里 **「HTTP API」** 标签下的 curl **就是正确方式**，与旧版「HTTP 访问服务」不同。

#### 第 1 步：获取 API Key

云开发控制台 → **环境配置** → **API Key 管理** → **创建 ApiKey**  
复制生成的 Key（仅服务端使用，不要提交到 Git）。

#### 第 2 步：确认 admin 云函数地址

在 **函数管理** → 右侧 **HTTP API** 标签，把示例里的 `:name` 换成 **`admin`**：

```text
https://cloud1-d1gkunv290a5dc6f4.api.tcloudbasegateway.com/v1/functions/admin
```

（环境 ID 以你控制台显示的为准。）

#### 第 3 步：用 curl 测试登录

```bash
curl -L "https://cloud1-d1gkunv290a5dc6f4.api.tcloudbasegateway.com/v1/functions/admin" ^
  -H "Content-Type: application/json" ^
  -H "Accept: application/json" ^
  -H "Authorization: Bearer 你的ApiKey" ^
  -d "{\"action\":\"login\",\"data\":{\"username\":\"admin\",\"password\":\"admin123\"}}"
```

注意：

- `Authorization` 里填的是 **CloudBase API Key**，不是管理后台登录后的 token
- `-d` 里不能是空 `{}`，要按 admin 云函数格式传 `action` 和 `data`

#### 第 4 步：配置管理后台

复制 `admin-web/.env.example` 为 `.env.local` 并填写：

```env
VITE_CLOUD_HTTP_BASE=https://cloud1-d1gkunv290a5dc6f4.api.tcloudbasegateway.com/v1/functions/admin
VITE_CLOUD_API_KEY=你的ApiKey
```

```bash
cd admin-web
npm install
npm run dev
```

访问 http://localhost:5173 ，账号 `admin` / `admin123`

> 「小程序 / Web / 云函数」标签是 SDK 调用方式；管理后台网页应使用 **HTTP API** 这一栏的地址。

## 七、小程序调试

1. 修改 `project.config.json` 中的 `appid`
2. 确认 `utils/config.js` 中 `cloudEnvId` 正确
3. 勾选「不校验合法域名」
4. 编译运行

### 演示流程

1. 首页 → 查看 Banner、病害推荐、资讯
2. 识别 → 选作物 → 拍照 → 开始识别（NFNet-F1 或 MOCK）
3. 结果页 → 立即智能诊断（配置 `DEEPSEEK_API_KEY` 后走真实 AI）
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
cloudcontainer/           # 云托管 NFNet-F1 识别服务
admin-web/                # 已改为 callAdmin 调用
```
