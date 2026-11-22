# Generic codes out of seeds, and the answer-linked audit

Date: 2026-11-22. Branch `vocab-reach` from 94b96bc. Live graph (1,923 jobs,
32,229 codes), dev database, offers 75.

## The bound

A code listed by jobs in more than **10 of the 110 ROME domaines professionnels** is
a macro-competence (`config/genericity.ts`, `MAX_CODE_DOMAINES`). One bound for every
seed depth and, by the same measure, for answer-linked skills.

Distribution it was cut from (domaines listing each code):

| Domaines | All codes | Seed entries | Mean share of the code's jobs inside the seeding niche |
|---|---|---|---|
| 1 | 21,894 | 13,607 | 97% |
| 2 | 5,485 | 6,836 | 49% |
| 3 | 2,032 | 3,789 | 33% |
| 4-5 | 1,470 | 3,840 | 23% |
| 6-8 | 671 | 2,694 | 15% |
| 9-10 | 183 | 1,003 | 11% |
| 11-15 | 239 | 1,749 | 8% |
| 16-20 | 85 | 876 | 6% |
| 21-30 | 105 | 1,516 | 4% |
| 31-111 | 65 | 1,239 | 3% |

98% of all codes sit at or under 10. The widest niche spans 2 domaines; above 10,
a seed code mostly describes jobs outside the niche that seeds it. Tried 20 as well:
same family presence, same C1201 reach, half the codes removed.

## Seeds (done)

5,380 seed entries removed across the 51 depths (48 to 195 per depth). The seed leak
guard now fails on any seed code above the bound; it failed with 5,380 violations on
the old seeds and passes on the new ones. Family presence 51/51; no niche's seeded
rank got worse (three improved: commerce:commercial, industrie:production,
banque:immo, 2 → 1).

## C1201 still reaches more than half the personas: why

After the seed filter C1201 is in the top 10 of **60 of 116** personas (59 before).
Every code carrying it is answer-linked, and all but one are macro-competences:

| Code | Personas where it matches C1201 | Domaines | Answer groups |
|---|---|---|---|
| 300361 Accueillir, orienter, renseigner un public | 53 | 35 | relation_client, contact |
| 300345 Gérer des réclamations et litiges | 52 | 28 | gestion_conflit |
| 300363 Identifier, traiter une demande client | 50 | 23 | contact |
| 300366 Recueillir et analyser les besoins client | 50 | 31 | contact |
| 300448 Respecter des règles, des consignes… | 44 | 43 | rigueur, fiabilite |
| 300461 Faire preuve de sens des responsabilités | 42 | 67 | fiabilite |
| 300462 Rendre compte de son activité | 42 | 36 | fiabilite |
| 300464 Gérer un planning | 40 | 21 | organisation, priorisation, planification |
| 300374 Présenter et valoriser un produit ou un service | 39 | 28 | vente, presentation |
| 300014 Conseiller, accompagner une personne | 35 | 21 | pedagogie |
| 121718 Classer des documents | 30 | 5 | administration |
| 300428 Utiliser des logiciels spécifiques | 29 | 37 | numerique |
| 102226 Normes rédactionnelles | 23 | 18 | ecriture |
| 300473 Faire preuve de réactivité | 21 | 84 | adaptabilite |

Seed codes match C1201 in at most 7 personas each (banking and checkout niches,
all concentrated codes). M1201 reaches 4 of 116, through 300067, 300452, 300456,
300322 (answer-linked, 16-38 domaines).

Measured in memory (not committed): dropping all 86 answer-linked codes above the
bound takes C1201 and M1201 to 0 and answers-only reach from 42 to 46 / 110, keeps
every seeded niche in its top 10, but empties 21 of the answer groups and moves the
attractor: M1602 then reaches 55 of 116 personas, M1607 50, D1408 36.

## Answer-linked skills above the bound (the list, nothing removed)

