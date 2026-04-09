'use client'

import { cn } from '@/lib/utils/cn'

interface EvaluationSummaryProps {
  summary: string
  className?: string
}

/**
 * Renders the AI evaluation summary with:
 * - First sentence bold (pull-quote for most important insight)
 * - Remaining sentences at 1.7 line-height in DM Sans
 */
export function EvaluationSummary({ summary, className }: EvaluationSummaryProps) {
  if (!summary) return null

  // Split on first sentence boundary (period/exclamation/question followed by space or end)
  const firstBreak = summary.search(/[.!?](\s|$)/)
  let firstSentence: string
  let rest: string

  if (firstBreak === -1) {
    firstSentence = summary
    rest = ''
  } else {
    firstSentence = summary.slice(0, firstBreak + 1).trim()
    rest = summary.slice(firstBreak + 1).trim()
  }

  // Find a "pull quote" — the most opinionated sentence in `rest`
  // Heuristic: first sentence that contains a keyword suggesting a strong opinion
  const OPINION_SIGNALS = /\b(strongest|weakest|critical|key|main|primary|biggest|most|least|significantly|notably|importantly|however|although|despite|unless)\b/i
  let pullQuote = ''
  let bodyText = rest

  if (rest) {
    const sentences = rest.match(/[^.!?]+[.!?]+/g) ?? []
    const pullIdx = sentences.findIndex((s) => OPINION_SIGNALS.test(s))
    if (pullIdx !== -1 && pullIdx < sentences.length - 1) {
      pullQuote = sentences[pullIdx].trim()
      bodyText = [
        ...sentences.slice(0, pullIdx),
        ...sentences.slice(pullIdx + 1),
      ]
        .join(' ')
        .trim()
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Bold first sentence */}
      <p className="text-base font-semibold text-[#0A1628] leading-relaxed">
        {firstSentence}
      </p>

      {/* Pull quote — only if found */}
      {pullQuote && (
        <blockquote
          className="pl-4 py-3 pr-4 rounded-r-lg"
          style={{
            borderLeft: '4px solid #0EA5E9',
            background: '#F0F9FF',
          }}
        >
          <p className="text-base text-[#0A1628] leading-[1.7] italic">
            {pullQuote}
          </p>
        </blockquote>
      )}

      {/* Remaining body */}
      {bodyText && (
        <p
          className="text-sm text-[#0A1628]/70 leading-[1.7]"
        >
          {bodyText}
        </p>
      )}
    </div>
  )
}
