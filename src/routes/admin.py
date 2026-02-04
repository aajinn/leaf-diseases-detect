"""
Admin Routes for System Management
==================================
"""

import hashlib
import json
import logging
import os
from datetime import datetime, timedelta
from functools import lru_cache
from typing import Dict, List, Optional

from dotenv import load_dotenv, set_key
from fastapi import APIRouter, Depends, HTTPException, status

from src.auth.security import get_current_admin_user
from src.database.admin_models import APIConfig, APIUsageRecord, UsageStats, UserStats
from src.database.connection import ANALYSIS_COLLECTION, USERS_COLLECTION, MongoDB
from src.database.models import UserInDB
from src.services.analytics_service import AnalyticsService

load_dotenv()

router = APIRouter(prefix="/admin", tags=["Admin"])
logger = logging.getLogger(__name__)

# Simple in-memory cache with TTL
_cache: Dict[str, tuple[datetime, any]] = {}
CACHE_TTL_SECONDS = 60  # Cache for 1 minute
SYSTEM_SETTINGS_COLLECTION = "system_settings"
SYSTEM_SETTINGS_ID = "global"


def get_cached_or_compute(cache_key: str, compute_func, ttl_seconds: int = CACHE_TTL_SECONDS):
    """Get cached result or compute new one"""
    now = datetime.utcnow()

    if cache_key in _cache:
        cached_time, cached_value = _cache[cache_key]
        if (now - cached_time).total_seconds() < ttl_seconds:
            return cached_value

    # Compute new value
    result = compute_func()
    _cache[cache_key] = (now, result)

    # Clean old cache entries (simple cleanup)
    if len(_cache) > 100:
        cutoff = now - timedelta(seconds=ttl_seconds * 2)
        _cache.clear()  # Simple approach: clear all if too many

    return result


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
        
        # Import subscription collections
        from src.services.subscription_service import (
            USER_SUBSCRIPTIONS_COLLECTION,
            PAYMENT_RECORDS_COLLECTION,
            USAGE_QUOTAS_COLLECTION
        )
        subscriptions_collection = MongoDB.get_collection(USER_SUBSCRIPTIONS_COLLECTION)
        payments_collection = MongoDB.get_collection(PAYMENT_RECORDS_COLLECTION)

        # User stats
        total_users = await users_collection.count_documents({})
        active_users = await users_collection.count_documents({"is_active": True})
        admin_users = await users_collection.count_documents({"is_admin": True})

        # Analysis stats
        total_analyses = await analysis_collection.count_documents({})
        diseases_detected = await analysis_collection.count_documents({"disease_detected": True})
        healthy_plants = await analysis_collection.count_documents({"disease_detected": False})

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
        
        # Subscription stats
        total_subscriptions = await subscriptions_collection.count_documents({})
        active_subscriptions = await subscriptions_collection.count_documents({"status": "active"})
        
        # Revenue stats
        total_revenue = 0
        monthly_revenue = 0
        try:
            revenue_pipeline = [
                {"$match": {"status": "completed"}},
                {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
            ]
            revenue_result = await payments_collection.aggregate(revenue_pipeline).to_list(1)
            total_revenue = revenue_result[0]["total"] if revenue_result else 0
            
            # Monthly revenue (current month)
            current_month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            monthly_pipeline = [
                {"$match": {"status": "completed", "payment_date": {"$gte": current_month_start}}},
                {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
            ]
            monthly_result = await payments_collection.aggregate(monthly_pipeline).to_list(1)
            monthly_revenue = monthly_result[0]["total"] if monthly_result else 0
        except Exception as e:
            logger.warning(f"Failed to calculate revenue: {str(e)}")
        
        # Plan distribution
        plan_distribution = []
        try:
            plan_pipeline = [
                {"$match": {"status": "active"}},
                {"$group": {"_id": "$plan_type", "count": {"$sum": 1}}}
            ]
            plan_cursor = subscriptions_collection.aggregate(plan_pipeline)
            async for item in plan_cursor:
                plan_distribution.append({
                    "plan_type": item["_id"],
                    "count": item["count"]
                })
        except Exception as e:
            logger.warning(f"Failed to get plan distribution: {str(e)}")

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
            "subscriptions": {
                "total": total_subscriptions,
                "active": active_subscriptions,
                "total_revenue": round(total_revenue, 2),
                "monthly_revenue": round(monthly_revenue, 2),
                "plan_distribution": plan_distribution
            }
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

        users = await users_collection.find({}).skip(skip).limit(limit).to_list(length=limit)

        user_stats = []
        for user in users:
            user_id = str(user["_id"])

            # Get analysis stats
            total_analyses = await analysis_collection.count_documents({"user_id": user_id})
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
            user_usage = await usage_collection.find({"user_id": user_id}).to_list(length=None)
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
    page: int = 1,
    page_size: int = 20,
    current_admin: UserInDB = Depends(get_current_admin_user),
):
    """Get API usage records with pagination"""
    try:
        usage_collection = MongoDB.get_collection(API_USAGE_COLLECTION)

        # Build query
        query = {}
        if days > 0:
            start_date = datetime.utcnow() - timedelta(days=days)
            query["timestamp"] = {"$gte": start_date}

        if api_type:
            query["api_type"] = api_type

        # Get total count for pagination
        total_count = await usage_collection.count_documents(query)

        # Calculate pagination
        skip = (page - 1) * page_size
        total_pages = (total_count + page_size - 1) // page_size  # Ceiling division

        # Get paginated records
        records = (
            await usage_collection.find(query)
            .sort("timestamp", -1)
            .skip(skip)
            .limit(page_size)
            .to_list(length=page_size)
        )

        # Calculate stats for ALL records (not just current page)
        all_records = await usage_collection.find(query).to_list(length=None)
        total_cost = sum(record.get("estimated_cost", 0.0) for record in all_records)
        total_tokens = sum(record.get("tokens_used", 0) for record in all_records)
        successful = sum(1 for record in all_records if record.get("success", False))
        failed = len(all_records) - successful

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
                "total_requests": total_count,
                "successful": successful,
                "failed": failed,
                "total_tokens": total_tokens,
                "total_cost": round(total_cost, 4),
            },
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total_pages": total_pages,
                "total_records": total_count,
                "has_next": page < total_pages,
                "has_prev": page > 1,
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
                "model": os.getenv("MODEL_NAME", "meta-llama/llama-4-scout-17b-16e-instruct"),
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
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

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

            daily_cost = sum(record.get("estimated_cost", 0.0) for record in usage_records)

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


