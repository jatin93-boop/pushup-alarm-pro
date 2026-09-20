from datetime import date as date_type
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User, DietPlan, FoodLog, FoodItem, WorkoutLog, DailyScore

router = APIRouter()


def _diet_score(target_calories: int, target_protein_g: int, actual_calories: float, actual_protein_g: float) -> int:
    """Rewards adherence to targets, not just 'lower is better' -- being far
    under target is scored down too, since that's often as unsustainable as
    going over."""
    if target_calories == 0:
        return 0
    cal_diff_pct = abs(actual_calories - target_calories) / target_calories
    cal_score = max(0, 100 - cal_diff_pct * 200)

    if target_protein_g == 0:
        protein_score = 100
    else:
        protein_diff_pct = abs(actual_protein_g - target_protein_g) / target_protein_g
        protein_score = max(0, 100 - protein_diff_pct * 150)

    return round(0.6 * cal_score + 0.4 * protein_score)


def _training_score(planned: bool, completed: bool) -> int:
    if not planned:
        return 100  # rest day, nothing to complete
    return 100 if completed else 30


def _consistency_score(logged_food: bool, logged_workout_if_planned: bool) -> int:
    score = 0
    if logged_food:
        score += 60
    if logged_workout_if_planned:
        score += 40
    return score


@router.get("/{user_id}/{score_date}")
def compute_daily_score(user_id: str, score_date: date_type, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    plan = (
        db.query(DietPlan)
        .filter(DietPlan.user_id == user_id, DietPlan.week_start <= score_date)
        .order_by(DietPlan.week_start.desc())
        .first()
    )

    logs = (
        db.query(FoodLog, FoodItem)
        .join(FoodItem, FoodLog.food_item_id == FoodItem.id)
        .filter(FoodLog.user_id == user_id)
        .all()
    )
    actual_calories = sum(l.FoodItem.calories_100g * l.FoodLog.grams / 100 for l in logs)
    actual_protein = sum(l.FoodItem.protein_100g * l.FoodLog.grams / 100 for l in logs)

    workout = (
        db.query(WorkoutLog)
        .filter(WorkoutLog.user_id == user_id, WorkoutLog.logged_date == score_date)
        .first()
    )

    diet = _diet_score(
        plan.target_calories if plan else 0,
        plan.target_protein_g if plan else 0,
        actual_calories,
        actual_protein,
    )
    training = _training_score(planned=True, completed=bool(workout and workout.completed))
    consistency = _consistency_score(logged_food=len(logs) > 0, logged_workout_if_planned=bool(workout))

    total = round(0.45 * diet + 0.35 * training + 0.20 * consistency)

    score = DailyScore(
        user_id=user_id,
        score_date=score_date,
        diet_score=diet,
        training_score=training,
        consistency_score=consistency,
        total_score=total,
    )
    db.add(score)
    db.commit()
    db.refresh(score)
    return score
