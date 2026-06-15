import json
import re
from typing import List

import boto3
from fastapi import APIRouter
from pydantic import BaseModel

from utils.config import settings

router = APIRouter()

SYSTEM_PROMPT = (
    "You are Amazon's friendly return prevention assistant. A customer wants to return "
    "a product. Your job is to genuinely help them — not trick them into keeping it.\n"
    "Offer help in this priority order:\n"
    "1. A specific, actionable troubleshooting step for their exact issue\n"
    "2. A spare part or accessory that fixes it (format as 'Amazon.in/dp/XXXXXX')\n"
    "3. An offer to list it for peer resale and earn money back\n"
    "CRITICAL: If the customer responds with agreement (yes, sure, ok, go ahead, sounds good, etc.) "
    "to any of your suggestions, immediately reply with: "
    "'Perfect! Please upload a clear photo of your item below so our AI can grade its condition and get everything ready.' "
    "and set offer_type to 'accept_return'.\n"
    "If the customer has already received 2 suggestions and still wants to return, "
    "accept gracefully and ask them to upload a photo.\n"
    "ALWAYS return ONLY this JSON, no markdown:\n"
    "{\n"
    "  message: string (your response, max 2 sentences),\n"
    "  offer_type: 'fix' or 'part' or 'resale' or 'accept_return',\n"
    "  deflected: true or false,\n"
    "  suggestion_count: number\n"
    "}"
)

# ── Intent patterns for context-aware mock responses ──────────────────────────

