"""
API Usage Tracking Utility
==========================
"""

import logging
from datetime import datetime
from typing import Optional

from src.database.admin_models import GROQ_PRICING, PERPLEXITY_PRICING
from src.database.connection import MongoDB

logger = logging.getLogger(__name__)

API_USAGE_COLLECTION = "api_usage"


async def track_groq_usage(
    user_id: str,
    username: str,
    model: str,
    tokens_used: int,
    success: bool = True,
    error_message: Optional[str] = None,
    input_tokens: Optional[int] = None,
    output_tokens: Optional[int] = None,
):
    """
    Track Groq API usage with cost calculation
    
    Args:
        user_id: User identifier
        username: Username
        model: Model name used
        tokens_used: Total tokens used (fallback if input/output not provided)
        success: Whether the API call was successful
        error_message: Error message if failed
        input_tokens: Number of input tokens (prompt)
        output_tokens: Number of output tokens (completion)
    """
    try:
        # Get pricing for the model
        pricing = GROQ_PRICING.get(
            model, {"input": 0.05, "output": 0.08}
        )  # Default to llama-4-scout pricing
        
        # Calculate cost based on input/output tokens if available
        if input_tokens is not None and output_tokens is not None:
            input_cost = (input_tokens / 1_000_000) * pricing["input"]
            output_cost = (output_tokens / 1_000_000) * pricing["output"]
            estimated_cost = input_cost + output_cost
            total_tokens = input_tokens + output_tokens
        else:
            # Fallback: estimate 70% input, 30% output split
            input_tokens_est = int(tokens_used * 0.7)
            output_tokens_est = int(tokens_used * 0.3)
            input_cost = (input_tokens_est / 1_000_000) * pricing["input"]
            output_cost = (output_tokens_est / 1_000_000) * pricing["output"]
            estimated_cost = input_cost + output_cost
            total_tokens = tokens_used

        usage_record = {
            "user_id": user_id,
            "username": username,
            "api_type": "groq",
            "endpoint": "disease-detection",
            "model_used": model,
            "tokens_used": total_tokens,
            "input_tokens": input_tokens or input_tokens_est,
            "output_tokens": output_tokens or output_tokens_est,
            "estimated_cost": estimated_cost,
            "timestamp": datetime.utcnow(),
            "success": success,
            "error_message": error_message,
        }

        usage_collection = MongoDB.get_collection(API_USAGE_COLLECTION)
        await usage_collection.insert_one(usage_record)

        logger.info(
            f"Tracked Groq usage for {username}: {total_tokens} tokens, ${estimated_cost:.6f}"
        )
    except Exception as e:
        logger.error(f"Failed to track Groq usage: {str(e)}")


async def track_perplexity_usage(
    user_id: str,
    username: str,
    model: str,
    tokens_used: int,
    success: bool = True,
    error_message: Optional[str] = None,
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
            "error_message": error_message,
        }

        usage_collection = MongoDB.get_collection(API_USAGE_COLLECTION)
        await usage_collection.insert_one(usage_record)

        logger.info(
            f"Tracked Perplexity usage for {username}: {tokens_used} tokens, ${estimated_cost:.4f}"
        )
    except Exception as e:
        logger.error(f"Failed to track Perplexity usage: {str(e)}")
