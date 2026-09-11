"""
Vision Service — Analyzes uploaded crisis images.
Uses Gemini Vision (free tier) with smart fallback.
"""
import google.generativeai as genai
from PIL import Image
from app.config import get_settings
import json
import os
import logging

logger = logging.getLogger(__name__)
settings = get_settings()

_gemini_available = False
if settings.gemini_api_key and settings.gemini_api_key != "your_gemini_api_key_here":
    genai.configure(api_key=settings.gemini_api_key)
    _gemini_available = True


def analyze_image(image_path: str) -> dict:
    """
    Analyze a crisis photo and return structured evidence.

    Returns: {
        "vision_score": 0-100,
        "category": str,
        "detail": "short description of what is visible",
        "is_crisis": bool
    }
    """
    if not image_path or not os.path.exists(image_path):
        return {
            "vision_score": 0,
            "category": "unknown",
            "detail": "No image provided",
            "is_crisis": False
        }

    model = _get_model()

    if model:
        try:
            img = Image.open(image_path)

            prompt = """Analyze this photo for crisis/disaster evidence.
Return ONLY valid JSON with these exact fields:
{
    "is_crisis": <true/false>,
    "category": <one of: flood, waterlogging, landslide, fire, building_damage, road_blockage, medical_emergency, none>,
    "confidence": <0-100 integer>,
    "detail": "<1 sentence describing what you see related to the crisis>"
}

Rules:
- flood/waterlogging: visible water on roads, submerged areas, rising water
- landslide: mud flow, collapsed hillside, debris on road
- fire: flames, smoke, burnt structures
- building_damage: cracks, collapsed walls, rubble
- road_blockage: fallen trees, debris blocking road, barricades
- If the image shows no crisis evidence, set is_crisis=false and category=none
- Be factual, describe only what is visible"""

            response = model.generate_content([prompt, img])
            text = response.text.strip()
            if text.startswith("```"):
                text = text.split("\n", 1)[1].rsplit("```", 1)[0]
            result = json.loads(text)

            return {
                "vision_score": result.get("confidence", 0),
                "category": result.get("category", "unknown"),
                "detail": result.get("detail", "Image analyzed"),
                "is_crisis": result.get("is_crisis", False)
            }
        except Exception as e:
            logger.error(f"Gemini vision analysis failed: {e}")

    # Fallback: basic image property analysis
    return _fallback_vision_analysis(image_path)


def _get_model():
    if _gemini_available:
        return genai.GenerativeModel("gemini-2.0-flash")
    return None


def _fallback_vision_analysis(image_path: str) -> dict:
    """
    Fallback when no AI vision is available.
    Uses basic image properties to make a reasonable guess.
    In production, this would be replaced by a real model.
    """
    try:
        img = Image.open(image_path)
        width, height = img.size
        file_size = os.path.getsize(image_path)

        # Basic heuristic: larger, more detailed images tend to be real reports
        # This is a placeholder — real deployment uses actual vision models
        base_score = 50

        # Check if image is reasonably sized (not a tiny icon or screenshot)
        if width > 800 and height > 600:
            base_score += 15
        if file_size > 100_000:  # > 100KB suggests real photo
            base_score += 10

        base_score = min(85, base_score)  # Cap at 85 without real AI

        return {
            "vision_score": base_score,
            "category": "flood",  # Default assumption for demo
            "detail": "Image received and processed (vision AI in fallback mode)",
            "is_crisis": True
        }
    except Exception as e:
        logger.error(f"Fallback vision failed: {e}")
        return {
            "vision_score": 30,
            "category": "unknown",
            "detail": "Image could not be analyzed",
            "is_crisis": False
        }