| Group | Code | Domaines | Skill |
|---|---|---|---|
| relation_client | 100541 | 42 | Techniques de communication orales, écrites et numériques |
| relation_client | 403015 | 11 | Garantir la satisfaction du client |
| relation_client | 300361 | 35 | Accueillir, orienter, renseigner un public |
| gestion_donnees | 300067 | 38 | Analyser, exploiter, structurer des données |
| gestion_donnees | 300253 | 35 | Contrôler la conformité des données |
| gestion_donnees | 300431 | 35 | Mettre à jour un dossier, une base de données |
| contact | 300361 | 35 | Accueillir, orienter, renseigner un public |
| contact | 300363 | 23 | Identifier, traiter une demande client |
| contact | 300364 | 37 | Répondre aux attentes d'un client |
| contact | 300366 | 31 | Recueillir et analyser les besoins client |
| terrain | 300153 | 14 | Utiliser un outil, une machine, un équipement, une installation |
| terrain | 300152 | 26 | Préparer du matériel en prévision d'un travail |
| organisation | 300436 | 37 | Organiser le travail d'une équipe |
| organisation | 300464 | 21 | Gérer un planning |
| organisation | 300488 | 45 | Concevoir et gérer un projet |
| vente | 300371 | 16 | Prospecter de nouveaux clients, de nouveaux marchés |
| vente | 300374 | 28 | Présenter et valoriser un produit ou un service |
| vente | 300377 | 17 | Elaborer, adapter une proposition commerciale |
| persuasion | 300415 | 21 | Convaincre, négocier |
| persuasion | 300418 | 14 | Promouvoir une proposition, un projet |
| persuasion | 300413 | 12 | Prendre la parole en public |
| resolution | 300185 | 28 | Réaliser un diagnostic technique |
| resolution | 300182 | 11 | Réparer un équipement, une machine, une installation |
| resolution | 300183 | 22 | Réaliser une opération de maintenance |
| support | 300184 | 25 | Apporter une assistance technique aux équipes |
| support | 300181 | 33 | Entretenir un équipement, une machine, une installation |
| systemes | 300321 | 20 | Concevoir des outils de pilotage, indicateurs, tableaux de bord |
| systemes | 300146 | 26 | Elaborer des processus et des modes opératoires techniques |
| analyse | 300456 | 16 | Analyser une situation et produire un diagnostic |
| analyse | 300082 | 13 | Analyser, résoudre un problème courant ou complexe |
| analyse | 300067 | 38 | Analyser, exploiter, structurer des données |
| rigueur | 300490 | 109 | Faire preuve de rigueur et de précision |
| rigueur | 300448 | 43 | Respecter des règles, des consignes, normes et procédures opérationnelles |
| rigueur | 300446 | 67 | Respecter les règles de Qualité, Hygiène, Sécurité, Santé et Environnement (QHSSE) |
| adaptabilite | 402000 | 15 | Faire preuve d'agilité dans son action selon les contextes |
| adaptabilite | 300473 | 84 | Faire preuve de réactivité |
| adaptabilite | 300479 | 64 | Etre ouvert aux changements |
| decision_incertitude | 300459 | 20 | Prendre une décision et l'expliquer |
| decision_incertitude | 300353 | 14 | Evaluer une situation à risques |
| autonomie | 300460 | 93 | Faire preuve d'autonomie |
| autonomie | 300483 | 106 | Organiser son travail selon les priorités et les objectifs |
| detection_incoherence | 300253 | 35 | Contrôler la conformité des données |
| detection_incoherence | 300322 | 26 | Contrôler des indicateurs de performance, analyser et corriger des écarts |
| scalabilite | 300321 | 20 | Concevoir des outils de pilotage, indicateurs, tableaux de bord |
| scalabilite | 300146 | 26 | Elaborer des processus et des modes opératoires techniques |
| priorisation | 300483 | 106 | Organiser son travail selon les priorités et les objectifs |
| priorisation | 300464 | 21 | Gérer un planning |
| leadership | 300489 | 75 | Faire preuve de leadership |
| leadership | 300440 | 81 | Animer, coordonner une équipe |
| leadership | 300436 | 37 | Organiser le travail d'une équipe |
| fiabilite | 300461 | 67 | Faire preuve de sens des responsabilités |
| fiabilite | 300462 | 36 | Rendre compte de son activité |
| fiabilite | 300448 | 43 | Respecter des règles, des consignes, normes et procédures opérationnelles |
| transmission | 300021 | 57 | Transmettre une technique, un savoir-faire |
| transmission | 300020 | 11 | Transmettre une méthodologie, un procédé |
| transmission | 300022 | 31 | Enseigner, développer des compétences |
| pedagogie | 300022 | 31 | Enseigner, développer des compétences |
| pedagogie | 300014 | 21 | Conseiller, accompagner une personne |
| gestion_conflit | 300441 | 23 | Prévenir et résoudre les conflits |
| gestion_conflit | 300480 | 16 | Gérer une situation conflictuelle |
| gestion_conflit | 300345 | 28 | Gérer des réclamations et litiges |
| ecriture | 300408 | 72 | Rédiger un rapport, un compte rendu d'activité |
| ecriture | 300188 | 23 | Rédiger un cahier des charges, des spécifications techniques |
| ecriture | 102226 | 18 | Normes rédactionnelles |
| presentation | 300469 | 34 | Préparer et animer une réunion, un groupe de travail, un atelier |
| presentation | 300374 | 28 | Présenter et valoriser un produit ou un service |
| presentation | 404536 | 25 | Représenter sa structure ou son service lors d'un événement ou auprès d'instances de décision |
| iteration | 300080 | 25 | Procéder à des tests, expérimentations |
| iteration | 300073 | 12 | Concevoir et faire évoluer un modèle, un prototype |
| synthese | 300458 | 22 | Structurer, synthétiser des informations |
| investigation | 300452 | 28 | Collecter et analyser des données, des informations |
| investigation | 300067 | 38 | Analyser, exploiter, structurer des données |
| diagnostic | 300456 | 16 | Analyser une situation et produire un diagnostic |
| diagnostic | 300082 | 13 | Analyser, résoudre un problème courant ou complexe |
| reporting | 300321 | 20 | Concevoir des outils de pilotage, indicateurs, tableaux de bord |
| reporting | 300322 | 26 | Contrôler des indicateurs de performance, analyser et corriger des écarts |
| qualite | 300253 | 35 | Contrôler la conformité des données |
| empathie | 107926 | 11 | Techniques d'écoute active |
| besoin_harmonie | 300441 | 23 | Prévenir et résoudre les conflits |
| apprentissage | 300492 | 29 | Actualiser régulièrement ses connaissances |
| apprentissage | 300081 | 34 | Réaliser une veille technique ou technologique pour anticiper les évolutions |
| planification | 300636 | 31 | Organiser et planifier une activité |
| planification | 300464 | 21 | Gérer un planning |
| numerique | 300428 | 37 | Utiliser des logiciels spécifiques |
| numerique | 100113 | 12 | Logiciels de gestion de base de données |
| assurance | 118943 | 11 | Défendre un projet devant un comité de pilotage, des collaborateurs ou des partenaires |

