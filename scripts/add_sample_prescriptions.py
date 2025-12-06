"""
Quick Script to Add Sample Prescription Data
============================================

Run this to populate the database with sample prescriptions for testing.
"""

import asyncio
import random
import sys
from datetime import datetime, timedelta
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from bson import ObjectId

from src.database.connection import MongoDB
from src.services.prescription_service import PRESCRIPTION_COLLECTION, PrescriptionService


async def main():
    """Generate 50 sample prescriptions"""

    print("=" * 60)
    print("🌱 PRESCRIPTION SAMPLE DATA GENERATOR")
    print("=" * 60)
    print("\nThis will create 50 sample prescriptions for testing.")
    print("Press Ctrl+C to cancel, or wait 3 seconds to continue...")

    try:
        await asyncio.sleep(3)
    except KeyboardInterrupt:
        print("\n❌ Cancelled")
        return

    # Sample data
    users = [
        {"id": "user1", "username": "farmer_raj"},
        {"id": "user2", "username": "agri_priya"},
        {"id": "user3", "username": "farm_kumar"},
        {"id": "user4", "username": "green_thumb"},
        {"id": "user5", "username": "crop_master"},
    ]

    diseases = [
        {"name": "Bacterial Blight", "type": "bacterial", "severity": "severe"},
        {"name": "Fungal Leaf Spot", "type": "fungal", "severity": "moderate"},
        {"name": "Powdery Mildew", "type": "fungal", "severity": "mild"},
        {"name": "Leaf Rust", "type": "fungal", "severity": "moderate"},
        {"name": "Bacterial Wilt", "type": "bacterial", "severity": "severe"},
        {"name": "Early Blight", "type": "fungal", "severity": "moderate"},
        {"name": "Late Blight", "type": "fungal", "severity": "severe"},
        {"name": "Anthracnose", "type": "fungal", "severity": "moderate"},
    ]

    priorities = ["urgent", "high", "moderate", "low"]
    statuses = ["active", "completed", "expired"]

    try:
        print("\n📡 Connecting to database...")
        await MongoDB.connect_db()
        collection = MongoDB.get_collection(PRESCRIPTION_COLLECTION)

        print("✅ Connected!")
        print("\n🔄 Generating prescriptions...")

        count = 50
        generated = 0

        for i in range(count):
            try:
                # Random date within last 30 days
                days_ago = random.randint(0, 30)
                created_at = datetime.utcnow() - timedelta(days=days_ago)
                expires_at = created_at + timedelta(days=90)

                # Random selections
                user = random.choice(users)
                disease = random.choice(diseases)
                priority = random.choices(priorities, weights=[0.2, 0.3, 0.4, 0.1])[0]
                status = random.choices(statuses, weights=[0.7, 0.2, 0.1])[0]

                # Generate prescription
                prescription = await PrescriptionService.generate_prescription(
                    user_id=user["id"],
                    username=user["username"],
                    analysis_id=f"sample_analysis_{i}_{int(datetime.now().timestamp())}",
                    disease_name=disease["name"],
                    disease_type=disease["type"],
                    severity=disease["severity"],
                    confidence=random.uniform(0.75, 0.98),
                )

                # Update with custom dates and status
                await collection.update_one(
                    {"_id": ObjectId(prescription.id)},
                    {
                        "$set": {
                            "created_at": created_at,
                            "expires_at": expires_at,
                            "status": status,
                            "treatment_priority": priority,
                        }
                    },
                )

                generated += 1

                # Progress indicator
                if (i + 1) % 10 == 0:
                    print(f"  ✓ {i + 1}/{count} prescriptions created")

            except Exception as e:
                print(f"  ⚠️  Error creating prescription {i + 1}: {str(e)}")
                continue

        print(f"\n✅ Successfully generated {generated} prescriptions!")

        # Show statistics
        print("\n" + "=" * 60)
        print("📊 DATABASE STATISTICS")
        print("=" * 60)

        total = await collection.count_documents({})
        print(f"\n  Total prescriptions: {total}")

        # Count by priority
        pipeline = [
            {"$group": {"_id": "$treatment_priority", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
        ]
        by_priority = await collection.aggregate(pipeline).to_list(length=10)

        print("\n  By Priority:")
        for item in by_priority:
            print(f"    • {item['_id']}: {item['count']}")

        # Count by status
        pipeline = [{"$group": {"_id": "$status", "count": {"$sum": 1}}}, {"$sort": {"count": -1}}]
        by_status = await collection.aggregate(pipeline).to_list(length=10)

        print("\n  By Status:")
        for item in by_status:
            print(f"    • {item['_id']}: {item['count']}")

        # Count by disease
        pipeline = [
            {"$group": {"_id": "$disease_name", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 5},
        ]
        by_disease = await collection.aggregate(pipeline).to_list(length=5)

        print("\n  Top 5 Diseases:")
        for item in by_disease:
            print(f"    • {item['_id']}: {item['count']}")

        print("\n" + "=" * 60)
        print("✅ DONE! You can now view the analytics in the admin dashboard.")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback

        traceback.print_exc()
    finally:
        await MongoDB.close_db()
        print("\n👋 Database connection closed.")


if __name__ == "__main__":
    print("\n")
    asyncio.run(main())
    print("\n")
