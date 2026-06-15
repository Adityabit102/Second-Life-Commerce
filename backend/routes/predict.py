import hashlib
import json
import re
from typing import List, Optional

import boto3
from fastapi import APIRouter
from pydantic import BaseModel

from utils.config import settings

router = APIRouter()

SYSTEM_PROMPT = (
    "You are a product return risk analyst for Amazon India. "
    "Analyze the product and return ONLY raw JSON:\n"
    "{\n"
    "  risk_level: 'low' or 'medium' or 'high',\n"
    "  risk_score: integer 0-100,\n"
    "  top_reasons: array of exactly 2 short strings,\n"
    "  suggestion: string (one actionable tip for the buyer, max 15 words),\n"
    "  return_rate_estimate: string (e.g. '23% of buyers return this category')\n"
    "}\n"
    "Base your analysis on: electronics/cables=high risk, apparel=high risk, "
    "home appliances=medium, books/stationery=low, "
    "price over ₹2000=higher scrutiny, brand name products=lower risk"
)

# Keyword-matched product profiles — checked before falling back to category.
# Each keywords list uses lowercase substrings; first match wins.
_PRODUCT_PROFILES = [
    {
        "keywords": ["insole", "orthotic", "shoe insert", "arch support", "heel cushion", "foot pad", "footbed"],
        "base": 35, "spread": 20, "rate_pct": 28,
        "reasons": [
            ["Arch height may not suit your specific foot anatomy", "Size trimming instructions unclear for narrow shoes"],
            ["Cushion density firmer than product description states", "Odour-control layer loses effectiveness quickly"],
            ["Heel cup depth insufficient for high-arch users", "Material too thick for some shoe cavities"],
            ["Gel pad shifts forward during walking", "Top fabric peels after repeated use"],
        ],
        "suggestions": [
            "Compare arch height (low/medium/high) with your foot type before buying.",
            "Trace your foot and check the size chart — trim guides vary by brand.",
            "Read reviews from buyers with a similar foot condition or arch type.",
        ],
    },
    {
        "keywords": ["iphone", "samsung galaxy", "oneplus", "pixel", "xiaomi", "redmi", "oppo", "vivo", "realme",
                     "motorola", "nokia", "nothing phone", "smartphone", "mobile phone"],
        "base": 48, "spread": 22, "rate_pct": 27,
        "reasons": [
            ["Battery capacity degrades faster than expected", "Camera performance lower than advertised samples"],
            ["Software bugs present in early production batches", "Heating under sustained gaming or video load"],
            ["Screen brightness uneven at corners", "Fingerprint sensor accuracy inconsistent in humidity"],
            ["Network signal drops in low-coverage areas", "Speaker volume lower than competing models"],
        ],
        "suggestions": [
            "Verify IMEI and check original box contents on delivery.",
            "Test all hardware features thoroughly within the return window.",
            "Read recent reviews for known software or heating issues.",
        ],
    },
    {
        "keywords": ["laptop", "macbook", "chromebook", "notebook", "ultrabook", "thinkpad", "zenbook", "vivobook",
                     "ideapad", "aspire", "pavilion", "inspiron"],
        "base": 30, "spread": 18, "rate_pct": 18,
        "reasons": [
            ["Battery life drops below advertised after a few months", "Keyboard flex noticeable under sustained typing"],
            ["Thermal throttling under heavy workloads", "Fan noise higher than expected at load"],
            ["Display colour accuracy off for photo/video work", "RAM or storage variant may differ from listing"],
        ],
        "suggestions": [
            "Verify exact RAM and storage specs match your selected variant.",
            "Run a benchmark and battery test within the return window.",
            "Check battery health in settings immediately on delivery.",
        ],
    },
    {
        "keywords": ["headphone", "earphone", "earbud", "airpod", "tws", "neckband", "wh-", "wf-", "jbl",
                     "bose", "sennheiser", "boat basshead", "boat airdopes", "boat rockerz", "audio technica",
                     "skullcandy", "anker soundcore"],
        "base": 38, "spread": 22, "rate_pct": 25,
        "reasons": [
            ["Bluetooth pairing drops during extended sessions", "Bass response weaker than demo unit samples"],
            ["Left/right channel volume imbalance reported", "Microphone picks up excessive ambient noise"],
            ["Ear tip size inadequate for smaller ear canals", "ANC effectiveness lower than marketing claims"],
            ["Plastic casing creaks under slight grip pressure", "Carry case hinge fails within weeks of use"],
        ],
        "suggestions": [
            "Test both channels and mic clarity within the return window.",
            "Compare in-store demo if possible before buying.",
            "Check if replacement ear tips are available for your size.",
        ],
    },
    {
        "keywords": ["ipad", "galaxy tab", "lenovo tab", "fire hd", "realme pad", "oneplus pad", "tablet"],
        "base": 28, "spread": 16, "rate_pct": 16,
        "reasons": [
            ["App compatibility issues with current OS version", "Backlight bleed visible at screen edges in dark rooms"],
            ["Battery cycle count may be higher on refurbished units", "Stylus pairing requires multiple attempts"],
            ["Speakers sound flat versus newer-generation models", "Wi-Fi signal weaker at distance from router"],
        ],
        "suggestions": [
            "Check OS compatibility with your key apps before buying.",
            "Inspect screen for dead pixels and backlight bleed on arrival.",
            "Verify battery health in settings before the return window closes.",
        ],
    },
    {
        "keywords": ["smart tv", "led tv", "oled tv", "qled", "television", "monitor", "display screen",
                     "gaming monitor", " tv ", "55 inch", "65 inch", "43 inch"],
        "base": 20, "spread": 16, "rate_pct": 11,
        "reasons": [
            ["Delivery damage risk is high for large-panel items", "Dead or stuck pixels found in rare units"],
            ["Smart TV OS becomes sluggish within 12–18 months", "HDMI ports loosen with repeated cable swapping"],
            ["Panel uniformity issues visible on dark scenes", "Remote control build quality below expectations"],
        ],
        "suggestions": [
            "Inspect the packaging for dents before signing delivery.",
            "Test all HDMI ports and check for dead pixels immediately.",
            "Verify smart features work with your streaming subscriptions.",
        ],
    },
    {
        "keywords": ["nike", "adidas", "puma", "reebok", "new balance", "converse", "vans", "skechers",
                     "crocs", "bata", "woodland", "red chief", "air force", "air max", "jordan",
                     "shoe", "sneaker", "boot ", "sandal", "slipper", "loafer", "heel ", "chappal",
                     "running shoe", "sports shoe", "canvas shoe"],
        "base": 52, "spread": 22, "rate_pct": 34,
        "reasons": [
            ["Sizing runs half a size smaller than standard", "Sole adhesive separates after regular outdoor use"],
            ["Colorway appears slightly different under natural light", "Toe box width narrower than expected"],
            ["Cushioning firmness not matching product description", "Insole padding compresses within weeks"],
            ["Upper stitching unravels at flex points", "Lace quality below what the price point suggests"],
        ],
        "suggestions": [
            "Order your standard size — consider half size up if wide-footed.",
            "Try indoors first; sole scuffs void the return eligibility.",
            "Read reviews from buyers with a similar foot width.",
        ],
    },
    {
        "keywords": ["shirt", "t-shirt", "tee ", "polo", "jeans", "trouser", "pant ", "dress ", "kurta",
                     "saree", "kurti", "jacket", "hoodie", "sweater", "top ", "blouse", "leggings",
                     "shorts", "sweatshirt", "suit ", "blazer", "tracksuit", "pajama", "nightwear"],
        "base": 56, "spread": 20, "rate_pct": 40,
        "reasons": [
            ["Sizing runs smaller than standard Indian measurements", "Colour appears different under indoor lighting"],
            ["Fabric feel rougher than product photos suggest", "Stitching inconsistent at seams and collar"],
            ["Significant shrinkage after the first wash", "Fit differs substantially from the model shown"],
            ["Colour fades visibly after 2–3 washes", "Zipper or button quality below price expectations"],
        ],
        "suggestions": [
            "Order one size up and measure against the size chart.",
            "Check buyer-uploaded photos — model images can be misleading.",
            "Confirm free returns are available, especially for gifting.",
        ],
    },
    {
        "keywords": ["pressure cooker", "mixer", "grinder", "blender", "juicer", "microwave", "oven",
                     "toaster", "induction", "air fryer", "rice cooker", "kettle", "coffee maker",
                     "dishwasher", "water purifier", "ro purifier", "chimney", "exhaust fan"],
        "base": 22, "spread": 16, "rate_pct": 13,
        "reasons": [
            ["Motor noise higher than published specification", "Gasket or seal quality affects long-term performance"],
            ["Heating element slower than advertised", "Plastic parts discolour under sustained high heat"],
            ["Spare parts difficult to source locally", "Warranty service requires courier to distant centre"],
        ],
        "suggestions": [
            "Verify voltage and wattage match your home power supply.",
            "Check if an authorised service centre exists in your city.",
            "Test at full capacity within the return window.",
        ],
    },
    {
        "keywords": ["dumbbell", "barbell", "kettlebell", "weight plate", "treadmill", "cycle", "yoga mat",
                     "resistance band", "pull-up bar", "jump rope", "foam roller", "gym equipment",
                     "protein", "supplement", "whey"],
        "base": 20, "spread": 16, "rate_pct": 16,
        "reasons": [
            ["Actual weight differs from label by 5–8%", "Rubber coating odour strong for the first few weeks"],
            ["Assembly more complex than instruction booklet suggests", "Resistance band thickness uneven across set"],
            ["Foam density compresses faster than expected", "Weight capacity overstated for daily heavy use"],
        ],
        "suggestions": [
            "Verify weight or resistance specs match your training level.",
            "Watch assembly videos before purchase for complex equipment.",
            "Confirm it fits your available workout space before ordering.",
        ],
    },
    {
        "keywords": ["book", "novel", "paperback", "hardcover", "textbook", "guide ", "manual", " edition",
                     "volume ", "comic", "manga", "autobiography", "biography", "fiction", "non-fiction"],
        "base": 6, "spread": 8, "rate_pct": 5,
        "reasons": [
            ["Wrong edition or reprint delivered in some orders", "Cover condition varies for older or high-demand titles"],
            ["Binding quality lower in budget print runs", "Pages yellowed on older warehouse stock"],
        ],
        "suggestions": [
            "Confirm the exact edition and ISBN before purchasing.",
            "Check seller rating for collector or academic editions.",
        ],
    },
    {
        "keywords": ["watch", "smartwatch", "fitness band", "mi band", "fitbit", "garmin", "fossil",
                     "noise watch", "fire-boltt", "boat watch", "titan", "casio", "seiko"],
        "base": 35, "spread": 20, "rate_pct": 22,
        "reasons": [
            ["GPS accuracy drifts during outdoor activity tracking", "Heart rate sensor readings inconsistent at rest"],
            ["Battery life lower than advertised under always-on display", "Strap material causes skin irritation for some users"],
            ["Crown or button stiffness reported after a few months", "Notification sync delay with some Android versions"],
        ],
        "suggestions": [
            "Test GPS and heart-rate accuracy within the return window.",
            "Check strap material compatibility if you have sensitive skin.",
            "Verify compatibility with your phone's OS version.",
        ],
    },
    {
        "keywords": ["camera", "dslr", "mirrorless", "lens", "gopro", "action cam", "webcam", "ring light",
                     "tripod", "gimbal", "drone"],
        "base": 28, "spread": 18, "rate_pct": 16,
        "reasons": [
            ["Sensor dust spots present on some refurbished units", "Auto-focus hunting reported in low light"],
            ["Shutter count may be higher than disclosed", "Lens mount alignment slightly off in rare units"],
            ["Video stabilisation less effective than sample footage", "Battery capacity reduced from original spec"],
        ],
        "suggestions": [
            "Check shutter count (for DSLRs) immediately on delivery.",
            "Test autofocus and video stabilisation before return window closes.",
            "Inspect sensor for dust spots using a blank white capture.",
        ],
    },
]

