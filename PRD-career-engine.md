# PRD — Career Direction Engine (France) — Internal MVP

Read once, cached. This is the reference doc. Build instructions arrive as separate lean prompts.

---

## 1. What this is

A career-direction tool for France. The user gives a skills/interests inventory through a quiz; the app surfaces job directions, including ones the user wouldn't have searched, by walking ROME's own structure (shared skills between jobs, and ROME's curated "related jobs" map). Every surfaced direction is reality-checked against live France Travail offers, with the ads as evidence and the exceptions always shown.

Governing rule: **ROME names. The market decides. The user chooses.** The engine never outputs a verdict it cannot back with a clickable ad.

Not MétierScope: not a flat list of titles. The differentiator is **leap-graph traversal** (section 6): surfacing non-obvious directions from a person's inventory, deterministically, using skill-sharing and ROME mobility edges. An LLM "discovery" step is a deliberate Phase-2 enhancement behind a seam, not part of the MVP.

> NOTE — supersedes earlier intersection design. An earlier version scored "intersection roles" (one ad listing skills from two clusters). Live-data testing falsified that: real ads describe one job, so cross-cluster overlap is near-absent. The intersection idea is demoted to a minor signal. The real leap mechanic is skill-bridge + ROME mobilités (section 6).

---

## 2. MVP boundary

IN:
- Two-shape routed quiz (interest-first / evidence-first) producing an inventory
- Leap-graph traversal over the ROME 4.0 referential (skill-bridge + mobilités + RIASEC)
- Live-offer reality check per surfaced direction
- Two-column output (job side + autonomy side)
- Four result categories
- France, national referential, Île-de-France first for offers
- Internal/admin use, no public auth, no user accounts

OUT (later):
- LLM discovery step (Phase 2, behind the `proposeDirections` seam, §6.6)
- Public accounts, exportable PDF, BMO forward-demand, Marché du travail tension, international mode, monetization.

---

## 3. Data layer — the seam (critical)

The app is built against the **France Travail Offres API v2** data shape. But it must run **today on fixtures**, before API credentials exist.

Build one interface, two implementations:

```
interface OfferSource {
  fetchOffers(romeCode: string, departement: string): Promise<Offer[]>
}
```

- `FixtureOfferSource` — reads JSON files from `/fixtures/offers/*.json`, each file an array of `Offer` shaped exactly like the API response. Used now.
- `LiveOfferSource` — OAuth2 + real fetch. Used when credentials land.

Switch by env var `OFFER_SOURCE=fixture|live`. Nothing else in the app knows which is active. **This seam is mandatory.** All scoring, UI, and DB logic reads from `OfferSource`, never from the API directly.

### Live API facts (for `LiveOfferSource`, build but leave dormant)
- Base: `https://api.francetravail.io/partenaire/offresdemploi/v2/offres`
- OAuth2 token URL: `https://entreprise.francetravail.fr/connexion/oauth2/access_token`
- Scope: `api_offresdemploiv2 o2dsoffre`
- Credentials: `FT_CLIENT_ID`, `FT_CLIENT_SECRET` in env, never in source.
- Rate limits are **per-API, not global** (confirmed from the app's authorized-API page). Throttle each independently:
  - Offres d'emploi v2: **10 req/s**
  - ROME 4.0 (Compétences / Métiers / Fiches): **1 req/s** each
  - La Bonne Boîte v2: **2 req/s**
  - ROMEO v2: **3 req/s**
  A single global throttle is wrong: it either wastes Offres headroom or breaches the ROME 1/s ceiling. 429 returns a `Retry-After` header; honor it per API.
- Result cap: query returns **max 1,150 offers** (`range` 0-0 to 1000-1149). Real total is in the `Content-Range` response header (e.g. `offres 0-49/287543`). For counts, read the header. For bodies, slice queries by ROME + département to stay under 1,150.

---

## 3b. ROME referential — the leap-graph source

Separate from offers. This is the data the engine traverses to surface directions. Loaded once into Postgres, refreshed when ROME updates (~twice/year), NOT fetched per user request.

Three pieces, two delivery mechanisms:

| Piece | What it gives | Source | How to load |
|-------|--------------|--------|-------------|
| **Métiers + competencies** | each ROME code → its savoir-faire / savoirs / savoir-être codes | ROME 4.0 **Fiches Métiers API** (1 req/s) | live API, bulk-ingest all ~532 métiers once |
| **Métiers proches / mobilités** | each ROME code → curated list of adjacent métiers | Fiches API field `metiersProches` + the open-data "Mobilités possibles entre deux métiers ROME" dataset | API field + one-time CSV/dataset load |
| **RIASEC** | each ROME code → Holland interest profile (R/I/A/S/E/C) | open-data CSV `referentiel_code_rome_riasec_v4` | **CSV seed only — NOT in the API.** Load the CSV into Postgres. |

Scope correction: the ROME 4.0 API serves **~532 structured métiers** (not the older 1,911 fiche count). 532 is small enough to ingest the whole national graph. Do that — more nodes = more skill-bridges.

Same seam pattern as offers: a `RomeSource` interface with a `FixtureRomeSource` (small JSON sample, used now) and a `LiveRomeSource` (API + CSV, dormant until credentials). Engine reads `RomeSource`, never the API directly.

---

## 4. Offer data shape

The `Offer` type mirrors the API. Minimum fields used by the engine:

```
type Offer = {
  id: string
  intitule: string          // job title
  romeCode: string
  typeContrat: string       // CDI, CDD, MIS, etc.
  lieuTravail: { libelle: string, departement: string }
  competences: { code: string, libelle: string, exigence?: string }[]
  formations?: { niveau?: string, exigence?: string }[]
  qualitesProfessionnelles?: { libelle: string }[]
  experienceLibelle?: string   // e.g. "2 ans"
  experienceExige?: string     // "D" debutant accepte / "E" exige / "S" souhaite
  permis?: { libelle: string, exigence?: string }[]
  dateCreation: string
}
```

Fixtures must use these exact field names so the live swap is zero-change.

---

## 5. Quiz + shape routing

### 5.1 Shape gate (runs first, 3-4 questions)
Determines route. Example signals:
- "Picture work you'd want: clear field, or blank?" clear → A, blank → B
- "One thing done a lot, or several unrelated things?" one → A, several → B

Output: `shape: 'A' | 'B'`.

### 5.2 Shape A — interest-first
- Interest questions, combinable. Each maps to one or more **competency clusters**, never directly to a job list.
- Then a **tension** question set (hours / mobility / ceiling / physicality). This reorders positions inside a domain. First-class, not buried.

### 5.3 Shape B — evidence-first
- Concrete proof questions ("handled client incidents by email/phone 18 months", "ran payroll for N companies"). Each proof maps to a competency cluster.
- Collect 2+ proof clusters → feeds the intersection engine.

### 5.4 Shared
- Constraints: location/département, diploma level, urgency, contract pref.
- All quiz config (questions, clusters, mappings) lives in `/config/quiz.ts` as data, not hardcoded in components.

---

## 6. The engine — leap-graph traversal

The deterministic core. No LLM in the MVP. Turns a person's inventory into surfaced directions, including non-obvious ones, by walking ROME structure. Reads ROME via `RomeSource`, offers via `OfferSource`.

### 6.1 Inventory
The quiz produces an **inventory**: a set of the person's competencies (mapped to ROME competence codes), plus interest/ambition signals (mapped to a RIASEC profile), plus constraints (département, diploma, urgency). Competence mapping uses `/config/clusters.ts` (quiz answer → competence codes). RIASEC mapping uses the interest answers.

### 6.2 The three leap mechanics (this is the differentiator)
Run all three, union the results, dedupe by ROME code:

**A. Direct match** — métiers whose competencies the inventory directly covers. The obvious directions.

**B. Skill-bridge (the key leap)** — take the inventory's competence codes, find *every other* ROME métier that also lists those codes. Surfaces jobs the person would never search, because the shared *skill* is the link, not the job title. (Their payroll rigour also appears under compliance, logistics, quality-control métiers.)

**C. Mobilité leap** — for each métier surfaced by A or B, add its ROME `metiersProches` / mobilités neighbours. This walks France Travail's own expert-curated "where you can move from here" graph.

**D. Interest leap (RIASEC)** — métiers whose RIASEC profile matches the inventory's interest profile, even where hard skills don't point there. This is how "have you considered restaurant management?" reaches someone with kitchen skills + an Enterprising streak.

### 6.3 Scoring (ranking, not verdicts)
For each surfaced métier, compute a transparent, rule-based score from:
- **coverage**: how much of the person's inventory this métier uses (higher = better fit)
- **leap type**: direct / skill-bridge / mobilité / interest (used for grouping + a "why surfaced" label, not to hide anything)
- **market reality** (from `OfferSource`, §6.4)

Deterministic ordering. **No hidden 0-100 feasibility verdict.** Every surfaced métier carries a plain-language "why it surfaced" (e.g. "shares 4 of your skills" / "ROME lists this as a step from X" / "matches your Enterprising interest").

### 6.4 Market reality check (per surfaced métier)
Pull cached offers for that ROME + département via `OfferSource`:
- `marketDemand` = header total count
- `requirementProfile` = aggregate `competences` / `experienceExige` / `formations`; per requirement, the fraction of offers that list it AND the fraction that do **not** (the escape hatch)
- where demand is thin or zero, that becomes an honest signal, not a hidden filter

### 6.5 Honest fork
When no single direction uses most of the inventory, the output explicitly names the fork: "no one path uses most of you; here are 2-3 real directions, each using a different part, and what each costs." (The paie-friend: back-office vs bakery vs client roles, named as a choice, not blended into mush.)

### 6.6 LLM discovery — Phase 2, behind a seam (NOT in MVP)
Define the interface now, implement deterministically now, leave the LLM implementation for later:

```
interface DirectionProposer {
  propose(inventory: Inventory): Promise<CandidateDirection[]>
}
```

- `GraphDirectionProposer` — the §6.2 leap-graph traversal. The MVP implementation. No cost.
- `LlmDirectionProposer` — Phase 2. Calls an LLM (Anthropic Haiku 4.5) to propose cross-domain directions the curated graph can't reach. **Separate Anthropic Console API account, own API key in env, hard spend cap set in Console.** ~1 cent/user. Switched by env var, same pattern as the offer seam.

The MVP ships fully on `GraphDirectionProposer`. The LLM is an upgrade that drops into one place.

### 6.7 Intersection — demoted to a minor signal
The old "intersection role" idea (an ad wanting skills from two clusters) is kept ONLY as a small badge when it happens to occur, never as the ranking driver. Live data showed it is near-absent. Do not build the engine around it.

---

## 7. Output: two parallel columns

Per surfaced domain, render both, never one replacing the other.

**Job side**
- live/cached offer count (header total)
- common titles from the offer set
- contract mix
- requirements with counts AND the inverse: "24/42 ask 2yr exp → 18/42 do not [link to the 18]"

**Autonomy side**
- the gérant/independent/freelance position in the same domain
- honest cost layer: auto-entrepreneur cotisation reality [rate pulled from `/config/rates.ts`, flagged VERIFY], no clients waiting, income variance. Never "be your own boss".

Every requirement count links to the filtered offer subset that proves it.

---

## 8. Result categories
Bucket each surfaced role:
1. Apply now — proof sufficient, offers exist, gates low
2. Bridge 3-6mo — close, 1-2 skills missing
3. Long-term — fits, needs major time/diploma/seniority
4. Not now — blocked by gate/low demand, shown as signal + evidence + exceptions, never a verdict

---

## 9. Stack
- Next.js 15, TypeScript strict, App Router, server actions
- Supabase Postgres
- Tailwind v4
- Ingestion: scheduled function, throttled 4 req/s (dormant until live)
- Deploy: Vercel

If a stack choice blocks the seam or the throttled ingestion, change the choice and note why in `CLAUDE.md`.

---

## 10. Schema (Supabase)

```
-- ROME referential (the leap-graph)
rome_jobs(rome_code pk, title, definition, domain, access_conditions, certifications)
rome_competences(code pk, libelle, type)
rome_job_competences(rome_code, competence_code)        -- métier ↔ skill edges (skill-bridge)
rome_mobilites(from_rome_code, to_rome_code)            -- curated adjacency edges (mobilité leap)
rome_riasec(rome_code, riasec_code)                     -- interest profile (CSV-seeded)

-- quiz answer → competence mapping
clusters(id pk, label)
cluster_competences(cluster_id, competence_code)

-- offers (market reality)
offers_cache(id pk, rome_code, departement, intitule, type_contrat,
             competences jsonb, experience_exige, formations jsonb,
             qualites jsonb, permis jsonb, date_creation, fetched_at)
offer_counts(rome_code, departement, total_count, snapshot_at)

-- sessions + output
quiz_sessions(id pk, shape, answers jsonb, inventory jsonb, constraints jsonb, created_at)
recommendations(id pk, session_id, rome_code, category, rank,
                coverage numeric, leap_type text, why text,
                requirement_profile jsonb, created_at)
```

`rome_job_competences` is the skill-bridge: index it both ways so "which métiers share this competence" is fast. `offers_cache.competences` stays jsonb.

---

## 11. Build order (risk-first)
1. Schema + both seams (`OfferSource`, `RomeSource`) + fixtures for each (small ROME sample with competencies, mobilités, RIASEC; existing offer fixtures).
2. **Leap-graph traversal over fixtures** (§6.2): given a hardcoded inventory, surface directions via direct + skill-bridge + mobilité + RIASEC, each tagged with "why surfaced". **Gate: confirm skill-bridge and mobilité actually surface non-obvious directions the user wouldn't have named. If only direct matches appear, stop and report.**
3. Market reality check (§6.4) layered onto surfaced directions.
4. Two-column output + honest fork (§7, §6.5), hardcoded inventory.
5. Quiz + shape routing → produces the inventory.
6. `LiveRomeSource` (ingest ~532 métiers + load RIASEC CSV) and `LiveOfferSource` + throttled ingestion, dormant behind env vars.
7. (Phase 2, later) `LlmDirectionProposer` behind the §6.6 seam.

---

## 12. Flags / open
- Auto-entrepreneur cotisation rate: VERIFY live before display, store in `/config/rates.ts`.
- ROME scale: the **4.0 API serves ~532 structured métiers** (verified, francetravail.io/blog/api-rome-4). The 1,911 figure is the older fiche count. Ingest all 532.
- RIASEC is **CSV-only**, not in the API. Seed `referentiel_code_rome_riasec_v4` into `rome_riasec`. Do not build an API call for it.
- Mobilités: available both as a Fiches-API field (`metiersProches`) and as the open-data "Mobilités possibles entre deux métiers ROME" dataset. Either works; dataset is the complete edge-list.
- LLM discovery (Phase 2): separate Anthropic Console account + API key + Console spend cap. ~1¢/user (Haiku 4.5). Not in MVP.
- Subscribed APIs out of MVP scope: La Bonne Boîte v2 (future outbound), Marché du travail (tension layer), ROMEO v2 (free-text→ROME, optional later).
- Monetization: out of scope for MVP.
