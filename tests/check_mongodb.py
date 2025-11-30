"""Quick script to check MongoDB connection"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def check_mongodb():
    try:
        mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
        print(f"Connecting to MongoDB at: {mongodb_url}")
        
        client = AsyncIOMotorClient(mongodb_url, serverSelectionTimeoutMS=5000)
        
        # Test connection
        await client.admin.command('ping')
        print("✓ MongoDB is running and accessible!")
        
        # List databases
        db_list = await client.list_database_names()
        print(f"✓ Available databases: {db_list}")
        
        client.close()
        return True
    except Exception as e:
        print(f"✗ MongoDB connection failed: {str(e)}")
        print("\nPlease make sure MongoDB is running:")
        print("  1. Open a new CMD window")
        print("  2. Run: mongod")
        print("  3. Keep that window open")
        return False

if __name__ == "__main__":
    asyncio.run(check_mongodb())
