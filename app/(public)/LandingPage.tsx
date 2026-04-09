'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import {
  ChevronDown, Link2, Activity, Target,
  FileText, Globe, Compass, Check, X,
  ChevronRight, ArrowRight,
} from 'lucide-react'
import { PublicNavbar } from '@/components/layout/PublicNavbar'

// ─── Fonts ────────────────────────────────────────────────────────────────────

const CLASH = "'Clash Display', 'Satoshi', sans-serif"
const DM    = "'DM Sans', sans-serif"
const MONO  = "'JetBrains Mono', monospace"

// ─── Sample A-grade radar data ────────────────────────────────────────────────

const SAMPLE_SCORES = {
  role_match:        4.8,
  skills_alignment:  4.6,
  experience_level:  4.5,
  growth_trajectory: 4.7,
  culture_fit:       4.4,
  compensation:      4.5,
  location_fit:      4.9,
  company_stage:     4.3,
  role_impact:       4.6,
  long_term_value:   4.7,
}

const DIMS = [
  { key: 'role_match',        short: 'Role'    },
  { key: 'skills_alignment',  short: 'Skills'  },
  { key: 'experience_level',  short: 'Exp.'    },
  { key: 'growth_trajectory', short: 'Growth'  },
  { key: 'culture_fit',       short: 'Culture' },
  { key: 'compensation',      short: 'Comp.'   },
  { key: 'location_fit',      short: 'Loc.'    },
  { key: 'company_stage',     short: 'Stage'   },
  { key: 'role_impact',       short: 'Impact'  },
  { key: 'long_term_value',   short: 'LTV'     },
] as const

// ─── Scroll reveal hook ───────────────────────────────────────────────────────

function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { threshold },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])

  return [ref, visible] as const
}

// ─── Reveal wrapper ───────────────────────────────────────────────────────────

