"""
Populate Analytics Data Script
==============================
Adds sample data to the database for testing the analytics dashboard
"""

import asyncio
import random
from datetime import datetime, timedelta

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()


async def populate_sample_data():
    """Populate database with sample analytics data"""
    
    # Connect to MongoDB
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    db_name = os.getenv("MONGODB_DB_NAME", "leaf_disease_db")
    
    client = AsyncIOMotorClient(mongodb_url)
    db = client[db_name]
    
    print(f"Connected to MongoDB: {db_name}")
    
    # Collections
    users_collection = db["users"]
    analysis_collection = db["analysis_records"]
    api_usage_collection = db["api_usage"]
    
    # Check if we already have data
    existing_usage = await api_usage_collection.count_documents({})
    if existing_usage > 0:
        print(f"\n⚠️  Found {existing_usage} existing API usage records.")
        response = input("Do you want to add more sample data? (yes/no): ")
        if response.lower() not in ['yes', 'y']:
            print("Aborted.")
            client.close()
            return
    
    # Sample user IDs (create if they don't exist)
    sample_users = [
        {"username": "demo_user1", "user_id": "demo_user_1"},
        {"username": "demo_user2", "user_id": "demo_user_2"},
        {"username": "demo_user3", "user_id": "demo_user_3"},
        {"username": "demo_user4", "user_id": "demo_user_4"},
        {"username": "demo_user5", "user_id": "demo_user_5"},
    ]
    
    # Groq models
    groq_models = [
        "meta-llama/llama-4-scout-17b-16e-instruct",
        "llama-3.3-70b-versatile",
        "llama-3.1-70b-versatile",
        "llama-3.1-8b-instant",
    ]
    
    # Perplexity models
    perplexity_models = ["sonar", "sonar-pro"]
    
    # Disease types
    diseases = [
        "Apple Scab",
        "Black Rot",
        "Cedar Apple Rust",
        "Tomato Early Blight",
        "Tomato Late Blight",
        "Grape Black Rot",
        "Corn Common Rust",
        "Potato Late Blight",
    ]
    
    print("\n📊 Generating sample data for the last 30 days...")
    
    # Generate data for the last 30 days
    days = 30
    start_date = datetime.utcnow() - timedelta(days=days)
    
    total_api_records = 0
    total_analysis_records = 0
    
    for day in range(days):
        current_date = start_date + timedelta(days=day)
        
        # Simulate increasing usage over time (growth trend)
        base_activity = 5 + (day * 0.5)  # Gradual increase
        daily_analyses = int(base_activity + random.randint(-2, 5))
        
        for _ in range(daily_analyses):
            # Random user
            user = random.choice(sample_users)
            
            # Random time during the day
            hour = random.randint(8, 20)  # Business hours
            minute = random.randint(0, 59)
            timestamp = current_date.replace(hour=hour, minute=minute)
            
            # Create analysis record
            is_diseased = random.random() > 0.4  # 60% chance of disease
            
            analysis_record = {
                "user_id": user["user_id"],
                "username": user["username"],
                "disease_detected": is_diseased,
                "disease_name": random.choice(diseases) if is_diseased else "Healthy",
                "confidence": round(random.uniform(0.75, 0.98), 2),
                "analysis_timestamp": timestamp,
                "image_path": f"storage/images/{user['user_id']}/sample_{day}.jpg",
            }
            
            await analysis_collection.insert_one(analysis_record)
            total_analysis_records += 1
            
            # Create Groq API usage record (for disease detection)
            groq_model = random.choice(groq_models)
            input_tokens = random.randint(800, 1500)
            output_tokens = random.randint(200, 500)
            total_tokens = input_tokens + output_tokens
            
            # Calculate cost based on model
            if "llama-4-scout" in groq_model or "8b-instant" in groq_model:
                input_cost = (input_tokens / 1_000_000) * 0.05
                output_cost = (output_tokens / 1_000_000) * 0.08
            else:  # 70b models
                input_cost = (input_tokens / 1_000_000) * 0.59
                output_cost = (output_tokens / 1_000_000) * 0.79
            
            groq_cost = input_cost + output_cost
            
            groq_usage = {
                "user_id": user["user_id"],
                "username": user["username"],
                "api_type": "groq",
                "endpoint": "disease-detection",
                "model_used": groq_model,
                "tokens_used": total_tokens,
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "estimated_cost": groq_cost,
                "timestamp": timestamp,
                "success": True,
            }
            
            await api_usage_collection.insert_one(groq_usage)
            total_api_records += 1
            
            # 30% chance of also using Perplexity API (for additional info)
            if random.random() > 0.7:
                perplexity_model = random.choice(perplexity_models)
                perplexity_tokens = random.randint(500, 1200)
                
                # Calculate cost
                price_per_million = 0.20 if perplexity_model == "sonar" else 1.00
                perplexity_cost = (perplexity_tokens / 1_000_000) * price_per_million
                
                perplexity_usage = {
                    "user_id": user["user_id"],
                    "username": user["username"],
                    "api_type": "perplexity",
                    "endpoint": "youtube-videos",
                    "model_used": perplexity_model,
                    "tokens_used": perplexity_tokens,
                    "estimated_cost": perplexity_cost,
                    "timestamp": timestamp + timedelta(seconds=random.randint(1, 30)),
                    "success": True,
                }
                
                await api_usage_collection.insert_one(perplexity_usage)
                total_api_records += 1
        
        # Progress indicator
        if (day + 1) % 5 == 0:
            print(f"  ✓ Generated data for day {day + 1}/{days}")
    
    print(f"\n✅ Sample data generation complete!")
    print(f"   - Created {total_analysis_records} analysis records")
    print(f"   - Created {total_api_records} API usage records")
    print(f"   - Spanning {days} days")
    
    # Calculate and display summary
    total_cost = 0
    async for record in api_usage_collection.find({"timestamp": {"$gte": start_date}}):
        total_cost += record.get("estimated_cost", 0.0)
    
    groq_count = await api_usage_collection.count_documents({
        "timestamp": {"$gte": start_date},
        "api_type": "groq"
    })
    
    perplexity_count = await api_usage_collection.count_documents({
        "timestamp": {"$gte": start_date},
        "api_type": "perplexity"
    })
    
    diseases_detected = await analysis_collection.count_documents({
        "analysis_timestamp": {"$gte": start_date},
        "disease_detected": True
    })
    
    healthy_plants = await analysis_collection.count_documents({
        "analysis_timestamp": {"$gte": start_date},
        "disease_detected": False
    })
    
    print(f"\n📈 Summary Statistics:")
    print(f"   - Total API Calls: {total_api_records}")
    print(f"   - Groq API Calls: {groq_count}")
    print(f"   - Perplexity API Calls: {perplexity_count}")
    print(f"   - Total Cost: ${total_cost:.4f}")
    print(f"   - Diseases Detected: {diseases_detected}")
    print(f"   - Healthy Plants: {healthy_plants}")
    print(f"\n🎉 You can now view the analytics dashboard at /admin")
    
    client.close()


if __name__ == "__main__":
    print("=" * 60)
    print("  Analytics Data Population Script")
    print("=" * 60)
    print("\nThis script will populate your database with sample data")
    print("for testing the analytics dashboard.\n")
    
    asyncio.run(populate_sample_data())
