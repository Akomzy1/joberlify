'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, MapPin, ChevronDown, X, Shield, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SponsorRow {
  id: string
  organisation_name: string
  town_city: string | null
  county: string | null
  type_and_rating: string
  route: string
  rating: 'A' | 'B'
  is_active: boolean
  last_seen_at: string
}

interface SearchFilters {
  query: string
  region: string
  route: string
  rating: 'A' | 'B' | ''
}

interface Pagination {
  page: number
  total: number
  totalPages: number
  hasMore: boolean
}

// ─── Config ───────────────────────────────────────────────────────────────────

const VISA_ROUTES = [
  'Skilled Worker',
  'Global Business Mobility',
  'Scale-up',
  'Senior or Specialist Worker',
  'Graduate Trainee',
  'UK Expansion Worker',
  'Charity Worker',
  'Religious Worker',
  'Creative Worker',
  'International Sportsperson',
  'Seasonal Worker',
]

const UK_REGIONS = [
  'London',
  'Manchester',
  'Birmingham',
  'Leeds',
  'Bristol',
  'Edinburgh',
  'Glasgow',
  'Liverpool',
  'Sheffield',
  'Newcastle',
  'Cambridge',
  'Oxford',
  'Brighton',
  'Southampton',
  'Nottingham',
  'West Midlands',
  'Greater Manchester',
  'West Yorkshire',
  'South Yorkshire',
  'Yorkshire',
]

// ─── Sponsor card ─────────────────────────────────────────────────────────────

