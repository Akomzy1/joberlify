'use client'

import { useEffect, useState, useCallback } from 'react'
import { X, ChevronDown, Check, Loader2, ChevronRight, Save, CreditCard, FileText, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/cn'
import { CvUploader } from '@/components/cv/CvUploader'
import type { RemotePreference, TargetLocation, CvParsedData } from '@/types'

// ─── Shared data (same as onboarding) ────────────────────────────────────────

const COUNTRIES = [
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
]

const CITY_SUGGESTIONS: Record<string, string[]> = {
  GB: ['London', 'Manchester', 'Birmingham', 'Edinburgh', 'Bristol', 'Leeds', 'Glasgow', 'Cambridge', 'Oxford', 'Brighton', 'Cardiff', 'Belfast'],
  US: ['New York', 'San Francisco', 'Seattle', 'Austin', 'Chicago', 'Boston', 'Los Angeles', 'Denver', 'Atlanta', 'Miami', 'Washington DC'],
  CA: ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa'],
  AU: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'],
  DE: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne'],
  NL: ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht'],
  IE: ['Dublin', 'Cork', 'Limerick', 'Galway'],
}

const REMOTE_OPTIONS: { value: RemotePreference; label: string }[] = [
  { value: 'onsite_only', label: 'On-site only' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'remote_only', label: 'Remote only' },
  { value: 'open', label: 'Open to all' },
]

const COMMUTE_OPTIONS = [
  { value: 10, label: '10 miles' },
  { value: 20, label: '20 miles' },
  { value: 30, label: '30 miles' },
  { value: 50, label: '50 miles' },
  { value: null, label: 'No limit' },
]

const VISA_STATUSES = [
  { value: 'citizen', label: 'Citizen / Passport holder' },
  { value: 'settled', label: 'Settled / Permanent Resident' },
  { value: 'skilled_worker', label: 'Skilled Worker Visa' },
  { value: 'student', label: 'Student Visa' },
  { value: 'graduate', label: 'Graduate Visa' },
  { value: 'dependent', label: 'Dependent Visa' },
  { value: 'none', label: 'No current right to work' },
]

// ─── Small reusable components ────────────────────────────────────────────────

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={cn('relative w-11 h-6 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9] focus-visible:ring-offset-2',
          checked ? 'bg-[#0EA5E9]' : 'bg-[#E8E4DD]')}>
        <span className={cn('absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200', checked ? 'translate-x-5' : 'translate-x-0')} />
      </button>
      <span className="text-sm font-medium text-[#0A1628]">{label}</span>
    </label>
  )
}

