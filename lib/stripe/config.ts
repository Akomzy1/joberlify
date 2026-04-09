/**
 * Stripe billing configuration for Joberlify.
 *
 * Product IDs and price IDs live in lib/stripe/client.ts.
 * This file owns the feature matrix used by the pricing page and
 * upgrade-gate components.
 */

import type { SubscriptionTier } from '@/types/subscription'

// ─── Tier display config ───────────────────────────────────────────────────────

export interface TierDisplayConfig {
  tier: SubscriptionTier
  label: string
  /** Monthly price in USD cents */
  priceCents: number
  pricingNote: string
  badge: string | null
  /** Tailwind bg class for the card */
  cardBg: string
  /** Tailwind text class for card body text */
  cardText: string
  /** Stripe price ID env key */
  priceIdKey: keyof typeof STRIPE_PRICE_ENV_KEYS
  ctaLabel: string
  highlighted: boolean
}

export const STRIPE_PRICE_ENV_KEYS = {
  pro: 'NEXT_PUBLIC_STRIPE_PRO_PRICE_ID',
  global: 'NEXT_PUBLIC_STRIPE_GLOBAL_PRICE_ID',
  sponsorWatch: 'NEXT_PUBLIC_STRIPE_SPONSOR_WATCH_PRICE_ID',
} as const

export const TIER_DISPLAY: Record<string, TierDisplayConfig> = {
  free: {
    tier: 'free' as SubscriptionTier,
    label: 'Free',
    priceCents: 0,
    pricingNote: 'No credit card required',
    badge: null,
    cardBg: '#FAFAF8',
    cardText: '#0A1628',
    priceIdKey: 'pro', // unused for free but satisfies type
    ctaLabel: 'Start Free',
    highlighted: false,
  },
  pro: {
    tier: 'pro' as SubscriptionTier,
    label: 'Pro',
    priceCents: 1799,
    pricingNote: 'per month, billed monthly',
    badge: 'Most Popular',
    cardBg: '#1E3A5F',
    cardText: '#FAFAF8',
    priceIdKey: 'pro',
    ctaLabel: 'Upgrade to Pro',
    highlighted: true,
  },
  global: {
    tier: 'global' as SubscriptionTier,
    label: 'Global',
    priceCents: 3499,
    pricingNote: 'per month, billed monthly',
    badge: 'Best Value',
    cardBg: '#0A1628',
    cardText: '#FAFAF8',
    priceIdKey: 'global',
    ctaLabel: 'Upgrade to Global',
    highlighted: false,
  },
}

// ─── Feature matrix ────────────────────────────────────────────────────────────

export type FeatureValue = boolean | string | null

export interface FeatureRow {
  /** Display label */
  label: string
  /** Optional tooltip / explanation */
  description?: string
  free: FeatureValue
  pro: FeatureValue
  global: FeatureValue
  /** If true, render a section divider above this row */
  sectionStart?: string
}

export const FEATURE_MATRIX: FeatureRow[] = [
  // ── Evaluations ──────────────────────────────────────────────────────────────
  {
    label: 'Job evaluations per month',
    description: '10-dimension AI scoring against your CV and preferences.',
    free: '3',
    pro: '30',
    global: 'Unlimited',
    sectionStart: 'Evaluations',
  },
  {
    label: 'Full gap report',
    description: 'Detailed per-dimension gap analysis with actionable guidance.',
    free: 'Basic',
    pro: true,
    global: true,
  },
  {
    label: 'Growth roadmap',
    description: 'Personalised upskilling roadmap to close qualification gaps.',
    free: false,
    pro: false,
    global: true,
  },

  // ── CV & Applications ─────────────────────────────────────────────────────────
  {
    label: 'Tailored CV generation per month',
    description: 'AI-written CV tailored to a specific job description.',
    free: false,
    pro: '10',
    global: 'Unlimited',
    sectionStart: 'CV & Applications',
  },
  {
    label: 'Interview preparation',
    description: 'STAR stories, likely questions, and company brief.',
    free: false,
    pro: true,
    global: true,
  },
  {
    label: 'Pipeline tracker',
    description: 'Kanban and list view for tracking applications.',
    free: '10 items',
    pro: 'Unlimited',
    global: 'Unlimited',
  },

  // ── Visa & Sponsorship ────────────────────────────────────────────────────────
  {
    label: 'UK sponsor database browse',
    description: '90,000+ licensed sponsors, searchable by name and location.',
    free: true,
    pro: true,
    global: true,
    sectionStart: 'Visa & Sponsorship',
  },
  {
    label: 'Visa eligibility check',
    description: 'SOC-code classification + salary threshold check.',
    free: false,
    pro: true,
    global: true,
  },
  {
    label: 'Sponsor Watch alerts',
    description: 'Instant notification when a target company gains or loses sponsor status.',
    free: false,
    pro: false,
    global: true,
  },

  // ── Power features ────────────────────────────────────────────────────────────
  {
    label: 'Batch evaluation',
    description: 'Evaluate multiple jobs in a single upload.',
    free: false,
    pro: false,
    global: true,
    sectionStart: 'Power Features',
  },
  {
    label: 'Priority support',
    description: 'Direct email support with 24-hour response guarantee.',
    free: false,
    pro: false,
    global: true,
  },
]

// ─── Sponsor Watch add-on config ────────────────────────────────────────────────

export const SPONSOR_WATCH_ADDON = {
  label: 'Sponsor Watch',
  priceCents: 499,
  description:
    'Real-time alerts when any company on your watchlist gains or loses UK Skilled Worker sponsorship status. Included free in Global.',
} as const