_INTENT_RULES = [
    # ── Don't need / change of mind / no longer required ──────────────────
    {
        "keys": ["don't need", "dont need", "no longer need", "changed my mind",
                 "don't want", "dont want", "not needed", "not required",
                 "i don't want", "don't use", "dont use", "no use"],
        "offer_type": "resale",
        "message": (
            "Since you no longer need it, we can list it on our Second Life Marketplace "
            "so you earn money back — no hassle, we handle everything. "
            "Would you like us to create a listing for your {product}?"
        ),
    },
    # ── Wrong size / doesn't fit ───────────────────────────────────────────
    {
        "keys": ["wrong size", "doesn't fit", "doesnt fit", "too big", "too small",
                 "too large", "size issue", "incorrect size", "size mismatch",
                 "wrong size", "size wrong"],
        "offer_type": "fix",
        "message": (
            "We can arrange a free size exchange for your {product} — no need to start "
            "a full return! Just confirm the correct size and we'll dispatch the swap within 24 hours."
        ),
    },
    # ── Bought by mistake / wrong item ordered ─────────────────────────────
    {
        "keys": ["bought by mistake", "wrong product", "ordered by mistake", "wrong item",
                 "wrong model", "wrong color", "wrong colour", "accidentally ordered",
                 "mistaken order"],
        "offer_type": "resale",
        "message": (
            "No problem! Since this was ordered by mistake, listing your {product} on "
            "our Second Life Marketplace is the quickest way to recover your money — "
            "verified buyers are already browsing."
        ),
    },
    # ── Duplicate / already have one ──────────────────────────────────────
    {
        "keys": ["duplicate", "already have", "have one already", "two of",
                 "bought another", "have similar", "already own"],
        "offer_type": "resale",
        "message": (
            "Since you have a duplicate, listing the extra {product} on our marketplace "
            "is a great way to turn it into cash. We'll create an AI-graded listing for you — "
            "shall we proceed?"
        ),
    },
    # ── Gift / gift issue ──────────────────────────────────────────────────
    {
        "keys": ["gift", "gifted", "present", "didn't like it", "they don't like",
                 "recipient", "for someone"],
        "offer_type": "resale",
        "message": (
            "If the gift didn't land perfectly, you can sell your {product} on our "
            "Second Life Marketplace and use the proceeds to pick something they'd love more. "
            "Want us to handle the listing?"
        ),
    },
    # ── Price / found cheaper ──────────────────────────────────────────────
    {
        "keys": ["cheaper", "better price", "found it cheaper", "price match",
                 "lower price", "overpriced", "too expensive", "other site",
                 "better deal", "less price"],
        "offer_type": "fix",
        "message": (
            "We offer a 30-day price match guarantee — if you found your {product} "
            "cheaper on another site, share the link and we'll refund the difference "
            "right to your account."
        ),
    },
    # ── Damaged / physically broken ────────────────────────────────────────
    {
        "keys": ["broken", "cracked", "shattered", "snapped", "physically damaged",
                 "smashed", "bent", "dent", "scratched badly", "screen broken"],
        "offer_type": "part",
        "message": (
            "Physical damage on a {product} can often be repaired for a fraction of "
            "the replacement cost — we can connect you with a certified repair partner. "
            "Want us to find repair options near you?"
        ),
    },
    # ── Not working / technical issue ─────────────────────────────────────
    {
        "keys": ["not working", "doesn't work", "doesnt work", "stopped working",
                 "not turning on", "won't turn on", "wont turn on", "dead", "no power",
                 "won't charge", "wont charge", "not charging"],
        "offer_type": "fix",
        "message": (
            "A quick soft-reset often resolves power and charging issues on a {product} — "
            "hold the power button for 10 seconds while plugged in. "
            "If that doesn't help, we'll escalate to a free replacement."
        ),
    },
    # ── Audio / sound issues ───────────────────────────────────────────────
    {
        "keys": ["crackling", "no sound", "audio issue", "sound issue", "one side",
                 "left earbud", "right earbud", "bass", "distort", "low volume",
                 "mic not working", "mic issue"],
        "offer_type": "fix",
        "message": (
            "Audio problems on {product} are usually fixed by re-pairing: forget the "
            "device in Bluetooth settings, hold the pairing button for 5 seconds, then "
            "reconnect. If the issue persists we'll send a free replacement unit."
        ),
    },
    # ── Connectivity / pairing issues ─────────────────────────────────────
    {
        "keys": ["connectivity", "won't connect", "wont connect", "bluetooth", "wifi",
                 "pairing", "not pairing", "disconnects", "keeps disconnecting"],
        "offer_type": "fix",
        "message": (
            "Connectivity issues on {product} can be fixed by clearing paired devices: "
            "turn Bluetooth off and on, then hold the {product}'s pairing button for "
            "6 seconds to reset the connection. This resolves 80% of pairing problems."
        ),
    },
    # ── Battery issues ────────────────────────────────────────────────────
    {
        "keys": ["battery", "battery life", "drains fast", "battery drain",
                 "not lasting", "dies quickly", "short battery"],
        "offer_type": "fix",
        "message": (
            "Battery drain on a {product} is often caused by background apps — "
            "try a full charge cycle (drain to 0%, charge to 100%) and disable "
            "unused background features. If capacity is still low, you qualify for a free battery service."
        ),
    },
    # ── Quality / defective / not as expected ─────────────────────────────
    {
        "keys": ["poor quality", "bad quality", "not as described", "not as expected",
                 "disappointed", "misleading", "fake", "counterfeit", "defective",
                 "manufacturing defect", "quality issue"],
        "offer_type": "fix",
        "message": (
            "That sounds like it could be a manufacturing defect — you're entitled to "
            "a free replacement for your {product} under our quality guarantee. "
            "Shall we arrange a swap with no questions asked?"
        ),
    },
    # ── Insisting / still want to return ──────────────────────────────────
    {
        "keys": ["still want to return", "just return it", "process the return",
                 "want a refund", "give me refund", "refund please", "just refund",
                 "i insist", "nothing will help", "none of this helps", "no thanks",
                 "not interested in resale"],
        "offer_type": "accept_return",
        "message": (
            "Absolutely understood — we've initiated your return for the {product}. "
            "Please upload a photo of the item's current condition so we can complete "
            "the process and issue your refund quickly."
        ),
    },
]

