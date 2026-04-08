import type { UserProfile } from '@/types'

interface EvaluateJobInput {
  jobTitle: string
  company: string
  jobDescription: string
  salary: string | null
  location: string | null
  userProfile: UserProfile
  includeVisa: boolean
}

export function buildEvaluateJobPrompt(input: EvaluateJobInput): string {
  const { jobTitle, company, jobDescription, salary, location, userProfile, includeVisa } = input

  // ── Candidate location context ────────────────────────────────────────────
  const targetLocationSummary = userProfile.targetLocations.length > 0
    ? userProfile.targetLocations.map((loc) => {
        const base = loc.country
        if (loc.anywhere) return `anywhere in ${base}`
        if (loc.cities.length > 0) return `${loc.cities.join(', ')} (${base})`
        return base
      }).join('; ')
    : userProfile.targetCountries.join(', ') || 'Not specified'

  const remoteLabel: Record<string, string> = {
    onsite_only: 'On-site only',
    hybrid: 'Hybrid (open to in-office + remote)',
    remote_only: 'Fully remote only',
    open: 'Open to any arrangement',
  }

  const candidateCurrentLocation = [userProfile.currentCity, userProfile.currentCountry]
    .filter(Boolean).join(', ') || 'Not specified'

  const locationContext = `
CANDIDATE LOCATION PREFERENCES:
- Currently based in: ${candidateCurrentLocation}
- Target locations: ${targetLocationSummary}
- Remote/work arrangement preference: ${remoteLabel[userProfile.remotePreference] ?? 'Open'}
- Open to relocating: ${userProfile.willingnessToRelocate ? 'Yes' : 'No'}
${userProfile.maxCommuteMiles ? `- Maximum commute distance: ${userProfile.maxCommuteMiles} miles` : ''}
`.trim()

  const locationScoringRules = `
LOCATION FIT SCORING RULES (apply exactly — not as a suggestion):
- Job is in one of the candidate's specified cities → 5.0
- Fully remote role AND candidate prefers remote_only or open → 5.0
- Fully remote role AND candidate prefers hybrid → 4.5
- Job in target country, different city, candidate IS open to relocating → 3.5
- Job in target country, different city, candidate NOT open to relocating → 2.0
- Job NOT in any target country → 1.0
- Fully remote role AND candidate is onsite_only → 2.0
- Job requires on-site, candidate is remote_only → 2.0
- Unclear / unstated job location → 3.0 (neutral)

MANDATORY GAP REPORT rule for location_fit:
If location_fit < 3.0, the gap_report MUST include:
  "This role is in [job_location]. Your target locations are [candidate_targets].
   Consider expanding your target locations, searching for remote versions of this role,
   or exploring similar roles in your preferred cities."
`.trim()

  // ── Candidate profile summary ─────────────────────────────────────────────
  const skillsSummary = userProfile.skills.length > 0
    ? userProfile.skills.slice(0, 20).join(', ')
    : 'Not provided'

  const visaSection = includeVisa
    ? `
VISA REQUIREMENTS:
- Candidate requires visa sponsorship: Yes
- Nationality: ${userProfile.nationality ?? 'Not specified'}
- Current visa status: ${userProfile.currentVisaStatus ?? 'Not specified'}

VISA FEASIBILITY DIMENSION (11th dimension — score 1.0–5.0):
5.0 = Employer confirmed sponsorable, SOC eligible, salary meets threshold
3.0 = Employer licensed, eligibility uncertain (SOC borderline or salary unclear)
1.0 = Employer not licensed OR SOC definitively ineligible OR salary below threshold
- If visa_feasibility ≤ 2.0, set recommendation to "dont_apply" regardless of other scores
`.trim()
    : ''

  return `You are Joberlify's evaluation engine. Score this job opportunity against the candidate profile with complete honesty. Never inflate scores to make candidates feel good.

=== JOB DETAILS ===
Title: ${jobTitle}
Company: ${company}
Location: ${location ?? 'Not specified'}
Salary: ${salary ?? 'Not stated'}

JOB DESCRIPTION:
${jobDescription}

=== CANDIDATE PROFILE ===
Skills: ${skillsSummary}
Years of experience: ${userProfile.skills.length > 0 ? 'See CV / profile' : 'Not specified'}
Career summary: ${(userProfile as UserProfile & { careerSummary?: string }).careerSummary ?? 'Not provided'}

${locationContext}

${visaSection}

=== SCORING DIMENSIONS ===
Score each dimension from 1.0 to 5.0 in increments of 0.1.

GATE-PASS RULE: If role_match OR skills_alignment < 2.0, overall_score is capped at 3.0 regardless of other scores.

1. role_match — Does the role title, responsibilities, and seniority match what the candidate is targeting?
2. skills_alignment — How well do the required skills match the candidate's demonstrated skills?
3. experience_level — Is the experience requirement appropriate for the candidate's level?
4. growth_trajectory — Does this role advance the candidate's career trajectory?
5. culture_fit — Based on company description, size, and role tone — does this suit the candidate?
6. compensation — Does the stated/estimated salary match candidate expectations?
7. location_fit — Use the LOCATION FIT SCORING RULES above. This is deterministic, not subjective.
8. company_stage — Is this company stage (startup/scaleup/enterprise) appropriate for the candidate?
9. role_impact — How meaningful is this role's impact scope?
10. long_term_value — Does this role offer long-term career value?
${includeVisa ? '11. visa_feasibility — See VISA REQUIREMENTS section above.' : ''}

OVERALL SCORE: Weighted average. role_match (20%), skills_alignment (20%), experience_level (10%), growth_trajectory (10%), culture_fit (5%), compensation (10%), location_fit (10%), company_stage (5%), role_impact (5%), long_term_value (5%).

GRADES: A = 4.5–5.0, B = 3.5–4.4, C = 2.5–3.4, D = 1.5–2.4, F = 1.0–1.4
RECOMMENDATION: apply (≥4.0), consider (3.0–3.9), not_yet (<3.0), dont_apply (visa blocked or < 2.0 on gate-pass)

${locationScoringRules}

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
  "evaluation_summary": "<2–3 sentence honest summary>",
  "location_match": {
    "job_location": "<detected job location or 'Not specified'>",
    "user_targets": "<summary of candidate's target locations>",
    "is_match": <true|false>,
    "detail": "<one sentence explaining the location score>"
  },
  "gap_report": <null if recommendation is apply, otherwise: {
    "gaps": [
      {
        "dimension": "<dimension_name>",
        "score": <number>,
        "issue": "<what is missing or misaligned>",
        "actionable_guidance": "<specific steps to close this gap>",
        "estimated_time_to_close": "<realistic timeframe or null>"
      }
    ],
    "similar_roles": [
      { "title": "<role title>", "reason": "<why they are a better fit>", "suggested_soc_code": "<if known>" }
    ],
    "visa_alternatives": ${includeVisa ? '[{ "soc_code": "<code>", "soc_title": "<title>", "reason": "<why>", "visa_route": "<route>" }]' : 'null'}
  }>
}`
}
