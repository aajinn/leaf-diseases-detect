"""
Disease Detection Routes with Authentication
============================================

Protected API endpoints for disease detection with user authentication.
"""

import base64
import logging

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import JSONResponse

from src.auth.security import get_current_active_user
from src.database.connection import ANALYSIS_COLLECTION, MongoDB
from src.database.models import (AnalysisRecord, AnalysisResponse, UserInDB,
                                 YouTubeVideo)
from src.image_utils import test_with_base64_data
from src.services.perplexity_service import get_perplexity_service
from src.storage.image_storage import save_image
from src.utils.usage_tracker import track_groq_usage, track_perplexity_usage

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Disease Detection"])


@router.post("/test-upload")
async def test_upload(
    file: UploadFile = File(...),
    current_user: UserInDB = Depends(get_current_active_user),
):
    """Test endpoint to verify file upload is working"""
    return {
        "filename": file.filename,
        "content_type": file.content_type,
        "size": len(await file.read()),
        "user": current_user.username,
    }


@router.post("/disease-detection", response_model=AnalysisResponse)
async def detect_disease(
    file: UploadFile = File(...),
    current_user: UserInDB = Depends(get_current_active_user),
):
    """
    Detect diseases in leaf images (authenticated users only)

    Requires authentication token in header:
    Authorization: Bearer <token>
    """
    try:
        logger.info(
            f"User {current_user.username} uploaded image for disease detection"
        )
        logger.info(
            f"File details - filename: {file.filename}, content_type: {file.content_type}"
        )

        # Validate file
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="No file provided"
            )

        # Read uploaded file
        contents = await file.read()

        if not contents:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file provided"
            )

        logger.info(f"File size: {len(contents)} bytes")

        # Save image locally
        filename, file_path = save_image(contents, file.filename, current_user.username)
        logger.info(f"Image saved: {file_path}")

        # Convert to base64 and analyze
        base64_string = base64.b64encode(contents).decode("utf-8")
        result = test_with_base64_data(base64_string)

        logger.info(f"Analysis result keys: {result.keys() if result else 'None'}")
        logger.info(
            f"Description in result: {result.get('description', 'NOT FOUND') if result else 'None'}"
        )

        # Track Groq API usage with actual token counts
        token_usage = result.get("token_usage", {}) if result else {}
        input_tokens = token_usage.get("prompt_tokens")
        output_tokens = token_usage.get("completion_tokens")
        total_tokens = token_usage.get("total_tokens", len(base64_string) // 4 + 500)
        
        await track_groq_usage(
            user_id=str(current_user.id),
            username=current_user.username,
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            tokens_used=total_tokens,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            success=result is not None and not result.get("error"),
        )

        if result is None or (isinstance(result, dict) and result.get("error")):
            error_detail = (
                result.get("error", "Failed to process image")
                if isinstance(result, dict)
                else "Failed to process image"
            )
            logger.error(f"Disease detection failed: {error_detail}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=error_detail
            )

        # Fetch YouTube video recommendations
        youtube_videos = []
        try:
            perplexity = get_perplexity_service()
            logger.info(f"Perplexity service enabled: {perplexity.enabled}")

            if result.get("disease_detected") and result.get("disease_name"):
                # Get treatment videos for detected disease
                logger.info(
                    f"Fetching treatment videos for: {result.get('disease_name')}"
                )
                youtube_videos = perplexity.get_treatment_videos(
                    disease_name=result.get("disease_name"),
                    disease_type=result.get("disease_type", "unknown"),
                    max_videos=3,
                )
                logger.info(f"Fetched {len(youtube_videos)} treatment videos")
                if youtube_videos:
                    logger.info(f"First video: {youtube_videos[0]}")

                # Track Perplexity usage
                await track_perplexity_usage(
                    user_id=str(current_user.id),
                    username=current_user.username,
                    model="sonar",
                    tokens_used=1000,  # Estimate
                    success=len(youtube_videos) > 0,
                )
            elif (
                not result.get("disease_detected")
                and result.get("disease_type") != "invalid_image"
            ):
                # Get general plant care videos for healthy leaves
                logger.info("Plant is healthy - fetching plant care videos")
                youtube_videos = perplexity.get_general_plant_care_videos(max_videos=3)
                logger.info(f"Fetched {len(youtube_videos)} plant care videos")

                # Track Perplexity usage
                await track_perplexity_usage(
                    user_id=str(current_user.id),
                    username=current_user.username,
                    model="sonar",
                    tokens_used=800,  # Estimate
                    success=len(youtube_videos) > 0,
                )
            else:
                logger.info(
                    f"No videos fetched. Disease detected: {result.get('disease_detected')}, Type: {result.get('disease_type')}"
                )
        except Exception as e:
            logger.error(f"Failed to fetch YouTube videos: {str(e)}", exc_info=True)
            # Continue without videos - not critical

        # Store analysis record in database
        analysis_record = AnalysisRecord(
            user_id=str(current_user.id),
            username=current_user.username,
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
            youtube_videos=youtube_videos,
        )

        analysis_collection = MongoDB.get_collection(ANALYSIS_COLLECTION)
        insert_result = await analysis_collection.insert_one(
            analysis_record.dict(by_alias=True)
        )

        logger.info(f"Analysis record saved with ID: {insert_result.inserted_id}")

        # Return response
        return AnalysisResponse(
            id=str(insert_result.inserted_id),
            disease_detected=analysis_record.disease_detected,
            disease_name=analysis_record.disease_name,
            disease_type=analysis_record.disease_type,
            severity=analysis_record.severity,
            confidence=analysis_record.confidence,
            symptoms=analysis_record.symptoms,
            possible_causes=analysis_record.possible_causes,
            treatment=analysis_record.treatment,
            description=analysis_record.description,
            youtube_videos=analysis_record.youtube_videos,
            analysis_timestamp=analysis_record.analysis_timestamp,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in disease detection: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}",
        )


