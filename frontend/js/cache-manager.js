/**
 * Client-Side Cache Manager
 * Reduces unnecessary API calls and improves performance
 */

class CacheManager {
    constructor() {
        this.cache = new Map();
        this.timestamps = new Map();
        this.defaultTTL = 5 * 60 * 1000; // 5 minutes default
        
        // Cache TTL configurations (in milliseconds)
        this.ttlConfig = {
            // Static/rarely changing data - longer cache
            'user-profile': 10 * 60 * 1000,      // 10 minutes
            'admin-users': 5 * 60 * 1000,        // 5 minutes
            'api-config': 15 * 60 * 1000,        // 15 minutes
            
            // Dynamic data - shorter cache
            'overview-stats': 2 * 60 * 1000,     // 2 minutes
            'analytics-trends': 3 * 60 * 1000,   // 3 minutes
            'api-usage': 2 * 60 * 1000,          // 2 minutes
            'prescriptions': 2 * 60 * 1000,      // 2 minutes
            'history': 2 * 60 * 1000,            // 2 minutes
            'analysis-detail': 5 * 60 * 1000,    // 5 minutes
            'dashboard-stats': 2 * 60 * 1000,    // 2 minutes
            
            // Real-time data - very short cache
            'user-activity': 1 * 60 * 1000,      // 1 minute
            'cost-breakdown': 2 * 60 * 1000,     // 2 minutes
        };
        
        // Start cleanup interval
        this.startCleanup();
    }
    
    /**
     * Generate cache key from URL and params
     */
    generateKey(url, params = {}) {
        const sortedParams = Object.keys(params)
            .sort()
            .map(key => `${key}=${params[key]}`)
            .join('&');
        return `${url}${sortedParams ? '?' + sortedParams : ''}`;
    }
    
    /**
     * Get cached data if valid
     */
    get(key, cacheType = 'default') {
        if (!this.cache.has(key)) {
            return null;
        }
        
        const timestamp = this.timestamps.get(key);
        const ttl = this.ttlConfig[cacheType] || this.defaultTTL;
        const age = Date.now() - timestamp;
        
        if (age > ttl) {
            // Cache expired
            this.delete(key);
            return null;
        }
        
        if (CONFIG.DEBUG) {
            console.log(`📦 Cache HIT: ${key} (age: ${Math.round(age/1000)}s)`);
        }
        
        return this.cache.get(key);
    }
    
    /**
     * Set cache data
     */
    set(key, data, cacheType = 'default') {
        this.cache.set(key, data);
        this.timestamps.set(key, Date.now());
        
        if (CONFIG.DEBUG) {
            const ttl = this.ttlConfig[cacheType] || this.defaultTTL;
            console.log(`💾 Cache SET: ${key} (TTL: ${ttl/1000}s)`);
        }
    }
    
    /**
     * Delete specific cache entry
     */
    delete(key) {
        this.cache.delete(key);
        this.timestamps.delete(key);
        
        if (CONFIG.DEBUG) {
            console.log(`🗑️ Cache DELETE: ${key}`);
        }
    }
    
    /**
     * Clear all cache
     */
    clear() {
        this.cache.clear();
        this.timestamps.clear();
        console.log('🧹 Cache cleared');
    }
    
    /**
     * Clear cache by pattern
     */
    clearPattern(pattern) {
        const regex = new RegExp(pattern);
        let count = 0;
        
        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                this.delete(key);
                count++;
            }
        }
        
        if (CONFIG.DEBUG) {
            console.log(`🧹 Cleared ${count} cache entries matching: ${pattern}`);
        }
    }
    
    /**
     * Invalidate cache for specific types
     */
    invalidate(cacheType) {
        const patterns = {
            'admin': /admin/,
            'analytics': /analytics|trends|stats/,
            'users': /users/,
            'api-usage': /api-usage/,
            'prescriptions': /prescriptions/,
            'history': /my-analyses|analyses\//,
        };
        
        if (patterns[cacheType]) {
            this.clearPattern(patterns[cacheType]);
        }
    }
    
    /**
     * Cleanup expired entries
     */
    cleanup() {
        const now = Date.now();
        let cleaned = 0;
        
        for (const [key, timestamp] of this.timestamps.entries()) {
            // Find the cache type for this key
            let ttl = this.defaultTTL;
            for (const [type, typeTTL] of Object.entries(this.ttlConfig)) {
                if (key.includes(type)) {
                    ttl = typeTTL;
                    break;
                }
            }
            
            if (now - timestamp > ttl) {
                this.delete(key);
                cleaned++;
            }
        }
        
        if (cleaned > 0 && CONFIG.DEBUG) {
            console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
        }
    }
    
    /**
     * Start automatic cleanup
     */
    startCleanup() {
        // Run cleanup every 5 minutes
        setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }
    
    /**
     * Get cache statistics
     */
    getStats() {
        return {
            entries: this.cache.size,
            oldestEntry: Math.min(...Array.from(this.timestamps.values())),
            newestEntry: Math.max(...Array.from(this.timestamps.values())),
            totalSize: JSON.stringify(Array.from(this.cache.entries())).length
        };
    }
}

// Global cache instance
const apiCache = new CacheManager();

/**
 * Cached fetch wrapper
 * Usage: cachedFetch(url, options, cacheType, forceRefresh)
 */
async function cachedFetch(url, options = {}, cacheType = 'default', forceRefresh = false) {
    const cacheKey = apiCache.generateKey(url, options.params || {});
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
        const cached = apiCache.get(cacheKey, cacheType);
        if (cached) {
            return cached;
        }
    }
    
    // Fetch from API
    if (CONFIG.DEBUG) {
        console.log(`🌐 API CALL: ${url}`);
    }
    
    const response = await authenticatedFetch(url, options);
    
    if (response.ok) {
        const data = await response.json();
        apiCache.set(cacheKey, data, cacheType);
        return data;
    }
    
    throw new Error(`API call failed: ${response.status}`);
}

// Expose for debugging
if (CONFIG.DEBUG) {
    window.apiCache = apiCache;
    console.log('💾 Cache Manager initialized');
    console.log('📊 Debug: window.apiCache available for inspection');
}
