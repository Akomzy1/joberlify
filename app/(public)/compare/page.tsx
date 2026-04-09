import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/seo/JsonLd'
import { LastUpdated } from '@/components/seo/LastUpdated'

// ─── SEO ──────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Joberlify vs Teal vs Jobscan vs Sonara — AI Job Search Tool Comparison 2026',
  description:
    'A factual, feature-by-feature comparison of the leading AI job search tools in 2026: Joberlify, Teal, Jobscan, and Sonara. Includes use-case recommendations so you can pick the right tool for your situation.',
  keywords: [
    'best AI job search tool 2026',
    'Teal vs Jobscan',
    'Joberlify vs Teal',
    'AI job search comparison',
    'which job search tool should I use',
    'Jobscan alternative',
    'Sonara alternative',
    'AI job search tool review',
  ],
  alternates: { canonical: 'https://joberlify.com/compare' },
  openGraph: {
    title:       'Joberlify vs Teal vs Jobscan vs Sonara — AI Job Search Comparison 2026',
    description: 'Factual feature comparison of the top AI job search tools. Includes per-use-case recommendations.',
    url:         'https://joberlify.com/compare',
    type:        'website',
  },
}

const COMPARISON_SCHEMA = {
  '@context':  'https://schema.org',
  '@type':     'WebPage',
  name:        'AI Job Search Tool Comparison 2026 — Joberlify vs Teal vs Jobscan vs Sonara',
  url:         'https://joberlify.com/compare',
  description: 'A factual comparison of AI-powered job search tools, covering fit scoring, CV generation, visa checks, pricing, and use-case recommendations.',
  about: [
    { '@type': 'SoftwareApplication', name: 'Joberlify', url: 'https://joberlify.com' },
    { '@type': 'SoftwareApplication', name: 'Teal',      url: 'https://tealhq.com' },
    { '@type': 'SoftwareApplication', name: 'Jobscan',   url: 'https://jobscan.co' },
    { '@type': 'SoftwareApplication', name: 'Sonara',    url: 'https://sonara.ai' },
  ],
}

// ─── Data ─────────────────────────────────────────────────────────────────────

type Mark = '✓' | '✗' | '~' | string

interface Row {
  feature:   string
  joberlify: Mark
  teal:      Mark
  jobscan:   Mark
  sonara:    Mark
}

const ROWS: Row[] = [
  {
    feature:   'Multi-dimension fit scoring',
    joberlify: '✓ 10 dimensions',
    teal:      '~ basic match %',
    jobscan:   '~ keyword score only',
    sonara:    '~ proprietary score',
  },
  {
    feature:   'Honest/calibrated grades (A–F)',
    joberlify: '✓',
    teal:      '✗',
    jobscan:   '✗',
    sonara:    '✗',
  },
  {
    feature:   'Written fit assessment',
    joberlify: '✓ per dimension',
    teal:      '~ summary',
    jobscan:   '✗',
    sonara:    '✗',
  },
  {
    feature:   'Growth roadmap for gaps',
    joberlify: '✓',
    teal:      '✗',
    jobscan:   '✗',
    sonara:    '✗',
  },
  {
    feature:   'ATS keyword analysis',
    joberlify: '✓',
    teal:      '✓',
    jobscan:   '✓ core feature',
    sonara:    '~',
  },
  {
    feature:   'Tailored CV generation',
    joberlify: '✓ Pro+',
    teal:      '✓',
    jobscan:   '✗',
    sonara:    '✓',
  },
  {
    feature:   'CV generation from real experience',
    joberlify: '✓ no hallucination',
    teal:      '~',
    jobscan:   '✗',
    sonara:    '~',
  },
  {
    feature:   'UK visa sponsorship check',
    joberlify: '✓ 3-layer',
    teal:      '✗',
    jobscan:   '✗',
    sonara:    '✗',
  },
  {
    feature:   'Sponsor licence database',
    joberlify: '✓ 120,000+',
    teal:      '✗',
    jobscan:   '✗',
    sonara:    '✗',
  },
  {
    feature:   'SOC code classification',
    joberlify: '✓ 350+ codes',
    teal:      '✗',
    jobscan:   '✗',
    sonara:    '✗',
  },
  {
    feature:   'Salary threshold verification',
    joberlify: '✓',
    teal:      '✗',
    jobscan:   '✗',
    sonara:    '✗',
  },
  {
    feature:   'Application pipeline tracker',
    joberlify: '✓',
    teal:      '✓ strong',
    jobscan:   '~ basic',
    sonara:    '✓',
  },
  {
    feature:   'Interview preparation',
    joberlify: '✓',
    teal:      '✓',
    jobscan:   '✗',
    sonara:    '✗',
  },
  {
    feature:   'Automated job discovery',
    joberlify: '~ roadmap',
    teal:      '✗',
    jobscan:   '✗',
    sonara:    '✓ core feature',
  },
  {
    feature:   'Free tier available',
    joberlify: '✓ 3 evals/mo',
    teal:      '✓',
    jobscan:   '✓ limited',
    sonara:    '✓ limited',
  },
  {
    feature:   'Paid plan starting price',
    joberlify: '$17.99/mo',
    teal:      '$29/mo',
    jobscan:   '$49.95/mo',
    sonara:    '$19.99/mo',
  },
]

