import datetime as dt
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=50)


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str


class TransactionIn(BaseModel):
    kind: Literal["expense", "income"]
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    description: str = Field(min_length=1, max_length=200)
    date: dt.date
    category_id: int | None = None


class TransactionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    kind: str
    amount: float
    description: str
    date: dt.date
    category: CategoryOut | None


class CategoryTotal(BaseModel):
    category: str
    total: float


class Summary(BaseModel):
    income: float
    expense: float
    balance: float
    by_category: list[CategoryTotal]
