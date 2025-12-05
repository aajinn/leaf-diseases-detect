# Frontend Configuration

## Environment Detection

The `config.js` file automatically detects whether you're running locally or in production:

### Development (Local)
- Detected when hostname is `localhost`, `127.0.0.1`, or local IP (192.168.x.x)
- Uses: `http://localhost:8000/api`
- Debug mode enabled

### Production
- Detected when running on any other domain
- Uses: `https://leaf-diseases-detect-c1se.onrender.com/api`
- Debug mode disabled

## How It Works

```javascript
// config.js automatically sets API_URL based on environment
const API_URL = CONFIG.API_URL;

// In development:
// API_URL = 'http://localhost:8000/api'

// In production:
// API_URL = 'https://leaf-diseases-detect-c1se.onrender.com/api'
```

## Usage

All HTML files must load `config.js` **before** `auth.js`:

```html
<script src="js/config.js"></script>
<script src="js/auth.js"></script>
```

## Updating URLs

To change the API URLs, edit `config.js`:

```javascript
const CONFIG = {
    API_URL_DEV: 'http://localhost:8000/api',  // Local development
    API_URL_PROD: 'https://your-domain.com/api', // Production
};
```

## Testing

Open browser console to see which environment is detected:
- Development: `🔧 Environment: DEVELOPMENT`
- Production: `🚀 Environment: PRODUCTION`

## Benefits

✅ No manual URL switching between dev and production  
✅ Works automatically based on hostname  
✅ Single source of truth for API configuration  
✅ Easy to update URLs in one place  
✅ Debug logging in development only
