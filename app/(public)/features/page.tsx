import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/seo/JsonLd'
import { LastUpdated } from '@/components/seo/LastUpdated'

// ─── SEO ──────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Features — AI Fit Scoring, CV Generation & Visa Intelligence | Joberlify',
  description:
    'Explore every Joberlify feature: 10-dimension AI fit scoring, ATS-optimised CV generation, three-layer UK visa sponsorship checks across 120,000+ sponsors, application pipeline, interview prep, and growth roadmaps.',
  alternates: { canonical: 'https://joberlify.com/features' },
  openGraph: {
    title:       'Joberlify Features — AI Fit Scoring, CV Generation & Visa Intelligence',
    description: 'Every feature explained: fit scoring, CV generation, visa checks, pipeline, interview prep.',
    url:         'https://joberlify.com/features',
    type:        'website',
  },
}

const FEATURES_SCHEMA = {
  '@context':    'https://schema.org',
  '@type':       'SoftwareApplication',
  name:          'Joberlify',
  url:           'https://joberlify.com',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description:   'AI-powered job search intelligence tool. Evaluates job fit across 10 dimensions, generates ATS-optimised CVs, performs three-layer UK visa sponsorship checks, and tracks applications.',
  featureList: [
    '10-dimension job fit scoring with A–F grade',
    'Per-dimension written assessment and gap analysis',
    'Growth roadmap for below-threshold roles',
    'ATS-optimised CV generation from real experience',
    'UK visa sponsorship eligibility check (three-layer)',
    '120,000+ licensed UK sponsor database',
    '350+ SOC 2020 occupation code classification',
    'Salary threshold verification per SOC code',
    'Application pipeline tracker (Kanban)',
    'Interview question preparation',
    'Sponsor Watch alerts',
  ],
}

// ─── Feature block component ──────────────────────────────────────────────────

