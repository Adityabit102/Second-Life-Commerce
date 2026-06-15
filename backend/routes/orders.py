import json
import random
from datetime import date, datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from models.database import get_db
from models.order import Order

router = APIRouter()

STATUS_FLOW = [
    "pending",
    "confirmed",
    "agent_assigned",
    "agent_en_route",
    "agent_arrived",
    "agent_analyzed",
    "item_picked_up",
    "out_for_delivery",
    "dispatched",
    "delivered",
]

STATUS_LABELS = {
    "pending":          "Listed — Awaiting Purchase",
    "confirmed":        "Purchase Confirmed",
    "agent_assigned":   "Agent Assigned",
    "agent_en_route":   "Agent En Route",
    "agent_arrived":    "Agent Arrived at Pickup",
    "agent_analyzed":   "Item Analyzed by Agent",
    "item_picked_up":   "Item Picked Up",
    "out_for_delivery": "Out for Delivery",
    "dispatched":       "Dispatched",
    "delivered":        "Delivered ✓",
}

SELLER_NOTES = {
    "pending":          "Your listing is live — waiting for a buyer",
    "confirmed":        "🎉 Someone bought your item! Pickup being arranged",
    "agent_assigned":   "Agent {agent} assigned — arrives {date} · {time}",
    "agent_en_route":   "Agent {agent} is on the way to your address",
    "agent_arrived":    "Agent has arrived and is inspecting your item",
    "agent_analyzed":   "Agent photographed & graded your item — buyer notified",
    "item_picked_up":   "Item picked up — heading to dispatch center",
    "out_for_delivery": "Item is out for delivery to the buyer",
    "dispatched":       "Item dispatched from fulfillment center",
    "delivered":        "✅ Item delivered! Green Credits added to your wallet",
}

BUYER_NOTES = {
    "pending":          "Seller has listed this item",
    "confirmed":        "Your order is confirmed — seller has been notified",
    "agent_assigned":   "Agent {agent} will collect your item from seller on {date}",
    "agent_en_route":   "Agent is en route to collect your item from the seller",
    "agent_arrived":    "Agent is at seller's location — inspecting the item now",
    "agent_analyzed":   "Inspection complete — updated photo & condition sent to you",
    "item_picked_up":   "Agent picked up the item — heading to dispatch center",
    "out_for_delivery": "Your item is out for delivery! 🚚",
    "dispatched":       "Your item has been dispatched",
    "delivered":        "🎉 Your item has been delivered! Enjoy your purchase",
}

MOCK_AGENTS = [
    {"name": "Ravi Kumar",   "phone": "+91 98765 43210"},
    {"name": "Priya Nair",   "phone": "+91 65432 10987"},
    {"name": "Amit Singh",   "phone": "+91 76543 21098"},
    {"name": "Suresh Patel", "phone": "+91 87654 32109"},
]

MOCK_BUYERS = [
    {"name": "Arjun M.",  "city": "Bengaluru"},
    {"name": "Sneha R.",  "city": "Pune"},
    {"name": "Rahul K.",  "city": "Mumbai"},
    {"name": "Deepa V.",  "city": "Chennai"},
    {"name": "Vikas S.",  "city": "Delhi"},
    {"name": "Ananya P.", "city": "Hyderabad"},
]


def _now_str() -> str:
    return datetime.now().strftime("%d %b %Y, %I:%M %p")


def _get_eta():
    d = date.today() + timedelta(days=1)
    slots = ["9:00 AM – 12:00 PM", "12:00 PM – 3:00 PM", "3:00 PM – 6:00 PM"]
    return d.strftime("%a, %d %b"), random.choice(slots)


def _build_note(status: str, order: Order) -> str:
    seller_view = (order.user_role == "seller")
    notes = SELLER_NOTES if seller_view else BUYER_NOTES
    return notes.get(status, "").format(
        agent=order.agent_name or "—",
        date=order.agent_eta_date or "—",
        time=order.agent_eta_time or "—",
    )


