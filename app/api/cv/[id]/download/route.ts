import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { htmlToPdf } from '@/lib/pdf/generate-cv-pdf'

export const runtime = 'nodejs'
export const maxDuration = 30

type Params = { params: Promise<{ id: string }> }

/**
 * GET /api/cv/[id]/download
 *
 * Streams the PDF for a generated CV.
 * If a stored PDF URL exists, redirects to it.
 * If not (PDF generation failed earlier), regenerates on-demand and streams it.
 */
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('generated_cvs')
    .select('id, user_id, pdf_url, html_content, format, cv_data')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'CV not found.' }, { status: 404 })
  }

  // ── Fast path: redirect to stored PDF ──
  if (data.pdf_url) {
    return NextResponse.redirect(data.pdf_url)
  }

  // ── Slow path: regenerate PDF on-demand ──
  if (!data.html_content) {
    return NextResponse.json(
      { error: 'CV content not available for PDF generation.' },
      { status: 500 },
    )
  }

  try {
    const pdfBuffer = await htmlToPdf(data.html_content)
    const firstName = (data.cv_data as any)?.personalDetails?.name?.split(' ')[0] ?? 'cv'
    const filename  = `${firstName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-cv.pdf`

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length':      String(pdfBuffer.length),
      },
    })
  } catch (err) {
    console.error('[cv/download] PDF generation failed:', err)
    return NextResponse.json(
      { error: 'PDF generation failed. Please try again.' },
      { status: 500 },
    )
  }
}
