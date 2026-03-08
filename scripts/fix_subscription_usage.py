"""
Fix Subscription Usage Issues
==============================

Migrates existing users to proper subscription system with usage quotas.
"""

import asyncio
import logging
import os
from datetime import datetime

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("MONGODB_DB_NAME", "leaf_disease_db")


async def fix_subscription_usage():
    """Fix subscription usage for all users"""
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    users_collection = db["users"]
    subscriptions_collection = db["user_subscriptions"]
    quotas_collection = db["usage_quotas"]
    plans_collection = db["subscription_plans"]
    
    # Get free plan
    free_plan = await plans_collection.find_one({"plan_type": "free"})
    if not free_plan:
        logger.error("Free plan not found! Run initialize_subscription_plans.py first")
        return
    
    logger.info(f"Free plan found: {free_plan['name']}")
    
    # Get all users
    users_cursor = users_collection.find({})
    users = await users_cursor.to_list(length=None)
    
    logger.info(f"Found {len(users)} users to process")
    
    fixed_count = 0
    skipped_count = 0
    
    for user in users:
        user_id = str(user["_id"])
        username = user["username"]
        
        # Check if user has subscription
        subscription = await subscriptions_collection.find_one({"user_id": user_id})
        
        if not subscription:
            logger.info(f"User {username} has no subscription - assigning free plan")
            
            # Create free subscription
            now = datetime.utcnow()
            from datetime import timedelta
            
            subscription_data = {
                "user_id": user_id,
                "username": username,
                "plan_id": str(free_plan["_id"]),
                "plan_type": "free",
                "status": "active",
                "billing_cycle": "monthly",
                "amount_paid": 0.0,
                "start_date": now,
                "end_date": now + timedelta(days=365),  # Free plan lasts 1 year
                "next_billing_date": None,
                "analyses_used_this_month": 0,
                "last_reset_date": now,
                "payment_method": "free",
                "transaction_id": "free_plan",
                "auto_renewal": True,
                "created_at": now,
                "updated_at": now
            }
            
            result = await subscriptions_collection.insert_one(subscription_data)
            subscription_id = str(result.inserted_id)
            logger.info(f"Created subscription {subscription_id} for {username}")
            
            # Create usage quota
            next_reset = datetime(now.year, now.month + 1, 1) if now.month < 12 else datetime(now.year + 1, 1, 1)
            
            quota_data = {
                "user_id": user_id,
                "username": username,
                "subscription_id": subscription_id,
                "month": now.month,
                "year": now.year,
                "analyses_used": user.get("analyses_this_month", 0),  # Migrate existing usage
                "analyses_limit": free_plan["max_analyses_per_month"],
                "total_api_calls": 0,
                "total_tokens_used": 0,
                "total_cost_incurred": 0.0,
                "last_reset_date": now,
                "next_reset_date": next_reset,
                "created_at": now,
                "updated_at": now
            }
            
            await quotas_collection.insert_one(quota_data)
            logger.info(f"Created usage quota for {username} with {quota_data['analyses_used']} used")
            
            fixed_count += 1
        else:
            # Check if quota exists
            now = datetime.utcnow()
            quota = await quotas_collection.find_one({
                "user_id": user_id,
                "month": now.month,
                "year": now.year
            })
            
            if not quota:
                logger.info(f"User {username} has subscription but no quota - creating quota")
                
                # Get plan details
                plan = await plans_collection.find_one({"_id": subscription["plan_id"]})
                if not plan:
                    logger.warning(f"Plan not found for subscription {subscription['_id']}")
                    continue
                
                next_reset = datetime(now.year, now.month + 1, 1) if now.month < 12 else datetime(now.year + 1, 1, 1)
                
                quota_data = {
                    "user_id": user_id,
                    "username": username,
                    "subscription_id": str(subscription["_id"]),
                    "month": now.month,
                    "year": now.year,
                    "analyses_used": subscription.get("analyses_used_this_month", 0),
                    "analyses_limit": plan["max_analyses_per_month"],
                    "total_api_calls": 0,
                    "total_tokens_used": 0,
                    "total_cost_incurred": 0.0,
                    "last_reset_date": now,
                    "next_reset_date": next_reset,
                    "created_at": now,
                    "updated_at": now
                }
                
                await quotas_collection.insert_one(quota_data)
                logger.info(f"Created usage quota for {username}")
                fixed_count += 1
            else:
                skipped_count += 1
    
    logger.info(f"\n✅ Migration complete!")
    logger.info(f"Fixed: {fixed_count} users")
    logger.info(f"Skipped: {skipped_count} users (already configured)")
    
    client.close()


if __name__ == "__main__":
    asyncio.run(fix_subscription_usage())
