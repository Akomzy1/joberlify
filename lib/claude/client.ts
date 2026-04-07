import Anthropic from '@anthropic-ai/sdk'

// Sonnet for evaluations + CV generation; Haiku for parsing + classification
export const CLAUDE_MODELS = {
  sonnet: 'claude-sonnet-4-6',
  haiku: 'claude-haiku-4-5-20251001',
} as const

export type ClaudeModel = (typeof CLAUDE_MODELS)[keyof typeof CLAUDE_MODELS]

// Timeouts per operation type
export const CLAUDE_TIMEOUTS = {
  evaluation: 30_000, // 30s — 10-dimension scoring
  cvGeneration: 30_000,
  parsing: 15_000,   // 15s — CV parsing, JD extraction
  classification: 15_000,
} as const

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export default anthropic
