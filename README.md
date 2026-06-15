# Second Life Commerce

AI-powered returns and sustainable resale platform.

- **Backend** — Python FastAPI + SQLAlchemy (SQLite) + AWS Bedrock (Claude) + S3
- **Frontend** — React 18 + Vite + Tailwind CSS

---

## Project Structure

```
.
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env.example
│   ├── models/          # SQLAlchemy ORM models
│   ├── routes/          # FastAPI route handlers
│   ├── services/        # Business logic (AI, S3, returns)
│   └── utils/           # Config / settings
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── Dockerfile
│   └── src/
│       ├── components/  # Header, ReturnForm, ProductCard
│       └── pages/       # Home, Returns, Marketplace
├── docker-compose.yml
└── README.md
```

---

## Quick Start (Local)

### 1. Clone and configure environment

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your AWS credentials and S3 bucket name
```

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

API running at **http://localhost:8000**
Interactive docs at **http://localhost:8000/docs**

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App running at **http://localhost:5173**

---

## Quick Start (Docker)

```bash
# Copy and fill in .env first
cp backend/.env.example backend/.env

docker compose up --build
```

| Service  | URL                        |
|----------|----------------------------|
| Frontend | http://localhost:5173      |
| Backend  | http://localhost:8000      |
| API Docs | http://localhost:8000/docs |

---

## Environment Variables

| Variable               | Description                        |
|------------------------|------------------------------------|
| `AWS_ACCESS_KEY_ID`    | AWS IAM access key                 |
| `AWS_SECRET_ACCESS_KEY`| AWS IAM secret key                 |
| `AWS_REGION`           | AWS region (e.g. `us-east-1`)      |
| `S3_BUCKET_NAME`       | S3 bucket for return item images   |
| `DATABASE_URL`         | SQLAlchemy DB URL (SQLite default) |

---

## AWS Setup

### Bedrock
1. Enable **Claude 3 Sonnet** model access in the [Bedrock console](https://console.aws.amazon.com/bedrock/home#/modelaccess).
2. Ensure your IAM user/role has the `bedrock:InvokeModel` permission.

### S3
1. Create a bucket in the same region as `AWS_REGION`.
2. Set `S3_BUCKET_NAME` to your bucket name.
3. Ensure your IAM user/role has `s3:PutObject` and `s3:DeleteObject` on that bucket.

---

## API Reference

| Method | Endpoint                       | Description                          |
|--------|--------------------------------|--------------------------------------|
| POST   | `/api/returns/`                | Submit a return (triggers AI assess) |
| GET    | `/api/returns/`                | List all return requests             |
| GET    | `/api/returns/{id}`            | Get a single return request          |
| PATCH  | `/api/returns/{id}/status`     | Update return status                 |
| GET    | `/api/products/`               | List marketplace products            |
| GET    | `/api/products/{id}`           | Get a single product                 |
| POST   | `/api/products/`               | Manually create a product listing    |
| PATCH  | `/api/products/{id}/sold`      | Mark a product as sold               |
| POST   | `/api/uploads/image`           | Upload an image to S3                |

Full interactive docs: **http://localhost:8000/docs**

---

## How It Works

1. Customer submits a return with order details and a condition description.
2. The backend calls **AWS Bedrock (Claude 3 Sonnet)** to assess condition, recommend an action (`resell`, `donate`, `recycle`, etc.), and estimate resale value.
3. If the recommendation is `resell` or `refurbish_resell`, Bedrock generates a product listing and the item is automatically listed in the marketplace.
4. The React frontend displays the AI assessment result and lets customers browse the live resale marketplace.
