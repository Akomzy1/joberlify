---
name: joberlify
description: >
  Full-stack development skill for Joberlify — an AI-powered job search intelligence
  platform that evaluates job fit across 10 dimensions, generates ATS-optimised tailored
  CVs, manages application pipelines, and provides global visa sponsorship intelligence
  including UK SOC code eligibility, sponsor licence verification, and salary threshold
  checks. Use this skill whenever the user works on any part of Joberlify, including: the
  evaluation engine, scoring dimensions, gap reports, "Not Yet" guidance, CV generation,
  PDF rendering, pipeline tracker, interview prep, STAR stories, visa eligibility checks,
  UK sponsor data ingestion, SOC code mapping, salary threshold logic, sponsor directory,
  Sponsor Watch, subscription/billing, API endpoints, database schema, AI prompt
  engineering, landing pages, onboarding, or any UI component or backend service related
  to the platform. Also trigger when the user mentions "Joberlify", "job evaluation",
  "fit score", "don't apply", "not yet", "gap report", "visa sponsorship check",
  "SOC code", "sponsor licence", "sponsor watch", "going rate", "Appendix Skilled
  Occupations", "10 dimensions", "tailored CV", "ATS-optimised", "application pipeline",
  or "growth roadmap".
---

# Joberlify — AI-Powered Job Search Intelligence Platform

*"Find the right job. Anywhere in the world."*

## Product Overview

Joberlify serves two audiences from one platform:

1. **Standard job seekers** — professionals searching for roles locally or where they have work authorisation. They get AI fit scoring, tailored CVs, interview prep, and the "Not Yet" quality-first philosophy.
2. **International job seekers** — everything above plus visa sponsorship intelligence: sponsor verification, occupation code eligibility, salary threshold validation, and post-placement Sponsor Watch.

### Core Philosophy

- **Quality over quantity.** Joberlify tells users when NOT to apply and gives actionable guidance to close gaps.
- **"Not Yet", not "No".** Every rejection includes specific gaps, guidance, and alternative roles the user IS ready for.
- **Human-in-the-loop.** Joberlify never auto-submits applications. The user always decides.
- **Honest scoring.** Never inflate scores. A 2.1 is a 2.1.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14+ (App Router), TypeScript, TailwindCSS |
| Database | Supabase (PostgreSQL) with Row Level Security |
| Auth | Supabase Auth (email + Google OAuth) |
| AI Engine | Claude API — Sonnet for evaluations/CV gen; Haiku for parsing |
| PDF Generation | Playwright (headless Chromium) for ATS-optimised CVs |
| Payments | Stripe (Free / Pro $17.99 / Global $34.99) |
| Hosting | Vercel |
| Email | Resend |
| Visa Data | UK Home Office Licensed Sponsors CSV (daily ingestion) |

## Project Structure

```
joberlify/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Login, signup, onboarding
│   ├── (public)/                 # Landing, pricing, sponsor directory
│   ├── dashboard/
│   ├── evaluate/                 # Job evaluation flow
│   ├── evaluations/[id]/         # Score card, gap report, actions
│   ├── pipeline/                 # Kanban + list tracker
│   ├── cv/[id]/                  # CV preview + download
│   ├── interview-prep/[id]/      # STAR stories + questions
│   ├── sponsors/                 # UK sponsor directory (public)
│   ├── settings/
│   ├── pricing/
│   └── api/
│       ├── evaluate/             # Core evaluation (Claude API)
│       ├── cv/                   # CV generation + PDF
│       ├── visa/                 # Sponsor search, SOC codes, eligibility
│       ├── pipeline/
│       ├── billing/              # Stripe
│       └── internal/             # Cron (sponsor ingestion)
├── components/
│   ├── ui/                       # Base components
│   ├── evaluation/               # ScoreCard, RadarChart, GapReport
│   ├── pipeline/                 # KanbanBoard, PipelineCard
│   ├── visa/                     # SponsorSearch, EligibilityPanel, VisaLabel
│   ├── cv/                       # CvPreview, FormatSelector
│   └── layout/                   # Nav, Sidebar, Footer
├── lib/
│   ├── supabase/                 # Client, server client, middleware
│   ├── claude/                   # API client, prompt templates
│   ├── stripe/                   # Client, helpers
│   ├── visa/                     # Eligibility logic, SOC matching
│   ├── scraper/                  # Job URL scraping
│   ├── pdf/                      # CV PDF generation
│   └── utils/
├── data/
│   ├── uk-soc-codes.json         # SOC 2020 codes + eligibility + going rates
│   └── seed/
├── supabase/
│   ├── migrations/
│   └── functions/                # Edge Functions (sponsor cron)
└── types/                        # TypeScript interfaces
```

