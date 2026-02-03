"""
Test Subscription Stats Endpoint
===============================
"""

import asyncio
import sys
from pathlib import Path

# Add src to path
sys.path.append(str(Path(__file__).parent.parent))

from src.database.connection import MongoDB
from src.routes.admin import get_subscription_stats
from src.database.models import UserInDB

async def test_endpoint():
    """Test the subscription stats endpoint"""
    try:
        await MongoDB.connect_db()
        
        # Create a mock admin user
        class MockAdmin:
            def __init__(self):
                self.is_admin = True
                self.username = "test_admin"
        
        mock_admin = MockAdmin()
        
        # Call the endpoint function directly
        result = await get_subscription_stats(mock_admin)
        print("Endpoint result:", result)
        
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        await MongoDB.close_db()

if __name__ == "__main__":
    asyncio.run(test_endpoint())