function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  const [ref, visible] = useReveal()
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity:    visible ? 1 : 0,
        transform:  visible ? 'none' : 'translateY(18px)',
        transition: `opacity 300ms ease-out ${delay}ms, transform 300ms ease-out ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

// ─── Hero radar chart (dark-theme SVG) ───────────────────────────────────────

function HeroRadarChart() {
  const [animated, setAnimated] = useState(false)
  const CX = 200, CY = 200, MAX_R = 130, N = DIMS.length

  function polar(i: number, r: number) {
    const a = (i * 2 * Math.PI) / N - Math.PI / 2
    return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) }
  }

  function ring(score: number) {
    const r = (score / 5) * MAX_R
    return Array.from({ length: N }, (_, i) => {
      const { x, y } = polar(i, r)
      return `${x},${y}`
    }).join(' ')
  }

  const polygon = DIMS.map((d, i) => {
    const s = SAMPLE_SCORES[d.key]
    const r = (s / 5) * MAX_R
    const { x, y } = polar(i, r)
    return `${x},${y}`
  }).join(' ')

  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimated(true))
    return () => cancelAnimationFrame(id)
  }, [])

  function anchor(i: number): 'start' | 'middle' | 'end' {
    const { x } = polar(i, 1)
    const dx = x - CX
    if (dx > 4) return 'start'
    if (dx < -4) return 'end'
    return 'middle'
  }

  function baseline(i: number): 'auto' | 'middle' | 'hanging' {
    const { y } = polar(i, 1)
    const dy = y - CY
    if (dy < -4) return 'auto'
    if (dy > 4) return 'hanging'
    return 'middle'
  }

  return (
    <div className="relative w-full max-w-[360px] mx-auto sm:mx-0">
      {/* Grade badge */}
      <div
        className="absolute top-4 right-4 z-10 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold"
        style={{ background: '#22C55E', color: '#fff', fontFamily: CLASH }}
      >
        A
      </div>

      <svg viewBox="0 0 400 400" className="w-full" aria-label="Sample A-grade evaluation radar chart showing strong fit across all 10 dimensions">
        {/* Axis lines */}
        {DIMS.map((_, i) => {
          const { x, y } = polar(i, MAX_R)
          return (
            <line
              key={i}
              x1={CX} y1={CY} x2={x} y2={y}
              stroke="rgba(250,250,248,0.2)"
              strokeWidth={1}
              strokeDasharray="3 4"
            />
          )
        })}

        {/* Rings */}
        {[1, 2, 3, 4, 5].map((r) => (
          <polygon
            key={r}
            points={ring(r)}
            fill="none"
            stroke={r === 5 ? 'rgba(250,250,248,0.25)' : 'rgba(250,250,248,0.1)'}
            strokeWidth={r === 5 ? 1.5 : 1}
            strokeDasharray={r < 5 ? '4 4' : undefined}
          />
        ))}

        {/* Data area */}
        <polygon
          points={polygon}
          fill="rgba(56, 189, 248, 0.18)"
          stroke="#38BDF8"
          strokeWidth={2}
          strokeLinejoin="round"
          style={{
            transformOrigin: `${CX}px ${CY}px`,
            transform: animated ? 'scale(1)' : 'scale(0)',
            transition: 'transform 700ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        />

        {/* Data points */}
        {DIMS.map((d, i) => {
          const s = SAMPLE_SCORES[d.key]
          const r = (s / 5) * MAX_R
          const { x, y } = polar(i, r)
          return (
            <circle
              key={d.key}
              cx={x} cy={y} r={5}
              fill="#22C55E"
              stroke="#0A1628"
              strokeWidth={1.5}
              style={{
                transformOrigin: `${CX}px ${CY}px`,
                transform: animated ? 'scale(1)' : 'scale(0)',
                transition: `transform 700ms cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 45}ms`,
              }}
            />
          )
        })}

        {/* Labels */}
        {DIMS.map((d, i) => {
          const { x, y } = polar(i, MAX_R + 22)
          return (
            <text
              key={d.key}
              x={x} y={y}
              fontSize={10}
              fontWeight={500}
              fill="rgba(250,250,248,0.55)"
              textAnchor={anchor(i)}
              dominantBaseline={baseline(i)}
              fontFamily={DM}
            >
              {d.short}
            </text>
          )
        })}
      </svg>
    </div>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  children,
  bg,
  className = '',
  id,
}: {
  children: ReactNode
  bg: string
  className?: string
  id?: string
}) {
  return (
    <section
      id={id}
      style={{ background: bg }}
      className={`py-20 sm:py-28 px-4 ${className}`}
    >
      <div className="max-w-5xl mx-auto">
        {children}
      </div>
    </section>
  )
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ children, light = false }: { children: string; light?: boolean }) {
  return (
    <p
      className="text-[10px] font-bold uppercase tracking-[0.14em] mb-4"
      style={{
        fontFamily: CLASH,
        color: light ? 'rgba(250,250,248,0.4)' : 'rgba(10,22,40,0.35)',
      }}
    >
      {children}
    </p>
  )
}

// ─── Stat pill ────────────────────────────────────────────────────────────────

function StatPill({ number, label }: { number: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 px-6 py-4 text-center">
      <span
        className="text-2xl font-bold tracking-tight"
        style={{ fontFamily: CLASH, color: '#0EA5E9', fontVariantNumeric: 'tabular-nums' }}
      >
        {number}
      </span>
      <span className="text-xs text-[#FAFAF8]/50" style={{ fontFamily: DM }}>
        {label}
      </span>
    </div>
  )
}

// ─── FAQ accordion ────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    q: 'What is Joberlify?',
    a: 'Joberlify is an AI-powered job search intelligence tool that scores your fit against any job description across 10 weighted dimensions, generates ATS-optimised CVs tailored to specific roles, verifies UK visa sponsorship eligibility across 120,000+ licensed sponsors, and tracks your applications in a personal Kanban pipeline.',
  },
  {
    q: 'How does fit scoring work?',
    a: 'Joberlify analyses each job description against your CV and profile across 10 dimensions: role match, skills alignment, experience level, growth trajectory, culture fit, compensation, location fit, company stage, role impact, and long-term value. Each is scored 1–5 and server-side weighted to produce a grade from A to F — the AI never cherry-picks the arithmetic.',
  },
  {
    q: 'Does Joberlify check visa sponsorship?',
    a: 'Yes. Joberlify cross-references 120,000+ UK-licensed sponsors, classifies the role to the correct SOC 2020 occupation code from 350+ codes using AI, and checks whether the salary meets the Skilled Worker visa threshold for that specific occupation — including the new entrant and Immigration Salary List rates.',
  },
  {
    q: 'Is Joberlify free?',
    a: 'Yes. The free tier includes 3 AI evaluations per month, full access to the UK sponsor database, and a 10-item application pipeline tracker. Pro ($17.99/month) unlocks 30 evaluations, CV generation, and visa checks. Global ($34.99/month) is fully unlimited with Sponsor Watch alerts.',
  },
  {
    q: 'How is Joberlify different from Teal or Jobscan?',
    a: 'Teal and Jobscan focus on keyword matching to pass ATS filters. Joberlify evaluates genuine fit across 10 dimensions, gives a frank verdict — including "not yet" with an actionable roadmap to get there — checks live visa sponsorship feasibility, and generates a new tailored CV from scratch rather than tweaking your existing one.',
  },
  {
    q: 'How does Joberlify find jobs for me?',
    a: 'After uploading your CV and completing your profile, Joberlify learns your skills, experience, career direction, and visa requirements. It scans company career pages and job boards, pre-scores every listing against your profile, and surfaces only the roles where your fit meets your defined threshold.',
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-[#FAFAF8]/10 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start justify-between gap-4 py-5 text-left group"
        aria-expanded={open}
      >
        <span
          className="text-sm font-semibold text-[#FAFAF8] group-hover:text-[#38BDF8] transition-colors leading-snug"
          style={{ fontFamily: DM }}
        >
          {q}
        </span>
        <ChevronDown
          size={16}
          className="flex-shrink-0 text-[#0EA5E9] transition-transform duration-200 mt-0.5"
          style={{ transform: open ? 'rotate(180deg)' : undefined }}
        />
      </button>
      {open && (
        <p
          className="pb-5 text-sm text-[#FAFAF8]/55 leading-relaxed"
          style={{ fontFamily: DM }}
        >
          {a}
        </p>
      )}
    </div>
  )
}

// ─── Visa progress bars ───────────────────────────────────────────────────────

function VisaBar({
  label,
  sublabel,
  delay,
}: {
  label: string
  sublabel: string
  delay: number
}) {
  const [ref, visible] = useReveal(0.3)
  return (
    <div ref={ref} className="flex items-center gap-4">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-semibold text-[#0A1628]" style={{ fontFamily: DM }}>{label}</span>
          <span className="text-xs text-[#0A1628]/45" style={{ fontFamily: DM }}>{sublabel}</span>
        </div>
        <div className="h-2 bg-[#E8E4DD] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: visible ? '100%' : '0%',
              background: '#22C55E',
              transition: `width 700ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
            }}
          />
        </div>
      </div>
      <div
        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
        style={{ background: visible ? '#22C55E' : '#E8E4DD', transition: `background 200ms ease ${delay + 500}ms` }}
      >
        <Check size={14} color="white" strokeWidth={2.5} />
      </div>
    </div>
  )
}

