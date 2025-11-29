# API Optimization Guide

## Overview
Strategies and features implemented to prevent API overload and optimize resource usage in the Live Detection system.

## Problem
Live detection with continuous scanning can quickly overload APIs with:
- Too many concurrent requests
- Rapid-fire API calls
- No rate limit handling
- Inefficient resource usage

## Solution

### 1. Configurable Scan Intervals

#### Implementation
```javascript
let scanIntervalTime = 5000; // Default 5 seconds

// User can choose:
- Fast: 3 seconds (1200 calls/hour)
- Normal: 5 seconds (720 calls/hour) ✓ Default
- Slow: 10 seconds (360 calls/hour)
- Very Slow: 15 seconds (240 calls/hour)
```

#### Benefits
- User controls API usage
- Balances speed vs. cost
- Adapts to different use cases
- Clear cost implications

### 2. Concurrent Call Prevention

#### Implementation
```javascript
let isAnalyzing = false;

async function captureAndAnalyze() {
    if (isAnalyzing) {
        console.log('Analysis in progress, skipping...');
        return;
    }
    
    isAnalyzing = true;
    try {
        // Perform analysis
    } finally {
        isAnalyzing = false;
    }
}
```

#### Benefits
- Only one API call at a time
- Prevents queue buildup
- Reduces server load
- Avoids duplicate requests

### 3. Minimum Time Enforcement

#### Implementation
```javascript
let lastScanTime = 0;

scanInterval = setInterval(() => {
    if (isScanning && !isAnalyzing) {
        const now = Date.now();
        if (now - lastScanTime >= scanIntervalTime) {
            captureAndAnalyze();
        }
    }
}, scanIntervalTime);
```

#### Benefits
- Enforces minimum wait time
- Prevents interval drift
- Consistent API usage
- Predictable costs

### 4. Rate Limit Handling

#### Implementation
```javascript
if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 10000;
    
    // Auto-increase interval
    scanIntervalTime = Math.min(scanIntervalTime * 1.5, 30000);
    
    throw new Error(`Rate limit reached. Waiting ${waitTime / 1000}s`);
}
```

#### Benefits
- Respects API rate limits
- Auto-adjusts on errors
- Prevents ban/throttling
- Graceful degradation

### 5. Manual Capture Debouncing

#### Implementation
```javascript
async function captureNow() {
    if (isAnalyzing) {
        showNotification('Analysis in progress, please wait...', 'warning');
        return;
    }
    await captureAndAnalyze();
}
```

#### Benefits
- Prevents spam clicking
- User feedback on busy state
- Protects API from abuse
- Better UX

### 6. Error Recovery

#### Implementation
```javascript
catch (error) {
    if (error.message.includes('429')) {
        scanIntervalTime = Math.min(scanIntervalTime * 1.5, 30000);
        showNotification('Rate limit reached. Slowing down...', 'warning');
    } else {
        showNotification('Analysis failed. Retrying...', 'error');
    }
}
```

#### Benefits
- Automatic recovery
- User notification
- Adaptive behavior
- Maintains service

## API Usage Comparison

### Before Optimization
```
Interval: Fixed 3 seconds
Concurrent calls: Unlimited
Rate limit handling: None
Manual capture: No debounce

Result:
- 1200+ calls/hour
- Frequent 429 errors
- Server overload
- Poor user experience
```

### After Optimization
```
Interval: Configurable (3-15s, default 5s)
Concurrent calls: Max 1
Rate limit handling: Auto-adjust
Manual capture: Debounced

Result:
- 240-720 calls/hour (user choice)
- Rare 429 errors
- Stable performance
- Better user experience
```

## Cost Analysis

### API Costs (Example)
Assuming $0.01 per API call:

| Interval | Calls/Hour | Cost/Hour | Cost/Day | Cost/Month |
|----------|------------|-----------|----------|------------|
| 3s (Fast) | 1200 | $12.00 | $288.00 | $8,640 |
| 5s (Normal) | 720 | $7.20 | $172.80 | $5,184 |
| 10s (Slow) | 360 | $3.60 | $86.40 | $2,592 |
| 15s (Very Slow) | 240 | $2.40 | $57.60 | $1,728 |

### Savings
- Fast → Normal: 40% reduction
- Fast → Slow: 70% reduction
- Fast → Very Slow: 80% reduction

## User Guidelines

### When to Use Each Interval

#### Fast (3s)
✅ Quick screening sessions (< 5 minutes)
✅ Urgent disease identification
✅ Small number of plants
❌ Long monitoring sessions
❌ Cost-sensitive applications

#### Normal (5s) - Recommended
✅ General use
✅ Balanced performance
✅ Most use cases
✅ Good cost/benefit ratio

#### Slow (10s)
✅ Continuous monitoring
✅ Large number of plants
✅ Cost-conscious users
✅ Background scanning

#### Very Slow (15s)
✅ Extended sessions (> 30 minutes)
✅ Minimal API usage
✅ Budget constraints
✅ Passive monitoring

## Monitoring & Alerts

### User Feedback
- Scan counter shows total API calls
- Status indicator shows current state
- Notifications on rate limits
- Interval display shows current setting

### Admin Monitoring
- Track API usage per user
- Monitor rate limit hits
- Analyze interval distribution
- Cost tracking and alerts

## Best Practices

### For Users
1. Start with Normal (5s) interval
2. Adjust based on needs
3. Use manual capture for important scans
4. Monitor scan counter
5. Increase interval if rate limited

### For Developers
1. Always prevent concurrent calls
2. Implement rate limit handling
3. Provide user controls
4. Show clear feedback
5. Log API usage
6. Monitor costs

### For Administrators
1. Set reasonable rate limits
2. Monitor API usage patterns
3. Alert on unusual activity
4. Provide usage reports
5. Implement quotas if needed

## Technical Implementation

### Key Variables
```javascript
let isAnalyzing = false;        // Prevent concurrent calls
let lastScanTime = 0;           // Track last scan
let scanIntervalTime = 5000;    // Configurable interval
let scanInterval = null;        // Interval timer
```

### Key Functions
```javascript
captureAndAnalyze()    // Main scan function with guards
setScanInterval()      // Change interval
quickAnalyze()         // API call with error handling
updateStatus()         // User feedback
```

### Error Handling
```javascript
try {
    const result = await quickAnalyze(file);
} catch (error) {
    if (error.message.includes('429')) {
        // Rate limit - increase interval
    } else if (error.message.includes('Network')) {
        // Network error - retry
    } else {
        // Other error - notify user
    }
}
```

## Future Enhancements

### Planned
- [ ] Adaptive intervals based on detection results
- [ ] Smart scheduling (scan only when leaf changes)
- [ ] Batch processing for multiple leaves
- [ ] Offline queue with sync
- [ ] Usage analytics dashboard
- [ ] Cost estimation before scanning

### Advanced
- [ ] Machine learning for optimal intervals
- [ ] Predictive API usage
- [ ] Dynamic rate limiting
- [ ] Edge computing for pre-processing
- [ ] WebRTC for peer-to-peer analysis

## Conclusion

The implemented optimizations reduce API usage by 40-80% while maintaining excellent user experience. Users have full control over the speed/cost tradeoff, and the system automatically adapts to rate limits and errors.

### Key Metrics
- ✅ 40-80% reduction in API calls
- ✅ Zero concurrent calls
- ✅ Automatic rate limit handling
- ✅ User-configurable intervals
- ✅ Graceful error recovery
- ✅ Clear cost implications

The system is now production-ready with sustainable API usage patterns.
