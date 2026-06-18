# Flow Sheets — Career Engine

Render at mermaid.live. Four flows: user journey, leap-graph engine, data seams, live ingestion.

---

## 1. User journey

```mermaid
flowchart TD
  Start([User starts]) --> Gate[Shape gate]
  Gate -->|clear field| A[Interest-first]
  Gate -->|scattered| B[Evidence-first]
  A --> INV[Build Inventory:<br/>competences + RIASEC + constraints]
  B --> INV
  INV --> ENG[Leap-graph engine]
  ENG --> RC[Market reality check<br/>per direction]
  RC --> OUT[Two-column output]
  OUT --> JOB[Job side: offers, reqs + exceptions]
  OUT --> AUT[Autonomy side: gerant + honest cost]
  OUT --> FORK{One path covers<br/>most of inventory?}
  FORK -->|no| HF[Honest fork:<br/>2-3 directions, each a part, each its cost]
  FORK -->|yes| CAT[Bucket: Apply now / Bridge / Long-term / Not now]
  HF --> CAT
```

---

## 2. Leap-graph engine (the differentiator)

```mermaid
flowchart TD
  INV[Inventory:<br/>competence codes + RIASEC] --> A[A. Direct match<br/>métiers covering the skills]
  INV --> B[B. Skill-bridge<br/>other métiers sharing those skills]
  INV --> D[D. Interest leap<br/>métiers matching RIASEC profile]
  A --> M[Surfaced métiers]
  B --> M
  D --> M
  M --> C[C. Mobilité leap<br/>add each métier's metiersProches]
  C --> U[Union + dedupe]
  U --> SC[Score: coverage + leap_type + market]
  SC --> WHY[Tag each with 'why surfaced']
  WHY --> RANK[Ranked directions]
```

Gate: skill-bridge (B) and mobilité (C) must surface directions the user would NOT have named. If only direct (A) appears, stop and report.

---

## 3. Data seams (fixture now, live later)

```mermaid
flowchart LR
  ENG[Engine] -->|reads| RS[RomeSource interface]
  ENG -->|reads| OS[OfferSource interface]
  RS -.fixture.-> FR[FixtureRomeSource]
  RS -.live.-> LR[LiveRomeSource<br/>API + RIASEC CSV]
  OS -.fixture.-> FO[FixtureOfferSource]
  OS -.live.-> LO[LiveOfferSource<br/>OAuth2 + throttle]
  FR --> DB[(Postgres)]
  LR --> DB
  FO --> DB
  LO --> DB
  DB --> ENG

  classDef dormant fill:#eee,stroke:#999,stroke-dasharray:4
  class LR,LO dormant
```

Plus a Phase-2 seam: `DirectionProposer` = GraphDirectionProposer (default) | LlmDirectionProposer (dormant, Haiku, separate API key + spend cap).

---

## 4. Live ROME ingestion (dormant until credentials)

```mermaid
flowchart TD
  START[Ingest job] --> FICHES[Fiches Métiers API<br/>1 req/s, ~532 métiers]
  FICHES --> J1[(rome_jobs)]
  FICHES --> J2[(rome_job_competences)]
  FICHES --> J3[(rome_mobilites)]
  CSV[RIASEC CSV<br/>referentiel_code_rome_riasec] --> J4[(rome_riasec)]
  OFF[Offres API<br/>10 req/s, Content-Range counts] --> J5[(offers_cache + offer_counts)]
  R429{429?} -->|yes| WAIT[Sleep Retry-After]
```

RIASEC is CSV-only — never an API call.
