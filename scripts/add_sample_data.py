"""
Simple Sample Data Generator
============================
Adds sample analytics data to MongoDB for testing
"""

import os
import random
from datetime import datetime, timedelta

from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()


def add_sample_data():
    """Add sample data to the database"""

    # Connect to MongoDB
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    db_name = os.getenv("MONGODB_DB_NAME", "leaf_disease_db")

    try:
        client = MongoClient(mongodb_url)
        db = client[db_name]

        print(f"✓ Connected to MongoDB: {db_name}")

        # Collections
        api_usage_collection = db["api_usage"]
        analysis_collection = db["analysis_records"]

        # Check existing data
        existing = api_usage_collection.count_documents({})
        print(f"  Current API usage records: {existing}")

        if existing > 50:
            print("\n⚠️  Database already has sufficient data.")
            response = input("Add more sample data anyway? (yes/no): ")
            if response.lower() not in ["yes", "y"]:
                print("Aborted.")
                return

        print("\n📊 Generating 30 days of sample data...")

        # Sample data
        users = [
            {"id": "user_001", "name": "alice"},
            {"id": "user_002", "name": "bob"},
            {"id": "user_003", "name": "charlie"},
            {"id": "user_004", "name": "diana"},
        ]

        groq_models = [
            "meta-llama/llama-4-scout-17b-16e-instruct",
            "llama-3.1-70b-versatile",
            "llama-3.1-8b-instant",
        ]

        diseases = ["Apple Scab", "Black Rot", "Tomato Blight", "Grape Rot", "Corn Rust", "Healthy"]

        # Generate data for 30 days
        start_date = datetime.utcnow() - timedelta(days=30)
        records_added = 0

        for day in range(30):
            date = start_date + timedelta(days=day)

            # 3-8 analyses per day (increasing trend)
            daily_count = random.randint(3, 8) + (day // 10)

            for _ in range(daily_count):
                user = random.choice(users)
                hour = random.randint(8, 20)
                minute = random.randint(0, 59)
                timestamp = date.replace(hour=hour, minute=minute)

                # Analysis record
                is_diseased = random.random() > 0.35
                analysis = {
                    "user_id": user["id"],
                    "username": user["name"],
                    "disease_detected": is_diseased,
                    "disease_name": random.choice(diseases[:-1]) if is_diseased else "Healthy",
                    "confidence": round(random.uniform(0.75, 0.95), 2),
                    "analysis_timestamp": timestamp,
                    "image_path": f"storage/sample_{day}_{_}.jpg",
                }
                analysis_collection.insert_one(analysis)

                # Groq API usage
                model = random.choice(groq_models)
                input_tokens = random.randint(800, 1500)
                output_tokens = random.randint(200, 500)
                total_tokens = input_tokens + output_tokens

                # Calculate cost
                if "8b" in model or "scout" in model:
                    cost = (input_tokens / 1_000_000) * 0.05 + (output_tokens / 1_000_000) * 0.08
                else:
                    cost = (input_tokens / 1_000_000) * 0.59 + (output_tokens / 1_000_000) * 0.79

                api_record = {
                    "user_id": user["id"],
                    "username": user["name"],
                    "api_type": "groq",
                    "endpoint": "disease-detection",
                    "model_used": model,
                    "tokens_used": total_tokens,
                    "input_tokens": input_tokens,
                    "output_tokens": output_tokens,
                    "estimated_cost": cost,
                    "timestamp": timestamp,
                    "success": True,
                }
                api_usage_collection.insert_one(api_record)
                records_added += 1

                # 25% chance of Perplexity usage
                if random.random() > 0.75:
                    perplexity_tokens = random.randint(500, 1000)
                    perplexity_cost = (perplexity_tokens / 1_000_000) * 0.20

                    perplexity_record = {
                        "user_id": user["id"],
                        "username": user["name"],
                        "api_type": "perplexity",
                        "endpoint": "youtube-videos",
                        "model_used": "sonar",
                        "tokens_used": perplexity_tokens,
                        "estimated_cost": perplexity_cost,
                        "timestamp": timestamp + timedelta(seconds=5),
                        "success": True,
                    }
                    api_usage_collection.insert_one(perplexity_record)
                    records_added += 1

            if (day + 1) % 10 == 0:
                print(f"  ✓ Day {day + 1}/30 complete")

        # Summary
        total_api = api_usage_collection.count_documents({})
        total_analyses = analysis_collection.count_documents({})

        # Calculate total cost
        pipeline = [{"$group": {"_id": None, "total": {"$sum": "$estimated_cost"}}}]
        cost_result = list(api_usage_collection.aggregate(pipeline))
        total_cost = cost_result[0]["total"] if cost_result else 0

        print(f"\n✅ Sample data added successfully!")
        print(f"   - API usage records: {total_api}")
        print(f"   - Analysis records: {total_analyses}")
        print(f"   - Total estimated cost: ${total_cost:.4f}")
        print(f"\n🎉 Visit /admin to view the analytics dashboard!")

        client.close()

    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        print("\nMake sure:")
        print("  1. MongoDB is running")
        print("  2. .env file has correct MONGODB_URL")
        print("  3. pymongo is installed: pip install pymongo")


if __name__ == "__main__":
    print("=" * 60)
    print("  Sample Analytics Data Generator")
    print("=" * 60)
    print()
    add_sample_data()
