import puppeteer, { Browser, Page } from "puppeteer";
import { Job, JobBoard } from "./types";

export interface CrawlResult {
  jobs: Job[];
  error?: string;
}

export const JOB_BOARDS: Record<"awign" | "indeed", { name: string; url: string }> = {
  awign: {
    name: "Awign Expert",
    url: "https://www.awignexpert.com/jobs/explore",
  },
  indeed: {
    name: "Indeed",
    url: "https://www.indeed.com/jobs",
  },
};

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function crawlAwignJobs(jobRole: string): Promise<CrawlResult> {
  let browser: Browser | null = null;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page: Page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // Navigate to Awign jobs page with the job title filter
    const url = `https://www.awignexpert.com/jobs/explore?page=1&jobTitle=${encodeURIComponent(jobRole)}`;
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

    // Wait for job cards to load
    await delay(3000);

    // Extract job listings from the page
    const jobListings = await page.evaluate(() => {
      const jobs: Array<{
        id: string;
        title: string;
        company: string;
        location: string;
        url: string;
      }> = [];

      // Try to find job cards - Awign typically renders them dynamically
      // Look for common job card patterns
      const jobCards = document.querySelectorAll(
        '[class*="job"], [class*="card"], [class*="listing"]'
      );

      jobCards.forEach((card, index) => {
        if (jobs.length >= 10) return;

        const titleEl = card.querySelector(
          'h2, h3, h4, [class*="title"], [class*="name"]'
        );
        const linkEl = card.querySelector("a[href*='job']");
        const locationEl = card.querySelector(
          '[class*="location"], [class*="place"]'
        );

        const title = titleEl?.textContent?.trim();
        const url = linkEl?.getAttribute("href");

        if (title && title.length > 3) {
          jobs.push({
            id: `job-${index}-${Date.now()}`,
            title: title,
            company: "Awign",
            location: locationEl?.textContent?.trim() || "Remote/India",
            url: url
              ? url.startsWith("http")
                ? url
                : `https://www.awignexpert.com${url}`
              : "",
          });
        }
      });

      // If no jobs found with the above selectors, try a more generic approach
      if (jobs.length === 0) {
        const allLinks = document.querySelectorAll("a");
        allLinks.forEach((link, index) => {
          if (jobs.length >= 10) return;
          const href = link.getAttribute("href") || "";
          const text = link.textContent?.trim() || "";

          if (
            (href.includes("job") || href.includes("explore")) &&
            text.length > 10 &&
            text.length < 200
          ) {
            jobs.push({
              id: `job-${index}-${Date.now()}`,
              title: text,
              company: "Awign",
              location: "Remote/India",
              url: href.startsWith("http")
                ? href
                : `https://www.awignexpert.com${href}`,
            });
          }
        });
      }

      return jobs;
    });

    // Now get detailed descriptions for each job
    const jobsWithDescriptions: Job[] = [];

    for (const job of jobListings.slice(0, 10)) {
      try {
        if (job.url && job.url.includes("awignexpert.com")) {
          await page.goto(job.url, { waitUntil: "networkidle2", timeout: 20000 });
          await delay(2000);

          const description = await page.evaluate(() => {
            // Try to find job description content
            const descriptionSelectors = [
              '[class*="description"]',
              '[class*="content"]',
              '[class*="detail"]',
              '[class*="job-info"]',
              "article",
              "main",
              ".prose",
            ];

            for (const selector of descriptionSelectors) {
              const el = document.querySelector(selector);
              if (el) {
                const text = el.textContent?.trim();
                if (text && text.length > 100) {
                  return text.slice(0, 5000); // Limit description length
                }
              }
            }

            // Fallback: get main content area
            const body = document.body.textContent?.trim() || "";
            return body.slice(0, 3000);
          });

          jobsWithDescriptions.push({
            ...job,
            description: description || "No detailed description available.",
            source: "awign" as JobBoard,
          });
        } else {
          jobsWithDescriptions.push({
            ...job,
            description: "Job description not available - external link.",
            source: "awign" as JobBoard,
          });
        }

        // Add delay between requests to avoid being blocked
        await delay(1500);
      } catch (error) {
        console.error(`Failed to fetch details for job: ${job.title}`, error);
        jobsWithDescriptions.push({
          ...job,
          description: "Failed to fetch job description.",
          source: "awign" as JobBoard,
        });
      }
    }

    return { jobs: jobsWithDescriptions };
  } catch (error) {
    console.error("Crawl error:", error);
    return {
      jobs: [],
      error:
        error instanceof Error ? error.message : "Unknown error during crawling",
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Alternative simpler crawler that extracts available info from the listing page
export async function crawlAwignJobsSimple(jobRole: string): Promise<CrawlResult> {
  let browser: Browser | null = null;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page: Page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    const url = `https://www.awignexpert.com/jobs/explore?page=1&jobTitle=${encodeURIComponent(jobRole)}`;
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
    await delay(5000); // Wait for JS to render

    // Get the full page content and extract job information
    const pageContent = await page.evaluate(() => {
      return {
        html: document.body.innerHTML,
        text: document.body.innerText,
      };
    });

    // Extract jobs from the page using regex and text analysis
    const jobs: Job[] = [];

    // Look for job-like content patterns in the text
    const lines = pageContent.text.split("\n").filter((line) => line.trim());

    let currentJob: Partial<Job> | null = null;
    let jobIndex = 0;

    for (let i = 0; i < lines.length && jobs.length < 10; i++) {
      const line = lines[i].trim();

      // Skip navigation and footer content
      if (
        line.includes("Sign In") ||
        line.includes("Terms and Conditions") ||
        line.includes("Privacy Policy") ||
        line.includes("Admin login") ||
        line.length < 5
      ) {
        continue;
      }

      // Look for job title patterns (typically capitalized, medium length)
      if (
        line.length > 15 &&
        line.length < 150 &&
        !line.includes("@") &&
        !line.includes("http")
      ) {
        // Check if this could be a job title
        const words = line.split(" ");
        if (words.length >= 2 && words.length <= 15) {
          // Check if it contains job-related keywords
          const lowerLine = line.toLowerCase();
          if (
            lowerLine.includes(jobRole.toLowerCase()) ||
            lowerLine.includes("engineer") ||
            lowerLine.includes("manager") ||
            lowerLine.includes("developer") ||
            lowerLine.includes("analyst") ||
            lowerLine.includes("executive") ||
            lowerLine.includes("specialist") ||
            lowerLine.includes("coordinator") ||
            lowerLine.includes("associate")
          ) {
            if (currentJob && currentJob.title) {
              jobs.push({
                id: `job-${jobIndex++}-${Date.now()}`,
                title: currentJob.title,
                company: currentJob.company || "Awign",
                location: currentJob.location || "India",
                description:
                  currentJob.description ||
                  `Job opportunity for ${currentJob.title} role. Please apply to learn more about the specific requirements and responsibilities.`,
                url: url,
                source: "awign",
              });
            }
            currentJob = { title: line };
          }
        }
      }

      // Look for location patterns
      if (
        currentJob &&
        (line.toLowerCase().includes("bangalore") ||
          line.toLowerCase().includes("mumbai") ||
          line.toLowerCase().includes("delhi") ||
          line.toLowerCase().includes("remote") ||
          line.toLowerCase().includes("india") ||
          line.toLowerCase().includes("hybrid"))
      ) {
        currentJob.location = line;
      }

      // Look for description content
      if (
        currentJob &&
        line.length > 50 &&
        !currentJob.description &&
        !line.includes("Showing")
      ) {
        currentJob.description = line;
      }
    }

    // Add the last job if exists
    if (currentJob && currentJob.title && jobs.length < 10) {
      jobs.push({
        id: `job-${jobIndex++}-${Date.now()}`,
        title: currentJob.title,
        company: currentJob.company || "Awign",
        location: currentJob.location || "India",
        description:
          currentJob.description ||
          `Job opportunity for ${currentJob.title} role. Please apply to learn more about the specific requirements and responsibilities.`,
        url: url,
        source: "awign",
      });
    }

    // If still no jobs found, create a placeholder based on the search
    if (jobs.length === 0) {
      // Check if the page indicates no results
      if (
        pageContent.text.toLowerCase().includes("no jobs found") ||
        pageContent.text.toLowerCase().includes("no results")
      ) {
        return {
          jobs: [],
          error: `No jobs found for "${jobRole}" on Awign. Try a different search term.`,
        };
      }

      // Return a sample job indicating that manual review may be needed
      return {
        jobs: [
          {
            id: `job-sample-${Date.now()}`,
            title: `${jobRole} Position`,
            company: "Awign",
            location: "India",
            description: `This is a ${jobRole} position at Awign. The crawler was unable to extract detailed job information from the page. The page may have updated its structure. Please visit the Awign job board directly for full details.`,
            url: url,
            source: "awign" as JobBoard,
          },
        ],
        error:
          "Limited job data extracted. The website structure may have changed.",
      };
    }

    return { jobs };
  } catch (error) {
    console.error("Simple crawl error:", error);
    return {
      jobs: [],
      error:
        error instanceof Error ? error.message : "Unknown error during crawling",
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Indeed job crawler with stealth-like settings
export async function crawlIndeedJobs(
  jobRole: string,
  location: string = ""
): Promise<CrawlResult> {
  let browser: Browser | null = null;

  try {
    // Launch with stealth-like settings
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
        "--disable-infobars",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--window-size=1920,1080",
        "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      ],
    });

    const page: Page = await browser.newPage();
    
    // Set a realistic viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Set realistic headers
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    });

    // Build Indeed URL
    const searchParams = new URLSearchParams({
      q: jobRole,
      l: location,
      sort: "date",
    });
    const url = `https://www.indeed.com/jobs?${searchParams.toString()}`;

    console.log("Navigating to Indeed:", url);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 45000 });
    
    // Random delay to appear more human-like
    await delay(2000 + Math.random() * 2000);

    // Extract job listings from the search results page
    const jobListings = await page.evaluate(() => {
      const jobs: Array<{
        id: string;
        title: string;
        company: string;
        location: string;
        snippet: string;
        url: string;
      }> = [];

      // Indeed job cards - try multiple selector patterns
      const jobCards = document.querySelectorAll(
        '.job_seen_beacon, .jobsearch-ResultsList > li, [data-testid="job-card"], .result, .tapItem'
      );

      jobCards.forEach((card, index) => {
        if (jobs.length >= 10) return;

        // Try multiple selector patterns for title
        const titleEl =
          card.querySelector('h2.jobTitle a, [data-testid="job-title"] a, .jobTitle a, h2 a, a[data-jk]') ||
          card.querySelector("h2.jobTitle, .jobTitle, h2");
        
        // Company name
        const companyEl = card.querySelector(
          '[data-testid="company-name"], .companyName, .company, [class*="company"], span[class*="companyName"]'
        );
        
        // Location
        const locationEl = card.querySelector(
          '[data-testid="text-location"], .companyLocation, [class*="location"], div[class*="companyLocation"]'
        );
        
        // Job snippet/summary
        const snippetEl = card.querySelector(
          '.job-snippet, [class*="snippet"], .summary, [class*="description"], ul[style]'
        );

        const title = titleEl?.textContent?.trim();
        const company = companyEl?.textContent?.trim();
        
        // Get job URL - try to extract the job key for direct URL
        let jobUrl = "";
        const linkEl = card.querySelector('a[data-jk], a[href*="/rc/clk"], a[href*="viewjob"], h2 a, .jobTitle a');
        if (linkEl) {
          const jobKey = linkEl.getAttribute("data-jk");
          if (jobKey) {
            jobUrl = `https://www.indeed.com/viewjob?jk=${jobKey}`;
          } else {
            const href = linkEl.getAttribute("href");
            if (href) {
              jobUrl = href.startsWith("http") ? href : `https://www.indeed.com${href}`;
            }
          }
        }

        if (title && title.length > 3) {
          jobs.push({
            id: `indeed-${index}-${Date.now()}`,
            title: title,
            company: company || "Company not specified",
            location: locationEl?.textContent?.trim() || "Location not specified",
            snippet: snippetEl?.textContent?.trim() || "",
            url: jobUrl,
          });
        }
      });

      return jobs;
    });

    console.log(`Found ${jobListings.length} jobs on Indeed listing page`);

    // Fetch full descriptions for each job
    const jobsWithDescriptions: Job[] = [];

    for (const job of jobListings.slice(0, 10)) {
      try {
        if (job.url && job.url.includes("indeed.com")) {
          console.log(`Fetching details for: ${job.title}`);
          
          // Random delay between requests
          await delay(1500 + Math.random() * 1500);
          
          await page.goto(job.url, { waitUntil: "networkidle2", timeout: 30000 });
          await delay(1000 + Math.random() * 1000);

          // Check if we hit a challenge page
          const pageContent = await page.content();
          if (pageContent.includes("Ray ID") || pageContent.includes("challenge-platform")) {
            console.log("Cloudflare challenge detected, using snippet instead");
            jobsWithDescriptions.push({
              ...job,
              description: job.snippet || `${job.title} at ${job.company}. Visit Indeed for full details.`,
              source: "indeed" as JobBoard,
            });
            continue;
          }

          // Extract job description
          const description = await page.evaluate(() => {
            // Indeed job description selectors
            const descriptionSelectors = [
              "#jobDescriptionText",
              '[data-testid="job-description"]',
              ".jobsearch-jobDescriptionText",
              '[class*="jobDescription"]',
              ".job-description",
              "#jobDescription",
              'div[id="jobDescriptionText"]',
            ];

            for (const selector of descriptionSelectors) {
              const el = document.querySelector(selector);
              if (el) {
                const text = el.textContent?.trim();
                if (text && text.length > 50) {
                  return text.slice(0, 5000);
                }
              }
            }

            // Fallback: try to get any substantial content
            const main = document.querySelector("main, article, .jobsearch-ViewJobLayout");
            if (main) {
              const text = main.textContent?.trim();
              if (text && text.length > 100) {
                return text.slice(0, 3000);
              }
            }

            return "";
          });

          jobsWithDescriptions.push({
            ...job,
            description: description || job.snippet || "No detailed description available.",
            source: "indeed" as JobBoard,
          });
        } else {
          jobsWithDescriptions.push({
            ...job,
            description: job.snippet || "Job description not available.",
            source: "indeed" as JobBoard,
          });
        }
      } catch (error) {
        console.error(`Failed to fetch Indeed job details: ${job.title}`, error);
        jobsWithDescriptions.push({
          ...job,
          description: job.snippet || "Failed to fetch job description.",
          source: "indeed" as JobBoard,
        });
      }
    }

    if (jobsWithDescriptions.length === 0) {
      return {
        jobs: [],
        error: `No jobs found for "${jobRole}" on Indeed. Try different keywords.`,
      };
    }

    return { jobs: jobsWithDescriptions };
  } catch (error) {
    console.error("Indeed crawl error:", error);
    return {
      jobs: [],
      error:
        error instanceof Error ? error.message : "Unknown error during Indeed crawling",
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Unified crawler that dispatches to the appropriate job board
export async function crawlJobs(
  jobRole: string,
  jobBoard: JobBoard,
  location?: string
): Promise<CrawlResult> {
  switch (jobBoard) {
    case "indeed":
      return crawlIndeedJobs(jobRole, location);
    case "awign":
    default:
      return crawlAwignJobsSimple(jobRole);
  }
}

// Single job URL fetch result
export interface SingleJobResult {
  success: boolean;
  job?: Job;
  error?: string;
  blocked?: boolean; // True if bot protection blocked the request
}

// Fetch a single job from a direct URL
export async function fetchSingleJobUrl(jobUrl: string): Promise<SingleJobResult> {
  let browser: Browser | null = null;

  try {
    // Validate URL
    const url = new URL(jobUrl);
    
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
        "--disable-infobars",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--window-size=1920,1080",
        "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      ],
    });

    const page: Page = await browser.newPage();
    
    // Set realistic viewport and headers
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    });

    console.log("Fetching single job URL:", jobUrl);
    await page.goto(jobUrl, { waitUntil: "networkidle2", timeout: 45000 });
    
    // Random delay
    await delay(1500 + Math.random() * 1500);

    // Check for bot protection
    const pageContent = await page.content();
    const pageText = await page.evaluate(() => document.body.innerText);
    
    if (
      pageContent.includes("Ray ID") ||
      pageContent.includes("challenge-platform") ||
      pageContent.includes("captcha") ||
      pageText.includes("Please verify you are a human") ||
      pageText.includes("Access denied")
    ) {
      console.log("Bot protection detected on single job URL");
      return {
        success: false,
        error: "Bot protection detected. Please paste the job description manually.",
        blocked: true,
      };
    }

    // Extract job information
    const jobData = await page.evaluate(() => {
      // Try to extract title
      const titleSelectors = [
        "h1",
        '[data-testid="job-title"]',
        ".job-title",
        ".jobTitle",
        '[class*="JobTitle"]',
        '[class*="job-title"]',
        'h2[class*="title"]',
      ];
      let title = "";
      for (const selector of titleSelectors) {
        const el = document.querySelector(selector);
        if (el) {
          const text = el.textContent?.trim();
          if (text && text.length > 3 && text.length < 200) {
            title = text;
            break;
          }
        }
      }

      // Try to extract company
      const companySelectors = [
        '[data-testid="company-name"]',
        ".company-name",
        ".companyName",
        '[class*="company"]',
        '[class*="Company"]',
        'a[href*="company"]',
      ];
      let company = "";
      for (const selector of companySelectors) {
        const el = document.querySelector(selector);
        if (el) {
          const text = el.textContent?.trim();
          if (text && text.length > 1 && text.length < 100) {
            company = text;
            break;
          }
        }
      }

      // Try to extract location
      const locationSelectors = [
        '[data-testid="location"]',
        '[data-testid="text-location"]',
        ".location",
        ".companyLocation",
        '[class*="location"]',
        '[class*="Location"]',
      ];
      let location = "";
      for (const selector of locationSelectors) {
        const el = document.querySelector(selector);
        if (el) {
          const text = el.textContent?.trim();
          if (text && text.length > 2 && text.length < 150) {
            location = text;
            break;
          }
        }
      }

      // Try to extract description
      const descriptionSelectors = [
        "#jobDescriptionText",
        '[data-testid="job-description"]',
        ".job-description",
        ".jobDescription",
        '[class*="description"]',
        '[class*="Description"]',
        "article",
        "main",
        ".content",
        "#content",
      ];
      let description = "";
      for (const selector of descriptionSelectors) {
        const el = document.querySelector(selector);
        if (el) {
          const text = el.textContent?.trim();
          if (text && text.length > 100) {
            description = text.slice(0, 8000);
            break;
          }
        }
      }

      // Fallback: get body text if no specific description found
      if (!description) {
        const body = document.body.textContent?.trim();
        if (body && body.length > 200) {
          description = body.slice(0, 5000);
        }
      }

      return { title, company, location, description };
    });

    // Check if we got meaningful content
    if (!jobData.description || jobData.description.length < 50) {
      return {
        success: false,
        error: "Could not extract job description from the page. The page structure may be unsupported. Please paste the job description manually.",
        blocked: true,
      };
    }

    const job: Job = {
      id: `manual-${Date.now()}`,
      title: jobData.title || "Job Position",
      company: jobData.company || "Company",
      location: jobData.location || "Location not specified",
      description: jobData.description,
      url: jobUrl,
      source: "manual",
    };

    return {
      success: true,
      job,
    };
  } catch (error) {
    console.error("Single job fetch error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch job. Please paste the job description manually.",
      blocked: true,
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

