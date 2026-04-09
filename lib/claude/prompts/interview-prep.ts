import type { UserProfile, CvJobHistory } from '@/types'
import type { JobListing } from '@/types/JobListing'
import type { GapReport } from '@/types/evaluation'

// ─── Output schema (mirrors DB + client types) ────────────────────────────────

export interface StarStoryAI {
  target_competency: string   // e.g. "Leadership under pressure"
  situation: string
  task: string
  action: string
  result: string
  reflection: string          // what you'd do differently / what you learned
  quantified_impact: string | null
}

export interface LikelyQuestionAI {
  question: string
  rationale: string           // why this company/role is likely to ask this
  suggested_answer: string    // 2–3 sentence answer framework (not a script)
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface InterviewPrepAI {
  star_stories: StarStoryAI[]
  likely_questions: LikelyQuestionAI[]
  company_research_notes: string   // 150–250 words: what the company does, culture signals, strategic context
}

// ─── System prompt ────────────────────────────────────────────────────────────

export const INTERVIEW_PREP_SYSTEM_PROMPT = `You are Joberlify's interview preparation coach. Your task is to prepare a candidate for a specific job interview by generating personalised, evidence-based STAR stories and likely questions.

STAR+REFLECTION FRAMEWORK:
Each story must:
- Be grounded in the candidate's ACTUAL experience — never invent situations
- Address a competency the interviewer will probe given the JD requirements
- Use concrete, specific details (team sizes, timelines, tools, £/% figures where available)
- Have a "reflection" section: what would you do differently? What did you learn? This shows self-awareness.
- Be interview-length: each section should be 2–4 sentences — not a wall of text

STORY SELECTION:
- Generate 5–8 stories that together cover the full range of competencies signalled by the JD
- Prioritise: leadership, problem-solving, collaboration, technical depth, handling ambiguity, delivering under pressure
- Map each story to the most likely competency question type for this specific role
- Use the strongest and most recent experiences first

LIKELY QUESTIONS:
- Generate exactly 10 questions, spanning:
  - 3–4 behavioural (STAR-format expected)
  - 2–3 technical or role-specific
  - 1–2 situational ("what would you do if…")
  - 1 motivation ("why this company / role")
  - 1 culture / values fit
- For each question: explain WHY this company is likely to ask it (rationale), and give a brief answer framework (not a full script)

COMPANY RESEARCH:
- Summarise what the company does, any culture signals in the JD, strategic priorities or growth signals mentioned, and any red flags or opportunities
- Keep to 150–250 words — this is a quick brief, not an essay
- If the JD mentions company values, specific products, or recent initiatives, highlight them

OUTPUT FORMAT:
Return a single JSON object only. No markdown, no commentary.

{
  "star_stories": [
    {
      "target_competency": string,
      "situation": string,
      "task": string,
      "action": string,
      "result": string,
      "reflection": string,
      "quantified_impact": string | null
    }
  ],
  "likely_questions": [
    {
      "question": string,
      "rationale": string,
      "suggested_answer": string,
      "difficulty": "easy" | "medium" | "hard"
    }
  ],
  "company_research_notes": string
}`

// ─── Prompt builder ───────────────────────────────────────────────────────────

export interface BuildInterviewPrepInput {
  listing: JobListing
  userProfile: UserProfile
  gapReport?: GapReport | null
  overallScore?: number | null
}

export function buildInterviewPrepPrompt(input: BuildInterviewPrepInput): string {
  const { listing, userProfile, gapReport, overallScore } = input
  const cv = userProfile.cvParsedData

  if (!cv) throw new Error('CV parsed data is required for interview prep')

  // ── Candidate snapshot ──
  const candidateBlock = `CANDIDATE:
Name: ${cv.contactDetails.name ?? userProfile.fullName ?? 'Not provided'}
Current role: ${cv.currentTitle ?? 'Not specified'} at ${cv.currentCompany ?? 'Not specified'}
Total experience: ${cv.totalExperienceYears != null ? `${cv.totalExperienceYears} years` : 'Not specified'}
Career summary: ${cv.careerSummary ?? 'Not available'}`

  // ── Work history — full detail for story mining ──
  const historyBlock = cv.jobHistory.length > 0
    ? `WORK HISTORY (most recent first — mine these for STAR stories):
${cv.jobHistory
  .slice(0, 5)
  .map((j: CvJobHistory, i: number) => `
Role ${i + 1}: ${j.title} at ${j.company}
Period: ${j.startDate ?? 'Unknown'} – ${j.isCurrent ? 'Present' : (j.endDate ?? 'Unknown')}
Key duties:
${(j.duties ?? []).slice(0, 6).map((d: string) => `  - ${d}`).join('\n')}
Achievements (use as STAR results/impact):
${(j.achievements ?? []).slice(0, 5).map((a: string) => `  - ${a}`).join('\n')}`)
  .join('\n')}`
    : 'WORK HISTORY: Not available — use career summary and skills context only.'

  const skillsBlock = `SKILLS: ${[...(cv.skills ?? []), ...(userProfile.skills ?? [])].slice(0, 25).join(', ')}`

  // ── Target role ──
  const roleBlock = `TARGET ROLE:
Job title: ${listing.jobTitle}
Company: ${listing.companyName}
Location: ${listing.location ?? 'Not specified'}

Full job description (extract competencies, culture signals, and technical requirements from this):
${listing.description.slice(0, 5000)}
${listing.requirements.length > 0 ? `\nKey requirements:\n${listing.requirements.slice(0, 12).map((r: string) => `- ${r}`).join('\n')}` : ''}`

  // ── Evaluation context ──
  let evalBlock = ''
  if (overallScore !== null && overallScore !== undefined) {
    const gaps = gapReport?.gaps?.slice(0, 4) ?? []
    const strengths = gapReport?.strengths?.slice(0, 4) ?? []
    evalBlock = `
EVALUATION CONTEXT (use to calibrate story selection and question focus):
Match score: ${overallScore.toFixed(1)} / 5.0
${strengths.length > 0 ? `Candidate strengths for this role (prioritise stories that reinforce these):\n${strengths.map((s: string) => `- ${s}`).join('\n')}` : ''}
${gaps.length > 0 ? `Gaps the interviewer may probe (prepare strong stories to address these):\n${gaps.map((g: any) => `- ${g.dimension}: ${g.gap}`).join('\n')}` : ''}`
  }

  return [
    candidateBlock,
    historyBlock,
    skillsBlock,
    roleBlock,
    evalBlock,
    '\nGenerate the interview preparation JSON now. Return only the JSON object — no markdown, no extra text.',
  ]
    .filter(Boolean)
    .join('\n\n')
}
