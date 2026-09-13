import logging
import re
from typing import Dict, Any, Tuple
from app.config import settings

logger = logging.getLogger("signal_os.ai_nlp")

CRISIS_KEYWORDS = [
    "flood", "water", "trapped", "help", "fire", "smoke", "burning",
    "collapsed", "rubble", "rescue", "stranded", "emergency", "tsunami",
    "earthquake", "landslide", "cyclone", "evacuate", "injured", "deadly"
]

HIGH_URGENCY_TOKENS = ["sos", "help us", "trapped", "rooftop", "dying", "urgent", "immediate"]

class AINLPService:
    async def analyze_text(self, description: str, disaster_type: str) -> Tuple[float, Dict[str, Any]]:
        """
        Runs NLP sentiment, urgency, and keyword relevance extraction.
        Returns: (text_score: 0-100, details: dict)
        """
        if not description or len(description.strip()) < 5:
            return 20.0, {"status": "invalid_text", "reason": "Text too short"}

        text_lower = description.lower()
        score = 50.0

        # Keyword matching
        matched_words = [word for word in CRISIS_KEYWORDS if word in text_lower]
        score += len(matched_words) * 8.0

        # Urgency detection
        urgency_detected = [token for token in HIGH_URGENCY_TOKENS if token in text_lower]
        if urgency_detected:
            score += 15.0

        # Type alignment
        if disaster_type.lower() in text_lower:
            score += 10.0

        # Cap between 0 and 99
        final_score = max(10.0, min(score, 99.0))

        return round(final_score, 2), {
            "text_length": len(description),
            "keywords_found": matched_words,
            "urgency_triggers": urgency_detected,
            "disaster_type_matched": disaster_type.lower() in text_lower
        }

ai_nlp_service = AINLPService()