import logging
from typing import Dict, Any, Tuple

logger = logging.getLogger("signal_os.ai_geo")

class AIGeoService:
    async def validate_coordinates(self, lat: float, lng: float, address_text: str = None) -> Tuple[float, Dict[str, Any]]:
        """
        Validates geographical bounding boxes and location validity.
        Returns: (geo_score: 0-100, details: dict)
        """
        # Coordinate Bounds Check
        if not (-90.0 <= lat <= 90.0) or not (-180.0 <= lng <= 180.0):
            return 0.0, {"valid": False, "reason": "Coordinates out of bounds"}

        # Check for (0,0) null island
        if abs(lat) < 0.001 and abs(lng) < 0.001:
            return 10.0, {"valid": False, "reason": "Null island coordinates detected"}

        score = 80.0  # Valid GPS coordinates

        if address_text and len(address_text.strip()) > 3:
            score += 15.0

        return round(score, 2), {
            "valid": True,
            "latitude": lat,
            "longitude": lng,
            "has_address": bool(address_text)
        }

ai_geo_service = AIGeoService()