"use client";

import { useState } from "react";
import { CrawlerForm } from "@/components/crawler-form";
import { JobCard } from "@/components/job-card";
import { AssessmentView } from "@/components/assessment-view";
import { ChatPanel } from "@/components/chat-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Sparkles, AlertCircle } from "lucide-react";
import { Job, JobBoard, JOB_BOARD_INFO } from "@/lib/types";

interface ManualJobData {
  title: string;
  company: string;
  location: string;
  description: string;
}

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [assessment, setAssessment] = useState<string | null>(null);
  const [isCrawling, setIsCrawling] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [crawlError, setCrawlError] = useState<string | null>(null);
  const [crawlWarning, setCrawlWarning] = useState<string | null>(null);
  const [currentBoard, setCurrentBoard] = useState<JobBoard>("awign");

  const handleCrawl = async (jobRole: string, jobBoard: JobBoard, location?: string) => {
    setIsCrawling(true);
    setCrawlError(null);
    setCrawlWarning(null);
    setJobs([]);
    setSelectedJob(null);
    setAssessment(null);
    setCurrentBoard(jobBoard);

    try {
      const response = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobRole, jobBoard, location }),
      });

      const data = await response.json();

      if (!response.ok) {
        setCrawlError(data.error || "Failed to crawl jobs");
        return;
      }

      setJobs(data.jobs || []);
      if (data.warning) {
        setCrawlWarning(data.warning);
      }
    } catch (error) {
      console.error("Crawl error:", error);
      setCrawlError("Network error. Please try again.");
    } finally {
      setIsCrawling(false);
    }
  };

  const handleFetchSingleJob = async (jobUrl: string): Promise<{ success: boolean; error?: string; blocked?: boolean; job?: Job }> => {
    setCrawlError(null);
    setCrawlWarning(null);

    try {
      const response = await fetch("/api/fetch-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobUrl }),
      });

      const data = await response.json();

      if (data.success && data.job) {
        // Add the job to the list
        setJobs((prev) => [data.job, ...prev]);
        setCurrentBoard("manual");
        return { success: true, job: data.job };
      }

      return {
        success: false,
        error: data.error || "Failed to fetch job",
        blocked: data.blocked,
      };
    } catch (error) {
      console.error("Fetch single job error:", error);
      return {
        success: false,
        error: "Network error. Please try again or paste manually.",
        blocked: true,
      };
    }
  };

  const handleManualSubmit = (data: ManualJobData, jobUrl: string) => {
    const newJob: Job = {
      id: `manual-${Date.now()}`,
      title: data.title,
      company: data.company,
      location: data.location,
      description: data.description,
      url: jobUrl,
      source: "manual",
    };

    setJobs((prev) => [newJob, ...prev]);
    setCurrentBoard("manual");
    setCrawlError(null);
    setCrawlWarning(null);
  };

  const handleAnalyze = async (job: Job) => {
    setSelectedJob(job);
    setIsAnalyzing(true);
    setAssessment(null);

    try {
      const response = await fetch("/api/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription: job.description,
          jobTitle: job.title,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAssessment(`Error: ${data.error || "Failed to generate assessment"}`);
        return;
      }

      setAssessment(data.assessment);
    } catch (error) {
      console.error("Assessment error:", error);
      setAssessment("Error: Network error. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Determine which source to show in the badge
  const getDisplayBoard = (): JobBoard => {
    if (jobs.length === 0) return currentBoard;
    const firstJobSource = jobs[0]?.source;
    if (firstJobSource) return firstJobSource;
    return currentBoard;
  };

  const displayBoard = getDisplayBoard();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                HiredNow Assessment Designer
              </h1>
              <p className="text-sm text-muted-foreground">
                AI-powered job analysis and simulation recommendations
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Crawler Form */}
        <Card className="mb-8 shadow-lg border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Find Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <CrawlerForm 
              onCrawl={handleCrawl} 
              onFetchSingleJob={handleFetchSingleJob}
              onManualSubmit={handleManualSubmit}
              isLoading={isCrawling} 
            />
          </CardContent>
        </Card>

        {/* Error/Warning Messages */}
        {crawlError && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">{crawlError}</p>
          </div>
        )}

        {crawlWarning && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <p className="text-sm text-amber-700 dark:text-amber-400">
              {crawlWarning}
            </p>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Job Listings - Left Column */}
          <div className="lg:col-span-4">
            <Card className="shadow-lg border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Briefcase className="h-5 w-5" />
                    Job Listings
                  </CardTitle>
                  {jobs.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={JOB_BOARD_INFO[displayBoard].color}>
                        {JOB_BOARD_INFO[displayBoard].icon} {JOB_BOARD_INFO[displayBoard].name}
                      </Badge>
                      <Badge variant="secondary">{jobs.length}</Badge>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {jobs.length === 0 && !isCrawling ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>No jobs yet.</p>
                    <p className="text-sm">Search for jobs or paste a job URL above.</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[600px] pr-2">
                    <div className="space-y-4">
                      {jobs.map((job) => (
                        <JobCard
                          key={job.id}
                          job={job}
                          onAnalyze={handleAnalyze}
                          isAnalyzing={isAnalyzing && selectedJob?.id === job.id}
                          isSelected={selectedJob?.id === job.id}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Assessment & Chat - Right Columns */}
          <div className="lg:col-span-8 space-y-6">
            {/* Assessment View */}
            <div className="shadow-lg border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl">
              <AssessmentView
                assessment={assessment}
                jobTitle={selectedJob?.title || null}
                isLoading={isAnalyzing}
              />
            </div>

            {/* Chat Panel */}
            <div className="shadow-lg border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl">
              <ChatPanel
                jobContext={
                  selectedJob && assessment
                    ? {
                        title: selectedJob.title,
                        description: selectedJob.description,
                        assessment: assessment,
                      }
                    : null
                }
                isEnabled={!!assessment}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            HiredNow Assessment Designer •{" "}
            <span className="text-xs">Supports Awign, Indeed & Manual URL</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
