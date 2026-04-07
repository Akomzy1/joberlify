# CLAUDE.md — Joberlify

## Project Identity

**Joberlify** is an AI-powered job search intelligence platform.  
Tagline: *"Find the right job. Anywhere in the world."*

It serves two audiences from one platform:
1. **Standard job seekers** — professionals searching for roles in their own country or where they already have work authorisation.
2. **International job seekers** — professionals seeking roles abroad that require visa sponsorship.

The core philosophy is **quality over quantity**. Joberlify tells users when NOT to apply ("Not Yet") and gives them actionable guidance to close gaps — turning rejection into a growth moment. It is NOT a spray-and-pray auto-apply tool.

---

## Tech Stack

- **Framework:** Next.js 14+ (App Router), TypeScript, TailwindCSS
- **Database:** Supabase (PostgreSQL) with Row Level Security
- **Auth:** Supabase Auth (email + Google OAuth)
- **AI:** Claude API (Sonnet for evaluations + CV generation; Haiku for parsing)
- **PDF Generation:** Playwright (headless Chromium) for ATS-optimised CVs
- **Payments:** Stripe (subscriptions: Free / Pro $17.99 / Global $34.99)
- **Hosting:** Vercel
- **Email:** Resend (transactional emails, alerts)
- **Visa Data:** UK Home Office Licensed Sponsors CSV (daily ingestion)

---

## Project Structure

```
joberlify/
├── app/                          # Next.js App Router pages
│   ├── (auth)/                   # Auth pages (login, signup, onboarding)
│   ├── (public)/                 # Public pages (landing, pricing, sponsors directory)
│   ├── dashboard/                # Authenticated dashboard
│   ├── evaluate/                 # Job evaluation flow
│   ├── evaluations/              # Evaluation history + detail pages
│   │   └── [id]/                 # Single evaluation with scores, gap report
│   ├── pipeline/                 # Application tracker (kanban + list)
│   ├── cv/                       # Generated CV preview + download
│   │   └── [id]/
│   ├── interview-prep/           # STAR stories + likely questions
│   │   └── [id]/
│   ├── sponsors/                 # UK sponsor directory (public browsable)
│   ├── settings/                 # Profile, CV, subscription, preferences
│   ├── pricing/                  # Pricing page
│   └── api/                      # API routes
│       ├── auth/
│       ├── profile/
│       ├── evaluate/             # Core evaluation endpoint (Claude API)
│       ├── evaluations/
│       ├── cv/                   # CV generation + PDF download
│       ├── interview-prep/
│       ├── pipeline/
│       ├── visa/                 # Sponsor search, SOC codes, eligibility check
│       ├── billing/              # Stripe checkout, webhook, portal
│       └── internal/             # Cron jobs (sponsor ingestion)
├── components/
│   ├── ui/                       # Base UI components (buttons, inputs, cards)
│   ├── evaluation/               # Score card, radar chart, gap report
│   ├── pipeline/                 # Kanban board, pipeline cards
│   ├── visa/                     # Sponsor search, eligibility panel, visa labels
│   ├── cv/                       # CV preview, format selector
│   └── layout/                   # Navigation, sidebar, footer
├── lib/
│   ├── supabase/                 # Supabase client, server client, middleware
│   ├── claude/                   # Claude API client, prompt templates
│   ├── stripe/                   # Stripe client, helpers
│   ├── visa/                     # Visa eligibility logic, SOC code matching
│   ├── scraper/                  # Job URL scraping (Playwright/cheerio)
│   ├── pdf/                      # CV PDF generation
│   └── utils/                    # General utilities
├── data/
│   ├── uk-soc-codes.json         # UK SOC 2020 codes with eligibility + going rates
│   ├── uk-sponsors-schema.sql    # Sponsor table schema
│   └── seed/                     # Seed scripts for SOC codes, sample data
├── supabase/
│   ├── migrations/               # Database migrations
│   └── functions/                # Edge Functions (sponsor ingestion cron)
├── public/                       # Static assets
├── docs/                         # Project documentation
│   ├── competitive-analysis.md
│   ├── visa-rules-engine.md
│   └── mvp-spec.md
├── CLAUDE.md                     # This file
├── .env.local                    # Environment variables (never commit)
└── package.json
```

