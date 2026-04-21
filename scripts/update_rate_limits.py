#!/usr/bin/env python3
"""
Update Rate Limits
==================

Script to update existing subscription plans with new rate limits.
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.database.connection import MongoDB


async def main():
    """Update rate limits"""
    try:
        print("[*] Connecting to database...")
        await MongoDB.connect_db()
        
        plans_collection = MongoDB.get_collection("subscription_plans")
        
        # New rate limits
        rate_limits = {
            "free": 30,
            "basic": 60,
            "premium": 120,
            "enterprise": 300
        }
        
        print("[*] Updating rate limits for all plans...\n")
        
        for plan_type, rate_limit in rate_limits.items():
            result = await plans_collection.update_one(
                {"plan_type": plan_type},
                {"$set": {"api_rate_limit_per_minute": rate_limit}}
            )
            
            if result.modified_count > 0:
                print(f"  [+] Updated {plan_type} plan: {rate_limit} requests/minute")
            else:
                print(f"  [!] {plan_type} plan not found or already updated")
        
        print("\n[+] Rate limits updated successfully!")
        
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
