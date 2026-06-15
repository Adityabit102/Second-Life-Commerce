from sqlalchemy import Column, DateTime, Float, Integer, String, Text
from sqlalchemy.sql import func

from models.database import Base


class ReturnGrade(Base):
    __tablename__ = "return_grades"

    id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String, nullable=True)
    grade = Column(String, nullable=False)               # A | B | C | Junk
    confidence = Column(Integer, nullable=False)
    damage_detected = Column(String, nullable=False)
    recommended_action = Column(String, nullable=False)  # resell | refurbish | donate | recycle
    reason = Column(Text, nullable=False)
    estimated_resale_value_inr = Column(Integer, nullable=False)
    co2_saved_kg = Column(Float, nullable=False)
    credits_earned = Column(Integer, nullable=False)
    is_mock = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