function SponsorCard({ sponsor }: { sponsor: SponsorRow }) {
  const [expanded, setExpanded] = useState(false)
  const isARated = sponsor.rating === 'A'

  const updated = sponsor.last_seen_at
    ? new Date(sponsor.last_seen_at).toLocaleDateString('en-GB', {
        month: 'short', year: 'numeric',
      })
    : null

  // Parse all routes from type_and_rating (one entry per route)
  const routes = sponsor.route ? [sponsor.route] : []

  return (
    <div className="rounded-xl border border-[#E8E4DD] bg-white overflow-hidden hover:border-[#0EA5E9]/30 transition-colors">
      {/* ── Main row ── */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
        aria-expanded={expanded}
      >
        {/* Rating badge */}
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
          style={{
            background: isARated ? '#22C55E18' : '#EF444418',
            color:      isARated ? '#22C55E' : '#EF4444',
          }}
          title={isARated ? 'A-rated (can issue new CoS)' : 'B-rated (cannot issue new CoS)'}
        >
          {sponsor.rating}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#0A1628] truncate">
            {sponsor.organisation_name}
          </p>
          {(sponsor.town_city || sponsor.county) && (
            <p className="text-xs text-[#0A1628]/45 flex items-center gap-1 mt-0.5">
              <MapPin size={10} />
              {[sponsor.town_city, sponsor.county].filter(Boolean).join(', ')}
            </p>
          )}
        </div>

        {/* Route chip */}
        {routes[0] && (
          <span
            className="flex-shrink-0 hidden sm:inline-block text-xs px-2 py-0.5 rounded-md font-medium"
            style={{ background: '#E0F2FE', color: '#0EA5E9' }}
          >
            {routes[0]}
          </span>
        )}

        <ChevronDown
          size={14}
          className="flex-shrink-0 text-[#0A1628]/25"
          style={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 150ms ease',
          }}
        />
      </button>

      {/* ── Expanded detail ── */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-[#E8E4DD] space-y-3 pt-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-[#0A1628]/40 mb-0.5">Rating</p>
              <p
                className="font-semibold"
                style={{ color: isARated ? '#22C55E' : '#EF4444' }}
              >
                {sponsor.rating}-rated {isARated ? '(can issue CoS)' : '(cannot issue new CoS)'}
              </p>
            </div>
            <div>
              <p className="text-[#0A1628]/40 mb-0.5">Visa route</p>
              <p className="font-semibold text-[#0A1628]">{sponsor.route}</p>
            </div>
            {sponsor.town_city && (
              <div>
                <p className="text-[#0A1628]/40 mb-0.5">Location</p>
                <p className="font-semibold text-[#0A1628]">
                  {[sponsor.town_city, sponsor.county].filter(Boolean).join(', ')}
                </p>
              </div>
            )}
            {updated && (
              <div>
                <p className="text-[#0A1628]/40 mb-0.5">Last verified</p>
                <p className="font-semibold text-[#0A1628]">{updated}</p>
              </div>
            )}
          </div>

          {/* Route chips */}
          {routes.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {routes.map((r, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-0.5 rounded-md"
                  style={{ background: '#E0F2FE', color: '#0EA5E9' }}
                >
                  {r}
                </span>
              ))}
            </div>
          )}

          {!isARated && (
            <div className="rounded-md border border-[#EF4444]/20 bg-[#EF4444]/5 px-3 py-2">
              <p className="text-xs text-[#EF4444] leading-relaxed">
                B-rated sponsors are under action plan with UKVI and currently cannot issue
                new Certificates of Sponsorship. Check GOV.UK for current status.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface SponsorSearchProps {
  /** Pre-fill query */
  initialQuery?: string
  /** User's target locations from profile — enables "In my areas" filter */
  userTargetLocations?: string[]
  className?: string
}

export function SponsorSearch({
  initialQuery = '',
  userTargetLocations,
  className,
}: SponsorSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query:  initialQuery,
    region: '',
    route:  '',
    rating: '',
  })
  const [useMyLocations, setUseMyLocations] = useState(false)
  const [results, setResults] = useState<SponsorRow[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(async (f: SearchFilters, pg: number, myLocs: boolean) => {
    // Need at least something to search on
    const hasFilter = f.query.length >= 2 || f.region || (myLocs && userTargetLocations?.length)
    if (!hasFilter) {
      setResults([])
      setPagination(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({ page: String(pg), limit: '20' })
      if (f.query.length >= 2) params.set('q', f.query)
      if (f.region) params.set('region', f.region)
      if (f.rating) params.set('rating', f.rating)
      if (f.route) params.set('route', f.route)
      if (myLocs && userTargetLocations?.length) {
        params.set('targetLocations', userTargetLocations.join(','))
      }

      const res = await fetch(`/api/visa/sponsors?${params}`)
      if (!res.ok) throw new Error('Search failed')
      const json = await res.json()
      const incoming: SponsorRow[] = json.data ?? []
      setResults((prev) => pg === 1 ? incoming : [...prev, ...incoming])
      setPagination(json.pagination)
    } catch {
      setError('Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [userTargetLocations])

  // Debounced search on filter change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(1)
      search(filters, 1, useMyLocations)
    }, 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [filters, useMyLocations, search])

  function updateFilter<K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }

  function loadMore() {
    const nextPage = page + 1
    setPage(nextPage)
    search(filters, nextPage, useMyLocations)
  }

  function clearAll() {
    setFilters({ query: '', region: '', route: '', rating: '' })
    setUseMyLocations(false)
    setResults([])
    setPagination(null)
  }

  const hasActiveFilters =
    filters.query || filters.region || filters.route || filters.rating || useMyLocations

  return (
    <div className={cn('space-y-4', className)}>
      {/* ── Search bar ── */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0A1628]/35 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search employer name…"
            value={filters.query}
            onChange={(e) => updateFilter('query', e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-[#E8E4DD] bg-white text-sm text-[#0A1628] placeholder:text-[#0A1628]/35 focus:outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/15 transition-colors"
          />
        </div>

        {/* Region input */}
        <div className="relative sm:w-52">
          <MapPin
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0A1628]/35 pointer-events-none"
          />
          <input
            type="text"
            placeholder="City or region…"
            value={filters.region}
            onChange={(e) => updateFilter('region', e.target.value)}
            list="region-suggestions"
            className="w-full h-11 pl-9 pr-4 rounded-xl border border-[#E8E4DD] bg-white text-sm text-[#0A1628] placeholder:text-[#0A1628]/35 focus:outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/15 transition-colors"
          />
          <datalist id="region-suggestions">
            {UK_REGIONS.map((r) => <option key={r} value={r} />)}
          </datalist>
        </div>
      </div>

      {/* ── Filter row ── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Route filter */}
        <select
          value={filters.route}
          onChange={(e) => updateFilter('route', e.target.value)}
          className="h-11 px-3 rounded-lg border border-[#E8E4DD] bg-white text-sm text-[#0A1628]/70 focus:outline-none focus:border-[#0EA5E9] cursor-pointer"
        >
          <option value="">All routes</option>
          {VISA_ROUTES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        {/* Rating filter */}
        <div className="flex items-center gap-1 bg-white rounded-lg border border-[#E8E4DD] p-1">
          {(['', 'A', 'B'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => updateFilter('rating', r)}
              className={cn(
                'px-3 py-2.5 rounded-md text-xs font-semibold transition-all min-h-[36px]',
                filters.rating === r
                  ? r === 'A'
                    ? 'bg-[#22C55E]/15 text-[#22C55E]'
                    : r === 'B'
                    ? 'bg-[#EF4444]/15 text-[#EF4444]'
                    : 'bg-[#0A1628]/10 text-[#0A1628]'
                  : 'text-[#0A1628]/35 hover:text-[#0A1628]/60',
              )}
            >
              {r === '' ? 'All' : `${r}-rated`}
            </button>
          ))}
        </div>

        {/* In my areas toggle */}
        {userTargetLocations && userTargetLocations.length > 0 && (
          <button
            type="button"
            onClick={() => setUseMyLocations((v) => !v)}
            className={cn(
              'flex items-center gap-1.5 h-11 px-3 rounded-lg border text-xs font-medium transition-all',
              useMyLocations
                ? 'border-[#0EA5E9] bg-[#0EA5E9]/10 text-[#0EA5E9]'
                : 'border-[#E8E4DD] bg-white text-[#0A1628]/55 hover:text-[#0A1628]',
            )}
          >
            <Shield size={12} />
            In my areas
          </button>
        )}

        {/* Clear */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="flex items-center gap-1 h-11 px-2.5 text-xs text-[#0A1628]/40 hover:text-[#0A1628] transition-colors ml-auto"
          >
            <X size={12} />
            Clear
          </button>
        )}
      </div>

      {/* ── Results ── */}
      {loading && results.length === 0 && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-[#E8E4DD]/50 animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-[#EF4444]/20 bg-[#EF4444]/5 px-4 py-3 text-sm text-[#EF4444]">
          {error}
        </div>
      )}

      {!loading && !error && results.length === 0 && hasActiveFilters && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Building2 size={32} className="text-[#0A1628]/20 mb-3" />
          <p className="text-sm text-[#0A1628]/45 mb-1">No sponsors found</p>
          <p className="text-xs text-[#0A1628]/30">Try a broader search or different location</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          {/* Result count */}
          {pagination && (
            <p className="text-xs text-[#0A1628]/40 mb-3">
              {pagination.total.toLocaleString()} sponsor{pagination.total !== 1 ? 's' : ''} found
              {pagination.totalPages > 1 && ` · Page ${page} of ${pagination.totalPages}`}
            </p>
          )}

          {results.map((s) => (
            <SponsorCard key={s.id} sponsor={s} />
          ))}

          {/* Load more */}
          {pagination?.hasMore && (
            <button
              type="button"
              onClick={loadMore}
              disabled={loading}
              className="w-full rounded-xl border border-[#E8E4DD] bg-white min-h-[44px] py-3 text-sm text-[#0A1628]/55 hover:text-[#0A1628] hover:border-[#0EA5E9]/30 transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading…' : `Load more (${pagination.total - results.length} remaining)`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