function TagInput({ tags, onAdd, onRemove, placeholder, suggestions = [] }: {
  tags: string[]; onAdd: (t: string) => void; onRemove: (t: string) => void; placeholder: string; suggestions?: string[]
}) {
  const [value, setValue] = useState('')
  const filtered = suggestions.filter((s) => s.toLowerCase().includes(value.toLowerCase()) && !tags.includes(s))

  function commit(tag: string) {
    const clean = tag.trim().replace(/,$/, '')
    if (clean && !tags.includes(clean)) onAdd(clean)
    setValue('')
  }

  return (
    <div className="relative">
      <div className={cn('min-h-[44px] w-full rounded-lg px-3 py-2 bg-white border border-[#1E3A5F]/20 flex flex-wrap gap-2 items-center focus-within:border-[#0EA5E9] focus-within:ring-2 focus-within:ring-[#0EA5E9]/20 transition-colors duration-150')}>
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1.5 bg-[#1E3A5F] text-[#FAFAF8] text-xs rounded px-2.5 py-1">
            {tag}
            <button type="button" onClick={() => onRemove(tag)} className="hover:text-[#EF4444] transition-colors"><X size={11} /></button>
          </span>
        ))}
        <input type="text" value={value} onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ',') && value.trim()) { e.preventDefault(); commit(value) }
            if (e.key === 'Backspace' && !value && tags.length > 0) onRemove(tags[tags.length - 1])
          }}
          placeholder={tags.length === 0 ? placeholder : 'Add another…'}
          className="flex-1 min-w-[100px] bg-transparent text-sm text-[#0A1628] placeholder:text-[#0A1628]/30 outline-none" />
      </div>
      {value && filtered.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full bg-white border border-[#E8E4DD] rounded-lg shadow-md max-h-36 overflow-y-auto">
          {filtered.slice(0, 5).map((s) => (
            <li key={s}>
              <button type="button" onClick={() => commit(s)} className="w-full text-left px-3.5 py-2 text-sm text-[#0A1628] hover:bg-[#E0F2FE] transition-colors">{s}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function CountrySelect({ selected, onToggle }: { selected: string[]; onToggle: (code: string) => void }) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const filtered = COUNTRIES.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="relative">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selected.map((code) => {
            const c = COUNTRIES.find((c) => c.code === code)
            return c ? (
              <span key={code} className="inline-flex items-center gap-1.5 bg-[#1E3A5F] text-[#FAFAF8] text-sm rounded px-2.5 py-1">
                {c.flag} {c.name}
                <button type="button" onClick={() => onToggle(code)} className="hover:text-[#EF4444] transition-colors"><X size={12} /></button>
              </span>
            ) : null
          })}
        </div>
      )}
      <button type="button" onClick={() => setOpen(!open)}
        className={cn('w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm bg-white border border-[#1E3A5F]/20 text-[#0A1628] transition-colors duration-150 hover:border-[#1E3A5F]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9]', open && 'border-[#0EA5E9] ring-2 ring-[#0EA5E9]/20')}>
        <span className={selected.length === 0 ? 'text-[#0A1628]/30' : ''}>{selected.length === 0 ? 'Select countries…' : `${selected.length} selected`}</span>
        <ChevronDown size={16} className={cn('text-[#0A1628]/40 transition-transform duration-200', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-[#E8E4DD] rounded-lg shadow-md overflow-hidden">
          <div className="p-2 border-b border-[#E8E4DD]">
            <input type="text" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} autoFocus
              className="w-full px-2.5 py-1.5 text-sm bg-[#F5F3EF] rounded text-[#0A1628] outline-none placeholder:text-[#0A1628]/30" />
          </div>
          <ul className="max-h-48 overflow-y-auto py-1">
            {filtered.map((c) => {
              const isSel = selected.includes(c.code)
              return (
                <li key={c.code}>
                  <button type="button" onClick={() => onToggle(c.code)}
                    className={cn('w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors', isSel ? 'bg-[#E0F2FE]' : 'hover:bg-[#F5F3EF]')}>
                    <span>{c.flag}</span><span className="flex-1">{c.name}</span>
                    {isSel && <Check size={14} className="text-[#0EA5E9]" />}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

function CitySection({ countryCode, location, onChange }: { countryCode: string; location: TargetLocation; onChange: (l: TargetLocation) => void }) {
  const country = COUNTRIES.find((c) => c.code === countryCode)
  const suggestions = CITY_SUGGESTIONS[countryCode] ?? []
  const [expanded, setExpanded] = useState(!location.anywhere)

  return (
    <div className="border border-[#E8E4DD] rounded-lg overflow-hidden">
      <button type="button" onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-[#F5F3EF] hover:bg-[#E8E4DD] transition-colors text-left">
        <span className="text-sm font-medium text-[#0A1628]">{country?.flag} {country?.name}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#0A1628]/40">{location.anywhere ? 'Anywhere' : `${location.cities.length} city${location.cities.length !== 1 ? 'ies' : ''}`}</span>
          <ChevronRight size={14} className={cn('text-[#0A1628]/40 transition-transform duration-200', expanded && 'rotate-90')} />
        </div>
      </button>
      <div className={cn('overflow-hidden transition-all duration-300', expanded ? 'max-h-64' : 'max-h-0')}>
        <div className="px-4 py-3 space-y-3 border-t border-[#E8E4DD]">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={location.anywhere}
              onChange={(e) => onChange({ ...location, anywhere: e.target.checked, cities: e.target.checked ? [] : location.cities })}
              className="w-4 h-4 rounded border-[#1E3A5F]/20 accent-[#0EA5E9]" />
            <span className="text-sm text-[#0A1628]">Anywhere in {country?.name}</span>
          </label>
          {!location.anywhere && (
            <TagInput tags={location.cities}
              onAdd={(city) => onChange({ ...location, cities: [...location.cities, city] })}
              onRemove={(city) => onChange({ ...location, cities: location.cities.filter((c) => c !== city) })}
              placeholder="Type a city…" suggestions={suggestions} />
          )}
        </div>
      </div>
    </div>
  )
}

function RemoteSegmentedControl({ value, onChange }: { value: RemotePreference; onChange: (v: RemotePreference) => void }) {
  return (
    <div className="grid grid-cols-2 sm:flex rounded-lg border border-[#E8E4DD] overflow-hidden bg-[#F5F3EF] p-0.5 gap-0.5">
      {REMOTE_OPTIONS.map((opt) => (
        <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
          className={cn('flex-1 min-h-[44px] py-2 px-2 text-xs font-medium rounded transition-all duration-200 whitespace-nowrap',
            value === opt.value ? 'bg-[#1E3A5F] text-[#FAFAF8] shadow-sm' : 'text-[#0A1628]/60 hover:text-[#0A1628] hover:bg-[#E8E4DD]')}>
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl border border-[#E8E4DD] overflow-hidden">
      <div className="px-6 py-4 border-b border-[#E8E4DD]">
        <h2 className="text-base font-semibold text-[#0A1628]" style={{ fontFamily: "'Satoshi', 'DM Sans', sans-serif" }}>{title}</h2>
        {description && <p className="text-sm text-[#0A1628]/50 mt-0.5">{description}</p>}
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
    </section>
  )
}

// ─── Main settings page ───────────────────────────────────────────────────────

export default function SettingsPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Target roles
  const [jobTitles, setJobTitles] = useState<string[]>([])

  // Location preferences
  const [targetCountries, setTargetCountries] = useState<string[]>([])
  const [targetLocations, setTargetLocations] = useState<TargetLocation[]>([])
  const [remotePreference, setRemotePreference] = useState<RemotePreference>('open')
  const [willingnessToRelocate, setWillingnessToRelocate] = useState(true)
  const [currentCity, setCurrentCity] = useState('')
  const [currentCountry, setCurrentCountry] = useState('')
  const [maxCommuteMiles, setMaxCommuteMiles] = useState<number | null>(null)

  // Visa preferences
  const [requiresVisa, setRequiresVisa] = useState(false)
  const [nationality, setNationality] = useState('')
  const [currentVisaStatus, setCurrentVisaStatus] = useState('')

  // CV
  const [cvParsedData, setCvParsedData] = useState<CvParsedData | null>(null)
  const [cvUploadedAt, setCvUploadedAt] = useState<string | null>(null)

  // Subscription
  const [stripePortalLoading, setStripePortalLoading] = useState(false)
  const [subscriptionTier, setSubscriptionTier] = useState<string>('free')

  useEffect(() => {
    async function load() {
      const [profileRes, userRes] = await Promise.all([
        supabase.from('user_profiles').select('*').single(),
        supabase.from('users').select('subscription_tier, subscription_status').single(),
      ])
      if (profileRes.data) {
        const d = profileRes.data
        setJobTitles(d.job_titles ?? [])
        setTargetCountries(d.target_countries ?? [])
        setTargetLocations(d.target_locations ?? [])
        setRemotePreference(d.remote_preference ?? 'open')
        setWillingnessToRelocate(d.willingness_to_relocate ?? true)
        setCurrentCity(d.current_city ?? '')
        setCurrentCountry(d.current_country ?? '')
        setMaxCommuteMiles(d.max_commute_miles ?? null)
        setRequiresVisa(d.requires_visa_sponsorship ?? false)
        setNationality(d.nationality ?? '')
        setCurrentVisaStatus(d.current_visa_status ?? '')
        setCvParsedData(d.cv_parsed_data ?? null)
        setCvUploadedAt(d.cv_uploaded_at ?? null)
      }
      if (userRes.data) {
        setSubscriptionTier(userRes.data.subscription_tier ?? 'free')
      }
      setLoading(false)
    }
    load()
  }, [supabase])

  const handleCvConfirm = useCallback(async (data: CvParsedData) => {
    setCvParsedData(data)
    await save('cv', {
      cv_parsed_data: data,
      skills: data.skills.slice(0, 30),
      career_summary: data.careerSummary,
      cv_uploaded_at: new Date().toISOString(),
    })
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  async function openStripePortal() {
    setStripePortalLoading(true)
    const res = await fetch('/api/billing/portal', { method: 'POST' })
    const json = await res.json()
    if (json.url) window.location.href = json.url
    else setError('Could not open billing portal. Please try again.')
    setStripePortalLoading(false)
  }

  function toggleCountry(code: string) {
    if (targetCountries.includes(code)) {
      setTargetCountries((p) => p.filter((c) => c !== code))
      setTargetLocations((p) => p.filter((l) => l.country !== code))
    } else {
      setTargetCountries((p) => [...p, code])
      setTargetLocations((p) => [...p, { country: code, cities: [], anywhere: true }])
    }
  }

  function updateLocation(code: string, loc: TargetLocation) {
    setTargetLocations((p) => p.map((l) => (l.country === code ? loc : l)))
  }

  async function save(section: string, payload: Record<string, unknown>) {
    setSaving(section)
    setError(null)
    setSuccess(null)

    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()

    if (!res.ok) { setError(json.error ?? 'Save failed') }
    else { setSuccess(section) ; setTimeout(() => setSuccess(null), 2500) }
    setSaving(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={24} className="animate-spin text-[#0EA5E9]" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0A1628]" style={{ fontFamily: "'Satoshi', 'DM Sans', sans-serif" }}>
          Settings
        </h1>
        <p className="text-sm text-[#0A1628]/50 mt-1">Manage your profile, preferences, and account.</p>
      </div>

      {error && (
        <div className="text-sm text-[#EF4444] bg-[#EF4444]/5 border border-[#EF4444]/20 rounded-lg px-4 py-3">{error}</div>
      )}

      {/* ── Target Roles ── */}
      <Section title="Target Roles" description="The job titles you're actively targeting.">
        <TagInput tags={jobTitles}
          onAdd={(t) => setJobTitles((p) => [...p, t])}
          onRemove={(t) => setJobTitles((p) => p.filter((x) => x !== t))}
          placeholder="e.g. Software Engineer, Product Manager…" />
        <SaveButton
          saving={saving === 'roles'} saved={success === 'roles'}
          onClick={() => save('roles', { job_titles: jobTitles })} />
      </Section>

      {/* ── Location Preferences ── */}
      <Section title="Location Preferences" description="Where you want to work and how.">
        {/* Target countries + cities */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#0A1628]">Target countries</label>
          <CountrySelect selected={targetCountries} onToggle={toggleCountry} />
          {targetCountries.length > 0 && (
            <div className="space-y-2 pt-1">
              {targetCountries.map((code) => {
                const loc = targetLocations.find((l) => l.country === code) ?? { country: code, cities: [], anywhere: true }
                return <CitySection key={code} countryCode={code} location={loc} onChange={(l) => updateLocation(code, l)} />
              })}
            </div>
          )}
        </div>

        {/* Remote preference */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-[#0A1628]">Work arrangement</label>
          <RemoteSegmentedControl value={remotePreference} onChange={setRemotePreference} />
        </div>

        {/* Relocate toggle */}
        <Toggle checked={willingnessToRelocate} onChange={setWillingnessToRelocate} label="Open to relocating for the right role" />

        {/* Current location */}
        <div className="space-y-1.5 pt-2 border-t border-[#E8E4DD]">
          <label className="block text-sm font-medium text-[#0A1628]">Current location</label>
          <div className="grid grid-cols-2 gap-3">
            <select value={currentCountry} onChange={(e) => setCurrentCountry(e.target.value)}
              className={cn('w-full px-3.5 py-2.5 rounded-lg text-sm bg-white border border-[#1E3A5F]/20 text-[#0A1628] focus:outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20', !currentCountry && 'text-[#0A1628]/40')}>
              <option value="">Country…</option>
              {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
            </select>
            <input type="text" value={currentCity} onChange={(e) => setCurrentCity(e.target.value)} placeholder="City…"
              className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-white border border-[#1E3A5F]/20 text-[#0A1628] placeholder:text-[#0A1628]/30 focus:outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20" />
          </div>
        </div>

        {/* Max commute */}
        {remotePreference !== 'remote_only' && (
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[#0A1628]">Maximum commute distance</label>
            <select value={maxCommuteMiles ?? ''} onChange={(e) => setMaxCommuteMiles(e.target.value === '' ? null : Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-white border border-[#1E3A5F]/20 text-[#0A1628] focus:outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20">
              {COMMUTE_OPTIONS.map((o) => <option key={String(o.value)} value={o.value ?? ''}>{o.label}</option>)}
            </select>
          </div>
        )}

        <SaveButton
          saving={saving === 'location'} saved={success === 'location'}
          onClick={() => save('location', {
            target_countries: targetCountries,
            target_locations: targetLocations,
            remote_preference: remotePreference,
            willingness_to_relocate: willingnessToRelocate,
            current_country: currentCountry || null,
            current_city: currentCity || null,
            max_commute_miles: remotePreference === 'remote_only' ? null : maxCommuteMiles,
          })} />
      </Section>

      {/* ── Visa Preferences ── */}
      <Section title="Visa Preferences" description="Used in the 11th evaluation dimension for international roles.">
        <Toggle checked={requiresVisa} onChange={setRequiresVisa} label="I need visa sponsorship" />

        <div className={cn('space-y-4 overflow-hidden transition-all duration-300', requiresVisa ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0')}>
          <div className="space-y-1.5 pt-1">
            <label className="block text-sm font-medium text-[#0A1628]">Nationality</label>
            <input type="text" value={nationality} onChange={(e) => setNationality(e.target.value)} placeholder="e.g. Nigerian"
              className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-white border border-[#1E3A5F]/20 text-[#0A1628] placeholder:text-[#0A1628]/30 focus:outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[#0A1628]">Current visa / right to work</label>
            <select value={currentVisaStatus} onChange={(e) => setCurrentVisaStatus(e.target.value)}
              className={cn('w-full px-3.5 py-2.5 rounded-lg text-sm bg-white border border-[#1E3A5F]/20 text-[#0A1628] focus:outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20', !currentVisaStatus && 'text-[#0A1628]/40')}>
              <option value="">Select status…</option>
              {VISA_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        <SaveButton
          saving={saving === 'visa'} saved={success === 'visa'}
          onClick={() => save('visa', {
            requires_visa_sponsorship: requiresVisa,
            nationality: nationality || null,
            current_visa_status: currentVisaStatus || null,
          })} />
      </Section>

      {/* ── CV ── */}
      <Section
        title="Your CV"
        description={cvUploadedAt
          ? `Last uploaded ${new Date(cvUploadedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`
          : 'No CV uploaded yet.'}
      >
        {cvParsedData && (
          <div className="flex items-center gap-3 p-3 bg-[#F5F3EF] rounded-lg border border-[#E8E4DD] mb-2">
            <FileText size={16} className="text-[#1E4976] flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#0A1628] truncate">
                {cvParsedData.contactDetails?.name ?? 'CV on file'}
              </p>
              <p className="text-xs text-[#0A1628]/50">
                {cvParsedData.skills.length} skills · {cvParsedData.jobHistory.length} roles · {cvParsedData.qualifications.length} qualifications
              </p>
            </div>
          </div>
        )}
        <CvUploader
          initialData={cvParsedData}
          onConfirm={handleCvConfirm}
        />
      </Section>

      {/* ── Subscription ── */}
      <Section title="Subscription" description="Manage your plan and billing.">
        <div className="flex items-center justify-between p-4 bg-[#F5F3EF] rounded-lg border border-[#E8E4DD]">
          <div>
            <p className="text-sm font-semibold text-[#0A1628] capitalize">{subscriptionTier} plan</p>
            <p className="text-xs text-[#0A1628]/50 mt-0.5">
              {subscriptionTier === 'free' && '3 evaluations / month'}
              {subscriptionTier === 'pro' && '30 evaluations · 10 CVs · Interview prep'}
              {subscriptionTier === 'global' && 'Unlimited evaluations · Batch mode · Sponsor Watch'}
            </p>
          </div>
          {subscriptionTier === 'free' && (
            <a
              href="/pricing"
              className="text-xs font-semibold text-[#0EA5E9] hover:underline"
            >
              Upgrade
            </a>
          )}
        </div>

        {subscriptionTier !== 'free' && (
          <button
            type="button"
            onClick={openStripePortal}
            disabled={stripePortalLoading}
            className={cn(
              'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium',
              'border border-[#E8E4DD] text-[#0A1628] bg-white',
              'hover:bg-[#F5F3EF] transition-colors duration-150',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9] focus-visible:ring-offset-2',
            )}
          >
            {stripePortalLoading
              ? <><Loader2 size={14} className="animate-spin" /> Opening portal…</>
              : <><CreditCard size={14} /> Manage billing &amp; invoices <ExternalLink size={12} className="text-[#0A1628]/40" /></>}
          </button>
        )}
      </Section>
    </div>
  )
}

function SaveButton({ saving, saved, onClick }: { saving: boolean; saved: boolean; onClick: () => void }) {
  return (
    <div className="flex justify-end">
      <button
        type="button" onClick={onClick} disabled={saving}
        className={cn(
          'flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200',
          saved
            ? 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20'
            : 'bg-[#1E3A5F] text-[#FAFAF8] hover:bg-[#0EA5E9]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9] focus-visible:ring-offset-2',
        )}
      >
        {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
          : saved ? <><Check size={14} /> Saved</>
          : <><Save size={14} /> Save changes</>}
      </button>
    </div>
  )
}
