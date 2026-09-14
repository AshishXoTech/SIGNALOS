from functools import lru_cache
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Database
    DB_HOST: str = "db"
    DB_PORT: int = 5432
    DB_NAME: str = "disaster_ai"
    DB_USER: str = "postgres"
    DB_PASSWORD: str = "postgres"
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@db:5432/disaster_ai"
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_ECHO: bool = False

    # App Config
    APP_ENV: str = "development"
    APP_PORT: int = 8000
    SECRET_KEY: str = "signal-os-dev-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    MEDIA_DIR: str = "uploads"

    # AI Keys
    OPENAI_API_KEY: Optional[str] = None
    GOOGLE_VISION_KEY: Optional[str] = None
    OPENWEATHER_API_KEY: Optional[str] = None

    # AI Consensus Weights
    VISION_WEIGHT: float = 0.25
    TEXT_WEIGHT: float = 0.25
    GEO_WEIGHT: float = 0.20
    CROWD_WEIGHT: float = 0.20
    WEATHER_WEIGHT: float = 0.10

    # Clustering
    CLUSTER_EPS_KM: float = 5.0
    CLUSTER_MIN_SAMPLES: int = 3
    CLUSTER_TIME_WINDOW_HOURS: int = 24

    # Thresholds
    TRUST_SCORE_VERIFIED: float = 70.0
    TRUST_SCORE_SUSPICIOUS: float = 40.0

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False
    )

settings = Settings()

@lru_cache()
def get_settings() -> Settings:
    return settings