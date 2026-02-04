"""
Enterprise API Routes
====================

Dedicated API endpoints for Enterprise users with advanced features,
higher rate limits, and specialized functionality.
"""

import logging
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from src.auth.security import get_current_active_user
from src.database.connection import ANALYSIS_COLLECTION, MongoDB
from src.database.models import AnalysisRecord, UserInDB
from src.services.subscription_service import SubscriptionService
from src.utils.system_settings import ensure_analysis_allowed

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/enterprise", tags=["Enterprise API"])


class EnterpriseUser:
    """Dependency to verify enterprise user access"""
    
    @staticmethod
    async def verify_enterprise_access(current_user: UserInDB = Depends(get_current_active_user)) -> UserInDB:
        """Verify user has enterprise subscription"""
        try:
            subscription = await SubscriptionService.get_user_subscription(str(current_user.id))
            
            if not subscription:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Enterprise subscription required"
                )
            
            plan = await SubscriptionService.get_plan_by_id(subscription.plan_id)
            if not plan or plan.plan_type.value != "enterprise":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Enterprise subscription required"
                )
            
            return current_user
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error verifying enterprise access: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to verify enterprise access"
            )


# Request/Response Models
class BulkAnalysisRequest(BaseModel):
    """Request model for bulk analysis"""
    batch_name: Optional[str] = None
    metadata: Optional[dict] = None


class BulkAnalysisResponse(BaseModel):
    """Response model for bulk analysis"""
    batch_id: str
    batch_name: Optional[str]
    total_images: int
    processed_images: int
    failed_images: int
    results: List[dict]
    processing_time_seconds: float
    metadata: Optional[dict]


class AnalyticsRequest(BaseModel):
    """Request model for analytics"""
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    disease_types: Optional[List[str]] = None
    severity_levels: Optional[List[str]] = None


class AnalyticsResponse(BaseModel):
    """Response model for analytics"""
    total_analyses: int
    disease_distribution: dict
    severity_distribution: dict
    confidence_stats: dict
    temporal_trends: List[dict]
    success_rate: float


class APIKeyRequest(BaseModel):
    """Request model for API key generation"""
    name: str
    description: Optional[str] = None
    expires_in_days: Optional[int] = 365


class APIKeyResponse(BaseModel):
    """Response model for API key"""
    key_id: str
    api_key: str
    name: str
    description: Optional[str]
    created_at: datetime
    expires_at: datetime
    is_active: bool


# Enterprise API Endpoints

