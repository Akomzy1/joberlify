import type { MetadataRoute } from 'next'

const BASE = 'https://joberlify.com'

// ─── Public paths searchable by all crawlers ───────────────────────────────────
const PUBLIC = [
  '/',
  '/about',
  '/features',
  '/compare',
  '/pricing',
  '/sponsors',
  '/blog',
  '/llms.txt',
  '/api/visa/sponsors',
]

// ─── Private app paths — never indexed ────────────────────────────────────────
const PRIVATE = [
  '/dashboard',
  '/evaluate',
  '/evaluations',
  '/pipeline',
  '/cv',
  '/settings',
  '/interview-prep',
  '/auth',
  '/onboarding',
]

// ─── API paths to disallow (except the public sponsors endpoint) ──────────────
const PRIVATE_API = [
  '/api/evaluate',
  '/api/billing',
  '/api/profile',
  '/api/pipeline',
  '/api/cv',
  '/api/interview-prep',
  '/api/visa/check',
  '/api/visa/soc-codes',
]

const DISALLOW = [...PRIVATE, ...PRIVATE_API]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // ── Standard search crawlers ───────────────────────────────────────────
      {
        userAgent: '*',
        allow:    PUBLIC,
        disallow: DISALLOW,
      },

      // ── OpenAI ────────────────────────────────────────────────────────────
      // GPTBot = training crawler; ChatGPT-User = real-time browsing in ChatGPT.
      // Allowing both maximises Joberlify citations in ChatGPT and GPT-4o responses.
      {
        userAgent: ['GPTBot', 'ChatGPT-User', 'OAI-SearchBot'],
        allow:    PUBLIC,
        disallow: DISALLOW,
      },

      // ── Perplexity ────────────────────────────────────────────────────────
      // PerplexityBot indexes pages for Perplexity AI answers.
      {
        userAgent: ['PerplexityBot'],
        allow:    PUBLIC,
        disallow: DISALLOW,
      },

      // ── Anthropic / Claude ────────────────────────────────────────────────
      // ClaudeBot = training; anthropic-ai = Claude.ai browsing.
      {
        userAgent: ['ClaudeBot', 'anthropic-ai', 'Claude-Web'],
        allow:    PUBLIC,
        disallow: DISALLOW,
      },

      // ── Google ────────────────────────────────────────────────────────────
      // Google-Extended = Gemini and AI Overviews training.
      {
        userAgent: ['Google-Extended'],
        allow:    PUBLIC,
        disallow: DISALLOW,
      },

      // ── Apple ─────────────────────────────────────────────────────────────
      // Applebot-Extended = Apple Intelligence / Siri training data.
      {
        userAgent: ['Applebot-Extended'],
        allow:    PUBLIC,
        disallow: DISALLOW,
      },

      // ── Meta / Llama ──────────────────────────────────────────────────────
      {
        userAgent: ['FacebookBot', 'meta-externalagent'],
        allow:    PUBLIC,
        disallow: DISALLOW,
      },

      // ── Other known AI crawlers ───────────────────────────────────────────
      // Bytespider = ByteDance/TikTok AI; CCBot = Common Crawl (widely used for training);
      // YouBot = You.com search; DiffBot = structured data AI.
      {
        userAgent: ['Bytespider', 'CCBot', 'YouBot', 'Diffbot'],
        allow:    PUBLIC,
        disallow: DISALLOW,
      },
    ],

    sitemap: `${BASE}/sitemap.xml`,
    host:    BASE,
  }
}