## Evaluation Engine

### 10 Scoring Dimensions (1.0–5.0 each)

| # | Dimension | What It Measures |
|---|---|---|
| 1 | Role Match | How closely job duties align with candidate experience and targets |
| 2 | Skills Alignment | How many required skills the candidate demonstrably has |
| 3 | Experience Level | Whether candidate seniority matches the requirement |
| 4 | Growth Trajectory | Whether this role advances the candidate's career direction |
| 5 | Culture Fit | Company values and working style alignment |
| 6 | Compensation | Whether salary meets candidate expectations and market rate |
| 7 | Location Fit | Location compatibility with candidate preferences/constraints |
| 8 | Company Stage | Company size/stage match (startup vs enterprise preference) |
| 9 | Role Impact | Whether the role offers meaningful ownership and visibility |
| 10 | Long-term Value | Whether it builds compounding skills, network, or credentials |
| 11 | Visa Feasibility | (Only if user requires sponsorship) 3-layer visa check result |

### Scoring Rules

- **Gate-pass dimensions:** Role Match and Skills Alignment. If either < 2.0, overall score capped at 3.0.
- **Grade mapping:** A = 4.5–5.0, B = 3.5–4.4, C = 2.5–3.4, D = 1.5–2.4, F = 1.0–1.4
- **Recommendations:** "apply" (≥ 4.0), "consider" (3.0–3.9), "not_yet" (< 3.0)
- **Visa override:** If visa_feasibility = not_sponsorable → "dont_apply" regardless of fit score
- **Gap Report is MANDATORY** for every "not_yet" and "dont_apply" recommendation

### Gap Report Contents

Every "Not Yet" must include:
1. Dimension-by-dimension breakdown showing which scored low and why
2. Specific skill/qualification gaps identified
3. Actionable guidance per gap (courses, certs, portfolio projects, estimated time)
4. Similar roles the user IS ready for (redirection, not dead end)
5. For visa gaps: alternative SOC codes, alternative visa routes, salary negotiation leverage, similar sponsorable roles

### Growth Roadmap

If a user consistently scores low on the same dimension across 5+ evaluations, generate a persistent Growth Roadmap — a structured plan (e.g., 90-day) to close that specific gap.

## Visa Eligibility — Three-Layer Check (UK)

**CRITICAL: All three layers must pass. Never shortcut.**

### Layer 1: Sponsor Licence

```
- Fuzzy match company name against uk_sponsors table
- Check: active entry found? A-rated (not B)? Correct visa route (Skilled Worker)?
- B-rated = CANNOT issue new CoS — flag as "Sponsorship Unlikely"
- Data: Home Office CSV, ingested daily via cron
```

### Layer 2: Occupation Code (SOC 2020)

```
- AI analyses job DUTIES from JD (never match on title alone)
- Maps to most likely 4-digit SOC 2020 code
- Cross-reference against uk_soc_codes table:
  - Table 1 (RQF 6+): ✅ Eligible
  - Table 1a (RQF 3–5): ⚠️ Only if on TSL or ISL
  - Table 2/2aa (shortage): ✅ Eligible with concessions
  - Table 3/3a (health/education): ✅ Sector-specific rules
  - Table 6: ❌ INELIGIBLE — cannot be sponsored
- Since July 2025: new entry clearance = RQF Level 6+ only
- TSL expires December 2026 — warn users on TSL-dependent roles
```

