"""
Enterprise API Tests
===================

Test cases for Enterprise API functionality.
"""

import asyncio
import base64
import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch

from src.app import app
from src.database.models import UserInDB
from src.database.subscription_models import PlanType, SubscriptionPlan, UserSubscription, BillingCycle, SubscriptionStatus


@pytest.fixture
def client():
    """Test client fixture"""
    return TestClient(app)


@pytest.fixture
def enterprise_user():
    """Mock enterprise user"""
    return UserInDB(
        id="507f1f77bcf86cd799439011",
        username="enterprise_user",
        email="enterprise@test.com",
        full_name="Enterprise User",
        hashed_password="hashed_password",
        is_active=True,
        is_admin=False
    )


@pytest.fixture
def enterprise_plan():
    """Mock enterprise plan"""
    return SubscriptionPlan(
        id="507f1f77bcf86cd799439012",
        name="Enterprise Plan",
        plan_type=PlanType.ENTERPRISE,
        description="Enterprise features",
        monthly_price=2499.0,
        quarterly_price=6999.0,
        yearly_price=24999.0,
        max_analyses_per_month=0,  # Unlimited
        max_image_size_mb=50,
        api_rate_limit_per_minute=120,
        features=["unlimited_analyses", "api_access", "bulk_analysis"],
        has_api_access=True,
        has_bulk_analysis=True,
        has_advanced_analytics=True
    )


@pytest.fixture
def enterprise_subscription(enterprise_user, enterprise_plan):
    """Mock enterprise subscription"""
    return UserSubscription(
        id="507f1f77bcf86cd799439013",
        user_id=str(enterprise_user.id),
        username=enterprise_user.username,
        plan_id=str(enterprise_plan.id),
        plan_type=PlanType.ENTERPRISE,
        status=SubscriptionStatus.ACTIVE,
        billing_cycle=BillingCycle.YEARLY,
        amount_paid=24999.0,
        start_date=datetime.utcnow(),
        end_date=datetime.utcnow() + timedelta(days=365)
    )


