# Tech Stack & Conventions

## Frontend

- **React 18** + **Vite** — SPA, no SSR
- **Tailwind CSS** — utility-first styling; custom colors: `amz-orange` (#FF9900), `amz-dark` (#232F3E), `amz-bg` (#EAEDED)
- **Axios** — HTTP client; all API calls go to `/api/v1/...` (Vite proxies to `localhost:8000`)
- **React Router v6** — client-side routing
- Pages: `Home`, `Returns`, `Marketplace`, `Wallet`, `Orders`
- Key components: `Header`, `CartDrawer`, `ChatBot`, `ReturnRiskChecker`
- State: `CartContext` (React Context) for cart items

## Backend

- **FastAPI** — REST API, async where IO-bound
- **SQLAlchemy** + **SQLite** (`second_life.db`) — ORM; models in `backend/models/`
- **Pydantic v2** + **pydantic-settings** — request/response validation and `.env` config
- **Uvicorn** — ASGI server; start via `./venv/bin/uvicorn main:app --reload --port 8000`
- Route modules in `backend/routes/`; each is an `APIRouter` mounted in `main.py`

## AI / ML

- **AWS Bedrock** (`anthropic.claude-sonnet-4-5-20251001`) — **primary** for vision grading and listing copy generation
- **Groq** (`llama-3.3-70b-versatile`, `meta-llama/llama-4-scout-17b-16e-instruct`) — fallback for all AI calls
- Pattern: always try Bedrock first → Groq fallback → deterministic mock last

## AWS Services

- **Bedrock Runtime** (`us-east-1`) — Claude Claude 4.5 for vision and text generation
- **S3** — image storage for uploaded product photos (optional; falls back to local `static/uploads/`)
- Credentials from `backend/.env`: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET_NAME`

## Environment Variables (`backend/.env`)

```
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
S3_BUCKET_NAME=
GROQ_API_KEY=
DATABASE_URL=sqlite:///./second_life.db
```

## Code Conventions

- No comments unless the WHY is non-obvious
- No docstrings on simple CRUD functions
- Prefer editing existing files over creating new ones
- Tailwind rotation: `-rotate-90` = counter-clockwise 90°, `rotate-90` = clockwise
- API prefix pattern: `/api/v1/<resource>`
