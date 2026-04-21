# Rate Limiting Fix Documentation

## Problem
The prescription page and other pages were failing to load with 500 Internal Server Error due to rate limiting being too aggressive. Users were hitting the rate limit (10 requests/minute for free users) when loading pages that make multiple API calls.

Error message:
```
fastapi.exceptions.HTTPException: 429: Rate limit exceeded. Maximum 10 requests per minute.
```

## Root Cause
1. Rate limits were too low (Free: 10/min, Basic: 30/min, Premium: 60/min, Enterprise: 120/min)
2. Rate limiting was applied to ALL API requests including read-only GET requests
3. Pages like prescriptions, dashboard, and history make multiple API calls on load

## Solution Implemented

### 1. Exempted Read-Only Requests
Modified `src/middleware/rate_limiting.py` to:
- Exempt all GET requests from rate limiting
- Exempt specific read-only endpoints:
  - `/api/subscriptions/plans`
  - `/api/subscriptions/my-subscription`
  - `/api/prescriptions/my-prescriptions`
  - `/api/my-analyses`
  - `/api/notifications`
  - `/system/status`
  - `/auth/me`
- Only rate limit POST/PUT/DELETE requests (analysis and heavy operations)

### 2. Increased Rate Limits
Updated rate limits in `src/database/subscription_models.py`:

| Plan | Old Limit | New Limit | Increase |
|------|-----------|-----------|----------|
| Free | 10/min | 30/min | 3x |
| Basic | 30/min | 60/min | 2x |
| Premium | 60/min | 120/min | 2x |
| Enterprise | 120/min | 300/min | 2.5x |

### 3. Updated Existing Plans
Created `scripts/update_rate_limits.py` to update existing plans in the database with new limits.

## Benefits

✅ **Pages load without errors** - Multiple API calls no longer trigger rate limits
✅ **Better user experience** - No more 429 errors when browsing
✅ **Focused rate limiting** - Only limits resource-intensive operations (POST/PUT/DELETE)
✅ **Scalable** - Higher limits support more concurrent users

## Rate Limiting Strategy

### What IS Rate Limited (POST/PUT/DELETE only):
- Disease analysis submissions (`POST /api/disease-detection`)
- Prescription generation (`POST /api/prescriptions/generate`)
- Subscription changes (`POST /api/subscriptions/create-order`)
- Bulk operations (`POST /api/enterprise/bulk-analysis`)

### What is NOT Rate Limited:
- All GET requests (viewing data)
- Static file serving
- Authentication endpoints
- Health checks
- Read-only operations

## How to Apply

### For New Installations:
The new rate limits are in the code and will be applied automatically when running:
```cmd
python scripts\initialize_subscription_plans.py
```

### For Existing Installations:
Run the update script:
```cmd
# Windows
update_rate_limits.bat

# Or directly
python scripts\update_rate_limits.py
```

## Verification

After applying the fix:
1. Restart the FastAPI server
2. Login to the application
3. Navigate to the prescriptions page
4. Page should load without errors
5. Check server logs - no more 429 errors

## Monitoring

Rate limit headers are added to responses:
- `X-RateLimit-Limit` - Maximum requests per minute
- `X-RateLimit-Remaining` - Remaining requests in current minute
- `X-RateLimit-Reset` - Unix timestamp when limit resets

## Future Improvements

Consider implementing:
1. **Sliding window rate limiting** - More accurate than fixed windows
2. **Per-endpoint rate limits** - Different limits for different operations
3. **Burst allowance** - Allow short bursts above the limit
4. **Redis-based rate limiting** - For distributed deployments
5. **User-specific overrides** - Custom limits for specific users

## Troubleshooting

If users still experience rate limiting:

1. **Check current limits:**
   ```python
   python scripts\verify_user_quotas.py
   ```

2. **Clear rate limit cache:**
   ```javascript
   // In MongoDB
   db.rate_limits.deleteMany({})
   ```

3. **Increase limits further:**
   - Edit `src/database/subscription_models.py`
   - Update `DEFAULT_SUBSCRIPTION_PLANS`
   - Run `python scripts\update_rate_limits.py`

4. **Disable rate limiting temporarily:**
   - Comment out rate limiting middleware in `src/app.py`
   - Only for debugging, not recommended for production
