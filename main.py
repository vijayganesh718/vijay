from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey, Numeric
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta, timezone
from jose import jwt
import hashlib

# ================= CONFIG =================
DATABASE_URL = "mysql+pymysql://root:@localhost:3306/tenantdb"
JWT_SECRET = "simple_secret_key"
JWT_ALGORITHM = "HS256"
TOKEN_EXPIRE_MINUTES = 1440

# ================= DATABASE =================
engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

# ================= MODELS =================
class Tenant(Base):
    __tablename__ = "tenants"
    id = Column(Integer, primary_key=True)
    name = Column(String(200))
    gst = Column(String(50))
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    email = Column(String(200), unique=True)
    password_hash = Column(String(200))
    role = Column(String(50), default="Admin")


class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer)
    name = Column(String(200))
    price = Column(Numeric(10, 2))
    stock = Column(Integer)


class Customer(Base):
    __tablename__ = "customers"
    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    name = Column(String(200), nullable=False)
    phone = Column(String(50))
    email = Column(String(200))


class Invoice(Base):
    __tablename__ = "invoices"
    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    customer_id = Column(Integer, ForeignKey("customers.id"))
    total = Column(Numeric(10, 2), default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone(timedelta(hours=5, minutes=30))))

class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer, nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    total = Column(Numeric(10, 2), nullable=False)



# CREATE TABLES
Base.metadata.create_all(bind=engine)

# ================= PASSWORD HELPERS (needed early) =================
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed


# Run migrations for existing databases
def run_migrations():
    from sqlalchemy import text
    db = SessionLocal()
    try:
        # Add is_active column if it doesn't exist
        try:
            db.execute(text("ALTER TABLE tenants ADD COLUMN is_active INT DEFAULT 1"))
            db.commit()
            print("✅ Added is_active column to tenants table")
        except Exception:
            db.rollback()  # Column already exists
    finally:
        db.close()

run_migrations()

# Auto-create Super Admin account on startup
def create_super_admin():
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == "superadmin@gmail.com").first()
        if not existing:
            user = User(
                tenant_id=None,
                email="superadmin@gmail.com",
                password_hash=hash_password("admin123"),
                role="SuperAdmin"
            )
            db.add(user)
            db.commit()
            print("✅ Super Admin created: superadmin@billing.com / admin123")
        else:
            print("ℹ️ Super Admin already exists")
    finally:
        db.close()

create_super_admin()

# ================= APP =================
app = FastAPI(title="Multi-Tenant Billing System")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # allow React
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# ================= HELPERS =================
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



def create_token(data: dict):
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(minutes=TOKEN_EXPIRE_MINUTES)
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str):
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except:
        return None


def get_current_tenant(
    token: str = Depends(oauth2_scheme),
    x_tenant: Optional[str] = Header(None)
):
    payload = decode_token(token)
    if payload and "tenant_id" in payload:
        return payload["tenant_id"]
    if x_tenant:
        return int(x_tenant)
    raise HTTPException(status_code=401, detail="Not authenticated")


def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return payload


def require_superadmin(user: dict = Depends(get_current_user)):
    if user.get("role") != "SuperAdmin":
        raise HTTPException(status_code=403, detail="Super Admin access required")
    return user

# ================= SCHEMAS =================
class RegisterTenant(BaseModel):
    tenant_name: str
    gst_number: Optional[str] = None
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    tenant_id: Optional[int] = None
    role: str


class ProductIn(BaseModel):
    name: str
    price: float
    stock: int