@router.get("/status")
async def enterprise_status(
    enterprise_user: UserInDB = Depends(EnterpriseUser.verify_enterprise_access)
):
    """Get enterprise account status and limits"""
    try:
        subscription = await SubscriptionService.get_user_subscription(str(enterprise_user.id))
        plan = await SubscriptionService.get_plan_by_id(subscription.plan_id)
        usage_quota = await SubscriptionService.get_user_usage_quota(str(enterprise_user.id))
        
        return {
            "user_id": str(enterprise_user.id),
            "username": enterprise_user.username,
            "plan": {
                "name": plan.name,
                "type": plan.plan_type.value,
                "max_analyses_per_month": plan.max_analyses_per_month,
                "max_image_size_mb": plan.max_image_size_mb,
                "api_rate_limit_per_minute": plan.api_rate_limit_per_minute,
                "features": plan.features
            },
            "subscription": {
                "status": subscription.status.value,
                "start_date": subscription.start_date,
                "end_date": subscription.end_date,
                "billing_cycle": subscription.billing_cycle.value
            },
            "usage": {
                "analyses_used": usage_quota.analyses_used if usage_quota else 0,
                "analyses_limit": plan.max_analyses_per_month,
                "is_unlimited": plan.max_analyses_per_month == 0
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting enterprise status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get enterprise status"
        )


@router.post("/bulk-analysis", response_model=BulkAnalysisResponse)
async def bulk_disease_analysis(
    files: List[UploadFile] = File(...),
    request: BulkAnalysisRequest = Depends(),
    enterprise_user: UserInDB = Depends(EnterpriseUser.verify_enterprise_access)
):
    """Bulk disease analysis for multiple images"""
    import base64
    import uuid
    from concurrent.futures import ThreadPoolExecutor
    from time import time
    
    from src.image_utils import test_with_base64_data
    from src.storage.image_storage import save_image
    
    try:
        await ensure_analysis_allowed()
        start_time = time()
        batch_id = str(uuid.uuid4())
        
        logger.info(f"Starting bulk analysis for {len(files)} images, batch: {batch_id}")
        
        # Validate file count (enterprise limit: 100 files per batch)
        if len(files) > 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maximum 100 files allowed per batch"
            )
        
        results = []
        processed_count = 0
        failed_count = 0
        
        # Process files in parallel (enterprise feature)
        def process_single_image(file_data):
            try:
                file, index = file_data
                contents = file["contents"]
                filename = file["filename"]
                
                # Save image
                saved_filename, file_path = save_image(contents, filename, enterprise_user.username)
                
                # Convert to base64 and analyze
                base64_string = base64.b64encode(contents).decode("utf-8")
                analysis_result = test_with_base64_data(base64_string)
                
                if analysis_result and not analysis_result.get("error"):
                    # Store analysis record
                    analysis_record = AnalysisRecord(
                        user_id=str(enterprise_user.id),
                        username=enterprise_user.username,
                        image_filename=saved_filename,
                        image_path=file_path,
                        disease_detected=analysis_result.get("disease_detected", False),
                        disease_name=analysis_result.get("disease_name"),
                        disease_type=analysis_result.get("disease_type", "unknown"),
                        severity=analysis_result.get("severity", "unknown"),
                        confidence=analysis_result.get("confidence", 0.0),
                        symptoms=analysis_result.get("symptoms", []),
                        possible_causes=analysis_result.get("possible_causes", []),
                        treatment=analysis_result.get("treatment", []),
                        description=analysis_result.get("description", ""),
                        batch_id=batch_id,
                        batch_name=request.batch_name
                    )
                    
                    return {
                        "index": index,
                        "filename": filename,
                        "success": True,
                        "analysis": analysis_record.dict(),
                        "error": None
                    }
                else:
                    return {
                        "index": index,
                        "filename": filename,
                        "success": False,
                        "analysis": None,
                        "error": analysis_result.get("error", "Analysis failed") if analysis_result else "Analysis failed"
                    }
                    
            except Exception as e:
                return {
                    "index": index,
                    "filename": filename,
                    "success": False,
                    "analysis": None,
                    "error": str(e)
                }
        
        # Read all files first
        file_data = []
        for i, file in enumerate(files):
            contents = await file.read()
            file_data.append({
                "contents": contents,
                "filename": file.filename
            })
        
        # Process in parallel with ThreadPoolExecutor
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(process_single_image, (file_data[i], i)) for i in range(len(file_data))]
            
            for future in futures:
                result = future.result()
                results.append(result)
                
                if result["success"]:
                    processed_count += 1
                    # Store in database
                    analysis_collection = MongoDB.get_collection(ANALYSIS_COLLECTION)
                    await analysis_collection.insert_one(result["analysis"])
                else:
                    failed_count += 1
        
        # Sort results by index
        results.sort(key=lambda x: x["index"])
        
        processing_time = time() - start_time
        
        logger.info(f"Bulk analysis completed: {processed_count} processed, {failed_count} failed")
        
        return BulkAnalysisResponse(
            batch_id=batch_id,
            batch_name=request.batch_name,
            total_images=len(files),
            processed_images=processed_count,
            failed_images=failed_count,
            results=results,
            processing_time_seconds=processing_time,
            metadata=request.metadata
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in bulk analysis: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Bulk analysis failed: {str(e)}"
        )


