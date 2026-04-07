-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 003: Evaluations
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.evaluations (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   uuid not null references public.users (id) on delete cascade,

  -- Job Identity
  job_url                   text,
  job_title                 text not null,
  company_name              text not null,
  location                  text,
  salary_advertised         integer,   -- GBP per year
  salary_currency           text default 'GBP',
  job_description           text not null,

  -- ─── 10 Scoring Dimensions (1.0–5.0, one decimal place) ──────────────────
  -- Gate-pass dimensions: if either < 2.0 → overall_score capped at 3.0
  score_role_match          numeric(2,1) not null check (score_role_match between 1.0 and 5.0),
  score_skills_alignment    numeric(2,1) not null check (score_skills_alignment between 1.0 and 5.0),
  -- Remaining dimensions
  score_experience_level    numeric(2,1) not null check (score_experience_level between 1.0 and 5.0),
  score_growth_trajectory   numeric(2,1) not null check (score_growth_trajectory between 1.0 and 5.0),
  score_culture_fit         numeric(2,1) not null check (score_culture_fit between 1.0 and 5.0),
  score_compensation        numeric(2,1) not null check (score_compensation between 1.0 and 5.0),
  score_location_fit        numeric(2,1) not null check (score_location_fit between 1.0 and 5.0),
  score_company_stage       numeric(2,1) not null check (score_company_stage between 1.0 and 5.0),
  score_role_impact         numeric(2,1) not null check (score_role_impact between 1.0 and 5.0),
  score_long_term_value     numeric(2,1) not null check (score_long_term_value between 1.0 and 5.0),

  -- ─── 11th Dimension: Visa (only populated when requires_visa_sponsorship) ─
  score_visa_feasibility    numeric(2,1) check (
                              score_visa_feasibility is null
                              or score_visa_feasibility between 1.0 and 5.0
                            ),
  visa_status               visa_verdict,
  visa_details              jsonb,
  -- visa_details schema: {
  --   sponsorLicenceCheck: { found, isArated, hasCorrectRoute, fuzzyMatchScore },
  --   socEligibilityCheck: { detectedSocCode, detectedSocTitle, isEligible, requiresTsl, tslExpiry },
  --   salaryCheck: { advertisedSalary, generalThreshold, goingRate, meetsThreshold },
  --   sponsorDataLastUpdatedAt, eligibilityRulesLastVerifiedAt, disclaimer
  -- }

  -- ─── Results ─────────────────────────────────────────────────────────────
  overall_score             numeric(2,1) not null check (overall_score between 1.0 and 5.0),
  grade                     evaluation_grade not null,
  recommendation            evaluation_recommendation not null,
  evaluation_summary        text not null,

  -- Gap report: mandatory when recommendation is 'not_yet' or 'dont_apply'
  gap_report                jsonb,
  -- gap_report schema: {
  --   gaps: [{ dimension, score, issue, actionableGuidance, estimatedTimeToClose }],
  --   similarRoles: [{ title, reason, suggestedSocCode }],
  --   visaAlternatives: [{ socCode, socTitle, reason, visaRoute }]
  -- }

  -- Growth roadmap: Pro + Global tier only
  growth_roadmap            jsonb,
  -- growth_roadmap schema: [{ timeframe, milestone, actions[] }]

  -- Context snapshot at time of evaluation
  requires_visa_sponsorship_at_eval boolean not null default false,

  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),

  -- Prevent re-evaluating the same job+user combination
  -- (soft uniqueness — application enforces this before INSERT)
  constraint evaluations_check_gap_report check (
    recommendation not in ('not_yet', 'dont_apply') or gap_report is not null
  )
);

comment on table public.evaluations is
  'AI evaluation results. 10 core dimensions + optional visa dimension. '
  'Gap report is mandatory for not_yet / dont_apply recommendations. '
  'Cache key: user_id + job_url (enforced at application layer).';

comment on column public.evaluations.score_role_match is
  'Gate-pass dimension. If < 2.0, overall_score is capped at 3.0 regardless of other scores.';

comment on column public.evaluations.score_skills_alignment is
  'Gate-pass dimension. If < 2.0, overall_score is capped at 3.0 regardless of other scores.';

comment on column public.evaluations.gap_report is
  'Mandatory when recommendation is not_yet or dont_apply. '
  'Contains gaps, actionable guidance, similar roles, and visa alternatives.';

create trigger evaluations_updated_at
  before update on public.evaluations
  for each row execute procedure public.set_updated_at();