### Layer 3: Salary Threshold

```
- Compare advertised salary against: max(general_threshold, going_rate for SOC code)
- General threshold: £38,700–£41,700 (check current)
- New entrant rate: £33,400 (under 26, student switcher, postdoc)
- ISL roles: 80% of standard minimum
- Salary = gross annual before tax, excluding bonuses/overtime
```

### Visa Status Labels

| Label | Colour | Meaning |
|---|---|---|
| ✅ Sponsorship Confirmed | Green | All 3 layers pass + listing mentions sponsorship |
| 🟡 Sponsorship Likely | Amber | All 3 layers pass, listing doesn't explicitly mention it |
| 🟠 Sponsorship Uncertain | Orange | Employer licensed but SOC or salary borderline |
| ❌ Sponsorship Unlikely | Red | Employer not found, or SOC ineligible, or salary below |
| ⛔ Not Sponsorable | Dark Red | Role definitively in Table 6 / ineligible |

### Non-Negotiable Visa Rules

1. Never assume sponsorable just because employer has a licence
2. Match on DUTIES, not job titles
3. SOC 6135/6136 (care workers): NO new entry clearance; extensions only until July 2028
4. B-rated sponsors cannot issue new CoS
5. "Visa sponsorship available" in a listing ≠ actually sponsorable — verify independently
6. Always show "Last verified: [date]" on every visa check
7. Always include disclaimer: "Eligibility indicator, not legal advice. Consult a qualified immigration adviser."

## Sponsor Watch (Post-Placement Monitoring)

Users who mark a job as "Hired" can opt in. Uses the daily sponsor CSV diff to detect:

| Change | Alert Level |
|---|---|
| Licence revoked | 🔴 CRITICAL — push + email + SMS (user has ~60 days) |
| Downgraded A → B | 🟠 HIGH — email |
| Removed from register | 🔴 CRITICAL — push + email + SMS |
| Restored to A | 🟢 LOW — in-app only |
| Visa routes changed | 🟡 MEDIUM — email |

Standalone pricing: $4.99/month for users who only need monitoring.

## Database — Key Tables

| Table | Purpose |
|---|---|
| `users` | Auth, subscription tier, Stripe IDs |
| `user_profiles` | Nationality, targets, visa needs, parsed CV, skills, qualifications |
| `evaluations` | 10 scores + visa score + grade + recommendation + gap report |
| `generated_cvs` | PDF URLs, format, linked to evaluation |
| `pipeline` | Status tracking: evaluated → applying → applied → interviewing → offer → hired |
| `interview_prep` | STAR stories, likely questions, company research |
| `sponsor_watch` | Post-placement employer monitoring opt-ins |
| `uk_sponsors` | Home Office register (120,000+ rows, daily refresh) |
| `uk_soc_codes` | SOC 2020 codes: eligibility, going rates, tables, conditions |
| `sponsor_changes` | Audit log of all register changes |

RLS: All user tables scoped to authenticated user. `uk_sponsors` and `uk_soc_codes` read-only for authenticated users.

## Subscription Tiers

| Feature | Free | Pro ($17.99/mo) | Global ($34.99/mo) |
|---|---|---|---|
| Evaluations | 3/month | 30/month | Unlimited |
| Tailored CVs | ❌ | 10/month | Unlimited |
| Interview prep | ❌ | ✅ | ✅ |
| Pipeline items | 10 | Unlimited | Unlimited |
| Gap Report | Basic (top 3) | Full | Full + Growth Roadmap |
| Sponsor directory | Browse | Browse + eligibility check | Full + alerts |
| Visa eligibility | ❌ | ❌ | ✅ |
| Batch evaluation | ❌ | ❌ | ✅ |
| Sponsor Watch | ❌ | ❌ | ✅ |

## Brand & UI

