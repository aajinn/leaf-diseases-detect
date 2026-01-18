"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Image as ImageIcon, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  onUpload?: () => void;
  maxSize?: number; // in MB
  acceptedFormats?: string[];
  disabled?: boolean;
  className?: string;
}

const DEFAULT_MAX_SIZE = 10; // 10MB
const DEFAULT_FORMATS = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export function ImageUploader({
  onImageSelect,
  onUpload,
  maxSize = DEFAULT_MAX_SIZE,
  acceptedFormats = DEFAULT_FORMATS,
  disabled = false,
  className,
}: ImageUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setError(null);

      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors[0]?.code === "file-too-large") {
          setError(`File is too large. Maximum size is ${maxSize}MB`);
        } else if (rejection.errors[0]?.code === "file-invalid-type") {
          setError("Invalid file type. Please upload an image file");
        } else {
          setError("File upload failed. Please try again");
        }
        return;
      }

      // Handle accepted file
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setSelectedFile(file);
        onImageSelect(file);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    },
    [maxSize, onImageSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFormats.reduce((acc, format) => {
      acc[format] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxSize: maxSize * 1024 * 1024, // Convert MB to bytes
    multiple: false,
    disabled,
  });

  const handleClear = () => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
  };

  const handleUpload = () => {
    if (selectedFile && onUpload) {
      onUpload();
    }
  };

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Dropzone */}
      {!preview && (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50",
            disabled && "opacity-50 cursor-not-allowed",
            error && "border-destructive"
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-primary/10 p-4">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-lg font-medium">
                {isDragActive
                  ? "Drop the image here"
                  : "Drag & drop an image here"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                or click to browse
              </p>
            </div>
            <div className="text-xs text-muted-foreground">
              <p>Supported formats: JPG, PNG, WEBP</p>
              <p>Maximum size: {maxSize}MB</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Image Preview */}
      {preview && (
        <div className="space-y-4">
          <div className="relative rounded-lg border overflow-hidden bg-muted">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-auto max-h-96 object-contain"
            />
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={handleClear}
              disabled={disabled}
            >
              <X className="h-4 w-4 mr-1" />
              Remove
            </Button>
          </div>

          {/* File Info */}
          {selectedFile && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          )}

          {/* Upload Button */}
          {onUpload && (
            <Button
              onClick={handleUpload}
              disabled={disabled}
              className="w-full"
              size="lg"
            >
              <Upload className="h-4 w-4 mr-2" />
              Analyze Image
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