const TOOLS = ['joberlify', 'teal', 'jobscan', 'sonara'] as const
type Tool = typeof TOOLS[number]

const TOOL_LABELS: Record<Tool, string> = {
  joberlify: 'Joberlify',
  teal:      'Teal',
  jobscan:   'Jobscan',
  sonara:    'Sonara',
}

function cellStyle(val: Mark): React.CSSProperties {
  if (val === '✓' || val.startsWith('✓')) return { color: '#15803D', fontWeight: 600 }
  if (val === '✗')                         return { color: '#B91C1C', opacity: 0.7 }
  return { color: 'rgba(10,22,40,0.55)' }
}

// ─── Recommendation cards ─────────────────────────────────────────────────────

const RECOMMENDATIONS = [
  {
    scenario: 'You need to check UK visa sponsorship',
    tool:     'Joberlify',
    why:      'Joberlify is the only tool that performs a three-layer eligibility check: sponsor licence status, SOC 2020 occupation code classification, and salary threshold verification. No other major job search tool in 2026 offers this functionality.',
  },
  {
    scenario: 'You want to know why you\'re not getting callbacks',
    tool:     'Joberlify',
    why:      'Joberlify\'s 10-dimension scoring with per-dimension explanations gives you specific, actionable feedback. If your experience level is mismatched, your salary expectations are above-market, or your skills have gaps, you\'ll see exactly where — and what to do about it.',
  },
  {
    scenario: 'You want ATS keyword optimisation for an existing CV',
    tool:     'Jobscan',
    why:      'Jobscan\'s core competency is keyword gap analysis between your CV and a job description. If you have a CV you\'re happy with and want to ensure it passes ATS keyword filters for a specific role, Jobscan remains a focused, effective tool for that narrow task.',
  },
  {
    scenario: 'You want a comprehensive job search CRM',
    tool:     'Teal',
    why:      'Teal has the strongest application pipeline management of any tool in this comparison — board views, status tracking, note-taking, and contact management. If your primary need is organising a complex multi-stage job search across many companies, Teal\'s tracker is excellent.',
  },
  {
    scenario: 'You want jobs to come to you automatically',
    tool:     'Sonara',
    why:      'Sonara automates the application process — it discovers matching jobs and submits applications on your behalf. This works best for high-volume, lower-competition roles. For competitive positions where personalisation matters, automated mass-application strategies typically underperform.',
  },
  {
    scenario: 'You need visa sponsorship AND honest fit scoring',
    tool:     'Joberlify',
    why:      'No other tool in 2026 combines multi-dimension fit assessment with UK visa eligibility checks. If both of these requirements apply to your situation — which describes the majority of international job seekers targeting the UK — Joberlify is the only option that addresses both in a single workflow.',
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ComparePage() {
  return (
    <>
      <JsonLd schema={COMPARISON_SCHEMA} />

      <div style={{ backgroundColor: '#FAFAF8', minHeight: '100vh' }}>

        {/* ── Hero ── */}
        <div style={{ backgroundColor: '#0A1628', color: '#FAFAF8' }}>
          <div style={{ maxWidth: 960, margin: '0 auto', padding: '64px 24px 56px' }}>
            <p style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: '#0EA5E9', marginBottom: 14,
            }}>
              Tool Comparison
            </p>
            <h1 style={{
              fontSize: 'clamp(26px, 4.5vw, 44px)', fontWeight: 800,
              letterSpacing: '-0.025em', lineHeight: 1.1,
              marginBottom: 18, maxWidth: 700,
            }}>
              Joberlify vs Teal vs Jobscan vs Sonara
            </h1>
            <p style={{
              fontSize: 17, color: 'rgba(250,250,248,0.60)',
              lineHeight: 1.65, maxWidth: 600, marginBottom: 16,
            }}>
              A factual comparison of the leading AI job search tools in 2026.
              Each tool has genuine strengths — this page is designed to help you
              choose the right one for your specific situation.
            </p>
            <p style={{
              fontSize: 13, color: 'rgba(250,250,248,0.35)',
              lineHeight: 1.5,
            }}>
              We are the team behind Joberlify. We have made every effort to represent
              competing tools accurately and fairly. Features marked ✗ are absent as of
              April 2026 to the best of our knowledge.
            </p>
          </div>
        </div>

        <div style={{ maxWidth: 960, margin: '0 auto', padding: '52px 24px 80px' }}>

          {/* ── Comparison table ── */}
          <section aria-label="Feature comparison table">
            <h2 style={{
              fontSize: 22, fontWeight: 800, color: '#0A1628',
              letterSpacing: '-0.015em', marginBottom: 6,
            }}>
              Feature comparison
            </h2>
            <p style={{
              fontSize: 14, color: 'rgba(10,22,40,0.50)',
              marginBottom: 28, lineHeight: 1.5,
            }}>
              ✓ = available &nbsp;·&nbsp; ✗ = not available &nbsp;·&nbsp; ~ = partial / limited
            </p>

            <div style={{ overflowX: 'auto', marginBottom: 60 }}>
              <table style={{
                width: '100%', borderCollapse: 'collapse',
                fontSize: 14, minWidth: 620,
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#0A1628', color: '#FAFAF8' }}>
                    <th style={{
                      textAlign: 'left', padding: '14px 20px',
                      fontWeight: 700, fontSize: 13, width: '34%',
                      borderRadius: '12px 0 0 0',
                    }}>
                      Feature
                    </th>
                    {TOOLS.map((tool, i) => (
                      <th
                        key={tool}
                        style={{
                          textAlign: 'center', padding: '14px 16px',
                          fontWeight: 700, fontSize: 13,
                          color: tool === 'joberlify' ? '#0EA5E9' : 'rgba(250,250,248,0.75)',
                          borderRadius: i === TOOLS.length - 1 ? '0 12px 0 0' : undefined,
                        }}
                      >
                        {TOOL_LABELS[tool]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row, idx) => (
                    <tr
                      key={row.feature}
                      style={{
                        backgroundColor: idx % 2 === 0 ? 'white' : '#FAFAF8',
                        borderBottom: '1px solid #F0EDE8',
                      }}
                    >
                      <td style={{
                        padding: '12px 20px', fontWeight: 500,
                        color: '#0A1628', lineHeight: 1.5,
                      }}>
                        {row.feature}
                      </td>
                      {TOOLS.map(tool => (
                        <td
                          key={tool}
                          style={{
                            padding: '12px 16px', textAlign: 'center',
                            lineHeight: 1.4,
                            ...cellStyle(row[tool]),
                          }}
                        >
                          {row[tool]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ── Which tool is right for you ── */}
          <section aria-label="Use-case recommendations">
            <h2 style={{
              fontSize: 22, fontWeight: 800, color: '#0A1628',
              letterSpacing: '-0.015em', marginBottom: 8,
            }}>
              Which tool is right for you?
            </h2>
            <p style={{
              fontSize: 15, color: 'rgba(10,22,40,0.55)',
              marginBottom: 32, lineHeight: 1.6,
            }}>
              The best tool depends on your primary need. Here are factual recommendations
              for the most common situations.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 60 }}>
              {RECOMMENDATIONS.map(({ scenario, tool, why }) => (
                <div
                  key={scenario}
                  style={{
                    backgroundColor: 'white',
                    border: '1px solid #E8E4DD',
                    borderRadius: 14, padding: '22px 24px',
                  }}
                >
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ flex: 1 }}>
                      <p style={{
                        fontSize: 12, fontWeight: 700, color: '#0EA5E9',
                        letterSpacing: '0.04em', textTransform: 'uppercase',
                        marginBottom: 4,
                      }}>
                        If: {scenario}
                      </p>
                      <p style={{ fontSize: 15, fontWeight: 700, color: '#0A1628' }}>
                        → Use {tool}
                      </p>
                    </div>
                  </div>
                  <p style={{
                    fontSize: 14, color: 'rgba(10,22,40,0.65)',
                    lineHeight: 1.7,
                  }}>
                    {why}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Detailed tool summaries ── */}
          <section aria-label="Tool summaries" style={{ marginBottom: 60 }}>
            <h2 style={{
              fontSize: 22, fontWeight: 800, color: '#0A1628',
              letterSpacing: '-0.015em', marginBottom: 32,
            }}>
              About each tool
            </h2>

            {[
              {
                name:   'Joberlify',
                tag:    'AI fit scoring + visa intelligence',
                desc:   'Joberlify was built to solve a specific problem: job seekers — particularly international candidates who need UK visa sponsorship — were spending enormous time on applications to roles they were unlikely to win. Its core feature is a 10-dimension fit evaluation that produces honest, calibrated grades. On top of this, it offers ATS-optimised CV generation (from your real experience, not a template), three-layer UK visa sponsorship checks (sponsor licence, SOC code, salary threshold), an application pipeline tracker, and interview preparation. Free tier includes three evaluations per month; Pro ($17.99/mo) adds CV generation and visa checks; Global ($34.99/mo) is unlimited.',
              },
              {
                name:   'Teal',
                tag:    'Job search CRM + CV builder',
                desc:   'Teal is primarily a job search CRM. Its application tracker is the strongest in this comparison — with Kanban-style boards, contact management, and note-taking. Its CV builder is solid and includes keyword analysis against job descriptions. Where Teal is weaker is in evaluating genuine fit beyond keyword matching, and it has no visa-related functionality. Best for: organised job seekers managing a complex search across many companies simultaneously.',
              },
              {
                name:   'Jobscan',
                tag:    'ATS keyword optimisation',
                desc:   'Jobscan is one of the oldest tools in this space and has a clear, focused purpose: it analyses the gap between the keywords in a job description and the keywords in your CV, then tells you what to add. It is good at this specific task. Where it falls short is in anything beyond keyword matching — it doesn\'t evaluate genuine fit, assess growth trajectory, understand context, or check visa eligibility. Best for: candidates who already have a well-written CV and want to ensure it passes specific ATS keyword filters.',
              },
              {
                name:   'Sonara',
                tag:    'Automated job application',
                desc:   'Sonara automates job discovery and application. It scans job boards, identifies roles that match your profile, and submits applications automatically. This approach maximises application volume and works well for high-volume, lower-competition roles. For competitive positions where hiring managers read every application carefully, automated generic applications typically perform poorly. Sonara does not provide granular fit assessment, visa checks, or the kind of insight that leads to interview preparation.',
              },
            ].map(({ name, tag, desc }) => (
              <div
                key={name}
                style={{
                  marginBottom: 28,
                  padding: '24px 28px',
                  backgroundColor: 'white',
                  border: '1px solid #E8E4DD',
                  borderRadius: 14,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0A1628' }}>
                    {name}
                  </h3>
                  <span style={{
                    fontSize: 12, fontWeight: 600,
                    color: '#0EA5E9', padding: '2px 10px',
                    backgroundColor: 'rgba(14,165,233,0.10)',
                    borderRadius: 999,
                  }}>
                    {tag}
                  </span>
                </div>
                <p style={{ fontSize: 15, color: 'rgba(10,22,40,0.70)', lineHeight: 1.75 }}>
                  {desc}
                </p>
              </div>
            ))}
          </section>

          {/* ── CTA ── */}
          <div style={{
            backgroundColor: '#0A1628', borderRadius: 18,
            padding: '40px 36px', textAlign: 'center', color: '#FAFAF8',
          }}>
            <h2 style={{
              fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em',
              marginBottom: 12, lineHeight: 1.3,
            }}>
              Try Joberlify — three evaluations free
            </h2>
            <p style={{
              fontSize: 15, color: 'rgba(250,250,248,0.55)',
              marginBottom: 24, lineHeight: 1.6,
            }}>
              No card required. Upload your CV, paste any job description, get an honest fit
              grade across 10 dimensions.
            </p>
            <Link
              href="/auth/signup"
              style={{
                display: 'inline-flex', alignItems: 'center',
                backgroundColor: '#0EA5E9', color: 'white',
                padding: '13px 26px', borderRadius: 12,
                fontSize: 15, fontWeight: 700, textDecoration: 'none',
              }}
            >
              Start free →
            </Link>
          </div>
        </div>
        <LastUpdated date="2026-04-09" />
      </div>
    </>
  )
}
