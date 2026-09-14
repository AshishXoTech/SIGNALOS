"""Optional provider-backed AI intelligence with safe local fallbacks."""
import json
import logging
import base64
from typing import Any, Dict, Optional

import httpx

from app.config import settings

logger = logging.getLogger("signal_os.ai_provider")

def _usable_key(value: Optional[str]) -> bool:
    return bool(value and value.strip().lower() not in {"placeholder", "sk-placeholder"})


def _provider_name() -> Optional[str]:
    requested = settings.AI_PROVIDER.strip().lower()
    if requested == "gemini" and _usable_key(settings.GEMINI_API_KEY):
        return "gemini"
    if requested == "grok" and _usable_key(settings.GROK_API_KEY):
        return "grok"
    if requested in {"auto", ""}:
        if _usable_key(settings.GEMINI_API_KEY):
            return "gemini"
        if _usable_key(settings.GROK_API_KEY):
            return "grok"
    return None


def configured_provider() -> str:
    return _provider_name() or "heuristic"


def _parse_json(text: str) -> Dict[str, Any]:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
    parsed = json.loads(cleaned)
    if not isinstance(parsed, dict):
        raise ValueError("AI response was not a JSON object")
    return parsed


def _prompt(description: str, disaster_type: str) -> str:
    return f"""
You are the safety-critical intake intelligence module for Signal OS, an Indian
multi-hazard emergency coordination platform. Analyze the citizen report below.
Do not invent facts. Return JSON only with this exact shape:
{{
  "text_score": number,
  "urgency_score": number,
  "language": "ISO-639-1 or unknown",
  "summary": "one concise operational sentence",
  "incident_type": "flood|earthquake|fire|landslide|cyclone|tsunami|drought|other",
  "victim_count": number or null,
  "hazards": ["short hazard strings"],
  "location_clues": ["landmarks, roads, localities, or directions"],
  "recommended_priority": "critical|high|moderate|low|unknown",
  "uncertainties": ["what still needs human confirmation"]
}}

Reported disaster type: {disaster_type}
Citizen report: {description}
""".strip()


async def analyze_text(description: str, disaster_type: str) -> Optional[Dict[str, Any]]:
    provider = _provider_name()
    if not provider:
        return None

    prompt = _prompt(description, disaster_type)
    try:
        async with httpx.AsyncClient(timeout=settings.AI_TIMEOUT_SECONDS) as client:
            if provider == "gemini":
                response = await client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent",
                    params={"key": settings.GEMINI_API_KEY},
                    json={
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {
                            "temperature": 0.1,
                            "responseMimeType": "application/json",
                        },
                    },
                )
                response.raise_for_status()
                body = response.json()
                text = body["candidates"][0]["content"]["parts"][0]["text"]
            else:
                response = await client.post(
                    "https://api.x.ai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {settings.GROK_API_KEY}"},
                    json={
                        "model": settings.GROK_MODEL,
                        "temperature": 0.1,
                        "response_format": {"type": "json_object"},
                        "messages": [
                            {"role": "system", "content": "Return valid JSON only."},
                            {"role": "user", "content": prompt},
                        ],
                    },
                )
                response.raise_for_status()
                body = response.json()
                text = body["choices"][0]["message"]["content"]

        result = _parse_json(text)
        result["engine"] = provider
        return result
    except (httpx.HTTPError, KeyError, TypeError, ValueError, json.JSONDecodeError) as exc:
        logger.warning("Provider AI unavailable; using deterministic triage fallback: %s", exc)
        return None


async def analyze_image(
    image_bytes: bytes, mime_type: str, disaster_type: str
) -> Optional[Dict[str, Any]]:
    """Use Gemini's multimodal endpoint when an image is available locally."""
    if not _usable_key(settings.GEMINI_API_KEY) or _provider_name() != "gemini":
        return None

    prompt = f"""
Analyze this emergency image for Signal OS. Do not identify people or infer
protected traits. Return JSON only:
{{
  "visual_score": number,
  "detected_labels": ["observable labels only"],
  "scene_summary": "one sentence",
  "life_safety_signals": ["fire", "smoke", "trapped_person", "flood_depth", "collapse", "none"],
  "uncertainties": ["what a human responder must verify"]
}}
Expected incident type: {disaster_type}
""".strip()
    try:
        async with httpx.AsyncClient(timeout=settings.AI_TIMEOUT_SECONDS) as client:
            response = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent",
                params={"key": settings.GEMINI_API_KEY},
                json={
                    "contents": [{
                        "parts": [
                            {"text": prompt},
                            {
                                "inline_data": {
                                    "mime_type": mime_type,
                                    "data": base64.b64encode(image_bytes).decode("ascii"),
                                }
                            },
                        ]
                    }],
                    "generationConfig": {
                        "temperature": 0.1,
                        "responseMimeType": "application/json",
                    },
                },
            )
            response.raise_for_status()
            body = response.json()
            text = body["candidates"][0]["content"]["parts"][0]["text"]
        result = _parse_json(text)
        result["engine"] = "gemini"
        return result
    except (httpx.HTTPError, KeyError, TypeError, ValueError, json.JSONDecodeError) as exc:
        logger.warning("Multimodal AI unavailable; using vision fallback: %s", exc)
        return None
