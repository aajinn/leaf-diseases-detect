# LLM API Prompts Documentation

This document lists all prompts used in the application for LLM API calls.

## Overview

The application uses LLM APIs (specifically Groq API with Llama Vision models) for leaf disease detection and analysis. All prompts are designed to ensure consistent, structured JSON responses.

---

## 1. Leaf Disease Analysis Prompt

**Location:** `src/core/disease_detector.py` - `create_analysis_prompt()` method

**Model:** `meta-llama/llama-4-scout-17b-16e-instruct` (Groq API)

**Purpose:** Analyze leaf images to detect diseases, assess severity, and provide treatment recommendations. Also validates that uploaded images contain actual plant leaves.

**Temperature:** 0.3 (default)

**Max Tokens:** 1024 (default)

### Full Prompt Text

```
IMPORTANT: First determine if this image contains a plant leaf or vegetation. If the image shows humans, animals, objects, buildings, or anything other than plant leaves/vegetation, return the "invalid_image" response format below.

If this is a valid leaf/plant image, analyze it for diseases and return the results in JSON format.

Please identify:
1. Whether this is actually a leaf/plant image
2. Disease name (if any)
3. Disease type/category or invalid_image
4. Severity level (mild, moderate, severe)
5. Confidence score (0-100%)
6. Symptoms observed
7. Possible causes
8. Treatment recommendations

For NON-LEAF images (humans, animals, objects, or not detected as leaves, etc.), return this format:
{
    "disease_detected": false,
    "disease_name": null,
    "disease_type": "invalid_image",
    "severity": "none",
    "confidence": 95,
    "symptoms": ["This image does not contain a plant leaf"],
    "possible_causes": ["Invalid image type uploaded"],
    "treatment": ["Please upload an image of a plant leaf for disease analysis"]
}

For VALID LEAF images, return this format:
{
    "disease_detected": true/false,
    "disease_name": "name of disease or null",
    "disease_type": "fungal/bacterial/viral/pest/nutrient deficiency/healthy",
    "severity": "mild/moderate/severe/none",
    "confidence": 85,
    "symptoms": ["list", "of", "symptoms"],
    "possible_causes": ["list", "of", "causes"],
    "treatment": ["list", "of", "treatments"]
}
```

### Input Format

- **Image Format:** Base64 encoded image data
- **Image URL Format:** `data:image/jpeg;base64,{base64_image}`
- **Message Role:** User
- **Content Type:** Multi-modal (text + image_url)

### Expected Output Schema

#### For Invalid Images (Non-Leaf Content)
```json
{
    "disease_detected": false,
    "disease_name": null,
    "disease_type": "invalid_image",
    "severity": "none",
    "confidence": 95,
    "symptoms": ["This image does not contain a plant leaf"],
    "possible_causes": ["Invalid image type uploaded"],
    "treatment": ["Please upload an image of a plant leaf for disease analysis"]
}
```

#### For Valid Leaf Images (Healthy)
```json
{
    "disease_detected": false,
    "disease_name": null,
    "disease_type": "healthy",
    "severity": "none",
    "confidence": 90,
    "symptoms": [],
    "possible_causes": [],
    "treatment": []
}
```

#### For Valid Leaf Images (Disease Detected)
```json
{
    "disease_detected": true,
    "disease_name": "Leaf Rust",
    "disease_type": "fungal",
    "severity": "moderate",
    "confidence": 85,
    "symptoms": ["Orange-red pustules", "Leaf yellowing", "Stem weakness"],
    "possible_causes": ["Humid conditions", "Moderate temperatures", "Wind dispersal"],
    "treatment": ["Apply fungicide", "Remove infected plants", "Improve air circulation"]
}
```

### Disease Types Supported

- `fungal` - Fungal infections
- `bacterial` - Bacterial diseases
- `viral` - Viral infections
- `pest` - Pest damage
- `nutrient deficiency` - Nutrient-related issues
- `healthy` - No disease detected
- `invalid_image` - Non-leaf image uploaded

### Severity Levels

- `none` - No disease or invalid image
- `mild` - Early stage disease
- `moderate` - Progressing disease
- `severe` - Advanced disease requiring immediate action

---

## Token Usage Tracking

