import httpx
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import FoodItem, FoodLog
from app.schemas import FoodLogCreate, FoodLogOut
from app.core.config import settings

router = APIRouter()


@router.get("/barcode/{code}")
async def lookup_barcode(code: str, db: Session = Depends(get_db)):
    """Cache-first barcode lookup: check local FoodItem table before hitting
    the external Open Food Facts API."""
    cached = db.query(FoodItem).filter(FoodItem.barcode == code).first()
    if cached:
        return cached

    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{settings.OPEN_FOOD_FACTS_BASE_URL}/product/{code}.json")

    if resp.status_code != 200 or resp.json().get("status") != 1:
        raise HTTPException(status_code=404, detail="Product not found")

    product = resp.json()["product"]
    nutriments = product.get("nutriments", {})

    item = FoodItem(
        name=product.get("product_name", "Unknown"),
        barcode=code,
        calories_100g=nutriments.get("energy-kcal_100g", 0),
        protein_100g=nutriments.get("proteins_100g", 0),
        carbs_100g=nutriments.get("carbohydrates_100g", 0),
        fat_100g=nutriments.get("fat_100g", 0),
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.post("/recognize")
async def recognize_meal_photo(photo: UploadFile = File(...)):
    """
    Sends the photo to a vision model, returns identified food candidates.
    Stubbed here -- wire this up to your chosen vision API (see VISION_MODEL_API_KEY)
    or a self-hosted Food-101/Nutrition5k classifier.
    """
    # TODO: call vision model, parse response into structured candidates
    return {
        "candidates": [
            {"name": "Grilled chicken breast", "confidence": 0.82, "default_grams": 150},
            {"name": "Steamed rice", "confidence": 0.74, "default_grams": 200},
        ]
    }


@router.post("/log/{user_id}", response_model=FoodLogOut)
def log_food(user_id: str, payload: FoodLogCreate, db: Session = Depends(get_db)):
    if not payload.food_item_id:
        raise HTTPException(status_code=400, detail="food_item_id is required")

    log = FoodLog(
        user_id=user_id,
        food_item_id=payload.food_item_id,
        grams=payload.grams,
        source=payload.source,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log
