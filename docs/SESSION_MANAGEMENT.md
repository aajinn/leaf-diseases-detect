# Session Management System

## Overview

The application now includes a robust session management system with automatic expiration, activity tracking, and user notifications.

## Features

### 1. **Automatic Session Expiration**
- Sessions expire after 30 minutes of inactivity
- Configurable duration in `SessionManager` class
- Automatic cleanup of expired sessions

### 2. **Activity Tracking**
- Monitors user interactions (mouse, keyboard, scroll, touch)
- Automatically refreshes session on activity
- Prevents premature expiration during active use

### 3. **Session Validation**
- Client-side token validation
- Server-side authentication verification
- Automatic redirect to login on invalid sessions

### 4. **Session Expiration Warning**
- Visual indicator appears 5 minutes before expiration
- Shows countdown timer
- "Extend Session" button to refresh
- Auto-dismisses after extension

### 5. **Secure Token Storage**
- JWT tokens stored in localStorage
- User data cached for quick access
- Login timestamp tracking

### 6. **Redirect Handling**
- Preserves intended destination after login
- URL parameter-based redirect system
- Automatic redirect for authenticated users on auth pages

## Implementation Details

### SessionManager Class

```javascript
class SessionManager {
    TOKEN_KEY = 'token'
    USER_KEY = 'user_data'
    LOGIN_TIME_KEY = 'login_time'
    SESSION_DURATION = 30 * 60 * 1000 // 30 minutes
}
```

**Methods:**
- `setSession(token, userData)` - Store session data
- `getToken()` - Retrieve auth token
- `getUserData()` - Get cached user data
- `isSessionValid()` - Check if session is still valid
- `clearSession()` - Remove all session data
- `refreshSession()` - Update login timestamp

### Authentication Functions

**`login(username, password)`**
- Authenticates user with backend
- Fetches complete user profile
- Stores session data
- Returns success/error result

**`getUserProfile()`**
- Validates session before fetching
- Updates cached user data
- Handles 401 errors gracefully
- Returns null on invalid session

**`requireAuth()`**
- Async validation of authentication
- Server-side token verification
- Redirect with return URL
- Returns boolean success status

**`authenticatedFetch(url, options)`**
- Wrapper for authenticated API calls
- Automatic session validation
- 401 error handling
- Consistent error messages

### Session Indicator

Visual component that:
- Monitors session expiration
- Shows warning 5 minutes before expiry
- Displays countdown timer
- Provides "Extend Session" button
- Auto-hides when session is extended

## Usage

### Protected Pages

Pages automatically check authentication:

```javascript
// In dashboard.html, history.html
if (isProtectedPage()) {
    requireAuth();
}
```

### Making Authenticated Requests

Use `authenticatedFetch()` instead of `fetch()`:

```javascript
// Old way
const response = await fetch(`${API_URL}/api/my-analyses`, {
    headers: getAuthHeaders()
});

// New way (recommended)
const response = await authenticatedFetch(`${API_URL}/api/my-analyses`);
```

### Manual Session Check

```javascript
if (!isAuthenticated()) {
    window.location.href = '/login';
}
```

### Extending Session

```javascript
sessionManager.refreshSession();
```

## Configuration

### Adjust Session Duration

Edit `frontend/js/auth.js`:

```javascript
class SessionManager {
    SESSION_DURATION = 60 * 60 * 1000; // 60 minutes
}
```

### Change Warning Threshold

Edit `frontend/js/session-indicator.js`:

```javascript
class SessionIndicator {
    warningThreshold = 10 * 60 * 1000; // 10 minutes
}
```

### Disable Session Indicator

Remove from HTML:
```html
<!-- Remove this line -->
<script src="js/session-indicator.js"></script>
```

## Security Features

1. **Token Validation**: Both client and server-side
2. **Automatic Cleanup**: Expired sessions are cleared
3. **Secure Storage**: Tokens in localStorage (consider httpOnly cookies for production)
4. **Activity Monitoring**: Prevents session hijacking through inactivity
5. **Server Verification**: Regular profile checks validate token

## User Experience

### Login Flow
1. User enters credentials
2. System authenticates with backend
3. Fetches complete user profile
4. Stores session data
5. Redirects to intended page

### Session Expiration Flow
1. User inactive for 25 minutes
2. Warning appears with countdown
3. User can extend or ignore
4. At 30 minutes, auto-logout
5. Redirect to login with return URL

### Activity Flow
1. User interacts with page
2. Activity detected (mouse, keyboard, etc.)
3. Session timestamp refreshed
4. Expiration timer resets

## Troubleshooting

### Session Expires Too Quickly
- Check `SESSION_DURATION` setting
- Verify activity tracking is working
- Check browser console for errors

### Warning Doesn't Appear
- Ensure `session-indicator.js` is loaded
- Check if on protected page
- Verify indicator element is created

### Redirect Loop
- Clear localStorage
- Check `requireAuth()` logic
- Verify backend authentication endpoint

### Token Not Refreshing
- Check activity event listeners
- Verify `resetActivityTimer()` is called
- Check browser console for errors

## Best Practices

1. **Always use `authenticatedFetch()`** for protected endpoints
2. **Check session validity** before sensitive operations
3. **Handle 401 errors** gracefully in all API calls
4. **Clear session** on logout
5. **Validate tokens** server-side
6. **Use HTTPS** in production
7. **Consider httpOnly cookies** for enhanced security

## Future Enhancements

- [ ] Remember me functionality (longer sessions)
- [ ] Refresh token implementation
- [ ] Multi-device session management
- [ ] Session activity logs
- [ ] Biometric authentication support
- [ ] Two-factor authentication
- [ ] Session transfer between devices