def _advance_order(order: Order) -> bool:
    try:
        idx = STATUS_FLOW.index(order.status)
    except ValueError:
        return False
    if idx >= len(STATUS_FLOW) - 1:
        return False

    new_status = STATUS_FLOW[idx + 1]

    # Assign buyer on confirmation
    if new_status == "confirmed" and not order.buyer_name:
        b = random.choice(MOCK_BUYERS)
        order.buyer_name = b["name"]
        order.delivery_city = b["city"]

    # Assign agent
    if new_status == "agent_assigned":
        ag = random.choice(MOCK_AGENTS)
        order.agent_name = ag["name"]
        order.agent_phone = ag["phone"]
        order.agent_eta_date, order.agent_eta_time = _get_eta()

    # Agent takes photo and analyzes item
    if new_status == "agent_analyzed" and not order.agent_photo_url:
        order.agent_photo_url = order.image_url
        order.agent_analysis_json = json.dumps({
            "grade": order.grade,
            "notes": (
                f"Grade {order.grade} confirmed — condition matches listing description. "
                "No additional damage detected on closer inspection."
            ),
            "price_change": False,
            "price": order.original_price,
        })

    order.status = new_status
    events = json.loads(order.events_json or "[]")
    events.append({
        "status": new_status,
        "label": STATUS_LABELS[new_status],
        "note": _build_note(new_status, order),
        "ts": _now_str(),
    })
    order.events_json = json.dumps(events)
    return True


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class CreateOrderRequest(BaseModel):
    listing_id: Optional[int] = None
    product_name: str
    image_url: Optional[str] = None
    grade: str
    original_price: int
    user_role: str = "seller"
    pickup_address: Optional[dict] = None


class AgentAnalysisUpdate(BaseModel):
    photo_url: Optional[str] = None
    grade: Optional[str] = None
    notes: Optional[str] = None
    updated_price: Optional[int] = None


class SellerDecisionRequest(BaseModel):
    accept: bool


class EventOut(BaseModel):
    status: str
    label: str
    note: str
    ts: str


class OrderOut(BaseModel):
    id: int
    listing_id: Optional[int]
    product_name: str
    image_url: Optional[str]
    grade: str
    original_price: int
    final_price: Optional[int]
    user_role: str
    seller_name: str
    pickup_address: Optional[dict]
    buyer_name: Optional[str]
    delivery_city: Optional[str]
    agent_name: Optional[str]
    agent_phone: Optional[str]
    agent_eta_date: Optional[str]
    agent_eta_time: Optional[str]
    agent_photo_url: Optional[str]
    agent_analysis: Optional[dict]
    seller_decision: Optional[str]
    status: str
    status_label: str
    status_index: int
    events: List[EventOut]
    created_at: str


def _to_out(o: Order) -> OrderOut:
    events_raw = json.loads(o.events_json or "[]")
    addr = json.loads(o.pickup_address_json) if o.pickup_address_json else None
    analysis = json.loads(o.agent_analysis_json) if o.agent_analysis_json else None
    try:
        si = STATUS_FLOW.index(o.status)
    except ValueError:
        # cancelled orders show progress frozen at agent_analyzed
        si = STATUS_FLOW.index("agent_analyzed") if o.status == "cancelled" else 0
    return OrderOut(
        id=o.id,
        listing_id=o.listing_id,
        product_name=o.product_name,
        image_url=o.image_url,
        grade=o.grade,
        original_price=o.original_price,
        final_price=o.final_price,
        user_role=o.user_role or "seller",
        seller_name=o.seller_name or "Adrika S.",
        pickup_address=addr,
        buyer_name=o.buyer_name,
        delivery_city=o.delivery_city,
        agent_name=o.agent_name,
        agent_phone=o.agent_phone,
        agent_eta_date=o.agent_eta_date,
        agent_eta_time=o.agent_eta_time,
        agent_photo_url=o.agent_photo_url,
        agent_analysis=analysis,
        seller_decision=o.seller_decision,
        status=o.status,
        status_label=STATUS_LABELS.get(o.status, o.status),
        status_index=si,
        events=[EventOut(**e) for e in events_raw],
        created_at=o.created_at.isoformat() if o.created_at else "",
    )


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/", response_model=OrderOut)
def create_order(req: CreateOrderRequest, db: Session = Depends(get_db)):
    seller_view = req.user_role == "seller"
    initial_note = SELLER_NOTES["pending"] if seller_view else BUYER_NOTES["pending"]
    events = [{"status": "pending", "label": STATUS_LABELS["pending"], "note": initial_note, "ts": _now_str()}]
    o = Order(
        listing_id=req.listing_id,
        product_name=req.product_name,
        image_url=req.image_url,
        grade=req.grade,
        original_price=req.original_price,
        user_role=req.user_role,
        pickup_address_json=json.dumps(req.pickup_address) if req.pickup_address else None,
        events_json=json.dumps(events),
    )
    db.add(o)
    db.commit()
    db.refresh(o)
    return _to_out(o)


