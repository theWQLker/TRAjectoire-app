-- ===========================================================================
-- 0005 — rome_mobilites: keep the Proche/Evolution mobility distinction
-- ===========================================================================
-- The "Mobilités possibles entre deux métiers ROME" CSV labels every edge with
-- a CHANGE_TYPE_NAME: 'Proche' (lateral move) or 'Evolution' (step up). That is
-- a real signal — like major/minor RIASEC — so the mobilité leap (§6.2.C) can
-- later weight a lateral move differently from a promotion. Store it.
--
-- Additive ALTER (not a 0003 reset): real referential data exists. Nullable so
-- any pre-existing edges (none expected yet) stay valid; the loader populates it.
-- ===========================================================================

alter table rome_mobilites
  add column if not exists mobility_type text;

-- Constrain to the two known CSV values (NULL allowed for legacy/unknown).
-- drop-then-add so re-running is safe.
alter table rome_mobilites
  drop constraint if exists rome_mobilites_type_check;
alter table rome_mobilites
  add constraint rome_mobilites_type_check
  check (mobility_type is null or mobility_type in ('Proche', 'Evolution'));
