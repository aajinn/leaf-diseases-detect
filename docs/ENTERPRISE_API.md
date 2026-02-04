# Enterprise API Documentation

## Overview

The Enterprise API system provides advanced features and programmatic access for Enterprise subscription users. It includes bulk analysis, advanced analytics, API key management, and higher rate limits.

## Features

### 1. Enterprise Web Interface (`/api/enterprise/`)
- **Status Dashboard**: View subscription details and usage limits
- **Bulk Analysis**: Upload and analyze multiple images simultaneously
- **Advanced Analytics**: Detailed insights with filtering and trends
- **API Key Management**: Generate and manage API keys for programmatic access
- **Data Export**: Export analysis data as CSV

### 2. Programmatic API (`/api/v1/`)
- **RESTful API**: Standard HTTP endpoints for integration
- **API Key Authentication**: Secure access using generated API keys
- **Batch Processing**: Analyze multiple images in a single request
- **Rate Limiting**: Higher limits for Enterprise users (120 req/min)

## Authentication

### Web Interface
Uses standard JWT token authentication. Requires active Enterprise subscription.

### Programmatic API
Uses API key authentication with `Authorization: Bearer <api_key>` header.

## Quick Start (Programmatic API)

1. Create an API key in the Enterprise Dashboard (`Enterprise Dashboard → API Keys → Create New Key`).
2. Call the API with the key in the `Authorization` header.
3. Parse the JSON response fields like `disease_type`, `severity`, and `confidence`.

**Example request (cURL):**
```bash
curl -X POST "https://your-domain.com/api/v1/analyze" \
  -H "Authorization: Bearer ent_xxxxxxxxxxxxxxxxxxxxx" \
  -F "file=@leaf_sample.jpg"
```

**Example response:**
```json
{
  "analysis_id": "65f0c2b5f2e7a12345678901",
  "disease_detected": true,
  "disease_name": "Brown Spot Disease",
  "disease_type": "fungal",
  "severity": "moderate",
  "confidence": 87.5,
  "symptoms": ["brown spots on leaves", "yellowing"],
  "possible_causes": ["high humidity", "poor air circulation"],
  "treatment": ["apply fungicide", "improve ventilation"],
  "description": "Detailed analysis description",
  "analysis_timestamp": "2026-02-04T12:00:00Z",
  "metadata": null
}
```

## Rate Limits

| Plan Type | Rate Limit (per minute) |
|-----------|------------------------|
| Free      | 10                     |
| Basic     | 30                     |
| Premium   | 60                     |
| Enterprise| 120                    |

## API Endpoints

### Enterprise Web Interface

#### GET `/api/enterprise/status`
Get enterprise account status and limits.

**Response:**
```json
{
  "user_id": "string",
  "username": "string",
  "plan": {
    "name": "Enterprise Plan",
    "type": "enterprise",
    "max_analyses_per_month": 0,
    "max_image_size_mb": 50,
    "api_rate_limit_per_minute": 120,
    "features": ["unlimited_analyses", "api_access", "bulk_analysis"]
  },
  "subscription": {
    "status": "active",
    "start_date": "2024-01-01T00:00:00Z",
    "end_date": "2024-12-31T23:59:59Z",
    "billing_cycle": "yearly"
  },
  "usage": {
    "analyses_used": 1250,
    "analyses_limit": 0,
    "is_unlimited": true
  }
}
```

#### POST `/api/enterprise/bulk-analysis`
Analyze multiple images in parallel.

**Request:**
- `files`: List of image files (max 100)
- `batch_name`: Optional batch identifier
- `metadata`: Optional metadata object

**Response:**
```json
{
  "batch_id": "uuid",
  "batch_name": "string",
  "total_images": 50,
  "processed_images": 48,
  "failed_images": 2,
  "results": [...],
  "processing_time_seconds": 45.2,
  "metadata": {}
}
```

#### GET `/api/enterprise/analytics`
Get advanced analytics with filtering.

**Query Parameters:**
- `start_date`: Filter start date (ISO format)
- `end_date`: Filter end date (ISO format)
- `disease_types`: Comma-separated disease types
- `severity_levels`: Comma-separated severity levels

**Response:**
```json
{
  "total_analyses": 1250,
  "disease_distribution": {
    "fungal": {"count": 450, "avg_confidence": 87.2},
    "bacterial": {"count": 300, "avg_confidence": 82.1}
  },
  "severity_distribution": {
    "mild": 400,
    "moderate": 600,
    "severe": 250
  },
  "confidence_stats": {
    "avg_confidence": 84.5,
    "min_confidence": 45.2,
    "max_confidence": 98.7
  },
  "temporal_trends": [
    {
      "date": "2024-01-01",
      "total_analyses": 25,
      "diseases_detected": 18,
      "detection_rate": 72.0
    }
  ],
  "success_rate": 96.8
}
```

#### POST `/api/enterprise/api-keys`
Generate new API key.

**Request:**
```json
{
  "name": "Production API Key",
  "description": "API key for production system integration",
  "expires_in_days": 365
}
```

**Response:**
```json
{
  "key_id": "uuid",
  "api_key": "ent_xxxxxxxxxxxxxxxxxxxxx",
  "name": "Production API Key",
  "description": "API key for production system integration",
  "created_at": "2024-01-01T00:00:00Z",
  "expires_at": "2024-12-31T23:59:59Z",
  "is_active": true
}
```
**Note:** The full `api_key` is only shown once. Store it securely.

### Programmatic API

#### GET `/api/v1/health`
Health check endpoint.

