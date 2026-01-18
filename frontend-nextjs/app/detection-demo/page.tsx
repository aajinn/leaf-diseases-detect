"use client";

import { useState } from "react";
import {
  ImageUploader,
  DetectionResults,
  AnalysisHistory,
} from "@/components/detection";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DetectionResponse, DetectionResult } from "@/types/detection";
import { LoadingSpinner } from "@/components/shared";

// Mock data for demonstration
const mockDetectionResult: DetectionResponse = {
  detection_id: "det_123456",
  disease_name: "Tomato Late Blight",
  confidence: 94.5,
  severity: "severe",
  affected_area_percentage: 42.3,
  recommendations: [
    "Remove and destroy infected plant parts immediately",
    "Improve air circulation around plants",
    "Avoid overhead watering to reduce leaf wetness",
    "Apply copper-based fungicide as preventive measure",
    "Monitor surrounding plants for early signs",
  ],
  treatment_options: [
    "Apply copper-based fungicide (Bordeaux mixture) every 7-10 days",
    "Use chlorothalonil fungicide for severe infections",
    "Remove heavily infected plants to prevent spread",
    "Apply organic neem oil spray as alternative treatment",
  ],
  prevention_tips: [
    "Plant resistant varieties when available",
    "Ensure proper spacing between plants",
    "Water at the base of plants, not overhead",
    "Remove plant debris and fallen leaves regularly",
    "Rotate crops annually to break disease cycle",
    "Apply mulch to prevent soil splash onto leaves",
  ],
  image_url: "https://images.unsplash.com/photo-1592921870789-04563d55041c?w=800",
  processing_time: 2.34,
  timestamp: new Date().toISOString(),
};

const mockAnalysisHistory: DetectionResult[] = [
  {
    id: "1",
    user_id: "user_123",
    image_url: "https://images.unsplash.com/photo-1592921870789-04563d55041c?w=400",
    disease_name: "Tomato Late Blight",
    confidence: 94.5,
    severity: "severe",
    affected_area_percentage: 42.3,
    recommendations: ["Remove infected parts", "Apply fungicide"],
    treatment_options: ["Copper-based fungicide"],
    prevention_tips: ["Improve air circulation"],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    processing_time: 2.34,
    model_version: "v1.2.0",
  },
  {
    id: "2",
    user_id: "user_123",
    image_url: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400",
    disease_name: "Powdery Mildew",
    confidence: 89.2,
    severity: "moderate",
    affected_area_percentage: 28.5,
    recommendations: ["Apply sulfur spray", "Increase sunlight exposure"],
    treatment_options: ["Sulfur-based fungicide", "Neem oil"],
    prevention_tips: ["Ensure good air flow", "Avoid overcrowding"],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    processing_time: 1.89,
    model_version: "v1.2.0",
  },
  {
    id: "3",
    user_id: "user_123",
    image_url: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400",
    disease_name: "Leaf Spot",
    confidence: 92.8,
    severity: "mild",
    affected_area_percentage: 15.2,
    recommendations: ["Remove affected leaves", "Improve drainage"],
    treatment_options: ["Copper fungicide", "Organic treatment"],
    prevention_tips: ["Water at base", "Remove debris"],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    processing_time: 1.56,
    model_version: "v1.2.0",
  },
  {
    id: "4",
    user_id: "user_123",
    image_url: "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=400",
    disease_name: "Bacterial Wilt",
    confidence: 87.3,
    severity: "critical",
    affected_area_percentage: 65.8,
    recommendations: ["Remove entire plant", "Disinfect tools", "Test soil"],
    treatment_options: ["No chemical cure available", "Remove and destroy plant"],
    prevention_tips: ["Use disease-free seeds", "Rotate crops", "Control insects"],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    processing_time: 2.12,
    model_version: "v1.2.0",
  },
  {
    id: "5",
    user_id: "user_123",
    image_url: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400",
    disease_name: "Rust Disease",
    confidence: 91.5,
    severity: "moderate",
    affected_area_percentage: 32.1,
    recommendations: ["Apply fungicide", "Remove infected leaves"],
    treatment_options: ["Sulfur spray", "Copper fungicide"],
    prevention_tips: ["Avoid wet foliage", "Plant resistant varieties"],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    processing_time: 1.78,
    model_version: "v1.2.0",
  },
  {
    id: "6",
    user_id: "user_123",
    image_url: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400",
    disease_name: "Anthracnose",
    confidence: 88.9,
    severity: "moderate",
    affected_area_percentage: 25.7,
    recommendations: ["Prune infected areas", "Apply fungicide"],
    treatment_options: ["Chlorothalonil", "Mancozeb"],
    prevention_tips: ["Improve air circulation", "Avoid overhead watering"],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
    processing_time: 2.01,
    model_version: "v1.2.0",
  },
  {
    id: "7",
    user_id: "user_123",
    image_url: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=400",
    disease_name: "Downy Mildew",
    confidence: 93.2,
    severity: "severe",
    affected_area_percentage: 48.6,
    recommendations: ["Remove infected plants", "Apply systemic fungicide"],
    treatment_options: ["Metalaxyl", "Fosetyl-Al"],
    prevention_tips: ["Use resistant varieties", "Ensure good drainage"],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 144).toISOString(),
    processing_time: 2.45,
    model_version: "v1.2.0",
  },
];

