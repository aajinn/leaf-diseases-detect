"""
API Usage Tracking Utility
==========================
"""

import logging
from datetime import datetime
from typing import Optional

from src.database.connection import MongoDB
from src.database.admin_models import GROQ_PRICING, PERPLEXITY_PRICING

logger = logging.getLogger(__name__)

API_USAGE_COLLECTION = "api_usage"


async def track_groq_usage(
    user_id: str,
    username: str,
    model: str,
    tokens_used: int,
    success: bool = True,
    error_message: Optional[str] = None
):
    """Track Groq API usage"""
    try:
        # Calculate cost (Groq is currently free)
        pricing = GROQ_PRICING.get(model, {"input": 0.0, "output": 0.0})
        estimated_cost = 0.0  # Free tier
        
        usage_record = {
            "user_id": user_id,
            "username": username,
            "api_type": "groq",
            "endpoint": "disease-detection",
            "model_used": model,
            "tokens_used": tokens_used,
            "estimated_cost": estimated_cost,
            "timestamp": datetime.utcnow(),
            "success": success,
            "error_message": error_message
        }
        
        usage_collection = MongoDB.get_collection(API_USAGE_COLLECTION)
        await usage_collection.insert_one(usage_record)
        
        logger.info(f"Tracked Groq usage for {username}: {tokens_used} tokens")
    except Exception as e:
        logger.error(f"Failed to track Groq usage: {str(e)}")


async def track_perplexity_usage(
    user_id: str,
    username: str,
    model: str,
    tokens_used: int,
    success: bool = True,
    error_message: Optional[str] = None
):
    """Track Perplexity API usage"""
    try:
        # Calculate cost
        price_per_million = PERPLEXITY_PRICING.get(model, 0.20)
        estimated_cost = (tokens_used / 1_000_000) * price_per_million
        
        usage_record = {
            "user_id": user_id,
            "username": username,
            "api_type": "perplexity",
            "endpoint": "youtube-videos",
            "model_used": model,
            "tokens_used": tokens_used,
            "estimated_cost": estimated_cost,
            "timestamp": datetime.utcnow(),
            "success": success,
            "error_message": error_message
        }
        
        usage_collection = MongoDB.get_collection(API_USAGE_COLLECTION)
        await usage_collection.insert_one(usage_record)
        
        logger.info(f"Tracked Perplexity usage for {username}: {tokens_used} tokens, ${estimated_cost:.4f}")
    except Exception as e:
        logger.error(f"Failed to track Perplexity usage: {str(e)}")
