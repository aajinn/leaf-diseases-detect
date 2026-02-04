"""
Programmatic API Routes
======================

API endpoints for programmatic access using API keys.
Designed for enterprise users to integrate with their systems.
"""

import base64
import logging
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel

from src.auth.api_key_auth import get_enterprise_api_user
from src.database.connection import ANALYSIS_COLLECTION, MongoDB
from src.database.models import AnalysisRecord, UserInDB
from src.image_utils import test_with_base64_data
from src.storage.image_storage import save_image
from src.utils.system_settings import ensure_analysis_allowed

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["Programmatic API"])


# Request/Response Models
class ImageAnalysisRequest(BaseModel):
    """Request model for image analysis"""
    image_base64: str
    filename: Optional[str] = None
    metadata: Optional[dict] = None


class ImageAnalysisResponse(BaseModel):
    """Response model for image analysis"""
    analysis_id: str
    disease_detected: bool
    disease_name: Optional[str]
    disease_type: str
    severity: str
    confidence: float
    symptoms: List[str]
    possible_causes: List[str]
    treatment: List[str]
    description: str
    analysis_timestamp: datetime
    metadata: Optional[dict]


class BatchAnalysisRequest(BaseModel):
    """Request model for batch analysis"""
    images: List[ImageAnalysisRequest]
    batch_name: Optional[str] = None
    metadata: Optional[dict] = None


class BatchAnalysisResponse(BaseModel):
    """Response model for batch analysis"""
    batch_id: str
    batch_name: Optional[str]
    total_images: int
    successful_analyses: int
    failed_analyses: int
    results: List[ImageAnalysisResponse]
    processing_time_seconds: float
    metadata: Optional[dict]


class HealthCheckResponse(BaseModel):
    """Response model for health check"""
    status: str
    timestamp: datetime
    api_version: str
    user_id: str
    rate_limit_remaining: int


# API Endpoints

@router.get("/health", response_model=HealthCheckResponse)
async def health_check(
    api_user: UserInDB = Depends(get_enterprise_api_user)
):
    """Health check endpoint for API monitoring"""
    return HealthCheckResponse(
        status="healthy",
        timestamp=datetime.utcnow(),
        api_version="1.0.0",
        user_id=str(api_user.id),
        rate_limit_remaining=1000  # TODO: Implement actual rate limiting
    )


@router.post("/analyze", response_model=ImageAnalysisResponse)
async def analyze_image(
    file: UploadFile = File(...),
    api_user: UserInDB = Depends(get_enterprise_api_user)
):
    """Analyze a single image for disease detection"""
    try:
        await ensure_analysis_allowed()
        logger.info(f"API analysis request from user: {api_user.username}")
        
        # Validate file
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No file provided"
            )
        
        # Read file contents
        contents = await file.read()
        if not contents:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Empty file provided"
            )
        
        # Check file size (enterprise limit: 50MB)
        if len(contents) > 50 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="File size exceeds 50MB limit"
            )
        
        # Save image
        filename, file_path = save_image(contents, file.filename, api_user.username)
        
        # Convert to base64 and analyze
        base64_string = base64.b64encode(contents).decode("utf-8")
        result = test_with_base64_data(base64_string)
        
        if result is None or result.get("error"):
            error_detail = result.get("error", "Analysis failed") if result else "Analysis failed"
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=error_detail
            )
        
        # Create analysis record
        analysis_record = AnalysisRecord(
            user_id=str(api_user.id),
            username=api_user.username,
            image_filename=filename,
            image_path=file_path,
            disease_detected=result.get("disease_detected", False),
            disease_name=result.get("disease_name"),
            disease_type=result.get("disease_type", "unknown"),
            severity=result.get("severity", "unknown"),
            confidence=result.get("confidence", 0.0),
            symptoms=result.get("symptoms", []),
            possible_causes=result.get("possible_causes", []),
            treatment=result.get("treatment", []),
            description=result.get("description", ""),
            api_access=True  # Mark as API access
        )
        
        # Store in database
        analysis_collection = MongoDB.get_collection(ANALYSIS_COLLECTION)
        insert_result = await analysis_collection.insert_one(analysis_record.dict(by_alias=True))
        
        logger.info(f"API analysis completed: {insert_result.inserted_id}")
        
        return ImageAnalysisResponse(
            analysis_id=str(insert_result.inserted_id),
            disease_detected=analysis_record.disease_detected,
            disease_name=analysis_record.disease_name,
            disease_type=analysis_record.disease_type,
            severity=analysis_record.severity,
            confidence=analysis_record.confidence,
            symptoms=analysis_record.symptoms,
            possible_causes=analysis_record.possible_causes,
            treatment=analysis_record.treatment,
            description=analysis_record.description,
            analysis_timestamp=analysis_record.analysis_timestamp,
            metadata=None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"API analysis error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}"
        )


