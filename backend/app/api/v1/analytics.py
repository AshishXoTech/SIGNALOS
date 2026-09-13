# backend/app/api/v1/analytics.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.database import get_db
from app.services.analytics_service import analytics_service

router = APIRouter()


@router.get("/dashboard")
async def get_dashboard(db: AsyncSession = Depends(get_db)):
    """Get comprehensive dashboard statistics"""
    return await analytics_service.get_dashboard_stats(db)


@router.get("/heatmap")
async def get_heatmap(
    disaster_type: Optional[str] = None,
    hours: int = Query(168, ge=1, le=8760),
    db: AsyncSession = Depends(get_db),
):
    """Get geographic heatmap data"""
    return await analytics_service.get_geo_heatmap(db, disaster_type, hours)


@router.get("/timeseries")
async def get_timeseries(
    period: str = Query("week", pattern="^(day|week|month)$"),
    disaster_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Get time series data for charts"""
    return await analytics_service.get_time_series(db, period, disaster_type)


@router.get("/verification-stats")
async def get_verification_stats(db: AsyncSession = Depends(get_db)):
    """Get verification performance metrics"""
    return await analytics_service.get_verification_stats(db)