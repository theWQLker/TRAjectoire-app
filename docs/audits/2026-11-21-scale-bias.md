# Scale bias: Signal and révélée/continuité (2026-11-21)

**Question:** do rarity sums grow with inventory size, so that seeded users outscore quiz-only users and seeded directions read "continuité" by volume alone? If so, what single fix judges both sources on the same scale?

**Status:** diagnosis and proposal only. Nothing in the engine has changed. The numbers come from `scripts/scale-bias-diagnosis.ts` on ROME_SOURCE=live and OFFER_SOURCE=live, with Paris as the zone. The full output is at the end.

## What is happening

Signal and the split both add up raw rarity: `matchRaritySum = Σ idf` over the skills a role shares with the user. That sum is capped by how much rarity the user's inventory holds, and the two sources hold very different amounts.

| | Answers (quiz) | Seed (one niche) |
|---|---|---|
| Codes in the inventory | 32 to 50 | 315 to 1,539 |
| Rarity mass (Σ idf) | 132 to 185 | 1,529 to 9,494, i.e. **9 to 50 × the answers** |
| Best match anywhere in the ROME graph | **23 to 38** | 297 to 732 |
| Best métier's share of what the source offered ("reach") | 14 to 26 % | 4 to 25 % (median 14 %) |

Two consequences:

1. **Signal: a quiz-only user can never read "fort", at any FORT cut we have used.** Their best possible métier, searched across the whole graph and not only the surfaced ones, shares 23 to 38 of rarity. The FORT cut was 50 and is now 350. All 6 quiz-only personas have 0 "fort" at both values.
2. **Split: a seeded direction is "continuité" because the seed is bigger, not because it fits better.** Look at reach, the best métier's share of the source's own mass: it is on the same scale for answers (≈ 20 %) and seeds (≈ 14 %). Relative to what each source offers, the answers fit as well as the seed. The seed just offers 9 to 50 times more rarity. On the engine's top 40 roles for the seed + answers personas, the answers' share is 5 to 14 %, and 0 to 14 of 40 roles would read "révélée".

The gap is volume, not fit.

## Why "divide by the source's mass" is the wrong fix

It is the obvious normaliser, and it over-corrects. A broad seed spreads its mass across many fiches: tech:code holds 1,058 codes, and its best métier uses only 6 % of them. Dividing by mass punishes breadth. 19 to 30 of 40 roles flip to "révélée", including software roles for a developer seed (P4: 25 of 40).

## Proposal: judge each source against its own best match

One normaliser, used for both Signal and the split:

> **fit_X(role) = rarity the role shares with source X ÷ the most any ROME métier shares with X.** Here X is the answers or the seed, and the maximum is taken over the whole graph.

Each source's best possible métier scores 1.0, so a quiz-only user and a seeded user are measured the same way: how close this role comes to the best match their source could produce. Breadth no longer matters, because the denominator is a single métier, not the whole seed.

### For Signal

- **fort** = max(fit_answers, fit_seed) ≥ **0.9** *and* matchRaritySum ≥ 15. The 15 is today's MOYEN evidence floor, kept.
- **moyen** = matchRaritySum ≥ 15, unchanged. **faible** otherwise, unchanged.

On 57 personas:

| Cut | Most "fort" for one persona | Personas over 10 | Personas with no "fort" | Quiz-only personas with no "fort" |
|---|---|---|---|---|
| FORT 350 (today) | 20 | 4 | 12 | 6 of 6 |
| fit ≥ 0.8 | 20 | 4 | 0 | 0 of 6 |
| **fit ≥ 0.9 (proposed)** | **10** | **0** | **0** | **0 of 6** |

At 0.9 every persona has between 1 and 10 "fort". Quiz-only personas have 1 to 6. This is the bar you originally set (at most 10 per persona), now reached without the 18 empty personas a cut of 400 cost.

Family presence stays 44/44. It reads MOYEN, and MOYEN does not change.

**What "fort" would mean.** Today "fort" claims an absolute amount of shared distinctive skill. With this fix it would mean *among the closest matches to what you told us*, relative to the user's own evidence. That needs your decision on two points:

