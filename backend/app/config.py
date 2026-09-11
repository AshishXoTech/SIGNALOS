from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://signal_user:signal_pass@localhost:5432/signal_os"

    # AI
    gemini_api_key: str = ""

    # App
    app_env: str = "development"
    upload_dir: str = "./uploads"
    max_upload_size_mb: int = 10

    # Verification Thresholds
    verified_threshold: int = 75
    likely_threshold: int = 55
    needs_review_threshold: int = 30

    # Clustering
    cluster_radius_meters: float = 500.0
    cluster_time_window_minutes: int = 60
    min_reports_for_incident: int = 2

    # Consensus Weights (must sum to 1.0)
    weight_vision: float = 0.35
    weight_text: float = 0.15
    weight_geo: float = 0.15
    weight_crowd: float = 0.20
    weight_satellite: float = 0.15

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()