# Database schema — Career Direction Engine

Design doc. Proposes the best Postgres/Supabase schema for this product, with the
reasoning behind every table, column, and index. **No SQL is committed from this
doc yet** — review and sign off, then the migration is written to match.

Governing rule of the product: *ROME names. The market decides. The user chooses.*
The schema's job is to make the engine's traversal + market-reality queries fast,
and to cleanly separate data by how fast it changes and who owns it.

---

## Design principle: four zones by change-rate

The single most important decision. Each zone refreshes on a different cadence,
has a different query shape, and fails differently — so they are kept apart.

| Zone | Tables | Changes | Written by | Read by |
|------|--------|---------|------------|---------|
| **1. ROME referential** (the leap-graph) | `rome_jobs`, `rome_competences`, `rome_job_competences`, `rome_mobilites`, `rome_riasec` | ~twice/year (ROME release) | `LiveRomeSource.ingestAll()` + RIASEC CSV | the engine's traversal (§6.2) |
| **2. Quiz config mirror** | `clusters`, `cluster_competences` | on deploy | seed from `/config/clusters.ts` | quiz → inventory mapping (§6.1) |
| **3. Market cache** | `offers_cache` (append-only) + `current_offers` (view), `offer_counts`, `ingest_runs` | scheduled ingest (often) | `LiveOfferSource.ingest()` | market reality (§6.4) |
| **4. Per-user runtime** | `quiz_sessions`, `recommendations` | per session | quiz server action + engine | the user's `/results` |

Why it matters here specifically:
- **Zone 1 is read-heavy and traversal-shaped**, not CRUD. The schema is built to
  answer *"which métiers share competence X"* (skill-bridge), *"neighbours of X"*
  (mobilité), *"RIASEC overlap"* (interest) in O(log n). Those three queries are
  the product differentiator.
- **Zone 3 changes constantly and is disposable** — it's a cache of an external
  API. Keeping it apart means an ingest failure never touches the referential or
  user data, and the cache can be truncated/rebuilt freely.
- **Offers and ROME are two competence vocabularies that overlap by code but are
  NOT FK-joined** (offer text from France Travail drifts from the ROME taxonomy).

---

## Zone 1 — ROME referential (the leap-graph)

### `rome_jobs` — the nodes
```
rome_code        text  PK         -- e.g. "M1501"
title            text  not null
definition       text
domain           text             -- e.g. "Support à l'entreprise / RH"
domain_code      text             -- ROME grand-domaine letter, e.g. "M" (NEW)
access_conditions text
certifications   text
```
- One row per ROME 4.0 métier (~532). Small enough to sweep entirely.
- `domain_code` (new vs current schema) lets you group/filter by ROME family
  cheaply for future UI facets without parsing `domain` text.

### `rome_appellations` — job-title variants (MERGED from v1)
```
id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY
rome_code  text   FK→rome_jobs(rome_code)  on delete cascade
label      text   not null         -- an appellation, e.g. "Gestionnaire de paie confirmé(e)"

INDEX idx_appellations_rome ON (rome_code)
```
- A ROME métier has one canonical `title` but many real-world **appellations**
  (the Fiches API returns an `appellations` list). These are the strings a user
  actually recognises and the titles that appear in offers. Useful for: matching
  free-text job history to a ROME code later (ROMEO-style), and showing "also
  called…" on a direction. Indexed on `rome_code` for the per-métier lookup.
- Carried over from v1's intent; **not** a verdict/scoring structure.

### `rome_competences` — the canonical skill vocabulary
```
code     text  PK                 -- ROME competency code
libelle  text  not null
type     text                     -- savoir-faire / savoirs / savoir-être
```
- The graph's shared language (§6.1). **Distinct from offer competences** — these
  are the curated ROME taxonomy; offers carry their own drifting text (Zone 3).

