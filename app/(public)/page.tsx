import type { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import { LandingPage } from './LandingPage'

// ─── SEO Metadata ─────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'AI-Powered Job Search Tool | Score Fit, Generate CVs, Check Visa Sponsorship',
  description:
    'Joberlify is an AI-powered job search tool that scores your fit across 10 dimensions, generates ATS-optimised CVs tailored to specific roles, and checks UK visa sponsorship eligibility across 120,000+ licensed employers. Start free.',
  keywords: [
    'AI job search tool',
    'job fit scoring AI',
    'visa sponsorship jobs UK',
    'ATS-optimised CV generator',
    'job application tracker',
    'UK visa sponsor checker',
    'skilled worker visa eligibility',
    'job evaluation tool',
  ],
  alternates: { canonical: 'https://joberlify.com/' },
  openGraph: {
    title: 'AI-Powered Job Search Tool | Score Fit, Generate CVs, Check Visa Sponsorship | Joberlify',
    description:
      'Score your fit across 10 dimensions. Generate tailored CVs. Navigate UK visa sponsorship — with honesty, not hype.',
    url: 'https://joberlify.com/',
    type: 'website',
  },
}

// ─── Structured data ──────────────────────────────────────────────────────────

const ORGANIZATION_SCHEMA = {
  '@context': 'https://schema.org',
  '@type':    'Organization',
  name:        'Joberlify',
  url:         'https://joberlify.com',
  logo:        'https://joberlify.com/logo.png',
  description: 'AI-powered job search intelligence. Evaluate job fit across 10 dimensions, generate tailored ATS-optimised CVs, and navigate UK visa sponsorship across 120,000+ licensed employers.',
  sameAs: [],
  contactPoint: {
    '@type':       'ContactPoint',
    contactType:   'customer support',
    email:         'hello@joberlify.com',
    availableLanguage: 'English',
  },
}

const SOFTWARE_SCHEMA = {
  '@context':           'https://schema.org',
  '@type':              'SoftwareApplication',
  name:                 'Joberlify',
  applicationCategory:  'BusinessApplication',
  operatingSystem:      'Web',
  url:                  'https://joberlify.com',
  description:
    'AI-powered job search intelligence tool that evaluates job fit across 10 weighted dimensions, generates ATS-optimised CVs tailored to specific roles, and performs three-layer UK visa sponsorship eligibility checks across 120,000+ licensed employers and 350+ SOC 2020 occupation codes.',
  featureList: [
    '10-dimension job fit scoring',
    'ATS-optimised CV generation',
    'UK visa sponsorship eligibility check',
    '120,000+ sponsor database',
    'SOC 2020 occupation code classification',
    'Application pipeline tracker',
    'Interview preparation',
    'Sponsor Watch alerts',
  ],
  offers: [
    {
      '@type':         'Offer',
      name:            'Free',
      price:           '0',
      priceCurrency:   'USD',
      description:     '3 evaluations/month, 10 pipeline items, sponsor browse',
    },
    {
      '@type':         'Offer',
      name:            'Pro',
      price:           '17.99',
      priceCurrency:   'USD',
      description:     '30 evaluations/month, CV generation, visa eligibility checks',
      priceSpecification: {
        '@type':              'UnitPriceSpecification',
        price:                '17.99',
        priceCurrency:        'USD',
        unitCode:             'MON',
      },
    },
    {
      '@type':         'Offer',
      name:            'Global',
      price:           '34.99',
      priceCurrency:   'USD',
      description:     'Unlimited evaluations and CVs, Sponsor Watch alerts, growth roadmap',
      priceSpecification: {
        '@type':              'UnitPriceSpecification',
        price:                '34.99',
        priceCurrency:        'USD',
        unitCode:             'MON',
      },
    },
  ],
}

const FAQ_SCHEMA = {
  '@context':  'https://schema.org',
  '@type':     'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name:    'What is Joberlify?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:    'Joberlify is an AI-powered job search intelligence tool. It scores your fit against any job description across 10 weighted dimensions, generates ATS-optimised CVs tailored to specific roles, verifies UK visa sponsorship eligibility, and tracks your applications in a personal pipeline.',
      },
    },
    {
      '@type': 'Question',
      name:    'How does Joberlify\'s fit scoring work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:    'Joberlify analyses each job description against your CV and preferences across 10 dimensions: role match, skills alignment, experience level, growth trajectory, culture fit, compensation, location fit, company stage, role impact, and long-term value. Each dimension is scored 1–5 and weighted server-side to produce an overall grade from A to F.',
      },
    },
    {
      '@type': 'Question',
      name:    'Does Joberlify check visa sponsorship?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:    'Yes. Joberlify cross-references over 120,000 UK-licensed sponsors against the job you are evaluating, classifies the role to the correct SOC 2020 occupation code from 350+ codes, and checks whether the advertised salary meets the Skilled Worker visa threshold for that specific occupation.',
      },
    },
    {
      '@type': 'Question',
      name:    'Is Joberlify free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:    'Yes — Joberlify has a free tier with 3 AI evaluations per month, access to the UK sponsor database, and a 10-item application pipeline. Pro ($17.99/month) unlocks 30 evaluations, tailored CV generation, and visa eligibility checks. Global ($34.99/month) is fully unlimited.',
      },
    },
    {
      '@type': 'Question',
      name:    'How is Joberlify different from Teal or Jobscan?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:    'Teal and Jobscan focus primarily on keyword matching for ATS optimisation. Joberlify goes further: it evaluates genuine fit across 10 dimensions, provides a frank recommendation (including "not yet" with a path to get there), checks visa sponsorship feasibility in real time, and generates a fully tailored CV — not just an optimised version of the one you already have.',
      },
    },
    {
      '@type': 'Question',
      name:    'How does Joberlify find jobs for me?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:    'After you upload your CV and complete your profile, Joberlify learns your skills, experience, career direction, and visa needs. It then scans company career pages and job boards, pre-scores every listing against your profile, and surfaces only those where your fit score meets a threshold you define.',
      },
    },
  ],
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <>
      <JsonLd schema={ORGANIZATION_SCHEMA} />
      <JsonLd schema={SOFTWARE_SCHEMA} />
      <JsonLd schema={FAQ_SCHEMA} />
      <LandingPage />
    </>
  )
}
