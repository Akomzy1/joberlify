'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, ChevronDown, Zap, Globe, Shield } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { FEATURE_MATRIX, SPONSOR_WATCH_ADDON } from '@/lib/stripe/config'

// ─── Price IDs (public env vars — safe to expose) ────────────────────────────

const PRICE_IDS = {
  pro: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? '',
  global: process.env.NEXT_PUBLIC_STRIPE_GLOBAL_PRICE_ID ?? '',
}

// ─── Tier data ────────────────────────────────────────────────────────────────

const TIERS = [
  {
    key: 'free',
    label: 'Free',
    price: '$0',
    period: null,
    sub: 'No credit card required',
    badge: null,
    icon: Shield,
    priceId: null,
    bg: '#FAFAF8',
    border: '#E8E4DD',
    text: '#0A1628',
    muted: '#0A162870',
    ctaLabel: 'Start Free',
    ctaBg: '#E8E4DD',
    ctaText: '#0A1628',
    ctaHover: '#d4cfc8',
  },
  {
    key: 'pro',
    label: 'Pro',
    price: '$17.99',
    period: '/month',
    sub: 'Billed monthly, cancel anytime',
    badge: 'Most Popular',
    icon: Zap,
    priceId: PRICE_IDS.pro,
    bg: '#1E3A5F',
    border: '#0EA5E9',
    text: '#FAFAF8',
    muted: '#FAFAF8AA',
    ctaLabel: 'Upgrade to Pro',
    ctaBg: '#0EA5E9',
    ctaText: '#fff',
    ctaHover: '#0284C7',
  },
  {
    key: 'global',
    label: 'Global',
    price: '$34.99',
    period: '/month',
    sub: 'Billed monthly, cancel anytime',
    badge: 'Best Value',
    icon: Globe,
    priceId: PRICE_IDS.global,
    bg: '#0A1628',
    border: '#E8E4DD33',
    text: '#FAFAF8',
    muted: '#FAFAF880',
    ctaLabel: 'Upgrade to Global',
    ctaBg: '#FAFAF8',
    ctaText: '#0A1628',
    ctaHover: '#F5F3EF',
  },
] as const

// ─── CTA button ───────────────────────────────────────────────────────────────

function TierCTA({ tier }: { tier: (typeof TIERS)[number] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (!tier.priceId) {
      router.push('/auth/sign-up')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/billing/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: tier.priceId }),
      })

      if (res.status === 401) {
        router.push(`/auth/sign-in?redirect=/pricing`)
        return
      }

      const json = await res.json()
      if (json.url) {
        window.location.href = json.url
      }
    } catch {
      // silently fail — user stays on page
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="w-full py-2.5 rounded-[8px] text-sm font-semibold transition-colors disabled:opacity-60"
      style={{
        background: tier.ctaBg,
        color: tier.ctaText,
      }}
      onMouseEnter={(e) => { (e.currentTarget.style.background = tier.ctaHover) }}
      onMouseLeave={(e) => { (e.currentTarget.style.background = tier.ctaBg) }}
    >
      {loading ? 'Redirecting…' : tier.ctaLabel}
    </button>
  )
}

// ─── Feature value cell ───────────────────────────────────────────────────────

function FeatureCell({ value, textColor }: { value: string | boolean | null; textColor: string }) {
  if (value === true)  return <Check size={16} color="#22C55E" strokeWidth={2.5} />
  if (value === false || value === null) return <X size={14} color={textColor + '50'} strokeWidth={2} />
  return <span className="text-xs font-medium tabular-nums" style={{ color: textColor }}>{value}</span>
}

// ─── FAQ accordion ────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    q: 'Can I switch plans at any time?',
    a: 'Yes. Upgrades take effect immediately; downgrades apply at the end of your current billing period. You never lose access to content you have already created.',
  },
  {
    q: 'What counts as an evaluation?',
    a: 'Each job you submit for AI scoring counts as one evaluation. Viewing or re-reading a previous evaluation does not count toward your monthly limit.',
  },
  {
    q: 'Do unused evaluations roll over?',
    a: 'No — limits reset on the first day of each calendar month. This keeps pricing fair for all users.',
  },
  {
    q: 'What is the UK Sponsor Watch add-on?',
    a: `Sponsor Watch monitors the UK Home Office register on your behalf and sends you an email the moment a company you are targeting gains or loses its Skilled Worker sponsorship licence. It is included in the Global plan, or available as a $${(SPONSOR_WATCH_ADDON.priceCents / 100).toFixed(2)}/month add-on.`,
  },
  {
    q: 'Is my CV data stored securely?',
    a: 'Your CV and profile data are stored encrypted in our EU-hosted database. We never share your data with employers or third parties. You can delete your account and all associated data at any time from Settings.',
  },
  {
    q: 'Do you offer refunds?',
    a: 'If you are unsatisfied within the first 7 days of a paid plan, contact us and we will issue a full refund — no questions asked.',
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-[#E8E4DD] last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-0 py-4 text-left group"
      >
        <span className="text-sm font-semibold text-[#0A1628] group-hover:text-[#1E3A5F] transition-colors">
          {q}
        </span>
        <ChevronDown
          size={16}
          className="text-[#0A1628]/40 flex-shrink-0 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : undefined }}
        />
      </button>
      {open && (
        <p className="pb-4 text-sm text-[#0A1628]/60 leading-relaxed">
          {a}
        </p>
      )}
    </div>
  )
}