@router.get("/analytics/trends")
async def get_analytics_trends(
    days: int = 30, current_admin: UserInDB = Depends(get_current_admin_user)
):
    """
    Get comprehensive analytics trends (CACHED for 1 minute)

    Returns detailed trend data including:
    - Daily API calls, analyses, costs
    - Growth rates and averages
    - API breakdown (Groq vs Perplexity)

    Performance: Uses MongoDB aggregation pipelines and in-memory caching
    """
    try:
        cache_key = f"analytics_trends_{days}"

        # Check cache first
        now = datetime.utcnow()
        if cache_key in _cache:
            cached_time, cached_value = _cache[cache_key]
            if (now - cached_time).total_seconds() < CACHE_TTL_SECONDS:
                return cached_value

        # Compute new value
        trends = await AnalyticsService.get_trends(days)
        _cache[cache_key] = (now, trends)

        return trends
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch analytics trends: {str(e)}",
        )


@router.get("/analytics/user-activity")
async def get_user_activity_trends(
    days: int = 30, current_admin: UserInDB = Depends(get_current_admin_user)
):
    """Get user activity trends over time (CACHED for 1 minute)"""
    try:
        cache_key = f"user_activity_{days}"

        # Check cache
        now = datetime.utcnow()
        if cache_key in _cache:
            cached_time, cached_value = _cache[cache_key]
            if (now - cached_time).total_seconds() < CACHE_TTL_SECONDS:
                return cached_value

        # Compute new value
        activity = await AnalyticsService.get_user_activity_trends(days)
        _cache[cache_key] = (now, activity)

        return activity
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch user activity trends: {str(e)}",
        )


@router.get("/analytics/cost-breakdown")
async def get_cost_breakdown(
    days: int = 30, current_admin: UserInDB = Depends(get_current_admin_user)
):
    """Get detailed cost breakdown by API and model (CACHED for 1 minute)"""
    try:
        cache_key = f"cost_breakdown_{days}"

        # Check cache
        now = datetime.utcnow()
        if cache_key in _cache:
            cached_time, cached_value = _cache[cache_key]
            if (now - cached_time).total_seconds() < CACHE_TTL_SECONDS:
                return cached_value

        # Compute new value
        breakdown = await AnalyticsService.get_cost_breakdown(days)
        _cache[cache_key] = (now, breakdown)

        return breakdown
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch cost breakdown: {str(e)}",
        )


