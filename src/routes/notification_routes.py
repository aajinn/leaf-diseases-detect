from datetime import datetime
from typing import List

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from src.auth.security import get_current_user
from src.database.connection import MongoDB
from src.database.models import UserInDB
from src.database.notification_models import NotificationResponse

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("/", response_model=List[NotificationResponse])
async def get_user_notifications(
    current_user: UserInDB = Depends(get_current_user)
):
    """Get all notifications for current user"""
    try:
        cursor = MongoDB.get_collection("notifications").find({
            "user_id": str(current_user.id)
        }).sort("created_at", -1).limit(50)
        
        notifications = []
        async for doc in cursor:
            doc["id"] = str(doc["_id"])
            del doc["_id"]
            notifications.append(NotificationResponse(**doc))
        
        return notifications
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/unread-count")
async def get_unread_count(
    current_user: UserInDB = Depends(get_current_user)
):
    """Get count of unread notifications"""
    try:
        count = await MongoDB.get_collection("notifications").count_documents({
            "user_id": str(current_user.id),
            "read": False
        })
        return {"count": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """Mark notification as read"""
    try:
        result = await MongoDB.get_collection("notifications").update_one(
            {
                "_id": ObjectId(notification_id),
                "user_id": str(current_user.id)
            },
            {"$set": {"read": True}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/mark-all-read")
async def mark_all_read(
    current_user: UserInDB = Depends(get_current_user)
):
    """Mark all notifications as read"""
    try:
        await MongoDB.get_collection("notifications").update_many(
            {"user_id": str(current_user.id)},
            {"$set": {"read": True}}
        )
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def create_notification(user_id: str, analysis_id: str, title: str, message: str, notification_type: str = "feedback_update"):
    """Helper function to create notifications"""
    try:
        notification_doc = {
            "user_id": user_id,
            "analysis_id": analysis_id,
            "title": title,
            "message": message,
            "type": notification_type,
            "read": False,
            "created_at": datetime.utcnow()
        }
        
        await MongoDB.get_collection("notifications").insert_one(notification_doc)
    except Exception as e:
        print(f"Error creating notification: {e}")