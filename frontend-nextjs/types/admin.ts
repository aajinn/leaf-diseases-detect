import { User } from './auth';

export interface AdminStats {
  total_users: number;
  active_users: number;
  total_detections: number;
  detections_today: number;
  detections_this_week: number;
  detections_this_month: number;
  total_api_calls: number;
  api_calls_today: number;
  total_cost: number;
  cost_this_month: number;
  average_response_time: number;
  system_health: 'healthy' | 'warning' | 'critical';
  storage_used: number;
  storage_limit: number;
}

export interface UserManagement {
  users: User[];
  total_count: number;
  active_count: number;
  inactive_count: number;
  admin_count: number;
  recent_signups: User[];
  user_growth: {
    date: string;
    count: number;
  }[];
}

export interface UserActivity {
  user_id: string;
  username: string;
  email: string;
  last_login: string;
  total_detections: number;
  last_detection: string;
  api_calls: number;
  account_status: 'active' | 'inactive' | 'suspended';
}

export interface APIUsage {
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  average_response_time: number;
  requests_by_endpoint: {
    endpoint: string;
    count: number;
    average_time: number;
    error_rate: number;
  }[];
  requests_by_date: {
    date: string;
    count: number;
    errors: number;
  }[];
  requests_by_user: {
    user_id: string;
    username: string;
    count: number;
    last_request: string;
  }[];
  rate_limit_hits: number;
}

export interface CostTracking {
  total_cost: number;
  cost_breakdown: {
    api_calls: number;
    storage: number;
    compute: number;
    other: number;
  };
  cost_by_date: {
    date: string;
    amount: number;
    api_calls: number;
    storage: number;
  }[];
  cost_by_user: {
    user_id: string;
    username: string;
    total_cost: number;
    api_calls_cost: number;
    storage_cost: number;
  }[];
  monthly_budget: number;
  budget_used_percentage: number;
  projected_monthly_cost: number;
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  active_connections: number;
  database_status: 'connected' | 'disconnected' | 'error';
  cache_status: 'active' | 'inactive' | 'error';
  last_check: string;
  issues: {
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: string;
  }[];
}

export interface AdminAction {
  id: string;
  admin_id: string;
  admin_username: string;
  action_type: 'user_update' | 'user_delete' | 'user_suspend' | 'system_config' | 'data_export' | 'other';
  target_id?: string;
  description: string;
  timestamp: string;
  ip_address?: string;
}

export interface DataExport {
  id: string;
  export_type: 'users' | 'detections' | 'analytics' | 'full';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  file_url?: string;
  file_size?: number;
  created_at: string;
  completed_at?: string;
  requested_by: string;
}