The application tracks token usage for each API call:

- **Prompt Tokens:** Number of input tokens (prompt + image)
- **Completion Tokens:** Number of output tokens (response)
- **Total Tokens:** Sum of prompt and completion tokens

Token usage is logged and stored in the database for cost tracking and analytics.

---

## API Configuration

**Provider:** Groq API  
**Base URL:** `https://api.groq.com/openai/v1`  
**Authentication:** API Key (stored in `.env` as `GROQ_API_KEY`)  
**Model:** `meta-llama/llama-4-scout-17b-16e-instruct`

### Request Parameters

```python
{
    "model": "meta-llama/llama-4-scout-17b-16e-instruct",
    "messages": [
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "<prompt>"},
                {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64,..."}}
            ]
        }
    ],
    "temperature": 0.3,
    "max_completion_tokens": 1024,
    "top_p": 1,
    "stream": false,
    "stop": null
}
```

---

## Response Parsing

The application includes robust response parsing that:

1. Removes markdown code blocks (```json ... ```)
2. Extracts JSON from mixed content responses
3. Validates required fields
4. Converts to `DiseaseAnalysisResult` dataclass
5. Adds token usage metadata

---

## Error Handling

The prompt is designed to handle:

- Invalid image types (humans, animals, objects)
- Unclear or low-quality images
- Multiple diseases in one image
- Edge cases (partial leaves, multiple leaves)

All errors return structured JSON responses with appropriate error messages in the `symptoms` and `treatment` fields.

---

## Usage Example

```python
from src.core.disease_detector import LeafDiseaseDetector

# Initialize detector
detector = LeafDiseaseDetector()

# Analyze image
result = detector.analyze_leaf_image_base64(base64_image_data)

# Check result
if result['disease_type'] == 'invalid_image':
    print("Invalid image uploaded")
elif result['disease_detected']:
    print(f"Disease: {result['disease_name']}")
    print(f"Severity: {result['severity']}")
    print(f"Confidence: {result['confidence']}%")
else:
    print("Healthy leaf detected")
```

---

---

## 2. YouTube Video Recommendation Prompts (Perplexity API)

**Location:** `src/services/perplexity_service.py` - `get_treatment_videos()` and `get_general_plant_care_videos()` methods

**Model:** `sonar` (Perplexity API - cost-efficient model with online search)

**Purpose:** Search YouTube for relevant treatment videos and plant care tutorials based on detected diseases.

### 2.1 Disease Treatment Video Search Prompt

**Method:** `get_treatment_videos(disease_name, disease_type, max_videos=3)`

#### System Message
```
You are a helpful assistant that searches YouTube for plant disease treatment videos. Always include complete YouTube URLs in your response.
```

#### User Message Template
```
Find {max_videos} YouTube video tutorials about treating {disease_name} ({disease_type} disease) in plants.

For each video, you MUST provide:
1. Video title
2. Complete YouTube URL (https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID)

Format your response like this:
1. [Video Title]
   URL: https://www.youtube.com/watch?v=VIDEO_ID
   
2. [Video Title]
   URL: https://www.youtube.com/watch?v=VIDEO_ID

Focus on practical treatment methods, organic solutions, and step-by-step guides.
```

#### Example Request
```
Find 3 YouTube video tutorials about treating Leaf Rust (fungal disease) in plants.

For each video, you MUST provide:
1. Video title
2. Complete YouTube URL (https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID)

Format your response like this:
1. [Video Title]
   URL: https://www.youtube.com/watch?v=VIDEO_ID
   
2. [Video Title]
   URL: https://www.youtube.com/watch?v=VIDEO_ID

Focus on practical treatment methods, organic solutions, and step-by-step guides.
```

#### Expected Output Format
```
1. How to Treat Leaf Rust on Plants - Complete Guide
   URL: https://www.youtube.com/watch?v=abc123def45
   
2. Organic Solutions for Fungal Leaf Diseases
   URL: https://www.youtube.com/watch?v=xyz789ghi01
   
3. Step-by-Step: Eliminating Leaf Rust Naturally
   URL: https://youtu.be/mno234pqr56
```

### 2.2 General Plant Care Video Search Prompt

