# AWS Integration Guide

## Services in Use

### 1. Amazon Bedrock — AI Grading & Content Generation

**Model**: `anthropic.claude-sonnet-4-5-20251001` via `bedrock-runtime`

**Vision Grading** (`backend/routes/returns_v1.py` → `_call_bedrock_vision`)
- Accepts base64-encoded product image + product name
- Returns JSON: `{ grade, confidence, damage_detected, recommended_action, reason, estimated_resale_value_inr, co2_saved_kg }`
- Falls back to Groq vision (`meta-llama/llama-4-scout-17b-16e-instruct`) if credentials missing or call fails
- Final fallback: deterministic mock based on product name keyword matching

**Listing Copy Generation** (`backend/routes/marketplace.py` → `_call_bedrock`)
- Accepts product name, grade, damage notes, estimated price
- Returns JSON: `{ title, description, suggested_price_inr, highlights[] }`
- Falls back to Groq (`llama-3.3-70b-versatile`) then hardcoded template

**Bedrock API format** (messages API with vision):
```python
body = {
    "anthropic_version": "bedrock-2023-05-31",
    "max_tokens": 512,
    "system": SYSTEM_PROMPT,
    "messages": [{
        "role": "user",
        "content": [
            {"type": "image", "source": {"type": "base64", "media_type": "image/jpeg", "data": "<b64>"}},
            {"type": "text", "text": "Grade this item..."}
        ]
    }]
}
client.invoke_model(modelId="anthropic.claude-sonnet-4-5-20251001", body=json.dumps(body))
```

### 2. Amazon S3 — Product Image Storage

- Upload target: `s3://<S3_BUCKET_NAME>/uploads/<uuid>.<ext>`
- Service wrapper: `backend/services/s3_service.py`
- If `S3_BUCKET_NAME` env var is empty, falls back to local `backend/static/uploads/`
- Images served via `/static/uploads/<filename>` in local fallback mode

## Boto3 Client Initialization Pattern

```python
import boto3
from utils.config import settings

client = boto3.client(
    "bedrock-runtime",           # or "s3"
    region_name=settings.aws_region,
    aws_access_key_id=settings.aws_access_key_id,
    aws_secret_access_key=settings.aws_secret_access_key,
)
```

Always check `settings.aws_access_key_id` is non-empty before calling; raise `ValueError` to trigger the Groq fallback.

## Adding New AWS Services

1. Add the new credential/config key to `backend/utils/config.py` `Settings` class
2. Add to `backend/.env` (and document in this file)
3. Always wrap in try/except with a Groq or mock fallback
4. Never let AWS errors propagate to the user as 500s
