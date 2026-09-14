from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.models.assignment import Assignment
from app.models.closure import Closure
from app.models.incident import Incident
from app.models.user import User
from app.schemas.operations import (
    AssignmentCreate,
    AssignmentResponse,
    AssignmentTransition,
    ClosureCreate,
    ClosureResponse,
    ClosureReview,
)

assignments_router = APIRouter(prefix="/assignments", tags=["Assignments"])
closures_router = APIRouter(prefix="/closures", tags=["Closures"])


@assignments_router.post("/incidents/{incident_id}/assign", response_model=AssignmentResponse, status_code=201)
async def assign_team(
    incident_id: UUID,
    payload: AssignmentCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles("dispatcher", "operator", "supervisor", "admin")),
):
    incident = await db.scalar(select(Incident).where(Incident.id == incident_id))
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    assignment = Assignment(
        incident_id=incident_id,
        team_id=payload.team_id,
        team_name=payload.team_name,
        responder_id=payload.responder_id,
        notes=payload.notes,
        status="offered",
    )
    db.add(assignment)
    incident.status = "active"
    await db.commit()
    await db.refresh(assignment)
    return assignment


@assignments_router.get("/me", response_model=list[AssignmentResponse])
async def my_assignments(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles("responder", "admin")),
):
    result = await db.execute(
        select(Assignment)
        .where(
            (Assignment.responder_id == user.id)
            | (Assignment.responder_id.is_(None))
        )
        .order_by(desc(Assignment.updated_at))
    )
    return result.scalars().all()


@assignments_router.post("/{assignment_id}/transition", response_model=AssignmentResponse)
async def transition_assignment(
    assignment_id: UUID,
    payload: AssignmentTransition,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles("responder", "dispatcher", "supervisor", "admin")),
):
    assignment = await db.scalar(select(Assignment).where(Assignment.id == assignment_id))
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    assignment.status = payload.new_status
    assignment.notes = payload.reason or assignment.notes
    if payload.new_status == "accepted" and assignment.accepted_at is None:
        assignment.accepted_at = datetime.utcnow()
    await db.commit()
    await db.refresh(assignment)
    return assignment


@closures_router.post("/incidents/{incident_id}/closure", response_model=ClosureResponse, status_code=201)
async def submit_closure(
    incident_id: UUID,
    payload: ClosureCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles("responder", "admin")),
):
    incident = await db.scalar(select(Incident).where(Incident.id == incident_id))
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    closure = Closure(
        incident_id=incident_id,
        assignment_id=payload.assignment_id,
        submitted_by=str(user.id),
        actions_taken=payload.actions_taken,
        people_assisted=payload.people_assisted,
        remaining_risks=payload.remaining_risks,
        status="pending",
    )
    db.add(closure)
    incident.status = "monitoring"
    await db.commit()
    await db.refresh(closure)
    return closure


@closures_router.get("/pending", response_model=list[ClosureResponse])
async def pending_closures(
    limit: int = Query(default=100, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles("supervisor", "admin")),
):
    result = await db.execute(
        select(Closure)
        .where(Closure.status == "pending")
        .order_by(desc(Closure.created_at))
        .limit(limit)
    )
    return result.scalars().all()


@closures_router.post("/{closure_id}/review", response_model=ClosureResponse)
async def review_closure(
    closure_id: UUID,
    payload: ClosureReview,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles("supervisor", "admin")),
):
    closure = await db.scalar(select(Closure).where(Closure.id == closure_id))
    if not closure:
        raise HTTPException(status_code=404, detail="Closure not found")

    closure.status = payload.decision
    closure.review_notes = payload.review_notes
    closure.reviewed_at = datetime.utcnow()
    if payload.decision == "approved":
        incident = await db.scalar(select(Incident).where(Incident.id == closure.incident_id))
        if incident:
            incident.status = "resolved"
            incident.resolved_at = datetime.utcnow()
    await db.commit()
    await db.refresh(closure)
    return closure
