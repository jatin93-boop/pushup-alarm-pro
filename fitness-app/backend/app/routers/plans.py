from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User, DietPlan
from app.schemas import DietPlanOut
from app.core.goal_engine import calculate_targets
from app.core.adaptive_engine import adjust_calories

router = APIRouter()


@router.get("/{user_id}/current", response_model=DietPlanOut)
def get_current_plan(user_id: str, db: Session = Depends(get_db)):
    plan = (
        db.query(DietPlan)
        .filter(DietPlan.user_id == user_id)
        .order_by(DietPlan.week_start.desc())
        .first()
    )
    if not plan:
        raise HTTPException(status_code=404, detail="No plan found for this user")
    return plan


@router.post("/{user_id}/recalculate", response_model=DietPlanOut)
def recalculate_plan(
    user_id: str,
    weight_last_week_kg: float,
    weight_this_week_kg: float,
    db: Session = Depends(get_db),
):
    """Runs the adaptive engine against the latest weigh-ins and creates a new
    DietPlan row for the upcoming week, with a human-readable reason attached."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    current_plan = (
        db.query(DietPlan)
        .filter(DietPlan.user_id == user_id)
        .order_by(DietPlan.week_start.desc())
        .first()
    )
    current_calories = current_plan.target_calories if current_plan else calculate_targets(
        user.weight_kg, user.height_cm, user.age, user.sex, user.activity_level, user.goal
    )["target_calories"]

    result = adjust_calories(user.goal, current_calories, weight_last_week_kg, weight_this_week_kg)

    targets = calculate_targets(
        weight_kg=weight_this_week_kg,
        height_cm=user.height_cm,
        age=user.age,
        sex=user.sex,
        activity_level=user.activity_level,
        goal=user.goal,
    )
    # override calories with the adaptive result, keep macro ratios from the goal engine
    new_plan = DietPlan(
        user_id=user_id,
        target_calories=result["new_target_calories"],
        target_protein_g=targets["target_protein_g"],
        target_carbs_g=targets["target_carbs_g"],
        target_fat_g=targets["target_fat_g"],
        week_start=date.today(),
        reason=result["reason"],
    )
    db.add(new_plan)
    db.commit()
    db.refresh(new_plan)
    return new_plan
