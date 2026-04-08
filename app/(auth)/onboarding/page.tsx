'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, ChevronDown, CloudUpload, Loader2, Check, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/cn'
import type { RemotePreference, TargetLocation } from '@/types'

// ─── Static data ──────────────────────────────────────────────────────────────

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
  CA: ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa', 'Edmonton'],
  AU: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Canberra'],
  DE: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne', 'Stuttgart'],
  NL: ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven'],
  IE: ['Dublin', 'Cork', 'Limerick', 'Galway'],
  SG: ['Singapore'],
  AE: ['Dubai', 'Abu Dhabi'],
  FR: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Bordeaux'],
}

const NATIONALITIES = [
  'British', 'American', 'Canadian', 'Australian', 'German', 'Dutch',
  'Singaporean', 'Irish', 'French', 'Nigerian', 'Ghanaian', 'Kenyan',
  'South African', 'Indian', 'Pakistani', 'Filipino', 'Other',
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

const TOTAL_STEPS = 4

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = ['Job Roles', 'Target Locations', 'Your Location', 'Your CV']
  return (
    <div className="flex items-center">
      {steps.map((label, i) => {
        const step = i + 1
        const done = step < currentStep
        const active = step === currentStep
        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300',
                  done && 'bg-[#0EA5E9] text-white',
                  active && 'bg-[#1E3A5F] text-[#FAFAF8] ring-4 ring-[#0EA5E9]/20',
                  !done && !active && 'bg-[#E8E4DD] text-[#0A1628]/40',
                )}
              >
                {done ? <Check size={13} /> : step}
              </div>
              <span
                className={cn(
                  'text-[10px] font-medium transition-colors duration-300 whitespace-nowrap hidden sm:block',
                  active ? 'text-[#0A1628]' : 'text-[#0A1628]/40',
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="w-10 sm:w-16 h-px mx-1.5 mb-4 sm:mb-5 relative">
                <div className="absolute inset-0 bg-[#E8E4DD]" />
                <div
                  className="absolute inset-y-0 left-0 bg-[#0EA5E9] transition-all duration-500"
                  style={{ width: done ? '100%' : '0%' }}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function TagInput({
  tags, onAdd, onRemove, placeholder, suggestions = [],
}: {
  tags: string[]
  onAdd: (tag: string) => void
  onRemove: (tag: string) => void
  placeholder: string
  suggestions?: string[]
}) {
  const [value, setValue] = useState('')
  const filtered = suggestions.filter(
    (s) => s.toLowerCase().includes(value.toLowerCase()) && !tags.includes(s),
  )
  const showSuggestions = value.length > 0 && filtered.length > 0

  function commit(tag: string) {
    const clean = tag.trim().replace(/,$/, '')
    if (clean && !tags.includes(clean)) onAdd(clean)
    setValue('')
  }

  return (
    <div className="relative">
      <div
        className={cn(
          'min-h-[48px] w-full rounded-lg px-3 py-2',
          'bg-white border border-[#1E3A5F]/20',
          'flex flex-wrap gap-2 items-center',
          'focus-within:border-[#0EA5E9] focus-within:ring-2 focus-within:ring-[#0EA5E9]/20',
          'transition-colors duration-150',
        )}
      >
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1.5 bg-[#1E3A5F] text-[#FAFAF8] text-xs rounded px-2.5 py-1">
            {tag}
            <button type="button" onClick={() => onRemove(tag)} className="hover:text-[#EF4444] transition-colors" aria-label={`Remove ${tag}`}>
              <X size={11} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ',') && value.trim()) { e.preventDefault(); commit(value) }
            if (e.key === 'Backspace' && !value && tags.length > 0) onRemove(tags[tags.length - 1])
          }}
          placeholder={tags.length === 0 ? placeholder : 'Add another…'}
          className="flex-1 min-w-[120px] bg-transparent text-sm text-[#0A1628] placeholder:text-[#0A1628]/30 outline-none"
        />
      </div>
      {showSuggestions && (
        <ul className="absolute z-10 mt-1 w-full bg-white border border-[#E8E4DD] rounded-lg shadow-md overflow-hidden max-h-40 overflow-y-auto">
          {filtered.slice(0, 6).map((s) => (
            <li key={s}>
              <button type="button" onClick={() => commit(s)}
                className="w-full text-left px-3.5 py-2 text-sm text-[#0A1628] hover:bg-[#E0F2FE] transition-colors">
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <button
        type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9] focus-visible:ring-offset-2',
          checked ? 'bg-[#0EA5E9]' : 'bg-[#E8E4DD]',
        )}
      >
        <span className={cn(
          'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200',
          checked ? 'translate-x-5' : 'translate-x-0',
        )} />
      </button>
      <span className="text-sm font-medium text-[#0A1628]">{label}</span>
    </label>
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
                <button type="button" onClick={() => onToggle(code)} className="hover:text-[#EF4444] transition-colors" aria-label={`Remove ${c.name}`}>
                  <X size={12} />
                </button>
              </span>
            ) : null
          })}
        </div>
      )}
      <button
        type="button" onClick={() => setOpen(!open)}
        className={cn(
          'w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm',
          'bg-white border border-[#1E3A5F]/20 text-[#0A1628] transition-colors duration-150',
          'hover:border-[#1E3A5F]/40',
          open && 'border-[#0EA5E9] ring-2 ring-[#0EA5E9]/20',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9]',
        )}
      >
        <span className={selected.length === 0 ? 'text-[#0A1628]/30' : ''}>
          {selected.length === 0 ? 'Select countries…' : `${selected.length} selected`}
        </span>
        <ChevronDown size={16} className={cn('text-[#0A1628]/40 transition-transform duration-200', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-[#E8E4DD] rounded-lg shadow-md overflow-hidden">
          <div className="p-2 border-b border-[#E8E4DD]">
            <input type="text" placeholder="Search countries…" value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm bg-[#F5F3EF] rounded text-[#0A1628] placeholder:text-[#0A1628]/30 outline-none" autoFocus />
          </div>
          <ul className="max-h-48 overflow-y-auto py-1">
            {filtered.map((c) => {
              const isSelected = selected.includes(c.code)
              return (
                <li key={c.code}>
                  <button type="button" onClick={() => onToggle(c.code)}
                    className={cn('w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors',
                      isSelected ? 'bg-[#E0F2FE] text-[#0A1628]' : 'text-[#0A1628] hover:bg-[#F5F3EF]')}>
                    <span>{c.flag}</span>
                    <span className="flex-1">{c.name}</span>
                    {isSelected && <Check size={14} className="text-[#0EA5E9]" />}
                  </button>
                </li>
              )
            })}
            {filtered.length === 0 && <li className="px-3 py-2 text-sm text-[#0A1628]/40">No results</li>}
          </ul>
        </div>
      )}
    </div>
  )
}

