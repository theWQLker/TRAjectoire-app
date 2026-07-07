-- Career Direction Engine — initial schema (PRD §10)
-- ROME names. The market decides. The user chooses.
--
-- offers_cache.competences is jsonb so the offer-level overlap query
-- (PRD §6.3 intersection engine) runs in Postgres.

-- ---------------------------------------------------------------------------
-- ROME taxonomy
-- ---------------------------------------------------------------------------

create table if not exists rome_jobs (
  rome_code         text primary key,
  title             text not null,
  definition        text,
  domain            text,
  access_conditions text,
  certifications    text
);

create table if not exists rome_competences (
  code    text primary key,
  libelle text not null,
  type    text          -- e.g. savoir-faire / savoir-etre
);

-- ---------------------------------------------------------------------------
-- Competency clusters (PRD §6.1) — named sets of ROME competency codes
-- ---------------------------------------------------------------------------

create table if not exists clusters (
  id    text primary key,
  label text not null
);

create table if not exists cluster_competences (
  cluster_id      text not null references clusters (id) on delete cascade,
  competence_code text not null,
  primary key (cluster_id, competence_code)
);

create index if not exists idx_cluster_competences_code
  on cluster_competences (competence_code);

-- ---------------------------------------------------------------------------
-- Cached offers (PRD §6.2 / §10). Shaped from the France Travail Offres API v2
-- via the OfferSource seam — the engine reads these, never the API directly.
-- ---------------------------------------------------------------------------

create table if not exists offers_cache (
  id               text primary key,
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

create index if not exists idx_offers_cache_rome_dept
  on offers_cache (rome_code, departement);

-- GIN index supports the jsonb overlap / containment queries used by the
-- intersection engine over offers_cache.competences.
create index if not exists idx_offers_cache_competences
  on offers_cache using gin (competences);

-- ---------------------------------------------------------------------------
-- Offer counts (PRD §6.2 marketDemand = header total / fixture count)
-- ---------------------------------------------------------------------------

create table if not exists offer_counts (
  rome_code   text not null,
  departement text not null,
  total_count integer not null default 0,
  snapshot_at timestamptz not null default now(),
  primary key (rome_code, departement)
);

-- ---------------------------------------------------------------------------
-- Quiz sessions (PRD §5 / §10)
-- ---------------------------------------------------------------------------

create table if not exists quiz_sessions (
  id          uuid primary key default gen_random_uuid(),
  shape       text check (shape in ('A', 'B')),
  answers     jsonb not null default '{}'::jsonb,
  constraints jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Recommendations (PRD §6.4 ranking, not verdicts / §10)
-- ---------------------------------------------------------------------------

create table if not exists recommendations (
  id                    uuid primary key default gen_random_uuid(),
  session_id            uuid not null references quiz_sessions (id) on delete cascade,
  rome_code             text not null,
  category              text,  -- apply_now / bridge / long_term / not_now (PRD §8)
  rank                  integer,
  requirement_profile   jsonb not null default '{}'::jsonb,
  intersection_clusters jsonb not null default '[]'::jsonb,
  created_at            timestamptz not null default now()
);

create index if not exists idx_recommendations_session
  on recommendations (session_id);