- **Thin evidence.** Someone who answers only a few questions still gets a "fort" (their best match) once it clears 15. The floor keeps 1 or 2 skill bridges at faible, but it does not demand much. A higher floor for "fort" alone is the lever. At 30, masters_hr_75 (best match 23) would have no "fort" again.
- **Labels.** "Signal fort" with no number stays honest under either definition. Any explanatory copy that says "many rare shared skills" would have to change.

### For révélée / continuité

- **Answer share** = (answers' shared rarity ÷ best answer métier) ÷ that plus (seed's shared rarity ÷ best seed métier). "Révélée" when it is ≥ 50 %, as today.

| Persona | roles révélée today (of 40) | ÷ source mass | **÷ source best (proposed)** |
|---|---|---|---|
| P4 tech:code + analyse | 1 | 25 | **15** |
| P5 tech:code + relation | 4 | 19 | **17** |
| P6 santé:soin + relation | 13 | 30 | **30** |
| P7 admin:rh + relation | 8 | 30 | **31** |
| P8 hôtellerie:cuisine + terrain | 14 | 29 | **29** |
| P9 commerce:vente + vente | 0 | 30 | **21** |
| P10 btp:second + organisation | 14 | 29 | **29** |

At direction level (the prototype shows both columns):

- the core seed directions stay "continuité" (P4 software, P7 payroll and HR management, P8 cooking, P10 "Construire");
- directions the answers drive turn "révélée". For example, P7's "Concevoir l'ingénierie de formation" goes from 16 % to 73 %; its teaching answers are what put it there.

## What it would take (after approval)

1. `Inventory` gets `answerCodes`, the codes the answers produced. `seededCodes` exists, but a code can come from both sources, so "everything not seeded" is not the same set.
2. `buildResults` computes best_answers and best_seed in the pass the graph proposer already makes. The best métier always shares skills, so it is always among the reached ones.
3. `signalStrength` takes the fit as well as matchRaritySum. Its callers stay the same: the card, the direction page and the strength bands. The two moyen sub-bands are split at √(15·FORT) today; they would need the same normalisation (for example, fit ≥ 0.5 for "Signal moyen").
4. The proofs that pin the current definition (strength-tier-proof, signal-tier-proof) would be rewritten to the new rule, with the same claims: "fort" fires if and only if the backed rule holds, and a thin bridge stays faible. Not loosened.
5. The prototype's split switches to the normalised one.

## What I could not verify

- Every persona here is synthetic: theme answers, seeds, the HR profile. Real stored sessions were not run.
- Whether users read a relative "fort" the way we mean it.

---

## Appendix: full diagnosis output

## Per-source mass and best match over the whole ROME graph

