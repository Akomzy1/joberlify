'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { JobListing } from '@/types/JobListing'

// ─── Loading stages ───────────────────────────────────────────────────────────

const URL_STAGES = [
  { text: 'Fetching job listing…',                  progress: 12 },
  { text: 'Analysing requirements…',                progress: 38 },
  { text: 'Scoring fit across 10 dimensions…',      progress: 68 },
  { text: 'Generating recommendations…',            progress: 90 },
]

const PASTE_STAGES = [
  { text: 'Parsing job description…',               progress: 15 },
  { text: 'Analysing requirements…',                progress: 42 },
  { text: 'Scoring fit across 10 dimensions…',      progress: 72 },
  { text: 'Generating recommendations…',            progress: 90 },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isUrl(val: string): boolean {
  try { return ['http:', 'https:'].includes(new URL(val.trim()).protocol) }
  catch { return false }
}

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="h-[2px] w-full bg-[#E8E4DD] rounded-full overflow-hidden mt-4">
      <div
        className="h-full bg-[#0EA5E9] rounded-full transition-all duration-700 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

function StageLine({ text, visible }: { text: string; visible: boolean }) {
  return (
    <p
      className={cn(
        'text-sm text-[#0A1628]/50 text-center transition-all duration-400',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1',
      )}
      style={{ transitionDuration: '400ms' }}
    >
      {text}
    </p>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function EvaluatePage() {
  const router = useRouter()

  // Input state
  const [inputVal, setInputVal] = useState('')
  const [showTextarea, setShowTextarea] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [urlFlash, setUrlFlash] = useState(false)

  // Fallback state (URL scrape failed)
  const [fallbackMsg, setFallbackMsg] = useState<string | null>(null)

  // Loading state
  const [loading, setLoading] = useState(false)
  const [stageText, setStageText] = useState('')
  const [stageVisible, setStageVisible] = useState(false)
  const [progress, setProgress] = useState(0)

  // Error state
  const [error, setError] = useState<string | null>(null)

  // Page fade-out on navigation
  const [leaving, setLeaving] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const stageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cleanup stage timer on unmount
  useEffect(() => {
    return () => {
      if (stageTimerRef.current) clearTimeout(stageTimerRef.current)
    }
  }, [])

  // ── Stage animation ─────────────────────────────────────────────────────────

  const runStages = useCallback((
    stages: typeof URL_STAGES,
    onStageChange: (idx: number) => void,
  ) => {
    let idx = 0
    function next() {
      if (idx >= stages.length) return
      onStageChange(idx)
      idx++
      stageTimerRef.current = setTimeout(next, 2_800)
    }
    next()
  }, [])

  const showStage = useCallback((stages: typeof URL_STAGES, idx: number) => {
    setStageVisible(false)
    setTimeout(() => {
      setStageText(stages[idx].text)
      setProgress(stages[idx].progress)
      setStageVisible(true)
    }, 200)
  }, [])

  // ── URL paste flash ─────────────────────────────────────────────────────────

  function handleUrlPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text')
    if (isUrl(pasted)) {
      setUrlFlash(true)
      setTimeout(() => setUrlFlash(false), 220)
    }
  }

  // ── Expand textarea ─────────────────────────────────────────────────────────

  function handleToggleTextarea() {
    setShowTextarea((v) => {
      if (!v) setTimeout(() => textareaRef.current?.focus(), 50)
      return !v
    })
    setFallbackMsg(null)
  }

  // ── Submit ───────────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (loading) return

    const urlMode = isUrl(inputVal)
    const textMode = pasteText.trim().length >= 50
    if (!urlMode && !textMode) return

    setLoading(true)
    setError(null)
    setFallbackMsg(null)
    setProgress(0)
    setStageVisible(false)

    const stages = urlMode ? URL_STAGES : PASTE_STAGES
    runStages(stages, (idx) => showStage(stages, idx))

    try {
      let listing: JobListing

      // ── Step 1: extract job data ──────────────────────────────────────────
      if (urlMode) {
        const scrapeRes = await fetch('/api/scrape-job', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: inputVal.trim() }),
        })

        if (!scrapeRes.ok) {
          const json = await scrapeRes.json()
          if (scrapeRes.status === 422 && json.fallbackRequired) {
            // Graceful: expand textarea with amber message
            if (stageTimerRef.current) clearTimeout(stageTimerRef.current)
            setLoading(false)
            setStageVisible(false)
            setProgress(0)
            setFallbackMsg("We couldn't access that URL. Paste the job description below instead.")
            setShowTextarea(true)
            setTimeout(() => textareaRef.current?.focus(), 100)
            return
          }
          throw new Error(json.error ?? 'Failed to fetch job listing')
        }

        const scrapeJson = await scrapeRes.json()
        listing = scrapeJson.data
      } else {
        const parseRes = await fetch('/api/parse-jd', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: pasteText.trim() }),
        })
        if (!parseRes.ok) {
          const json = await parseRes.json()
          throw new Error(json.error ?? 'Failed to parse job description')
        }
        const parseJson = await parseRes.json()
        listing = parseJson.data
      }

      // ── Step 2: evaluate ──────────────────────────────────────────────────
      const evalRes = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: listing.jobTitle,
          company: listing.companyName,
          jobDescription: listing.description,
          location: listing.location ?? undefined,
          salary: listing.salaryText ?? undefined,
          jobUrl: listing.jobUrl ?? (urlMode ? inputVal.trim() : undefined),
        }),
      })

      const evalJson = await evalRes.json()
      if (!evalRes.ok) throw new Error(evalJson.error ?? 'Evaluation failed')

      // ── Step 3: navigate ──────────────────────────────────────────────────
      if (stageTimerRef.current) clearTimeout(stageTimerRef.current)
      setProgress(100)
      setStageVisible(false)
      await delay(350)

      const evalId = evalJson.data?.id
      setLeaving(true)
      await delay(300)
      router.push(evalId ? `/evaluations/${evalId}` : '/evaluations')
    } catch (err) {
      if (stageTimerRef.current) clearTimeout(stageTimerRef.current)
      setLoading(false)
      setStageVisible(false)
      setProgress(0)
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
  }, [loading, inputVal, pasteText, runStages, showStage, router])

  // ── Derived ──────────────────────────────────────────────────────────────────

  const urlMode = isUrl(inputVal)
  const textMode = pasteText.trim().length >= 50
  const canSubmit = (urlMode || textMode) && !loading

  const inputBorderCls = urlFlash
    ? 'border-[#0EA5E9]'
    : 'border-[#1E3A5F] focus-within:border-[#0EA5E9]'

  return (
    <div
      className={cn(
        'min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center px-4 py-20 transition-opacity duration-300',
        leaving ? 'opacity-0' : 'opacity-100',
      )}
    >
      <div className="w-full max-w-[640px]">

        {/* ── Header ── */}
        <div className="text-center mb-10">
          <h1
            className="text-[2.441rem] font-bold text-[#0A1628] leading-[1.1] tracking-tight mb-3"
            style={{ fontFamily: 'Satoshi, DM Sans, sans-serif' }}
          >
            Evaluate a job
          </h1>
          <p className="text-base text-[#0A1628]/50 leading-relaxed">
            Paste a URL or job description and we&rsquo;ll score the fit
          </p>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} noValidate className="space-y-3">

          {/* URL input */}
          <div
            className={cn(
              'flex items-center rounded-[12px] border-2 bg-white transition-colors duration-200 overflow-hidden',
              inputBorderCls,
            )}
          >
            <input
              type="url"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onPaste={handleUrlPaste}
              placeholder="https://…"
              disabled={loading}
              className="flex-1 h-[56px] px-5 text-[20px] text-[#0A1628] placeholder:text-[#0A1628]/25 bg-transparent focus:outline-none disabled:opacity-40"
              aria-label="Job posting URL"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          {/* Paste toggle */}
          <div className="flex items-center gap-3 px-1">
            <div className="flex-1 h-px bg-[#E8E4DD]" />
            <button
              type="button"
              onClick={handleToggleTextarea}
              disabled={loading}
              className="text-sm text-[#0EA5E9] hover:text-[#0A1628] transition-colors duration-150 flex-shrink-0 disabled:opacity-40"
            >
              {showTextarea ? 'Hide description' : 'Or paste the job description'}
            </button>
            <div className="flex-1 h-px bg-[#E8E4DD]" />
          </div>

          {/* Fallback amber message */}
          {fallbackMsg && (
            <div className="flex items-start gap-2.5 rounded-xl border border-[#F59E0B]/25 bg-[#F59E0B]/8 px-4 py-3">
              <AlertCircle size={15} className="text-[#F59E0B] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[#92400E]">{fallbackMsg}</p>
            </div>
          )}

          {/* Expandable textarea */}
          <div
            className={cn(
              'overflow-hidden transition-all duration-300 ease-in-out',
              showTextarea ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0',
            )}
          >
            <textarea
              ref={textareaRef}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste the full job description — responsibilities, requirements, company overview…"
              rows={8}
              disabled={loading}
              className={cn(
                'w-full rounded-[12px] border-2 border-[#1E3A5F] bg-white px-5 py-4 text-base text-[#0A1628] placeholder:text-[#0A1628]/25',
                'focus:outline-none focus:border-[#0EA5E9] resize-y min-h-[200px] transition-colors duration-200',
                'disabled:opacity-40',
              )}
              aria-label="Job description text"
            />
            {pasteText.length > 0 && (
              <p className="text-xs text-[#0A1628]/35 text-right mt-1 px-1">
                {pasteText.length < 50
                  ? `${50 - pasteText.length} more characters needed`
                  : `${pasteText.length.toLocaleString()} characters`}
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-[#EF4444]/20 bg-[#EF4444]/5 px-4 py-3">
              <AlertCircle size={15} className="text-[#EF4444] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[#EF4444]">{error}</p>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={!canSubmit}
            className={cn(
              'w-full h-[56px] rounded-[12px] text-[18px] font-bold tracking-tight transition-all duration-200',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9] focus-visible:ring-offset-2',
              canSubmit
                ? 'bg-[#0A1628] text-[#FAFAF8] hover:bg-[#2563A0] cursor-pointer'
                : 'bg-[#E8E4DD] text-[#0A1628]/30 cursor-not-allowed',
            )}
            style={{ fontFamily: 'Satoshi, DM Sans, sans-serif' }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2.5">
                <LoadingDots />
                Evaluating
              </span>
            ) : (
              'Evaluate'
            )}
          </button>

          {/* Progress stages */}
          {loading && (
            <div className="pt-1 space-y-2">
              <ProgressBar progress={progress} />
              <StageLine text={stageText} visible={stageVisible} />
            </div>
          )}
        </form>

        {/* ── Footer note ── */}
        {!loading && (
          <p className="text-center text-xs text-[#0A1628]/30 mt-10">
            Scored across 10 dimensions against your profile — not a generic ranking
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Loading dots ─────────────────────────────────────────────────────────────

function LoadingDots() {
  return (
    <span className="flex items-center gap-[3px]">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-[#FAFAF8]/70 animate-bounce"
          style={{ animationDelay: `${i * 120}ms`, animationDuration: '900ms' }}
        />
      ))}
    </span>
  )
}
