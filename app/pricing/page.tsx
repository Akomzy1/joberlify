import type { Metadata } from 'next'
import { PricingClient } from './PricingClient'
import { LastUpdated } from '@/components/seo/LastUpdated'

export const metadata: Metadata = {
  title: 'Pricing — Free, Pro & Global Plans | AI Job Search',
  description:
    'Start free with 3 AI evaluations per month. Upgrade to Pro ($17.99/mo) for CV generation and visa checks, or Global ($34.99/mo) for unlimited everything. No hidden fees.',
  alternates: { canonical: 'https://joberlify.com/pricing' },
  openGraph: {
    title:       'Joberlify Pricing — Free, Pro & Global Plans',
    description: 'Honest, transparent pricing for AI-powered job search. Start free — upgrade when you are ready.',
    url:         'https://joberlify.com/pricing',
    type:        'website',
  },
}

export default function PricingPage() {
  return (
    <>
      <PricingClient />
      <LastUpdated date="2026-04-09" />
    </>
  )
}