| Element | Value |
|---|---|
| Primary | Deep blue #1E3A5F |
| Accent | Teal #0EA5E9 |
| Body font | Inter or DM Sans |
| Heading font | Outfit |
| Grades | A=#22C55E, B=#0EA5E9, C=#F59E0B, D=#F97316, F=#EF4444 |
| Tone | Direct, honest, encouraging. "Not yet" not "you can't". |

## API Routes

```
POST   /api/evaluate                   # Paste URL/text → Claude → scores
GET    /api/evaluations                # List user evaluations
GET    /api/evaluations/:id            # Single evaluation detail
POST   /api/cv/generate                # Claude → structured CV → PDF
GET    /api/cv/:id/download            # Download PDF
POST   /api/interview-prep/generate    # Claude → STAR stories
GET    /api/pipeline                   # Pipeline items
PUT    /api/pipeline/:id               # Update status
GET    /api/visa/sponsors              # Search sponsor directory
GET    /api/visa/soc-codes             # Search SOC codes
GET    /api/visa/check                 # 3-layer eligibility check
POST   /api/billing/create-checkout    # Stripe
POST   /api/billing/webhook            # Stripe webhook
POST   /api/profile/upload-cv          # CV upload + AI parsing
POST   /api/internal/ingest-sponsors   # Daily cron
```

## Development Commands

```bash
npm run dev                  # localhost:3000
npm run build                # Production build
npm run seed:soc-codes       # Seed UK SOC codes
npm run seed:sponsors        # Initial sponsor CSV ingestion
npm run ingest:sponsors      # Manual sponsor refresh
npx playwright install chromium  # Required for PDF gen
```

## Key Implementation Notes

### Claude API Usage
- Sonnet for evaluations (needs strong reasoning), Haiku for parsing (cost-effective)
- All prompts request structured JSON output
- Cache: same job URL + same user profile = same evaluation — don't re-call API
- Timeout: 30s for evaluations, 15s for parsing
- Wrap all calls in try/catch with user-friendly fallback

### Job URL Scraping
- Primary: Playwright or cheerio to fetch and parse job page
- Fallback: text paste area (always available — many URLs will block scraping)
- Extract: title, company, location, salary, requirements, duties
- Never fail silently — if scrape fails, prompt user to paste JD text

### CV PDF Generation
- Claude generates structured CV JSON tailored to the job
- HTML template renders the JSON with proper formatting
- Playwright converts HTML → PDF (ATS-optimised: single column, standard fonts, no tables/graphics)
- Country-specific formatting: UK (no photo, no DOB), US (achievements-focused), Generic

### Sponsor Data Ingestion (Daily Cron)
- Fetch CSV from GOV.UK at 06:00 UTC daily
- Parse and diff against uk_sponsors table
- Log all changes to sponsor_changes table
- Notify Sponsor Watch users if their employer's status changed
- Log summary: "[X] processed, [Y] added, [Z] removed, [W] changed"

### Tier Enforcement
- Check usage counts before every evaluation/CV generation
- Return 403 with upgrade message when limit reached
- Free: 3 evals/month, 10 pipeline items, basic gap report
- Pro: 30 evals, 10 CVs, full gap report, visa checks
- Global: unlimited everything + batch + Sponsor Watch

## Do / Don't Rules

### Always Do
- Include Gap Report with every "not_yet" or "dont_apply" recommendation
- Validate visa against all 3 layers (sponsor + SOC + salary)
- Show "Last verified" timestamps on visa checks
- Include legal disclaimer on visa outputs
- Use TypeScript strictly — no `any` types
- Respect Supabase RLS — scope every query to authenticated user
- Offer text paste fallback when URL scraping fails
- Test pipeline kanban on mobile (default to list view on small screens)

### Never Do
- Auto-submit applications — always human-in-the-loop
- Provide immigration legal advice — eligibility indicators only
- Assume sponsorable from licence alone — check SOC and salary
- Match SOC codes by job title — always analyse duties
- Skip the Gap Report on rejection recommendations
- Inflate scores to please users — honest evaluation builds trust
- Store secrets in code — all credentials in .env.local
- Expose internal API routes to unauthenticated users
