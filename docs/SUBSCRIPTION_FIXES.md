# Subscription System Fixes

## Issues Fixed

### 1. Usage Not Reset on Upgrade
**Problem**: When a free user hit their limit and upgraded, the old usage count persisted.

**Fix**: 
- `cancel_user_subscription()` now deletes usage quotas when canceling
- New subscription creates fresh usage quota with 0 usage
- User's `analyses_this_month` counter also reset

### 2. Duplicate Usage Tracking
**Problem**: Usage tracked in both `users.analyses_this_month` AND `usage_quotas.analyses_used`

**Fix**:
- Removed dual tracking
- Single source of truth: `usage_quotas.analyses_used`
- Disease detection uses `check_usage_limit()` which reads from quotas
- Increment only updates `usage_quotas`

### 3. Missing reset_user_usage Method
**Problem**: Route referenced non-existent method

**Fix**: Added `reset_user_usage()` method to SubscriptionService

### 4. Free Plan Not Auto-Assigned
**Problem**: New users had no subscription/quota

**Fix**: Registration now auto-assigns free plan with quota

### 5. Usage Quota Auto-Creation
**Problem**: Existing users without quotas couldn't analyze

**Fix**: `increment_usage()` creates quota if missing

## Migration Script

Run to fix existing users:
```bash
python scripts/fix_subscription_usage.py
```

This will:
- Assign free plan to users without subscription
- Create usage quotas for all users
- Migrate existing usage counts

## Testing

1. Register new user → Should get free plan automatically
2. Hit free limit → Should block analysis
3. Upgrade to paid plan → Usage resets to 0
4. Downgrade → Usage resets to 0
5. Admin reset usage → Sets to 0 for current month
