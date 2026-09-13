# backend/app/schemas/analytics.py
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class DashboardStats(BaseModel):
    total_reports: int
    verified_reports: int
    active_incidents: int
    average_trust_score: float
    reports_today: int
    reports_this_week: int
    debunked_count: int
    pending_count: int
    verification_rate: float  # percentage
    top_disaster_types: List[Dict[str, Any]]
    severity_distribution: Dict[str, int]
    hourly_trend: List[Dict[str, Any]]
    recent_reports: List[Dict[str, Any]]


class TimeSeriesPoint(BaseModel):
    timestamp: datetime
    value: float
    label: Optional[str] = None


class GeoHeatmapPoint(BaseModel):
    latitude: float
    longitude: float
    intensity: float
    disaster_type: Optional[str] = None


class AnalyticsResponse(BaseModel):
    period: str
    start_date: datetime
    end_date: datetime
    total_reports: int
    verified_reports: int
    debunked_reports: int
    average_trust_score: float
    disaster_type_breakdown: Dict[str, int]
    severity_breakdown: Dict[str, int]
    time_series: List[TimeSeriesPoint]
    heatmap_data: List[GeoHeatmapPoint]
    top_regions: List[Dict[str, Any]]


class TrendData(BaseModel):
    period: str
    current_value: float
    previous_value: float
    change_percent: float
    trend: str  # up, down, stable