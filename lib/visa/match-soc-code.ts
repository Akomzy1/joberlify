import type { SupabaseClient } from '@supabase/supabase-js'
import anthropic, { CLAUDE_MODELS, CLAUDE_TIMEOUTS } from '@/lib/claude/client'

// ─── Types ────────────────────────────────────────────────────────────────────

export type SocMatchConfidence = 'high' | 'medium' | 'low'

export interface SocCodeRow {
  soc_code: string
  occupation_title: string
  rqf_level: number
  eligibility_table: string
  is_eligible: boolean
  going_rate_annual: number
  going_rate_new_entrant: number
  on_immigration_salary_list: boolean
  on_temporary_shortage_list: boolean
  tsl_expiry_date: string | null
  conditions: string | null
  last_verified_at: string
}

export interface SocMatchResult {
  socCode: string | null
  occupationTitle: string | null
  confidence: SocMatchConfidence
  reasoning: string
  /** Full DB row for the matched code */
  dbRow: SocCodeRow | null
  isEligible: boolean
  eligibilityTable: string | null
  rqfLevel: number | null
  isIslRole: boolean
  isTslDependent: boolean
  tslExpiryDate: string | null
  /** Warning when RQF < MIN_RQF_LEVEL */
  rqfWarning: string | null
}

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM = `You are a UK employment classification expert specialising in the SOC 2020 (Standard Occupational Classification) system used for Skilled Worker visa applications.

Your task: given a job description, identify the most appropriate 4-digit SOC 2020 code.

CRITICAL RULES:
- Base classification on the ACTUAL DUTIES described, NOT the job title.
- A "Project Manager" who primarily writes code is a programmer (2134), not a manager (2424).
- A "Data Scientist" whose main duty is building dashboards is a business analyst (2133), not a data scientist (2425).
- If duties span multiple SOC codes, choose the one that captures the PRIMARY activity (majority of time).
- Only return codes that are valid SOC 2020 4-digit codes.

Common codes for technology roles:
- 2133: IT business analysts, architects, systems designers
- 2134: Programmers and software development professionals
- 2135: Cyber security professionals
- 2136: IT quality and testing professionals
- 2137: IT network and systems engineers
- 2139: IT and telecommunications professionals NEC
- 2461: Quality assurance and regulatory professionals
- 2425: Data scientists and statisticians
- 2424: Management and business analysts

Return a JSON object only (no markdown):
{
  "soc_code": "2134",
  "confidence": "high",
  "reasoning": "The role primarily involves writing and maintaining production code in Python and Go, which maps directly to SOC 2020 2134 (Programmers and software development professionals)."
}`

// ─── Main export ──────────────────────────────────────────────────────────────

export async function matchSocCode(
  supabase: SupabaseClient,
  jobDescription: string,
  jobTitle?: string,
): Promise<SocMatchResult> {
  // Trim to keep token usage low — duties are usually in first 2000 chars
  const duties = jobDescription.slice(0, 3000)

  const userPrompt = jobTitle
    ? `Job title (for context only — do NOT base classification on this): ${jobTitle}\n\nJob duties and description:\n${duties}`
    : `Job duties and description:\n${duties}`

  // ── Call Claude Haiku ──
  let aiText = ''
  try {
    const msg = await anthropic.messages.create(
      {
        model:      CLAUDE_MODELS.haiku,
        max_tokens: 256,
        system:     SYSTEM,
        messages:   [{ role: 'user', content: userPrompt }],
      },
      { timeout: CLAUDE_TIMEOUTS.classification },
    )
    const block = msg.content[0]
    if (block.type !== 'text') throw new Error('Unexpected Claude response type')
    aiText = block.text.trim()
  } catch (err) {
    console.error('[visa/match-soc-code] Claude error:', err)
    return notFound('Claude classification failed')
  }

  // ── Parse JSON ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let ai: any
  try {
    const cleaned = aiText.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
    ai = JSON.parse(cleaned)
  } catch {
    console.error('[visa/match-soc-code] Invalid JSON from Claude:', aiText.slice(0, 200))
    return notFound('Could not parse SOC classification response')
  }

  const socCode: string | null = ai?.soc_code ? String(ai.soc_code).trim() : null
  const confidence: SocMatchConfidence =
    ['high', 'medium', 'low'].includes(ai?.confidence) ? ai.confidence : 'low'
  const reasoning: string = ai?.reasoning ?? ''

  if (!socCode || !/^\d{4}$/.test(socCode)) {
    return notFound('AI returned invalid SOC code format')
  }

  // ── Cross-reference DB ──
  const { data: row, error } = await supabase
    .from('uk_soc_codes')
    .select('*')
    .eq('soc_code', socCode)
    .maybeSingle()

  if (error) {
    console.error('[visa/match-soc-code] DB error:', error.message)
  }

  if (!row) {
    // Code not in our DB — return what Claude said but mark unknown
    return {
      socCode,
      occupationTitle:  null,
      confidence:       'low',
      reasoning:        `${reasoning} (Code not found in eligibility database.)`,
      dbRow:            null,
      isEligible:       false,
      eligibilityTable: null,
      rqfLevel:         null,
      isIslRole:        false,
      isTslDependent:   false,
      tslExpiryDate:    null,
      rqfWarning:       'SOC code not found in the eligibility database. Please verify manually.',
    }
  }

  const db = row as SocCodeRow
  const rqfWarning = db.rqf_level < 6
    ? `This occupation is classified at RQF level ${db.rqf_level}. As of July 2025, new Skilled Worker applications require RQF level 6 or above. This role may not be eligible.`
    : null

  return {
    socCode:          db.soc_code,
    occupationTitle:  db.occupation_title,
    confidence,
    reasoning,
    dbRow:            db,
    isEligible:       db.is_eligible,
    eligibilityTable: db.eligibility_table,
    rqfLevel:         db.rqf_level,
    isIslRole:        db.on_immigration_salary_list,
    isTslDependent:   db.on_temporary_shortage_list,
    tslExpiryDate:    db.tsl_expiry_date,
    rqfWarning,
  }
}

function notFound(reasoning: string): SocMatchResult {
  return {
    socCode:          null,
    occupationTitle:  null,
    confidence:       'low',
    reasoning,
    dbRow:            null,
    isEligible:       false,
    eligibilityTable: null,
    rqfLevel:         null,
    isIslRole:        false,
    isTslDependent:   false,
    tslExpiryDate:    null,
    rqfWarning:       null,
  }
}
