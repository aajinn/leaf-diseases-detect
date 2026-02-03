"""
Test Subscription Data
=====================

Quick test to check if subscription data exists and endpoint works.
"""

import asyncio
import sys
from pathlib import Path

# Add src to path
sys.path.append(str(Path(__file__).parent.parent))

from src.database.connection import MongoDB
from src.services.subscription_service import (
    USER_SUBSCRIPTIONS_COLLECTION,
    PAYMENT_RECORDS_COLLECTION,
    USAGE_QUOTAS_COLLECTION
)

async def test_subscription_data():
    """Test if subscription data exists"""
    try:
        await MongoDB.connect_db()
        print("✅ Connected to MongoDB")
        
        # Check subscriptions
        subs_collection = MongoDB.get_collection(USER_SUBSCRIPTIONS_COLLECTION)
        sub_count = await subs_collection.count_documents({})
        print(f"📊 Subscriptions: {sub_count}")
        
        if sub_count > 0:
            subs = await subs_collection.find({}).to_list(length=10)
            for sub in subs:
                print(f"  - {sub['username']}: {sub['plan_type']} ({sub['status']})")
        
        # Check payments
        payments_collection = MongoDB.get_collection(PAYMENT_RECORDS_COLLECTION)
        payment_count = await payments_collection.count_documents({})
        print(f"💳 Payments: {payment_count}")
        
        # Check usage quotas
        quotas_collection = MongoDB.get_collection(USAGE_QUOTAS_COLLECTION)
        quota_count = await quotas_collection.count_documents({})
        print(f"📈 Usage Quotas: {quota_count}")
        
        # Test revenue calculation
        revenue_pipeline = [
            {"$match": {"status": "completed"}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]
        revenue_result = await payments_collection.aggregate(revenue_pipeline).to_list(1)
        total_revenue = revenue_result[0]["total"] if revenue_result else 0
        print(f"💰 Total Revenue: ₹{total_revenue}")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    finally:
        await MongoDB.close_db()

if __name__ == "__main__":
    asyncio.run(test_subscription_data())