# Generic fallback by broad category when no keyword matches
_CATEGORY_FALLBACK = {
    "Electronics": {
        "base": 42, "spread": 22, "rate_pct": 22,
        "reasons": [
            ["Compatibility issues with existing devices", "Build quality varies across production batches"],
            ["Software issues reported in early units", "Performance degrades after extended use"],
        ],
        "suggestions": ["Test all functions thoroughly within the return window."],
    },
    "Apparel & Footwear": {
        "base": 55, "spread": 20, "rate_pct": 38,
        "reasons": [
            ["Sizing inconsistent with standard measurements", "Colour varies under different lighting conditions"],
            ["Fabric quality does not match product description", "Stitching quality inconsistent across units"],
        ],
        "suggestions": ["Check the size guide and enable free returns before purchasing."],
    },
    "Home Appliances": {
        "base": 28, "spread": 18, "rate_pct": 14,
        "reasons": [
            ["Installation complexity higher than expected", "Performance drops after several months of use"],
            ["Spare parts difficult to source locally", "Warranty service turnaround is slow"],
        ],
        "suggestions": ["Verify voltage requirements and service centre availability in your city."],
    },
    "Books & Stationery": {
        "base": 7, "spread": 8, "rate_pct": 5,
        "reasons": [
            ["Wrong edition delivered in some orders", "Cover condition varies for older titles"],
        ],
        "suggestions": ["Confirm edition and ISBN before purchasing."],
    },
    "Sports & Fitness": {
        "base": 26, "spread": 18, "rate_pct": 18,
        "reasons": [
            ["Dimensions or weight differ from listing", "Material durability concerns under heavy use"],
            ["Assembly instructions unclear", "Grip coating wears with sweat exposure"],
        ],
        "suggestions": ["Verify specifications match your fitness level and use case."],
    },
    "Other": {
        "base": 33, "spread": 22, "rate_pct": 20,
        "reasons": [
            ["Product may not exactly match description", "Quality control inconsistent across batches"],
        ],
        "suggestions": ["Read recent buyer reviews carefully before purchasing."],
    },
}