| Persona | answer codes | seed codes | mass answers | mass seed | best raw (answers + seed) | reach answers | reach seed |
|---|---|---|---|---|---|---|---|
| masters_hr_75 | 32 | 0 | 135.8 | 0.0 | 23.0 (23.0 + 0.0) | 17 % | — |
| quiz relation | 45 | 0 | 185.0 | 0.0 | 32.1 (32.1 + 0.0) | 17 % | — |
| quiz analyse | 50 | 0 | 185.1 | 0.0 | 37.7 (37.7 + 0.0) | 20 % | — |
| quiz terrain | 36 | 0 | 132.3 | 0.0 | 27.2 (27.2 + 0.0) | 21 % | — |
| quiz vente | 45 | 0 | 183.4 | 0.0 | 25.4 (25.4 + 0.0) | 14 % | — |
| quiz organisation | 39 | 0 | 132.1 | 0.0 | 34.6 (34.6 + 0.0) | 26 % | — |
| P4 tech:code + analyse | 50 | 1058 | 185.1 | 6039.7 | 392.6 (7.0 + 392.2) | 20 % | 6 % |
| P5 tech:code + relation | 45 | 1058 | 185.0 | 6039.7 | 393.8 (1.6 + 392.2) | 17 % | 6 % |
| P6 sante:soin + relation | 45 | 355 | 185.0 | 1947.8 | 449.5 (9.1 + 449.5) | 17 % | 23 % |
| P7 admin:rh + relation | 45 | 315 | 185.0 | 1717.9 | 431.6 (4.3 + 431.6) | 17 % | 25 % |
| P8 hotellerie:cuisine + terrain | 36 | 372 | 132.3 | 2116.5 | 465.3 (3.0 + 462.3) | 21 % | 22 % |
| P9 commerce:vente + vente | 45 | 1539 | 183.4 | 9133.5 | 402.9 (9.5 + 402.9) | 14 % | 4 % |
| P10 btp:second + organisation | 39 | 402 | 132.1 | 2276.4 | 390.7 (9.4 + 389.1) | 26 % | 17 % |
| seed tech:code | 0 | 1058 | 0.0 | 6039.7 | 392.2 (0.0 + 392.2) | — | 6 % |
| seed tech:sysadmin | 0 | 356 | 0.0 | 1905.4 | 325.8 (0.0 + 325.8) | — | 17 % |
| seed tech:support | 0 | 377 | 0.0 | 2134.1 | 340.6 (0.0 + 340.6) | — | 16 % |
| seed tech:data | 0 | 717 | 0.0 | 4001.4 | 423.7 (0.0 + 423.7) | — | 11 % |
| seed sante:soin | 0 | 355 | 0.0 | 1947.8 | 449.5 (0.0 + 449.5) | — | 23 % |
| seed sante:medico | 0 | 333 | 0.0 | 1940.5 | 427.3 (0.0 + 427.3) | — | 22 % |
| seed sante:reeduc | 0 | 594 | 0.0 | 3585.7 | 386.3 (0.0 + 386.3) | — | 11 % |
| seed btp:gros | 0 | 359 | 0.0 | 2016.4 | 410.6 (0.0 + 410.6) | — | 20 % |
| seed btp:second | 0 | 402 | 0.0 | 2276.4 | 389.1 (0.0 + 389.1) | — | 17 % |
| seed btp:conduite | 0 | 826 | 0.0 | 4660.0 | 537.0 (0.0 + 537.0) | — | 12 % |
| seed maintenance:indus | 0 | 332 | 0.0 | 1766.8 | 312.1 (0.0 + 312.1) | — | 18 % |
| seed maintenance:vehicule | 0 | 519 | 0.0 | 3063.7 | 587.2 (0.0 + 587.2) | — | 19 % |
| seed maintenance:batiment | 0 | 317 | 0.0 | 1785.7 | 367.8 (0.0 + 367.8) | — | 21 % |
| seed commerce:vente | 0 | 1539 | 0.0 | 9133.5 | 402.9 (0.0 + 402.9) | — | 4 % |
| seed commerce:caisse | 0 | 555 | 0.0 | 3101.0 | 425.7 (0.0 + 425.7) | — | 14 % |
| seed commerce:commercial | 0 | 1375 | 0.0 | 8144.7 | 664.0 (0.0 + 664.0) | — | 8 % |
| seed industrie:production | 0 | 542 | 0.0 | 2940.4 | 402.6 (0.0 + 402.6) | — | 14 % |
| seed industrie:qualite | 0 | 1074 | 0.0 | 6208.3 | 427.2 (0.0 + 427.2) | — | 7 % |
| seed industrie:montage | 0 | 730 | 0.0 | 4292.1 | 414.3 (0.0 + 414.3) | — | 10 % |
| seed hotellerie:cuisine | 0 | 372 | 0.0 | 2116.5 | 462.3 (0.0 + 462.3) | — | 22 % |
| seed hotellerie:salle | 0 | 300 | 0.0 | 1651.4 | 354.2 (0.0 + 354.2) | — | 21 % |
| seed hotellerie:accueil | 0 | 1327 | 0.0 | 7649.7 | 504.3 (0.0 + 504.3) | — | 7 % |
| seed admin:secretariat | 0 | 278 | 0.0 | 1540.2 | 381.5 (0.0 + 381.5) | — | 25 % |
| seed admin:compta | 0 | 275 | 0.0 | 1528.7 | 325.1 (0.0 + 325.1) | — | 21 % |
| seed admin:rh | 0 | 315 | 0.0 | 1717.9 | 431.6 (0.0 + 431.6) | — | 25 % |
| seed agriculture:culture | 0 | 1214 | 0.0 | 7117.7 | 388.8 (0.0 + 388.8) | — | 5 % |
| seed agriculture:paysage | 0 | 946 | 0.0 | 5386.0 | 433.4 (0.0 + 433.4) | — | 8 % |
| seed agriculture:foret | 0 | 838 | 0.0 | 4792.0 | 731.9 (0.0 + 731.9) | — | 15 % |
| seed artisanat:art | 0 | 1091 | 0.0 | 6467.3 | 636.6 (0.0 + 636.6) | — | 10 % |
| seed artisanat:spectacle | 0 | 1041 | 0.0 | 6266.2 | 579.7 (0.0 + 579.7) | — | 9 % |
| seed artisanat:creation | 0 | 1008 | 0.0 | 6127.5 | 634.5 (0.0 + 634.5) | — | 10 % |
| seed banque:banque | 0 | 658 | 0.0 | 3577.7 | 316.2 (0.0 + 316.2) | — | 9 % |
| seed banque:assurance | 0 | 409 | 0.0 | 2179.4 | 297.2 (0.0 + 297.2) | — | 14 % |
| seed banque:immo | 0 | 298 | 0.0 | 1612.2 | 408.5 (0.0 + 408.5) | — | 25 % |
| seed communication:comm | 0 | 1090 | 0.0 | 6498.5 | 405.0 (0.0 + 405.0) | — | 6 % |
| seed communication:design | 0 | 586 | 0.0 | 3334.8 | 373.2 (0.0 + 373.2) | — | 11 % |
| seed communication:audiovisuel | 0 | 1024 | 0.0 | 5788.8 | 421.8 (0.0 + 421.8) | — | 7 % |
| seed services:social | 0 | 916 | 0.0 | 5120.2 | 394.5 (0.0 + 394.5) | — | 8 % |
| seed services:domicile | 0 | 362 | 0.0 | 2035.4 | 428.2 (0.0 + 428.2) | — | 21 % |
| seed services:securite | 0 | 1504 | 0.0 | 9175.8 | 550.6 (0.0 + 550.6) | — | 6 % |
| seed services:enseignement | 0 | 1574 | 0.0 | 9494.2 | 508.2 (0.0 + 508.2) | — | 5 % |
| seed transport:conduite | 0 | 999 | 0.0 | 5921.7 | 404.5 (0.0 + 404.5) | — | 7 % |
| seed transport:entrepot | 0 | 540 | 0.0 | 3132.5 | 489.9 (0.0 + 489.9) | — | 16 % |
| seed transport:exploitation | 0 | 738 | 0.0 | 4379.8 | 637.2 (0.0 + 637.2) | — | 15 % |

