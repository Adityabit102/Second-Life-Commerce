import base64
import json
import os
import re
import uuid
from typing import List, Optional

import boto3
import httpx
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from models.database import get_db
from models.return_grade import ReturnGrade
from routes.credits import earn_credits_for_grade
from services.s3_service import s3_service
from utils.config import settings

router = APIRouter()


@router.get("/fetch-product")
async def fetch_product_from_url(url: str):
    if "amazon." not in url:
        raise HTTPException(status_code=400, detail="Not an Amazon URL")

    asin_match = re.search(r"/dp/([A-Z0-9]{10})", url)
    asin = asin_match.group(1) if asin_match else None

    # Try to get name from the URL slug first (fast path)
    slug_match = re.search(r"/([A-Za-z0-9][A-Za-z0-9\-]+)/dp/", url)
    slug_name = ""
    if slug_match:
        slug_name = (
            slug_match.group(1)
            .replace("-", " ")
            .strip()
        )
        # Title-case but preserve known uppercase tokens (like XM4, WH)
        slug_name = " ".join(
            w.upper() if re.match(r'^[A-Z0-9]{2,6}$', w.upper()) and not w.istitle() else w.capitalize()
            for w in slug_name.split()
        )

    # Fetch the actual page to get the real product title
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept-Language": "en-IN,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }

    product_name = slug_name  # default to slug if fetch fails
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=8) as client:
            r = await client.get(url, headers=headers)
        html = r.text

        # Try <span id="productTitle"> first (most reliable)
        m = re.search(r'id="productTitle"[^>]*>\s*(.*?)\s*</span>', html, re.DOTALL)
        if m:
            product_name = re.sub(r'\s+', ' ', m.group(1)).strip()
        else:
            # Fall back to og:title meta
            m = re.search(r'property="og:title"\s+content="([^"]+)"', html)
            if m:
                product_name = m.group(1).strip()
            else:
                # Fall back to <title> tag
                m = re.search(r"<title[^>]*>(.*?)</title>", html, re.DOTALL | re.IGNORECASE)
                if m:
                    raw = m.group(1).strip()
                    # Strip "Amazon.in : " or ": Amazon.in" suffixes
                    raw = re.sub(r'\s*[:|]\s*Amazon\.in.*$', '', raw, flags=re.IGNORECASE).strip()
                    raw = re.sub(r'^Amazon\.in\s*[:|]\s*', '', raw, flags=re.IGNORECASE).strip()
                    if raw:
                        product_name = raw
    except Exception:
        pass  # use slug_name fallback

    # Decode common HTML entities
    product_name = (
        product_name
        .replace("&amp;", "&")
        .replace("&#39;", "'")
        .replace("&quot;", '"')
        .replace("&#x2019;", "'")
        .strip()
    )

    # Estimate market price from product name using price bands
    name_lower = (product_name or slug_name or "").lower()
    market_price = 3500  # default
    for keywords, price in _PRICE_BANDS:
        if any(k in name_lower for k in keywords):
            market_price = price
            break

    return {
        "name": product_name or "Amazon Product",
        "asin": asin,
        "fetched": bool(product_name and product_name != slug_name),
        "market_price_inr": market_price,
    }

SYSTEM_PROMPT = (
    "You are a product condition grading AI for the Indian market. "
    "Analyze the product image AND the product name to return ONLY "
    "a raw JSON object with no markdown, no code blocks, no explanation:\n"
    "{\n"
    "  grade: 'A' or 'B' or 'C' or 'Junk',\n"
    "  confidence: number 0-100,\n"
    "  damage_detected: specific string describing visible issues or 'None visible',\n"
    "  recommended_action: 'resell' or 'refurbish' or 'donate' or 'recycle',\n"
    "  reason: one sentence explanation,\n"
    "  estimated_resale_value_inr: realistic integer based on product type and Indian market prices,\n"
    "  co2_saved_kg: number with 1 decimal based on product category\n"
    "}\n"
    "IMPORTANT: estimated_resale_value_inr must reflect the ACTUAL product. "
    "A smartphone should be 30000-80000, headphones 1000-8000, a book 50-400, "
    "shoes 500-6000, laptop 15000-60000. Grade A = 75% of market value, "
    "Grade B = 55%, Grade C = 30%."
)

# ── Price bands for smart mock pricing ───────────────────────────────────────