export default function DetectionDemoPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<DetectionResult | null>(null);

  const handleImageSelect = (file: File) => {
    setSelectedFile(file);
    setShowResults(false);
  };

  const handleUpload = () => {
    setIsAnalyzing(true);
    // Simulate API call
    setTimeout(() => {
      setIsAnalyzing(false);
      setShowResults(true);
    }, 2000);
  };

  const handleViewDetails = (analysis: DetectionResult) => {
    setSelectedAnalysis(analysis);
    // Convert DetectionResult to DetectionResponse format
    setShowResults(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Detection Components Demo</h1>
          <p className="text-muted-foreground">
            Interactive demonstration of disease detection components
          </p>
        </div>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Image Upload</TabsTrigger>
            <TabsTrigger value="results">Detection Results</TabsTrigger>
            <TabsTrigger value="history">Analysis History</TabsTrigger>
          </TabsList>

          {/* Image Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>ImageUploader Component</CardTitle>
                <CardDescription>
                  Drag-and-drop image uploader with validation and preview
                </CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle>Features</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </div>
                    <span>Drag-and-drop zone using react-dropzone</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </div>
                    <span>Image preview with remove functionality</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </div>
                    <span>File validation (size and type)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </div>
                    <span>Error messages for invalid files</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </div>
                    <span>File information display</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Detection Results Tab */}
          <TabsContent value="results" className="space-y-6">
            {showResults ? (
              <DetectionResults result={mockDetectionResult} />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground mb-4">
                    Upload an image to see detection results
                  </p>
                  <Button onClick={() => setShowResults(true)}>
                    Show Sample Results
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle>Features</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </div>
                    <span>Disease name with confidence badge</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </div>
                    <span>Color-coded severity indicator (mild, moderate, severe, critical)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </div>
                    <span>Key observations and symptoms list</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </div>
                    <span>Treatment recommendations with icons</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </div>
                    <span>Prevention tips in grid layout</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </div>
                    <span>Animated card entrance with framer-motion</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analysis History Tab */}
          <TabsContent value="history" className="space-y-6">
            <AnalysisHistory
              analyses={mockAnalysisHistory}
              onViewDetails={handleViewDetails}
              itemsPerPage={6}
            />

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle>Features</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </div>
                    <span>Grid layout with thumbnail cards</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </div>
                    <span>Image thumbnails with hover overlay</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </div>
                    <span>Confidence and severity badges</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </div>
                    <span>Date/time stamps with date-fns formatting</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </div>
                    <span>Pagination with page numbers and ellipsis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </div>
                    <span>Click to view details functionality</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Usage Example */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Example</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
              <code>{`import {
  ImageUploader,
  DetectionResults,
  AnalysisHistory,
} from "@/components/detection";

// Image Upload
<ImageUploader
  onImageSelect={(file) => setSelectedFile(file)}
  onUpload={handleUpload}
  maxSize={10}
/>

// Detection Results
<DetectionResults result={detectionResult} />

// Analysis History
<AnalysisHistory
  analyses={historyData}
  onViewDetails={(analysis) => console.log(analysis)}
  itemsPerPage={6}
/>`}</code>
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
