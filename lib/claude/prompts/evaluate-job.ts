import type { UserProfile, CvJobHistory } from '@/types'
import type { JobListing } from '@/types/JobListing'

// ─── System prompt ────────────────────────────────────────────────────────────

export const EVALUATE_SYSTEM_PROMPT = `You are Joberlify, an AI job search intelligence engine. Evaluate how well a candidate matches a specific job listing across 10 dimensions. Be honest, specific, and actionable. Never inflate scores. A score of 3.0 means "acceptable but not ideal" — 5.0 is reserved for exceptional matches.`

// ─── Input types ─────────────────────────────────────────────────────────────

export interface EvaluateJobInput {
  listing: JobListing
  userProfile: UserProfile
  includeVisa: boolean
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

export function buildEvaluateJobPrompt(input: EvaluateJobInput): string {
  const { listing, userProfile, includeVisa } = input

  // ── Candidate location context ────────────────────────────────────────────
  const targetLocationSummary =
    userProfile.targetLocations.length > 0
      ? userProfile.targetLocations
          .map((loc) => {
            if (loc.anywhere) return `anywhere in ${loc.country}`
            if (loc.cities.length > 0) return `${loc.cities.join(', ')} (${loc.country})`
            return loc.country
          })
          .join('; ')
      : userProfile.targetCountries.join(', ') || 'Not specified'

  const remoteLabel: Record<string, string> = {
    onsite_only: 'On-site only — will not accept remote roles',
    hybrid: 'Hybrid — open to mix of office and remote',
    remote_only: 'Fully remote only — will not accept on-site roles',
    open: 'Open to any arrangement',
  }

  const currentLocation =
    [userProfile.currentCity, userProfile.currentCountry].filter(Boolean).join(', ') ||
    'Not specified'

  const locationSection = `CANDIDATE LOCATION PREFERENCES:
- Currently based in: ${currentLocation}
- Target locations: ${targetLocationSummary}
- Work arrangement preference: ${remoteLabel[userProfile.remotePreference] ?? 'Open'}
- Open to relocating: ${userProfile.willingnessToRelocate ? 'Yes' : 'No'}${userProfile.maxCommuteMiles ? `\n- Maximum commute: ${userProfile.maxCommuteMiles} miles` : ''}`

  const locationRules = `LOCATION FIT SCORING — apply these rules deterministically, not as suggestions:
- Job in candidate's specified city → 5.0
- Fully remote role AND candidate prefers remote_only or open → 5.0
- Fully remote role AND candidate prefers hybrid → 4.5
- Job in target country, different city, candidate IS open to relocating → 3.5
- Job in target country, different city, candidate NOT open to relocating → 2.0
- Job NOT in any target country → 1.0
- Fully remote role AND candidate is onsite_only → 2.0
- Job requires on-site AND candidate is remote_only → 2.0
- Location unclear → 3.0 (neutral)

MANDATORY: If location_fit < 3.0, you MUST include a gap entry for location_fit with:
  gap: "This role is in [job_location]. Your target locations are [candidate_targets]."
  guidance: "Consider searching for similar remote roles, or expanding your target locations to include [job_location]."`

  // ── CV and experience context ─────────────────────────────────────────────
  const cv = userProfile.cvParsedData

  const skillsSummary =
    userProfile.skills.length > 0
      ? userProfile.skills.slice(0, 25).join(', ')
      : 'Not provided'

  const experienceSection = cv
    ? buildExperienceSection(cv.jobHistory, cv.totalExperienceYears, cv.currentTitle, cv.currentCompany)
    : `Skills: ${skillsSummary}\nExperience: Profile not fully completed`

  const qualificationsSection =
    cv?.qualifications?.length
      ? `QUALIFICATIONS:\n${cv.qualifications.map((q) => `  ${q.degree}${q.field ? ` in ${q.field}` : ''} — ${q.institution}${q.year ? ` (${q.year})` : ''}`).join('\n')}`
      : ''

  const certificationsSection =
    cv?.certifications?.length
      ? `CERTIFICATIONS: ${cv.certifications.map((c) => c.name).join(', ')}`
      : ''

  const careerSummarySection = cv?.careerSummary
    ? `CAREER SUMMARY:\n${cv.careerSummary}`
    : ''

  // ── Visa context ──────────────────────────────────────────────────────────
  const visaSection = includeVisa
    ? `
VISA REQUIREMENTS:
- Candidate requires UK Skilled Worker visa sponsorship
- Nationality: ${userProfile.nationality ?? 'Not specified'}
- Current visa status: ${userProfile.currentVisaStatus ?? 'Not specified'}

VISA FEASIBILITY DIMENSION (11th — score 1.0–5.0):
5.0 = Employer confirmed A-rated sponsor, SOC code eligible, salary meets going rate
3.0 = Employer may be licensed; SOC or salary eligibility unclear
1.0 = Employer not on licensed sponsors register, OR SOC definitively ineligible
Rule: If visa_feasibility ≤ 2.0, set recommendation to "dont_apply" regardless of other scores.`.trim()
    : ''

  // ── Job listing ───────────────────────────────────────────────────────────
  const jobContext = `=== JOB LISTING ===
Title: ${listing.jobTitle}
Company: ${listing.companyName}
Location: ${listing.location ?? 'Not specified'}
Salary: ${listing.salaryText ?? 'Not stated'}

JOB DESCRIPTION:
${listing.description}${listing.requirements.length ? `\n\nREQUIREMENTS:\n${listing.requirements.map((r) => `- ${r}`).join('\n')}` : ''}${listing.niceToHaves.length ? `\n\nNICE TO HAVE:\n${listing.niceToHaves.map((n) => `- ${n}`).join('\n')}` : ''}`

  // ── Assemble ──────────────────────────────────────────────────────────────
  return `${jobContext}

=== CANDIDATE PROFILE ===
${[careerSummarySection, experienceSection, qualificationsSection, certificationsSection].filter(Boolean).join('\n\n')}

SKILLS: ${skillsSummary}

${locationSection}
${visaSection ? '\n' + visaSection : ''}

=== SCORING INSTRUCTIONS ===
Score each dimension 1.0–5.0 in increments of 0.1. Be precise.
3.0 = acceptable but not ideal. Reserve 4.5–5.0 for genuinely strong fits.

GATE-PASS RULE: If role_match OR skills_alignment < 2.0, overall_score is capped at 3.0 regardless of other scores.

DIMENSIONS:
1. role_match — Does the role title, seniority, and core responsibilities match what the candidate does?
2. skills_alignment — How completely do the required skills overlap with the candidate's demonstrated skills?
3. experience_level — Is the required experience level appropriate for the candidate's actual level?
4. growth_trajectory — Does this role advance the candidate's career trajectory?
5. culture_fit — Based on company size, tone, and role context — how well does this suit the candidate?
6. compensation — Does the stated/estimated salary match what the candidate would command?
7. location_fit — Use the LOCATION FIT SCORING rules above. This is deterministic.
8. company_stage — Is the company stage (startup/scaleup/enterprise) right for the candidate?
9. role_impact — How significant is the impact scope of this role?
10. long_term_value — Does this role build skills and experience that compound over time?
${includeVisa ? '11. visa_feasibility — See VISA REQUIREMENTS section above.' : ''}

OVERALL SCORE WEIGHTS: role_match 20%, skills_alignment 20%, experience_level 10%, growth_trajectory 10%, culture_fit 5%, compensation 10%, location_fit 10%, company_stage 5%, role_impact 5%, long_term_value 5%.

GRADES: A = 4.5–5.0, B = 3.5–4.4, C = 2.5–3.4, D = 1.5–2.4, F = 1.0–1.4
RECOMMENDATION: "apply" (≥4.0), "consider" (3.0–3.9), "not_yet" (<3.0), "dont_apply" (visa blocked or gate-pass failed with < 2.0)

${locationRules}

=== RESPONSE FORMAT ===
Respond with valid JSON only. No markdown, no prose outside the JSON.

{
  "scores": {
    "role_match": <number>,
    "skills_alignment": <number>,
    "experience_level": <number>,
    "growth_trajectory": <number>,
    "culture_fit": <number>,
    "compensation": <number>,
    "location_fit": <number>,
    "company_stage": <number>,
    "role_impact": <number>,
    "long_term_value": <number>${includeVisa ? ',\n    "visa_feasibility": <number>' : ''}
  },
  "overall_score": <number>,
  "grade": "<A|B|C|D|F>",
  "recommendation": "<apply|consider|not_yet|dont_apply>",
  "summary": "<2–3 sentence honest narrative. Lead with the most important insight.>",
  "strengths": [
    "<specific strength that makes this candidate a good fit for this role>"
  ],
  "gaps": [
    {
      "dimension": "<dimension key>",
      "score": <number>,
      "gap": "<what is specifically missing or misaligned — be concrete>",
      "guidance": "<specific, actionable steps to close this gap — not generic advice>",
      "estimated_time_to_close": "<realistic timeframe e.g. '3–6 months' or null>"
    }
  ],
  "similar_roles_to_search": [
    "<role title that would be a better fit right now>"
  ],
  "location_match": {
    "job_location": "<detected job location string, or 'Not specified'>",
    "user_targets": "<concise summary of candidate's target locations>",
    "is_match": <true|false>,
    "detail": "<one sentence explaining the location fit score>"
  }${includeVisa ? `,
  "visa_alternatives": [
    {
      "soc_code": "<code>",
      "soc_title": "<title>",
      "reason": "<why this SOC is a better visa fit>",
      "visa_route": "<route name>"
    }
  ]` : ''}
}`
}

// ─── Experience section builder ───────────────────────────────────────────────

function buildExperienceSection(
  jobHistory: CvJobHistory[],
  totalYears: number | null,
  currentTitle: string | null,
  currentCompany: string | null,
): string {
  const lines: string[] = []

  if (currentTitle || currentCompany) {
    lines.push(`Current role: ${[currentTitle, currentCompany].filter(Boolean).join(' at ')}`)
  }
  if (totalYears !== null) {
    lines.push(`Total experience: ${totalYears} year${totalYears !== 1 ? 's' : ''}`)
  }

  const recent = jobHistory.slice(0, 4)
  if (recent.length > 0) {
    lines.push('\nRECENT EXPERIENCE:')
    for (const job of recent) {
      const period = [job.startDate, job.endDate ?? 'Present'].filter(Boolean).join(' – ')
      lines.push(`  ${job.title} at ${job.company}${period ? ` (${period})` : ''}`)
      if (job.duties.length > 0) {
        lines.push(`    Duties: ${job.duties.slice(0, 3).join('; ')}`)
      }
      if (job.achievements.length > 0) {
        lines.push(`    Achievements: ${job.achievements.slice(0, 2).join('; ')}`)
      }
    }
  }

  return lines.join('\n')
}

// ─── Legacy compat export (backwards compat with previous API route) ──────────

/** @deprecated Use buildEvaluateJobPrompt({ listing, userProfile, includeVisa }) */
export interface LegacyEvaluateInput {
  jobTitle: string
  company: string
  jobDescription: string
  salary: string | null
  location: string | null
  userProfile: UserProfile
  includeVisa: boolean
}
