// Central export file for all API modules
export { default as authApi } from './auth';
export { default as detectionApi } from './detection';
export { default as adminApi } from './admin';

// Re-export the main API client
export { default as apiClient } from '@/lib/api';
