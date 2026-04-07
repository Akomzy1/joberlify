-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 007: Visa Data Tables
--   · uk_sponsors       — Home Office Licensed Sponsors register (daily ingested)
--   · uk_soc_codes      — SOC 2020 occupation eligibility + going rates
--   · sponsor_changes   — Audit log of all register changes
--   · sponsor_watch     — Post-placement employer monitoring (Global tier)
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── UK Sponsors ─────────────────────────────────────────────────────────────
-- Source: Home Office CSV (daily automated ingestion).
-- ~120,000+ rows. Authenticated users can SELECT only.

create table if not exists public.uk_sponsors (
  id                    uuid primary key default gen_random_uuid(),

  organisation_name     text not null,
  town_city             text,
  county                text,

  -- Raw field from CSV e.g. "Skilled Worker (A)"
  type_rating           text not null,
  -- Parsed fields (populated during ingestion)
  route                 text not null,   -- e.g. 'Skilled Worker'
  rating                text not null check (rating in ('A', 'B')),

  is_active             boolean not null default true,
  ingested_at           timestamptz not null default now(),
  last_seen_at          timestamptz not null default now(),
  created_at            timestamptz not null default now()
);

comment on table public.uk_sponsors is
  'UK Home Office Licensed Sponsors register. '
  'Ingested daily via cron from the official CSV. ~120k rows. '
  'Authenticated users have SELECT access only.';

comment on column public.uk_sponsors.rating is
  'A-rated sponsors can issue new CoS. B-rated CANNOT issue new CoS — '
  'only in-country extensions until they return to A-rating.';

-- ─── UK SOC Codes ────────────────────────────────────────────────────────────
-- Source: Appendix Skilled Occupations (quarterly manual verification).
-- Hardcoded from uk-soc-codes.json seed data.

create table if not exists public.uk_soc_codes (
  soc_code                  text primary key,   -- e.g. '2135'
  occupation_title          text not null,
  example_job_titles        text[] not null default '{}',

  rqf_level                 integer not null check (rqf_level between 3 and 8),

  -- Eligibility Table (per Appendix Skilled Occupations)
  -- table1/2/3 = eligible; table6 = ineligible
  eligibility_table         text not null check (
                              eligibility_table in ('table1', 'table2', 'table3', 'table6')
                            ),
  is_eligible               boolean not null,  -- false if table6

  -- Salary thresholds (GBP per year)
  going_rate_annual         numeric(10,2) not null,
  going_rate_new_entrant    numeric(10,2),  -- ~70% of standard for new entrants

  -- Immigration Salary List (formerly Shortage Occupation List)
  on_immigration_salary_list boolean not null default false,

  -- Temporary Shortage List (RQF 3-5 extension, expires Dec 2026)
  on_temporary_shortage_list boolean not null default false,
  tsl_expiry_date           date,   -- 2026-12-31 for current TSL cohort

  conditions                text,   -- any special eligibility conditions
  last_verified_at          date not null  -- quarterly manual check date
);

comment on table public.uk_soc_codes is
  'UK SOC 2020 occupation codes with Skilled Worker visa eligibility. '
  'Source: Appendix Skilled Occupations. Quarterly manual verification required. '
  'Match on job DUTIES, never job title alone.';

comment on column public.uk_soc_codes.is_eligible is
  'false if eligibility_table = table6 (definitively ineligible). '
  'Care workers (6135/6136): no new entry clearance, in-country only until July 2028.';

comment on column public.uk_soc_codes.on_temporary_shortage_list is
  'TSL allows RQF 3-5 roles that would otherwise be ineligible since July 2025. '
  'WARN users: TSL expires December 2026.';

-- ─── Sponsor Changes ─────────────────────────────────────────────────────────
-- Audit log of all detected changes during daily ingestion.
-- Regular users have NO access.

create table if not exists public.sponsor_changes (
  id                    uuid primary key default gen_random_uuid(),
  organisation_name     text not null,
  change_type           sponsor_change_type not null,
  old_value             text,
  new_value             text,
  detected_at           timestamptz not null default now()
);

comment on table public.sponsor_changes is
  'Audit log of all sponsor register changes detected during daily ingestion. '
  'Internal only — no RLS policy grants user access.';

-- ─── Sponsor Watch ────────────────────────────────────────────────────────────
-- Post-placement employer monitoring (Global tier + $4.99/mo add-on).
-- Monitors employer licence status after user is hired.

create table if not exists public.sponsor_watch (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references public.users (id) on delete cascade,
  pipeline_item_id        uuid references public.pipeline (id) on delete set null,

  employer_name           text not null,
  employer_licence_number text,   -- for precise matching if available
  country                 text not null default 'GB',
  licence_rating          text check (licence_rating in ('A', 'B')),
  visa_route              text,

  is_active               boolean not null default true,
  last_checked_at         timestamptz,
  last_alerted_at         timestamptz,

  created_at              timestamptz not null default now()
);

comment on table public.sponsor_watch is
  'Post-placement sponsor licence monitoring. '
  'Global tier only (or $4.99/mo standalone). '
  'Triggers alerts on: licence revoked (60-day warning), A→B downgrade, removal.';
