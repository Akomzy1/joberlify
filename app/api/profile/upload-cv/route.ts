import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractTextFromFile, parseCvWithAI, CvParseError } from '@/lib/cv/parse'

// Route segment config — disable body parsing (we handle multipart manually)
export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Parse multipart form ───────────────────────────────────────────────────
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid multipart form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'No file provided. Include a "file" field in the form data.' }, { status: 400 })
  }

  // ── Server-side file validation ────────────────────────────────────────────
  if (file.size === 0) {
    return NextResponse.json(
      { error: "We couldn't read this file. Try a different version.", code: 'EMPTY_FILE' },
      { status: 400 },
    )
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json(
      { error: 'Please upload a CV under 5MB.', code: 'FILE_TOO_LARGE' },
      { status: 400 },
    )
  }
  const fileExt = file.name.split('.').pop()?.toLowerCase()
  if (!['pdf', 'doc', 'docx'].includes(fileExt ?? '')) {
    return NextResponse.json(
      { error: 'We accept PDF and DOCX files only.', code: 'INVALID_FORMAT' },
      { status: 400 },
    )
  }

  // ── Extract text ───────────────────────────────────────────────────────────
  let rawText: string
  try {
    rawText = await extractTextFromFile(file)
  } catch (err) {
    if (err instanceof CvParseError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 422 })
    }
    return NextResponse.json({ error: 'Failed to read file' }, { status: 500 })
  }

  // ── Upload raw file to Supabase Storage ───────────────────────────────────
  const ext = file.name.endsWith('.docx') ? 'docx' : file.name.endsWith('.doc') ? 'doc' : 'pdf'
  const storagePath = `${user.id}/cv-${Date.now()}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadError } = await supabase.storage
    .from('cvs')
    .upload(storagePath, arrayBuffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })

  if (uploadError) {
    // Non-fatal — continue with parsing even if storage fails
    console.error('[upload-cv] Storage error:', uploadError.message)
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('cvs').getPublicUrl(storagePath)

  // ── AI parsing ────────────────────────────────────────────────────────────
  let parsedData
  try {
    parsedData = await parseCvWithAI(rawText)
  } catch (err) {
    if (err instanceof CvParseError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 422 })
    }
    return NextResponse.json({ error: 'AI parsing failed. Please try again.' }, { status: 500 })
  }

  // ── Update user_profiles ──────────────────────────────────────────────────
  const { error: profileError } = await supabase.from('user_profiles').upsert({
    user_id: user.id,
    raw_cv_url: uploadError ? null : publicUrl,
    cv_uploaded_at: new Date().toISOString(),
    cv_parsed_data: parsedData,
    // Sync top-level profile fields from parsed data
    skills: parsedData.skills.slice(0, 30),
    career_summary: parsedData.careerSummary,
  })

  if (profileError) {
    return NextResponse.json({ error: `Failed to update profile: ${profileError.message}` }, { status: 500 })
  }

  return NextResponse.json(
    {
      data: {
        parsedData,
        rawCvUrl: uploadError ? null : publicUrl,
        storagePath: uploadError ? null : storagePath,
        warnings: parsedData.parseWarnings,
      },
    },
    { status: 200 },
  )
}
