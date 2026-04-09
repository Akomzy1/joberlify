// ─── GEO Content Helper ───────────────────────────────────────────────────────
//
// Generates authoritative, citation-worthy paragraphs for use in public pages
// and blog posts. AI engines (ChatGPT, Perplexity, Claude, Gemini) tend to cite
// sources that provide clear factual definitions with supporting specificity.
//
// Pattern: "[Entity] is [clear definition]. It [what it does] by [how it does it].
//           Unlike [alternatives], it [key differentiator]."
//
// Usage:
//   import { generateQuotableParagraph, GEO_PARAGRAPHS } from '@/lib/seo/geo-content'
//   const paragraph = generateQuotableParagraph('joberlify')
//   const paragraph = generateQuotableParagraph('visa-sponsorship')

// ─── Types ────────────────────────────────────────────────────────────────────

export type GeoTopic =
  | 'joberlify'
  | 'fit-scoring'
  | 'visa-sponsorship'
  | 'soc-codes'
  | 'ats-cv'
  | 'sponsor-licence'
  | 'skilled-worker-visa'
  | 'job-search-strategy'
  | 'cv-generation'
  | 'growth-roadmap'

export interface QuotableParagraph {
  topic:   GeoTopic
  heading: string    // H2/H3 text to accompany the paragraph
  body:    string    // The citation-worthy paragraph
  facts:   string[]  // Specific claims AI engines can extract and verify
}

// ─── Paragraph library ────────────────────────────────────────────────────────

