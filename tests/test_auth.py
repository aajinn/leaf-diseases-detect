"""
Authentication API Test Script
==============================

Tests the authentication and protected endpoints.
"""

import json
from pathlib import Path

import requests

BASE_URL = "http://localhost:8000"


def test_register():
    """Test user registration"""
    print("\n1. Testing User Registration...")
    response = requests.post(
        f"{BASE_URL}/auth/register",
        json={
            "email": "testuser@example.com",
            "username": "testuser",
            "password": "testpass123",
            "full_name": "Test User",
        },
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return response.status_code == 201


def test_login():
    """Test user login"""
    print("\n2. Testing User Login...")
    response = requests.post(
        f"{BASE_URL}/auth/login",
        data={"username": "testuser", "password": "testpass123"},
    )
    print(f"Status: {response.status_code}")
    result = response.json()
    print(f"Response: {json.dumps(result, indent=2)}")

    if response.status_code == 200:
        return result.get("access_token")
    return None


def test_get_profile(token):
    """Test getting user profile"""
    print("\n3. Testing Get Profile...")
    response = requests.get(f"{BASE_URL}/auth/me", headers={"Authorization": f"Bearer {token}"})
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return response.status_code == 200


def test_disease_detection(token):
    """Test authenticated disease detection"""
    print("\n4. Testing Disease Detection (Authenticated)...")

    test_image = "Media/brown-spot-4 (1).jpg"
    if not Path(test_image).exists():
        print(f"❌ Test image not found: {test_image}")
        return False

    with open(test_image, "rb") as img_file:
        files = {"file": (Path(test_image).name, img_file, "image/jpeg")}
        response = requests.post(
            f"{BASE_URL}/api/disease-detection",
            files=files,
            headers={"Authorization": f"Bearer {token}"},
        )

    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"Analysis ID: {result.get('id')}")
        print(f"Disease Detected: {result.get('disease_detected')}")
        print(f"Disease Name: {result.get('disease_name')}")
        print(f"Confidence: {result.get('confidence')}%")
        return True
    else:
        print(f"Error: {response.text}")
        return False


def test_get_analyses(token):
    """Test getting analysis history"""
    print("\n5. Testing Get Analysis History...")
    response = requests.get(
        f"{BASE_URL}/api/my-analyses", headers={"Authorization": f"Bearer {token}"}
    )
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"Total Records: {result.get('total')}")
        print(f"Records: {json.dumps(result.get('records', []), indent=2)}")
        return True
    return False


def test_unauthorized_access():
    """Test accessing protected endpoint without token"""
    print("\n6. Testing Unauthorized Access...")
    response = requests.get(f"{BASE_URL}/api/my-analyses")
    print(f"Status: {response.status_code}")
    print(f"Expected: 401 Unauthorized")
    return response.status_code == 401


def main():
    """Run all tests"""
    print("=" * 60)
    print("Authentication API Test Suite")
    print("=" * 60)

    # Test registration (may fail if user exists)
    test_register()

    # Test login
    token = test_login()
    if not token:
        print("\n❌ Login failed! Cannot continue tests.")
        return

    print(f"\n✅ Token obtained: {token[:20]}...")

    # Test authenticated endpoints
    test_get_profile(token)
    test_disease_detection(token)
    test_get_analyses(token)
    test_unauthorized_access()

    print("\n" + "=" * 60)
    print("Test Suite Completed!")
    print("=" * 60)


if __name__ == "__main__":
    main()
