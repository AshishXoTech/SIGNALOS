# backend/app/api/v1/users.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.schemas.user import (
    UserCreate, UserLogin, UserResponse, UserUpdate, TokenResponse, UserStats
)
from app.core.security import hash_password, verify_password, create_access_token
from app.dependencies import get_current_user

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)):
    """Register a new user"""
    # Check existing
    existing = await db.execute(
        select(User).where(
            (User.email == data.email) | (User.username == data.username)
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email or username already registered",
        )

    user = User(
        email=data.email,
        username=data.username,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        phone=data.phone,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": user.role})

    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    """Login and get JWT token"""
    result = await db.execute(
        select(User).where(
            (User.username == data.username)
            | (User.email == data.username)
            | (User.phone == data.username)
        )
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    user.last_login = datetime.utcnow()

    token = create_access_token({"sub": str(user.id), "role": user.role})

    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    """Get current user profile"""
    return UserResponse.model_validate(user)


@router.put("/me", response_model=UserResponse)
async def update_me(
    data: UserUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update current user profile"""
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(user, key, value)
    user.updated_at = datetime.utcnow()
    return UserResponse.model_validate(user)


@router.get("/me/stats", response_model=UserStats)
async def get_my_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user statistics"""
    from app.models.report import Report
    from sqlalchemy import func

    verified_result = await db.execute(
        select(func.count(Report.id)).where(
            Report.user_id == str(user.id),
            Report.status == "verified",
        )
    )
    debunked_result = await db.execute(
        select(func.count(Report.id)).where(
            Report.user_id == str(user.id),
            Report.status == "debunked",
        )
    )

    rank = "Novice"
    if user.reputation_score >= 90:
        rank = "Elite Verifier"
    elif user.reputation_score >= 70:
        rank = "Trusted Reporter"
    elif user.reputation_score >= 50:
        rank = "Active Contributor"
    elif user.reputation_score >= 30:
        rank = "Regular"

    return UserStats(
        total_reports=user.total_reports,
        verified_reports=verified_result.scalar() or 0,
        debunked_reports=debunked_result.scalar() or 0,
        reputation_score=user.reputation_score,
        rank=rank,
    )