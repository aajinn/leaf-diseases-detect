"""
Admin Models for API Usage Tracking and Management
==================================================
"""

from datetime import datetime
from typing import Optional

from bson import ObjectId
from pydantic import BaseModel, Field


class APIUsageRecord(BaseModel):
    """Record of API usage for tracking and billing"""

    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str
    username: str
    api_type: str  # "groq" or "perplexity"
    endpoint: str  # e.g., "disease-detection", "youtube-videos"
    model_used: Optional[str] = None
    tokens_used: Optional[int] = 0
    estimated_cost: float = 0.0
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    success: bool = True
    error_message: Optional[str] = None

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}


class APIConfig(BaseModel):
    """API Configuration settings"""

    id: Optional[str] = Field(default=None, alias="_id")
    api_type: str  # "groq" or "perplexity"
    api_key: str
    is_active: bool = True
    rate_limit_per_minute: Optional[int] = None
    rate_limit_per_day: Optional[int] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    updated_by: str

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}


class UsageStats(BaseModel):
    """Usage statistics summary"""

    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    total_tokens: int = 0
    total_cost: float = 0.0
    groq_requests: int = 0
    groq_cost: float = 0.0
    perplexity_requests: int = 0
    perplexity_cost: float = 0.0


class UserStats(BaseModel):
    """User statistics"""

    user_id: str
    username: str
    total_analyses: int = 0
    diseases_detected: int = 0
    healthy_plants: int = 0
    total_api_cost: float = 0.0
    last_activity: Optional[datetime] = None
    is_active: bool = True
    is_admin: bool = False


# API Pricing (per 1M tokens or per request)
GROQ_PRICING = {
    "meta-llama/llama-4-scout-17b-16e-instruct": {
        "input": 0.0,  # Free tier
        "output": 0.0,
    }
}

PERPLEXITY_PRICING = {
    "sonar": 0.20,  # $0.20 per 1M tokens
    "sonar-pro": 1.00,  # $1.00 per 1M tokens
}
