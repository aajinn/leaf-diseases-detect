"""Test check_usage_limit logic"""
import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
DATABASE_NAME = os.getenv("MONGODB_DB_NAME")

async def test():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    users = db["users"]
    quotas = db["usage_quotas"]
    
    user = await users.find_one({"username": "enterprise"})
    user_id = str(user["_id"])
    
    from datetime import datetime
    now = datetime.utcnow()
    
    quota = await quotas.find_one({
        "user_id": user_id,
        "month": now.month,
        "year": now.year
    })
    
    print(f"User ID: {user_id}")
    print(f"Quota found: {quota is not None}")
    if quota:
        print(f"Analyses used: {quota.get('analyses_used')}")
        print(f"Analyses limit: {quota.get('analyses_limit')}")
        print(f"Limit == 0: {quota.get('analyses_limit') == 0}")
        print(f"Should allow: {quota.get('analyses_limit') == 0}")
    
    client.close()

asyncio.run(test())
