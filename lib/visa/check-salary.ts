import type { SupabaseClient } from '@supabase/supabase-js'
import {
  SKILLED_WORKER_GENERAL_THRESHOLD,
  SKILLED_WORKER_NEW_ENTRANT_THRESHOLD,
  ISL_GOING_RATE_MULTIPLIER,
} from './constants'
import type { SocCodeRow } from './match-soc-code'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SalaryCheckResult {
  /** Salary parsed from the job listing (null if not advertised) */
  advertisedSalary: number | null
  currency: string

  /** General Skilled Worker threshold used (currently £38,700) */
  generalThreshold: number

  /** Going rate for the specific SOC code (null if code unknown) */
  goingRate: number | null

  /** Going rate for new entrants (null if code unknown) */
  goingRateNewEntrant: number | null

  /**
   * Effective minimum that must be met:
   * - Standard: max(generalThreshold, goingRate)
   * - New entrant: max(newEntrantThreshold, goingRateNewEntrant)
   * - ISL role: max(generalThreshold * 0.8, goingRate * 0.8)
   */
  effectiveMinimum: number

  /**
   * null = salary not advertised (cannot assess)
   * true  = meets or exceeds effectiveMinimum
   * false = below effectiveMinimum
   */
  meetsThreshold: boolean | null

  /** Shortfall in £ if meetsThreshold is false */
  shortfall: number | null

  /** Whether new entrant rate is applicable (lower threshold) */
  newEntrantApplicable: boolean

  /** Whether the ISL reduced rate (80%) applies */
  islApplicable: boolean

  /** Guidance message for the salary layer */
  guidance: string
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function checkSalary(
  supabase: SupabaseClient,
  socCodeOrRow: string | SocCodeRow | null,
  advertisedSalary: number | null,
  options: {
    isNewEntrant?: boolean
    currency?: string
  } = {},
): Promise<SalaryCheckResult> {
  const { isNewEntrant = false, currency = 'GBP' } = options

  // ── Fetch SOC code going rate ──
  let dbRow: SocCodeRow | null = null

  if (typeof socCodeOrRow === 'string' && socCodeOrRow) {
    const { data } = await supabase
      .from('uk_soc_codes')
      .select('going_rate_annual, going_rate_new_entrant, on_immigration_salary_list')
      .eq('soc_code', socCodeOrRow)
      .maybeSingle()
    dbRow = (data as SocCodeRow | null) ?? null
  } else if (socCodeOrRow && typeof socCodeOrRow === 'object') {
    dbRow = socCodeOrRow
  }

  const goingRate       = dbRow?.going_rate_annual        ?? null
  const goingRateNE     = dbRow?.going_rate_new_entrant   ?? null
  const islApplicable   = dbRow?.on_immigration_salary_list ?? false
  const generalThreshold = SKILLED_WORKER_GENERAL_THRESHOLD

  // ── Compute effective minimum ──
  let effectiveMinimum: number
  let newEntrantApplicable = false

  if (islApplicable) {
    // ISL roles: 80% of going rate, minimum £30,960
    const islMin = goingRate
      ? Math.max(goingRate * ISL_GOING_RATE_MULTIPLIER, SKILLED_WORKER_NEW_ENTRANT_THRESHOLD)
      : SKILLED_WORKER_NEW_ENTRANT_THRESHOLD
    effectiveMinimum = islMin
    newEntrantApplicable = false // ISL has its own reduced rate
  } else if (isNewEntrant) {
    // New entrant rate: max(£30,960, going_rate_new_entrant)
    const neMin = goingRateNE
      ? Math.max(SKILLED_WORKER_NEW_ENTRANT_THRESHOLD, goingRateNE)
      : SKILLED_WORKER_NEW_ENTRANT_THRESHOLD
    effectiveMinimum = neMin
    newEntrantApplicable = true
  } else {
    // Standard rate: max(£38,700, going_rate_annual)
    effectiveMinimum = goingRate
      ? Math.max(generalThreshold, goingRate)
      : generalThreshold
  }

  // ── Compare salary ──
  if (advertisedSalary === null) {
    return {
      advertisedSalary:     null,
      currency,
      generalThreshold,
      goingRate,
      goingRateNewEntrant:  goingRateNE,
      effectiveMinimum,
      meetsThreshold:       null,
      shortfall:            null,
      newEntrantApplicable,
      islApplicable,
      guidance:             buildGuidance(null, effectiveMinimum, null, islApplicable, newEntrantApplicable),
    }
  }

  const meetsThreshold = advertisedSalary >= effectiveMinimum
  const shortfall      = meetsThreshold ? null : Math.ceil(effectiveMinimum - advertisedSalary)

  return {
    advertisedSalary,
    currency,
    generalThreshold,
    goingRate,
    goingRateNewEntrant: goingRateNE,
    effectiveMinimum,
    meetsThreshold,
    shortfall,
    newEntrantApplicable,
    islApplicable,
    guidance: buildGuidance(advertisedSalary, effectiveMinimum, shortfall, islApplicable, newEntrantApplicable),
  }
}

// ─── Guidance builder ─────────────────────────────────────────────────────────

function fmt(n: number) {
  return `£${n.toLocaleString('en-GB')}`
}

function buildGuidance(
  advertised: number | null,
  minimum: number,
  shortfall: number | null,
  islApplicable: boolean,
  newEntrantApplicable: boolean,
): string {
  if (advertised === null) {
    return `No salary was advertised. The minimum required for this role is ${fmt(minimum)}${islApplicable ? ' (ISL reduced rate)' : newEntrantApplicable ? ' (new entrant rate)' : ''}. Check the job description or contact the employer before applying.`
  }

  if (shortfall !== null && shortfall > 0) {
    const hint = islApplicable
      ? ` This role is on the Immigration Salary List — the reduced rate of ${fmt(minimum)} applies.`
      : newEntrantApplicable
      ? ` The new entrant rate of ${fmt(minimum)} applies if you are under 26 or switching from a Student visa.`
      : ''
    return `The advertised salary (${fmt(advertised)}) is ${fmt(shortfall)} below the required minimum of ${fmt(minimum)}.${hint} You may need to negotiate or this role may not be sponsorable at the advertised rate.`
  }

  const note = islApplicable
    ? ` (ISL reduced rate of ${fmt(minimum)} applies)`
    : newEntrantApplicable
    ? ` (new entrant rate: ${fmt(minimum)})`
    : ''
  return `The advertised salary (${fmt(advertised)}) meets the required minimum of ${fmt(minimum)}${note}.`
}
