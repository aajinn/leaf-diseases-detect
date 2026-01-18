"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  Image as ImageIcon,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DetectionResult } from "@/types/detection";

interface AnalysisHistoryProps {
  analyses: DetectionResult[];
  onViewDetails?: (analysis: DetectionResult) => void;
  itemsPerPage?: number;
  className?: string;
}

const getConfidenceBadgeVariant = (confidence: number) => {
  if (confidence >= 90) return "default";
  if (confidence >= 70) return "secondary";
  return "outline";
};

const getSeverityColor = (severity?: string): string => {
  switch (severity?.toLowerCase()) {
    case "mild":
      return "text-green-600 bg-green-50";
    case "moderate":
      return "text-yellow-600 bg-yellow-50";
    case "severe":
      return "text-orange-600 bg-orange-50";
    case "critical":
      return "text-red-600 bg-red-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
};

export function AnalysisHistory({
  analyses,
  onViewDetails,
  itemsPerPage = 6,
  className,
}: AnalysisHistoryProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate pagination
  const totalPages = Math.ceil(analyses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAnalyses = analyses.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };

  if (analyses.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-muted p-4 mb-4">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Analysis History</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            Your analysis history will appear here once you start detecting
            diseases.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Analysis History
          </CardTitle>
          <CardDescription>
            {analyses.length} total {analyses.length === 1 ? "analysis" : "analyses"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {currentAnalyses.map((analysis) => (
              <Card
                key={analysis.id}
                className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => onViewDetails?.(analysis)}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-muted overflow-hidden">
                  {analysis.image_url ? (
                    <img
                      src={analysis.image_url}
                      alt={analysis.disease_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button variant="secondary" size="sm" className="gap-2">
                      <Eye className="h-4 w-4" />
                      View Details
                    </Button>
                  </div>
                </div>

                {/* Content */}
                <CardContent className="p-4 space-y-3">
                  {/* Disease Name */}
                  <div>
                    <h3 className="font-semibold text-sm line-clamp-1">
                      {analysis.disease_name}
                    </h3>
                  </div>

                  {/* Confidence & Severity */}
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={getConfidenceBadgeVariant(analysis.confidence)}
                      className="text-xs"
                    >
                      {analysis.confidence.toFixed(0)}%
                    </Badge>
                    {analysis.severity && (
                      <Badge
                        variant="outline"
                        className={cn("text-xs", getSeverityColor(analysis.severity))}
                      >
                        {analysis.severity}
                      </Badge>
                    )}
                  </div>

                  {/* Date/Time */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {format(new Date(analysis.created_at), "MMM dd, yyyy")}
                    </span>
                    <span>•</span>
                    <span>
                      {format(new Date(analysis.created_at), "HH:mm")}
                    </span>
                  </div>

                  {/* Processing Time */}
                  {analysis.processing_time && (
                    <div className="text-xs text-muted-foreground">
                      Processed in {analysis.processing_time.toFixed(2)}s
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1}-{Math.min(endIndex, analyses.length)} of{" "}
                {analyses.length}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => {
                      // Show first page, last page, current page, and pages around current
                      const showPage =
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1);

                      if (!showPage) {
                        // Show ellipsis
                        if (
                          page === currentPage - 2 ||
                          page === currentPage + 2
                        ) {
                          return (
                            <span
                              key={page}
                              className="px-2 text-muted-foreground"
                            >
                              ...
                            </span>
                          );
                        }
                        return null;
                      }

                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageClick(page)}
                          className="w-8 h-8 p-0"
                        >
                          {page}
                        </Button>
                      );
                    }
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
