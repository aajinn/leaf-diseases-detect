# 📺 YouTube Video Integration Guide

## Overview

This feature automatically fetches and displays relevant YouTube treatment videos for detected plant diseases using the Perplexity API. Videos are embedded directly in the analysis results and stored in the database for future reference.

---

## 🎯 Features

### Automatic Video Recommendations
- **Disease-Specific Videos**: When a disease is detected, the system fetches 3 relevant treatment videos
- **General Care Videos**: For healthy plants, 2 general plant care videos are provided
- **Smart Search**: Uses Perplexity AI to find the most relevant and helpful videos
- **Embedded Playback**: Videos are embedded directly in the dashboard and history pages
- **Persistent Storage**: Video links are saved in MongoDB for offline access

### User Experience
- **Dashboard Display**: Videos appear immediately after analysis
- **History Access**: All past analyses include their associated videos
- **Responsive Design**: Video embeds work on desktop, tablet, and mobile
- **External Links**: Users can open videos directly on YouTube

---

## 🔧 Setup Instructions

### 1. Get Perplexity API Key

1. Visit [Perplexity AI](https://www.perplexity.ai/)
2. Sign up or log in to your account
3. Navigate to API settings
4. Generate a new API key
5. Copy the key (starts with `pplx-...`)

### 2. Configure Environment Variables

Add to your `.env` file:

```bash
# Perplexity API Configuration
PERPLEXITY_API_KEY=pplx-your-api-key-here
```

### 3. Install Dependencies

The feature uses the `requests` library (already in requirements.txt):

```bash
pip install -r requirements.txt
```

### 4. Update Database Schema

The feature automatically adds `youtube_videos` field to analysis records. No manual migration needed - MongoDB handles schema updates automatically.

### 5. Restart Application

```bash
# Stop current server (Ctrl+C)

# Restart FastAPI
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

---

## 📊 Database Schema Changes

### AnalysisRecord Model

New field added:

```python
class YouTubeVideo(BaseModel):
    title: str              # Video title
    video_id: str          # YouTube video ID (11 characters)
    url: str               # Full YouTube URL
    thumbnail: str         # Thumbnail image URL
    description: Optional[str]  # Video description (optional)

class AnalysisRecord(BaseModel):
    # ... existing fields ...
    youtube_videos: List[YouTubeVideo] = []  # NEW FIELD
```

### Example Document

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "user_id": "507f1f77bcf86cd799439012",
  "disease_name": "Brown Spot Disease",
  "disease_type": "fungal",
  "youtube_videos": [
    {
      "title": "How to Treat Brown Spot Disease",
      "video_id": "dQw4w9WgXcQ",
      "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "thumbnail": "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      "description": null
    }
  ]
}
```

---

## 🔌 API Integration

### Perplexity Service

Located in `services/perplexity_service.py`

#### Key Methods

**`get_treatment_videos(disease_name, disease_type, max_videos=3)`**
- Fetches treatment videos for specific disease
- Returns list of YouTubeVideo objects
- Handles API errors gracefully

**`get_general_plant_care_videos(max_videos=3)`**
- Fetches general plant care videos
- Used for healthy plants
- Returns list of YouTubeVideo objects

**`extract_youtube_links(text)`**
- Extracts YouTube URLs from text
- Supports multiple URL formats
- Returns list of video URLs

#### Example Usage

```python
from services.perplexity_service import get_perplexity_service

# Initialize service
perplexity = get_perplexity_service()

# Get treatment videos
videos = perplexity.get_treatment_videos(
    disease_name="Brown Spot Disease",
    disease_type="fungal",
    max_videos=3
)

# Get general care videos
care_videos = perplexity.get_general_plant_care_videos(max_videos=2)
```

---

## 🎨 Frontend Implementation

### Dashboard Display

Videos are displayed in a responsive grid below the analysis results:

```javascript
function displayYouTubeVideos(videos) {
    if (!videos || videos.length === 0) return '';
    
    return `
        <div class="mt-8 bg-white border border-gray-200 rounded-lg p-6">
            <h5 class="font-bold text-xl mb-4">
                <i class="fab fa-youtube text-red-600 mr-3"></i>
                Recommended Treatment Videos
            </h5>
            <div class="grid md:grid-cols-3 gap-6">
                ${videos.map(video => `
                    <div class="bg-gray-50 rounded-lg overflow-hidden">
                        <iframe 
                            src="https://www.youtube.com/embed/${video.video_id}"
                            frameborder="0" 
                            allowfullscreen>
                        </iframe>
                        <div class="p-4">
                            <h6>${video.title}</h6>
                            <a href="${video.url}" target="_blank">
                                Watch on YouTube
                            </a>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}
```

### History Modal

Videos are also displayed in the detail modal when viewing past analyses.

---

## 🧪 Testing

### Test Perplexity Integration

Create `test_perplexity.py`:

```python
from services.perplexity_service import PerplexityService

# Initialize service
service = PerplexityService()

# Test disease video search
videos = service.get_treatment_videos(
    disease_name="Powdery Mildew",
    disease_type="fungal",
    max_videos=3
)

print(f"Found {len(videos)} videos:")
for video in videos:
    print(f"- {video.title}")
    print(f"  URL: {video.url}")
    print(f"  Thumbnail: {video.thumbnail}")
    print()
```

Run test:
```bash
python test_perplexity.py
```

### Test API Endpoint

```bash
# Upload image and analyze (requires authentication)
curl -X POST "http://localhost:8000/api/disease-detection" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test_image.jpg"
```

Response will include `youtube_videos` array.

---

## 🚨 Error Handling

### Graceful Degradation

The system continues to work even if video fetching fails:

1. **No API Key**: Videos are disabled, analysis continues normally
2. **API Error**: Empty video list returned, analysis completes
3. **Network Timeout**: 30-second timeout, then continues without videos
4. **Invalid Response**: Logs error, returns empty list

### Logging

All video-related operations are logged:

```python
logger.info(f"Fetched {len(videos)} videos for {disease_name}")
logger.warning("Perplexity API not configured - returning empty video list")
logger.error(f"Perplexity API error: {response.status_code}")
```

Check logs:
```bash
tail -f disease_detection.log
```

---

## 💰 Cost Considerations

### Perplexity API Pricing

- **Free Tier**: Limited requests per month
- **Pro Plan**: Higher rate limits
- **Enterprise**: Unlimited requests

### Optimization Tips

1. **Cache Results**: Store videos in database (already implemented)
2. **Rate Limiting**: Limit requests per user per day
3. **Batch Processing**: Process multiple analyses together
4. **Fallback**: Use cached videos for common diseases

### Cost Estimation

Assuming:
- 1000 analyses per month
- 3 videos per analysis
- $0.01 per API call

**Monthly Cost**: ~$10

---

## 🔒 Security & Privacy

### API Key Protection

- Store in `.env` file (never commit)
- Use environment variables in production
- Rotate keys regularly

### User Data

- Video links are public YouTube URLs
- No personal data sent to Perplexity
- Videos stored in user's analysis records only

### Content Filtering

- Perplexity returns educational content
- Videos are from YouTube (trusted source)
- Manual review recommended for production

---

## 🎯 Future Enhancements

### Planned Features

1. **Video Ratings**: Let users rate video helpfulness
2. **Custom Playlists**: Curated video collections by experts
3. **Offline Mode**: Download videos for offline viewing
4. **Multi-Language**: Videos in user's preferred language
5. **Video Transcripts**: Display video captions/transcripts
6. **Related Videos**: "More like this" recommendations
7. **Video Analytics**: Track which videos are most helpful

### Advanced Features

1. **AI Video Analysis**: Analyze video content for relevance
2. **Custom Video Upload**: Let experts upload their own videos
3. **Live Streaming**: Connect with plant experts via video
4. **AR Integration**: Overlay treatment instructions on camera view

---

## 📝 API Reference

### GET /api/my-analyses

Returns analysis history including YouTube videos.

**Response:**
```json
{
  "total": 10,
  "records": [
    {
      "id": "507f1f77bcf86cd799439011",
      "disease_name": "Brown Spot",
      "youtube_videos": [
        {
          "title": "Treatment Guide",
          "video_id": "dQw4w9WgXcQ",
          "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          "thumbnail": "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
        }
      ]
    }
  ]
}
```

### GET /api/analyses/{id}

Returns detailed analysis including YouTube videos.

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "disease_name": "Brown Spot Disease",
  "youtube_videos": [
    {
      "title": "How to Treat Brown Spot",
      "video_id": "dQw4w9WgXcQ",
      "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "thumbnail": "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
    }
  ]
}
```

---

## 🐛 Troubleshooting

### No Videos Appearing

**Check API Key:**
```bash
# Verify .env file
cat .env | grep PERPLEXITY_API_KEY
```

**Check Logs:**
```bash
# Look for errors
tail -f disease_detection.log | grep -i perplexity
```

**Test Service:**
```python
from services.perplexity_service import get_perplexity_service
service = get_perplexity_service()
print(f"Service enabled: {service.enabled}")
```

### API Errors

**401 Unauthorized**: Invalid API key
- Verify key in `.env`
- Check key hasn't expired
- Regenerate key if needed

**429 Too Many Requests**: Rate limit exceeded
- Wait before retrying
- Upgrade to higher tier
- Implement caching

**Timeout Errors**: Network issues
- Check internet connection
- Increase timeout in code
- Use retry logic

### Video Embed Issues

**Videos Not Loading:**
- Check browser console for errors
- Verify YouTube URLs are valid
- Test video IDs manually

**CORS Errors:**
- YouTube embeds should work by default
- Check browser security settings
- Try different browser

---

## 📚 Additional Resources

### Documentation
- [Perplexity API Docs](https://docs.perplexity.ai/)
- [YouTube Embed API](https://developers.google.com/youtube/iframe_api_reference)
- [MongoDB Schema Design](https://www.mongodb.com/docs/manual/core/data-modeling-introduction/)

### Support
- GitHub Issues: Report bugs and request features
- Email: Contact for enterprise support
- Community: Join our Discord/Slack

---

## ✅ Checklist

Before deploying to production:

- [ ] Perplexity API key configured
- [ ] Environment variables set
- [ ] Database schema updated
- [ ] Frontend updated with video display
- [ ] Error handling tested
- [ ] Logging configured
- [ ] Rate limiting implemented
- [ ] Cost monitoring set up
- [ ] User documentation updated
- [ ] Security review completed

---

## 📄 License

This feature is part of the Leaf Disease Detection System and follows the same MIT License.

---

**Version**: 1.0  
**Last Updated**: November 28, 2025  
**Status**: Production Ready ✅
