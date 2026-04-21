#!/usr/bin/env python3
"""
Fix User Quotas
===============

Script to fix users who don't have usage quotas or subscriptions.
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.database.connection import MongoDB
from src.services.subscription_service import SubscriptionService


async def main():
    """Fix user quotas"""
    try:
        print("[*] Connecting to database...")
        await MongoDB.connect_db()
        
        users_collection = MongoDB.get_collection("users")
        
        print("[*] Finding users without subscriptions...")
        users = await users_collection.find({}).to_list(length=None)
        
        fixed_count = 0
        error_count = 0
        
        for user in users:
            try:
                user_id = str(user["_id"])
                username = user.get("username", "")
                
                # Check if user has subscription
                subscription = await SubscriptionService.get_user_subscription(user_id)
                
                if not subscription:
                    print(f"  [!] User {username} has no subscription, assigning free plan...")
                    success = await SubscriptionService.assign_free_plan(user_id, username)
                    if success:
                        print(f"  [+] Assigned free plan to {username}")
                        fixed_count += 1
                    else:
                        print(f"  [-] Failed to assign free plan to {username}")
                        error_count += 1
                else:
                    # Check if user has quota
                    quota = await SubscriptionService.get_user_usage_quota(user_id)
                    if not quota:
                        print(f"  [!] User {username} has subscription but no quota, creating...")
                        plan = await SubscriptionService.get_plan_by_id(subscription.plan_id)
                        if plan:
                            await SubscriptionService.create_usage_quota(
                                user_id=user_id,
                                username=username,
                                subscription_id=str(subscription.id),
                                analyses_limit=plan.max_analyses_per_month
                            )
                            print(f"  [+] Created quota for {username}")
                            fixed_count += 1
                        else:
                            print(f"  [-] Plan not found for {username}")
                            error_count += 1
            except Exception as user_error:
                print(f"  [-] Error processing user {username}: {user_error}")
                error_count += 1
                continue
        
        print(f"\n[+] Fixed {fixed_count} users!")
        if error_count > 0:
            print(f"[!] {error_count} users had errors")
        
    except Exception as e:
        print(f"[-] Error: {e}")
        import traceback
        traceback.print_exc()
        return 1
    finally:
        await MongoDB.close_db()
    
    return 0


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
