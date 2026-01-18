"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Leaf,
  Pill,
  Shield,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DetectionResponse, DiseaseSeverity } from "@/types/detection";

interface DetectionResultsProps {
  result: DetectionResponse;
  className?: string;
}

const severityConfig: Record<
  DiseaseSeverity,
  {
    label: string;
    color: string;
    bgColor: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  mild: {
    label: "Mild",
    color: "text-green-600",
    bgColor: "bg-green-50 border-green-200",
    icon: CheckCircle2,
  },
  moderate: {
    label: "Moderate",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 border-yellow-200",
    icon: Info,
  },
  severe: {
    label: "Severe",
    color: "text-orange-600",
    bgColor: "bg-orange-50 border-orange-200",
    icon: AlertTriangle,
  },
  critical: {
    label: "Critical",
    color: "text-red-600",
    bgColor: "bg-red-50 border-red-200",
    icon: AlertTriangle,
  },
};

const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 90) return "text-green-600 bg-green-50";
  if (confidence >= 70) return "text-yellow-600 bg-yellow-50";
  return "text-orange-600 bg-orange-50";
};

export function DetectionResults({
  result,
  className,
}: DetectionResultsProps) {
  const severity = (result.severity?.toLowerCase() ||
    "moderate") as DiseaseSeverity;
  const severityInfo = severityConfig[severity];
  const SeverityIcon = severityInfo.icon;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("space-y-4", className)}
    >
      {/* Disease Name & Confidence */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Leaf className="h-6 w-6 text-primary" />
                  {result.disease_name}
                </CardTitle>
                <CardDescription className="mt-2">
                  Detected on {new Date(result.timestamp).toLocaleString()}
                </CardDescription>
              </div>
              <Badge
                variant="secondary"
                className={cn(
                  "text-sm font-semibold px-3 py-1",
                  getConfidenceColor(result.confidence)
                )}
              >
                {result.confidence.toFixed(1)}% Confidence
              </Badge>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Severity Indicator */}
      <motion.div variants={itemVariants}>
        <Card className={cn("border-2", severityInfo.bgColor)}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={cn("rounded-full p-3", severityInfo.bgColor)}>
                <SeverityIcon className={cn("h-6 w-6", severityInfo.color)} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">
                  Severity: {severityInfo.label}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Affected area: {result.affected_area_percentage.toFixed(1)}%
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{severity.toUpperCase()}</div>
                <p className="text-xs text-muted-foreground">Status</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Symptoms */}
        {result.recommendations && result.recommendations.length > 0 && (
          <motion.div variants={itemVariants}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Key Observations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.recommendations.slice(0, 5).map((symptom, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      </div>
                      <span className="text-sm">{symptom}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Treatment Recommendations */}
        {result.treatment_options && result.treatment_options.length > 0 && (
          <motion.div variants={itemVariants}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5 text-primary" />
                  Treatment Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {result.treatment_options.map((treatment, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      <div className="rounded-full bg-primary/10 p-1.5 mt-0.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="text-sm flex-1">{treatment}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Prevention Tips */}
      {result.prevention_tips && result.prevention_tips.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Prevention Tips
              </CardTitle>
              <CardDescription>
                Follow these guidelines to prevent future occurrences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {result.prevention_tips.map((tip, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                  >
                    <div className="rounded-full bg-green-100 p-1.5 mt-0.5">
                      <Shield className="h-3.5 w-3.5 text-green-600" />
                    </div>
                    <span className="text-sm flex-1">{tip}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Processing Info */}
      <motion.div variants={itemVariants}>
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Processing Time:</span>
              <span className="font-medium">
                {result.processing_time.toFixed(2)}s
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
