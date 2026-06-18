-- ===========================================================================
-- Career Direction Engine — consolidated schema (matches SCHEMA.md)
-- ===========================================================================
-- Four zones by change-rate (SCHEMA.md): ROME referential (leap-graph),
-- quiz config mirror, market cache (append-only + current view), per-user
-- runtime. Merges the still-valid v1 pieces (appellations, skill weight,
-- evidence confidence, forward market fields). Retires the verdict-era design.
--
-- INVARIANTS:
--   * NO verdict / disqualifier / final_score column anywhere.
--   * Leap graph (rome_job_competences + rome_mobilites + rome_riasec) is the
--     only surfacing mechanism. No interest_*_map tables.
--   * RLS deny-by-default on every table; all access via the service-role key.
--
-- Supersedes 0001 + 0002 as the single source of truth.
--
-- ⚠️ RESET MIGRATION. This DROPS the old 0001/0002 tables first, then recreates
-- everything in the new shape. Necessary because `create table if not exists`
-- SILENTLY SKIPS a table that already exists in the OLD shape (e.g. offers_cache
-- had `id text` PK; the new design needs `pk_id` + `offer_id`) — which is exactly
-- the "column offer_id does not exist" error. Dropping guarantees the new shape.
--
-- SAFE NOW: the project holds only old seed/scaffolding, no real data. Re-running
-- is idempotent. DO NOT run this verbatim once real session/offer data exists —
-- at that point write a proper ALTER migration instead.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- RESET — drop old objects (view first, then tables; cascade covers FKs).
-- ---------------------------------------------------------------------------
drop view if exists current_offers;
drop table if exists recommendations     cascade;
drop table if exists session_evidence    cascade;
drop table if exists quiz_sessions        cascade;
drop table if exists offer_counts         cascade;
drop table if exists offers_cache         cascade;
drop table if exists ingest_runs          cascade;
drop table if exists cluster_competences  cascade;
drop table if exists clusters             cascade;
drop table if exists rome_riasec          cascade;
drop table if exists rome_mobilites       cascade;
drop table if exists rome_job_competences cascade;
drop table if exists rome_appellations    cascade;
drop table if exists rome_competences     cascade;
drop table if exists rome_jobs            cascade;

-- ---------------------------------------------------------------------------
-- ZONE 1 — ROME referential (the leap-graph). Slow: ~2x/year.
-- ---------------------------------------------------------------------------

create table if not exists rome_jobs (
  rome_code         text primary key,
  title             text not null,
  definition        text,
  domain            text,
  domain_code       text,            -- ROME grand-domaine letter (e.g. "M")
  access_conditions text,
  certifications    text
);

-- job-title variants (merged from v1)
create table if not exists rome_appellations (
  id        bigint generated always as identity primary key,
  rome_code text not null references rome_jobs (rome_code) on delete cascade,
  label     text not null
);
create index if not exists idx_appellations_rome on rome_appellations (rome_code);

create table if not exists rome_competences (
  code    text primary key,
  libelle text not null,
  type    text                       -- savoir-faire / savoirs / savoir-être
);

-- métier <-> skill edges. THE skill-bridge index (indexed both ways).
-- weight (merged from v1) feeds weighted coverage (§6.3). NOT a verdict.
create table if not exists rome_job_competences (
  rome_code       text not null references rome_jobs (rome_code) on delete cascade,
  competence_code text not null references rome_competences (code) on delete cascade,
  weight          numeric not null default 1.0,
  primary key (rome_code, competence_code)
);
create index if not exists idx_rjc_competence on rome_job_competences (competence_code);
create index if not exists idx_rjc_rome        on rome_job_competences (rome_code);

-- curated adjacency (mobilité leap). Directed.
create table if not exists rome_mobilites (
  from_rome_code text not null references rome_jobs (rome_code) on delete cascade,
  to_rome_code   text not null references rome_jobs (rome_code) on delete cascade,
  primary key (from_rome_code, to_rome_code)
);
create index if not exists idx_mob_to on rome_mobilites (to_rome_code);

-- Holland interest profile (CSV-seeded, NOT an API call).
create table if not exists rome_riasec (
  rome_code   text not null references rome_jobs (rome_code) on delete cascade,
  riasec_code text not null check (riasec_code in ('R','I','A','S','E','C')),
  primary key (rome_code, riasec_code)
);

-- ---------------------------------------------------------------------------
-- ZONE 2 — quiz config mirror. Slow: on deploy.
-- ---------------------------------------------------------------------------

create table if not exists clusters (
  id    text primary key,
  label text not null
);

create table if not exists cluster_competences (
  cluster_id      text not null references clusters (id) on delete cascade,
  competence_code text not null,            -- ROME code by value (drift-tolerant)
  primary key (cluster_id, competence_code)
);
create index if not exists idx_cc_competence on cluster_competences (competence_code);

-- ---------------------------------------------------------------------------
-- ZONE 3 — market cache. Fast: scheduled ingest. Append-only + current view.
-- ---------------------------------------------------------------------------

