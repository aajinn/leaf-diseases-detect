#!/usr/bin/env python3
"""Update subscription plan pricing in database"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.database.connection import MongoDB


async def main():
    try:
        await MongoDB.connect_db()
        
        plans_collection = MongoDB.get_collection("subscription_plans")
        
        # Update Basic Plan
        result = await plans_collection.update_one(
            {"name": "Basic Plan"},
            {"$set": {
                "monthly_price": 10.0,
                "quarterly_price": 27.0,
                "yearly_price": 100.0
            }}
        )
        print(f"Basic Plan: {result.modified_count} updated")
        
        # Update Premium Plan
        result = await plans_collection.update_one(
            {"name": "Premium Plan"},
            {"$set": {
                "monthly_price": 15.0,
                "quarterly_price": 40.0,
                "yearly_price": 150.0
            }}
        )
        print(f"Premium Plan: {result.modified_count} updated")
        
        # Update Enterprise Plan
        result = await plans_collection.update_one(
            {"name": "Enterprise Plan"},
            {"$set": {
                "monthly_price": 25.0,
                "quarterly_price": 67.0,
                "yearly_price": 250.0
            }}
        )
        print(f"Enterprise Plan: {result.modified_count} updated")
        
        # Verify
        plans = await plans_collection.find({}).to_list(None)
        print("\nUpdated pricing:")
        for plan in plans:
            print(f"• {plan['name']}: ₹{plan['monthly_price']}/month")
        
    except Exception as e:
        print(f"Error: {e}")
        return 1
    finally:
        await MongoDB.close_db()
    
    return 0


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
