'use client'

import { useCallback, useRef, useState } from 'react'
import {
  CloudUpload, Check, X, AlertTriangle, Loader2,
  FileText, RefreshCw, ChevronDown, ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { CvParsedData, CvJobHistory, CvQualification } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type UploadState =
  | { status: 'idle' }
  | { status: 'uploading'; progress: number }
  | { status: 'parsing' }
  | { status: 'done'; data: CvParsedData; warnings: string[] }
  | { status: 'error'; message: string }

interface CvUploaderProps {
  initialData?: CvParsedData | null
  onConfirm: (data: CvParsedData) => void
  onSkip?: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Tag({ label, onRemove }: { label: string; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-[#1E3A5F] text-[#FAFAF8] text-xs rounded px-2.5 py-1">
      {label}
      {onRemove && (
        <button type="button" onClick={onRemove} className="hover:text-[#EF4444] transition-colors" aria-label={`Remove ${label}`}>
          <X size={11} />
        </button>
      )}
    </span>
  )
}

function SectionToggle({ label, count, children }: { label: string; count: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="border border-[#E8E4DD] rounded-lg overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#F5F3EF] hover:bg-[#E8E4DD] transition-colors text-left">
        <span className="text-sm font-semibold text-[#0A1628]">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#0A1628]/40 bg-white border border-[#E8E4DD] rounded-full px-2 py-0.5">{count}</span>
          {open ? <ChevronUp size={14} className="text-[#0A1628]/40" /> : <ChevronDown size={14} className="text-[#0A1628]/40" />}
        </div>
      </button>
      {open && <div className="px-4 py-4 border-t border-[#E8E4DD] space-y-3">{children}</div>}
    </div>
  )
}

// ─── Dropzone ─────────────────────────────────────────────────────────────────

function Dropzone({ onFile, compact = false }: { onFile: (f: File) => void; compact?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) onFile(f)
  }, [onFile])

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      role="button" tabIndex={0} aria-label="Upload CV"
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      className={cn(
        'relative flex flex-col items-center justify-center gap-3 w-full rounded-xl border-2 border-dashed cursor-pointer select-none transition-all duration-200 text-center',
        compact ? 'py-6 px-4' : 'py-12 px-6',
        dragging ? 'border-[#0EA5E9] bg-[#E0F2FE]/20 scale-[1.01] animate-pulse'
          : 'border-[#E8E4DD] bg-white hover:border-[#1E3A5F]/30 hover:bg-[#F5F3EF]',
      )}
    >
      <input ref={inputRef} type="file" accept=".pdf,.doc,.docx" className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f) }} />
      <div className={cn('rounded-full bg-[#1E3A5F]/5 flex items-center justify-center', compact ? 'w-9 h-9' : 'w-12 h-12')}>
        <CloudUpload size={compact ? 18 : 24} className="text-[#1E4976]" />
      </div>
      <div>
        <p className={cn('font-medium text-[#0A1628]', compact ? 'text-xs' : 'text-sm')}>
          {compact ? 'Upload a different CV' : <>Drop your CV here or <span className="text-[#0EA5E9]">browse</span></>}
        </p>
        <p className="text-xs text-[#0A1628]/40 mt-0.5">PDF, DOC, DOCX · Max 10 MB</p>
      </div>
    </div>
  )
}

// ─── Parsed data review ───────────────────────────────────────────────────────

