from typing import Optional

from sqlalchemy.orm import Session

from models.product import Product
from models.return_request import ReturnRequest
from services.ai_service import ai_service


def create_return_request(
    db: Session,
    order_id: str,
    product_name: str,
    reason: str,
    condition_description: str,
    customer_email: str,
    original_price: float,
    image_url: Optional[str] = None,
) -> ReturnRequest:
    assessment = ai_service.assess_return(product_name, reason, condition_description)

    resale_value = original_price * (
        assessment.get("estimated_resale_value_percent", 0) / 100
    )

    return_request = ReturnRequest(
        order_id=order_id,
        product_name=product_name,
        reason=reason,
        condition=assessment.get("condition", "unknown"),
        ai_recommendation=assessment.get("recommendation", "review"),
        resale_value=resale_value,
        image_url=image_url,
        customer_email=customer_email,
        ai_notes=assessment.get("notes", ""),
        status="pending",
    )
    db.add(return_request)
    db.commit()
    db.refresh(return_request)

    if assessment.get("recommendation") in ("resell", "refurbish_resell"):
        listing = ai_service.generate_product_listing(
            product_name, assessment.get("condition", "good"), "general"
        )
        product = Product(
            title=listing.get("title", product_name),
            description=listing.get("description", ""),
            category="general",
            condition=assessment.get("condition", "good"),
            original_price=original_price,
            resale_price=resale_value,
            image_url=image_url,
            return_request_id=return_request.id,
        )
        db.add(product)
        return_request.status = "listed"
        db.commit()
        db.refresh(return_request)

    return return_request
