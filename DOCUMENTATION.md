# HiredNow Job Board Crawler - Technical Documentation

> This document provides comprehensive details about the HiredNow Job Board Crawler application for future reference and LLM context.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Core Features](#core-features)
5. [API Routes](#api-routes)
6. [Components](#components)
7. [Data Types](#data-types)
8. [Prompts & AI Integration](#prompts--ai-integration)
9. [Web Crawling Logic](#web-crawling-logic)
10. [Environment Configuration](#environment-configuration)
11. [Known Limitations](#known-limitations)
12. [Future Improvements](#future-improvements)

---

## Project Overview

**HiredNow Job Board Crawler** is a Next.js web application that:

1. Crawls job listings from the Awign job board (V1 limitation)
2. Extracts job descriptions using Puppeteer
3. Analyzes job requirements using Claude AI (Anthropic)
4. Recommends appropriate hiring simulation assessments
5. Provides an interactive chat interface for follow-up questions

### Primary Use Case

HR/Hiring managers can input a job role, browse crawled job listings, and receive AI-generated recommendations for which simulation types to use when assessing candidates for that role.

---

## Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.0.8 | React framework with App Router |
| React | 19.2.1 | UI library |
| TypeScript | ^5 | Type safety |
| Tailwind CSS | ^4 | Styling |
| shadcn/ui | latest | UI component library |
| Puppeteer | latest | Web scraping (headless browser) |
| @anthropic-ai/sdk | latest | Claude AI integration |
| Lucide React | ^0.556.0 | Icons |

---

## Project Structure

```
job-crawler/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── crawl/
│   │   │   │   └── route.ts          # POST /api/crawl - Job scraping endpoint
│   │   │   ├── assessment/
│   │   │   │   └── route.ts          # POST /api/assessment - AI analysis endpoint
│   │   │   └── chat/
│   │   │       └── route.ts          # POST /api/chat - Streaming chat endpoint
│   │   ├── page.tsx                  # Main application page
│   │   ├── layout.tsx                # Root layout with fonts
│   │   └── globals.css               # Global styles & CSS variables
│   ├── components/
│   │   ├── ui/                       # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   └── badge.tsx
│   │   ├── crawler-form.tsx          # URL + job role input form
│   │   ├── job-card.tsx              # Individual job listing card
│   │   ├── assessment-view.tsx       # Structured assessment display
│   │   └── chat-panel.tsx            # Interactive chat interface
│   └── lib/
│       ├── crawler.ts                # Puppeteer scraping logic
│       ├── prompts.ts                # AI system prompts
│       ├── types.ts                  # TypeScript type definitions
│       └── utils.ts                  # Utility functions (cn helper)
├── .env.local                        # Environment variables (API keys)
├── package.json
├── tsconfig.json
└── README.md
```

---

## Core Features

### 1. Job Board Crawling

- **Input**: Job role/title (e.g., "engineer", "manager")
- **Target**: Awign job board (`https://www.awignexpert.com/jobs/explore`)
- **Output**: Up to 10 job listings with title, company, location, description, and URL

### 2. AI Assessment Generation

- **Input**: Job description text
- **Processing**: Claude AI analyzes the job requirements
- **Output**: Structured JSON with:
  - Extracted skills (categorized as technical/soft/domain)
  - Recommended simulations with configurations
  - Limitations (skills that cannot be assessed)
  - Overall recommendation summary

### 3. Interactive Chat

- **Purpose**: Follow-up questions about the assessment
- **Features**: Streaming responses, conversation context preservation
- **Context**: Includes job title, description, and previous assessment

---

## API Routes

### POST /api/crawl

**Purpose**: Scrape job listings from Awign job board

**Request Body**:
```json
{
  "jobRole": "engineer"
}
```

**Response**:
```json
{
  "jobs": [
    {
      "id": "job-0-1234567890",
      "title": "Software Engineer",
      "company": "Awign",
      "location": "Bangalore, India",
      "description": "Full job description text...",
      "url": "https://www.awignexpert.com/jobs/..."
    }
  ],
  "warning": "Optional warning message"
}
```

**Implementation**: Uses `crawlAwignJobsSimple()` function from `lib/crawler.ts`

---

### POST /api/assessment

**Purpose**: Generate AI-powered assessment recommendations

**Request Body**:
```json
{
  "jobDescription": "Full job description text...",
  "jobTitle": "Software Engineer"
}
```

**Response**:
```json
{
  "assessment": "{\"skills\":[...],\"simulations\":[...],\"limitations\":[...],\"overallRecommendation\":\"...\"}",
  "usage": {
    "input_tokens": 1234,
    "output_tokens": 567
  }
}
```

**Implementation**: 
- Uses Anthropic SDK with `claude-sonnet-4-20250514` model
- System prompt from `lib/prompts.ts` (`ASSESSMENT_SYSTEM_PROMPT`)
- Max tokens: 4096

---

### POST /api/chat

**Purpose**: Continue conversation about the assessment

**Request Body**:
```json
{
  "messages": [
    { "role": "user", "content": "How would you configure the chat simulation?" }
  ],
  "jobContext": {
    "title": "Software Engineer",
    "description": "Job description...",
    "assessment": "Previous assessment JSON..."
  }
}
```

**Response**: Server-Sent Events (SSE) stream

```
data: {"text": "To configure"}
data: {"text": " the chat simulation..."}
data: [DONE]
```

**Implementation**:
- Streaming response using ReadableStream
- Uses `CHAT_SYSTEM_PROMPT` with job context injected
- Max tokens: 2048

---

## Components

### CrawlerForm (`components/crawler-form.tsx`)

**Props**:
- `onCrawl: (jobRole: string) => void` - Callback when form is submitted
- `isLoading: boolean` - Shows loading state

**Features**:
- Pre-filled disabled URL field (Awign only for V1)
- Job role input with validation
- Loading spinner during crawl

---

### JobCard (`components/job-card.tsx`)

**Props**:
- `job: Job` - Job data object
- `onAnalyze: (job: Job) => void` - Callback to analyze job
- `isAnalyzing: boolean` - Loading state for this specific job
- `isSelected: boolean` - Highlight if currently selected

**Features**:
- Displays title, company, location
- Truncated description preview (200 chars)
- "Analyze Job" button
- Link to original job posting

---

### AssessmentView (`components/assessment-view.tsx`)

**Props**:
- `assessment: string | null` - Raw assessment JSON string
- `jobTitle: string | null` - Currently selected job title
- `isLoading: boolean` - Loading state

**Features**:
- Parses JSON assessment data
- Displays structured sections:
  - Overall Recommendation (highlighted card)
  - Skills grouped by category with importance badges
  - Simulation cards with full configuration details
  - Limitations warning section
- Fallback to raw text if JSON parsing fails

---

### ChatPanel (`components/chat-panel.tsx`)

**Props**:
- `jobContext: { title, description, assessment } | null` - Context for AI
- `isEnabled: boolean` - Enable/disable chat

**Features**:
- Message history display
- Streaming response handling
- Enter to send, Shift+Enter for newline
- Disabled state when no assessment generated

---

## Data Types

Defined in `lib/types.ts`:

```typescript
// Job listing from crawler
interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
}

// Extracted skill from job description
interface Skill {
  name: string;
  category: "technical" | "soft" | "domain";
  importance: "critical" | "important" | "nice-to-have";
}

// Simulation configuration
interface SimulationConfig {
  duration: string;
  difficulty: "entry" | "intermediate" | "advanced";
  keyTasks: string[];
}

// Recommended simulation
interface Simulation {
  type: "chat" | "triage" | "email_chat" | "speech_eval" | "gen_code";
  skillsAssessed: string[];
  scenario: string;
  configuration: SimulationConfig;
  successCriteria: string[];
}

// Skill that cannot be assessed
interface Limitation {
  skill: string;
  reason: string;
}

// Complete assessment response
interface AssessmentData {
  skills: Skill[];
  simulations: Simulation[];
  limitations: Limitation[];
  overallRecommendation: string;
}
```

---

## Prompts & AI Integration

### Assessment System Prompt (`ASSESSMENT_SYSTEM_PROMPT`)

**Purpose**: Instruct Claude to analyze job descriptions and recommend simulations

**Available Simulation Types**:

| Type | Description |
|------|-------------|
| `chat` | Real-time text-based conversational simulation |
| `triage` | Email classification/prioritization simulation |
| `email_chat` | Threaded email conversation simulation |
| `speech_eval` | Voice-based communication evaluation |
| `gen_code` | Technical code/application building simulation |

**Output Format**: Structured JSON with skills, simulations, limitations, and recommendation

### Chat System Prompt (`CHAT_SYSTEM_PROMPT`)

**Purpose**: Help users understand and customize assessment recommendations

**Context Injection**: Job title, description, and previous assessment are injected into the system prompt

---

## Web Crawling Logic

Located in `lib/crawler.ts`

### Function: `crawlAwignJobsSimple(jobRole: string)`

**Process**:
1. Launch headless Puppeteer browser
2. Set realistic user agent to avoid blocking
3. Navigate to Awign jobs page with jobTitle query parameter
4. Wait 5 seconds for JavaScript to render
5. Extract page text content
6. Parse text to identify job-like content:
   - Look for lines containing job-related keywords
   - Extract location patterns (cities, "Remote", etc.)
   - Build job objects with available information
7. Return up to 10 jobs

**Error Handling**:
- Browser launch failures
- Navigation timeouts (30s limit)
- Page content extraction errors
- Returns error message in response if crawling fails

**Rate Limiting**:
- Delays between requests to avoid IP blocking
- User agent spoofing

---

## Environment Configuration

### Required Environment Variables

Create `.env.local` in the `job-crawler` directory:

```
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
```

### Important Notes

- File must be **ASCII or UTF-8 encoded** (not UTF-16)
- PowerShell `echo` creates UTF-16 files which Next.js cannot read
- Use this command to create properly encoded file:
  ```powershell
  "ANTHROPIC_API_KEY=your-key" | Out-File -FilePath .env.local -Encoding ascii -NoNewline
  ```

---

## Known Limitations

### V1 Constraints

1. **Single Job Board**: Only supports Awign (`awignexpert.com`)
2. **No Persistence**: Session-only storage (no database)
3. **Max 10 Jobs**: Limited to 10 results per search
4. **Scraping Fragility**: Depends on Awign's page structure
5. **No Authentication**: No user accounts or saved searches

### Technical Limitations

1. **Puppeteer on Serverless**: May have cold start issues
2. **Rate Limiting**: No sophisticated rate limiting implemented
3. **No Caching**: Each crawl hits the live site
4. **Single Concurrent Crawl**: No queue system for multiple users

---

## Future Improvements

### Short-term

- [ ] Add more job board support (LinkedIn, Indeed, Naukri)
- [ ] Implement job result caching
- [ ] Add export functionality (PDF/JSON)
- [ ] Improve error messages and retry logic

### Medium-term

- [ ] Database persistence (PostgreSQL/SQLite)
- [ ] User authentication and saved searches
- [ ] Job comparison feature
- [ ] Custom simulation type definitions

### Long-term

- [ ] Multi-language support
- [ ] API rate limiting and queuing
- [ ] Webhook integrations
- [ ] Admin dashboard for analytics

---

## Running the Application

### Development

```bash
cd job-crawler
npm install
npm run dev
```

Access at: `http://localhost:3000`

### Production Build

```bash
npm run build
npm run start
```

---

## Debugging Tips

1. **API Key Issues**: Check terminal logs for "Anthropic API Key: undefined"
2. **Crawling Failures**: Check for JavaScript errors in browser console
3. **Assessment Parsing**: If structured view fails, check raw JSON in console
4. **Chat Not Working**: Ensure assessment was generated first

---

*Document last updated: December 2024*
*Project Version: 1.0.0*

