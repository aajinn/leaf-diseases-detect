"""
Create Admin User Script
========================

Run this script to create an admin user in the database.
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.database.connection import MongoDB, USERS_COLLECTION
from src.database.models import UserInDB
from src.auth.security import get_password_hash
from datetime import datetime


async def create_admin_user(username: str, email: str, password: str, full_name: str = None):
    """Create an admin user"""
    try:
        # Connect to database
        await MongoDB.connect_db()
        users_collection = MongoDB.get_collection(USERS_COLLECTION)
        
        # Check if user already exists
        existing_user = await users_collection.find_one({"username": username})
        if existing_user:
            print(f"❌ User '{username}' already exists!")
            return False
        
        # Create admin user
        admin_user = UserInDB(
            email=email,
            username=username,
            full_name=full_name or "Admin User",
            hashed_password=get_password_hash(password),
            is_active=True,
            is_admin=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        result = await users_collection.insert_one(admin_user.dict(by_alias=True))
        print(f"✅ Admin user '{username}' created successfully!")
        print(f"   User ID: {result.inserted_id}")
        print(f"   Email: {email}")
        print(f"   Admin: Yes")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating admin user: {str(e)}")
        return False
    finally:
        await MongoDB.close_db()


async def main():
    """Main function"""
    print("=" * 50)
    print("Create Admin User")
    print("=" * 50)
    
    # Get user input
    username = input("Enter admin username: ").strip()
    email = input("Enter admin email: ").strip()
    password = input("Enter admin password: ").strip()
    full_name = input("Enter full name (optional): ").strip()
    
    if not username or not email or not password:
        print("❌ Username, email, and password are required!")
        return
    
    # Confirm
    print("\nCreating admin user with:")
    print(f"  Username: {username}")
    print(f"  Email: {email}")
    print(f"  Full Name: {full_name or 'Admin User'}")
    
    confirm = input("\nProceed? (yes/no): ").strip().lower()
    if confirm != "yes":
        print("Cancelled.")
        return
    
    await create_admin_user(username, email, password, full_name)


if __name__ == "__main__":
    asyncio.run(main())
