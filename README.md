# 云农智诊 - 智慧农业微信小程序

课程设计项目：基于 NFNet-F1 植物病害识别 + DeepSeek 智能诊断 + 农友交流社区。

采用**微信云开发**架构：云函数 + 云数据库 + 云存储 + 云托管。

## 项目结构

```
AWeixin/
├── miniprogram/       # 微信小程序（用户端 + 云函数）
├── admin-web/         # Vue3 管理后台
├── cloudcontainer/    # 云托管 MOCK 识别服务
├── docs/              # 文档说明
└── README-cloud.md    # 部署指南（必读）
```

## 技术栈

| 模块 | 技术 |
|------|------|
| 用户端 | 微信小程序 + 云开发 |
| 管理端 | Vue 3 + Element Plus + Vite |
| 业务逻辑 | 云函数（Node.js） |
| 数据库 | 云数据库（NoSQL） |
| 识别 | 云托管 FastAPI（MOCK / NFNet） |
| 大模型 | DeepSeek API（云函数调用） |

## 快速启动

完整步骤见 **[README-cloud.md](./README-cloud.md)**，简要流程：

1. 微信开发者工具打开 `miniprogram`，开通云开发
2. 修改 `miniprogram/utils/config.js` 中的 `cloudEnvId`
3. 上传云函数 `api`、`admin`、`init-db`、`cron-news`
4. 运行 `init-db` 初始化数据
5. 编译运行小程序

管理后台：

```bash
cd admin-web
npm install
# 配置 .env.local 中的 VITE_CLOUD_HTTP_BASE（admin 云函数 HTTP 地址）
npm run dev
```

默认管理账号：`admin` / `admin123`

## 功能模块

- **首页**：Banner、四宫格、常见病害、农业资讯
- **病虫害识别**：23 种作物、拍照/相册、AI 识别（MOCK/云托管）
- **智能诊断**：识别后自动诊断 + DeepSeek 多轮问答
- **农友交流**：发帖、评论、收藏、审核
- **个人中心**：诊断历史、收藏、反馈
- **管理后台**：公告、资讯、官方病害库、社区审核、用户管理

## 许可说明

NFNet-F1 模型遵循 CC BY-NC-SA 4.0，商用前请确认授权。本系统识别结果仅供参考。
