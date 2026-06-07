FROM python:3.10-slim-bookworm

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# 1) 先装 CPU 版 PyTorch，避免 timm 从 PyPI 拉 CUDA 版导致构建失败
# 2) timm 使用 --no-deps，防止覆盖已安装的 torch
RUN pip install --upgrade pip setuptools wheel \
    && pip install --no-cache-dir \
        torch==2.2.2+cpu torchvision==0.17.2+cpu \
        --index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir "numpy>=1.24.0,<2.0.0" \
    && pip install --no-cache-dir \
        fastapi uvicorn requests safetensors huggingface_hub Pillow \
    && pip install --no-cache-dir timm==1.0.3 --no-deps

COPY download_model.py app.py disease-class-map.json ./

ENV HF_MODEL_ID=Arko007/nfnet-f1-plant-disease
ENV HF_ENDPOINT=https://hf-mirror.com
ENV MODEL_DIR=/app/model
ENV MOCK_MODE=false
ENV TORCH_NUM_THREADS=2
ENV PORT=80
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=180s --retries=6 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:80/health')" || exit 1

CMD ["python", "app.py"]
