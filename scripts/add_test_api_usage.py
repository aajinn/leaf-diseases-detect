"""
Add test API usage records for pagination testing
"""

import asyncio
import random
import sys
from datetime import datetime, timedelta
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.database.connection import MongoDB

API_USAGE_COLLECTION = "api_usage"


async def add_test_records():
    """Add 50 test API usage records"""
    await MongoDB.connect_db()

    try:
        collection = MongoDB.get_collection(API_USAGE_COLLECTION)

        # Check existing count
        existing_count = await collection.count_documents({})
        print(f"📊 Existing API usage records: {existing_count}")

        if existing_count >= 50:
            print("✅ Already have enough records for pagination testing")
            return

        # Sample data
        usernames = ["admin", "testuser", "john_doe", "jane_smith", "demo_user"]
        api_types = ["groq", "perplexity"]
        endpoints = ["/disease-detection", "/prescription", "/analysis"]
        models = ["llama-3.1-70b-versatile", "sonar"]

        records = []
        for i in range(50):
            timestamp = datetime.utcnow() - timedelta(
                days=random.randint(0, 30), hours=random.randint(0, 23)
            )
            api_type = random.choice(api_types)

            record = {
                "username": random.choice(usernames),
                "api_type": api_type,
                "endpoint": random.choice(endpoints),
                "model_used": models[0] if api_type == "groq" else models[1],
                "tokens_used": random.randint(100, 5000),
                "estimated_cost": round(random.uniform(0.0001, 0.05), 4),
                "timestamp": timestamp,
                "success": random.choice([True, True, True, False]),  # 75% success rate
            }
            records.append(record)

        # Insert records
        result = await collection.insert_many(records)
        print(f"✅ Added {len(result.inserted_ids)} test API usage records")

        # Show new count
        new_count = await collection.count_documents({})
        print(f"📊 Total API usage records now: {new_count}")
        print(f"📄 Pagination will show {(new_count + 19) // 20} pages (20 per page)")

    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        await MongoDB.close_db()


if __name__ == "__main__":
    print("🚀 Adding test API usage records for pagination testing...\n")
    asyncio.run(add_test_records())
    print("\n✅ Done! Refresh your admin panel to see pagination.")
