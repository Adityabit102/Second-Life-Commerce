import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func as sqlfunc
from sqlalchemy.orm import Session

from models.credit_transaction import CreditTransaction
from models.database import get_db

router = APIRouter()

CREDITS_MAP = {"A": 50, "B": 30, "C": 15, "Junk": 10}
CO2_MAP = {"resell": 8.0, "refurbish": 5.2, "donate": 3.0, "recycle": 1.5}
TREE_ABSORPTION_KG = 21.7


# ── Pydantic schemas ─────────────────────────────────────────────────────────

class EarnRequest(BaseModel):
    product_name: str
    grade: str
    action: str
    return_id: Optional[int] = None


class TransactionRecord(BaseModel):
    id: int
    product_name: str
    grade: str
    action: str
    credits_earned: int
    co2_saved_kg: float
    trees_equivalent: float
    return_id: Optional[int]
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class EarnResponse(BaseModel):
    credits_earned: int
    total_credits: int
    total_co2_saved: float
    total_trees: float


class RedeemRequest(BaseModel):
    credits_used: int


class RedeemResponse(BaseModel):
    credits_used: int
    remaining_credits: int


class WalletResponse(BaseModel):
    total_returns: int
    total_credits: int
    total_co2_saved_kg: float
    trees_equivalent: float
    plastic_bottles_equivalent: int
    transaction_history: List[TransactionRecord]


# ── Shared service used by returns route ─────────────────────────────────────

def earn_credits_for_grade(
    db: Session,
    product_name: str,
    grade: str,
    action: str,
    return_id: Optional[int] = None,
) -> CreditTransaction:
    credits = CREDITS_MAP.get(grade, 15)
    co2 = CO2_MAP.get(action, 1.5)
    trees = round(co2 / TREE_ABSORPTION_KG, 4)

    tx = CreditTransaction(
        product_name=product_name,
        grade=grade,
        action=action,
        credits_earned=credits,
        co2_saved_kg=co2,
        trees_equivalent=trees,
        return_id=return_id,
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx


def _wallet_totals(db: Session):
    return db.query(
        sqlfunc.sum(CreditTransaction.credits_earned),
        sqlfunc.sum(CreditTransaction.co2_saved_kg),
        sqlfunc.sum(CreditTransaction.trees_equivalent),
    ).first()


# ── Routes ───────────────────────────────────────────────────────────────────

@router.post("/earn", response_model=EarnResponse)
def earn(request: EarnRequest, db: Session = Depends(get_db)):
    tx = earn_credits_for_grade(
        db, request.product_name, request.grade, request.action, request.return_id
    )

    totals = _wallet_totals(db)
    return EarnResponse(
        credits_earned=tx.credits_earned,
        total_credits=int(totals[0] or 0),
        total_co2_saved=round(float(totals[1] or 0.0), 2),
        total_trees=round(float(totals[2] or 0.0), 4),
    )


@router.get("/wallet", response_model=WalletResponse)
def wallet(db: Session = Depends(get_db)):
    totals = _wallet_totals(db)
    total_credits = int(totals[0] or 0)
    total_co2 = float(totals[1] or 0.0)
    total_trees = float(totals[2] or 0.0)
    total_returns = db.query(CreditTransaction).count()

    history = (
        db.query(CreditTransaction)
        .order_by(CreditTransaction.created_at.desc())
        .limit(10)
        .all()
    )

    return WalletResponse(
        total_returns=total_returns,
        total_credits=total_credits,
        total_co2_saved_kg=round(total_co2, 2),
        trees_equivalent=round(total_trees, 2),
        plastic_bottles_equivalent=int(total_co2 * 12),
        transaction_history=history,
    )


@router.post("/redeem", response_model=RedeemResponse)
def redeem_credits(request: RedeemRequest, db: Session = Depends(get_db)):
    from fastapi import HTTPException
    totals = _wallet_totals(db)
    available = int(totals[0] or 0)
    if request.credits_used <= 0:
        raise HTTPException(status_code=400, detail="credits_used must be positive")
    if request.credits_used > available:
        raise HTTPException(status_code=400, detail="Insufficient credits")

    tx = CreditTransaction(
        product_name="Green Credits Redeemed",
        grade="A",
        action="redeem",
        credits_earned=-request.credits_used,
        co2_saved_kg=0.0,
        trees_equivalent=0.0,
        return_id=None,
    )
    db.add(tx)
    db.commit()

    new_totals = _wallet_totals(db)
    return RedeemResponse(
        credits_used=request.credits_used,
        remaining_credits=int(new_totals[0] or 0),
    )
