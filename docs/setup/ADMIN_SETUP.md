# Admin User Setup Guide

## Quick Start (Fastest Method)

### Option 1: Create Default Admin User

Run this command to create an admin user with default credentials:

```cmd
python create_quick_admin.py
```

**Default Credentials:**
- Username: `admin`
- Password: `Admin@123`
- Email: `admin@leafdisease.com`

⚠️ **IMPORTANT**: Change the password after first login!

---

## Other Methods

### Option 2: Create Custom Admin User

Use the interactive script to create a custom admin user:

```cmd
python scripts/create_admin.py
```

You'll be prompted to enter:
- Email address
- Username
- Password (min 8 chars, must include uppercase, lowercase, and number)
- Full name

### Option 3: Make Existing User Admin

If you already have a user account and want to make it admin:

```cmd
python scripts/make_user_admin.py
```

Enter the username when prompted.

### Option 4: Manual Database Update

Using MongoDB shell or Compass:

```javascript
db.users.updateOne(
  { username: "your_username" },
  { $set: { is_admin: true } }
)
```

---

## Login as Admin

1. **Start the server:**
   ```cmd
   uvicorn src.app:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Open browser:**
   ```
   http://localhost:8000/login
   ```

3. **Enter credentials:**
   - Username: `admin` (or your custom username)
   - Password: `Admin@123` (or your custom password)

4. **Access Admin Panel:**
   - After login, you'll see "Admin Panel" link in the dashboard
   - Or navigate directly to: `http://localhost:8000/admin`

---

## Verify Admin Access

### Check in Dashboard
- Login to the application
- Look for "Admin Panel" link in the navigation bar
- Only admin users will see this link

### Check in Database
Using MongoDB:

```javascript
db.users.findOne({ username: "admin" })
```

Look for `is_admin: true` in the result.

### Check via API
```bash
curl -X GET "http://localhost:8000/auth/me" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response should include `"is_admin": true`

---

## Admin Panel Features

Once logged in as admin, you can:

1. **View System Statistics**
   - Total users
   - Total analyses
   - API usage
   - Costs

2. **Manage Users**
   - View all users
   - Activate/deactivate users
   - See user statistics

3. **Monitor API Usage**
   - Track Groq API calls
   - Track Perplexity API calls
   - View costs per user
   - Filter by date range

4. **Configure APIs**
   - Update Groq API key
   - Update Perplexity API key
   - View API status

---

## Troubleshooting

### "Access denied. Admin privileges required."

**Solution:**
1. Check if user has `is_admin: true` in database
2. Run: `python scripts/make_user_admin.py`
3. Re-login to refresh session

### "Admin Panel" link not showing

**Solution:**
1. Clear browser cache
2. Logout and login again
3. Check browser console for errors
4. Verify `is_admin: true` in database

### Cannot create admin user

**Solution:**
1. Check MongoDB is running: `python check_mongodb.py`
2. Verify connection string in `.env`
3. Check database permissions
4. Look for error messages in terminal

### Password doesn't work

**Solution:**
1. Password must be at least 8 characters
2. Must include uppercase, lowercase, and number
3. Try resetting: Create new admin with different username
4. Check for typos in username/password

---

## Security Best Practices

1. **Change Default Password**
   - If using quick setup, change password immediately
   - Use strong, unique password

2. **Limit Admin Users**
   - Only create admin accounts for trusted users
   - Regular users don't need admin access

3. **Monitor Admin Activity**
   - Check admin panel regularly
   - Review API usage for anomalies

4. **Secure API Keys**
   - Don't share API keys
   - Rotate keys periodically
   - Use environment variables

5. **Regular Backups**
   - Backup MongoDB database
   - Keep backup of `.env` file (securely)

---

## Complete Setup Example

```cmd
# 1. Ensure MongoDB is running
mongod

# 2. Check MongoDB connection
python check_mongodb.py

# 3. Create admin user (choose one method)
python create_quick_admin.py
# OR
python scripts/create_admin.py

# 4. Start the server
uvicorn src.app:app --reload --host 0.0.0.0 --port 8000

# 5. Open browser
# Navigate to: http://localhost:8000/login

# 6. Login with admin credentials
# Username: admin
# Password: Admin@123

# 7. Access admin panel
# Click "Admin Panel" link or go to: http://localhost:8000/admin
```

---

## Next Steps

After logging in as admin:

1. ✅ Change default password (if used quick setup)
2. ✅ Configure API keys (Groq and Perplexity)
3. ✅ Review system statistics
4. ✅ Create regular user accounts for testing
5. ✅ Monitor API usage and costs

---

## Support

If you encounter issues:

1. Check server logs for errors
2. Verify MongoDB connection
3. Check browser console (F12)
4. Review `.env` configuration
5. Ensure all dependencies are installed: `pip install -r requirements.txt`
