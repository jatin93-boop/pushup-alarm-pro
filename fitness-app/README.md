# Fitness tracker app

Personalized diet + training plans, barcode and meal-photo food scanning, an
adaptive plan engine, and daily scoring. See `backend/README.md` and
`frontend/README.md` for setup instructions for each half.

## Quick start

Terminal 1:
```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

Terminal 2:
```bash
cd frontend
npm install
npx expo start
```

## Architecture

Client (React Native) -> Backend API (FastAPI) -> {Auth, Diet & training
engine, Food recognition} -> {User DB, Food cache DB} -> {Open Food Facts /
USDA, Vision model API}

## Build order (suggested)

1. Backend goal engine + `/users/{id}/targets` -- already implemented and tested
2. Barcode scanning end to end (frontend scan -> backend lookup -> display)
3. Diet plan storage + the onboarding -> dashboard flow
4. Meal photo recognition -- wire `/food/recognize` to a real vision API
5. Adaptive engine -- trigger `/plans/{id}/recalculate` on a weekly cron or
   button press, show the `reason` text on the Plan screen (already wired up)
6. Daily score screen -- call the existing `/scores/{user_id}/{date}` endpoint
7. Training plan generator -- replace the hardcoded stub in `workouts.py`
