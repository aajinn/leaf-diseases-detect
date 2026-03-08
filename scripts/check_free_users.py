"""Check free plan users"""
import asyncio
import os
from datetime import datetime
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
DATABASE_NAME = os.getenv("MONGODB_DB_NAME")

async def check():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    subs = db["user_subscriptions"]
    quotas = db["usage_quotas"]
    
    # Find free plan users
    free_subs = await subs.find({"plan_type": "free", "status": "active"}).to_list(length=None)
    
    print(f"Found {len(free_subs)} free plan users\n")
    
    now = datetime.utcnow()
    
    for sub in free_subs:
        username = sub["username"]
        user_id = sub["user_id"]
        
        quota = await quotas.find_one({
            "user_id": user_id,
            "month": now.month,
            "year": now.year
        })
        
        if quota:
            print(f"{username}: {quota.get('analyses_used', 0)}/{quota.get('analyses_limit', 0)}")
        else:
            print(f"{username}: NO QUOTA")
    
    client.close()

asyncio.run(check())
