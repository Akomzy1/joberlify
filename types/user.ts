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

export interface CvParsedData {
  rawText: string
  skills: string[]
  qualifications: string[]
  experienceYears: number | null
  currentTitle: string | null
  currentCompany: string | null
  educationLevel: 'rqf3' | 'rqf4' | 'rqf5' | 'rqf6' | 'rqf7' | 'rqf8' | null
  languages: string[]
  summary: string | null
  workHistory: WorkHistoryEntry[]
}

export interface WorkHistoryEntry {
  title: string
  company: string
  startDate: string | null
  endDate: string | null
  isCurrent: boolean
  description: string
}

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
