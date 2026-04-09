'use client'

import { useState } from 'react'
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  Shield,
  Building2,
  Briefcase,
  DollarSign,
  Info,
  MapPin,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { VisaEligibilityResult, EligibilityGuidance, VisaVerdict } from '@/lib/visa/eligibility-check'

// ─── Config ───────────────────────────────────────────────────────────────────

const VERDICT_CONFIG: Record<
  VisaVerdict,
  { label: string; bg: string; text: string; border: string; badgeBg: string }
> = {
  confirmed: {
    label:   'Sponsorship confirmed',
    bg:      'bg-[#22C55E]/8',
    text:    'text-[#22C55E]',
    border:  'border-[#22C55E]/20',
    badgeBg: '#22C55E',
  },
  likely: {
    label:   'Likely sponsorable',
    bg:      'bg-[#22C55E]/8',
    text:    'text-[#22C55E]',
    border:  'border-[#22C55E]/20',
    badgeBg: '#22C55E',
  },
  uncertain: {
    label:   'Uncertain — verify before applying',
    bg:      'bg-[#F59E0B]/8',
    text:    'text-[#F59E0B]',
    border:  'border-[#F59E0B]/20',
    badgeBg: '#F59E0B',
  },
  unlikely: {
    label:   'Unlikely to sponsor',
    bg:      'bg-[#EF4444]/8',
    text:    'text-[#EF4444]',
    border:  'border-[#EF4444]/20',
    badgeBg: '#EF4444',
  },
  blocked: {
    label:   'Not eligible for Skilled Worker visa',
    bg:      'bg-[#EF4444]/8',
    text:    'text-[#EF4444]',
    border:  'border-[#EF4444]/20',
    badgeBg: '#EF4444',
  },
  not_sponsorable: {
    label:   'Cannot issue new CoS (B-rated)',
    bg:      'bg-[#EF4444]/8',
    text:    'text-[#EF4444]',
    border:  'border-[#EF4444]/20',
    badgeBg: '#EF4444',
  },
}

