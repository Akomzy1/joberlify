'use client'

import { useEffect, useState, useTransition } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Download,
  RefreshCw,
  FileText,
  Globe,
  Briefcase,
  ChevronDown,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { CvTargetFormat, GeneratedCvData } from '@/lib/claude/prompts/generate-cv'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CvRecord {
  id: string
  evaluationId: string
  format: CvTargetFormat
  cvData: GeneratedCvData
  htmlContent: string
  pdfUrl: string | null
  tailoringNotes: string
  createdAt: string
}

// ─── Format config ────────────────────────────────────────────────────────────

const FORMAT_CONFIG: Record<CvTargetFormat, { label: string; icon: typeof FileText; desc: string }> = {
  uk:      { label: 'UK Standard', icon: FileText, desc: 'No photo, chronological, 2-page max' },
  us:      { label: 'US Resume',   icon: Briefcase, desc: 'Achievements-first, accomplishments-heavy' },
  generic: { label: 'International', icon: Globe, desc: 'Universal format for any country' },
}

const FORMATS: CvTargetFormat[] = ['uk', 'us', 'generic']

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CvPreviewPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [cv, setCv] = useState<CvRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedFormat, setSelectedFormat] = useState<CvTargetFormat>('uk')
  const [emphasis, setEmphasis] = useState('')
  const [showEmphasis, setShowEmphasis] = useState(false)
  const [regenerating, startRegenerate] = useTransition()
  const [downloading, setDownloading] = useState(false)

  // ── Load CV record ──
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/cv/${id}`)
        if (res.status === 401) { router.replace('/login'); return }
        if (!res.ok) throw new Error('Not found')
        const json = await res.json()
        const data = json.data
        setCv(data)
        setSelectedFormat(data.format)
      } catch {
        setError('Could not load this CV. It may have been deleted.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, router])

  // ── Regenerate ──
  function handleRegenerate() {
    if (!cv) return
    startRegenerate(async () => {
      try {
        const res = await fetch('/api/cv/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            evaluationId: cv.evaluationId,
            format:       selectedFormat,
            emphasis:     emphasis || undefined,
          }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? 'Regeneration failed')

        // Navigate to the new CV
        router.push(`/cv/${json.data.id}`)
      } catch (err: any) {
        setError(err.message ?? 'Regeneration failed. Please try again.')
      }
    })
  }

  // ── Download ──
  async function handleDownload() {
    if (!cv) return
    setDownloading(true)
    try {
      if (cv.pdfUrl) {
        window.open(cv.pdfUrl, '_blank')
      } else {
        // Trigger on-demand generation
        window.location.href = `/api/cv/${cv.id}/download`
      }
    } finally {
      setDownloading(false)
    }
  }

  // ── Render ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <p className="text-sm text-[#0A1628]/40">Loading CV…</p>
      </div>
    )
  }

  if (error || !cv) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center gap-4">
        <AlertCircle size={32} className="text-[#EF4444]/60" />
        <p className="text-sm text-[#0A1628]/60">{error ?? 'CV not found.'}</p>
        <Link href="/evaluations" className="text-sm text-[#0EA5E9] hover:underline">
          Back to evaluations
        </Link>
      </div>
    )
  }

  const formatCfg = FORMAT_CONFIG[cv.format]

  return (
    <div className="min-h-screen bg-[#FAFAF8]">

      {/* ── Toolbar ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-[#E8E4DD] shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3 flex-wrap">

          {/* Back */}
          <Link
            href={`/evaluations/${cv.evaluationId}`}
            className="flex items-center gap-1.5 text-sm text-[#0A1628]/45 hover:text-[#0A1628] transition-colors"
          >
            <ArrowLeft size={14} />
            Back to evaluation
          </Link>

          <div className="flex-1" />

          {/* Format selector */}
          <div className="flex items-center gap-1 bg-[#FAFAF8] rounded-lg border border-[#E8E4DD] p-1">
            {FORMATS.map((fmt) => {
              const cfg = FORMAT_CONFIG[fmt]
              const FmtIcon = cfg.icon
              return (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setSelectedFormat(fmt)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                    selectedFormat === fmt
                      ? 'bg-white text-[#0A1628] shadow-sm border border-[#E8E4DD]'
                      : 'text-[#0A1628]/40 hover:text-[#0A1628]/70',
                  )}
                  title={cfg.desc}
                >
                  <FmtIcon size={12} />
                  {cfg.label}
                </button>
              )
            })}
          </div>

          {/* Regenerate */}
          <button
            type="button"
            onClick={() => setShowEmphasis((v) => !v)}
            className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[#E8E4DD] bg-white text-xs font-medium text-[#0A1628]/55 hover:text-[#0A1628] hover:border-[#0EA5E9]/30 transition-colors"
          >
            <RefreshCw size={13} />
            Regenerate
            <ChevronDown
              size={12}
              style={{ transform: showEmphasis ? 'rotate(180deg)' : undefined, transition: 'transform 150ms' }}
            />
          </button>

          {/* Download */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#0A1628] text-white text-xs font-semibold hover:bg-[#0EA5E9] transition-colors disabled:opacity-50"
          >
            <Download size={13} />
            {downloading ? 'Preparing…' : 'Download PDF'}
          </button>
        </div>

        {/* Regenerate panel */}
        {showEmphasis && (
          <div className="border-t border-[#E8E4DD] bg-[#FAFAF8] px-4 sm:px-6 py-3">
            <div className="max-w-5xl mx-auto flex items-center gap-3">
              <input
                type="text"
                placeholder='Optional: "Emphasise leadership", "Highlight Python skills", "Focus on startup experience"'
                value={emphasis}
                onChange={(e) => setEmphasis(e.target.value)}
                className="flex-1 h-9 px-3 rounded-lg border border-[#E8E4DD] bg-white text-sm text-[#0A1628] placeholder:text-[#0A1628]/35 focus:outline-none focus:border-[#0EA5E9] transition-colors"
              />
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={regenerating}
                className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#0A1628] text-white text-xs font-semibold hover:bg-[#0EA5E9] transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {regenerating ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" />
                    Regenerating…
                  </>
                ) : (
                  <>
                    <RefreshCw size={12} />
                    {selectedFormat !== cv.format ? `Switch to ${FORMAT_CONFIG[selectedFormat].label}` : 'Regenerate CV'}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-4">
          <div className="rounded-xl border border-[#EF4444]/20 bg-[#EF4444]/5 px-4 py-3 text-sm text-[#EF4444] flex items-center gap-2">
            <AlertCircle size={14} />
            {error}
          </div>
        </div>
      )}

      {/* ── Tailoring notes ── */}
      {cv.tailoringNotes && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-5">
          <div
            className="rounded-xl px-4 py-3 text-xs text-[#0A1628]/60 leading-relaxed"
            style={{ background: '#F0F9FF', borderLeft: '3px solid #0EA5E9' }}
          >
            <span className="font-semibold text-[#0EA5E9]">Tailoring notes: </span>
            {cv.tailoringNotes}
          </div>
        </div>
      )}

      {/* ── CV preview — sandboxed iframe ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-24">
        <div className="rounded-2xl border border-[#E8E4DD] overflow-hidden shadow-sm bg-white">
          {/* Format badge */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#E8E4DD] bg-[#FAFAF8]">
            <div className="flex items-center gap-2">
              {(() => { const Ic = formatCfg.icon; return <Ic size={14} className="text-[#0A1628]/40" /> })()}
              <span className="text-xs font-semibold text-[#0A1628]/50">{formatCfg.label}</span>
              <span className="text-xs text-[#0A1628]/30">·</span>
              <span className="text-xs text-[#0A1628]/30">{formatCfg.desc}</span>
            </div>
            <span className="text-xs text-[#0A1628]/30">
              {new Date(cv.createdAt).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </span>
          </div>

          {/* Iframe preview — safe isolation from app styles */}
          <iframe
            srcDoc={cv.htmlContent}
            title="CV Preview"
            className="w-full border-0"
            style={{ height: '1000px', minHeight: '800px' }}
            sandbox="allow-same-origin"
          />
        </div>
      </div>

      {/* ── Sticky mobile download bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-20 sm:hidden border-t border-[#E8E4DD] bg-white/95 backdrop-blur-sm px-4 py-3 flex gap-2">
        <button
          type="button"
          onClick={() => setShowEmphasis((v) => !v)}
          className="flex-1 text-center rounded-lg border border-[#E8E4DD] px-4 py-2.5 text-sm font-medium text-[#0A1628]/60"
        >
          Regenerate
        </button>
        <button
          type="button"
          onClick={handleDownload}
          className="flex-1 text-center rounded-lg bg-[#0A1628] text-white px-4 py-2.5 text-sm font-semibold hover:bg-[#0EA5E9] transition-colors flex items-center justify-center gap-1.5"
        >
          <Download size={14} />
          Download PDF
        </button>
      </div>
    </div>
  )
}
