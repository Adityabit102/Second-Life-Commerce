import os
import uuid
from typing import List

from fastapi import APIRouter, File, HTTPException, UploadFile

from services.s3_service import s3_service
from utils.config import settings

router = APIRouter()

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/quicktime", "video/webm", "video/x-msvideo", "video/avi"}
MAX_BYTES = 10 * 1024 * 1024       # 10 MB  (images)
MAX_VIDEO_BYTES = 200 * 1024 * 1024  # 200 MB (videos)


def _save_locally(contents: bytes, filename: str, content_type: str) -> str:
    ext = (filename or "image.jpg").rsplit(".", 1)[-1].lower()
    fname = f"{uuid.uuid4().hex}.{ext}"
    upload_dir = os.path.join(os.path.dirname(__file__), "..", "static", "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    with open(os.path.join(upload_dir, fname), "wb") as f:
        f.write(contents)
    return f"/static/uploads/{fname}"


@router.post("/image")
async def upload_image(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: {', '.join(ALLOWED_TYPES)}",
        )

    contents = await file.read()

    if len(contents) > MAX_BYTES:
        raise HTTPException(status_code=400, detail="File too large (max 10 MB).")

    if not settings.s3_bucket_name:
        raise HTTPException(status_code=503, detail="S3 storage is not configured.")

    url = s3_service.upload_image(contents, file.filename, file.content_type)
    return {"url": url, "filename": file.filename}


@router.post("/images/batch")
async def upload_images_batch(files: List[UploadFile] = File(...)):
    """Upload multiple product images; returns a list of accessible URLs.
    Uses S3 when configured, falls back to local static storage."""
    urls = []
    for file in files:
        if file.content_type not in ALLOWED_TYPES:
            continue
        contents = await file.read()
        if len(contents) > MAX_BYTES:
            continue
        try:
            if settings.s3_bucket_name and settings.aws_access_key_id:
                try:
                    url = s3_service.upload_image(contents, file.filename or "image.jpg", file.content_type or "image/jpeg")
                except Exception:
                    url = _save_locally(contents, file.filename or "image.jpg", file.content_type or "image/jpeg")
            else:
                url = _save_locally(contents, file.filename or "image.jpg", file.content_type or "image/jpeg")
            urls.append(url)
        except Exception:
            pass
    return {"urls": urls}


@router.post("/media/batch")
async def upload_media_batch(files: List[UploadFile] = File(...)):
    """Upload images and/or videos; returns accessible URLs.
    Videos are always saved locally (S3 video support not required for demo)."""
    urls = []
    for file in files:
        is_image = file.content_type in ALLOWED_TYPES
        is_video = file.content_type in ALLOWED_VIDEO_TYPES
        if not (is_image or is_video):
            continue
        max_size = MAX_VIDEO_BYTES if is_video else MAX_BYTES
        contents = await file.read()
        if len(contents) > max_size:
            continue
        try:
            if is_image and settings.s3_bucket_name and settings.aws_access_key_id:
                try:
                    url = s3_service.upload_image(contents, file.filename or "image.jpg", file.content_type or "image/jpeg")
                except Exception:
                    url = _save_locally(contents, file.filename or "file", file.content_type or "application/octet-stream")
            else:
                url = _save_locally(contents, file.filename or "file", file.content_type or "application/octet-stream")
            urls.append(url)
        except Exception:
            pass
    return {"urls": urls}
