"""
API Key Authentication
=====================

Authentication system for Enterprise API keys.
"""

import logging
from datetime import datetime
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from src.database.connection import MongoDB
from src.database.models import UserInDB

logger = logging.getLogger(__name__)

# API Key security scheme
api_key_scheme = HTTPBearer(scheme_name="API Key")


class APIKeyAuth:
    """API Key authentication handler"""
    
    @staticmethod
    async def verify_api_key(credentials: HTTPAuthorizationCredentials = Depends(api_key_scheme)) -> UserInDB:
        """Verify API key and return associated user"""
        try:
            api_key = credentials.credentials
            from bson import ObjectId
            import hashlib
            
            # Validate API key format
            if not api_key.startswith("ent_"):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid API key format"
                )
            
            # Look up API key in database
            api_keys_collection = MongoDB.get_collection("enterprise_api_keys")
            api_key_hash = hashlib.sha256(api_key.encode("utf-8")).hexdigest()
            
            api_key_doc = await api_keys_collection.find_one({
                "api_key_hash": api_key_hash,
                "is_active": True,
                "expires_at": {"$gt": datetime.utcnow()}
            })
            
            if not api_key_doc:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or expired API key"
                )
            
            # Update last used timestamp and usage count
            await api_keys_collection.update_one(
                {"_id": api_key_doc["_id"]},
                {
                    "$set": {"last_used": datetime.utcnow()},
                    "$inc": {"usage_count": 1}
                }
            )
            
            # Get user associated with API key
            users_collection = MongoDB.get_collection("users")
            try:
                user_id = ObjectId(api_key_doc["user_id"])
            except Exception:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User associated with API key not found"
                )
            user_doc = await users_collection.find_one({"_id": user_id})
            
            if not user_doc:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User associated with API key not found"
                )
            
            return UserInDB(**user_doc)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"API key verification error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="API key verification failed"
            )


# Dependency for API key authentication
get_api_key_user = APIKeyAuth.verify_api_key


async def get_enterprise_api_user(user: UserInDB = Depends(get_api_key_user)) -> UserInDB:
    """Verify user has enterprise subscription for API access"""
    from src.services.subscription_service import SubscriptionService
    
    try:
        subscription = await SubscriptionService.get_user_subscription(str(user.id))
        
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Enterprise subscription required for API access"
            )
        
        plan = await SubscriptionService.get_plan_by_id(subscription.plan_id)
        if not plan or plan.plan_type.value != "enterprise":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Enterprise subscription required for API access"
            )
        
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Enterprise API user verification error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify enterprise API access"
        )
