-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 001: Extensions & Enums
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable pg_trgm for fuzzy name matching on uk_sponsors
create extension if not exists pg_trgm;

-- Enable uuid-ossp (fallback; gen_random_uuid() is built-in on PG14+)
create extension if not exists "uuid-ossp";

-- ─── Enums ───────────────────────────────────────────────────────────────────

create type subscription_tier as enum ('free', 'pro', 'global');

create type pipeline_status as enum (
  'evaluated',
  'applying',
  'applied',
  'interviewing',
  'offer',
  'rejected',
  'withdrawn',
  'hired'
);

create type evaluation_grade as enum ('A', 'B', 'C', 'D', 'F');

create type evaluation_recommendation as enum (
  'apply',
  'consider',
  'not_yet',
  'dont_apply'
);

create type visa_verdict as enum (
  'confirmed',   -- licensed + SOC eligible + salary ok + listing mentions sponsorship
  'likely',      -- licensed + eligible + salary ok, listing silent on sponsorship
  'uncertain',   -- licensed but SOC borderline or salary unclear
  'unlikely',    -- not on register, or SOC ineligible, or salary below threshold
  'blocked'      -- definitively ineligible (Table 6 / no entry clearance)
);

create type sponsor_change_type as enum (
  'added',
  'removed',
  'rating_changed',
  'route_changed'
);

create type cv_format as enum (
  'chronological',
  'skills_based',
  'hybrid'
);
