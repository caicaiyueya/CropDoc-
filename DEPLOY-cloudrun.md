# 云托管 NFNet-F1 识别服务 — 部署清单（修订版）

> 若之前部署失败，请**先读「失败排查」**，再按 **MOCK → 正式** 两阶段部署。

---

## 失败排查（先看这里）

| 现象 | 最常见原因 | 处理 |
|------|-----------|------|
| 构建失败 `requirements-mock.txt not found` | MOCK zip 内只有 `requirements.txt` | 重新运行打包脚本，使用最新 `ai-service-mock.zip` |
| 构建失败 `pip 403` / `tuna.tsinghua` | 镜像源被拦截 | 使用最新 `ai-service.zip`（已改官方 PyPI + CPU 版 PyTorch） |
| 构建卡在 `download_model` | 旧 zip 在构建阶段下载模型 | 最新 zip **构建时不下载模型** |
| 构建失败 / 镜像 1.6GB OOM | timm 从 PyPI 重装 CUDA 版 torch | 已修复：`timm --no-deps` |
| 部署成功但 `-501000 SERVICE_VERSION_NOT_FOUND` | 版本未**全量发布**或服务名不对 | 控制台 → 全量发布；服务名必须 `ai-service` |
| `/health` 正常但识别失败 | `model_ready: false` | 首次启动等 5–15 分钟下载模型；看运行日志 |
| 云函数报「识别服务错误」 | `api` 未部署或 `MOCK_DETECT=true` | 云端设 `MOCK_DETECT=false` 并重新上传 `api` |
| MOCK 版也起不来 | 旧版 `Dockerfile.mock` 缺依赖 | 使用最新 `ai-service-mock.zip` |

---

## 第一步：重新打包（必做）

在项目根目录执行：

```bat
cloudcontainer\deploy-cloudcontainer.bat
```

或 PowerShell：

```powershell
cloudcontainer\deploy-cloudcontainer.ps1
```

会生成两个文件：

| 文件 | 用途 |
|------|------|
| `cloudcontainer/ai-service-mock.zip` | **先部署这个**，1–2 分钟构建，验证链路 |
| `cloudcontainer/ai-service.zip` | MOCK 通过后再部署，真实 NFNet-F1 |

zip 根目录结构（必须 flat，无子文件夹）：

```
Dockerfile
app.py
requirements.txt
download_model.py
disease-class-map.json
```

---

## 第二步：阶段 A — 部署 MOCK 版（强烈建议）

1. 云开发 → **云托管** → 服务 `ai-service`（没有则新建，名称必须一致）
2. **部署发布** → **新建版本** → 上传 `ai-service-mock.zip`
3. 配置：

| 项 | 值 |
|----|-----|
| 端口 | `80` |
| CPU | `0.5` 或 `1` 核 |
| 内存 | `1` GB 即可 |
| 最小实例 | `1` |

4. 环境变量：`MOCK_MODE=true`（zip 内 Dockerfile 已默认，可再确认）
5. 点击 **部署** → 等待构建完成 → **全量发布**
6. 云端调试：`GET /health` 应返回 `"mock": true, "model_ready": true`

### 验证云函数链路

云函数 `api` 环境变量（可先保持 MOCK 识别逻辑，只测 callContainer）：

```
MOCK_DETECT=false
INFERENCE_MODE=cloud_run
CLOUD_RUN_SERVICE=ai-service
```

上传 `api` 后，云函数测试：

```json
{ "action": "detectHealth" }
```

期望：`mode: "cloud_run"` 且 `health.mock: true`。

MOCK 版 `/predict` 也会返回模拟病害结果，可在小程序识别页联调。

---

## 第三步：阶段 B — 部署正式 NFNet 版

MOCK 链路打通后：

1. 同一服务 `ai-service` → **新建版本**
2. 上传 `ai-service.zip`（正式 Dockerfile）
3. 配置：

| 项 | 值 |
|----|-----|
| 端口 | `80` |
| CPU | `2` 核 |
| 内存 | **`4` GB**（低于 4G 易 OOM） |
| 最小实例 | `1`（减少冷启动） |

4. 环境变量：

| 变量 | 值 |
|------|-----|
| `MOCK_MODE` | `false` |
| `TORCH_NUM_THREADS` | `2` |
| `HF_ENDPOINT` | `https://hf-mirror.com` |
| `HF_MODEL_ID` | `Arko007/nfnet-f1-plant-disease` |

5. **部署** → **全量发布**
6. 构建约 **8–15 分钟**（仅装 PyTorch 依赖，不下载模型）
7. 首次启动后访问 `/health`，等待 `model_ready: true`（还需 **5–15 分钟** 下载模型）

期望 `/health`：

```json
{
  "status": "ok",
  "mock": false,
  "model_ready": true,
  "model_loading": false,
  "classes": 88
}
```

若 `model_ready: false`，查看 **运行日志** 是否有 `[model] downloading` 或 `model_error`。

---

## 第四步：配置云函数 api

云开发控制台 → 云函数 → `api` → 环境变量：

| 变量 | 值 |
|------|-----|
| `MOCK_DETECT` | `false` |
| `INFERENCE_MODE` | `cloud_run` |
| `CLOUD_RUN_SERVICE` | `ai-service` |

微信开发者工具 → 右键 `cloudfunctions/api` → **上传并部署：所有文件**

---

## 第五步：小程序联调

1. 识别 Tab → 选作物 → 拍照 → 开始识别
2. 结果页 `inferenceMock` 应为 `false`（正式版）
3. 若提示「模型正在加载」，等 1–3 分钟后重试

---

## 常见问题

### 1. 必须「全量发布」

仅「部署成功」不够，版本状态需为 **运行中**，否则云函数 `callContainer` 报 `-501000`。

### 2. 服务名必须一致

云托管服务名、`CLOUD_RUN_SERVICE`、云函数 header `X-WX-SERVICE` 均为 **`ai-service`**。

### 3. 正式版内存

NFNet-F1 加载建议 **4GB**；若 OOM，升至 6GB 并重建版本。

### 4. 本地开发

本地 `config.json` 可保持 `MOCK_DETECT=true`；**云端控制台**单独设为 `false`。

---

## 架构

```
识别页 → 云函数 api (detect)
  → getTempFileURL
  → callContainer → ai-service /predict
  → NFNet-F1 推理
```

模型：[Arko007/nfnet-f1-plant-disease](https://huggingface.co/Arko007/nfnet-f1-plant-disease)
