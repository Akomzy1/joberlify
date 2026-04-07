-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 008: Row Level Security Policies
-- ─────────────────────────────────────────────────────────────────────────────
-- Rule: users can only access their own data.
-- uk_sponsors + uk_soc_codes: SELECT-only for authenticated users.
-- sponsor_changes: internal only — no user access.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Enable RLS on all tables ────────────────────────────────────────────────

alter table public.users            enable row level security;
alter table public.user_profiles    enable row level security;
alter table public.evaluations      enable row level security;
alter table public.generated_cvs    enable row level security;
alter table public.pipeline         enable row level security;
alter table public.interview_prep   enable row level security;
alter table public.sponsor_watch    enable row level security;
alter table public.uk_sponsors      enable row level security;
alter table public.uk_soc_codes     enable row level security;
alter table public.sponsor_changes  enable row level security;

-- ─── users ───────────────────────────────────────────────────────────────────

create policy "users: select own row"
  on public.users for select
  using (auth.uid() = id);

create policy "users: update own row"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No direct INSERT (handled by trigger on auth.users).
-- No direct DELETE (cascade from auth.users).

-- ─── user_profiles ───────────────────────────────────────────────────────────

create policy "user_profiles: select own"
  on public.user_profiles for select
  using (auth.uid() = user_id);

create policy "user_profiles: insert own"
  on public.user_profiles for insert
  with check (auth.uid() = user_id);

create policy "user_profiles: update own"
  on public.user_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_profiles: delete own"
  on public.user_profiles for delete
  using (auth.uid() = user_id);

-- ─── evaluations ─────────────────────────────────────────────────────────────

create policy "evaluations: select own"
  on public.evaluations for select
  using (auth.uid() = user_id);

create policy "evaluations: insert own"
  on public.evaluations for insert
  with check (auth.uid() = user_id);

create policy "evaluations: update own"
  on public.evaluations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "evaluations: delete own"
  on public.evaluations for delete
  using (auth.uid() = user_id);

-- ─── generated_cvs ───────────────────────────────────────────────────────────

create policy "generated_cvs: select own"
  on public.generated_cvs for select
  using (auth.uid() = user_id);

create policy "generated_cvs: insert own"
  on public.generated_cvs for insert
  with check (auth.uid() = user_id);

create policy "generated_cvs: delete own"
  on public.generated_cvs for delete
  using (auth.uid() = user_id);

-- No UPDATE — CVs are immutable once generated (create a new one to regenerate).

-- ─── pipeline ────────────────────────────────────────────────────────────────

create policy "pipeline: select own"
  on public.pipeline for select
  using (auth.uid() = user_id);

create policy "pipeline: insert own"
  on public.pipeline for insert
  with check (auth.uid() = user_id);

create policy "pipeline: update own"
  on public.pipeline for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "pipeline: delete own"
  on public.pipeline for delete
  using (auth.uid() = user_id);

-- ─── interview_prep ──────────────────────────────────────────────────────────

create policy "interview_prep: select own"
  on public.interview_prep for select
  using (auth.uid() = user_id);

create policy "interview_prep: insert own"
  on public.interview_prep for insert
  with check (auth.uid() = user_id);

create policy "interview_prep: update own"
  on public.interview_prep for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "interview_prep: delete own"
  on public.interview_prep for delete
  using (auth.uid() = user_id);

-- ─── sponsor_watch ───────────────────────────────────────────────────────────

create policy "sponsor_watch: select own"
  on public.sponsor_watch for select
  using (auth.uid() = user_id);

create policy "sponsor_watch: insert own"
  on public.sponsor_watch for insert
  with check (auth.uid() = user_id);

create policy "sponsor_watch: update own"
  on public.sponsor_watch for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "sponsor_watch: delete own"
  on public.sponsor_watch for delete
  using (auth.uid() = user_id);

-- ─── uk_sponsors: SELECT-only for authenticated users ────────────────────────

create policy "uk_sponsors: authenticated read-only"
  on public.uk_sponsors for select
  using (auth.role() = 'authenticated');

-- No INSERT / UPDATE / DELETE policies → only service_role key can write.

-- ─── uk_soc_codes: SELECT-only for authenticated users ───────────────────────

create policy "uk_soc_codes: authenticated read-only"
  on public.uk_soc_codes for select
  using (auth.role() = 'authenticated');

-- ─── sponsor_changes: internal only — zero user access ───────────────────────
-- No policies added → RLS blocks all access.
-- Only the service_role key (used by cron) can read/write this table.