### `rome_job_competences` — métier ↔ skill edges (THE skill-bridge index)
```
rome_code        text     FK→rome_jobs(rome_code)        on delete cascade
competence_code  text     FK→rome_competences(code)      on delete cascade
weight           numeric  not null default 1.0   -- per-métier skill importance (MERGED from v1)
PRIMARY KEY (rome_code, competence_code)

INDEX idx_rjc_competence ON (competence_code)   -- reverse: skill → métiers
INDEX idx_rjc_rome       ON (rome_code)          -- forward: métier → skills
```
- **The most important index pair in the product.** The PK covers forward lookup;
  `idx_rjc_competence` powers the skill-bridge (§6.2.B) — *"every métier that lists
  competence X"* — which is exactly how `metiersWithCompetence()` surfaces
  non-obvious directions. Indexed **both ways** by design (PRD §10 note).
- `weight` (merged from v1) is the **per-métier importance of a skill** —
  a "savoir-faire" core to the role weighs more than a peripheral "savoir". It
  feeds **coverage scoring** (§6.3): coverage becomes the weighted fraction of a
  métier's skills the inventory covers, not a flat count, so a direction that
  shares the *central* skills ranks above one sharing trivia. Defaults to `1.0`
  (flat) so the current unweighted coverage behaviour is preserved until weights
  are populated. **This is a fit signal, never a verdict** — it tunes ordering,
  it does not pass/fail (PRD §6.4).

### `rome_mobilites` — curated adjacency (mobilité leap)
```
from_rome_code  text  FK→rome_jobs(rome_code)  on delete cascade
to_rome_code    text  FK→rome_jobs(rome_code)  on delete cascade
PRIMARY KEY (from_rome_code, to_rome_code)

INDEX idx_mob_to ON (to_rome_code)   -- reverse adjacency (incoming moves)
```
- Directed edges from France Travail's `metiersProches` + the open-data mobilités
  dataset. Serves `getMobilites()` (§6.2.C). PK gives outgoing; `idx_mob_to` gives
  incoming (useful for "who can move INTO this role").
- **FK on both ends** is why ingest is two-pass (write all jobs, then edges) — a
  `metiersProches` target is often a code processed later. Already handled in
  `LiveRomeSource.ingestAll()`.

### `rome_riasec` — Holland interest profile (CSV-seeded)
```
rome_code    text  FK→rome_jobs(rome_code)  on delete cascade
riasec_code  text  CHECK in (R,I,A,S,E,C)
PRIMARY KEY (rome_code, riasec_code)
```
- One row per (métier, letter). Serves the interest leap (§6.2.D).
- **CSV-only, never an API call** (PRD §3b/§12) — loaded from
  `referentiel_code_rome_riasec_v4` via `LiveRomeSource.loadRiasecCsv()`.

---

## Zone 2 — quiz config mirror

### `clusters` + `cluster_competences`
```
clusters(id text PK, label text not null)
cluster_competences(cluster_id text FK→clusters, competence_code text,
                    PRIMARY KEY (cluster_id, competence_code))
INDEX idx_cc_competence ON cluster_competences (competence_code)
```
- Mirrors `/config/clusters.ts` into the DB (PRD §6.1). The runtime maps quiz
  answers → cluster ids → competence codes. Today this lives in the TS config and
  the engine reads it directly; the DB copy is for when mapping needs to be
  queried/joined server-side or edited without a deploy.
- `competence_code` here references the ROME vocabulary by value (not FK) — same
  drift tolerance as offers; a cluster may name a code before it's in the graph.

---

## Zone 3 — market cache (append-only + current view)

### `ingest_runs` — audit (NEW; operationally essential)
```
id            uuid PK default gen_random_uuid()
source        text         -- 'offres' | 'rome'
scope         jsonb        -- { romeCode, departement } or { metiers: 532 }
started_at    timestamptz not null default now()
finished_at   timestamptz
ok            boolean
rows_written  integer
error         text
```
- The first time an ingest half-fails (rate limit, partial fiche set), you will
  want to know *which* run, *what* it covered, and *what broke*. Cheap insurance.
- Each `offers_cache` batch references its run via `batch_id`.

