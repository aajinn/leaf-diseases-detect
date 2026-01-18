# Detection Components Integration Guide

Complete guide for integrating detection components with your backend API.

## Quick Start

### 1. Install Dependencies

All dependencies are already installed:
- ✓ react-dropzone
- ✓ framer-motion
- ✓ date-fns
- ✓ lucide-react
- ✓ shadcn/ui components

### 2. Import Components

```tsx
import {
  ImageUploader,
  DetectionResults,
  AnalysisHistory,
} from "@/components/detection";
```

### 3. Import Types

```tsx
import { DetectionResponse, DetectionResult } from "@/types/detection";
```

---

## Complete Integration Example

### Detection Page with API Integration

```tsx
"use client";

import { useState, useEffect } from "react";
import {
  ImageUploader,
  DetectionResults,
  AnalysisHistory,
} from "@/components/detection";
import { LoadingSpinner, ErrorBoundary } from "@/components/shared";
import { DetectionResponse, DetectionResult } from "@/types/detection";
import { useToast } from "@/hooks/use-toast";
import apiClient from "@/lib/api";

export default function DetectionPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DetectionResponse | null>(null);
  const [history, setHistory] = useState<DetectionResult[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const { toast } = useToast();

  // Load analysis history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const response = await apiClient.get("/api/v1/detections/history");
      setHistory(response.data.detections || []);
    } catch (error) {
      console.error("Failed to load history:", error);
      toast({
        title: "Error",
        description: "Failed to load analysis history",
        variant: "destructive",
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleImageSelect = (file: File) => {
    setSelectedFile(file);
    setResult(null); // Clear previous results
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsAnalyzing(true);

      // Create FormData
      const formData = new FormData();
      formData.append("image", selectedFile);
      formData.append("model_type", "accurate"); // or "fast"
      formData.append("include_recommendations", "true");

      // Upload to API
      const response = await apiClient.post(
        "/api/v1/detections/analyze",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Set result
      setResult(response.data);

      // Reload history
      await loadHistory();

      // Show success toast
      toast({
        title: "Analysis Complete",
        description: `Detected: ${response.data.disease_name}`,
      });
    } catch (error: any) {
      console.error("Analysis failed:", error);
      toast({
        title: "Analysis Failed",
        description: error.response?.data?.message || "Failed to analyze image",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleViewDetails = async (analysis: DetectionResult) => {
    try {
      // Fetch full details if needed
      const response = await apiClient.get(
        `/api/v1/detections/${analysis.id}`
      );
      
      // Convert to DetectionResponse format
      const detectionResponse: DetectionResponse = {
        detection_id: response.data.id,
        disease_name: response.data.disease_name,
        confidence: response.data.confidence,
        severity: response.data.severity || "moderate",
        affected_area_percentage: response.data.affected_area_percentage || 0,
        recommendations: response.data.recommendations || [],
        treatment_options: response.data.treatment_options || [],
        prevention_tips: response.data.prevention_tips || [],
        image_url: response.data.image_url,
        processing_time: response.data.processing_time || 0,
        timestamp: response.data.created_at,
      };
      
      setResult(detectionResponse);
      
      // Scroll to results
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Failed to load details:", error);
      toast({
        title: "Error",
        description: "Failed to load analysis details",
        variant: "destructive",
      });
    }
  };

  return (
    <ErrorBoundary>
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Disease Detection</h1>
          <p className="text-muted-foreground">
            Upload a leaf image to detect diseases and get treatment recommendations
          </p>
        </div>

        {/* Image Upload */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Upload Image</h2>
          {isAnalyzing ? (
            <div className="py-12">
              <LoadingSpinner text="Analyzing image..." size="lg" />
            </div>
          ) : (
            <ImageUploader
              onImageSelect={handleImageSelect}
              onUpload={handleUpload}
              maxSize={10}
            />
          )}
        </section>

        {/* Detection Results */}
        {result && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Detection Results</h2>
            <DetectionResults result={result} />
          </section>
        )}

        {/* Analysis History */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Analysis History</h2>
          {isLoadingHistory ? (
            <div className="py-12">
              <LoadingSpinner text="Loading history..." size="md" />
            </div>
          ) : (
            <AnalysisHistory
              analyses={history}
              onViewDetails={handleViewDetails}
              itemsPerPage={6}
            />
          )}
        </section>
      </div>
    </ErrorBoundary>
  );
}
```

---

## API Endpoints

### 1. Analyze Image

**Endpoint:** `POST /api/v1/detections/analyze`

**Request:**
```typescript
// FormData
{
  image: File,
  model_type?: "fast" | "accurate",
  include_recommendations?: boolean
}
```

**Response:**
```typescript
{
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
```

### 2. Get Analysis History

**Endpoint:** `GET /api/v1/detections/history`

**Query Parameters:**
```typescript
{
  page?: number;
  page_size?: number;
  sort_by?: "created_at" | "confidence";
  sort_order?: "asc" | "desc";
}
```

**Response:**
```typescript
{
  detections: DetectionResult[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
```

### 3. Get Detection Details

**Endpoint:** `GET /api/v1/detections/:id`

**Response:**
```typescript
{
  id: string;
  user_id: string;
  image_url: string;
  disease_name: string;
  confidence: number;
  severity: string;
  affected_area_percentage: number;
  recommendations: string[];
  treatment_options: string[];
  prevention_tips: string[];
  created_at: string;
  processing_time: number;
  model_version: string;
}
```

---

## State Management with Zustand

### Create Detection Store

