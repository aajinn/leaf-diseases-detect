#!/usr/bin/env python3
"""
Test Subscription System
========================

Script to test subscription functionality.
"""

import asyncio
import sys
import os

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.database.connection import MongoDB
from src.services.subscription_service import SubscriptionService


async def test_subscription_system():
    """Test subscription system functionality"""
    try:
        print("🚀 Connecting to database...")
        await MongoDB.connect_db()
        
        print("📋 Testing subscription plans...")
        
        # Get all plans
        plans = await SubscriptionService.get_all_plans()
        print(f"✅ Found {len(plans)} subscription plans:")
        for plan in plans:
            print(f"  • {plan.name}: ₹{plan.monthly_price}/month ({plan.max_analyses_per_month} analyses)")
        
        # Test getting plan by name
        print("\n🔍 Testing plan lookup by name...")
        basic_plan = await SubscriptionService.get_plan_by_name("Basic")
        if basic_plan:
            print(f"✅ Found Basic plan: {basic_plan.name} (₹{basic_plan.monthly_price}/month)")
        else:
            print("❌ Basic plan not found")
        
        premium_plan = await SubscriptionService.get_plan_by_name("Premium")
        if premium_plan:
            print(f"✅ Found Premium plan: {premium_plan.name} (₹{premium_plan.monthly_price}/month)")
        else:
            print("❌ Premium plan not found")
        
        print("\n✅ Subscription system test completed successfully!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return 1
    finally:
        await MongoDB.close_db()
    
    return 0


if __name__ == "__main__":
    exit_code = asyncio.run(test_subscription_system())
    sys.exit(exit_code)