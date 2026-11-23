# Signal tier measure: absolute cut or share of the job's ceiling

Date: 2026-11-23. Branch `vocab-reach` at ebc5b58 (trajectoire-ui). Live graph
(1,923 jobs), dev database, earned floor ≥ 2 on. Tool: `scripts/signal-share.ts`
(`ceiling`, `snap`, `sweep`, `report`). Measurement only: no tier change shipped.

Goal (George): FORT = you share most of what this job distinctively needs,
whatever the length of its fiche.

## 1. Each job's ceiling

Ceiling = Σ idf of the job's own codes under the genericity bound (listed in ≤ 10
domaines), i.e. its matchRaritySum at 100 % coverage of what can count.

| quantile | p0 | p5 | p10 | p25 | p50 | p75 | p90 | p95 | p100 |
|---|---|---|---|---|---|---|---|---|---|
| ceiling | 62 | 131 | 151 | 185 | 234 | 285 | 342 | 384 | 695 |

**1,747 of 1,923 jobs (91 %) can never reach FORT 350**, even matching every code
under the bound. Counting every code (no bound) it is still 1,578 (82 %).

| ceiling | 50–100 | 100–150 | 150–200 | 200–250 | 250–300 | 300–350 | 350–400 | 400–500 | 500–600 | 600–800 |
|---|---|---|---|---|---|---|---|---|---|---|
| jobs | 20 | 169 | 428 | 498 | 430 | 202 | 99 | 59 | 14 | 4 |

Named jobs: A1416 Exploitant agricole 324, M1805 Développeur 272, M1855 Développeur
web 296, M1501 Assistant RH 295, M1607 Assistant administratif 206, K2503 Agent de
sécurité 315. Each matches 100 % of its ceiling for its own seed and reads MOYEN.

The same scale sets DEEP_SEED_MATCH_FLOOR (200): 617 jobs (32 %) have a ceiling
under 200, so they can never carry the thin-market seeded line.

## 2. Sweep (167 personas: 116 of persona-sweep + 51 seed-only niches)

Criterion that set 350 (coverage.ts): at most 20 FORT per persona, few over 10
(4 of 48 then; here ≤ 13 of 167).

(a) absolute cut on matchRaritySum

| cut | max FORT | >10 | >20 | 0 FORT | quiz-only with FORT |
|---|---|---|---|---|---|
| 300 | 23 | 17 | 2 | 70 | 0 |
| **325** | 20 | 2 | 0 | 81 | 0 |
| 350 (today) | 14 | 2 | 0 | 92 | 0 |
| 400 | 7 | 0 | 0 | 132 | 0 |

Re-derived cut: **325**.

(b) share of the job's ceiling

| cut | max FORT | >10 | >20 | 0 FORT | quiz-only with FORT |
|---|---|---|---|---|---|
| 50 % | 120 | 93 | 54 | 60 | 0 |
| 70 % | 96 | 85 | 46 | 60 | 0 |
| 80 % | 94 | 83 | 44 | 60 | 0 |
| 100 % | 92 | 81 | 42 | 60 | 0 |

No share cut meets the criterion. Not because FORT spreads: for a seeded persona,
FORT under (b) is almost exactly the picked niche's member jobs (FORT outside the
persona's own niche: 0 for 92 of the 102 single-niche personas, niche:* and seed-only:*, at most 2). The count is
the niche's size, and 21 niches have more than 20 member jobs (securite 62, vente
54, accueil 49, enseignement 48, culture 47, etudes 46, commercial 44…). « Every
member FORT » and « ≤ 20 FORT per persona » cannot both hold for those 21.

Quiz-only personas (60): no FORT under any reading. Best raw sum 11–53, best share
5–17 %: answers name 2–10 codes, a fiche carries 30–100.

## 3. Niche check (seed-only persona, every member job FORT)

| reading | niches passing |
|---|---|
| today, raw ≥ 350 | 0 / 51 |
| (a) raw ≥ 325 | 0 / 51 |
| (b) share ≥ 80 % | 45 / 51 |
| (b) share = 100 % | 33 / 51 |

The six failing at 80 % each have one or two members under 80 %: tech:code M1801
63 %, tech:sysadmin M1810 37 %, tech:data M1402 16 %, industrie:qualite H1502 48 %,
admin:compta M1203 17 % and M1204 62 %, transport:exploitation N1303 58 %. Cause:
the committed seeds are stale against the current graph. Regenerating
`config/families.ts` from the dev database changes 13 seeds (compta 227 → 316 codes,
+91; data +34; sysadmin +26; exploitation +22; code +21; qualite +19). M1203
Comptable carries 97 codes under the bound; 18 are in today's compta seed.

What-if, seeds regenerated (not committed; `config/families.ts` restored after the
run): every member job surfaces for its own seed, the lowest member share is 91 %
(admin:secretariat, the D1408 leak guard), so **(b) at 80 % passes 51 / 51**. The
FORT-count table barely moves (max 95, 83 personas over 10, 44 over 20) and (a)
re-derives at 325 again. The ≤ 20 bar still fails, for the niche-size reason above.

## 4. Per persona, before and after

Full table: `signal-share.ts report <snap> 325 0.8`. Summary of FORT counts:

| | today 350 | (a) 325 | (b) 80 % |
|---|---|---|---|
| FORT rows, all personas | 248 | 364 | 2,584 |
| personas with ≥ 1 FORT | 75 | 86 | 107 |
| quiz-only personas with ≥ 1 FORT | 0 | 0 | 0 |
| FORT rows lost | – | 0 | 2 (I1613 in two maintenance:vehicule personas: raw 372, ceiling 684, share 54 %) |

## 4b. The MOYEN band, restated

- (a): FORT raw ≥ 325, MOYEN raw ≥ 15, display split MOYEN_UPPER = √(15·325) = 69.8.
- (b): FORT = share ≥ 80 % of the job's ceiling. MOYEN stays raw ≥ 15: it is the
  evidence floor (« a few rare shared skills ») that decides what is listed, and
  every reader of it (directions, family presence, directions-gate) keeps its
  meaning. A share ≥ 80 % implies raw ≥ 49.6 (smallest ceiling 62), so FORT never
  sits under MOYEN. √(MOYEN·FORT) has no meaning across a sum and a share: the
  forte / pertinente split needs its own rule — freeze it at 72.5 raw (today's
  value) or restate it as a share. Either is a threshold that changes what users
  see, so it is George's call.

## 5. Everything else on the matchRaritySum scale

| reader | reads | (a) 325 | (b) share |
|---|---|---|---|
| FORT badge and « très forte » band (directions-view, direction page, display.ts) | FORT | moves (+116 rows, −0) | moves (+2,338, −2) |
| forte / pertinente split, MOYEN_UPPER = √(MOYEN·FORT) | FORT | 72.5 → 69.8; 131 rows pertinente → forte | undefined across units: must be restated (freeze at 72.5 raw, or a share) |
| MOYEN ≥ 15 (faible vs listed) | MOYEN | unchanged | unchanged (kept as the raw evidence floor) |
| directions.ts eligible / attach / others / othersFaible | MOYEN only | nothing moves | nothing moves |
| family presence (honest tier = not faible) | MOYEN only | nothing moves | nothing moves |
| directions-gate faible checks | MOYEN only | nothing moves | nothing moves |
| DEEP_SEED_MATCH_FLOOR 200 (thinMarketSeeded line) | raw sum | unchanged; comment « below FORT » still true | unchanged; « below FORT » no longer comparable; 32 % of jobs can never reach 200 |
