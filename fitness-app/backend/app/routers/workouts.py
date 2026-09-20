from datetime import date as date_type
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import WorkoutLog
from app.schemas import WorkoutLogCreate

router = APIRouter()


@router.post("/{user_id}/log")
def log_workout(user_id: str, payload: WorkoutLogCreate, db: Session = Depends(get_db)):
    log = WorkoutLog(
        user_id=user_id,
        session_type=payload.session_type,
        duration_min=payload.duration_min,
        completed=1 if payload.completed else 0,
        logged_date=payload.logged_date,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.get("/{user_id}/plan")
def get_training_plan(user_id: str):
    """
    Stub: return a rule-based split for the day based on goal + day of week.
    Replace with a real generator keyed off the user's goal and equipment access.
    """
    return {
        "today": "push",
        "exercises": [
            {"name": "Bench press", "sets": 4, "reps": "6-8"},
            {"name": "Overhead press", "sets": 3, "reps": "8-10"},
            {"name": "Tricep pushdown", "sets": 3, "reps": "10-12"},
        ],
    }
