-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 009: Performance Indexes
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── users ───────────────────────────────────────────────────────────────────

create index if not exists idx_users_stripe_customer_id
  on public.users (stripe_customer_id)
  where stripe_customer_id is not null;

create index if not exists idx_users_subscription_tier
  on public.users (subscription_tier);

-- ─── user_profiles ───────────────────────────────────────────────────────────

-- user_id is unique so already has a unique index; no additional needed.
-- GIN index for skills array search
create index if not exists idx_user_profiles_skills
  on public.user_profiles using gin (skills);

create index if not exists idx_user_profiles_target_countries
  on public.user_profiles using gin (target_countries);

-- ─── evaluations ─────────────────────────────────────────────────────────────

-- Primary query pattern: all evaluations for a user, newest first
create index if not exists idx_evaluations_user_created
  on public.evaluations (user_id, created_at desc);

-- Cache lookup: same job URL + user (prevent re-evaluation)
create index if not exists idx_evaluations_user_job_url
  on public.evaluations (user_id, job_url)
  where job_url is not null;

-- Filter by recommendation (e.g. show only 'apply' items)
create index if not exists idx_evaluations_user_recommendation
  on public.evaluations (user_id, recommendation);

-- ─── generated_cvs ───────────────────────────────────────────────────────────

create index if not exists idx_generated_cvs_user_id
  on public.generated_cvs (user_id, created_at desc);

create index if not exists idx_generated_cvs_evaluation_id
  on public.generated_cvs (evaluation_id);

-- ─── pipeline ────────────────────────────────────────────────────────────────

-- Primary query pattern: kanban board for a user
create index if not exists idx_pipeline_user_status
  on public.pipeline (user_id, status);

-- Sort by updated_at for activity feed
create index if not exists idx_pipeline_user_updated
  on public.pipeline (user_id, updated_at desc);

-- Sponsor watch join
create index if not exists idx_pipeline_evaluation_id
  on public.pipeline (evaluation_id)
  where evaluation_id is not null;

-- ─── interview_prep ──────────────────────────────────────────────────────────

create index if not exists idx_interview_prep_user_id
  on public.interview_prep (user_id);

create index if not exists idx_interview_prep_evaluation_id
  on public.interview_prep (evaluation_id);

-- ─── sponsor_watch ───────────────────────────────────────────────────────────

create index if not exists idx_sponsor_watch_user_id
  on public.sponsor_watch (user_id);

create index if not exists idx_sponsor_watch_active
  on public.sponsor_watch (user_id, is_active)
  where is_active = true;

-- ─── uk_sponsors ─────────────────────────────────────────────────────────────

-- Trigram index for fuzzy company name matching (pg_trgm required — see migration 001)
create index if not exists idx_uk_sponsors_name_trgm
  on public.uk_sponsors using gin (organisation_name gin_trgm_ops);

-- Exact name lookup (case-insensitive)
create index if not exists idx_uk_sponsors_name_lower
  on public.uk_sponsors (lower(organisation_name));

-- Filter by route + rating (most common eligibility query pattern)
create index if not exists idx_uk_sponsors_route_rating
  on public.uk_sponsors (route, rating)
  where is_active = true;

-- Active sponsors only (large table — partial index saves space)
create index if not exists idx_uk_sponsors_active
  on public.uk_sponsors (is_active)
  where is_active = true;

-- ─── uk_soc_codes ────────────────────────────────────────────────────────────

-- soc_code is PK — already indexed.

-- Filter by eligibility (most queries filter out table6)
create index if not exists idx_uk_soc_codes_eligible
  on public.uk_soc_codes (eligibility_table, rqf_level)
  where is_eligible = true;

-- TSL lookup
create index if not exists idx_uk_soc_codes_tsl
  on public.uk_soc_codes (on_temporary_shortage_list, tsl_expiry_date)
  where on_temporary_shortage_list = true;

-- ─── sponsor_changes ─────────────────────────────────────────────────────────

-- Daily diff queries and alert generation
create index if not exists idx_sponsor_changes_detected_at
  on public.sponsor_changes (detected_at desc);

create index if not exists idx_sponsor_changes_name_type
  on public.sponsor_changes (organisation_name, change_type);