// ─── Pricing cards ────────────────────────────────────────────────────────────

function PricingCard({ tier }: { tier: (typeof TIERS)[number] }) {
  const Icon = tier.icon
  return (
    <div
      className="relative flex flex-col rounded-[12px] p-6 border"
      style={{
        background: tier.bg,
        borderColor: tier.border,
        boxShadow: tier.key === 'pro'
          ? '0 0 0 2px #0EA5E9, 0 8px 40px rgba(14,165,233,0.15)'
          : '0 2px 12px rgba(10,22,40,0.06)',
      }}
    >
      {/* Badge */}
      {tier.badge && (
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap"
          style={{
            background: tier.key === 'pro' ? '#0EA5E9' : '#E8E4DD',
            color: tier.key === 'pro' ? '#fff' : '#0A1628',
          }}
        >
          {tier.badge}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Icon size={16} style={{ color: tier.key === 'pro' ? '#0EA5E9' : tier.muted }} />
        <span
          className="text-xs font-bold uppercase tracking-[0.1em]"
          style={{ fontFamily: 'var(--font-family-display)', color: tier.muted }}
        >
          {tier.label}
        </span>
      </div>

      {/* Price */}
      <div className="mb-1">
        <span
          className="text-4xl font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-family-display)', color: tier.text }}
        >
          {tier.price}
        </span>
        {tier.period && (
          <span className="text-sm ml-1" style={{ color: tier.muted }}>
            {tier.period}
          </span>
        )}
      </div>
      <p className="text-xs mb-6" style={{ color: tier.muted }}>
        {tier.sub}
      </p>

      {/* CTA */}
      <TierCTA tier={tier} />

      {/* Divider */}
      <div className="my-5 border-t" style={{ borderColor: tier.border }} />

      {/* Included features — short list */}
      <ul className="space-y-2.5 flex-1">
        {FEATURE_MATRIX.filter((f) => {
          const v = f[tier.key as 'free' | 'pro' | 'global']
          return v !== false && v !== null
        }).map((f) => {
          const v = f[tier.key as 'free' | 'pro' | 'global']
          return (
            <li key={f.label} className="flex items-start gap-2">
              <Check size={14} className="flex-shrink-0 mt-0.5" style={{ color: '#22C55E' }} />
              <span className="text-xs leading-snug" style={{ color: tier.text }}>
                {v === true ? f.label : `${f.label}: ${v}`}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// ─── Feature comparison table ─────────────────────────────────────────────────

function FeatureTable() {
  // Group rows by sectionStart
  const sections: { title: string; rows: typeof FEATURE_MATRIX }[] = []
  let current: (typeof sections)[number] | null = null

  for (const row of FEATURE_MATRIX) {
    if (row.sectionStart) {
      current = { title: row.sectionStart, rows: [row] }
      sections.push(current)
    } else if (current) {
      current.rows.push(row)
    }
  }

  const COL_TEXT = ['#0A1628', '#FAFAF8', '#FAFAF8']
  const COL_BG   = ['#FAFAF8', '#1E3A5F', '#0A1628']

  return (
    <div className="overflow-x-auto rounded-[12px] border border-[#E8E4DD]">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr>
            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#0A1628]/40 bg-[#FAFAF8] w-[40%]">
              Feature
            </th>
            {TIERS.map((t, i) => (
              <th
                key={t.key}
                className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider w-[20%]"
                style={{
                  background: COL_BG[i],
                  color: COL_TEXT[i],
                  fontFamily: 'var(--font-family-display)',
                }}
              >
                {t.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sections.map((section) => (
            <>
              <tr key={`section-${section.title}`}>
                <td
                  colSpan={4}
                  className="px-5 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#0A1628]/35 bg-[#F5F3EF]"
                  style={{ fontFamily: 'var(--font-family-display)' }}
                >
                  {section.title}
                </td>
              </tr>
              {section.rows.map((row, ri) => (
                <tr
                  key={row.label}
                  className={cn(
                    'border-t border-[#E8E4DD]',
                    ri % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]',
                  )}
                >
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium text-[#0A1628]">{row.label}</p>
                    {row.description && (
                      <p className="text-xs text-[#0A1628]/40 mt-0.5 leading-tight">{row.description}</p>
                    )}
                  </td>
                  {(['free', 'pro', 'global'] as const).map((tier, i) => (
                    <td
                      key={tier}
                      className="px-4 py-3 text-center"
                      style={{ background: `${COL_BG[i]}18` }}
                    >
                      <div className="flex justify-center">
                        <FeatureCell value={row[tier]} textColor={COL_TEXT[i]} />
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PricingClient() {
  return (
    <div className="bg-[#FAFAF8] min-h-screen">

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section className="bg-[#0A1628] pt-16 pb-24 px-4 text-center relative overflow-hidden">
        {/* Subtle grid texture */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(#FAFAF8 1px, transparent 1px), linear-gradient(90deg, #FAFAF8 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative max-w-2xl mx-auto">
          <div
            className="inline-block mb-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border"
            style={{
              borderColor: '#0EA5E9',
              color: '#0EA5E9',
              fontFamily: 'var(--font-family-display)',
            }}
          >
            Pricing
          </div>
          <h1
            className="text-4xl sm:text-5xl font-bold text-[#FAFAF8] mb-4 leading-tight"
            style={{ fontFamily: 'var(--font-family-display)' }}
          >
            Pricing that moves<br className="sm:hidden" /> with you
          </h1>
          <p className="text-base text-[#FAFAF8]/55 max-w-lg mx-auto leading-relaxed">
            Start free. Upgrade when you are ready. No contracts, no surprises —
            just the intelligence you need to find the right role, anywhere in the world.
          </p>
        </div>
      </section>

      {/* ── Pricing cards ─────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 -mt-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {TIERS.map((tier) => (
            <PricingCard key={tier.key} tier={tier} />
          ))}
        </div>
      </section>

      {/* ── Sponsor Watch callout ─────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 mt-6">
        <div
          className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-[12px] border px-6 py-5"
          style={{ background: '#F5F3EF', borderColor: '#E8E4DD' }}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-xs font-bold uppercase tracking-widest text-[#0A1628]"
                style={{ fontFamily: 'var(--font-family-display)' }}
              >
                Sponsor Watch Add-on
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0EA5E9]/12 text-[#0EA5E9] font-semibold">
                Pro only · ${(SPONSOR_WATCH_ADDON.priceCents / 100).toFixed(2)}/mo
              </span>
            </div>
            <p className="text-xs text-[#0A1628]/55 leading-relaxed max-w-xl">
              {SPONSOR_WATCH_ADDON.description}{' '}
              <span className="font-medium text-[#0A1628]/80">Included free with Global.</span>
            </p>
          </div>
          <a
            href="/sponsors"
            className="flex-shrink-0 text-xs font-semibold text-[#0EA5E9] hover:underline whitespace-nowrap"
          >
            Browse sponsor register →
          </a>
        </div>
      </section>

      {/* ── Feature comparison table ──────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 mt-16 mb-4">
        <h2
          className="text-2xl font-bold text-[#0A1628] mb-2"
          style={{ fontFamily: 'var(--font-family-display)' }}
        >
          Compare plans
        </h2>
        <p className="text-sm text-[#0A1628]/50 mb-6">
          Everything included in each tier, side by side.
        </p>
        <FeatureTable />
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────────── */}
      <section className="max-w-2xl mx-auto px-4 mt-16 mb-24">
        <h2
          className="text-2xl font-bold text-[#0A1628] mb-8"
          style={{ fontFamily: 'var(--font-family-display)' }}
        >
          Frequently asked questions
        </h2>

        <div className="rounded-[12px] border border-[#E8E4DD] bg-white px-6 py-2">
          {FAQ_ITEMS.map((item) => (
            <FaqItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <p className="text-sm text-[#0A1628]/45 mb-4">
            Still have questions? We&apos;re happy to help.
          </p>
          <a
            href="mailto:hello@joberlify.com"
            className="inline-block text-sm font-semibold text-[#0EA5E9] hover:underline"
          >
            Contact support →
          </a>
        </div>
      </section>
    </div>
  )
}
