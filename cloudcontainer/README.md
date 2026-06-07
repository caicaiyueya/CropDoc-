# 云托管 NFNet-F1 识别服务

基于 [Arko007/nfnet-f1-plant-disease](https://huggingface.co/Arko007/nfnet-f1-plant-disease) 的 FastAPI 推理服务。

## 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查，含模型加载状态 |
| POST | `/predict` | 识别接口 |

### POST /predict

```json
{
  "image_url": "https://...",
  "crop": "Tomato"
}
```

响应：

```json
{
  "disease_key": "Tomato__late_blight",
  "confidence": 0.9234,
  "crop_filter": "Tomato",
  "mock": false,
  "model": "Arko007/nfnet-f1-plant-disease"
}
```

## 本地运行

```bash
cd cloudcontainer
pip install -r requirements.txt
python download_model.py
set MOCK_MODE=false
python app.py
```

访问 http://localhost:80/health 确认 `model_ready: true`。

## Docker 部署

```bash
docker build -t yunnong-ai-service .
docker run -p 8080:80 -e MOCK_MODE=false yunnong-ai-service
```

## 环境变量

| 变量 | 默认 | 说明 |
|------|------|------|
| `MOCK_MODE` | `false` | `true` 时返回模拟结果 |
| `MODEL_DIR` | `/app/model` | 模型目录 |
| `HF_MODEL_ID` | `Arko007/nfnet-f1-plant-disease` | HuggingFace 模型 ID |
| `TORCH_NUM_THREADS` | `2` | CPU 推理线程数 |
| `PORT` | `80` | 服务端口 |