function ParsedDataReview({
  data,
  warnings,
  onChange,
}: {
  data: CvParsedData
  warnings: string[]
  onChange: (d: CvParsedData) => void
}) {
  function addSkill(skill: string) {
    if (!data.skills.includes(skill)) onChange({ ...data, skills: [...data.skills, skill] })
  }
  function removeSkill(skill: string) {
    onChange({ ...data, skills: data.skills.filter((s) => s !== skill) })
  }

  return (
    <div className="space-y-4">
      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="flex items-start gap-2.5 bg-[#F59E0B]/5 border border-[#F59E0B]/20 rounded-lg p-3.5">
          <AlertTriangle size={15} className="text-[#F59E0B] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-[#0A1628] mb-1">Parsing notes</p>
            <ul className="space-y-0.5">
              {warnings.map((w, i) => (
                <li key={i} className="text-xs text-[#0A1628]/70">{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Contact / summary */}
      <div className="bg-[#F5F3EF] rounded-lg p-4 space-y-1">
        <p className="text-sm font-semibold text-[#0A1628]">
          {data.contactDetails.name ?? 'Name not found'}
        </p>
        {data.currentTitle && (
          <p className="text-sm text-[#0A1628]/70">{data.currentTitle}
            {data.currentCompany && <span className="text-[#0A1628]/50"> at {data.currentCompany}</span>}
          </p>
        )}
        {data.totalExperienceYears && (
          <p className="text-xs text-[#0EA5E9] font-medium">{data.totalExperienceYears} years experience</p>
        )}
        {data.careerSummary && (
          <p className="text-xs text-[#0A1628]/60 mt-2 leading-relaxed">{data.careerSummary}</p>
        )}
      </div>

      {/* Work history */}
      {data.jobHistory.length > 0 && (
        <SectionToggle label="Work history" count={data.jobHistory.length}>
          <div className="space-y-4">
            {data.jobHistory.map((job: CvJobHistory, i: number) => (
              <div key={i} className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-[#0A1628]">{job.title}</p>
                    <p className="text-xs text-[#0A1628]/60">{job.company}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-[#0A1628]/50">
                      {job.startDate ?? '?'} – {job.isCurrent ? 'Present' : (job.endDate ?? '?')}
                    </p>
                    {job.employmentType && job.employmentType !== 'permanent' && (
                      <span className="text-xs bg-[#E8E4DD] text-[#0A1628]/60 px-2 py-0.5 rounded-full capitalize">
                        {job.employmentType}
                      </span>
                    )}
                  </div>
                </div>
                {job.achievements.length > 0 && (
                  <ul className="space-y-0.5 pt-1">
                    {job.achievements.slice(0, 3).map((a: string, j: number) => (
                      <li key={j} className="text-xs text-[#0A1628]/70 flex gap-1.5">
                        <span className="text-[#0EA5E9] flex-shrink-0">·</span>{a}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </SectionToggle>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <SectionToggle label="Skills" count={data.skills.length}>
          <div className="flex flex-wrap gap-2">
            {data.skills.map((s: string) => (
              <Tag key={s} label={s} onRemove={() => removeSkill(s)} />
            ))}
          </div>
          <div className="pt-2">
            <input
              type="text"
              placeholder="Add a skill and press Enter…"
              className="w-full text-sm px-3 py-2 rounded-lg border border-[#1E3A5F]/20 bg-white focus:outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20 placeholder:text-[#0A1628]/30"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = (e.target as HTMLInputElement).value.trim()
                  if (val) { addSkill(val); (e.target as HTMLInputElement).value = '' }
                }
              }}
            />
          </div>
        </SectionToggle>
      )}

      {/* Qualifications */}
      {data.qualifications.length > 0 && (
        <SectionToggle label="Education" count={data.qualifications.length}>
          <div className="space-y-2">
            {data.qualifications.map((q: CvQualification, i: number) => (
              <div key={i} className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-[#0A1628]">{q.degree}</p>
                  <p className="text-xs text-[#0A1628]/60">{q.institution}</p>
                </div>
                {q.year && <span className="text-xs text-[#0A1628]/40 flex-shrink-0">{q.year}</span>}
              </div>
            ))}
          </div>
        </SectionToggle>
      )}

      {/* Certifications */}
      {data.certifications.length > 0 && (
        <SectionToggle label="Certifications" count={data.certifications.length}>
          <div className="space-y-2">
            {data.certifications.map((c, i) => (
              <div key={i} className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-[#0A1628]">{c.name}</p>
                  {c.issuer && <p className="text-xs text-[#0A1628]/60">{c.issuer}</p>}
                </div>
                {c.year && <span className="text-xs text-[#0A1628]/40 flex-shrink-0">{c.year}</span>}
              </div>
            ))}
          </div>
        </SectionToggle>
      )}

      {/* Languages */}
      {data.languages.length > 0 && (
        <SectionToggle label="Languages" count={data.languages.length}>
          <div className="flex flex-wrap gap-2">
            {data.languages.map((l: string) => <Tag key={l} label={l} />)}
          </div>
        </SectionToggle>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CvUploader({ initialData, onConfirm, onSkip }: CvUploaderProps) {
  const [state, setState] = useState<UploadState>(
    initialData ? { status: 'done', data: initialData, warnings: [] } : { status: 'idle' },
  )

  async function handleFile(file: File) {
    // ── Client-side validation ────────────────────────────────────────────────
    if (file.size === 0) {
      setState({ status: 'error', message: "We couldn't read this file. Try a different version." })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setState({ status: 'error', message: 'Please upload a CV under 5MB.' })
      return
    }
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['pdf', 'doc', 'docx'].includes(ext ?? '')) {
      setState({ status: 'error', message: 'We accept PDF and DOCX files only.' })
      return
    }

    setState({ status: 'uploading', progress: 0 })

    // Simulate upload progress while we fetch
    const progressInterval = setInterval(() => {
      setState((prev) => {
        if (prev.status !== 'uploading') { clearInterval(progressInterval); return prev }
        return { status: 'uploading', progress: Math.min(prev.progress + 15, 85) }
      })
    }, 200)

    try {
      setState({ status: 'uploading', progress: 40 })
      const form = new FormData()
      form.append('file', file)

      setState({ status: 'parsing' })
      clearInterval(progressInterval)

      const res = await fetch('/api/profile/upload-cv', { method: 'POST', body: form })
      const json = await res.json()

      if (!res.ok) {
        setState({ status: 'error', message: json.error ?? 'Upload failed. Please try again.' })
        return
      }

      setState({
        status: 'done',
        data: json.data.parsedData,
        warnings: json.data.warnings ?? [],
      })
    } catch (err) {
      clearInterval(progressInterval)
      setState({ status: 'error', message: 'Network error. Please check your connection and try again.' })
    }
  }

  return (
    <div className="space-y-4">
      {/* ── Idle ── */}
      {state.status === 'idle' && (
        <div className="space-y-3">
          <Dropzone onFile={handleFile} />
          {onSkip && (
            <button type="button" onClick={onSkip}
              className="w-full text-center text-sm text-[#0A1628]/50 hover:text-[#0A1628] transition-colors py-1">
              Skip for now — add later in Settings
            </button>
          )}
        </div>
      )}

      {/* ── Uploading ── */}
      {state.status === 'uploading' && (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="w-12 h-12 rounded-full bg-[#1E3A5F]/5 flex items-center justify-center">
            <FileText size={22} className="text-[#1E4976]" />
          </div>
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between text-xs text-[#0A1628]/50">
              <span>Uploading…</span><span>{state.progress}%</span>
            </div>
            <div className="h-1.5 bg-[#E8E4DD] rounded-full overflow-hidden">
              <div className="h-full bg-[#0EA5E9] rounded-full transition-all duration-300" style={{ width: `${state.progress}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* ── Parsing ── */}
      {state.status === 'parsing' && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <Loader2 size={28} className="text-[#0EA5E9] animate-spin" />
          <div>
            <p className="text-sm font-medium text-[#0A1628]">Analysing your CV…</p>
            <p className="text-xs text-[#0A1628]/50 mt-0.5">Claude is extracting your experience, skills, and qualifications.</p>
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {state.status === 'error' && (
        <div className="space-y-4">
          <div className="flex items-start gap-2.5 bg-[#EF4444]/5 border border-[#EF4444]/20 rounded-lg p-4">
            <AlertTriangle size={16} className="text-[#EF4444] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-[#0A1628]">Upload failed</p>
              <p className="text-sm text-[#0A1628]/70 mt-0.5">{state.message}</p>
            </div>
          </div>
          <Dropzone onFile={handleFile} compact />
          {onSkip && (
            <button type="button" onClick={onSkip} className="w-full text-center text-sm text-[#0A1628]/50 hover:text-[#0A1628] transition-colors">
              Skip for now
            </button>
          )}
        </div>
      )}

      {/* ── Done: review & confirm ── */}
      {state.status === 'done' && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#22C55E]/10 flex items-center justify-center">
                <Check size={15} className="text-[#22C55E]" />
              </div>
              <p className="text-sm font-semibold text-[#0A1628]">CV parsed successfully</p>
            </div>
            <button type="button" onClick={() => setState({ status: 'idle' })}
              className="flex items-center gap-1.5 text-xs text-[#0A1628]/50 hover:text-[#0A1628] transition-colors">
              <RefreshCw size={12} /> Re-upload
            </button>
          </div>

          {/* Review panel */}
          <ParsedDataReview
            data={state.data}
            warnings={state.warnings}
            onChange={(d) => setState({ ...state, data: d })}
          />

          {/* Confirm */}
          <div className="flex items-center gap-3 pt-2">
            {onSkip && (
              <button type="button" onClick={onSkip}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm text-[#0A1628]/50 border border-[#E8E4DD] hover:bg-[#F5F3EF] transition-colors">
                Skip for now
              </button>
            )}
            <button
              type="button"
              onClick={() => onConfirm(state.data)}
              className={cn(
                'flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold',
                'bg-[#1E3A5F] text-[#FAFAF8] transition-colors duration-200 hover:bg-[#0EA5E9]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9] focus-visible:ring-offset-2',
              )}
            >
              Confirm & save
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
