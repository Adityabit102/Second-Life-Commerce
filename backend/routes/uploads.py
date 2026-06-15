import base64
import os
import uuid
from typing import List

from fastapi import APIRouter, File, HTTPException, UploadFile

from services.s3_service import s3_service
from utils.config import settings

router = APIRouter()

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/quicktime", "video/webm", "video/x-msvideo", "video/avi"}
MAX_BYTES = 10 * 1024 * 1024        # 10 MB (images)
MAX_VIDEO_BYTES = 50 * 1024 * 1024  # 50 MB (videos — reduced for Vercel /tmp limit)


def _save_locally(contents: bytes, filename: str, content_type: str) -> str:
    """
    On Vercel, /static/ is not writable or served. Save to /tmp and return
    a base64 data URL so the frontend can still display the image in-session.
    On local dev the static dir is used as before.
    """
    is_vercel = os.environ.get("VERCEL") == "1"
    if is_vercel:
        # Return a base64 data URL — works in browser, no filesystem needed
        b64 = base64.b64encode(contents).decode()
        mime = content_type or "image/jpeg"
        return f"data:{mime};base64,{b64}"
    else:
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

    if settings.s3_bucket_name and settings.aws_access_key_id:
        try:
            url = s3_service.upload_image(contents, file.filename, file.content_type)
            return {"url": url, "filename": file.filename}
        except Exception:
            pass

    # Fallback: local or base64
    url = _save_locally(contents, file.filename or "image.jpg", file.content_type or "image/jpeg")
    return {"url": url, "filename": file.filename}


@router.post("/images/batch")
async def upload_images_batch(files: List[UploadFile] = File(...)):
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
                    url = s3_service.upload_image(
                        contents, file.filename or "image.jpg", file.content_type or "image/jpeg"
                    )
                except Exception:
                    url = _save_locally(
                        contents, file.filename or "image.jpg", file.content_type or "image/jpeg"
                    )
            else:
                url = _save_locally(
                    contents, file.filename or "image.jpg", file.content_type or "image/jpeg"
                )
            urls.append(url)
        except Exception:
            pass
    return {"urls": urls}


@router.post("/media/batch")
async def upload_media_batch(files: List[UploadFile] = File(...)):
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
                    url = s3_service.upload_image(
                        contents, file.filename or "image.jpg", file.content_type or "image/jpeg"
                    )
                except Exception:
                    url = _save_locally(
                        contents, file.filename or "file", file.content_type or "application/octet-stream"
                    )
            else:
                url = _save_locally(
                    contents, file.filename or "file", file.content_type or "application/octet-stream"
                )
            urls.append(url)
        except Exception:
            pass
    return {"urls": urls}