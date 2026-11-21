---
status: review
date: 2026-11-21
brief: "Directions: fix before UI"
generated_by: scripts/directions-prototype.ts (body below the line)
---

# Directions layer v7: after "fix before UI" (2026-11-21)

All seven decisions applied on live data. Before/after per persona is in the summary table and at the top of each persona section. Stopped after the genericity list (item 3), before any fix or UI.

## What I decided where the brief left room

These change results; each is mine and reversible.

- **"Brought by the answers" (item 1).** A role counts when it entered the top 40, or ranks higher, with the answers **and** shares, in the direction's own capacity, a skill only the answers gave. A direction is révélée when more than half its roles are. The capacity condition was needed: without it, analyse answers nudged a developer's software roles up a few places and "Construire des logiciels" read révélée with 0 answers behind it.
- **Evidence bar (item 2)** counts distinct skills across the member roles, and applies before the 5 slots are filled, so a thin group never takes a slot. "Different answers" = different quiz scenes.
- **Key word (item 5)**: a word of 3+ letters shared with the main title, accents and case ignored, a few stop words dropped.

## What moved

- **Thin directions:** P3 #2, P8 #4 and P2 #5 ("Former, transmettre", 1 skill each) are removed. **P4 #3 ("Animer un groupe") stays:** it has exactly 3 distinctive skills and is continuité, so the bar as set lets it through.
- **Révélée labels:**
  - The seller's "La relation client" (P9) now reads continuité: the commerce seed already holds those skills. The second-œuvre worker's "Travailler la matière" (P10) is removed: révélée on one answer only.
  - Révélée now means the answers changed the list. P6 (santé seed, relation answers) has 3 révélée directions; P4 (tech seed, analyse answers) has none.
- **Fewer directions:** 11 of 59 personas now have fewer than 3 directions (was 2). Every quiz-only persona is among them (P1 has 1; P2 and P3 have 2). The bar removes their thin groups, and their roles move to Autres pistes. This is the main cost of item 2.
- **Names:** all draft names joined exactly. 23 ROME objectifs that directions use are not in the draft (listed under *Naming and sector flags*); "Gérer, contrôler" names 3 directions. Sector labels: 3 domaines outside the draft's K and M lists.

## Genericity (item 3): the list, and why

**Against your rule (> 40 % of the 59 personas) the list is empty.** The most frequent role is Chargé d'accueil et de services clientèle bancaire at 15/59 (25 %). The 59 include 44 seed-only personas with no answers, and these roles come from the answers. So I ran the same rule on the **15 personas who answered the quiz**: 16 roles pass. Two fixed blocks emerge.

- **Relation/vente answers (7 personas).** The same ~10 roles appear whatever the seed (tech, santé, RH, commerce).
- **Analyse/terrain/organisation answers (8 personas).** H2504 and C1203 appear every time.

C1201 crosses both blocks (14/15).

**Where it comes from (the codes are in the tables below):**

1. **One quiz option bundles unrelated clusters.** `f_energy_context/B`, "Dans l'action, avec du mouvement et des échanges", maps to *adaptabilite + terrain + contact*. A preference for an active day becomes "Identifier, traiter une demande client" and "Transformer une matière première". Terrain and organisation personas pick it and receive customer-contact skills; relation personas pick it and receive material-processing skills.
2. **Generic macro-competences carry long ROME lists.** The contact cluster's codes (300361, 300363, 300364, 300366, idf 2.8–3.4) and the adaptability codes (300479, 402000, 300473) are in 12–13 of the 15 answered inventories. Roles listing 45–82 skills collect several of them.
3. **Seeds inject the same codes.** For example, 300479 "Etre ouvert aux changements" comes from 31 of the 44 seed depths, and 300361 from 21.

**Leak or honest, per role (my reading of the carriers):**

| Role | Personas (of 15) | Verdict | Why |
|---|---|---|---|
| Chargé d'accueil clientèle bancaire (C1201) | 14 | Leak | Contact-cluster codes and claims handling; reaches analyse/terrain/organisation through f_energy_context/B and seeds. Nothing banking. |
| Agent administratif banque ou assurance (C1401) | 9 | Leak | Same carriers plus "Faire preuve de réactivité". |
| Resp. service établissement touristique (G1403) | 9 | Leak | Relation-client basics, conflicts, planning; nothing about running a tourist site. |
| Chef de projet événementiel (E1107) | 9 | Leak | Carried by adaptability (402000 alone gives 15 %). |
| Enseignant de la conduite (K2110) | 8 | Leak | Conflict, listening, reception; teaching 6 %, driving none. |
| Conseiller technique agricole (A1304) | 8 | Leak | Analysis, listening, tech support; nothing agricultural. |
| Chargé d'affaires bancaires (C1203) | 8 | Leak | Rules, responsibility, decisions, dashboards; nothing banking. |
| Agent d'escale commerciale (N2201) | 7 | Leak | 56 % from three contact codes (300361, 300363, 300364), plus openness to change. |
| Educateur sportif (G1204) | 7 | Leak | Reception, communication, openness to change; no sport. |
| Architecte d'intérieur (F1102) | 7 | Leak | Contact codes, promoting a project; no design skill. |
| Encadrement industrie du bois (H2204) | 7 | Leak for relation personas | Terrain-cluster codes (300210 in 12/15) that relation personas get through f_energy_context/B. |
| Chef d'équipe en industrie (H2504) | 8 | Mixed | Honest for terrain/organisation (equipment, supply, processes, diagnosis); a leak for analyse personas. |
| Responsable service clients (M1704) | 8 | Mostly honest | Support requests, client feedback, claims are its core; appears for organisation personas too. |
| Conseiller commercial assurances (C1102) | 7 | Borderline | Client solutions and listening fit a relation profile; nothing insurance-specific. |
| Guichetier vendeur (C1211) | 7 | Borderline | Relation client, advice, presenting a product. |
| Conseiller clientèle à distance (D1408) | 7 | Honest | Carried by its own core (phone/chat answers 485132, client solutions); only relation/vente personas. |

Caveat: the personas are synthetic and answer by cluster overlap. The mechanism (one option giving three unrelated clusters, and generic codes from seeds) applies to real users too, but how often it fires for them is unmeasured.

No fix applied. The levers, for when you choose: split `f_energy_context/B`; weigh down codes present in most inventories; or drop generic macro-competences from seed depths.

---

# Directions layer: prototype on data (v7)

Generated by `scripts/directions-prototype.ts` on the live ROME graph and live offers (Paris). No UI, no engine weights changed.

## Method

