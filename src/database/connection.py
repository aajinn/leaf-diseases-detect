"""
MongoDB Connection Manager
=========================

Handles MongoDB connection and database operations.
"""

import logging
import os

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()
logger = logging.getLogger(__name__)


class MongoDB:
    """MongoDB connection manager"""

    client: AsyncIOMotorClient = None

    @classmethod
    async def connect_db(cls):
        """Connect to MongoDB"""
        try:
            mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
            cls.client = AsyncIOMotorClient(mongodb_url)
            # Test connection
            await cls.client.admin.command("ping")
            logger.info("Successfully connected to MongoDB")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {str(e)}")
            raise

    @classmethod
    async def close_db(cls):
        """Close MongoDB connection"""
        if cls.client:
            cls.client.close()
            logger.info("MongoDB connection closed")

    @classmethod
    def get_database(cls):
        """Get database instance"""
        db_name = os.getenv("MONGODB_DB_NAME", "leaf_disease_db")
        return cls.client[db_name]

    @classmethod
    def get_collection(cls, collection_name: str):
        """Get collection instance"""
        db = cls.get_database()
        return db[collection_name]


# Collection names
USERS_COLLECTION = "users"
ANALYSIS_COLLECTION = "analysis_records"
SUBSCRIPTION_PLANS_COLLECTION = "subscription_plans"
USER_SUBSCRIPTIONS_COLLECTION = "user_subscriptions"
PAYMENT_RECORDS_COLLECTION = "payment_records"
USAGE_QUOTAS_COLLECTION = "usage_quotas"
