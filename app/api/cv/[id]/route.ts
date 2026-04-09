import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

type Params = { params: Promise<{ id: string }> }

// GET /api/cv/[id] — fetch a single generated CV record
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('generated_cvs')
    .select('id, user_id, evaluation_id, format, cv_data, html_content, pdf_url, pdf_path, pdf_generated_at, created_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'CV not found.' }, { status: 404 })
  }

  return NextResponse.json({
    data: {
      id:             data.id,
      evaluationId:   data.evaluation_id,
      format:         data.format,
      cvData:         data.cv_data,
      htmlContent:    data.html_content,
      pdfUrl:         data.pdf_url,
      tailoringNotes: (data.cv_data as any)?.tailoringNotes ?? '',
      createdAt:      data.created_at,
    },
  })
}

// DELETE /api/cv/[id]
export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('generated_cvs')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('[cv] delete error:', error.message)
    return NextResponse.json({ error: 'Failed to delete CV.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
