-- ---------------------------------------------------------------------------
-- 0010_rome_appellations_opendata.sql — ROME 4.0 appellations from open data.
--
--   The 34-row table (labels, no codes) is replaced by the full France Travail
--   ROME open-data appellation list (≈ 14,330 rows, Licence Ouverte 2.0), loaded
--   by scripts/import-rome-appellations.ts. Additive only: no column is dropped,
--   so the legacy rows stay readable until the import removes them.
--
--   code_ogr       France Travail's stable appellation id (unique; null only on
--                  the legacy rows, which the import deletes)
--   label          long label (existing column), e.g. "Gestionnaire paie"
--   label_short    short label from the same file
--   classification PRINCIPALE (one per ROME code) | SYNONYME
--   peu_usite      France Travail's "rarely used" flag
--   rome_version   ROME open-data version number the row came from, e.g. '62'
--   published_on   publication date of that version — the date the credit
--                  "Source : France Travail, ROME" shows
--
--   Numbered 0010 so it never collides with 0008/0009 on the market-data branch.
-- ---------------------------------------------------------------------------

alter table rome_appellations add column if not exists code_ogr       text;
alter table rome_appellations add column if not exists label_short    text;
alter table rome_appellations add column if not exists classification text;
alter table rome_appellations add column if not exists peu_usite      boolean not null default false;
alter table rome_appellations add column if not exists rome_version   text;
alter table rome_appellations add column if not exists published_on   date;

create unique index if not exists uq_appellations_code_ogr on rome_appellations (code_ogr);