// ─── Pricing preview card ─────────────────────────────────────────────────────

function PriceCard({
  label,
  price,
  period,
  features,
  featured,
  ctaLabel,
  ctaHref,
}: {
  label: string
  price: string
  period: string | null
  features: string[]
  featured: boolean
  ctaLabel: string
  ctaHref: string
}) {
  return (
    <div
      className="relative flex flex-col rounded-[12px] p-6 border"
      style={{
        background: '#FAFAF8',
        borderColor: featured ? '#0EA5E9' : '#E8E4DD',
        borderWidth: featured ? 2 : 1,
        boxShadow: featured ? '0 8px 32px rgba(14,165,233,0.15)' : '0 2px 8px rgba(10,22,40,0.04)',
      }}
    >
      {featured && (
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest"
          style={{ background: '#0EA5E9', color: '#fff', fontFamily: CLASH }}
        >
          Most Popular
        </div>
      )}

      <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#0A1628]/40 mb-3" style={{ fontFamily: CLASH }}>
        {label}
      </p>
      <div className="mb-1">
        <span className="text-3xl font-bold text-[#0A1628] tracking-tight" style={{ fontFamily: CLASH }}>
          {price}
        </span>
        {period && (
          <span className="text-sm text-[#0A1628]/40 ml-1" style={{ fontFamily: DM }}>{period}</span>
        )}
      </div>
      <div className="border-t border-[#E8E4DD] my-4" />
      <ul className="space-y-2 flex-1 mb-5">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check size={13} color="#22C55E" className="flex-shrink-0 mt-0.5" strokeWidth={2.5} />
            <span className="text-xs text-[#0A1628]/70" style={{ fontFamily: DM }}>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href={ctaHref}
        className="block text-center text-sm font-semibold py-2.5 rounded-[8px] transition-colors"
        style={{
          background: featured ? '#0EA5E9' : '#F5F3EF',
          color:      featured ? '#fff' : '#0A1628',
        }}
      >
        {ctaLabel}
      </Link>
    </div>
  )
}

// ─── Testimonial card ─────────────────────────────────────────────────────────

