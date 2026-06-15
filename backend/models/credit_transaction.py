from sqlalchemy import Column, DateTime, Float, Integer, String
from sqlalchemy.sql import func

from models.database import Base


class CreditTransaction(Base):
    __tablename__ = "credit_transactions"

    id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String, nullable=False)
    grade = Column(String, nullable=False)
    action = Column(String, nullable=False)
    credits_earned = Column(Integer, nullable=False)
    co2_saved_kg = Column(Float, nullable=False)
    trees_equivalent = Column(Float, nullable=False)
    return_id = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
