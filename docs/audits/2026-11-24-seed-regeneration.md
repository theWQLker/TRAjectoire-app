# Seed regeneration from the current graph

Date: 2026-11-24. Branch `vocab-reach`, commit 9ea4e26 on 653f264. Live graph
(1,923 jobs), dev database. FORT stays 350; no rule, threshold, family or depth
changed. Tool: `scripts/seed-regen-diff.ts` (snap before, snap after, diff).

## Why

The committed seeds were built from an older graph and later filtered in place
(2026-11-22), never rebuilt. Some member jobs had most of their codes missing from
their own niche's seed: M1203 Comptable carried 97 codes under the bound, 18 of
them in the compta seed (docs/audits/2026-11-23-signal-tier-measure.md §3).

## What was run

`scripts/build-families.ts --emit`, unchanged rules: a depth's seed is the union
of its member jobs' codes that are under the 10-domaine bound, above the generic
idf cutoff, not carried by the leak target (D1408) for guarded niches, and present
in rome_competences. Member lists are the same explicit lists. Generator report:
51/51 depths pass the representative-job coverage proof. The emitted data is
identical to a run on 2026-11-23 (deterministic). Only the file header comment
changed besides the data (it described the 2026-11-22 in-place filter).

## Why codes were removed

Every removed code is one that **no member job of the depth carries any more** in
the current graph (two, 494300 and 521627, are carried by no job at all). None was
removed by the bound, the idf cutoff or the leak guard.

| depth | removed codes |
|---|---|
| tech:data | 482249 |
| industrie:qualite | 118990 |
| hotellerie:accueil | 494300, 497640, 492804 |
| admin:compta | 124607, 300324 |
| agriculture:paysage | 515587, 516456, 492093, 513607, 515480, 494693, 492843 |
| agriculture:foret | 515480 |
| artisanat:creation | 521627, 519055, 519057 |
| securite:securite | 515555 |
| transport:exploitation | 124607 |

## Why some roles were lost

Every lost role had exactly 2 earned codes before, one of them a removed code, so
it falls to 1 and under the earned floor (≥ 2). Example: seed-only:industrie:qualite
loses M1204, N4202, N1207, E1308, M1209 (each 2 → 1 earned code, via 118990).

## Seeds per depth

| depth | seed before | seed after | added | removed |
|---|---|---|---|---|
| tech:code | 930 | 951 | 21 | 0 |
| tech:sysadmin | 298 | 324 | 26 | 0 |
| tech:support (same) | 320 | 320 | 0 | 0 |
| tech:data | 611 | 644 | 34 | 1 |
| sante:soin (same) | 281 | 281 | 0 | 0 |
| sante:medico (same) | 284 | 284 | 0 | 0 |
| sante:reeduc (same) | 539 | 539 | 0 | 0 |
| btp:gros (same) | 299 | 299 | 0 | 0 |
| btp:second (same) | 335 | 335 | 0 | 0 |
| btp:conduite (same) | 679 | 679 | 0 | 0 |
| maintenance:indus (same) | 258 | 258 | 0 | 0 |
| maintenance:vehicule (same) | 464 | 464 | 0 | 0 |
| maintenance:batiment (same) | 260 | 260 | 0 | 0 |
| commerce:vente (same) | 1367 | 1367 | 0 | 0 |
| commerce:caisse (same) | 444 | 444 | 0 | 0 |
| commerce:commercial | 1196 | 1200 | 4 | 0 |
| commerce:alimentaire (same) | 473 | 473 | 0 | 0 |
| commerce:magasin (same) | 230 | 230 | 0 | 0 |
| industrie:production (same) | 406 | 406 | 0 | 0 |
| industrie:qualite | 901 | 919 | 19 | 1 |
| industrie:montage (same) | 631 | 631 | 0 | 0 |
| industrie:etudes (same) | 1335 | 1335 | 0 | 0 |
| hotellerie:cuisine (same) | 304 | 304 | 0 | 0 |
| hotellerie:salle (same) | 230 | 230 | 0 | 0 |
| hotellerie:accueil | 1142 | 1140 | 1 | 3 |
| hotellerie:direction (same) | 445 | 445 | 0 | 0 |
| admin:secretariat (same) | 317 | 317 | 0 | 0 |
| admin:compta | 227 | 316 | 91 | 2 |
| admin:rh (same) | 320 | 320 | 0 | 0 |
| droit:juridique (same) | 544 | 544 | 0 | 0 |
| agriculture:culture (same) | 1071 | 1071 | 0 | 0 |
| agriculture:paysage | 807 | 803 | 3 | 7 |
| agriculture:foret | 725 | 726 | 2 | 1 |
| artisanat:art (same) | 959 | 959 | 0 | 0 |
| artisanat:spectacle (same) | 927 | 927 | 0 | 0 |
| artisanat:creation | 903 | 902 | 2 | 3 |
| banque:banque (same) | 505 | 505 | 0 | 0 |
| banque:assurance (same) | 304 | 304 | 0 | 0 |
| banque:immo (same) | 222 | 222 | 0 | 0 |
| communication:comm | 970 | 971 | 1 | 0 |
| communication:design (same) | 483 | 483 | 0 | 0 |
| communication:audiovisuel (same) | 832 | 832 | 0 | 0 |
| social:social (same) | 763 | 763 | 0 | 0 |
| social:enseignement (same) | 1435 | 1435 | 0 | 0 |
| social:domicile (same) | 309 | 309 | 0 | 0 |
| social:territoire (same) | 519 | 519 | 0 | 0 |
| securite:securite | 1373 | 1373 | 1 | 1 |
| proprete:proprete (same) | 587 | 587 | 0 | 0 |
| transport:conduite (same) | 897 | 897 | 0 | 0 |
| transport:entrepot (same) | 474 | 474 | 0 | 0 |
| transport:exploitation | 636 | 657 | 22 | 1 |

