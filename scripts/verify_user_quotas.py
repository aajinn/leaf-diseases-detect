#!/usr/bin/env python3
"""
Verify User Quotas
==================

Script to verify all users have proper quotas and subscriptions.
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.database.connection import MongoDB
from src.services.subscription_service import SubscriptionService


async def main():
    """Verify user quotas"""
    try:
        print("[*] Connecting to database...")
        await MongoDB.connect_db()
        
        users_collection = MongoDB.get_collection("users")
        
        print("[*] Checking all users...\n")
        users = await users_collection.find({}).to_list(length=None)
        
        total_users = len(users)
        users_ok = 0
        users_missing_subscription = 0
        users_missing_quota = 0
        
        for user in users:
            user_id = str(user["_id"])
            username = user.get("username", "")
            
            # Check subscription
            subscription = await SubscriptionService.get_user_subscription(user_id)
            
            # Check quota
            quota = await SubscriptionService.get_user_usage_quota(user_id)
            
            if not subscription:
                print(f"  [-] {username}: NO SUBSCRIPTION")
                users_missing_subscription += 1
            elif not quota:
                print(f"  [-] {username}: NO QUOTA (has subscription)")
                users_missing_quota += 1
            else:
                plan = await SubscriptionService.get_plan_by_id(subscription.plan_id)
                plan_name = plan.name if plan else "Unknown"
                print(f"  [+] {username}: {plan_name} - {quota.analyses_used}/{quota.analyses_limit} analyses used")
                users_ok += 1
        
        print(f"\n{'='*50}")
        print(f"Total Users: {total_users}")
        print(f"Users OK: {users_ok}")
        print(f"Missing Subscription: {users_missing_subscription}")
        print(f"Missing Quota: {users_missing_quota}")
        print(f"{'='*50}")
        
        if users_missing_subscription > 0 or users_missing_quota > 0:
            print("\n[!] Run fix_user_quotas.py to fix issues")
            return 1
        else:
            print("\n[+] All users have proper quotas!")
            return 0
        
    except Exception as e:
        print(f"[-] Error: {e}")
        import traceback
        traceback.print_exc()
        return 1
    finally:
        await MongoDB.close_db()


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
