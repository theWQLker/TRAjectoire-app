-- ---------------------------------------------------------------------------
-- 0007_rome_check.sql — rolling ROME referential check.
--
--   A daily cron (/api/cron/rome-check) re-fetches a slice of fiches from the
--   France Travail ROME API so the whole referential is re-checked about once a
--   month, and new / retired codes are picked up the day they appear.
--
--   checked_at  — last time this fiche was re-fetched from the API (null = never
--                 since the initial ingest). The cron takes the oldest first.
--   obsolete_at — set when France Travail retires the code (gone from the list,
--                 or the fiche carries obsolete=true). Null = active. Retired
--                 codes are kept, never deleted, and the engine skips them.
-- ---------------------------------------------------------------------------

alter table rome_jobs add column if not exists checked_at  timestamptz;
alter table rome_jobs add column if not exists obsolete_at timestamptz;

create index if not exists idx_rome_jobs_checked on rome_jobs (checked_at nulls first);
