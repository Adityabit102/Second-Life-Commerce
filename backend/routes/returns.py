from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from models.database import get_db
from models.return_request import ReturnRequest
from services.returns_service import create_return_request

router = APIRouter()


class ReturnRequestCreate(BaseModel):
    order_id: str
    product_name: str
    reason: str
    condition_description: str
    customer_email: str
    original_price: float
    image_url: Optional[str] = None


class ReturnRequestResponse(BaseModel):
    id: int
    order_id: str
    product_name: str
    reason: str
    condition: str
    ai_recommendation: str
    resale_value: Optional[float]
    image_url: Optional[str]
    status: str
    customer_email: str
    ai_notes: Optional[str]

    class Config:
        from_attributes = True


@router.post("/", response_model=ReturnRequestResponse)
def submit_return(request: ReturnRequestCreate, db: Session = Depends(get_db)):
    try:
        return create_return_request(
            db=db,
            order_id=request.order_id,
            product_name=request.product_name,
            reason=request.reason,
            condition_description=request.condition_description,
            customer_email=request.customer_email,
            original_price=request.original_price,
            image_url=request.image_url,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[ReturnRequestResponse])
def list_returns(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    return db.query(ReturnRequest).offset(skip).limit(limit).all()


@router.get("/{return_id}", response_model=ReturnRequestResponse)
def get_return(return_id: int, db: Session = Depends(get_db)):
    row = db.query(ReturnRequest).filter(ReturnRequest.id == return_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Return request not found")
    return row


@router.patch("/{return_id}/status")
def update_status(return_id: int, status: str, db: Session = Depends(get_db)):
    row = db.query(ReturnRequest).filter(ReturnRequest.id == return_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Return request not found")
    row.status = status
    db.commit()
    return {"message": "Status updated", "status": status}
