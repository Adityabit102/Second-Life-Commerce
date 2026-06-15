from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy.sql import func
from models.database import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(Integer, nullable=True)
    product_name = Column(String, nullable=False)
    image_url = Column(String, nullable=True)
    grade = Column(String, nullable=False)
    original_price = Column(Integer, nullable=False)
    final_price = Column(Integer, nullable=True)

    # "seller" = I listed this item | "buyer" = I purchased this item
    user_role = Column(String, default="seller")

    seller_name = Column(String, default="Adrika S.")
    pickup_address_json = Column(Text, nullable=True)   # JSON {name,phone,line1,city,state,pincode}

    buyer_name = Column(String, nullable=True)
    delivery_city = Column(String, nullable=True)

    agent_name = Column(String, nullable=True)
    agent_phone = Column(String, nullable=True)
    agent_eta_date = Column(String, nullable=True)
    agent_eta_time = Column(String, nullable=True)
    agent_photo_url = Column(String, nullable=True)
    agent_analysis_json = Column(Text, nullable=True)   # JSON {grade,notes,price_change,price}

    seller_decision = Column(String, nullable=True)     # "accepted" | "declined" | null

    status = Column(String, default="pending")
    events_json = Column(Text, default="[]")            # JSON [{status,label,note,ts}]

    created_at = Column(DateTime(timezone=True), server_default=func.now())
