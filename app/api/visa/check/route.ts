import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runEligibilityCheck } from '@/lib/visa/eligibility-check'

export const runtime = 'nodejs'
export const maxDuration = 30

/**
 * GET /api/visa/check
 *
 * Query params:
 *   companyName     (required)
 *   jobDescription  (required — job duties text)
 *   jobTitle        (optional — for context, not classification)
 *   salary          (optional — annual salary in GBP as integer)
 *   currency        (optional — default GBP)
 *   newEntrant      (optional — 'true' if user is under 26 / student visa switch)
 */
export async function GET(request: Request) {
  const supabase = await createClient()

  // Auth is optional — public check, but we log for rate-limiting if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { searchParams } = new URL(request.url)

  const companyName    = searchParams.get('companyName')?.trim()
  const jobDescription = searchParams.get('jobDescription')?.trim()
  const jobTitle       = searchParams.get('jobTitle')?.trim() || undefined
  const salaryParam    = searchParams.get('salary')
  const currency       = searchParams.get('currency')?.trim() || 'GBP'
  const newEntrant     = searchParams.get('newEntrant') === 'true'

  if (!companyName) {
    return NextResponse.json({ error: 'companyName is required' }, { status: 400 })
  }
  if (!jobDescription || jobDescription.length < 50) {
    return NextResponse.json(
      { error: 'jobDescription is required (minimum 50 characters)' },
      { status: 400 },
    )
  }
  if (jobDescription.length > 8000) {
    return NextResponse.json(
      { error: 'jobDescription must be 8,000 characters or fewer' },
      { status: 400 },
    )
  }

  const advertisedSalary = salaryParam ? parseInt(salaryParam, 10) : null

  if (salaryParam && isNaN(advertisedSalary!)) {
    return NextResponse.json({ error: 'salary must be a valid integer' }, { status: 400 })
  }

  try {
    const result = await runEligibilityCheck(supabase, {
      companyName,
      jobDescription,
      jobTitle,
      advertisedSalary,
      salaryCurrency: currency,
      isNewEntrant:   newEntrant,
      skipSalaryCheck: advertisedSalary === null,
    })

    return NextResponse.json({ data: result })
  } catch (err) {
    console.error('[visa/check] Error:', err)
    return NextResponse.json(
      { error: 'Eligibility check failed. Please try again.' },
      { status: 500 },
    )
  }
}