_PRICE_BANDS = [
    (['samsung galaxy', 'iphone', 'pixel phone', 'oneplus', 'smartphone'],   75000),
    (['macbook'],                                                              90000),
    (['ipad', 'galaxy tab', 'tablet'],                                        35000),
    (['laptop', 'notebook', 'pavilion', 'inspiron', 'thinkpad', 'vivobook'],  45000),
    (['mirrorless', 'dslr', 'canon eos', 'nikon', 'camera body'],            55000),
    (['smart tv', 'qled', 'oled tv', 'television', '4k tv', 'realme tv'],    30000),
    (['airpods pro'],                                                          22000),
    (['airpods'],                                                              14000),
    (['sony wh', 'wh-1000', 'headphone', 'over-ear'],                         6500),
    (['boat rockerz', 'rockerz', 'boat airdopes', 'neckband', 'mivi collar',
      'realme buds wireless', 'jbl tune 115bt', 'jbl endurance'],              800),
    (['airdopes', 'earbud', 'tws earbuds'],                                   1200),
    (['earphone', 'in-ear', 'wired earphone'],                                 700),
    (['jbl charge', 'jbl flip', 'bose speaker', 'marshall'],                 12000),
    (['speaker', 'bluetooth speaker', 'soundbar'],                             5000),
    (['smartwatch', 'apple watch', 'galaxy watch', 'garmin'],                18000),
    (['smart band', 'mi band', 'xiaomi band', 'fitbit'],                      2500),
    (['logitech', 'gaming mouse', 'mx master', 'wireless mouse'],             6000),
    (['mouse', 'optical mouse'],                                               1500),
    (['router', 'wifi 6', 'tp-link', 'netgear', 'archer'],                    6000),
    (['usb hub', 'usb-c hub', 'syska'],                                        800),
    # ── Personal care ─────────────────────────────────────────────────────────
    (['electric toothbrush', 'sonic toothbrush', 'oral-b', 'philips sonicare',
      'agaro', 'tooth brush', 'toothbrush'],                                   1500),
    (['trimmer', 'shaver', 'philips trimmer', 'mi trimmer', 'beard'],          1500),
    (['hair dryer', 'hair straightener', 'straightener', 'curler', 'dyson airwrap'], 1800),
    (['epilator', 'hair removal'],                                              1200),
    # ── Kitchen & Home ────────────────────────────────────────────────────────
    (['air fryer', 'airfryer', 'philips air'],                                 7500),
    (['vacuum', 'eureka', 'dyson'],                                           12000),
    (['electric kettle', 'kettle'],                                            1000),
    (['steam iron', 'dry iron', 'iron box'],                                   1200),
    (['pressure cooker', 'prestige', 'hawkins'],                               2500),
    (['mixer grinder', 'mixer', 'blender', 'grinder'],                        3500),
    (['water purifier', 'ro purifier', 'kent', 'aquaguard'],                  8000),
    (['induction cooktop', 'induction stove'],                                 2000),
    (['microwave', 'otg'],                                                     5000),
    (['washing machine'],                                                      18000),
    (['refrigerator', 'fridge'],                                              22000),
    (['study lamp', 'desk lamp', 'led lamp'],                                   900),
    (['air conditioner', 'ac '],                                              30000),
    (['air purifier'],                                                          8000),
    (['water bottle', 'thermos', 'flask'],                                      500),
    (['lunch box', 'tiffin'],                                                   400),
    (['bedsheet', 'pillow', 'mattress', 'comforter', 'blanket'],               800),
    # ── Fashion ───────────────────────────────────────────────────────────────
    (['nike', 'adidas shoe', 'air force 1', 'air jordan'],                    5500),
    (['sneaker', 'shoe', 'footwear', 'boot'],                                 2500),
    (['hoodie', 'sweatshirt', 'fleece jacket'],                               3000),
    (['jeans', 'denim', 'levi'],                                              2000),
    (['shirt', 't-shirt', 'tshirt', 'tee', 'polo'],                            800),
    # ── Books ────────────────────────────────────────────────────────────────
    (['ncert', 'cbse textbook', 'class 12', 'class 11'],                       150),
    (['textbook', 'academic book'],                                             200),
    (['atomic habits', 'self-help', 'novel', 'paperback', 'hardcover'],        350),
    (['book'],                                                                  200),
    # ── Sports ───────────────────────────────────────────────────────────────
    (['badminton', 'cosco', 'racket set'],                                    1400),
    (['football', 'nivia', 'soccer ball'],                                   1000),
    (['swim goggle', 'goggles', 'nabaiji'],                                    500),
    (['gym gloves', 'training gloves', 'boldfit'],                             600),
    (['cricket bat', 'cricket'],                                              2500),
    (['yoga mat', 'exercise mat'],                                             800),
]

