export type JobBoard = "awign" | "indeed" | "manual";

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  source?: JobBoard;
}

export const JOB_BOARD_INFO: Record<JobBoard, { name: string; icon: string; color: string }> = {
  awign: { name: "Awign", icon: "🇮🇳", color: "bg-orange-500/10 text-orange-600" },
  indeed: { name: "Indeed", icon: "💼", color: "bg-blue-500/10 text-blue-600" },
  manual: { name: "Manual", icon: "📋", color: "bg-emerald-500/10 text-emerald-600" },
};

export interface Skill {
  name: string;
  category: "technical" | "soft" | "domain";
  importance: "critical" | "important" | "nice-to-have";
}

export interface SimulationConfig {
  duration: string;
  difficulty: "entry" | "intermediate" | "advanced";
  keyTasks: string[];
}

export interface Simulation {
  type: "chat" | "email_chat" | "speech_eval" | "gen_code";
  skillsAssessed: string[];
  scenario: string;
  configuration: SimulationConfig;
  successCriteria: string[];
}

export interface Limitation {
  skill: string;
  reason: string;
}

export interface NotRecommended {
  type: "chat" | "email_chat" | "speech_eval" | "gen_code";
  reason: string;
}

export interface AssessmentData {
  skills: Skill[];
  simulations: Simulation[];
  notRecommended?: NotRecommended[];
  limitations: Limitation[];
  overallRecommendation: string;
}

export const SIMULATION_LABELS: Record<string, { name: string; icon: string; color: string }> = {
  chat: { name: "Chat Simulation", icon: "💬", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  email_chat: { name: "Email Chat", icon: "✉️", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  speech_eval: { name: "Speech Evaluation", icon: "🎤", color: "bg-green-500/10 text-green-600 border-green-500/20" },
  gen_code: { name: "Code Generation", icon: "💻", color: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
};

export const DIFFICULTY_COLORS: Record<string, string> = {
  entry: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  intermediate: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  advanced: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export const IMPORTANCE_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  important: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "nice-to-have": "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

export const CATEGORY_COLORS: Record<string, string> = {
  technical: "border-l-violet-500",
  soft: "border-l-emerald-500",
  domain: "border-l-orange-500",
};

