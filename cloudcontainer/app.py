"""云农智诊 - NFNet-F1 病虫害识别服务（云托管）"""
import io
import json
import logging
import os
import threading
from contextlib import asynccontextmanager
from pathlib import Path

import requests
import uvicorn
from fastapi import FastAPI, HTTPException
from PIL import Image
from pydantic import BaseModel

from download_model import ensure_model_download, model_files_ready

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai-service")

MODEL_DIR = Path(os.getenv("MODEL_DIR", "/app/model"))
MOCK_MODE = os.getenv("MOCK_MODE", "false").lower() == "true"
MAP_PATH = Path(__file__).parent / "disease-class-map.json"

_model = None
_transform = None
_class_names: list[str] = []
_model_ready = False
_model_loading = False
_model_error: str | None = None
_model_lock = threading.Lock()

torch = None
timm = None
load_file = None
transforms = None

with open(MAP_PATH, "r", encoding="utf-8") as f:
    CLASS_MAP = json.load(f)["classes"]

crop_classes: dict[str, list[str]] = {}
for key in CLASS_MAP:
    crop = key.split("__")[0]
    crop_classes.setdefault(crop, []).append(key)


class PredictRequest(BaseModel):
    image_url: str
    crop: str | None = None


def _ensure_ml_libs() -> None:
    global torch, timm, load_file, transforms
    if torch is not None:
        return
    import torch as _torch
    import timm as _timm
    from safetensors.torch import load_file as _load_file
    from torchvision import transforms as _transforms

    torch = _torch
    timm = _timm
    load_file = _load_file
    transforms = _transforms


def load_model() -> None:
    global _model, _transform, _class_names, _model_ready, _model_error, _model_loading

    if MOCK_MODE or _model_ready or _model is not None:
        return
    if _model_error:
        raise RuntimeError(_model_error)

    with _model_lock:
        if _model_ready or _model is not None:
            return

        _model_loading = True
        config_path = MODEL_DIR / "config.json"
        weights_path = MODEL_DIR / "model.safetensors"

        if not config_path.exists() or not weights_path.exists():
            _model_error = f"模型文件缺失，请检查 {MODEL_DIR}"
            _model_loading = False
            raise RuntimeError(_model_error)

        try:
            _ensure_ml_libs()
            with open(config_path, "r", encoding="utf-8") as f:
                config = json.load(f)

            _class_names = config["class_names"]
            img_size = config["input_size"]
            mean = config["normalization"]["mean"]
            std = config["normalization"]["std"]

            _transform = transforms.Compose([
                transforms.Resize((img_size, img_size)),
                transforms.ToTensor(),
                transforms.Normalize(mean=mean, std=std),
            ])

            logger.info("Loading NFNet-F1 from %s", MODEL_DIR)
            model = timm.create_model(
                config["architecture"],
                pretrained=False,
                num_classes=len(_class_names),
            )
            state_dict = load_file(str(weights_path))
            model.load_state_dict(state_dict)
            model.eval()
            torch.set_grad_enabled(False)
            torch.set_num_threads(max(1, int(os.getenv("TORCH_NUM_THREADS", "2"))))

            _model = model
            _model_ready = True
            _model_error = None
            logger.info("NFNet-F1 loaded, classes=%d", len(_class_names))
        except Exception as exc:
            _model_error = str(exc)
            logger.exception("Model load failed")
            raise
        finally:
            _model_loading = False


def prepare_model_background() -> None:
    global _model_error
    if MOCK_MODE or _model_ready:
        return
    try:
        logger.info("Background model prepare started")
        if not model_files_ready():
            logger.info("Downloading model to %s ...", MODEL_DIR)
            ensure_model_download()
        load_model()
        logger.info("Background model prepare finished")
    except Exception as exc:
        _model_error = str(exc)
        logger.exception("Background model prepare failed: %s", exc)


def ensure_model_ready() -> None:
    if MOCK_MODE:
        return
    if _model_ready:
        return
    if _model_loading:
        raise HTTPException(
            status_code=503,
            detail="模型正在加载中，请 1–3 分钟后重试 /health 查看 model_ready",
        )
    if not model_files_ready():
        ensure_model_download()
    load_model()


def predict_mock(crop: str | None) -> tuple[str, float]:
    if crop and crop in crop_classes:
        candidates = [c for c in crop_classes[crop] if "healthy" not in c.lower()]
        if candidates:
            return candidates[0], 0.76
        return crop_classes[crop][0], 0.65
    return "Wheat__yellow_rust", 0.75


def download_image(image_url: str) -> Image.Image:
    try:
        resp = requests.get(image_url, timeout=30)
        resp.raise_for_status()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"无法访问图片: {exc}") from exc
    try:
        return Image.open(io.BytesIO(resp.content)).convert("RGB")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"图片解析失败: {exc}") from exc


def predict_nfnet(image_url: str, crop: str | None) -> tuple[str, float]:
    ensure_model_ready()
    image = download_image(image_url)
    tensor = _transform(image).unsqueeze(0)

    with torch.no_grad():
        logits = _model(tensor)[0]

    if crop:
        crop_prefix = f"{crop}__"
        indices = [i for i, name in enumerate(_class_names) if name.startswith(crop_prefix)]
        if indices:
            masked = torch.full_like(logits, float("-inf"))
            masked[indices] = logits[indices]
            logits = masked

    probs = torch.softmax(logits, dim=0)
    confidence, index = torch.max(probs, dim=0)
    disease_key = _class_names[index.item()]

    if disease_key not in CLASS_MAP:
        logger.warning("Unknown class from model: %s", disease_key)

    return disease_key, float(confidence.item())


@asynccontextmanager
async def lifespan(_: FastAPI):
    if not MOCK_MODE:
        threading.Thread(target=prepare_model_background, daemon=True).start()
    yield


app = FastAPI(title="云农智诊 NFNet-F1 识别服务", lifespan=lifespan)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "mock": MOCK_MODE,
        "model_ready": _model_ready if not MOCK_MODE else True,
        "model_loading": _model_loading,
        "model_dir": str(MODEL_DIR),
        "model_error": _model_error,
        "classes": len(CLASS_MAP),
    }


@app.post("/predict")
def predict(req: PredictRequest):
    if not req.image_url.startswith("http"):
        raise HTTPException(status_code=400, detail="image_url 必须为可访问的 HTTP 地址")

    if MOCK_MODE:
        disease_key, confidence = predict_mock(req.crop)
        return {
            "disease_key": disease_key,
            "confidence": round(confidence, 4),
            "crop_filter": req.crop,
            "mock": True,
        }

    try:
        disease_key, confidence = predict_nfnet(req.image_url, req.crop)
    except HTTPException:
        raise
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Inference failed")
        raise HTTPException(status_code=500, detail=f"模型推理失败: {exc}") from exc

    return {
        "disease_key": disease_key,
        "confidence": round(confidence, 4),
        "crop_filter": req.crop,
        "mock": False,
        "model": "Arko007/nfnet-f1-plant-disease",
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "80")))
