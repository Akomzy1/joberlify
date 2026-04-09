import type { SupabaseClient } from '@supabase/supabase-js'
import { checkSponsorLicence, type SponsorCheckResult } from './check-sponsor'
import { matchSocCode, type SocMatchResult } from './match-soc-code'
import { checkSalary, type SalaryCheckResult } from './check-salary'
import { VISA_DISCLAIMER, RULES_LAST_VERIFIED_AT } from './constants'

// ─── Types ────────────────────────────────────────────────────────────────────

export type VisaVerdict =
  | 'confirmed'     // licensed A-rated + eligible SOC + salary ok + listing mentions sponsorship
  | 'likely'        // licensed A-rated + eligible SOC + salary ok
  | 'uncertain'     // licensed but SOC borderline or salary unknown
  | 'unlikely'      // no licence, SOC ineligible, or salary below threshold
  | 'blocked'       // definitively ineligible (Table 6)
  | 'not_sponsorable' // B-rated sponsor (cannot issue new CoS)

export interface EligibilityGuidance {
  layer: 'sponsor' | 'soc' | 'salary'
  passed: boolean
  title: string
  detail: string
}

export interface VisaEligibilityResult {
  verdict: VisaVerdict
  verdictLabel: string
  verdictColour: 'green' | 'amber' | 'red' | 'grey'
  sponsor: SponsorCheckResult
  soc: SocMatchResult
  salary: SalaryCheckResult
  guidance: EligibilityGuidance[]
  disclaimer: string
  sponsorDataLastUpdatedAt: string | null
  rulesLastVerifiedAt: string
}

export interface EligibilityCheckInput {
  companyName: string
  jobDescription: string
  jobTitle?: string
  advertisedSalary?: number | null
  salaryCurrency?: string
  isNewEntrant?: boolean
  /** If true, does not run salary check (salary not available) */
  skipSalaryCheck?: boolean
}

// ─── Verdict mapping ──────────────────────────────────────────────────────────

const VERDICT_LABELS: Record<VisaVerdict, string> = {
  confirmed:       'Sponsorship confirmed',
  likely:          'Likely sponsorable',
  uncertain:       'Uncertain — check required',
  unlikely:        'Unlikely to sponsor',
  blocked:         'Not eligible',
  not_sponsorable: 'Cannot issue new CoS',
}

const VERDICT_COLOURS: Record<VisaVerdict, 'green' | 'amber' | 'red' | 'grey'> = {
  confirmed:       'green',
  likely:          'green',
  uncertain:       'amber',
  unlikely:        'red',
  blocked:         'red',
  not_sponsorable: 'red',
}

// ─── Verdict logic ────────────────────────────────────────────────────────────

function determineVerdict(
  sponsor: SponsorCheckResult,
  soc: SocMatchResult,
  salary: SalaryCheckResult,
): VisaVerdict {
  // Table 6 = definitively ineligible
  if (soc.eligibilityTable === 'table6') return 'blocked'

  // Not licensed
  if (!sponsor.found || !sponsor.hasSkillledWorkerRoute) return 'unlikely'

  // B-rated = cannot issue new CoS
  if (sponsor.cannotIssueNewCoS) return 'not_sponsorable'

  // SOC not eligible (RQF too low, or ineligible table)
  if (!soc.isEligible) return 'unlikely'

  // Salary below threshold
  if (salary.meetsThreshold === false) return 'unlikely'

  // Low SOC confidence = uncertain
  if (soc.confidence === 'low') return 'uncertain'

  // Salary unknown = uncertain
  if (salary.meetsThreshold === null) return 'uncertain'

  return 'likely'
}

// ─── Guidance builder ─────────────────────────────────────────────────────────

