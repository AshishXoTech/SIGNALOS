import logging
import uuid
from datetime import datetime, timedelta
from typing import List
import numpy as np
from sklearn.cluster import DBSCAN
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func

from app.config import settings
from app.models.report import Report, ReportStatus
from app.models.incident import Incident, IncidentSeverity, IncidentStatus

logger = logging.getLogger("signal_os.cluster")


class ClusterService:
    def __init__(self):
        self.eps_km = settings.CLUSTER_EPS_KM
        self.min_samples = settings.CLUSTER_MIN_SAMPLES
        self.time_window_hours = settings.CLUSTER_TIME_WINDOW_HOURS

    async def cluster_verified_reports(self, db: AsyncSession) -> List[Incident]:
        """
        Runs DBSCAN on verified reports (within time window) to auto-create incidents.
        """
        cutoff = datetime.utcnow() - timedelta(hours=self.time_window_hours)

        query = select(Report).where(
            and_(
                Report.status == ReportStatus.VERIFIED,
                Report.reported_at >= cutoff,
                Report.incident_id.is_(None)
            )
        )
        result = await db.execute(query)
        reports = result.scalars().all()

        if len(reports) < self.min_samples:
            logger.info(f"Not enough verified reports ({len(reports)}) for clustering.")
            return []

        # Build coordinate matrix (radians, for haversine metric)
        coords = np.array([[np.radians(r.latitude), np.radians(r.longitude)] for r in reports])
        eps_radians = self.eps_km / 6371.0  # Earth radius km

        db_scan = DBSCAN(
            eps=eps_radians,
            min_samples=self.min_samples,
            metric="haversine"
        )
        labels = db_scan.fit_predict(coords)

        created_incidents = []
        cluster_ids = set(labels) - {-1}

        for cluster_label in cluster_ids:
            cluster_reports = [r for r, lab in zip(reports, labels) if lab == cluster_label]

            lats = [r.latitude for r in cluster_reports]
            lngs = [r.longitude for r in cluster_reports]
            centroid_lat = sum(lats) / len(lats)
            centroid_lng = sum(lngs) / len(lngs)
            avg_trust = sum(r.trust_score for r in cluster_reports) / len(cluster_reports)

            # Severity from crowd size + trust
            if len(cluster_reports) >= 10 or avg_trust >= 90:
                severity = IncidentSeverity.CRITICAL
            elif len(cluster_reports) >= 5 or avg_trust >= 80:
                severity = IncidentSeverity.HIGH
            elif len(cluster_reports) >= 3:
                severity = IncidentSeverity.MEDIUM
            else:
                severity = IncidentSeverity.LOW

            disaster_type = cluster_reports[0].disaster_type.value if hasattr(
                cluster_reports[0].disaster_type, 'value'
            ) else str(cluster_reports[0].disaster_type)

            incident = Incident(
                title=f"{disaster_type.title()} incident ({len(cluster_reports)} reports)",
                description=f"Auto-clustered incident from {len(cluster_reports)} verified reports",
                disaster_type=disaster_type,
                severity=severity,
                status=IncidentStatus.ACTIVE,
                latitude=centroid_lat,
                longitude=centroid_lng,
                location=func.ST_SetSRID(func.ST_MakePoint(centroid_lng, centroid_lat), 4326),
                radius_meters=self.eps_km * 1000,
                report_count=len(cluster_reports),
                avg_trust_score=round(avg_trust, 2),
                cluster_id=f"dbscan-{uuid.uuid4().hex[:8]}",
                dbscan_params={
                    "eps_km": self.eps_km,
                    "min_samples": self.min_samples,
                    "time_window_hours": self.time_window_hours
                }
            )
            db.add(incident)
            await db.flush()

            # Link reports to this incident
            for r in cluster_reports:
                r.incident_id = incident.id

            created_incidents.append(incident)
            logger.info(f"✅ Created incident {incident.id} from {len(cluster_reports)} reports")

        await db.commit()
        return created_incidents


cluster_service = ClusterService()