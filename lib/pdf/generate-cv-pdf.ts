import { createClient } from '@supabase/supabase-js'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PdfGenerationResult {
  pdfBuffer: Buffer
  storagePath: string
  publicUrl: string
}

// ─── Supabase service-role client (for storage uploads) ───────────────────────

function getStorageClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for PDF storage',
    )
  }

  return createClient(url, key)
}

// ─── PDF generation ───────────────────────────────────────────────────────────

/**
 * Convert an HTML string to a PDF buffer using Playwright Chromium.
 *
 * Prerequisites:
 *   npx playwright install chromium
 *
 * The browser is launched fresh per call and closed immediately after — this is
 * intentional for serverless safety (no long-lived browser process).
 */
export async function htmlToPdf(htmlContent: string): Promise<Buffer> {
  // Dynamic import — keeps Playwright out of the client bundle
  const { chromium } = await import('playwright')

  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  })

  try {
    const page = await browser.newPage()

    await page.setContent(htmlContent, {
      waitUntil: 'domcontentloaded',
    })

    // Tiny pause to let any web fonts resolve (Arial/Helvetica are system fonts so this is fast)
    await page.waitForTimeout(100)

    const pdfBuffer = await page.pdf({
      format:          'A4',
      printBackground: true,
      margin: {
        top:    '18mm',
        right:  '18mm',
        bottom: '18mm',
        left:   '18mm',
      },
    })

    return Buffer.from(pdfBuffer)
  } finally {
    await browser.close()
  }
}

// ─── Storage upload ───────────────────────────────────────────────────────────

/**
 * Upload a PDF buffer to Supabase Storage (bucket: generated-cvs).
 * Returns the storage path and public URL.
 *
 * Path pattern: {userId}/{cvId}/cv.pdf
 */
export async function uploadCvPdf(
  pdfBuffer: Buffer,
  userId: string,
  cvId: string,
): Promise<{ storagePath: string; publicUrl: string }> {
  const supabase = getStorageClient()
  const storagePath = `${userId}/${cvId}/cv.pdf`

  const { error } = await supabase.storage
    .from('generated-cvs')
    .upload(storagePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert:      true,
    })

  if (error) {
    throw new Error(`Supabase Storage upload failed: ${error.message}`)
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('generated-cvs').getPublicUrl(storagePath)

  return { storagePath, publicUrl }
}

// ─── Combined: HTML → PDF → Storage ──────────────────────────────────────────

export async function generateAndStoreCvPdf(
  htmlContent: string,
  userId: string,
  cvId: string,
): Promise<PdfGenerationResult> {
  const pdfBuffer = await htmlToPdf(htmlContent)
  const { storagePath, publicUrl } = await uploadCvPdf(pdfBuffer, userId, cvId)

  return { pdfBuffer, storagePath, publicUrl }
}
