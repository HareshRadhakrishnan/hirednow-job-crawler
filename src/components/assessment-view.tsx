"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardList,
  Zap,
  Target,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BarChart3,
  Lightbulb,
  FileSearch,
  Brain,
  Sparkles,
  Settings2,
  Check,
  XCircle,
} from "lucide-react";
import {
  AssessmentData,
  SIMULATION_LABELS,
  DIFFICULTY_COLORS,
  IMPORTANCE_COLORS,
  CATEGORY_COLORS,
} from "@/lib/types";

interface AssessmentViewProps {
  assessment: string | null;
  jobTitle: string | null;
  isLoading: boolean;
}

function parseAssessment(assessment: string): AssessmentData | null {
  try {
    // Try to extract JSON from the response
    const jsonMatch = assessment.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch {
    return null;
  }
}

// Animated loading component
function LoadingAnimation({ jobTitle }: { jobTitle: string | null }) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: FileSearch,
      title: "Reading Job Description",
      subtitle: "Parsing requirements and responsibilities",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: Brain,
      title: "Extracting Skills",
      subtitle: "Identifying technical and soft skills",
      color: "text-violet-500",
      bgColor: "bg-violet-500/10",
    },
    {
      icon: Settings2,
      title: "Mapping Simulations",
      subtitle: "Matching skills to assessment types",
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      icon: Sparkles,
      title: "Generating Recommendations",
      subtitle: "Creating optimal assessment strategy",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 3000);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="border-b bg-muted/30">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="relative">
            <ClipboardList className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </span>
          </div>
          Analyzing Job
          {jobTitle && (
            <Badge variant="secondary" className="ml-2 font-normal">
              {jobTitle}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        {/* Animated orb */}
        <div className="flex justify-center mb-10">
          <div className="relative w-28 h-28 flex items-center justify-center">
            {/* Outer ring - pulsing */}
            <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-pulse" />
            {/* Middle ring - rotating */}
            <div 
              className="absolute inset-2 rounded-full border-4 border-transparent border-t-primary/60 animate-spin"
              style={{ animationDuration: "2s" }} 
            />
            {/* Inner orb with brain */}
            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-primary/80 to-violet-600/80 flex items-center justify-center shadow-lg shadow-primary/30">
              <Brain className="h-8 w-8 text-white animate-pulse" />
            </div>
            {/* Floating particles */}
            <div className="absolute top-0 right-0 w-3 h-3 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0s" }} />
            <div className="absolute bottom-1 left-0 w-2 h-2 rounded-full bg-violet-500/60 animate-bounce" style={{ animationDelay: "0.2s" }} />
            <div className="absolute top-1/2 -right-2 w-2 h-2 rounded-full bg-emerald-500/60 animate-bounce" style={{ animationDelay: "0.4s" }} />
          </div>
        </div>

        {/* Progress steps */}
        <div className="space-y-4 max-w-md mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isComplete = index < currentStep;

            return (
              <div
                key={index}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-500 ${
                  isActive
                    ? `${step.bgColor} border-current ${step.color} shadow-md`
                    : isComplete
                    ? "bg-muted/50 border-muted"
                    : "bg-background border-muted/50 opacity-50"
                }`}
              >
                <div
                  className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isActive
                      ? `${step.bgColor} ${step.color}`
                      : isComplete
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isComplete ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Icon className={`h-5 w-5 ${isActive ? "animate-pulse" : ""}`} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-medium truncate ${
                      isActive
                        ? "text-foreground"
                        : isComplete
                        ? "text-muted-foreground"
                        : "text-muted-foreground/60"
                    }`}
                  >
                    {step.title}
                  </p>
                  <p
                    className={`text-sm truncate ${
                      isActive
                        ? "text-muted-foreground"
                        : "text-muted-foreground/60"
                    }`}
                  >
                    {step.subtitle}
                  </p>
                </div>
                {isActive && (
                  <div className="shrink-0 flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Tip */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            This usually takes 15-25 seconds depending on the job complexity
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function SkillsSection({ skills }: { skills: AssessmentData["skills"] }) {
  const groupedSkills = {
    technical: skills.filter((s) => s.category === "technical"),
    soft: skills.filter((s) => s.category === "soft"),
    domain: skills.filter((s) => s.category === "domain"),
  };

  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
        <Target className="h-4 w-4 text-primary" />
        Extracted Skills
      </h3>
      <div className="grid gap-3">
        {Object.entries(groupedSkills).map(
          ([category, categorySkills]) =>
            categorySkills.length > 0 && (
              <div
                key={category}
                className={`rounded-lg border-l-4 bg-card p-4 ${CATEGORY_COLORS[category]}`}
              >
                <h4 className="mb-2 text-sm font-medium capitalize text-muted-foreground">
                  {category} Skills
                </h4>
                <div className="flex flex-wrap gap-2">
                  {categorySkills.map((skill, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className={`${IMPORTANCE_COLORS[skill.importance]}`}
                    >
                      {skill.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )
        )}
      </div>
    </div>
  );
}

function SimulationsSection({
  simulations,
}: {
  simulations: AssessmentData["simulations"];
}) {
  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
        <Zap className="h-4 w-4 text-primary" />
        Recommended Simulations
      </h3>
      <div className="grid gap-4">
        {simulations.map((sim, idx) => {
          const simInfo = SIMULATION_LABELS[sim.type] || {
            name: sim.type,
            icon: "🔧",
            color: "bg-gray-100",
          };
          return (
            <div
              key={idx}
              className={`rounded-xl border p-5 ${simInfo.color} transition-all hover:shadow-md`}
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{simInfo.icon}</span>
                  <div>
                    <h4 className="font-semibold">{simInfo.name}</h4>
                    <Badge
                      variant="secondary"
                      className={`mt-1 text-xs ${DIFFICULTY_COLORS[sim.configuration.difficulty]}`}
                    >
                      {sim.configuration.difficulty}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {sim.configuration.duration}
                </div>
              </div>

              <p className="mb-4 text-sm text-muted-foreground">{sim.scenario}</p>

              <div className="mb-4">
                <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <BarChart3 className="h-3 w-3" />
                  Skills Assessed
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {sim.skillsAssessed.map((skill, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <div className="mb-2 text-xs font-medium text-muted-foreground">
                  Key Tasks
                </div>
                <ul className="space-y-1">
                  {sim.configuration.keyTasks.map((task, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-foreground/80"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                      {task}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  Success Criteria
                </div>
                <ul className="space-y-1">
                  {sim.successCriteria.map((criterion, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-foreground/80"
                    >
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500/70" />
                      {criterion}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NotRecommendedSection({
  notRecommended,
}: {
  notRecommended: AssessmentData["notRecommended"];
}) {
  if (!notRecommended || notRecommended.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
        <XCircle className="h-4 w-4 text-red-500" />
        Not Recommended for This Role
      </h3>
      <div className="grid gap-3">
        {notRecommended.map((item, idx) => {
          const simInfo = SIMULATION_LABELS[item.type] || {
            name: item.type,
            icon: "❌",
            color: "bg-gray-100",
          };
          return (
            <div
              key={idx}
              className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 flex items-start gap-3"
            >
              <span className="text-xl opacity-50">{simInfo.icon}</span>
              <div>
                <span className="font-medium text-foreground">{simInfo.name}</span>
                <p className="mt-0.5 text-sm text-muted-foreground">{item.reason}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LimitationsSection({
  limitations,
}: {
  limitations: AssessmentData["limitations"];
}) {
  if (!limitations || limitations.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        Limitations
      </h3>
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
        <ul className="space-y-3">
          {limitations.map((limit, idx) => (
            <li key={idx} className="text-sm">
              <span className="font-medium text-foreground">{limit.skill}</span>
              <p className="mt-0.5 text-muted-foreground">{limit.reason}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function RecommendationSection({ recommendation }: { recommendation: string }) {
  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
      <div className="mb-2 flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Overall Recommendation</h3>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {recommendation}
      </p>
    </div>
  );
}

function FallbackView({ assessment }: { assessment: string }) {
  // Fallback to simple text rendering if JSON parsing fails
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      {assessment.split("\n").map((line, index) => {
        if (line.startsWith("###")) {
          return (
            <h4 key={index} className="mt-4 mb-2 text-base font-semibold text-primary">
              {line.replace(/^###\s*/, "")}
            </h4>
          );
        }
        if (line.startsWith("##")) {
          return (
            <h3 key={index} className="mt-6 mb-3 text-lg font-semibold text-foreground">
              {line.replace(/^##\s*/, "")}
            </h3>
          );
        }
        if (line.startsWith("- ") || line.startsWith("* ")) {
          return (
            <li key={index} className="ml-4 text-muted-foreground">
              {line.replace(/^[-*]\s*/, "")}
            </li>
          );
        }
        if (!line.trim()) {
          return <div key={index} className="h-2" />;
        }
        return (
          <p key={index} className="mb-2 text-muted-foreground">
            {line}
          </p>
        );
      })}
    </div>
  );
}

export function AssessmentView({
  assessment,
  jobTitle,
  isLoading,
}: AssessmentViewProps) {
  if (isLoading) {
    return <LoadingAnimation jobTitle={jobTitle} />;
  }

  if (!assessment) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardList className="h-5 w-5" />
            Assessment Design
          </CardTitle>
        </CardHeader>
        <CardContent className="flex h-[400px] items-center justify-center">
          <div className="text-center text-muted-foreground">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <ClipboardList className="h-8 w-8 opacity-50" />
            </div>
            <p className="font-medium">No assessment yet</p>
            <p className="text-sm">
              Select a job and click &quot;Analyze Job&quot; to generate
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const parsedData = parseAssessment(assessment);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardList className="h-5 w-5" />
            Assessment Design
          </CardTitle>
          {jobTitle && (
            <Badge variant="secondary" className="font-normal">
              {jobTitle}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 pt-2">
        <ScrollArea className="h-[600px] pr-4">
          {parsedData ? (
            <div className="space-y-8">
              <RecommendationSection
                recommendation={parsedData.overallRecommendation}
              />
              <SkillsSection skills={parsedData.skills} />
              <SimulationsSection simulations={parsedData.simulations} />
              <NotRecommendedSection notRecommended={parsedData.notRecommended} />
              <LimitationsSection limitations={parsedData.limitations} />
            </div>
          ) : (
            <FallbackView assessment={assessment} />
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