## Summary by population

- **quiz** (6): best raw min 23.0 · median 32.1 · max 37.7
  - mass answers min 132.1 · median 183.4 · max 185.1; reach answers min 13.9 · median 20.4 · max 26.2 %
- **mixed** (7): best raw min 390.7 · median 402.9 · max 465.3
  - mass answers min 132.1 · median 185.0 · max 185.1; reach answers min 13.9 · median 17.4 · max 26.2 %
  - mass seed min 1717.9 · median 2276.4 · max 9133.5; reach seed min 4.4 · median 17.1 · max 25.1 %
- **seed** (44): best raw min 297.2 · median 421.8 · max 731.9
  - mass seed min 1528.7 · median 3585.7 · max 9494.2; reach seed min 4.4 · median 13.6 · max 25.3 %

## Révélée / continuité on the engine's top 40, seed + answers personas

Each cell: answer share of the top-40 roles' shared rarity · roles (of 40) that would read révélée.

| Persona | seed mass / answer mass | best answer / best seed métier | raw (today) | ÷ source mass | ÷ source best (proposed) |
|---|---|---|---|---|---|
| P4 tech:code + analyse | 32.6× | 37.7 / 392.2 | 6 % · 1 | 66 % · 25 | 38 % · 15 |
| P5 tech:code + relation | 32.6× | 32.1 / 392.2 | 5 % · 4 | 61 % · 19 | 37 % · 17 |
| P6 sante:soin + relation | 10.5× | 32.1 / 449.5 | 14 % · 13 | 62 % · 30 | 69 % · 30 |
| P7 admin:rh + relation | 9.3× | 32.1 / 431.6 | 11 % · 8 | 54 % · 30 | 63 % · 31 |
| P8 hotellerie:cuisine + terrain | 16.0× | 27.2 / 462.3 | 11 % · 14 | 66 % · 29 | 68 % · 29 |
| P9 commerce:vente + vente | 49.8× | 25.4 / 402.9 | 5 % · 0 | 71 % · 30 | 44 % · 21 |
| P10 btp:second + organisation | 17.2× | 34.6 / 389.1 | 12 % · 14 | 69 % · 29 | 60 % · 29 |

