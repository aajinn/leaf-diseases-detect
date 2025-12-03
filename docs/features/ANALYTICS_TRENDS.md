# Analytics Trends Feature

## Overview
The Analytics Trends feature provides comprehensive analytics and visualization for the admin dashboard, including API usage trends, cost analysis, and user activity metrics.

## New Endpoints

### `/api/admin/analytics/trends`
Get comprehensive analytics trends over a specified time period.

**Parameters:**
- `days` (optional, default: 30): Number of days to analyze

**Response:**
```json
{
  "period": {
    "start": "2024-11-03T00:00:00",
    "end": "2024-12-03T00:00:00",
    "days": 30
  },
  "daily_trends": [
    {
      "date": "2024-11-03",
      "api_calls": 45,
      "groq_calls": 30,
      "perplexity_calls": 15,
      "analyses": 30,
      "diseases_detected": 18,
      "healthy_plants": 12,
      "cost": 0.0234,
      "groq_cost": 0.0156,
      "perplexity_cost": 0.0078,
      "tokens": 12500
    }
  ],
  "summary": {
    "total_api_calls": 1350,
    "total_analyses": 900,
    "total_cost": 0.7020,
    "total_tokens": 375000,
    "avg_api_calls_per_day": 45.0,
    "avg_analyses_per_day": 30.0,
    "avg_cost_per_day": 0.0234,
    "growth_rate_percent": 12.5
  }
}
```

### `/api/admin/analytics/user-activity`
Get daily active user trends.

**Parameters:**
- `days` (optional, default: 30): Number of days to analyze

**Response:**
```json
{
  "daily_active_users": [
    {
      "date": "2024-11-03",
      "active_users": 8
    }
  ],
  "total_registered_users": 45
}
```

### `/api/admin/analytics/cost-breakdown`
Get detailed cost breakdown by API type and model.

**Parameters:**
- `days` (optional, default: 30): Number of days to analyze

**Response:**
```json
{
  "groq": {
    "total_cost": 0.4680,
    "total_calls": 900,
    "total_tokens": 250000
  },
  "perplexity": {
    "total_cost": 0.2340,
    "total_calls": 450,
    "total_tokens": 125000
  },
  "by_model": {
    "meta-llama/llama-4-scout-17b-16e-instruct": {
      "cost": 0.4680,
      "calls": 900,
      "tokens": 250000,
      "avg_cost_per_call": 0.00052
    },
    "sonar": {
      "cost": 0.2340,
      "calls": 450,
      "tokens": 125000,
      "avg_cost_per_call": 0.00052
    }
  }
}
```

## Analytics Service

The `AnalyticsService` class in `services/analytics_service.py` provides the following methods:

### `get_trends(days: int = 30)`
Retrieves comprehensive trend data including:
- Daily API calls (total, Groq, Perplexity)
- Daily analyses (total, diseases detected, healthy plants)
- Daily costs and tokens
- Summary statistics with averages and growth rates

### `get_user_activity_trends(days: int = 30)`
Retrieves daily active user counts based on analysis activity.

### `get_cost_breakdown(days: int = 30)`
Provides detailed cost analysis grouped by:
- API type (Groq vs Perplexity)
- Model used
- Average cost per call

## Dashboard Charts

The admin dashboard now includes the following visualizations:

### 1. Usage Trends Chart
Multi-line chart showing:
- API calls over time
- Analyses over time
- Cost over time (on secondary axis)

### 2. API Usage Distribution Chart
Stacked bar chart showing:
- Groq API calls
- Perplexity API calls

### 3. Disease Detection Trends Chart
Line chart showing:
- Diseases detected
- Healthy plants

### 4. Daily Active Users Chart
Bar chart showing the number of unique users performing analyses each day.

### 5. Summary Cards
- Average API calls per day
- Average analyses per day
- Average cost per day
- Total tokens used
- Growth rate percentage

## Usage

### Frontend
The analytics dashboard automatically loads when accessing the Overview tab in the admin panel. Users can select different time ranges (7, 30, or 90 days) using the dropdown selector.

### Backend
To use the analytics service in your code:

```python
from services.analytics_service import AnalyticsService

# Get 30-day trends
trends = await AnalyticsService.get_trends(days=30)

# Get user activity
activity = await AnalyticsService.get_user_activity_trends(days=7)

# Get cost breakdown
costs = await AnalyticsService.get_cost_breakdown(days=90)
```

## Features

- **Real-time Analytics**: All data is computed in real-time from the database
- **Flexible Time Ranges**: Support for 7, 30, and 90-day periods
- **Growth Tracking**: Automatic calculation of growth rates
- **Cost Analysis**: Detailed breakdown by API provider and model
- **Interactive Charts**: Responsive Chart.js visualizations with tooltips
- **Admin-Only Access**: All endpoints require admin authentication

## Technical Details

### Dependencies
- FastAPI for API endpoints
- Motor (async MongoDB driver) for database queries
- Chart.js for frontend visualizations
- Tailwind CSS for styling

### Database Collections Used
- `api_usage`: API call records with costs and tokens
- `analysis_records`: Disease detection analysis records
- `users`: User information

### Performance Considerations
- Queries are optimized with date range filters
- Results are limited to prevent excessive data transfer
- Aggregation pipelines used for efficient counting
- Charts automatically adjust to data density

## Future Enhancements

Potential improvements:
- Export analytics data to CSV/PDF
- Email reports for admins
- Predictive analytics and forecasting
- Custom date range selection
- Real-time dashboard updates via WebSocket
- Comparison between time periods
- User-specific analytics drill-down