@router.get("/subscription-stats")
async def get_subscription_stats(current_admin: UserInDB = Depends(get_current_admin_user)):
    """Get detailed subscription statistics"""
    try:
        from src.services.subscription_service import (
            USER_SUBSCRIPTIONS_COLLECTION,
            PAYMENT_RECORDS_COLLECTION,
            USAGE_QUOTAS_COLLECTION
        )
        
        subscriptions_collection = MongoDB.get_collection(USER_SUBSCRIPTIONS_COLLECTION)
        payments_collection = MongoDB.get_collection(PAYMENT_RECORDS_COLLECTION)
        quotas_collection = MongoDB.get_collection(USAGE_QUOTAS_COLLECTION)
        
        # Subscription counts by status
        status_pipeline = [
            {"$group": {"_id": "$status", "count": {"$sum": 1}}}
        ]
        status_cursor = subscriptions_collection.aggregate(status_pipeline)
        status_counts = {}
        async for item in status_cursor:
            status_counts[item["_id"]] = item["count"]
        
        # Plan distribution with revenue
        plan_pipeline = [
            {"$match": {"status": "active"}},
            {"$group": {
                "_id": "$plan_type",
                "count": {"$sum": 1},
                "total_revenue": {"$sum": "$amount_paid"}
            }}
        ]
        plan_cursor = subscriptions_collection.aggregate(plan_pipeline)
        plan_stats = []
        async for item in plan_cursor:
            plan_stats.append({
                "plan_type": item["_id"],
                "active_subscriptions": item["count"],
                "total_revenue": round(item["total_revenue"], 2)
            })
        
        # Monthly revenue trend (last 6 months)
        monthly_revenue = []
        for i in range(6):
            month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            if i > 0:
                if month_start.month > i:
                    month_start = month_start.replace(month=month_start.month - i)
                else:
                    year = month_start.year - 1
                    month = 12 - (i - month_start.month)
                    month_start = month_start.replace(year=year, month=month)
            
            month_end = (month_start.replace(month=month_start.month + 1) 
                        if month_start.month < 12 
                        else month_start.replace(year=month_start.year + 1, month=1))
            
            revenue_pipeline = [
                {
                    "$match": {
                        "status": "completed",
                        "payment_date": {"$gte": month_start, "$lt": month_end}
                    }
                },
                {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
            ]
            
            revenue_result = await payments_collection.aggregate(revenue_pipeline).to_list(1)
            revenue = revenue_result[0]["total"] if revenue_result else 0
            
            monthly_revenue.append({
                "month": month_start.strftime("%Y-%m"),
                "revenue": round(revenue, 2)
            })

        # Current month revenue (for overview)
        current_month_revenue = monthly_revenue[-1]["revenue"] if monthly_revenue else 0
        
        # Usage statistics
        current_month = datetime.utcnow()
        usage_pipeline = [
            {
                "$match": {
                    "month": current_month.month,
                    "year": current_month.year
                }
            },
            {
                "$group": {
                    "_id": None,
                    "total_analyses_used": {"$sum": "$analyses_used"},
                    "total_analyses_limit": {"$sum": "$analyses_limit"},
                    "active_users": {"$sum": 1}
                }
            }
        ]
        
        usage_result = await quotas_collection.aggregate(usage_pipeline).to_list(1)
        usage_stats = usage_result[0] if usage_result else {
            "total_analyses_used": 0,
            "total_analyses_limit": 0,
            "active_users": 0
        }
        
        # Recent subscriptions (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_subscriptions = await subscriptions_collection.count_documents({
            "created_at": {"$gte": thirty_days_ago}
        })
        
        # Churn rate (cancelled in last 30 days)
        cancelled_subscriptions = await subscriptions_collection.count_documents({
            "status": "cancelled",
            "cancelled_at": {"$gte": thirty_days_ago}
        })
        
        total_active = status_counts.get("active", 0)
        churn_rate = (cancelled_subscriptions / max(total_active, 1)) * 100
        
        return {
            "overview": {
                "total_subscriptions": sum(status_counts.values()),
                "active_subscriptions": status_counts.get("active", 0),
                "cancelled_subscriptions": status_counts.get("cancelled", 0),
                "expired_subscriptions": status_counts.get("expired", 0),
                "recent_subscriptions_30d": recent_subscriptions,
                "churn_rate_30d": round(churn_rate, 2),
                "monthly_revenue": round(current_month_revenue, 2)
            },
            "plan_distribution": plan_stats,
            "monthly_revenue_trend": list(reversed(monthly_revenue)),
            "usage_stats": {
                "total_analyses_used_this_month": usage_stats.get("total_analyses_used", 0),
                "total_analyses_limit": usage_stats.get("total_analyses_limit", 0),
                "active_users_this_month": usage_stats.get("active_users", 0),
                "usage_percentage": round(
                    (usage_stats.get("total_analyses_used", 0) / 
                     max(usage_stats.get("total_analyses_limit", 1), 1)) * 100, 2
                )
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to get subscription stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch subscription statistics: {str(e)}",
        )


@router.get("/enterprise-api-keys")
async def list_enterprise_api_keys(current_admin: UserInDB = Depends(get_current_admin_user)):
    """List all enterprise API keys with usage details"""
    try:
        api_keys_collection = MongoDB.get_collection("enterprise_api_keys")
        cursor = api_keys_collection.find({}).sort("created_at", -1)
        
        keys = []
        async for key_doc in cursor:
            keys.append({
                "key_id": key_doc["_id"],
                "user_id": key_doc.get("user_id"),
                "username": key_doc.get("username"),
                "name": key_doc.get("name"),
                "description": key_doc.get("description"),
                "created_at": key_doc.get("created_at"),
                "expires_at": key_doc.get("expires_at"),
                "is_active": key_doc.get("is_active", False),
                "last_used": key_doc.get("last_used"),
                "usage_count": key_doc.get("usage_count", 0)
            })
        
        return {"keys": keys}
        
    except Exception as e:
        logger.error(f"Failed to list enterprise API keys: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list enterprise API keys"
        )


@router.post("/enterprise-api-keys/{key_id}/toggle")
async def toggle_enterprise_api_key(
    key_id: str,
    current_admin: UserInDB = Depends(get_current_admin_user)
):
    """Enable/disable an enterprise API key"""
    try:
        api_keys_collection = MongoDB.get_collection("enterprise_api_keys")
        key_doc = await api_keys_collection.find_one({"_id": key_id})
        if not key_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="API key not found"
            )
        
        new_status = not key_doc.get("is_active", False)
        await api_keys_collection.update_one(
            {"_id": key_id},
            {"$set": {"is_active": new_status}}
        )
        
        return {"key_id": key_id, "is_active": new_status}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to toggle enterprise API key: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to toggle enterprise API key"
        )


