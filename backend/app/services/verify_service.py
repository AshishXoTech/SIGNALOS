"""
Verification Service — The Consensus Engine.
This is the CORE INNOVATION of SIGNAL OS.

Fuses 5 independent evidence signals into a single Trust Score:
  1. Vision (image analysis)
  2. Text (NLP urgency)
  3. Geo (location consistency)
  4. Crowd (nearby report consensus)
  5. Satellite (weather/satellite cross-check)

Each signal is scored 0-100 independently, then fused with weights.
"""
from sqlmodel import Session, select
from app.models import Report, VerificationLog
from app.services.vision_service import analyze_image
from app.services.llm_service import (
    analyze_text_urgency,
    generate_explanation
)
from app.services.satellite_service import check_satellite_evidence
from app.config import get_settings
from datetime import datetime, timedelta
import math
import json
import logging

logger = logging.getLogger(__name__)
settings = get_settings()


def _haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance between two GPS points in meters."""
    R = 6_371_000  # Earth radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)

    a = (math.sin(dphi / 2) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _compute_geo_consistency(lat: float, lng: float, category: str) -> dict:
    """
    Check if the reported category makes geographic sense.
    e.g., "flood" on a hilltop is less consistent than in a valley.

    For MVP, we use a simple heuristic. In production, integrate DEM/SRTM data.
    """
    # Simple heuristic: most crisis reports in urban/semi-urban areas are plausible
    # A real system would check elevation, slope, flood plains, etc.
    score = 55  # neutral baseline

    # Check if coordinates are within India (for SIH relevance)
    if 8.0 <= lat <= 37.0 and 68.0 <= lng <= 97.0:
        score += 15  # Within India, more likely genuine

    # Check if coordinates are in a populated area (rough check)
    # Major Indian cities bounding boxes (simplified)
    major_cities = [
        (28.5, 77.1, 28.8, 77.4),   # Delhi
        (18.9, 72.8, 19.2, 73.0),   # Mumbai
        (12.9, 77.5, 13.1, 77.7),   # Bengaluru
        (22.5, 88.3, 22.7, 88.5),   # Kolkata
        (13.0, 80.1, 13.2, 80.3),   # Chennai
        (17.3, 78.4, 17.5, 78.6),   # Hyderabad
        (23.0, 72.5, 23.1, 72.7),   # Ahmedabad
        (26.8, 80.9, 27.0, 81.1),   # Lucknow
        (25.5, 85.1, 25.7, 85.3),   # Patna
        (26.1, 91.7, 26.3, 91.9),   # Guwahati
    ]

    for min_lat, min_lng, max_lat, max_lng in major_cities:
        if min_lat <= lat <= max_lat and min_lng <= lng <= max_lng:
            score += 15  # Near major city, more likely genuine report
            break

    score = min(100, max(0, score))

    if score >= 70:
        detail = "Location is consistent with reported crisis type."
    elif score >= 45:
        detail = "Location is plausible for this report type."
    else:
        detail = "Location context could not be fully verified."

    return {"geo_score": score, "detail": detail}


def _compute_crowd_consensus(
    session: Session,
    report_id: str,
    lat: float,
    lng: float,
    category: str
) -> dict:
    """
    Check if other nearby reports support this one.
    If 2+ reports within 500m in the last 60 min say similar things → high consensus.
    """
    time_window = datetime.utcnow() - timedelta(
        minutes=settings.cluster_time_window_minutes
    )

    # Get recent reports (excluding current)
    statement = select(Report).where(
        Report.id != report_id,
        Report.created_at >= time_window,
        Report.status.in_(["verified", "likely", "received", "verifying"])
    )
    nearby_reports = session.exec(statement).all()

    # Filter by distance
    nearby = []
    for r in nearby_reports:
        dist = _haversine_distance(lat, lng, r.lat, r.lng)
        if dist <= settings.cluster_radius_meters:
            nearby.append({"report": r, "distance": dist})

    if not nearby:
        return {
            "crowd_score": 20,
            "detail": "No nearby reports found for cross-verification.",
            "nearby_count": 0
        }

    # Count reports with matching category
    matching = [
        n for n in nearby
        if n["report"].detected_category == category
        or n["report"].detected_category == "unknown"
    ]

    total_nearby = len(nearby)
    matching_count = len(matching)

    # Score based on consensus strength
    if matching_count >= 3:
        score = 90
        detail = f"Strong consensus: {matching_count} nearby reports confirm similar situation."
    elif matching_count >= 1:
        score = 65
        detail = f"Partial consensus: {matching_count} nearby report(s) support this."
    elif total_nearby >= 2:
        score = 45
        detail = f"{total_nearby} nearby reports found but different categories."
    else:
        score = 30
        detail = f"Only {total_nearby} nearby report, insufficient for consensus."

    return {
        "crowd_score": min(100, score),
        "detail": detail,
        "nearby_count": total_nearby
    }


async def run_full_verification(
    session: Session,
    report: Report
) -> Report:
    """
    THE MAIN PIPELINE.
    Runs all 5 verification checks and computes the final Trust Score.

    This is the function that makes SIGNAL OS different from every other app.
    """

    # ── Step 0: Mark as verifying ──
    report.status = "verifying"
    session.add(report)
    session.commit()
    session.refresh(report)

    verification_steps = []

    # ── Step 1: Vision Analysis ──
    logger.info(f"[VERIFY] Running vision analysis for report {report.id}")
    vision_result = analyze_image(report.image_path)
    report.vision_score = vision_result["vision_score"]
    vision_detail = vision_result["detail"]

    verification_steps.append(VerificationLog(
        report_id=report.id,
        step="vision_analysis",
        result=json.dumps(vision_result)
    ))

    # Update detected category from vision (most reliable source)
    if vision_result["category"] != "unknown":
        report.detected_category = vision_result["category"]

    # ── Step 2: Text/NLP Analysis ──
    logger.info(f"[VERIFY] Running text analysis for report {report.id}")
    text_result = analyze_text_urgency(report.description)
    report.text_score = text_result["urgency_score"]
    text_detail = f"Urgency: {text_result['urgency_score']}%, Category: {text_result['category']}"

    # If vision couldn't determine category, use text
    if report.detected_category == "unknown" and text_result["category"] != "unknown":
        report.detected_category = text_result["category"]

    verification_steps.append(VerificationLog(
        report_id=report.id,
        step="text_analysis",
        result=json.dumps(text_result)
    ))

    # ── Step 3: Geo-Consistency Check ──
    logger.info(f"[VERIFY] Running geo-consistency for report {report.id}")
    geo_result = _compute_geo_consistency(
        report.lat, report.lng, report.detected_category
    )
    report.geo_score = geo_result["geo_score"]
    geo_detail = geo_result["detail"]

    verification_steps.append(VerificationLog(
        report_id=report.id,
        step="geo_consistency",
        result=json.dumps(geo_result)
    ))

    # ── Step 4: Crowd Consensus ──
    logger.info(f"[VERIFY] Running crowd consensus for report {report.id}")
    crowd_result = _compute_crowd_consensus(
        session, report.id, report.lat, report.lng, report.detected_category
    )
    report.crowd_score = crowd_result["crowd_score"]
    crowd_detail = crowd_result["detail"]

    verification_steps.append(VerificationLog(
        report_id=report.id,
        step="crowd_consensus",
        result=json.dumps(crowd_result)
    ))

    # ── Step 5: Satellite Cross-Check (Async) ──
    logger.info(f"[VERIFY] Running satellite cross-check for report {report.id}")
    sat_result = await check_satellite_evidence(
        report.lat, report.lng, report.detected_category
    )
    report.satellite_score = sat_result["satellite_score"]
    sat_detail = sat_result["detail"]

    verification_steps.append(VerificationLog(
        report_id=report.id,
        step="satellite_crosscheck",
        result=json.dumps(sat_result)
    ))

    # ── Step 6: Consensus Fusion (THE CORE FORMULA) ──
    trust_score = (
        settings.weight_vision * report.vision_score +
        settings.weight_text * report.text_score +
        settings.weight_geo * report.geo_score +
        settings.weight_crowd * report.crowd_score +
        settings.weight_satellite * report.satellite_score
    )
    report.trust_score = round(trust_score, 1)

    # ── Step 7: Determine Verdict ──
    if report.trust_score >= settings.verified_threshold:
        report.verdict = "verified"
        report.status = "verified"
    elif report.trust_score >= settings.likely_threshold:
        report.verdict = "likely"
        report.status = "likely"
    elif report.trust_score >= settings.needs_review_threshold:
        report.verdict = "needs_review"
        report.status = "needs_review"
    else:
        report.verdict = "unverified"
        report.status = "unverified"

    # ── Step 8: Generate Human-Readable Explanation ──
    report.explanation = generate_explanation(
        category=report.detected_category,
        trust_score=report.trust_score,
        vision_detail=vision_detail,
        text_detail=text_detail,
        geo_detail=geo_detail,
        crowd_detail=crowd_detail
    )

    report.verified_at = datetime.utcnow()

    # ── Step 9: Save Everything ──
    session.add(report)
    for log in verification_steps:
        session.add(log)
    session.commit()
    session.refresh(report)

    logger.info(
        f"[VERIFY] Report {report.id} → {report.verdict} "
        f"(score: {report.trust_score})"
    )

    return report