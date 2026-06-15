from sqlalchemy import Boolean, Column, Float, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from models.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    category = Column(String)
    condition = Column(String)
    original_price = Column(Float)
    resale_price = Column(Float)
    image_url = Column(String, nullable=True)
    is_available = Column(Boolean, default=True)
    sustainability_score = Column(Float, nullable=True)
    return_request_id = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
