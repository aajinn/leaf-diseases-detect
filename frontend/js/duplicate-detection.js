/**
 * Duplicate Image Detection System
 * Prevents duplicate analysis by checking image hash
 */

class DuplicateDetector {
    constructor() {
        this.cacheKey = 'imageAnalysisCache';
        this.maxCacheSize = 50; // Maximum number of cached results
        this.cacheExpiry = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    }

    /**
     * Generate hash from image file
     */
    async generateImageHash(file) {
        try {
            // Read file as array buffer
            const arrayBuffer = await file.arrayBuffer();
            
            // Generate hash using SubtleCrypto API
            const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
            
            // Convert to hex string
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            
            return hashHex;
        } catch (error) {
            console.error('Error generating image hash:', error);
            // Fallback: use file size and name
            return `${file.name}_${file.size}_${file.lastModified}`;
        }
    }

    /**
     * Get cached analysis result
     */
    getCachedResult(imageHash) {
        try {
            const cache = this.getCache();
            const cached = cache[imageHash];
            
            if (!cached) {
                return null;
            }
            
            // Check if cache is expired
            const now = Date.now();
            if (now - cached.timestamp > this.cacheExpiry) {
                // Remove expired entry
                delete cache[imageHash];
                this.saveCache(cache);
                return null;
            }
            
            return cached.result;
        } catch (error) {
            console.error('Error getting cached result:', error);
            return null;
        }
    }

    /**
     * Save analysis result to cache
     */
    saveCachedResult(imageHash, result) {
        try {
            const cache = this.getCache();
            
            // Add new result
            cache[imageHash] = {
                result: result,
                timestamp: Date.now()
            };
            
            // Limit cache size
            this.limitCacheSize(cache);
            
            // Save to localStorage
            this.saveCache(cache);
            
            return true;
        } catch (error) {
            console.error('Error saving cached result:', error);
            return false;
        }
    }

    /**
     * Get cache from localStorage
     */
    getCache() {
        try {
            const cacheStr = localStorage.getItem(this.cacheKey);
            return cacheStr ? JSON.parse(cacheStr) : {};
        } catch (error) {
            console.error('Error reading cache:', error);
            return {};
        }
    }

    /**
     * Save cache to localStorage
     */
    saveCache(cache) {
        try {
            localStorage.setItem(this.cacheKey, JSON.stringify(cache));
        } catch (error) {
            console.error('Error saving cache:', error);
            // If quota exceeded, clear old entries
            if (error.name === 'QuotaExceededError') {
                this.clearOldEntries(cache);
            }
        }
    }

    /**
     * Limit cache size to prevent storage overflow
     */
    limitCacheSize(cache) {
        const entries = Object.entries(cache);
        
        if (entries.length > this.maxCacheSize) {
            // Sort by timestamp (oldest first)
            entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
            
            // Remove oldest entries
            const toRemove = entries.length - this.maxCacheSize;
            for (let i = 0; i < toRemove; i++) {
                delete cache[entries[i][0]];
            }
        }
    }

    /**
     * Clear old entries when storage is full
     */
    clearOldEntries(cache) {
        const entries = Object.entries(cache);
        
        // Sort by timestamp
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        
        // Keep only newest 25% of entries
        const keepCount = Math.floor(entries.length * 0.25);
        const newCache = {};
        
        for (let i = entries.length - keepCount; i < entries.length; i++) {
            newCache[entries[i][0]] = entries[i][1];
        }
        
        this.saveCache(newCache);
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        const cache = this.getCache();
        const entries = Object.entries(cache);
        
        return {
            totalEntries: entries.length,
            oldestEntry: entries.length > 0 ? Math.min(...entries.map(e => e[1].timestamp)) : null,
            newestEntry: entries.length > 0 ? Math.max(...entries.map(e => e[1].timestamp)) : null,
            cacheSize: new Blob([JSON.stringify(cache)]).size
        };
    }

    /**
     * Clear all cache
     */
    clearCache() {
        try {
            localStorage.removeItem(this.cacheKey);
            return true;
        } catch (error) {
            console.error('Error clearing cache:', error);
            return false;
        }
    }

    /**
     * Check if image is duplicate and get result
     */
    async checkDuplicate(file) {
        const hash = await this.generateImageHash(file);
        const cached = this.getCachedResult(hash);
        
        return {
            isDuplicate: cached !== null,
            hash: hash,
            result: cached
        };
    }
}

// Global instance
let duplicateDetector;

// Initialize on load
try {
    duplicateDetector = new DuplicateDetector();
    console.log('Duplicate detector initialized successfully');
    console.log('Cache stats:', duplicateDetector.getCacheStats());
} catch (error) {
    console.error('Failed to initialize duplicate detector:', error);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DuplicateDetector, duplicateDetector };
}
