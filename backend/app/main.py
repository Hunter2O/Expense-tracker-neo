import re
from contextlib import asynccontextmanager
from datetime import date

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from . import models, schemas
from .db import Base, SessionLocal, engine, get_db

DEFAULT_CATEGORIES = [
    "Groceries", "Rent", "Transport", "Eating out",
    "Utilities", "Health", "Fun", "Salary", "Other",
]


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        if db.scalar(select(func.count(models.Category.id))) == 0:
            db.add_all(models.Category(name=n) for n in DEFAULT_CATEGORIES)
            db.commit()
    yield


app = FastAPI(title="Expense Tracker", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def month_range(month: str) -> tuple[date, date]:
    if not re.fullmatch(r"\d{4}-(0[1-9]|1[0-2])", month):
        raise HTTPException(422, "month must look like 2026-09")
    year, mon = int(month[:4]), int(month[5:])
    start = date(year, mon, 1)
    end = date(year + (mon == 12), mon % 12 + 1, 1)
    return start, end


@app.get("/api/categories", response_model=list[schemas.CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    return db.scalars(select(models.Category).order_by(models.Category.name)).all()


@app.post("/api/categories", response_model=schemas.CategoryOut, status_code=201)
def create_category(body: schemas.CategoryCreate, db: Session = Depends(get_db)):
    cat = models.Category(name=body.name.strip())
    db.add(cat)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "That category already exists")
    return cat


@app.get("/api/transactions", response_model=list[schemas.TransactionOut])
def list_transactions(month: str = Query(...), db: Session = Depends(get_db)):
    start, end = month_range(month)
    stmt = (
        select(models.Transaction)
        .where(models.Transaction.date >= start, models.Transaction.date < end)
        .order_by(models.Transaction.date.desc(), models.Transaction.id.desc())
    )
    return db.scalars(stmt).unique().all()


@app.post("/api/transactions", response_model=schemas.TransactionOut, status_code=201)
def create_transaction(body: schemas.TransactionIn, db: Session = Depends(get_db)):
    tx = models.Transaction(**body.model_dump())
    db.add(tx)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(422, "Unknown category")
    db.refresh(tx)
    return tx


@app.put("/api/transactions/{tx_id}", response_model=schemas.TransactionOut)
def update_transaction(tx_id: int, body: schemas.TransactionIn, db: Session = Depends(get_db)):
    tx = db.get(models.Transaction, tx_id)
    if not tx:
        raise HTTPException(404, "Transaction not found")
    for key, value in body.model_dump().items():
        setattr(tx, key, value)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(422, "Unknown category")
    db.refresh(tx)
    return tx


@app.delete("/api/transactions/{tx_id}", status_code=204)
def delete_transaction(tx_id: int, db: Session = Depends(get_db)):
    tx = db.get(models.Transaction, tx_id)
    if not tx:
        raise HTTPException(404, "Transaction not found")
    db.delete(tx)
    db.commit()


@app.get("/api/summary", response_model=schemas.Summary)
def summary(month: str = Query(...), db: Session = Depends(get_db)):
    start, end = month_range(month)
    in_month = (models.Transaction.date >= start, models.Transaction.date < end)

    totals = dict(
        db.execute(
            select(models.Transaction.kind, func.sum(models.Transaction.amount))
            .where(*in_month)
            .group_by(models.Transaction.kind)
        ).all()
    )
    income = float(totals.get("income", 0))
    expense = float(totals.get("expense", 0))

    rows = db.execute(
        select(
            func.coalesce(models.Category.name, "Uncategorised"),
            func.sum(models.Transaction.amount).label("total"),
        )
        .join(models.Category, isouter=True)
        .where(*in_month, models.Transaction.kind == "expense")
        .group_by(models.Category.name)
        .order_by(func.sum(models.Transaction.amount).desc())
    ).all()

    return schemas.Summary(
        income=income,
        expense=expense,
        balance=income - expense,
        by_category=[schemas.CategoryTotal(category=n, total=float(t)) for n, t in rows],
    )
