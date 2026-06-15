from sqlalchemy import Column, Float, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from models.database import Base


class ReturnRequest(Base):
    __tablename__ = "return_requests"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String, index=True)
    product_name = Column(String)
    reason = Column(String)
    condition = Column(String)           # excellent | good | fair | poor
    ai_recommendation = Column(String)   # resell | refurbish_resell | donate | recycle | dispose
    resale_value = Column(Float, nullable=True)
    image_url = Column(String, nullable=True)
    status = Column(String, default="pending")  # pending | approved | rejected | listed
    customer_email = Column(String)
    ai_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
