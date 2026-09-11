from sqlmodel import SQLModel, create_engine, Session
from app.config import get_settings
import os

settings = get_settings()

# Use SQLite fallback if PostgreSQL is not available
# This lets you start immediately without Docker
DB_URL = settings.database_url

# For local dev without PostgreSQL, uncomment next line:
# DB_URL = "sqlite:///./signal_os.db"

engine = create_engine(
    DB_URL,
    echo=(settings.app_env == "development"),
    pool_pre_ping=True,
)


def create_db_and_tables():
    """Create all tables on startup."""
    SQLModel.metadata.create_all(engine)


def get_session():
    """Dependency: yields a DB session per request."""
    with Session(engine) as session:
        yield session