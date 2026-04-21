# User Quota Fix Documentation

## Problem
Users were getting "Monthly analysis limit reached" error even though they should have available analyses. This occurred when:
- Users had subscriptions but no usage quotas in the database
- New users didn't get quotas created properly during registration

## Solution Implemented

### 1. Automatic Quota Creation
Modified `src/services/subscription_service.py` - `check_usage_limit()` function to:
- Automatically create a quota if a user doesn't have one
- Assign free plan if user has no subscription
- Continue processing instead of denying access

### 2. Fix Script for Existing Users
Created `scripts/fix_user_quotas.py` to:
- Find all users without subscriptions and assign free plan
- Find users with subscriptions but no quotas and create them
- Handle errors gracefully and continue processing all users

### 3. Verification Script
Created `scripts/verify_user_quotas.py` to:
- Check all users have proper subscriptions and quotas
- Display usage statistics for each user
- Identify any remaining issues

## How to Use

### Fix All Users
Run one of these commands:
```cmd
# Windows
fix_user_quotas.bat

# Or directly
python scripts\fix_user_quotas.py
```

### Verify All Users
Run one of these commands:
```cmd
# Windows
verify_user_quotas.bat

# Or directly
python scripts\verify_user_quotas.py
```

## Results

After running the fix script:
- ✅ All 14 users now have proper quotas
- ✅ Users can analyze images according to their plan limits
- ✅ New users will automatically get quotas created

## Plan Limits

| Plan | Analyses/Month | Notes |
|------|----------------|-------|
| Free | 10 | Default for new users |
| Basic | 100 | ₹10/month |
| Premium | 500 | ₹15/month |
| Enterprise | Unlimited (0) | ₹25/month |

Note: 0 limit means unlimited analyses

## Troubleshooting

If a user still can't analyze:
1. Run `verify_user_quotas.bat` to check their status
2. Run `fix_user_quotas.bat` to fix any issues
3. Check server logs for specific errors
4. Verify MongoDB connection is working

## Technical Details

### Database Collections
- `subscription_plans` - Available subscription plans
- `user_subscriptions` - User's active subscriptions
- `usage_quotas` - Monthly usage tracking per user

### Key Functions
- `SubscriptionService.check_usage_limit()` - Checks if user can analyze (now auto-creates quota)
- `SubscriptionService.increment_usage()` - Increments usage after successful analysis
- `SubscriptionService.assign_free_plan()` - Assigns free plan to new users
