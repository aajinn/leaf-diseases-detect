"""
Prescription API Routes
======================

API endpoints for generating and managing treatment prescriptions.
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from src.auth.security import get_current_active_user
from src.database.models import UserInDB
from src.database.prescription_models import Prescription
from src.services.prescription_service import PrescriptionService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/prescriptions", tags=["prescriptions"])


class GeneratePrescriptionRequest(BaseModel):
    """Request to generate a prescription"""
    analysis_id: str
    disease_name: str
    disease_type: str
    severity: str
    confidence: float


class PrescriptionResponse(BaseModel):
    """Response containing prescription data"""
    success: bool
    message: str
    prescription: Optional[dict] = None


@router.post("/generate", response_model=PrescriptionResponse)
async def generate_prescription(
    request: GeneratePrescriptionRequest,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Generate a treatment prescription based on disease analysis
    
    Args:
        request: Prescription generation request
        current_user: Authenticated user
        
    Returns:
        Generated prescription (or existing one if already created)
    """
    try:
        # Check if prescription already exists for this analysis
        existing_prescription = await PrescriptionService.get_prescription_by_analysis_id(
            request.analysis_id
        )
        
        if existing_prescription:
            # Verify user owns this prescription
            if existing_prescription.user_id != str(current_user.id):
                raise HTTPException(status_code=403, detail="Access denied")
            
            return PrescriptionResponse(
                success=True,
                message="Prescription already exists for this analysis",
                prescription=existing_prescription.dict(by_alias=True)
            )
        
        # Generate new prescription
        prescription = await PrescriptionService.generate_prescription(
            user_id=str(current_user.id),
            username=current_user.username,
            analysis_id=request.analysis_id,
            disease_name=request.disease_name,
            disease_type=request.disease_type,
            severity=request.severity,
            confidence=request.confidence,
        )
        
        return PrescriptionResponse(
            success=True,
            message="Prescription generated successfully",
            prescription=prescription.dict(by_alias=True)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        logger.error(f"Failed to generate prescription: {str(e)}")
        logger.error(f"Full traceback: {error_details}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.get("/my-prescriptions")
async def get_my_prescriptions(
    limit: int = Query(10, ge=1, le=50),
    skip: int = Query(0, ge=0),
    current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Get prescriptions for the authenticated user
    
    Args:
        limit: Maximum number of prescriptions to return
        skip: Number of prescriptions to skip
        current_user: Authenticated user
        
    Returns:
        List of prescriptions
    """
    try:
        prescriptions = await PrescriptionService.get_user_prescriptions(
            user_id=str(current_user.id),
            limit=limit,
            skip=skip
        )
        
        return {
            "success": True,
            "count": len(prescriptions),
            "prescriptions": [p.dict(by_alias=True) for p in prescriptions]
        }
        
    except Exception as e:
        logger.error(f"Failed to get prescriptions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{prescription_id}")
async def get_prescription(
    prescription_id: str,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Get a specific prescription by ID
    
    Args:
        prescription_id: Prescription identifier
        current_user: Authenticated user
        
    Returns:
        Prescription details
    """
    try:
        prescription = await PrescriptionService.get_prescription_by_id(prescription_id)
        
        if not prescription:
            raise HTTPException(status_code=404, detail="Prescription not found")
        
        # Verify user owns this prescription
        if prescription.user_id != str(current_user.id):
            raise HTTPException(status_code=403, detail="Access denied")
        
        return {
            "success": True,
            "prescription": prescription.dict(by_alias=True)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get prescription: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{prescription_id}/print")
async def get_printable_prescription(
    prescription_id: str,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Get prescription in printable format
    
    Args:
        prescription_id: Prescription identifier
        current_user: Authenticated user
        
    Returns:
        Formatted prescription for printing
    """
    try:
        prescription = await PrescriptionService.get_prescription_by_id(prescription_id)
        
        if not prescription:
            raise HTTPException(status_code=404, detail="Prescription not found")
        
        # Verify user owns this prescription
        if prescription.user_id != str(current_user.id):
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Format for printing
        printable = {
            "header": {
                "prescription_id": prescription.prescription_id,
                "patient_name": prescription.username,
                "date_issued": prescription.created_at.strftime("%B %d, %Y"),
                "expires": prescription.expires_at.strftime("%B %d, %Y") if prescription.expires_at else "N/A",
            },
            "diagnosis": {
                "disease": prescription.disease_name,
                "type": prescription.disease_type,
                "severity": prescription.severity,
                "confidence": f"{prescription.confidence * 100:.1f}%",
            },
            "treatment_plan": {
                "priority": prescription.treatment_priority.upper(),
                "duration": prescription.treatment_duration,
                "steps": [
                    {
                        "number": step.step_number,
                        "title": step.title,
                        "description": step.description,
                        "timing": step.timing,
                        "products": step.products_needed,
                        "duration": step.estimated_duration,
                    }
                    for step in prescription.treatment_steps
                ],
            },
            "products": [
                {
                    "name": prod.name,
                    "type": prod.type,
                    "ingredient": prod.active_ingredient,
                    "dosage": prod.dosage,
                    "method": prod.application_method,
                    "frequency": prod.frequency,
                    "duration": prod.duration,
                    "safety": prod.safety_precautions,
                    "cost": prod.estimated_cost,
                }
                for prod in prescription.product_recommendations
            ],
            "guidance": {
                "prevention": prescription.prevention_tips,
                "monitoring": prescription.monitoring_schedule,
                "warning_signs": prescription.warning_signs,
                "success_indicators": prescription.success_indicators,
            },
            "footer": {
                "disclaimer": "This prescription is generated based on automated disease detection. "
                             "For severe cases or if symptoms persist, consult a professional agronomist.",
                "status": prescription.status,
            }
        }
        
        return {
            "success": True,
            "printable_prescription": printable
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get printable prescription: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