**Headers:**
```
Authorization: Bearer ent_xxxxxxxxxxxxxxxxxxxxx
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00Z",
  "api_version": "1.0.0",
  "user_id": "string",
  "rate_limit_remaining": 119
}
```

#### POST `/api/v1/analyze`
Analyze single image file.

**Headers:**
```
Authorization: Bearer ent_xxxxxxxxxxxxxxxxxxxxx
Content-Type: multipart/form-data
```

**Request:**
- `file`: Image file (max 50MB)

**Response:**
```json
{
  "analysis_id": "string",
  "disease_detected": true,
  "disease_name": "Brown Spot Disease",
  "disease_type": "fungal",
  "severity": "moderate",
  "confidence": 87.5,
  "symptoms": ["brown spots on leaves", "yellowing"],
  "possible_causes": ["high humidity", "poor air circulation"],
  "treatment": ["apply fungicide", "improve ventilation"],
  "description": "Detailed analysis description",
  "analysis_timestamp": "2024-01-01T12:00:00Z",
  "metadata": null
}
```

#### POST `/api/v1/analyze-base64`
Analyze image provided as base64 string.

**Headers:**
```
Authorization: Bearer ent_xxxxxxxxxxxxxxxxxxxxx
Content-Type: application/json
```

**Request:**
```json
{
  "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
  "filename": "leaf_sample.jpg",
  "metadata": {
    "location": "greenhouse_1",
    "plant_type": "tomato"
  }
}
```

#### POST `/api/v1/batch-analyze`
Analyze multiple images in batch.

**Request:**
```json
{
  "images": [
    {
      "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
      "filename": "sample1.jpg",
      "metadata": {"plot": "A1"}
    },
    {
      "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
      "filename": "sample2.jpg",
      "metadata": {"plot": "A2"}
    }
  ],
  "batch_name": "Field Survey 2024-01",
  "metadata": {
    "survey_date": "2024-01-15",
    "surveyor": "John Doe"
  }
}
```

**Response:**
```json
{
  "batch_id": "uuid",
  "batch_name": "Field Survey 2024-01",
  "total_images": 2,
  "successful_analyses": 2,
  "failed_analyses": 0,
  "results": [...],
  "processing_time_seconds": 3.2,
  "metadata": {
    "survey_date": "2024-01-15",
    "surveyor": "John Doe"
  }
}
```

#### GET `/api/v1/analyses`
Get analysis history with pagination.

**Query Parameters:**
- `limit`: Number of results (default: 50, max: 100)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
{
  "analyses": [...],
  "total_count": 1250,
  "limit": 50,
  "offset": 0,
  "has_more": true
}
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "detail": "Error description",
  "status_code": 400
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad Request (invalid input)
- `401`: Unauthorized (invalid/missing API key)
- `403`: Forbidden (insufficient permissions)
- `413`: Payload Too Large (file size exceeded)
- `429`: Too Many Requests (rate limit exceeded)
- `500`: Internal Server Error

## Rate Limit Headers

API responses include rate limit information:

```
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 119
X-RateLimit-Reset: 1704110460
```

## Integration Examples

### Python Example

```python
import requests
import base64

# Configuration
API_BASE_URL = "https://your-domain.com/api/v1"
API_KEY = "ent_xxxxxxxxxxxxxxxxxxxxx"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# Analyze single image
def analyze_image(image_path):
    with open(image_path, "rb") as f:
        image_data = base64.b64encode(f.read()).decode()
    
    payload = {
        "image_base64": image_data,
        "filename": image_path.split("/")[-1],
        "metadata": {"source": "python_client"}
    }
    
    response = requests.post(
        f"{API_BASE_URL}/analyze-base64",
        headers=headers,
        json=payload
    )
    
    return response.json()

# Batch analysis
def batch_analyze(image_paths):
    images = []
    for path in image_paths:
        with open(path, "rb") as f:
            image_data = base64.b64encode(f.read()).decode()
        
        images.append({
            "image_base64": image_data,
            "filename": path.split("/")[-1]
        })
    
    payload = {
        "images": images,
        "batch_name": "Python Batch Analysis"
    }
    
    response = requests.post(
        f"{API_BASE_URL}/batch-analyze",
        headers=headers,
        json=payload
    )
    
    return response.json()
```

### cURL Examples

```bash
# Health check
curl -X GET "https://your-domain.com/api/v1/health" \
  -H "Authorization: Bearer ent_xxxxxxxxxxxxxxxxxxxxx"

# Analyze image file
curl -X POST "https://your-domain.com/api/v1/analyze" \
  -H "Authorization: Bearer ent_xxxxxxxxxxxxxxxxxxxxx" \
  -F "file=@leaf_sample.jpg"

# Get analysis history
curl -X GET "https://your-domain.com/api/v1/analyses?limit=10&offset=0" \
  -H "Authorization: Bearer ent_xxxxxxxxxxxxxxxxxxxxx"
```

## Best Practices

1. **API Key Security**: Store API keys securely and rotate them regularly
2. **Rate Limiting**: Implement client-side rate limiting to avoid 429 errors
3. **Error Handling**: Always handle API errors gracefully
4. **Batch Processing**: Use batch endpoints for multiple images to improve efficiency
5. **Metadata**: Include relevant metadata for better tracking and analytics
6. **File Size**: Optimize image sizes before upload (max 50MB per image)
7. **Monitoring**: Monitor API usage and performance metrics

## Support

For Enterprise API support:
- Email: enterprise@leafdisease.com
- Phone: 24/7 support hotline
- Documentation: https://docs.leafdisease.com/enterprise-api
- Status Page: https://status.leafdisease.com