@router.post("/enterprise-api-keys/{key_id}/reset-usage")
async def reset_enterprise_api_usage(
    key_id: str,
    current_admin: UserInDB = Depends(get_current_admin_user)
):
    """Reset usage counters for an enterprise API key"""
    try:
        api_keys_collection = MongoDB.get_collection("enterprise_api_keys")
        result = await api_keys_collection.update_one(
            {"_id": key_id},
            {"$set": {"usage_count": 0, "last_used": None}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="API key not found"
            )
        
        return {"message": "Usage reset successfully", "key_id": key_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to reset enterprise API usage: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reset enterprise API usage"
        )


@router.get("/system-settings")
async def get_system_settings_admin(current_admin: UserInDB = Depends(get_current_admin_user)):
    """Get global system settings"""
    try:
        settings_collection = MongoDB.get_collection(SYSTEM_SETTINGS_COLLECTION)
        settings = await settings_collection.find_one({"_id": SYSTEM_SETTINGS_ID})
        if not settings:
            settings = {
                "_id": SYSTEM_SETTINGS_ID,
                "allow_logins": True,
                "allow_registrations": True,
                "allow_analysis": True,
                "maintenance_mode": False,
                "message": ""
            }
            await settings_collection.update_one(
                {"_id": SYSTEM_SETTINGS_ID},
                {"$setOnInsert": settings},
                upsert=True
            )
        return settings
    except Exception as e:
        logger.error(f"Failed to get system settings: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load system settings"
        )


@router.put("/system-settings")
async def update_system_settings_admin(
    payload: dict,
    current_admin: UserInDB = Depends(get_current_admin_user)
):
    """Update global system settings"""
    try:
        settings_collection = MongoDB.get_collection(SYSTEM_SETTINGS_COLLECTION)
        update_doc = {
            "allow_logins": bool(payload.get("allow_logins", True)),
            "allow_registrations": bool(payload.get("allow_registrations", True)),
            "allow_analysis": bool(payload.get("allow_analysis", True)),
            "maintenance_mode": bool(payload.get("maintenance_mode", False)),
            "message": payload.get("message", "")
        }
        await settings_collection.update_one(
            {"_id": SYSTEM_SETTINGS_ID},
            {"$set": update_doc},
            upsert=True
        )
        return {"message": "System settings updated", **update_doc}
    except Exception as e:
        logger.error(f"Failed to update system settings: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update system settings"
        )


@router.get("/analytics/prescriptions")
async def get_prescription_analytics(
    days: int = 30, current_admin: UserInDB = Depends(get_current_admin_user)
):
    """
    Get prescription analytics and statistics

    Args:
        days: Number of days to analyze (default: 30)
        current_admin: Authenticated admin user

    Returns:
        Prescription statistics including:
        - Total prescriptions generated
        - Breakdown by priority (urgent, high, moderate, low)
        - Breakdown by disease type
        - Status distribution (active, completed, expired)
        - Daily generation trend
        - Top users by prescription count
    """
    try:
        stats = await AnalyticsService.get_prescription_stats(days)

        return {"success": True, "period_days": days, "stats": stats}

    except Exception as e:
        logger.error(f"Failed to get prescription analytics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch prescription analytics: {str(e)}",
        )
