# Admin Panel Documentation

## Overview

The Admin Panel provides comprehensive system management capabilities including user management, API configuration, usage tracking, and cost monitoring.

## Features

### 1. **Dashboard Overview**
- Total users count
- Total analyses performed
- Total API calls made
- Total estimated costs
- 30-day usage charts with:
  - API calls trend
  - Analyses trend
  - Cost trend

### 2. **User Management**
- View all registered users
- See user statistics:
  - Total analyses
  - Diseases detected
  - Healthy plants analyzed
  - API costs per user
  - Last activity timestamp
- Toggle user active/inactive status
- View admin users

### 3. **API Usage Tracking**
- Real-time API usage monitoring
- Filter by:
  - API type (Groq/Perplexity)
  - Time period (7/30/90 days, all time)
- View detailed records:
  - Username
  - API type
  - Endpoint called
  - Tokens used
  - Estimated cost
  - Timestamp
  - Success/failure status
- Usage statistics:
  - Total requests
  - Successful requests
  - Failed requests
  - Total tokens consumed
  - Total cost

### 4. **API Configuration**
- Manage Groq API:
  - Update API key
  - View current model
  - Check active status
- Manage Perplexity API:
  - Update API key
  - View current model
  - Check active status
- Real-time status indicators

## Access Control

- **Admin Only**: Only users with `is_admin: true` can access the admin panel
- **Automatic Redirect**: Non-admin users are redirected to dashboard
- **Session Validation**: All requests require valid admin authentication

## API Endpoints

### Overview Stats
```
GET /admin/stats/overview
```
Returns comprehensive system statistics.

### User Management
```
GET /admin/users?skip=0&limit=50
```
Get all users with their statistics.

```
PATCH /admin/users/{username}/toggle-active
```
Toggle user active status.

### API Usage
```
GET /admin/api-usage?days=7&api_type=groq
```
Get API usage records with filters.

### API Configuration
```
GET /admin/api-config
```
Get current API configuration.

```
PUT /admin/api-config?api_type=groq&api_key=xxx
```
Update API keys.

### Usage Charts
```
GET /admin/usage-chart?days=30
```
Get daily usage data for charts.

## Usage Tracking

### Automatic Tracking

The system automatically tracks:

1. **Groq API Usage**:
   - Triggered on every disease detection
   - Tracks tokens used (estimated)
   - Currently free (cost = $0.00)
   - Model: `meta-llama/llama-4-scout-17b-16e-instruct`

2. **Perplexity API Usage**:
   - Triggered when fetching YouTube videos
   - Tracks tokens used (estimated)
   - Cost: $0.20 per 1M tokens (sonar model)
   - Model: `sonar`

### Cost Calculation

**Groq Pricing**:
- Free tier (no cost)

**Perplexity Pricing**:
- Sonar: $0.20 per 1M tokens
- Sonar Pro: $1.00 per 1M tokens

Formula:
```
cost = (tokens_used / 1,000,000) * price_per_million
```

## Database Collections

### api_usage
Stores API usage records:
```json
{
  "user_id": "string",
  "username": "string",
  "api_type": "groq|perplexity",
  "endpoint": "string",
  "model_used": "string",
  "tokens_used": 0,
  "estimated_cost": 0.0,
  "timestamp": "datetime",
  "success": true,
  "error_message": "string"
}
```

### api_config
Stores API configuration (optional):
```json
{
  "api_type": "groq|perplexity",
  "api_key": "string",
  "is_active": true,
  "rate_limit_per_minute": 0,
  "rate_limit_per_day": 0,
  "updated_at": "datetime",
  "updated_by": "string"
}
```

## UI Components

### Charts
- Line chart showing 30-day trends
- Dual Y-axis (counts and costs)
- Interactive tooltips
- Responsive design

### Tables
- Sortable columns
- Pagination support
- Status indicators
- Action buttons

### Filters
- API type dropdown
- Time period selector
- Real-time filtering

## Security

1. **Authentication Required**: All endpoints require admin JWT token
2. **Role-Based Access**: Only admin users can access
3. **API Key Protection**: Keys are masked in display (first 20 chars + "...")
4. **Secure Updates**: API key updates require confirmation
5. **Environment Variables**: Keys stored in .env file

## Usage Example

### Creating an Admin User

```bash
python scripts/create_admin.py
```

### Accessing Admin Panel

1. Login as admin user
2. Navigate to `/admin` or click "Admin Panel" in dashboard
3. View overview statistics
4. Switch between tabs:
   - Overview: Charts and statistics
   - Users: User management
   - API Usage: Usage records
   - API Config: API key management

### Updating API Keys

1. Go to "API Config" tab
2. Enter new API key
3. Click "Update [API] API Key"
4. Confirm the update
5. Status indicator updates automatically

### Monitoring Costs

1. View "Total Cost" card on overview
2. Check cost breakdown (Groq vs Perplexity)
3. View daily cost trends in chart
4. Filter API usage by type to see detailed costs

## Best Practices

1. **Regular Monitoring**: Check usage daily to track costs
2. **User Management**: Deactivate inactive users
3. **API Key Rotation**: Update keys periodically for security
4. **Cost Alerts**: Monitor for unusual spikes in usage
5. **Backup Keys**: Keep backup of API keys securely

## Troubleshooting

### Admin Panel Not Accessible
- Verify user has `is_admin: true` in database
- Check authentication token is valid
- Ensure admin routes are included in app

### Usage Not Tracking
- Check MongoDB connection
- Verify `api_usage` collection exists
- Check logs for tracking errors

### API Keys Not Updating
- Verify .env file permissions
- Check file path is correct
- Ensure python-dotenv is installed

### Charts Not Loading
- Check Chart.js is loaded
- Verify API endpoint returns data
- Check browser console for errors

## Future Enhancements

- [ ] Email alerts for high usage
- [ ] Rate limiting configuration
- [ ] Export usage reports (CSV/PDF)
- [ ] Cost budgets and alerts
- [ ] API key expiration tracking
- [ ] Detailed error logs
- [ ] User activity timeline
- [ ] Bulk user operations
- [ ] API health monitoring
- [ ] Custom date range selection
