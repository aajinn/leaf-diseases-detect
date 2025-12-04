"""
Prescription Service for Treatment Plan Generation
===============================================

Generates comprehensive treatment prescriptions based on disease detection results.
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from bson import ObjectId

from src.database.connection import MongoDB
from src.database.prescription_models import (
    Prescription,
    ProductRecommendation,
    TreatmentStep,
)

logger = logging.getLogger(__name__)

PRESCRIPTION_COLLECTION = "prescriptions"


class PrescriptionService:
    """Service for generating and managing treatment prescriptions"""

    # Disease-specific treatment protocols
    TREATMENT_PROTOCOLS = {
        "bacterial_blight": {
            "priority": "urgent",
            "duration": "2-3 weeks",
            "products": [
                {
                    "name": "Copper Hydroxide Fungicide",
                    "type": "bactericide",
                    "active_ingredient": "Copper Hydroxide 77%",
                    "dosage": "2-3 grams per liter of water",
                    "application_method": "Foliar spray",
                    "frequency": "Every 7-10 days",
                    "duration": "3-4 applications",
                    "safety_precautions": [
                        "Wear protective clothing and gloves",
                        "Avoid spraying during windy conditions",
                        "Do not spray during flowering period",
                    ],
                    "estimated_cost": "$15-25",
                },
                {
                    "name": "Streptomycin Sulfate",
                    "type": "antibiotic",
                    "active_ingredient": "Streptomycin Sulfate 21.2%",
                    "dosage": "200 ppm (0.2g per liter)",
                    "application_method": "Foliar spray",
                    "frequency": "Every 5-7 days",
                    "duration": "2-3 applications",
                    "safety_precautions": [
                        "Use only as directed",
                        "Rotate with other bactericides",
                        "Follow pre-harvest interval",
                    ],
                    "estimated_cost": "$20-30",
                },
            ],
            "steps": [
                {
                    "step_number": 1,
                    "title": "Immediate Isolation",
                    "description": "Remove and destroy all infected plant parts. Isolate affected plants to prevent spread.",
                    "timing": "Immediately",
                    "products_needed": ["Pruning shears", "Disinfectant"],
                    "estimated_duration": "30-60 minutes",
                },
                {
                    "step_number": 2,
                    "title": "First Treatment Application",
                    "description": "Apply copper-based bactericide to all plant surfaces, focusing on affected areas.",
                    "timing": "Day 1",
                    "products_needed": ["Copper Hydroxide Fungicide"],
                    "estimated_duration": "15-30 minutes",
                },
                {
                    "step_number": 3,
                    "title": "Follow-up Treatment",
                    "description": "Apply second treatment with streptomycin sulfate for enhanced bacterial control.",
                    "timing": "Day 7",
                    "products_needed": ["Streptomycin Sulfate"],
                    "estimated_duration": "15-30 minutes",
                },
                {
                    "step_number": 4,
                    "title": "Monitoring and Maintenance",
                    "description": "Continue weekly applications and monitor for improvement. Adjust treatment as needed.",
                    "timing": "Days 14, 21",
                    "products_needed": ["Copper Hydroxide Fungicide"],
                    "estimated_duration": "15-30 minutes per application",
                },
            ],
            "prevention_tips": [
                "Ensure proper plant spacing for air circulation",
                "Avoid overhead watering",
                "Remove plant debris regularly",
                "Disinfect tools between plants",
                "Apply preventive copper sprays during humid conditions",
            ],
            "monitoring_schedule": [
                "Daily visual inspection for first week",
                "Weekly monitoring for new symptoms",
                "Check for spread to nearby plants",
                "Monitor weather conditions (humidity, rain)",
            ],
            "warning_signs": [
                "Rapid spread to new leaves or plants",
                "Yellowing and wilting of entire branches",
                "Black streaks on stems",
                "Foul odor from infected areas",
            ],
            "success_indicators": [
                "No new lesions appearing",
                "Existing lesions stop expanding",
                "New growth appears healthy",
                "Overall plant vigor improves",
            ],
        },
        "fungal_leaf_spot": {
            "priority": "moderate",
            "duration": "2-4 weeks",
            "products": [
                {
                    "name": "Mancozeb Fungicide",
                    "type": "fungicide",
                    "active_ingredient": "Mancozeb 75%",
                    "dosage": "2 grams per liter of water",
                    "application_method": "Foliar spray",
                    "frequency": "Every 10-14 days",
                    "duration": "3-4 applications",
                    "safety_precautions": [
                        "Wear mask and gloves during application",
                        "Avoid drift to water sources",
                        "Do not apply before rain",
                    ],
                    "estimated_cost": "$12-18",
                },
                {
                    "name": "Neem Oil",
                    "type": "organic",
                    "active_ingredient": "Azadirachtin 0.03%",
                    "dosage": "5-10ml per liter of water",
                    "application_method": "Foliar spray",
                    "frequency": "Every 7-10 days",
                    "duration": "4-6 applications",
                    "safety_precautions": [
                        "Apply in early morning or evening",
                        "Test on small area first",
                        "Avoid application during flowering",
                    ],
                    "estimated_cost": "$8-15",
                },
            ],
            "steps": [
                {
                    "step_number": 1,
                    "title": "Sanitation",
                    "description": "Remove affected leaves and improve air circulation around plants.",
                    "timing": "Immediately",
                    "products_needed": ["Pruning shears"],
                    "estimated_duration": "20-40 minutes",
                },
                {
                    "step_number": 2,
                    "title": "Initial Fungicide Treatment",
                    "description": "Apply mancozeb fungicide to all plant surfaces for broad-spectrum protection.",
                    "timing": "Day 1",
                    "products_needed": ["Mancozeb Fungicide"],
                    "estimated_duration": "15-25 minutes",
                },
                {
                    "step_number": 3,
                    "title": "Organic Follow-up",
                    "description": "Apply neem oil treatment for continued protection and plant health.",
                    "timing": "Day 10",
                    "products_needed": ["Neem Oil"],
                    "estimated_duration": "15-25 minutes",
                },
            ],
            "prevention_tips": [
                "Water at soil level, not on leaves",
                "Ensure good air circulation",
                "Apply mulch to prevent soil splash",
                "Rotate crops annually",
            ],
            "monitoring_schedule": [
                "Weekly inspection of leaves",
                "Monitor humidity levels",
                "Check for new spot development",
            ],
            "warning_signs": [
                "Spots increasing in size rapidly",
                "Yellowing around spots",
                "Premature leaf drop",
            ],
            "success_indicators": [
                "No new spots developing",
                "Existing spots remain stable",
                "New growth is clean",
            ],
        },
        "healthy": {
            "priority": "low",
            "duration": "Ongoing maintenance",
            "products": [
                {
                    "name": "Balanced Fertilizer (10-10-10)",
                    "type": "fertilizer",
                    "active_ingredient": "NPK 10-10-10",
                    "dosage": "1 tablespoon per gallon of water",
                    "application_method": "Soil application",
                    "frequency": "Monthly",
                    "duration": "Growing season",
                    "safety_precautions": ["Follow package instructions", "Water after application"],
                    "estimated_cost": "$10-15",
                },
            ],
            "steps": [
                {
                    "step_number": 1,
                    "title": "Maintain Plant Health",
                    "description": "Continue regular care routine to keep plants healthy.",
                    "timing": "Ongoing",
                    "products_needed": ["Balanced Fertilizer"],
                    "estimated_duration": "10-15 minutes monthly",
                },
            ],
            "prevention_tips": [
                "Maintain consistent watering schedule",
                "Provide adequate sunlight",
                "Regular fertilization",
                "Monitor for early signs of problems",
            ],
            "monitoring_schedule": ["Weekly visual inspection", "Monthly detailed check"],
            "warning_signs": ["Any unusual discoloration", "Wilting", "Pest activity"],
            "success_indicators": ["Vigorous growth", "Good color", "No disease symptoms"],
        },
    }

    @classmethod
    async def generate_prescription(
        cls,
        user_id: str,
        username: str,
        analysis_id: str,
        disease_name: str,
        disease_type: str,
        severity: str,
        confidence: float,
    ) -> Prescription:
        """
        Generate a comprehensive treatment prescription
        
        Args:
            user_id: User identifier
            username: Username
            analysis_id: Reference to disease analysis
            disease_name: Detected disease name
            disease_type: Type of disease
            severity: Severity level
            confidence: Detection confidence
            
        Returns:
            Generated prescription
        """
        try:
            # Generate unique prescription ID
            prescription_id = f"RX-{datetime.now().strftime('%Y%m%d')}-{str(ObjectId())[:8]}"
            
            # Get treatment protocol (fallback to generic if not found)
            protocol_key = disease_name.lower().replace(" ", "_")
            protocol = cls.TREATMENT_PROTOCOLS.get(
                protocol_key, cls.TREATMENT_PROTOCOLS["healthy"]
            )
            
            # Adjust treatment based on severity
            adjusted_protocol = cls._adjust_for_severity(protocol, severity)
            
            # Create product recommendations
            products = [
                ProductRecommendation(**product) for product in adjusted_protocol["products"]
            ]
            
            # Create treatment steps
            steps = [TreatmentStep(**step) for step in adjusted_protocol["steps"]]
            
            # Calculate expiration (prescriptions valid for 90 days)
            expires_at = datetime.utcnow() + timedelta(days=90)
            
            # Create prescription
            prescription = Prescription(
                prescription_id=prescription_id,
                user_id=user_id,
                username=username,
                analysis_id=analysis_id,
                disease_name=disease_name,
                disease_type=disease_type,
                severity=severity,
                confidence=confidence,
                treatment_priority=adjusted_protocol["priority"],
                treatment_duration=adjusted_protocol["duration"],
                treatment_steps=steps,
                product_recommendations=products,
                prevention_tips=adjusted_protocol["prevention_tips"],
                monitoring_schedule=adjusted_protocol["monitoring_schedule"],
                warning_signs=adjusted_protocol["warning_signs"],
                success_indicators=adjusted_protocol["success_indicators"],
                expires_at=expires_at,
            )
            
            # Save to database
            collection = MongoDB.get_collection(PRESCRIPTION_COLLECTION)
            # Exclude id field when inserting (MongoDB will generate _id)
            prescription_dict = prescription.dict(by_alias=True, exclude={"id"})
            # Remove _id if it exists in the dict
            prescription_dict.pop("_id", None)
            result = await collection.insert_one(prescription_dict)
            prescription.id = str(result.inserted_id)
            
            logger.info(f"Generated prescription {prescription_id} for user {username}")
            return prescription
            
        except Exception as e:
            logger.error(f"Failed to generate prescription: {str(e)}")
            raise
    
    @classmethod
    def _adjust_for_severity(cls, protocol: Dict, severity: str) -> Dict:
        """
        Adjust treatment protocol based on disease severity
        
        Args:
            protocol: Base treatment protocol
            severity: Disease severity level
            
        Returns:
            Adjusted protocol
        """
        import copy
        adjusted = copy.deepcopy(protocol)
        
        if severity.lower() in ["severe", "critical"]:
            # Increase treatment frequency for severe cases
            adjusted["priority"] = "urgent"
            for product in adjusted["products"]:
                if "Every 10-14 days" in product["frequency"]:
                    product["frequency"] = "Every 7-10 days"
                elif "Every 7-10 days" in product["frequency"]:
                    product["frequency"] = "Every 5-7 days"
                    
        elif severity.lower() in ["mild", "low"]:
            # Reduce treatment intensity for mild cases
            adjusted["priority"] = "low"
            for product in adjusted["products"]:
                if "Every 5-7 days" in product["frequency"]:
                    product["frequency"] = "Every 7-10 days"
                elif "Every 7-10 days" in product["frequency"]:
                    product["frequency"] = "Every 10-14 days"
        
        return adjusted
    
    @classmethod
    async def get_user_prescriptions(
        cls, user_id: str, limit: int = 10, skip: int = 0
    ) -> List[Prescription]:
        """
        Get prescriptions for a user
        
        Args:
            user_id: User identifier
            limit: Maximum number of prescriptions to return
            skip: Number of prescriptions to skip
            
        Returns:
            List of prescriptions
        """
        try:
            collection = MongoDB.get_collection(PRESCRIPTION_COLLECTION)
            cursor = (
                collection.find({"user_id": user_id})
                .sort("created_at", -1)
                .skip(skip)
                .limit(limit)
            )
            
            prescriptions = []
            async for doc in cursor:
                doc["_id"] = str(doc["_id"])
                prescriptions.append(Prescription(**doc))
            
            return prescriptions
            
        except Exception as e:
            logger.error(f"Failed to get user prescriptions: {str(e)}")
            return []
    
    @classmethod
    async def get_prescription_by_id(cls, prescription_id: str) -> Optional[Prescription]:
        """
        Get prescription by ID
        
        Args:
            prescription_id: Prescription identifier
            
        Returns:
            Prescription if found, None otherwise
        """
        try:
            collection = MongoDB.get_collection(PRESCRIPTION_COLLECTION)
            doc = await collection.find_one({"prescription_id": prescription_id})
            
            if doc:
                doc["_id"] = str(doc["_id"])
                return Prescription(**doc)
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get prescription: {str(e)}\"")
            return None

    
    @classmethod
    async def get_prescription_by_analysis_id(cls, analysis_id: str) -> Optional[Prescription]:
        """
        Get prescription by analysis ID
        
        Args:
            analysis_id: Analysis identifier
            
        Returns:
            Prescription if found, None otherwise
        """
        try:
            collection = MongoDB.get_collection(PRESCRIPTION_COLLECTION)
            doc = await collection.find_one({"analysis_id": analysis_id})
            
            if doc:
                doc["_id"] = str(doc["_id"])
                return Prescription(**doc)
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get prescription by analysis ID: {str(e)}")
            return None
