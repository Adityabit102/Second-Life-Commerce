import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from models.database import engine, Base
from models import return_grade  # registers ReturnGrade with Base.metadata  # noqa: F401
from models import credit_transaction  # registers CreditTransaction  # noqa: F401
from models import listing  # registers Listing  # noqa: F401
from models import order  # registers Order  # noqa: F401
from routes import returns, products, uploads, returns_v1, deflect, credits, marketplace, predict, orders, chat
from utils.config import settings

Base.metadata.create_all(bind=engine)

# Migrate: add seller_decision column to existing orders tables
from sqlalchemy import text as _sql_text
try:
    with engine.begin() as _conn:
        _conn.execute(_sql_text("ALTER TABLE orders ADD COLUMN seller_decision VARCHAR"))
except Exception:
    pass  # column already exists

# Migrate: add extra_images_json column to listings table
try:
    with engine.begin() as _conn:
        _conn.execute(_sql_text("ALTER TABLE listings ADD COLUMN extra_images_json TEXT"))
except Exception:
    pass  # column already exists

# Populate extra images for seeded demo listings so the marketplace carousel works
_DEMO_EXTRA_IMAGES = {
    "Sony WH-1000XM4 Headphones": json.dumps([
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=400&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=600&auto=format&fit=crop&q=80",
    ]),
    "JBL Charge 5 Portable Bluetooth Speaker": json.dumps([
        "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&h=400&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=600&auto=format&fit=crop&q=80",
    ]),
    "Samsung Galaxy S23 Ultra 5G (256GB, Phantom Black)": json.dumps([
        "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&h=400&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=600&auto=format&fit=crop&q=80",
    ]),
    "Apple AirPods Pro (2nd Gen) with MagSafe Case": json.dumps([
        "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&h=400&auto=format&fit=crop&q=80",
    ]),
    "Logitech MX Master 3S Wireless Mouse": json.dumps([
        "https://images.unsplash.com/photo-1527814050087-3793815479db?w=600&h=400&auto=format&fit=crop&q=80",
    ]),
    "Nike Air Force 1 Low Sneakers (White, UK Size 9)": json.dumps([
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=400&auto=format&fit=crop&q=80",
    ]),
    "Canon EOS R50 Mirrorless Camera (Body Only)": json.dumps([
        "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&h=400&auto=format&fit=crop&q=80",
    ]),
    "Philips HD9252 Digital Air Fryer (4.1L, Black)": json.dumps([
        "https://images.unsplash.com/photo-1585515320310-259814833e62?w=600&h=400&auto=format&fit=crop&q=80",
    ]),
}
try:
    with engine.begin() as _conn:
        for _pn, _urls in _DEMO_EXTRA_IMAGES.items():
            _conn.execute(
                _sql_text(
                    "UPDATE listings SET extra_images_json = :u "
                    "WHERE product_name = :n AND (extra_images_json IS NULL OR extra_images_json = '[]')"
                ),
                {"u": _urls, "n": _pn},
            )
except Exception:
    pass

# Auto-seed demo data when the DB is empty
from seed_demo_data import seed_if_empty  # noqa: E402
seed_if_empty()

app = FastAPI(
    title="Second Life Commerce API",
    description="AI-powered returns and sustainable resale platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(returns.router, prefix="/api/returns", tags=["returns"])
app.include_router(products.router, prefix="/api/products", tags=["products"])
app.include_router(uploads.router, prefix="/api/uploads", tags=["uploads"])
app.include_router(returns_v1.router, prefix="/api/v1/returns", tags=["returns-v1"])
app.include_router(deflect.router, prefix="/api/v1/deflect", tags=["deflect"])
app.include_router(credits.router, prefix="/api/v1/credits", tags=["credits"])
app.include_router(marketplace.router, prefix="/api/v1/marketplace", tags=["marketplace"])
app.include_router(predict.router, prefix="/api/v1/predict", tags=["predict"])
app.include_router(orders.router, prefix="/api/v1/orders", tags=["orders"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["chat"])


app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
def root():
    return {"message": "Second Life Commerce API", "status": "running"}


@app.get("/health")
def health():
    return {"status": "healthy"}
