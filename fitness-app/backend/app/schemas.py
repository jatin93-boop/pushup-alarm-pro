from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    weight_kg: float
    height_cm: float
    age: int
    sex: str
    activity_level: str
    goal: str


class UserOut(BaseModel):
    id: str
    email: EmailStr
    goal: str
    weight_kg: float
    height_cm: float

    class Config:
        from_attributes = True


class DietPlanOut(BaseModel):
    target_calories: int
    target_protein_g: int
    target_carbs_g: int
    target_fat_g: int
    week_start: date
    reason: Optional[str] = None

    class Config:
        from_attributes = True


class FoodLogCreate(BaseModel):
    food_item_id: Optional[str] = None
    barcode: Optional[str] = None
    name: Optional[str] = None  # used when logging from a photo-identified item
    grams: float
    source: str  # "barcode" | "photo" | "manual"


class FoodLogOut(BaseModel):
    id: str
    grams: float
    source: str
    logged_at: datetime

    class Config:
        from_attributes = True


class WorkoutLogCreate(BaseModel):
    session_type: str
    duration_min: int
    completed: bool
    logged_date: date


class DailyScoreOut(BaseModel):
    score_date: date
    diet_score: int
    training_score: int
    consistency_score: int
    total_score: int

    class Config:
        from_attributes = True
