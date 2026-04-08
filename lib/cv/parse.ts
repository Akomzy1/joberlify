import anthropic, { CLAUDE_MODELS, CLAUDE_TIMEOUTS } from '@/lib/claude/client'
import { CV_PARSE_SYSTEM_PROMPT, buildCvParsePrompt } from '@/lib/claude/prompts/parse-cv'
import type { CvParsedData } from '@/types'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

export class CvParseError extends Error {
  constructor(
    message: string,
    public readonly code: 'UNSUPPORTED_TYPE' | 'FILE_TOO_LARGE' | 'EMPTY_TEXT' | 'PARSE_FAILED' | 'AI_ERROR',
  ) {
    super(message)
    this.name = 'CvParseError'
  }
}

// ─── Text extraction ──────────────────────────────────────────────────────────

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // Dynamic import — pdf-parse uses require() internally and can cause issues with Next.js
  // if imported at module level. Also avoids bundling in edge runtime.
  // pdf-parse v2 is ESM — the module itself is the callable function
  const pdfParse = (await import('pdf-parse')) as unknown as (
    data: Buffer,
    options?: Record<string, unknown>,
  ) => Promise<{ text: string; numpages: number }>
  const result = await pdfParse(buffer, {
    // Disable test-file warnings
    max: 0,
  })
  return result.text.trim()
}

async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import('mammoth')
  const result = await mammoth.extractRawText({ buffer })
  if (result.messages.some((m) => m.type === 'error')) {
    // Non-fatal — proceed with partial text
  }
  return result.value.trim()
}

export async function extractTextFromFile(file: File): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    throw new CvParseError(`File exceeds maximum size of 10 MB (received ${(file.size / 1024 / 1024).toFixed(1)} MB)`, 'FILE_TOO_LARGE')
  }

  const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf')
  const isDocx =
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.type === 'application/msword' ||
    file.name.endsWith('.docx') ||
    file.name.endsWith('.doc')

  if (!isPdf && !isDocx) {
    throw new CvParseError(`Unsupported file type. Please upload a PDF or DOCX file.`, 'UNSUPPORTED_TYPE')
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const text = isPdf ? await extractTextFromPdf(buffer) : await extractTextFromDocx(buffer)

  if (!text || text.length < 50) {
    throw new CvParseError(
      `Could not extract readable text from the file. The PDF may be image-based (scanned). Try a text-based PDF or DOCX instead.`,
      'EMPTY_TEXT',
    )
  }

  return text
}

// ─── AI parsing ───────────────────────────────────────────────────────────────

export async function parseCvWithAI(rawText: string): Promise<CvParsedData> {
  let responseText = ''

  try {
    const message = await anthropic.messages.create(
      {
        model: CLAUDE_MODELS.haiku,
        max_tokens: 4096,
        system: CV_PARSE_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildCvParsePrompt(rawText) }],
      },
      { timeout: CLAUDE_TIMEOUTS.parsing },
    )

    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Unexpected response type from Claude')
    responseText = content.text.trim()
  } catch (err) {
    throw new CvParseError(
      `AI parsing failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      'AI_ERROR',
    )
  }

  // Strip any accidental markdown code fences
  const cleaned = responseText.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()

  let parsed: Omit<CvParsedData, 'rawText'>
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new CvParseError(`AI returned invalid JSON. Response: ${cleaned.slice(0, 200)}`, 'PARSE_FAILED')
  }

  // Validate required top-level fields exist
  if (!parsed.contactDetails || !Array.isArray(parsed.jobHistory) || !Array.isArray(parsed.skills)) {
    throw new CvParseError('AI response missing required fields (contactDetails, jobHistory, skills)', 'PARSE_FAILED')
  }

  return {
    ...parsed,
    rawText,
    // Ensure arrays are always arrays even if AI returns null
    skills: Array.isArray(parsed.skills) ? parsed.skills : [],
    qualifications: Array.isArray(parsed.qualifications) ? parsed.qualifications : [],
    certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
    languages: Array.isArray(parsed.languages) ? parsed.languages : [],
    jobHistory: Array.isArray(parsed.jobHistory) ? parsed.jobHistory : [],
    parseWarnings: Array.isArray(parsed.parseWarnings) ? parsed.parseWarnings : [],
  }
}

// ─── Full pipeline ────────────────────────────────────────────────────────────

export async function parseCvFile(file: File): Promise<CvParsedData> {
  const rawText = await extractTextFromFile(file)
  return parseCvWithAI(rawText)
}
