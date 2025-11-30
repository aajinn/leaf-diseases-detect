"""
Admin Routes for System Management
==================================
"""

import os
from datetime import datetime, timedelta
from typing import List, Optional

from dotenv import load_dotenv, set_key
from fastapi import APIRouter, Depends, HTTPException, status

from src.auth.security import get_current_admin_user
from src.database.admin_models import APIConfig, APIUsageRecord, UsageStats, UserStats
from src.database.connection import ANALYSIS_COLLECTION, USERS_COLLECTION, MongoDB
from src.database.models import UserInDB

load_dotenv()

router = APIRouter(prefix="/admin", tags=["Admin"])

# Collection names
API_USAGE_COLLECTION = "api_usage"
API_CONFIG_COLLECTION = "api_config"


@router.get("/stats/overview")
async def get_overview_stats(current_admin: UserInDB = Depends(get_current_admin_user)):
    """Get overview statistics for admin dashboard"""
    try:
        users_collection = MongoDB.get_collection(USERS_COLLECTION)
        analysis_collection = MongoDB.get_collection(ANALYSIS_COLLECTION)
        usage_collection = MongoDB.get_collection(API_USAGE_COLLECTION)

        # User stats
        total_users = await users_collection.count_documents({})
        active_users = await users_collection.count_documents({"is_active": True})
        admin_users = await users_collection.count_documents({"is_admin": True})

        # Analysis stats
        total_analyses = await analysis_collection.count_documents({})
        diseases_detected = await analysis_collection.count_documents(
            {"disease_detected": True}
        )
        healthy_plants = await analysis_collection.count_documents(
            {"disease_detected": False}
        )

        # API usage stats
        total_api_calls = await usage_collection.count_documents({})
        successful_calls = await usage_collection.count_documents({"success": True})
        failed_calls = await usage_collection.count_documents({"success": False})

        # Calculate total cost
        usage_records = await usage_collection.find({}).to_list(length=None)
        total_cost = sum(record.get("estimated_cost", 0.0) for record in usage_records)
        groq_cost = sum(
            record.get("estimated_cost", 0.0)
            for record in usage_records
            if record.get("api_type") == "groq"
        )
        perplexity_cost = sum(
            record.get("estimated_cost", 0.0)
            for record in usage_records
            if record.get("api_type") == "perplexity"
        )

        # Recent activity (last 7 days)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        recent_analyses = await analysis_collection.count_documents(
            {"analysis_timestamp": {"$gte": seven_days_ago}}
        )

        return {
            "users": {
                "total": total_users,
                "active": active_users,
                "admins": admin_users,
            },
            "analyses": {
                "total": total_analyses,
                "diseases_detected": diseases_detected,
                "healthy_plants": healthy_plants,
                "recent_7_days": recent_analyses,
            },
            "api_usage": {
                "total_calls": total_api_calls,
                "successful": successful_calls,
                "failed": failed_calls,
                "total_cost": round(total_cost, 4),
                "groq_cost": round(groq_cost, 4),
                "perplexity_cost": round(perplexity_cost, 4),
            },
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch overview stats: {str(e)}",
        )


@router.get("/users")
async def get_all_users(
    skip: int = 0,
    limit: int = 50,
    current_admin: UserInDB = Depends(get_current_admin_user),
):
    """Get all users with their statistics"""
    try:
        users_collection = MongoDB.get_collection(USERS_COLLECTION)
        analysis_collection = MongoDB.get_collection(ANALYSIS_COLLECTION)
        usage_collection = MongoDB.get_collection(API_USAGE_COLLECTION)

        users = (
            await users_collection.find({})
            .skip(skip)
            .limit(limit)
            .to_list(length=limit)
        )

        user_stats = []
        for user in users:
            user_id = str(user["_id"])

            # Get analysis stats
            total_analyses = await analysis_collection.count_documents(
                {"user_id": user_id}
            )
            diseases = await analysis_collection.count_documents(
                {"user_id": user_id, "disease_detected": True}
            )
            healthy = await analysis_collection.count_documents(
                {"user_id": user_id, "disease_detected": False}
            )

            # Get last activity
            last_analysis = await analysis_collection.find_one(
                {"user_id": user_id}, sort=[("analysis_timestamp", -1)]
            )

            # Get API cost
            user_usage = await usage_collection.find({"user_id": user_id}).to_list(
                length=None
            )
            total_cost = sum(record.get("estimated_cost", 0.0) for record in user_usage)

            user_stats.append(
                {
                    "user_id": user_id,
                    "username": user["username"],
                    "email": user["email"],
                    "full_name": user.get("full_name"),
                    "is_active": user["is_active"],
                    "is_admin": user["is_admin"],
                    "created_at": user["created_at"],
                    "total_analyses": total_analyses,
                    "diseases_detected": diseases,
                    "healthy_plants": healthy,
                    "total_api_cost": round(total_cost, 4),
                    "last_activity": (
                        last_analysis["analysis_timestamp"] if last_analysis else None
                    ),
                }
            )

        return {
            "total": await users_collection.count_documents({}),
            "users": user_stats,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch users: {str(e)}",
        )