## Member titles that changed (8)

| depth | job | title before → after |
|---|---|---|
| tech:code | M1801 | Administration de systèmes d'information → Administrateur / Administratrice de systèmes d'information (SI) |
| tech:sysadmin | M1810 | Production et exploitation de systèmes d'information (support) → Technicien / Technicienne d'exploitation informatique |
| tech:data | M1402 | Conseil en organisation et management d'entreprise → Responsable en organisation en entreprise |
| commerce:commercial | D1408 | Téléconseil et télévente → Conseiller / Conseillère clientèle à distance |
| industrie:qualite | H1502 | Management et ingénierie qualité industrielle → Responsable qualité en industrie |
| admin:compta | M1203 | Comptabilité → Comptable |
| admin:compta | M1204 | Contrôle de gestion → Contrôleur / Contrôleuse de gestion |
| transport:exploitation | N1303 | Intervention technique d'exploitation logistique → Approvisionneur / Approvisionneuse logistique |

## Seeded personas

| persona | roles before → after | gained | lost | top-10 changes | FORT@cut before → after |
|---|---|---|---|---|---|
| seed-only:tech:code | 564 → 565 | 1 | 0 | in M1801 / out M1853 | 1 → 2 |
| niche:tech:code | 620 → 621 | 1 | 0 | in F1107 / out M1806 | 1 → 2 |
| seed-only:tech:sysadmin | 213 → 225 | 12 | 0 | in I1106 M1810 / out I1403 M1841 | 0 → 0 |
| niche:tech:sysadmin | 259 → 270 | 11 | 0 | in M1810 I1310 M1802 / out M1817 M1816 H1106 | 0 → 0 |
| seed-only:tech:support | 256 → 256 | 0 | 0 | – | 0 → 0 |
| niche:tech:support | 289 → 289 | 0 | 0 | – | 0 → 0 |
| seed-only:tech:data | 403 → 428 | 28 | 3 | in M1402 / out M1836 | 2 → 2 |
| niche:tech:data | 448 → 476 | 29 | 1 | in M1402 M1301 / out M1802 M1405 | 2 → 2 |
| seed-only:sante:soin | 205 → 205 | 0 | 0 | – | 0 → 0 |
| niche:sante:soin | 236 → 236 | 0 | 0 | – | 1 → 1 |
| seed-only:sante:medico | 184 → 184 | 0 | 0 | – | 1 → 1 |
| niche:sante:medico | 247 → 247 | 0 | 0 | – | 1 → 1 |
| seed-only:sante:reeduc | 270 → 270 | 0 | 0 | – | 2 → 2 |
| niche:sante:reeduc | 295 → 295 | 0 | 0 | – | 2 → 2 |
| seed-only:btp:gros | 194 → 194 | 0 | 0 | – | 1 → 1 |
| niche:btp:gros | 241 → 241 | 0 | 0 | – | 1 → 1 |
| seed-only:btp:second | 195 → 195 | 0 | 0 | – | 0 → 0 |
| niche:btp:second | 234 → 234 | 0 | 0 | – | 0 → 0 |
| seed-only:btp:conduite | 421 → 421 | 0 | 0 | – | 6 → 6 |
| niche:btp:conduite | 466 → 466 | 0 | 0 | – | 7 → 7 |
| seed-only:maintenance:indus | 217 → 217 | 0 | 0 | – | 0 → 0 |
| niche:maintenance:indus | 253 → 253 | 0 | 0 | – | 0 → 0 |
| seed-only:maintenance:vehicule | 225 → 225 | 0 | 0 | – | 5 → 5 |
| niche:maintenance:vehicule | 267 → 267 | 0 | 0 | – | 5 → 5 |
| seed-only:maintenance:batiment | 232 → 232 | 0 | 0 | – | 0 → 0 |
| niche:maintenance:batiment | 236 → 236 | 0 | 0 | – | 0 → 0 |
| seed-only:commerce:vente | 803 → 803 | 0 | 0 | – | 3 → 3 |
| niche:commerce:vente | 825 → 825 | 0 | 0 | – | 3 → 3 |
| seed-only:commerce:caisse | 331 → 331 | 0 | 0 | – | 1 → 1 |
| niche:commerce:caisse | 376 → 376 | 0 | 0 | – | 1 → 1 |
| seed-only:commerce:commercial | 652 → 659 | 7 | 0 | – | 7 → 7 |
| niche:commerce:commercial | 676 → 682 | 6 | 0 | in D1408 / out M1607 | 7 → 7 |
| seed-only:commerce:alimentaire | 262 → 262 | 0 | 0 | – | 0 → 0 |
| niche:commerce:alimentaire | 288 → 288 | 0 | 0 | – | 0 → 0 |
| seed-only:commerce:magasin | 179 → 179 | 0 | 0 | – | 2 → 2 |
| niche:commerce:magasin | 237 → 237 | 0 | 0 | – | 2 → 2 |
| seed-only:industrie:production | 345 → 345 | 0 | 0 | – | 0 → 0 |
| niche:industrie:production | 375 → 375 | 0 | 0 | – | 0 → 0 |
| seed-only:industrie:qualite | 566 → 583 | 22 | 5 | – | 1 → 1 |
| niche:industrie:qualite | 624 → 637 | 20 | 7 | in I1102 H1504 / out I1503 K2402 | 1 → 1 |
| seed-only:industrie:montage | 356 → 356 | 0 | 0 | – | 1 → 1 |
| niche:industrie:montage | 376 → 376 | 0 | 0 | – | 1 → 1 |
| seed-only:industrie:etudes | 879 → 879 | 0 | 0 | – | 3 → 3 |
| niche:industrie:etudes | 935 → 935 | 0 | 0 | – | 4 → 4 |
| seed-only:hotellerie:cuisine | 136 → 136 | 0 | 0 | – | 2 → 2 |
| niche:hotellerie:cuisine | 181 → 181 | 0 | 0 | – | 2 → 2 |
| seed-only:hotellerie:salle | 147 → 147 | 0 | 0 | – | 0 → 0 |
| niche:hotellerie:salle | 189 → 189 | 0 | 0 | – | 0 → 0 |
| seed-only:hotellerie:accueil | 741 → 741 | 0 | 0 | – | 2 → 2 |
| niche:hotellerie:accueil | 775 → 775 | 0 | 0 | – | 3 → 3 |
| seed-only:hotellerie:direction | 396 → 396 | 0 | 0 | – | 0 → 0 |
| niche:hotellerie:direction | 464 → 464 | 0 | 0 | – | 0 → 0 |
| seed-only:admin:secretariat | 257 → 257 | 0 | 0 | – | 0 → 0 |
| niche:admin:secretariat | 287 → 287 | 0 | 0 | – | 0 → 0 |
| seed-only:admin:compta | 134 → 160 | 27 | 1 | in G1237 M1203 C1301 / out K1513 M1202 M1211 | 0 → 1 |
| niche:admin:compta | 182 → 214 | 32 | 0 | in M1203 / out M1207 | 0 → 1 |
| seed-only:admin:rh | 205 → 205 | 0 | 0 | – | 2 → 2 |
| niche:admin:rh | 280 → 280 | 0 | 0 | – | 2 → 2 |
| seed-only:droit:juridique | 254 → 254 | 0 | 0 | – | 2 → 2 |
| niche:droit:juridique | 277 → 277 | 0 | 0 | – | 2 → 2 |
| seed-only:agriculture:culture | 496 → 496 | 0 | 0 | – | 2 → 2 |
| niche:agriculture:culture | 540 → 540 | 0 | 0 | – | 2 → 2 |
| seed-only:agriculture:paysage | 459 → 459 | 0 | 0 | – | 1 → 1 |
| niche:agriculture:paysage | 519 → 519 | 0 | 0 | in K1811 / out A1303 | 3 → 3 |
| seed-only:agriculture:foret | 467 → 468 | 1 | 0 | – | 4 → 4 |
| niche:agriculture:foret | 483 → 484 | 1 | 0 | – | 4 → 4 |
| seed-only:artisanat:art | 436 → 436 | 0 | 0 | – | 6 → 6 |
| niche:artisanat:art | 481 → 481 | 0 | 0 | – | 6 → 6 |
| seed-only:artisanat:spectacle | 374 → 374 | 0 | 0 | – | 9 → 9 |
| niche:artisanat:spectacle | 391 → 391 | 0 | 0 | – | 9 → 9 |
| seed-only:artisanat:creation | 298 → 298 | 0 | 0 | – | 6 → 6 |
| niche:artisanat:creation | 312 → 312 | 0 | 0 | – | 7 → 7 |
| seed-only:banque:banque | 484 → 484 | 0 | 0 | – | 0 → 0 |
| niche:banque:banque | 523 → 523 | 0 | 0 | – | 0 → 0 |
| seed-only:banque:assurance | 259 → 259 | 0 | 0 | – | 0 → 0 |
| niche:banque:assurance | 316 → 316 | 0 | 0 | – | 0 → 0 |
| seed-only:banque:immo | 187 → 187 | 0 | 0 | – | 1 → 1 |
| niche:banque:immo | 226 → 226 | 0 | 0 | – | 1 → 1 |
| seed-only:communication:comm | 452 → 452 | 0 | 0 | – | 1 → 1 |
| niche:communication:comm | 504 → 504 | 0 | 0 | – | 2 → 2 |
| seed-only:communication:design | 300 → 300 | 0 | 0 | – | 1 → 1 |
| niche:communication:design | 336 → 336 | 0 | 0 | – | 1 → 1 |
| seed-only:communication:audiovisuel | 593 → 593 | 0 | 0 | – | 1 → 1 |
| niche:communication:audiovisuel | 632 → 632 | 0 | 0 | – | 1 → 1 |
| seed-only:social:social | 550 → 550 | 0 | 0 | – | 0 → 0 |
| niche:social:social | 574 → 574 | 0 | 0 | – | 0 → 0 |
| seed-only:social:enseignement | 669 → 669 | 0 | 0 | – | 12 → 12 |
| niche:social:enseignement | 688 → 688 | 0 | 0 | – | 14 → 14 |
| seed-only:social:domicile | 202 → 202 | 0 | 0 | – | 2 → 2 |
| niche:social:domicile | 224 → 224 | 0 | 0 | – | 2 → 2 |
| seed-only:social:territoire | 399 → 399 | 0 | 0 | – | 1 → 1 |
| niche:social:territoire | 440 → 440 | 0 | 0 | – | 1 → 1 |
| seed-only:securite:securite | 586 → 587 | 1 | 0 | – | 3 → 3 |
| niche:securite:securite | 618 → 619 | 1 | 0 | – | 3 → 3 |
| seed-only:proprete:proprete | 395 → 395 | 0 | 0 | – | 0 → 0 |
| niche:proprete:proprete | 441 → 441 | 0 | 0 | – | 0 → 0 |
| seed-only:transport:conduite | 474 → 474 | 0 | 0 | – | 6 → 6 |
| niche:transport:conduite | 502 → 502 | 0 | 0 | – | 6 → 6 |
| seed-only:transport:entrepot | 259 → 259 | 0 | 0 | – | 6 → 6 |
| niche:transport:entrepot | 293 → 293 | 0 | 0 | – | 6 → 6 |
| seed-only:transport:exploitation | 261 → 267 | 6 | 0 | in N1303 / out N1210 | 7 → 7 |
| niche:transport:exploitation | 310 → 314 | 6 | 2 | reordered | 7 → 7 |
| hand:sante_seed_hands_on | 223 → 223 | 0 | 0 | – | 0 → 0 |
| hand:shape_b_analytical | 1310 → 1311 | 1 | 0 | in M1801 I1102 / out M1841 M1836 | 4 → 5 |
| hand:shape_b_commercial | 1302 → 1303 | 1 | 0 | in M1801 / out D1441 | 4 → 5 |
| hand:masters_hr_rh_seed | 254 → 254 | 0 | 0 | – | 2 → 2 |
| hand:masters_hr_old_rh_seed | 226 → 226 | 0 | 0 | – | 2 → 2 |

seeded personas with no change at all: 86
unseeded personas: 60/60 byte-identical inventories and identical role lists

## Answers-only personas

The 60 unseeded personas (51 answers:* and 9 hand-written) have byte-identical
inventories (`JSON.stringify(buildInventory(answers))`) and identical role lists
before and after. Seeds are only read when a seed answer is present.

## Leak guard and bound

`seed-leak-guard.ts` after: the 9 guarded niches share 0 codes with D1408; 51 seed
depths, 0 codes above 10 domaines; no empty depth. The 8 old-token aliases resolve
to existing current tokens with the same seed.
