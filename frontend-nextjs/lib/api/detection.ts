import apiClient from '@/lib/api';
import {
  DetectionResult,
  DetectionResponse,
  AnalysisHistory,
  DetectionStats,
  BatchDetectionResponse,
  DiseaseInfo,
} from '@/types/detection';
import { PaginatedResponse, ApiResponse } from '@/types/api';

export const detectionApi = {
  // Detect disease from image
  detectDisease: async (
    imageFile: File,
    options?: {
      model_type?: 'fast' | 'accurate';
      include_recommendations?: boolean;
    }
  ): Promise<DetectionResponse> => {
    const formData = new FormData();
    formData.append('file', imageFile);
    
    if (options?.model_type) {
      formData.append('model_type', options.model_type);
    }
    if (options?.include_recommendations !== undefined) {
      formData.append('include_recommendations', String(options.include_recommendations));
    }

    const response = await apiClient.post<DetectionResponse>('/api/v1/detection/detect', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  // Batch detect diseases
  batchDetect: async (
    imageFiles: File[],
    modelType?: 'fast' | 'accurate'
  ): Promise<BatchDetectionResponse> => {
    const formData = new FormData();
    imageFiles.forEach((file) => {
      formData.append('files', file);
    });
    
    if (modelType) {
      formData.append('model_type', modelType);
    }

    const response = await apiClient.post<BatchDetectionResponse>('/api/v1/detection/batch', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  // Get analysis history
  getAnalysisHistory: async (params?: {
    page?: number;
    page_size?: number;
    date_from?: string;
    date_to?: string;
  }): Promise<PaginatedResponse<DetectionResult>> => {
    const response = await apiClient.get<PaginatedResponse<DetectionResult>>('/api/v1/detection/history', {
      params,
    });

    return response.data;
  },

  // Get analysis by ID
  getAnalysisById: async (id: string): Promise<DetectionResult> => {
    const response = await apiClient.get<DetectionResult>(`/api/v1/detection/${id}`);
    return response.data;
  },

  // Delete analysis
  deleteAnalysis: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/api/v1/detection/${id}`);
    return response.data;
  },

  // Get detection statistics
  getDetectionStats: async (params?: {
    date_from?: string;
    date_to?: string;
  }): Promise<DetectionStats> => {
    const response = await apiClient.get<DetectionStats>('/api/v1/detection/stats', {
      params,
    });

    return response.data;
  },

  // Get disease information
  getDiseaseInfo: async (diseaseName: string): Promise<DiseaseInfo> => {
    const response = await apiClient.get<DiseaseInfo>(`/api/v1/detection/disease/${diseaseName}`);
    return response.data;
  },

  // Get all diseases
  getAllDiseases: async (): Promise<DiseaseInfo[]> => {
    const response = await apiClient.get<DiseaseInfo[]>('/api/v1/detection/diseases');
    return response.data;
  },

  // Export analysis history
  exportHistory: async (format: 'csv' | 'json' | 'pdf'): Promise<Blob> => {
    const response = await apiClient.get(`/api/v1/detection/export`, {
      params: { format },
      responseType: 'blob',
    });

    return response.data;
  },

  // Get recent detections
  getRecentDetections: async (limit: number = 10): Promise<DetectionResult[]> => {
    const response = await apiClient.get<DetectionResult[]>('/api/v1/detection/recent', {
      params: { limit },
    });

    return response.data;
  },
};

export default detectionApi;