function FeatureBlock({
  id, label, title, children, stat,
  reverse = false,
}: {
  id:       string
  label:    string
  title:    string
  children: React.ReactNode
  stat?:    { value: string; desc: string }[]
  reverse?: boolean
}) {
  return (
    <section
      id={id}
      style={{
        padding: '72px 24px',
        borderBottom: '1px solid #E8E4DD',
        backgroundColor: reverse ? 'white' : '#FAFAF8',
      }}
    >
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <p style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: '#0EA5E9', marginBottom: 12,
        }}>
          {label}
        </p>
        <h2 style={{
          fontSize: 'clamp(22px, 3.5vw, 34px)', fontWeight: 800,
          color: '#0A1628', letterSpacing: '-0.02em', lineHeight: 1.2,
          marginBottom: 24, maxWidth: 600,
        }}>
          {title}
        </h2>
        <div style={{
          fontSize: 16, color: 'rgba(10,22,40,0.72)',
          lineHeight: 1.8,
        }}>
          {children}
        </div>
        {stat && (
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 32, marginTop: 36,
            padding: '28px 32px',
            backgroundColor: '#0A1628',
            borderRadius: 16,
          }}>
            {stat.map(({ value, desc }) => (
              <div key={desc}>
                <p style={{
                  fontSize: 32, fontWeight: 800, color: '#0EA5E9',
                  letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 4,
                }}>
                  {value}
                </p>
                <p style={{ fontSize: 13, color: 'rgba(250,250,248,0.50)', lineHeight: 1.4 }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

// ─── Dimension grid ───────────────────────────────────────────────────────────

const DIMENSIONS = [
  { name: 'Role Match',          desc: 'How closely the job title and core responsibilities align with your experience' },
  { name: 'Skills Alignment',    desc: 'Overlap between required skills and your demonstrated capabilities' },
  { name: 'Experience Level',    desc: 'Whether your years and seniority match the role\'s expectations' },
  { name: 'Growth Trajectory',   desc: 'Whether this role is a logical next step for your career direction' },
  { name: 'Culture Fit',         desc: 'Alignment between your stated preferences and cultural signals in the JD' },
  { name: 'Compensation',        desc: 'Whether the salary range meets your expectations' },
  { name: 'Location Fit',        desc: 'Geographic compatibility, including remote and hybrid requirements' },
  { name: 'Company Stage',       desc: 'Match between company size/stage and your preference' },
  { name: 'Role Impact',         desc: 'Scope of influence and decision-making authority in the role' },
  { name: 'Long-term Value',     desc: 'Whether this role advances your five-year career direction' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FeaturesPage() {
  return (
    <>
      <JsonLd schema={FEATURES_SCHEMA} />

      <div style={{ minHeight: '100vh' }}>

        {/* ── Hero ── */}
        <div style={{ backgroundColor: '#0A1628', color: '#FAFAF8' }}>
          <div style={{ maxWidth: 800, margin: '0 auto', padding: '72px 24px 64px' }}>
            <p style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: '#0EA5E9', marginBottom: 14,
            }}>
              Platform Features
            </p>
            <h1 style={{
              fontSize: 'clamp(28px, 5vw, 50px)', fontWeight: 800,
              letterSpacing: '-0.025em', lineHeight: 1.1,
              marginBottom: 20, maxWidth: 620,
            }}>
              Every tool you need to find the right job.
            </h1>
            <p style={{
              fontSize: 18, color: 'rgba(250,250,248,0.60)',
              lineHeight: 1.65, maxWidth: 560, marginBottom: 32,
            }}>
              Fit scoring across 10 dimensions. ATS-optimised CVs. UK visa sponsorship
              intelligence. Pipeline tracking. Interview preparation.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
              {[
                { value: '10', label: 'Scoring dimensions' },
                { value: '120,000+', label: 'UK licensed sponsors' },
                { value: '350+', label: 'SOC 2020 codes' },
              ].map(({ value, label }) => (
                <div key={label}>
                  <p style={{
                    fontSize: 26, fontWeight: 800, color: '#0EA5E9',
                    letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 3,
                  }}>
                    {value}
                  </p>
                  <p style={{ fontSize: 12, color: 'rgba(250,250,248,0.45)' }}>
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Feature 1: AI Fit Scoring ── */}
        <FeatureBlock
          id="ai-fit-scoring"
          label="Feature 01"
          title="AI Fit Scoring — 10 dimensions, one honest grade"
          stat={[
            { value: '10', desc: 'independent scoring dimensions' },
            { value: 'A–F', desc: 'calibrated grade scale' },
          ]}
        >
          <p style={{ marginBottom: 20 }}>
            Joberlify&apos;s core feature is a multi-dimension fit evaluation. When you paste a
            job description, the AI analyses it against your profile across 10 independent
            dimensions — each scored on a 1–5 scale and weighted by importance. The result
            is an overall grade from A (strong fit) to F (poor fit) with a written explanation
            of each dimension.
          </p>
          <p style={{ marginBottom: 20 }}>
            The 10 dimensions cover every meaningful aspect of job fit: role match, skills
            alignment, experience level, growth trajectory, culture fit, compensation
            alignment, location fit, company stage, role impact, and long-term career value.
            This is fundamentally different from keyword matching — it reflects how hiring
            managers actually evaluate candidates.
          </p>
          <p style={{ marginBottom: 32 }}>
            Crucially, Joberlify grades are calibrated for honesty, not engagement. If a role
            is a poor fit, you&apos;ll receive a D or F — not an inflated score designed to
            encourage you to apply anyway. This saves you time and protects you from wasting
            effort on processes you&apos;re unlikely to win.
          </p>

          {/* Dimensions grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 12,
          }}>
            {DIMENSIONS.map(({ name, desc }, i) => (
              <div
                key={name}
                style={{
                  padding: '14px 16px',
                  backgroundColor: 'white',
                  border: '1px solid #E8E4DD',
                  borderRadius: 12,
                }}
              >
                <p style={{
                  fontSize: 12, fontWeight: 800, color: '#0EA5E9',
                  fontFamily: "'JetBrains Mono', monospace",
                  marginBottom: 4,
                }}>
                  {String(i + 1).padStart(2, '0')}
                </p>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#0A1628', marginBottom: 4 }}>
                  {name}
                </p>
                <p style={{ fontSize: 12, color: 'rgba(10,22,40,0.55)', lineHeight: 1.5 }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </FeatureBlock>

        {/* ── Feature 2: Tailored CV Generation ── */}
        <FeatureBlock
          id="cv-generation"
          label="Feature 02"
          title="Tailored CV Generation — from your real experience"
          reverse
        >
          <p style={{ marginBottom: 20 }}>
            Joberlify&apos;s CV generation takes the job description you&apos;ve evaluated and produces
            a fully restructured, ATS-optimised CV tailored to that specific role. It uses your
            actual experience — not a template, not AI-fabricated claims — and rephrases and
            reorders your experience to foreground the most relevant evidence.
          </p>
          <p style={{ marginBottom: 20 }}>
            The output includes appropriate keywords from the job description (naturally
            integrated, not stuffed), a role-specific profile summary, and achievement-led
            bullet points that quantify impact where your data allows it. The formatting is
            clean, single-column, and compatible with all major ATS systems including
            Greenhouse, Workday, Taleo, and Lever.
          </p>
          <p>
            Unlike generic AI CV tools that produce plausible-sounding but untrue achievements,
            Joberlify&apos;s generation is constrained to what you&apos;ve actually told it.
            This produces CVs that hold up in interviews — which is the only measure of whether
            a CV is actually good.
          </p>
        </FeatureBlock>

        {/* ── Feature 3: Visa Sponsorship Intelligence ── */}
        <FeatureBlock
          id="visa-intelligence"
          label="Feature 03"
          title="Visa Sponsorship Intelligence — three layers, not one"
          stat={[
            { value: '120,000+', desc: 'UK licensed sponsors in database' },
            { value: '350+', desc: 'SOC 2020 occupation codes' },
            { value: '3', desc: 'eligibility layers checked' },
          ]}
        >
          <p style={{ marginBottom: 20 }}>
            Checking whether a job offers UK visa sponsorship is more complex than most job
            seekers realise — and getting it wrong costs months. Joberlify performs a
            three-layer eligibility check that covers every requirement.
          </p>

          {[
            {
              layer: 'Layer 1: Sponsor licence',
              desc: 'Joberlify cross-references the employer against the UK Home Office Register of Licensed Sponsors — updated weekly and containing 120,000+ organisations. It also checks the employer\'s rating: only A-rated sponsors can issue new Certificates of Sponsorship. B-rated employers are on a Home Office action plan and cannot currently sponsor new hires.',
            },
            {
              layer: 'Layer 2: SOC 2020 occupation code',
              desc: 'Every role must be classified under a qualifying SOC 2020 occupation code (the UK Standard Occupational Classification system). Joberlify analyses the full text of the job description and classifies it to the most appropriate code from 350+ possibilities — not just by job title, which is frequently misleading.',
            },
            {
              layer: 'Layer 3: Salary threshold',
              desc: 'The advertised salary must meet both the general threshold (£38,700 from April 2024) and the going rate specific to the SOC code — which for many technical, medical, and professional roles is higher. Joberlify verifies both. If new entrant rates apply (recent graduates, under-26s), it checks those rates instead.',
            },
          ].map(({ layer, desc }) => (
            <div
              key={layer}
              style={{
                marginBottom: 20, padding: '16px 20px',
                backgroundColor: 'white',
                border: '1px solid #E8E4DD', borderRadius: 12,
              }}
            >
              <p style={{ fontSize: 14, fontWeight: 700, color: '#0A1628', marginBottom: 6 }}>
                {layer}
              </p>
              <p style={{ fontSize: 14, color: 'rgba(10,22,40,0.65)', lineHeight: 1.7 }}>
                {desc}
              </p>
            </div>
          ))}

          <p style={{ marginTop: 8 }}>
            This three-layer check is unique to Joberlify. No other consumer job search tool
            in 2026 combines sponsor register lookup, SOC code classification, and salary
            threshold verification in a single workflow.
          </p>
        </FeatureBlock>

        {/* ── Feature 4: Application Pipeline ── */}
        <FeatureBlock
          id="pipeline"
          label="Feature 04"
          title="Application Pipeline — track everything in one place"
          reverse
        >
          <p style={{ marginBottom: 20 }}>
            The Joberlify pipeline tracker keeps your entire job search organised in a
            structured board. Every application moves through defined stages — Saved,
            Applied, Phone Screen, Interview, Offer, and Rejected — with timestamps and
            notes at each stage.
          </p>
          <p style={{ marginBottom: 20 }}>
            When you evaluate a job that scores well, it can be added to your pipeline
            directly from the evaluation screen. If you generate a CV for the role, it&apos;s
            linked to that pipeline entry. This creates a coherent thread from initial
            evaluation to final outcome — giving you a clear picture of your search at a glance.
          </p>
          <p>
            The pipeline also surfaces patterns over time: which types of roles you advance
            furthest in, where you most often get stuck, and which companies take the longest
            to respond. This data, over a real job search, is genuinely useful for adjusting
            strategy.
          </p>
        </FeatureBlock>

        {/* ── Feature 5: Interview Prep ── */}
        <FeatureBlock
          id="interview-prep"
          label="Feature 05"
          title="Interview Preparation — specific, not generic"
        >
          <p style={{ marginBottom: 20 }}>
            Generic interview prep — &quot;tell me about yourself,&quot; &quot;what&apos;s your greatest
            weakness&quot; — is available everywhere. Joberlify&apos;s interview preparation is specific
            to the role you&apos;re interviewing for and the gaps identified in your fit evaluation.
          </p>
          <p style={{ marginBottom: 20 }}>
            For each job in your pipeline, Joberlify generates a set of likely interview
            questions based on the job description and your specific profile. It then suggests
            how to structure your answers using your actual experience — drawing on the
            same data that powered your CV generation and fit score.
          </p>
          <p>
            If your evaluation identified weaknesses — for example, that your experience level
            is slightly below what the role expects — the interview prep addresses how to handle
            those specific questions honestly and confidently.
          </p>
        </FeatureBlock>

        {/* ── Feature 6: Growth Roadmap ── */}
        <FeatureBlock
          id="growth-roadmap"
          label="Feature 06"
          title="Growth Roadmap — not yet, with a path to get there"
          reverse
        >
          <p style={{ marginBottom: 20 }}>
            When a role scores below your threshold — when the honest answer is &quot;not yet&quot; —
            Joberlify doesn&apos;t just display a low grade and move on. It generates a growth
            roadmap: a specific account of what would need to change for this role to become
            a realistic target.
          </p>
          <p style={{ marginBottom: 20 }}>
            The roadmap identifies the highest-priority gaps. If your skills are 80% matched
            but your experience level scores low, it will tell you what additional experience
            (and roughly how long it would take to accumulate) would shift you into a
            competitive range. If salary is the issue, it will tell you what roles to target
            in the interim that would build your negotiating position.
          </p>
          <p>
            The growth roadmap is the feature that most directly reflects Joberlify&apos;s core
            philosophy: the goal is not to help you apply to more jobs. It is to help you
            get to the right job — on a realistic timeline, with an honest account of what
            it takes to get there.
          </p>
        </FeatureBlock>

        {/* ── CTA ── */}
        <div style={{ backgroundColor: '#0A1628', padding: '72px 24px' }}>
          <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', color: '#FAFAF8' }}>
            <h2 style={{
              fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 800,
              letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 16,
            }}>
              Try every feature free.
            </h2>
            <p style={{
              fontSize: 16, color: 'rgba(250,250,248,0.55)',
              lineHeight: 1.65, marginBottom: 32,
            }}>
              Three evaluations per month on the free tier. No card required.
              Upgrade to Pro for CV generation and visa checks.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                href="/auth/signup"
                style={{
                  display: 'inline-flex', alignItems: 'center',
                  backgroundColor: '#0EA5E9', color: 'white',
                  padding: '14px 28px', borderRadius: 12,
                  fontSize: 15, fontWeight: 700, textDecoration: 'none',
                }}
              >
                Start free →
              </Link>
              <Link
                href="/pricing"
                style={{
                  display: 'inline-flex', alignItems: 'center',
                  border: '1px solid rgba(250,250,248,0.20)',
                  color: 'rgba(250,250,248,0.70)',
                  padding: '14px 28px', borderRadius: 12,
                  fontSize: 15, fontWeight: 600, textDecoration: 'none',
                }}
              >
                View pricing
              </Link>
            </div>
          </div>
        </div>
        <LastUpdated date="2026-04-09" />
      </div>
    </>
  )
}
