from datetime import datetime
from typing import List

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from src.auth.security import get_current_user, require_admin
from src.database.connection import MongoDB
from src.database.models import FeedbackCreate, FeedbackResponse, FeedbackUpdate, UserInDB

router = APIRouter(prefix="/api/feedback", tags=["feedback"])


@router.post("/", response_model=dict)
async def submit_feedback(
    feedback: FeedbackCreate,
    current_user: UserInDB = Depends(get_current_user)
):
    """Submit feedback for an analysis"""
    try:
        # Verify analysis exists and belongs to user
        analysis = await MongoDB.get_collection("analysis_records").find_one({
            "_id": ObjectId(feedback.analysis_id),
            "user_id": str(current_user.id)
        })
        
        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")
        
        # Check if feedback already exists for this analysis
        existing_feedback = await MongoDB.get_collection("feedback").find_one({
            "analysis_id": feedback.analysis_id,
            "user_id": str(current_user.id)
        })
        
        if existing_feedback:
            raise HTTPException(status_code=400, detail="Feedback already exists for this analysis")
        
        # Create feedback document
        feedback_doc = {
            "analysis_id": feedback.analysis_id,
            "user_id": str(current_user.id),
            "username": current_user.username,
            "feedback_type": feedback.feedback_type,
            "message": feedback.message,
            "correct_disease": feedback.correct_disease,
            "correct_treatment": feedback.correct_treatment,
            "status": "pending",
            "created_at": datetime.utcnow(),
            "reviewed_at": None,
            "admin_notes": None
        }
        
        result = await MongoDB.get_collection("feedback").insert_one(feedback_doc)
        
        return {
            "success": True,
            "message": "Feedback submitted successfully",
            "feedback_id": str(result.inserted_id)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/admin", response_model=List[FeedbackResponse])
async def get_all_feedback(
    status: str = None,
    current_user: UserInDB = Depends(require_admin)
):
    """Get all feedback for admin review"""
    try:
        query = {}
        if status:
            query["status"] = status
            
        cursor = MongoDB.get_collection("feedback").find(query).sort("created_at", -1)
        feedback_list = []
        
        async for doc in cursor:
            try:
                # Convert ObjectId to string for the response
                doc["_id"] = str(doc["_id"])
                
                # Get corresponding analysis
                analysis = None
                try:
                    analysis = await MongoDB.get_collection("analysis_records").find_one({
                        "_id": ObjectId(doc["analysis_id"])
                    })
                    
                    if analysis:
                        # Convert ObjectId to string and clean up analysis data
                        analysis["_id"] = str(analysis["_id"])
                        doc["analysis"] = analysis
                except Exception as analysis_error:
                    print(f"Error loading analysis for feedback {doc['_id']}: {analysis_error}")
                    doc["analysis"] = None
                
                feedback_list.append(FeedbackResponse(**doc))
                
            except Exception as doc_error:
                print(f"Error processing feedback document {doc.get('_id', 'unknown')}: {doc_error}")
                continue
            
        return feedback_list
        
    except Exception as e:
        print(f"Error in get_all_feedback: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/admin/{feedback_id}")
async def update_feedback(
    feedback_id: str,
    update: FeedbackUpdate,
    current_user: UserInDB = Depends(require_admin)
):
    """Update feedback status and optionally update the original analysis"""
    try:
        # Validate feedback_id
        if not feedback_id or feedback_id == 'undefined':
            raise HTTPException(status_code=400, detail="Invalid feedback ID")
        
        if not ObjectId.is_valid(feedback_id):
            raise HTTPException(status_code=400, detail="Invalid ObjectId format")
        
        # Get feedback
        feedback = await MongoDB.get_collection("feedback").find_one({"_id": ObjectId(feedback_id)})
        if not feedback:
            raise HTTPException(status_code=404, detail="Feedback not found")
        
        # Update feedback
        update_doc = {}
        if update.status:
            update_doc["status"] = update.status
            if update.status == "reviewed":
                update_doc["reviewed_at"] = datetime.utcnow()
        
        if update.admin_notes:
            update_doc["admin_notes"] = update.admin_notes
            
        await MongoDB.get_collection("feedback").update_one(
            {"_id": ObjectId(feedback_id)},
            {"$set": update_doc}
        )
        
        # Update original analysis if provided
        if update.updated_analysis:
            analysis_updates = {}
            
            # Map the updated fields to the analysis record structure
            if "disease_name" in update.updated_analysis:
                analysis_updates["disease_name"] = update.updated_analysis["disease_name"]
            if "disease_detected" in update.updated_analysis:
                analysis_updates["disease_detected"] = update.updated_analysis["disease_detected"]
            if "confidence" in update.updated_analysis:
                analysis_updates["confidence"] = update.updated_analysis["confidence"]
            if "disease_type" in update.updated_analysis:
                analysis_updates["disease_type"] = update.updated_analysis["disease_type"]
            if "severity" in update.updated_analysis:
                analysis_updates["severity"] = update.updated_analysis["severity"]
            if "description" in update.updated_analysis:
                analysis_updates["description"] = update.updated_analysis["description"]
            if "symptoms" in update.updated_analysis:
                analysis_updates["symptoms"] = update.updated_analysis["symptoms"]
            if "possible_causes" in update.updated_analysis:
                analysis_updates["possible_causes"] = update.updated_analysis["possible_causes"]
            if "treatment" in update.updated_analysis:
                analysis_updates["treatment"] = update.updated_analysis["treatment"]
            
            # Handle YouTube video URLs - convert to video objects if needed
            if "youtube_video_urls" in update.updated_analysis:
                video_urls = update.updated_analysis["youtube_video_urls"]
                if video_urls:
                    # Create simple video objects from URLs
                    youtube_videos = []
                    for url in video_urls:
                        if url.strip():
                            # Extract video ID from URL for basic video object
                            video_id = ""
                            if "youtube.com/watch?v=" in url:
                                video_id = url.split("v=")[1].split("&")[0]
                            elif "youtu.be/" in url:
                                video_id = url.split("/")[-1].split("?")[0]
                            
                            youtube_videos.append({
                                "title": f"Treatment Video {len(youtube_videos) + 1}",
                                "video_id": video_id,
                                "url": url.strip(),
                                "thumbnail": f"https://img.youtube.com/vi/{video_id}/mqdefault.jpg" if video_id else "",
                                "description": "Updated by admin"
                            })
                    analysis_updates["youtube_videos"] = youtube_videos
            
            # Add admin update metadata
            analysis_updates["updated_by_admin"] = True
            analysis_updates["updated_at"] = datetime.utcnow()
            
            await MongoDB.get_collection("analysis_records").update_one(
                {"_id": ObjectId(feedback["analysis_id"])},
                {"$set": analysis_updates}
            )
        
        return {"success": True, "message": "Feedback updated successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analysis/{analysis_id}")
async def get_feedback_for_analysis(
    analysis_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """Get feedback for a specific analysis"""
    try:
        feedback = await MongoDB.get_collection("feedback").find_one({
            "analysis_id": analysis_id,
            "user_id": str(current_user.id)
        })
        
        if not feedback:
            return {"feedback": None}
        
        feedback["_id"] = str(feedback["_id"])
        return {"feedback": feedback}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))