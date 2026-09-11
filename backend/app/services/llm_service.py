"""
LLM Service — Handles all text-based AI reasoning.
Uses Google Gemini Flash (free tier) with smart fallback.
"""
import google.generativeai as genai
from app.config import get_settings
import json
import logging

logger = logging.getLogger(__name__)
settings = get_settings()

# Configure Gemini if API key is available
_gemini_available = False
if settings.gemini_api_key and settings.gemini_api_key != "your_gemini_api_key_here":
    genai.configure(api_key=settings.gemini_api_key)
    _gemini_available = True
    logger.info("Gemini AI configured successfully")
else:
    logger.warning("No Gemini API key. Using smart fallback mode.")


def _get_model():
    if _gemini_available:
        return genai.GenerativeModel("gemini-2.0-flash")
    return None


def analyze_text_urgency(description: str) -> dict:
    """
    Analyze report text for urgency, severity, and category.
    Returns: {urgency_score: 0-100, category: str, keywords: [str]}
    """
    if not description or len(description.strip()) < 3:
        return {"urgency_score": 40, "category": "unknown", "keywords": []}

    model = _get_model()

    if model:
        try:
            prompt = f"""Analyze this crisis report text and return ONLY valid JSON.

Report: "{description}"

Return JSON with exactly these fields:
{{
    "urgency_score": <0-100 integer, higher = more urgent>,
    "category": <one of: flood, waterlogging, landslide, fire, building_damage, road_blockage, medical_emergency, other>,
    "keywords": [<list of 2-4 key descriptive words>]
}}

Rules:
- urgency_score: 80-100 for life-threatening, 50-79 for serious, 20-49 for moderate, 0-19 for low
- Detect language automatically (Hindi, English, mixed)
- Be concise"""

            response = model.generate_content(prompt)
            text = response.text.strip()
            # Clean markdown code blocks if present
            if text.startswith("```"):
                text = text.split("\n", 1)[1].rsplit("```", 1)[0]
            return json.loads(text)
        except Exception as e:
            logger.error(f"Gemini text analysis failed: {e}")

    # Smart fallback: keyword-based heuristic
    return _fallback_text_analysis(description)


def _fallback_text_analysis(description: str) -> dict:
    """Keyword-based fallback when no LLM is available."""
    text = description.lower()

    # Urgency keywords
    high_urgency = ["urgent", "help", "emergency", "trapped", "drowning",
                    "fire", "collapse", "injured", "stuck", "flooded",
                    "बचाओ", "फंसे", "डूब", "आग", "तुरंत"]
    medium_urgency = ["water", "rain", "blocked", "damage", "leaking",
                      "crack", "पाानी", "बारिश", "नुकसान", "सड़क"]
    low_urgency = ["minor", "small", "slow", "slight", "thoda", "chhota"]

    score = 30  # base
    for kw in high_urgency:
        if kw in text:
            score += 15
    for kw in medium_urgency:
        if kw in text:
            score += 8
    for kw in low_urgency:
        if kw in text:
            score -= 5

    score = max(0, min(100, score))

    # Category detection
    category = "other"
    if any(w in text for w in ["flood", "water", "submerged", "पानी", "जलभराव", "बारिश"]):
        category = "flood"
    elif any(w in text for w in ["landslide", "mud", "भूस्खलन", "मिट्टी"]):
        category = "landslide"
    elif any(w in text for w in ["fire", "smoke", "आग", "धुआं"]):
        category = "fire"
    elif any(w in text for w in ["road", "blocked", "सड़क", "रास्ता"]):
        category = "road_blockage"
    elif any(w in text for w in ["building", "collapse", "इमारत", "गिर"]):
        category = "building_damage"

    return {
        "urgency_score": score,
        "category": category,
        "keywords": [w for w in text.split() if len(w) > 3][:4]
    }


def generate_explanation(
    category: str,
    trust_score: float,
    vision_detail: str,
    text_detail: str,
    geo_detail: str,
    crowd_detail: str
) -> str:
    """
    Generate a 1-2 line human-readable explanation for the verification verdict.
    This is what the judge/citizen sees. Must be simple, factual, non-technical.
    """
    model = _get_model()

    if model:
        try:
            prompt = f"""Generate a SHORT verification explanation (1-2 sentences max, under 25 words).

Context:
- Crisis type: {category}
- Confidence: {trust_score}%
- Visual evidence: {vision_detail}
- Text analysis: {text_detail}
- Location check: {geo_detail}
- Nearby reports: {crowd_detail}

Rules:
- Write in simple English anyone can understand
- Be factual, not dramatic
- Mention the strongest evidence
- NO technical jargon (no "AI", "model", "confidence", "algorithm")
- Example good output: "Water pooling visible on road, matches low-lying area with 2 nearby reports."

Return ONLY the explanation text, nothing else."""

            response = model.generate_content(prompt)
            return response.text.strip().strip('"')
        except Exception as e:
            logger.error(f"Gemini explanation failed: {e}")

    # Fallback explanation
    if trust_score >= 75:
        return f"{category.replace('_', ' ').title()} confirmed by visual evidence and nearby reports."
    elif trust_score >= 55:
        return f"Likely {category.replace('_', ' ')} based on available evidence, needs field confirmation."
    else:
        return f"Insufficient evidence to confirm {category.replace('_', ' ')}, under review."


def generate_incident_summary(
    category: str,
    report_count: int,
    center_address: str,
    severity: str
) -> str:
    """Generate a short incident title + summary for the cluster."""
    model = _get_model()

    if model:
        try:
            prompt = f"""Generate a short incident title (under 8 words) and 1-sentence summary.

Context:
- Type: {category}
- Reports: {report_count} verified reports
- Location: {center_address or 'Unknown area'}
- Severity: {severity}

Return JSON: {{"title": "...", "summary": "..."}}
Keep it factual and concise. No jargon."""

            response = model.generate_content(prompt)
            text = response.text.strip()
            if text.startswith("```"):
                text = text.split("\n", 1)[1].rsplit("```", 1)[0]
            return json.loads(text)
        except Exception as e:
            logger.error(f"Gemini incident summary failed: {e}")

    # Fallback
    cat_name = category.replace("_", " ").title()
    return {
        "title": f"{cat_name} — {report_count} Reports",
        "summary": f"{report_count} verified {cat_name.lower()} reports clustered in {center_address or 'the area'}. Severity: {severity}."
    }