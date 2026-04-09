import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Shield, Search, Globe, ChevronRight } from 'lucide-react'
import { SponsorSearch } from '@/components/visa/SponsorSearch'
import type { Metadata } from 'next'
import { LastUpdated } from '@/components/seo/LastUpdated'

// ─── SEO metadata ─────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'UK Visa Sponsor Directory 2026 — Search Licensed Employers | Joberlify',
  description:
    'Search the complete UK Register of Licensed Sponsors — 120,000+ employers authorised by the Home Office to issue Certificates of Sponsorship for Skilled Worker, Global Business Mobility, and Scale-up visas. Updated weekly from GOV.UK.',
  alternates: { canonical: 'https://joberlify.com/sponsors' },
  openGraph: {
    title:       'UK Visa Sponsor Directory 2026 — 120,000+ Licensed Employers | Joberlify',
    description: 'Search every UK employer licensed to sponsor work visas. Filter by city, visa route, and A/B rating. Updated weekly from GOV.UK.',
    url:         'https://joberlify.com/sponsors',
    type:        'website',
  },
}

// ─── Page — PUBLIC (no auth required) ────────────────────────────────────────

export default async function SponsorsPage() {
  const supabase = await createClient()

  // Try to get user profile for "In my areas" feature — not required
  let userTargetLocations: string[] = []
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('target_locations, target_countries')
        .eq('user_id', user.id)
        .maybeSingle()
      if (profile?.target_locations) {
        userTargetLocations = profile.target_locations as string[]
      }
    }
  } catch {
    // Not authenticated — continue without profile data
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">

      {/* ── Hero header ── */}
      <div className="bg-[#0A1628] text-white">
        <div className="max-w-5xl mx-auto px-4 py-14 sm:px-6 sm:py-20">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={16} className="text-[#0EA5E9]" />
            <span className="text-xs font-semibold uppercase tracking-widest text-[#0EA5E9]">
              Sponsor Register
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 max-w-xl">
            Search 120,000+ UK employers licensed to sponsor work visas
          </h1>
          <p className="text-[#FAFAF8]/60 text-base sm:text-lg max-w-2xl leading-relaxed">
            The complete UK Register of Licensed Sponsors — updated weekly from GOV.UK.
            Search by company name, filter by city or region, and check rating before you apply.
          </p>

          {/* Stats strip */}
          <div className="flex flex-wrap gap-6 mt-8 text-sm">
            {[
              { label: 'Licensed sponsors', value: '120,000+' },
              { label: 'Visa routes covered', value: '14' },
              { label: 'Updated', value: 'Weekly' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[#0EA5E9] font-bold text-lg">{value}</p>
                <p className="text-[#FAFAF8]/45 text-xs">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── GEO content block — what is a sponsor licence? ── */}
      <div className="bg-white border-b border-[#E8E4DD]">
        <div className="max-w-5xl mx-auto px-4 py-10 sm:px-6 sm:py-12">
          <div className="prose prose-sm max-w-none text-[#0A1628]/70 space-y-4 leading-relaxed">
            <h2 className="text-base font-bold text-[#0A1628] not-prose">
              What is a UK Sponsor Licence?
            </h2>
            <p className="text-sm">
              A sponsor licence is official permission granted by the UK Home Office that allows an employer to hire
              workers from outside the UK and Ireland on certain immigration routes — most commonly the{' '}
              <strong className="font-semibold text-[#0A1628]">Skilled Worker visa</strong>. To appear on the Register
              of Licensed Sponsors, an organisation must pass a Home Office compliance check and demonstrate that it
              has genuine roles meeting the required skill and salary thresholds. The register is published and
              updated fortnightly at GOV.UK; Joberlify syncs this data weekly so you always see the most recent picture.
            </p>
            <p className="text-sm">
              Every sponsor on the register carries a <strong className="font-semibold text-[#0A1628]">rating</strong>:{' '}
              <strong className="font-semibold text-[#0A1628]">A-rated</strong> sponsors are in good standing and can
              issue new Certificates of Sponsorship (CoS) immediately.{' '}
              <strong className="font-semibold text-[#0A1628]">B-rated</strong> sponsors have been placed on an action
              plan — they cannot issue new CoS until they regain A status, which means a job offer from a B-rated employer
              will not currently lead to a successful visa application. Always check the rating before accepting an offer.
            </p>
            <p className="text-sm">
              Being on the sponsor register is only one part of eligibility. Joberlify&apos;s full visa check also
              verifies that the{' '}
              <strong className="font-semibold text-[#0A1628]">advertised salary meets the going rate</strong> for the
              correct SOC 2020 occupation code, and that the role itself qualifies under the immigration rules — three
              layers of verification in a single click, available on Pro and Global plans.
            </p>
          </div>
        </div>
      </div>

      {/* ── Search + results ── */}
      <div className="max-w-5xl mx-auto px-4 py-10 sm:px-6">

        {/* How it works — brief explainer */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            {
              icon: Search,
              title: 'Search by name or location',
              desc:  'Find any of the 120,000+ employers on the UK sponsor register by company name, city, or region.',
            },
            {
              icon: Shield,
              title: 'Check rating before applying',
              desc:  'A-rated sponsors can issue new Certificates of Sponsorship. B-rated sponsors cannot.',
            },
            {
              icon: Globe,
              title: 'Filter by visa route',
              desc:  'Focus on Skilled Worker, Global Business Mobility, Scale-up, and more.',
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-white rounded-xl border border-[#E8E4DD] px-4 py-4 space-y-1.5"
            >
              <Icon size={16} className="text-[#0EA5E9] mb-2" />
              <p className="text-sm font-semibold text-[#0A1628]">{title}</p>
              <p className="text-xs text-[#0A1628]/55 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Search component */}
        <SponsorSearch
          userTargetLocations={userTargetLocations.length > 0 ? userTargetLocations : undefined}
        />

        {/* ── CTA for unauthenticated users ── */}
        {userTargetLocations.length === 0 && (
          <div className="mt-12 rounded-2xl border border-[#E8E4DD] bg-white p-6 sm:p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#0EA5E9]/10 flex items-center justify-center mx-auto mb-4">
              <Shield size={20} className="text-[#0EA5E9]" />
            </div>
            <h2 className="text-lg font-bold text-[#0A1628] mb-2">
              Check if specific roles are sponsorable
            </h2>
            <p className="text-sm text-[#0A1628]/55 max-w-md mx-auto mb-6 leading-relaxed">
              Sign up to run a full 3-layer eligibility check against your profile — sponsor
              licence, SOC code mapping, and salary threshold — in one click.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0A1628] text-white px-5 py-3 text-sm font-semibold hover:bg-[#0EA5E9] transition-colors"
              >
                Create free account
                <ChevronRight size={15} />
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E8E4DD] bg-white px-5 py-3 text-sm font-medium text-[#0A1628]/60 hover:text-[#0A1628] hover:border-[#0EA5E9]/30 transition-colors"
              >
                Sign in
              </Link>
            </div>
          </div>
        )}

        {/* Footer note */}
        <p className="mt-10 text-xs text-[#0A1628]/30 text-center max-w-2xl mx-auto leading-relaxed">
          Data sourced from the{' '}
          <a
            href="https://www.gov.uk/government/publications/register-of-licensed-sponsors-workers"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-[#0EA5E9] transition-colors"
          >
            GOV.UK Register of Licensed Sponsors
          </a>
          {' '}and updated weekly. For legal advice on visa applications, consult an
          OISC-registered immigration adviser.
        </p>
      </div>
      <LastUpdated date="2026-04-09" />
    </div>
  )
}