const LAYER_ICONS = {
  sponsor: Building2,
  soc:     Briefcase,
  salary:  DollarSign,
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LayerRow({ layer, open, onToggle }: {
  layer: EligibilityGuidance
  open: boolean
  onToggle: () => void
}) {
  const Icon = LAYER_ICONS[layer.layer]

  return (
    <div className="rounded-lg border border-[#E8E4DD] overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left bg-white hover:bg-[#FAFAF8] transition-colors"
        aria-expanded={open}
      >
        {/* Pass/fail dot */}
        {layer.passed
          ? <CheckCircle2 size={15} className="flex-shrink-0 text-[#22C55E]" />
          : <XCircle size={15} className="flex-shrink-0 text-[#EF4444]" />
        }
        <Icon size={13} className="flex-shrink-0 text-[#0A1628]/40" />
        <span className="flex-1 text-sm font-medium text-[#0A1628] min-w-0 truncate">
          {layer.title}
        </span>
        <ChevronDown
          size={14}
          className="flex-shrink-0 text-[#0A1628]/30 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: open ? 400 : 0, opacity: open ? 1 : 0 }}
      >
        <div className="px-4 pb-4 pt-1 border-t border-[#E8E4DD] bg-white">
          <p className="text-sm text-[#0A1628]/65 leading-relaxed pt-2">
            {layer.detail}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface VisaEligibilityPanelProps {
  result: VisaEligibilityResult
  /** Job location — shown if it doesn't match user's targets */
  jobLocation?: string | null
  /** User's target locations from profile */
  userTargetLocations?: string[]
  className?: string
}

export function VisaEligibilityPanel({
  result,
  jobLocation,
  userTargetLocations,
  className,
}: VisaEligibilityPanelProps) {
  const [openLayers, setOpenLayers] = useState<Set<number>>(new Set())
  const [showDisclaimer, setShowDisclaimer] = useState(false)

  const cfg = VERDICT_CONFIG[result.verdict]

  function toggleLayer(i: number) {
    setOpenLayers((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  // Location mismatch check
  const hasLocationMismatch =
    jobLocation &&
    userTargetLocations &&
    userTargetLocations.length > 0 &&
    !userTargetLocations.some((loc) =>
      jobLocation.toLowerCase().includes(loc.toLowerCase()),
    )

  // Sponsor data last updated
  const sponsorUpdated = result.sponsorDataLastUpdatedAt
    ? new Date(result.sponsorDataLastUpdatedAt).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    : null

  return (
    <div className={cn('rounded-2xl border overflow-hidden', cfg.border, className)}>
      {/* ── Verdict header ── */}
      <div className={cn('px-5 py-4 flex items-center gap-3', cfg.bg)}>
        <Shield size={18} className={cfg.text} />
        <div className="flex-1">
          <p className={cn('text-sm font-bold', cfg.text)}>{cfg.label}</p>
          <p className="text-xs text-[#0A1628]/50 mt-0.5">
            Skilled Worker visa eligibility — 3 layer check
          </p>
        </div>
        {/* Mini pass/fail icons */}
        <div className="flex items-center gap-1">
          {result.guidance.map((g, i) => (
            g.passed
              ? <CheckCircle2 key={i} size={13} className="text-[#22C55E]" />
              : <XCircle key={i} size={13} className="text-[#EF4444]" />
          ))}
        </div>
      </div>

      <div className="p-5 space-y-4 bg-white">

        {/* ── Location mismatch note ── */}
        {hasLocationMismatch && (
          <div className="flex items-start gap-2 rounded-lg border border-[#F97316]/20 bg-[#F97316]/5 px-3.5 py-3">
            <MapPin size={13} className="flex-shrink-0 mt-0.5 text-[#F97316]" />
            <p className="text-xs text-[#0A1628]/70 leading-relaxed">
              This employer is in <strong>{jobLocation}</strong>. Your target locations
              are <strong>{userTargetLocations!.join(', ')}</strong>.
            </p>
          </div>
        )}

        {/* ── Three layers (accordion) ── */}
        <div className="space-y-2">
          {result.guidance.map((layer, i) => (
            <LayerRow
              key={i}
              layer={layer}
              open={openLayers.has(i)}
              onToggle={() => toggleLayer(i)}
            />
          ))}
        </div>

        {/* ── Sponsor details ── */}
        {result.sponsor.found && result.sponsor.sponsor && (
          <div className="rounded-lg border border-[#E8E4DD] px-4 py-3 space-y-1.5">
            <p className="text-xs font-semibold text-[#0A1628]/40 uppercase tracking-widest">
              Sponsor details
            </p>
            <p className="text-sm font-semibold text-[#0A1628]">
              {result.sponsor.sponsor.name}
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              {result.sponsor.sponsor.townCity && (
                <span className="text-xs text-[#0A1628]/50">
                  {result.sponsor.sponsor.townCity}
                  {result.sponsor.sponsor.county ? `, ${result.sponsor.sponsor.county}` : ''}
                </span>
              )}
              <span
                className="text-xs font-semibold px-1.5 py-0.5 rounded"
                style={{
                  background: result.sponsor.sponsor.rating === 'A' ? '#22C55E18' : '#EF444418',
                  color:      result.sponsor.sponsor.rating === 'A' ? '#22C55E' : '#EF4444',
                }}
              >
                {result.sponsor.sponsor.rating}-rated
              </span>
              <span className="text-xs text-[#0A1628]/45">
                {result.sponsor.sponsor.route}
              </span>
            </div>
            {result.sponsor.matchConfidence === 'fuzzy' && (
              <p className="text-xs text-[#F59E0B] flex items-center gap-1">
                <AlertCircle size={11} />
                Approximate name match — verify this is the correct employer on GOV.UK
              </p>
            )}
          </div>
        )}

        {/* ── SOC code match ── */}
        {result.soc.socCode && (
          <div className="rounded-lg border border-[#E8E4DD] px-4 py-3 space-y-1.5">
            <p className="text-xs font-semibold text-[#0A1628]/40 uppercase tracking-widest">
              SOC 2020 classification
            </p>
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-mono px-2 py-0.5 rounded"
                style={{ background: '#E0F2FE', color: '#0EA5E9' }}
              >
                {result.soc.socCode}
              </span>
              <span className="text-sm font-semibold text-[#0A1628]">
                {result.soc.occupationTitle}
              </span>
              <span
                className="text-xs px-1.5 py-0.5 rounded"
                style={{
                  background: result.soc.confidence === 'high' ? '#22C55E14' : result.soc.confidence === 'medium' ? '#F59E0B14' : '#EF444414',
                  color:      result.soc.confidence === 'high' ? '#22C55E' : result.soc.confidence === 'medium' ? '#F59E0B' : '#EF4444',
                }}
              >
                {result.soc.confidence} confidence
              </span>
            </div>
            {result.soc.rqfLevel !== null && (
              <p className="text-xs text-[#0A1628]/45">
                RQF level {result.soc.rqfLevel} · {result.soc.eligibilityTable}
                {result.soc.isIslRole && ' · Immigration Salary List'}
                {result.soc.isTslDependent && ' · Temporary Shortage List'}
              </p>
            )}
            {result.soc.confidence === 'low' && (
              <div className="flex items-start gap-1.5 mt-1.5 rounded-md border border-[#F59E0B]/20 bg-[#F59E0B]/5 px-2.5 py-2">
                <AlertCircle size={11} className="flex-shrink-0 mt-0.5 text-[#F59E0B]" />
                <p className="text-xs text-[#92400E] leading-relaxed">
                  We mapped this role to SOC {result.soc.socCode} with low confidence.
                  The actual code may differ — consult the{' '}
                  <a
                    href="https://cascot.online"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold underline hover:text-[#F59E0B] transition-colors"
                  >
                    CASCOT tool
                  </a>
                  {' '}for verification.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Salary ── */}
        {result.salary.advertisedSalary === null && result.soc.socCode && (
          <div className="rounded-lg border border-[#F59E0B]/20 bg-[#F59E0B]/5 px-4 py-3">
            <p className="text-xs font-semibold text-[#0A1628]/40 uppercase tracking-widest mb-1.5">
              Salary not specified
            </p>
            <p className="text-xs text-[#0A1628]/70 leading-relaxed">
              The listing doesn't include a salary. We can't verify the threshold, but the
              going rate for SOC {result.soc.socCode} ({result.soc.occupationTitle}) is{' '}
              <strong className="font-semibold text-[#0A1628]">
                £{result.salary.effectiveMinimum?.toLocaleString('en-GB') ?? '—'}/year
              </strong>{' '}
              minimum. Confirm with the employer before applying.
            </p>
          </div>
        )}
        {result.salary.advertisedSalary !== null && (
          <div className="rounded-lg border border-[#E8E4DD] px-4 py-3">
            <p className="text-xs font-semibold text-[#0A1628]/40 uppercase tracking-widest mb-2">
              Salary check
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-[#0A1628]/45">Advertised</p>
                <p className="font-semibold text-[#0A1628]">
                  £{result.salary.advertisedSalary.toLocaleString('en-GB')}
                </p>
              </div>
              <div>
                <p className="text-[#0A1628]/45">Required minimum</p>
                <p className="font-semibold text-[#0A1628]">
                  £{result.salary.effectiveMinimum.toLocaleString('en-GB')}
                </p>
              </div>
              {result.salary.shortfall && (
                <div className="col-span-2">
                  <p className="text-[#EF4444] font-semibold">
                    Shortfall: £{result.salary.shortfall.toLocaleString('en-GB')}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Timestamps ── */}
        <div className="flex items-center gap-4 flex-wrap text-xs text-[#0A1628]/30">
          {sponsorUpdated && (
            <span>Sponsor data: {sponsorUpdated}</span>
          )}
          <span>
            Rules verified:{' '}
            {new Date(result.rulesLastVerifiedAt).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </span>
        </div>

        {/* ── Legal disclaimer ── */}
        <div className="border-t border-[#E8E4DD] pt-3">
          <button
            type="button"
            onClick={() => setShowDisclaimer((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-[#0A1628]/35 hover:text-[#0A1628]/60 transition-colors"
          >
            <Info size={11} />
            Legal disclaimer
            <ChevronDown
              size={11}
              style={{ transform: showDisclaimer ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 150ms ease' }}
            />
          </button>
          {showDisclaimer && (
            <p className="mt-2 text-xs text-[#0A1628]/45 leading-relaxed">
              {result.disclaimer}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
