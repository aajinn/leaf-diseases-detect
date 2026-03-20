# Gmail App Password Setup for Password Reset Feature

## Problem
Gmail blocks login attempts from "less secure apps" by default. You need to use an **App Password** instead of your regular Gmail password.

## Solution: Generate Gmail App Password

### Step 1: Enable 2-Step Verification
1. Go to: https://myaccount.google.com/security
2. Click on **2-Step Verification**
3. Follow the steps to enable it (if not already enabled)

### Step 2: Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Select app: **Mail**
3. Select device: **Other (Custom name)**
4. Enter name: **Leaf Disease Detection**
5. Click **Generate**
6. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

### Step 3: Update .env File
Replace the password in your `.env` file:

```env
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=chandyajin1@gmail.com
SMTP_PASSWORD=abcdefghijklmnop  # Use the 16-character App Password (remove spaces)
FROM_EMAIL=chandyajin1@gmail.com
APP_URL=http://localhost:8000
```

### Step 4: Restart Server
```bash
# Stop the server (Ctrl+C)
# Start again
uvicorn src.app:app --reload --host 0.0.0.0 --port 8000
```

## Alternative: Use Different Email Provider

If you don't want to use Gmail App Passwords, you can use other SMTP providers:

### SendGrid (Free tier: 100 emails/day)
```env
SMTP_SERVER=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USERNAME=apikey
SMTP_PASSWORD=your_sendgrid_api_key
FROM_EMAIL=your_verified_email@domain.com
```

### Mailgun (Free tier: 5,000 emails/month)
```env
SMTP_SERVER=smtp.mailgun.org
SMTP_PORT=587
SMTP_USERNAME=postmaster@your-domain.mailgun.org
SMTP_PASSWORD=your_mailgun_smtp_password
FROM_EMAIL=noreply@your-domain.com
```

### Outlook/Hotmail
```env
SMTP_SERVER=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USERNAME=your_email@outlook.com
SMTP_PASSWORD=your_outlook_password
FROM_EMAIL=your_email@outlook.com
```

## Testing

After updating the `.env` file:

1. Go to: http://localhost:8000/login
2. Click **Forgot password?**
3. Enter your email
4. Check your inbox for the reset email
5. Click the reset link
6. Set your new password

## Troubleshooting

### Error: "SMTP Authentication failed"
- Make sure you're using the App Password, not your regular Gmail password
- Remove any spaces from the App Password
- Verify 2-Step Verification is enabled

### Error: "Connection timeout"
- Check your internet connection
- Verify SMTP_SERVER and SMTP_PORT are correct
- Check if your firewall is blocking port 587

### Email not received
- Check spam/junk folder
- Verify the email address is correct in the database
- Check server logs for errors: Look for email service logs in the console

## Security Notes

- App Passwords are safer than using your main Gmail password
- Each App Password is unique and can be revoked individually
- Never commit `.env` file to version control
- The reset token expires in 1 hour for security
