import type { UserProfile, CvJobHistory, CvParsedData } from '@/types'
import type { JobListing } from '@/types/JobListing'
import type { GapReport } from '@/types/evaluation'

// ─── Target format type ───────────────────────────────────────────────────────

export type CvTargetFormat = 'uk' | 'us' | 'generic'

// ─── Structured CV output schema ──────────────────────────────────────────────

export interface CvPersonalDetails {
  name: string
  email: string
  phone: string | null
  location: string | null
  linkedin: string | null
  github: string | null
  website: string | null
}

export interface CvExperienceItem {
  title: string
  company: string
  location: string | null
  startDate: string      // e.g. "Jan 2022"
  endDate: string | null // null = "Present"
  employmentType: string | null
  bulletPoints: string[] // 4–6 bullets, quantified, role-relevant
}

export interface CvEducationItem {
  degree: string
  institution: string
  location: string | null
  year: string | null
  field: string | null
  grade: string | null
}

export interface CvSkillsSection {
  technical: string[]
  soft: string[]
  languages?: string[]
}

export interface CvCertificationItem {
  name: string
  issuer: string | null
  year: number | null
}

export interface GeneratedCvData {
  format: CvTargetFormat
  personalDetails: CvPersonalDetails
  professionalSummary: string  // 3–4 sentences, ATS-optimised, role-specific
  experience: CvExperienceItem[]
  education: CvEducationItem[]
  skills: CvSkillsSection
  certifications: CvCertificationItem[]
  keyAchievements: string[]  // top 3–5 career highlights, each ≤ 2 lines
  tailoringNotes: string     // brief internal note on emphasis choices
}

// ─── System prompt ────────────────────────────────────────────────────────────

export const GENERATE_CV_SYSTEM_PROMPT = `You are Joberlify's CV engine. Your task is to create a high-quality, ATS-optimised CV tailored to a specific job listing.

CORE PRINCIPLES:
- Every word must earn its place. Remove filler phrases ("responsible for", "assisted with").
- Lead with impact. Start bullet points with strong action verbs (Delivered, Built, Reduced, Increased, Led, Designed, Implemented).
- Quantify everything possible. Turn "improved performance" into "improved API response time by 40% (p95)".
- Mirror the job description's language naturally — ATS systems score keyword density.
- Reorganise experience bullet points to lead with duties most relevant to THIS specific role.
- Never invent experience or credentials. Enhance and reframe what exists.
- Keep it truthful and verifiable. No fabrications.

FORMAT RULES BY TARGET:
- UK: No photo, no date of birth, no marital status. 2 pages maximum. Chronological order. Clear section: Personal Details, Professional Summary, Experience, Education, Skills, Certifications.
- US: Achievements-first bullet structure. 1 page for <10 years experience, 2 pages max. Accomplishments-heavy. "Resume" style. Include a strong professional summary.
- Generic (International): Balanced format. No personal details beyond name/email/phone/LinkedIn. Professional summary leads. Clean sections.

ATS-SAFETY RULES:
- No columns, tables, or multi-column layouts — these confuse ATS parsers.
- No headers/footers — repeat contact details in the body.
- Standard section headings ATS recognises: "Professional Summary", "Work Experience", "Education", "Skills", "Certifications".
- Use standard bullet characters (-) not special Unicode symbols.
- No images, graphics, or charts.

OUTPUT FORMAT:
Return a single JSON object matching this exact schema. No markdown, no explanation — just the JSON.

{
  "format": "uk" | "us" | "generic",
  "personalDetails": {
    "name": string,
    "email": string,
    "phone": string | null,
    "location": string | null,
    "linkedin": string | null,
    "github": string | null,
    "website": string | null
  },
  "professionalSummary": string,
  "experience": [
    {
      "title": string,
      "company": string,
      "location": string | null,
      "startDate": string,
      "endDate": string | null,
      "employmentType": string | null,
      "bulletPoints": string[]
    }
  ],
  "education": [
    {
      "degree": string,
      "institution": string,
      "location": string | null,
      "year": string | null,
      "field": string | null,
      "grade": string | null
    }
  ],
  "skills": {
    "technical": string[],
    "soft": string[],
    "languages": string[]
  },
  "certifications": [
    { "name": string, "issuer": string | null, "year": number | null }
  ],
  "keyAchievements": string[],
  "tailoringNotes": string
}`

// ─── Prompt builder ───────────────────────────────────────────────────────────

export interface GenerateCvInput {
  listing: JobListing
  userProfile: UserProfile
  format: CvTargetFormat
  gapReport?: GapReport | null
  overallScore?: number
  emphasis?: string  // optional user instruction e.g. "Emphasise leadership"
}

