/**
 * lib/scraper/parse-jd.ts
 *
 * Uses Claude Haiku to extract structured job listing data from raw pasted text.
 * Handles all common JD formats: bullet-heavy, narrative, informal startup posts,
 * multi-section formal specs, salary-free postings, and remote-first descriptions.
 */

import anthropic, { CLAUDE_MODELS, CLAUDE_TIMEOUTS } from '@/lib/claude/client'
import type { JobListing } from '@/types/JobListing'

const PARSE_JD_SYSTEM_PROMPT = `You are a job description parser. Extract structured data from raw job posting text.

Output ONLY valid JSON — no markdown, no prose. Return exactly this schema:
{
  "jobTitle": "<string — the specific role title, e.g. 'Senior Software Engineer'>",
  "companyName": "<string — employer name, or 'Unknown' if not mentioned>",
  "location": "<string | null — city/country or 'Remote' or null if absent>",
  "salaryText": "<string | null — raw salary text exactly as written, or null>",
  "salaryMin": <number | null — lower annual bound in salaryCurrency, or null>,
  "salaryMax": <number | null — upper annual bound in salaryCurrency, or null>,
  "salaryCurrency": "<string | null — ISO 4217 code e.g. 'GBP', 'USD', or null>",
  "description": "<string — the full cleaned job description text, 200–2000 words>",
  "requirements": ["<string>", ...],
  "niceToHaves": ["<string>", ...],
  "applicationDeadline": "<string | null — ISO date YYYY-MM-DD if found, else null>"
}

Rules:
- requirements: MUST have / essential / required criteria only
- niceToHaves: desirable / preferred / nice to have / bonus criteria
- If salary is hourly or daily, convert to approximate annual (×52 weeks or ×220 days)
- description: include responsibilities, about the role/company, and context. Do NOT truncate.
- If a field is absent from the posting, use null for strings/numbers and [] for arrays.`

export async function parseJdWithAI(rawText: string): Promise<JobListing> {
  if (!rawText?.trim()) throw new Error('Job description text is empty')

  const truncated = rawText.length > 12_000 ? rawText.slice(0, 12_000) + '…' : rawText

  let responseText = ''
  try {
    const message = await anthropic.messages.create(
      {
        model: CLAUDE_MODELS.haiku,
        max_tokens: 2048,
        system: PARSE_JD_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Parse this job description and return structured JSON:\n\n${truncated}`,
          },
        ],
      },
      { timeout: CLAUDE_TIMEOUTS.parsing },
    )

    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Unexpected response type from Claude')
    responseText = content.text.trim()
  } catch (err) {
    throw new Error(`AI parsing failed: ${err instanceof Error ? err.message : String(err)}`)
  }

  const cleaned = responseText
    .replace(/^```(?:json)?\n?/m, '')
    .replace(/\n?```$/m, '')
    .trim()

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error(`AI returned invalid JSON: ${cleaned.slice(0, 200)}`)
  }

  if (!parsed.jobTitle || !parsed.description) {
    throw new Error('AI response missing required fields (jobTitle, description)')
  }

  return {
    jobUrl: null,
    jobTitle: String(parsed.jobTitle ?? ''),
    companyName: String(parsed.companyName ?? 'Unknown'),
    location: parsed.location ? String(parsed.location) : null,
    salaryText: parsed.salaryText ? String(parsed.salaryText) : null,
    salaryMin: typeof parsed.salaryMin === 'number' ? parsed.salaryMin : null,
    salaryMax: typeof parsed.salaryMax === 'number' ? parsed.salaryMax : null,
    salaryCurrency: parsed.salaryCurrency ? String(parsed.salaryCurrency) : null,
    description: String(parsed.description ?? ''),
    requirements: Array.isArray(parsed.requirements)
      ? (parsed.requirements as unknown[]).map(String)
      : [],
    niceToHaves: Array.isArray(parsed.niceToHaves)
      ? (parsed.niceToHaves as unknown[]).map(String)
      : [],
    applicationDeadline: parsed.applicationDeadline ? String(parsed.applicationDeadline) : null,
    scrapedAt: new Date().toISOString(),
    sourceType: 'pasted',
  }
}
