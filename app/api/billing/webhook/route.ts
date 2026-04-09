import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { tierFromPriceId } from '@/lib/stripe/helpers'
import { createClient } from '@/lib/supabase/server'
import type Stripe from 'stripe'

export const runtime = 'nodejs'

// Disable body parsing — Stripe signature verification requires the raw body.
export const dynamic = 'force-dynamic'

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, WEBHOOK_SECRET)
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
  }

  const supabase = await createClient()

  try {
    switch (event.type) {
      // ── Checkout completed → subscription activated ────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break

        const userId = session.metadata?.supabase_user_id
        if (!userId) {
          console.error('[webhook] checkout.session.completed: missing supabase_user_id metadata')
          break
        }

        const subscriptionId = session.subscription as string
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = subscription.items.data[0]?.price.id ?? ''
        const tier = tierFromPriceId(priceId)

        await supabase
          .from('users')
          .update({
            subscription_tier: tier,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscriptionId,
            stripe_subscription_status: subscription.status,
            stripe_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            stripe_cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)

        console.log(`[webhook] checkout.session.completed: user ${userId} upgraded to ${tier}`)
        break
      }

      // ── Subscription updated (plan change, renewal, etc.) ──────────────────
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.supabase_user_id

        if (!userId) {
          // Fall back to looking up by stripe_customer_id
          const customerId = subscription.customer as string
          const { data } = await supabase
            .from('users')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single()

          if (!data) {
            console.error('[webhook] subscription.updated: cannot find user for customer', customerId)
            break
          }

          const priceId = subscription.items.data[0]?.price.id ?? ''
          const tier = tierFromPriceId(priceId)

          await supabase
            .from('users')
            .update({
              subscription_tier: tier,
              stripe_subscription_status: subscription.status,
              stripe_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              stripe_cancel_at_period_end: subscription.cancel_at_period_end,
              updated_at: new Date().toISOString(),
            })
            .eq('id', data.id)

          console.log(`[webhook] subscription.updated: user ${data.id} → tier ${tier} (via customer lookup)`)
          break
        }

        const priceId = subscription.items.data[0]?.price.id ?? ''
        const tier = tierFromPriceId(priceId)

        await supabase
          .from('users')
          .update({
            subscription_tier: tier,
            stripe_subscription_status: subscription.status,
            stripe_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            stripe_cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)

        console.log(`[webhook] subscription.updated: user ${userId} → tier ${tier}`)
        break
      }

      // ── Subscription deleted (cancellation took effect) ────────────────────
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const { data } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!data) {
          console.error('[webhook] subscription.deleted: cannot find user for customer', customerId)
          break
        }

        await supabase
          .from('users')
          .update({
            subscription_tier: 'free',
            stripe_subscription_id: null,
            stripe_subscription_status: 'canceled',
            stripe_current_period_end: null,
            stripe_cancel_at_period_end: false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', data.id)

        console.log(`[webhook] subscription.deleted: user ${data.id} downgraded to free`)
        break
      }

      // ── Payment failed — flag account for follow-up ─────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const { data } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!data) {
          console.error('[webhook] invoice.payment_failed: cannot find user for customer', customerId)
          break
        }

        await supabase
          .from('users')
          .update({
            stripe_subscription_status: 'past_due',
            updated_at: new Date().toISOString(),
          })
          .eq('id', data.id)

        console.warn(`[webhook] invoice.payment_failed: user ${data.id} marked past_due`)
        break
      }

      default:
        // Unhandled event — acknowledged but not processed
        break
    }
  } catch (err) {
    console.error('[webhook] Handler error for event', event.type, err)
    // Return 200 so Stripe does not retry — we log the error for investigation
    return NextResponse.json({ received: true, warning: 'Handler error' })
  }

  return NextResponse.json({ received: true })
}
