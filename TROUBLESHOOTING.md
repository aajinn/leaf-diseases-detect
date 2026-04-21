# Quick Troubleshooting Guide

## Common Issues & Solutions

### 🚫 Live Detection Not Stopping

**Symptoms:**
- Scanning continues even with healthy leaf
- No automatic stop on detection
- Unclear when scanning will stop

**Status:** ✅ FIXED

**Solution:**
The live detection now automatically stops when:
- Disease is detected (shows disease details)
- Healthy leaf is detected (shows healthy confirmation)
- Only continues if invalid image (no leaf found)

**If still having issues:**
1. Ensure leaf is centered in frame
2. Check lighting is adequate
3. Hold camera steady
4. Enable auto-crop feature
5. Try manual capture button

**See:** `docs/LIVE_DETECTION_FIX.md` for details

---

### 🚫 "Monthly analysis limit reached"

**Symptoms:**
- User can't analyze images
- Error message: "Monthly analysis limit reached. Please upgrade your plan."
- User should have analyses remaining

**Quick Fix:**
```cmd
python scripts\fix_user_quotas.py
```

**Verify:**
```cmd
python scripts\verify_user_quotas.py
```

**Root Cause:** Missing usage quota in database

---

### 🚫 Prescription page fails to load (500 error)

**Symptoms:**
- 500 Internal Server Error
- Error in logs: "Rate limit exceeded"
- Page makes multiple API calls

**Quick Fix:**
```cmd
python scripts\update_rate_limits.py
```

**Restart server:**
```cmd
# Stop server (Ctrl+C)
# Start server
uvicorn src.app:app --reload --host 0.0.0.0 --port 8000
```

**Root Cause:** Rate limiting too aggressive

---

### 🚫 User can't login

**Symptoms:**
- "Incorrect username or password"
- User exists in database
- Password is correct

**Check:**
1. Username is lowercase in database
2. User is_active = true
3. System settings allow login

**Fix inactive user:**
```javascript
// In MongoDB
db.users.updateOne(
  {username: "username"},
  {$set: {is_active: true}}
)
```

---

### 🚫 New user registration fails

**Symptoms:**
- Registration completes but user can't analyze
- No subscription assigned

**Quick Fix:**
```cmd
python scripts\fix_user_quotas.py
```

**Verify plans exist:**
```cmd
python scripts\initialize_subscription_plans.py
```

---

### 🚫 Admin panel not accessible

**Symptoms:**
- 403 Forbidden
- "Not authorized"

**Create admin user:**
```cmd
python scripts\create_quick_admin.py
```

**Default credentials:**
- Username: admin
- Password: Admin@123

**Or make existing user admin:**
```javascript
// In MongoDB
db.users.updateOne(
  {username: "username"},
  {$set: {is_admin: true}}
)
```

---

### 🚫 Database connection fails

**Symptoms:**
- "Failed to connect to MongoDB"
- Scripts fail immediately

**Check:**
1. MongoDB is running
2. .env file exists with MONGODB_URL
3. Network connectivity

**Fix:**
```cmd
# Check MongoDB status
net start MongoDB

# Or start MongoDB service
mongod --dbpath "C:\data\db"
```

---

### 🚫 Rate limiting too strict

**Symptoms:**
- Users hitting rate limits frequently
- 429 errors in logs

**Increase limits:**
1. Edit `src/database/subscription_models.py`
2. Update `api_rate_limit_per_minute` values
3. Run:
```cmd
python scripts\update_rate_limits.py
```

**Current limits:**
- Free: 30/min
- Basic: 60/min
- Premium: 120/min
- Enterprise: 300/min

---

### 🚫 Images not displaying

**Symptoms:**
- Broken image icons
- 404 errors for images

**Check:**
1. Images exist in `storage/uploads/{username}/`
2. File permissions are correct
3. Path in database matches actual file

**Fix permissions:**
```cmd
# Windows
icacls storage /grant Users:F /T
```

---

### 🚫 API key authentication fails

**Symptoms:**
- "Invalid API key"
- Enterprise features not working

**Check API key:**
```javascript
// In MongoDB
db.enterprise_api_keys.find({user_id: "user_id"})
```

**Create new API key:**
- Login as enterprise user
- Go to Enterprise Dashboard
- Generate new API key

---

### 🚫 Subscription payment fails

**Symptoms:**
- Payment completes but subscription not activated
- Razorpay error

**Check:**
1. Razorpay keys in .env.razorpay
2. Payment record in database
3. Subscription status

**Manual activation:**
```javascript
// In MongoDB
db.user_subscriptions.updateOne(
  {user_id: "user_id"},
  {$set: {status: "active"}}
)
```

---

## Emergency Commands

### Reset all rate limits
```javascript
// In MongoDB
db.rate_limits.deleteMany({})
```

### Reset user's monthly usage
```javascript
// In MongoDB
db.usage_quotas.updateOne(
  {user_id: "user_id"},
  {$set: {analyses_used: 0}}
)
```

### Deactivate user
```javascript
// In MongoDB
db.users.updateOne(
  {username: "username"},
  {$set: {is_active: false}}
)
```

### Delete user's analyses
```javascript
// In MongoDB
db.analyses.deleteMany({user_id: "user_id"})
```

---

## Health Check Commands

### Check system status
```cmd
curl http://localhost:8000/system/status
```

### Check API health
```cmd
curl http://localhost:8000/api
```

### Check database connection
```cmd
python -c "from src.database.connection import MongoDB; import asyncio; asyncio.run(MongoDB.connect_db()); print('OK')"
```

### Check all users
```cmd
python scripts\verify_user_quotas.py
```

---

## Log Locations

**Server logs:**
- Console output (when running uvicorn)
- Check for ERROR and WARNING messages

**MongoDB logs:**
- Windows: `C:\Program Files\MongoDB\Server\{version}\log\`
- Linux: `/var/log/mongodb/`

**Application logs:**
- Check console output for:
  - Rate limit errors (429)
  - Authentication errors (401, 403)
  - Server errors (500)
  - Database errors

---

## Prevention Tips

### Daily:
- Monitor server logs
- Check for repeated errors

### Weekly:
- Run `verify_user_quotas.py`
- Check rate limit usage
- Review user feedback

### Monthly:
- Run `fix_user_quotas.py` (preventive)
- Clean up old data
- Review subscription analytics
- Update dependencies

### Before Updates:
- Backup database
- Test in staging environment
- Run all verification scripts
- Document changes

---

## Getting Help

1. **Check logs** - Most issues show up in logs
2. **Run verification scripts** - Automated checks
3. **Check documentation** - `docs/` folder
4. **Search error message** - In codebase and docs
5. **Check database** - Verify data integrity

---

## Quick Links

- [System Fixes Summary](docs/SYSTEM_FIXES_SUMMARY.md)
- [Quota Fix Guide](docs/QUOTA_FIX.md)
- [Rate Limiting Fix](docs/RATE_LIMITING_FIX.md)
- [Scripts README](scripts/README.md)
- [Subscription System](docs/features/SUBSCRIPTION_SYSTEM.md)

---

**Last Updated:** 2026-04-21
**Keep this guide handy for quick reference!**
