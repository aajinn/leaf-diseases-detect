from datetime import datetime
from typing import List, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query

from src.auth.security import get_current_admin_user, get_current_user
from src.database.connection import MongoDB
from src.database.models import UserInDB
from src.database.notification_models import NotificationResponse
from src.database.subscription_models import PlanType, SubscriptionStatus
from src.services.subscription_service import USER_SUBSCRIPTIONS_COLLECTION

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("/", response_model=List[NotificationResponse])
async def get_user_notifications(
    current_user: UserInDB = Depends(get_current_user),
):
    """Get all notifications for current user"""
    try:
        cursor = (
            MongoDB.get_collection("notifications")
            .find({"user_id": str(current_user.id)})
            .sort("created_at", -1)
            .limit(50)
        )

        notifications: List[NotificationResponse] = []
        async for doc in cursor:
            doc["id"] = str(doc["_id"])
            del doc["_id"]
            notifications.append(NotificationResponse(**doc))

        return notifications
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/unread-count")
async def get_unread_count(
    current_user: UserInDB = Depends(get_current_user),
):
    """Get count of unread notifications"""
    try:
        count = await MongoDB.get_collection("notifications").count_documents(
            {
                "user_id": str(current_user.id),
                "read": False,
            }
        )
        return {"count": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: UserInDB = Depends(get_current_user),
):
    """Mark notification as read"""
    try:
        result = await MongoDB.get_collection("notifications").update_one(
            {
                "_id": ObjectId(notification_id),
                "user_id": str(current_user.id),
            },
            {"$set": {"read": True}},
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Notification not found")

        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/mark-all-read")
async def mark_all_read(
    current_user: UserInDB = Depends(get_current_user),
):
    """Mark all notifications as read"""
    try:
        await MongoDB.get_collection("notifications").update_many(
            {"user_id": str(current_user.id)},
            {"$set": {"read": True}},
        )
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def create_notification(
    user_id: str,
    analysis_id: Optional[str],
    title: str,
    message: str,
    notification_type: str = "feedback_update",
):
    """Helper function to create notifications for a single user"""
    try:
        notification_doc = {
            "user_id": user_id,
            "analysis_id": analysis_id,
            "title": title,
            "message": message,
            "type": notification_type,
            "read": False,
            "created_at": datetime.utcnow(),
        }

        await MongoDB.get_collection("notifications").insert_one(notification_doc)
    except Exception as e:
        print(f"Error creating notification: {e}")


# === Admin notification management ===


@router.get("/admin")
async def list_notifications_admin(
    status: Optional[str] = Query(
        default=None,
        description="Filter by status: sent, delivered, pending, failed",
    ),
    type: Optional[str] = Query(
        default=None,
        description="Filter by type: system, marketing, update, alert, feedback_update, analysis_correction",
    ),
    current_admin: UserInDB = Depends(get_current_admin_user),
):
    """
    List notifications for admin view with optional filters.

    Status mapping:
    - sent: all notifications
    - delivered: read == True
    - pending: read == False
    - failed: currently always empty (no failure tracking yet)
    """
    try:
        notifications_collection = MongoDB.get_collection("notifications")
        users_collection = MongoDB.get_collection("users")

        query: dict = {}

        if status == "delivered":
            query["read"] = True
        elif status == "pending":
            query["read"] = False
        elif status == "failed":
            # No failure tracking yet; return empty list
            return {"notifications": [], "total": 0}
        # status == "sent" or None -> no extra filter

        if type:
            query["type"] = type

        cursor = (
            notifications_collection.find(query)
            .sort("created_at", -1)
            .limit(200)
        )

        docs = []
        user_ids = set()
        async for doc in cursor:
            user_ids.add(doc.get("user_id"))
            docs.append(doc)

        users_map = {}
        if user_ids:
            users_cursor = users_collection.find({"_id": {"$in": [ObjectId(uid) for uid in user_ids if uid]}})
            async for user in users_cursor:
                users_map[str(user["_id"])] = {
                    "username": user.get("username"),
                    "email": user.get("email"),
                }

        notifications_out = []
        for doc in docs:
            user_info = users_map.get(doc.get("user_id"), {})
            notifications_out.append(
                {
                    "id": str(doc["_id"]),
                    "user_id": doc.get("user_id"),
                    "username": user_info.get("username"),
                    "email": user_info.get("email"),
                    "analysis_id": doc.get("analysis_id"),
                    "title": doc.get("title"),
                    "message": doc.get("message"),
                    "type": doc.get("type"),
                    "read": bool(doc.get("read", False)),
                    "created_at": doc.get("created_at"),
                }
            )

        return {
            "notifications": notifications_out,
            "total": len(notifications_out),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/admin/stats")
async def notification_stats_admin(
    current_admin: UserInDB = Depends(get_current_admin_user),
):
    """Get high-level notification statistics for admin dashboard."""
    try:
        collection = MongoDB.get_collection("notifications")

        total = await collection.count_documents({})
        delivered = await collection.count_documents({"read": True})
        pending = await collection.count_documents({"read": False})

        # No delivery failure tracking yet
        failed = 0

        return {
            "total": total,
            "delivered": delivered,
            "pending": pending,
            "failed": failed,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/admin/send")
async def send_notification_admin(
    payload: dict,
    current_admin: UserInDB = Depends(get_current_admin_user),
):
    """
    Send notification from admin panel.

    Expected payload:
    {
        "title": str,
        "message": str,
        "type": str,              # system, marketing, update, alert, etc.
        "target": "all" | "user" | "plan",
        "username": Optional[str],   # optional when target == "user"
        "usernames": Optional[List[str]],  # optional list when target == "user"
        "plan_type": Optional[str],  # required when target == "plan" (free/basic/premium/enterprise)
    }
    """
    try:
        title = (payload.get("title") or "").strip()
        message = (payload.get("message") or "").strip()
        notification_type = (payload.get("type") or "system").strip()
        target = (payload.get("target") or "all").strip()
        username = (payload.get("username") or "").strip()
        usernames_raw = payload.get("usernames") or []
        plan_type_raw = (payload.get("plan_type") or "").strip().lower()

        if not title or not message:
            raise HTTPException(status_code=400, detail="Title and message are required")

        users_collection = MongoDB.get_collection("users")
        notifications_collection = MongoDB.get_collection("notifications")

        if target not in {"all", "user", "plan"}:
            raise HTTPException(
                status_code=400,
                detail="Invalid target. Must be 'all', 'user', or 'plan'",
            )

        now = datetime.utcnow()

        if target == "all":
            users_cursor = users_collection.find({"is_active": True})
            user_ids: List[str] = []
            async for user in users_cursor:
                user_ids.append(str(user["_id"]))

            if not user_ids:
                return {
                    "success": False,
                    "message": "No active users found to notify",
                }

            docs = [
                {
                    "user_id": uid,
                    "analysis_id": None,
                    "title": title,
                    "message": message,
                    "type": notification_type,
                    "read": False,
                    "created_at": now,
                }
                for uid in user_ids
            ]

            result = await notifications_collection.insert_many(docs)
            return {
                "success": True,
                "message": f"Notification sent to {len(result.inserted_ids)} users",
                "recipients": len(result.inserted_ids),
                "target": "all",
            }

        if target == "plan":
            if not plan_type_raw:
                raise HTTPException(
                    status_code=400,
                    detail="plan_type is required when target is 'plan'",
                )

            try:
                plan_type_enum = PlanType(plan_type_raw)
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid plan_type. Must be one of: free, basic, premium, enterprise",
                )

            subscriptions_collection = MongoDB.get_collection(USER_SUBSCRIPTIONS_COLLECTION)
            subs_cursor = subscriptions_collection.find(
                {
                    "status": SubscriptionStatus.ACTIVE.value,
                    "plan_type": plan_type_enum.value,
                }
            )

            user_ids: List[str] = []
            async for sub in subs_cursor:
                uid = sub.get("user_id")
                if uid:
                    user_ids.append(uid)

            if not user_ids:
                return {
                    "success": False,
                    "message": f"No active users found for plan '{plan_type_enum.value}'",
                }

            docs = [
                {
                    "user_id": uid,
                    "analysis_id": None,
                    "title": title,
                    "message": message,
                    "type": notification_type,
                    "read": False,
                    "created_at": now,
                }
                for uid in user_ids
            ]

            result = await notifications_collection.insert_many(docs)
            return {
                "success": True,
                "message": f"Notification sent to {len(result.inserted_ids)} users on '{plan_type_enum.value}' plan",
                "recipients": len(result.inserted_ids),
                "target": "plan",
                "plan_type": plan_type_enum.value,
            }

        # target == "user"
        # Support both single username and multiple usernames
        usernames: List[str] = []
        if isinstance(usernames_raw, list):
            usernames.extend([str(u).strip() for u in usernames_raw if str(u).strip()])
        if username:
            usernames.append(username)

        # Deduplicate and validate
        usernames = sorted(set(usernames))

        if not usernames:
            raise HTTPException(
                status_code=400,
                detail="At least one username is required when target is 'user'",
            )

        users_cursor = users_collection.find({"username": {"$in": usernames}})
        users_docs = await users_cursor.to_list(length=len(usernames))

        if not users_docs:
            raise HTTPException(status_code=404, detail="No matching users found")

        docs = [
            {
                "user_id": str(u["_id"]),
                "analysis_id": None,
                "title": title,
                "message": message,
                "type": notification_type,
                "read": False,
                "created_at": now,
            }
            for u in users_docs
        ]

        result = await notifications_collection.insert_many(docs)
        found_usernames = [u.get("username") for u in users_docs]

        return {
            "success": True,
            "message": f"Notification sent to {len(result.inserted_ids)} user(s)",
            "recipients": len(result.inserted_ids),
            "usernames": found_usernames,
            "target": "user",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))