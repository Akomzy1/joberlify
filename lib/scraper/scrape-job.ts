/**
 * lib/scraper/scrape-job.ts
 *
 * Fetches a job posting URL and extracts structured job listing data.
 * Handles major job boards with tailored selectors; falls back to generic
 * content heuristics for company career pages.
 *
 * Returns { success: false, fallbackRequired: true } for JS-rendered pages
 * (React SPA job boards) or when blocked by anti-bot measures.
 */

import * as cheerio from 'cheerio'
import type { JobListing, ScrapeOutcome } from '@/types/JobListing'

const FETCH_TIMEOUT_MS = 10_000

const FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xhtml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-GB,en;q=0.9',
  'Cache-Control': 'no-cache',
}

// ─── Board detection ──────────────────────────────────────────────────────────

type BoardId =
  | 'greenhouse'
  | 'lever'
  | 'workable'
  | 'ashby'
  | 'smartrecruiters'
  | 'linkedin'
  | 'indeed'
  | 'reed'
  | 'totaljobs'
  | 'cvlibrary'
  | 'generic'

function detectBoard(url: string): BoardId {
  const u = url.toLowerCase()
  if (u.includes('greenhouse.io') || u.includes('grnh.se')) return 'greenhouse'
  if (u.includes('lever.co')) return 'lever'
  if (u.includes('workable.com')) return 'workable'
  if (u.includes('ashbyhq.com') || u.includes('app.ashby.com')) return 'ashby'
  if (u.includes('smartrecruiters.com')) return 'smartrecruiters'
  if (u.includes('linkedin.com/jobs')) return 'linkedin'
  if (u.includes('indeed.com')) return 'indeed'
  if (u.includes('reed.co.uk')) return 'reed'
  if (u.includes('totaljobs.com')) return 'totaljobs'
  if (u.includes('cv-library.co.uk')) return 'cvlibrary'
  return 'generic'
}

// Boards that serve JavaScript-rendered pages and cannot be scraped with
// simple HTTP fetch. Return fallbackRequired for these immediately.
const JS_RENDERED_BOARDS: BoardId[] = ['linkedin', 'indeed', 'ashby']

// ─── Text utilities ───────────────────────────────────────────────────────────

