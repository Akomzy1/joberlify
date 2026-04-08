import type { EvaluationDimensions, EvaluationGrade, EvaluationRecommendation } from '@/types/evaluation'

// ─── Weights ──────────────────────────────────────────────────────────────────

export const DIMENSION_WEIGHTS: Record<keyof Omit<EvaluationDimensions, 'visa_feasibility'>, number> = {
  role_match: 0.20,
  skills_alignment: 0.20,
  experience_level: 0.10,
  growth_trajectory: 0.10,
  culture_fit: 0.05,
  compensation: 0.10,
  location_fit: 0.10,
  company_stage: 0.05,
  role_impact: 0.05,
  long_term_value: 0.05,
}

// ─── Core calculations ────────────────────────────────────────────────────────

/**
 * Weighted average of the 10 core dimensions.
 * Gate-pass: if role_match OR skills_alignment < 2.0, result is capped at 3.0.
 */
export function calculateOverallScore(scores: EvaluationDimensions): number {
  const scoresMap = scores as unknown as Record<string, number>
  const weighted = (Object.entries(DIMENSION_WEIGHTS) as [string, number][]).reduce(
    (sum, [dim, weight]) => sum + (scoresMap[dim] ?? 3.0) * weight,
    0,
  )

  const gatePassFailed =
    (scores.role_match ?? 0) < 2.0 || (scores.skills_alignment ?? 0) < 2.0

  const raw = gatePassFailed ? Math.min(weighted, 3.0) : weighted

  // Round to one decimal place
  return Math.round(raw * 10) / 10
}

/**
 * Map a numeric overall score to a letter grade.
 * A = 4.5–5.0 | B = 3.5–4.4 | C = 2.5–3.4 | D = 1.5–2.4 | F = 1.0–1.4
 */
export function mapGrade(score: number): EvaluationGrade {
  if (score >= 4.5) return 'A'
  if (score >= 3.5) return 'B'
  if (score >= 2.5) return 'C'
  if (score >= 1.5) return 'D'
  return 'F'
}

/**
 * Map a numeric overall score + optional visa flag to a recommendation.
 * "dont_apply" is also triggered externally when visa_feasibility ≤ 2.0.
 */
export function mapRecommendation(
  score: number,
  options?: { visaFeasibility?: number | null; gatePassFailed?: boolean },
): EvaluationRecommendation {
  const { visaFeasibility, gatePassFailed } = options ?? {}

  if (visaFeasibility !== undefined && visaFeasibility !== null && visaFeasibility <= 2.0) {
    return 'dont_apply'
  }
  if (gatePassFailed) return 'dont_apply'
  if (score >= 4.0) return 'apply'
  if (score >= 3.0) return 'consider'
  return 'not_yet'
}

/**
 * Validate that all 10 core dimension scores are present and in range [1.0, 5.0].
 * Returns the first validation error message, or null if valid.
 */
export function validateScores(scores: Record<string, unknown>): string | null {
  const required = Object.keys(DIMENSION_WEIGHTS)
  for (const dim of required) {
    const v = scores[dim]
    if (typeof v !== 'number') return `Missing score for dimension: ${dim}`
    if (v < 1.0 || v > 5.0) return `Score out of range [1.0–5.0] for dimension: ${dim} (got ${v})`
  }
  return null
}

/**
 * Human-readable label for each dimension.
 */
export const DIMENSION_LABELS: Record<keyof Omit<EvaluationDimensions, 'visa_feasibility'>, string> = {
  role_match: 'Role Match',
  skills_alignment: 'Skills Alignment',
  experience_level: 'Experience Level',
  growth_trajectory: 'Growth Trajectory',
  culture_fit: 'Culture Fit',
  compensation: 'Compensation',
  location_fit: 'Location Fit',
  company_stage: 'Company Stage',
  role_impact: 'Role Impact',
  long_term_value: 'Long-term Value',
}

export const DIMENSION_ORDER = Object.keys(DIMENSION_WEIGHTS) as (keyof typeof DIMENSION_WEIGHTS)[]
