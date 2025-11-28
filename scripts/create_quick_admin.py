"""
Quick Admin User Creation
=========================
Creates an admin user with default credentials for testing
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()


async def create_quick_admin():
    """Create a quick admin user for testing"""
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    db_name = os.getenv("MONGODB_DB_NAME", "leaf_diseases")
    
    client = AsyncIOMotorClient(mongodb_url)
    db = client[db_name]
    users_collection = db["users"]
    
    # Default admin credentials
    admin_data = {
        "email": "admin@leafdisease.com",
        "username": "admin",
        "password": "Admin@123",  # Change this after first login!
        "full_name": "System Administrator"
    }
    
    print("=" * 60)
    print("Quick Admin User Creation")
    print("=" * 60)
    
    # Check if admin already exists
    existing = await users_collection.find_one({"username": admin_data["username"]})
    if existing:
        print(f"\n⚠️  Admin user '{admin_data['username']}' already exists!")
        
        # Ask if want to make admin
        if not existing.get("is_admin", False):
            response = input("\nUser exists but is not admin. Make admin? (y/n): ")
            if response.lower() == 'y':
                await users_collection.update_one(
                    {"username": admin_data["username"]},
                    {"$set": {"is_admin": True}}
                )
                print(f"\n✓ User '{admin_data['username']}' is now an admin!")
        else:
            print(f"✓ User is already an admin!")
        
        client.close()
        return
    
    # Hash password
    password_bytes = admin_data["password"].encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password_bytes, salt).decode('utf-8')
    
    # Create admin user
    user_doc = {
        "email": admin_data["email"],
        "username": admin_data["username"],
        "hashed_password": hashed_password,
        "full_name": admin_data["full_name"],
        "is_active": True,
        "is_admin": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await users_collection.insert_one(user_doc)
    
    print("\n✓ Admin user created successfully!")
    print("\n" + "=" * 60)
    print("LOGIN CREDENTIALS")
    print("=" * 60)
    print(f"Email:    {admin_data['email']}")
    print(f"Username: {admin_data['username']}")
    print(f"Password: {admin_data['password']}")
    print("=" * 60)
    print("\n⚠️  IMPORTANT: Change the password after first login!")
    print("\nAccess the admin panel at: http://localhost:8000/admin")
    print("=" * 60)
    
    client.close()


if __name__ == "__main__":
    asyncio.run(create_quick_admin())