---

## Key Architecture Decisions

### AI Usage
- **Claude Sonnet** for: job evaluations (10-dimension scoring), CV generation, interview prep, SOC code duty-matching
- **Claude Haiku** for: CV parsing on upload, JD text extraction, simple classification tasks
- Always parse Claude responses as structured JSON. Prompts must specify JSON output format.
- Cache evaluation results in database — never re-evaluate the same job+profile combination unnecessarily.
- Set daily API budget caps per environment to prevent cost spikes.

### Evaluation Engine
- 10 scoring dimensions, each 1.0–5.0 (one decimal place): role_match, skills_alignment, experience_level, growth_trajectory, culture_fit, compensation, location_fit, company_stage, role_impact, long_term_value
- 11th dimension (visa_feasibility) added only when user has `requires_visa_sponsorship = true`
- Overall score = weighted average (role_match and skills_alignment are gate-pass — if either < 2.0, overall is capped at 3.0)
- Grade mapping: A = 4.5–5.0, B = 3.5–4.4, C = 2.5–3.4, D = 1.5–2.4, F = 1.0–1.4
- Recommendation: "apply" (≥ 4.0), "consider" (3.0–3.9), "not_yet" (< 3.0)
- Visa override: if visa_feasibility = not_sponsorable, recommendation = "dont_apply" regardless of other scores

### "Not Yet" Philosophy
- Every "not_yet" and "dont_apply" recommendation MUST include a Gap Report
- Gap Report contains: which dimensions scored low, what specific skills/qualifications are missing, actionable guidance to close each gap, and similar roles the user IS ready for
- For visa gaps: specific alternative SOC codes, alternative visa routes, salary negotiation leverage, licensed sponsors with similar roles
- Never leave a user at a dead end. "Not Yet" = "here's exactly what to work on"

### Visa Eligibility — Three-Layer Check (UK)
Every visa check must pass through all three layers:

```
LAYER 1: SPONSOR LICENCE
- Match company name against uk_sponsors table (fuzzy match)
- Check: active? A-rated? Correct visa route?
- Data source: Home Office CSV (daily automated ingestion)

LAYER 2: OCCUPATION CODE (SOC 2020)
- AI analyses job DUTIES (not title) → maps to SOC code
- Cross-reference against uk_soc_codes table
- Check: in Table 1/2/3 (eligible)? or Table 6 (ineligible)?
- Since July 2025: new entry clearance = RQF Level 6+ only
- RQF 3–5 only if on Temporary Shortage List (TSL, expires Dec 2026)
- Data source: Appendix Skilled Occupations (hardcoded JSON, quarterly manual verification)

LAYER 3: SALARY
- Compare advertised salary against max(general_threshold, going_rate for SOC code)
- General threshold: £38,700–£41,700 (check current rules)
- New entrant rate: £33,400 (under 26, student switcher, postdoc)
- ISL roles: 80% of standard minimum
- Data source: uk_soc_codes.json going_rate fields
```

### Critical Visa Rules (Non-Negotiable)
1. Never assume sponsorable just because employer has a licence — always check SOC code and salary
2. Match on job DUTIES, not job titles — "Engineer" could be eligible or ineligible depending on actual work
3. SOC 6135/6136 (care workers) — NO new entry clearance; in-country extensions only until July 2028
4. B-rated sponsors CANNOT issue new Certificates of Sponsorship
5. A listing claiming "visa sponsorship available" does NOT mean the role is eligible — always verify independently
6. TSL expires December 2026 — warn users applying for TSL-dependent roles
7. Going rate ≠ general threshold — some SOC codes have going rates far above £38,700
8. Always include disclaimer: "This is an eligibility indicator, not legal advice. Consult a qualified immigration adviser before making decisions."
9. Always display "Last verified: [date]" on every visa check