_GRADE_MULTIPLIER = {'A': 0.75, 'B': 0.55, 'C': 0.30, 'Junk': 0.0}


def _estimate_price(product_name: str, grade: str) -> int:
    name_lower = product_name.lower()
    base = 3500  # default mid-range electronics
    for keywords, price in _PRICE_BANDS:
        if any(k in name_lower for k in keywords):
            base = price
            break
    price = int(base * _GRADE_MULTIPLIER.get(grade, 0.5))
    return max(price, 50)  # floor of ₹50


def _calc_credits(grade: str, estimated_price: int) -> int:
    if estimated_price >= 50000:
        return {'A': 100, 'B': 65, 'C': 30, 'Junk': 10}[grade]
    if estimated_price >= 10000:
        return {'A': 75,  'B': 45, 'C': 20, 'Junk': 8}[grade]
    if estimated_price >= 3000:
        return {'A': 50,  'B': 30, 'C': 12, 'Junk': 6}[grade]
    if estimated_price >= 800:
        return {'A': 25,  'B': 15, 'C': 8,  'Junk': 5}[grade]
    return     {'A': 10,  'B': 6,  'C': 4,  'Junk': 3}[grade]


def _calc_co2(estimated_price: int) -> float:
    if estimated_price >= 50000: return 15.0
    if estimated_price >= 20000: return 12.0
    if estimated_price >= 8000:  return 8.0
    if estimated_price >= 3000:  return 5.5
    if estimated_price >= 1000:  return 3.5
    if estimated_price >= 300:   return 1.5
    return 0.5


def _build_mock_assessment(product_name: str, grade: str = 'B') -> dict:
    price = _estimate_price(product_name, grade)
    return {
        "grade": grade,
        "confidence": {'A': 91, 'B': 82, 'C': 67, 'Junk': 94}[grade],
        "damage_detected": {
            'A': 'No visible damage — cosmetically and functionally intact',
            'B': 'Minor cosmetic wear (light scratches or scuffs); fully functional',
            'C': 'Moderate damage — visible marks or minor functional issue',
            'Junk': 'Significant physical damage — not safe for resale',
        }[grade],
        "recommended_action": {
            'A': 'resell', 'B': 'refurbish', 'C': 'donate', 'Junk': 'recycle'
        }[grade],
        "reason": {
            'A': f'{product_name} is in like-new condition — ideal for direct resale.',
            'B': f'{product_name} has minor wear but is fully functional after basic refurbishment.',
            'C': f'{product_name} has notable damage; best donated to extend its life sustainably.',
            'Junk': f'{product_name} is beyond economical repair and should be responsibly recycled.',
        }[grade],
        "estimated_resale_value_inr": price,
        "co2_saved_kg": _calc_co2(price),
    }

VALID_MEDIA_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}


def _parse_bedrock_json(text: str) -> dict:
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            return json.loads(match.group())
        raise


def _call_bedrock_vision(
    image_bytes: bytes, content_type: str, product_name: str, description: str
) -> dict:
    """AWS Bedrock Claude vision grading — primary AI path."""
    if not settings.aws_access_key_id or not settings.aws_secret_access_key:
        raise ValueError("AWS credentials not configured")
    media_type = content_type if content_type in VALID_MEDIA_TYPES else "image/jpeg"
    b64 = base64.standard_b64encode(image_bytes).decode()
    client = boto3.client(
        "bedrock-runtime",
        region_name=settings.aws_region,
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
    )
    body = json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 512,
        "system": SYSTEM_PROMPT,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": b64,
                        },
                    },
                    {
                        "type": "text",
                        "text": (
                            f"Product: {product_name}\n"
                            f"Description: {description or 'N/A'}\n\n"
                            "Grade this item. Return ONLY the raw JSON, no markdown."
                        ),
                    },
                ],
            }
        ],
    })
    resp = client.invoke_model(modelId="anthropic.claude-sonnet-4-5-20251001", body=body)
    raw = json.loads(resp["body"].read())["content"][0]["text"]
    return _parse_bedrock_json(raw)


