"""
Prescription Models for Treatment Plan Generation
=================================================
"""

from datetime import datetime
from typing import List, Optional

from bson import ObjectId
from pydantic import BaseModel, Field


class ProductRecommendation(BaseModel):
    """Product recommendation for treatment"""

    name: str
    type: str  # "fungicide", "pesticide", "fertilizer", "organic", "tool"
    active_ingredient: Optional[str] = None
    dosage: str
    application_method: str
    frequency: str
    duration: str
    safety_precautions: List[str] = []
    estimated_cost: Optional[str] = None


class TreatmentStep(BaseModel):
    """Individual treatment step"""

    step_number: int
    title: str
    description: str
    timing: str  # "immediate", "day 3", "week 2", etc.
    products_needed: List[str] = []
    estimated_duration: str


class Prescription(BaseModel):
    """Complete treatment prescription"""

    id: Optional[str] = Field(default=None, alias="_id")
    prescription_id: str  # Unique prescription identifier
    user_id: str
    username: str
    analysis_id: str  # Reference to original analysis
    
    # Disease information
    disease_name: str
    disease_type: str
    severity: str
    confidence: float
    
    # Treatment plan
    treatment_priority: str  # "urgent", "high", "moderate", "low"
    treatment_duration: str  # "1-2 weeks", "2-4 weeks", etc.
    treatment_steps: List[TreatmentStep]
    product_recommendations: List[ProductRecommendation]
    
    # Additional guidance
    prevention_tips: List[str] = []
    monitoring_schedule: List[str] = []
    warning_signs: List[str] = []
    success_indicators: List[str] = []
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None
    status: str = "active"  # "active", "completed", "expired"
    notes: Optional[str] = None

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str, datetime: lambda v: v.isoformat()}


class PrescriptionSummary(BaseModel):
    """Summary for prescription listing"""

    prescription_id: str
    disease_name: str
    severity: str
    created_at: datetime
    status: str
    treatment_priority: str
