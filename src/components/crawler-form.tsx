"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Search, Link2, FileText, AlertCircle } from "lucide-react";
import { JobBoard, JOB_BOARD_INFO, Job } from "@/lib/types";

type InputMode = "search" | "url";

interface ManualJobData {
  title: string;
  company: string;
  location: string;
  description: string;
}

interface CrawlerFormProps {
  onCrawl: (jobRole: string, jobBoard: JobBoard, location?: string) => void;
  onFetchSingleJob: (jobUrl: string) => Promise<{ success: boolean; error?: string; blocked?: boolean; job?: Job }>;
  onManualSubmit: (data: ManualJobData, jobUrl: string) => void;
  isLoading: boolean;
}

export function CrawlerForm({ onCrawl, onFetchSingleJob, onManualSubmit, isLoading }: CrawlerFormProps) {
  const [mode, setMode] = useState<InputMode>("search");
  const [jobRole, setJobRole] = useState("");
  const [jobBoard, setJobBoard] = useState<JobBoard>("awign");
  const [location, setLocation] = useState("");
  
  // URL mode states
  const [jobUrl, setJobUrl] = useState("");
  const [showManualPaste, setShowManualPaste] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualCompany, setManualCompany] = useState("");
  const [manualLocation, setManualLocation] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (jobRole.trim()) {
      onCrawl(jobRole.trim(), jobBoard, location.trim() || undefined);
    }
  };

  const handleUrlFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobUrl.trim()) return;

    setIsFetching(true);
    setFetchError(null);
    setShowManualPaste(false);

    try {
      const result = await onFetchSingleJob(jobUrl.trim());
      
      if (!result.success) {
        setFetchError(result.error || "Failed to fetch job");
        if (result.blocked) {
          setShowManualPaste(true);
        }
      }
      // If success, the parent component handles adding the job
    } catch (error) {
      setFetchError("Failed to fetch job. Please paste manually.");
      setShowManualPaste(true);
    } finally {
      setIsFetching(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualDescription.trim() || manualDescription.length < 20) {
      setFetchError("Please enter a job description (at least 20 characters)");
      return;
    }

    onManualSubmit(
      {
        title: manualTitle.trim() || "Job Position",
        company: manualCompany.trim() || "Company",
        location: manualLocation.trim() || "Not specified",
        description: manualDescription.trim(),
      },
      jobUrl.trim()
    );

    // Reset form
    setManualTitle("");
    setManualCompany("");
    setManualLocation("");
    setManualDescription("");
    setShowManualPaste(false);
    setFetchError(null);
  };

  const jobBoards: JobBoard[] = ["awign", "indeed"];

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex gap-2 p-1 bg-muted rounded-lg">
        <button
          type="button"
          onClick={() => {
            setMode("search");
            setShowManualPaste(false);
            setFetchError(null);
          }}
          disabled={isLoading || isFetching}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
            mode === "search"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Search className="h-4 w-4" />
          Search Jobs
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("url");
            setFetchError(null);
          }}
          disabled={isLoading || isFetching}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
            mode === "url"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Link2 className="h-4 w-4" />
          Single Job URL
        </button>
      </div>

      {/* Search Mode */}
      {mode === "search" && (
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          {/* Job Board Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80">
              Job Board
            </label>
            <div className="flex gap-2">
              {jobBoards.map((board) => {
                const info = JOB_BOARD_INFO[board];
                const isSelected = jobBoard === board;
                return (
                  <button
                    key={board}
                    type="button"
                    onClick={() => setJobBoard(board)}
                    disabled={isLoading}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-muted hover:border-muted-foreground/30 text-muted-foreground"
                    } ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <span className="text-xl">{info.icon}</span>
                    <span className="font-medium">{info.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Job Role Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80">
              Job Role / Title
            </label>
            <Input
              type="text"
              placeholder="e.g., software engineer, product manager..."
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Location Input (only for Indeed) */}
          {jobBoard === "indeed" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">
                Location <span className="text-muted-foreground">(optional)</span>
              </label>
              <Input
                type="text"
                placeholder="e.g., New York, Remote, San Francisco..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={isLoading}
              />
            </div>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            disabled={isLoading || !jobRole.trim()}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching {JOB_BOARD_INFO[jobBoard].name}...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Search {JOB_BOARD_INFO[jobBoard].name} Jobs
              </>
            )}
          </Button>
        </form>
      )}

      {/* URL Mode */}
      {mode === "url" && (
        <div className="space-y-4">
          {/* URL Input Form */}
          <form onSubmit={handleUrlFetch} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">
                Job Listing URL
              </label>
              <Input
                type="url"
                placeholder="https://www.indeed.com/viewjob?jk=..."
                value={jobUrl}
                onChange={(e) => {
                  setJobUrl(e.target.value);
                  setFetchError(null);
                  setShowManualPaste(false);
                }}
                disabled={isFetching}
              />
              <p className="text-xs text-muted-foreground">
                Paste the full URL of a job listing from any job board
              </p>
            </div>

            <Button 
              type="submit" 
              disabled={isFetching || !jobUrl.trim()}
              className="w-full"
              size="lg"
            >
              {isFetching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fetching Job...
                </>
              ) : (
                <>
                  <Link2 className="mr-2 h-4 w-4" />
                  Fetch Job Description
                </>
              )}
            </Button>
          </form>

          {/* Error Message */}
          {fetchError && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-amber-700 dark:text-amber-400">{fetchError}</p>
                {showManualPaste && (
                  <p className="text-xs text-muted-foreground mt-1">
                    You can paste the job description manually below.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Manual Paste Section */}
          {showManualPaste && (
            <form onSubmit={handleManualSubmit} className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <FileText className="h-4 w-4" />
                Paste Job Details Manually
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Job Title
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., Software Engineer"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Company
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., Google"
                    value={manualCompany}
                    onChange={(e) => setManualCompany(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Location
                </label>
                <Input
                  type="text"
                  placeholder="e.g., San Francisco, CA"
                  value={manualLocation}
                  onChange={(e) => setManualLocation(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Job Description <span className="text-destructive">*</span>
                </label>
                <Textarea
                  placeholder="Paste the full job description here..."
                  value={manualDescription}
                  onChange={(e) => setManualDescription(e.target.value)}
                  className="min-h-[150px]"
                />
              </div>

              <Button 
                type="submit" 
                disabled={!manualDescription.trim() || manualDescription.length < 20}
                className="w-full"
                variant="secondary"
              >
                <FileText className="mr-2 h-4 w-4" />
                Add Job Manually
              </Button>
            </form>
          )}

          {/* Always show manual paste option */}
          {!showManualPaste && (
            <button
              type="button"
              onClick={() => setShowManualPaste(true)}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Or paste job description manually →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
