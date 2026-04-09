/**
 * UK Skilled Worker visa salary thresholds — April 2024 rules.
 * Update these constants when UKVI publishes new rates.
 * Effective date: 4 April 2024.
 */

/** General Skilled Worker threshold (standard applicants) — £38,700/yr */
export const SKILLED_WORKER_GENERAL_THRESHOLD = 38_700

/** New entrant threshold — 80% of general threshold */
export const SKILLED_WORKER_NEW_ENTRANT_THRESHOLD = 30_960

/** ISL going-rate multiplier — 80% of the going rate (min £30,960) */
export const ISL_GOING_RATE_MULTIPLIER = 0.8

/**
 * Minimum RQF level for new Skilled Worker Visa applications (post July 2025).
 * Previously RQF 3+; raised to 6+ by UKVI on 22 July 2025.
 */
export const MIN_RQF_LEVEL = 6

/** When the rules engine was last manually reviewed */
export const RULES_LAST_VERIFIED_AT = '2026-04-08'

/** Legal disclaimer shown on all visa eligibility results */
export const VISA_DISCLAIMER =
  'This check is for guidance only and does not constitute legal advice. ' +
  'Visa eligibility depends on individual circumstances not captured here. ' +
  'Always verify sponsor licence status on GOV.UK and consult an immigration solicitor ' +
  'before relying on this information. Sponsor data is updated weekly; licence status ' +
  'may have changed since the last update.'
