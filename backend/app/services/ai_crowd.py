import logging
from typing import Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.report import Report

logger = logging.getLogger("signal_os.ai_crowd")

class AICrowdService:
    async def evaluate_crowd_consensus(
        self, db: AsyncSession, lat: float, lng: float, disaster_type: str
    ) -> Tuple[float, Dict[str, Any]]:
        """
        Finds surrounding reports within ~5km to establish crowd consensus.
        Returns: (crowd_score: 0-100, details: dict)
        """
        try:
            # Query nearby verified/pending reports using ST_DWithin geography
            # 5000 meters radius
            query = select(func.count(Report.id)).where(
                func.ST_DWithin(
                    Report.location,
                    func.ST_SetSRID(func.ST_MakePoint(lng, lat), 4326),
                    5000
                )
            )
            
            result = await db.execute(query)
            nearby_count = result.scalar() or 0

            # Base score start
            if nearby_count == 0:
                score = 55.0  # First report in area
            elif nearby_count >= 5:
                score = 95.0  # High crowd density verification
            else:
                score = 65.0 + (nearby_count * 6.0)

            return round(score, 2), {
                "nearby_reports_5km": nearby_count,
                "consensus_level": "high" if nearby_count >= 3 else "moderate" if nearby_count > 0 else "isolated"
            }

        except Exception as e:
            logger.warning(f"Crowd consensus fallback used: {str(e)}")
            return 60.0, {"nearby_reports_5km": 0, "fallback": True}

ai_crowd_service = AICrowdService()