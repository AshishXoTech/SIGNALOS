# backend/app/services/media_service.py
"""
Media Service — File upload and management
"""
import os
import uuid
import logging
import aiofiles
from typing import Optional, Tuple
from pathlib import Path
from fastapi import UploadFile
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

ALLOWED_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "video/mp4": ".mp4",
    "video/quicktime": ".mov",
    "audio/webm": ".webm",
    "audio/mp4": ".mp4",
    "audio/mpeg": ".mp3",
    "audio/ogg": ".ogg",
    "audio/wav": ".wav",
    "audio/x-wav": ".wav",
    "audio/x-m4a": ".m4a",
}


class MediaService:
    """Handle media file uploads"""

    def __init__(self):
        self.media_dir = Path(settings.MEDIA_DIR)
        self.media_dir.mkdir(parents=True, exist_ok=True)

    async def upload_file(
        self, file: UploadFile
    ) -> Tuple[str, dict]:
        """Upload a file and return its URL and metadata"""

        # Validate content type
        if file.content_type not in ALLOWED_TYPES:
            raise ValueError(
                f"File type {file.content_type} not allowed. "
                f"Allowed: {', '.join(ALLOWED_TYPES.keys())}"
            )

        # Check file size
        content = await file.read()
        if len(content) > settings.MAX_UPLOAD_SIZE:
            raise ValueError(
                f"File too large. Max size: {settings.MAX_UPLOAD_SIZE // 1024 // 1024}MB"
            )

        # Generate unique filename
        ext = ALLOWED_TYPES[file.content_type]
        filename = f"{uuid.uuid4().hex}{ext}"
        if "image" in file.content_type:
            subdir = "images"
        elif "video" in file.content_type:
            subdir = "videos"
        else:
            subdir = "audio"
        save_dir = self.media_dir / subdir
        save_dir.mkdir(parents=True, exist_ok=True)
        filepath = save_dir / filename

        # Save file
        async with aiofiles.open(filepath, "wb") as f:
            await f.write(content)

        url = f"/api/v1/media/{subdir}/{filename}"

        metadata = {
            "filename": filename,
            "original_name": file.filename,
            "content_type": file.content_type,
            "size_bytes": len(content),
            "url": url,
        }

        logger.info(f"📁 File uploaded: {url} ({len(content)} bytes)")
        return url, metadata

    async def delete_file(self, url: str) -> bool:
        """Delete a media file"""
        media_prefix = "/api/v1/media/"
        relative_path = url.split(media_prefix, 1)[-1] if media_prefix in url else url.lstrip("/")
        filepath = self.media_dir / relative_path
        if filepath.exists():
            os.remove(filepath)
            return True
        return False


# Singleton
media_service = MediaService()