"""
Satellite Cross-Check Service.
Checks if satellite data supports the ground report.
Uses Open-Meteo + basic geo-reasoning for demo.
In production: integrate Sentinel Hub / OpenEO / NASA GPM.
"""
import httpx
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


async def check_satellite_evidence(lat: float, lng: float, category: str) -> dict:
    """
    Cross-check report location with satellite/weather data.

    Returns: {
        "satellite_score": 0-100,
        "supports_evidence": "true" | "partial" | "unclear",
        "detail": "short explanation"
    }
    """
    try:
        # Use Open-Meteo free API to check recent rainfall at the location
        # This is a real, working API — no key needed
        end_date = datetime.utcnow().strftime("%Y-%m-%d")
        start_date = (datetime.utcnow() - timedelta(days=2)).strftime("%Y-%m-%d")

        url = (
            f"https://api.open-meteo.com/v1/forecast"
            f"?latitude={lat}&longitude={lng}"
            f"&hourly=precipitation,soil_moisture_0_to_1cm"
            f"&forecast_days=1&past_days=2"
        )

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            data = response.json()

        hourly = data.get("hourly", {})
        precipitation = hourly.get("precipitation", [])
        soil_moisture = hourly.get("soil_moisture_0_to_1cm", [])

        # Analyze recent precipitation
        recent_rain = [p for p in precipitation[-24:] if p is not None]
        max_rain = max(recent_rain) if recent_rain else 0
        total_rain = sum(recent_rain) if recent_rain else 0
        avg_moisture = (
            sum(s for s in soil_moisture[-12:] if s is not None) /
            max(len([s for s in soil_moisture[-12:] if s is not None]), 1)
        )

        # Score based on evidence
        score = 20  # base (satellite data exists for this location)

        if category in ["flood", "waterlogging"]:
            if max_rain > 20:  # Heavy rain in last 24h
                score += 40
            elif max_rain > 5:
                score += 25
            if avg_moisture > 0.35:  # High soil moisture
                score += 20
            elif avg_moisture > 0.2:
                score += 10

        elif category in ["landslide"]:
            if total_rain > 50:  # Sustained heavy rain
                score += 35
            if avg_moisture > 0.3:
                score += 15

        elif category in ["fire"]:
            if max_rain < 1 and avg_moisture < 0.15:  # Dry conditions
                score += 30

        score = min(100, max(0, score))

        # Determine support level
        if score >= 65:
            support = "true"
            detail = f"Recent rainfall ({max_rain:.0f}mm peak) and high soil moisture support the report."
        elif score >= 40:
            support = "partial"
            detail = f"Some weather signals present ({max_rain:.0f}mm rain), partially supports report."
        else:
            support = "unclear"
            detail = f"Satellite weather data inconclusive for this location at this time."

        return {
            "satellite_score": score,
            "supports_evidence": support,
            "detail": detail
        }

    except Exception as e:
        logger.error(f"Satellite check failed: {e}")
        return {
            "satellite_score": 25,
            "supports_evidence": "unclear",
            "detail": "Satellite data temporarily unavailable, cannot cross-check."
        }