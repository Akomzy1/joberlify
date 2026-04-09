#!/usr/bin/env node
/**
 * scripts/health-check.ts
 *
 * Verifies all external service connections are healthy before and after deployment.
 *
 * Usage:
 *   npx tsx scripts/health-check.ts
 *
 * The script loads .env.local automatically. Set NODE_ENV=production and export
 * real env vars when running against the production environment.
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import Stripe from 'stripe'

// ─── Load .env.local ──────────────────────────────────────────────────────────

function loadEnvFile(path: string) {
  try {
    const content = readFileSync(resolve(process.cwd(), path), 'utf-8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
      if (key && !(key in process.env)) {
        process.env[key] = val
      }
    }
  } catch {
    // File not found — rely on already-exported env vars
  }
}

loadEnvFile('.env.local')
loadEnvFile('.env')

// ─── Types ────────────────────────────────────────────────────────────────────

interface CheckResult {
  name: string
  ok: boolean
  detail: string
  durationMs?: number
}

// ─── Individual checks ────────────────────────────────────────────────────────

async function checkSupabaseConnection(): Promise<CheckResult> {
  const start = Date.now()
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    return { name: 'Supabase', ok: false, detail: 'NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set' }
  }

  try {
    const supabase = createSupabaseClient(url, key)
    // Simple ping — list 1 row from a table that always exists
    const { error } = await supabase.from('users').select('id').limit(1)
    if (error) throw error
    return { name: 'Supabase', ok: true, detail: 'Connection healthy', durationMs: Date.now() - start }
  } catch (err) {
    return { name: 'Supabase', ok: false, detail: `Error: ${err instanceof Error ? err.message : String(err)}` }
  }
}

async function checkSponsorData(): Promise<CheckResult> {
  const start = Date.now()
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    return { name: 'uk_sponsors table', ok: false, detail: 'Supabase credentials not set' }
  }

  try {
    const supabase = createSupabaseClient(url, key)
    const { count, error } = await supabase
      .from('uk_sponsors')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)

    if (error) throw error

    const rowCount = count ?? 0
    if (rowCount < 100_000) {
      return {
        name: 'uk_sponsors table',
        ok: false,
        detail: `Only ${rowCount.toLocaleString()} active rows — expected 100,000+. Run the sponsor ingestion script.`,
      }
    }

    return {
      name: 'uk_sponsors table',
      ok: true,
      detail: `${rowCount.toLocaleString()} active sponsors`,
      durationMs: Date.now() - start,
    }
  } catch (err) {
    return { name: 'uk_sponsors table', ok: false, detail: `Error: ${err instanceof Error ? err.message : String(err)}` }
  }
}

async function checkSocCodes(): Promise<CheckResult> {
  const start = Date.now()
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    return { name: 'uk_soc_codes table', ok: false, detail: 'Supabase credentials not set' }
  }

  try {
    const supabase = createSupabaseClient(url, key)
    const { count, error } = await supabase
      .from('uk_soc_codes')
      .select('id', { count: 'exact', head: true })

    if (error) throw error

    const rowCount = count ?? 0
    if (rowCount < 100) {
      return {
        name: 'uk_soc_codes table',
        ok: false,
        detail: `Only ${rowCount} rows — expected hundreds. Run: npm run seed:soc-codes`,
      }
    }

    return {
      name: 'uk_soc_codes table',
      ok: true,
      detail: `${rowCount} SOC codes loaded`,
      durationMs: Date.now() - start,
    }
  } catch (err) {
    return { name: 'uk_soc_codes table', ok: false, detail: `Error: ${err instanceof Error ? err.message : String(err)}` }
  }
}

async function checkClaudeApi(): Promise<CheckResult> {
  const start = Date.now()
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    return { name: 'Claude API', ok: false, detail: 'ANTHROPIC_API_KEY not set' }
  }
  if (!apiKey.startsWith('sk-ant-')) {
    return { name: 'Claude API', ok: false, detail: 'ANTHROPIC_API_KEY appears invalid (should start with sk-ant-)' }
  }

  try {
    const client = new Anthropic({ apiKey })
    // Minimal ping — 1 token response
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 5,
      messages: [{ role: 'user', content: 'Say "ok"' }],
    })
    if (msg.content[0]?.type !== 'text') throw new Error('Unexpected response type')
    return { name: 'Claude API', ok: true, detail: 'API key valid, model responding', durationMs: Date.now() - start }
  } catch (err) {
    return { name: 'Claude API', ok: false, detail: `Error: ${err instanceof Error ? err.message : String(err)}` }
  }
}

async function checkStripeConnection(): Promise<CheckResult> {
  const start = Date.now()
  const secretKey = process.env.STRIPE_SECRET_KEY

  if (!secretKey) {
    return { name: 'Stripe', ok: false, detail: 'STRIPE_SECRET_KEY not set' }
  }

  const isLiveKey = secretKey.startsWith('sk_live_')
  const isTestKey = secretKey.startsWith('sk_test_')

  if (!isLiveKey && !isTestKey) {
    return { name: 'Stripe', ok: false, detail: 'STRIPE_SECRET_KEY appears invalid' }
  }

  try {
    const stripe = new Stripe(secretKey)
    // Lightweight read — fetch account details
    const account = await stripe.accounts.retrieve()
    const mode = isLiveKey ? 'LIVE' : 'TEST'
    return {
      name: 'Stripe',
      ok: true,
      detail: `${mode} mode · account: ${account.id}`,
      durationMs: Date.now() - start,
    }
  } catch (err) {
    return { name: 'Stripe', ok: false, detail: `Error: ${err instanceof Error ? err.message : String(err)}` }
  }
}

async function checkStripePrices(): Promise<CheckResult> {
  const secretKey = process.env.STRIPE_SECRET_KEY
  const proPriceId    = process.env.STRIPE_PRO_PRICE_ID
  const globalPriceId = process.env.STRIPE_GLOBAL_PRICE_ID

  if (!secretKey) {
    return { name: 'Stripe prices', ok: false, detail: 'STRIPE_SECRET_KEY not set' }
  }

  const missing: string[] = []
  if (!proPriceId)    missing.push('STRIPE_PRO_PRICE_ID')
  if (!globalPriceId) missing.push('STRIPE_GLOBAL_PRICE_ID')

  if (missing.length > 0) {
    return { name: 'Stripe prices', ok: false, detail: `Missing env vars: ${missing.join(', ')}` }
  }

  try {
    const stripe = new Stripe(secretKey)
    const [pro, global] = await Promise.all([
      stripe.prices.retrieve(proPriceId!),
      stripe.prices.retrieve(globalPriceId!),
    ])

    const issues: string[] = []
    if (!pro.active)    issues.push(`Pro price ${proPriceId} is inactive`)
    if (!global.active) issues.push(`Global price ${globalPriceId} is inactive`)

    if (issues.length > 0) {
      return { name: 'Stripe prices', ok: false, detail: issues.join('; ') }
    }

    return {
      name: 'Stripe prices',
      ok: true,
      detail: `Pro (${pro.unit_amount ? pro.unit_amount / 100 : '?'}/mo), Global (${global.unit_amount ? global.unit_amount / 100 : '?'}/mo) — both active`,
    }
  } catch (err) {
    return { name: 'Stripe prices', ok: false, detail: `Error: ${err instanceof Error ? err.message : String(err)}` }
  }
}

function checkRequiredEnvVars(): CheckResult {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'ANTHROPIC_API_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_PRO_PRICE_ID',
    'STRIPE_GLOBAL_PRICE_ID',
    'NEXT_PUBLIC_APP_URL',
    'RESEND_API_KEY',
  ]

  const missing = required.filter((k) => !process.env[k])

  if (missing.length > 0) {
    return {
      name: 'Environment variables',
      ok: false,
      detail: `Missing: ${missing.join(', ')}`,
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const isLocalhost = appUrl.includes('localhost')
  const stripeIsLive = (process.env.STRIPE_SECRET_KEY ?? '').startsWith('sk_live_')

  if (isLocalhost && stripeIsLive) {
    return {
      name: 'Environment variables',
      ok: false,
      detail: 'NEXT_PUBLIC_APP_URL is localhost but STRIPE_SECRET_KEY is a live key — mismatch!',
    }
  }

  return {
    name: 'Environment variables',
    ok: true,
    detail: `All ${required.length} required vars set · APP_URL: ${appUrl}`,
  }
}

// ─── Runner ───────────────────────────────────────────────────────────────────

const GREEN  = '\x1b[32m'
const RED    = '\x1b[31m'
const YELLOW = '\x1b[33m'
const RESET  = '\x1b[0m'
const BOLD   = '\x1b[1m'
const DIM    = '\x1b[2m'

function printResult(result: CheckResult) {
  const icon    = result.ok ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`
  const label   = result.ok ? `${GREEN}PASS${RESET}` : `${RED}FAIL${RESET}`
  const timing  = result.durationMs !== undefined ? `${DIM} (${result.durationMs}ms)${RESET}` : ''
  console.log(`  ${icon} ${BOLD}${result.name}${RESET} · ${label}${timing}`)
  console.log(`     ${DIM}${result.detail}${RESET}`)
}

async function main() {
  console.log(`\n${BOLD}Joberlify Health Check${RESET}`)
  console.log(`${'─'.repeat(50)}`)
  console.log(`${DIM}Environment: ${process.env.NODE_ENV ?? 'development'}${RESET}\n`)

  // Run checks — Supabase checks share connection, so run some in parallel
  const envCheck = checkRequiredEnvVars()
  printResult(envCheck)

  console.log()

  const [supabase, claude, stripe, stripePrices] = await Promise.all([
    checkSupabaseConnection(),
    checkClaudeApi(),
    checkStripeConnection(),
    checkStripePrices(),
  ])

  printResult(supabase)
  printResult(claude)
  printResult(stripe)
  printResult(stripePrices)

  // Data checks depend on Supabase being up
  if (supabase.ok) {
    console.log()
    const [sponsors, socCodes] = await Promise.all([
      checkSponsorData(),
      checkSocCodes(),
    ])
    printResult(sponsors)
    printResult(socCodes)
  }

  console.log(`\n${'─'.repeat(50)}`)

  const allResults = [envCheck, supabase, claude, stripe, stripePrices]
  const failures = allResults.filter((r) => !r.ok)

  if (failures.length === 0) {
    console.log(`${GREEN}${BOLD}✓ All systems healthy — ready to deploy.${RESET}\n`)
    process.exit(0)
  } else {
    console.log(`${RED}${BOLD}✗ ${failures.length} check(s) failed — do not deploy until resolved.${RESET}`)
    console.log(`${YELLOW}  Failed: ${failures.map((f) => f.name).join(', ')}${RESET}\n`)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(`${RED}Unexpected error:${RESET}`, err)
  process.exit(1)
})
