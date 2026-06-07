"""云农智诊 - 云托管 MOCK 识别服务（轻量版，无 PyTorch 依赖）"""
import json
import os
from pathlib import Path

import requests
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

MOCK_MODE = os.getenv("MOCK_MODE", "true").lower() == "true"
MAP_PATH = Path(__file__).parent / "disease-class-map.json"

app = FastAPI(title="云农智诊 AI 识别服务(云托管)")

with open(MAP_PATH, "r", encoding="utf-8") as f:
    CLASS_MAP = json.load(f)["classes"]

crop_classes: dict[str, list[str]] = {}
for key in CLASS_MAP:
    crop = key.split("__")[0]
    crop_classes.setdefault(crop, []).append(key)


class PredictRequest(BaseModel):
    image_url: str
    crop: str | None = None


def predict_mock(crop: str | None) -> tuple[str, float]:
    if crop and crop in crop_classes:
        candidates = [c for c in crop_classes[crop] if "healthy" not in c.lower()]
        if candidates:
            return candidates[0], 0.76
        return crop_classes[crop][0], 0.65
    return "Wheat__yellow_rust", 0.75


@app.get("/health")
def health():
    return {"status": "ok", "mock": MOCK_MODE, "classes": len(CLASS_MAP)}


@app.post("/predict")
def predict(req: PredictRequest):
    if req.image_url.startswith("http"):
        try:
            requests.get(req.image_url, timeout=10)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"无法访问图片: {e}")

    disease_key, confidence = predict_mock(req.crop)
    return {
        "disease_key": disease_key,
        "confidence": round(confidence, 4),
        "crop_filter": req.crop,
        "mock": True
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=80)
