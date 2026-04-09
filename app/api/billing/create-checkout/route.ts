import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession } from '@/lib/stripe/helpers'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { priceId: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { priceId } = body
  if (!priceId?.trim()) {
    return NextResponse.json({ error: 'priceId is required' }, { status: 400 })
  }

  try {
    const { url } = await createCheckoutSession(user.id, user.email!, priceId, supabase)
    return NextResponse.json({ url })
  } catch (err) {
    console.error('[billing/create-checkout] Stripe error:', err)
    return NextResponse.json({ error: 'Failed to create checkout session.' }, { status: 500 })
  }
}