**Method:** `get_general_plant_care_videos(max_videos=2)`

**Used For:** Healthy leaves or general plant maintenance recommendations

#### System Message
```
You search YouTube for plant care videos. Always include complete YouTube URLs.
```

#### User Message Template
```
Find {max_videos} YouTube videos about general plant care and disease prevention.

For each video, provide:
1. Video title
2. Complete YouTube URL (https://www.youtube.com/watch?v=VIDEO_ID)

Topics: plant health maintenance, disease prevention, watering, fertilization.
```

#### Example Request
```
Find 2 YouTube videos about general plant care and disease prevention.

For each video, provide:
1. Video title
2. Complete YouTube URL (https://www.youtube.com/watch?v=VIDEO_ID)

Topics: plant health maintenance, disease prevention, watering, fertilization.
```

### Response Processing

The service extracts YouTube URLs using regex patterns:
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`

Each video is parsed into a `YouTubeVideo` object:
```python
{
    "title": "Video Title",
    "video_id": "abc123def45",
    "url": "https://www.youtube.com/watch?v=abc123def45",
    "thumbnail": "https://img.youtube.com/vi/abc123def45/hqdefault.jpg",
    "description": None
}
```

### API Configuration

**Provider:** Perplexity AI  
**Authentication:** API Key (stored in `.env` as `PERPLEXITY_API_KEY`)  
**Model:** `sonar` (cost-efficient with online search capability)  
**Alternative Model:** `sonar-pro` (higher quality, higher cost)

### Request Parameters

```python
{
    "model": "sonar",
    "messages": [
        {
            "role": "system",
            "content": "<system_message>"
        },
        {
            "role": "user",
            "content": "<user_query>"
        }
    ]
}
```

### Usage in Application Flow

1. User uploads leaf image
2. Groq API analyzes image and detects disease
3. If disease detected → Perplexity searches for treatment videos
4. If healthy leaf → Perplexity searches for general care videos
5. Videos displayed in frontend with thumbnails and links

### Error Handling

- Returns empty list if API key not configured
- Logs warnings if no YouTube URLs found in response
- Gracefully handles video parsing errors
- Continues processing remaining videos if one fails

---

## Token Usage & Cost Tracking

Both APIs track token usage for cost monitoring:

### Groq API (Disease Detection)
- **Pricing:** Varies by model (stored in `GROQ_PRICING`)
- **Tracked Metrics:** prompt_tokens, completion_tokens, total_tokens
- **Cost Calculation:** Based on tokens per million

### Perplexity API (Video Recommendations)
- **Pricing:** $0.20 per million tokens (default for `sonar` model)
- **Tracked Metrics:** input_tokens, output_tokens, total_tokens
- **Cost Calculation:** Based on tokens per million

All usage is stored in MongoDB with:
- User ID and username
- API provider (groq/perplexity)
- Model name
- Token counts
- Calculated cost
- Success/failure status
- Timestamp

---

## Future Enhancements

### Leaf Disease Detection (Groq)
1. Multi-language support for international users
2. Crop-specific analysis (rice, wheat, corn, etc.)
3. Growth stage consideration
4. Environmental context (season, region)
5. Historical disease patterns
6. Preventive recommendations
7. Organic vs. chemical treatment options

### Video Recommendations (Perplexity)
1. Video quality filtering (views, ratings)
2. Language-specific video search
3. Duration preferences (short vs. detailed tutorials)
4. Channel credibility scoring
5. Timestamp extraction for key moments
6. Video transcript analysis
7. Related product recommendations

---

## Related Files

### Disease Detection
- `src/core/disease_detector.py` - Main detector class with prompt
- `src/routes/disease_detection.py` - API endpoint using the detector

### Video Recommendations
- `src/services/perplexity_service.py` - Perplexity service with prompts
- `tests/test_perplexity.py` - Perplexity API tests

### Tracking & Analytics
- `src/utils/usage_tracker.py` - Token usage and cost tracking
- `src/database/admin_models.py` - Pricing configuration

### Documentation
- `docs/API_OPTIMIZATION.md` - API performance documentation
- `docs/CACHING_STRATEGY.md` - Caching implementation details

---

**Last Updated:** December 6, 2025  
**Version:** 1.1
