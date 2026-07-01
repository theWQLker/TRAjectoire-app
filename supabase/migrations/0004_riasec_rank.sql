-- ===========================================================================
-- 0004 — rome_riasec: keep the major/minor RIASEC distinction
-- ===========================================================================
-- The codification-riasec-des-metiers-rome.csv gives each métier a MAJOR and a
-- MINOR RIASEC letter. The interest leap (§6.2.D) must weight a major match
-- above a minor one, so the distinction has to survive into the table.
--
-- Additive ALTER (not a 0003 reset): real referential data now exists, so we
-- evolve the table in place rather than dropping it.
--   * add `rank` ∈ {major, minor}
--   * widen the PK to (rome_code, riasec_code, rank) so a métier can carry the
--     same letter as both (rare, but the model must allow it) and, normally,
--     two rows: one major + one minor.
--
-- Backfill: existing rows (seeded flat, no rank) become 'major' so nothing is
-- lost and the not-null constraint holds. Re-running loadRiasecCsv replaces them
-- with the real major/minor split (it upserts on the new PK).
-- ===========================================================================

alter table rome_riasec
  add column if not exists rank text;

-- Backfill any pre-existing rows before enforcing not-null + check.
update rome_riasec set rank = 'major' where rank is null;

alter table rome_riasec
  alter column rank set not null;

-- Drop the old 2-col PK and install the 3-col PK (idempotent-ish: guarded).
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'rome_riasec_pkey'
      and conrelid = 'rome_riasec'::regclass
  ) then
    alter table rome_riasec drop constraint rome_riasec_pkey;
  end if;
end $$;

alter table rome_riasec
  add constraint rome_riasec_pkey primary key (rome_code, riasec_code, rank);

-- Constrain rank values (drop-then-add so re-running is safe).
alter table rome_riasec
  drop constraint if exists rome_riasec_rank_check;
alter table rome_riasec
  add constraint rome_riasec_rank_check check (rank in ('major', 'minor'));

-- Reverse lookup "métiers whose interest profile includes letter X at rank Y".
create index if not exists idx_riasec_code_rank
  on rome_riasec (riasec_code, rank);
