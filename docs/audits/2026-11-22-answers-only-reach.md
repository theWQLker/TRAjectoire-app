# Answers-only reach: what the 41 scenes can and cannot evidence

Date: 2026-11-22. Tree: `vocab-reach` after 7a02e3e (« Dans l'action » context-only,
quiz counter fix). Method: `scripts/reach-map.ts` (unchanged). Offer counts are the
cached offers for département 75 (the only zone in the cache, collected
2026-06-30), summed over each domain's jobs.

**Reach from answers alone: 39 → 40 / 110** after making « Dans l'action »
context-only (F15 22 → 19; nothing lost). 70 domains stay outside the top 20.

**Question asked:** for each of the 70, does an existing answer, by its meaning,
name skills that the domain's fiches list and that are concentrated in that domain
(≥ 40% of the jobs listing the skill are in it, at most 30 jobs list it)? These are
proposals only: no question is added, removed or reworded.

## What existing answers could carry (vocabulary only, no question change)

| Answer | Skills it names | Domain helped |
|---|---|---|
| sf_digital_tools A « Je règle les étapes, les statuts, les accès et les champs. » | 115552 Gérer les droits d'accès des utilisateurs (8 of 8 carriers in M18), 300198 Paramétrer un logiciel, un outil, un système numérique (8/13) | M18 |
| sf_client_issue A « Je reconstruis le chemin : étapes, captures, logs, contexte. » | 489306 Diagnostiquer à distance un dysfonctionnement informatique (2/2), 504591 Diagnostiquer les pannes matérielles ou logicielles (I14 2/3), 489320 Analyse d'incidents informatiques (2/2) | I14, M18 |
| sf_write_explain A « Je préfère écrire clairement : structurer, résumer, clarifier. » | 518690 Structurer un récit ou un contenu de manière cohérente (E11 2/2), 505796 Synthétiser des informations pour rédaction de contenu (2/4), 102476 Adapter et préparer un écrit (3/4) | E11 |
| sf_people_accounts B « Je prends celui des comptes : factures, paiements, trésorerie. » | 117781 Comptabilité client (3/3), 117782 Comptabilité fournisseurs (3/3), 117139 Codifier une facture (2/2), 495189 Gestion des flux de trésorerie (2/2), 501439 Optimiser la gestion de la trésorerie (2/3) | M12 |

Measured in memory with all four additions (not committed): answers-only reach
**40 → 42 / 110**. I14 36 → 6, M18 30 → 13, J13 23 → 18 (side effect), E11 45 → 25
(closer, still out), M12 104 → 104 (the accounts side alone does not lift
accounting past the generic office jobs), L12 18 → 21 (lost).

## Every unreached domain, by cached offers