Answers feeding each group (options marked context-only or lean-only excluded):

```
relation_client 7 sf_numbers_people/B sf_client_issue/B g_conflict/A
gestion_donnees 3 sf_numbers_people/A sf_data_files/A
contact 4 sf_numbers_people/B sf_write_explain/B g_conflict/A
terrain 4 sf_hands_organise/A
organisation 3 f_order_improv/A sf_hands_organise/B sf_project_followup/A
vente 4 sf_sell_fix/A
persuasion 3 sf_sell_fix/A
resolution 4 sf_sell_fix/B
support 5 sf_sell_fix/B sf_client_issue/A
systemes 4 f_order_improv/A f_scale_task/A f_repeat_problem/A f_detail_big_picture/B sf_digital_tools/A
analyse 3 f_surface_depth/B f_repeat_problem/A sf_data_files/B
rigueur 3 f_leverage_completeness/B f_decide_wait/B f_detail_big_picture/A sf_numbers_people/A sf_data_files/A sf_training_peer/B g_lead_support/B g_status_authority/B
adaptabilite 3 f_order_improv/B f_ambiguous_instruction/B sf_digital_tools/B
decision_incertitude 2 f_decide_wait/A f_ambiguous_instruction/B g_lead_support/A
autonomie 2 f_decide_wait/A
detection_incoherence 3 f_surface_depth/B f_detail_big_picture/A
scalabilite 3 f_scale_task/A
priorisation 2 f_leverage_completeness/A
leadership 4 g_lead_support/A g_boundaries/A
fiabilite 3 f_leverage_completeness/B f_repeat_problem/B sf_create_express/B sf_project_followup/B g_lead_support/B g_hidden_need/B
transmission 3 sf_training_peer/A g_teach_do/A
pedagogie 2 sf_write_explain/B sf_training_peer/A g_teach_do/A
gestion_conflit 3 g_conflict/A g_boundaries/A
ecriture 6 sf_write_explain/A sf_create_express/A
presentation 3 sf_write_explain/B
iteration 2 f_ambiguous_instruction/B
synthese 1 f_new_domain/A sf_write_explain/A sf_data_files/B g_status_authority/A
creation 6 sf_create_express/A
manuel 5 sf_hands_organise/A
technique 5 sf_sell_fix/B
investigation 3 f_new_domain/A sf_client_issue/A
diagnostic 2 f_surface_depth/B sf_client_issue/A g_hidden_need/A
reporting 5 sf_data_files/B
qualite 2 f_detail_big_picture/A sf_data_files/A
empathie 4 sf_client_issue/B g_boundaries/B g_hidden_need/A
besoin_harmonie 4 g_boundaries/B
apprentissage 2 f_new_domain/A
planification 2 sf_hands_organise/B sf_project_followup/A
numerique 5 sf_digital_tools/A
assurance 1 g_status_authority/A
administration 2 sf_numbers_people/A
documentation 1 sf_write_explain/A sf_training_peer/B g_conflict/B
coordination 2 sf_hands_organise/B sf_project_followup/A g_lead_support/A
rh_admin 6 sf_people_accounts/A
comptabilite 8 sf_people_accounts/B
```

