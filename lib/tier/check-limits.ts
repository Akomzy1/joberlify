/**
 * Tier limit helpers.
 *
 * Each function accepts an authenticated Supabase server client and returns
 * a structured result rather than throwing, so callers decide how to surface
 * the gate (403 response, modal, etc.).
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { SUBSCRIPTION_LIMITS, SubscriptionTier } from '@/types/subscription'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface LimitCheckResult {
  allowed: boolean
  used: number
  limit: number | 'unlimited'
  tier: SubscriptionTier
  upgradeMessage?: string
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function monthStart(): string {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

async function fetchTier(userId: string, supabase: SupabaseClient): Promise<SubscriptionTier> {
  const { data } = await supabase
    .from('users')
    .select('subscription_tier')
    .eq('id', userId)
    .single()
  return (data?.subscription_tier ?? 'free') as SubscriptionTier
}

// ─── checkEvaluationLimit ─────────────────────────────────────────────────────

/**
 * How many evaluations has this user run this calendar month, and are they
 * allowed to run another one?
 */
export async function checkEvaluationLimit(
  userId: string,
  supabase: SupabaseClient,
): Promise<LimitCheckResult> {
  const tier = await fetchTier(userId, supabase)
  const limits = SUBSCRIPTION_LIMITS[tier]
  const limit = limits.evaluationsPerMonth

  if (limit === 'unlimited') {
    return { allowed: true, used: 0, limit, tier }
  }

  const { count } = await supabase
    .from('evaluations')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', monthStart())

  const used = count ?? 0
  const allowed = used < limit

  const upgradeMessage = allowed
    ? undefined
    : tier === 'free'
    ? `You have used all ${limit} free evaluations this month. Upgrade to Pro for 30/month.`
    : tier === 'pro'
    ? `You have used all ${limit} Pro evaluations this month. Upgrade to Global for unlimited.`
    : 'Monthly evaluation limit reached. Contact support.'

  return { allowed, used, limit, tier, upgradeMessage }
}

// ─── checkCvLimit ─────────────────────────────────────────────────────────────

/**
 * How many tailored CVs has this user generated this calendar month?
 */
export async function checkCvLimit(
  userId: string,
  supabase: SupabaseClient,
): Promise<LimitCheckResult> {
  const tier = await fetchTier(userId, supabase)
  const limits = SUBSCRIPTION_LIMITS[tier]
  const limit = limits.tailoredCvsPerMonth

  if (limit === 0) {
    return {
      allowed: false,
      used: 0,
      limit,
      tier,
      upgradeMessage: 'CV generation requires a Pro or Global subscription.',
    }
  }

  if (limit === 'unlimited') {
    return { allowed: true, used: 0, limit, tier }
  }

  const { count } = await supabase
    .from('generated_cvs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', monthStart())

  const used = count ?? 0
  const allowed = used < limit

  const upgradeMessage = allowed
    ? undefined
    : `You have used all ${limit} CV generations this month. Upgrade to Global for unlimited.`

  return { allowed, used, limit, tier, upgradeMessage }
}

// ─── checkPipelineLimit ───────────────────────────────────────────────────────

/**
 * How many pipeline items does this user have (total, not monthly)?
 */
export async function checkPipelineLimit(
  userId: string,
  supabase: SupabaseClient,
): Promise<LimitCheckResult> {
  const tier = await fetchTier(userId, supabase)
  const limits = SUBSCRIPTION_LIMITS[tier]
  const limit = limits.pipelineItems

  if (limit === 'unlimited') {
    return { allowed: true, used: 0, limit, tier }
  }

  const { count } = await supabase
    .from('pipeline_items')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  const used = count ?? 0
  const allowed = used < limit

  const upgradeMessage = allowed
    ? undefined
    : `Free plan is limited to ${limit} pipeline items. Upgrade to Pro for unlimited tracking.`

  return { allowed, used, limit, tier, upgradeMessage }
}
