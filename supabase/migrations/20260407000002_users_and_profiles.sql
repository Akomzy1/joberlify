-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 002: Users & User Profiles
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Users ───────────────────────────────────────────────────────────────────
-- Extends auth.users with application-level data.
-- id mirrors auth.users.id — no separate sequence needed.

create table if not exists public.users (
  id                        uuid primary key references auth.users (id) on delete cascade,
  email                     text not null,
  full_name                 text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),

  -- Subscription
  subscription_tier         subscription_tier not null default 'free',
  stripe_customer_id        text unique,
  stripe_subscription_id    text unique,
  subscription_status       text check (
                              subscription_status in (
                                'active', 'canceled', 'past_due',
                                'trialing', 'incomplete', 'unpaid'
                              )
                            ),
  subscription_period_end   timestamptz,

  -- Usage counters (reset monthly via cron)
  evaluations_used_this_month   integer not null default 0,
  cvs_generated_this_month      integer not null default 0,
  pipeline_count                integer not null default 0,

  -- Onboarding
  onboarding_completed      boolean not null default false,
  onboarding_completed_at   timestamptz
);

comment on table public.users is
  'Application-level user record. Mirrors auth.users id. '
  'Stores subscription tier, Stripe IDs, and monthly usage counters.';

-- Auto-create a users row when someone signs up via Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', null)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Keep updated_at current
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_updated_at
  before update on public.users
  for each row execute procedure public.set_updated_at();

-- ─── User Profiles ────────────────────────────────────────────────────────────

create table if not exists public.user_profiles (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   uuid not null unique references public.users (id) on delete cascade,

  -- Identity & Location
  nationality               text,
  current_country           text,
  target_countries          text[] not null default '{}',

  -- Visa Intent
  requires_visa_sponsorship boolean not null default false,
  current_visa_status       text,  -- e.g. 'citizen', 'settled', 'student', 'skilled_worker', etc.

  -- Job Preferences
  job_titles                text[] not null default '{}',  -- target job titles
  preferred_job_types       text[] not null default '{}',  -- full_time, part_time, contract, freelance
  preferred_locations       text[] not null default '{}',

  -- Skills & Qualifications
  skills                    text[] not null default '{}',
  qualifications            jsonb not null default '[]',
  -- qualifications schema: [{ title, institution, year, rqfLevel }]
  years_experience          integer,

  -- Salary
  target_salary_min         integer,
  target_salary_currency    text default 'GBP',

  -- Career Summary (human-written or AI-extracted from CV)
  career_summary            text,

  -- CV
  raw_cv_url                text,   -- Supabase Storage URL to uploaded CV file
  cv_uploaded_at            timestamptz,
  cv_parsed_data            jsonb,
  -- cv_parsed_data schema: {
  --   rawText, skills[], qualifications[], experienceYears,
  --   currentTitle, currentCompany, educationLevel,
  --   languages[], summary, workHistory[]
  -- }

  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

comment on table public.user_profiles is
  'Extended user profile: location, visa intent, skills, CV data. '
  'One-to-one with users. Created lazily during onboarding.';

comment on column public.user_profiles.qualifications is
  'Array of { title, institution, year, rqfLevel } objects.';

comment on column public.user_profiles.cv_parsed_data is
  'Structured data extracted from uploaded CV by Claude Haiku.';

create trigger user_profiles_updated_at
  before update on public.user_profiles
  for each row execute procedure public.set_updated_at();
