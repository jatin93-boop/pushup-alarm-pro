from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/fitness_app"
    SECRET_KEY: str = "change-me-in-env"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    OPEN_FOOD_FACTS_BASE_URL: str = "https://world.openfoodfacts.org/api/v2"
    USDA_API_KEY: str = ""
    VISION_MODEL_API_KEY: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