## Engine rule: diagnosis and attempts (2026-11-22, not committed)

**Why the rarity term doesn't already demote these codes.** `rankScore` adds six
normalised terms: leap 0.6, coverage 0.8, **rarity 0.4**, **lean 1.1**, interest
0.25, mobility 0.08 (`W_RARITY = 0.4` is the value used at runtime). The rarity term
is per job: `rarityScore = Σ max(0, idf − 3) / n` over that job's matched codes
(`RARITY_GENERIC_FLOOR = 3`), normalised by the highest `rarityScore` in the
request's surfaced set. It already gives C1201's generic codes almost nothing
(idf 1.6–3.8, mostly under the floor). But the lean term counts every matched
code at full weight (Σ of the cluster scores owning it) and coverage counts it as
one; those two are worth 1.9 of the score and carry C1201:

| Persona | C1201 rank | Shared codes | Rarity term | Lean term | Coverage term | C1201 lean from codes in >10 domaines |
|---|---|---|---|---|---|---|
| people (cognitive) | #4 | 6 | 0.04 | 1.03 | 0.69 | 28 of 28 |
| hr_assistant | #3 | 12 | 0.07 | 1.03 | 0.74 | 38 of 38.5 |
| answers:hotellerie:accueil | #1 | 11 | 0.03 | 1.10 | 0.80 | 53.5 of 53.5 |
| niche:hotellerie:direction | #10 | 13 | 0.07 | 0.89 | 0.17 | 39.5 of 40.5 |

**Attempts, on the 116 personas** (C1201 / M1201 = number of top 10s; reach = answers-only):

| Variant | C1201 | M1201 | Jobs in more than half the top 10s | Answers-only reach |
|---|---|---|---|---|
| Today | 60 | 4 | C1201 60 | 42 |
| Rarity weight 0.4 → 1.1 | 41 | 2 | none (M1602 49) | 42 |
| Rarity weight 0.4 → 2.0 | 29 | 1 | none (M1602 39, M1607 36) | 43 |
| Spread weight on lean, w = min(1, 10/domaines) | 52 | 3 | M1602 61 | 42 |
| Spread weight on lean and coverage, same w | 46 | 2 | M1602 63, M1607 58 | 41 |
| Spread weight on lean and coverage, w = min(1, (10/domaines)²) | 4 | 1 | M1602 68, M1607 65 | 39 |

Every seeded niche keeps a job of its own in its top 10 in every variant.

Once the generic codes weigh less, the strongest shared vocabulary left is the
secretariat skills that common answers bring: 123475 Organiser un rétroplanning and
484384 Maintenir à jour les dossiers administratifs (coordination, fed by
sf_hands_organise B and sf_project_followup A), 489964 (documentation), 121411 /
121718 (administration). They carry M1602 in 55–63 of the 116 top 10s.

## Last round: earned vs unearned appearances, and the rule (2026-11-22)

An appearance of job J in persona P's top 10 is **earned** when P shares at least 3
codes under the bound (≤ 10 domaines) with J, from answers or seed; otherwise it is
unearned. Measured in memory on the 116 personas; live data, dev database, 75.