@router.get("/analytics", response_model=AnalyticsResponse)
async def get_advanced_analytics(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    disease_types: Optional[str] = Query(None, description="Comma-separated disease types"),
    severity_levels: Optional[str] = Query(None, description="Comma-separated severity levels"),
    enterprise_user: UserInDB = Depends(EnterpriseUser.verify_enterprise_access)
):
    """Get advanced analytics for enterprise users"""
    try:
        analysis_collection = MongoDB.get_collection(ANALYSIS_COLLECTION)
        
        # Build query filter
        query_filter = {"user_id": str(enterprise_user.id)}
        
        if start_date or end_date:
            date_filter = {}
            if start_date:
                date_filter["$gte"] = start_date
            if end_date:
                date_filter["$lte"] = end_date
            query_filter["analysis_timestamp"] = date_filter
        
        if disease_types:
            disease_list = [d.strip() for d in disease_types.split(",")]
            query_filter["disease_type"] = {"$in": disease_list}
        
        if severity_levels:
            severity_list = [s.strip() for s in severity_levels.split(",")]
            query_filter["severity"] = {"$in": severity_list}
        
        # Get total count
        total_analyses = await analysis_collection.count_documents(query_filter)
        
        # Disease distribution
        disease_pipeline = [
            {"$match": query_filter},
            {"$group": {
                "_id": "$disease_type",
                "count": {"$sum": 1},
                "avg_confidence": {"$avg": "$confidence"}
            }},
            {"$sort": {"count": -1}}
        ]
        disease_cursor = analysis_collection.aggregate(disease_pipeline)
        disease_distribution = {}
        async for item in disease_cursor:
            disease_distribution[item["_id"]] = {
                "count": item["count"],
                "avg_confidence": round(item["avg_confidence"], 2)
            }
        
        # Severity distribution
        severity_pipeline = [
            {"$match": query_filter},
            {"$group": {
                "_id": "$severity",
                "count": {"$sum": 1}
            }},
            {"$sort": {"count": -1}}
        ]
        severity_cursor = analysis_collection.aggregate(severity_pipeline)
        severity_distribution = {}
        async for item in severity_cursor:
            severity_distribution[item["_id"]] = item["count"]
        
        # Confidence statistics
        confidence_pipeline = [
            {"$match": query_filter},
            {"$group": {
                "_id": None,
                "avg_confidence": {"$avg": "$confidence"},
                "min_confidence": {"$min": "$confidence"},
                "max_confidence": {"$max": "$confidence"}
            }}
        ]
        confidence_cursor = analysis_collection.aggregate(confidence_pipeline)
        confidence_result = await confidence_cursor.to_list(1)
        confidence_stats = confidence_result[0] if confidence_result else {
            "avg_confidence": 0,
            "min_confidence": 0,
            "max_confidence": 0
        }
        confidence_stats.pop("_id", None)
        
        # Temporal trends (daily aggregation)
        temporal_pipeline = [
            {"$match": query_filter},
            {"$group": {
                "_id": {
                    "year": {"$year": "$analysis_timestamp"},
                    "month": {"$month": "$analysis_timestamp"},
                    "day": {"$dayOfMonth": "$analysis_timestamp"}
                },
                "count": {"$sum": 1},
                "diseases_detected": {"$sum": {"$cond": ["$disease_detected", 1, 0]}}
            }},
            {"$sort": {"_id": 1}}
        ]
        temporal_cursor = analysis_collection.aggregate(temporal_pipeline)
        temporal_trends = []
        async for item in temporal_cursor:
            date_str = f"{item['_id']['year']}-{item['_id']['month']:02d}-{item['_id']['day']:02d}"
            temporal_trends.append({
                "date": date_str,
                "total_analyses": item["count"],
                "diseases_detected": item["diseases_detected"],
                "detection_rate": round(item["diseases_detected"] / item["count"] * 100, 2) if item["count"] > 0 else 0
            })
        
        # Success rate (analyses without errors)
        successful_analyses = await analysis_collection.count_documents({
            **query_filter,
            "confidence": {"$gt": 0}
        })
        success_rate = round(successful_analyses / total_analyses * 100, 2) if total_analyses > 0 else 0
        
        return AnalyticsResponse(
            total_analyses=total_analyses,
            disease_distribution=disease_distribution,
            severity_distribution=severity_distribution,
            confidence_stats=confidence_stats,
            temporal_trends=temporal_trends,
            success_rate=success_rate
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting analytics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get analytics"
        )


@router.get("/batch/{batch_id}")
async def get_batch_results(
    batch_id: str,
    enterprise_user: UserInDB = Depends(EnterpriseUser.verify_enterprise_access)
):
    """Get results for a specific batch analysis"""
    try:
        analysis_collection = MongoDB.get_collection(ANALYSIS_COLLECTION)
        
        # Get all analyses for this batch
        cursor = analysis_collection.find({
            "user_id": str(enterprise_user.id),
            "batch_id": batch_id
        }).sort("analysis_timestamp", 1)
        
        results = []
        async for record in cursor:
            results.append({
                "id": str(record["_id"]),
                "filename": record["image_filename"],
                "disease_detected": record["disease_detected"],
                "disease_name": record.get("disease_name"),
                "disease_type": record["disease_type"],
                "severity": record["severity"],
                "confidence": record["confidence"],
                "analysis_timestamp": record["analysis_timestamp"]
            })
        
        if not results:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Batch not found"
            )
        
        # Get batch metadata from first record
        first_record = results[0] if results else {}
        
        return {
            "batch_id": batch_id,
            "batch_name": first_record.get("batch_name"),
            "total_results": len(results),
            "results": results
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting batch results: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get batch results"
        )


