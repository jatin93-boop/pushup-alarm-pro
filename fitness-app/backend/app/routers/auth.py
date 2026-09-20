from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.db.database import get_db
from app.db.models import User
from app.schemas import UserCreate, UserOut
from app.core.goal_engine import calculate_targets

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.post("/register", response_model=UserOut)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=payload.email,
        hashed_password=pwd_context.hash(payload.password),
        weight_kg=payload.weight_kg,
        height_cm=payload.height_cm,
        age=payload.age,
        sex=payload.sex,
        activity_level=payload.activity_level,
        goal=payload.goal,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # NOTE: in a full implementation, also create the user's first DietPlan row here
    # using calculate_targets(...) so they land on a dashboard with targets already set.
    return user


# TODO: /login endpoint issuing a JWT via python-jose, and a get_current_user
# dependency other routers can use to identify the caller.