@router.get("/", response_model=List[OrderOut])
def list_orders(db: Session = Depends(get_db)):
    rows = db.query(Order).order_by(Order.id.asc()).all()
    return [_to_out(r) for r in rows]


@router.post("/demo-reset")
def demo_reset(db: Session = Depends(get_db)):
    from seed_demo_data import seed_demo_orders
    db.query(Order).delete()
    db.commit()
    seed_demo_orders(db)
    rows = db.query(Order).order_by(Order.id.asc()).all()
    return [_to_out(r) for r in rows]


@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db)):
    o = db.query(Order).filter(Order.id == order_id).first()
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")
    return _to_out(o)


@router.post("/{order_id}/advance", response_model=OrderOut)
def advance_order(order_id: int, db: Session = Depends(get_db)):
    o = db.query(Order).filter(Order.id == order_id).first()
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")
    if o.status == "cancelled":
        raise HTTPException(status_code=400, detail="Order is cancelled")
    # Block advance if seller must decide on agent's price update first
    if (o.status == "agent_analyzed" and o.user_role == "seller"
            and o.agent_analysis_json and not o.seller_decision):
        analysis = json.loads(o.agent_analysis_json)
        if analysis.get("price_change"):
            raise HTTPException(
                status_code=409,
                detail="Seller must accept or decline the agent's price update before proceeding",
            )
    _advance_order(o)
    db.commit()
    db.refresh(o)
    return _to_out(o)


@router.post("/{order_id}/seller-decision", response_model=OrderOut)
def seller_price_decision(order_id: int, req: SellerDecisionRequest, db: Session = Depends(get_db)):
    o = db.query(Order).filter(Order.id == order_id).first()
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")
    if o.status != "agent_analyzed":
        raise HTTPException(status_code=400, detail="Order is not awaiting a seller price decision")

    events = json.loads(o.events_json or "[]")

    if req.accept:
        o.seller_decision = "accepted"
        if o.agent_analysis_json:
            analysis = json.loads(o.agent_analysis_json)
            if analysis.get("price_change"):
                o.final_price = analysis.get("price")
        new_price = o.final_price or o.original_price
        o.status = "item_picked_up"
        events.append({
            "status": "item_picked_up",
            "label": STATUS_LABELS["item_picked_up"],
            "note": f"✅ You accepted ₹{new_price:,} — agent is picking up your item now",
            "ts": _now_str(),
        })
    else:
        o.seller_decision = "declined"
        o.status = "cancelled"
        events.append({
            "status": "cancelled",
            "label": "Sale Cancelled",
            "note": "❌ You declined the agent's updated price — sale cancelled, item stays with you",
            "ts": _now_str(),
        })

    o.events_json = json.dumps(events)
    db.commit()
    db.refresh(o)
    return _to_out(o)


@router.post("/{order_id}/agent-analysis", response_model=OrderOut)
def set_agent_analysis(order_id: int, req: AgentAnalysisUpdate, db: Session = Depends(get_db)):
    o = db.query(Order).filter(Order.id == order_id).first()
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")
    if req.photo_url:
        o.agent_photo_url = req.photo_url
    if req.updated_price:
        o.final_price = req.updated_price
    o.agent_analysis_json = json.dumps({
        "grade": req.grade or o.grade,
        "notes": req.notes or "Item inspected and verified by agent",
        "price_change": bool(req.updated_price and req.updated_price != o.original_price),
        "price": req.updated_price or o.original_price,
    })
    db.commit()
    db.refresh(o)
    return _to_out(o)