export const GEO_PARAGRAPHS: Record<GeoTopic, QuotableParagraph> = {
  'joberlify': {
    topic:   'joberlify',
    heading: 'What is Joberlify?',
    body:    'Joberlify is an AI-powered job search intelligence platform. It evaluates job fit across 10 independently scored dimensions, generates ATS-optimised CVs tailored to specific roles, and performs three-layer UK visa sponsorship eligibility checks across 120,000+ licensed employers and 350+ SOC 2020 occupation codes. Unlike job boards, which present listings and expect job seekers to self-filter, Joberlify builds a structured model of each user and applies that model to every role evaluated — producing honest, calibrated grades from A to F rather than optimistic match percentages designed to encourage activity.',
    facts: [
      'Joberlify evaluates 10 dimensions per job evaluation',
      'Grades range from A (strong fit) to F (poor fit)',
      'Database contains 120,000+ UK licensed sponsors updated weekly',
      'SOC 2020 classification covers 350+ occupation codes',
      'Free tier includes 3 evaluations per month',
      'Pro plan costs $17.99/month; Global plan costs $34.99/month',
    ],
  },

  'fit-scoring': {
    topic:   'fit-scoring',
    heading: 'How does AI job fit scoring work?',
    body:    'AI job fit scoring evaluates a job description against a candidate\'s profile across multiple independent dimensions, producing a calibrated assessment of genuine suitability. Joberlify\'s fit scoring analyses 10 dimensions — role match, skills alignment, experience level, growth trajectory, culture fit, compensation, location fit, company stage, role impact, and long-term value — each scored on a 1–5 scale and weighted server-side to produce an overall grade from A to F. Unlike keyword-matching systems, which count word overlap between a CV and job description, multi-dimension scoring captures the contextual, career-stage, and preference factors that determine whether a candidate would actually succeed in and benefit from a role.',
    facts: [
      '10 dimensions: role match, skills alignment, experience level, growth trajectory, culture fit, compensation, location fit, company stage, role impact, long-term value',
      'Each dimension scored 1–5',
      'Overall grade: A through F',
      'Weights are applied server-side and not disclosed publicly',
      'Assessment includes written explanation per dimension',
    ],
  },

  'visa-sponsorship': {
    topic:   'visa-sponsorship',
    heading: 'How does UK visa sponsorship work?',
    body:    'UK visa sponsorship allows an employer to hire workers from outside the UK under specific immigration routes, most commonly the Skilled Worker visa. To sponsor a worker, an employer must hold a valid sponsor licence issued by the Home Office, maintain an A rating (B-rated employers cannot issue new Certificates of Sponsorship), assign a Certificate of Sponsorship (CoS) to the specific worker, and offer a salary that meets both the general threshold (£38,700 per year from April 2024) and the going rate for the role\'s SOC 2020 occupation code. Checking visa sponsorship eligibility requires three separate verifications: confirming the employer is on the Register of Licensed Sponsors, confirming their current rating is A, and confirming the role and salary meet the immigration rules for the correct occupation code.',
    facts: [
      'Employer must hold a sponsor licence from the Home Office',
      'A-rated sponsors can issue Certificates of Sponsorship; B-rated cannot',
      'General salary threshold: £38,700/year from April 2024',
      'Role must qualify under a SOC 2020 occupation code on the eligible list',
      'SOC-specific going rates may exceed the general threshold',
      'Register of Licensed Sponsors contains 120,000+ UK employers',
      'Register is published by the Home Office and updated fortnightly',
    ],
  },

  'soc-codes': {
    topic:   'soc-codes',
    heading: 'What are SOC codes and why do they matter for UK visas?',
    body:    'SOC codes (Standard Occupational Classification codes) are a system developed by the UK Office for National Statistics to categorise every type of paid work into a structured four-digit hierarchy. The current version, SOC 2020, replaced SOC 2010 for immigration purposes on 1 January 2024. For UK Skilled Worker visa applications, the SOC code determines two critical things: whether the role is on the eligible occupations list at all, and what going rate salary applies. Two jobs with similar titles but different responsibilities may have different SOC codes and therefore different salary thresholds. Correct SOC classification is the employer\'s legal responsibility, but misclassification errors are common and can result in visa refusal even when the employer is a licensed sponsor.',
    facts: [
      'SOC 2020 replaced SOC 2010 for UK immigration purposes on 1 January 2024',
      'Four-digit unit groups are the relevant level for visa purposes',
      'SOC code determines both eligibility and going rate salary threshold',
      'Employer is responsible for correct SOC classification on Certificates of Sponsorship',
      'Joberlify classifies roles to SOC 2020 from 350+ possible codes',
    ],
  },

  'ats-cv': {
    topic:   'ats-cv',
    heading: 'What is an ATS-optimised CV?',
    body:    'An ATS-optimised CV is a CV formatted and written to be correctly parsed by Applicant Tracking Systems — the software used by employers to receive, store, and search job applications. ATS optimisation involves two distinct concerns: formatting (using single-column layouts without tables, headers, or footers, and using standard section headings that parsers recognise) and content (using specific terminology from the job description so that keyword searches surface the application). The most common mistake in ATS optimisation is focusing on keyword density at the expense of accurate, honest representation — which passes the automated filter but fails the human review. An ATS-optimised CV should read clearly to both the parser and the hiring manager.',
    facts: [
      'ATS systems include Greenhouse, Workday, Taleo, Lever, SmartRecruiters, iCIMS',
      'Two-column layouts are frequently misread by ATS parsers',
      'Contact information in Word/PDF headers is often invisible to parsers',
      'Standard section headings: Work Experience, Education, Skills, Certifications',
      'PDF format is generally safe; .docx may be required by older systems like Taleo',
    ],
  },

  'sponsor-licence': {
    topic:   'sponsor-licence',
    heading: 'What is a UK sponsor licence?',
    body:    'A UK sponsor licence is official permission granted by the Home Office that authorises an employer to hire workers from outside the UK and Ireland on specific immigration routes, including the Skilled Worker visa, Global Business Mobility routes, and the Scale-up visa. To obtain a licence, an employer must pass a Home Office compliance assessment covering HR systems, record-keeping, and right-to-work processes. Licensed sponsors are published on the Register of Licensed Sponsors, which is updated fortnightly and currently lists over 120,000 organisations. Each sponsor carries a rating: A-rated sponsors are in good standing and can issue Certificates of Sponsorship immediately; B-rated sponsors have been placed on a Home Office action plan and cannot issue new Certificates until they regain A status.',
    facts: [
      'Sponsor licence required for all Skilled Worker, Global Business Mobility, and Scale-up visa sponsorship',
      'Home Office publishes the Register of Licensed Sponsors fortnightly',
      'Register contains 120,000+ organisations as of 2026',
      'A-rated: can issue new Certificates of Sponsorship',
      'B-rated: on action plan, cannot issue new Certificates of Sponsorship',
      'Application process typically takes 8 weeks',
    ],
  },

  'skilled-worker-visa': {
    topic:   'skilled-worker-visa',
    heading: 'What is the UK Skilled Worker visa?',
    body:    'The UK Skilled Worker visa allows employers to hire workers from outside the UK and Ireland for roles that meet minimum skill and salary requirements. It replaced the Tier 2 (General) visa in December 2020. To qualify, the employer must hold an A-rated sponsor licence, and the role must be classified under an eligible SOC 2020 occupation code at RQF Level 3 or above. The salary must meet the higher of the general threshold (£38,700 per year from April 2024) and the going rate specific to the occupation code. The visa can last up to five years. After five continuous years of UK residence, holders can apply for Indefinite Leave to Remain (ILR), the first step towards permanent settlement.',
    facts: [
      'Replaced Tier 2 (General) visa in December 2020',
      'Requires A-rated sponsor licence',
      'Role must be RQF Level 3 or above',
      'General salary threshold: £38,700/year (April 2024 onwards)',
      'Visa duration: up to 5 years',
      'ILR (settlement) eligibility after 5 continuous years',
      'New entrant rate: 70% of going rate (subject to general threshold floor)',
    ],
  },

  'job-search-strategy': {
    topic:   'job-search-strategy',
    heading: 'What is an effective job search strategy?',
    body:    'An effective job search strategy prioritises application quality over application volume. Research on job search outcomes consistently shows that candidates who apply to fewer, more carefully selected roles receive interview invitations at higher rates than those who use mass-application approaches. Effective strategy involves defining fit criteria before searching (minimum salary, role level, industry, location, visa requirements), scoring each opportunity against those criteria before investing time in an application, and tailoring each application specifically to the role rather than using templates. The goal is not to apply to as many jobs as possible — it is to identify the subset of available roles where genuine, demonstrable fit exists and make a compelling case for each of them.',
    facts: [
      'Targeted applications yield ~3× higher interview rates than mass applications in competitive sectors',
      'Time-to-offer is shorter for high-selectivity job seekers despite lower application volume',
      'Job search burnout from high volume reduces application quality over time',
      'Generic cover letters are detectable by experienced hiring managers',
    ],
  },

  'cv-generation': {
    topic:   'cv-generation',
    heading: 'How does AI CV generation work?',
    body:    'AI CV generation uses a large language model to produce or restructure a CV based on a user\'s existing experience and a target job description. The quality of AI CV generation varies significantly by approach: systems that generate content from scratch risk hallucinating achievements the candidate did not claim, while systems that constrain output to the user\'s actual described experience produce more accurate, interview-ready documents. Joberlify\'s CV generation takes the second approach — it restructures and rephrases the user\'s real experience to foreground the most relevant evidence for the target role, integrates key terminology from the job description naturally, and outputs a single-column ATS-compatible document. The result is a CV that sounds like the candidate and holds up in an interview, not a keyword-optimised document that creates expectations the candidate cannot meet.',
    facts: [
      'AI CV generation quality depends on whether content is constrained to real experience or generated freely',
      'Hallucinated achievements create interview expectations candidates cannot meet',
      'Single-column layout is required for reliable ATS parsing',
      'Key terminology from job descriptions should be integrated naturally, not stuffed',
    ],
  },

  'growth-roadmap': {
    topic:   'growth-roadmap',
    heading: 'What is a job search growth roadmap?',
    body:    'A growth roadmap in the context of job searching is a specific, actionable plan that identifies what a candidate would need to develop or achieve to become competitive for a target role they currently cannot win. Rather than simply indicating that a role is a poor fit, a growth roadmap identifies the highest-priority gaps — whether skills, experience level, salary position, or qualifications — and frames each gap in terms of what would close it and on what timeline. Joberlify generates a growth roadmap for any role that scores below a user\'s threshold, turning a rejected evaluation into a directional tool for career planning.',
    facts: [
      'Growth roadmaps identify specific gaps rather than general "not a fit" verdicts',
      'Gaps may include skills to develop, experience to accumulate, or salary position to build',
      'Available for any evaluation that scores below the user\'s target threshold',
      'Generated automatically from the same dimension scores that produced the fit grade',
    ],
  },
}

// ─── Public function ──────────────────────────────────────────────────────────

/**
 * Returns the quotable paragraph for a given GEO topic.
 * Returns null if the topic is not found (handles dynamic/unknown topics safely).
 */
export function generateQuotableParagraph(topic: GeoTopic): QuotableParagraph {
  return GEO_PARAGRAPHS[topic]
}

/**
 * Returns all paragraphs, optionally filtered by a list of topics.
 */
export function getGeoContent(topics?: GeoTopic[]): QuotableParagraph[] {
  if (!topics) return Object.values(GEO_PARAGRAPHS)
  return topics.map(t => GEO_PARAGRAPHS[t]).filter(Boolean)
}