@router.get("/my-analyses")
async def get_my_analyses(
    skip: int = 0,
    limit: int = 50,
    current_user: UserInDB = Depends(get_current_active_user),
):
    """Get all analysis records for current user"""
    analysis_collection = MongoDB.get_collection(ANALYSIS_COLLECTION)

    cursor = (
        analysis_collection.find({"user_id": str(current_user.id)})
        .sort("analysis_timestamp", -1)
        .skip(skip)
        .limit(limit)
    )

    records = await cursor.to_list(length=limit)

    return {
        "total": len(records),
        "records": [
            {
                "id": str(record["_id"]),
                "image_filename": record["image_filename"],
                "disease_detected": record["disease_detected"],
                "disease_name": record.get("disease_name"),
                "disease_type": record["disease_type"],
                "severity": record["severity"],
                "confidence": record["confidence"],
                "youtube_videos": record.get("youtube_videos", []),
                "analysis_timestamp": record["analysis_timestamp"],
            }
            for record in records
        ],
    }


@router.get("/analyses/{analysis_id}")
async def get_analysis_detail(
    analysis_id: str, current_user: UserInDB = Depends(get_current_active_user)
):
    """Get detailed analysis record"""
    from bson import ObjectId

    analysis_collection = MongoDB.get_collection(ANALYSIS_COLLECTION)

    try:
        record = await analysis_collection.find_one({"_id": ObjectId(analysis_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid analysis ID"
        )

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Analysis record not found"
        )

    # Check if user owns this record or is admin
    if record["user_id"] != str(current_user.id) and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this record",
        )

    record["id"] = str(record.pop("_id"))
    return record


@router.delete("/analyses/{analysis_id}")
async def delete_analysis(
    analysis_id: str, current_user: UserInDB = Depends(get_current_active_user)
):
    """Delete analysis record"""
    from bson import ObjectId

    from src.storage.image_storage import delete_image

    analysis_collection = MongoDB.get_collection(ANALYSIS_COLLECTION)

    try:
        record = await analysis_collection.find_one({"_id": ObjectId(analysis_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid analysis ID"
        )

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Analysis record not found"
        )

    # Check if user owns this record or is admin
    if record["user_id"] != str(current_user.id) and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this record",
        )

    # Delete image file
    delete_image(record["username"], record["image_filename"])

    # Delete database record
    await analysis_collection.delete_one({"_id": ObjectId(analysis_id)})

    return {"message": "Analysis record deleted successfully"}