function Testimonial({ quote, name, role }: { quote: string; name: string; role: string }) {
  return (
    <blockquote
      className="flex flex-col rounded-[12px] p-6 border-l-[3px]"
      style={{ background: 'rgba(250,250,248,0.08)', borderColor: '#0EA5E9' }}
    >
      <p
        className="text-sm text-[#FAFAF8]/70 italic leading-relaxed flex-1 mb-4"
        style={{ fontFamily: DM }}
      >
        &ldquo;{quote}&rdquo;
      </p>
      <footer>
        <p className="text-sm font-semibold text-[#FAFAF8]" style={{ fontFamily: DM }}>{name}</p>
        <p className="text-xs text-[#FAFAF8]/40" style={{ fontFamily: DM }}>{role}</p>
      </footer>
    </blockquote>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function LandingPage() {
  const [heroMounted, setHeroMounted] = useState(false)

  useEffect(() => {
    const id = setTimeout(() => setHeroMounted(true), 80)
    return () => clearTimeout(id)
  }, [])

  function heroStyle(delay: number) {
    return {
      opacity:    heroMounted ? 1 : 0,
      transform:  heroMounted ? 'none' : 'translateY(16px)',
      transition: `opacity 400ms ease-out ${delay}ms, transform 400ms ease-out ${delay}ms`,
    }
  }

  return (
    <>
      <PublicNavbar />

      {/* ════════════════════════════════════════════════════════════════════════
          § 1  HERO
      ═══════════════════════════════════════════════════════════════════════ */}
      <header
        className="relative min-h-screen flex flex-col justify-center px-4"
        style={{ background: '#0A1628' }}
        aria-label="Hero"
      >
        {/* Subtle grid */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(250,250,248,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(250,250,248,0.03) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />

        <div className="relative max-w-5xl mx-auto w-full pt-20 pb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 sm:gap-8 items-center">
            {/* Left: copy */}
            <div>
              <div style={heroStyle(0)}>
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#0EA5E9] mb-6"
                  style={{ fontFamily: CLASH }}
                >
                  AI Job Search Intelligence
                </p>
              </div>

              <h1
                className="text-[31px] sm:text-[49px] font-bold text-[#FAFAF8] leading-[1.08] tracking-[-0.02em] mb-5"
                style={{ fontFamily: CLASH, ...heroStyle(80) }}
              >
                Find the right job.<br />
                Anywhere in the world.
              </h1>

              <p
                className="text-lg text-[#FAFAF8]/60 mb-8 max-w-md leading-relaxed"
                style={{ fontFamily: DM, ...heroStyle(180) }}
              >
                AI that scores your fit honestly, generates tailored CVs, and navigates visa sponsorship — so you only apply where you genuinely belong.
              </p>

              <div
                className="flex flex-wrap gap-3"
                style={heroStyle(280)}
              >
                <Link
                  href="/auth/sign-up"
                  className="px-6 py-3 rounded-[12px] text-sm font-bold transition-colors duration-150 hover:bg-[#38BDF8]"
                  style={{ background: '#0EA5E9', color: '#0A1628', fontFamily: DM }}
                >
                  Start Free
                </Link>
                <Link
                  href="/sponsors"
                  className="px-6 py-3 rounded-[12px] text-sm font-bold border transition-all duration-150 hover:bg-[#FAFAF8] hover:text-[#0A1628]"
                  style={{ borderColor: '#FAFAF8', color: '#FAFAF8', fontFamily: DM }}
                >
                  Browse UK Sponsors
                </Link>
              </div>

              {/* Micro-trust signals */}
              <div
                className="flex items-center gap-4 mt-8"
                style={heroStyle(360)}
              >
                {['Free to start', '3 evaluations/month', 'No credit card'].map((t) => (
                  <div key={t} className="flex items-center gap-1.5">
                    <Check size={12} color="#22C55E" strokeWidth={2.5} />
                    <span className="text-xs text-[#FAFAF8]/45" style={{ fontFamily: DM }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: radar chart */}
            <div style={heroStyle(200)}>
              <HeroRadarChart />
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
          <ChevronDown
            size={20}
            color="rgba(250,250,248,0.3)"
            style={{ animation: 'bounce 2s ease-in-out infinite' }}
          />
        </div>

        <style>{`
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50%       { transform: translateY(6px); }
          }
        `}</style>
      </header>

      {/* ════════════════════════════════════════════════════════════════════════
          § 2  HOW IT WORKS
      ═══════════════════════════════════════════════════════════════════════ */}
      <Section bg="#FAFAF8" id="how-it-works">
        <Reveal>
          <SectionLabel>How it works</SectionLabel>
          <h2
            className="text-[25px] sm:text-[31px] font-bold text-[#0A1628] tracking-[-0.02em] mb-14"
            style={{ fontFamily: CLASH }}
          >
            Three steps to smarter applications
          </h2>
        </Reveal>

        {/* Desktop: horizontal timeline */}
        <div className="relative">
          {/* Connector line */}
          <div
            className="hidden sm:block absolute top-[28px] left-[calc(16.5%+8px)] right-[calc(16.5%+8px)] h-px"
            style={{ background: '#0EA5E9' }}
            aria-hidden
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            {[
              {
                n: '01',
                icon: Link2,
                title: 'Paste',
                desc: 'Drop in a job URL or paste the description. Joberlify extracts and structures every detail within seconds.',
              },
              {
                n: '02',
                icon: Activity,
                title: 'Evaluate',
                desc: 'AI scores your fit across 10 dimensions and delivers a frank verdict — complete with a gap analysis and actionable guidance.',
              },
              {
                n: '03',
                icon: Target,
                title: 'Apply Smart',
                desc: 'Generate a tailored CV, prep for interviews, and track your application — all from one place.',
              },
            ].map(({ n, icon: Icon, title, desc }, i) => (
              <Reveal key={n} delay={i * 120}>
                <article className="flex flex-col">
                  {/* Number + icon row */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-14 h-14 rounded-full border-2 border-[#0EA5E9] bg-[#FAFAF8] flex items-center justify-center flex-shrink-0 relative z-10"
                    >
                      <Icon size={22} color="#0EA5E9" strokeWidth={1.6} />
                    </div>
                    <span
                      className="text-[39px] font-bold leading-none tracking-tight text-[#0EA5E9]/15"
                      style={{ fontFamily: CLASH, fontVariantNumeric: 'tabular-nums' }}
                    >
                      {n}
                    </span>
                  </div>
                  <h3
                    className="text-xl font-bold text-[#0A1628] mb-2"
                    style={{ fontFamily: CLASH }}
                  >
                    {title}
                  </h3>
                  <p className="text-sm text-[#0A1628]/55 leading-relaxed" style={{ fontFamily: DM }}>
                    {desc}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      {/* ════════════════════════════════════════════════════════════════════════
          § 3  WHY JOBERLIFY
      ═══════════════════════════════════════════════════════════════════════ */}
      <Section bg="#0A1628" id="features">
        <Reveal>
          <SectionLabel light>Built different</SectionLabel>
          <h2
            className="text-[25px] sm:text-[31px] font-bold text-[#FAFAF8] tracking-[-0.02em] mb-10"
            style={{ fontFamily: CLASH }}
          >
            Built different
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-14">
          {[
            {
              icon: Activity,
              title: '10-Dimension Scoring',
              desc: 'Role match, skills, experience, growth, culture, compensation, location, company stage, impact, and long-term value — weighted and honestly calculated.',
            },
            {
              icon: FileText,
              title: 'Tailored CVs',
              desc: 'Not keyword-stuffed. A genuinely tailored document, rewritten from your parsed CV to speak directly to the role — in UK, US, or generic format.',
            },
            {
              icon: Globe,
              title: 'Visa Intelligence',
              desc: '120,000+ UK sponsors indexed. SOC 2020 classification. Live salary threshold checks. The three-layer check no other job tool performs.',
            },
            {
              icon: Compass,
              title: 'The "Not Yet" Principle',
              desc: 'When the fit isn\'t there, Joberlify tells you honestly — and shows you exactly what to do to get there. Rejection with a roadmap.',
            },
          ].map(({ icon: Icon, title, desc }, i) => (
            <Reveal key={title} delay={i * 80}>
              <article
                className="rounded-[12px] p-6 transition-colors duration-150 cursor-default group"
                style={{ background: 'rgba(250,250,248,0.07)' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(250,250,248,0.12)'
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(250,250,248,0.07)'
                }}
              >
                <Icon size={22} color="#0EA5E9" strokeWidth={1.6} className="mb-4" />
                <h3
                  className="text-base font-bold text-[#FAFAF8] mb-2"
                  style={{ fontFamily: CLASH }}
                >
                  {title}
                </h3>
                <p className="text-sm text-[#FAFAF8]/50 leading-relaxed" style={{ fontFamily: DM }}>
                  {desc}
                </p>
              </article>
            </Reveal>
          ))}
        </div>

        {/* Stats row */}
        <Reveal>
          <div
            className="rounded-[12px] border border-[#FAFAF8]/10 flex flex-wrap justify-around divide-x divide-[#FAFAF8]/10 overflow-hidden"
          >
            <StatPill number="120,000+"  label="Sponsors Indexed" />
            <StatPill number="350+"      label="Occupation Codes" />
            <StatPill number="10"        label="Scoring Dimensions" />
          </div>
        </Reveal>
      </Section>

      {/* ════════════════════════════════════════════════════════════════════════
          § 4  WHAT IS JOBERLIFY — GEO SECTION
      ═══════════════════════════════════════════════════════════════════════ */}
      <Section bg="#FAFAF8" id="about">
        <Reveal>
          <SectionLabel>What is Joberlify?</SectionLabel>
          <h2
            className="text-[25px] sm:text-[31px] font-bold text-[#0A1628] tracking-[-0.02em] mb-8"
            style={{ fontFamily: CLASH }}
          >
            What is Joberlify?
          </h2>
        </Reveal>

        <Reveal delay={100}>
          <div
            className="rounded-[8px] border-l-4 px-6 py-6 sm:px-8 sm:py-7"
            style={{ borderColor: '#0EA5E9', background: '#F5F3EF' }}
          >
            <p
              className="text-[20px] sm:text-[25px] text-[#0A1628] leading-relaxed font-medium"
              style={{ fontFamily: DM }}
            >
              Joberlify is your personal AI recruitment agent. Unlike traditional job sites that feature thousands of irrelevant listings, Joberlify learns who you are — your skills, experience, career direction, and visa needs — then proactively scans company career pages and surfaces only the roles where you have a genuine match. Every listing you see has already been scored against your profile across{' '}
              <span className="text-[#0EA5E9] font-bold">10 weighted dimensions</span>.
            </p>
          </div>
        </Reveal>

        <Reveal delay={200}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10">
            {[
              {
                headline: 'Honest scoring',
                body: 'An A grade means you genuinely fit. A D means you don\'t — and we tell you why, and what to do about it.',
              },
              {
                headline: 'Built for internationals',
                body: 'Visa eligibility isn\'t an afterthought. It\'s a first-class dimension of every evaluation.',
              },
              {
                headline: 'Proactive, not reactive',
                body: 'Stop refreshing job boards. Joberlify surfaces roles you\'d otherwise miss before they fill.',
              },
            ].map(({ headline, body }, i) => (
              <div key={headline}>
                <h3
                  className="text-base font-bold text-[#0A1628] mb-2"
                  style={{ fontFamily: CLASH }}
                >
                  {headline}
                </h3>
                <p className="text-sm text-[#0A1628]/55 leading-relaxed" style={{ fontFamily: DM }}>
                  {body}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </Section>

      {/* ════════════════════════════════════════════════════════════════════════
          § 5  STOP SEARCHING — COMPARATOR
      ═══════════════════════════════════════════════════════════════════════ */}
      <Section bg="#1E3A5F" id="why">
        <Reveal>
          <h2
            className="text-[25px] sm:text-[31px] font-bold text-[#FAFAF8] tracking-[-0.02em] mb-10 text-center"
            style={{ fontFamily: CLASH }}
          >
            Stop searching. Start getting found.
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          {/* Traditional */}
          <Reveal delay={0}>
            <div className="rounded-[12px] p-6" style={{ background: 'rgba(10,22,40,0.3)' }}>
              <p
                className="text-xs font-bold uppercase tracking-[0.1em] text-[#FAFAF8]/35 mb-5"
                style={{ fontFamily: CLASH }}
              >
                Traditional Job Sites
              </p>
              <ul className="space-y-3">
                {[
                  'Browse 500 listings',
                  'Guess which ones fit',
                  'Apply to 50 just in case',
                  'Hear back from 3',
                  'Most were wasted time',
                ].map((t) => (
                  <li key={t} className="flex items-center gap-3">
                    <X size={14} color="#EF4444" strokeWidth={2.5} className="flex-shrink-0" />
                    <span
                      className="text-sm line-through decoration-[#FAFAF8]/25 text-[#FAFAF8]/35"
                      style={{ fontFamily: DM }}
                    >
                      {t}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* Joberlify */}
          <Reveal delay={100}>
            <div
              className="rounded-[12px] p-6 border-l-4"
              style={{ background: 'rgba(250,250,248,0.07)', borderColor: '#0EA5E9' }}
            >
              <p
                className="text-xs font-bold uppercase tracking-[0.1em] text-[#0EA5E9] mb-5"
                style={{ fontFamily: CLASH }}
              >
                Joberlify
              </p>
              <ul className="space-y-3">
                {[
                  'Upload your CV once',
                  'AI learns your exact profile',
                  'Scans 50+ company career pages',
                  'Filters out irrelevant roles instantly',
                  'Surfaces genuine matches with scores',
                ].map((t) => (
                  <li key={t} className="flex items-center gap-3">
                    <Check size={14} color="#38BDF8" strokeWidth={2.5} className="flex-shrink-0" />
                    <span className="text-sm text-[#FAFAF8]/80" style={{ fontFamily: DM }}>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        {/* Bold statement */}
        <Reveal delay={150}>
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p
              className="text-[20px] sm:text-[25px] font-bold text-[#FAFAF8] leading-snug tracking-[-0.01em]"
              style={{ fontFamily: CLASH }}
            >
              Traditional job sites feature jobs and hope you find the right one.{' '}
              <span className="text-[#38BDF8]">Joberlify features YOU</span>{' '}
              and goes out to find the right job.
            </p>
          </div>
          <div className="flex justify-center">
            <Link
              href="/auth/sign-up"
              className="flex items-center gap-2 px-6 py-3 rounded-[12px] text-sm font-bold transition-colors hover:bg-[#38BDF8]"
              style={{ background: '#0EA5E9', color: '#fff', fontFamily: DM }}
            >
              Start Free
              <ArrowRight size={16} />
            </Link>
          </div>
        </Reveal>
      </Section>

      {/* ════════════════════════════════════════════════════════════════════════
          § 6  VISA SPONSORSHIP
      ═══════════════════════════════════════════════════════════════════════ */}
      <Section bg="#FAFAF8" id="visa">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 items-center">
          <div>
            <Reveal>
              <SectionLabel>For international job seekers</SectionLabel>
              <h2
                className="text-[25px] sm:text-[31px] font-bold text-[#0A1628] tracking-[-0.02em] mb-5"
                style={{ fontFamily: CLASH }}
              >
                Visa sponsorship intelligence
              </h2>
              <p className="text-sm text-[#0A1628]/55 leading-relaxed mb-8" style={{ fontFamily: DM }}>
                Navigating UK visa sponsorship is complex. Joberlify automates the three-layer check that takes most candidates hours of research — in seconds.
              </p>
            </Reveal>

            <Reveal delay={80}>
              <ul className="space-y-4 mb-8">
                {[
                  { label: '120,000+ licensed UK sponsors', sub: 'Updated from the Home Office register' },
                  { label: 'SOC 2020 classification', sub: 'AI-verified from 350+ occupation codes' },
                  { label: 'Sponsor Watch alerts', sub: 'Notified the moment a sponsor status changes' },
                ].map(({ label, sub }) => (
                  <li key={label} className="flex items-start gap-3">
                    <Check size={16} color="#0EA5E9" strokeWidth={2.5} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-[#0A1628]" style={{ fontFamily: DM }}>{label}</p>
                      <p className="text-xs text-[#0A1628]/45" style={{ fontFamily: DM }}>{sub}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={160}>
              <Link
                href="/sponsors"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#0EA5E9] hover:underline"
                style={{ fontFamily: DM }}
              >
                Search UK Sponsors
                <ChevronRight size={15} />
              </Link>
            </Reveal>
          </div>

          {/* Animated bars */}
          <Reveal delay={80}>
            <div className="space-y-6">
              <VisaBar label="Sponsor Verification"   sublabel="Is the company licensed?"  delay={0}   />
              <VisaBar label="SOC Code Classification" sublabel="Is the role eligible?"      delay={200} />
              <VisaBar label="Salary Threshold Check" sublabel="Does the pay qualify?"       delay={400} />

              <div
                className="rounded-[10px] border border-[#E8E4DD] px-4 py-3 flex items-center gap-3"
                style={{ background: '#F5F3EF' }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: '#22C55E' }}
                >
                  <Check size={16} color="white" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#0A1628]" style={{ fontFamily: CLASH }}>
                    Visa eligible
                  </p>
                  <p className="text-xs text-[#0A1628]/45" style={{ fontFamily: DM }}>
                    All three checks passed — Skilled Worker route confirmed
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ════════════════════════════════════════════════════════════════════════
          § 7  SOCIAL PROOF
      ═══════════════════════════════════════════════════════════════════════ */}
      <Section bg="#0A1628" id="testimonials">
        <Reveal>
          <h2
            className="text-[25px] sm:text-[31px] font-bold text-[#FAFAF8] tracking-[-0.02em] mb-10 text-center"
            style={{ fontFamily: CLASH }}
          >
            Trusted by professionals worldwide
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            {
              quote: 'It found me a job I would never have thought to apply for. The scoring was brutally honest — which is exactly what I needed.',
              name:  'Priya M.',
              role:  'Software Engineer · India → London',
            },
            {
              quote: 'The visa sponsorship checker saved me weeks of research. Within minutes I knew which roles were actually viable for my situation.',
              name:  'Carlos R.',
              role:  'Data Scientist · Brazil → UK',
            },
            {
              quote: 'I upgraded to Pro for the CV tailoring and had three interviews in my first week. The fit scoring is eerily accurate.',
              name:  'Amara O.',
              role:  'Product Manager · Nigeria → Canada',
            },
          ].map((t, i) => (
            <Reveal key={t.name} delay={i * 100}>
              <Testimonial {...t} />
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ════════════════════════════════════════════════════════════════════════
          § 8  PRICING PREVIEW
      ═══════════════════════════════════════════════════════════════════════ */}
      <Section bg="#FAFAF8" id="pricing">
        <Reveal>
          <SectionLabel>Pricing</SectionLabel>
          <h2
            className="text-[25px] sm:text-[31px] font-bold text-[#0A1628] tracking-[-0.02em] mb-2"
            style={{ fontFamily: CLASH }}
          >
            Start free. Scale when ready.
          </h2>
          <p className="text-sm text-[#0A1628]/50 mb-10" style={{ fontFamily: DM }}>
            No contracts. No surprise charges. Cancel anytime.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <Reveal delay={0}>
            <PriceCard
              label="Free"
              price="$0"
              period={null}
              features={['3 evaluations / month', 'UK sponsor browse', '10 pipeline items', 'Basic gap report']}
              featured={false}
              ctaLabel="Start Free"
              ctaHref="/auth/sign-up"
            />
          </Reveal>
          <Reveal delay={80}>
            <PriceCard
              label="Pro"
              price="$17.99"
              period="/month"
              features={['30 evaluations / month', 'Tailored CV generation', 'Visa eligibility checks', 'Full gap report', 'Unlimited pipeline']}
              featured
              ctaLabel="Upgrade to Pro"
              ctaHref="/auth/sign-up"
            />
          </Reveal>
          <Reveal delay={160}>
            <PriceCard
              label="Global"
              price="$34.99"
              period="/month"
              features={['Unlimited evaluations', 'Unlimited CVs', 'Sponsor Watch alerts', 'Growth roadmap', 'Priority support']}
              featured={false}
              ctaLabel="Upgrade to Global"
              ctaHref="/auth/sign-up"
            />
          </Reveal>
        </div>

        <Reveal delay={200}>
          <div className="text-center">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0EA5E9] hover:underline"
              style={{ fontFamily: DM }}
            >
              View full comparison →
            </Link>
          </div>
        </Reveal>
      </Section>

      {/* ════════════════════════════════════════════════════════════════════════
          § 9  FAQ
      ═══════════════════════════════════════════════════════════════════════ */}
      <Section bg="#0A1628" id="faq">
        <div className="max-w-2xl mx-auto">
          <Reveal>
            <h2
              className="text-[25px] sm:text-[31px] font-bold text-[#FAFAF8] tracking-[-0.02em] mb-10"
              style={{ fontFamily: CLASH }}
            >
              Common questions
            </h2>
          </Reveal>
          <div>
            {FAQ_ITEMS.map((item) => (
              <FaqItem key={item.q} {...item} />
            ))}
          </div>
        </div>
      </Section>

      {/* ════════════════════════════════════════════════════════════════════════
          § 10  FOOTER
      ═══════════════════════════════════════════════════════════════════════ */}
      <footer style={{ background: '#0A1628', borderTop: '1px solid #0EA5E9' }}>
        <div className="max-w-5xl mx-auto px-4 py-14 sm:py-16">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-2 sm:col-span-1">
              <p
                className="text-[#FAFAF8] text-xl font-bold tracking-[0.04em] mb-3"
                style={{ fontFamily: CLASH }}
              >
                Joberlify
              </p>
              <p className="text-xs text-[#FAFAF8]/35 leading-relaxed" style={{ fontFamily: DM }}>
                AI-powered job search intelligence for the global professional.
              </p>
            </div>

            {/* Product */}
            <nav aria-label="Product links">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#FAFAF8]/30 mb-4" style={{ fontFamily: CLASH }}>
                Product
              </p>
              <ul className="space-y-2.5">
                {[
                  { href: '/#features', label: 'Features'  },
                  { href: '/pricing',   label: 'Pricing'   },
                  { href: '/sponsors',  label: 'Sponsors'  },
                ].map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-[#FAFAF8]/50 hover:text-[#FAFAF8] transition-colors" style={{ fontFamily: DM }}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Resources */}
            <nav aria-label="Resource links">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#FAFAF8]/30 mb-4" style={{ fontFamily: CLASH }}>
                Resources
              </p>
              <ul className="space-y-2.5">
                {[
                  { href: '/blog',            label: 'Blog'            },
                  { href: '/blog/soc-codes',  label: 'SOC Codes Guide' },
                  { href: '/blog/visa-guide', label: 'Visa Guide'      },
                ].map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-[#FAFAF8]/50 hover:text-[#FAFAF8] transition-colors" style={{ fontFamily: DM }}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Company */}
            <nav aria-label="Company links">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#FAFAF8]/30 mb-4" style={{ fontFamily: CLASH }}>
                Company
              </p>
              <ul className="space-y-2.5">
                {[
                  { href: '/about',   label: 'About'   },
                  { href: '/contact', label: 'Contact' },
                ].map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-[#FAFAF8]/50 hover:text-[#FAFAF8] transition-colors" style={{ fontFamily: DM }}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Bottom row */}
          <div className="border-t border-[#FAFAF8]/8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-5">
              {[
                { href: '/legal/privacy', label: 'Privacy Policy' },
                { href: '/legal/terms',   label: 'Terms of Service' },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-xs text-[#FAFAF8]/30 hover:text-[#FAFAF8]/60 transition-colors"
                  style={{ fontFamily: DM }}
                >
                  {label}
                </Link>
              ))}
            </div>

            <p className="text-xs text-[#FAFAF8]/25" style={{ fontFamily: DM }}>
              Built by AkomzyAi · {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </footer>
    </>
  )
}
