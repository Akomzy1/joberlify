import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/seo/JsonLd'
import { LastUpdated } from '@/components/seo/LastUpdated'

// ─── SEO ──────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'About Joberlify — AI-Powered Job Search Intelligence',
  description:
    'Joberlify is an AI recruitment agent that learns who you are, evaluates your fit across 10 dimensions, generates tailored CVs, and checks UK visa sponsorship eligibility. Built for job seekers who want honest intelligence, not optimistic noise.',
  alternates: { canonical: 'https://joberlify.com/about' },
  openGraph: {
    title:       'About Joberlify — AI-Powered Job Search Intelligence',
    description: 'What Joberlify is, how it works, and why we built it differently.',
    url:         'https://joberlify.com/about',
    type:        'website',
  },
}

// ─── Structured data ──────────────────────────────────────────────────────────

const ORGANIZATION_SCHEMA = {
  '@context':  'https://schema.org',
  '@type':     'Organization',
  name:         'Joberlify',
  url:          'https://joberlify.com',
  logo:         'https://joberlify.com/logo.png',
  description:  'Joberlify is an AI-powered job search intelligence platform. It evaluates job fit across 10 weighted dimensions, generates ATS-optimised CVs tailored to specific roles, and performs three-layer UK visa sponsorship eligibility checks across 120,000+ licensed employers and 350+ SOC 2020 occupation codes.',
  foundingDate: '2025',
  contactPoint: {
    '@type':     'ContactPoint',
    contactType: 'customer support',
    email:       'hello@joberlify.com',
    availableLanguage: 'English',
  },
  sameAs: [],
}

const WEBPAGE_SCHEMA = {
  '@context':        'https://schema.org',
  '@type':           'WebPage',
  name:              'About Joberlify',
  url:               'https://joberlify.com/about',
  description:       'Authoritative description of what Joberlify is, how it works, and what differentiates it from other job search tools.',
  isPartOf: { '@type': 'WebSite', url: 'https://joberlify.com', name: 'Joberlify' },
  about: {
    '@type':       'SoftwareApplication',
    name:          'Joberlify',
    applicationCategory: 'BusinessApplication',
    url:           'https://joberlify.com',
  },
}

// ─── Section component ────────────────────────────────────────────────────────

