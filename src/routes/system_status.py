"""
System Status Routes
===================

Public endpoints for reading system-wide availability flags.
"""

from fastapi import APIRouter

from src.utils.system_settings import get_system_settings

router = APIRouter(prefix="/system", tags=["System Status"])


@router.get("/status")
async def get_system_status():
    settings = await get_system_settings()
    return {
        "allow_logins": settings.get("allow_logins", True),
        "allow_registrations": settings.get("allow_registrations", True),
        "allow_analysis": settings.get("allow_analysis", True),
        "maintenance_mode": settings.get("maintenance_mode", False),
        "message": settings.get("message", "")
    }