### `offers_cache` — append-only offer bodies
```
pk_id          bigint  GENERATED ALWAYS AS IDENTITY PRIMARY KEY  -- surrogate
offer_id       text    not null            -- France Travail offer id
batch_id       uuid    FK→ingest_runs(id)  -- which pull produced this row
rome_code      text    not null
departement    text    not null
intitule       text    not null
type_contrat   text
competences    jsonb   not null default '[]'   -- offer's OWN text (drifts from ROME)
experience_exige text                          -- D / E / S
formations     jsonb   not null default '[]'
qualites       jsonb   not null default '[]'
permis         jsonb   not null default '[]'
date_creation  timestamptz
fetched_at     timestamptz not null default now()

INDEX idx_oc_rome_dept_fetched ON (rome_code, departement, fetched_at DESC)
INDEX idx_oc_competences GIN (competences)     -- §6.3 jsonb overlap
INDEX idx_oc_offer_id ON (offer_id)
```
- **Append-only** (your choice): every ingest inserts fresh rows, never updates.
  `pk_id` is a surrogate so the same `offer_id` can appear across batches/time.
- `competences` stays **jsonb** (your choice): denormalized exactly as the API
  returns it, drift-tolerant, and the **GIN index** makes the §6.3 offer-level
  overlap query (`competences @> [...]`) fast.
- **Cost to be honest about:** up to 1,150 rows × every (rome, dept) × every pull.
  Mitigations baked in: the `current_offers` view (below) so the engine never
  scans history, `batch_id` for pruning old batches, and `fetched_at DESC` index
  so "latest" is cheap. If volume becomes a problem, partition by `fetched_at`
  month — the view shields the engine from that change.

### `current_offers` — view the engine reads
```sql
-- most-recent batch per (rome_code, departement)
CREATE VIEW current_offers AS
SELECT oc.* FROM offers_cache oc
JOIN (
  SELECT rome_code, departement, max(fetched_at) AS latest
  FROM offers_cache GROUP BY rome_code, departement
) m ON oc.rome_code = m.rome_code
   AND oc.departement = m.departement
   AND oc.fetched_at = m.latest;
```
- **The engine queries this view, not the base table.** It always sees the latest
  pull per (rome, dept); history stays available for analytics without the engine
  knowing. This is what makes "append-only" safe for read performance.

### `offer_counts` — demand time-series (counts, not bodies)
```
rome_code              text not null
departement            text not null
total_count            integer not null   -- Content-Range header total (§6.4 marketDemand)
median_salary          numeric            -- Phase-2, NULL now (MERGED from v1, forward field)
recruitment_difficulty text               -- Phase-2, NULL now (MERGED from v1, forward field)
batch_id               uuid FK→ingest_runs(id)
snapshot_at            timestamptz not null default now()
PRIMARY KEY (rome_code, departement, snapshot_at)
INDEX idx_counts_latest ON (rome_code, departement, snapshot_at DESC)
```
- **Counts ≠ bodies.** `total_count` is the true market size from the
  Content-Range header (can be 287,543) — you only ever store ≤1,150 bodies. This
  table is the demand signal and, with `snapshot_at` in the PK, a **trend line**
  for free. The engine reads the latest snapshot; trends are a future BMO layer.
- `median_salary` + `recruitment_difficulty` (merged from v1's `job_market_snapshots`
  intent) are **forward fields, NULL now**. They populate only when the **Marché du
  Travail tension layer** lands (PRD §2 "OUT, later"). Defined now so that layer is
  an `UPDATE`, not a migration. `recruitment_difficulty` is a descriptive signal
  (e.g. "tendu"/"normal"), **not a score or verdict** — surfaced as a labelled
  signal alongside counts, consistent with §6.4.

---

## Zone 4 — per-user runtime

