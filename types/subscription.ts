export enum SubscriptionTier {
  Free = 'free',
  Pro = 'pro',
  Global = 'global',
}

export interface SubscriptionLimits {
  evaluationsPerMonth: number | 'unlimited'
  tailoredCvsPerMonth: number | 'unlimited'
  interviewPrep: boolean
  pipelineItems: number | 'unlimited'
  gapReportDepth: 'basic' | 'full' | 'full_with_roadmap'
  ukSponsorBrowse: boolean
  visaEligibilityCheck: boolean
  batchEvaluation: boolean
  sponsorWatch: boolean
}

export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
  [SubscriptionTier.Free]: {
    evaluationsPerMonth: 3,
    tailoredCvsPerMonth: 0,
    interviewPrep: false,
    pipelineItems: 10,
    gapReportDepth: 'basic',
    ukSponsorBrowse: true,
    visaEligibilityCheck: false,
    batchEvaluation: false,
    sponsorWatch: false,
  },
  [SubscriptionTier.Pro]: {
    evaluationsPerMonth: 30,
    tailoredCvsPerMonth: 10,
    interviewPrep: true,
    pipelineItems: 'unlimited',
    gapReportDepth: 'full',
    ukSponsorBrowse: true,
    visaEligibilityCheck: true,
    batchEvaluation: false,
    sponsorWatch: false,
  },
  [SubscriptionTier.Global]: {
    evaluationsPerMonth: 'unlimited',
    tailoredCvsPerMonth: 'unlimited',
    interviewPrep: true,
    pipelineItems: 'unlimited',
    gapReportDepth: 'full_with_roadmap',
    ukSponsorBrowse: true,
    visaEligibilityCheck: true,
    batchEvaluation: true,
    sponsorWatch: true,
  },
}
