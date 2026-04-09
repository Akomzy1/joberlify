import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSubscription } from '@/lib/stripe/helpers'
import { SUBSCRIPTION_LIMITS } from '@/types/subscription'

export const runtime = 'nodejs'

/** GET /api/billing/subscription — return current subscription status and limits */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const subscription = await getSubscription(user.id, supabase)
  const limits = SUBSCRIPTION_LIMITS[subscription.tier]

  return NextResponse.json({
    data: {
      ...subscription,
      limits,
    },
  })
}
