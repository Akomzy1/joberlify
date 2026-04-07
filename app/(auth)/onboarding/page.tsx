'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { X, ChevronDown, Upload, Loader2, Check, CloudUpload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/cn'

// ─── Data ────────────────────────────────────────────────────────────────────

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

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = ['Job Roles', 'Location & Visa', 'Your CV']
  return (
    <div className="flex items-center gap-0">
      {steps.map((label, i) => {
        const step = i + 1
        const done = step < currentStep
        const active = step === currentStep
        return (
          <div key={step} className="flex items-center">
            {/* Circle */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300',
                  done && 'bg-[#0EA5E9] text-white',
                  active && 'bg-[#1E3A5F] text-[#FAFAF8] ring-4 ring-[#0EA5E9]/20',
                  !done && !active && 'bg-[#E8E4DD] text-[#0A1628]/40',
                )}
              >
                {done ? <Check size={14} /> : step}
              </div>
              <span
                className={cn(
                  'text-xs font-medium transition-colors duration-300 whitespace-nowrap',
                  active ? 'text-[#0A1628]' : 'text-[#0A1628]/40',
                )}
              >
                {label}
              </span>
            </div>

            {/* Connector */}
            {i < steps.length - 1 && (
              <div className="w-16 sm:w-24 h-px mx-2 mb-5 transition-all duration-300 relative">
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

// ─── Tag Input ───────────────────────────────────────────────────────────────

function TagInput({
  tags,
  onAdd,
  onRemove,
  placeholder,
}: {
  tags: string[]
  onAdd: (tag: string) => void
  onRemove: (tag: string) => void
  placeholder: string
}) {
  const [value, setValue] = useState('')

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && value.trim()) {
      e.preventDefault()
      const tag = value.trim().replace(/,$/, '')
      if (tag && !tags.includes(tag)) onAdd(tag)
      setValue('')
    }
    if (e.key === 'Backspace' && !value && tags.length > 0) {
      onRemove(tags[tags.length - 1])
    }
  }

  return (
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
        <span
          key={tag}
          className="inline-flex items-center gap-1.5 bg-[#1E3A5F] text-[#FAFAF8] text-sm rounded px-2.5 py-1"
        >
          {tag}
          <button
            type="button"
            onClick={() => onRemove(tag)}
            className="hover:text-[#EF4444] transition-colors"
            aria-label={`Remove ${tag}`}
          >
            <X size={12} />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : 'Add another…'}
        className="flex-1 min-w-[140px] bg-transparent text-sm text-[#0A1628] placeholder:text-[#0A1628]/30 outline-none"
      />
    </div>
  )
}

// ─── Custom Toggle ───────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9] focus-visible:ring-offset-2',
          checked ? 'bg-[#0EA5E9]' : 'bg-[#E8E4DD]',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200',
            checked ? 'translate-x-5' : 'translate-x-0',
          )}
        />
      </button>
      <span className="text-sm font-medium text-[#0A1628]">{label}</span>
    </label>
  )
}

// ─── Country Multi-Select ─────────────────────────────────────────────────────

