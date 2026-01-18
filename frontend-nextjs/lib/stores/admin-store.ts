import { create } from 'zustand';
import { AdminStats, UserManagement, APIUsage, CostTracking } from '@/types/admin';

interface AdminState {
  stats: AdminStats | null;
  users: UserManagement | null;
  apiUsage: APIUsage | null;
  costTracking: CostTracking | null;
  isLoading: boolean;
  error: string | null;
  setStats: (stats: AdminStats) => void;
  setUsers: (users: UserManagement) => void;
  setApiUsage: (apiUsage: APIUsage) => void;
  setCostTracking: (costTracking: CostTracking) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  stats: null,
  users: null,
  apiUsage: null,
  costTracking: null,
  isLoading: false,
  error: null,

  setStats: (stats) =>
    set({
      stats,
      error: null,
    }),

  setUsers: (users) =>
    set({
      users,
      error: null,
    }),

  setApiUsage: (apiUsage) =>
    set({
      apiUsage,
      error: null,
    }),

  setCostTracking: (costTracking) =>
    set({
      costTracking,
      error: null,
    }),

  setLoading: (loading) =>
    set({
      isLoading: loading,
    }),

  setError: (error) =>
    set({
      error,
      isLoading: false,
    }),

  reset: () =>
    set({
      stats: null,
      users: null,
      apiUsage: null,
      costTracking: null,
      isLoading: false,
      error: null,
    }),
}));
