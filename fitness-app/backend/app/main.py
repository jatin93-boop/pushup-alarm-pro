from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, users, food, plans, workouts, scores

app = FastAPI(title="Fitness Tracker API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this before shipping
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(food.router, prefix="/food", tags=["food"])
app.include_router(plans.router, prefix="/plans", tags=["plans"])
app.include_router(workouts.router, prefix="/workouts", tags=["workouts"])
app.include_router(scores.router, prefix="/scores", tags=["scores"])


@app.get("/health")
def health():
    return {"status": "ok"}
