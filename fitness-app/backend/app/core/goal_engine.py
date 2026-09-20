"""
Goal engine: turns a user's stats + goal into daily calorie and macro targets.
Uses the Mifflin-St Jeor formula for BMR, which is more accurate than
Harris-Benedict for most adults.
"""

ACTIVITY_MULTIPLIERS = {
    "sedentary": 1.2,
    "light": 1.375,       # light exercise 1-3 days/week
    "moderate": 1.55,     # moderate exercise 3-5 days/week
    "active": 1.725,      # hard exercise 6-7 days/week
    "very_active": 1.9,   # very hard exercise, physical job
}

# calorie offset from maintenance, and macro split (protein/carbs/fat as g per kg bodyweight
# for protein, then remaining split between carbs/fat)
GOAL_PROFILES = {
    "bulk": {"calorie_offset": 400, "protein_g_per_kg": 1.8, "fat_pct": 0.25},
    "lean_bulk": {"calorie_offset": 200, "protein_g_per_kg": 2.0, "fat_pct": 0.25},
    "maintain": {"calorie_offset": 0, "protein_g_per_kg": 1.8, "fat_pct": 0.3},
    "cut": {"calorie_offset": -500, "protein_g_per_kg": 2.2, "fat_pct": 0.25},
}


def calculate_bmr(weight_kg: float, height_cm: float, age: int, sex: str) -> float:
    base = (10 * weight_kg) + (6.25 * height_cm) - (5 * age)
    return base + 5 if sex == "male" else base - 161


def calculate_tdee(bmr: float, activity_level: str) -> float:
    multiplier = ACTIVITY_MULTIPLIERS.get(activity_level, 1.375)
    return bmr * multiplier


def calculate_targets(
    weight_kg: float,
    height_cm: float,
    age: int,
    sex: str,
    activity_level: str,
    goal: str,
) -> dict:
    if goal not in GOAL_PROFILES:
        raise ValueError(f"Unknown goal: {goal}")

    bmr = calculate_bmr(weight_kg, height_cm, age, sex)
    tdee = calculate_tdee(bmr, activity_level)

    profile = GOAL_PROFILES[goal]
    target_calories = round(tdee + profile["calorie_offset"])

    protein_g = round(profile["protein_g_per_kg"] * weight_kg)
    protein_cals = protein_g * 4

    fat_cals = target_calories * profile["fat_pct"]
    fat_g = round(fat_cals / 9)

    remaining_cals = target_calories - protein_cals - fat_cals
    carbs_g = round(max(remaining_cals, 0) / 4)

    return {
        "bmr": round(bmr),
        "tdee": round(tdee),
        "target_calories": target_calories,
        "target_protein_g": protein_g,
        "target_fat_g": fat_g,
        "target_carbs_g": carbs_g,
    }