Capacity level **objectif**, weight **distinctive** (idf − 3, the engine's generic floor). Top 40 roles in page order, grouped by main driving capacity (≥ 60 % of distinctive weight, at most 2); groups of 2+ roles only; at most 5 directions; a left-out role joins a chosen direction through its second capacity (unchanged since v6).

v7 decisions (2026-11-21):
1. **Révélée = counterfactual.** The same user is run again with the seed only. A member role is *brought by the answers* when it is not in the seed-only top 40 (or ranks higher with the answers) **and** shares, in the direction's capacity, at least one skill only the answers gave. A direction is *révélée* when more than half its roles are brought by the answers, else *continuité*. No seed: no tag.
2. **Evidence bar**: at least 3 distinct shared distinctive skills (idf above 3) in the main capacity, across the member roles; a révélée direction also needs answers from at least 2 different quiz scenes. Applied before the 5 slots are filled; below the bar, the roles go to Autres pistes.
3. **Genericity** of roles on the wide set: see the last section (diagnosis only, no fix).
4. **Names** from the naming draft (docs/rome/naming-draft-2026-11-21.md): main capacity only, the second as a subline. **Sectors** from the same draft (grand domaine; K and M by domaine professionnel).
5. **Copyable titles**: main ROME title (PRINCIPALE appellation) + up to 2 appellations sharing a key word with it; the rest counted as *Plus d'intitulés*.
6. **Order**: révélée directions first, then by strength.
7. **Autres pistes**: role, sector, signal; no reasons; *faible* roles only counted (behind a link in the UI).

## Summary: before (v6) and after (v7)

| Persona | Before (v6) | After (v7) | Removed by the evidence bar | Autres pistes shown / faible counted | Honesty |
|---|---|---|---|---|---|
| P1 Relation et transmission, sans seed | La relation client (R); Conseiller (R); Accompagner vers l'emploi (R); Concevoir des offres (R) | La relation client (–) | Conseiller; Accompagner vers l'emploi; Concevoir des offres | 12 / 19 | ✓ |
| P2 Analyse et systèmes, sans seed | Piloter des projets (R); Traiter l'information (R); Analyser des données (R); Contrôler la qualité (R); Former, transmettre (R) | Traiter l'information (–); Contrôler la qualité (–) | Piloter des projets; Analyser des données; Former, transmettre | 20 / 8 | ✓ |
| P3 Terrain et technique, sans seed | Travailler avec des machines (R); Former, transmettre (R); Entretenir et réparer (R); Réagir à l'imprévu (R); Travailler la matière (R) | Travailler avec des machines (–); Travailler la matière (–) | Former, transmettre; Entretenir et réparer; Réagir à l'imprévu | 12 / 21 | ✓ |
| P4 Seed tech:code + réponses analyse | Construire des logiciels (C); Analyser des données (C); Animer un groupe (C); Contrôler la qualité (C); Entretenir et réparer (C) | Construire des logiciels (C); Analyser des données (C); Animer un groupe (C); Contrôler la qualité (C); Entretenir et réparer (C) | – | 11 / 0 | ✓ |
| P5 Seed tech:code + réponses relation | Construire des logiciels (C); Fidéliser les clients (C); Développer une activité (C); La relation client (R) | La relation client (R); Construire des logiciels (C); Développer une activité (C) | Fidéliser les clients | 13 / 0 | ✓ |
| P6 Seed santé:soin + réponses relation | La relation client (R); Soigner (C); Conseiller (R); Réagir à l'imprévu (R); Prendre soin des personnes (C) | La relation client (R); Conseiller (R); Réagir à l'imprévu (R); Soigner (C); Prendre soin des personnes (C) | – | 11 / 3 | ✓ |
| P7 Seed admin:rh + réponses relation | Manager une équipe (C); Gérer l'administratif (C); Concevoir des formations (C); Gérer les compétences (C); La relation client (R) | La relation client (R); Manager une équipe (C); Gérer l'administratif (C); Concevoir des formations (C); Gérer les compétences (C) | – | 13 / 1 | ✓ |
| P8 Seed hôtellerie:cuisine + réponses terrain | Cuisiner (C); Travailler la matière (R); Protéger l'environnement (C); Former, transmettre (R); Entretenir et réparer (R) | Travailler la matière (R); Cuisiner (C); La relation client (C) | Protéger l'environnement; Former, transmettre; Entretenir et réparer | 22 / 2 | ✓ |
| P9 Seed commerce:vente + réponses vente | La relation client (C); Vendre (C); Bâtir une offre commerciale (C); Prendre soin des personnes (C); Travailler la matière (C) | La relation client (C); Vendre (C); Bâtir une offre commerciale (C); Prendre soin des personnes (C); Travailler la matière (C) | – | 17 / 0 | ✓ |
| P10 Seed btp:second + réponses organisation | Construire, bâtir (C); Travailler la matière (C); Convaincre (R); Gérer l'administratif (R); Tenir les comptes (C) | Réagir à l'imprévu (R); Construire, bâtir (C) | Travailler la matière; Convaincre; Gérer l'administratif; Tenir les comptes | 26 / 1 | ✓ |

R = révélée par vos réponses, C = dans la continuité de votre parcours, – = no tag (no seed). Before: v6 split (≥ 50 % of shared rarity from answers). After: counterfactual.

## P1: Relation et transmission, sans seed

Seed: aucun; diplôme bac3; inventaire 45 compétences (0 du seed); 819 pistes surfacées.

**Before (v6):** 1. La relation client (révélée, 7 métiers, preuves 6, 6 réponses); 2. Conseiller (révélée, 4 métiers, preuves 2, 10 réponses); 3. Accompagner vers l'emploi (révélée, 3 métiers, preuves 2, 3 réponses); 4. Concevoir des offres (révélée, 2 métiers, preuves 1, 3 réponses).

**Removed by the evidence bar:**
- Conseiller: 2 compétences distinctives partagées dans sa capacité (minimum 3). Ses 4 métiers vont dans Autres pistes.
- Accompagner vers l'emploi: 1 compétence distinctive partagée dans sa capacité (minimum 3). Ses 2 métiers vont dans Autres pistes.
- Concevoir des offres: 1 compétence distinctive partagée dans sa capacité (minimum 3). Ses 2 métiers vont dans Autres pistes.

**After (v7):** 1 direction.

### 1. La relation client

Pas d'étiquette (pas de parcours renseigné). Preuves : 6 compétences distinctives partagées dans « Gérer la relation client, recueillir et analyser les besoins client »; 6 réponses différentes. 3 métiers rattachés par leur 2e capacité.

Vos réponses derrière cette direction :
- « Échanger avec des personnes, comprendre leurs demandes, gérer la relation. » (sf_numbers_people, 7 compétences partagées)
- « J'appelle, je clarifie, je gère la tension. » (g_conflict, 7 compétences partagées)
- « Je rassure d'abord, puis je fais avancer la demande. » (sf_client_issue, 5 compétences partagées)
- « Dans l'action, avec du mouvement et des échanges. » (f_energy_context, 2 compétences partagées)

| Métier | Secteur | Signal | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|
| Conseiller / Conseillère clientèle à distance | Commerce et vente | moyen | Conseiller / Conseillère clientèle à distance ; Technicien / Technicienne de la vente à distance | +6 |
| Conseiller / Conseillère technique agricole | Agriculture, nature, animaux | moyen | Conseiller / Conseillère technique agricole ; Conseiller / Conseillère agricole ; Conseiller / Conseillère de gestion agricole | +10 |
| Responsable service clients | Marketing, ventes | moyen | Responsable service clients ; Responsable service clients online ; Responsable administratif(tive) du service clients | +15 |
| Télésecrétaire | Secrétariat, assistance | moyen | Télésecrétaire | +1 |
| Maître / Maîtresse de cérémonie funéraire | Services funéraires | moyen | Maître / Maîtresse de cérémonie funéraire ; Maître / Maîtresse des cérémonies funéraires | – |
| Chef / Cheffe de rang | Restauration, hôtellerie, loisirs | moyen | Chef / Cheffe de rang ; Demi-chef / Demi-cheffe de rang | – |
| Chargé / Chargée d'accueil et de services clientèle bancaire | Banque, assurance, immobilier | moyen | Chargé / Chargée d'accueil et de services clientèle bancaire ; Assistant / Assistante service clientèle bancaire ; Conseiller / Conseillère accueil en agence bancaire | +2 |
| Assistant administratif / Assistante administrative | Secrétariat, assistance | moyen | Assistant administratif / Assistante administrative ; Assistant / Assistante de gestion administrative ; Assistant / Assistante chef de projet | +18 |
| Guichetier vendeur / Guichetière vendeuse | Banque, assurance, immobilier | moyen | Guichetier vendeur / Guichetière vendeuse ; Guichetier / Guichetière de banque ; Guichetier / Guichetière de la Poste | +4 |

**1 direction only** (fewer than 3).

### Autres pistes (12 affichées; 19 au signal faible, derrière un lien)

| Métier | Secteur | Signal |
|---|---|---|
| Formateur / Formatrice aux métiers de l'éducation et de la sécurité routière | Enseignement, formation | moyen |
| Animateur socioéducatif / Animatrice socioéducative | Social, accompagnement | moyen |
| Responsable de service en établissement touristique | Restauration, hôtellerie, loisirs | moyen |
| Conseiller / Conseillère en économie sociale et familiale (CESF) | Social, accompagnement | moyen |
| Enseignant / Enseignante de la conduite et de la sécurité routière | Enseignement, formation | moyen |
| Conseiller commercial / Conseillère commerciale et relation client en assurances | Banque, assurance, immobilier | moyen |
| Agent / Agente d'encadrement en industrie du bois | Industrie | moyen |
| Agent / Agente d'accueil social | Social, accompagnement | moyen |
| Chargé / Chargée de clientèle centre d'appels en assurances | Banque, assurance, immobilier | moyen |
| Conseiller principal / Conseillère principale d'éducation | Enseignement, formation | moyen |
| Conseiller vendeur / Conseillère vendeuse de véhicules poids lourds | Commerce et vente | moyen |
| Assistant social / Assistante sociale | Social, accompagnement | moyen |

## P2: Analyse et systèmes, sans seed

Seed: aucun; diplôme bac5; inventaire 50 compétences (0 du seed); 1090 pistes surfacées.

**Before (v6):** 1. Piloter des projets (révélée, 6 métiers, preuves 1, 5 réponses); 2. Traiter l'information (révélée, 7 métiers, preuves 3, 7 réponses); 3. Analyser des données (révélée, 4 métiers, preuves 2, 11 réponses); 4. Contrôler la qualité (révélée, 5 métiers, preuves 3, 5 réponses); 5. Former, transmettre (révélée, 4 métiers, preuves 1, 2 réponses).

**Removed by the evidence bar:**
- Piloter des projets: 1 compétence distinctive partagée dans sa capacité (minimum 3). Ses 5 métiers vont dans Autres pistes.
- Analyser des données: 2 compétences distinctives partagées dans sa capacité (minimum 3). Ses 4 métiers vont dans Autres pistes.
- Former, transmettre: 1 compétence distinctive partagée dans sa capacité (minimum 3). Ses 3 métiers vont dans Autres pistes.

**After (v7):** 2 directions.

### 1. Traiter l'information

Pas d'étiquette (pas de parcours renseigné). Preuves : 3 compétences distinctives partagées dans « Traiter des informations »; 7 réponses différentes. 2 métiers rattachés par leur 2e capacité.

Vos réponses derrière cette direction :
- « Je cherche d'abord les bases, les mots et les règles. » (f_new_domain, 2 compétences partagées)
- « Je préfère écrire clairement : structurer, résumer, clarifier. » (sf_write_explain, 1 compétence partagée)
- « Je cherche ce que les données montrent. » (sf_data_files, 1 compétence partagée)
- « Je vais droit au sujet avec des faits. » (g_status_authority, 1 compétence partagée)

| Métier | Secteur | Signal | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|
| Ingénieur / Ingénieure de recherche scientifique | Recherche | moyen | Ingénieur / Ingénieure de recherche scientifique ; Ingénieur / Ingénieure d'études en recherche scientifique ; Ingénieur / Ingénieure de recherche biomédicale | +39 |
| Technicien / Technicienne R&D | Industrie | moyen | Technicien / Technicienne R&D ; Technicien / Technicienne en développement ; Technicien / Technicienne ERD en acoustique | +34 |
| Psychologue | Social, accompagnement | moyen | Psychologue ; Psychologue-psychothérapeute ; Psychologue chercheur / Psychologue chercheuse | +4 |
| Documentaliste | Culture, documentation | moyen | Documentaliste ; Aide documentaliste ; Cyber documentaliste | +20 |
| Assistant / Assistante de direction | Secrétariat, assistance | moyen | Assistant / Assistante de direction ; Assistant / Assistante de direction bilingue ; Assistant / Assistante de direction trilingue | +5 |
| Ingénieur / Ingénieure méthodes et process | Industrie | moyen | Ingénieur / Ingénieure méthodes et process ; Ingénieur / Ingénieure méthodes en industrie ; Ingénieur / Ingénieure gestion méthodes en industrie | +21 |
| Ingénieur / Ingénieure d'affaires en industrie | Industrie | moyen | Ingénieur / Ingénieure d'affaires en industrie ; Ingénieur / Ingénieure de suivi d'affaires en industrie ; Ingénieur / Ingénieure de projet d'affaires en industrie | +11 |

### 2. Contrôler la qualité

Pas d'étiquette (pas de parcours renseigné). Preuves : 3 compétences distinctives partagées dans « Contrôler la qualité »; 5 réponses différentes. 1 métier rattaché par leur 2e capacité.

Vos réponses derrière cette direction :
- « J'ai besoin de comprendre ce qui se passe vraiment. » (f_surface_depth, 2 compétences partagées)
- « Je repère d'abord les détails qui peuvent bloquer. » (f_detail_big_picture, 2 compétences partagées)
- « Je reconstruis le chemin : étapes, captures, logs, contexte. » (sf_client_issue, 1 compétence partagée)
- « Je repère vite le problème qui peut coûter de l'argent. » (sf_commercial_signal, 1 compétence partagée)

| Métier | Secteur | Signal | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|
| Chef / Cheffe d'équipe en industrie | Industrie | moyen | Chef / Cheffe d'équipe en industrie ; Chef / Cheffe d'équipe de l'industrie du béton ; Chef / Cheffe d'équipe en ameublement | +22 |
| Auditeur comptable et financier / Auditrice comptable et financière | Comptabilité, finance | moyen | Auditeur(trice) comptable et financier(ère) ; Auditeur / Auditrice comptable ; Consultant(e) financier(ère) spécialisé(e) | +3 |
| Agent / Agente d'encadrement en industrie graphique | Communication, médias | moyen | Agent / Agente d'encadrement en industrie graphique ; Agent / Agente de maîtrise en industrie graphique ; Chef / Cheffe d'équipe en industrie graphique | – |
| Chef / Cheffe d'équipe et d'atelier textile | Industrie | moyen | Chef / Cheffe d'équipe et d'atelier textile ; Chef / Cheffe d'équipe d'atelier de tricotage ; Responsable d'atelier de production textile | +10 |
| Contrôleur / Contrôleuse prestations de la sécurité sociale | Banque, assurance, immobilier | moyen | Contrôleur / Contrôleuse prestations de la sécurité sociale ; Contrôleur(se) sécurité services prévention Sécurité Sociale ; Inspecteur(trice) de la sécurité sociale | +2 |

**2 directions only** (fewer than 3).

### Autres pistes (20 affichées; 8 au signal faible, derrière un lien)

| Métier | Secteur | Signal |
|---|---|---|
| Responsable ordonnancement-lancement-planification en industrie | Industrie | moyen |
| Technicien / Technicienne d'exploitation en production d'énergie thermique | Industrie | moyen |
| Analyste financier / Analyste financière | Comptabilité, finance | moyen |
| Agent / Agente de diagnostic et de contrôle en agriculture | Agriculture, nature, animaux | moyen |
| Technicien / Technicienne méthodes | Industrie | moyen |
| Responsable méthodes-industrialisation | Industrie | moyen |
| Ingénieur / Ingénieure de maintenance industrielle | Maintenance | moyen |
| Chargé / Chargée d'affaires bancaires | Banque, assurance, immobilier | moyen |
| Ingénieur / Ingénieure supply chain en industrie | Industrie | moyen |
| Conseiller / Conseillère technique agricole | Agriculture, nature, animaux | moyen |
| Installateur / Installatrice chauffage et climatisation | Bâtiment, travaux publics | moyen |
| Approvisionneur / Approvisionneuse logistique | Transport, logistique | moyen |
| Analyste de crédits et risques bancaires | Banque, assurance, immobilier | moyen |
| Ingénieur de maintenance / Ingénieure de maintenance | Maintenance | moyen |
| Yield manager | Restauration, hôtellerie, loisirs | moyen |
| Secrétaire comptable | Secrétariat, assistance | moyen |
| Souscripteur / Souscriptrice en assurances | Banque, assurance, immobilier | moyen |
| Technicien / Technicienne en agriculture | Agriculture, nature, animaux | moyen |
| Bioinformaticien / Bioinformaticienne en études, recherche et développement | Industrie | moyen |
| Chargé / Chargée d'accueil et de services clientèle bancaire | Banque, assurance, immobilier | moyen |

## P3: Terrain et technique, sans seed

Seed: aucun; diplôme cap; inventaire 36 compétences (0 du seed); 1079 pistes surfacées.

**Before (v6):** 1. Travailler avec des machines (révélée, 4 métiers, preuves 3, 3 réponses); 2. Former, transmettre (révélée, 4 métiers, preuves 1, 1 réponses); 3. Entretenir et réparer (révélée, 5 métiers, preuves 2, 1 réponses); 4. Réagir à l'imprévu (révélée, 3 métiers, preuves 1, 3 réponses); 5. Travailler la matière (révélée, 3 métiers, preuves 3, 2 réponses).

**Removed by the evidence bar:**
- Former, transmettre: 1 compétence distinctive partagée dans sa capacité (minimum 3). Ses 4 métiers vont dans Autres pistes.
- Entretenir et réparer: 2 compétences distinctives partagées dans sa capacité (minimum 3). Ses 3 métiers vont dans Autres pistes.
- Réagir à l'imprévu: 1 compétence distinctive partagée dans sa capacité (minimum 3). Ses 3 métiers vont dans Autres pistes.

**After (v7):** 2 directions.

### 1. Travailler avec des machines

Pas d'étiquette (pas de parcours renseigné). Preuves : 3 compétences distinctives partagées dans « Utiliser des machines, outils »; 3 réponses différentes.

Vos réponses derrière cette direction :
- « Faire avec mes mains et livrer un résultat concret. » (sf_hands_organise, 2 compétences partagées)
- « Réparer, faire fonctionner ou résoudre un problème technique. » (sf_sell_fix, 1 compétence partagée)
- « Dans l'action, avec du mouvement et des échanges. » (f_energy_context, 1 compétence partagée)

| Métier | Secteur | Signal | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|
| Assembleur / Assembleuse d'ouvrages en bois | Industrie | moyen | Assembleur / Assembleuse d'ouvrages en bois ; Assembleur(se) d'ouvrages en bois et matériaux associés ; Assembleur / Assembleuse de placages | +16 |
| Etancheur / Etancheuse | Bâtiment, travaux publics | moyen | Etancheur / Etancheuse ; Etancheur-bardeur / Etancheuse-bardeuse ; Etancheur-couvreur / Etancheuse-couvreuse | +7 |
| Conducteur / Conductrice de ligne de production en industrie du bois | Industrie | moyen | Conducteur(trice) de ligne de production industrie du bois ; Conducteur(trice) de mortaiseuses en industrie du bois ; Conducteur(trice) de séchoirs en seconde industrie du bois | +33 |
| Agent / Agente de stérilisation de service hospitalier | Santé | moyen | Agent / Agente de stérilisation de service hospitalier ; Agent / Agente de stérilisation | – |

### 2. Travailler la matière

Pas d'étiquette (pas de parcours renseigné). Preuves : 3 compétences distinctives partagées dans « Manipuler des produits, matières premières »; 2 réponses différentes.

Vos réponses derrière cette direction :
- « Faire avec mes mains et livrer un résultat concret. » (sf_hands_organise, 3 compétences partagées)
- « Dans l'action, avec du mouvement et des échanges. » (f_energy_context, 2 compétences partagées)

| Métier | Secteur | Signal | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|
| Cisailleur / Cisailleuse en métallurgie | Industrie | moyen | Cisailleur / Cisailleuse en métallurgie ; Cisailleur / Cisailleuse de forge ; Cisailleur / Cisailleuse de laminoir | +47 |
| Opérateur / Opératrice sur machines automatisées en production électrique | Industrie | moyen | Opérateur(trice) machines automatisées en prod électrique ; Opérateur(trice) machines automatisées en prod électronique ; Conducteur(trice) machines automat en prod microélectronique | +22 |
| Agent / Agente d'encadrement en industrie du bois | Industrie | moyen | Agent / Agente d'encadrement en industrie du bois ; Agent / Agente de maîtrise en industrie du bois ; Agent / Agente de maîtrise en menuiserie | +15 |

**2 directions only** (fewer than 3).

### Autres pistes (12 affichées; 21 au signal faible, derrière un lien)

| Métier | Secteur | Signal |
|---|---|---|
| Chargé / Chargée d'accueil et de services clientèle bancaire | Banque, assurance, immobilier | moyen |
| Technicien / Technicienne d'exploitation en production d'énergie thermique | Industrie | moyen |
| Frigoriste | Maintenance | moyen |
| Coffreur / Coffreuse | Bâtiment, travaux publics | moyen |
| Electricien / Electricienne de maintenance | Maintenance | moyen |
| Mécanicien / Mécanicienne de maintenance industrielle | Maintenance | moyen |
| Cuisinier / Cuisinière en industrie chimique | Industrie | moyen |
| Poseur / Poseuse en fermetures de bâtiment | Bâtiment, travaux publics | moyen |
| Opérateur / Opératrice en reprographie | Communication, médias | moyen |
| Chef / Cheffe d'équipe en industrie | Industrie | moyen |
| Agent administratif / Agente administrative banque ou assurance | Banque, assurance, immobilier | moyen |
| Data engineer | Informatique, télécoms | moyen |

## P4: Seed tech:code + réponses analyse

Seed: tech:code; diplôme bac5; inventaire 1093 compétences (1058 du seed); 1122 pistes surfacées.

**Before (v6):** 1. Construire des logiciels (continuité, 18 métiers, preuves 55, 0 réponses); 2. Analyser des données (continuité, 5 métiers, preuves 15, 11 réponses); 3. Animer un groupe (continuité, 2 métiers, preuves 3, 1 réponses); 4. Contrôler la qualité (continuité, 2 métiers, preuves 4, 5 réponses); 5. Entretenir et réparer (continuité, 2 métiers, preuves 4, 8 réponses).

**After (v7):** 5 directions.

### 1. Construire des logiciels

**Dans la continuité de votre parcours**: 0 des 18 métiers sont apportés par vos réponses. Preuves : 55 compétences distinctives partagées dans « Concevoir, développer, administrer un logiciel ou un SI »; 0 réponse différente. 1 métier rattaché par leur 2e capacité.

Aucune réponse du quiz derrière cette direction : elle vient de votre parcours.

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Administrateur / Administratrice de systèmes d'information (SI) | Informatique, télécoms | moyen | +23 | Administrateur(trice) de systèmes d'information (SI) ; Administrateur / Administratrice systèmes et réseaux ; Administrateur / Administratrice de système d'information | +8 |
| Analyste Concepteur / Conceptrice informatique | Informatique, télécoms | moyen | +2 | Analyste Concepteur / Conceptrice informatique | – |
| Chef / Cheffe de projet étude et développement informatique | Informatique, télécoms | moyen | −1 | Chef / Cheffe de projet étude et développement informatique ; Chef / Cheffe de projet informatique ; Chef / Cheffe de projet développement logiciel | +2 |
| Consultant fonctionnel / Consultante fonctionnelle des systèmes d'information | Informatique, télécoms | moyen | +10 | Consultant(e) fonctionnel(le) des systèmes d'information ; Assistant(e) fonctionnel(le) des systèmes d'information ; Consultant(e) fonctionnel(le) de progiciel | +11 |
| Expert / Experte systèmes et réseaux informatiques | Informatique, télécoms | moyen | +1 | Expert / Experte systèmes et réseaux informatiques ; Expert / Experte système et réseaux ; Expert / Experte réseaux et télécoms | +16 |
| Analyste d'application informatique | Informatique, télécoms | moyen | +16 | Analyste d'application informatique ; Analyste responsable d'application informatique ; Analyste d'application | – |
| Développeur / Développeuse décisionnel - Business Intelligence | Informatique, télécoms | moyen | +4 | Développeur(se) décisionnel - Business Intelligence | – |
| Développeur / Développeuse informatique | Informatique, télécoms | moyen | −3 | Développeur / Développeuse informatique ; Développeur / Développeuse IOT ; Analyste développeur / Analyste développeuse | +12 |
| Ingénieur / Ingénieure systèmes et réseaux des territoires connectés | Informatique, télécoms | fort | −19 | Ingénieur(e) systèmes et réseaux des territoires connectés | – |
| Ingénieur informaticien / Ingénieure informaticienne | Informatique, télécoms | moyen | −11 | Ingénieur informaticien / Ingénieure informaticienne ; Ingénieur / Ingénieure informatique ; Ingénieur / Ingénieure analyste informatique | +5 |
| Qualiticien / Qualiticienne logiciel en informatique | Informatique, télécoms | moyen | +6 | Qualiticien / Qualiticienne logiciel en informatique ; Responsable d'atelier de génie logiciel ; Didacticien / Didacticienne informatique | +1 |
| Ingénieur / Ingénieure d'étude informatique | Informatique, télécoms | moyen | +10 | Ingénieur / Ingénieure d'étude informatique ; Ingénieur / Ingénieure d'étude logiciel informatique ; Ingénieur / Ingénieure d'étude en informatique de gestion | +10 |
| Administrateur / Administratrice de serveurs | Informatique, télécoms | moyen | −25 | Administrateur / Administratrice de serveurs | – |
| Ingénieur concepteur / Ingénieure conceptrice informatique | Informatique, télécoms | moyen | −9 | Ingénieur concepteur / Ingénieure conceptrice informatique ; Concepteur / Conceptrice informatique ; Ingénieur / Ingénieure de conception informatique | +4 |
| Ingénieur / Ingénieure télécoms et environnement | Informatique, télécoms | moyen | +1 | Ingénieur(e) télécoms et environnement ; Ingénieur / Ingénieure télécoms ; Ingénieur / Ingénieure réseaux télécoms | +7 |
| Intégrateur / Intégratrice logiciels métiers | Informatique, télécoms | moyen | entrée (rang 63 sans réponses) | Intégrateur / Intégratrice logiciels métiers ; Intégrateur / Intégratrice d'application informatique ; Paramétreur / Paramétreuse de logiciels | +9 |
| Responsable des études et applications informatiques | Informatique, télécoms | moyen | −1 | Responsable des études et applications informatiques ; Responsable des développements informatiques ; Responsable d'étude informatique | +3 |
| Expert / Experte en cybersécurité | Informatique, télécoms | moyen | −4 | Expert / Experte en cybersécurité ; Expert / Experte sécurité IT ; Expert / Experte sécurité informatique | +7 |

### 2. Analyser des données

**Dans la continuité de votre parcours**: 1 des 5 métiers sont apportés par vos réponses. Preuves : 15 compétences distinctives partagées dans « Analyser et structurer des données, informations »; 11 réponses différentes.

Vos réponses derrière cette direction :
- « J'ai besoin de comprendre ce qui se passe vraiment. » (f_surface_depth, 3 compétences partagées)
- « Vérifier, calculer, classer, appliquer des règles précises. » (sf_numbers_people, 3 compétences partagées)
- « Je cherche pourquoi il revient. » (f_repeat_problem, 2 compétences partagées)
- « Au calme, avec du temps pour me concentrer. » (f_energy_context, 2 compétences partagées)

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Technicien / Technicienne d'exploitation en production d'énergie thermique | Industrie | moyen | entrée (rang 719 sans réponses) ✔ | Technicien(ne) d'exploitation production d'énergie thermique ; Opérateur(trice) d'exploitation en production d'énergie ; Technicien / Technicienne énergie | +8 |
| Technicien / Technicienne méthodes | Industrie | moyen | entrée (rang 53 sans réponses) | Technicien / Technicienne méthodes ; Technicien / Technicienne méthodes process ; Technicien / Technicienne productique méthodes | +27 |
| Cartographe | Informatique, télécoms | moyen | −2 | Cartographe ; Cartographe du BTP ; Officier / Officière cartographe | +7 |
| Technicien / Technicienne R&D | Industrie | moyen | entrée (rang 71 sans réponses) | Technicien / Technicienne R&D ; Technicien / Technicienne en développement ; Technicien / Technicienne ERD en acoustique | +34 |
| Yield manager | Restauration, hôtellerie, loisirs | moyen | entrée (rang 96 sans réponses) | Yield manager ; Responsable yield manager ; Assistant / Assistante yield manager | +8 |

### 3. Animer un groupe

*Aussi : Diriger*

**Dans la continuité de votre parcours**: 1 des 2 métiers sont apportés par vos réponses. Preuves : 3 compétences distinctives partagées dans « Animer un collectif »; 1 réponse différente.

Vos réponses derrière cette direction :
- « Je commence par remettre de l'ordre. » (f_order_improv, 1 compétence partagée)

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Ingénieur / Ingénieure méthodes et process | Industrie | moyen | entrée (rang 75 sans réponses) | Ingénieur / Ingénieure méthodes et process ; Ingénieur / Ingénieure méthodes en industrie ; Ingénieur / Ingénieure gestion méthodes en industrie | +21 |
| Ingénieur / Ingénieure de maintenance industrielle | Maintenance | moyen | entrée (rang 59 sans réponses) ✔ | Ingénieur / Ingénieure de maintenance industrielle ; Ingénieur / Ingénieure Maintenance Nucléaire ; Ingénieur(e) maintenance-fiabilisation industrielle | +19 |

### 4. Contrôler la qualité

*Aussi : Construire des logiciels*

**Dans la continuité de votre parcours**: 1 des 2 métiers sont apportés par vos réponses. Preuves : 4 compétences distinctives partagées dans « Contrôler la qualité »; 5 réponses différentes.

Vos réponses derrière cette direction :
- « J'ai besoin de comprendre ce qui se passe vraiment. » (f_surface_depth, 1 compétence partagée)
- « Je reconstruis le chemin : étapes, captures, logs, contexte. » (sf_client_issue, 1 compétence partagée)
- « Je repère vite le problème qui peut coûter de l'argent. » (sf_commercial_signal, 1 compétence partagée)
- « Je reformule pour faire préciser le vrai problème. » (g_hidden_need, 1 compétence partagée)

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Expert / Experte méthodes et qualité informatique | Informatique, télécoms | moyen | +14 | Expert / Experte méthodes et qualité informatique ; Expert / Experte qualité informatique ; Expert / Experte méthodes et outils en informatique | +1 |
| Chef / Cheffe d'équipe en industrie | Industrie | moyen | entrée (rang 128 sans réponses) ✔ | Chef / Cheffe d'équipe en industrie ; Chef / Cheffe d'équipe de l'industrie du béton ; Chef / Cheffe d'équipe en ameublement | +22 |

### 5. Entretenir et réparer

*Aussi : Chercher, innover*

**Dans la continuité de votre parcours**: 0 des 2 métiers sont apportés par vos réponses. Preuves : 4 compétences distinctives partagées dans « Assurer la maintenance technique »; 8 réponses différentes.

Vos réponses derrière cette direction :
- « J'ai besoin de comprendre ce qui se passe vraiment. » (f_surface_depth, 1 compétence partagée)
- « Je cherche pourquoi il revient. » (f_repeat_problem, 1 compétence partagée)
- « Au calme, avec du temps pour me concentrer. » (f_energy_context, 1 compétence partagée)
- « Je cherche ce que les données montrent. » (sf_data_files, 1 compétence partagée)

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Agent / Agente de diagnostic et de contrôle en agriculture | Agriculture, nature, animaux | moyen | entrée (rang 306 sans réponses) | Agent / Agente de diagnostic et de contrôle en agriculture ; Agent / Agente sanitaire de l'agriculture ; Agent / Agente sanitaire apicole | +15 |
| Installateur / Installatrice chauffage et climatisation | Bâtiment, travaux publics | moyen | entrée (rang 72 sans réponses) | Installateur / Installatrice chauffage et climatisation ; Installateur / Installatrice de chauffage bois ; Installateur / Installatrice de chauffage solaire individuel | +14 |

### Autres pistes (11 affichées; 0 au signal faible, derrière un lien)

| Métier | Secteur | Signal |
|---|---|---|
| Chef de projet / Cheffe de projet (Project Management Officer) | Informatique, télécoms | moyen |
| Responsable ordonnancement-lancement-planification en industrie | Industrie | moyen |
| Chargé / Chargée d'affaires bancaires | Banque, assurance, immobilier | moyen |
| Géomètre | Bâtiment, travaux publics | moyen |
| Météorologue | Informatique, télécoms | moyen |
| Ingénieur / Ingénieure de recherche scientifique | Recherche | moyen |
| Analyste décisionnel - Business Intelligence | Informatique, télécoms | moyen |
| Analyste financier / Analyste financière | Comptabilité, finance | moyen |
| Actuaire en assurances | Banque, assurance, immobilier | moyen |
| Responsable méthodes-industrialisation | Industrie | moyen |
| Approvisionneur / Approvisionneuse logistique | Transport, logistique | moyen |

## P5: Seed tech:code + réponses relation

Seed: tech:code; diplôme bac5; inventaire 1094 compétences (1058 du seed); 1112 pistes surfacées.

**Before (v6):** 1. Construire des logiciels (continuité, 20 métiers, preuves 56, 0 réponses); 2. Fidéliser les clients (continuité, 2 métiers, preuves 2, 5 réponses); 3. Développer une activité (continuité, 3 métiers, preuves 4, 0 réponses); 4. La relation client (révélée, 3 métiers, preuves 4, 6 réponses).

**Removed by the evidence bar:**
- Fidéliser les clients: 2 compétences distinctives partagées dans sa capacité (minimum 3). Ses 2 métiers vont dans Autres pistes.

**After (v7):** 3 directions.

### 1. La relation client

**Révélée par vos réponses**: 3 des 4 métiers sont apportés par vos réponses. Preuves : 5 compétences distinctives partagées dans « Gérer la relation client, recueillir et analyser les besoins client »; 6 réponses différentes. 2 métiers rattachés par leur 2e capacité.

Vos réponses derrière cette direction :
- « Échanger avec des personnes, comprendre leurs demandes, gérer la relation. » (sf_numbers_people, 6 compétences partagées)
- « J'appelle, je clarifie, je gère la tension. » (g_conflict, 6 compétences partagées)
- « Dans l'action, avec du mouvement et des échanges. » (f_energy_context, 3 compétences partagées)
- « Je préfère expliquer à l'oral, montrer et répondre aux questions. » (sf_write_explain, 3 compétences partagées)

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Conseiller / Conseillère clientèle à distance | Commerce et vente | moyen | entrée (rang 554 sans réponses) ✔ | Conseiller / Conseillère clientèle à distance ; Technicien / Technicienne de la vente à distance | +6 |
| Responsable support technique clients | Industrie | moyen | entrée (rang 73 sans réponses) | Responsable support technique clients ; Responsable support technique ; Manager support technique | +3 |
| Responsable de service en établissement touristique | Restauration, hôtellerie, loisirs | moyen | entrée (rang 130 sans réponses) ✔ | Responsable de service en établissement touristique ; Responsable de bar en établissement touristique ; Responsable de salle en établissement touristique | +6 |
| Guichetier vendeur / Guichetière vendeuse | Banque, assurance, immobilier | moyen | entrée (rang 654 sans réponses) ✔ | Guichetier vendeur / Guichetière vendeuse ; Guichetier / Guichetière de banque ; Guichetier / Guichetière de la Poste | +4 |

### 2. Construire des logiciels

**Dans la continuité de votre parcours**: 0 des 20 métiers sont apportés par vos réponses. Preuves : 56 compétences distinctives partagées dans « Concevoir, développer, administrer un logiciel ou un SI »; 0 réponse différente. 1 métier rattaché par leur 2e capacité.

Aucune réponse du quiz derrière cette direction : elle vient de votre parcours.

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Chef / Cheffe de projet étude et développement informatique | Informatique, télécoms | moyen | +3 | Chef / Cheffe de projet étude et développement informatique ; Chef / Cheffe de projet informatique ; Chef / Cheffe de projet développement logiciel | +2 |
| Expert / Experte systèmes et réseaux informatiques | Informatique, télécoms | moyen | +6 | Expert / Experte systèmes et réseaux informatiques ; Expert / Experte système et réseaux ; Expert / Experte réseaux et télécoms | +16 |
| Ingénieur / Ingénieure télécoms et environnement | Informatique, télécoms | moyen | +31 | Ingénieur(e) télécoms et environnement ; Ingénieur / Ingénieure télécoms ; Ingénieur / Ingénieure réseaux télécoms | +7 |
| Analyste Concepteur / Conceptrice informatique | Informatique, télécoms | moyen | +1 | Analyste Concepteur / Conceptrice informatique | – |
| Chef / Cheffe de projet maîtrise d'œuvre informatique | Informatique, télécoms | moyen | +25 | Chef / Cheffe de projet maîtrise d'œuvre informatique | – |
| Ingénieur concepteur / Ingénieure conceptrice informatique | Informatique, télécoms | moyen | +11 | Ingénieur concepteur / Ingénieure conceptrice informatique ; Concepteur / Conceptrice informatique ; Ingénieur / Ingénieure de conception informatique | +4 |
| Analyste d'application informatique | Informatique, télécoms | moyen | +13 | Analyste d'application informatique ; Analyste responsable d'application informatique ; Analyste d'application | – |
| UX - UI Designer | Communication, médias | moyen | +19 | UX - UI Designer ; Software Designer ; UI - user interface designer | +9 |
| Ingénieur / Ingénieure systèmes et réseaux des territoires connectés | Informatique, télécoms | fort | −18 | Ingénieur(e) systèmes et réseaux des territoires connectés | – |
| Développeur / Développeuse informatique | Informatique, télécoms | moyen | −8 | Développeur / Développeuse informatique ; Développeur / Développeuse IOT ; Analyste développeur / Analyste développeuse | +12 |
| Ingénieur informaticien / Ingénieure informaticienne | Informatique, télécoms | moyen | −12 | Ingénieur informaticien / Ingénieure informaticienne ; Ingénieur / Ingénieure informatique ; Ingénieur / Ingénieure analyste informatique | +5 |
| Développeur / Développeuse décisionnel - Business Intelligence | Informatique, télécoms | moyen | −6 | Développeur(se) décisionnel - Business Intelligence | – |
| Consultant fonctionnel / Consultante fonctionnelle des systèmes d'information | Informatique, télécoms | moyen | −11 | Consultant(e) fonctionnel(le) des systèmes d'information ; Assistant(e) fonctionnel(le) des systèmes d'information ; Consultant(e) fonctionnel(le) de progiciel | +11 |
| Ingénieur / Ingénieure DevOps | Informatique, télécoms | moyen | −1 | Ingénieur / Ingénieure DevOps ; Ingénieur / Ingénieure développement logiciel ; Ingénieur / Ingénieure programme informatique | +6 |
| Architecte IoT - Internet des Objets | Informatique, télécoms | moyen | −10 | Architecte IoT - Internet des Objets | – |
| Architecte multimédias interactifs | Informatique, télécoms | moyen | −19 | Architecte multimédias interactifs ; Architecte multimédia | +1 |
| Chef / Cheffe de projet réseau fixe et mobile | Informatique, télécoms | moyen | entrée (rang 69 sans réponses) | Chef / Cheffe de projet réseau fixe et mobile ; Chef / Cheffe de projet Réseau ; Chef / Cheffe de projet Datacenter | +3 |
| Analyste d'étude informatique | Informatique, télécoms | moyen | −13 | Analyste d'étude informatique ; Analyste-programmeur(se) d'étude informatique ; Analyste réseau informatique | +6 |
| Administrateur / Administratrice de systèmes d'information (SI) | Informatique, télécoms | moyen | −13 | Administrateur(trice) de systèmes d'information (SI) ; Administrateur / Administratrice systèmes et réseaux ; Administrateur / Administratrice de système d'information | +8 |
| Expert / Experte méthodes et qualité informatique | Informatique, télécoms | moyen | +14 | Expert / Experte méthodes et qualité informatique ; Expert / Experte qualité informatique ; Expert / Experte méthodes et outils en informatique | +1 |

### 3. Développer une activité

**Dans la continuité de votre parcours**: 0 des 3 métiers sont apportés par vos réponses. Preuves : 4 compétences distinctives partagées dans « Conduire une stratégie de développement »; 0 réponse différente. 1 métier rattaché par leur 2e capacité.

Aucune réponse du quiz derrière cette direction : elle vient de votre parcours.

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Responsable en organisation en entreprise | Conseil, organisation | moyen | entrée (rang 387 sans réponses) | Responsable en organisation en entreprise ; Responsable en organisation ; Responsable des projets organisation | +13 |
| Conseiller / Conseillère technique agricole | Agriculture, nature, animaux | moyen | entrée (rang 79 sans réponses) | Conseiller / Conseillère technique agricole ; Conseiller / Conseillère agricole ; Conseiller / Conseillère de gestion agricole | +10 |
| Expert / Experte en communication et réseaux | Informatique, télécoms | moyen | +2 | Expert / Experte en communication et réseaux ; Expert(e) technologie information et communication (TIC) | – |

### Autres pistes (13 affichées; 0 au signal faible, derrière un lien)

| Métier | Secteur | Signal |
|---|---|---|
| Chargé / Chargée d'accueil et de services clientèle bancaire | Banque, assurance, immobilier | moyen |
| Formateur / Formatrice aux métiers de l'éducation et de la sécurité routière | Enseignement, formation | moyen |
| Agent administratif / Agente administrative banque ou assurance | Banque, assurance, immobilier | moyen |
| Conseiller / Conseillère en économie sociale et familiale (CESF) | Social, accompagnement | moyen |
| Agent / Agente d'Escale Commerciale aéroportuaire (AEC) | Transport, logistique | moyen |
| Animateur socioéducatif / Animatrice socioéducative | Social, accompagnement | moyen |
| Chef de projet / Cheffe de projet (Project Management Officer) | Informatique, télécoms | moyen |
| Architecte d'intérieur | Bâtiment, travaux publics | moyen |
| Enseignant / Enseignante de la conduite et de la sécurité routière | Enseignement, formation | moyen |
| Chef / Cheffe de projet événementiel | Communication, médias | moyen |
| Architecte du bâtiment | Bâtiment, travaux publics | moyen |
| Educateur sportif / Educatrice sportive | Restauration, hôtellerie, loisirs | moyen |
| Conseiller commercial / Conseillère commerciale et relation client en assurances | Banque, assurance, immobilier | moyen |

## P6: Seed santé:soin + réponses relation

Seed: sante:soin; diplôme bac3; inventaire 391 compétences (355 du seed); 1055 pistes surfacées.

**Before (v6):** 1. La relation client (révélée, 8 métiers, preuves 3, 6 réponses); 2. Soigner (continuité, 6 métiers, preuves 24, 0 réponses); 3. Conseiller (révélée, 4 métiers, preuves 3, 10 réponses); 4. Réagir à l'imprévu (révélée, 3 métiers, preuves 4, 2 réponses); 5. Prendre soin des personnes (continuité, 5 métiers, preuves 17, 0 réponses).

**After (v7):** 5 directions.

### 1. La relation client

**Révélée par vos réponses**: 8 des 8 métiers sont apportés par vos réponses. Preuves : 3 compétences distinctives partagées dans « Gérer la relation client, recueillir et analyser les besoins client »; 6 réponses différentes. 1 métier rattaché par leur 2e capacité.

Vos réponses derrière cette direction :
- « Échanger avec des personnes, comprendre leurs demandes, gérer la relation. » (sf_numbers_people, 4 compétences partagées)
- « J'appelle, je clarifie, je gère la tension. » (g_conflict, 4 compétences partagées)
- « Dans l'action, avec du mouvement et des échanges. » (f_energy_context, 2 compétences partagées)
- « Je préfère expliquer à l'oral, montrer et répondre aux questions. » (sf_write_explain, 2 compétences partagées)

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Conseiller / Conseillère clientèle à distance | Commerce et vente | moyen | entrée (rang 184 sans réponses) ✔ | Conseiller / Conseillère clientèle à distance ; Technicien / Technicienne de la vente à distance | +6 |
| Conseiller / Conseillère technique agricole | Agriculture, nature, animaux | moyen | entrée (rang 233 sans réponses) ✔ | Conseiller / Conseillère technique agricole ; Conseiller / Conseillère agricole ; Conseiller / Conseillère de gestion agricole | +10 |
| Responsable service clients | Marketing, ventes | moyen | entrée (rang 236 sans réponses) ✔ | Responsable service clients ; Responsable service clients online ; Responsable administratif(tive) du service clients | +15 |
| Maître / Maîtresse de cérémonie funéraire | Services funéraires | moyen | entrée (rang 916 sans réponses) ✔ | Maître / Maîtresse de cérémonie funéraire ; Maître / Maîtresse des cérémonies funéraires | – |
| Télésecrétaire | Secrétariat, assistance | moyen | entrée (rang 510 sans réponses) ✔ | Télésecrétaire | +1 |
| Superviseur / Superviseuse d'exploitation aéroportuaire | Transport, logistique | moyen | entrée (rang 651 sans réponses) ✔ | Superviseur / Superviseuse d'exploitation aéroportuaire ; Responsable d'exploitation aéroportuaire ; Directeur / Directrice d'exploitation aéroportuaire | +4 |
| Chargé / Chargée d'accueil | Secrétariat, assistance | moyen | entrée (rang 807 sans réponses) ✔ | Chargé / Chargée d'accueil ; Chargé / Chargée d'accueil et d'information ; Agent / Agente d'accueil | +10 |
| Secrétaire technique | Secrétariat, assistance | moyen | entrée (rang 192 sans réponses) ✔ | Secrétaire technique ; Secrétaire technique bureau d'études ; Secrétaire technique de la construction | +4 |

### 2. Conseiller

*Aussi : La relation client*

**Révélée par vos réponses**: 3 des 4 métiers sont apportés par vos réponses. Preuves : 3 compétences distinctives partagées dans « Conseiller »; 10 réponses différentes.

Vos réponses derrière cette direction :
- « Je préfère expliquer à l'oral, montrer et répondre aux questions. » (sf_write_explain, 3 compétences partagées)
- « Dans l'action, avec du mouvement et des échanges. » (f_energy_context, 2 compétences partagées)
- « Échanger avec des personnes, comprendre leurs demandes, gérer la relation. » (sf_numbers_people, 2 compétences partagées)
- « J'appelle, je clarifie, je gère la tension. » (g_conflict, 2 compétences partagées)

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Chargé / Chargée d'accueil et de services clientèle bancaire | Banque, assurance, immobilier | moyen | entrée (rang 96 sans réponses) ✔ | Chargé / Chargée d'accueil et de services clientèle bancaire ; Assistant / Assistante service clientèle bancaire ; Conseiller / Conseillère accueil en agence bancaire | +2 |
| Animateur socioéducatif / Animatrice socioéducative | Social, accompagnement | moyen | entrée (rang 266 sans réponses) | Animateur socioéducatif / Animatrice socioéducative ; Animateur / Animatrice de quartier ; Animateur / Animatrice de foyer rural | +4 |
| Guichetier vendeur / Guichetière vendeuse | Banque, assurance, immobilier | moyen | entrée (rang 279 sans réponses) ✔ | Guichetier vendeur / Guichetière vendeuse ; Guichetier / Guichetière de banque ; Guichetier / Guichetière de la Poste | +4 |
| Agent / Agente d'accueil social | Social, accompagnement | moyen | entrée (rang 642 sans réponses) ✔ | Agent / Agente d'accueil social ; Agent / Agente d'accueil et d'information sociale | +4 |

### 3. Réagir à l'imprévu

**Révélée par vos réponses**: 2 des 3 métiers sont apportés par vos réponses. Preuves : 4 compétences distinctives partagées dans « Agir face à l'imprévu »; 2 réponses différentes.

Vos réponses derrière cette direction :
- « J'appelle, je clarifie, je gère la tension. » (g_conflict, 1 compétence partagée)
- « Dans l'action, avec du mouvement et des échanges. » (f_energy_context, 1 compétence partagée)

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Enseignant / Enseignante de la conduite et de la sécurité routière | Enseignement, formation | moyen | entrée (rang 800 sans réponses) ✔ | Enseignant(e) de la conduite et de la sécurité routière | +6 |
| Agent administratif / Agente administrative banque ou assurance | Banque, assurance, immobilier | moyen | entrée (rang 306 sans réponses) | Agent(e) administratif(ve) banque ou assurance ; Agent administratif / Agente administrative de banque ; Technicien(ne) administratif(ve) de banque | +4 |
| Chef / Cheffe de projet événementiel | Communication, médias | moyen | entrée (rang 93 sans réponses) ✔ | Chef / Cheffe de projet événementiel ; Chargé / Chargée responsable de projet événementiel ; Chargé / Chargée de mission événementiel | +4 |

### 4. Soigner

*Aussi : Prendre soin des personnes*

**Dans la continuité de votre parcours**: 0 des 6 métiers sont apportés par vos réponses. Preuves : 24 compétences distinctives partagées dans « Soigner des personnes »; 0 réponse différente. 1 métier rattaché par leur 2e capacité.

Aucune réponse du quiz derrière cette direction : elle vient de votre parcours.

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Cadre de santé d'unité de soins ou de service paramédical | Santé | fort | = | Cadre de santé d'unité de soins ou de service paramédical ; Cadre de santé d'unité de soins ; Cadre de santé de service paramédical | +4 |
| Infirmier / Infirmière en Pratique Avancée (IPA) | Santé | fort | −3 | Infirmier / Infirmière en Pratique Avancée (IPA) | – |
| Infirmier / Infirmière de bloc opératoire (IBODE) | Santé | moyen | −5 | Infirmier / Infirmière de bloc opératoire (IBODE) ; Infirmier / Infirmière chef de bloc opératoire ; Infirmier / Infirmière de bloc opératoire circulant | +6 |
| Infirmier / Infirmière en soins généraux (IDE) | Santé | moyen | −16 | Infirmier / Infirmière de soins généraux ; Infirmier / Infirmière militaire ; Infirmier / Infirmière hygiéniste | +8 |
| Infirmier / Infirmière anesthésiste (IADE) | Santé | moyen | −9 | Infirmier / Infirmière anesthésiste ; Infirmier(ère) Anesthésiste Diplômé(e) d'Etat (IADE) | – |
| Responsable de secteur coordinateur / Responsable de secteur coordinatrice | Santé | moyen | −16 | Responsable de secteur coordinateur (trice) ; Coordinateur de santé / Coordinatrice de santé ; Coordonnateur(trice) actions éducation thérapeutique patient | +1 |

### 5. Prendre soin des personnes

**Dans la continuité de votre parcours**: 0 des 5 métiers sont apportés par vos réponses. Preuves : 17 compétences distinctives partagées dans « Prendre soin des personnes »; 0 réponse différente. 2 métiers rattachés par leur 2e capacité.

Aucune réponse du quiz derrière cette direction : elle vient de votre parcours.

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Infirmier / Infirmière de prévention | Santé | moyen | +8 | Infirmier / Infirmière de prévention ; Infirmier / Infirmière de santé préventive | – |
| Médecin du travail et de prévention | Santé | moyen | = | Médecin du travail et de prévention ; Médecin du travail ; Médecin de prévention | +2 |
| Puériculteur / Puéricultrice | Santé | moyen | −27 | Puériculteur / Puéricultrice ; Infirmier puériculteur / Infirmière puéricultrice ; Puériculteur hospitalier / Puéricultrice hospitalière | +5 |
| Conseiller / Conseillère en économie sociale et familiale (CESF) | Social, accompagnement | moyen | entrée (rang 247 sans réponses) | Conseiller / Conseillère en économie sociale et familiale ; Conseiller social / Conseillère sociale | – |
| Infirmier / Infirmière scolaire | Santé | moyen | −16 | Infirmier / Infirmière scolaire ; Infirmier(ère) spécialisé(e) en santé scolaire | – |

### Autres pistes (11 affichées; 3 au signal faible, derrière un lien)

| Métier | Secteur | Signal |
|---|---|---|
| Formateur / Formatrice aux métiers de l'éducation et de la sécurité routière | Enseignement, formation | moyen |
| Responsable de service en établissement touristique | Restauration, hôtellerie, loisirs | moyen |
| Assistant administratif / Assistante administrative | Secrétariat, assistance | moyen |
| Responsable en organisation en entreprise | Conseil, organisation | moyen |
| Toiletteur / Toiletteuse d'animaux | Agriculture, nature, animaux | moyen |
| Educateur sportif / Educatrice sportive | Restauration, hôtellerie, loisirs | moyen |
| Conseiller / Conseillère en information médicale | Commerce et vente | moyen |
| Conseiller commercial / Conseillère commerciale et relation client en assurances | Banque, assurance, immobilier | moyen |
| Chef / Cheffe de bassin | Restauration, hôtellerie, loisirs | moyen |
| Secrétaire administratif / Secrétaire administrative de collectivité territoriale | Secrétariat, assistance | moyen |
| Conseiller / Conseillère en insertion professionnelle | Emploi, territoires | moyen |

## P7: Seed admin:rh + réponses relation

Seed: admin:rh; diplôme bac5; inventaire 352 compétences (315 du seed); 1028 pistes surfacées.

**Before (v6):** 1. Manager une équipe (continuité, 5 métiers, preuves 8, 0 réponses); 2. Gérer l'administratif (continuité, 4 métiers, preuves 14, 0 réponses); 3. Concevoir des formations (continuité, 6 métiers, preuves 11, 3 réponses); 4. Gérer les compétences (continuité, 5 métiers, preuves 13, 0 réponses); 5. La relation client (révélée, 6 métiers, preuves 3, 6 réponses).

**After (v7):** 5 directions.

### 1. La relation client

**Révélée par vos réponses**: 6 des 6 métiers sont apportés par vos réponses. Preuves : 3 compétences distinctives partagées dans « Gérer la relation client, recueillir et analyser les besoins client »; 6 réponses différentes. 2 métiers rattachés par leur 2e capacité.

Vos réponses derrière cette direction :
- « Échanger avec des personnes, comprendre leurs demandes, gérer la relation. » (sf_numbers_people, 4 compétences partagées)
- « J'appelle, je clarifie, je gère la tension. » (g_conflict, 4 compétences partagées)
- « Dans l'action, avec du mouvement et des échanges. » (f_energy_context, 2 compétences partagées)
- « Je préfère expliquer à l'oral, montrer et répondre aux questions. » (sf_write_explain, 2 compétences partagées)

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Conseiller / Conseillère clientèle à distance | Commerce et vente | moyen | entrée (rang 476 sans réponses) ✔ | Conseiller / Conseillère clientèle à distance ; Technicien / Technicienne de la vente à distance | +6 |
| Conseiller / Conseillère technique agricole | Agriculture, nature, animaux | moyen | entrée (rang 127 sans réponses) ✔ | Conseiller / Conseillère technique agricole ; Conseiller / Conseillère agricole ; Conseiller / Conseillère de gestion agricole | +10 |
| Secrétaire technique | Secrétariat, assistance | moyen | entrée (rang 522 sans réponses) ✔ | Secrétaire technique ; Secrétaire technique bureau d'études ; Secrétaire technique de la construction | +4 |
| Responsable service clients | Marketing, ventes | moyen | entrée (rang 666 sans réponses) ✔ | Responsable service clients ; Responsable service clients online ; Responsable administratif(tive) du service clients | +15 |
| Architecte d'intérieur | Bâtiment, travaux publics | moyen | entrée (rang 219 sans réponses) ✔ | Architecte d'intérieur ; Architecte décorateur / Architecte décoratrice ; Assistant décorateur / Assistante décoratrice d'intérieur | +4 |
| Guichetier vendeur / Guichetière vendeuse | Banque, assurance, immobilier | moyen | entrée (rang 661 sans réponses) ✔ | Guichetier vendeur / Guichetière vendeuse ; Guichetier / Guichetière de banque ; Guichetier / Guichetière de la Poste | +4 |

### 2. Manager une équipe

**Dans la continuité de votre parcours**: 0 des 5 métiers sont apportés par vos réponses. Preuves : 8 compétences distinctives partagées dans « Manager une équipe »; 0 réponse différente.

Aucune réponse du quiz derrière cette direction : elle vient de votre parcours.

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Responsable de service en établissement touristique | Restauration, hôtellerie, loisirs | moyen | +20 | Responsable de service en établissement touristique ; Responsable de bar en établissement touristique ; Responsable de salle en établissement touristique | +6 |
| Manager de proximité | Ressources humaines | fort | −1 | Manager de proximité ; Team manager | +2 |
| Agent / Agente d'encadrement en industrie du bois | Industrie | moyen | +9 | Agent / Agente d'encadrement en industrie du bois ; Agent / Agente de maîtrise en industrie du bois ; Agent / Agente de maîtrise en menuiserie | +15 |
| Superviseur / Superviseuse d'exploitation aéroportuaire | Transport, logistique | moyen | entrée (rang 330 sans réponses) | Superviseur / Superviseuse d'exploitation aéroportuaire ; Responsable d'exploitation aéroportuaire ; Directeur / Directrice d'exploitation aéroportuaire | +4 |
| Animateur / Animatrice d'atelier multimédia | Restauration, hôtellerie, loisirs | moyen | entrée (rang 153 sans réponses) | Animateur / Animatrice d'atelier multimédia ; Animateur / Animatrice d'atelier Internet ; Animateur / Animatrice d'espace multimédia | +8 |

### 3. Gérer l'administratif

*Aussi : Gérer les compétences*

**Dans la continuité de votre parcours**: 0 des 4 métiers sont apportés par vos réponses. Preuves : 14 compétences distinctives partagées dans « Assurer la gestion administrative »; 0 réponse différente.

Aucune réponse du quiz derrière cette direction : elle vient de votre parcours.

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Gestionnaire paie | Ressources humaines | fort | −3 | Gestionnaire paie ; Gestionnaire paie et administration du personnel ; Responsable paie | +7 |
| Responsable paie et administration du personnel | Ressources humaines | fort | −5 | Responsable paie et administration du personnel ; Responsable de l'administration du personnel ; Responsable de la gestion du personnel | +7 |
| Assistant / Assistante Ressources Humaines (RH) | Ressources humaines | moyen | −3 | Assistant / Assistante ressources humaines ; Assistant / Assistante de gestion en ressources humaines ; Assistant / Assistante emploi formation | +5 |
| Assistant administratif / Assistante administrative | Secrétariat, assistance | moyen | entrée (rang 646 sans réponses) | Assistant administratif / Assistante administrative ; Assistant / Assistante de gestion administrative ; Assistant / Assistante chef de projet | +18 |

### 4. Concevoir des formations

**Dans la continuité de votre parcours**: 2 des 6 métiers sont apportés par vos réponses. Preuves : 11 compétences distinctives partagées dans « Concevoir l'ingénierie de formation »; 3 réponses différentes. 2 métiers rattachés par leur 2e capacité.

Vos réponses derrière cette direction :
- « Je préfère expliquer à l'oral, montrer et répondre aux questions. » (sf_write_explain, 1 compétence partagée)
- « Je lui explique étape par étape jusqu'à ce qu'il soit autonome. » (sf_training_peer, 1 compétence partagée)
- « J'explique et je transmets, ça me plaît. » (g_teach_do, 1 compétence partagée)

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Formateur / Formatrice aux métiers de l'éducation et de la sécurité routière | Enseignement, formation | moyen | entrée (rang 104 sans réponses) ✔ | Formateur / Formatrice de moniteurs d'auto-école | +1 |
| Responsable formation professionnelle en entreprise | Ressources humaines | moyen | −7 | Responsable formation professionnelle en entreprise ; Responsable formation en entreprise ; Responsable formation communication en entreprise | +7 |
| Professeur / Professeure des universités | Enseignement, formation | moyen | entrée (rang 89 sans réponses) | Professeur / Professeure des universités ; Professeur / Professeure de l'enseignement supérieur | +9 |
| Chargé / Chargée de produit en assurances | Banque, assurance, immobilier | moyen | entrée (rang 341 sans réponses) ✔ | Chargé / Chargée de produit en assurances ; Chef / Cheffe de produit assurance vie ; Chef / Cheffe de segment produits d'assurances | +2 |
| Enseignant / Enseignante de la conduite et de la sécurité routière | Enseignement, formation | moyen | entrée (rang 251 sans réponses) | Enseignant(e) de la conduite et de la sécurité routière | +6 |
| Conseiller consultant / Conseillère consultante en formation | Enseignement, formation | moyen | −24 | Conseiller consultant / Conseillère consultante en formation ; Conseiller / Conseillère en formation ; Consultant / Consultante en formation | +6 |

### 5. Gérer les compétences

**Dans la continuité de votre parcours**: 0 des 5 métiers sont apportés par vos réponses. Preuves : 13 compétences distinctives partagées dans « Gérer les emplois et les compétences »; 0 réponse différente. 1 métier rattaché par leur 2e capacité.

Aucune réponse du quiz derrière cette direction : elle vient de votre parcours.

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Conseiller / Conseillère en gestion de carrière | Ressources humaines | moyen | −8 | Conseiller / Conseillère en gestion de carrière ; Conseiller / Conseillère en développement des carrières ; Responsable de la gestion des cadres | +8 |
| Chargé / Chargée de recrutement | Ressources humaines | moyen | −6 | Chargé / Chargée de recrutement ; Chargé / Chargée de recherche en recrutement ; Chargé / Chargée de recrutement et mobilité professionnelle | +8 |
| Directeur / Directrice des Ressources Humaines (DRH) | Ressources humaines | moyen | −17 | Directeur / Directrice des Ressources Humaines (DRH) ; Directeur / Directrice du personnel ; Responsable des Ressources Humaines -RRH- | +13 |
| Chargé / Chargée de mission RH diversité handicap | Ressources humaines | moyen | entrée (rang 94 sans réponses) | Chargé / Chargée de mission RH diversité handicap ; Responsable diversité et égalité des chances | – |
| Responsable en organisation en entreprise | Conseil, organisation | moyen | entrée (rang 301 sans réponses) | Responsable en organisation en entreprise ; Responsable en organisation ; Responsable des projets organisation | +13 |

### Autres pistes (13 affichées; 1 au signal faible, derrière un lien)

| Métier | Secteur | Signal |
|---|---|---|
| Chargé / Chargée d'accueil et de services clientèle bancaire | Banque, assurance, immobilier | moyen |
| Agent / Agente d'Escale Commerciale aéroportuaire (AEC) | Transport, logistique | moyen |
| Conseiller / Conseillère en économie sociale et familiale (CESF) | Social, accompagnement | moyen |
| Agent administratif / Agente administrative banque ou assurance | Banque, assurance, immobilier | moyen |
| Animateur socioéducatif / Animatrice socioéducative | Social, accompagnement | moyen |
| Chef / Cheffe de projet événementiel | Communication, médias | moyen |
| Infirmier / Infirmière de prévention | Santé | moyen |
| Conseiller / Conseillère en insertion professionnelle | Emploi, territoires | moyen |
| Animateur / Animatrice de loisirs sportifs | Restauration, hôtellerie, loisirs | moyen |
| Architecte du bâtiment | Bâtiment, travaux publics | moyen |
| Conseiller commercial / Conseillère commerciale et relation client en assurances | Banque, assurance, immobilier | moyen |
| Toiletteur / Toiletteuse d'animaux | Agriculture, nature, animaux | moyen |
| Conseiller / Conseillère en information médicale | Commerce et vente | moyen |

## P8: Seed hôtellerie:cuisine + réponses terrain

Seed: hotellerie:cuisine; diplôme cap; inventaire 403 compétences (372 du seed); 1110 pistes surfacées.

**Before (v6):** 1. Cuisiner (continuité, 10 métiers, preuves 37, 0 réponses); 2. Travailler la matière (révélée, 4 métiers, preuves 4, 2 réponses); 3. Protéger l'environnement (continuité, 5 métiers, preuves 4, 0 réponses); 4. Former, transmettre (révélée, 2 métiers, preuves 1, 1 réponses); 5. Entretenir et réparer (révélée, 4 métiers, preuves 2, 1 réponses).

**Removed by the evidence bar:**
- Protéger l'environnement: révélée par 1 réponse seulement (minimum 2). Ses 3 métiers vont dans Autres pistes.
- Former, transmettre: 1 compétence distinctive partagée dans sa capacité (minimum 3). Ses 2 métiers vont dans Autres pistes.
- Entretenir et réparer: 2 compétences distinctives partagées dans sa capacité (minimum 3). Ses 2 métiers vont dans Autres pistes.

**After (v7):** 3 directions.

### 1. Travailler la matière

**Révélée par vos réponses**: 4 des 4 métiers sont apportés par vos réponses. Preuves : 4 compétences distinctives partagées dans « Manipuler des produits, matières premières »; 2 réponses différentes.

Vos réponses derrière cette direction :
- « Faire avec mes mains et livrer un résultat concret. » (sf_hands_organise, 3 compétences partagées)
- « Dans l'action, avec du mouvement et des échanges. » (f_energy_context, 2 compétences partagées)

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Assembleur / Assembleuse d'ouvrages en bois | Industrie | moyen | entrée (rang 298 sans réponses) ✔ | Assembleur / Assembleuse d'ouvrages en bois ; Assembleur(se) d'ouvrages en bois et matériaux associés ; Assembleur / Assembleuse de placages | +16 |
| Modeleur / Modeleuse | Industrie | moyen | entrée (rang 232 sans réponses) ✔ | Modeleur / Modeleuse ; Modeleur / Modeleuse bois ; Modeleur / Modeleuse résine | +12 |
| Cisailleur / Cisailleuse en métallurgie | Industrie | moyen | entrée (rang 334 sans réponses) ✔ | Cisailleur / Cisailleuse en métallurgie ; Cisailleur / Cisailleuse de forge ; Cisailleur / Cisailleuse de laminoir | +47 |
| Charpentier / Charpentière | Bâtiment, travaux publics | moyen | entrée (rang 83 sans réponses) ✔ | Charpentier / Charpentière ; Aide charpentier / Aide charpentière ; Charpentier / Charpentière de restauration | +11 |

### 2. Cuisiner

**Dans la continuité de votre parcours**: 0 des 10 métiers sont apportés par vos réponses. Preuves : 37 compétences distinctives partagées dans « Mettre en œuvre des techniques culinaires »; 0 réponse différente.

Aucune réponse du quiz derrière cette direction : elle vient de votre parcours.

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Commis / Commise de cuisine | Restauration, hôtellerie, loisirs | moyen | +2 | Commis / Commise de cuisine ; Commis de cuisine tournant / Commise de cuisine tournante ; Commis pâtissier / Commise pâtissière de restaurant | +2 |
| Plongeur officier / Plongeuse officière de cuisine | Restauration, hôtellerie, loisirs | moyen | +11 | Plongeur officier / Plongeuse officière de cuisine ; Plongeur / Plongeuse en restauration ; Plongeur-batterie / Plongeuse-batterie en restauration | +1 |
| Chef / Cheffe de cuisine | Restauration, hôtellerie, loisirs | moyen | −1 | Chef / Cheffe de cuisine ; Chef / Cheffe d'atelier de cuisine ; Chef cuisinier / Cheffe cuisinière | +2 |
| Pizzaïolo / Pizzaïola | Restauration, hôtellerie, loisirs | moyen | −7 | Pizzaïolo / Pizzaïola | +1 |
| Cuisinier / Cuisinière | Restauration, hôtellerie, loisirs | fort | −15 | Cuisinier / Cuisinière ; Cuisinier / Cuisinière à domicile | +12 |
| Charcutier-traiteur / Charcutière-traiteuse | Commerce et vente | moyen | −7 | Charcutier-traiteur / Charcutière-traiteuse ; Charcutier / Charcutière ; Aide-charcutier / Aide-charcutière | +3 |
| Pâtissier / Pâtissière de restaurant | Restauration, hôtellerie, loisirs | fort | −18 | Pâtissier / Pâtissière de restaurant ; Chef pâtissier / Cheffe pâtissière de restaurant ; Cuisinier pâtissier / Cuisinière pâtissière | +3 |
| Employé / Employée de restauration collective | Restauration, hôtellerie, loisirs | moyen | −12 | Employé / Employée de restauration collective ; Employé / Employée de cantine ; Employé / Employée de cafétéria | +5 |
| Steward / Hôtesse de train | Restauration, hôtellerie, loisirs | moyen | −10 | Steward / Hôtesse de train | +1 |
| Poissonnier / Poissonnière | Commerce et vente | moyen | −20 | Poissonnier / Poissonnière ; Poissonnier-traiteur / Poissonnière-traiteuse | +3 |

### 3. La relation client

*Aussi : Bâtir une offre commerciale*

**Dans la continuité de votre parcours**: 0 des 2 métiers sont apportés par vos réponses. Preuves : 6 compétences distinctives partagées dans « Gérer la relation client, recueillir et analyser les besoins client »; 1 réponse différente.

Vos réponses derrière cette direction :
- « Dans l'action, avec du mouvement et des échanges. » (f_energy_context, 1 compétence partagée)

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Equipier polyvalent / Equipière polyvalente de restauration rapide | Restauration, hôtellerie, loisirs | moyen | +2 | Equipier(ère) polyvalent(e) de restauration rapide ; Agent / Agente de restauration rapide ; Préparateur(trice) livreur(se) en restauration rapide | +11 |
| Serveur / Serveuse en restauration | Restauration, hôtellerie, loisirs | moyen | entrée (rang 46 sans réponses) | Serveur / Serveuse en restauration ; Serveur / Serveuse de bar ; Serveur / Serveuse de banquet | +14 |

### Autres pistes (22 affichées; 2 au signal faible, derrière un lien)

| Métier | Secteur | Signal |
|---|---|---|
| Chargé / Chargée d'accueil et de services clientèle bancaire | Banque, assurance, immobilier | moyen |
| Technicien / Technicienne d'exploitation en production d'énergie thermique | Industrie | moyen |
| Coffreur / Coffreuse | Bâtiment, travaux publics | moyen |
| Etancheur / Etancheuse | Bâtiment, travaux publics | moyen |
| Electricien / Electricienne de maintenance | Maintenance | moyen |
| Agent / Agente d'opérations sur piste | Transport, logistique | moyen |
| Frigoriste | Maintenance | moyen |
| Educateur spécialisé / Educatrice spécialisée | Social, accompagnement | moyen |
| Employé familial / Employée familiale | Aide à la personne | moyen |
| Cuisinier / Cuisinière en industrie chimique | Industrie | moyen |
| Chargé / Chargée d'affaires bancaires | Banque, assurance, immobilier | moyen |
| Façadier / Façadière itéiste | Bâtiment, travaux publics | moyen |
| Matelot de la navigation fluviale | Transport, logistique | moyen |
| Agent / Agente de prévention et de sécurité | Sécurité, défense, secours | moyen |
| Agent / Agente de service hospitalier (ASH) | Santé | moyen |
| Agent / Agente de stérilisation de service hospitalier | Santé | moyen |
| Réceptionniste | Restauration, hôtellerie, loisirs | moyen |
| Mécanicien / Mécanicienne de maintenance industrielle | Maintenance | moyen |
| Chef / Cheffe d'équipe en industrie | Industrie | moyen |
| Menuisier / Menuisière aluminium | Bâtiment, travaux publics | moyen |
| Saliculteur / Salicultrice | Agriculture, nature, animaux | moyen |
| Agent de maintenance qualifié / Agente de maintenance qualifiée en camping | Maintenance | moyen |

## P9: Seed commerce:vente + réponses vente

Seed: commerce:vente; diplôme bac2; inventaire 1563 compétences (1539 du seed); 1115 pistes surfacées.

**Before (v6):** 1. La relation client (continuité, 10 métiers, preuves 21, 6 réponses); 2. Vendre (continuité, 4 métiers, preuves 9, 1 réponses); 3. Bâtir une offre commerciale (continuité, 4 métiers, preuves 9, 2 réponses); 4. Prendre soin des personnes (continuité, 3 métiers, preuves 9, 0 réponses); 5. Travailler la matière (continuité, 2 métiers, preuves 11, 0 réponses).

**After (v7):** 5 directions.

### 1. La relation client

**Dans la continuité de votre parcours**: 2 des 10 métiers sont apportés par vos réponses. Preuves : 21 compétences distinctives partagées dans « Gérer la relation client, recueillir et analyser les besoins client »; 6 réponses différentes. 4 métiers rattachés par leur 2e capacité.

Vos réponses derrière cette direction :
- « Échanger avec des personnes, comprendre leurs demandes, gérer la relation. » (sf_numbers_people, 5 compétences partagées)
- « J'appelle, je clarifie, je gère la tension. » (g_conflict, 5 compétences partagées)
- « Dans l'action, avec du mouvement et des échanges. » (f_energy_context, 3 compétences partagées)
- « Je préfère expliquer à l'oral, montrer et répondre aux questions. » (sf_write_explain, 3 compétences partagées)

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Vendeur / Vendeuse en équipement de la maison | Commerce et vente | moyen | +8 | Vendeur / Vendeuse en équipement de la maison ; Vendeur / Vendeuse en linge de maison ; Vendeur / Vendeuse en équipement du foyer | +32 |
| Conseiller / Conseillère en image personnelle | Commerce et vente | fort | −20 | Conseiller / Conseillère en image personnelle ; Conseiller / Conseillère beauté ; Conseiller / Conseillère minceur | +3 |
| Vendeur / Vendeuse en prêt-à-porter | Commerce et vente | moyen | entrée (rang 156 sans réponses) | Vendeur / Vendeuse en prêt-à-porter ; Vendeur / Vendeuse en prêt-à-porter enfant ; Vendeur / Vendeuse en prêt-à-porter de luxe | +4 |
| Chargé / Chargée de location d'engins et de matériel de chantier | Commerce et vente | moyen | −15 | Chargé(e) de location d'engins et de matériel de chantier | – |
| Chargé / Chargée d'accueil | Secrétariat, assistance | moyen | entrée (rang 449 sans réponses) | Chargé / Chargée d'accueil ; Chargé / Chargée d'accueil et d'information ; Agent / Agente d'accueil | +10 |
| Ingénieur / Ingénieure d'affaires en industrie | Industrie | moyen | entrée (rang 172 sans réponses) | Ingénieur / Ingénieure d'affaires en industrie ; Ingénieur / Ingénieure de suivi d'affaires en industrie ; Ingénieur / Ingénieure de projet d'affaires en industrie | +11 |
| Conseiller / Conseillère clientèle à distance | Commerce et vente | moyen | entrée (rang 490 sans réponses) ✔ | Conseiller / Conseillère clientèle à distance ; Technicien / Technicienne de la vente à distance | +6 |
| Agent / Agente d'Escale Commerciale aéroportuaire (AEC) | Transport, logistique | moyen | entrée (rang 668 sans réponses) | Agent / Agente d'Escale Commerciale aéroportuaire (AEC) ; Agent / Agente d'escale aéroportuaire ; Agent / Agente de passage escale aéroportuaire | +3 |
| Responsable service clients | Marketing, ventes | moyen | entrée (rang 62 sans réponses) | Responsable service clients ; Responsable service clients online ; Responsable administratif(tive) du service clients | +15 |
| Assistant administratif / Assistante administrative | Secrétariat, assistance | moyen | entrée (rang 415 sans réponses) ✔ | Assistant administratif / Assistante administrative ; Assistant / Assistante de gestion administrative ; Assistant / Assistante chef de projet | +18 |

### 2. Vendre

**Dans la continuité de votre parcours**: 0 des 4 métiers sont apportés par vos réponses. Preuves : 9 compétences distinctives partagées dans « Vendre »; 1 réponse différente. 1 métier rattaché par leur 2e capacité.

Vos réponses derrière cette direction :
- « Convaincre, négocier ou lancer une conversation. » (sf_sell_fix, 1 compétence partagée)

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Vendeur / Vendeuse d'articles de sport et loisirs | Commerce et vente | moyen | +24 | Vendeur / Vendeuse d'articles de sport et loisirs ; Vendeur / Vendeuse en articles de sport ; Vendeur / Vendeuse en équipement de sport | +7 |
| Acheteur vendeur / Acheteuse vendeuse d'or, de métaux précieux | Commerce et vente | moyen | −6 | Acheteur(se) vendeur(se) d'or, de métaux précieux | – |
| Architecte du bâtiment | Bâtiment, travaux publics | moyen | entrée (rang 354 sans réponses) | Architecte du bâtiment ; Architecte DE ; Architecte habilité | +7 |
| Vendeur / Vendeuse de produits culturels et ludiques | Commerce et vente | moyen | entrée (rang 61 sans réponses) | Vendeur / Vendeuse de produits culturels et ludiques ; Vendeur / Vendeuse de produits ludiques ; Vendeur / Vendeuse de produits culturels | +2 |

### 3. Bâtir une offre commerciale

**Dans la continuité de votre parcours**: 1 des 4 métiers sont apportés par vos réponses. Preuves : 9 compétences distinctives partagées dans « Élaborer une offre commerciale »; 2 réponses différentes. 1 métier rattaché par leur 2e capacité.

Vos réponses derrière cette direction :
- « Convaincre, négocier ou lancer une conversation. » (sf_sell_fix, 2 compétences partagées)
- « Je préfère expliquer à l'oral, montrer et répondre aux questions. » (sf_write_explain, 1 compétence partagée)

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Vendeur / Vendeuse conseil en jardinerie | Commerce et vente | moyen | +13 | Vendeur / Vendeuse conseil en jardinerie ; Vendeur / Vendeuse en jardinerie ; Vendeur / Vendeuse de végétaux | +5 |
| Architecte d'intérieur | Bâtiment, travaux publics | moyen | entrée (rang 191 sans réponses) ✔ | Architecte d'intérieur ; Architecte décorateur / Architecte décoratrice ; Assistant décorateur / Assistante décoratrice d'intérieur | +4 |
| Vendeur de tabac-presse / Vendeuse de tabac-presse | Commerce et vente | moyen | entrée (rang 100 sans réponses) | Vendeur de tabac-presse / Vendeuse de tabac-presse ; Vendeur / Vendeuse en bureau de tabac ; Vendeur de presse / Vendeuse de presse | +10 |
| Vendeur / Vendeuse en animalerie | Commerce et vente | moyen | entrée (rang 54 sans réponses) | Vendeur / Vendeuse en animalerie ; Vendeur / Vendeuse en articles d'animalerie ; Vendeur / Vendeuse d'animaux | +4 |

### 4. Prendre soin des personnes

**Dans la continuité de votre parcours**: 0 des 3 métiers sont apportés par vos réponses. Preuves : 9 compétences distinctives partagées dans « Prendre soin des personnes »; 0 réponse différente.

Aucune réponse du quiz derrière cette direction : elle vient de votre parcours.

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Coiffeur / Coiffeuse | Commerce et vente | moyen | +5 | Coiffeur / Coiffeuse ; Coiffeur / Coiffeuse dames ; Coiffeur / Coiffeuse mixte | +11 |
| Prothésiste ongulaire | Commerce et vente | moyen | = | Prothésiste ongulaire ; Styliste ongulaire | +2 |
| Coiffeur / Coiffeuse spectacle | Spectacle | moyen | −13 | Coiffeur / Coiffeuse spectacle ; Assistant coiffeur / Assistante coiffeuse spectacle ; Coiffeur-perruquier / Coiffeuse-perruquière spectacle | +7 |

### 5. Travailler la matière

*Aussi : Appliquer des procédés*

**Dans la continuité de votre parcours**: 0 des 2 métiers sont apportés par vos réponses. Preuves : 11 compétences distinctives partagées dans « Manipuler des produits, matières premières »; 0 réponse différente.

Aucune réponse du quiz derrière cette direction : elle vient de votre parcours.

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Cordonnier / Cordonnière | Commerce et vente | moyen | +1 | Cordonnier / Cordonnière ; Cordonnier-bottier / Cordonnière-bottière ; Cordonnier réparateur / Cordonnière réparatrice | +4 |
| Fleuriste | Commerce et vente | moyen | entrée (rang 60 sans réponses) | Fleuriste ; Fleuriste-décorateur floral / Fleuriste-décoratrice florale | +1 |

### Autres pistes (17 affichées; 0 au signal faible, derrière un lien)

| Métier | Secteur | Signal |
|---|---|---|
| Plagiste | Commerce et vente | fort |
| Chargé / Chargée d'accueil et de services clientèle bancaire | Banque, assurance, immobilier | moyen |
| Responsable de service en établissement touristique | Restauration, hôtellerie, loisirs | moyen |
| Toiletteur / Toiletteuse d'animaux | Agriculture, nature, animaux | moyen |
| Maître / Maîtresse de cérémonie funéraire | Services funéraires | moyen |
| Enseignant / Enseignante de la conduite et de la sécurité routière | Enseignement, formation | moyen |
| Agent administratif / Agente administrative banque ou assurance | Banque, assurance, immobilier | moyen |
| Brocanteur / Brocanteuse | Commerce et vente | moyen |
| Guichetier vendeur / Guichetière vendeuse | Banque, assurance, immobilier | moyen |
| Educateur sportif / Educatrice sportive | Restauration, hôtellerie, loisirs | moyen |
| Responsable de pressing | Commerce et vente | moyen |
| Tapissier / Tapissière d'ameublement | Artisanat d'art | moyen |
| Secrétaire administratif / Secrétaire administrative de collectivité territoriale | Secrétariat, assistance | moyen |
| Chef / Cheffe de projet événementiel | Communication, médias | moyen |
| Conseiller commercial / Conseillère commerciale et relation client en assurances | Banque, assurance, immobilier | moyen |
| Assistant administratif / Assistante administrative multilingue | Secrétariat, assistance | moyen |
| Gérant / Gérante salon de coiffure | Commerce et vente | fort |

## P10: Seed btp:second + réponses organisation

Seed: btp:second; diplôme bac2; inventaire 429 compétences (402 du seed); 1103 pistes surfacées.

**Before (v6):** 1. Construire, bâtir (continuité, 11 métiers, preuves 61, 0 réponses); 2. Travailler la matière (continuité, 5 métiers, preuves 10, 1 réponses); 3. Convaincre (révélée, 5 métiers, preuves 1, 3 réponses); 4. Gérer l'administratif (révélée, 5 métiers, preuves 2, 4 réponses); 5. Tenir les comptes (continuité, 2 métiers, preuves 2, 3 réponses).

**Removed by the evidence bar:**
- Travailler la matière: révélée par 1 réponse seulement (minimum 2). Ses 5 métiers vont dans Autres pistes.
- Convaincre: 1 compétence distinctive partagée dans sa capacité (minimum 3). Ses 5 métiers vont dans Autres pistes.
- Gérer l'administratif: 2 compétences distinctives partagées dans sa capacité (minimum 3). Ses 4 métiers vont dans Autres pistes.
- Tenir les comptes: 2 compétences distinctives partagées dans sa capacité (minimum 3). Ses 2 métiers vont dans Autres pistes.

**After (v7):** 2 directions.

### 1. Réagir à l'imprévu

*Aussi : Animer un groupe*

**Révélée par vos réponses**: 2 des 2 métiers sont apportés par vos réponses. Preuves : 4 compétences distinctives partagées dans « Agir face à l'imprévu »; 5 réponses différentes.

Vos réponses derrière cette direction :
- « Je prends naturellement la responsabilité de faire avancer. » (g_lead_support, 3 compétences partagées)
- « Je pose une limite claire. » (g_boundaries, 3 compétences partagées)
- « Je fais une première version, puis je corrige vite. » (f_ambiguous_instruction, 2 compétences partagées)
- « Je décide, puis j'ajuste si besoin. » (f_decide_wait, 1 compétence partagée)

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Manager de proximité | Ressources humaines | moyen | entrée (rang 198 sans réponses) ✔ | Manager de proximité ; Team manager | +2 |
| Chef / Cheffe de projet événementiel | Communication, médias | moyen | entrée (rang 153 sans réponses) ✔ | Chef / Cheffe de projet événementiel ; Chargé / Chargée responsable de projet événementiel ; Chargé / Chargée de mission événementiel | +4 |

### 2. Construire, bâtir

**Dans la continuité de votre parcours**: 0 des 11 métiers sont apportés par vos réponses. Preuves : 61 compétences distinctives partagées dans « Construire »; 0 réponse différente.

Aucune réponse du quiz derrière cette direction : elle vient de votre parcours.

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Menuisier / Menuisière aluminium | Bâtiment, travaux publics | moyen | +3 | Menuisier / Menuisière aluminium ; Menuisier fabricant / Menuisière fabricante aluminium ; Monteur / Monteuse de menuiserie aluminium | +2 |
| Poseur / Poseuse en fermetures de bâtiment | Bâtiment, travaux publics | moyen | +10 | Poseur / Poseuse en fermetures de bâtiment ; Menuisier poseur / Menuisière poseuse de fermetures ; Poseur / Poseuse de clôtures | +21 |
| Electricien / Electricienne du bâtiment | Bâtiment, travaux publics | moyen | −2 | Electricien / Electricienne du bâtiment ; Electricien / Electricienne bâtiment tertiaire ; Artisan électricien / Artisane électricienne du bâtiment | +9 |
| Poseur / Poseuse de véranda | Bâtiment, travaux publics | moyen | +3 | Poseur / Poseuse de vérandas ; Poseur installateur / Poseuse installatrice de carport ; Poseur installateur / Poseuse installatrice de pergola | – |
| Monteur / Monteuse de réseaux électriques | Bâtiment, travaux publics | fort | = | Monteur / Monteuse de réseaux électriques ; Monteur / Monteuse réseaux ; Monteur / Monteuse de lignes électriques | +23 |
| Carreleur / Carreleuse | Bâtiment, travaux publics | moyen | −4 | Carreleur / Carreleuse ; Carreleur / Carreleuse mosaïste ; Aide carreleur / Aide carreleuse | +10 |
| Plâtrier / Plâtrière | Bâtiment, travaux publics | fort | −10 | Plâtrier / Plâtrière ; Platrier / Platrière plaquiste ; Artisan plâtrier / Artisane plâtrière | +3 |
| Poseur / Poseuse de revêtements de sols | Bâtiment, travaux publics | moyen | −10 | Poseur / Poseuse de revêtements de sols ; Poseur / Poseuse de revêtements souples de sols ; Poseur / Poseuse de revêtements souples murs et sols | +13 |
| Electricien / Electricienne de maintenance | Maintenance | moyen | entrée (rang 53 sans réponses) | Electricien / Electricienne de maintenance ; Aide électricien / Aide électricienne de maintenance ; Electricien / Electricienne d'atelier de maintenance | +32 |
| Plombier / Plombière sanitaire | Bâtiment, travaux publics | moyen | −23 | Plombier / Plombière sanitaire ; Plombier / Plombière ; Aide plombier / Aide plombière | +8 |
| Plaquiste | Bâtiment, travaux publics | moyen | −25 | Plaquiste ; Monteur / Monteuse plaquiste ; Jointeur / Jointeuse plaquiste | +11 |

**2 directions only** (fewer than 3).

### Autres pistes (26 affichées; 1 au signal faible, derrière un lien)

| Métier | Secteur | Signal |
|---|---|---|
| Chef / Cheffe d'équipe en industrie | Industrie | moyen |
| Peintre en bâtiment | Bâtiment, travaux publics | fort |
| Chargé / Chargée d'accueil et de services clientèle bancaire | Banque, assurance, immobilier | moyen |
| Modeleur / Modeleuse | Industrie | moyen |
| Responsable d'agence transport routier de marchandises | Transport, logistique | moyen |
| Agent / Agente d'encadrement en industrie du bois | Industrie | moyen |
| Façadier / Façadière itéiste | Bâtiment, travaux publics | moyen |
| Chef / Cheffe d'établissement d'enseignement | Enseignement, formation | moyen |
| Approvisionneur / Approvisionneuse logistique | Transport, logistique | moyen |
| Ingénieur / Ingénieure de maintenance industrielle | Maintenance | moyen |
| Responsable de site éco-industriel | Propreté, environnement | moyen |
| Responsable de service en établissement touristique | Restauration, hôtellerie, loisirs | moyen |
| Régisseur / Régisseuse de production | Spectacle | moyen |
| Responsable d'équipe maintenance | Maintenance | moyen |
| Laveur / Laveuse de vitres | Propreté, environnement | moyen |
| Responsable de l'administration des ventes | Marketing, ventes | moyen |
| Chargé / Chargée d'affaires bancaires | Banque, assurance, immobilier | moyen |
| Directeur / Directrice artistique spectacle | Spectacle | moyen |
| Responsable ordonnancement-lancement-planification en industrie | Industrie | moyen |
| Responsable entrepôt logistique | Transport, logistique | moyen |
| Enseignant / Enseignante de la conduite et de la sécurité routière | Enseignement, formation | moyen |
| Responsable service clients | Marketing, ventes | moyen |
| Agent / Agente d'opérations sur piste | Transport, logistique | moyen |
| Technicien / Technicienne de l'industrie du verre | Industrie | moyen |
| Chef / Cheffe machiniste spectacle | Spectacle | moyen |
| Chef / Cheffe de carrière | Bâtiment, travaux publics | moyen |

## Contrast: P4 vs P5, same seed (tech:code), different answers

| | P4 (analyse) | P5 (relation) |
|---|---|---|
| 1 | **Construire des logiciels** (continuité)<br>(parcours) | **La relation client** (révélée)<br>« Échanger avec des personnes, comprendre leurs demandes, gérer la relation. »<br>« J'appelle, je clarifie, je gère la tension. » |
| 2 | **Analyser des données** (continuité)<br>« J'ai besoin de comprendre ce qui se passe vraiment. »<br>« Vérifier, calculer, classer, appliquer des règles précises. » | **Construire des logiciels** (continuité)<br>(parcours) |
| 3 | **Animer un groupe** (continuité)<br>« Je commence par remettre de l'ordre. » | **Développer une activité** (continuité)<br>(parcours) |
| 4 | **Contrôler la qualité** (continuité)<br>« J'ai besoin de comprendre ce qui se passe vraiment. »<br>« Je reconstruis le chemin : étapes, captures, logs, contexte. » |  |
| 5 | **Entretenir et réparer** (continuité)<br>« J'ai besoin de comprendre ce qui se passe vraiment. »<br>« Je cherche pourquoi il revient. » |  |

## Naming and sector flags

Capacities used as a name or subline whose name is flagged (all 59 personas):

- « Développer une stratégie commerciale et marketing »: absent du brouillon : libellé ROME gardé (7 directions)
- « Gérer des actifs, un patrimoine »: absent du brouillon : libellé ROME gardé (7 directions)
- « Animer des activités »: absent du brouillon : libellé ROME gardé (6 directions)
- « Élaborer et appliquer un cadre juridique ou règlementaire »: absent du brouillon : libellé ROME gardé (5 directions)
- « Manutentionner, conditionner des produits »: absent du brouillon : libellé ROME gardé (4 directions)
- « Assurer un transport »: absent du brouillon : libellé ROME gardé (4 directions)
- « Gérer un chantier »: absent du brouillon : libellé ROME gardé (3 directions)
- « Contrôler la production »: absent du brouillon : libellé ROME gardé (3 directions)
- « Gérer, contrôler »: trop vague (signalé dans le brouillon) (3 directions)
- « Concevoir des supports vidéo ou graphiques »: absent du brouillon : libellé ROME gardé (3 directions)
- « Composer, mettre en scène »: absent du brouillon : libellé ROME gardé (3 directions)
- « Accueillir, renseigner »: absent du brouillon : libellé ROME gardé (2 directions)
- « Cultiver, produire »: absent du brouillon : libellé ROME gardé (2 directions)
- « Prendre soin d'un animal »: absent du brouillon : libellé ROME gardé (2 directions)
- « Réaliser des actions de communication et évènements »: absent du brouillon : libellé ROME gardé (2 directions)
- « Améliorer la qualité de vie au travail »: absent du brouillon : libellé ROME gardé (1 direction)
- « Modéliser, prototyper, inventer »: absent du brouillon : libellé ROME gardé (1 direction)
- « Réaliser une performance, représentation artistique »: absent du brouillon : libellé ROME gardé (1 direction)
- « Négocier, rédiger des contrats »: absent du brouillon : libellé ROME gardé (1 direction)
- « Gérer des litiges, des contentieux »: absent du brouillon : libellé ROME gardé (1 direction)
- « Communiquer (niveau professionnel) »: absent du brouillon : libellé ROME gardé (1 direction)
- « Protéger les personnes et les biens »: absent du brouillon : libellé ROME gardé (1 direction)
- « Développer les nouvelles technologies »: absent du brouillon : libellé ROME gardé (1 direction)

Sector labels flagged (roles shown in directions or Autres pistes):

- K hors liste (Conception et mise en oeuvre des politiques publiques) : à revoir (8 rows)
- K hors liste (Contrôle public) : à revoir (6 rows)
- M hors liste (Achats) : à revoir (3 rows)

## Directions that appear for many personas

**the 10 report personas**: "La relation client" 6/10, "Travailler la matière" 3/10, "Contrôler la qualité" 2/10, "Construire des logiciels" 2/10, "Réagir à l'imprévu" 2/10, "Prendre soin des personnes" 2/10.

**the wide set of 59**: "La relation client" 13/59, "Travailler la matière" 12/59, "Prévenir les risques" 12/59, "Contrôler la qualité" 9/59, "Prendre soin des personnes" 9/59, "Construire des logiciels" 8/59.

Personas with fewer than 3 directions after the evidence bar: 11/59 (P1: 1, P2: 2, P3: 2, P10: 2, quiz relation: 1, quiz analyse: 2, quiz vente: 2, quiz organisation: 2, seed btp:second: 2, seed maintenance:vehicule: 2, seed hotellerie:cuisine: 1).

## Genericity: roles in the top 40 for more than 40 % of the wide set (59)

None. Most frequent: Chargé / Chargée d'accueil et de services clientèle bancaire (C1201) 15/59; Responsable de service en établissement touristique (G1403) 12/59; Chef / Cheffe d'équipe en industrie (H2504) 12/59; Chef / Cheffe de projet événementiel (E1107) 11/59; Enseignant / Enseignante de la conduite et de la sécurité routière (K2110) 10/59.

## Genericity: roles in the top 40 for more than 40 % of the personas who answered the quiz (15)

Carrying skills = the shared skills that contribute most rarity to the role across the personas where it is in the top 40. *In inventories* = how many of these 15 persona inventories hold the skill. *Comes from* = quiz clusters that contain it, and how many of the 44 seed depths inject it.

### Chargé / Chargée d'accueil et de services clientèle bancaire (C1201, Banque, assurance, immobilier)

In the top 40 for **14/15** (93 %): 8 quiz only, 6 seed and answers, 0 seed only. Median rank 2. ROME lists 50 skills for it. Personas: P1 (relation), P2 (analyse), P3 (terrain), P5 (relation), P6 (relation), P7 (relation), P8 (terrain), P9 (vente), P10 (organisation), quiz relation (relation), quiz analyse (analyse), quiz terrain (terrain), quiz vente (vente), quiz organisation (organisation).

| Carrying skill | idf | Share of its rarity | In inventories | Comes from |
|---|---|---|---|---|
| Identifier, traiter une demande client (300363) | 3.4 | 9 % | 12/15 | quiz: contact; 14 seed depths |
| Recueillir et analyser les besoins client (300366) | 3.0 | 8 % | 13/15 | quiz: contact; 17 seed depths |
| Accueillir, orienter, renseigner un public (300361) | 2.8 | 7 % | 12/15 | quiz: relation_client, contact; 21 seed depths |
| Gérer des réclamations et litiges (300345) | 3.2 | 6 % | 9/15 | quiz: gestion_conflit; 12 seed depths |
| Accompagner l'appropriation d'un outil par ses utilisateurs (300019) | 3.8 | 6 % | 8/15 | quiz: support; 8 seed depths |
| Rendre compte de son activité (300462) | 3.3 | 6 % | 9/15 | quiz: fiabilite; 17 seed depths |

### Responsable de service en établissement touristique (G1403, Restauration, hôtellerie, loisirs)

In the top 40 for **9/15** (60 %): 4 quiz only, 5 seed and answers, 0 seed only. Median rank 6. ROME lists 63 skills for it. Personas: P1 (relation), P5 (relation), P6 (relation), P7 (relation), P9 (vente), P10 (organisation), quiz relation (relation), quiz vente (vente), quiz organisation (organisation).

| Carrying skill | idf | Share of its rarity | In inventories | Comes from |
|---|---|---|---|---|
| Principes de la relation client (478215) | 4.6 | 10 % | 7/15 | quiz: relation_client; 7 seed depths |
| Prévenir et résoudre les conflits (300441) | 3.2 | 8 % | 9/15 | quiz: gestion_conflit, besoin_harmonie; 13 seed depths |
| Recueillir et analyser les besoins client (300366) | 3.0 | 8 % | 13/15 | quiz: contact; 17 seed depths |
| Répondre aux attentes d'un client (300364) | 2.9 | 8 % | 12/15 | quiz: contact; 20 seed depths |
| Techniques de communication orales, écrites et numériques (100541) | 2.2 | 5 % | 9/15 | quiz: relation_client; 20 seed depths |
| Gérer un planning (300464) | 3.8 | 5 % | 7/15 | quiz: organisation, priorisation, planification; 14 seed depths |

### Agent administratif / Agente administrative banque ou assurance (C1401, Banque, assurance, immobilier)

In the top 40 for **9/15** (60 %): 5 quiz only, 4 seed and answers, 0 seed only. Median rank 14. ROME lists 55 skills for it. Personas: P1 (relation), P3 (terrain), P5 (relation), P6 (relation), P7 (relation), P9 (vente), quiz relation (relation), quiz terrain (terrain), quiz vente (vente).

| Carrying skill | idf | Share of its rarity | In inventories | Comes from |
|---|---|---|---|---|
| Identifier, traiter une demande client (300363) | 3.4 | 11 % | 12/15 | quiz: contact; 14 seed depths |
| Recueillir et analyser les besoins client (300366) | 3.0 | 10 % | 13/15 | quiz: contact; 17 seed depths |
| Accueillir, orienter, renseigner un public (300361) | 2.8 | 9 % | 12/15 | quiz: relation_client, contact; 21 seed depths |
| Gérer des réclamations et litiges (300345) | 3.2 | 8 % | 9/15 | quiz: gestion_conflit; 12 seed depths |
| Accompagner l'appropriation d'un outil par ses utilisateurs (300019) | 3.8 | 6 % | 8/15 | quiz: support; 8 seed depths |
| Faire preuve de réactivité (300473) | 1.6 | 6 % | 12/15 | quiz: adaptabilite |

### Chef / Cheffe de projet événementiel (E1107, Communication, médias)

In the top 40 for **9/15** (60 %): 4 quiz only, 5 seed and answers, 0 seed only. Median rank 28. ROME lists 64 skills for it. Personas: P1 (relation), P5 (relation), P6 (relation), P7 (relation), P9 (vente), P10 (organisation), quiz relation (relation), quiz vente (vente), quiz organisation (organisation).

| Carrying skill | idf | Share of its rarity | In inventories | Comes from |
|---|---|---|---|---|
| Faire preuve d'agilité dans son action selon les contextes (402000) | 4.3 | 15 % | 12/15 | quiz: adaptabilite; 7 seed depths |
| Recueillir et analyser les besoins client (300366) | 3.0 | 10 % | 13/15 | quiz: contact; 17 seed depths |
| Etre ouvert aux changements (300479) | 2.2 | 8 % | 13/15 | quiz: adaptabilite; 31 seed depths |
| Techniques de communication orales, écrites et numériques (100541) | 2.2 | 7 % | 9/15 | quiz: relation_client; 20 seed depths |
| Concevoir et gérer un projet (300488) | 2.4 | 5 % | 8/15 | quiz: organisation; 23 seed depths |
| Travailler en groupe, en réseau (300470) | 3.1 | 4 % | 4/15 | 17 seed depths |

### Enseignant / Enseignante de la conduite et de la sécurité routière (K2110, Enseignement, formation)

In the top 40 for **8/15** (53 %): 3 quiz only, 5 seed and answers, 0 seed only. Median rank 12. ROME lists 82 skills for it. Personas: P1 (relation), P5 (relation), P6 (relation), P7 (relation), P9 (vente), P10 (organisation), quiz relation (relation), quiz vente (vente).

| Carrying skill | idf | Share of its rarity | In inventories | Comes from |
|---|---|---|---|---|
| Gérer une situation conflictuelle (300480) | 3.5 | 10 % | 9/15 | quiz: gestion_conflit; 8 seed depths |
| Recueillir et analyser les besoins client (300366) | 3.0 | 9 % | 13/15 | quiz: contact; 17 seed depths |
| Techniques d'écoute active et de médiation (404565) | 4.6 | 8 % | 5/15 | quiz: besoin_harmonie; 7 seed depths |
| Accueillir, orienter, renseigner un public (300361) | 2.8 | 8 % | 12/15 | quiz: relation_client, contact; 21 seed depths |
| Enseigner, développer des compétences (300022) | 2.4 | 6 % | 8/15 | quiz: transmission, pedagogie; 15 seed depths |
| Faire preuve de réactivité (300473) | 1.6 | 5 % | 12/15 | quiz: adaptabilite |

### Conseiller / Conseillère technique agricole (A1304, Agriculture, nature, animaux)

In the top 40 for **8/15** (53 %): 5 quiz only, 3 seed and answers, 0 seed only. Median rank 14. ROME lists 61 skills for it. Personas: P1 (relation), P2 (analyse), P5 (relation), P6 (relation), P7 (relation), quiz relation (relation), quiz analyse (analyse), quiz vente (vente).

| Carrying skill | idf | Share of its rarity | In inventories | Comes from |
|---|---|---|---|---|
| Analyser, résoudre un problème courant ou complexe (300082) | 4.9 | 12 % | 8/15 | quiz: analyse, diagnostic; 7 seed depths |
| Techniques d'écoute active (107926) | 4.2 | 12 % | 10/15 | quiz: empathie; 9 seed depths |
| Traiter les demandes de support technique (124094) | 5.4 | 11 % | 8/15 | quiz: relation_client; 5 seed depths |
| Présenter et valoriser un produit ou un service (300374) | 3.1 | 6 % | 9/15 | quiz: vente, presentation; 18 seed depths |
| Recueillir et analyser les besoins client (300366) | 3.0 | 6 % | 13/15 | quiz: contact; 17 seed depths |
| Préparer et animer une réunion, un groupe de travail, un atelier (300469) | 2.6 | 5 % | 8/15 | quiz: presentation; 20 seed depths |

### Responsable service clients (M1704, Marketing, ventes)

In the top 40 for **8/15** (53 %): 4 quiz only, 4 seed and answers, 0 seed only. Median rank 28. ROME lists 44 skills for it. Personas: P1 (relation), P6 (relation), P7 (relation), P9 (vente), P10 (organisation), quiz relation (relation), quiz vente (vente), quiz organisation (organisation).

| Carrying skill | idf | Share of its rarity | In inventories | Comes from |
|---|---|---|---|---|
| Traiter les demandes de support technique (124094) | 5.4 | 13 % | 8/15 | quiz: relation_client; 5 seed depths |
| Recueillir l'avis et les remarques d'un client (122327) | 4.9 | 12 % | 7/15 | quiz: relation_client; 3 seed depths |
| Gérer des réclamations et litiges (300345) | 3.2 | 10 % | 9/15 | quiz: gestion_conflit; 12 seed depths |
| Techniques de communication orales, écrites et numériques (100541) | 2.2 | 6 % | 9/15 | quiz: relation_client; 20 seed depths |
| Faire preuve de réactivité (300473) | 1.6 | 5 % | 12/15 | quiz: adaptabilite |
| Piloter une activité (300487) | 3.5 | 4 % | 5/15 | 18 seed depths |

### Chef / Cheffe d'équipe en industrie (H2504, Industrie)

In the top 40 for **8/15** (53 %): 5 quiz only, 3 seed and answers, 0 seed only. Median rank 20. ROME lists 75 skills for it. Personas: P2 (analyse), P3 (terrain), P4 (analyse), P8 (terrain), P10 (organisation), quiz analyse (analyse), quiz terrain (terrain), quiz organisation (organisation).

| Carrying skill | idf | Share of its rarity | In inventories | Comes from |
|---|---|---|---|---|
| Rendre compte de son activité (300462) | 3.3 | 8 % | 9/15 | quiz: fiabilite; 17 seed depths |
| Entretenir un équipement, une machine, une installation (300181) | 3.1 | 6 % | 7/15 | quiz: support; 12 seed depths |
| Organiser et contrôler un approvisionnement (300261) | 3.6 | 6 % | 6/15 | quiz: organisation; 15 seed depths |
| Elaborer des processus et des modes opératoires techniques (300146) | 3.6 | 6 % | 5/15 | quiz: systemes, scalabilite; 9 seed depths |
| Préparer du matériel en prévision d'un travail (300152) | 3.4 | 5 % | 12/15 | quiz: terrain; 10 seed depths |
| Réaliser un diagnostic technique (300185) | 3.3 | 5 % | 6/15 | quiz: resolution; 13 seed depths |

### Chargé / Chargée d'affaires bancaires (C1203, Banque, assurance, immobilier)

In the top 40 for **8/15** (53 %): 5 quiz only, 3 seed and answers, 0 seed only. Median rank 18. ROME lists 54 skills for it. Personas: P2 (analyse), P3 (terrain), P4 (analyse), P8 (terrain), P10 (organisation), quiz analyse (analyse), quiz terrain (terrain), quiz organisation (organisation).

| Carrying skill | idf | Share of its rarity | In inventories | Comes from |
|---|---|---|---|---|
| Respecter des règles, des consignes, normes et procédures opérationnelles (300448) | 2.8 | 14 % | 9/15 | quiz: rigueur, fiabilite; 22 seed depths |
| Prendre une décision et l'expliquer (300459) | 4.1 | 12 % | 6/15 | quiz: decision_incertitude; 9 seed depths |
| Concevoir des outils de pilotage, indicateurs, tableaux de bord (300321) | 3.9 | 12 % | 6/15 | quiz: systemes, scalabilite, reporting; 7 seed depths |
| Recueillir et analyser les besoins client (300366) | 3.0 | 11 % | 13/15 | quiz: contact; 17 seed depths |
| Faire preuve de sens des responsabilités (300461) | 2.0 | 10 % | 9/15 | quiz: fiabilite; 26 seed depths |
| Concevoir et gérer un projet (300488) | 2.4 | 7 % | 8/15 | quiz: organisation; 23 seed depths |

### Conseiller / Conseillère clientèle à distance (D1408, Commerce et vente)

In the top 40 for **7/15** (47 %): 3 quiz only, 4 seed and answers, 0 seed only. Median rank 6. ROME lists 45 skills for it. Personas: P1 (relation), P5 (relation), P6 (relation), P7 (relation), P9 (vente), quiz relation (relation), quiz vente (vente).

| Carrying skill | idf | Share of its rarity | In inventories | Comes from |
|---|---|---|---|---|
| Répondre aux appels téléphoniques, mails, tchat et renseigner les clients (485132) | 5.4 | 14 % | 7/15 | quiz: relation_client; 2 seed depths |
| Proposer des solutions adaptées aux besoins spécifiques des clients (501073) | 4.8 | 13 % | 7/15 | quiz: relation_client; 6 seed depths |
| Principes de la relation client (478215) | 4.6 | 12 % | 7/15 | quiz: relation_client; 7 seed depths |
| Identifier, traiter une demande client (300363) | 3.4 | 9 % | 12/15 | quiz: contact; 14 seed depths |
| Présenter et valoriser un produit ou un service (300374) | 3.1 | 8 % | 9/15 | quiz: vente, presentation; 18 seed depths |
| Techniques de communication orales, écrites et numériques (100541) | 2.2 | 6 % | 9/15 | quiz: relation_client; 20 seed depths |

### Conseiller commercial / Conseillère commerciale et relation client en assurances (C1102, Banque, assurance, immobilier)

In the top 40 for **7/15** (47 %): 3 quiz only, 4 seed and answers, 0 seed only. Median rank 23. ROME lists 58 skills for it. Personas: P1 (relation), P5 (relation), P6 (relation), P7 (relation), P9 (vente), quiz relation (relation), quiz vente (vente).

| Carrying skill | idf | Share of its rarity | In inventories | Comes from |
|---|---|---|---|---|
| Proposer des solutions adaptées aux besoins spécifiques des clients (501073) | 4.8 | 14 % | 7/15 | quiz: relation_client; 6 seed depths |
| Principes de la relation client (478215) | 4.6 | 13 % | 7/15 | quiz: relation_client; 7 seed depths |
| Techniques d'écoute active (107926) | 4.2 | 12 % | 10/15 | quiz: empathie; 9 seed depths |
| Gérer des réclamations et litiges (300345) | 3.2 | 9 % | 9/15 | quiz: gestion_conflit; 12 seed depths |
| Recueillir et analyser les besoins client (300366) | 3.0 | 9 % | 13/15 | quiz: contact; 17 seed depths |
| Promouvoir une proposition, un projet (300418) | 4.0 | 7 % | 5/15 | quiz: persuasion; 13 seed depths |

### Guichetier vendeur / Guichetière vendeuse (C1211, Banque, assurance, immobilier)

In the top 40 for **7/15** (47 %): 3 quiz only, 4 seed and answers, 0 seed only. Median rank 18. ROME lists 45 skills for it. Personas: P1 (relation), P5 (relation), P6 (relation), P7 (relation), P9 (vente), quiz relation (relation), quiz vente (vente).

| Carrying skill | idf | Share of its rarity | In inventories | Comes from |
|---|---|---|---|---|
| Principes de la relation client (478215) | 4.6 | 15 % | 7/15 | quiz: relation_client; 7 seed depths |
| Conseiller, accompagner une personne (300014) | 3.6 | 12 % | 7/15 | quiz: pedagogie; 14 seed depths |
| Identifier, traiter une demande client (300363) | 3.4 | 11 % | 12/15 | quiz: contact; 14 seed depths |
| Présenter et valoriser un produit ou un service (300374) | 3.1 | 10 % | 9/15 | quiz: vente, presentation; 18 seed depths |
| Accueillir, orienter, renseigner un public (300361) | 2.8 | 9 % | 12/15 | quiz: relation_client, contact; 21 seed depths |
| Mettre à jour un dossier, une base de données (300431) | 3.0 | 4 % | 6/15 | quiz: gestion_donnees; 17 seed depths |

### Agent / Agente d'Escale Commerciale aéroportuaire (AEC) (N2201, Transport, logistique)

In the top 40 for **7/15** (47 %): 3 quiz only, 4 seed and answers, 0 seed only. Median rank 12. ROME lists 47 skills for it. Personas: P1 (relation), P5 (relation), P6 (relation), P7 (relation), P9 (vente), quiz relation (relation), quiz vente (vente).

| Carrying skill | idf | Share of its rarity | In inventories | Comes from |
|---|---|---|---|---|
| Identifier, traiter une demande client (300363) | 3.4 | 21 % | 12/15 | quiz: contact; 14 seed depths |
| Répondre aux attentes d'un client (300364) | 2.9 | 18 % | 12/15 | quiz: contact; 20 seed depths |
| Accueillir, orienter, renseigner un public (300361) | 2.8 | 17 % | 12/15 | quiz: relation_client, contact; 21 seed depths |
| Etre ouvert aux changements (300479) | 2.2 | 14 % | 13/15 | quiz: adaptabilite; 31 seed depths |
| Analyser les retours d'expérience pour améliorer les processus (483650) | 5.5 | 10 % | 3/15 | 5 seed depths |
| Utiliser les outils numériques (300426) | 1.9 | 7 % | 5/15 | 34 seed depths |

### Educateur sportif / Educatrice sportive (G1204, Restauration, hôtellerie, loisirs)

In the top 40 for **7/15** (47 %): 3 quiz only, 4 seed and answers, 0 seed only. Median rank 23. ROME lists 78 skills for it. Personas: P1 (relation), P5 (relation), P6 (relation), P7 (relation), P9 (vente), quiz relation (relation), quiz vente (vente).

| Carrying skill | idf | Share of its rarity | In inventories | Comes from |
|---|---|---|---|---|
| Accueillir, orienter, renseigner un public (300361) | 2.8 | 13 % | 12/15 | quiz: relation_client, contact; 21 seed depths |
| Enseigner, développer des compétences (300022) | 2.4 | 11 % | 8/15 | quiz: transmission, pedagogie; 15 seed depths |
| Techniques de communication orales, écrites et numériques (100541) | 2.2 | 10 % | 9/15 | quiz: relation_client; 20 seed depths |
| Etre ouvert aux changements (300479) | 2.2 | 10 % | 13/15 | quiz: adaptabilite; 31 seed depths |
| Construire des relations professionnelles durables avec les clients et les fournisseurs (116224) | 4.6 | 6 % | 3/15 | 7 seed depths |
| Mettre en oeuvre des actions de communication (300110) | 3.5 | 5 % | 2/15 | 13 seed depths |

### Architecte d'intérieur (F1102, Bâtiment, travaux publics)

In the top 40 for **7/15** (47 %): 3 quiz only, 4 seed and answers, 0 seed only. Median rank 19. ROME lists 89 skills for it. Personas: P1 (relation), P5 (relation), P6 (relation), P7 (relation), P9 (vente), quiz relation (relation), quiz vente (vente).

| Carrying skill | idf | Share of its rarity | In inventories | Comes from |
|---|---|---|---|---|
| Identifier, traiter une demande client (300363) | 3.4 | 17 % | 12/15 | quiz: contact; 14 seed depths |
| Accueillir, orienter, renseigner un public (300361) | 2.8 | 14 % | 12/15 | quiz: relation_client, contact; 21 seed depths |
| Promouvoir une proposition, un projet (300418) | 4.0 | 11 % | 5/15 | quiz: persuasion; 13 seed depths |
| Etre ouvert aux changements (300479) | 2.2 | 11 % | 13/15 | quiz: adaptabilite; 31 seed depths |
| Elaborer, adapter une proposition commerciale (300377) | 3.8 | 8 % | 4/15 | quiz: vente; 9 seed depths |
| Coordonner l'intervention d'équipes pluridisciplinaires (300472) | 3.7 | 5 % | 3/15 | 12 seed depths |

### Agent / Agente d'encadrement en industrie du bois (H2204, Industrie)

In the top 40 for **7/15** (47 %): 5 quiz only, 2 seed and answers, 0 seed only. Median rank 23. ROME lists 68 skills for it. Personas: P1 (relation), P3 (terrain), P7 (relation), P10 (organisation), quiz relation (relation), quiz terrain (terrain), quiz organisation (organisation).

| Carrying skill | idf | Share of its rarity | In inventories | Comes from |
|---|---|---|---|---|
| Transformer une matière première (300210) | 4.9 | 17 % | 12/15 | quiz: terrain, manuel; 2 seed depths |
| Préparer du matériel en prévision d'un travail (300152) | 3.4 | 12 % | 12/15 | quiz: terrain; 10 seed depths |
| Prendre une décision et l'expliquer (300459) | 4.1 | 10 % | 6/15 | quiz: decision_incertitude; 9 seed depths |
| Apporter une assistance technique aux équipes (300184) | 3.2 | 8 % | 13/15 | quiz: relation_client, support; 13 seed depths |
| Identifier les anomalies ou les dysfonctionnements d'une production (120790) | 4.5 | 7 % | 8/15 | quiz: diagnostic; 2 seed depths |
| Gérer un planning (300464) | 3.8 | 6 % | 7/15 | quiz: organisation, priorisation, planification; 14 seed depths |

## Honesty

Violations across all 59 personas: none.