export function buildGenerateCvPrompt(input: GenerateCvInput): string {
  const { listing, userProfile, format, gapReport, overallScore, emphasis } = input
  const cv = userProfile.cvParsedData

  if (!cv) throw new Error('CV parsed data is required to generate a tailored CV')

  const contact = cv.contactDetails
  const formatLabel = { uk: 'UK Standard', us: 'US Resume', generic: 'International/Generic' }[format]

  // ── Candidate identity ──
  const identityBlock = `CANDIDATE PROFILE:
Name: ${contact.name ?? userProfile.fullName ?? 'Not provided'}
Email: ${contact.email ?? 'Not provided'}
Phone: ${contact.phone ?? 'Not provided'}
Location: ${[userProfile.currentCity, userProfile.currentCountry].filter(Boolean).join(', ') || 'Not provided'}
LinkedIn: ${userProfile.linkedinUrl ?? 'Not provided'}
Total experience: ${cv.totalExperienceYears != null ? `${cv.totalExperienceYears} years` : 'Not specified'}
Current role: ${cv.currentTitle ?? 'Not specified'} at ${cv.currentCompany ?? 'Not specified'}
Education level: ${cv.educationLevel ?? 'Not specified'}`

  // ── Work history ──
  const historyBlock = cv.jobHistory.length > 0
    ? `WORK HISTORY (most recent first):
${cv.jobHistory
  .slice(0, 6)
  .map((j: CvJobHistory, i: number) => `
Role ${i + 1}: ${j.title} at ${j.company}
Period: ${j.startDate ?? 'Unknown'} – ${j.isCurrent ? 'Present' : (j.endDate ?? 'Unknown')}
Type: ${j.employmentType ?? 'Not specified'}
Duties:
${(j.duties ?? []).slice(0, 8).map((d: string) => `  - ${d}`).join('\n')}
Achievements:
${(j.achievements ?? []).slice(0, 5).map((a: string) => `  - ${a}`).join('\n')}`
  )
  .join('\n')}`
    : 'WORK HISTORY: Not available — use career summary and skills to generate relevant experience.'

  // ── Education & credentials ──
  const educationBlock = cv.qualifications.length > 0
    ? `EDUCATION & QUALIFICATIONS:
${cv.qualifications.map((q: any) => `- ${q.degree ?? q}${q.field ? ` in ${q.field}` : ''}, ${q.institution ?? ''} (${q.year ?? 'Year unknown'})`).join('\n')}`
    : 'EDUCATION: Not detailed — use educationLevel indicator only.'

  const certBlock = cv.certifications.length > 0
    ? `CERTIFICATIONS: ${cv.certifications.map((c: any) => `${c.name}${c.issuer ? ` (${c.issuer})` : ''}${c.year ? `, ${c.year}` : ''}`).join('; ')}`
    : ''

  const skillsBlock = `SKILLS: ${[...new Set([...(cv.skills ?? []), ...(userProfile.skills ?? [])])].slice(0, 30).join(', ')}`

  const languagesBlock = cv.languages?.length > 0
    ? `LANGUAGES: ${cv.languages.join(', ')}`
    : ''

  // ── Job to tailor to ──
  const jobBlock = `TARGET JOB:
Title: ${listing.jobTitle}
Company: ${listing.companyName}
Location: ${listing.location ?? 'Not specified'}
${listing.salaryText ? `Salary: ${listing.salaryText}` : ''}

Job Description (use these keywords naturally in the CV):
${listing.description.slice(0, 4000)}
${listing.requirements.length > 0 ? `\nKey Requirements:\n${listing.requirements.slice(0, 10).map((r: string) => `- ${r}`).join('\n')}` : ''}`

  // ── Evaluation context ──
  let evalBlock = ''
  if (gapReport || overallScore) {
    evalBlock = `\nEVALUATION CONTEXT (use to prioritise tailoring):
Match score: ${overallScore?.toFixed(1) ?? 'Not scored'} / 5.0
${gapReport?.strengths?.length ? `Candidate strengths for this role:\n${gapReport.strengths.slice(0, 4).map((s: string) => `- ${s}`).join('\n')}` : ''}
${gapReport?.gaps?.length ? `Gaps to address in CV presentation:\n${gapReport.gaps.slice(0, 4).map((g: any) => `- ${g.dimension}: ${g.gap}`).join('\n')}` : ''}`
  }

  // ── Format instruction ──
  const formatBlock = `\nOUTPUT FORMAT: ${formatLabel}
${format === 'uk' ? '- Follow UK CV conventions: no photo, no DOB, chronological, 2-page maximum.' : ''}
${format === 'us' ? '- Follow US resume conventions: achievements-first bullets, accomplishments-heavy, strong summary.' : ''}
${format === 'generic' ? '- International format: clean, concise, professional. Suitable for any country.' : ''}`

  const emphasisBlock = emphasis
    ? `\nUSER INSTRUCTION: The candidate wants extra emphasis on: ${emphasis}`
    : ''

  return [
    identityBlock,
    historyBlock,
    educationBlock,
    certBlock,
    skillsBlock,
    languagesBlock,
    jobBlock,
    evalBlock,
    formatBlock,
    emphasisBlock,
    '\nGenerate the tailored CV JSON now. Return only the JSON object — no markdown, no commentary.',
  ]
    .filter(Boolean)
    .join('\n\n')
}