function CitySection({
  countryCode,
  location,
  onChange,
}: {
  countryCode: string
  location: TargetLocation
  onChange: (loc: TargetLocation) => void
}) {
  const country = COUNTRIES.find((c) => c.code === countryCode)
  const suggestions = CITY_SUGGESTIONS[countryCode] ?? []
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (!location.anywhere && !expanded) setExpanded(true)
  }, [location.anywhere, expanded])

  return (
    <div className="border border-[#E8E4DD] rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#F5F3EF] hover:bg-[#E8E4DD] transition-colors text-left"
      >
        <span className="text-sm font-medium text-[#0A1628]">
          {country?.flag} {country?.name}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#0A1628]/40">
            {location.anywhere ? 'Anywhere' : `${location.cities.length} city${location.cities.length !== 1 ? 'ies' : ''}`}
          </span>
          <ChevronRight size={14} className={cn('text-[#0A1628]/40 transition-transform duration-200', expanded && 'rotate-90')} />
        </div>
      </button>

      <div className={cn('overflow-hidden transition-all duration-300', expanded ? 'max-h-64' : 'max-h-0')}>
        <div className="px-4 py-3 space-y-3 border-t border-[#E8E4DD]">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={location.anywhere}
              onChange={(e) => onChange({ ...location, anywhere: e.target.checked, cities: e.target.checked ? [] : location.cities })}
              className="w-4 h-4 rounded border-[#1E3A5F]/20 accent-[#0EA5E9]"
            />
            <span className="text-sm text-[#0A1628]">Anywhere in {country?.name}</span>
          </label>

          {!location.anywhere && (
            <div>
              <p className="text-xs text-[#0A1628]/50 mb-1.5">Specific cities:</p>
              <TagInput
                tags={location.cities}
                onAdd={(city) => onChange({ ...location, cities: [...location.cities, city] })}
                onRemove={(city) => onChange({ ...location, cities: location.cities.filter((c) => c !== city) })}
                placeholder="Type a city…"
                suggestions={suggestions}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function RemoteSegmentedControl({
  value,
  onChange,
}: {
  value: RemotePreference
  onChange: (v: RemotePreference) => void
}) {
  return (
    <div className="flex rounded-lg border border-[#E8E4DD] overflow-hidden bg-[#F5F3EF] p-0.5 gap-0.5">
      {REMOTE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'flex-1 py-2 text-xs font-medium rounded transition-all duration-200 whitespace-nowrap',
            value === opt.value
              ? 'bg-[#1E3A5F] text-[#FAFAF8] shadow-sm'
              : 'text-[#0A1628]/60 hover:text-[#0A1628] hover:bg-[#E8E4DD]',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function CvDropzone({ onFile, file }: { onFile: (file: File) => void; file: File | null }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) onFile(dropped)
  }, [onFile])

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        'relative flex flex-col items-center justify-center gap-4',
        'w-full rounded-xl border-2 border-dashed cursor-pointer select-none',
        'transition-all duration-200 py-12 px-6 text-center',
        file ? 'border-[#0EA5E9] bg-[#E0F2FE]/30'
          : dragging ? 'border-[#0EA5E9] bg-[#E0F2FE]/20 scale-[1.01] animate-pulse'
          : 'border-[#E8E4DD] bg-white hover:border-[#1E3A5F]/30 hover:bg-[#F5F3EF]',
      )}
      role="button" tabIndex={0} aria-label="Upload CV"
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
    >
      <input ref={inputRef} type="file" accept=".pdf,.doc,.docx" className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f) }} />
      {file ? (
        <>
          <div className="w-12 h-12 rounded-full bg-[#0EA5E9]/10 flex items-center justify-center">
            <Check size={24} className="text-[#0EA5E9]" />
          </div>
          <div>
            <p className="font-medium text-[#0A1628] text-sm">{file.name}</p>
            <p className="text-xs text-[#0A1628]/40 mt-0.5">{(file.size / 1024 / 1024).toFixed(1)} MB · Click to replace</p>
          </div>
        </>
      ) : (
        <>
          <div className="w-12 h-12 rounded-full bg-[#1E3A5F]/5 flex items-center justify-center">
            <CloudUpload size={24} className="text-[#1E4976]" />
          </div>
          <div>
            <p className="font-medium text-[#0A1628] text-sm">
              Drop your CV here or <span className="text-[#0EA5E9]">browse</span>
            </p>
            <p className="text-xs text-[#0A1628]/40 mt-0.5">PDF, DOC, DOCX · Max 10 MB</p>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [skippingStep, setSkippingStep] = useState(false)

  // Step 1
  const [jobTitles, setJobTitles] = useState<string[]>([])

  // Step 2 — Target locations
  const [targetCountries, setTargetCountries] = useState<string[]>([])
  const [targetLocations, setTargetLocations] = useState<TargetLocation[]>([])
  const [remotePreference, setRemotePreference] = useState<RemotePreference>('open')
  const [willingnessToRelocate, setWillingnessToRelocate] = useState(true)
  const [requiresVisa, setRequiresVisa] = useState(false)
  const [nationality, setNationality] = useState('')
  const [currentVisaStatus, setCurrentVisaStatus] = useState('')

  // Step 3 — Current location
  const [currentCountry, setCurrentCountry] = useState('')
  const [currentCity, setCurrentCity] = useState('')
  const [maxCommuteMiles, setMaxCommuteMiles] = useState<number | null>(null)

  // Step 4 — CV
  const [cvFile, setCvFile] = useState<File | null>(null)

  // Keep targetLocations in sync with targetCountries
  function toggleCountry(code: string) {
    if (targetCountries.includes(code)) {
      setTargetCountries((prev) => prev.filter((c) => c !== code))
      setTargetLocations((prev) => prev.filter((l) => l.country !== code))
    } else {
      setTargetCountries((prev) => [...prev, code])
      setTargetLocations((prev) => [...prev, { country: code, cities: [], anywhere: true }])
    }
  }

  function updateLocation(code: string, loc: TargetLocation) {
    setTargetLocations((prev) => prev.map((l) => (l.country === code ? loc : l)))
  }

  // Step 3 auto-skip for remote_only
  useEffect(() => {
    if (step === 3 && remotePreference === 'remote_only') {
      setSkippingStep(true)
      const t = setTimeout(() => {
        setSkippingStep(false)
        setStep(4)
      }, 700)
      return () => clearTimeout(t)
    }
  }, [step, remotePreference])

  function canProceed() {
    if (step === 1) return jobTitles.length > 0
    if (step === 2) {
      if (targetCountries.length === 0) return false
      if (requiresVisa && !nationality) return false
      return true
    }
    if (step === 3) return true // optional
    return true
  }

  async function handleFinish() {
    setSaving(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    let rawCvUrl: string | null = null
    if (cvFile) {
      const ext = cvFile.name.split('.').pop()
      const { error: uploadError } = await supabase.storage
        .from('cvs').upload(`${user.id}/cv.${ext}`, cvFile, { upsert: true })
      if (uploadError) {
        setError(`CV upload failed: ${uploadError.message}`)
        setSaving(false)
        return
      }
      const { data: { publicUrl } } = supabase.storage.from('cvs').getPublicUrl(`${user.id}/cv.${ext}`)
      rawCvUrl = publicUrl
    }

    const { error: profileError } = await supabase.from('user_profiles').upsert({
      user_id: user.id,
      job_titles: jobTitles,
      target_countries: targetCountries,
      target_locations: targetLocations,
      remote_preference: remotePreference,
      willingness_to_relocate: willingnessToRelocate,
      requires_visa_sponsorship: requiresVisa,
      nationality: nationality || null,
      current_visa_status: currentVisaStatus || null,
      current_country: currentCountry || null,
      current_city: currentCity || null,
      max_commute_miles: remotePreference === 'remote_only' ? null : maxCommuteMiles,
      raw_cv_url: rawCvUrl,
      cv_uploaded_at: rawCvUrl ? new Date().toISOString() : null,
    })

    if (profileError) { setError(profileError.message); setSaving(false); return }
    await supabase.from('users').update({ onboarding_completed: true }).eq('id', user.id)
    router.push('/dashboard')
    router.refresh()
  }

  const isLastStep = step === TOTAL_STEPS

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col">
      <header className="bg-[#0A1628] px-6 py-4 flex items-center justify-between">
        <span className="text-[#FAFAF8] text-xl font-bold" style={{ fontFamily: "'Satoshi', 'DM Sans', sans-serif", letterSpacing: '0.04em' }}>
          Joberlify
        </span>
        <span className="text-[#FAFAF8]/40 text-sm">Setup {step} of {TOTAL_STEPS}</span>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg space-y-8">
          <div className="flex justify-center">
            <StepIndicator currentStep={step} />
          </div>

          {/* Skip flash for remote-only */}
          {skippingStep ? (
            <div
              className="bg-white rounded-xl border border-[#E8E4DD] p-8 flex flex-col items-center gap-3 shadow-sm"
              style={{ animation: 'fadeInUp 0.2s ease-out both' }}
            >
              <div className="w-10 h-10 rounded-full bg-[#0EA5E9]/10 flex items-center justify-center">
                <Check size={20} className="text-[#0EA5E9]" />
              </div>
              <p className="text-sm font-medium text-[#0A1628]">Skipping — you&apos;re fully remote</p>
            </div>
          ) : (
            <div
              key={step}
              className="bg-white rounded-xl border border-[#E8E4DD] p-8 space-y-6 shadow-sm"
              style={{ animation: 'fadeInUp 0.3s ease-out both' }}
            >
              {/* ── Step 1: Job Roles ── */}
              {step === 1 && (
                <>
                  <div>
                    <h2 className="text-xl font-bold text-[#0A1628]" style={{ fontFamily: "'Satoshi', 'DM Sans', sans-serif" }}>
                      What roles are you looking for?
                    </h2>
                    <p className="text-sm text-[#0A1628]/50 mt-1">
                      Add job titles you&apos;re targeting. Press <kbd className="font-mono text-xs bg-[#F5F3EF] px-1.5 py-0.5 rounded border border-[#E8E4DD]">Enter</kbd> after each.
                    </p>
                  </div>
                  <TagInput
                    tags={jobTitles}
                    onAdd={(t) => setJobTitles((p) => [...p, t])}
                    onRemove={(t) => setJobTitles((p) => p.filter((x) => x !== t))}
                    placeholder="e.g. Software Engineer, Product Manager…"
                  />
                  {jobTitles.length === 0 && (
                    <p className="text-xs text-[#0A1628]/40">Add at least one job title to continue.</p>
                  )}
                </>
              )}

              {/* ── Step 2: Target Locations ── */}
              {step === 2 && (
                <>
                  <div>
                    <h2 className="text-xl font-bold text-[#0A1628]" style={{ fontFamily: "'Satoshi', 'DM Sans', sans-serif" }}>
                      Where do you want to work?
                    </h2>
                    <p className="text-sm text-[#0A1628]/50 mt-1">Select countries, then refine by city if needed.</p>
                  </div>

                  <CountrySelect selected={targetCountries} onToggle={toggleCountry} />

                  {/* Per-country city sections */}
                  {targetCountries.length > 0 && (
                    <div className="space-y-2">
                      {targetCountries.map((code) => {
                        const loc = targetLocations.find((l) => l.country === code) ?? { country: code, cities: [], anywhere: true }
                        return (
                          <CitySection key={code} countryCode={code} location={loc} onChange={(l) => updateLocation(code, l)} />
                        )
                      })}
                    </div>
                  )}

                  {/* Remote preference */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#0A1628]">Work arrangement preference</label>
                    <RemoteSegmentedControl value={remotePreference} onChange={setRemotePreference} />
                  </div>

                  {/* Willingness to relocate */}
                  <Toggle
                    checked={willingnessToRelocate}
                    onChange={setWillingnessToRelocate}
                    label="I'm open to relocating for the right role"
                  />

                  {/* Visa */}
                  <div className="pt-3 border-t border-[#E8E4DD] space-y-4">
                    <Toggle checked={requiresVisa} onChange={setRequiresVisa} label="I need visa sponsorship" />
                    <div
                      className="overflow-hidden transition-all duration-300"
                      style={{ maxHeight: requiresVisa ? '200px' : '0px', opacity: requiresVisa ? 1 : 0 }}
                    >
                      <div className="space-y-3 pt-1">
                        <div className="space-y-1.5">
                          <label className="block text-sm font-medium text-[#0A1628]">Your nationality</label>
                          <select value={nationality} onChange={(e) => setNationality(e.target.value)}
                            className={cn('w-full px-3.5 py-2.5 rounded-lg text-sm bg-white border border-[#1E3A5F]/20 text-[#0A1628] focus:outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20', !nationality && 'text-[#0A1628]/40')}>
                            <option value="">Select nationality…</option>
                            {NATIONALITIES.map((n) => <option key={n} value={n}>{n}</option>)}
                          </select>
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
                    </div>
                  </div>
                </>
              )}

              {/* ── Step 3: Current Location ── */}
              {step === 3 && remotePreference !== 'remote_only' && (
                <>
                  <div>
                    <h2 className="text-xl font-bold text-[#0A1628]" style={{ fontFamily: "'Satoshi', 'DM Sans', sans-serif" }}>
                      Where are you based?
                    </h2>
                    <p className="text-sm text-[#0A1628]/50 mt-1">Helps us assess commutable roles accurately.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-[#0A1628]">Current country</label>
                      <select value={currentCountry} onChange={(e) => setCurrentCountry(e.target.value)}
                        className={cn('w-full px-3.5 py-2.5 rounded-lg text-sm bg-white border border-[#1E3A5F]/20 text-[#0A1628] focus:outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20', !currentCountry && 'text-[#0A1628]/40')}>
                        <option value="">Select country…</option>
                        {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-[#0A1628]">Current city</label>
                      <TagInput
                        tags={currentCity ? [currentCity] : []}
                        onAdd={(c) => setCurrentCity(c)}
                        onRemove={() => setCurrentCity('')}
                        placeholder="e.g. London"
                        suggestions={currentCountry ? (CITY_SUGGESTIONS[currentCountry] ?? []) : []}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-[#0A1628]">Maximum commute distance</label>
                      <select
                        value={maxCommuteMiles ?? ''}
                        onChange={(e) => setMaxCommuteMiles(e.target.value === '' ? null : Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-white border border-[#1E3A5F]/20 text-[#0A1628] focus:outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20"
                      >
                        {COMMUTE_OPTIONS.map((o) => (
                          <option key={String(o.value)} value={o.value ?? ''}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* ── Step 4: CV Upload ── */}
              {step === 4 && (
                <>
                  <div>
                    <h2 className="text-xl font-bold text-[#0A1628]" style={{ fontFamily: "'Satoshi', 'DM Sans', sans-serif" }}>
                      Upload your CV
                    </h2>
                    <p className="text-sm text-[#0A1628]/50 mt-1">
                      We&apos;ll parse it so you don&apos;t have to re-enter your experience. You can skip and add it later.
                    </p>
                  </div>
                  <CvDropzone onFile={setCvFile} file={cvFile} />
                </>
              )}
            </div>
          )}

          {error && (
            <p className="text-sm text-[#EF4444] bg-[#EF4444]/5 border border-[#EF4444]/20 rounded-lg px-3.5 py-2.5 text-center">
              {error}
            </p>
          )}

          {!skippingStep && (
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                disabled={step === 1}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-150',
                  'text-[#0A1628]/50 hover:text-[#0A1628] hover:bg-[#E8E4DD]',
                  'disabled:opacity-0 disabled:pointer-events-none',
                )}
              >
                Back
              </button>

              {!isLastStep ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!canProceed()}
                  className={cn(
                    'px-6 py-2.5 rounded-lg text-sm font-semibold',
                    'bg-[#1E3A5F] text-[#FAFAF8] transition-colors duration-200 hover:bg-[#0EA5E9]',
                    'disabled:opacity-40 disabled:cursor-not-allowed',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9] focus-visible:ring-offset-2',
                  )}
                >
                  Continue
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  {!cvFile && (
                    <button type="button" onClick={handleFinish} disabled={saving}
                      className="px-4 py-2 text-sm text-[#0A1628]/50 hover:text-[#0A1628] transition-colors">
                      Skip for now
                    </button>
                  )}
                  <button
                    type="button" onClick={handleFinish} disabled={saving}
                    className={cn(
                      'px-6 py-2.5 rounded-lg text-sm font-semibold',
                      'bg-[#1E3A5F] text-[#FAFAF8] transition-colors duration-200 hover:bg-[#0EA5E9]',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9] focus-visible:ring-offset-2',
                    )}
                  >
                    {saving ? (
                      <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" />Saving…</span>
                    ) : 'Go to Dashboard'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
