/**
 * scripts/seed-soc-codes.ts
 *
 * Reads data/uk-soc-codes.json and upserts all records into the uk_soc_codes table.
 * Run with: npm run seed:soc-codes
 *
 * Requires env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Reads from .env.local automatically if present.
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// ─── Load .env.local ──────────────────────────────────────────────────────────

try {
  const envPath = resolve(process.cwd(), '.env.local')
  const envFile = readFileSync(envPath, 'utf-8')
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
    if (key && !process.env[key]) process.env[key] = val
  }
} catch {
  // .env.local not present — rely on shell environment
}

// ─── Validate env vars ────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    '❌  Missing required env vars:\n' +
    '   NEXT_PUBLIC_SUPABASE_URL\n' +
    '   SUPABASE_SERVICE_ROLE_KEY\n\n' +
    '   Add them to .env.local or export them before running.',
  )
  process.exit(1)
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface SocCodeEntry {
  soc_code: string
  occupation_title: string
  example_job_titles: string[]
  rqf_level: number
  eligibility_table: 'table1' | 'table2' | 'table3' | 'table6'
  is_eligible: boolean
  going_rate_annual: number
  going_rate_new_entrant: number | null
  on_immigration_salary_list: boolean
  on_temporary_shortage_list: boolean
  tsl_expiry_date: string | null
  conditions: string | null
  last_verified_at: string // YYYY-MM-DD
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const supabase = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  })

  // Load JSON data
  const dataPath = resolve(process.cwd(), 'data/uk-soc-codes.json')
  let entries: SocCodeEntry[]
  try {
    entries = JSON.parse(readFileSync(dataPath, 'utf-8'))
  } catch (err) {
    console.error(`❌  Failed to read ${dataPath}:`, err)
    process.exit(1)
  }

  console.log(`\n🌱  Seeding ${entries.length} SOC codes into uk_soc_codes…\n`)

  let inserted = 0
  let updated = 0
  let errors = 0

  for (const entry of entries) {
    // Validate required fields
    if (!entry.soc_code || !entry.occupation_title || typeof entry.rqf_level !== 'number') {
      console.error(`  ⚠️  Skipping invalid entry:`, entry.soc_code ?? '(no soc_code)')
      errors++
      continue
    }

    // Check if already exists to distinguish insert vs update in the log
    const { data: existing } = await supabase
      .from('uk_soc_codes')
      .select('soc_code')
      .eq('soc_code', entry.soc_code)
      .single()

    const { error } = await supabase.from('uk_soc_codes').upsert(
      {
        soc_code: entry.soc_code,
        occupation_title: entry.occupation_title,
        example_job_titles: entry.example_job_titles ?? [],
        rqf_level: entry.rqf_level,
        eligibility_table: entry.eligibility_table,
        is_eligible: entry.is_eligible,
        going_rate_annual: entry.going_rate_annual,
        going_rate_new_entrant: entry.going_rate_new_entrant ?? null,
        on_immigration_salary_list: entry.on_immigration_salary_list,
        on_temporary_shortage_list: entry.on_temporary_shortage_list,
        tsl_expiry_date: entry.tsl_expiry_date ?? null,
        conditions: entry.conditions ?? null,
        last_verified_at: entry.last_verified_at,
      },
      { onConflict: 'soc_code' },
    )

    if (error) {
      console.error(`  ❌  ${entry.soc_code} (${entry.occupation_title}): ${error.message}`)
      errors++
    } else if (existing) {
      console.log(`  ↻   ${entry.soc_code}  ${entry.occupation_title}`)
      updated++
    } else {
      console.log(`  +   ${entry.soc_code}  ${entry.occupation_title}`)
      inserted++
    }
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅  Done.  Inserted: ${inserted}  Updated: ${updated}  Errors: ${errors}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`)

  if (errors > 0) process.exit(1)
}

main().catch((err) => {
  console.error('❌  Unhandled error:', err)
  process.exit(1)
})