### `quiz_sessions`
```
id                   uuid PK default gen_random_uuid()
shape                text CHECK in ('A','B')
answers              jsonb not null default '{}'    -- raw {questionId: optionId[]}
inventory            jsonb not null default '{}'    -- computed Inventory (§6.1)
constraints          jsonb not null default '{}'    -- département, diploma, urgency, tensions
financial_inputs     jsonb not null default '{}'    -- Cat-5 premium-hook inputs (Phase-2 paid model)
categories_completed text[] not null default '{}'   -- which quiz categories are done (partial-completion / gating)
created_at           timestamptz not null default now()
```
- Written by the quiz server action. `inventory` is stored computed so `/results`
  reconstructs without re-deriving (matches `SessionStore` already built).
- `id` is the `?session=` param on `/results`.
- `financial_inputs` is a **Phase-2 forward field, consumed by NOTHING in the MVP**
  — it captures Cat-5 premium-hook inputs for the later paid model. Defined now so
  the paid layer is an `UPDATE`, not a migration. The deterministic engine and
  `/results` never read it.
- `categories_completed` tracks which quiz categories a session has finished, for
  partial-completion / gating UX (resume a half-done quiz, gate results until N
  categories done). Empty `{}` = the current all-at-once flow; nothing reads it yet.

### `session_evidence` — per-proof confidence (MERGED from v1's user_evidence)
```
id              uuid PK default gen_random_uuid()
session_id      uuid FK→quiz_sessions(id) on delete cascade
cluster_id      text          -- which quiz cluster the proof mapped to
competence_code text          -- the ROME competence the proof asserts (nullable)
confidence      numeric       -- strength of the proof, 0..1 (e.g. years/recency)
created_at      timestamptz not null default now()
INDEX idx_evidence_session ON (session_id)
```
- One row per **proof** a session captured (Shape B evidence, or weighted Shape A
  interests). `confidence` records **how strong** that proof is — "ran payroll for
  5 years" is stronger evidence of the paie cluster than "touched it once."
- The `inventory` jsonb on `quiz_sessions` stays the **computed summary** the
  engine reads; `session_evidence` is the **auditable source** behind it, and lets
  confidence later modulate coverage scoring (a high-confidence proof of a shared
  skill strengthens a direction). Querying it independently answers "what did this
  person actually claim, and how strongly."
- `confidence` is a **proof-strength signal, not a verdict** — it never gates a
  direction in or out; it tunes ordering (PRD §6.4).

### `recommendations` — denormalized output snapshot
```
id                  uuid PK default gen_random_uuid()
session_id          uuid FK→quiz_sessions(id) on delete cascade
rome_code           text not null
category            text          -- apply_now / bridge / long_term / not_now (§8)
rank                integer
coverage            numeric       -- §6.3 coverage strength
leap_type           text          -- direct / skill_bridge / mobilite / interest
why                 text          -- plain-language "why surfaced" (§6.3)
requirement_profile jsonb not null default '{}'   -- §6.4 counts + escape hatch, as computed
created_at          timestamptz not null default now()
INDEX idx_rec_session ON (session_id)
```
- A **point-in-time snapshot** of what the engine surfaced for one session — not
  live-joined, because the market moves. Aligned to the rewritten §10: carries
  `coverage`/`leap_type`/`why`; **`intersection_clusters` dropped** (retired §6.7).

---

## Security: RLS deny-by-default (internal tool)

PRD §2: internal/admin, no public auth, no user accounts. So:
- **`ALTER TABLE … ENABLE ROW LEVEL SECURITY` on every table, with NO public
  policies.** With RLS on and no policy, the `anon` key reads/writes nothing.
- **All app access uses the server-side service-role key** (`getSupabaseServiceClient`),
  which bypasses RLS. The engine, ingest, and quiz action are all server-side.
- Net effect: nothing leaks to the browser by accident — sessions, recommendations,
  and the whole DB are server-only. When public accounts arrive (PRD "OUT, later"),
  add per-user policies then; the deny-by-default baseline is the safe starting point.

---

## Merged from the v1 schema — and what stays retired

This revision folds back the **still-valid** pieces of the original v1 schema,
while keeping the dead verdict-era design out for good.

