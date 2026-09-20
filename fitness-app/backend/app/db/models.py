import uuid
from datetime import datetime

from sqlalchemy import Column, String, Float, Integer, Date, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base


def gen_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    goal = Column(String, nullable=False)  # "bulk" | "lean_bulk" | "cut" | "maintain"
    weight_kg = Column(Float, nullable=False)
    height_cm = Column(Float, nullable=False)
    age = Column(Integer, nullable=False)
    sex = Column(String, nullable=False)  # "male" | "female"
    activity_level = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    food_logs = relationship("FoodLog", back_populates="user")
    workout_logs = relationship("WorkoutLog", back_populates="user")
    diet_plans = relationship("DietPlan", back_populates="user")
    daily_scores = relationship("DailyScore", back_populates="user")


class DietPlan(Base):
    __tablename__ = "diet_plans"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)
    target_calories = Column(Integer, nullable=False)
    target_protein_g = Column(Integer, nullable=False)
    target_carbs_g = Column(Integer, nullable=False)
    target_fat_g = Column(Integer, nullable=False)
    week_start = Column(Date, nullable=False)
    reason = Column(String, nullable=True)  # explainability: why this plan/adjustment

    user = relationship("User", back_populates="diet_plans")


class FoodItem(Base):
    __tablename__ = "food_items"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    barcode = Column(String, nullable=True, index=True)
    calories_100g = Column(Float, nullable=False)
    protein_100g = Column(Float, nullable=False)
    carbs_100g = Column(Float, nullable=False)
    fat_100g = Column(Float, nullable=False)


class FoodLog(Base):
    __tablename__ = "food_logs"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)
    food_item_id = Column(UUID(as_uuid=False), ForeignKey("food_items.id"), nullable=False)
    grams = Column(Float, nullable=False)
    source = Column(String, nullable=False)  # "barcode" | "photo" | "manual"
    logged_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="food_logs")


class WorkoutLog(Base):
    __tablename__ = "workout_logs"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)
    session_type = Column(String, nullable=False)  # "push" | "pull" | "legs" | "cardio" ...
    duration_min = Column(Integer, nullable=False)
    completed = Column(Integer, default=1)  # 1 = completed as planned, 0 = skipped/modified
    logged_date = Column(Date, nullable=False)

    user = relationship("User", back_populates="workout_logs")


class DailyScore(Base):
    __tablename__ = "daily_scores"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)
    score_date = Column(Date, nullable=False)
    diet_score = Column(Integer, nullable=False)
    training_score = Column(Integer, nullable=False)
    consistency_score = Column(Integer, nullable=False)
    total_score = Column(Integer, nullable=False)

    user = relationship("User", back_populates="daily_scores")
