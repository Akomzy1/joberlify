-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 010: Granular location preferences on user_profiles
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.user_profiles
  add column if not exists current_city              text,
  add column if not exists target_locations          jsonb not null default '[]',
  -- [{country: 'GB', cities: ['London', 'Manchester'], anywhere: false}]
  add column if not exists remote_preference         text not null default 'open'
    check (remote_preference in ('onsite_only', 'hybrid', 'remote_only', 'open')),
  add column if not exists willingness_to_relocate   boolean not null default true,
  add column if not exists max_commute_miles         integer check (max_commute_miles is null or max_commute_miles > 0);

comment on column public.user_profiles.target_locations is
  'Array of {country, cities[], anywhere} objects. '
  'anywhere=true means no city restriction within that country.';

comment on column public.user_profiles.remote_preference is
  'onsite_only | hybrid | remote_only | open';

comment on column public.user_profiles.max_commute_miles is
  'null = no limit (or irrelevant for remote-only candidates).';
