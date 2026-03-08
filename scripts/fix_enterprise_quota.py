"""
Fix Enterprise User Quotas
===========================

Updates enterprise users to have unlimited (0) quota.
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


async def fix_enterprise_quotas():
    """Fix enterprise user quotas to unlimited"""
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    subscriptions_collection = db["user_subscriptions"]
    quotas_collection = db["usage_quotas"]
    plans_collection = db["subscription_plans"]
    
    # Get enterprise plan
    enterprise_plan = await plans_collection.find_one({"plan_type": "enterprise"})
    if not enterprise_plan:
        logger.error("Enterprise plan not found!")
        return
    
    logger.info(f"Enterprise plan: {enterprise_plan['name']}, limit: {enterprise_plan['max_analyses_per_month']}")
    
    # Find all enterprise subscriptions
    enterprise_subs = await subscriptions_collection.find({
        "plan_type": "enterprise",
        "status": "active"
    }).to_list(length=None)
    
    logger.info(f"Found {len(enterprise_subs)} enterprise subscriptions")
    
    fixed_count = 0
    
    for sub in enterprise_subs:
        user_id = sub["user_id"]
        username = sub["username"]
        
        logger.info(f"Processing user: {username}")
        
        # Update or create quota with unlimited (0)
        now = datetime.utcnow()
        next_reset = datetime(now.year, now.month + 1, 1) if now.month < 12 else datetime(now.year + 1, 1, 1)
        
        result = await quotas_collection.update_one(
            {
                "user_id": user_id,
                "month": now.month,
                "year": now.year
            },
            {
                "$set": {
                    "analyses_limit": 0,  # 0 = unlimited
                    "analyses_used": 0,   # Initialize if missing
                    "updated_at": now
                }
            },
            upsert=True
        )
        
        if result.modified_count > 0 or result.upserted_id:
            logger.info(f"✅ Fixed quota for {username}")
            fixed_count += 1
        else:
            logger.info(f"⚠️ No changes for {username}")
    
    logger.info(f"\n✅ Fixed {fixed_count} enterprise user quotas")
    
    client.close()


if __name__ == "__main__":
    asyncio.run(fix_enterprise_quotas())