@router.get("/api-usage")
async def get_api_usage(
    days: int = 7,
    api_type: Optional[str] = None,
    current_admin: UserInDB = Depends(get_current_admin_user),
):
    """Get API usage records"""
    try:
        usage_collection = MongoDB.get_collection(API_USAGE_COLLECTION)

        # Build query
        query = {}
        if days > 0:
            start_date = datetime.utcnow() - timedelta(days=days)
            query["timestamp"] = {"$gte": start_date}

        if api_type:
            query["api_type"] = api_type

        # Get records
        records = (
            await usage_collection.find(query)
            .sort("timestamp", -1)
            .limit(100)
            .to_list(length=100)
        )

        # Calculate stats
        total_cost = sum(record.get("estimated_cost", 0.0) for record in records)
        total_tokens = sum(record.get("tokens_used", 0) for record in records)
        successful = sum(1 for record in records if record.get("success", False))
        failed = len(records) - successful

        return {
            "records": [
                {
                    "id": str(record["_id"]),
                    "username": record["username"],
                    "api_type": record["api_type"],
                    "endpoint": record["endpoint"],
                    "model_used": record.get("model_used"),
                    "tokens_used": record.get("tokens_used", 0),
                    "estimated_cost": record.get("estimated_cost", 0.0),
                    "timestamp": record["timestamp"],
                    "success": record.get("success", True),
                }
                for record in records
            ],
            "stats": {
                "total_requests": len(records),
                "successful": successful,
                "failed": failed,
                "total_tokens": total_tokens,
                "total_cost": round(total_cost, 4),
            },
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch API usage: {str(e)}",
        )


@router.get("/api-config")
async def get_api_config(current_admin: UserInDB = Depends(get_current_admin_user)):
    """Get current API configuration"""
    try:
        return {
            "groq": {
                "api_key": (
                    os.getenv("GROQ_API_KEY", "")[:20] + "..."
                    if os.getenv("GROQ_API_KEY")
                    else "Not set"
                ),
                "model": os.getenv(
                    "MODEL_NAME", "meta-llama/llama-4-scout-17b-16e-instruct"
                ),
                "is_active": bool(os.getenv("GROQ_API_KEY")),
            },
            "perplexity": {
                "api_key": (
                    os.getenv("PERPLEXITY_API_KEY", "")[:20] + "..."
                    if os.getenv("PERPLEXITY_API_KEY")
                    else "Not set"
                ),
                "model": "sonar",
                "is_active": bool(os.getenv("PERPLEXITY_API_KEY")),
            },
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch API config: {str(e)}",
        )


@router.put("/api-config")
async def update_api_config(
    api_type: str,
    api_key: str,
    current_admin: UserInDB = Depends(get_current_admin_user),
):
    """Update API configuration"""
    try:
        if api_type not in ["groq", "perplexity"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid API type. Must be 'groq' or 'perplexity'",
            )

        # Update .env file
        env_key = "GROQ_API_KEY" if api_type == "groq" else "PERPLEXITY_API_KEY"
        env_file = ".env"

        set_key(env_file, env_key, api_key)

        # Update environment variable
        os.environ[env_key] = api_key

        return {
            "message": f"{api_type.capitalize()} API key updated successfully",
            "api_type": api_type,
            "updated_at": datetime.utcnow(),
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update API config: {str(e)}",
        )


@router.patch("/users/{username}/toggle-active")
async def toggle_user_active(
    username: str, current_admin: UserInDB = Depends(get_current_admin_user)
):
    """Toggle user active status"""
    try:
        users_collection = MongoDB.get_collection(USERS_COLLECTION)

        user = await users_collection.find_one({"username": username})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        new_status = not user["is_active"]
        await users_collection.update_one(
            {"username": username}, {"$set": {"is_active": new_status}}
        )

        return {
            "message": f"User {username} {'activated' if new_status else 'deactivated'}",
            "username": username,
            "is_active": new_status,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to toggle user status: {str(e)}",
        )


@router.get("/usage-chart")
async def get_usage_chart_data(
    days: int = 30, current_admin: UserInDB = Depends(get_current_admin_user)
):
    """Get usage data for charts"""
    try:
        usage_collection = MongoDB.get_collection(API_USAGE_COLLECTION)
        analysis_collection = MongoDB.get_collection(ANALYSIS_COLLECTION)

        start_date = datetime.utcnow() - timedelta(days=days)

        # Get daily usage
        daily_data = []
        for i in range(days):
            day_start = start_date + timedelta(days=i)
            day_end = day_start + timedelta(days=1)

            api_calls = await usage_collection.count_documents(
                {"timestamp": {"$gte": day_start, "$lt": day_end}}
            )

            analyses = await analysis_collection.count_documents(
                {"analysis_timestamp": {"$gte": day_start, "$lt": day_end}}
            )

            usage_records = await usage_collection.find(
                {"timestamp": {"$gte": day_start, "$lt": day_end}}
            ).to_list(length=None)

            daily_cost = sum(
                record.get("estimated_cost", 0.0) for record in usage_records
            )

            daily_data.append(
                {
                    "date": day_start.strftime("%Y-%m-%d"),
                    "api_calls": api_calls,
                    "analyses": analyses,
                    "cost": round(daily_cost, 4),
                }
            )

        return {"daily_data": daily_data}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch chart data: {str(e)}",
        )