function CountrySelect({
  selected,
  onToggle,
}: {
  selected: string[]
  onToggle: (code: string) => void
}) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const filtered = COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="relative">
      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selected.map((code) => {
            const c = COUNTRIES.find((c) => c.code === code)
            return c ? (
              <span
                key={code}
                className="inline-flex items-center gap-1.5 bg-[#1E3A5F] text-[#FAFAF8] text-sm rounded px-2.5 py-1"
              >
                {c.flag} {c.name}
                <button
                  type="button"
                  onClick={() => onToggle(code)}
                  className="hover:text-[#EF4444] transition-colors"
                  aria-label={`Remove ${c.name}`}
                >
                  <X size={12} />
                </button>
              </span>
            ) : null
          })}
        </div>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm',
          'bg-white border border-[#1E3A5F]/20 text-[#0A1628]',
          'transition-colors duration-150',
          'hover:border-[#1E3A5F]/40',
          open && 'border-[#0EA5E9] ring-2 ring-[#0EA5E9]/20',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9]',
        )}
      >
        <span className={selected.length === 0 ? 'text-[#0A1628]/30' : ''}>
          {selected.length === 0 ? 'Select countries…' : `${selected.length} selected`}
        </span>
        <ChevronDown
          size={16}
          className={cn(
            'text-[#0A1628]/40 transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-[#E8E4DD] rounded-lg shadow-md overflow-hidden">
          <div className="p-2 border-b border-[#E8E4DD]">
            <input
              type="text"
              placeholder="Search countries…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm bg-[#F5F3EF] rounded text-[#0A1628] placeholder:text-[#0A1628]/30 outline-none"
              autoFocus
            />
          </div>
          <ul className="max-h-48 overflow-y-auto py-1">
            {filtered.map((c) => {
              const isSelected = selected.includes(c.code)
              return (
                <li key={c.code}>
                  <button
                    type="button"
                    onClick={() => onToggle(c.code)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors',
                      isSelected
                        ? 'bg-[#E0F2FE] text-[#0A1628]'
                        : 'text-[#0A1628] hover:bg-[#F5F3EF]',
                    )}
                  >
                    <span>{c.flag}</span>
                    <span className="flex-1">{c.name}</span>
                    {isSelected && <Check size={14} className="text-[#0EA5E9]" />}
                  </button>
                </li>
              )
            })}
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-[#0A1628]/40">No results</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

// ─── CV Dropzone ──────────────────────────────────────────────────────────────

function CvDropzone({
  onFile,
  file,
}: {
  onFile: (file: File) => void
  file: File | null
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const dropped = e.dataTransfer.files[0]
      if (dropped) onFile(dropped)
    },
    [onFile],
  )

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        'relative flex flex-col items-center justify-center gap-4',
        'w-full rounded-xl border-2 border-dashed cursor-pointer',
        'transition-all duration-200 py-12 px-6 text-center select-none',
        file
          ? 'border-[#0EA5E9] bg-[#E0F2FE]/30'
          : dragging
            ? 'border-[#0EA5E9] bg-[#E0F2FE]/20 scale-[1.01]'
            : 'border-[#E8E4DD] bg-white hover:border-[#1E3A5F]/30 hover:bg-[#F5F3EF]',
        dragging && 'animate-pulse',
      )}
      role="button"
      tabIndex={0}
      aria-label="Upload CV"
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
        }}
      />

      {file ? (
        <>
          <div className="w-12 h-12 rounded-full bg-[#0EA5E9]/10 flex items-center justify-center">
            <Check size={24} className="text-[#0EA5E9]" />
          </div>
          <div>
            <p className="font-medium text-[#0A1628] text-sm">{file.name}</p>
            <p className="text-xs text-[#0A1628]/40 mt-0.5">
              {(file.size / 1024 / 1024).toFixed(1)} MB · Click to replace
            </p>
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

  // Step 1
  const [jobTitles, setJobTitles] = useState<string[]>([])
  // Step 2
  const [targetCountries, setTargetCountries] = useState<string[]>([])
  const [requiresVisa, setRequiresVisa] = useState(false)
  const [nationality, setNationality] = useState('')
  const [currentVisaStatus, setCurrentVisaStatus] = useState('')
  // Step 3
  const [cvFile, setCvFile] = useState<File | null>(null)

  function toggleCountry(code: string) {
    setTargetCountries((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    )
  }

  function canProceed() {
    if (step === 1) return jobTitles.length > 0
    if (step === 2) {
      if (targetCountries.length === 0) return false
      if (requiresVisa && !nationality) return false
      return true
    }
    return true // CV is optional
  }

  async function handleFinish() {
    setSaving(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    let rawCvUrl: string | null = null

    // Upload CV if provided
    if (cvFile) {
      const ext = cvFile.name.split('.').pop()
      const path = `${user.id}/cv.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('cvs')
        .upload(path, cvFile, { upsert: true })

      if (uploadError) {
        setError(`CV upload failed: ${uploadError.message}`)
        setSaving(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage.from('cvs').getPublicUrl(path)
      rawCvUrl = publicUrl
    }

    // Upsert user_profiles
    const { error: profileError } = await supabase.from('user_profiles').upsert({
      user_id: user.id,
      job_titles: jobTitles,
      target_countries: targetCountries,
      requires_visa_sponsorship: requiresVisa,
      nationality: nationality || null,
      current_visa_status: currentVisaStatus || null,
      raw_cv_url: rawCvUrl,
      cv_uploaded_at: rawCvUrl ? new Date().toISOString() : null,
    })

    if (profileError) {
      setError(profileError.message)
      setSaving(false)
      return
    }

    // Mark onboarding complete
    await supabase.from('users').update({ onboarding_completed: true }).eq('id', user.id)

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col">
      {/* Top bar */}
      <header className="bg-[#0A1628] px-6 py-4 flex items-center justify-between">
        <span
          className="text-[#FAFAF8] text-xl font-bold"
          style={{ fontFamily: "'Satoshi', 'DM Sans', sans-serif", letterSpacing: '0.04em' }}
        >
          Joberlify
        </span>
        <span className="text-[#FAFAF8]/40 text-sm">Setup {step} of 3</span>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg space-y-10">
          {/* Step indicator */}
          <div className="flex justify-center">
            <StepIndicator currentStep={step} />
          </div>

          {/* Step panels — slide animation via key */}
          <div
            key={step}
            className="bg-white rounded-xl border border-[#E8E4DD] p-8 space-y-6 shadow-sm"
            style={{ animation: 'fadeInUp 0.3s ease-out both' }}
          >
            {/* ── Step 1: Job Roles ── */}
            {step === 1 && (
              <>
                <div>
                  <h2
                    className="text-xl font-bold text-[#0A1628]"
                    style={{ fontFamily: "'Satoshi', 'DM Sans', sans-serif" }}
                  >
                    What roles are you looking for?
                  </h2>
                  <p className="text-sm text-[#0A1628]/50 mt-1">
                    Add the job titles you&apos;re targeting. Press <kbd className="font-mono text-xs bg-[#F5F3EF] px-1.5 py-0.5 rounded border border-[#E8E4DD]">Enter</kbd> after each one.
                  </p>
                </div>
                <TagInput
                  tags={jobTitles}
                  onAdd={(t) => setJobTitles((prev) => [...prev, t])}
                  onRemove={(t) => setJobTitles((prev) => prev.filter((x) => x !== t))}
                  placeholder="e.g. Software Engineer, Product Manager…"
                />
                {jobTitles.length === 0 && (
                  <p className="text-xs text-[#0A1628]/40">Add at least one job title to continue.</p>
                )}
              </>
            )}

            {/* ── Step 2: Location & Visa ── */}
            {step === 2 && (
              <>
                <div>
                  <h2
                    className="text-xl font-bold text-[#0A1628]"
                    style={{ fontFamily: "'Satoshi', 'DM Sans', sans-serif" }}
                  >
                    Where do you want to work?
                  </h2>
                  <p className="text-sm text-[#0A1628]/50 mt-1">
                    Select one or more countries you&apos;re targeting.
                  </p>
                </div>
                <CountrySelect selected={targetCountries} onToggle={toggleCountry} />

                <div className="pt-2 border-t border-[#E8E4DD]">
                  <Toggle
                    checked={requiresVisa}
                    onChange={setRequiresVisa}
                    label="I need visa sponsorship"
                  />
                </div>

                {/* Conditional visa fields — slide down */}
                <div
                  className="overflow-hidden transition-all duration-300"
                  style={{
                    maxHeight: requiresVisa ? '200px' : '0px',
                    opacity: requiresVisa ? 1 : 0,
                  }}
                >
                  <div className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-[#0A1628]">
                        Your nationality
                      </label>
                      <select
                        value={nationality}
                        onChange={(e) => setNationality(e.target.value)}
                        className={cn(
                          'w-full px-3.5 py-2.5 rounded-lg text-sm',
                          'bg-white border border-[#1E3A5F]/20 text-[#0A1628]',
                          'focus:outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20',
                          !nationality && 'text-[#0A1628]/40',
                        )}
                      >
                        <option value="">Select nationality…</option>
                        {NATIONALITIES.map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-[#0A1628]">
                        Current visa / right to work status
                      </label>
                      <select
                        value={currentVisaStatus}
                        onChange={(e) => setCurrentVisaStatus(e.target.value)}
                        className={cn(
                          'w-full px-3.5 py-2.5 rounded-lg text-sm',
                          'bg-white border border-[#1E3A5F]/20 text-[#0A1628]',
                          'focus:outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20',
                          !currentVisaStatus && 'text-[#0A1628]/40',
                        )}
                      >
                        <option value="">Select status…</option>
                        {VISA_STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── Step 3: CV Upload ── */}
            {step === 3 && (
              <>
                <div>
                  <h2
                    className="text-xl font-bold text-[#0A1628]"
                    style={{ fontFamily: "'Satoshi', 'DM Sans', sans-serif" }}
                  >
                    Upload your CV
                  </h2>
                  <p className="text-sm text-[#0A1628]/50 mt-1">
                    We&apos;ll parse it so you don&apos;t have to re-enter your experience. You can skip this and add it later.
                  </p>
                </div>
                <CvDropzone onFile={setCvFile} file={cvFile} />
              </>
            )}
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-[#EF4444] bg-[#EF4444]/5 border border-[#EF4444]/20 rounded-lg px-3.5 py-2.5 text-center">
              {error}
            </p>
          )}

          {/* Navigation */}
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

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed()}
                className={cn(
                  'px-6 py-2.5 rounded-lg text-sm font-semibold',
                  'bg-[#1E3A5F] text-[#FAFAF8]',
                  'transition-colors duration-200',
                  'hover:bg-[#0EA5E9]',
                  'disabled:opacity-40 disabled:cursor-not-allowed',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9] focus-visible:ring-offset-2',
                )}
              >
                Continue
              </button>
            ) : (
              <div className="flex items-center gap-3">
                {!cvFile && (
                  <button
                    type="button"
                    onClick={handleFinish}
                    disabled={saving}
                    className="px-4 py-2 text-sm text-[#0A1628]/50 hover:text-[#0A1628] transition-colors"
                  >
                    Skip for now
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={saving}
                  className={cn(
                    'px-6 py-2.5 rounded-lg text-sm font-semibold',
                    'bg-[#1E3A5F] text-[#FAFAF8]',
                    'transition-colors duration-200',
                    'hover:bg-[#0EA5E9]',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9] focus-visible:ring-offset-2',
                  )}
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      Saving…
                    </span>
                  ) : (
                    'Go to Dashboard'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
