-- Leap-graph referential + schema realignment (PRD §3b, §6, §10 rewrite).
--
-- Supersedes the intersection design: adds the ROME leap-graph tables the
-- engine traverses (skill-bridge, mobilité, RIASEC), and realigns
-- quiz_sessions / recommendations to the rewritten §10.
-- Append-only migration (0001 may already have run).

-- ---------------------------------------------------------------------------
-- ROME referential — the leap-graph (PRD §3b / §10)
-- ---------------------------------------------------------------------------

-- métier ↔ skill edges. Indexed BOTH ways so "which métiers share this
-- competence" (skill-bridge, §6.2.B) is fast.
create table if not exists rome_job_competences (
  rome_code       text not null references rome_jobs (rome_code) on delete cascade,
  competence_code text not null references rome_competences (code) on delete cascade,
  primary key (rome_code, competence_code)
);

create index if not exists idx_rome_job_competences_competence
  on rome_job_competences (competence_code);
create index if not exists idx_rome_job_competences_rome
  on rome_job_competences (rome_code);

-- curated adjacency edges (mobilité leap, §6.2.C). Directed from -> to.
create table if not exists rome_mobilites (
  from_rome_code text not null references rome_jobs (rome_code) on delete cascade,
  to_rome_code   text not null references rome_jobs (rome_code) on delete cascade,
  primary key (from_rome_code, to_rome_code)
);

create index if not exists idx_rome_mobilites_to
  on rome_mobilites (to_rome_code);

-- Holland interest profile, CSV-seeded (PRD §3b, §6.2.D). One row per code.
create table if not exists rome_riasec (
  rome_code   text not null references rome_jobs (rome_code) on delete cascade,
  riasec_code text not null check (riasec_code in ('R', 'I', 'A', 'S', 'E', 'C')),
  primary key (rome_code, riasec_code)
);

-- ---------------------------------------------------------------------------
-- Realign session + output tables to the rewritten §10
-- ---------------------------------------------------------------------------

-- quiz_sessions gains the computed inventory (§6.1).
alter table quiz_sessions
  add column if not exists inventory jsonb not null default '{}'::jsonb;

-- recommendations is now leap-graph shaped: coverage + leap_type + plain why,
-- replacing the retired intersection_clusters column (§6.3 / §6.7).
alter table recommendations
  add column if not exists coverage numeric,
  add column if not exists leap_type text,  -- direct / skill_bridge / mobilite / interest
  add column if not exists why text;

alter table recommendations
  drop column if exists intersection_clusters;