function Section({
  id, children,
}: {
  id?: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      style={{
        maxWidth: 760, margin: '0 auto', padding: '60px 24px',
        borderBottom: '1px solid #E8E4DD',
      }}
    >
      {children}
    </section>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
      textTransform: 'uppercase', color: '#0EA5E9', marginBottom: 14,
    }}>
      {children}
    </p>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '0 8px' }}>
      <p style={{
        fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800,
        color: '#0A1628', letterSpacing: '-0.03em', lineHeight: 1,
        marginBottom: 6,
      }}>
        {value}
      </p>
      <p style={{ fontSize: 13, color: 'rgba(10,22,40,0.50)', lineHeight: 1.4 }}>
        {label}
      </p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AboutPage() {
  return (
    <>
      <JsonLd schema={ORGANIZATION_SCHEMA} />
      <JsonLd schema={WEBPAGE_SCHEMA} />

      <div style={{ backgroundColor: '#FAFAF8', minHeight: '100vh' }}>

        {/* ── Hero ── */}
        <div style={{ backgroundColor: '#0A1628', color: '#FAFAF8' }}>
          <div style={{ maxWidth: 760, margin: '0 auto', padding: '72px 24px 64px' }}>
            <Label>About Joberlify</Label>
            <h1 style={{
              fontSize: 'clamp(30px, 5vw, 52px)', fontWeight: 800,
              letterSpacing: '-0.025em', lineHeight: 1.1,
              marginBottom: 24, maxWidth: 640,
            }}>
              Joberlify is your personal AI recruitment agent.
            </h1>
            <p style={{
              fontSize: 18, color: 'rgba(250,250,248,0.65)',
              lineHeight: 1.7, maxWidth: 580,
            }}>
              Traditional job sites feature thousands of irrelevant listings and leave you to
              scroll. Joberlify learns who you are first, then goes out to find the right jobs
              for you.
            </p>
          </div>
        </div>

        {/* ── What Joberlify is ── */}
        <Section id="what-is-joberlify">
          <Label>What Joberlify Does</Label>
          <h2 style={{
            fontSize: 28, fontWeight: 800, color: '#0A1628',
            letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 20,
          }}>
            Honest intelligence. Not optimistic noise.
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(10,22,40,0.75)', lineHeight: 1.8, marginBottom: 18 }}>
            Joberlify is an AI-powered job search intelligence platform. It evaluates your fit
            against any job description across 10 independently scored dimensions — from skills
            alignment and experience level to visa sponsorship feasibility — and produces a
            calibrated grade from A to F with a written explanation.
          </p>
          <p style={{ fontSize: 16, color: 'rgba(10,22,40,0.75)', lineHeight: 1.8, marginBottom: 18 }}>
            Unlike tools that tell you everything looks great to encourage more activity,
            Joberlify is built to give frank assessments. A score of C with an explanation of
            exactly what's missing is more valuable than an inflated 87% match that sends you
            into a process you can't win.
          </p>
          <p style={{ fontSize: 16, color: 'rgba(10,22,40,0.75)', lineHeight: 1.8 }}>
            Joberlify also generates fully tailored, ATS-optimised CVs based on your real
            experience — not a keyword-stuffed template — and performs three-layer UK visa
            sponsorship checks: employer licence status, SOC 2020 occupation code classification,
            and salary threshold verification.
          </p>
        </Section>

        {/* ── Stats bar ── */}
        <div style={{ backgroundColor: 'white', borderBottom: '1px solid #E8E4DD', borderTop: '1px solid #E8E4DD' }}>
          <div style={{
            maxWidth: 760, margin: '0 auto', padding: '36px 24px',
            display: 'flex', flexWrap: 'wrap', gap: 32,
            justifyContent: 'center',
          }}>
            <Stat value="10" label="Scoring dimensions" />
            <Stat value="120,000+" label="UK licensed sponsors" />
            <Stat value="350+" label="SOC 2020 occupation codes" />
            <Stat value="A–F" label="Calibrated fit grades" />
          </div>
        </div>

        {/* ── The fundamental shift ── */}
        <Section id="the-fundamental-shift">
          <Label>The Fundamental Shift</Label>
          <h2 style={{
            fontSize: 28, fontWeight: 800, color: '#0A1628',
            letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 20,
          }}>
            Traditional job sites feature jobs.<br />Joberlify features you.
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(10,22,40,0.75)', lineHeight: 1.8, marginBottom: 18 }}>
            Every major job board — Indeed, LinkedIn, Reed, Totaljobs — operates on the same
            model: they aggregate job listings and present them to a large audience. The matching
            is cursory. The job seeker does most of the work. The result is high volume, low
            signal, and enormous time wasted on roles that were never realistic.
          </p>
          <p style={{ fontSize: 16, color: 'rgba(10,22,40,0.75)', lineHeight: 1.8, marginBottom: 18 }}>
            Joberlify inverts this. Instead of presenting you with thousands of roles and hoping
            you find the right one, it builds a deep model of who you are — your skills, experience
            trajectory, preferences, compensation expectations, and visa needs — and uses that
            model to evaluate every role before you invest time in it.
          </p>
          <div style={{
            backgroundColor: '#0A1628', color: '#FAFAF8',
            borderRadius: 16, padding: '28px 32px', margin: '32px 0',
          }}>
            <p style={{
              fontSize: 20, fontWeight: 700, lineHeight: 1.5,
              letterSpacing: '-0.01em', fontStyle: 'italic',
            }}>
              "Traditional job sites feature jobs and hope you find the right one.
              Joberlify features <em>you</em> and goes out to find the right job."
            </p>
          </div>
          <p style={{ fontSize: 16, color: 'rgba(10,22,40,0.75)', lineHeight: 1.8 }}>
            This means you spend your time on applications where you have genuine, demonstrable
            fit — and get a frank explanation when you don't, together with a roadmap for what
            would need to change.
          </p>
        </Section>

        {/* ── How it works ── */}
        <Section id="how-it-works">
          <Label>How It Works</Label>
          <h2 style={{
            fontSize: 28, fontWeight: 800, color: '#0A1628',
            letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 32,
          }}>
            Three steps. Honest results.
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {[
              {
                step: '01',
                title: 'Build your profile',
                desc:  'Upload your CV and answer questions about your experience, goals, target roles, compensation expectations, and visa needs. Joberlify builds a structured model of who you are and what you\'re looking for.',
              },
              {
                step: '02',
                title: 'Evaluate any job',
                desc:  'Paste any job description. Joberlify scores it against your profile across 10 dimensions, produces a grade from A to F, writes an honest assessment, checks UK visa sponsorship eligibility in three layers, and identifies exactly what\'s strong and what\'s missing.',
              },
              {
                step: '03',
                title: 'Apply strategically',
                desc:  'For roles where you have strong fit, generate a tailored ATS-optimised CV in seconds. Track your pipeline, prepare for interviews, and get a growth roadmap for roles where you\'re not quite there yet.',
              },
            ].map(({ step, title, desc }) => (
              <div key={step} style={{ display: 'flex', gap: 20 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  backgroundColor: '#0EA5E9', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 800, flexShrink: 0,
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  {step}
                </div>
                <div>
                  <h3 style={{
                    fontSize: 17, fontWeight: 700, color: '#0A1628',
                    marginBottom: 8, lineHeight: 1.3,
                  }}>
                    {title}
                  </h3>
                  <p style={{ fontSize: 15, color: 'rgba(10,22,40,0.65)', lineHeight: 1.7 }}>
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Key differentiators ── */}
        <Section id="differentiators">
          <Label>Why Joberlify</Label>
          <h2 style={{
            fontSize: 28, fontWeight: 800, color: '#0A1628',
            letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 28,
          }}>
            Key differentiators
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              {
                title: '10-dimension scoring, not keyword matching',
                desc:  'Most AI job tools compare keywords in a job description against keywords in your CV. Joberlify evaluates 10 independent dimensions — including growth trajectory, culture fit, role impact, and long-term value — to produce a multi-layered assessment that reflects how hiring actually works.',
              },
              {
                title: 'Honest grading from A to F',
                desc:  'Most tools inflate scores because pessimism hurts engagement metrics. Joberlify is calibrated for accuracy. An honest C with an explanation of what\'s missing is more useful than an optimistic 87% that sends you into a process you cannot win.',
              },
              {
                title: 'Three-layer UK visa sponsorship checks',
                desc:  'A job that mentions "visa sponsorship considered" is not the same as a role that meets all three eligibility criteria: a valid A-rated sponsor licence, a qualifying SOC 2020 occupation code, and a salary that meets the going rate for that specific code. Joberlify checks all three.',
              },
              {
                title: 'Tailored CVs from your real experience',
                desc:  'Joberlify\'s CV generation doesn\'t hallucinate achievements or pad your experience. It restructures and rephrases your actual background to highlight the most relevant evidence for the specific role — producing a CV that holds up in an interview.',
              },
              {
                title: 'Growth roadmap, not just rejection',
                desc:  'When a role scores below threshold, Joberlify doesn\'t just say "not a fit." It identifies specifically what\'s missing and what would need to change — skills to develop, experience to accumulate, salary gap to close — and frames it as a path forward.',
              },
            ].map(({ title, desc }) => (
              <div
                key={title}
                style={{
                  padding: '20px 24px',
                  backgroundColor: 'white',
                  borderRadius: 14,
                  border: '1px solid #E8E4DD',
                }}
              >
                <h3 style={{
                  fontSize: 16, fontWeight: 700, color: '#0A1628',
                  marginBottom: 8, lineHeight: 1.4,
                }}>
                  {title}
                </h3>
                <p style={{ fontSize: 14, color: 'rgba(10,22,40,0.65)', lineHeight: 1.7 }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Mission ── */}
        <Section id="mission">
          <Label>Mission</Label>
          <h2 style={{
            fontSize: 28, fontWeight: 800, color: '#0A1628',
            letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 20,
          }}>
            Built for people who want the truth
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(10,22,40,0.75)', lineHeight: 1.8, marginBottom: 18 }}>
            Joberlify exists because most job search tools are optimised for engagement, not
            outcomes. They encourage high activity because activity feels productive and retains
            subscribers. But mass applying to poorly matched roles doesn't produce better
            outcomes — it produces exhaustion, rejected applications, and time wasted on
            processes you were unlikely to win.
          </p>
          <p style={{ fontSize: 16, color: 'rgba(10,22,40,0.75)', lineHeight: 1.8, marginBottom: 18 }}>
            The evidence consistently shows that targeted, well-informed applications produce
            better outcomes than high-volume spray-and-pray strategies. Joberlify is built on
            this principle: honest intelligence, applied selectively, leads to better jobs faster.
          </p>
          <p style={{ fontSize: 16, color: 'rgba(10,22,40,0.75)', lineHeight: 1.8 }}>
            Our goal is not to help you apply to more jobs. It is to help you apply to the right
            ones — and to be genuinely prepared when you do.
          </p>
        </Section>

        {/* ── CTA ── */}
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px 80px' }}>
          <div style={{
            backgroundColor: '#0A1628', borderRadius: 20,
            padding: '48px 40px', textAlign: 'center', color: '#FAFAF8',
          }}>
            <p style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: '#0EA5E9', marginBottom: 14,
            }}>
              Start today
            </p>
            <h2 style={{
              fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em',
              lineHeight: 1.2, marginBottom: 14,
            }}>
              Three free evaluations every month.
            </h2>
            <p style={{
              fontSize: 16, color: 'rgba(250,250,248,0.60)',
              lineHeight: 1.6, marginBottom: 28, maxWidth: 440, margin: '0 auto 28px',
            }}>
              No card required. Upload your CV, paste a job description, get an honest assessment.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                href="/auth/signup"
                style={{
                  display: 'inline-flex', alignItems: 'center',
                  backgroundColor: '#0EA5E9', color: 'white',
                  padding: '13px 26px', borderRadius: 12,
                  fontSize: 15, fontWeight: 700, textDecoration: 'none',
                  letterSpacing: '-0.01em',
                }}
              >
                Try Joberlify Free →
              </Link>
              <Link
                href="/compare"
                style={{
                  display: 'inline-flex', alignItems: 'center',
                  border: '1px solid rgba(250,250,248,0.20)',
                  color: 'rgba(250,250,248,0.75)',
                  padding: '13px 26px', borderRadius: 12,
                  fontSize: 15, fontWeight: 600, textDecoration: 'none',
                }}
              >
                Compare tools
              </Link>
            </div>
          </div>
        </div>
        <LastUpdated date="2026-04-09" />
      </div>
    </>
  )
}