function clean(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function firstText(
  $: ReturnType<typeof cheerio.load>,
  selectors: string[],
): string {
  for (const sel of selectors) {
    const text = clean($(sel).first().text())
    if (text) return text
  }
  return ''
}

function firstAttr(
  $: ReturnType<typeof cheerio.load>,
  selectors: string[],
  attr: string,
): string {
  for (const sel of selectors) {
    const val = $(sel).first().attr(attr)
    if (val) return val.trim()
  }
  return ''
}

/**
 * Extract company name from the page <title> when the board embeds it.
 * Common pattern: "Job Title at Company | Board"
 */
function companyFromTitle(titleText: string): string {
  const atMatch = titleText.match(/ at ([^|–-]+)/i)
  if (atMatch) return atMatch[1].trim()
  const pipeMatch = titleText.match(/[|–-] ([^|–-]+)$/)
  if (pipeMatch) return pipeMatch[1].trim()
  return ''
}

/**
 * Heuristically parse salary from text: £40,000 – £60,000 / $120k / €50k–€70k.
 * Returns { text, min, max, currency }.
 */
function parseSalary(raw: string): {
  text: string
  min: number | null
  max: number | null
  currency: string | null
} {
  if (!raw) return { text: '', min: null, max: null, currency: null }

  const text = clean(raw)

  const currencySymbols: Record<string, string> = {
    '£': 'GBP',
    '$': 'USD',
    '€': 'EUR',
  }
  let currency: string | null = null
  for (const [sym, code] of Object.entries(currencySymbols)) {
    if (text.includes(sym)) { currency = code; break }
  }
  if (!currency && /\bGBP\b|\bUSD\b|\bEUR\b/i.test(text)) {
    currency = text.match(/\b(GBP|USD|EUR)\b/i)![1].toUpperCase()
  }

  const numRegex = /[\d,.]+k?/gi
  const rawNums = text.match(numRegex) ?? []
  const nums = rawNums
    .map((n) => {
      const isK = n.toLowerCase().endsWith('k')
      const val = parseFloat(n.replace(/[^0-9.]/g, ''))
      return isNaN(val) ? null : isK ? val * 1000 : val
    })
    .filter((n): n is number => n !== null && n > 0)

  // Filter to plausible annual salary range (10k–500k)
  const salaries = nums.filter((n) => n >= 10_000 && n <= 500_000)

  return {
    text,
    min: salaries.length > 0 ? Math.min(...salaries) : null,
    max: salaries.length > 1 ? Math.max(...salaries) : null,
    currency,
  }
}

/**
 * Very large body text → trim to first 12,000 chars to stay within AI limits.
 */
function trimDescription(text: string, maxLen = 12_000): string {
  const t = clean(text)
  return t.length > maxLen ? t.slice(0, maxLen) + '…' : t
}

// ─── Board-specific extractors ────────────────────────────────────────────────

function extractGreenhouse(
  $: ReturnType<typeof cheerio.load>,
  url: string,
  html: string,
): Partial<JobListing> {
  const title = firstText($, [
    'h1.app-title',
    '.job-post-name h1',
    'div.job-post-name',
    '#job_details h1',
    'h1',
  ])

  // Company is the org name — often in the page title or meta
  const pageTitle = $('title').text()
  const company =
    firstText($, ['.company-name', '#logo span', 'a.company-logo']) ||
    companyFromTitle(pageTitle)

  const location = firstText($, [
    '.location',
    '.job-post-location',
    '[data-qa="job-info-location"]',
  ])

  const salaryRaw = firstText($, ['.salary', '.compensation', '[data-qa="compensation"]'])
  const salary = parseSalary(salaryRaw)

  const bodyEl = $('#content, .section-wrapper, .job-description, main').first()
  const description = trimDescription(bodyEl.text() || $('body').text())

  return { jobTitle: title, companyName: company, location, description, ...salaryFromParsed(salary) }
}

function extractLever(
  $: ReturnType<typeof cheerio.load>,
  url: string,
): Partial<JobListing> {
  const title = firstText($, [
    'div.posting-headline h2',
    '.posting-title h2',
    'h2',
  ])

  // Lever URL: jobs.lever.co/companyslug/uuid — extract company from subdomain path
  const leverMatch = url.match(/lever\.co\/([^/]+)/i)
  const company =
    firstText($, ['.company-name', '.main-header-logo img[alt]']) ||
    (leverMatch ? leverMatch[1].replace(/-/g, ' ') : '') ||
    companyFromTitle($('title').text())

  const location = firstText($, [
    '.posting-headline ul.posting-categories li.location',
    '.location',
    '.posting-categories .location',
  ])

  const salaryRaw = firstText($, ['.compensation-range', '.salary', '.posting-salary'])
  const salary = parseSalary(salaryRaw)

  const description = trimDescription($('div.posting-body, .posting-content, main').first().text())

  return { jobTitle: title, companyName: company, location, description, ...salaryFromParsed(salary) }
}

function extractWorkable(
  $: ReturnType<typeof cheerio.load>,
  url: string,
): Partial<JobListing> {
  const title = firstText($, ['h1.job-title', 'h1[data-ui="job-title"]', 'h1'])

  const pageTitle = $('title').text()
  const company =
    firstText($, ['.company-title', '[data-ui="company-name"]']) ||
    companyFromTitle(pageTitle)

  const location = firstText($, [
    '[data-ui="job-location"]',
    '.job-location',
    '.location',
  ])

  const salaryRaw = firstText($, ['[data-ui="salary"]', '.salary', '.compensation'])
  const salary = parseSalary(salaryRaw)

  const description = trimDescription(
    $('section.description, div.description, [data-ui="job-description"], main').first().text(),
  )

  return { jobTitle: title, companyName: company, location, description, ...salaryFromParsed(salary) }
}

function extractSmartRecruiters(
  $: ReturnType<typeof cheerio.load>,
): Partial<JobListing> {
  const title = firstText($, [
    'h1[data-test="job-title"]',
    '.job-title h1',
    'h1',
  ])

  const company =
    firstText($, [
      '[data-test="company-name"]',
      '.sr-company-name',
    ]) || companyFromTitle($('title').text())

  const location = firstText($, [
    '[data-test="job-location"]',
    '.sr-company-location',
    '.location',
  ])

  const salaryRaw = firstText($, ['[data-test="salary"]', '.salary'])
  const salary = parseSalary(salaryRaw)

  const description = trimDescription($('[data-test="job-description"], .job-description, main').first().text())

  return { jobTitle: title, companyName: company, location, description, ...salaryFromParsed(salary) }
}

function extractReed(
  $: ReturnType<typeof cheerio.load>,
): Partial<JobListing> {
  const title = firstText($, [
    'h1.job-header_header',
    'h1[itemprop="title"]',
    'h1',
  ])

  const company = firstText($, [
    '[itemprop="hiringOrganization"] [itemprop="name"]',
    '.company',
    'a.gtmJobsDetail_employer',
  ])

  const location = firstText($, [
    '[itemprop="jobLocation"] [itemprop="name"]',
    '.location',
    '.job-location',
  ])

  const salaryRaw = firstText($, ['[itemprop="baseSalary"]', '.salary', '.job-header_jobDetails span:first-child'])
  const salary = parseSalary(salaryRaw)

  const description = trimDescription(
    $('[itemprop="description"], span[itemprop="description"], .description, main').first().text(),
  )

  // Application deadline
  const deadline =
    firstAttr($, ['[itemprop="validThrough"]', 'meta[name="validThrough"]'], 'content') ||
    firstText($, ['.application-deadline', '[itemprop="validThrough"]'])

  return { jobTitle: title, companyName: company, location, description, applicationDeadline: deadline || null, ...salaryFromParsed(salary) }
}

function extractTotaljobs(
  $: ReturnType<typeof cheerio.load>,
): Partial<JobListing> {
  const title = firstText($, [
    'h1.job-title',
    'h1[data-at="job-title"]',
    'h1',
  ])

  const company = firstText($, [
    '.employer-logo-details span',
    '[data-at="company-name"]',
    '.employer',
  ])

  const location = firstText($, [
    '[data-at="job-location"]',
    '.location',
  ])

  const salaryRaw = firstText($, ['[data-at="job-salary"]', '.salary', '.job-description-salary'])
  const salary = parseSalary(salaryRaw)

  const description = trimDescription(
    $('[data-at="job-description"], .job-description, main').first().text(),
  )

  return { jobTitle: title, companyName: company, location, description, ...salaryFromParsed(salary) }
}

function extractCvLibrary(
  $: ReturnType<typeof cheerio.load>,
): Partial<JobListing> {
  const title = firstText($, ['h1.jobTitle', 'h1', '.job-header h1'])
  const company = firstText($, ['.companyName', '.company', '.employer-name'])
  const location = firstText($, ['.location', '.job-location'])
  const salaryRaw = firstText($, ['.salary', '.job-salary', '.salaryText'])
  const salary = parseSalary(salaryRaw)
  const description = trimDescription($('.jobDescriptionContent, .job-description, main').first().text())

  return { jobTitle: title, companyName: company, location, description, ...salaryFromParsed(salary) }
}

/**
 * Generic career page extractor — uses common patterns and structured data.
 */
function extractGeneric(
  $: ReturnType<typeof cheerio.load>,
  url: string,
): Partial<JobListing> {
  // Try JSON-LD structured data first (most reliable)
  let jsonLdData: Record<string, unknown> | null = null
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() ?? '')
      if (data['@type'] === 'JobPosting') {
        jsonLdData = data
        return false // break
      }
    } catch {
      // invalid JSON-LD
    }
  })

  if (jsonLdData) {
    const jd = jsonLdData as Record<string, unknown>
    const salarySpec = jd['baseSalary'] as Record<string, unknown> | undefined
    const salaryValue = salarySpec?.['value'] as Record<string, unknown> | undefined
    const salaryMin = typeof salaryValue?.['minValue'] === 'number' ? salaryValue['minValue'] : null
    const salaryMax = typeof salaryValue?.['maxValue'] === 'number' ? salaryValue['maxValue'] : null
    const currencyRaw = (salarySpec?.['currency'] as string) ?? null

    const orgName = (jd['hiringOrganization'] as Record<string, unknown> | undefined)?.['name'] as string | undefined
    const locationRaw = (jd['jobLocation'] as Record<string, unknown> | undefined)
    const city = (locationRaw?.['address'] as Record<string, unknown> | undefined)?.['addressLocality'] as string | undefined
    const country = (locationRaw?.['address'] as Record<string, unknown> | undefined)?.['addressCountry'] as string | undefined
    const locationStr = [city, country].filter(Boolean).join(', ')

    const descRaw = (jd['description'] as string | undefined) ?? ''
    const desc = trimDescription(descRaw.replace(/<[^>]+>/g, ' '))

    return {
      jobTitle: (jd['title'] as string) ?? '',
      companyName: orgName ?? companyFromTitle($('title').text()),
      location: locationStr || null,
      description: desc,
      salaryText: salaryMin || salaryMax ? `${currencyRaw ?? ''}${salaryMin ?? ''}–${salaryMax ?? ''}` : null,
      salaryMin,
      salaryMax,
      salaryCurrency: currencyRaw,
      applicationDeadline: (jd['validThrough'] as string | undefined) ?? null,
    }
  }

  // Fallback: heuristic DOM extraction
  const title = firstText($, [
    'h1.job-title',
    'h1.position-title',
    'h1[class*="title"]',
    'h1[class*="job"]',
    'h1',
  ])

  const pageTitle = $('title').text()
  const company = companyFromTitle(pageTitle) || firstText($, [
    '[class*="company"]',
    '[class*="employer"]',
    '[class*="organization"]',
    'meta[property="og:site_name"]',
  ])

  const location = firstText($, [
    '[class*="location"]',
    '[class*="city"]',
    '[class*="region"]',
    '[itemprop="jobLocation"]',
  ])

  const salaryRaw = firstText($, [
    '[class*="salary"]',
    '[class*="compensation"]',
    '[class*="pay"]',
    '[itemprop="baseSalary"]',
  ])
  const salary = parseSalary(salaryRaw)

  // Prefer semantic content containers
  const bodyEl = $(
    'article, [class*="job-desc"], [class*="description"], [id*="job-desc"], [id*="description"], main',
  ).first()
  const description = trimDescription(bodyEl.text() || $('body').text())

  return { jobTitle: title, companyName: company || url, location, description, ...salaryFromParsed(salary) }
}

