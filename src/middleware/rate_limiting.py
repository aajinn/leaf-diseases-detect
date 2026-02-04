"""
Rate Limiting Middleware
=======================

Rate limiting for Enterprise API endpoints based on subscription plans.
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, Optional

from fastapi import HTTPException, Request, Response, status
from starlette.middleware.base import BaseHTTPMiddleware

from src.database.connection import MongoDB

logger = logging.getLogger(__name__)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware for API endpoints"""
    
    def __init__(self, app):
        super().__init__(app)
        self.rate_limits: Dict[str, Dict] = {}
    
    async def dispatch(self, request: Request, call_next) -> Response:
        """Process request with rate limiting"""
        
        # Only apply rate limiting to API endpoints
        if not request.url.path.startswith("/api/"):
            return await call_next(request)
        
        # Skip rate limiting for health checks
        if request.url.path.endswith("/health"):
            return await call_next(request)
        
        try:
            # Get user identifier from request
            user_id = await self._get_user_id(request)
            if not user_id:
                return await call_next(request)
            
            # Get rate limit for user
            rate_limit = await self._get_user_rate_limit(user_id)
            if not rate_limit:
                return await call_next(request)
            
            # Check rate limit
            if not await self._check_rate_limit(user_id, rate_limit):
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Rate limit exceeded. Maximum {rate_limit} requests per minute."
                )
            
            # Process request
            response = await call_next(request)
            
            # Add rate limit headers
            remaining = await self._get_remaining_requests(user_id, rate_limit)
            response.headers["X-RateLimit-Limit"] = str(rate_limit)
            response.headers["X-RateLimit-Remaining"] = str(remaining)
            response.headers["X-RateLimit-Reset"] = str(int((datetime.utcnow() + timedelta(minutes=1)).timestamp()))
            
            return response
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Rate limiting error: {str(e)}")
            return await call_next(request)
    
    async def _get_user_id(self, request: Request) -> Optional[str]:
        """Extract user ID from request"""
        try:
            # Check for API key in Authorization header
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer ent_"):
                # API key authentication
                api_keys_collection = MongoDB.get_collection("enterprise_api_keys")
                api_key_doc = await api_keys_collection.find_one({
                    "is_active": True,
                    "expires_at": {"$gt": datetime.utcnow()}
                })
                return api_key_doc["user_id"] if api_key_doc else None
            
            # Check for JWT token (regular authentication)
            if auth_header and auth_header.startswith("Bearer "):
                from jose import jwt
                from src.auth.security import SECRET_KEY, ALGORITHM
                
                token = auth_header.split(" ")[1]
                payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                username = payload.get("sub")
                
                if username:
                    users_collection = MongoDB.get_collection("users")
                    user_doc = await users_collection.find_one({"username": username})
                    return str(user_doc["_id"]) if user_doc else None
            
            return None
            
        except Exception as e:
            logger.error(f"Error extracting user ID: {str(e)}")
            return None
    
    async def _get_user_rate_limit(self, user_id: str) -> Optional[int]:
        """Get rate limit for user based on subscription"""
        try:
            from src.services.subscription_service import SubscriptionService
            
            subscription = await SubscriptionService.get_user_subscription(user_id)
            if not subscription:
                return 60  # Default rate limit
            
            plan = await SubscriptionService.get_plan_by_id(subscription.plan_id)
            return plan.api_rate_limit_per_minute if plan else 60
            
        except Exception as e:
            logger.error(f"Error getting rate limit: {str(e)}")
            return 60
    
    async def _check_rate_limit(self, user_id: str, rate_limit: int) -> bool:
        """Check if user is within rate limit"""
        try:
            now = datetime.utcnow()
            minute_key = now.strftime("%Y-%m-%d-%H-%M")
            
            # Get current minute's request count from database
            rate_limit_collection = MongoDB.get_collection("rate_limits")
            
            rate_limit_doc = await rate_limit_collection.find_one({
                "user_id": user_id,
                "minute_key": minute_key
            })
            
            current_count = rate_limit_doc["count"] if rate_limit_doc else 0
            
            if current_count >= rate_limit:
                return False
            
            # Increment counter
            await rate_limit_collection.update_one(
                {"user_id": user_id, "minute_key": minute_key},
                {
                    "$inc": {"count": 1},
                    "$set": {"updated_at": now}
                },
                upsert=True
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Error checking rate limit: {str(e)}")
            return True  # Allow request on error
    
    async def _get_remaining_requests(self, user_id: str, rate_limit: int) -> int:
        """Get remaining requests for current minute"""
        try:
            now = datetime.utcnow()
            minute_key = now.strftime("%Y-%m-%d-%H-%M")
            
            rate_limit_collection = MongoDB.get_collection("rate_limits")
            rate_limit_doc = await rate_limit_collection.find_one({
                "user_id": user_id,
                "minute_key": minute_key
            })
            
            current_count = rate_limit_doc["count"] if rate_limit_doc else 0
            return max(0, rate_limit - current_count)
            
        except Exception as e:
            logger.error(f"Error getting remaining requests: {str(e)}")
            return 0