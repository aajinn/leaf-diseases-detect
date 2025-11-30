"""
Test script for Perplexity API YouTube video integration
"""

import sys

from src.services.perplexity_service import PerplexityService


def test_service_initialization():
    """Test service initialization"""
    print("=" * 60)
    print("Testing Perplexity Service Initialization")
    print("=" * 60)

    service = PerplexityService()

    if service.enabled:
        print("✅ Service initialized successfully")
        print(f"   API Key: {service.api_key[:10]}...")
        return True
    else:
        print("❌ Service not enabled - PERPLEXITY_API_KEY not found")
        print("   Please add PERPLEXITY_API_KEY to your .env file")
        return False


def test_disease_videos():
    """Test fetching disease treatment videos"""
    print("\n" + "=" * 60)
    print("Testing Disease Treatment Video Fetching")
    print("=" * 60)

    service = PerplexityService()

    if not service.enabled:
        print("⚠️  Skipping - service not enabled")
        return False

    # Test with common disease
    disease_name = "Powdery Mildew"
    disease_type = "fungal"

    print(f"\nSearching for videos about: {disease_name} ({disease_type})")
    print("This may take 10-30 seconds...")

    try:
        videos = service.get_treatment_videos(
            disease_name=disease_name, disease_type=disease_type, max_videos=3
        )

        if videos:
            print(f"\n✅ Found {len(videos)} videos:")
            for i, video in enumerate(videos, 1):
                print(f"\n   Video {i}:")
                print(f"   Title: {video.title}")
                print(f"   URL: {video.url}")
                print(f"   Video ID: {video.video_id}")
                print(f"   Thumbnail: {video.thumbnail}")
            return True
        else:
            print("⚠️  No videos found")
            return False

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False


def test_general_care_videos():
    """Test fetching general plant care videos"""
    print("\n" + "=" * 60)
    print("Testing General Plant Care Video Fetching")
    print("=" * 60)

    service = PerplexityService()

    if not service.enabled:
        print("⚠️  Skipping - service not enabled")
        return False

    print("\nSearching for general plant care videos...")
    print("This may take 10-30 seconds...")

    try:
        videos = service.get_general_plant_care_videos(max_videos=2)

        if videos:
            print(f"\n✅ Found {len(videos)} videos:")
            for i, video in enumerate(videos, 1):
                print(f"\n   Video {i}:")
                print(f"   Title: {video.title}")
                print(f"   URL: {video.url}")
                print(f"   Video ID: {video.video_id}")
            return True
        else:
            print("⚠️  No videos found")
            return False

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False


def test_url_extraction():
    """Test YouTube URL extraction"""
    print("\n" + "=" * 60)
    print("Testing YouTube URL Extraction")
    print("=" * 60)

    service = PerplexityService()

    test_text = """
    Here are some helpful videos:
    1. https://www.youtube.com/watch?v=dQw4w9WgXcQ
    2. https://youtu.be/jNQXAC9IVRw
    3. Check out this video: https://www.youtube.com/embed/yPYZpwSpKmA
    """

    urls = service.extract_youtube_links(test_text)

    print(f"\nTest text contains {len(urls)} YouTube URLs:")
    for url in urls:
        print(f"   - {url}")

    if len(urls) == 3:
        print("\n✅ URL extraction working correctly")
        return True
    else:
        print(f"\n❌ Expected 3 URLs, found {len(urls)}")
        return False


def main():
    """Run all tests"""
    print("\n" + "=" * 60)
    print("PERPLEXITY API INTEGRATION TEST SUITE")
    print("=" * 60)

    results = []

    # Test 1: Initialization
    results.append(("Initialization", test_service_initialization()))

    # Test 2: URL Extraction
    results.append(("URL Extraction", test_url_extraction()))

    # Test 3: Disease Videos (only if service is enabled)
    service = PerplexityService()
    if service.enabled:
        results.append(("Disease Videos", test_disease_videos()))
        results.append(("General Care Videos", test_general_care_videos()))
    else:
        print("\n⚠️  Skipping API tests - service not enabled")
        print("   Add PERPLEXITY_API_KEY to .env to enable full testing")

    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")

    print(f"\nTotal: {passed}/{total} tests passed")

    if passed == total:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        return 1


if __name__ == "__main__":
    sys.exit(main())
