import logging
from pathlib import Path
from typing import Dict, Any, Tuple
from app.config import settings
from app.services.ai_provider import analyze_image as provider_analyze_image

logger = logging.getLogger("signal_os.ai_vision")

class AIVisionService:
    def __init__(self):
        self.api_key = settings.GOOGLE_VISION_KEY

    async def analyze_image(self, image_url: str, disaster_type: str) -> Tuple[float, Dict[str, Any]]:
        """
        Analyzes media for visual markers matching the disaster type.
        Returns: (vision_score: 0-100, details: dict)
        """
        if not image_url:
            return 50.0, {"status": "no_media", "reason": "No image provided, using baseline score"}

        try:
            logger.info(f"Analyzing image url: {image_url} for type: {disaster_type}")
            media_marker = "/media/"
            if media_marker in image_url:
                relative = image_url.split(media_marker, 1)[1]
                image_path = settings.MEDIA_DIR and Path(settings.MEDIA_DIR) / relative
                if image_path and image_path.exists():
                    provider_result = await provider_analyze_image(
                        image_path.read_bytes(),
                        self._mime_type(image_path.suffix),
                        disaster_type,
                    )
                    if provider_result:
                        raw_score = provider_result.get("visual_score", 50)
                        score = max(0.0, min(float(raw_score), 100.0))
                        return round(score, 2), {
                            "status": "provider",
                            "engine": provider_result.pop("engine", "gemini"),
                            **provider_result,
                        }

            disaster_keywords = {
                "flood": ["water", "submerged", "river", "flood", "rain"],
                "fire": ["smoke", "flame", "fire", "burn", "ash"],
                "earthquake": ["rubble", "collapse", "crack", "debris"],
                "landslide": ["mud", "rock", "slide", "dirt"]
            }

            matched_keywords = []
            score = 65.0  # Default verified base score for uploaded image

            lower_url = image_url.lower()
            expected = disaster_keywords.get(disaster_type.lower(), [])
            for kw in expected:
                if kw in lower_url:
                    matched_keywords.append(kw)
                    score += 15.0

            score = min(score, 98.0)

            return round(score, 2), {
                "status": "fallback",
                "engine": "heuristic",
                "detected_labels": matched_keywords if matched_keywords else ["crisis_scene"],
                "visual_confidence": score / 100.0,
                "has_manipulation_flag": False
            }

        except Exception as e:
            logger.error(f"Vision analysis failed: {str(e)}")
            return 40.0, {"status": "error", "error": str(e)}

    @staticmethod
    def _mime_type(suffix: str) -> str:
        return {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".webp": "image/webp",
            ".gif": "image/gif",
        }.get(suffix.lower(), "application/octet-stream")

ai_vision_service = AIVisionService()