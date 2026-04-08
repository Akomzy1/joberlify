import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { RemotePreference, TargetLocation } from '@/types'

const VALID_REMOTE_PREFS: RemotePreference[] = ['onsite_only', 'hybrid', 'remote_only', 'open']

function isValidTargetLocations(value: unknown): value is TargetLocation[] {
  if (!Array.isArray(value)) return false
  return value.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as TargetLocation).country === 'string' &&
      Array.isArray((item as TargetLocation).cities) &&
      typeof (item as TargetLocation).anywhere === 'boolean',
  )
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })

  const {
    job_titles,
    target_countries,
    target_locations,
    remote_preference,
    willingness_to_relocate,
    max_commute_miles,
    current_country,
    current_city,
    requires_visa_sponsorship,
    nationality,
    current_visa_status,
    skills,
    qualifications,
    career_summary,
    years_experience,
    target_salary_min,
    target_salary_currency,
    linkedin_url,
  } = body

  // Validate remote_preference
  if (remote_preference !== undefined && !VALID_REMOTE_PREFS.includes(remote_preference)) {
    return NextResponse.json(
      { error: `remote_preference must be one of: ${VALID_REMOTE_PREFS.join(', ')}` },
      { status: 400 },
    )
  }

  // Validate target_locations structure
  if (target_locations !== undefined && !isValidTargetLocations(target_locations)) {
    return NextResponse.json(
      { error: 'target_locations must be an array of {country, cities[], anywhere}' },
      { status: 400 },
    )
  }

  // Validate max_commute_miles
  if (max_commute_miles !== undefined && max_commute_miles !== null && (typeof max_commute_miles !== 'number' || max_commute_miles <= 0)) {
    return NextResponse.json({ error: 'max_commute_miles must be a positive integer or null' }, { status: 400 })
  }

  const updates: Record<string, unknown> = { user_id: user.id, updated_at: new Date().toISOString() }

  // Only include fields that were actually provided
  if (job_titles !== undefined) updates.job_titles = job_titles
  if (target_countries !== undefined) updates.target_countries = target_countries
  if (target_locations !== undefined) updates.target_locations = target_locations
  if (remote_preference !== undefined) updates.remote_preference = remote_preference
  if (willingness_to_relocate !== undefined) updates.willingness_to_relocate = willingness_to_relocate
  if (max_commute_miles !== undefined) updates.max_commute_miles = max_commute_miles
  if (current_country !== undefined) updates.current_country = current_country
  if (current_city !== undefined) updates.current_city = current_city
  if (requires_visa_sponsorship !== undefined) updates.requires_visa_sponsorship = requires_visa_sponsorship
  if (nationality !== undefined) updates.nationality = nationality
  if (current_visa_status !== undefined) updates.current_visa_status = current_visa_status
  if (skills !== undefined) updates.skills = skills
  if (qualifications !== undefined) updates.qualifications = qualifications
  if (career_summary !== undefined) updates.career_summary = career_summary
  if (years_experience !== undefined) updates.years_experience = years_experience
  if (target_salary_min !== undefined) updates.target_salary_min = target_salary_min
  if (target_salary_currency !== undefined) updates.target_salary_currency = target_salary_currency
  if (linkedin_url !== undefined) updates.linkedin_url = linkedin_url

  const { data, error } = await supabase
    .from('user_profiles')
    .upsert(updates)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
