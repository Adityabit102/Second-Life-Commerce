import json
import re
from typing import List, Optional

import boto3
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from models.database import get_db
from models.listing import Listing
from models.return_grade import ReturnGrade
from utils.config import settings

router = APIRouter()

GRADE_SCORES = {"A": 100, "B": 75, "C": 50, "Junk": 0}
GRADE_CONFIDENCE_DEFAULTS = {"A": 95, "B": 80, "C": 65, "Junk": 40}

SYSTEM_PROMPT = (
    "You are a marketplace copywriter. Write a compelling but honest product listing. "
    "Return ONLY raw JSON:\n"
    "{\n"
    "  title: string (max 60 chars, mention condition honestly),\n"
    "  description: string (2 sentences, mention grade and any damage),\n"
    "  suggested_price_inr: integer (slightly below estimated value),\n"
    "  highlights: array of 3 short strings (selling points)\n"
    "}"
)

_MOCK_HIGHLIGHTS = ["Tested & working", "Minor wear only", "Fast dispatch"]


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class CreateListingRequest(BaseModel):
    return_id: Optional[int] = None
    product_name: str
    grade: str
    image_url: Optional[str] = None
    extra_image_urls: Optional[List[str]] = []
    estimated_resale_value_inr: int
    damage_detected: str
    # Customer-provided details (used directly, bypassing AI generation)
    customer_title: Optional[str] = None
    customer_description: Optional[str] = None
    customer_highlights: Optional[List[str]] = None
    customer_price: Optional[int] = None
    category: Optional[str] = None


class ListingResponse(BaseModel):
    id: int
    return_id: Optional[int]
    product_name: str
    title: str
    description: str
    image_url: Optional[str]
    extra_images: List[str] = []
    grade: str
    trust_score: float
    suggested_price_inr: int
    highlights: List[str]
    status: str
    created_at: str
    mock: bool = False


# ── Helpers ───────────────────────────────────────────────────────────────────

def _parse_json(text: str) -> dict:
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        m = re.search(r"\{.*\}", text, re.DOTALL)
        if m:
            return json.loads(m.group())
        raise


def _call_bedrock(
    product_name: str, grade: str, damage_detected: str, estimated_price: int
) -> dict:
    """AWS Bedrock Claude — generates marketplace listing copy."""
    if not settings.aws_access_key_id or not settings.aws_secret_access_key:
        raise ValueError("AWS credentials not configured")
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
                "content": (
                    f"Product: {product_name}\n"
                    f"Grade: {grade}\n"
                    f"Condition notes: {damage_detected}\n"
                    f"Estimated value: ₹{estimated_price}"
                ),
            }
        ],
    })
    resp = client.invoke_model(modelId="anthropic.claude-sonnet-4-5-20251001", body=body)
    raw = json.loads(resp["body"].read())["content"][0]["text"]
    return _parse_json(raw)


def _call_groq_listing(
    product_name: str, grade: str, damage_detected: str, estimated_price: int
) -> dict:
    """Groq fallback for listing copy generation when Bedrock is unavailable."""
    from groq import Groq
    client = Groq(api_key=settings.groq_api_key)
    resp = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    f"Product: {product_name}\n"
                    f"Grade: {grade}\n"
                    f"Condition notes: {damage_detected}\n"
                    f"Estimated value: ₹{estimated_price}"
                ),
            },
        ],
        max_tokens=512,
        temperature=0.7,
    )
    return _parse_json(resp.choices[0].message.content)


def _to_response(row: Listing, mock: bool = False) -> ListingResponse:
    extra = []
    try:
        extra = json.loads(row.extra_images_json) if row.extra_images_json else []
    except Exception:
        pass
    return ListingResponse(
        id=row.id,
        return_id=row.return_id,
        product_name=row.product_name,
        title=row.title,
        description=row.description,
        image_url=row.image_url,
        extra_images=extra,
        grade=row.grade,
        trust_score=row.trust_score,
        suggested_price_inr=row.suggested_price_inr,
        highlights=json.loads(row.highlights_json),
        status=row.status,
        created_at=row.created_at.isoformat(),
        mock=mock,
    )


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/listings", response_model=ListingResponse)
def create_listing(request: CreateListingRequest, db: Session = Depends(get_db)):
    # Fetch confidence from ReturnGrade if available
    confidence = GRADE_CONFIDENCE_DEFAULTS.get(request.grade, 70)
    if request.return_id:
        rg = db.query(ReturnGrade).filter(ReturnGrade.id == request.return_id).first()
        if rg:
            confidence = rg.confidence

    grade_score = GRADE_SCORES.get(request.grade, 50)
    trust_score = round((confidence * 0.6) + (grade_score * 0.4), 1)

    is_mock = False

    # Use customer-provided details if present; otherwise generate via AI
    if request.customer_title and request.customer_description and request.customer_highlights:
        content = {
            "title": request.customer_title[:80],
            "description": request.customer_description,
            "suggested_price_inr": request.customer_price or request.estimated_resale_value_inr,
            "highlights": request.customer_highlights[:5],
        }
    else:
        try:
            content = _call_bedrock(
                request.product_name,
                request.grade,
                request.damage_detected,
                request.estimated_resale_value_inr,
            )
        except Exception:
            try:
                content = _call_groq_listing(
                    request.product_name,
                    request.grade,
                    request.damage_detected,
                    request.estimated_resale_value_inr,
                )
            except Exception:
                grade_label = {'A': 'Like New', 'B': 'Refurbished', 'C': 'Fair'}.get(request.grade, 'Used')
                content = {
                    "title": f"{request.product_name} — Grade {request.grade}, {grade_label}"[:80],
                    "description": (
                        f"Returned {request.product_name} in {grade_label.lower()} condition. "
                        f"{request.damage_detected}. Tested and verified before listing."
                    ),
                    "suggested_price_inr": max(int(request.estimated_resale_value_inr * 0.95), 50),
                    "highlights": [
                        request.damage_detected if request.damage_detected != 'None visible' else 'No visible damage',
                        f"Grade {request.grade} — AI verified condition",
                        "Tested and dispatched within 24 hours",
                    ],
                }
                is_mock = True

    row = Listing(
        return_id=request.return_id,
        product_name=request.product_name,
        title=content["title"][:80],
        description=content["description"],
        image_url=request.image_url,
        extra_images_json=json.dumps(request.extra_image_urls or []),
        grade=request.grade,
        trust_score=trust_score,
        suggested_price_inr=int(content["suggested_price_inr"]),
        highlights_json=json.dumps(content["highlights"]),
        status="active",
    )
    db.add(row)
    db.commit()
    db.refresh(row)

    return _to_response(row, mock=is_mock)


@router.get("/listings", response_model=List[ListingResponse])
def list_listings(
    grade: Optional[str] = None,
    status: str = "active",
    db: Session = Depends(get_db),
):
    q = db.query(Listing).filter(Listing.status == status)
    if grade:
        q = q.filter(Listing.grade == grade)
    rows = q.order_by(Listing.created_at.desc()).all()
    return [_to_response(r) for r in rows]


@router.get("/listings/{listing_id}", response_model=ListingResponse)
def get_listing(listing_id: int, db: Session = Depends(get_db)):
    row = db.query(Listing).filter(Listing.id == listing_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Listing not found")
    return _to_response(row)


@router.patch("/listings/{listing_id}/sold", response_model=ListingResponse)
def mark_listing_sold(listing_id: int, db: Session = Depends(get_db)):
    row = db.query(Listing).filter(Listing.id == listing_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Listing not found")
    row.status = "sold"
    db.commit()
    db.refresh(row)
    return _to_response(row)
