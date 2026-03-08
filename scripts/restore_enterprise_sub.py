"""Restore enterprise subscription"""
import asyncio
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
DATABASE_NAME = os.getenv("MONGODB_DB_NAME")

async def restore():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    users = db["users"]
    subs = db["user_subscriptions"]
    quotas = db["usage_quotas"]
    plans = db["subscription_plans"]
    
    # Get enterprise user
    user = await users.find_one({"username": "enterprise"})
    user_id = str(user["_id"])
    
    # Get enterprise plan
    ent_plan = await plans.find_one({"plan_type": "enterprise"})
    
    # Delete wrong subscription
    await subs.delete_many({"user_id": user_id})
    await quotas.delete_many({"user_id": user_id})
    
    # Create correct subscription
    now = datetime.utcnow()
    sub_data = {
        "user_id": user_id,
        "username": "enterprise",
        "plan_id": ObjectId(ent_plan["_id"]),
        "plan_type": "enterprise",
        "status": "active",
        "billing_cycle": "monthly",
        "amount_paid": 25.0,
        "start_date": now,
        "end_date": now + timedelta(days=30),
        "next_billing_date": now + timedelta(days=30),
        "analyses_used_this_month": 0,
        "last_reset_date": now,
        "payment_method": "razorpay",
        "transaction_id": "test_ent",
        "auto_renewal": True,
        "created_at": now,
        "updated_at": now
    }
    
    result = await subs.insert_one(sub_data)
    print(f"Created subscription: {result.inserted_id}")
    
    # Create quota
    next_reset = datetime(now.year, now.month + 1, 1) if now.month < 12 else datetime(now.year + 1, 1, 1)
    quota_data = {
        "user_id": user_id,
        "username": "enterprise",
        "subscription_id": str(result.inserted_id),
        "month": now.month,
        "year": now.year,
        "analyses_used": 0,
        "analyses_limit": 0,  # Unlimited
        "total_api_calls": 0,
        "total_tokens_used": 0,
        "total_cost_incurred": 0.0,
        "last_reset_date": now,
        "next_reset_date": next_reset,
        "created_at": now,
        "updated_at": now
    }
    
    await quotas.insert_one(quota_data)
    print("Created quota with unlimited (0)")
    
    client.close()

asyncio.run(restore())
