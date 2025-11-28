"""
Database Models for Leaf Disease Detection System
================================================

MongoDB models for users, admins, and image analysis records.
"""

from datetime import datetime
from typing import Optional, List, Annotated
from pydantic import BaseModel, EmailStr, Field, BeforeValidator
from bson import ObjectId


def validate_object_id(v: any) -> ObjectId:
    """Validate and convert to ObjectId"""
    if isinstance(v, ObjectId):
        return v
    if ObjectId.is_valid(v):
        return ObjectId(v)
    raise ValueError("Invalid ObjectId")


# Pydantic v2 compatible ObjectId type
PyObjectId = Annotated[ObjectId, BeforeValidator(validate_object_id)]


class UserBase(BaseModel):
    """Base user model"""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50, pattern="^[a-zA-Z0-9_-]+$")
    full_name: Optional[str] = Field(None, max_length=100)
    is_active: bool = True
    is_admin: bool = False


class UserCreate(UserBase):
    """User creation model"""
    password: str = Field(..., min_length=8, max_length=72)
    
    @classmethod
    def validate_password(cls, password: str) -> str:
        """Validate password strength"""
        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if len(password) > 72:
            raise ValueError("Password must be less than 72 characters")
        if not any(c.isupper() for c in password):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in password):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in password):
            raise ValueError("Password must contain at least one number")
        return password


class UserInDB(UserBase):
    """User model as stored in database"""
    id: Optional[PyObjectId] = Field(default_factory=ObjectId, alias="_id")
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        json_schema_extra = {
            "example": {
                "_id": "507f1f77bcf86cd799439011",
                "email": "user@example.com",
                "username": "username",
                "full_name": "Full Name",
                "is_active": True,
                "is_admin": False
            }
        }


class User(UserBase):
    """User response model"""
    id: str = Field(alias="_id")
    created_at: datetime
    
    class Config:
        populate_by_name = True


class Token(BaseModel):
    """JWT token response"""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token payload data"""
    username: Optional[str] = None
    is_admin: bool = False


class YouTubeVideo(BaseModel):
    """YouTube video recommendation"""
    title: str
    video_id: str
    url: str
    thumbnail: str
    description: Optional[str] = None


class AnalysisRecord(BaseModel):
    """Disease analysis record"""
    id: Optional[PyObjectId] = Field(default_factory=ObjectId, alias="_id")
    user_id: str
    username: str
    image_filename: str
    image_path: str
    disease_detected: bool
    disease_name: Optional[str] = None
    disease_type: str
    severity: str
    confidence: float
    symptoms: List[str] = []
    possible_causes: List[str] = []
    treatment: List[str] = []
    youtube_videos: List[YouTubeVideo] = []
    analysis_timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        json_schema_extra = {
            "example": {
                "_id": "507f1f77bcf86cd799439011",
                "user_id": "507f1f77bcf86cd799439012",
                "username": "username",
                "image_filename": "20240101_120000_abc123.jpg",
                "disease_detected": True,
                "disease_name": "Brown Spot Disease",
                "disease_type": "fungal",
                "severity": "moderate",
                "confidence": 87.5
            }
        }


class AnalysisResponse(BaseModel):
    """Analysis response with record ID"""
    id: str
    disease_detected: bool
    disease_name: Optional[str]
    disease_type: str
    severity: str
    confidence: float
    symptoms: List[str]
    possible_causes: List[str]
    treatment: List[str]
    youtube_videos: List[YouTubeVideo] = []
    analysis_timestamp: datetime
