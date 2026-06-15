from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from models.database import get_db
from models.product import Product

router = APIRouter()


class ProductCreate(BaseModel):
    title: str
    description: str
    category: str
    condition: str
    original_price: float
    resale_price: float
    image_url: Optional[str] = None


class ProductResponse(BaseModel):
    id: int
    title: str
    description: str
    category: str
    condition: str
    original_price: float
    resale_price: float
    image_url: Optional[str]
    is_available: bool
    sustainability_score: Optional[float]
    return_request_id: Optional[int]

    class Config:
        from_attributes = True


@router.get("/", response_model=List[ProductResponse])
def list_products(
    skip: int = 0,
    limit: int = 20,
    category: Optional[str] = None,
    condition: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Product).filter(Product.is_available == True)
    if category:
        query = query.filter(Product.category == category)
    if condition:
        query = query.filter(Product.condition == condition)
    return query.offset(skip).limit(limit).all()


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("/", response_model=ProductResponse)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    db_product = Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


@router.patch("/{product_id}/sold")
def mark_sold(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.is_available = False
    db.commit()
    return {"message": "Product marked as sold"}