```typescript
// lib/stores/detection-store.ts
import { create } from "zustand";
import { DetectionResponse, DetectionResult } from "@/types/detection";

interface DetectionState {
  currentResult: DetectionResponse | null;
  history: DetectionResult[];
  isAnalyzing: boolean;
  isLoadingHistory: boolean;
  
  setCurrentResult: (result: DetectionResponse | null) => void;
  setHistory: (history: DetectionResult[]) => void;
  setIsAnalyzing: (isAnalyzing: boolean) => void;
  setIsLoadingHistory: (isLoading: boolean) => void;
  addToHistory: (result: DetectionResult) => void;
  clearCurrentResult: () => void;
}

export const useDetectionStore = create<DetectionState>((set) => ({
  currentResult: null,
  history: [],
  isAnalyzing: false,
  isLoadingHistory: false,
  
  setCurrentResult: (result) => set({ currentResult: result }),
  setHistory: (history) => set({ history }),
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setIsLoadingHistory: (isLoading) => set({ isLoadingHistory: isLoading }),
  addToHistory: (result) =>
    set((state) => ({ history: [result, ...state.history] })),
  clearCurrentResult: () => set({ currentResult: null }),
}));
```

### Use in Component

```tsx
import { useDetectionStore } from "@/lib/stores/detection-store";

export default function DetectionPage() {
  const {
    currentResult,
    history,
    isAnalyzing,
    setCurrentResult,
    setIsAnalyzing,
  } = useDetectionStore();

  // ... rest of component
}
```

---

## Error Handling

### API Error Handler

```typescript
// lib/api/detection-api.ts
import apiClient from "@/lib/api";
import { DetectionResponse, DetectionResult } from "@/types/detection";

export class DetectionAPI {
  static async analyzeImage(
    file: File,
    options?: {
      modelType?: "fast" | "accurate";
      includeRecommendations?: boolean;
    }
  ): Promise<DetectionResponse> {
    try {
      const formData = new FormData();
      formData.append("image", file);
      
      if (options?.modelType) {
        formData.append("model_type", options.modelType);
      }
      
      if (options?.includeRecommendations !== undefined) {
        formData.append(
          "include_recommendations",
          String(options.includeRecommendations)
        );
      }

      const response = await apiClient.post(
        "/api/v1/detections/analyze",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to analyze image"
      );
    }
  }

  static async getHistory(params?: {
    page?: number;
    pageSize?: number;
  }): Promise<{ detections: DetectionResult[]; total: number }> {
    try {
      const response = await apiClient.get("/api/v1/detections/history", {
        params: {
          page: params?.page || 1,
          page_size: params?.pageSize || 10,
        },
      });

      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to load history"
      );
    }
  }

  static async getDetails(id: string): Promise<DetectionResult> {
    try {
      const response = await apiClient.get(`/api/v1/detections/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to load details"
      );
    }
  }
}
```

### Use in Component

```tsx
import { DetectionAPI } from "@/lib/api/detection-api";

const handleUpload = async () => {
  if (!selectedFile) return;

  try {
    setIsAnalyzing(true);
    
    const result = await DetectionAPI.analyzeImage(selectedFile, {
      modelType: "accurate",
      includeRecommendations: true,
    });
    
    setResult(result);
    
    toast({
      title: "Success",
      description: "Image analyzed successfully",
    });
  } catch (error: any) {
    toast({
      title: "Error",
      description: error.message,
      variant: "destructive",
    });
  } finally {
    setIsAnalyzing(false);
  }
};
```

---

## Performance Optimization

### 1. Image Optimization

```tsx
// Optimize image before upload
const optimizeImage = async (file: File): Promise<File> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        
        // Max dimensions
        const maxWidth = 1024;
        const maxHeight = 1024;
        
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: "image/jpeg" }));
          }
        }, "image/jpeg", 0.9);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};
```

### 2. Lazy Loading History

```tsx
import { useEffect, useRef, useCallback } from "react";

const useInfiniteScroll = (callback: () => void) => {
  const observer = useRef<IntersectionObserver>();
  
  const lastElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (observer.current) observer.current.disconnect();
      
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          callback();
        }
      });
      
      if (node) observer.current.observe(node);
    },
    [callback]
  );
  
  return lastElementRef;
};
```

---

## Testing

### Unit Tests Example

```typescript
// __tests__/components/detection/ImageUploader.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { ImageUploader } from "@/components/detection";

describe("ImageUploader", () => {
  it("renders dropzone", () => {
    render(<ImageUploader onImageSelect={jest.fn()} />);
    expect(screen.getByText(/drag & drop/i)).toBeInTheDocument();
  });

  it("calls onImageSelect when file is selected", async () => {
    const onImageSelect = jest.fn();
    render(<ImageUploader onImageSelect={onImageSelect} />);
    
    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = screen.getByRole("button").querySelector("input");
    
    fireEvent.change(input!, { target: { files: [file] } });
    
    expect(onImageSelect).toHaveBeenCalledWith(file);
  });
});
```

---

## Deployment Checklist

- [ ] Environment variables configured
- [ ] API endpoints tested
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] Toast notifications working
- [ ] Image optimization enabled
- [ ] Pagination tested
- [ ] Mobile responsive verified
- [ ] Accessibility checked
- [ ] Performance optimized

---

## Troubleshooting

### Issue: Images not uploading
- Check file size limits
- Verify MIME types accepted
- Check CORS configuration
- Verify API endpoint

### Issue: Results not displaying
- Check API response format
- Verify type definitions match
- Check console for errors
- Verify data transformation

### Issue: History not loading
- Check authentication token
- Verify API endpoint
- Check pagination parameters
- Verify data format

---

## Support

For issues or questions:
1. Check the README.md
2. Review COMPONENTS_SUMMARY.md
3. Test with /detection-demo page
4. Check browser console for errors
