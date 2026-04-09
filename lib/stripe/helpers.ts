/**
 * Stripe helper functions used by billing API routes.
 * All functions accept a server-side Supabase client so they can be
 * called from within existing route auth flows without re-fetching the user.
 */

import { stripe, STRIPE_PRICES } from './client'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { SubscriptionTier } from '@/types/subscription'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface CheckoutSessionResult {
  url: string
  sessionId: string
}

export interface SubscriptionStatus {
  tier: SubscriptionTier
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  stripeSubscriptionStatus: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}

// ─── createCheckoutSession ─────────────────────────────────────────────────────

/**
 * Creates a Stripe Checkout session for the given user and price.
 * Creates a Stripe Customer record if one does not yet exist.
 *
 * @param userId         Supabase user ID
 * @param userEmail      User's email address (used to pre-fill checkout)
 * @param priceId        Stripe Price ID to subscribe to
 * @param supabase       Authenticated Supabase server client
 */
export async function createCheckoutSession(
  userId: string,
  userEmail: string,
  priceId: string,
  supabase: SupabaseClient,
): Promise<CheckoutSessionResult> {
  // Retrieve existing Stripe customer ID from our DB
  const { data: userRow } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single()

  let customerId: string = userRow?.stripe_customer_id ?? ''

  // Create customer if we don't have one yet
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: userEmail,
      metadata: { supabase_user_id: userId },
    })
    customerId = customer.id

    // Persist immediately so we don't create duplicates on retries
    await supabase
      .from('users')
      .update({ stripe_customer_id: customerId })
      .eq('id', userId)
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: `${APP_URL}/settings?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}/pricing?checkout=cancelled`,
    allow_promotion_codes: true,
    metadata: {
      supabase_user_id: userId,
    },
    subscription_data: {
      metadata: {
        supabase_user_id: userId,
      },
    },
  })

  return { url: session.url!, sessionId: session.id }
}

// ─── createCustomerPortalSession ──────────────────────────────────────────────

/**
 * Creates a Stripe Customer Portal session so the user can manage their
 * subscription, update payment method, or cancel.
 */
export async function createCustomerPortalSession(
  customerId: string,
  returnPath = '/settings',
): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${APP_URL}${returnPath}`,
  })
  return session.url
}

// ─── getSubscription ──────────────────────────────────────────────────────────

/**
 * Returns the current subscription status for a user.
 * Reads primarily from our DB; optionally cross-checks Stripe for live status.
 */
export async function getSubscription(
  userId: string,
  supabase: SupabaseClient,
): Promise<SubscriptionStatus> {
  const { data } = await supabase
    .from('users')
    .select(
      'subscription_tier, stripe_customer_id, stripe_subscription_id, stripe_subscription_status, stripe_current_period_end, stripe_cancel_at_period_end',
    )
    .eq('id', userId)
    .single()

  if (!data) {
    return {
      tier: 'free' as SubscriptionTier,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      stripeSubscriptionStatus: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    }
  }

  return {
    tier: (data.subscription_tier ?? 'free') as SubscriptionTier,
    stripeCustomerId: data.stripe_customer_id ?? null,
    stripeSubscriptionId: data.stripe_subscription_id ?? null,
    stripeSubscriptionStatus: data.stripe_subscription_status ?? null,
    currentPeriodEnd: data.stripe_current_period_end ?? null,
    cancelAtPeriodEnd: data.stripe_cancel_at_period_end ?? false,
  }
}

// ─── tierFromPriceId ─────────────────────────────────────────────────────────

/**
 * Maps a Stripe price ID to a Joberlify subscription tier.
 * Returns 'free' for unknown price IDs.
 */
export function tierFromPriceId(priceId: string): SubscriptionTier {
  if (priceId === STRIPE_PRICES.global) return 'global' as SubscriptionTier
  if (priceId === STRIPE_PRICES.pro) return 'pro' as SubscriptionTier
  return 'free' as SubscriptionTier
}
