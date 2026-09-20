"""
Adaptive engine: compares actual weight trend against the expected trend for
the user's goal and nudges calorie targets for the next week. Kept simple and
rule-based on purpose -- transparent and explainable beats a black box here.
"""

EXPECTED_WEEKLY_CHANGE_KG = {
    "bulk": 0.35,
    "lean_bulk": 0.15,
    "maintain": 0.0,
    "cut": -0.5,
}

# if actual change is this many kg off from expected, adjust calories
ADJUSTMENT_THRESHOLD_KG = 0.15
CALORIE_STEP = 150


def adjust_calories(goal: str, current_target_calories: int, weight_last_week_kg: float, weight_this_week_kg: float) -> dict:
    expected_change = EXPECTED_WEEKLY_CHANGE_KG.get(goal, 0.0)
    actual_change = weight_this_week_kg - weight_last_week_kg
    delta = actual_change - expected_change

    if abs(delta) <= ADJUSTMENT_THRESHOLD_KG:
        return {
            "new_target_calories": current_target_calories,
            "changed": False,
            "reason": "Progress is on track with the expected trend -- no change needed.",
        }

    # goal is a surplus (bulk/lean_bulk): gained too little -> increase; too much -> decrease
    # goal is a deficit (cut): lost too little -> decrease more; lost too much -> ease up
    if goal in ("bulk", "lean_bulk"):
        step = CALORIE_STEP if delta < 0 else -CALORIE_STEP
    elif goal == "cut":
        step = -CALORIE_STEP if delta > 0 else CALORIE_STEP
    else:
        step = -CALORIE_STEP if actual_change > ADJUSTMENT_THRESHOLD_KG else (
            CALORIE_STEP if actual_change < -ADJUSTMENT_THRESHOLD_KG else 0
        )

    new_target = current_target_calories + step
    direction = "increased" if step > 0 else "decreased"

    return {
        "new_target_calories": new_target,
        "changed": step != 0,
        "reason": (
            f"Weight changed by {actual_change:+.2f}kg vs an expected {expected_change:+.2f}kg, "
            f"so calories were {direction} by {abs(step)} for next week."
        ),
    }