def _match_profile(product_name: str) -> Optional[dict]:
    name_lower = product_name.lower()
    for profile in _PRODUCT_PROFILES:
        if any(kw in name_lower for kw in profile["keywords"]):
            return profile
    return None


def _smart_mock(product_name: str, category: str, price_inr: int) -> dict:
    seed = int(hashlib.md5(product_name.lower().strip().encode()).hexdigest()[:8], 16)

    profile = _match_profile(product_name)
    if profile is None:
        fallback = _CATEGORY_FALLBACK.get(category, _CATEGORY_FALLBACK["Other"])
        profile = {
            "base": fallback["base"],
            "spread": fallback["spread"],
            "rate_pct": fallback["rate_pct"],
            "reasons": fallback["reasons"],
            "suggestions": fallback["suggestions"],
        }

    offset = (seed % (profile["spread"] * 2)) - profile["spread"]
    price_bump = min(16, (price_inr // 5000) * 3)
    score = max(4, min(94, profile["base"] + offset + price_bump))

    risk_level = "low" if score < 30 else ("high" if score >= 60 else "medium")

    reasons = profile["reasons"][seed % len(profile["reasons"])]
    suggestion = profile["suggestions"][seed % len(profile["suggestions"])]

    rate_pct = profile["rate_pct"]
    if score >= 60:
        rate_pct = min(58, rate_pct + 10)
    elif score < 25:
        rate_pct = max(3, rate_pct - 7)

    return {
        "risk_level": risk_level,
        "risk_score": score,
        "top_reasons": list(reasons),
        "suggestion": suggestion,
        "return_rate_estimate": f"{rate_pct}% of buyers return this category",
    }


class RiskRequest(BaseModel):
    product_name: str
    category: str
    price_inr: int


class RiskResponse(BaseModel):
    risk_level: str
    risk_score: int
    top_reasons: List[str]
    suggestion: str
    return_rate_estimate: str
    mock: bool = False


def _parse_json(text: str) -> dict:
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        m = re.search(r"\{.*\}", text, re.DOTALL)
        if m:
            return json.loads(m.group())
        raise


def _call_groq(product_name: str, category: str, price_inr: int) -> dict:
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
                    f"Category: {category}\n"
                    f"Price: ₹{price_inr}\n\n"
                    "Return ONLY the raw JSON, no markdown."
                ),
            },
        ],
        max_tokens=512,
    )
    raw = resp.choices[0].message.content
    return _parse_json(raw)


@router.post("/return-risk", response_model=RiskResponse)
def check_return_risk(request: RiskRequest):
    is_mock = False
    try:
        result = _call_groq(request.product_name, request.category, request.price_inr)
    except Exception:
        result = _smart_mock(request.product_name, request.category, request.price_inr)
        is_mock = True

    return RiskResponse(
        risk_level=result["risk_level"],
        risk_score=int(result["risk_score"]),
        top_reasons=result["top_reasons"],
        suggestion=result["suggestion"],
        return_rate_estimate=result["return_rate_estimate"],
        mock=is_mock,
    )