-- audit of each ingest run (operationally essential for partial failures)
create table if not exists ingest_runs (
  id           uuid primary key default gen_random_uuid(),
  source       text not null,               -- 'offres' | 'rome'
  scope        jsonb not null default '{}'::jsonb,
  started_at   timestamptz not null default now(),
  finished_at  timestamptz,
  ok           boolean,
  rows_written integer,
  error        text
);

-- append-only offer bodies. competences stays jsonb (drifts from ROME), GIN-indexed.
create table if not exists offers_cache (
  pk_id            bigint generated always as identity primary key,
  offer_id         text not null,
  batch_id         uuid references ingest_runs (id) on delete set null,
  rome_code        text not null,
  departement      text not null,
  intitule         text not null,
  type_contrat     text,
  competences      jsonb not null default '[]'::jsonb,
  experience_exige text,                                  -- D / E / S
  formations       jsonb not null default '[]'::jsonb,
  qualites         jsonb not null default '[]'::jsonb,
  permis           jsonb not null default '[]'::jsonb,
  date_creation    timestamptz,
  fetched_at       timestamptz not null default now()
);
create index if not exists idx_oc_rome_dept_fetched
  on offers_cache (rome_code, departement, fetched_at desc);
create index if not exists idx_oc_competences on offers_cache using gin (competences);
create index if not exists idx_oc_offer_id on offers_cache (offer_id);

-- the engine reads THIS, not the base table: latest batch per (rome, dept).
create or replace view current_offers as
select oc.*
from offers_cache oc
join (
  select rome_code, departement, max(fetched_at) as latest
  from offers_cache
  group by rome_code, departement
) m
  on oc.rome_code = m.rome_code
 and oc.departement = m.departement
 and oc.fetched_at = m.latest;

-- demand time-series (counts, not bodies). Phase-2 tension fields NULL now.
create table if not exists offer_counts (
  rome_code              text not null,
  departement            text not null,
  total_count            integer not null default 0,   -- Content-Range header total
  median_salary          numeric,                       -- Phase-2 (Marché du Travail), NULL now
  recruitment_difficulty text,                          -- Phase-2 signal (not a score), NULL now
  batch_id               uuid references ingest_runs (id) on delete set null,
  snapshot_at            timestamptz not null default now(),
  primary key (rome_code, departement, snapshot_at)
);
create index if not exists idx_counts_latest
  on offer_counts (rome_code, departement, snapshot_at desc);

-- ---------------------------------------------------------------------------
-- ZONE 4 — per-user runtime.
-- ---------------------------------------------------------------------------

create table if not exists quiz_sessions (
  id                  uuid primary key default gen_random_uuid(),
  shape               text check (shape in ('A','B')),
  answers             jsonb not null default '{}'::jsonb,
  inventory           jsonb not null default '{}'::jsonb,   -- computed Inventory (§6.1)
  constraints         jsonb not null default '{}'::jsonb,
  financial_inputs    jsonb not null default '{}'::jsonb,   -- Cat-5 premium-hook inputs; consumed by NOTHING in MVP (Phase-2 paid model)
  categories_completed text[] not null default '{}',        -- which quiz categories are done (partial-completion / gating)
  created_at          timestamptz not null default now()
);

-- per-proof confidence (merged from v1 user_evidence). Tunes ordering, not a verdict.
create table if not exists session_evidence (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid not null references quiz_sessions (id) on delete cascade,
  cluster_id      text,
  competence_code text,
  confidence      numeric,                  -- 0..1 proof strength
  created_at      timestamptz not null default now()
);
create index if not exists idx_evidence_session on session_evidence (session_id);

-- denormalized output snapshot. coverage + category + why — NEVER a verdict/score.
create table if not exists recommendations (
  id                  uuid primary key default gen_random_uuid(),
  session_id          uuid not null references quiz_sessions (id) on delete cascade,
  rome_code           text not null,
  category            text,                 -- apply_now / bridge / long_term / not_now
  rank                integer,
  coverage            numeric,              -- §6.3 coverage strength (signal, shown)
  leap_type           text,                 -- direct / skill_bridge / mobilite / interest
  why                 text,                 -- plain-language "why surfaced"
  requirement_profile jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now()
);
create index if not exists idx_rec_session on recommendations (session_id);

-- ---------------------------------------------------------------------------
-- SECURITY — RLS deny-by-default on every table (internal tool, PRD §2).
-- No policies => anon key sees nothing; all access via service-role key.
-- ---------------------------------------------------------------------------
alter table rome_jobs            enable row level security;
alter table rome_appellations    enable row level security;
alter table rome_competences     enable row level security;
alter table rome_job_competences enable row level security;
alter table rome_mobilites       enable row level security;
alter table rome_riasec          enable row level security;
alter table clusters             enable row level security;
alter table cluster_competences  enable row level security;
alter table ingest_runs          enable row level security;
alter table offers_cache         enable row level security;
alter table offer_counts         enable row level security;
alter table quiz_sessions        enable row level security;
alter table session_evidence     enable row level security;
alter table recommendations      enable row level security;
