-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 006: Interview Prep
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.interview_prep (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.users (id) on delete cascade,
  evaluation_id       uuid not null references public.evaluations (id) on delete cascade,
  pipeline_item_id    uuid references public.pipeline (id) on delete set null,

  star_stories        jsonb not null default '[]',
  -- star_stories schema: [{
  --   competency, situation, task, action, result, quantifiedImpact
  -- }]

  likely_questions    jsonb not null default '[]',
  -- likely_questions schema: [{
  --   question, rationale, suggestedAnswer, difficulty: 'easy'|'medium'|'hard'
  -- }]

  company_research    text,   -- AI-generated or user-written company notes

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.interview_prep is
  'Claude-generated STAR stories and likely interview questions, '
  'linked to a specific evaluation. Pro and Global tiers only.';

create trigger interview_prep_updated_at
  before update on public.interview_prep
  for each row execute procedure public.set_updated_at();
