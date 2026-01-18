# Detection Components

Disease detection components for image upload, analysis results, and history tracking.

## Components

### ImageUploader

Drag-and-drop image uploader with preview and validation.

**Props:**
- `onImageSelect: (file: File) => void` - Callback when image is selected (required)
- `onUpload?: () => void` - Callback when upload button is clicked
- `maxSize?: number` - Maximum file size in MB (default: 10)
- `acceptedFormats?: string[]` - Accepted MIME types (default: JPG, PNG, WEBP)
- `disabled?: boolean` - Disable the uploader
- `className?: string` - Additional CSS classes

**Features:**
- Drag-and-drop zone using react-dropzone
- Image preview with remove button
- File validation (size and type)
- Error messages for invalid files
- File information display (name, size)
- Upload/Analyze button

**Usage:**
```tsx
import { ImageUploader } from "@/components/detection";

const [selectedFile, setSelectedFile] = useState<File | null>(null);

<ImageUploader
  onImageSelect={(file) => setSelectedFile(file)}
  onUpload={() => console.log("Analyzing...")}
  maxSize={10}
/>
```

---

### DetectionResults

Display disease detection results with severity indicators and recommendations.

**Props:**
- `result: DetectionResponse` - Detection result data (required)
- `className?: string` - Additional CSS classes

**Features:**
- Disease name with confidence badge
- Color-coded severity indicator (mild, moderate, severe, critical)
- Affected area percentage
- Key observations/symptoms list
- Treatment recommendations with icons
- Prevention tips in grid layout
- Processing time display
- Animated card entrance with framer-motion
- Responsive grid layout

**Severity Colors:**
- Mild: Green
- Moderate: Yellow
- Severe: Orange
- Critical: Red

**Usage:**
```tsx
import { DetectionResults } from "@/components/detection";

const result: DetectionResponse = {
  detection_id: "123",
  disease_name: "Leaf Blight",
  confidence: 95.5,
  severity: "moderate",
  affected_area_percentage: 35.2,
  recommendations: ["Remove affected leaves", "Apply fungicide"],
  treatment_options: ["Copper-based fungicide", "Neem oil spray"],
  prevention_tips: ["Improve air circulation", "Avoid overhead watering"],
  image_url: "/path/to/image.jpg",
  processing_time: 2.34,
  timestamp: "2024-01-15T10:30:00Z",
};

<DetectionResults result={result} />
```

---

### AnalysisHistory

Display paginated list of past disease analyses with thumbnails.

**Props:**
- `analyses: DetectionResult[]` - Array of detection results (required)
- `onViewDetails?: (analysis: DetectionResult) => void` - Callback when clicking an analysis
- `itemsPerPage?: number` - Number of items per page (default: 6)
- `className?: string` - Additional CSS classes

**Features:**
- Grid layout with thumbnail cards
- Image thumbnails with hover overlay
- Disease name and confidence badge
- Severity indicator
- Date/time stamps formatted with date-fns
- Processing time display
- Pagination controls with page numbers
- Empty state for no analyses
- Hover effects and transitions
- Responsive grid (1-3 columns)

**Usage:**
```tsx
import { AnalysisHistory } from "@/components/detection";

const analyses: DetectionResult[] = [
  {
    id: "1",
    user_id: "user123",
    image_url: "/images/leaf1.jpg",
    disease_name: "Powdery Mildew",
    confidence: 92.3,
    severity: "mild",
    affected_area_percentage: 15.5,
    recommendations: ["Apply sulfur spray"],
    created_at: "2024-01-15T10:30:00Z",
    processing_time: 1.85,
  },
  // ... more analyses
];

<AnalysisHistory
  analyses={analyses}
  onViewDetails={(analysis) => console.log(analysis)}
  itemsPerPage={6}
/>
```

---

## Import All Components

```tsx
import { ImageUploader, DetectionResults, AnalysisHistory } from "@/components/detection";
```

---

## Type Definitions

### DetectionResponse
```typescript
interface DetectionResponse {
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

### DetectionResult
```typescript
interface DetectionResult {
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
```

---

## Dependencies

- **react-dropzone** - File upload with drag-and-drop
- **framer-motion** - Animations for DetectionResults
- **date-fns** - Date formatting for AnalysisHistory
- **lucide-react** - Icons
- **shadcn/ui** - Base UI components (Card, Button, Badge)

---

## Styling

All components use:
- Tailwind CSS for styling
- shadcn/ui design system
- Green theme from your configuration
- Responsive breakpoints
- Smooth transitions and animations

---

## Complete Example

```tsx
"use client";

import { useState } from "react";
import {
  ImageUploader,
  DetectionResults,
  AnalysisHistory,
} from "@/components/detection";
import { DetectionResponse, DetectionResult } from "@/types/detection";

export default function DetectionPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<DetectionResponse | null>(null);
  const [history, setHistory] = useState<DetectionResult[]>([]);

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    // Call your API here
    const formData = new FormData();
    formData.append("image", selectedFile);
    
    // const response = await fetch("/api/detect", { method: "POST", body: formData });
    // const data = await response.json();
    // setResult(data);
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <ImageUploader
        onImageSelect={setSelectedFile}
        onUpload={handleUpload}
      />
      
      {result && <DetectionResults result={result} />}
      
      <AnalysisHistory
        analyses={history}
        onViewDetails={(analysis) => console.log(analysis)}
      />
    </div>
  );
}
```

---

## Notes

- ImageUploader validates file size and type before accepting
- DetectionResults uses framer-motion for smooth animations
- AnalysisHistory includes smart pagination with ellipsis
- All components are fully typed with TypeScript
- Responsive design works on mobile, tablet, and desktop
- Empty states handled gracefully
- Error states displayed with clear messages
