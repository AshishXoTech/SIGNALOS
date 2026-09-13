from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.database import get_db
from app.config import settings

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("")
async def health_check(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected",
            "environment": settings.APP_ENV,
            "service": "Signal OS Backend"
        }
    except Exception as e:
        return {"status": "unhealthy", "database": f"error: {str(e)}"}


@router.get("/live")
async def liveness():
    return {"alive": True}


@router.get("/ready")
async def readiness(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(text("SELECT COUNT(*) FROM reports"))
        return {"ready": True, "reports_count": result.scalar()}
    except Exception as e:
        return {"ready": False, "error": str(e)}