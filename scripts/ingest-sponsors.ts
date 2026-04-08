/**
 * scripts/ingest-sponsors.ts
 *
 * Fetches the UK Home Office Register of Licensed Sponsors CSV and upserts
 * all records into the uk_sponsors table. Detects additions, removals, and
 * rating changes; logs each to sponsor_changes.
 *
 * Run with: npm run ingest:sponsors
 *
 * Environment variables:
 *   NEXT_PUBLIC_SUPABASE_URL     (required)
 *   SUPABASE_SERVICE_ROLE_KEY    (required)
 *   UK_SPONSORS_CSV_URL          (optional — override the default GOV.UK URL)
 *
 * Reads from .env.local automatically if present.
 *
 * This script is designed to be wrapped in a Supabase Edge Function for daily
 * cron execution. The core logic is intentionally side-effect-free so it can
 * be called from any runtime.
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

// ─── Config ───────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Official GOV.UK download URL (updated on each publication — verify quarterly).
// Override via UK_SPONSORS_CSV_URL env var if the URL changes between updates.
const DEFAULT_CSV_URL =
  'https://assets.publishing.service.gov.uk/media/69d61be3758ba8b7b13b27e7/2026-04-08_-_Worker_and_Temporary_Worker.csv'

const CSV_URL = process.env.UK_SPONSORS_CSV_URL ?? DEFAULT_CSV_URL

// Batch size for DB upserts (keeps memory predictable on large datasets)
const UPSERT_BATCH_SIZE = 500

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

interface CsvRow {
  organisationName: string
  townCity: string | null
  county: string | null
  typeRating: string    // raw e.g. "Worker (A)"
  route: string         // e.g. "Skilled Worker"
  rating: 'A' | 'B'
}

interface ExistingSponsor {
  id: string
  organisation_name: string
  town_city: string | null
  county: string | null
  route: string
  rating: string
  type_rating: string
  is_active: boolean
}

// ─── CSV helpers ──────────────────────────────────────────────────────────────

/**
 * Parse a CSV line respecting RFC 4180 quoting rules.
 * Handles: comma-separated fields, double-quoted fields, embedded commas,
 * and doubled-quote escaping within quoted fields.
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false
  let i = 0

  while (i < line.length) {
    const ch = line[i]

    if (inQuotes) {
      if (ch === '"') {
        // Peek ahead: if next is also '"', it's an escaped quote
        if (line[i + 1] === '"') {
          current += '"'
          i += 2
        } else {
          inQuotes = false
          i++
        }
      } else {
        current += ch
        i++
      }
    } else {
      if (ch === '"') {
        inQuotes = true
        i++
      } else if (ch === ',') {
        fields.push(current.trim())
        current = ''
        i++
      } else {
        current += ch
        i++
      }
    }
  }

  fields.push(current.trim())
  return fields
}

/**
 * Parse CSV text (with header row) into CsvRow objects.
 * Tolerates Windows (\r\n) and Unix (\n) line endings.
 * Skips rows with fewer than 4 fields (malformed / blank lines).
 *
 * Expected columns from GOV.UK CSV (may vary; we match by position):
 *   0: Organisation Name
 *   1: Town/City
 *   2: County
 *   3: Type & Rating
 *   4: Route
 */
function parseCsv(csvText: string): CsvRow[] {
  const lines = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const rows: CsvRow[] = []

  // Detect header row to find column positions
  let headerLine = 0
  const headerCols = parseCsvLine(lines[0]).map((c) => c.toLowerCase().replace(/[^a-z0-9]/g, ''))

  // Column index mapping (flexible in case column order shifts)
  const colOrgName = headerCols.findIndex((c) => c.includes('organisation') || c.includes('organizationname'))
  const colTownCity = headerCols.findIndex((c) => c.includes('town') || c.includes('city'))
  const colCounty = headerCols.findIndex((c) => c.includes('county'))
  const colTypeRating = headerCols.findIndex((c) => c.includes('type') || c.includes('rating'))
  const colRoute = headerCols.findIndex((c) => c.includes('route'))

  // Fallback to positional if detection fails (original GOV.UK column order)
  const idxOrg = colOrgName >= 0 ? colOrgName : 0
  const idxTown = colTownCity >= 0 ? colTownCity : 1
  const idxCounty = colCounty >= 0 ? colCounty : 2
  const idxTypeRating = colTypeRating >= 0 ? colTypeRating : 3
  const idxRoute = colRoute >= 0 ? colRoute : 4

  if (process.env.NODE_ENV !== 'test') {
    console.log(`  Header detected at row ${headerLine}:`)
    console.log(`    org[${idxOrg}] town[${idxTown}] county[${idxCounty}] typeRating[${idxTypeRating}] route[${idxRoute}]`)
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const fields = parseCsvLine(line)
    if (fields.length < 4) continue

    const orgName = fields[idxOrg]?.trim()
    if (!orgName) continue

    const typeRating = fields[idxTypeRating]?.trim() ?? ''
    const route = fields[idxRoute]?.trim() ?? ''

    // Extract rating: look for "(A)" or "(B)" anywhere in typeRating
    const ratingMatch = typeRating.match(/\(([AB])\)/i)
    if (!ratingMatch) continue  // skip rows without a clear rating

    const rating = ratingMatch[1].toUpperCase() as 'A' | 'B'

    rows.push({
      organisationName: orgName,
      townCity: fields[idxTown]?.trim() || null,
      county: fields[idxCounty]?.trim() || null,
      typeRating,
      route: route || 'Unknown',
      rating,
    })
  }

  return rows
}

