"""下载 NFNet-F1 模型权重（容器启动时调用）。"""
import os
import time
from pathlib import Path

MODEL_ID = os.getenv("HF_MODEL_ID", "Arko007/nfnet-f1-plant-disease")
MODEL_DIR = Path(os.getenv("MODEL_DIR", "/app/model"))
MAX_RETRIES = int(os.getenv("HF_DOWNLOAD_RETRIES", "3"))


def _apply_hf_endpoint() -> None:
    endpoint = os.getenv("HF_ENDPOINT", "").strip()
    if endpoint:
        os.environ["HF_ENDPOINT"] = endpoint
        os.environ.setdefault("HUGGINGFACE_HUB_ENDPOINT", endpoint)


def model_files_ready() -> bool:
    return (MODEL_DIR / "config.json").exists() and (MODEL_DIR / "model.safetensors").exists()


def ensure_model_download() -> None:
    if model_files_ready():
        return

    _apply_hf_endpoint()
    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    from huggingface_hub import snapshot_download

    last_error = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            print(f"[model] downloading {MODEL_ID} -> {MODEL_DIR} (attempt {attempt}/{MAX_RETRIES})")
            snapshot_download(
                repo_id=MODEL_ID,
                local_dir=str(MODEL_DIR),
                local_dir_use_symlinks=False,
                resume_download=True,
                max_workers=2,
            )
            if model_files_ready():
                print(f"[model] ready at {MODEL_DIR}")
                return
            last_error = RuntimeError(f"模型下载不完整: {MODEL_DIR}")
        except Exception as exc:
            last_error = exc
            print(f"[model] download failed: {exc}")
            if attempt < MAX_RETRIES:
                time.sleep(min(10 * attempt, 30))

    raise RuntimeError(f"模型下载失败（已重试 {MAX_RETRIES} 次）: {last_error}")


if __name__ == "__main__":
    ensure_model_download()
    print(f"Model ready at {MODEL_DIR}")
