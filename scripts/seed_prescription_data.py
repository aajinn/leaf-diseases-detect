"""
Seed Sample Prescription Data
==============================

Generates sample prescription data for testing analytics dashboard.
"""

import asyncio
import sys
from pathlib import Path
from datetime import datetime, timedelta
import random

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.database.connection import MongoDB
from src.services.prescription_service import PrescriptionService, PRESCRIPTION_COLLECTION
from bson import ObjectId


# Sample data
SAMPLE_USERS = [
    {"id": "user1", "username": "farmer_raj"},
    {"id": "user2", "username": "agri_priya"},
    {"id": "user3", "username": "farm_kumar"},
    {"id": "user4", "username": "green_thumb"},
    {"id": "user5", "username": "crop_master"},
]

SAMPLE_DISEASES = [
    {"name": "Bacterial Blight", "type": "bacterial", "severity": "severe"},
    {"name": "Fungal Leaf Spot", "type": "fungal", "severity": "moderate"},
    {"name": "Powdery Mildew", "type": "fungal", "severity": "mild"},
    {"name": "Leaf Rust", "type": "fungal", "severity": "moderate"},
    {"name": "Bacterial Wilt", "type": "bacterial", "severity": "severe"},
]

PRIORITIES = ["urgent", "high", "moderate", "low"]
STATUSES = ["active", "completed", "expired"]


async def generate_sample_prescriptions(count: int = 50):
    """Generate sample prescription data"""
    
    print(f"🌱 Generating {count} sample prescriptions...")
    
    try:
        # Connect to database
        await MongoDB.connect_db()
        collection = MongoDB.get_collection(PRESCRIPTION_COLLECTION)
        
        # Clear existing sample data (optional)
        # await collection.delete_many({"prescription_id": {"$regex": "^RX-SAMPLE-"}})
        
        prescriptions = []
        
        for i in range(count):
            # Random date within last 30 days
            days_ago = random.randint(0, 30)
            created_at = datetime.utcnow() - timedelta(days=days_ago)
            expires_at = created_at + timedelta(days=90)
            
            # Random user
            user = random.choice(SAMPLE_USERS)
            
            # Random disease
            disease = random.choice(SAMPLE_DISEASES)
            
            # Random priority (weighted towards moderate)
            priority = random.choices(
                PRIORITIES,
                weights=[0.2, 0.3, 0.4, 0.1],  # urgent, high, moderate, low
                k=1
            )[0]
            
            # Random status (weighted towards active)
            status = random.choices(
                STATUSES,
                weights=[0.7, 0.2, 0.1],  # active, completed, expired
                k=1
            )[0]
            
            # Generate prescription
            prescription = await PrescriptionService.generate_prescription(
                user_id=user["id"],
                username=user["username"],
                analysis_id=f"analysis_{i}",
                disease_name=disease["name"],
                disease_type=disease["type"],
                severity=disease["severity"],
                confidence=random.uniform(0.75, 0.98)
            )
            
            # Update with custom dates and status
            await collection.update_one(
                {"_id": ObjectId(prescription.id)},
                {
                    "$set": {
                        "created_at": created_at,
                        "expires_at": expires_at,
                        "status": status,
                        "treatment_priority": priority
                    }
                }
            )
            
            prescriptions.append(prescription)
            
            if (i + 1) % 10 == 0:
                print(f"  ✓ Generated {i + 1}/{count} prescriptions")
        
        print(f"\n✅ Successfully generated {len(prescriptions)} sample prescriptions!")
        print(f"\n📊 Summary:")
        print(f"  - Users: {len(SAMPLE_USERS)}")
        print(f"  - Diseases: {len(SAMPLE_DISEASES)}")
        print(f"  - Date range: Last 30 days")
        print(f"  - Priorities: {', '.join(PRIORITIES)}")
        print(f"  - Statuses: {', '.join(STATUSES)}")
        
        # Show some stats
        total = await collection.count_documents({})
        print(f"\n📈 Total prescriptions in database: {total}")
        
        return prescriptions
        
    except Exception as e:
        print(f"❌ Error generating sample data: {str(e)}")
        raise
    finally:
        await MongoDB.close_db()


async def clear_sample_data():
    """Clear all prescription data (use with caution!)"""
    
    print("⚠️  WARNING: This will delete ALL prescription data!")
    confirm = input("Type 'DELETE ALL' to confirm: ")
    
    if confirm != "DELETE ALL":
        print("❌ Cancelled")
        return
    
    try:
        await MongoDB.connect_db()
        collection = MongoDB.get_collection(PRESCRIPTION_COLLECTION)
        
        result = await collection.delete_many({})
        print(f"✅ Deleted {result.deleted_count} prescriptions")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    finally:
        await MongoDB.close_db()


async def show_stats():
    """Show current prescription statistics"""
    
    try:
        await MongoDB.connect_db()
        collection = MongoDB.get_collection(PRESCRIPTION_COLLECTION)
        
        total = await collection.count_documents({})
        
        # Count by priority
        pipeline = [
            {
                "$group": {
                    "_id": "$treatment_priority",
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"count": -1}}
        ]
        
        by_priority = await collection.aggregate(pipeline).to_list(length=10)
        
        print(f"\n📊 Current Prescription Statistics:")
        print(f"  Total: {total}")
        print(f"\n  By Priority:")
        for item in by_priority:
            print(f"    - {item['_id']}: {item['count']}")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    finally:
        await MongoDB.close_db()


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Manage prescription sample data")
    parser.add_argument(
        "action",
        choices=["generate", "clear", "stats"],
        help="Action to perform"
    )
    parser.add_argument(
        "--count",
        type=int,
        default=50,
        help="Number of prescriptions to generate (default: 50)"
    )
    
    args = parser.parse_args()
    
    if args.action == "generate":
        asyncio.run(generate_sample_prescriptions(args.count))
    elif args.action == "clear":
        asyncio.run(clear_sample_data())
    elif args.action == "stats":
        asyncio.run(show_stats())