class CustomerIn(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None


class InvoiceCreate(BaseModel):
    customer_id: int

class InvoiceItemCreate(BaseModel):
    invoice_id: int
    product_id: int
    quantity: int


# ================= ROUTES =================
@app.get("/")
def root():
    return {"message": "API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}


# ---------- SUPER ADMIN ----------
@app.get("/api/admin/tenants")
def get_all_tenants(
    user: dict = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    tenants = db.query(Tenant).all()
    result = []
    for t in tenants:
        # Get owner email
        owner = db.query(User).filter(User.tenant_id == t.id, User.role == "Admin").first()
        # Count invoices
        invoice_count = db.query(Invoice).filter(Invoice.tenant_id == t.id).count()
        # Sum total revenue
        from sqlalchemy import func
        revenue = db.query(func.sum(Invoice.total)).filter(Invoice.tenant_id == t.id).scalar()
        # Count products and customers
        product_count = db.query(Product).filter(Product.tenant_id == t.id).count()
        customer_count = db.query(Customer).filter(Customer.tenant_id == t.id).count()

        result.append({
            "id": t.id,
            "name": t.name,
            "owner_email": owner.email if owner else "N/A",
            "is_active": bool(t.is_active) if t.is_active is not None else True,
            "total_invoices": invoice_count,
            "total_revenue": float(revenue) if revenue else 0,
            "total_products": product_count,
            "total_customers": customer_count,
            "created_at": t.created_at.strftime("%d-%m-%Y") if t.created_at else "N/A"
        })
    return result


@app.put("/api/admin/tenants/{tenant_id}/toggle")
def toggle_tenant_status(
    tenant_id: int,
    user: dict = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    tenant.is_active = 0 if (tenant.is_active and tenant.is_active == 1) else 1
    db.commit()
    return {"message": f"Tenant {'activated' if tenant.is_active == 1 else 'suspended'}", "is_active": bool(tenant.is_active)}


@app.get("/api/admin/stats")
def get_admin_stats(
    user: dict = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    from sqlalchemy import func
    total_tenants = db.query(Tenant).count()
    total_invoices = db.query(Invoice).count()
    total_revenue = db.query(func.sum(Invoice.total)).scalar()
    total_products = db.query(Product).count()
    total_customers = db.query(Customer).count()
    return {
        "total_tenants": total_tenants,
        "total_invoices": total_invoices,
        "total_revenue": float(total_revenue) if total_revenue else 0,
        "total_products": total_products,
        "total_customers": total_customers
    }


# ---------- AUTH ----------
@app.post("/api/auth/register-tenant", response_model=TokenResponse)
def register_tenant(data: RegisterTenant, db: Session = Depends(get_db)):
    tenant = Tenant(name=data.tenant_name, gst=data.gst_number)
    db.add(tenant)
    db.commit()
    db.refresh(tenant)

    user = User(
        tenant_id=tenant.id,
        email=data.email,
        password_hash=hash_password(data.password),
        role="Admin"
    )
    db.add(user)
    db.commit()

    token = create_token({
        "user_id": user.id,
        "tenant_id": tenant.id,
        "role": user.role
    })

    return {
        "access_token": token,
        "tenant_id": tenant.id,
        "role": user.role
    }


@app.post("/api/auth/login", response_model=TokenResponse)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form.username).first()
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Check if tenant is suspended (skip for SuperAdmin)
    if user.role != "SuperAdmin" and user.tenant_id:
        tenant = db.query(Tenant).filter(Tenant.id == user.tenant_id).first()
        if tenant and tenant.is_active is not None and tenant.is_active == 0:
            raise HTTPException(status_code=403, detail="Your account has been suspended. Contact admin.")

    token = create_token({
        "user_id": user.id,
        "tenant_id": user.tenant_id,
        "role": user.role
    })

    return {
        "access_token": token,
        "tenant_id": user.tenant_id,
        "role": user.role
    }


# ---------- PRODUCTS ----------
@app.get("/api/products")
def list_products(
    tenant_id: int = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    return db.query(Product).filter(Product.tenant_id == tenant_id).all()


@app.post("/api/products")
def create_product(
    product: ProductIn,
    tenant_id: int = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    p = Product(
        tenant_id=tenant_id,
        name=product.name,
        price=product.price,
        stock=product.stock
    )
    db.add(p)
    db.commit()
    return {"message": "Product created"}


@app.put("/api/products/{product_id}")
def update_product(
    product_id: int,
    product: ProductIn,
    tenant_id: int = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    p = db.query(Product).filter(
        Product.id == product_id,
        Product.tenant_id == tenant_id
    ).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    
    p.name = product.name
    p.price = product.price
    p.stock = product.stock
    db.commit()
    return {"message": "Product updated"}


# ---------- CUSTOMERS ----------
@app.post("/api/customers")
def create_customer(
    payload: CustomerIn,
    tenant_id: int = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    customer = Customer(
        tenant_id=tenant_id,
        name=payload.name,
        phone=payload.phone,
        email=payload.email
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return {"id": customer.id, "name": customer.name}


@app.put("/api/customers/{customer_id}")
def update_customer(
    customer_id: int,
    payload: CustomerIn,
    tenant_id: int = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    c = db.query(Customer).filter(
        Customer.id == customer_id,
        Customer.tenant_id == tenant_id
    ).first()
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    c.name = payload.name
    c.phone = payload.phone
    c.email = payload.email
    db.commit()
    return {"message": "Customer updated"}


@app.get("/api/customers")
def list_customers(
    tenant_id: int = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    return db.query(Customer).filter(Customer.tenant_id == tenant_id).all()


# ---------- INVOICES ----------
@app.post("/api/invoices")
def create_invoice(
    payload: InvoiceCreate,
    tenant_id: int = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    customer = db.query(Customer).filter(
        Customer.id == payload.customer_id,
        Customer.tenant_id == tenant_id
    ).first()

    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    invoice = Invoice(
    tenant_id=tenant_id,
    customer_id=payload.customer_id,
    total=0
)


    db.add(invoice)
    db.commit()
    db.refresh(invoice)

    return {
        "invoice_id": invoice.id,
        "customer_id": customer.id,
        "total": invoice.total
    }

@app.post("/api/invoices/items")
def add_invoice_item(
    payload: InvoiceItemCreate,
    tenant_id: int = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    # 1. Check invoice
    invoice = db.query(Invoice).filter(
        Invoice.id == payload.invoice_id,
        Invoice.tenant_id == tenant_id
    ).first()

    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    # 2. Check product
    product = db.query(Product).filter(
        Product.id == payload.product_id,
        Product.tenant_id == tenant_id
    ).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if product.stock < payload.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")

    # 3. Calculate
    line_total = product.price * payload.quantity

    # 4. CREATE invoice item (IMPORTANT)
    item = InvoiceItem(
        invoice_id=invoice.id,
        product_id=product.id,
        quantity=payload.quantity,
        price=product.price,
        total=line_total
    )

    # 5. ADD to session (MOST IMPORTANT LINE)
    db.add(item)

    # 6. Update invoice total safely
    if invoice.total is None:
        invoice.total = 0
    invoice.total = invoice.total + line_total

    # 7. Reduce stock
    product.stock = product.stock - payload.quantity

    # 8. COMMIT
    db.commit()
    db.refresh(item)

    return {
        "message": "Invoice item added",
        "invoice_item_id": item.id,
        "invoice_id": invoice.id,
        "product_id": product.id,
        "quantity": payload.quantity,
        "line_total": float(line_total),
        "invoice_total": float(invoice.total)
    }


# ---------- BILL HISTORY ----------
@app.get("/api/invoices/history")
def get_invoice_history(
    tenant_id: int = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    invoices = db.query(Invoice).filter(
        Invoice.tenant_id == int(tenant_id)
    ).order_by(Invoice.created_at.desc()).all()

    result = []
    for inv in invoices:
        customer = db.query(Customer).filter(Customer.id == inv.customer_id).first()
        item_count = db.query(InvoiceItem).filter(InvoiceItem.invoice_id == inv.id).count()
        result.append({
            "invoice_id": inv.id,
            "customer_name": customer.name if customer else "Unknown",
            "date": inv.created_at.strftime("%d-%m-%Y") if inv.created_at else "N/A",
            "items_count": item_count,
            "total": float(inv.total) if inv.total else 0
        })

    return result


# ---------- BILL VIEW ----------
@app.get("/api/invoices/{invoice_id}/bill")
def get_bill(
    invoice_id: int,
    tenant_id: int = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    # 1. Get the invoice
    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id
    ).first()

    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if invoice.tenant_id != int(tenant_id):
        raise HTTPException(status_code=403, detail="Access denied")

    # 2. Get the customer
    customer = db.query(Customer).filter(
        Customer.id == invoice.customer_id
    ).first()

    # 3. Get the tenant (shop name)
    tenant = db.query(Tenant).filter(
        Tenant.id == tenant_id
    ).first()

    # 4. Get all invoice items with product names
    items = db.query(InvoiceItem).filter(
        InvoiceItem.invoice_id == invoice_id
    ).all()

    items_list = []
    for idx, item in enumerate(items, start=1):
        product = db.query(Product).filter(Product.id == item.product_id).first()
        items_list.append({
            "sno": idx,
            "name": product.name if product else "Unknown",
            "quantity": item.quantity,
            "price": float(item.price),
            "total": float(item.total)
        })

    # 5. Format the date and time (stored in IST already)
    if invoice.created_at:
        bill_date = invoice.created_at.strftime("%d-%m-%Y")
        bill_time = invoice.created_at.strftime("%I:%M %p")
    else:
        bill_date = "N/A"
        bill_time = "N/A"

    return {
        "invoice_id": invoice.id,
        "shop_name": tenant.name if tenant else "Shop",
        "date": bill_date,
        "time": bill_time,
        "customer_name": customer.name if customer else "Unknown",
        "items": items_list,
        "total": float(invoice.total) if invoice.total else 0
    }


# ---------- SALES REPORTS ----------
@app.get("/api/reports/dashboard-chart")
def dashboard_chart(
    tenant_id: int = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    # Get all invoices for the last 7 days
    today = datetime.now(timezone(timedelta(hours=5, minutes=30))).date()
    start_date = today - timedelta(days=6)
    
    # Initialize dictionary for the last 7 days with 0 sales
    last_7_days = {}
    for i in range(7):
        d = start_date + timedelta(days=i)
        last_7_days[d.strftime("%d-%m")] = {"date": d.strftime("%d-%m"), "sales": 0}
        
    invoices = db.query(Invoice).filter(
        Invoice.tenant_id == int(tenant_id)
    ).all()
    
    for inv in invoices:
        if inv.created_at:
            inv_date = inv.created_at.date()
            if start_date <= inv_date <= today:
                date_str = inv_date.strftime("%d-%m")
                last_7_days[date_str]["sales"] += float(inv.total) if inv.total else 0
                
    # Return as list
    return list(last_7_days.values())


@app.get("/api/reports/daily")
def daily_sales_report(
    date: str,
    tenant_id: int = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    try:
        report_date = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    # Get all invoices for this tenant on the given date
    invoices = db.query(Invoice).filter(
        Invoice.tenant_id == int(tenant_id)
    ).all()

    # Filter by date (comparing date part of created_at)
    day_invoices = [inv for inv in invoices if inv.created_at and inv.created_at.date() == report_date]

    total_sales = 0
    total_bills = len(day_invoices)
    items_sold = []

    for inv in day_invoices:
        total_sales += float(inv.total) if inv.total else 0
        # Get items for this invoice
        inv_items = db.query(InvoiceItem).filter(InvoiceItem.invoice_id == inv.id).all()
        customer = db.query(Customer).filter(Customer.id == inv.customer_id).first()
        for item in inv_items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            items_sold.append({
                "invoice_id": inv.id,
                "customer_name": customer.name if customer else "Unknown",
                "product_name": product.name if product else "Unknown",
                "quantity": item.quantity,
                "price": float(item.price),
                "total": float(item.total),
                "time": inv.created_at.strftime("%I:%M %p") if inv.created_at else "N/A"
            })

    return {
        "date": report_date.strftime("%d-%m-%Y"),
        "total_sales": round(total_sales, 2),
        "total_bills": total_bills,
        "total_items": len(items_sold),
        "items": items_sold
    }


@app.get("/api/reports/monthly")
def monthly_sales_report(
    month: int,
    year: int,
    tenant_id: int = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    if month < 1 or month > 12:
        raise HTTPException(status_code=400, detail="Month must be between 1 and 12")

    invoices = db.query(Invoice).filter(
        Invoice.tenant_id == int(tenant_id)
    ).all()

    # Filter by month and year
    month_invoices = [
        inv for inv in invoices
        if inv.created_at and inv.created_at.month == month and inv.created_at.year == year
    ]

    total_sales = 0
    total_bills = len(month_invoices)
    day_wise = {}
    product_sales = {}

    for inv in month_invoices:
        inv_total = float(inv.total) if inv.total else 0
        total_sales += inv_total
        day_key = inv.created_at.strftime("%d-%m-%Y")

        if day_key not in day_wise:
            day_wise[day_key] = {"date": day_key, "sales": 0, "bills": 0}
        day_wise[day_key]["sales"] += inv_total
        day_wise[day_key]["bills"] += 1

        # Track product sales
        inv_items = db.query(InvoiceItem).filter(InvoiceItem.invoice_id == inv.id).all()
        for item in inv_items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            p_name = product.name if product else "Unknown"
            if p_name not in product_sales:
                product_sales[p_name] = {"name": p_name, "quantity": 0, "revenue": 0}
            product_sales[p_name]["quantity"] += item.quantity
            product_sales[p_name]["revenue"] += float(item.total)

    # Sort day wise and product sales
    day_list = sorted(day_wise.values(), key=lambda x: datetime.strptime(x["date"], "%d-%m-%Y"))
    for d in day_list:
        d["sales"] = round(d["sales"], 2)

    top_products = sorted(product_sales.values(), key=lambda x: x["revenue"], reverse=True)
    for p in top_products:
        p["revenue"] = round(p["revenue"], 2)

    month_names = ["", "January", "February", "March", "April", "May", "June",
                   "July", "August", "September", "October", "November", "December"]

    return {
        "month": month_names[month],
        "year": year,
        "total_sales": round(total_sales, 2),
        "total_bills": total_bills,
        "day_wise": day_list,
        "top_products": top_products
    }