| Domain | Offers (75) | Jobs | Answers rank | Seed niche | Can an existing answer evidence its skills? |
|---|---|---|---|---|---|
| M12 | 1497 | 28 | 104 | admin:compta (#2 with seed) | yes, but not enough alone: sf_people_accounts B « factures, paiements, trésorerie » → 117781 Comptabilité client, 117782 Comptabilité fournisseurs, 117139 Codifier une facture, 495189 Gestion des flux de trésorerie, 501439 Optimiser la gestion de la trésorerie |
| M18 | 1188 | 96 | 30 | tech:code (#2 with seed) | yes: sf_digital_tools A « je règle … les accès et les champs » → 115552 Gérer les droits d'accès des utilisateurs, 300198 Paramétrer un logiciel, un outil, un système numérique |
| J15 | 814 | 12 | 26 | sante:soin (#1 with seed) | no: no answer names care, health work |
| K13 | 719 | 14 | 40 | services:domicile (#1 with seed) | no: no answer names social, care, public service, law, security, cleaning work |
| C15 | 513 | 8 | 202 | banque:immo (#2 with seed) | no: no answer names banking, insurance, real estate work |
| J11 | 487 | 42 | 56 | — | no: no answer names care, health work |
| J13 | 390 | 12 | 23 | sante:medico (#1 with seed) | no answer names it; gains reach as a side effect of the additions above |
| F12 | 313 | 12 | 211 | btp:conduite (#10 with seed) | no: no answer names building sites work |
| K19 | 271 | 18 | 102 | admin:juridique (#1 with seed) | no: no answer names social, care, public service, law, security, cleaning work |
| M14 | 271 | 35 | 47 | tech:data (#2 with seed) | weak: sf_data_files B « ce que les données montrent » ≈ 492154 Analyse statistique (says more) |
| E11 | 258 | 34 | 45 | communication:comm (#1 with seed) | yes: sf_write_explain A « écrire clairement : structurer, résumer, clarifier » → 518690 Structurer un récit ou un contenu, 505796 Synthétiser des informations pour rédaction de contenu, 102476 Adapter et préparer un écrit |
| J14 | 253 | 16 | 107 | sante:reeduc (#1 with seed) | no: no answer names care, health work |
| G18 | 248 | 10 | 83 | hotellerie:salle (#1 with seed) | no: no answer names hotels, restaurants, tourism work |
| H12 | 206 | 46 | 38 | industrie:etudes (#1 with seed) | no: no answer names factory or lab work work |
| D11 | 202 | 20 | 43 | commerce:alimentaire (#1 with seed) | no: no answer names shop or food retail work |
| D15 | 201 | 17 | 35 | commerce:caisse (#1 with seed) | no: no answer names shop or food retail work |
| K25 | 166 | 15 | 21 | services:securite (#1 with seed) | no: no answer names social, care, public service, law, security, cleaning work |
| I14 | 127 | 11 | 36 | tech:support (#1 with seed) | yes: sf_client_issue A « je reconstruis le chemin : étapes, captures, logs » → 489306 Diagnostiquer à distance un dysfonctionnement informatique, 504591 Diagnostiquer les pannes matérielles ou logicielles, 489320 Analyse d'incidents informatiques |
| J12 | 108 | 4 | 123 | — | no: no answer names care, health work |
| G14 | 94 | 18 | 23 | hotellerie:direction (#1 with seed) | no: no answer names hotels, restaurants, tourism work |
| I16 | 91 | 38 | 38 | maintenance:vehicule (#1 with seed) | weak: sf_sell_fix B « réparer, faire fonctionner » ≈ 114218 Diagnostiquer les dysfonctionnements techniques (no vehicle named) |
| D13 | 90 | 5 | 862 | commerce:magasin (#1 with seed) | no: no answer names shop or food retail work |
| H15 | 85 | 35 | 123 | industrie:qualite (#1 with seed) | no: no answer names factory or lab work work |
| K18 | 80 | 17 | 30 | services:territoire (#1 with seed) | no: no answer names social, care, public service, law, security, cleaning work |
| C13 | 69 | 6 | 124 | — | no: no answer names banking, insurance, real estate work |
| M11 | 68 | 2 | 183 | — | no: no answer names office functions work |
| K11 | 66 | 14 | 25 | — | no: no answer names social, care, public service, law, security, cleaning work |
| N11 | 62 | 16 | 98 | transport:entrepot (#1 with seed) | no: no answer names transport, logistics work |
| N41 | 60 | 35 | 71 | transport:conduite (#2 with seed) | no: no answer names transport, logistics work |
| K17 | 45 | 48 | 424 | services:securite (#3 with seed) | no: no answer names social, care, public service, law, security, cleaning work |
| H13 | 44 | 13 | 79 | — | no: no answer names factory or lab work work |
| K22 | 42 | 5 | 39 | — | no: no answer names social, care, public service, law, security, cleaning work |
| G13 | 39 | 8 | 104 | — | no: no answer names hotels, restaurants, tourism work |
| L15 | 37 | 28 | 37 | artisanat:spectacle (#1 with seed) | no: no answer names stage, sport, events work |
| N12 | 36 | 10 | 52 | transport:exploitation (#5 with seed) | no: no answer names transport, logistics work |
| N13 | 35 | 8 | 25 | transport:exploitation (#1 with seed) | no: no answer names transport, logistics work |
| E14 | 32 | 15 | 42 | communication:audiovisuel (#1 with seed) | no: no answer names media, publishing work |
| A12 | 30 | 21 | 179 | agriculture:foret (#2 with seed) | no: no answer names agriculture, nature, animals work |
| K23 | 28 | 26 | 70 | services:proprete (#1 with seed) | no: no answer names social, care, public service, law, security, cleaning work |
| F13 | 24 | 3 | 232 | — | no: no answer names building sites work |
| B16 | 16 | 18 | 93 | artisanat:art (#1 with seed) | no: no answer names craft trades work |
| H24 | 15 | 27 | 179 | — | no: no answer names factory or lab work work |
| K26 | 14 | 6 | 28 | — | no: no answer names social, care, public service, law, security, cleaning work |
| I15 | 13 | 14 | 385 | — | no: no answer names maintenance of a named equipment work |
| B13 | 12 | 4 | 26 | — | no: no answer names craft trades work |
| N22 | 12 | 13 | 27 | — | no: no answer names transport, logistics work |
| N43 | 12 | 6 | 100 | — | no: no answer names transport, logistics work |
| A11 | 10 | 2 | 27 | — | no: no answer names agriculture, nature, animals work |
| A15 | 9 | 12 | 77 | — | no: no answer names agriculture, nature, animals work |
| C14 | 9 | 3 | 35 | — | no: no answer names banking, insurance, real estate work |
| F14 | 9 | 4 | 23 | — | no: no answer names building sites work |
| G11 | 9 | 8 | 327 | — | no: no answer names hotels, restaurants, tourism work |
| N44 | 7 | 6 | 25 | transport:conduite (#1 with seed) | no: no answer names transport, logistics work |
| K15 | 6 | 15 | 60 | — | no: no answer names social, care, public service, law, security, cleaning work |
| N21 | 5 | 4 | 51 | — | no: no answer names transport, logistics work |
| H34 | 4 | 11 | 161 | — | no: no answer names factory or lab work work |
| B11 | 3 | 4 | 30 | — | no: no answer names craft trades work |
| B17 | 3 | 2 | 194 | — | no: no answer names craft trades work |
| H21 | 3 | 9 | 699 | — | no: no answer names factory or lab work work |
| B15 | 2 | 5 | 416 | — | no: no answer names craft trades work |
| H23 | 2 | 4 | 164 | — | no: no answer names factory or lab work work |
| H28 | 2 | 11 | 37 | industrie:production (#2 with seed) | no: no answer names factory or lab work work |
| H32 | 2 | 5 | 260 | — | no: no answer names factory or lab work work |
| L11 | 2 | 4 | 132 | — | no: no answer names stage, sport, events work |
| N31 | 2 | 18 | 88 | — | no: no answer names transport, logistics work |
| N32 | 2 | 11 | 429 | — | no: no answer names transport, logistics work |
| B14 | 1 | 4 | 482 | — | no: no answer names craft trades work |
| L14 | 1 | 3 | 102 | — | no: no answer names stage, sport, events work |
| B12 | 0 | 1 | — | — | no: no answer names craft trades work |
| H31 | 0 | 6 | — | — | no: no answer names factory or lab work work |
## What it would take for the rest

The domains marked "no" need a question that names their work: care and health
(J11–J15, K13), real estate and finance (C13, C15), law (K19), building sites (F12,
F13–F15), transport and logistics (N11–N44), agriculture (A11–A15), crafts
(B11–B17), food and hotel trades (D11, D13, D15, G11–G18), security (K17, K25),
cleaning (K22, K23), factory and lab work (H12–H34). Fifteen of the top twenty by
offers already have a seed niche that puts them at #1 or #2, so the front door
reaches them; from answers alone they are out of reach by construction, since the
scenes describe ways of working, not trades. The ones with neither path and the
most offers are J11 (487) and J12 (108), waiting for the 9-zone data, then C13,
M11, K11.
