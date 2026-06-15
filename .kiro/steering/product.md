# Second Life Commerce — Product Overview

Second Life Commerce (SLC) is an Amazon-integrated platform that gives returned products a second life through sustainable resale, exchange, donation, or recycling.

## Core User Flows

1. **Return & Relist** — Upload product photos → AI grades condition → list on marketplace at suggested price
2. **Exchange/Swap** — After grading, choose another marketplace item to swap instead of a refund
3. **Donate** — Skip resale; earn ₹200 wallet credits
4. **Recycle** — Eco-friendly disposal; earn ₹100 wallet credits

## AI Grading Tiers

| Grade | Condition | Resale % of Market |
|-------|-----------|--------------------|
| A     | Like New  | 75%                |
| B     | Good/Refurbished | 55%         |
| C     | Fair      | 30%                |
| Junk  | Non-functional | Recycle only |

## Key Entities

- **ReturnGrade** — AI grading result for a returned item (grade, confidence, damage notes, resale value)
- **Listing** — Marketplace listing created from a return grade
- **Order** — Purchase or swap transaction (My Purchases / My Sales)
- **CreditTransaction** — Wallet credit earned from donate/recycle actions

## Platform Rules

- All prices in Indian Rupees (₹)
- Grading is instant (photo analysis via AWS Bedrock Claude, fallback to Groq)
- Listing copy (title, description, highlights) generated via AWS Bedrock Claude, fallback to Groq
- Customer can override AI-suggested price before listing
- Wallet credits are non-withdrawable; used for marketplace purchases
