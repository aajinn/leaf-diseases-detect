"""
System Settings Utilities
=========================

Centralized helpers for global system controls (logins, registrations, analysis).
"""

from typing import Any, Dict

from fastapi import HTTPException, status

from src.database.connection import MongoDB


SETTINGS_COLLECTION = "system_settings"
SETTINGS_DOC_ID = "global"


def _default_settings() -> Dict[str, Any]:
    return {
        "_id": SETTINGS_DOC_ID,
        "allow_logins": True,
        "allow_registrations": True,
        "allow_analysis": True,
        "maintenance_mode": False,
        "message": ""
    }


async def get_system_settings() -> Dict[str, Any]:
    collection = MongoDB.get_collection(SETTINGS_COLLECTION)
    settings = await collection.find_one({"_id": SETTINGS_DOC_ID})
    if not settings:
        settings = _default_settings()
        await collection.update_one(
            {"_id": SETTINGS_DOC_ID},
            {"$setOnInsert": settings},
            upsert=True
        )
    return settings


async def ensure_auth_allowed() -> None:
    settings = await get_system_settings()
    if settings.get("maintenance_mode"):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=settings.get("message") or "System is under maintenance. Please try again later."
        )
    if not settings.get("allow_logins", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=settings.get("message") or "Logins are temporarily disabled."
        )


async def ensure_auth_allowed_for_user(is_admin: bool) -> None:
    settings = await get_system_settings()
    if settings.get("maintenance_mode") and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=settings.get("message") or "System is under maintenance. Please try again later."
        )
    if not settings.get("allow_logins", True) and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=settings.get("message") or "Logins are temporarily disabled."
        )


async def ensure_registration_allowed() -> None:
    settings = await get_system_settings()
    if settings.get("maintenance_mode"):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=settings.get("message") or "System is under maintenance. Please try again later."
        )
    if not settings.get("allow_registrations", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=settings.get("message") or "New registrations are temporarily disabled."
        )


async def ensure_analysis_allowed() -> None:
    settings = await get_system_settings()
    if settings.get("maintenance_mode"):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=settings.get("message") or "System is under maintenance. Please try again later."
        )
    if not settings.get("allow_analysis", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=settings.get("message") or "Analysis is temporarily disabled."
        )
