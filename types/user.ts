import { SubscriptionTier } from './subscription'

export interface User {
  id: string
  email: string
  createdAt: string
  updatedAt: string
  subscriptionTier: SubscriptionTier
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  subscriptionStatus: 'active' | 'canceled' | 'past_due' | 'trialing' | null
  evaluationsUsedThisMonth: number
  cvsGeneratedThisMonth: number
  pipelineCount: number
}

export interface CvContactDetails {
  name: string | null
  email: string | null
  phone: string | null
  location: string | null
}

export interface CvJobHistory {
  title: string
  company: string
  startDate: string | null   // ISO date string or free text e.g. "Jan 2020"
  endDate: string | null     // null = current role
  isCurrent: boolean
  duties: string[]
  achievements: string[]
  employmentType: 'permanent' | 'contract' | 'freelance' | 'internship' | 'other' | null
}

export interface CvQualification {
  degree: string
  institution: string
  year: number | null
  field: string | null
}

export interface CvCertification {
  name: string
  issuer: string | null
  year: number | null
}

export interface CvParsedData {
  contactDetails: CvContactDetails
  careerSummary: string        // AI-generated narrative, 2–4 sentences
  jobHistory: CvJobHistory[]
  skills: string[]
  qualifications: CvQualification[]
  certifications: CvCertification[]
  languages: string[]
  totalExperienceYears: number | null
  currentTitle: string | null  // derived from most recent role
  currentCompany: string | null
  educationLevel: 'rqf3' | 'rqf4' | 'rqf5' | 'rqf6' | 'rqf7' | 'rqf8' | null
  rawText: string              // preserved for re-parsing
  parseWarnings: string[]      // e.g. "Non-English content detected", "Employment gap: 2019–2021"
}

// Legacy alias kept for backward compatibility
export type WorkHistoryEntry = CvJobHistory

export type RemotePreference = 'onsite_only' | 'hybrid' | 'remote_only' | 'open'

export interface TargetLocation {
  country: string   // ISO country code e.g. 'GB'
  cities: string[]  // empty when anywhere = true
  anywhere: boolean // true = no city restriction within this country
}

export interface UserProfile {
  id: string
  userId: string
  fullName: string | null
  nationality: string | null
  currentCountry: string | null
  currentCity: string | null
  targetCountries: string[]
  targetLocations: TargetLocation[]
  remotePreference: RemotePreference
  willingnessToRelocate: boolean
  maxCommuteMiles: number | null
  requiresVisaSponsorship: boolean
  currentVisaStatus: string | null
  preferredJobTypes: ('full_time' | 'part_time' | 'contract' | 'freelance')[]
  preferredSalaryMin: number | null
  preferredSalaryCurrency: string | null
  cvParsedData: CvParsedData | null
  cvUploadedAt: string | null
  cvFileUrl: string | null
  skills: string[]
  qualifications: string[]
  linkedinUrl: string | null
  createdAt: string
  updatedAt: string
}
