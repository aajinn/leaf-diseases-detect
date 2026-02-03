#!/usr/bin/env python3
"""
Initialize Subscription Plans
============================

Script to initialize default subscription plans in the database.
"""

import asyncio
import sys
import os

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.database.connection import MongoDB
from src.services.subscription_service import SubscriptionService


async def main():
    """Initialize subscription plans"""
    try:
        print("🚀 Connecting to database...")
        await MongoDB.connect_db()
        
        print("📋 Initializing subscription plans...")
        await SubscriptionService.initialize_default_plans()
        
        print("✅ Subscription plans initialized successfully!")
        
        # Display created plans
        plans = await SubscriptionService.get_all_plans()
        print(f"\n📊 Created {len(plans)} subscription plans:")
        for plan in plans:
            print(f"  • {plan.name}: ₹{plan.monthly_price}/month ({plan.max_analyses_per_month} analyses)")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return 1
    finally:
        await MongoDB.close_db()
    
    return 0


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)