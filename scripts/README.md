# Maintenance Scripts

This folder contains utility scripts for system maintenance, user management, and troubleshooting.

## Quick Reference

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `fix_user_quotas.py` | Fix missing quotas/subscriptions | Users can't analyze |
| `verify_user_quotas.py` | Check all users have proper quotas | After fixes, routine checks |
| `update_rate_limits.py` | Update rate limits in database | After changing limits in code |
| `initialize_subscription_plans.py` | Create default subscription plans | First time setup |
| `create_quick_admin.py` | Create admin user | Need admin access |

## Detailed Documentation

### 1. fix_user_quotas.py
**Purpose:** Fix users who don't have usage quotas or subscriptions.

**What it does:**
- Finds users without subscriptions → assigns free plan
- Finds users with subscriptions but no quotas → creates quotas
- Handles errors gracefully, continues processing all users

**When to run:**
- Users getting "Monthly analysis limit reached" error
- After database migration
- After manual database changes
- Routine maintenance (monthly)

**Usage:**
```cmd
# Windows
fix_user_quotas.bat

# Or directly
python scripts\fix_user_quotas.py
```

**Expected output:**
```
[*] Connecting to database...
[*] Finding users without subscriptions...
  [+] Created quota for user1
  [+] Assigned free plan to user2
[+] Fixed 5 users!
```

---

### 2. verify_user_quotas.py
**Purpose:** Verify all users have proper subscriptions and quotas.

**What it does:**
- Checks every user has a subscription
- Checks every user has a usage quota
- Displays usage statistics
- Reports any issues found

**When to run:**
- After running fix_user_quotas.py
- Before/after system updates
- Routine health checks
- Troubleshooting user issues

**Usage:**
```cmd
# Windows
verify_user_quotas.bat

# Or directly
python scripts\verify_user_quotas.py
```

**Expected output:**
```
[*] Checking all users...
  [+] user1: Free Plan - 5/10 analyses used
  [+] user2: Premium Plan - 50/500 analyses used
==================================================
Total Users: 14
Users OK: 14
Missing Subscription: 0
Missing Quota: 0
==================================================
[+] All users have proper quotas!
```

---

### 3. update_rate_limits.py
**Purpose:** Update rate limits in existing subscription plans.

**What it does:**
- Updates api_rate_limit_per_minute for all plan types
- Applies new limits from subscription_models.py to database

**When to run:**
- After changing rate limits in code
- When users report rate limiting issues
- After performance tuning

**Usage:**
```cmd
# Windows
update_rate_limits.bat

# Or directly
python scripts\update_rate_limits.py
```

**Expected output:**
```
[*] Updating rate limits for all plans...
  [+] Updated free plan: 30 requests/minute
  [+] Updated basic plan: 60 requests/minute
  [+] Updated premium plan: 120 requests/minute
  [+] Updated enterprise plan: 300 requests/minute
[+] Rate limits updated successfully!
```

---

### 4. initialize_subscription_plans.py
**Purpose:** Initialize default subscription plans in the database.

**What it does:**
- Creates 4 default plans (Free, Basic, Premium, Enterprise)
- Sets pricing, limits, and features
- Only runs if plans don't already exist

**When to run:**
- First time system setup
- After database reset
- When adding new plan features

**Usage:**
```cmd
python scripts\initialize_subscription_plans.py
```

**Expected output:**
```
🚀 Connecting to database...
📋 Initializing subscription plans...
✅ Subscription plans initialized successfully!

📊 Created 4 subscription plans:
  • Free Plan: ₹0/month (10 analyses)
  • Basic Plan: ₹10/month (100 analyses)
  • Premium Plan: ₹15/month (500 analyses)
  • Enterprise Plan: ₹25/month (0 analyses)
```

---

### 5. create_quick_admin.py
**Purpose:** Create an admin user quickly.

**What it does:**
- Creates admin user with default credentials
- Assigns admin privileges
- Sets up initial subscription

**When to run:**
- First time setup
- Need admin access
- Lost admin credentials

**Usage:**
```cmd
python scripts\create_quick_admin.py
```

**Default credentials:**
- Username: `admin`
- Password: `Admin@123`
- Email: `admin@leafdisease.com`

**⚠️ Security:** Change the password immediately after first login!

---

## Batch Files (Windows)

For convenience, batch files are provided in the project root:

- `fix_user_quotas.bat` - Run fix_user_quotas.py
- `verify_user_quotas.bat` - Run verify_user_quotas.py
- `update_rate_limits.bat` - Run update_rate_limits.py

Simply double-click to run.

---

## Troubleshooting

### Script fails to connect to database
**Solution:**
1. Check MongoDB is running
2. Verify MONGODB_URL in .env
3. Check network connectivity

### "No module named 'src'"
**Solution:**
Run from project root directory:
```cmd
cd c:\Projects\MAIN PROJECT\leaf-diseases-detect
python scripts\script_name.py
```

### Unicode errors on Windows
**Solution:**
Scripts use ASCII characters for Windows compatibility. If you see encoding errors:
```cmd
chcp 65001
python scripts\script_name.py
```

### Permission errors
**Solution:**
Run as administrator or check file permissions.

---

## Best Practices

### Routine Maintenance Schedule

**Daily:**
- Monitor server logs for errors

**Weekly:**
- Run `verify_user_quotas.py`
- Check rate limit usage

**Monthly:**
- Run `fix_user_quotas.py` (preventive)
- Review subscription analytics
- Clean up old rate limit records

**After Updates:**
- Run `verify_user_quotas.py`
- Test critical user flows
- Check logs for errors

### Before Production Deployment

1. Run `initialize_subscription_plans.py`
2. Run `create_quick_admin.py`
3. Run `verify_user_quotas.py`
4. Test admin login
5. Test user registration
6. Test disease analysis

---

## Adding New Scripts

When creating new maintenance scripts:

1. **Add to this folder:** `scripts/`
2. **Follow naming:** `verb_noun.py` (e.g., `fix_user_quotas.py`)
3. **Add shebang:** `#!/usr/bin/env python3`
4. **Add docstring:** Explain purpose and usage
5. **Use logging:** Print clear status messages
6. **Handle errors:** Try/except with informative messages
7. **Add to README:** Document in this file
8. **Create batch file:** For Windows users (optional)

**Template:**
```python
#!/usr/bin/env python3
"""
Script Name
===========

Brief description of what the script does.
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.database.connection import MongoDB

async def main():
    """Main function"""
    try:
        print("[*] Starting...")
        await MongoDB.connect_db()
        
        # Your code here
        
        print("[+] Success!")
        return 0
    except Exception as e:
        print(f"[-] Error: {e}")
        return 1
    finally:
        await MongoDB.close_db()

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
```

---

## Related Documentation

- `docs/QUOTA_FIX.md` - Quota system fixes
- `docs/RATE_LIMITING_FIX.md` - Rate limiting fixes
- `docs/SYSTEM_FIXES_SUMMARY.md` - All fixes summary
- `docs/features/SUBSCRIPTION_SYSTEM.md` - Subscription system
- `docs/features/ADMIN_PANEL.md` - Admin panel guide

---

**Last Updated:** 2026-04-21
**Maintained By:** System Administrator
