import { create } from 'zustand';
import { DetectionResult } from '@/types/detection';

interface DetectionState {
  currentResult: DetectionResult | null;
  history: DetectionResult[];
  isDetecting: boolean;
  error: string | null;
  setResult: (result: DetectionResult | null) => void;
  addToHistory: (result: DetectionResult) => void;
  setHistory: (history: DetectionResult[]) => void;
  clearHistory: () => void;
  setDetecting: (detecting: boolean) => void;
  setError: (error: string | null) => void;
  removeFromHistory: (id: string) => void;
}

export const useDetectionStore = create<DetectionState>((set) => ({
  currentResult: null,
  history: [],
  isDetecting: false,
  error: null,

  setResult: (result) =>
    set({
      currentResult: result,
      error: null,
    }),

  addToHistory: (result) =>
    set((state) => ({
      history: [result, ...state.history],
      currentResult: result,
    })),

  setHistory: (history) =>
    set({
      history,
    }),

  clearHistory: () =>
    set({
      history: [],
      currentResult: null,
    }),

  setDetecting: (detecting) =>
    set({
      isDetecting: detecting,
      error: detecting ? null : undefined,
    }),

  setError: (error) =>
    set({
      error,
      isDetecting: false,
    }),

  removeFromHistory: (id) =>
    set((state) => ({
      history: state.history.filter((item) => item.id !== id),
      currentResult:
        state.currentResult?.id === id ? null : state.currentResult,
    })),
}));
