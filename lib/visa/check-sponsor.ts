import type { SupabaseClient } from '@supabase/supabase-js'

// ─── Types ────────────────────────────────────────────────────────────────────

export type MatchConfidence = 'exact' | 'fuzzy' | 'not_found'

export interface SponsorMatch {
  id: string
  name: string
  townCity: string | null
  county: string | null
  rating: 'A' | 'B'
  route: string
  typeAndRating: string
  isActive: boolean
  lastSeenAt: string
}

export interface SponsorCheckResult {
  found: boolean
  sponsor: SponsorMatch | null
  matchConfidence: MatchConfidence
  /** If rating is 'B': employer cannot issue new CoS until downgrade resolved */
  cannotIssueNewCoS: boolean
  hasSkillledWorkerRoute: boolean
  /** Normalised name used for the query — useful for debugging */
  queriedName: string
  /** All alternate matches found (useful for disambiguation UI) */
  alternates: SponsorMatch[]
}

// ─── Name normalisation ───────────────────────────────────────────────────────

/**
 * Strip common legal suffixes and clean up whitespace so "Acme Ltd" and
 * "Acme Limited" both match "Acme" in the register.
 */
export function normaliseCompanyName(raw: string): string {
  return raw
    .trim()
    .replace(
      /\b(limited|ltd|plc|llp|lp|llc|inc|incorporated|corp|corporation|co\b|company|group|holdings|international|global|uk|europe|services|solutions)\b\.?/gi,
      '',
    )
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// ─── Row → SponsorMatch ───────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToMatch(r: any): SponsorMatch {
  return {
    id:            r.id,
    name:          r.organisation_name,
    townCity:      r.town_city ?? null,
    county:        r.county ?? null,
    rating:        r.rating as 'A' | 'B',
    route:         r.route ?? '',
    typeAndRating: r.type_and_rating ?? '',
    isActive:      r.is_active ?? true,
    lastSeenAt:    r.last_seen_at ?? '',
  }
}

// ─── Query helpers ────────────────────────────────────────────────────────────

async function querySponsors(
  supabase: SupabaseClient,
  pattern: string,
  limit = 5,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> {
  const { data } = await supabase
    .from('uk_sponsors')
    .select('id, organisation_name, town_city, county, type_and_rating, route, rating, is_active, last_seen_at')
    .ilike('organisation_name', pattern)
    .eq('is_active', true)
    .limit(limit)

  return data ?? []
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function checkSponsorLicence(
  supabase: SupabaseClient,
  companyName: string,
): Promise<SponsorCheckResult> {
  const raw = companyName.trim()
  const normalised = normaliseCompanyName(raw)

  // Escape ILIKE wildcards in user input
  const safeName = raw.replace(/[%_]/g, '\\$&')
  const safeNorm = normalised.replace(/[%_]/g, '\\$&')

  // ── Layer 1: exact match (case-insensitive) ──
  let rows = await querySponsors(supabase, safeName, 5)

  if (rows.length > 0) {
    const best = rows[0]
    const match = rowToMatch(best)
    return buildResult(match, 'exact', rows.slice(1).map(rowToMatch))
  }

  // ── Layer 2: starts-with on original name ──
  rows = await querySponsors(supabase, `${safeName}%`, 5)
  if (rows.length > 0) {
    const best = rows[0]
    const match = rowToMatch(best)
    return buildResult(match, 'fuzzy', rows.slice(1).map(rowToMatch))
  }

  // ── Layer 3: starts-with on normalised name (strips Ltd etc.) ──
  if (safeNorm && safeNorm !== safeName) {
    rows = await querySponsors(supabase, `${safeNorm}%`, 5)
    if (rows.length > 0) {
      const best = rows[0]
      const match = rowToMatch(best)
      return buildResult(match, 'fuzzy', rows.slice(1).map(rowToMatch))
    }
  }

  // ── Layer 4: contains on normalised name (widest net) ──
  if (safeNorm.length >= 4) {
    rows = await querySponsors(supabase, `%${safeNorm}%`, 10)
    if (rows.length > 0) {
      const best = rows[0]
      const match = rowToMatch(best)
      return buildResult(match, 'fuzzy', rows.slice(1).map(rowToMatch))
    }
  }

  // ── Layer 5: contains on original name ──
  if (safeName.length >= 4) {
    rows = await querySponsors(supabase, `%${safeName}%`, 10)
    if (rows.length > 0) {
      const best = rows[0]
      const match = rowToMatch(best)
      return buildResult(match, 'fuzzy', rows.slice(1).map(rowToMatch))
    }
  }

  // Not found
  return {
    found:                 false,
    sponsor:               null,
    matchConfidence:       'not_found',
    cannotIssueNewCoS:     false,
    hasSkillledWorkerRoute: false,
    queriedName:           normalised || raw,
    alternates:            [],
  }
}

function buildResult(
  sponsor: SponsorMatch,
  confidence: MatchConfidence,
  alternates: SponsorMatch[],
): SponsorCheckResult {
  // B-rating means: can receive CoS already granted but cannot issue new ones
  const cannotIssueNewCoS = sponsor.rating === 'B'

  // Check for Skilled Worker or Global Business Mobility routes
  const hasSkillledWorkerRoute =
    /skilled worker|global business mobility|scale.?up|senior.*specialist/i.test(
      sponsor.route,
    )

  return {
    found:                  true,
    sponsor,
    matchConfidence:        confidence,
    cannotIssueNewCoS,
    hasSkillledWorkerRoute,
    queriedName:            sponsor.name,
    alternates,
  }
}