// ─── Key generation ───────────────────────────────────────────────────────────

/**
 * Composite lookup key: normalised org name + route.
 * Organisation names can have minor spelling variations — normalise aggressively.
 */
function sponsorKey(orgName: string, route: string): string {
  const normOrg = orgName.toLowerCase().replace(/[^a-z0-9]/g, '')
  const normRoute = route.toLowerCase().replace(/[^a-z0-9]/g, '')
  return `${normOrg}::${normRoute}`
}

// ─── Batch helper ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function batchUpsert(supabase: any, table: string, rows: object[], conflictCol: string): Promise<number> {
  let totalErrors = 0
  for (let i = 0; i < rows.length; i += UPSERT_BATCH_SIZE) {
    const batch = rows.slice(i, i + UPSERT_BATCH_SIZE)
    const { error } = await supabase.from(table).upsert(batch, { onConflict: conflictCol })
    if (error) {
      console.error(`  ⚠️  Batch upsert error (rows ${i}–${i + batch.length}): ${error.message}`)
      totalErrors++
    }
  }
  return totalErrors
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const supabase = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  })

  const now = new Date().toISOString()

  console.log(`\n📥  UK Sponsor Register Ingestion`)
  console.log(`    ${now}`)
  console.log(`    Source: ${CSV_URL}\n`)

  // ── Step 1: Fetch CSV ──────────────────────────────────────────────────────
  console.log('  Fetching CSV…')
  let csvText: string
  try {
    const res = await fetch(CSV_URL, {
      headers: { 'User-Agent': 'Joberlify/1.0 (sponsor-ingest; github.com/Akomzy1/joberlify)' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
    csvText = await res.text()
    console.log(`  ✓  Downloaded ${(csvText.length / 1024 / 1024).toFixed(1)} MB`)
  } catch (err) {
    console.error('  ❌  Failed to fetch CSV:', err)
    process.exit(1)
  }

  // ── Step 2: Parse CSV ──────────────────────────────────────────────────────
  console.log('  Parsing CSV…')
  const csvRows = parseCsv(csvText)
  console.log(`  ✓  Parsed ${csvRows.length.toLocaleString()} sponsor rows`)

  if (csvRows.length === 0) {
    console.error('  ❌  No rows parsed — CSV format may have changed. Check column headers.')
    process.exit(1)
  }

  // ── Step 3: Load existing DB state ─────────────────────────────────────────
  console.log('  Loading existing DB sponsors…')
  const { data: existingRows, error: fetchError } = await supabase
    .from('uk_sponsors')
    .select('id, organisation_name, town_city, county, route, rating, type_rating, is_active')

  if (fetchError) {
    console.error('  ❌  Failed to load existing sponsors:', fetchError.message)
    process.exit(1)
  }

  const existing = (existingRows ?? []) as ExistingSponsor[]
  console.log(`  ✓  Loaded ${existing.length.toLocaleString()} existing rows`)

  // Build lookup map: key → existing row
  const existingMap = new Map<string, ExistingSponsor>()
  for (const row of existing) {
    existingMap.set(sponsorKey(row.organisation_name, row.route), row)
  }

  // ── Step 4: Diff and build upsert payloads ─────────────────────────────────
  const upsertRows: object[] = []
  const changeRows: object[] = []
  const seenKeys = new Set<string>()

  let countAdded = 0
  let countChanged = 0
  let countUnchanged = 0

  for (const row of csvRows) {
    const key = sponsorKey(row.organisationName, row.route)
    seenKeys.add(key)

    const ex = existingMap.get(key)

    if (!ex) {
      // New sponsor
      countAdded++
      upsertRows.push({
        organisation_name: row.organisationName,
        town_city: row.townCity,
        county: row.county,
        type_rating: row.typeRating,
        route: row.route,
        rating: row.rating,
        is_active: true,
        ingested_at: now,
        last_seen_at: now,
      })
      changeRows.push({
        organisation_name: row.organisationName,
        change_type: 'added',
        old_value: null,
        new_value: `${row.route} (${row.rating})`,
        detected_at: now,
      })
    } else {
      const ratingChanged = ex.rating !== row.rating
      const wasInactive = !ex.is_active

      if (ratingChanged) {
        countChanged++
        changeRows.push({
          organisation_name: row.organisationName,
          change_type: 'rating_changed',
          old_value: `${ex.route} (${ex.rating})`,
          new_value: `${row.route} (${row.rating})`,
          detected_at: now,
        })
      } else if (wasInactive) {
        // Re-appeared on register after being removed
        countAdded++
        changeRows.push({
          organisation_name: row.organisationName,
          change_type: 'added',
          old_value: null,
          new_value: `${row.route} (${row.rating}) [re-added]`,
          detected_at: now,
        })
      } else {
        countUnchanged++
      }

      upsertRows.push({
        id: ex.id,
        organisation_name: row.organisationName,
        town_city: row.townCity,
        county: row.county,
        type_rating: row.typeRating,
        route: row.route,
        rating: row.rating,
        is_active: true,
        last_seen_at: now,
      })
    }
  }

  // ── Step 5: Mark removed sponsors ─────────────────────────────────────────
  let countRemoved = 0
  const removedIds: string[] = []

  for (const ex of existing) {
    if (!ex.is_active) continue  // already marked inactive
    const key = sponsorKey(ex.organisation_name, ex.route)
    if (!seenKeys.has(key)) {
      countRemoved++
      removedIds.push(ex.id)
      changeRows.push({
        organisation_name: ex.organisation_name,
        change_type: 'removed',
        old_value: `${ex.route} (${ex.rating})`,
        new_value: null,
        detected_at: now,
      })
    }
  }

  // ── Step 6: Persist ────────────────────────────────────────────────────────
  console.log(`\n  Writing ${upsertRows.length.toLocaleString()} upsert rows…`)
  const upsertErrors = await batchUpsert(supabase, 'uk_sponsors', upsertRows, 'id')

  // Mark removed sponsors inactive in batches
  if (removedIds.length > 0) {
    console.log(`  Marking ${removedIds.length} removed sponsors inactive…`)
    for (let i = 0; i < removedIds.length; i += UPSERT_BATCH_SIZE) {
      const batch = removedIds.slice(i, i + UPSERT_BATCH_SIZE)
      const { error } = await supabase
        .from('uk_sponsors')
        .update({ is_active: false, last_seen_at: now })
        .in('id', batch)
      if (error) console.error(`  ⚠️  Failed to mark batch inactive: ${error.message}`)
    }
  }

  // Insert change log entries
  if (changeRows.length > 0) {
    console.log(`  Writing ${changeRows.length} change log entries…`)
    for (let i = 0; i < changeRows.length; i += UPSERT_BATCH_SIZE) {
      const batch = changeRows.slice(i, i + UPSERT_BATCH_SIZE)
      const { error } = await supabase.from('sponsor_changes').insert(batch)
      if (error) console.error(`  ⚠️  Change log insert error: ${error.message}`)
    }
  }

  // ── Step 7: Summary ────────────────────────────────────────────────────────
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅  Ingestion complete.

  Processed:  ${csvRows.length.toLocaleString()} sponsors from CSV
  Added:      ${countAdded.toLocaleString()}
  Removed:    ${countRemoved.toLocaleString()}
  Changed:    ${countChanged.toLocaleString()}  (rating changes)
  Unchanged:  ${countUnchanged.toLocaleString()}
  DB errors:  ${upsertErrors}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`)

  if (upsertErrors > 0) process.exit(1)
}

main().catch((err) => {
  console.error('❌  Unhandled error:', err)
  process.exit(1)
})
