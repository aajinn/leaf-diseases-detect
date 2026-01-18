import apiClient from '@/lib/api';
import {
  AdminStats,
  UserManagement,
  APIUsage,
  CostTracking,
  SystemHealth,
  AdminAction,
  DataExport,
  UserActivity,
} from '@/types/admin';
import { User } from '@/types/auth';
import { PaginatedResponse, ApiResponse } from '@/types/api';

export const adminApi = {
  // Get admin dashboard stats
  getStats: async (): Promise<AdminStats> => {
    const response = await apiClient.get<AdminStats>('/api/v1/admin/stats');
    return response.data;
  },

  // Get all users
  getUsers: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    is_active?: boolean;
    is_admin?: boolean;
  }): Promise<PaginatedResponse<User>> => {
    const response = await apiClient.get<PaginatedResponse<User>>('/api/v1/admin/users', {
      params,
    });

    return response.data;
  },

  // Get user by ID
  getUserById: async (userId: string): Promise<User> => {
    const response = await apiClient.get<User>(`/api/v1/admin/users/${userId}`);
    return response.data;
  },

  // Update user
  updateUser: async (userId: string, data: Partial<User>): Promise<User> => {
    const response = await apiClient.put<User>(`/api/v1/admin/users/${userId}`, data);
    return response.data;
  },

  // Delete user
  deleteUser: async (userId: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/api/v1/admin/users/${userId}`);
    return response.data;
  },

  // Suspend/Activate user
  toggleUserStatus: async (userId: string, isActive: boolean): Promise<User> => {
    const response = await apiClient.patch<User>(`/api/v1/admin/users/${userId}/status`, {
      is_active: isActive,
    });
    return response.data;
  },

  // Get user activity
  getUserActivity: async (userId: string): Promise<UserActivity> => {
    const response = await apiClient.get<UserActivity>(`/api/v1/admin/users/${userId}/activity`);
    return response.data;
  },

  // Get API usage statistics
  getAPIUsage: async (params?: {
    date_from?: string;
    date_to?: string;
    user_id?: string;
  }): Promise<APIUsage> => {
    const response = await apiClient.get<APIUsage>('/api/v1/admin/api-usage', {
      params,
    });

    return response.data;
  },

  // Get cost tracking
  getCostTracking: async (params?: {
    date_from?: string;
    date_to?: string;
  }): Promise<CostTracking> => {
    const response = await apiClient.get<CostTracking>('/api/v1/admin/cost-tracking', {
      params,
    });

    return response.data;
  },

  // Get system health
  getSystemHealth: async (): Promise<SystemHealth> => {
    const response = await apiClient.get<SystemHealth>('/api/v1/admin/system-health');
    return response.data;
  },

  // Get admin actions log
  getAdminActions: async (params?: {
    page?: number;
    page_size?: number;
    action_type?: string;
    admin_id?: string;
  }): Promise<PaginatedResponse<AdminAction>> => {
    const response = await apiClient.get<PaginatedResponse<AdminAction>>('/api/v1/admin/actions', {
      params,
    });

    return response.data;
  },

  // Update API keys
  updateAPIKeys: async (keys: {
    openai_api_key?: string;
    aws_access_key?: string;
    aws_secret_key?: string;
    [key: string]: string | undefined;
  }): Promise<ApiResponse<void>> => {
    const response = await apiClient.put<ApiResponse<void>>('/api/v1/admin/api-keys', keys);
    return response.data;
  },

  // Get API keys (masked)
  getAPIKeys: async (): Promise<Record<string, string>> => {
    const response = await apiClient.get<Record<string, string>>('/api/v1/admin/api-keys');
    return response.data;
  },

  // Export data
  exportData: async (exportType: 'users' | 'detections' | 'analytics' | 'full'): Promise<DataExport> => {
    const response = await apiClient.post<DataExport>('/api/v1/admin/export', {
      export_type: exportType,
    });

    return response.data;
  },

  // Get export status
  getExportStatus: async (exportId: string): Promise<DataExport> => {
    const response = await apiClient.get<DataExport>(`/api/v1/admin/export/${exportId}`);
    return response.data;
  },

  // Download export file
  downloadExport: async (exportId: string): Promise<Blob> => {
    const response = await apiClient.get(`/api/v1/admin/export/${exportId}/download`, {
      responseType: 'blob',
    });

    return response.data;
  },

  // Update system settings
  updateSystemSettings: async (settings: Record<string, any>): Promise<ApiResponse<void>> => {
    const response = await apiClient.put<ApiResponse<void>>('/api/v1/admin/settings', settings);
    return response.data;
  },

  // Get system settings
  getSystemSettings: async (): Promise<Record<string, any>> => {
    const response = await apiClient.get<Record<string, any>>('/api/v1/admin/settings');
    return response.data;
  },

  // Clear cache
  clearCache: async (): Promise<ApiResponse<void>> => {
    const response = await apiClient.post<ApiResponse<void>>('/api/v1/admin/cache/clear');
    return response.data;
  },

  // Run database backup
  runBackup: async (): Promise<ApiResponse<{ backup_id: string }>> => {
    const response = await apiClient.post<ApiResponse<{ backup_id: string }>>('/api/v1/admin/backup');
    return response.data;
  },
};

export default adminApi;
