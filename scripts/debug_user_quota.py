"""
Debug User Quota
================

Check specific user's subscription and quota details.
"""

import asyncio
import logging
import os
import sys

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("MONGODB_DB_NAME", "leaf_disease_db")


async def debug_user(username: str):
    """Debug user's subscription and quota"""
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    users_collection = db["users"]
    subscriptions_collection = db["user_subscriptions"]
    quotas_collection = db["usage_quotas"]
    plans_collection = db["subscription_plans"]
    
    # Get user
    user = await users_collection.find_one({"username": username})
    if not user:
        logger.error(f"User '{username}' not found")
        return
    
    user_id = str(user["_id"])
    logger.info(f"\n=== User: {username} (ID: {user_id}) ===")
    
    # Get subscription
    subscription = await subscriptions_collection.find_one({"user_id": user_id})
    if subscription:
        logger.info(f"\nSubscription:")
        logger.info(f"  Plan ID: {subscription['plan_id']}")
        logger.info(f"  Plan Type: {subscription['plan_type']}")
        logger.info(f"  Status: {subscription['status']}")
        
        # Get plan
        plan = await plans_collection.find_one({"_id": subscription["plan_id"]})
        if plan:
            logger.info(f"\nPlan Details:")
            logger.info(f"  Name: {plan['name']}")
            logger.info(f"  Max Analyses: {plan['max_analyses_per_month']}")
    else:
        logger.warning("No subscription found")
    
    # Get quota
    from datetime import datetime
    now = datetime.utcnow()
    quota = await quotas_collection.find_one({
        "user_id": user_id,
        "month": now.month,
        "year": now.year
    })
    
    if quota:
        logger.info(f"\nUsage Quota:")
        logger.info(f"  Analyses Used: {quota.get('analyses_used', 'N/A')}")
        logger.info(f"  Analyses Limit: {quota.get('analyses_limit', 'N/A')}")
        logger.info(f"  Month/Year: {quota.get('month', 'N/A')}/{quota.get('year', 'N/A')}")
        logger.info(f"  Full quota doc: {quota}")
    else:
        logger.warning("No usage quota found for current month")
    
    client.close()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/debug_user_quota.py <username>")
        sys.exit(1)
    
    username = sys.argv[1]
    asyncio.run(debug_user(username))