function buildGuidance(
  sponsor: SponsorCheckResult,
  soc: SocMatchResult,
  salary: SalaryCheckResult,
): EligibilityGuidance[] {
  const layers: EligibilityGuidance[] = []

  // ── Layer 1: Sponsor ──
  if (!sponsor.found) {
    layers.push({
      layer:  'sponsor',
      passed: false,
      title:  'Not on the sponsor register',
      detail: `"${sponsor.queriedName}" was not found on the UK Register of Licensed Sponsors. This employer cannot legally hire someone on a Skilled Worker visa without a sponsor licence. Check if the company trades under a different name, or whether they have a parent company that holds the licence.`,
    })
  } else if (sponsor.cannotIssueNewCoS) {
    layers.push({
      layer:  'sponsor',
      passed: false,
      title:  'B-rated sponsor (cannot issue new CoS)',
      detail: `${sponsor.sponsor!.name} holds a B-rated sponsor licence. B-rated sponsors are under action plan with UKVI and cannot issue new Certificates of Sponsorship until their rating is restored to A. Applying to this employer for a Skilled Worker visa is currently not possible.`,
    })
  } else {
    const confidence = sponsor.matchConfidence === 'exact' ? 'exact match' : 'approximate match'
    layers.push({
      layer:  'sponsor',
      passed: true,
      title:  `Licensed sponsor found (${confidence})`,
      detail: `${sponsor.sponsor!.name} holds an A-rated sponsor licence for the "${sponsor.sponsor!.route}" route${sponsor.sponsor!.townCity ? `, based in ${sponsor.sponsor!.townCity}` : ''}.`,
    })
  }

  // ── Layer 2: SOC Code ──
  if (soc.eligibilityTable === 'table6') {
    layers.push({
      layer:  'soc',
      passed: false,
      title:  'Occupation not eligible (Table 6)',
      detail: `This role maps to SOC ${soc.socCode} (${soc.occupationTitle}), which is listed in Table 6 of the Immigration Rules — occupations that are not eligible for Skilled Worker sponsorship. This is a hard block and cannot be overcome by salary or employer licences.`,
    })
  } else if (!soc.isEligible && soc.rqfWarning) {
    layers.push({
      layer:  'soc',
      passed: false,
      title:  'RQF level below minimum (RQF 6+)',
      detail: soc.rqfWarning,
    })
  } else if (!soc.socCode) {
    layers.push({
      layer:  'soc',
      passed: false,
      title:  'SOC code could not be determined',
      detail: 'The job description did not provide enough information to map to a specific SOC 2020 code. Without a confirmed code, we cannot verify eligibility. Paste a more detailed job description for a better assessment.',
    })
  } else if (soc.isTslDependent) {
    const expiry = soc.tslExpiryDate
      ? ` The TSL expires ${new Date(soc.tslExpiryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.`
      : ''
    layers.push({
      layer:  'soc',
      passed: true,
      title:  `SOC ${soc.socCode} — eligible (Temporary Shortage List)`,
      detail: `This occupation is eligible via the Temporary Shortage List (TSL).${expiry} After expiry, it may no longer be eligible without a further extension from UKVI.`,
    })
  } else {
    layers.push({
      layer:  'soc',
      passed: true,
      title:  `SOC ${soc.socCode} — eligible${soc.isIslRole ? ' (ISL)' : ''}`,
      detail: `${soc.reasoning}${soc.isIslRole ? ' This occupation is on the Immigration Salary List (ISL) — a lower salary threshold may apply.' : ''}`,
    })
  }

  // ── Layer 3: Salary ──
  const salaryPassed = salary.meetsThreshold === true
  const salaryUnknown = salary.meetsThreshold === null

  layers.push({
    layer:   'salary',
    passed:  salaryPassed,
    title:   salaryUnknown
      ? 'Salary not advertised — cannot verify'
      : salaryPassed
      ? `Salary meets threshold (£${salary.effectiveMinimum.toLocaleString('en-GB')} required)`
      : `Salary below threshold — shortfall £${salary.shortfall?.toLocaleString('en-GB')}`,
    detail: salary.guidance,
  })

  return layers
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function runEligibilityCheck(
  supabase: SupabaseClient,
  input: EligibilityCheckInput,
): Promise<VisaEligibilityResult> {
  const {
    companyName,
    jobDescription,
    jobTitle,
    advertisedSalary = null,
    salaryCurrency = 'GBP',
    isNewEntrant = false,
    skipSalaryCheck = false,
  } = input

  // ── Run all three layers in parallel ──
  const [sponsor, soc] = await Promise.all([
    checkSponsorLicence(supabase, companyName),
    matchSocCode(supabase, jobDescription, jobTitle),
  ])

  const salaryInput = skipSalaryCheck ? null : advertisedSalary
  const salary = await checkSalary(supabase, soc.dbRow ?? soc.socCode, salaryInput, {
    isNewEntrant,
    currency: salaryCurrency,
  })

  const verdict = determineVerdict(sponsor, soc, salary)
  const guidance = buildGuidance(sponsor, soc, salary)

  // Fetch when sponsor data was last ingested
  let sponsorDataLastUpdatedAt: string | null = null
  if (sponsor.found && sponsor.sponsor) {
    sponsorDataLastUpdatedAt = sponsor.sponsor.lastSeenAt || null
  }

  return {
    verdict,
    verdictLabel:              VERDICT_LABELS[verdict],
    verdictColour:             VERDICT_COLOURS[verdict],
    sponsor,
    soc,
    salary,
    guidance,
    disclaimer:                VISA_DISCLAIMER,
    sponsorDataLastUpdatedAt,
    rulesLastVerifiedAt:       RULES_LAST_VERIFIED_AT,
  }
}
