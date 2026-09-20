# Fitness tracker backend (FastAPI)

## Setup

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then edit DATABASE_URL, SECRET_KEY, etc.
```

You need a Postgres database running locally (or point `DATABASE_URL` at any
Postgres instance). Create the tables:

```bash
python3 -c "from app.db.database import Base, engine; from app.db import models; Base.metadata.create_all(engine)"
```

Run the server:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Interactive API docs: http://localhost:8000/docs

## What's implemented vs stubbed

**Fully implemented:**
- Goal engine (`app/core/goal_engine.py`) -- BMR/TDEE/macro calculation
- Adaptive engine (`app/core/adaptive_engine.py`) -- weekly calorie adjustment based on actual vs expected weight trend
- Daily score calculation (`app/routers/scores.py`)
- Barcode lookup with local caching, falling back to Open Food Facts (`app/routers/food.py`)
- User registration, diet plan storage/retrieval, food/workout logging

**Stubbed, needs wiring up:**
- `/food/recognize` -- currently returns hardcoded candidates. Wire this to a
  vision model API (Claude, GPT-4V, Gemini) or a fine-tuned Food-101/Nutrition5k
  classifier. See the food recognition flow diagram for the intended design.
- `/auth/login` and JWT issuance -- registration exists but there's no login
  endpoint or `get_current_user` dependency yet. Add `python-jose`-based JWT.
- `/workouts/{user_id}/plan` -- returns a single hardcoded push day. Replace
  with a real generator keyed off goal + day of week + equipment.
- USDA fallback in barcode lookup (only Open Food Facts is wired up right now).

## Project structure

```
app/
  main.py           - FastAPI app + router registration
  schemas.py        - pydantic request/response models
  core/
    config.py       - settings (env vars)
    goal_engine.py  - BMR/TDEE/macro calculator
    adaptive_engine.py - weekly plan adjustment logic
  db/
    database.py     - SQLAlchemy engine/session
    models.py       - ORM models matching the ERD
  routers/
    auth.py, users.py, food.py, plans.py, workouts.py, scores.py
```