### Visa Status Labels
- ✅ **Sponsorship Confirmed** (green) — employer licensed, SOC eligible, salary meets threshold, listing mentions sponsorship
- 🟡 **Sponsorship Likely** (amber) — employer licensed and has sponsored before, SOC and salary appear eligible, listing doesn't explicitly mention it
- 🟠 **Sponsorship Uncertain** (orange) — employer licensed but SOC code borderline or salary unclear
- ❌ **Sponsorship Unlikely** (red) — employer not on register, or SOC ineligible, or salary below threshold
- ⛔ **Not Sponsorable** (dark red) — role definitively in Table 6 / ineligible

### Sponsor Watch (Post-MVP, v1.2)
- Users who mark a job as "Hired" can opt in to ongoing employer licence monitoring
- Uses the same daily sponsor CSV diff already running
- Alerts: licence revoked (URGENT — 60 days to find new sponsor), downgraded A→B, removed from register
- Standalone pricing: $4.99/month for users who only need monitoring

---

## Database

### Key Tables
- `users` — auth, subscription tier, Stripe IDs
- `user_profiles` — nationality, target countries, visa needs, parsed CV data, skills, qualifications
- `evaluations` — 10 dimension scores + visa score + grade + recommendation + gap report + growth roadmap
- `generated_cvs` — PDF URLs, format, linked to evaluation
- `pipeline` — application tracker (status: evaluated → applying → applied → interviewing → offer → rejected → withdrawn → hired)
- `interview_prep` — STAR stories, likely questions, company research
- `sponsor_watch` — post-placement employer monitoring opt-ins
- `uk_sponsors` — daily-ingested Home Office register (120,000+ rows)
- `uk_soc_codes` — SOC 2020 codes with eligibility, going rates, tables, conditions
- `sponsor_changes` — audit log of all sponsor register changes

### Row Level Security
All user-facing tables must have RLS enabled:
- Users can only read/write their own data
- `uk_sponsors` and `uk_soc_codes` are read-only for authenticated users
- `sponsor_changes` is internal only (no user access)

---

## Subscription Tiers

| Feature | Free | Pro ($17.99/mo) | Global ($34.99/mo) |
|---|---|---|---|
| Evaluations | 3/month | 30/month | Unlimited |
| Tailored CVs | ✗ | 10/month | Unlimited |
| Interview prep | ✗ | ✓ | ✓ |
| Pipeline items | 10 | Unlimited | Unlimited |
| Gap Report | Basic (top 3) | Full | Full + Growth Roadmap |
| UK sponsor browse | ✓ | ✓ | ✓ |
| Visa eligibility check | ✗ | ✓ | ✓ |
| Batch evaluation | ✗ | ✗ | ✓ |
| Sponsor Watch | ✗ | ✗ | ✓ |

Stripe products: `joberlify_free`, `joberlify_pro`, `joberlify_global`, `joberlify_sponsor_watch`

---

## Brand & UI