@router.post("/analyze-base64", response_model=ImageAnalysisResponse)
async def analyze_base64_image(
    request: ImageAnalysisRequest,
    api_user: UserInDB = Depends(get_enterprise_api_user)
):
    """Analyze image provided as base64 string"""
    try:
        await ensure_analysis_allowed()
        logger.info(f"API base64 analysis request from user: {api_user.username}")
        
        # Validate base64 data
        try:
            image_data = base64.b64decode(request.image_base64)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid base64 image data"
            )
        
        # Check file size
        if len(image_data) > 50 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Image size exceeds 50MB limit"
            )
        
        # Save image
        filename = request.filename or f"api_image_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.jpg"
        saved_filename, file_path = save_image(image_data, filename, api_user.username)
        
        # Analyze image
        result = test_with_base64_data(request.image_base64)
        
        if result is None or result.get("error"):
            error_detail = result.get("error", "Analysis failed") if result else "Analysis failed"
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=error_detail
            )
        
        # Create analysis record
        analysis_record = AnalysisRecord(
            user_id=str(api_user.id),
            username=api_user.username,
            image_filename=saved_filename,
            image_path=file_path,
            disease_detected=result.get("disease_detected", False),
            disease_name=result.get("disease_name"),
            disease_type=result.get("disease_type", "unknown"),
            severity=result.get("severity", "unknown"),
            confidence=result.get("confidence", 0.0),
            symptoms=result.get("symptoms", []),
            possible_causes=result.get("possible_causes", []),
            treatment=result.get("treatment", []),
            description=result.get("description", ""),
            api_access=True,
            metadata=request.metadata
        )
        
        # Store in database
        analysis_collection = MongoDB.get_collection(ANALYSIS_COLLECTION)
        insert_result = await analysis_collection.insert_one(analysis_record.dict(by_alias=True))
        
        logger.info(f"API base64 analysis completed: {insert_result.inserted_id}")
        
        return ImageAnalysisResponse(
            analysis_id=str(insert_result.inserted_id),
            disease_detected=analysis_record.disease_detected,
            disease_name=analysis_record.disease_name,
            disease_type=analysis_record.disease_type,
            severity=analysis_record.severity,
            confidence=analysis_record.confidence,
            symptoms=analysis_record.symptoms,
            possible_causes=analysis_record.possible_causes,
            treatment=analysis_record.treatment,
            description=analysis_record.description,
            analysis_timestamp=analysis_record.analysis_timestamp,
            metadata=request.metadata
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"API base64 analysis error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}"
        )


