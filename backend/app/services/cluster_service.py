"""
Clustering Service — Groups nearby verified reports into Incidents.
Uses DBSCAN on GPS coordinates + time window.
"""
from sqlmodel import Session, select
from app.models import Report, Incident
from app.services.llm_service import generate_incident_summary
from app.config import get_settings
from datetime import datetime, timedelta
import numpy as np
from sklearn.cluster import DBSCAN
import math
import logging

logger = logging.getLogger(__name__)
settings = get_settings()


def _haversine_km(lat1, lng1, lat2, lng2):
    """Haversine distance in kilometers."""
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = (math.sin(dphi / 2) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def run_clustering(session: Session) -> list[Incident]:
    """
    Run DBSCAN clustering on recent verified/likely reports.
    Creates or updates Incident records.
    Returns list of new/updated incidents.
    """
    time_window = datetime.utcnow() - timedelta(
        minutes=settings.cluster_time_window_minutes * 2
    )

    # Get all verified/likely reports in the time window
    statement = select(Report).where(
        Report.status.in_(["verified", "likely"]),
        Report.created_at >= time_window
    )
    reports = session.exec(statement).all()

    if len(reports) < settings.min_reports_for_incident:
        return []

    # Prepare coordinates for DBSCAN
    coords = np.array([[r.lat, r.lng] for r in reports])

    # Convert radius from meters to approximate degrees for DBSCAN eps
    # 1 degree ≈ 111 km, so 500m ≈ 0.0045 degrees
    eps_degrees = settings.cluster_radius_meters / 111_000

    # Run DBSCAN
    clustering = DBSCAN(
        eps=eps_degrees,
        min_samples=settings.min_reports_for_incident,
        metric="euclidean"
    )
    labels = clustering.fit_predict(coords)

    new_incidents = []

    # Process each cluster
    unique_labels = set(labels)
    unique_labels.discard(-1)  # -1 = noise (unclustered points)

    for label in unique_labels:
        cluster_indices = [i for i, l in enumerate(labels) if l == label]
        cluster_reports = [reports[i] for i in cluster_indices]

        if len(cluster_reports) < settings.min_reports_for_incident:
            continue

        # Calculate cluster center
        center_lat = np.mean([r.lat for r in cluster_reports])
        center_lng = np.mean([r.lng for r in cluster_reports])

        # Calculate affected radius
        max_dist = max(
            _haversine_km(center_lat, center_lng, r.lat, r.lng)
            for r in cluster_reports
        ) * 1000  # convert to meters

        # Determine dominant category
        categories = [r.detected_category for r in cluster_reports]
        dominant_category = max(set(categories), key=categories.count)

        # Calculate average trust score
        avg_trust = np.mean([r.trust_score for r in cluster_reports])

        # Determine severity
        if avg_trust >= 85 and len(cluster_reports) >= 5:
            severity = "critical"
        elif avg_trust >= 70 or len(cluster_reports) >= 3:
            severity = "high"
        elif avg_trust >= 55:
            severity = "moderate"
        else:
            severity = "low"

        # Generate title and summary
        summary_data = generate_incident_summary(
            category=dominant_category,
            report_count=len(cluster_reports),
            center_address=cluster_reports[0].address,
            severity=severity
        )

        # Check if an incident already exists near this location
        existing = _find_nearby_incident(session, center_lat, center_lng)

        if existing:
            # Update existing incident
            existing.report_count = len(cluster_reports)
            existing.center_lat = float(center_lat)
            existing.center_lng = float(center_lng)
            existing.avg_trust_score = float(avg_trust)
            existing.severity = severity
            existing.affected_radius_meters = float(max_dist)
            existing.updated_at = datetime.utcnow()
            existing.title = summary_data["title"]
            existing.summary = summary_data["summary"]
            session.add(existing)
            incident = existing
        else:
            # Create new incident
            incident = Incident(
                title=summary_data["title"],
                summary=summary_data["summary"],
                category=dominant_category,
                center_lat=float(center_lat),
                center_lng=float(center_lng),
                report_count=len(cluster_reports),
                avg_trust_score=float(avg_trust),
                severity=severity,
                affected_radius_meters=float(max_dist),
                status="active"
            )
            session.add(incident)
            new_incidents.append(incident)

        # Link reports to incident
        for r in cluster_reports:
            r.incident_id = incident.id
            session.add(r)

    session.commit()
    return new_incidents


def _find_nearby_incident(
    session: Session,
    lat: float,
    lng: float,
    radius_km: float = 1.0
) -> Incident | None:
    """Find an existing active incident near the given coordinates."""
    statement = select(Incident).where(Incident.status == "active")
    incidents = session.exec(statement).all()

    for inc in incidents:
        dist = _haversine_km(lat, lng, inc.center_lat, inc.center_lng)
        if dist <= radius_km:
            return inc
    return None