@router.get("/export/csv")
async def export_analyses_csv(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    enterprise_user: UserInDB = Depends(EnterpriseUser.verify_enterprise_access)
):
    """Export analysis data as CSV"""
    import csv
    import io
    
    from fastapi.responses import StreamingResponse
    
    try:
        analysis_collection = MongoDB.get_collection(ANALYSIS_COLLECTION)
        
        # Build query
        query_filter = {"user_id": str(enterprise_user.id)}
        if start_date or end_date:
            date_filter = {}
            if start_date:
                date_filter["$gte"] = start_date
            if end_date:
                date_filter["$lte"] = end_date
            query_filter["analysis_timestamp"] = date_filter
        
        # Get data
        cursor = analysis_collection.find(query_filter).sort("analysis_timestamp", -1)
        
        # Create CSV in memory
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            "ID", "Timestamp", "Filename", "Disease Detected", "Disease Name",
            "Disease Type", "Severity", "Confidence", "Symptoms", "Treatment"
        ])
        
        # Write data
        async for record in cursor:
            writer.writerow([
                str(record["_id"]),
                record["analysis_timestamp"].isoformat(),
                record["image_filename"],
                record["disease_detected"],
                record.get("disease_name", ""),
                record["disease_type"],
                record["severity"],
                record["confidence"],
                "; ".join(record.get("symptoms", [])),
                "; ".join(record.get("treatment", []))
            ])
        
        output.seek(0)
        
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode()),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=analyses_{enterprise_user.username}.csv"}
        )
        
    except Exception as e:
        logger.error(f"Error exporting CSV: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to export CSV"
        )


@router.post("/api-keys", response_model=APIKeyResponse)
async def generate_api_key(
    request: APIKeyRequest,
    enterprise_user: UserInDB = Depends(EnterpriseUser.verify_enterprise_access)
):
    """Generate API key for programmatic access"""
    import hashlib
    import secrets
    import uuid
    
    try:
        # Generate API key
        key_id = str(uuid.uuid4())
        api_key = f"ent_{secrets.token_urlsafe(32)}"
        api_key_hash = hashlib.sha256(api_key.encode("utf-8")).hexdigest()
        
        # Calculate expiry
        expires_at = datetime.utcnow() + timedelta(days=request.expires_in_days or 365)
        
        # Store API key in database
        api_keys_collection = MongoDB.get_collection("enterprise_api_keys")
        api_key_doc = {
            "_id": key_id,
            "user_id": str(enterprise_user.id),
            "username": enterprise_user.username,
            "api_key_hash": api_key_hash,  # Store hash, not actual key
            "name": request.name,
            "description": request.description,
            "created_at": datetime.utcnow(),
            "expires_at": expires_at,
            "is_active": True,
            "last_used": None,
            "usage_count": 0
        }
        
        await api_keys_collection.insert_one(api_key_doc)
        
        return APIKeyResponse(
            key_id=key_id,
            api_key=api_key,  # Only returned once
            name=request.name,
            description=request.description,
            created_at=api_key_doc["created_at"],
            expires_at=expires_at,
            is_active=True
        )
        
    except Exception as e:
        logger.error(f"Error generating API key: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate API key"
        )


@router.get("/api-keys")
async def list_api_keys(
    enterprise_user: UserInDB = Depends(EnterpriseUser.verify_enterprise_access)
):
    """List user's API keys"""
    try:
        api_keys_collection = MongoDB.get_collection("enterprise_api_keys")
        
        cursor = api_keys_collection.find({
            "user_id": str(enterprise_user.id)
        }).sort("created_at", -1)
        
        keys = []
        async for key_doc in cursor:
            keys.append({
                "key_id": key_doc["_id"],
                "name": key_doc["name"],
                "description": key_doc.get("description"),
                "created_at": key_doc["created_at"],
                "expires_at": key_doc["expires_at"],
                "is_active": key_doc["is_active"],
                "last_used": key_doc.get("last_used"),
                "usage_count": key_doc.get("usage_count", 0)
            })
        
        return {"api_keys": keys}
        
    except Exception as e:
        logger.error(f"Error listing API keys: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list API keys"
        )