class TestEnterpriseAPI:
    """Test cases for Enterprise API endpoints"""
    
    @patch('src.services.subscription_service.SubscriptionService.get_user_subscription')
    @patch('src.services.subscription_service.SubscriptionService.get_plan_by_id')
    @patch('src.services.subscription_service.SubscriptionService.get_user_usage_quota')
    @patch('src.auth.security.get_current_active_user')
    def test_enterprise_status(self, mock_get_user, mock_get_quota, mock_get_plan, mock_get_subscription, 
                              client, enterprise_user, enterprise_plan, enterprise_subscription):
        """Test enterprise status endpoint"""
        # Setup mocks
        mock_get_user.return_value = enterprise_user
        mock_get_subscription.return_value = enterprise_subscription
        mock_get_plan.return_value = enterprise_plan
        mock_get_quota.return_value = None
        
        # Make request
        response = client.get(
            "/api/enterprise/status",
            headers={"Authorization": "Bearer test_token"}
        )
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == enterprise_user.username
        assert data["plan"]["type"] == "enterprise"
        assert data["plan"]["max_analyses_per_month"] == 0
        assert data["usage"]["is_unlimited"] is True
    
    @patch('src.auth.security.get_current_active_user')
    def test_enterprise_access_denied_non_enterprise(self, mock_get_user, client):
        """Test that non-enterprise users are denied access"""
        # Setup mock for non-enterprise user
        non_enterprise_user = UserInDB(
            id="507f1f77bcf86cd799439014",
            username="basic_user",
            email="basic@test.com",
            full_name="Basic User",
            hashed_password="hashed_password",
            is_active=True,
            is_admin=False
        )
        mock_get_user.return_value = non_enterprise_user
        
        with patch('src.services.subscription_service.SubscriptionService.get_user_subscription') as mock_sub:
            mock_sub.return_value = None  # No subscription
            
            response = client.get(
                "/api/enterprise/status",
                headers={"Authorization": "Bearer test_token"}
            )
            
            assert response.status_code == 403
            assert "Enterprise subscription required" in response.json()["detail"]
    
    @patch('src.routes.enterprise_api.EnterpriseUser.verify_enterprise_access')
    def test_bulk_analysis_validation(self, mock_verify_access, client, enterprise_user):
        """Test bulk analysis input validation"""
        mock_verify_access.return_value = enterprise_user
        
        # Test with too many files
        files = [("files", ("test.jpg", b"fake_image_data", "image/jpeg")) for _ in range(101)]
        
        response = client.post(
            "/api/enterprise/bulk-analysis",
            files=files,
            headers={"Authorization": "Bearer test_token"}
        )
        
        assert response.status_code == 400
        assert "Maximum 100 files allowed" in response.json()["detail"]
    
    @patch('src.routes.enterprise_api.EnterpriseUser.verify_enterprise_access')
    @patch('src.database.connection.MongoDB.get_collection')
    def test_analytics_endpoint(self, mock_get_collection, mock_verify_access, client, enterprise_user):
        """Test analytics endpoint"""
        mock_verify_access.return_value = enterprise_user
        
        # Mock database collection
        mock_collection = AsyncMock()
        mock_get_collection.return_value = mock_collection
        
        # Mock aggregation results
        mock_collection.count_documents.return_value = 100
        mock_collection.aggregate.return_value.to_list = AsyncMock(return_value=[
            {"_id": "fungal", "count": 60, "avg_confidence": 85.0},
            {"_id": "bacterial", "count": 40, "avg_confidence": 80.0}
        ])
        
        response = client.get(
            "/api/enterprise/analytics",
            headers={"Authorization": "Bearer test_token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "total_analyses" in data
        assert "disease_distribution" in data
        assert "severity_distribution" in data
    
    @patch('src.routes.enterprise_api.EnterpriseUser.verify_enterprise_access')
    @patch('src.database.connection.MongoDB.get_collection')
    def test_api_key_generation(self, mock_get_collection, mock_verify_access, client, enterprise_user):
        """Test API key generation"""
        mock_verify_access.return_value = enterprise_user
        
        # Mock database collection
        mock_collection = AsyncMock()
        mock_get_collection.return_value = mock_collection
        mock_collection.insert_one.return_value = AsyncMock()
        
        request_data = {
            "name": "Test API Key",
            "description": "Test key for integration",
            "expires_in_days": 30
        }
        
        response = client.post(
            "/api/enterprise/api-keys",
            json=request_data,
            headers={"Authorization": "Bearer test_token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Test API Key"
        assert data["api_key"].startswith("ent_")
        assert data["is_active"] is True


class TestProgrammaticAPI:
    """Test cases for Programmatic API endpoints"""
    
    @patch('src.auth.api_key_auth.get_enterprise_api_user')
    def test_health_check(self, mock_get_user, client, enterprise_user):
        """Test health check endpoint"""
        mock_get_user.return_value = enterprise_user
        
        response = client.get(
            "/api/v1/health",
            headers={"Authorization": "Bearer ent_test_key"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["api_version"] == "1.0.0"
        assert data["user_id"] == str(enterprise_user.id)
    
    @patch('src.auth.api_key_auth.get_enterprise_api_user')
    @patch('src.image_utils.test_with_base64_data')
    @patch('src.storage.image_storage.save_image')
    @patch('src.database.connection.MongoDB.get_collection')
    def test_analyze_base64(self, mock_get_collection, mock_save_image, mock_analyze, 
                           mock_get_user, client, enterprise_user):
        """Test base64 image analysis"""
        mock_get_user.return_value = enterprise_user
        mock_save_image.return_value = ("test.jpg", "/path/to/test.jpg")
        mock_analyze.return_value = {
            "disease_detected": True,
            "disease_name": "Test Disease",
            "disease_type": "fungal",
            "severity": "moderate",
            "confidence": 85.0,
            "symptoms": ["test symptom"],
            "possible_causes": ["test cause"],
            "treatment": ["test treatment"],
            "description": "Test description"
        }
        
        # Mock database collection
        mock_collection_instance = AsyncMock()
        mock_get_collection.return_value = mock_collection_instance
        mock_collection_instance.insert_one.return_value = AsyncMock(inserted_id="507f1f77bcf86cd799439015")
        
        # Create test base64 image
        test_image = base64.b64encode(b"fake_image_data").decode()
        
        request_data = {
            "image_base64": test_image,
            "filename": "test.jpg",
            "metadata": {"test": "data"}
        }
        
        response = client.post(
            "/api/v1/analyze-base64",
            json=request_data,
            headers={"Authorization": "Bearer ent_test_key"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["disease_detected"] is True
        assert data["disease_name"] == "Test Disease"
        assert data["confidence"] == 85.0
    
    @patch('src.auth.api_key_auth.get_enterprise_api_user')
    def test_invalid_api_key_format(self, mock_get_user, client):
        """Test invalid API key format"""
        response = client.get(
            "/api/v1/health",
            headers={"Authorization": "Bearer invalid_key"}
        )
        
        assert response.status_code == 401
    
    @patch('src.auth.api_key_auth.get_enterprise_api_user')
    @patch('src.database.connection.MongoDB.get_collection')
    def test_get_analyses_pagination(self, mock_get_collection, mock_get_user, client, enterprise_user):
        """Test analyses endpoint with pagination"""
        mock_get_user.return_value = enterprise_user
        
        # Mock database collection
        mock_collection = AsyncMock()
        mock_get_collection.return_value = mock_collection
        
        # Mock cursor and results
        mock_cursor = AsyncMock()
        mock_collection.find.return_value = mock_cursor
        mock_cursor.sort.return_value = mock_cursor
        mock_cursor.skip.return_value = mock_cursor
        mock_cursor.limit.return_value = mock_cursor
        
        # Mock analysis records
        mock_analyses = [
            {
                "_id": "507f1f77bcf86cd799439016",
                "image_filename": "test1.jpg",
                "disease_detected": True,
                "disease_name": "Test Disease 1",
                "disease_type": "fungal",
                "severity": "mild",
                "confidence": 80.0,
                "analysis_timestamp": datetime.utcnow(),
                "api_access": True
            },
            {
                "_id": "507f1f77bcf86cd799439017",
                "image_filename": "test2.jpg",
                "disease_detected": False,
                "disease_name": None,
                "disease_type": "healthy",
                "severity": "none",
                "confidence": 95.0,
                "analysis_timestamp": datetime.utcnow(),
                "api_access": True
            }
        ]
        
        async def mock_async_iterator():
            for analysis in mock_analyses:
                yield analysis
        
        mock_cursor.__aiter__ = mock_async_iterator
        mock_collection.count_documents.return_value = 2
        
        response = client.get(
            "/api/v1/analyses?limit=10&offset=0",
            headers={"Authorization": "Bearer ent_test_key"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["analyses"]) == 2
        assert data["total_count"] == 2
        assert data["limit"] == 10
        assert data["offset"] == 0
        assert data["has_more"] is False


class TestRateLimiting:
    """Test cases for rate limiting functionality"""
    
    @patch('src.middleware.rate_limiting.MongoDB.get_collection')
    def test_rate_limit_headers(self, mock_get_collection, client):
        """Test that rate limit headers are included in responses"""
        # Mock database collections
        mock_collection = AsyncMock()
        mock_get_collection.return_value = mock_collection
        
        # Mock rate limit document
        mock_collection.find_one.return_value = {"count": 5}
        mock_collection.update_one.return_value = AsyncMock()
        
        with patch('src.auth.api_key_auth.get_enterprise_api_user') as mock_get_user:
            mock_get_user.return_value = UserInDB(
                id="507f1f77bcf86cd799439018",
                username="test_user",
                email="test@test.com",
                full_name="Test User",
                hashed_password="hashed",
                is_active=True,
                is_admin=False
            )
            
            response = client.get(
                "/api/v1/health",
                headers={"Authorization": "Bearer ent_test_key"}
            )
            
            # Check that rate limit headers are present
            assert "X-RateLimit-Limit" in response.headers
            assert "X-RateLimit-Remaining" in response.headers
            assert "X-RateLimit-Reset" in response.headers


if __name__ == "__main__":
    pytest.main([__file__, "-v"])