// ─── Helper: salary parsed object → JobListing fields ────────────────────────

function salaryFromParsed(s: ReturnType<typeof parseSalary>) {
  return {
    salaryText: s.text || null,
    salaryMin: s.min,
    salaryMax: s.max,
    salaryCurrency: s.currency,
  }
}

// ─── Detect JS-rendered (sparse HTML) ────────────────────────────────────────

/**
 * Returns true if the page appears to be a JavaScript SPA shell with no
 * meaningful text content — a reliable signal of client-side rendering.
 */
function isJsRendered($: ReturnType<typeof cheerio.load>): boolean {
  const bodyText = clean($('body').text())
  const hasScript = $('script[src]').length > 3
  const hasAppDiv = $('#app, #root, #__next, [data-reactroot]').length > 0
  return bodyText.length < 400 && hasScript && hasAppDiv
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function scrapeJob(url: string): Promise<ScrapeOutcome> {
  const board = detectBoard(url)

  // Short-circuit known JS-only boards before even fetching
  if (JS_RENDERED_BOARDS.includes(board)) {
    return {
      success: false,
      fallbackRequired: true,
      reason: `${board} uses JavaScript rendering and cannot be scraped directly.`,
    }
  }

  // Fetch with timeout
  let html: string
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    const res = await fetch(url, { headers: FETCH_HEADERS, signal: controller.signal })
    clearTimeout(timer)

    if (!res.ok) {
      return {
        success: false,
        fallbackRequired: true,
        reason: `HTTP ${res.status} from ${url}`,
      }
    }

    const contentType = res.headers.get('content-type') ?? ''
    if (!contentType.includes('text/html')) {
      return {
        success: false,
        fallbackRequired: true,
        reason: `Unexpected content-type: ${contentType}`,
      }
    }

    html = await res.text()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return {
      success: false,
      fallbackRequired: true,
      reason: msg.includes('abort') ? 'Fetch timed out after 10 seconds.' : `Fetch failed: ${msg}`,
    }
  }

  const $ = cheerio.load(html)

  // Detect client-side rendering even for boards we expected to have SSR
  if (isJsRendered($)) {
    return {
      success: false,
      fallbackRequired: true,
      reason: `${board} page appears to be JavaScript-rendered (no meaningful HTML content).`,
    }
  }

  // Board-specific extraction
  let partial: Partial<JobListing>
  switch (board) {
    case 'greenhouse':
      partial = extractGreenhouse($, url, html); break
    case 'lever':
      partial = extractLever($, url); break
    case 'workable':
      partial = extractWorkable($, url); break
    case 'smartrecruiters':
      partial = extractSmartRecruiters($); break
    case 'reed':
      partial = extractReed($); break
    case 'totaljobs':
      partial = extractTotaljobs($); break
    case 'cvlibrary':
      partial = extractCvLibrary($); break
    default:
      partial = extractGeneric($, url)
  }

  // Validate — must have at minimum a title and some description
  if (!partial.jobTitle || !partial.description || partial.description.length < 100) {
    return {
      success: false,
      fallbackRequired: true,
      reason: 'Could not extract sufficient job content from the page.',
    }
  }

  const listing: JobListing = {
    jobUrl: url,
    jobTitle: partial.jobTitle,
    companyName: partial.companyName || 'Unknown company',
    location: partial.location ?? null,
    salaryText: partial.salaryText ?? null,
    salaryMin: partial.salaryMin ?? null,
    salaryMax: partial.salaryMax ?? null,
    salaryCurrency: partial.salaryCurrency ?? null,
    description: partial.description,
    requirements: partial.requirements ?? [],
    niceToHaves: partial.niceToHaves ?? [],
    applicationDeadline: partial.applicationDeadline ?? null,
    scrapedAt: new Date().toISOString(),
    sourceType: 'scraped',
  }

  return { success: true, listing }
}
