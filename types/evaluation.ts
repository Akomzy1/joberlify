export type EvaluationScore = number // 1.0–5.0, one decimal place

export type EvaluationGrade = 'A' | 'B' | 'C' | 'D' | 'F'

export type EvaluationRecommendation = 'apply' | 'consider' | 'not_yet' | 'dont_apply'

export interface EvaluationDimensions {
  role_match: EvaluationScore
  skills_alignment: EvaluationScore
  experience_level: EvaluationScore
  growth_trajectory: EvaluationScore
  culture_fit: EvaluationScore
  compensation: EvaluationScore
  location_fit: EvaluationScore
  company_stage: EvaluationScore
  role_impact: EvaluationScore
  long_term_value: EvaluationScore
  visa_feasibility?: EvaluationScore // only when requiresVisaSponsorship = true
}

export interface GapItem {
  dimension: keyof EvaluationDimensions
  score: EvaluationScore
  gap: string              // what is missing or misaligned
  guidance: string         // specific actionable steps
  estimatedTimeToClose: string | null
}

export interface SimilarRole {
  title: string
  reason: string
  suggestedSocCode?: string
}

export interface GapReport {
  gaps: GapItem[]
  strengths: string[]
  similarRolesToSearch: string[]
  visaAlternatives?: VisaAlternative[]
  growthRoadmap?: GrowthRoadmapItem[] // Pro + Global only
}

export interface VisaAlternative {
  socCode: string
  socTitle: string
  reason: string
  visaRoute: string
}

export interface GrowthRoadmapItem {
  timeframe: string
  milestone: string
  actions: string[]
}

export interface Evaluation {
  id: string
  userId: string
  jobUrl: string | null
  jobTitle: string
  company: string
  jobDescriptionText: string
  scores: EvaluationDimensions
  overallScore: EvaluationScore
  grade: EvaluationGrade
  recommendation: EvaluationRecommendation
  gapReport: GapReport | null
  reasoning: string
  createdAt: string
  updatedAt: string
  // visa context snapshot
  visaCheckId: string | null
  requiresVisaSponsorshipAtEval: boolean
}