## Signal: fort per persona, FORT 350 today vs a cut on max fit (floor 15 kept)

| Persona | surfaced | fort today (≥ 350) | fit ≥ 0.5 | fit ≥ 0.6 | fit ≥ 0.7 | fit ≥ 0.8 | fit ≥ 0.9 |
|---|---|---|---|---|---|---|---|
| masters_hr_75 | 597 | 0 | 16 | 16 | 10 | 6 | 2 |
| quiz relation | 819 | 0 | 31 | 13 | 4 | 1 | 1 |
| quiz analyse | 1090 | 0 | 31 | 14 | 7 | 4 | 1 |
| quiz terrain | 1079 | 0 | 26 | 20 | 10 | 4 | 1 |
| quiz vente | 804 | 0 | 40 | 36 | 18 | 11 | 6 |
| quiz organisation | 1067 | 0 | 29 | 13 | 6 | 2 | 1 |
| P4 tech:code + analyse | 1122 | 1 | 74 | 46 | 27 | 7 | 2 |
| P5 tech:code + relation | 1112 | 1 | 75 | 46 | 24 | 4 | 2 |
| P6 sante:soin + relation | 1055 | 2 | 38 | 15 | 6 | 3 | 2 |
| P7 admin:rh + relation | 1028 | 3 | 36 | 17 | 8 | 4 | 4 |
| P8 hotellerie:cuisine + terrain | 1110 | 2 | 43 | 25 | 12 | 6 | 3 |
| P9 commerce:vente + vente | 1115 | 4 | 112 | 68 | 40 | 20 | 10 |
| P10 btp:second + organisation | 1103 | 3 | 39 | 24 | 14 | 10 | 4 |
| seed tech:code | 1095 | 1 | 44 | 33 | 20 | 3 | 1 |
| seed tech:sysadmin | 981 | 0 | 16 | 11 | 8 | 6 | 3 |
| seed tech:support | 873 | 0 | 9 | 9 | 9 | 6 | 2 |
| seed tech:data | 1051 | 3 | 21 | 16 | 9 | 3 | 2 |
| seed sante:soin | 994 | 2 | 7 | 2 | 2 | 2 | 1 |
| seed sante:medico | 857 | 1 | 3 | 3 | 2 | 1 | 1 |
| seed sante:reeduc | 1004 | 2 | 16 | 14 | 9 | 5 | 2 |
| seed btp:gros | 931 | 1 | 8 | 6 | 5 | 2 | 1 |
| seed btp:second | 939 | 3 | 12 | 11 | 8 | 8 | 3 |
| seed btp:conduite | 1084 | 11 | 17 | 13 | 10 | 5 | 2 |
| seed maintenance:indus | 955 | 0 | 14 | 13 | 10 | 8 | 5 |
| seed maintenance:vehicule | 875 | 5 | 9 | 5 | 4 | 4 | 3 |
| seed maintenance:batiment | 791 | 1 | 7 | 6 | 2 | 1 | 1 |
| seed commerce:vente | 1105 | 4 | 41 | 33 | 22 | 9 | 4 |
| seed commerce:caisse | 1013 | 2 | 14 | 6 | 4 | 2 | 2 |
| seed commerce:commercial | 1099 | 13 | 15 | 7 | 3 | 1 | 1 |
| seed industrie:production | 992 | 1 | 13 | 9 | 2 | 2 | 1 |
| seed industrie:qualite | 1087 | 4 | 24 | 20 | 10 | 4 | 1 |
| seed industrie:montage | 967 | 3 | 21 | 16 | 10 | 3 | 3 |
| seed hotellerie:cuisine | 933 | 2 | 10 | 5 | 2 | 2 | 2 |
| seed hotellerie:salle | 888 | 1 | 10 | 10 | 9 | 5 | 1 |
| seed hotellerie:accueil | 1126 | 8 | 24 | 11 | 8 | 1 | 1 |
| seed admin:secretariat | 932 | 1 | 6 | 5 | 3 | 1 | 1 |
| seed admin:compta | 790 | 0 | 8 | 7 | 6 | 4 | 2 |
| seed admin:rh | 921 | 3 | 5 | 4 | 4 | 3 | 3 |
| seed agriculture:culture | 1104 | 8 | 47 | 39 | 28 | 19 | 8 |
| seed agriculture:paysage | 1104 | 5 | 27 | 20 | 13 | 5 | 1 |
| seed agriculture:foret | 1089 | 9 | 7 | 3 | 3 | 1 | 1 |
| seed artisanat:art | 1061 | 8 | 11 | 6 | 3 | 2 | 1 |
| seed artisanat:spectacle | 1081 | 12 | 23 | 13 | 5 | 2 | 1 |
| seed artisanat:creation | 1069 | 10 | 11 | 8 | 2 | 1 | 1 |
| seed banque:banque | 1085 | 0 | 26 | 17 | 9 | 6 | 2 |
| seed banque:assurance | 1006 | 0 | 15 | 12 | 8 | 7 | 4 |
| seed banque:immo | 982 | 1 | 7 | 6 | 5 | 2 | 1 |
| seed communication:comm | 1068 | 3 | 32 | 31 | 22 | 10 | 2 |
| seed communication:design | 1045 | 3 | 15 | 13 | 12 | 8 | 4 |
| seed communication:audiovisuel | 1104 | 5 | 29 | 26 | 18 | 8 | 3 |
| seed services:social | 1098 | 6 | 28 | 23 | 19 | 11 | 6 |
| seed services:domicile | 909 | 3 | 9 | 5 | 4 | 3 | 3 |
| seed services:securite | 1110 | 7 | 19 | 10 | 6 | 1 | 1 |
| seed services:enseignement | 1096 | 20 | 35 | 24 | 20 | 9 | 4 |
| seed transport:conduite | 1076 | 7 | 34 | 27 | 19 | 10 | 6 |
| seed transport:entrepot | 893 | 6 | 8 | 7 | 6 | 6 | 4 |
| seed transport:exploitation | 1032 | 8 | 11 | 7 | 3 | 1 | 1 |

- **quiz** (6): today max 0, >10: 0, zero: 6; fit 0.5 → max 40, >10: 6, zero: 0; fit 0.6 → max 36, >10: 6, zero: 0; fit 0.7 → max 18, >10: 1, zero: 0; fit 0.8 → max 11, >10: 1, zero: 0; fit 0.9 → max 6, >10: 0, zero: 0
- **mixed** (7): today max 4, >10: 0, zero: 0; fit 0.5 → max 112, >10: 7, zero: 0; fit 0.6 → max 68, >10: 7, zero: 0; fit 0.7 → max 40, >10: 5, zero: 0; fit 0.8 → max 20, >10: 1, zero: 0; fit 0.9 → max 10, >10: 0, zero: 0
- **seed** (44): today max 20, >10: 4, zero: 6; fit 0.5 → max 47, >10: 29, zero: 0; fit 0.6 → max 39, >10: 22, zero: 0; fit 0.7 → max 28, >10: 10, zero: 0; fit 0.8 → max 19, >10: 2, zero: 0; fit 0.9 → max 8, >10: 0, zero: 0
