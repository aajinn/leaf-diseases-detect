"""
Add Sample Subscription Data
===========================

Script to add sample subscription data for existing users.
"""

import asyncio
import logging
import sys
from datetime import datetime, timedelta
from pathlib import Path

# Add src to path
sys.path.append(str(Path(__file__).parent.parent))

from src.database.connection import MongoDB
from src.database.subscription_models import (
    BillingCycle,
    PaymentStatus,
    SubscriptionStatus,
    UserSubscription,
    PaymentRecord,
    UsageQuota
)
from src.services.subscription_service import (
    SubscriptionService,
    USER_SUBSCRIPTIONS_COLLECTION,
    PAYMENT_RECORDS_COLLECTION,
    USAGE_QUOTAS_COLLECTION
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Sample data for existing users
SAMPLE_SUBSCRIPTIONS = [
    {
        "user_id": "6929b59b93ac1a2767e380e2",
        "username": "ajin",
        "plan_type": "premium",
        "billing_cycle": "yearly",
        "amount_paid": 7999.0,
        "months_ago": 2
    },
    {
        "user_id": "6929dd2b4d6301c010894c86", 
        "username": "admin",
        "plan_type": "enterprise",
        "billing_cycle": "yearly",
        "amount_paid": 24999.0,
        "months_ago": 6
    },
    {
        "user_id": "6938da09b5b60bc3d44db098",
        "username": "jins1", 
        "plan_type": "basic",
        "billing_cycle": "monthly",
        "amount_paid": 299.0,
        "months_ago": 1
    }
]

async def create_sample_subscriptions():
    """Create sample subscription data"""
    try:
        await MongoDB.connect_db()
        logger.info("Connected to MongoDB")
        
        # Initialize plans first
        await SubscriptionService.initialize_default_plans()
        
        # Get plan IDs
        plans = await SubscriptionService.get_all_plans()
        plan_map = {plan.plan_type.value: str(plan.id) for plan in plans}
        
        subscriptions_collection = MongoDB.get_collection(USER_SUBSCRIPTIONS_COLLECTION)
        payments_collection = MongoDB.get_collection(PAYMENT_RECORDS_COLLECTION)
        quotas_collection = MongoDB.get_collection(USAGE_QUOTAS_COLLECTION)
        
        for sub_data in SAMPLE_SUBSCRIPTIONS:
            # Calculate dates
            start_date = datetime.utcnow() - timedelta(days=30 * sub_data["months_ago"])
            
            if sub_data["billing_cycle"] == "monthly":
                end_date = start_date + timedelta(days=30)
                next_billing = start_date + timedelta(days=30)
            elif sub_data["billing_cycle"] == "quarterly":
                end_date = start_date + timedelta(days=90)
                next_billing = start_date + timedelta(days=90)
            else:  # yearly
                end_date = start_date + timedelta(days=365)
                next_billing = start_date + timedelta(days=365)
            
            # Create subscription
            subscription = {
                "user_id": sub_data["user_id"],
                "username": sub_data["username"],
                "plan_id": plan_map[sub_data["plan_type"]],
                "plan_type": sub_data["plan_type"],
                "status": "active",
                "billing_cycle": sub_data["billing_cycle"],
                "amount_paid": sub_data["amount_paid"],
                "start_date": start_date,
                "end_date": end_date,
                "next_billing_date": next_billing,
                "analyses_used_this_month": 0,
                "last_reset_date": datetime.utcnow(),
                "payment_method": "razorpay",
                "transaction_id": f"txn_{sub_data['username']}_{sub_data['plan_type']}",
                "auto_renewal": True,
                "created_at": start_date,
                "updated_at": start_date
            }
            
            result = await subscriptions_collection.insert_one(subscription)
            subscription_id = str(result.inserted_id)
            
            # Create payment record
            payment = {
                "user_id": sub_data["user_id"],
                "username": sub_data["username"],
                "subscription_id": subscription_id,
                "amount": sub_data["amount_paid"],
                "currency": "INR",
                "payment_method": "razorpay",
                "transaction_id": f"pay_{sub_data['username']}_{sub_data['plan_type']}",
                "status": "completed",
                "payment_date": start_date,
                "billing_cycle": sub_data["billing_cycle"],
                "billing_period_start": start_date,
                "billing_period_end": end_date,
                "created_at": start_date,
                "updated_at": start_date
            }
            
            await payments_collection.insert_one(payment)
            
            # Create usage quota
            plan = next(p for p in plans if p.plan_type.value == sub_data["plan_type"])
            current_month = datetime.utcnow()
            next_reset = datetime(current_month.year, current_month.month + 1, 1) if current_month.month < 12 else datetime(current_month.year + 1, 1, 1)
            
            # Add some usage data
            usage_amounts = {"basic": 45, "premium": 120, "enterprise": 250}
            analyses_used = usage_amounts.get(sub_data["plan_type"], 5)
            
            quota = {
                "user_id": sub_data["user_id"],
                "username": sub_data["username"],
                "subscription_id": subscription_id,
                "month": current_month.month,
                "year": current_month.year,
                "analyses_used": analyses_used,
                "analyses_limit": plan.max_analyses_per_month,
                "total_api_calls": analyses_used * 2,
                "total_tokens_used": analyses_used * 1500,
                "total_cost_incurred": analyses_used * 0.02,
                "last_reset_date": datetime.utcnow(),
                "next_reset_date": next_reset,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            await quotas_collection.insert_one(quota)
            
            logger.info(f"Created subscription for {sub_data['username']}: {sub_data['plan_type']} plan")
        
        # Add some historical revenue data
        await create_historical_payments(payments_collection, plan_map)
        
        logger.info("Sample subscription data created successfully!")
        
    except Exception as e:
        logger.error(f"Failed to create sample data: {str(e)}")
        return False
    finally:
        await MongoDB.close_db()
    
    return True

async def create_historical_payments(payments_collection, plan_map):
    """Create historical payment data for revenue trends"""
    
    historical_payments = [
        # Month 1 (5 months ago)
        {"username": "user1", "plan_type": "basic", "amount": 299.0, "months_ago": 5},
        {"username": "user2", "plan_type": "basic", "amount": 299.0, "months_ago": 5},
        
        # Month 2 (4 months ago)
        {"username": "user3", "plan_type": "premium", "amount": 799.0, "months_ago": 4},
        {"username": "user4", "plan_type": "basic", "amount": 299.0, "months_ago": 4},
        {"username": "user5", "plan_type": "basic", "amount": 299.0, "months_ago": 4},
        
        # Month 3 (3 months ago)
        {"username": "user6", "plan_type": "enterprise", "amount": 2499.0, "months_ago": 3},
        {"username": "user7", "plan_type": "premium", "amount": 799.0, "months_ago": 3},
        
        # Month 4 (2 months ago)
        {"username": "user8", "plan_type": "basic", "amount": 299.0, "months_ago": 2},
        {"username": "user9", "plan_type": "premium", "amount": 799.0, "months_ago": 2},
        {"username": "user10", "plan_type": "basic", "amount": 299.0, "months_ago": 2},
        
        # Month 5 (1 month ago)
        {"username": "user11", "plan_type": "premium", "amount": 799.0, "months_ago": 1},
        {"username": "user12", "plan_type": "enterprise", "amount": 2499.0, "months_ago": 1},
    ]
    
    for payment_data in historical_payments:
        payment_date = datetime.utcnow() - timedelta(days=30 * payment_data["months_ago"])
        
        payment = {
            "user_id": f"sample_user_{payment_data['username']}",
            "username": payment_data["username"],
            "subscription_id": f"sample_sub_{payment_data['username']}",
            "amount": payment_data["amount"],
            "currency": "INR",
            "payment_method": "razorpay",
            "transaction_id": f"hist_pay_{payment_data['username']}_{payment_data['months_ago']}",
            "status": "completed",
            "payment_date": payment_date,
            "billing_cycle": "monthly",
            "billing_period_start": payment_date,
            "billing_period_end": payment_date + timedelta(days=30),
            "created_at": payment_date,
            "updated_at": payment_date
        }
        
        await payments_collection.insert_one(payment)

async def main():
    """Main function"""
    success = await create_sample_subscriptions()
    if success:
        print("\n✅ Sample subscription data created successfully!")
        print("\nCreated subscriptions:")
        print("- ajin: Premium Plan (₹7,999/year)")
        print("- admin: Enterprise Plan (₹24,999/year)")  
        print("- jins1: Basic Plan (₹299/month)")
        print("\nHistorical revenue data added for trend analysis.")
    else:
        print("\n❌ Failed to create sample subscription data")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())