-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 005: Pipeline (Application Tracker)
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.pipeline (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.users (id) on delete cascade,
  evaluation_id       uuid references public.evaluations (id) on delete set null,

  -- Job identity (denormalised for display without joining evaluations)
  company_name        text not null,
  job_title           text not null,
  job_url             text,

  -- Status
  status              pipeline_status not null default 'evaluated',
  applied_at          timestamptz,

  -- Visa context (snapshot at time of adding to pipeline)
  visa_status         visa_verdict,

  -- Interview scheduling
  interview_dates     jsonb not null default '[]',
  -- interview_dates schema: [{ type, scheduledAt, notes }]
  -- type: 'phone_screen' | 'technical' | 'final' | 'offer_call'

  -- Notes & strategy
  notes               text,
  star_stories        jsonb not null default '[]',
  -- star_stories schema: [{ competency, situation, task, action, result, quantifiedImpact }]

  negotiation_notes   jsonb not null default '{}',
  -- negotiation_notes schema: {
  --   targetSalary, currentOffer, leverage[], walkawayPoint, notes
  -- }

  -- Next action reminder
  next_action_at      timestamptz,
  next_action_note    text,

  -- Sponsor Watch opt-in (post-placement monitoring)
  sponsor_watch_opt_in boolean not null default false,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.pipeline is
  'Application tracker. Status moves: evaluated → applying → applied → '
  'interviewing → offer → [hired | rejected | withdrawn]. '
  'Free tier limited to 10 items (enforced at application layer).';

comment on column public.pipeline.interview_dates is
  'Array of { type, scheduledAt, notes } interview events.';

comment on column public.pipeline.star_stories is
  'STAR-format interview stories: { competency, situation, task, action, result, quantifiedImpact }.';

create trigger pipeline_updated_at
  before update on public.pipeline
  for each row execute procedure public.set_updated_at();