def _call_groq_vision(
    image_bytes: bytes, content_type: str, product_name: str, description: str
) -> dict:
    """Groq vision grading — fallback when Bedrock is unavailable."""
    from groq import Groq
    media_type = content_type if content_type in VALID_MEDIA_TYPES else "image/jpeg"
    b64 = base64.standard_b64encode(image_bytes).decode()
    client = Groq(api_key=settings.groq_api_key)
    resp = client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:{media_type};base64,{b64}"},
                    },
                    {
                        "type": "text",
                        "text": (
                            f"Product: {product_name}\n"
                            f"Description: {description or 'N/A'}\n\n"
                            "Grade this item. Return ONLY the raw JSON, no markdown."
                        ),
                    },
                ],
            },
        ],
        max_tokens=512,
    )
    raw = resp.choices[0].message.content
    return _parse_bedrock_json(raw)


class GradeResponse(BaseModel):
    id: int
    product_name: str
    description: Optional[str]
    image_url: Optional[str]
    grade: str
    confidence: int
    damage_detected: str
    recommended_action: str
    reason: str
    estimated_resale_value_inr: int
    co2_saved_kg: float
    credits_earned: int
    mock: bool = False


def _to_response(row: ReturnGrade) -> GradeResponse:
    return GradeResponse(
        id=row.id,
        product_name=row.product_name,
        description=row.description,
        image_url=row.image_url,
        grade=row.grade,
        confidence=row.confidence,
        damage_detected=row.damage_detected,
        recommended_action=row.recommended_action,
        reason=row.reason,
        estimated_resale_value_inr=row.estimated_resale_value_inr,
        co2_saved_kg=row.co2_saved_kg,
        credits_earned=row.credits_earned,
        mock=bool(row.is_mock),
    )


@router.post("/grade", response_model=GradeResponse)
async def grade_return(
    image: UploadFile = File(...),
    product_name: str = Form(...),
    description: str = Form(""),
    db: Session = Depends(get_db),
):
    contents = await image.read()

    # Upload to S3; fall back to local static storage in demo mode
    image_url: Optional[str] = None
    if settings.s3_bucket_name:
        try:
            image_url = s3_service.upload_image(
                contents,
                image.filename or "image.jpg",
                image.content_type or "image/jpeg",
            )
        except Exception:
            pass
    if not image_url:
        try:
            ext = (image.filename or "image.jpg").rsplit(".", 1)[-1].lower()
            fname = f"{uuid.uuid4().hex}.{ext}"
            upload_dir = os.path.join(os.path.dirname(__file__), "..", "static", "uploads")
            os.makedirs(upload_dir, exist_ok=True)
            with open(os.path.join(upload_dir, fname), "wb") as f:
                f.write(contents)
            image_url = f"/static/uploads/{fname}"
        except Exception:
            pass

    # AI grading: Bedrock (primary) → Groq vision (fallback) → mock
    is_mock = False
    assessment = None

    if settings.aws_access_key_id and settings.aws_secret_access_key:
        try:
            assessment = _call_bedrock_vision(
                contents, image.content_type or "image/jpeg", product_name, description
            )
        except Exception:
            pass

    if assessment is None:
        try:
            assessment = _call_groq_vision(
                contents, image.content_type or "image/jpeg", product_name, description
            )
        except Exception:
            pass

    if assessment is None:
        assessment = _build_mock_assessment(product_name)
        is_mock = True

    grade = assessment.get("grade", "B")
    est_price = int(assessment.get("estimated_resale_value_inr", 0))
    credits = _calc_credits(grade, est_price)

    row = ReturnGrade(
        product_name=product_name,
        description=description or None,
        image_url=image_url,
        grade=grade,
        confidence=int(assessment["confidence"]),
        damage_detected=assessment["damage_detected"],
        recommended_action=assessment["recommended_action"],
        reason=assessment["reason"],
        estimated_resale_value_inr=est_price,
        co2_saved_kg=float(assessment["co2_saved_kg"]),
        credits_earned=credits,
        is_mock=int(is_mock),
    )
    db.add(row)
    db.commit()
    db.refresh(row)

    # Auto-credit the wallet — non-fatal if it fails
    try:
        earn_credits_for_grade(
            db,
            product_name=row.product_name,
            grade=row.grade,
            action=row.recommended_action,
            return_id=row.id,
        )
    except Exception:
        pass

    return _to_response(row)


@router.get("/", response_model=List[GradeResponse])
def list_returns(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    rows = (
        db.query(ReturnGrade)
        .order_by(ReturnGrade.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [_to_response(r) for r in rows]


@router.get("/{return_id}", response_model=GradeResponse)
def get_return(return_id: int, db: Session = Depends(get_db)):
    row = db.query(ReturnGrade).filter(ReturnGrade.id == return_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Return not found")
    return _to_response(row)