- **Primary:** Deep blue (#1E3A5F)
- **Accent:** Teal (#0EA5E9) — aligns with AkomzyAi palette
- **Typography:** Inter or DM Sans (body), Outfit (headings)
- **Grade colours:** A = green (#22C55E), B = teal (#0EA5E9), C = amber (#F59E0B), D = orange (#F97316), F = red (#EF4444)
- **Tone:** Direct, honest, encouraging. "Not yet" not "you can't". Never patronising.
- **No emojis in UI** except visa status labels. Professional, not playful.

---

## Environment Variables

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Claude API
ANTHROPIC_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRO_PRICE_ID=
STRIPE_GLOBAL_PRICE_ID=
STRIPE_SPONSOR_WATCH_PRICE_ID=

# App
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_APP_NAME=Joberlify

# Email (Resend)
RESEND_API_KEY=

# UK Sponsor Data
UK_SPONSORS_CSV_URL=https://assets.publishing.service.gov.uk/media/...
```

---

## Commands

```bash
# Development
npm run dev                  # Start dev server (localhost:3000)
npm run build                # Production build
npm run lint                 # ESLint
npm run type-check           # TypeScript check

# Database
npx supabase db push         # Apply migrations
npx supabase db reset        # Reset + re-seed
npm run seed:soc-codes       # Seed UK SOC codes from data/uk-soc-codes.json
npm run seed:sponsors        # Initial UK sponsor CSV ingestion

# Cron (manual trigger during dev)
npm run ingest:sponsors      # Fetch and diff latest UK sponsor CSV

# PDF
npx playwright install chromium  # Required for CV PDF generation
```

---

## API Conventions

- All API routes return `{ data, error }` shape
- HTTP status codes: 200 (success), 201 (created), 400 (bad request), 401 (unauthorized), 403 (forbidden — tier limit), 404 (not found), 500 (server error)
- Tier limit enforcement: return 403 with `{ error: "Evaluation limit reached. Upgrade to Pro for 30 evaluations/month.", upgrade_url: "/pricing" }`
- Claude API calls wrapped in try/catch with timeout (30s for evaluations, 15s for parsing)
- All visa checks include `last_verified_at` timestamp in response
- All visa checks include `disclaimer` field in response

---

## File Naming Conventions

- Pages: `app/[route]/page.tsx`
- Layouts: `app/[route]/layout.tsx`
- API routes: `app/api/[resource]/route.ts`
- Components: PascalCase (`ScoreCard.tsx`, `GapReport.tsx`, `SponsorSearch.tsx`)
- Utilities: camelCase (`parseJobUrl.ts`, `calculateScore.ts`, `matchSocCode.ts`)
- Types: `types/` directory, PascalCase interfaces (`Evaluation.ts`, `UserProfile.ts`, `VisaCheck.ts`)

---

## Testing Priority

1. **Visa eligibility logic** — the three-layer check must be accurate; wrong results have real consequences
2. **Score calculation** — weighted average, gate-pass logic, grade mapping
3. **Tier enforcement** — free users cannot exceed 3 evaluations; Pro cannot batch
4. **Stripe webhook** — subscription status must sync correctly
5. **Sponsor data ingestion** — diff logic must correctly detect adds, removes, rating changes
6. **CV PDF generation** — must render correctly and pass ATS parsers

---

## What Claude (you) Should Always Do

1. **Follow the "Not Yet" philosophy.** Every recommendation to not apply must include specific gaps and actionable guidance. Never leave users at a dead end.
2. **Validate visa logic against the three-layer check.** Never shortcut. Sponsor + SOC code + salary, every time.
3. **Use TypeScript strictly.** No `any` types. Define interfaces for all data shapes.
4. **Keep components small.** One component, one job. Extract shared logic into hooks.
5. **Cache Claude API responses.** Same job URL + same user profile = same evaluation. Don't re-call the API.
6. **Respect RLS.** Never bypass Supabase Row Level Security. Every query must be scoped to the authenticated user.
7. **Handle errors gracefully.** URL scraping will fail often — always offer text paste fallback. Claude API can timeout — show retry option, not a crash.
8. **Mobile-first.** Every component must work on 375px width. Test pipeline kanban on mobile (use list view as default on small screens).
9. **Include timestamps.** Every visa check shows "Sponsor data last updated: [date]" and "Eligibility rules last verified: [date]".
10. **Include disclaimers.** Every visa output includes the legal disclaimer. This is non-negotiable.

## What Claude (you) Should Never Do

1. **Never auto-submit applications.** Joberlify is human-in-the-loop. The user always decides.
2. **Never provide immigration legal advice.** Eligibility indicators only. Always recommend consulting a qualified adviser.
3. **Never assume a role is sponsorable just because the employer has a licence.**
4. **Never match SOC codes by job title alone.** Always analyse duties from the job description.
5. **Never store sensitive credentials in code.** All secrets in `.env.local`.
6. **Never skip the Gap Report.** If recommendation is "not_yet" or "dont_apply", a gap report is mandatory.
7. **Never inflate scores to make users feel good.** Honest evaluation builds trust. A 2.1 is a 2.1.
8. **Never expose internal API routes** (sponsor ingestion, admin functions) to unauthenticated users.
