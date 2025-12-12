"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, FileText, Loader2 } from "lucide-react";
import { Job } from "@/lib/types";

interface JobCardProps {
  job: Job;
  onAnalyze: (job: Job) => void;
  isAnalyzing: boolean;
  isSelected: boolean;
}

export function JobCard({ job, onAnalyze, isAnalyzing, isSelected }: JobCardProps) {
  return (
    <Card
      className={`transition-all duration-200 ${
        isSelected
          ? "ring-2 ring-primary shadow-lg"
          : "hover:shadow-md hover:border-primary/30"
      }`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg leading-tight truncate">
              {job.title}
            </CardTitle>
            <CardDescription className="flex items-center gap-4 mt-1.5">
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                {job.company}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {job.location}
              </span>
            </CardDescription>
          </div>
          {isSelected && (
            <Badge variant="default" className="shrink-0">
              Selected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
          {job.description.length > 200
            ? `${job.description.slice(0, 200)}...`
            : job.description}
        </p>
        <div className="flex items-center justify-between">
          <Button
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={() => onAnalyze(job)}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                {isSelected ? "Re-analyze" : "Analyze Job"}
              </>
            )}
          </Button>
          {job.url && (
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              View original →
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

