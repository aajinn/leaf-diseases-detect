export interface DetectionResult {
  id: string;
  user_id: string;
  image_url: string;
  disease_name: string;
  confidence: number;
  severity?: string;
  affected_area_percentage?: number;
  recommendations: string[];
  treatment_options?: string[];
  prevention_tips?: string[];
  created_at: string;
  processing_time?: number;
  model_version?: string;
}

export interface DetectionRequest {
  image: File | string;
  model_type?: 'fast' | 'accurate';
  include_recommendations?: boolean;
}

export interface DetectionResponse {
  detection_id: string;
  disease_name: string;
  confidence: number;
  severity: string;
  affected_area_percentage: number;
  recommendations: string[];
  treatment_options: string[];
  prevention_tips: string[];
  image_url: string;
  processing_time: number;
  timestamp: string;
}

export interface AnalysisHistory {
  id: string;
  user_id: string;
  detections: DetectionResult[];
  total_detections: number;
  date_range: {
    start: string;
    end: string;
  };
  statistics: {
    most_common_disease: string;
    average_confidence: number;
    total_images_analyzed: number;
    diseases_detected: string[];
  };
}

export interface DetectionStats {
  total_detections: number;
  successful_detections: number;
  failed_detections: number;
  average_confidence: number;
  most_detected_disease: string;
  detection_by_disease: Record<string, number>;
  detection_by_date: Record<string, number>;
}

export interface BatchDetectionRequest {
  images: File[];
  model_type?: 'fast' | 'accurate';
}

export interface BatchDetectionResponse {
  batch_id: string;
  results: DetectionResponse[];
  total_processed: number;
  total_failed: number;
  processing_time: number;
}

export type DiseaseSeverity = 'mild' | 'moderate' | 'severe' | 'critical';

export interface DiseaseInfo {
  name: string;
  scientific_name?: string;
  description: string;
  symptoms: string[];
  causes: string[];
  treatment: string[];
  prevention: string[];
  affected_crops: string[];
}
