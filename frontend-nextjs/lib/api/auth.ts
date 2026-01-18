import apiClient, { setAccessToken, setRefreshToken, removeAccessToken } from '@/lib/api';
import { LoginRequest, RegisterRequest, AuthResponse, User, ChangePasswordRequest } from '@/types/auth';
import { ApiResponse } from '@/types/api';

export const authApi = {
  // Login user
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await apiClient.post<AuthResponse>('/api/v1/auth/login', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // Store tokens
    setAccessToken(response.data.access_token);
    if (response.data.refresh_token) {
      setRefreshToken(response.data.refresh_token);
    }

    return response.data;
  },

  // Register new user
  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/api/v1/auth/register', userData);

    // Store tokens
    setAccessToken(response.data.access_token);
    if (response.data.refresh_token) {
      setRefreshToken(response.data.refresh_token);
    }

    return response.data;
  },

  // Logout user
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/api/v1/auth/logout');
    } finally {
      removeAccessToken();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('refresh_token');
      }
    }
  },

  // Refresh access token
  refreshToken: async (refreshToken: string): Promise<{ access_token: string }> => {
    const response = await apiClient.post<{ access_token: string }>('/api/v1/auth/refresh', {
      refresh_token: refreshToken,
    });

    setAccessToken(response.data.access_token);
    return response.data;
  },

  // Get current user profile
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/api/v1/auth/me');
    return response.data;
  },

  // Update user profile
  updateProfile: async (userData: Partial<User>): Promise<User> => {
    const response = await apiClient.put<User>('/api/v1/auth/profile', userData);
    return response.data;
  },

  // Change password
  changePassword: async (passwordData: ChangePasswordRequest): Promise<ApiResponse<void>> => {
    const response = await apiClient.post<ApiResponse<void>>('/api/v1/auth/change-password', passwordData);
    return response.data;
  },

  // Request password reset
  requestPasswordReset: async (email: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.post<ApiResponse<void>>('/api/v1/auth/password-reset', { email });
    return response.data;
  },

  // Confirm password reset
  confirmPasswordReset: async (token: string, newPassword: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.post<ApiResponse<void>>('/api/v1/auth/password-reset/confirm', {
      token,
      new_password: newPassword,
    });
    return response.data;
  },

  // Verify email
  verifyEmail: async (token: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.post<ApiResponse<void>>('/api/v1/auth/verify-email', { token });
    return response.data;
  },
};

export default authApi;