@router.delete("/api-keys/{key_id}")
async def revoke_api_key(
    key_id: str,
    enterprise_user: UserInDB = Depends(EnterpriseUser.verify_enterprise_access)
):
    """Revoke an API key"""
    try:
        api_keys_collection = MongoDB.get_collection("enterprise_api_keys")
        
        result = await api_keys_collection.update_one(
            {
                "_id": key_id,
                "user_id": str(enterprise_user.id)
            },
            {
                "$set": {
                    "is_active": False,
                    "revoked_at": datetime.utcnow()
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="API key not found"
            )
        
        return {"message": "API key revoked successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error revoking API key: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to revoke API key"
        )


@router.get("/analysis-history")
async def get_analysis_history(
    offset: int = 0,
    limit: int = 10,
    enterprise_user: UserInDB = Depends(EnterpriseUser.verify_enterprise_access)
):
    """Get recent analysis history for enterprise dashboard"""
    try:
        analysis_collection = MongoDB.get_collection(ANALYSIS_COLLECTION)
        
        cursor = (
            analysis_collection.find({"user_id": str(enterprise_user.id)})
            .sort("analysis_timestamp", -1)
            .skip(offset)
            .limit(limit)
        )
        
        records = []
        async for record in cursor:
            records.append({
                "id": str(record["_id"]),
                "image_filename": record.get("image_filename"),
                "disease_detected": record.get("disease_detected", False),
                "disease_name": record.get("disease_name"),
                "disease_type": record.get("disease_type"),
                "severity": record.get("severity"),
                "confidence": record.get("confidence"),
                "analysis_timestamp": record.get("analysis_timestamp"),
                "api_access": record.get("api_access", False),
                "symptoms": record.get("symptoms", []),
                "treatment": record.get("treatment", []),
                "description": record.get("description", "")
            })
        
        total_count = await analysis_collection.count_documents({"user_id": str(enterprise_user.id)})
        
        return {
            "records": records,
            "total_count": total_count,
            "limit": limit,
            "offset": offset,
            "has_more": offset + len(records) < total_count
        }
        
    except Exception as e:
        logger.error(f"Error getting analysis history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get analysis history"
        )


@router.get("/usage-stats")
async def get_usage_statistics(
    days: int = 30,
    enterprise_user: UserInDB = Depends(EnterpriseUser.verify_enterprise_access)
):
    """Get detailed usage statistics for dashboard"""
    try:
        from datetime import datetime, timedelta
        
        # Calculate date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        analysis_collection = MongoDB.get_collection(ANALYSIS_COLLECTION)
        rate_limit_collection = MongoDB.get_collection("rate_limits")
        
        # Get analysis stats
        analysis_stats = await analysis_collection.aggregate([
            {
                "$match": {
                    "user_id": str(enterprise_user.id),
                    "analysis_timestamp": {"$gte": start_date, "$lte": end_date}
                }
            },
            {
                "$group": {
                    "_id": {
                        "year": {"$year": "$analysis_timestamp"},
                        "month": {"$month": "$analysis_timestamp"},
                        "day": {"$dayOfMonth": "$analysis_timestamp"}
                    },
                    "total_calls": {"$sum": 1},
                    "api_calls": {"$sum": {"$cond": ["$api_access", 1, 0]}},
                    "web_calls": {"$sum": {"$cond": ["$api_access", 0, 1]}}
                }
            },
            {"$sort": {"_id": 1}}
        ]).to_list(None)
        
        # Get rate limit stats (API usage)
        rate_limit_stats = await rate_limit_collection.aggregate([
            {
                "$match": {
                    "user_id": str(enterprise_user.id),
                    "updated_at": {"$gte": start_date, "$lte": end_date}
                }
            },
            {
                "$group": {
                    "_id": None,
                    "total_api_requests": {"$sum": "$count"}
                }
            }
        ]).to_list(1)
        
        total_api_requests = rate_limit_stats[0]["total_api_requests"] if rate_limit_stats else 0
        
        # Format daily stats
        daily_stats = []
        for stat in analysis_stats:
            date_str = f"{stat['_id']['year']}-{stat['_id']['month']:02d}-{stat['_id']['day']:02d}"
            daily_stats.append({
                "date": date_str,
                "total_analyses": stat["total_calls"],
                "api_calls": stat["api_calls"],
                "web_calls": stat["web_calls"]
            })
        
        return {
            "period_days": days,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "total_api_requests": total_api_requests,
            "total_analyses": sum(stat["total_calls"] for stat in analysis_stats),
            "daily_stats": daily_stats
        }
        
    except Exception as e:
        logger.error(f"Error getting usage statistics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get usage statistics"
        )
