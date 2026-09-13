import logging
from app.config import settings
from app.schemas.verification import VerificationResult
from app.services.ai_vision import ai_vision_service
from app.services.ai_nlp import ai_nlp_service
from app.services.ai_geo import ai_geo_service
from app.services.ai_crowd import ai_crowd_service
from app.services.ai_weather import ai_weather_service
from app.models.report import Report

logger = logging.getLogger("signal_os.consensus_engine")


class ConsensusEngine:
    def __init__(self):
        self.w_vision = settings.VISION_WEIGHT
        self.w_text = settings.TEXT_WEIGHT
        self.w_geo = settings.GEO_WEIGHT
        self.w_crowd = settings.CROWD_WEIGHT
        self.w_weather = settings.WEATHER_WEIGHT

    async def verify_report(self, report: Report, db) -> VerificationResult:
        disaster_str = str(report.disaster_type)

        v_score, v_details = await ai_vision_service.analyze_image(report.image_url, disaster_str)
        t_score, t_details = await ai_nlp_service.analyze_text(report.description, disaster_str)
        g_score, g_details = await ai_geo_service.validate_coordinates(report.latitude, report.longitude, report.address_text)
        c_score, c_details = await ai_crowd_service.evaluate_crowd_consensus(db, report.latitude, report.longitude, disaster_str)
        w_score, w_details = await ai_weather_service.verify_weather_conditions(report.latitude, report.longitude, disaster_str)

        trust_score = (
            (self.w_vision * v_score) +
            (self.w_text * t_score) +
            (self.w_geo * g_score) +
            (self.w_crowd * c_score) +
            (self.w_weather * w_score)
        )
        trust_score = round(max(0.0, min(trust_score, 100.0)), 2)

        if trust_score >= settings.TRUST_SCORE_VERIFIED:
            decision = "verified"
            new_status = "verified"
        elif trust_score <= settings.TRUST_SCORE_SUSPICIOUS:
            decision = "rejected"
            new_status = "rejected"
        else:
            decision = "needs_review"
            new_status = "verifying"

        report.vision_score = v_score
        report.text_nlp_score = t_score
        report.geo_score = g_score
        report.crowd_score = c_score
        report.weather_score = w_score
        report.trust_score = trust_score
        report.status = new_status

        return VerificationResult(
            report_id=report.id,
            vision_score=v_score,
            text_nlp_score=t_score,
            geo_score=g_score,
            crowd_score=c_score,
            weather_score=w_score,
            trust_score=trust_score,
            decision=decision,
            confidence=round(trust_score / 100.0, 2),
            vision_details=v_details,
            text_details=t_details,
            geo_details=g_details,
            crowd_details=c_details,
            weather_details=w_details
        )


consensus_engine = ConsensusEngine()