_FALLBACK_MOCK = {
    "message": (
        "Thanks for letting us know. Before we process the return, "
        "would you like us to list your {product} on our Second Life Marketplace "
        "so you can recover some of the cost?"
    ),
    "offer_type": "resale",
}

# Short affirmative words/phrases — only meaningful after ≥1 prior bot reply
_AFFIRMATIVE_KEYS = [
    "sure", "yes", "yeah", "yep", "yup", "ok", "okay", "alright", "all right",
    "go ahead", "sounds good", "let's do it", "lets do it", "please do",
    "do it", "proceed", "that works", "great", "perfect", "why not",
    "fine", "cool", "absolutely", "of course", "definitely", "certainly",
]


def _mock_response(product_name: str, issue: str, history: List) -> dict:
    """Rule-based contextual response — used when Bedrock is unavailable."""
    product = product_name or "item"
    text = issue.lower().strip()

    # Count prior bot suggestions from history
    prior_suggestions = sum(1 for h in history if h.role == "assistant")

    # User is agreeing to a prior suggestion → send them to photo upload
    if prior_suggestions >= 1 and any(k in text for k in _AFFIRMATIVE_KEYS):
        return {
            "message": (
                f"Perfect! Please upload a clear photo of your {product} below "
                "so our AI can grade its condition and get everything ready for you."
            ),
            "offer_type": "accept_return",
            "deflected": True,
            "suggestion_count": prior_suggestions + 1,
        }

    # After 2 suggestions without agreement, accept the return gracefully
    if prior_suggestions >= 2:
        return {
            "message": (
                f"We completely understand — no worries at all! "
                f"Please upload a photo of your {product} below so we can complete the grading and get things moving."
            ),
            "offer_type": "accept_return",
            "deflected": False,
            "suggestion_count": prior_suggestions + 1,
        }

    # Match intent from issue text
    matched = None
    for rule in _INTENT_RULES:
        if any(k in text for k in rule["keys"]):
            matched = rule
            break

    if not matched:
        matched = _FALLBACK_MOCK

    suggestion_count = prior_suggestions + 1
    is_deflected = matched["offer_type"] in ("fix", "part", "resale")

    return {
        "message": matched["message"].format(product=product),
        "offer_type": matched["offer_type"],
        "deflected": is_deflected,
        "suggestion_count": suggestion_count,
    }


class ChatMessage(BaseModel):
    role: str   # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    product_name: str
    issue: str
    history: List[ChatMessage] = []


class ChatResponse(BaseModel):
    message: str
    offer_type: str
    deflected: bool
    suggestion_count: int
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


def _call_bedrock(product_name: str, issue: str, history: List[ChatMessage]) -> dict:
    # Always start with the original issue as the first user turn,
    # then append all subsequent history items.
    messages = [
        {
            "role": "user",
            "content": (
                f"I want to return my {product_name}. "
                f"The issue is: {issue}"
            ),
        }
    ]
    for h in history:
        messages.append({"role": h.role, "content": h.content})

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
        "messages": messages,
    })
    resp = client.invoke_model(modelId="anthropic.claude-sonnet-4-5-20251001", body=body)
    raw = json.loads(resp["body"].read())["content"][0]["text"]
    return _parse_json(raw)


@router.post("/chat", response_model=ChatResponse)
def deflect_chat(request: ChatRequest):
    is_mock = False
    try:
        result = _call_bedrock(request.product_name, request.issue, request.history)
    except Exception:
        result = _mock_response(request.product_name, request.issue, request.history)
        is_mock = True

    return ChatResponse(
        message=result["message"],
        offer_type=result["offer_type"],
        deflected=bool(result.get("deflected", False)),
        suggestion_count=int(result.get("suggestion_count", 1)),
        mock=is_mock,
    )