| | (0) today | (1) spread weight, linear | (2) spread weight, squared | (3) W_RARITY 1.1 |
|---|---|---|---|---|
| Unearned appearances, all jobs | 631 | 479 | 412 | 480 |
| Jobs in > 25% of top 10s (appearances, unearned, earned share) | C1201 60, 54, 10% · H2701 40, 40, 0% · H1402 39, 37, 5% · M1602 36, 2, 94% | M1602 63, 6, 90% · M1607 58, 12, 79% · C1201 46, 40, 13% · C1102 42, 35, 17% · D1408 40, 0, 100% · I1102 32, 27, 16% · H2905 32, 0, 100% | M1602 68, 6, 91% · M1607 65, 12, 82% · D1408 47, 0, 100% · C1102 44, 37, 16% · H2905 32, 0, 100% · H2908 32, 24, 25% · M1605 32, 3, 91% | M1602 49, 11, 78% · C1201 41, 40, 2% · M1607 34, 8, 76% |
| Every job above 25% at least 90% earned | no | no | no | no |
| Answers-only reach | 42 | 41 | 39 | 42 |
| Domains lost vs today | | 12: A14 E13 F17 G12 G16 G17 H33 I12 K24 N22 (only codes over the bound), M17 M18 (also codes under it) | 17: as (1) minus M18, plus D12 M17 (codes under the bound), H14 H25 H27 M13 N42 | 5: A14 E13 G17 N22 (only codes over the bound), M18 (115552, 1 domaine) |
| Every lost domain reached only through codes over the bound | yes (none lost) | no (M17, M18) | no (D12, M17) | no (M18) |
| Shape-B analytical top 3 (rarity part / lean part) | H2701 0.06/1.10 · M1853 0.21/0.47 · M1848 0.22/0.47 | D1207 0.31/0.33 · M1844 0.28/0.82 · M1202 0.09/0.99 | D1207 0.31/0.53 · M1844 0.28/0.93 · M1605 0.16/1.10 | **D1201 Brocanteur 0.87/0.21** · M1828 0.80/0.47 · D1234 0.90/0.21 (all three rarity picks) |
| Analytical vs santé top-5 overlap | 0 | 0 | 0 | 0 |

**Rule outcome.** Step 1: no variant has every job above 25% at least 90% earned, so
none ships under step 1 (variants 1 and 2 also lose domains reached through codes
under the bound). Step 2: W_RARITY 1.1 fails the same 90% condition (M1602 78%,
C1201 2%) and check (c) (Brocanteur first, all top 3 rarity picks). Step 3: nothing
ships; the engine stays as it is.

## Pre-merge check of the seed filter: Signal tiers move (2026-11-22)

Before = 94b96bc, after = 65aa09e, both merged with `directions` as it stood
during the run (54e88cb when the run started; the branch has moved since) in a
throwaway worktree. Live data, dev database, 75.

| Signal tiers | Before | After |
|---|---|---|
| 116 personas, top 10s (1,160 appearances) | FORT 109 · MOYEN 954 · FAIBLE 97 | FORT 65 · MOYEN 981 · FAIBLE 114 |
| of which seeded personas (56) | FORT 109 · MOYEN 446 · FAIBLE 5 | FORT 65 · MOYEN 473 · FAIBLE 22 |
| of which unseeded personas (60) | FORT 0 · MOYEN 508 · FAIBLE 92 | unchanged |
| 51 family-presence depths, seed only, top 10 by the product `rankScore` | FORT 194 · MOYEN 313 · FAIBLE 3 | FORT 111 · MOYEN 399 · FAIBLE 0 |

Correction (integrator, same day): the first version of the depth row read FORT 127 ·
MOYEN 313 · FAIBLE 70 → FORT 73 · MOYEN 312 · FAIBLE 125. That run ordered each
depth with `rankScore()` called without `maxCoverage`, which then defaults to 1, so
coverage barely counted and jobs sharing one rare code (C1102, F1101, H2602 for
tech:code) entered the top 10. The row above orders by `d.rankScore`, the value the
engine computes with the real normalisers. With it, tech:code's seed-only top 10 is
developer jobs before and after (1 FORT · 9 MOYEN both times). 36 of 51 depths change
their mix, all FORT → MOYEN; the largest: hotellerie:accueil and agriculture:culture
8 → 2 FORT, services:social 6 → 0, communication:audiovisuel 5 → 1. The persona rows
above use the display order (`sortForDisplay`) and stand.

The tier reads the sum of the shared codes' idf (`matchRaritySum`). Taking the
macro-competences out of the seeds lowers that sum for seeded matches, so jobs fall
under FORT (350): no depth's top 10 gains a FAIBLE. Decision (George, 2026-11-22):
the seed filter merges with FORT left at 350. Family presence holds at 51/51 because
it only needs one job of the niche that isn't FAIBLE.

Directions (`directions` scripts): parity 66/66 identical before and after (263 →
232 directions); evidence bar 38/38 invariants before and after; révélée across the
15 answered personas 3 → 6.
