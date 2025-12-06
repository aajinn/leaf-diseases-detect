"""
Make an existing user an admin
==============================
"""

import asyncio
import os

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()


async def make_admin():
    """Make an existing user an admin"""
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    db_name = os.getenv("MONGODB_DB_NAME", "leaf_diseases")

    client = AsyncIOMotorClient(mongodb_url)
    db = client[db_name]
    users_collection = db["users"]

    print("=" * 60)
    print("Make User Admin")
    print("=" * 60)

    # Get username
    username = input("\nEnter username to make admin: ").strip().lower()

    # Find user
    user = await users_collection.find_one({"username": username})

    if not user:
        print(f"\n❌ User '{username}' not found!")
        client.close()
        return

    if user.get("is_admin", False):
        print(f"\n✓ User '{username}' is already an admin!")
        client.close()
        return

    # Update user to admin
    result = await users_collection.update_one({"username": username}, {"$set": {"is_admin": True}})

    if result.modified_count > 0:
        print(f"\n✓ User '{username}' is now an admin!")
        print(f"\nYou can now login with:")
        print(f"  Username: {username}")
        print(f"  Password: (your existing password)")
        print(f"\nAccess admin panel at: http://localhost:8000/admin")
    else:
        print(f"\n❌ Failed to update user")

    client.close()


if __name__ == "__main__":
    asyncio.run(make_admin())
