from sqlalchemy import Column, DateTime, Float, Integer, String, Text
from sqlalchemy.sql import func

from models.database import Base


class Listing(Base):
    __tablename__ = "listings"

    id = Column(Integer, primary_key=True, index=True)
    return_id = Column(Integer, nullable=True)
    product_name = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    image_url = Column(String, nullable=True)
    grade = Column(String, nullable=False)
    trust_score = Column(Float, nullable=False)
    suggested_price_inr = Column(Integer, nullable=False)
    highlights_json = Column(Text, nullable=False)   # JSON array string
    extra_images_json = Column(Text, nullable=True)  # JSON array of additional image URLs
    status = Column(String, default="active", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