@router.post("/batch-analyze", response_model=BatchAnalysisResponse)
async def batch_analyze_images(
    request: BatchAnalysisRequest,
    api_user: UserInDB = Depends(get_enterprise_api_user)
):
    """Analyze multiple images in a batch"""
    import uuid
    from time import time
    
    try:
        await ensure_analysis_allowed()
        start_time = time()
        batch_id = str(uuid.uuid4())
        
        logger.info(f"API batch analysis request: {len(request.images)} images, batch: {batch_id}")
        
        # Validate batch size
        if len(request.images) > 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maximum 100 images allowed per batch"
            )
        
        results = []
        successful_count = 0
        failed_count = 0
        
        for i, image_request in enumerate(request.images):
            try:
                # Validate base64 data
                image_data = base64.b64decode(image_request.image_base64)
                
                # Save image
                filename = image_request.filename or f"batch_{batch_id}_{i}.jpg"
                saved_filename, file_path = save_image(image_data, filename, api_user.username)
                
                # Analyze image
                result = test_with_base64_data(image_request.image_base64)
                
                if result and not result.get("error"):
                    # Create analysis record
                    analysis_record = AnalysisRecord(
                        user_id=str(api_user.id),
                        username=api_user.username,
                        image_filename=saved_filename,
                        image_path=file_path,
                        disease_detected=result.get("disease_detected", False),
                        disease_name=result.get("disease_name"),
                        disease_type=result.get("disease_type", "unknown"),
                        severity=result.get("severity", "unknown"),
                        confidence=result.get("confidence", 0.0),
                        symptoms=result.get("symptoms", []),
                        possible_causes=result.get("possible_causes", []),
                        treatment=result.get("treatment", []),
                        description=result.get("description", ""),
                        batch_id=batch_id,
                        batch_name=request.batch_name,
                        api_access=True,
                        metadata=image_request.metadata
                    )
                    
                    # Store in database
                    analysis_collection = MongoDB.get_collection(ANALYSIS_COLLECTION)
                    insert_result = await analysis_collection.insert_one(analysis_record.dict(by_alias=True))
                    
                    results.append(ImageAnalysisResponse(
                        analysis_id=str(insert_result.inserted_id),
                        disease_detected=analysis_record.disease_detected,
                        disease_name=analysis_record.disease_name,
                        disease_type=analysis_record.disease_type,
                        severity=analysis_record.severity,
                        confidence=analysis_record.confidence,
                        symptoms=analysis_record.symptoms,
                        possible_causes=analysis_record.possible_causes,
                        treatment=analysis_record.treatment,
                        description=analysis_record.description,
                        analysis_timestamp=analysis_record.analysis_timestamp,
                        metadata=image_request.metadata
                    ))
                    
                    successful_count += 1
                else:
                    failed_count += 1
                    logger.warning(f"Analysis failed for image {i}: {result.get('error') if result else 'Unknown error'}")
                    
            except Exception as e:
                failed_count += 1
                logger.error(f"Error processing image {i}: {str(e)}")
        
        processing_time = time() - start_time
        
        logger.info(f"API batch analysis completed: {successful_count} successful, {failed_count} failed")
        
        return BatchAnalysisResponse(
            batch_id=batch_id,
            batch_name=request.batch_name,
            total_images=len(request.images),
            successful_analyses=successful_count,
            failed_analyses=failed_count,
            results=results,
            processing_time_seconds=processing_time,
            metadata=request.metadata
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"API batch analysis error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch analysis failed: {str(e)}"
        )


@router.get("/analyses")
async def get_analyses(
    limit: int = 50,
    offset: int = 0,
    api_user: UserInDB = Depends(get_enterprise_api_user)
):
    """Get user's analysis history"""
    try:
        analysis_collection = MongoDB.get_collection(ANALYSIS_COLLECTION)
        
        # Get analyses with pagination
        cursor = (
            analysis_collection.find({"user_id": str(api_user.id)})
            .sort("analysis_timestamp", -1)
            .skip(offset)
            .limit(limit)
        )
        
        analyses = []
        async for record in cursor:
            analyses.append({
                "analysis_id": str(record["_id"]),
                "filename": record["image_filename"],
                "disease_detected": record["disease_detected"],
                "disease_name": record.get("disease_name"),
                "disease_type": record["disease_type"],
                "severity": record["severity"],
                "confidence": record["confidence"],
                "analysis_timestamp": record["analysis_timestamp"],
                "batch_id": record.get("batch_id"),
                "api_access": record.get("api_access", False)
            })
        
        # Get total count
        total_count = await analysis_collection.count_documents({"user_id": str(api_user.id)})
        
        return {
            "analyses": analyses,
            "total_count": total_count,
            "limit": limit,
            "offset": offset,
            "has_more": offset + len(analyses) < total_count
        }
        
    except Exception as e:
        logger.error(f"Error getting analyses: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get analyses"
        )


@router.get("/analyses/{analysis_id}")
async def get_analysis_detail(
    analysis_id: str,
    api_user: UserInDB = Depends(get_enterprise_api_user)
):
    """Get detailed analysis result"""
    from bson import ObjectId
    
    try:
        analysis_collection = MongoDB.get_collection(ANALYSIS_COLLECTION)
        
        # Get analysis record
        try:
            record = await analysis_collection.find_one({
                "_id": ObjectId(analysis_id),
                "user_id": str(api_user.id)
            })
        except:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid analysis ID"
            )
        
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Analysis not found"
            )
        
        return {
            "analysis_id": str(record["_id"]),
            "filename": record["image_filename"],
            "disease_detected": record["disease_detected"],
            "disease_name": record.get("disease_name"),
            "disease_type": record["disease_type"],
            "severity": record["severity"],
            "confidence": record["confidence"],
            "symptoms": record.get("symptoms", []),
            "possible_causes": record.get("possible_causes", []),
            "treatment": record.get("treatment", []),
            "description": record.get("description", ""),
            "analysis_timestamp": record["analysis_timestamp"],
            "batch_id": record.get("batch_id"),
            "batch_name": record.get("batch_name"),
            "metadata": record.get("metadata")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting analysis detail: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get analysis detail"
        )
