// Environment Configuration
// Automatically detects if running locally or in production

const CONFIG = {
    // Detect environment
    isDevelopment: window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1' ||
                   window.location.hostname.includes('192.168.'),
    
    // API URLs
    API_URL_DEV: 'http://localhost:8000',  // Local has no /api prefix
    API_URL_PROD: 'https://leaf-diseases-detect-c1se.onrender.com/api',  // Production has /api prefix
    
    // Get current API URL based on environment
    get API_URL() {
        return this.isDevelopment ? this.API_URL_DEV : this.API_URL_PROD;
    },
    
    // Debug mode
    get DEBUG() {
        return this.isDevelopment;
    }
};

// Export for use in other files
const API_URL = CONFIG.API_URL;

// Log current environment (only in development)
if (CONFIG.DEBUG) {
    console.log('🔧 Environment: DEVELOPMENT');
    console.log('🌐 API URL:', API_URL);
} else {
    console.log('🚀 Environment: PRODUCTION');
}
