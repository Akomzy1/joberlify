import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/**
 * GET /api/visa/sponsors
 *
 * Public endpoint — no auth required.
 *
 * Query params:
 *   q          — organisation name search (min 2 chars)
 *   town       — filter by town/city (exact-ish, case-insensitive)
 *   county     — filter by county (case-insensitive)
 *   region     — broad region keyword searched across town_city + county
 *   route      — filter by visa route (e.g. "Skilled Worker")
 *   rating     — 'A' | 'B'
 *   page       — page number (default 1)
 *   limit      — max 50 (default 20)
 *
 * Auth-aware optional:
 *   targetLocations — comma-separated city/region names from user's profile
 *                     (client may pass these from profile for "in my areas" filter)
 */
export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const q              = searchParams.get('q')?.trim()
  const town           = searchParams.get('town')?.trim()
  const county         = searchParams.get('county')?.trim()
  const region         = searchParams.get('region')?.trim()
  const route          = searchParams.get('route')?.trim()
  const rating         = searchParams.get('rating')?.toUpperCase().trim()
  const targetLocRaw   = searchParams.get('targetLocations')?.trim()
  const page           = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit          = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))
  const offset         = (page - 1) * limit

  // Must provide at least a query or a location filter
  if (!q && !town && !county && !region && !targetLocRaw) {
    return NextResponse.json(
      { error: 'Provide at least one of: q, town, county, region, or targetLocations' },
      { status: 400 },
    )
  }

  if (q && q.length < 2) {
    return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 })
  }

  // ── Build query ──
  let query = supabase
    .from('uk_sponsors')
    .select(
      'id, organisation_name, town_city, county, type_and_rating, route, rating, is_active, last_seen_at',
      { count: 'exact' },
    )
    .eq('is_active', true)

  // Name search
  if (q) {
    query = query.ilike('organisation_name', `%${q.replace(/[%_]/g, '\\$&')}%`)
  }

  // Location filters
  if (town) {
    query = query.ilike('town_city', `%${town.replace(/[%_]/g, '\\$&')}%`)
  }
  if (county) {
    query = query.ilike('county', `%${county.replace(/[%_]/g, '\\$&')}%`)
  }
  if (region) {
    // Broad region: match in town_city OR county
    const safe = region.replace(/[%_]/g, '\\$&')
    query = query.or(
      `town_city.ilike.%${safe}%,county.ilike.%${safe}%`,
    )
  }

  // "In my target locations" — filter by any of the user's target cities
  if (targetLocRaw) {
    const targets = targetLocRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 10) // cap to avoid absurdly long queries

    if (targets.length > 0) {
      const orClause = targets
        .map((t) => {
          const safe = t.replace(/[%_]/g, '\\$&')
          return `town_city.ilike.%${safe}%,county.ilike.%${safe}%`
        })
        .join(',')
      query = query.or(orClause)
    }
  }

  if (route) {
    query = query.ilike('route', `%${route.replace(/[%_]/g, '\\$&')}%`)
  }
  if (rating === 'A' || rating === 'B') {
    query = query.eq('rating', rating)
  }

  const { data, error, count } = await query
    .order('organisation_name', { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('[visa/sponsors] DB error:', error.message)
    return NextResponse.json({ error: 'Failed to search sponsors' }, { status: 500 })
  }

  const totalPages = Math.ceil((count ?? 0) / limit)

  return NextResponse.json(
    {
      data: data ?? [],
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages,
        hasMore: page < totalPages,
      },
    },
    {
      headers: {
        // Cache sponsor results for 1 hour on CDN; serve stale for up to 24h while revalidating.
        // Sponsor data is updated weekly, so hourly freshness is more than sufficient.
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    },
  )
}
