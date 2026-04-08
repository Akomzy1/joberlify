export type JobListingSource = 'scraped' | 'pasted'

export interface JobListing {
  jobUrl: string | null
  jobTitle: string
  companyName: string
  location: string | null
  salaryText: string | null        // raw text e.g. "£65,000 – £80,000 per year"
  salaryMin: number | null         // parsed lower bound in salaryCurrency
  salaryMax: number | null         // parsed upper bound in salaryCurrency
  salaryCurrency: string | null    // ISO 4217 e.g. "GBP"
  description: string              // full job description text
  requirements: string[]           // parsed "must have" requirements
  niceToHaves: string[]            // parsed "nice to have" / desirable criteria
  applicationDeadline: string | null  // ISO date string if detected, else null
  scrapedAt: string                // ISO timestamp
  sourceType: JobListingSource
}

export interface ScrapeResult {
  success: true
  listing: JobListing
}

export interface ScrapeFailure {
  success: false
  fallbackRequired: true
  reason: string
}

export type ScrapeOutcome = ScrapeResult | ScrapeFailure
