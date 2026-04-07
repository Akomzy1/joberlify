// ─── UK Sponsor Register ──────────────────────────────────────────────────────

export type SponsorRating = 'A' | 'B'

export type SponsorVisaRoute =
  | 'Skilled Worker'
  | 'Global Business Mobility'
  | 'Scale-up'
  | 'Senior or Specialist Worker'
  | 'Graduate Trainee'
  | 'UK Expansion Worker'
  | 'Service Supplier'
  | 'Secondment Worker'
  | 'International Sportsperson'
  | 'Charity Worker'
  | 'Religious Worker'
  | 'Creative Worker'
  | 'Seasonal Worker'
  | 'Student'

export interface UkSponsor {
  id: string
  organisationName: string
  townCity: string | null
  county: string | null
  typeAndRating: string // raw field from CSV
  route: SponsorVisaRoute
  rating: SponsorRating
  isActive: boolean
  lastSeenAt: string
  createdAt: string
}

export interface SponsorChange {
  id: string
  sponsorId: string
  changeType: 'added' | 'removed' | 'rating_changed' | 'route_changed'
  previousValue: string | null
  newValue: string | null
  detectedAt: string
}

export interface SponsorWatch {
  id: string
  userId: string
  pipelineItemId: string
  sponsorId: string
  organisationName: string
  createdAt: string
  lastAlertedAt: string | null
}

// ─── SOC Codes ───────────────────────────────────────────────────────────────

export type SocEligibilityTable = 'table1' | 'table2' | 'table3' | 'table6'

export interface UkSocCode {
  code: string // e.g. "2135"
  title: string
  eligibilityTable: SocEligibilityTable
  rqfLevel: number // 3–8
  goingRateAnnual: number // GBP
  goingRateHourly: number | null
  isOnTemporaryShortageList: boolean
  tslExpiresAt: string | null // ISO date
  conditions: string | null
  notes: string | null
}

// ─── Visa Check ───────────────────────────────────────────────────────────────

export type VisaVerdict =
  | 'confirmed'  // licensed + SOC eligible + salary meets threshold + listing mentions sponsorship
  | 'likely'     // licensed + eligible + salary ok, listing doesn't mention sponsorship
  | 'uncertain'  // licensed but SOC borderline or salary unclear
  | 'unlikely'   // not on register, or SOC ineligible, or salary below threshold
  | 'blocked'    // definitively ineligible (Table 6 / no entry clearance)

export interface SponsorLicenceCheck {
  found: boolean
  sponsor: UkSponsor | null
  fuzzyMatchScore: number | null
  isArated: boolean
  hasCorrectRoute: boolean
}

export interface SocEligibilityCheck {
  detectedSocCode: string | null
  detectedSocTitle: string | null
  matchedSocCode: UkSocCode | null
  confidence: 'high' | 'medium' | 'low'
  isEligible: boolean
  requiresTsl: boolean
  tslExpiry: string | null
  matchedOnDuties: boolean // always true — never match on title alone
}

export interface SalaryCheck {
  advertisedSalary: number | null
  currency: string | null
  generalThreshold: number
  goingRate: number | null
  effectiveMinimum: number
  meetsThreshold: boolean | null // null if salary not advertised
  isNewEntrantRate: boolean
}

export interface VisaCheck {
  id: string
  evaluationId: string | null
  jobTitle: string
  company: string
  jobDescriptionText: string
  sponsorLicenceCheck: SponsorLicenceCheck
  socEligibilityCheck: SocEligibilityCheck
  salaryCheck: SalaryCheck
  verdict: VisaVerdict
  disclaimer: string
  sponsorDataLastUpdatedAt: string
  eligibilityRulesLastVerifiedAt: string
  createdAt: string
}