### Merged in (valid, additive)
| v1 piece | Lands as | Role |
|----------|----------|------|
| job-title variants | `rome_appellations` | recognisable titles + future free-text→ROME matching |
| per-métier skill weight | `rome_job_competences.weight` | weighted **coverage** (§6.3 fit signal) |
| `user_evidence` confidence | `session_evidence.confidence` | proof strength, tunes ordering |
| `job_market_snapshots` | `offer_counts.median_salary` + `recruitment_difficulty` (NULL now) | Phase-2 Marché du Travail tension layer |

### Stays RETIRED (would reintroduce dead design — do NOT add)
| v1 piece | Why it's gone | Replaced by |
|----------|---------------|-------------|
| `verdict`, `disqualifiers`, `final_score` | the product gives **no pass/fail verdict** (PRD §6.4) | `recommendations.coverage` + `category` + `why` — signals, not a score |
| `interest_job_map`, `interest_skill_map` | static interest→job lookup tables are the pre-leap-graph design | the **leap graph**: `rome_job_competences` (skill-bridge) + `rome_mobilites` (mobilité) + `rome_riasec` (interest) |

**Hard invariant:** no `verdict` / `disqualifier` / `final_score` column exists in
any table. Every fit number is a transparent, shown signal (coverage, count,
confidence, weight) — never a hidden gate. The leap graph is the only surfacing
mechanism.

---

## What this changes vs. the current migrations (0001 + 0002)

| Change | Why |
|--------|-----|
| `offers_cache`: `id text PK` → surrogate `pk_id` + `offer_id` + `batch_id`, append-only | enables history (your choice) without losing offer identity |
| add `current_offers` view | engine reads "latest" cheaply despite append-only |
| `offer_counts`: PK `(rome,dept)` → `(rome,dept,snapshot_at)`; add `median_salary` + `recruitment_difficulty` (NULL) | demand trend, not just latest; Phase-2 tension fields ready |
| add `ingest_runs` | audit half-failed ingests (rate limits, partial pulls) |
| add `rome_jobs.domain_code` | group by ROME family without parsing text |
| add `rome_appellations` (+ index) | job-title variants (merged v1) |
| `rome_job_competences`: add `weight numeric default 1.0` | weighted coverage (merged v1) |
| add `session_evidence` (confidence) | per-proof strength (merged v1) |
| RLS enabled deny-by-default on all tables | internal-tool safety |
| `recommendations`: ensure `coverage`/`leap_type`/`why`, drop `intersection_clusters` | match rewritten §10 / §6.7 |
| **no** `verdict` / `disqualifiers` / `final_score`; **no** `interest_*_map` | retired dead design (see above) |

### Code impact (small, flagged honestly)
- **`LiveOfferSource.ingest()`** currently upserts `offers_cache` by `id` and
  `offer_counts` by `(rome,dept)`. Append-only means: **insert** offer rows with a
  `batch_id` (no `onConflict`), and **insert** a new `offer_counts` snapshot row.
  ~10 lines. I'll update it when writing the migration.
- **`FixtureOfferSource` / fixtures / the engine reads** are **unaffected** — they
  go through the seam and read offer arrays, not the table. Fixture mode (default)
  needs no DB at all.
- **`LiveRomeSource` reads** already match Zone 1 exactly — except it can now also
  read `weight` from `rome_job_competences` and `appellations`; both are optional,
  so no change is forced (defaults: weight 1.0 → current flat coverage).
- **`session_evidence`** is new write surface for the quiz action (one row per
  proof). Additive — the `inventory` jsonb path is unchanged, so the engine and
  `/results` keep working without it; populate evidence when confidence is wired.
- **Weighted coverage** is an opt-in upgrade to `coverage.ts`/`graph-direction-proposer.ts`:
  with all weights at the `1.0` default, weighted coverage equals today's count
  ratio — so the schema change is inert until weights are populated.

---

## Open question for you
Append-only offers is powerful but is the one piece that grows unbounded. Two
follow-ups we can decide later (not blocking): (a) a retention/prune job that
drops `offers_cache` batches older than N months, and (b) monthly partitioning if
a single (rome,dept) gets pulled very frequently. Both are additive — the
`current_offers` view means neither changes engine code.
