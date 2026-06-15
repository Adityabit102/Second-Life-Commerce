# Returns & AI Grading — Feature Specification

## Overview

Customers submit a returned product with photos and a product name. The platform uses AI (AWS Bedrock Claude) to assign a grade, estimate resale value, and recommend an action (resell, donate, recycle).

## Requirements

### Functional

1. Customer provides product name (or Amazon URL for auto-fill) and at least one photo
2. System grads the item as Grade A / B / C / Junk with a confidence score (0–100)
3. System returns: damage description, recommended action, estimated resale value (₹), CO₂ saved (kg)
4. Grading result is persisted in `ReturnGrade` table
5. Wallet credits are auto-awarded based on the recommended action and grade
6. Customer can then list, donate, recycle, or swap from the grading result screen

### AI Grading Priority

1. **AWS Bedrock** (`anthropic.claude-sonnet-4-5-20251001`) — vision model, base64 image input
2. **Groq** (`meta-llama/llama-4-scout-17b-16e-instruct`) — vision fallback
3. **Deterministic mock** — keyword-based price bands + grade heuristics (never errors)

### Non-Functional

- Grading must complete in < 10 seconds for typical JPEG under 2 MB
- Supported image types: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- Images stored in S3 if configured; local `static/uploads/` otherwise
- Grading response must always include all 7 required JSON fields; missing fields cause a 500

## API

`POST /api/v1/returns/grade` (multipart/form-data)
- `image`: file upload
- `product_name`: string
- `description`: optional string

Response: `GradeResponse` — see `backend/routes/returns_v1.py`

## Acceptance Criteria

- [ ] Grade A product photo returns `grade: "A"`, `confidence >= 80`, `recommended_action: "resell"`
- [ ] Junk product returns `recommended_action: "recycle"`, `credits_earned` matches recycle tier
- [ ] S3 upload succeeds when credentials configured; local fallback used otherwise
- [ ] Bedrock grading used when `AWS_ACCESS_KEY_ID` is set in `.env`
- [ ] Groq grading used as fallback when Bedrock fails or credentials missing
- [ ] Mock response used only when both Bedrock and Groq fail
