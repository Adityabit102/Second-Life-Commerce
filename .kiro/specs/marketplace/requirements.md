# Marketplace — Feature Specification

## Overview

A second-hand marketplace where graded items are listed for sale. Listings are created automatically after grading. Buyers can browse, filter by grade, add to cart, or buy now. Sellers see their sold items in Orders → My Sales.

## Requirements

### Listing Creation

1. After grading, customer chooses "List on Marketplace"
2. AWS Bedrock Claude generates title, description, highlights, and suggested price
3. Customer can override price and listing details before publishing
4. Listing is stored in `Listing` table with grade, trust score, image URL

### AI Listing Copy Priority

1. **AWS Bedrock** (`anthropic.claude-sonnet-4-5-20251001`) — text generation
2. **Groq** (`llama-3.3-70b-versatile`) — fallback
3. **Template mock** — deterministic string with grade label (never errors)

### Trust Score Calculation

```
trust_score = (confidence × 0.6) + (grade_score × 0.4)
grade_scores = { A: 100, B: 75, C: 50, Junk: 0 }
```

### Browsing & Filtering

- List all active listings sorted by newest
- Filter by grade (A / B / C / Junk)
- "AI Recommends" badge on listings matching the user's recent return category

### Exchange/Swap

- Customer can swap their graded item for any active marketplace listing
- Swap marks the customer's item as sold and adds the received item to My Purchases

## API

- `POST /api/v1/marketplace/listings` — create listing
- `GET /api/v1/marketplace/listings` — list all (filter: `?grade=A&status=active`)
- `GET /api/v1/marketplace/listings/{id}` — get single listing
- `PATCH /api/v1/marketplace/listings/{id}/sold` — mark sold

## Acceptance Criteria

- [ ] Listing created with Bedrock-generated title when credentials configured
- [ ] Groq fallback produces valid title/description when Bedrock unavailable
- [ ] Trust score correctly calculated from confidence + grade score
- [ ] Grade filter returns only listings of selected grade
- [ ] Swap sets listing status to "sold" and creates Order record for buyer
