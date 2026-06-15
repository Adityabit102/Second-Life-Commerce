"""
Refreshes every marketplace listing with Groq-generated real-life
Indian market prices, honest descriptions, and specific highlights.
Run with: python update_marketplace.py
"""
import json
import re
import sys
import os

# Make sure we can import project modules
sys.path.insert(0, os.path.dirname(__file__))

from groq import Groq
from sqlalchemy.orm import Session
from models.database import engine
from models.listing import Listing
from utils.config import settings

GROQ_API_KEY = settings.groq_api_key or os.environ.get("GROQ_API_KEY", "")

SYSTEM_PROMPT = """You are a second-hand marketplace expert for India (like OLX/Quikr).
Given a product listing, generate realistic resale content based on ACTUAL current Indian market prices.

Grading scale:
- Grade A = like-new / opened-unused / worn once → 65-75% of current Amazon India price
- Grade B = minor cosmetic wear, fully functional → 45-55% of current Amazon India price
- Grade C = visible damage / partial function     → 20-30% of current Amazon India price

Return ONLY valid raw JSON, no markdown, no code blocks:
{
  "title": "string — max 60 chars, honest about grade and key condition fact",
  "description": "string — 2 sentences: what condition it is in + who should buy it",
  "suggested_price_inr": integer,
  "highlights": ["string", "string", "string", "string", "string"]
}

Rules:
- suggested_price_inr must match real 2024-25 Indian market (check your knowledge of Amazon.in prices)
- highlights must be SPECIFIC to this exact product model — mention actual specs/features
- Be honest about any defect mentioned in the condition notes
- Do not invent defects that are not mentioned
"""


def parse_json(text: str) -> dict:
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        m = re.search(r"\{.*\}", text, re.DOTALL)
        if m:
            return json.loads(m.group())
        raise


def call_groq(product_name: str, grade: str, damage: str) -> dict:
    client = Groq(api_key=GROQ_API_KEY)
    resp = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    f"Product: {product_name}\n"
                    f"Grade: {grade}\n"
                    f"Condition notes: {damage}\n\n"
                    "Generate the listing JSON."
                ),
            },
        ],
        max_tokens=600,
        temperature=0.3,
    )
    raw = resp.choices[0].message.content
    return parse_json(raw)


def main():
    with Session(engine) as db:
        listings = db.query(Listing).filter(Listing.status == "active").all()
        print(f"Found {len(listings)} active listings\n")

        for listing in listings:
            print(f"  [{listing.id}] {listing.product_name[:60]}")
            # Get damage info from existing description if not stored separately
            damage = listing.description or "Minor cosmetic wear; fully functional"
            try:
                content = call_groq(listing.product_name, listing.grade, damage)
                listing.title = content["title"][:80]
                listing.description = content["description"]
                listing.suggested_price_inr = int(content["suggested_price_inr"])
                listing.highlights_json = json.dumps(content["highlights"])
                db.commit()
                print(f"       ✓ ₹{listing.suggested_price_inr:,}  — {listing.title}")
            except Exception as e:
                print(f"       ✗ ERROR: {e}")

        print(f"\nDone — {len(listings)} listings updated.")


if __name__ == "__main__":
    main()
