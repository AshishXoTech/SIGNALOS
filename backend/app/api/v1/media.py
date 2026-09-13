# backend/app/api/v1/media.py
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from typing import List
from pathlib import Path

from app.services.media_service import media_service
from app.config import get_settings

settings = get_settings()
router = APIRouter()


@router.post("/upload")
async def upload_media(
    files: List[UploadFile] = File(..., description="Upload images/videos"),
):
    """Upload one or more media files"""
    results = []

    for file in files:
        try:
            url, metadata = await media_service.upload_file(file)
            results.append(metadata)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    return {
        "uploaded": len(results),
        "files": results,
    }


@router.get("/{subdir}/{filename}")
async def serve_media(subdir: str, filename: str):
    """Serve uploaded media files"""
    filepath = Path(settings.MEDIA_DIR) / subdir / filename

    if not filepath.exists():
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(filepath)