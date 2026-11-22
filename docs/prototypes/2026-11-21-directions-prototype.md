---
status: review
date: 2026-11-22
brief: "Directions: fix before UI" (rerun on the merged tree + f_energy_context fix)
tree: d162bf5 (vocab-reach fix on top of merge 86eca0b)
generated_by: scripts/directions-prototype.ts (body below the line)
---

# Directions layer v7, rerun on the merged tree (2026-11-22)

Same v7 rules as 2026-11-21 (counterfactual révélée, evidence bar ≥ 3, draft names). Code unchanged. The inputs changed twice:

1. **Merge `86eca0b`**: vocab-reach's evidence rule and weak-skill removals, the HR scene, and 7 more seed niches (66 personas, was 59).
2. **Fix `d162bf5`**: `f_energy_context/B` ("Dans l'action…") now feeds the lean and RIASEC only, never competence codes.

The generated body below is on `d162bf5`, with one provenance correction: a context-only side (« Dans l'action ») is no longer quoted as an answer behind a direction, since it puts no skill in the inventory. Its before/after per persona is still v6 versus v7; the table here adds the runs side by side.

## What moved

Directions per report persona (after the evidence bar):

| Persona | v7, old tree | Merge | Merge + fix | + provenance | Directions now |
|---|---|---|---|---|---|
| P1 relation, no seed | 1 | 0 | **0** | **0** | none; 19 roles in Autres pistes, 21 at "faible" |
| P2 analyse, no seed | 2 | 1 | 1 | 1 | Traiter l'information |
| P3 terrain, no seed | 2 | 3 | 3 | 3 | Travailler avec des machines; Travailler la matière; Entretenir et réparer |
| P4 tech + analyse | 5 | 5 | 5 | 5 | unchanged |
| P5 tech + relation | 3 | 2 | 2 | 2 | Construire des logiciels; Développer une activité |
| P6 santé + relation | 5 | 4 | 5 | 5 | Conseiller (R); Soigner; Prendre soin des personnes; Réagir à l'imprévu; Manager une équipe |
| P7 RH + relation | 5 | 5 | 5 | 5 | unchanged |
| P8 cuisine + terrain | 3 | 3 | 3 | **2** | Cuisiner; Protéger l'environnement. « Travailler la matière » (révélée) had 2 answers only because « Dans l'action » counted; with 1 it is under the bar |
| P9 commerce + vente | 5 | 5 | 5 | 5 | unchanged |
| P10 second œuvre + organisation | 2 | 4 | 4 | 4 | Gérer l'administratif (R); Réagir à l'imprévu (R); Construire, bâtir; Travailler la matière |

Fewer than 3 directions: 11 of 66 personas (was 11 of 59; P8 joins with the provenance correction). Every quiz-only persona is among them, and two of them now have none (P1, quiz relation).

- **Why P1 dropped to zero:** the merge took its inventory from 45 to 36 skills. It removed the five relation_client skills that no answer evidences (`663df53`) and the six weak skills (`2321623`). "La relation client" now shares 2 distinctive skills, under the bar of 3.
- **Kept as decided:** the bar stays. Zero or one direction is shown honestly (decision 2026-11-22): a plain sentence, then the closest roles as usual.

## Names

The fix changes no names. The flagged set is the same 23 objectifs and 3 domaines sent for naming on 2026-11-22. Only the counts per label moved; they are in *Naming and sector flags* below.

## Genericity after the fix

- **Wide set (66):** still empty above 40 %.
- **The 15 answered personas:** 18 roles above 40 % (16 on the old tree, 20 on the merge before the fix).

**What the fix did:**
- Compared with the merge, three roles drop below 40 %: E1107 (event project lead, carried by the adaptability codes), C1102 and H2908. One joins: F1101.
- H2204 (wood-industry supervision), which relation personas got through option B's terrain codes, was already gone after the merge.
- The contact codes reach fewer inventories: 300363 goes from 12 of 15 on the old tree to 8.
- C1201's median rank drops from 2 to 5.

**What it did not do:** C1201 still makes the top 40 for 14 of 15 personas. Its carriers are now generic macro-competences that other answers and most seed depths give:

| Code | Skill | Seed depths that inject it |
|---|---|---|
| 300345 | réclamations | 16 |
| 300462 | rendre compte | 19 |
| 300448 | respecter des règles | 24 |
| 300374 | présenter un produit | 18 |
| 300014 | conseiller une personne | 16 |

The 2026-11-21 doc called `f_energy_context/B` the main cause. That overstated it: it was one of three carriers, and the other two remain. Those two are generic codes in most inventories, and roles with long ROME lists that collect them; C1201 lists 50 skills, F1102 89.

**Leak or honest, per role (my reading of the carriers in the tables below):**

| Role | Of 15 | Verdict | Why |
|---|---|---|---|
| Chargé d'accueil clientèle bancaire (C1201) | 14 | Leak | Réclamations, rendre compte, règles, présenter: nothing banking; reaches analyse/terrain personas. |
| Resp. service établissement touristique (G1403) | 9 | Leak | Relation-client basics and conflicts; nothing about running a tourist site. |
| Secrétaire de collectivité territoriale (M1602) | 9 | Borderline | 518355 "Répondre aux demandes d'information" (idf 6.5) is real reception work; reaches analyse personas too. |
| Ingénieur d'affaires en industrie (H1102) | 9 | Leak | Présenter, représenter, besoins client; no engineering. Median rank 37: at the edge of the top 40. |
| Enseignant de la conduite (K2110) | 8 | Leak | Conflict and listening; no teaching or driving. |
| Conseiller en information médicale (D1405) | 8 | Leak | Écoute active 22 %; nothing medical. |
| Chargé d'affaires bancaires (C1203) | 8 | Leak | Règles, décisions, tableaux de bord; nothing banking. |
| Conseiller clientèle à distance (D1408) | 7 | Honest | Its core (485132 phone/chat, 501073 solutions); relation personas only. |
| Guichetier vendeur (C1211) | 7 | Borderline | Relation client and advice fit; nothing counter-specific. |
| Agent d'escale commerciale (N2201) | 7 | Leak | 68 % from three contact codes. |
| Agent administratif banque ou assurance (C1401) | 7 | Leak | Contact codes and réclamations. |
| Conseiller technique agricole (A1304) | 7 | Leak | Listening, analysis, presenting; nothing agricultural. |
| Educateur sportif (G1204) | 7 | Leak | Reception, teaching, communication; no sport. |
| Secrétaire technique (M1605) | 7 | Borderline | 485132 phone/mail is real secretariat work. |
| Architecte d'intérieur (F1102) | 7 | Leak | Contact codes, promoting a project; no design. |
| Architecte du bâtiment (F1101) | 7 | Leak | Same carriers as F1102. |
| Ingénieur de maintenance industrielle (I1102) | 7 | Mixed | Suivi, décision, organiser une équipe: honest for organisation, a leak for analyse. |
| Chef d'équipe en industrie (H2504) | 7 | Mixed | Equipment and processes fit terrain; rendre compte carries it for the others. |

Caveat: the personas are synthetic and answer by cluster overlap. How often this fires for real users is unmeasured.

No genericity fix applied. The two levers left:
- **Weigh down codes present in most inventories.** An engine rule that changes results: your call.
- **Drop generic macro-competences from seed depths** (300448 is in 24 of them).

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
| P1 Relation et transmission, sans seed | Conseiller (R); La relation client (R); Accompagner vers l'emploi (R); Concevoir des offres (R); Chercher, innover (R) | aucune | Conseiller; La relation client; Accompagner vers l'emploi; Concevoir des offres; Chercher, innover | 17 / 23 | ✓ |
| P2 Analyse et systèmes, sans seed | Traiter l'information (R); Concevoir, spécifier (R); Analyser des données (R); Gérer l'administratif (R); Piloter des projets (R) | Traiter l'information (–) | Concevoir, spécifier; Analyser des données; Gérer l'administratif; Piloter des projets | 16 / 12 | ✓ |
| P3 Terrain et technique, sans seed | Travailler avec des machines (R); Travailler la matière (R); Entretenir et réparer (R); Entretenir (R) | Travailler avec des machines (–); Travailler la matière (–); Entretenir et réparer (–) | Entretenir | 1 / 28 | ✓ |
| P4 Seed tech:code + réponses analyse | Construire des logiciels (C); Analyser des données (C); Animer un groupe (C); Prévenir les risques (C); Entretenir et réparer (C) | Construire des logiciels (C); Analyser des données (C); Animer un groupe (C); Prévenir les risques (C); Entretenir et réparer (C) | – | 10 / 0 | ✓ |
| P5 Seed tech:code + réponses relation | Construire des logiciels (C); Concevoir des offres (C); Fidéliser les clients (C); Développer une activité (C) | Construire des logiciels (C); Développer une activité (C) | Concevoir des offres; Fidéliser les clients | 17 / 0 | ✓ |
| P6 Seed santé:soin + réponses relation | Soigner (C); La relation client (R); Conseiller (R); Prendre soin des personnes (C); Gérer l'administratif (C) | Conseiller (R); Soigner (C); Prendre soin des personnes (C); Réagir à l'imprévu (C); Manager une équipe (C) | La relation client; Gérer l'administratif | 16 / 5 | ✓ |
| P7 Seed admin:rh + réponses relation | Gérer les compétences (C); Gérer l'administratif (C); Concevoir des formations (C); Améliorer la qualité de vie au travail (C); Acheter, maîtriser les coûts (C) | Gérer les compétences (C); Gérer l'administratif (C); Concevoir des formations (C); Améliorer la qualité de vie au travail (C); Travailler en équipe (C) | Acheter, maîtriser les coûts | 18 / 2 | ✓ |
| P8 Seed hôtellerie:cuisine + réponses terrain | Cuisiner (C); Travailler la matière (R); Protéger l'environnement (C); Entretenir et réparer (R); Travailler avec des machines (R) | Cuisiner (C); Protéger l'environnement (C) | Travailler la matière; Entretenir et réparer; Travailler avec des machines | 22 / 3 | ✓ |
| P9 Seed commerce:vente + réponses vente | La relation client (C); Vendre (C); Bâtir une offre commerciale (C); Travailler en équipe (C); Travailler la matière (C) | La relation client (C); Vendre (C); Bâtir une offre commerciale (C); Travailler en équipe (C); Travailler la matière (C) | – | 14 / 0 | ✓ |
| P10 Seed btp:second + réponses organisation | Construire, bâtir (C); Gérer l'administratif (R); Convaincre (R); Travailler la matière (C); Réagir à l'imprévu (R) | Gérer l'administratif (R); Réagir à l'imprévu (R); Construire, bâtir (C); Travailler la matière (C) | Convaincre | 11 / 2 | ✓ |

R = révélée par vos réponses, C = dans la continuité de votre parcours, – = no tag (no seed). Before: v6 split (≥ 50 % of shared rarity from answers). After: counterfactual.

## P1: Relation et transmission, sans seed

Seed: aucun; diplôme bac3; inventaire 29 compétences (0 du seed); 618 pistes surfacées.

**Before (v6):** 1. Conseiller (révélée, 4 métiers, preuves 2, 9 réponses); 2. La relation client (révélée, 3 métiers, preuves 2, 5 réponses); 3. Accompagner vers l'emploi (révélée, 3 métiers, preuves 2, 3 réponses); 4. Concevoir des offres (révélée, 2 métiers, preuves 1, 3 réponses); 5. Chercher, innover (révélée, 2 métiers, preuves 1, 2 réponses).

**Removed by the evidence bar:**
- Conseiller: 2 compétences distinctives partagées dans sa capacité (minimum 3). Ses 4 métiers vont dans Autres pistes.
- La relation client: 2 compétences distinctives partagées dans sa capacité (minimum 3). Ses 3 métiers vont dans Autres pistes.
- Accompagner vers l'emploi: 1 compétence distinctive partagée dans sa capacité (minimum 3). Ses 2 métiers vont dans Autres pistes.
- Concevoir des offres: 1 compétence distinctive partagée dans sa capacité (minimum 3). Ses 2 métiers vont dans Autres pistes.
- Chercher, innover: 1 compétence distinctive partagée dans sa capacité (minimum 3). Ses 2 métiers vont dans Autres pistes.

**After (v7):** 0 direction.

**0 direction only** (fewer than 3).

### Autres pistes (17 affichées; 23 au signal faible, derrière un lien)

| Métier | Secteur | Signal |
|---|---|---|
| Conseiller / Conseillère clientèle à distance | Commerce et vente | moyen |
| Chargé / Chargée d'accueil et de services clientèle bancaire | Banque, assurance, immobilier | moyen |
| Formateur / Formatrice aux métiers de l'éducation et de la sécurité routière | Enseignement, formation | moyen |
| Conseiller / Conseillère en économie sociale et familiale (CESF) | Social, accompagnement | moyen |
| Animateur socioéducatif / Animatrice socioéducative | Social, accompagnement | moyen |
| Responsable de service en établissement touristique | Restauration, hôtellerie, loisirs | moyen |
| Guichetier vendeur / Guichetière vendeuse | Banque, assurance, immobilier | moyen |
| Enseignant / Enseignante de la conduite et de la sécurité routière | Enseignement, formation | moyen |
| Conseiller commercial / Conseillère commerciale et relation client en assurances | Banque, assurance, immobilier | moyen |
| Agent / Agente d'accueil social | Social, accompagnement | moyen |
| Conseiller principal / Conseillère principale d'éducation | Enseignement, formation | moyen |
| Assistant social / Assistante sociale | Social, accompagnement | moyen |
| Télésecrétaire | Secrétariat, assistance | moyen |
| Conseiller vendeur / Conseillère vendeuse de véhicules poids lourds | Commerce et vente | moyen |
| Conseiller / Conseillère technique agricole | Agriculture, nature, animaux | moyen |
| Chargé / Chargée de clientèle centre d'appels en assurances | Banque, assurance, immobilier | moyen |
| Chargé / Chargée de relation client | Commerce et vente | moyen |

## P2: Analyse et systèmes, sans seed

Seed: aucun; diplôme bac5; inventaire 47 compétences (0 du seed); 1088 pistes surfacées.

**Before (v6):** 1. Traiter l'information (révélée, 10 métiers, preuves 4, 7 réponses); 2. Concevoir, spécifier (révélée, 3 métiers, preuves 1, 7 réponses); 3. Analyser des données (révélée, 3 métiers, preuves 2, 10 réponses); 4. Gérer l'administratif (révélée, 3 métiers, preuves 1, 5 réponses); 5. Piloter des projets (révélée, 4 métiers, preuves 1, 5 réponses).

**Removed by the evidence bar:**
- Concevoir, spécifier: 1 compétence distinctive partagée dans sa capacité (minimum 3). Ses 3 métiers vont dans Autres pistes.
- Analyser des données: 2 compétences distinctives partagées dans sa capacité (minimum 3). Ses 3 métiers vont dans Autres pistes.
- Gérer l'administratif: 1 compétence distinctive partagée dans sa capacité (minimum 3). Ses 3 métiers vont dans Autres pistes.
- Piloter des projets: 1 compétence distinctive partagée dans sa capacité (minimum 3). Ses 3 métiers vont dans Autres pistes.

**After (v7):** 1 direction.

### 1. Traiter l'information

Pas d'étiquette (pas de parcours renseigné). Preuves : 4 compétences distinctives partagées dans « Traiter des informations »; 7 réponses différentes. 3 métiers rattachés par leur 2e capacité.

Vos réponses derrière cette direction :
- « Je cherche d'abord les bases, les mots et les règles. » (f_new_domain, 2 compétences partagées)
- « Je préfère écrire clairement : structurer, résumer, clarifier. » (sf_write_explain, 1 compétence partagée)
- « Je cherche ce que les données montrent. » (sf_data_files, 1 compétence partagée)
- « Je vais droit au sujet avec des faits. » (g_status_authority, 1 compétence partagée)

| Métier | Secteur | Signal | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|
| Ingénieur / Ingénieure de recherche scientifique | Recherche | moyen | Ingénieur / Ingénieure de recherche scientifique ; Ingénieur / Ingénieure d'études en recherche scientifique ; Ingénieur / Ingénieure de recherche biomédicale | +39 |
| Assistant / Assistante de direction | Secrétariat, assistance | moyen | Assistant / Assistante de direction ; Assistant / Assistante de direction bilingue ; Assistant / Assistante de direction trilingue | +5 |
| Documentaliste | Culture, documentation | moyen | Documentaliste ; Aide documentaliste ; Cyber documentaliste | +20 |
| Secrétaire technique | Secrétariat, assistance | moyen | Secrétaire technique ; Secrétaire technique bureau d'études ; Secrétaire technique de la construction | +4 |
| Technicien / Technicienne R&D | Industrie | moyen | Technicien / Technicienne R&D ; Technicien / Technicienne en développement ; Technicien / Technicienne ERD en acoustique | +34 |
| Chargé / Chargée d'accueil et de services clientèle bancaire | Banque, assurance, immobilier | moyen | Chargé / Chargée d'accueil et de services clientèle bancaire ; Assistant / Assistante service clientèle bancaire ; Conseiller / Conseillère accueil en agence bancaire | +2 |
| Psychologue | Social, accompagnement | moyen | Psychologue ; Psychologue-psychothérapeute ; Psychologue chercheur / Psychologue chercheuse | +4 |
| Secrétaire administratif / Secrétaire administrative de collectivité territoriale | Secrétariat, assistance | moyen | Secrétaire administratif(ve) de collectivité territoriale ; Agent administratif / Agente administrative de l'Etat ; Adjoint administratif / Adjointe administrative (guichet) | +5 |
| Ingénieur / Ingénieure supply chain en industrie | Industrie | moyen | Ingénieur / Ingénieure supply chain en industrie ; Ingénieur / Ingénieure supply chain ; Supply chain manager en industrie | +1 |
| Ingénieur / Ingénieure méthodes et process | Industrie | moyen | Ingénieur / Ingénieure méthodes et process ; Ingénieur / Ingénieure méthodes en industrie ; Ingénieur / Ingénieure gestion méthodes en industrie | +21 |
| Secrétaire comptable | Secrétariat, assistance | moyen | Secrétaire comptable | – |
| Ingénieur / Ingénieure d'affaires en industrie | Industrie | moyen | Ingénieur / Ingénieure d'affaires en industrie ; Ingénieur / Ingénieure de suivi d'affaires en industrie ; Ingénieur / Ingénieure de projet d'affaires en industrie | +11 |

**1 direction only** (fewer than 3).

### Autres pistes (16 affichées; 12 au signal faible, derrière un lien)

| Métier | Secteur | Signal |
|---|---|---|
| Technicien / Technicienne d'exploitation en production d'énergie thermique | Industrie | moyen |
| Technicien / Technicienne méthodes | Industrie | moyen |
| Responsable méthodes-industrialisation | Industrie | moyen |
| Agent / Agente de diagnostic et de contrôle en agriculture | Agriculture, nature, animaux | moyen |
| Responsable ordonnancement-lancement-planification en industrie | Industrie | moyen |
| Ingénieur / Ingénieure de maintenance industrielle | Maintenance | moyen |
| Chargé / Chargée d'affaires bancaires | Banque, assurance, immobilier | moyen |
| Auditeur comptable et financier / Auditrice comptable et financière | Comptabilité, finance | moyen |
| Chef / Cheffe d'équipe en industrie | Industrie | moyen |
| Ingénieur de maintenance / Ingénieure de maintenance | Maintenance | moyen |
| Contrôleur / Contrôleuse prestations de la sécurité sociale | Banque, assurance, immobilier | moyen |
| Conseiller / Conseillère technique agricole | Agriculture, nature, animaux | moyen |
| Installateur / Installatrice chauffage et climatisation | Bâtiment, travaux publics | moyen |
| Bioinformaticien / Bioinformaticienne en études, recherche et développement | Industrie | moyen |
| Analyste de crédits et risques bancaires | Banque, assurance, immobilier | moyen |
| Chargé / Chargée de clientèle centre d'appels en assurances | Banque, assurance, immobilier | moyen |

## P3: Terrain et technique, sans seed

Seed: aucun; diplôme cap; inventaire 30 compétences (0 du seed); 1077 pistes surfacées.

**Before (v6):** 1. Travailler avec des machines (révélée, 4 métiers, preuves 3, 2 réponses); 2. Travailler la matière (révélée, 3 métiers, preuves 3, 1 réponses); 3. Entretenir et réparer (révélée, 3 métiers, preuves 3, 1 réponses); 4. Entretenir (révélée, 2 métiers, preuves 2, 1 réponses).

**Removed by the evidence bar:**
- Entretenir: 2 compétences distinctives partagées dans sa capacité (minimum 3). Ses 2 métiers vont dans Autres pistes.

**After (v7):** 3 directions.

### 1. Travailler avec des machines

Pas d'étiquette (pas de parcours renseigné). Preuves : 3 compétences distinctives partagées dans « Utiliser des machines, outils »; 2 réponses différentes.

Vos réponses derrière cette direction :
- « Faire avec mes mains et livrer un résultat concret. » (sf_hands_organise, 2 compétences partagées)
- « Réparer, faire fonctionner ou résoudre un problème technique. » (sf_sell_fix, 1 compétence partagée)

| Métier | Secteur | Signal | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|
| Assembleur / Assembleuse d'ouvrages en bois | Industrie | moyen | Assembleur / Assembleuse d'ouvrages en bois ; Assembleur(se) d'ouvrages en bois et matériaux associés ; Assembleur / Assembleuse de placages | +16 |
| Etancheur / Etancheuse | Bâtiment, travaux publics | moyen | Etancheur / Etancheuse ; Etancheur-bardeur / Etancheuse-bardeuse ; Etancheur-couvreur / Etancheuse-couvreuse | +7 |
| Agent / Agente de stérilisation de service hospitalier | Santé | moyen | Agent / Agente de stérilisation de service hospitalier ; Agent / Agente de stérilisation | – |
| Conducteur / Conductrice de ligne de production en industrie du bois | Industrie | moyen | Conducteur(trice) de ligne de production industrie du bois ; Conducteur(trice) de mortaiseuses en industrie du bois ; Conducteur(trice) de séchoirs en seconde industrie du bois | +33 |

### 2. Travailler la matière

Pas d'étiquette (pas de parcours renseigné). Preuves : 3 compétences distinctives partagées dans « Manipuler des produits, matières premières »; 1 réponse différente.

Vos réponses derrière cette direction :
- « Faire avec mes mains et livrer un résultat concret. » (sf_hands_organise, 3 compétences partagées)

| Métier | Secteur | Signal | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|
| Cisailleur / Cisailleuse en métallurgie | Industrie | moyen | Cisailleur / Cisailleuse en métallurgie ; Cisailleur / Cisailleuse de forge ; Cisailleur / Cisailleuse de laminoir | +47 |
| Opérateur / Opératrice sur machines automatisées en production électrique | Industrie | moyen | Opérateur(trice) machines automatisées en prod électrique ; Opérateur(trice) machines automatisées en prod électronique ; Conducteur(trice) machines automat en prod microélectronique | +22 |
| Agent / Agente d'encadrement en industrie du bois | Industrie | moyen | Agent / Agente d'encadrement en industrie du bois ; Agent / Agente de maîtrise en industrie du bois ; Agent / Agente de maîtrise en menuiserie | +15 |

### 3. Entretenir et réparer

Pas d'étiquette (pas de parcours renseigné). Preuves : 3 compétences distinctives partagées dans « Assurer la maintenance technique »; 1 réponse différente. 2 métiers rattachés par leur 2e capacité.

Vos réponses derrière cette direction :
- « Réparer, faire fonctionner ou résoudre un problème technique. » (sf_sell_fix, 3 compétences partagées)

| Métier | Secteur | Signal | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|
| Electricien / Electricienne de maintenance | Maintenance | moyen | Electricien / Electricienne de maintenance ; Aide électricien / Aide électricienne de maintenance ; Electricien / Electricienne d'atelier de maintenance | +32 |
| Ingénieur / Ingénieure de maintenance industrielle | Maintenance | moyen | Ingénieur / Ingénieure de maintenance industrielle ; Ingénieur / Ingénieure Maintenance Nucléaire ; Ingénieur(e) maintenance-fiabilisation industrielle | +19 |
| Mécanicien / Mécanicienne de maintenance industrielle | Maintenance | moyen | Mécanicien / Mécanicienne de maintenance industrielle ; Mécanicien / Mécanicienne de maintenance armement ; Mécanicien / Mécanicienne de maintenance en robinetterie | +16 |
| Chef / Cheffe d'équipe en industrie | Industrie | moyen | Chef / Cheffe d'équipe en industrie ; Chef / Cheffe d'équipe de l'industrie du béton ; Chef / Cheffe d'équipe en ameublement | +22 |

### Autres pistes (1 affichées; 28 au signal faible, derrière un lien)

| Métier | Secteur | Signal |
|---|---|---|
| Monteur / Monteuse de réseaux électriques | Bâtiment, travaux publics | moyen |

## P4: Seed tech:code + réponses analyse

Seed: tech:code; diplôme bac5; inventaire 1092 compétences (1058 du seed); 1122 pistes surfacées.

**Before (v6):** 1. Construire des logiciels (continuité, 17 métiers, preuves 56, 0 réponses); 2. Analyser des données (continuité, 5 métiers, preuves 15, 10 réponses); 3. Animer un groupe (continuité, 2 métiers, preuves 3, 1 réponses); 4. Prévenir les risques (continuité, 4 métiers, preuves 12, 0 réponses); 5. Entretenir et réparer (continuité, 2 métiers, preuves 4, 7 réponses).

**After (v7):** 5 directions.

### 1. Construire des logiciels

**Dans la continuité de votre parcours**: 0 des 17 métiers sont apportés par vos réponses. Preuves : 56 compétences distinctives partagées dans « Concevoir, développer, administrer un logiciel ou un SI »; 0 réponse différente. 1 métier rattaché par leur 2e capacité.

Aucune réponse du quiz derrière cette direction : elle vient de votre parcours.

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Administrateur / Administratrice de systèmes d'information (SI) | Informatique, télécoms | moyen | +23 | Administrateur(trice) de systèmes d'information (SI) ; Administrateur / Administratrice systèmes et réseaux ; Administrateur / Administratrice de système d'information | +8 |
| Analyste Concepteur / Conceptrice informatique | Informatique, télécoms | moyen | +1 | Analyste Concepteur / Conceptrice informatique | – |
| Chef / Cheffe de projet étude et développement informatique | Informatique, télécoms | moyen | −1 | Chef / Cheffe de projet étude et développement informatique ; Chef / Cheffe de projet informatique ; Chef / Cheffe de projet développement logiciel | +2 |
| Consultant fonctionnel / Consultante fonctionnelle des systèmes d'information | Informatique, télécoms | moyen | +10 | Consultant(e) fonctionnel(le) des systèmes d'information ; Assistant(e) fonctionnel(le) des systèmes d'information ; Consultant(e) fonctionnel(le) de progiciel | +11 |
| Expert / Experte systèmes et réseaux informatiques | Informatique, télécoms | moyen | +1 | Expert / Experte systèmes et réseaux informatiques ; Expert / Experte système et réseaux ; Expert / Experte réseaux et télécoms | +16 |
| Développeur / Développeuse informatique | Informatique, télécoms | moyen | +1 | Développeur / Développeuse informatique ; Développeur / Développeuse IOT ; Analyste développeur / Analyste développeuse | +12 |
| Analyste d'application informatique | Informatique, télécoms | moyen | +15 | Analyste d'application informatique ; Analyste responsable d'application informatique ; Analyste d'application | – |
| Développeur / Développeuse décisionnel - Business Intelligence | Informatique, télécoms | moyen | = | Développeur(se) décisionnel - Business Intelligence | – |
| Ingénieur informaticien / Ingénieure informaticienne | Informatique, télécoms | moyen | −9 | Ingénieur informaticien / Ingénieure informaticienne ; Ingénieur / Ingénieure informatique ; Ingénieur / Ingénieure analyste informatique | +5 |
| Ingénieur / Ingénieure systèmes et réseaux des territoires connectés | Informatique, télécoms | fort | −21 | Ingénieur(e) systèmes et réseaux des territoires connectés | – |
| Ingénieur / Ingénieure télécoms et environnement | Informatique, télécoms | moyen | +8 | Ingénieur(e) télécoms et environnement ; Ingénieur / Ingénieure télécoms ; Ingénieur / Ingénieure réseaux télécoms | +7 |
| Qualiticien / Qualiticienne logiciel en informatique | Informatique, télécoms | moyen | +3 | Qualiticien / Qualiticienne logiciel en informatique ; Responsable d'atelier de génie logiciel ; Didacticien / Didacticienne informatique | +1 |
| Ingénieur / Ingénieure d'étude informatique | Informatique, télécoms | moyen | +6 | Ingénieur / Ingénieure d'étude informatique ; Ingénieur / Ingénieure d'étude logiciel informatique ; Ingénieur / Ingénieure d'étude en informatique de gestion | +10 |
| Ingénieur concepteur / Ingénieure conceptrice informatique | Informatique, télécoms | moyen | −11 | Ingénieur concepteur / Ingénieure conceptrice informatique ; Concepteur / Conceptrice informatique ; Ingénieur / Ingénieure de conception informatique | +4 |
| Administrateur / Administratrice de serveurs | Informatique, télécoms | moyen | −29 | Administrateur / Administratrice de serveurs | – |
| Intégrateur / Intégratrice logiciels métiers | Informatique, télécoms | moyen | entrée (rang 63 sans réponses) | Intégrateur / Intégratrice logiciels métiers ; Intégrateur / Intégratrice d'application informatique ; Paramétreur / Paramétreuse de logiciels | +9 |
| Expert / Experte méthodes et qualité informatique | Informatique, télécoms | moyen | +11 | Expert / Experte méthodes et qualité informatique ; Expert / Experte qualité informatique ; Expert / Experte méthodes et outils en informatique | +1 |

### 2. Analyser des données

**Dans la continuité de votre parcours**: 1 des 5 métiers sont apportés par vos réponses. Preuves : 15 compétences distinctives partagées dans « Analyser et structurer des données, informations »; 10 réponses différentes.

Vos réponses derrière cette direction :
- « J'ai besoin de comprendre ce qui se passe vraiment. » (f_surface_depth, 3 compétences partagées)
- « Vérifier, calculer, classer, appliquer des règles précises. » (sf_numbers_people, 3 compétences partagées)
- « Je cherche pourquoi il revient. » (f_repeat_problem, 2 compétences partagées)
- « Au calme, avec du temps pour me concentrer. » (f_energy_context, 2 compétences partagées)

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Technicien / Technicienne d'exploitation en production d'énergie thermique | Industrie | moyen | entrée (rang 719 sans réponses) ✔ | Technicien(ne) d'exploitation production d'énergie thermique ; Opérateur(trice) d'exploitation en production d'énergie ; Technicien / Technicienne énergie | +8 |
| Technicien / Technicienne méthodes | Industrie | moyen | entrée (rang 53 sans réponses) | Technicien / Technicienne méthodes ; Technicien / Technicienne méthodes process ; Technicien / Technicienne productique méthodes | +27 |
| Cartographe | Informatique, télécoms | moyen | −1 | Cartographe ; Cartographe du BTP ; Officier / Officière cartographe | +7 |
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

### 4. Prévenir les risques

**Dans la continuité de votre parcours**: 0 des 4 métiers sont apportés par vos réponses. Preuves : 12 compétences distinctives partagées dans « Analyser, prévenir les risques »; 0 réponse différente. 2 métiers rattachés par leur 2e capacité.

Aucune réponse du quiz derrière cette direction : elle vient de votre parcours.

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Expert / Experte en cybersécurité | Informatique, télécoms | moyen | −2 | Expert / Experte en cybersécurité ; Expert / Experte sécurité IT ; Expert / Experte sécurité informatique | +7 |
| Ingénieur / Ingénieure de recherche scientifique | Recherche | moyen | entrée (rang 216 sans réponses) | Ingénieur / Ingénieure de recherche scientifique ; Ingénieur / Ingénieure d'études en recherche scientifique ; Ingénieur / Ingénieure de recherche biomédicale | +39 |
| Chargé / Chargée d'affaires bancaires | Banque, assurance, immobilier | moyen | entrée (rang 170 sans réponses) | Chargé / Chargée d'affaires bancaires | +2 |
| Actuaire en assurances | Banque, assurance, immobilier | moyen | entrée (rang 68 sans réponses) | Actuaire en assurances ; Actuaire ; Gestionnaire actif-passif en assurances | +2 |

### 5. Entretenir et réparer

*Aussi : Chercher, innover*

**Dans la continuité de votre parcours**: 0 des 2 métiers sont apportés par vos réponses. Preuves : 4 compétences distinctives partagées dans « Assurer la maintenance technique »; 7 réponses différentes.

Vos réponses derrière cette direction :
- « J'ai besoin de comprendre ce qui se passe vraiment. » (f_surface_depth, 1 compétence partagée)
- « Je cherche pourquoi il revient. » (f_repeat_problem, 1 compétence partagée)
- « Au calme, avec du temps pour me concentrer. » (f_energy_context, 1 compétence partagée)
- « Je cherche ce que les données montrent. » (sf_data_files, 1 compétence partagée)

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Agent / Agente de diagnostic et de contrôle en agriculture | Agriculture, nature, animaux | moyen | entrée (rang 306 sans réponses) | Agent / Agente de diagnostic et de contrôle en agriculture ; Agent / Agente sanitaire de l'agriculture ; Agent / Agente sanitaire apicole | +15 |
| Installateur / Installatrice chauffage et climatisation | Bâtiment, travaux publics | moyen | entrée (rang 72 sans réponses) | Installateur / Installatrice chauffage et climatisation ; Installateur / Installatrice de chauffage bois ; Installateur / Installatrice de chauffage solaire individuel | +14 |

### Autres pistes (10 affichées; 0 au signal faible, derrière un lien)

| Métier | Secteur | Signal |
|---|---|---|
| Chef de projet / Cheffe de projet (Project Management Officer) | Informatique, télécoms | moyen |
| Responsable ordonnancement-lancement-planification en industrie | Industrie | moyen |
| Géomètre | Bâtiment, travaux publics | moyen |
| Météorologue | Informatique, télécoms | moyen |
| Analyste décisionnel - Business Intelligence | Informatique, télécoms | moyen |
| Responsable méthodes-industrialisation | Industrie | moyen |
| Approvisionneur / Approvisionneuse logistique | Transport, logistique | moyen |
| Ingénieur / Ingénieure d'affaires en industrie | Industrie | moyen |
| Electricien / Electricienne du bâtiment | Bâtiment, travaux publics | moyen |
| Analyste financier / Analyste financière | Comptabilité, finance | moyen |

## P5: Seed tech:code + réponses relation

Seed: tech:code; diplôme bac5; inventaire 1081 compétences (1058 du seed); 1107 pistes surfacées.

**Before (v6):** 1. Construire des logiciels (continuité, 20 métiers, preuves 56, 0 réponses); 2. Concevoir des offres (continuité, 3 métiers, preuves 2, 3 réponses); 3. Fidéliser les clients (continuité, 2 métiers, preuves 2, 4 réponses); 4. Développer une activité (continuité, 3 métiers, preuves 4, 0 réponses).

**Removed by the evidence bar:**
- Concevoir des offres: 1 compétence distinctive partagée dans sa capacité (minimum 3). Ses 2 métiers vont dans Autres pistes.
- Fidéliser les clients: 2 compétences distinctives partagées dans sa capacité (minimum 3). Ses 2 métiers vont dans Autres pistes.

**After (v7):** 2 directions.

### 1. Construire des logiciels

**Dans la continuité de votre parcours**: 0 des 20 métiers sont apportés par vos réponses. Preuves : 56 compétences distinctives partagées dans « Concevoir, développer, administrer un logiciel ou un SI »; 0 réponse différente. 1 métier rattaché par leur 2e capacité.

Aucune réponse du quiz derrière cette direction : elle vient de votre parcours.

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Chef / Cheffe de projet étude et développement informatique | Informatique, télécoms | moyen | +3 | Chef / Cheffe de projet étude et développement informatique ; Chef / Cheffe de projet informatique ; Chef / Cheffe de projet développement logiciel | +2 |
| Analyste Concepteur / Conceptrice informatique | Informatique, télécoms | moyen | +3 | Analyste Concepteur / Conceptrice informatique | – |
| Chef / Cheffe de projet maîtrise d'œuvre informatique | Informatique, télécoms | moyen | +28 | Chef / Cheffe de projet maîtrise d'œuvre informatique | – |
| Expert / Experte systèmes et réseaux informatiques | Informatique, télécoms | moyen | +3 | Expert / Experte systèmes et réseaux informatiques ; Expert / Experte système et réseaux ; Expert / Experte réseaux et télécoms | +16 |
| Ingénieur concepteur / Ingénieure conceptrice informatique | Informatique, télécoms | moyen | +14 | Ingénieur concepteur / Ingénieure conceptrice informatique ; Concepteur / Conceptrice informatique ; Ingénieur / Ingénieure de conception informatique | +4 |
| Ingénieur / Ingénieure télécoms et environnement | Informatique, télécoms | moyen | +27 | Ingénieur(e) télécoms et environnement ; Ingénieur / Ingénieure télécoms ; Ingénieur / Ingénieure réseaux télécoms | +7 |
| Analyste d'application informatique | Informatique, télécoms | moyen | +13 | Analyste d'application informatique ; Analyste responsable d'application informatique ; Analyste d'application | – |
| UX - UI Designer | Communication, médias | moyen | +20 | UX - UI Designer ; Software Designer ; UI - user interface designer | +9 |
| Développeur / Développeuse informatique | Informatique, télécoms | moyen | −6 | Développeur / Développeuse informatique ; Développeur / Développeuse IOT ; Analyste développeur / Analyste développeuse | +12 |
| Ingénieur informaticien / Ingénieure informaticienne | Informatique, télécoms | moyen | −9 | Ingénieur informaticien / Ingénieure informaticienne ; Ingénieur / Ingénieure informatique ; Ingénieur / Ingénieure analyste informatique | +5 |
| Développeur / Développeuse décisionnel - Business Intelligence | Informatique, télécoms | moyen | −3 | Développeur(se) décisionnel - Business Intelligence | – |
| Consultant fonctionnel / Consultante fonctionnelle des systèmes d'information | Informatique, télécoms | moyen | −7 | Consultant(e) fonctionnel(le) des systèmes d'information ; Assistant(e) fonctionnel(le) des systèmes d'information ; Consultant(e) fonctionnel(le) de progiciel | +11 |
| Ingénieur / Ingénieure DevOps | Informatique, télécoms | moyen | +4 | Ingénieur / Ingénieure DevOps ; Ingénieur / Ingénieure développement logiciel ; Ingénieur / Ingénieure programme informatique | +6 |
| Architecte IoT - Internet des Objets | Informatique, télécoms | moyen | −6 | Architecte IoT - Internet des Objets | – |
| Ingénieur / Ingénieure systèmes et réseaux des territoires connectés | Informatique, télécoms | fort | −27 | Ingénieur(e) systèmes et réseaux des territoires connectés | – |
| Chef / Cheffe de projet réseau fixe et mobile | Informatique, télécoms | moyen | entrée (rang 69 sans réponses) | Chef / Cheffe de projet réseau fixe et mobile ; Chef / Cheffe de projet Réseau ; Chef / Cheffe de projet Datacenter | +3 |
| Analyste d'étude informatique | Informatique, télécoms | moyen | −12 | Analyste d'étude informatique ; Analyste-programmeur(se) d'étude informatique ; Analyste réseau informatique | +6 |
| Administrateur / Administratrice de systèmes d'information (SI) | Informatique, télécoms | moyen | −12 | Administrateur(trice) de systèmes d'information (SI) ; Administrateur / Administratrice systèmes et réseaux ; Administrateur / Administratrice de système d'information | +8 |
| Qualiticien / Qualiticienne logiciel en informatique | Informatique, télécoms | moyen | −9 | Qualiticien / Qualiticienne logiciel en informatique ; Responsable d'atelier de génie logiciel ; Didacticien / Didacticienne informatique | +1 |
| Expert / Experte méthodes et qualité informatique | Informatique, télécoms | moyen | −3 | Expert / Experte méthodes et qualité informatique ; Expert / Experte qualité informatique ; Expert / Experte méthodes et outils en informatique | +1 |

### 2. Développer une activité

**Dans la continuité de votre parcours**: 0 des 3 métiers sont apportés par vos réponses. Preuves : 4 compétences distinctives partagées dans « Conduire une stratégie de développement »; 0 réponse différente. 1 métier rattaché par leur 2e capacité.

Aucune réponse du quiz derrière cette direction : elle vient de votre parcours.

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Responsable en organisation en entreprise | Conseil, organisation | moyen | entrée (rang 387 sans réponses) | Responsable en organisation en entreprise ; Responsable en organisation ; Responsable des projets organisation | +13 |
| Conseiller / Conseillère technique agricole | Agriculture, nature, animaux | moyen | entrée (rang 79 sans réponses) | Conseiller / Conseillère technique agricole ; Conseiller / Conseillère agricole ; Conseiller / Conseillère de gestion agricole | +10 |
| Expert / Experte en communication et réseaux | Informatique, télécoms | moyen | −4 | Expert / Experte en communication et réseaux ; Expert(e) technologie information et communication (TIC) | – |

**2 directions only** (fewer than 3).

### Autres pistes (17 affichées; 0 au signal faible, derrière un lien)

| Métier | Secteur | Signal |
|---|---|---|
| Chargé / Chargée d'accueil et de services clientèle bancaire | Banque, assurance, immobilier | moyen |
| Responsable de service en établissement touristique | Restauration, hôtellerie, loisirs | moyen |
| Conseiller / Conseillère en économie sociale et familiale (CESF) | Social, accompagnement | moyen |
| Formateur / Formatrice aux métiers de l'éducation et de la sécurité routière | Enseignement, formation | moyen |
| Agent administratif / Agente administrative banque ou assurance | Banque, assurance, immobilier | moyen |
| Agent / Agente d'Escale Commerciale aéroportuaire (AEC) | Transport, logistique | moyen |
| Animateur socioéducatif / Animatrice socioéducative | Social, accompagnement | moyen |
| Chef de projet / Cheffe de projet (Project Management Officer) | Informatique, télécoms | moyen |
| Architecte d'intérieur | Bâtiment, travaux publics | moyen |
| Conseiller / Conseillère clientèle à distance | Commerce et vente | moyen |
| Architecte du bâtiment | Bâtiment, travaux publics | moyen |
| Enseignant / Enseignante de la conduite et de la sécurité routière | Enseignement, formation | moyen |
| Guichetier vendeur / Guichetière vendeuse | Banque, assurance, immobilier | moyen |
| Chef / Cheffe de projet événementiel | Communication, médias | moyen |
| Educateur sportif / Educatrice sportive | Restauration, hôtellerie, loisirs | moyen |
| Conseiller / Conseillère en information médicale | Commerce et vente | moyen |
| Ingénieur / Ingénieure d'affaires en industrie | Industrie | moyen |

## P6: Seed santé:soin + réponses relation

Seed: sante:soin; diplôme bac3; inventaire 375 compétences (355 du seed); 1012 pistes surfacées.

**Before (v6):** 1. Soigner (continuité, 6 métiers, preuves 24, 0 réponses); 2. La relation client (révélée, 5 métiers, preuves 2, 5 réponses); 3. Conseiller (révélée, 4 métiers, preuves 3, 9 réponses); 4. Prendre soin des personnes (continuité, 5 métiers, preuves 17, 0 réponses); 5. Gérer l'administratif (continuité, 3 métiers, preuves 2, 0 réponses).

**Removed by the evidence bar:**
- La relation client: 2 compétences distinctives partagées dans sa capacité (minimum 3). Ses 5 métiers vont dans Autres pistes.
- Gérer l'administratif: 2 compétences distinctives partagées dans sa capacité (minimum 3). Ses 2 métiers vont dans Autres pistes.

**After (v7):** 5 directions.

### 1. Conseiller

*Aussi : La relation client*

**Révélée par vos réponses**: 3 des 4 métiers sont apportés par vos réponses. Preuves : 3 compétences distinctives partagées dans « Conseiller »; 9 réponses différentes.

Vos réponses derrière cette direction :
- « Je préfère expliquer à l'oral, montrer et répondre aux questions. » (sf_write_explain, 3 compétences partagées)
- « Échanger avec des personnes, comprendre leurs demandes, gérer la relation. » (sf_numbers_people, 2 compétences partagées)
- « J'appelle, je clarifie, je gère la tension. » (g_conflict, 2 compétences partagées)
- « Ça me stimule si les échanges ont un objectif clair. » (g_group_energy, 2 compétences partagées)

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Chargé / Chargée d'accueil et de services clientèle bancaire | Banque, assurance, immobilier | moyen | entrée (rang 96 sans réponses) ✔ | Chargé / Chargée d'accueil et de services clientèle bancaire ; Assistant / Assistante service clientèle bancaire ; Conseiller / Conseillère accueil en agence bancaire | +2 |
| Animateur socioéducatif / Animatrice socioéducative | Social, accompagnement | moyen | entrée (rang 266 sans réponses) | Animateur socioéducatif / Animatrice socioéducative ; Animateur / Animatrice de quartier ; Animateur / Animatrice de foyer rural | +4 |
| Guichetier vendeur / Guichetière vendeuse | Banque, assurance, immobilier | moyen | entrée (rang 279 sans réponses) ✔ | Guichetier vendeur / Guichetière vendeuse ; Guichetier / Guichetière de banque ; Guichetier / Guichetière de la Poste | +4 |
| Agent / Agente d'accueil social | Social, accompagnement | moyen | entrée (rang 642 sans réponses) ✔ | Agent / Agente d'accueil social ; Agent / Agente d'accueil et d'information sociale | +4 |

### 2. Soigner

*Aussi : Prendre soin des personnes*

**Dans la continuité de votre parcours**: 0 des 5 métiers sont apportés par vos réponses. Preuves : 23 compétences distinctives partagées dans « Soigner des personnes »; 0 réponse différente.

Aucune réponse du quiz derrière cette direction : elle vient de votre parcours.

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Cadre de santé d'unité de soins ou de service paramédical | Santé | fort | = | Cadre de santé d'unité de soins ou de service paramédical ; Cadre de santé d'unité de soins ; Cadre de santé de service paramédical | +4 |
| Infirmier / Infirmière en Pratique Avancée (IPA) | Santé | fort | −4 | Infirmier / Infirmière en Pratique Avancée (IPA) | – |
| Infirmier / Infirmière de bloc opératoire (IBODE) | Santé | moyen | −9 | Infirmier / Infirmière de bloc opératoire (IBODE) ; Infirmier / Infirmière chef de bloc opératoire ; Infirmier / Infirmière de bloc opératoire circulant | +6 |
| Infirmier / Infirmière en soins généraux (IDE) | Santé | moyen | −16 | Infirmier / Infirmière de soins généraux ; Infirmier / Infirmière militaire ; Infirmier / Infirmière hygiéniste | +8 |
| Infirmier / Infirmière anesthésiste (IADE) | Santé | moyen | −16 | Infirmier / Infirmière anesthésiste ; Infirmier(ère) Anesthésiste Diplômé(e) d'Etat (IADE) | – |

### 3. Prendre soin des personnes

**Dans la continuité de votre parcours**: 0 des 5 métiers sont apportés par vos réponses. Preuves : 17 compétences distinctives partagées dans « Prendre soin des personnes »; 0 réponse différente. 2 métiers rattachés par leur 2e capacité.

Aucune réponse du quiz derrière cette direction : elle vient de votre parcours.

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Infirmier / Infirmière de prévention | Santé | moyen | +9 | Infirmier / Infirmière de prévention ; Infirmier / Infirmière de santé préventive | – |
| Médecin du travail et de prévention | Santé | moyen | +2 | Médecin du travail et de prévention ; Médecin du travail ; Médecin de prévention | +2 |
| Puériculteur / Puéricultrice | Santé | moyen | −30 | Puériculteur / Puéricultrice ; Infirmier puériculteur / Infirmière puéricultrice ; Puériculteur hospitalier / Puéricultrice hospitalière | +5 |
| Conseiller / Conseillère en économie sociale et familiale (CESF) | Social, accompagnement | moyen | entrée (rang 247 sans réponses) | Conseiller / Conseillère en économie sociale et familiale ; Conseiller social / Conseillère sociale | – |
| Infirmier / Infirmière scolaire | Santé | moyen | −14 | Infirmier / Infirmière scolaire ; Infirmier(ère) spécialisé(e) en santé scolaire | – |

### 4. Réagir à l'imprévu

*Aussi : Appliquer des procédés*

**Dans la continuité de votre parcours**: 1 des 2 métiers sont apportés par vos réponses. Preuves : 3 compétences distinctives partagées dans « Agir face à l'imprévu »; 1 réponse différente.

Vos réponses derrière cette direction :
- « J'appelle, je clarifie, je gère la tension. » (g_conflict, 1 compétence partagée)

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Enseignant / Enseignante de la conduite et de la sécurité routière | Enseignement, formation | moyen | entrée (rang 800 sans réponses) ✔ | Enseignant(e) de la conduite et de la sécurité routière | +6 |
| Agent administratif / Agente administrative banque ou assurance | Banque, assurance, immobilier | moyen | entrée (rang 306 sans réponses) | Agent(e) administratif(ve) banque ou assurance ; Agent administratif / Agente administrative de banque ; Technicien(ne) administratif(ve) de banque | +4 |

### 5. Manager une équipe

**Dans la continuité de votre parcours**: 0 des 3 métiers sont apportés par vos réponses. Preuves : 6 compétences distinctives partagées dans « Manager une équipe »; 0 réponse différente. 1 métier rattaché par leur 2e capacité.

Aucune réponse du quiz derrière cette direction : elle vient de votre parcours.

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Responsable de secteur coordinateur / Responsable de secteur coordinatrice | Santé | moyen | −14 | Responsable de secteur coordinateur (trice) ; Coordinateur de santé / Coordinatrice de santé ; Coordonnateur(trice) actions éducation thérapeutique patient | +1 |
| Coordonnateur / Coordonnatrice de service social | Social, accompagnement | moyen | entrée (rang 42 sans réponses) | Coordonnateur / Coordonnatrice de service social ; Coordonnateur / Coordonnatrice de service d'action sociale ; Responsable de structure d'accueil social | +8 |
| Responsable de service en établissement touristique | Restauration, hôtellerie, loisirs | moyen | entrée (rang 73 sans réponses) | Responsable de service en établissement touristique ; Responsable de bar en établissement touristique ; Responsable de salle en établissement touristique | +6 |

### Autres pistes (16 affichées; 5 au signal faible, derrière un lien)

| Métier | Secteur | Signal |
|---|---|---|
| Conseiller / Conseillère clientèle à distance | Commerce et vente | moyen |
| Formateur / Formatrice aux métiers de l'éducation et de la sécurité routière | Enseignement, formation | moyen |
| Responsable en organisation en entreprise | Conseil, organisation | moyen |
| Conseiller / Conseillère en information médicale | Commerce et vente | moyen |
| Educateur sportif / Educatrice sportive | Restauration, hôtellerie, loisirs | moyen |
| Assistant administratif / Assistante administrative | Secrétariat, assistance | moyen |
| Secrétaire technique | Secrétariat, assistance | moyen |
| Secrétaire administratif / Secrétaire administrative de collectivité territoriale | Secrétariat, assistance | moyen |
| Toiletteur / Toiletteuse d'animaux | Agriculture, nature, animaux | moyen |
| Conseiller commercial / Conseillère commerciale et relation client en assurances | Banque, assurance, immobilier | moyen |
| Chef / Cheffe de bassin | Restauration, hôtellerie, loisirs | moyen |
| Maître / Maîtresse de cérémonie funéraire | Services funéraires | moyen |
| Chargé / Chargée d'accueil | Secrétariat, assistance | moyen |
| Télésecrétaire | Secrétariat, assistance | moyen |
| Psychologue | Social, accompagnement | moyen |
| Conseiller / Conseillère funéraire | Services funéraires | moyen |

## P7: Seed admin:rh + réponses relation

Seed: admin:rh; diplôme bac5; inventaire 416 compétences (393 du seed); 985 pistes surfacées.

**Before (v6):** 1. Gérer les compétences (continuité, 5 métiers, preuves 28, 0 réponses); 2. Gérer l'administratif (continuité, 4 métiers, preuves 14, 0 réponses); 3. Concevoir des formations (continuité, 4 métiers, preuves 11, 0 réponses); 4. Améliorer la qualité de vie au travail (continuité, 5 métiers, preuves 12, 0 réponses); 5. Acheter, maîtriser les coûts (continuité, 3 métiers, preuves 2, 0 réponses).

**Removed by the evidence bar:**
- Acheter, maîtriser les coûts: 2 compétences distinctives partagées dans sa capacité (minimum 3). Ses 2 métiers vont dans Autres pistes.

**After (v7):** 5 directions.

### 1. Gérer les compétences

**Dans la continuité de votre parcours**: 0 des 5 métiers sont apportés par vos réponses. Preuves : 28 compétences distinctives partagées dans « Gérer les emplois et les compétences »; 0 réponse différente.

Aucune réponse du quiz derrière cette direction : elle vient de votre parcours.

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Chargé / Chargée de recrutement | Ressources humaines | moyen | +2 | Chargé / Chargée de recrutement ; Chargé / Chargée de recherche en recrutement ; Chargé / Chargée de recrutement et mobilité professionnelle | +8 |
| Directeur / Directrice des Ressources Humaines (DRH) | Ressources humaines | moyen | −3 | Directeur / Directrice des Ressources Humaines (DRH) ; Directeur / Directrice du personnel ; Responsable des Ressources Humaines -RRH- | +13 |
| Chargé / Chargée de mission RH diversité handicap | Ressources humaines | moyen | −4 | Chargé / Chargée de mission RH diversité handicap ; Responsable diversité et égalité des chances | – |
| Conseiller / Conseillère en gestion de carrière | Ressources humaines | moyen | −8 | Conseiller / Conseillère en gestion de carrière ; Conseiller / Conseillère en développement des carrières ; Responsable de la gestion des cadres | +8 |
| Chef / Cheffe d'établissement d'enseignement | Enseignement, formation | moyen | entrée (rang 46 sans réponses) | Chef / Cheffe d'établissement d'enseignement ; Chef(fe) d'établissement adjoint(e) ; Directeur(trice) d'établissement d'enseignement spécialisé | +14 |

### 2. Gérer l'administratif

*Aussi : Gérer les compétences*

**Dans la continuité de votre parcours**: 0 des 4 métiers sont apportés par vos réponses. Preuves : 14 compétences distinctives partagées dans « Assurer la gestion administrative »; 0 réponse différente.

Aucune réponse du quiz derrière cette direction : elle vient de votre parcours.

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Assistant / Assistante Ressources Humaines (RH) | Ressources humaines | moyen | +5 | Assistant / Assistante ressources humaines ; Assistant / Assistante de gestion en ressources humaines ; Assistant / Assistante emploi formation | +5 |
| Gestionnaire paie | Ressources humaines | fort | −3 | Gestionnaire paie ; Gestionnaire paie et administration du personnel ; Responsable paie | +7 |
| Responsable paie et administration du personnel | Ressources humaines | fort | −10 | Responsable paie et administration du personnel ; Responsable de l'administration du personnel ; Responsable de la gestion du personnel | +7 |
| Cadre de santé d'unité de soins ou de service paramédical | Santé | moyen | −4 | Cadre de santé d'unité de soins ou de service paramédical ; Cadre de santé d'unité de soins ; Cadre de santé de service paramédical | +4 |

### 3. Concevoir des formations

**Dans la continuité de votre parcours**: 0 des 4 métiers sont apportés par vos réponses. Preuves : 11 compétences distinctives partagées dans « Concevoir l'ingénierie de formation »; 0 réponse différente. 1 métier rattaché par leur 2e capacité.

Aucune réponse du quiz derrière cette direction : elle vient de votre parcours.

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Formateur / Formatrice aux métiers de l'éducation et de la sécurité routière | Enseignement, formation | moyen | entrée (rang 95 sans réponses) | Formateur / Formatrice de moniteurs d'auto-école | +1 |
| Responsable formation professionnelle en entreprise | Ressources humaines | moyen | −8 | Responsable formation professionnelle en entreprise ; Responsable formation en entreprise ; Responsable formation communication en entreprise | +7 |
| Professeur / Professeure des universités | Enseignement, formation | moyen | entrée (rang 90 sans réponses) | Professeur / Professeure des universités ; Professeur / Professeure de l'enseignement supérieur | +9 |
| Enseignant / Enseignante de la conduite et de la sécurité routière | Enseignement, formation | moyen | entrée (rang 240 sans réponses) | Enseignant(e) de la conduite et de la sécurité routière | +6 |

### 4. Améliorer la qualité de vie au travail

**Dans la continuité de votre parcours**: 0 des 4 métiers sont apportés par vos réponses. Preuves : 12 compétences distinctives partagées dans « Améliorer la qualité de vie au travail »; 0 réponse différente. 1 métier rattaché par leur 2e capacité.
⚑ nom : absent du brouillon : libellé ROME gardé

Aucune réponse du quiz derrière cette direction : elle vient de votre parcours.

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Directeur / Directrice des relations sociales | Ressources humaines | fort | −5 | Directeur / Directrice des relations sociales ; Responsable des relations sociales ; Responsable des relations du travail | – |
| Responsable Qualité de Vie au Travail | Ressources humaines | moyen | −10 | Responsable Qualité de Vie au Travail | – |
| Adjoint / Adjointe de la direction en hôtellerie-restauration | Restauration, hôtellerie, loisirs | moyen | −1 | Adjoint / Adjointe de la direction en hôtellerie ; Assistant / Assistante de direction hôtellerie-restauration ; Assistant / Assistante à la direction d'un restaurant | +3 |
| Médecin du travail et de prévention | Santé | moyen | −5 | Médecin du travail et de prévention ; Médecin du travail ; Médecin de prévention | +2 |

### 5. Travailler en équipe

**Dans la continuité de votre parcours**: 0 des 3 métiers sont apportés par vos réponses. Preuves : 5 compétences distinctives partagées dans « Collaborer et favoriser la collaboration »; 1 réponse différente. 1 métier rattaché par leur 2e capacité.

Vos réponses derrière cette direction :
- « Je préfère expliquer à l'oral, montrer et répondre aux questions. » (sf_write_explain, 1 compétence partagée)

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Infirmier / Infirmière de prévention | Santé | moyen | entrée (rang 43 sans réponses) | Infirmier / Infirmière de prévention ; Infirmier / Infirmière de santé préventive | – |
| Animateur / Animatrice de loisirs sportifs | Restauration, hôtellerie, loisirs | moyen | entrée (rang 266 sans réponses) | Animateur / Animatrice de loisirs sportifs ; Animateur(trice) de loisirs sportifs ; Animateur sportif / Animatrice sportive | +5 |
| Conseiller / Conseillère en insertion professionnelle | Emploi, territoires | moyen | entrée (rang 59 sans réponses) | Conseiller / Conseillère en insertion professionnelle ; Conseiller professionnel / Conseillère professionnelle ; Conseiller / Conseillère en évolution professionnelle (CEP) | +13 |

### Autres pistes (18 affichées; 2 au signal faible, derrière un lien)

| Métier | Secteur | Signal |
|---|---|---|
| Chargé / Chargée d'accueil et de services clientèle bancaire | Banque, assurance, immobilier | moyen |
| Responsable de service en établissement touristique | Restauration, hôtellerie, loisirs | moyen |
| Conseiller / Conseillère en économie sociale et familiale (CESF) | Social, accompagnement | moyen |
| Responsable en organisation en entreprise | Conseil, organisation | moyen |
| Animateur socioéducatif / Animatrice socioéducative | Social, accompagnement | moyen |
| Agent administratif / Agente administrative banque ou assurance | Banque, assurance, immobilier | moyen |
| Architecte d'intérieur | Bâtiment, travaux publics | moyen |
| Conseiller / Conseillère clientèle à distance | Commerce et vente | moyen |
| Chef / Cheffe de projet événementiel | Communication, médias | moyen |
| Conseiller / Conseillère en information médicale | Commerce et vente | moyen |
| Guichetier vendeur / Guichetière vendeuse | Banque, assurance, immobilier | moyen |
| Auditeur social / Auditrice sociale | Conseil, organisation | moyen |
| Educateur sportif / Educatrice sportive | Restauration, hôtellerie, loisirs | moyen |
| Architecte du bâtiment | Bâtiment, travaux publics | moyen |
| Conseiller / Conseillère technique agricole | Agriculture, nature, animaux | moyen |
| Ingénieur / Ingénieure d'affaires en industrie | Industrie | moyen |
| Agent / Agente d'accueil social | Social, accompagnement | moyen |
| Animateur / Animatrice d'atelier multimédia | Restauration, hôtellerie, loisirs | moyen |

## P8: Seed hôtellerie:cuisine + réponses terrain

Seed: hotellerie:cuisine; diplôme cap; inventaire 399 compétences (372 du seed); 1110 pistes surfacées.

**Before (v6):** 1. Cuisiner (continuité, 10 métiers, preuves 37, 0 réponses); 2. Travailler la matière (révélée, 5 métiers, preuves 5, 1 réponses); 3. Protéger l'environnement (continuité, 5 métiers, preuves 4, 0 réponses); 4. Entretenir et réparer (révélée, 5 métiers, preuves 2, 1 réponses); 5. Travailler avec des machines (révélée, 2 métiers, preuves 1, 2 réponses).

**Removed by the evidence bar:**
- Travailler la matière: révélée par 1 réponse seulement (minimum 2). Ses 5 métiers vont dans Autres pistes.
- Entretenir et réparer: 2 compétences distinctives partagées dans sa capacité (minimum 3). Ses 2 métiers vont dans Autres pistes.
- Travailler avec des machines: 1 compétence distinctive partagée dans sa capacité (minimum 3). Ses 2 métiers vont dans Autres pistes.

**After (v7):** 2 directions.

### 1. Cuisiner

**Dans la continuité de votre parcours**: 0 des 10 métiers sont apportés par vos réponses. Preuves : 37 compétences distinctives partagées dans « Mettre en œuvre des techniques culinaires »; 0 réponse différente.

Aucune réponse du quiz derrière cette direction : elle vient de votre parcours.

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Commis / Commise de cuisine | Restauration, hôtellerie, loisirs | moyen | +2 | Commis / Commise de cuisine ; Commis de cuisine tournant / Commise de cuisine tournante ; Commis pâtissier / Commise pâtissière de restaurant | +2 |
| Plongeur officier / Plongeuse officière de cuisine | Restauration, hôtellerie, loisirs | moyen | +10 | Plongeur officier / Plongeuse officière de cuisine ; Plongeur / Plongeuse en restauration ; Plongeur-batterie / Plongeuse-batterie en restauration | +1 |
| Chef / Cheffe de cuisine | Restauration, hôtellerie, loisirs | moyen | −3 | Chef / Cheffe de cuisine ; Chef / Cheffe d'atelier de cuisine ; Chef cuisinier / Cheffe cuisinière | +2 |
| Pizzaïolo / Pizzaïola | Restauration, hôtellerie, loisirs | moyen | −8 | Pizzaïolo / Pizzaïola | +1 |
| Cuisinier / Cuisinière | Restauration, hôtellerie, loisirs | fort | −17 | Cuisinier / Cuisinière ; Cuisinier / Cuisinière à domicile | +12 |
| Charcutier-traiteur / Charcutière-traiteuse | Commerce et vente | moyen | −8 | Charcutier-traiteur / Charcutière-traiteuse ; Charcutier / Charcutière ; Aide-charcutier / Aide-charcutière | +3 |
| Employé / Employée de restauration collective | Restauration, hôtellerie, loisirs | moyen | −11 | Employé / Employée de restauration collective ; Employé / Employée de cantine ; Employé / Employée de cafétéria | +5 |
| Steward / Hôtesse de train | Restauration, hôtellerie, loisirs | moyen | −4 | Steward / Hôtesse de train | +1 |
| Pâtissier / Pâtissière de restaurant | Restauration, hôtellerie, loisirs | fort | −27 | Pâtissier / Pâtissière de restaurant ; Chef pâtissier / Cheffe pâtissière de restaurant ; Cuisinier pâtissier / Cuisinière pâtissière | +3 |
| Poissonnier / Poissonnière | Commerce et vente | moyen | −22 | Poissonnier / Poissonnière ; Poissonnier-traiteur / Poissonnière-traiteuse | +3 |

### 2. Protéger l'environnement

**Dans la continuité de votre parcours**: 0 des 5 métiers sont apportés par vos réponses. Preuves : 4 compétences distinctives partagées dans « Protéger l'environnement »; 0 réponse différente. 2 métiers rattachés par leur 2e capacité.

Aucune réponse du quiz derrière cette direction : elle vient de votre parcours.

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Coffreur / Coffreuse | Bâtiment, travaux publics | moyen | entrée (rang 247 sans réponses) | Coffreur / Coffreuse ; Coffreur / Coffreuse béton armé ; Coffreur / Coffreuse métallique | +22 |
| Agent de maintenance qualifié / Agente de maintenance qualifiée en camping | Maintenance | moyen | entrée (rang 56 sans réponses) | Agent(e) de maintenance qualifié en camping ; Agent(e) de maintenance qualifié(e) hôtellerie de plein air | – |
| Façadier / Façadière itéiste | Bâtiment, travaux publics | moyen | entrée (rang 123 sans réponses) | Façadier / Façadière itéiste ; Façadier / Façadière ; Façadier / Façadière ravalement | +20 |
| Employé familial / Employée familiale | Aide à la personne | moyen | = | Employé familial / Employée familiale ; Employé familial / Employée familiale de maison ; Employé / Employée de maison | +3 |
| Cuisinier / Cuisinière en industrie chimique | Industrie | moyen | entrée (rang 143 sans réponses) | Cuisinier / Cuisinière en industrie chimique ; Cuisinier / Cuisinière en industrie papetière ; Cuisinier / Cuisinière en tannerie-mégisserie | +18 |

**2 directions only** (fewer than 3).

### Autres pistes (22 affichées; 3 au signal faible, derrière un lien)

| Métier | Secteur | Signal |
|---|---|---|
| Equipier polyvalent / Equipière polyvalente de restauration rapide | Restauration, hôtellerie, loisirs | moyen |
| Chargé / Chargée d'accueil et de services clientèle bancaire | Banque, assurance, immobilier | moyen |
| Technicien / Technicienne d'exploitation en production d'énergie thermique | Industrie | moyen |
| Assembleur / Assembleuse d'ouvrages en bois | Industrie | moyen |
| Etancheur / Etancheuse | Bâtiment, travaux publics | moyen |
| Agent / Agente d'opérations sur piste | Transport, logistique | moyen |
| Modeleur / Modeleuse | Industrie | moyen |
| Electricien / Electricienne de maintenance | Maintenance | moyen |
| Frigoriste | Maintenance | moyen |
| Cisailleur / Cisailleuse en métallurgie | Industrie | moyen |
| Educateur spécialisé / Educatrice spécialisée | Social, accompagnement | moyen |
| Agent / Agente de stérilisation de service hospitalier | Santé | moyen |
| Matelot de la navigation fluviale | Transport, logistique | moyen |
| Charpentier / Charpentière | Bâtiment, travaux publics | moyen |
| Agent / Agente de service hospitalier (ASH) | Santé | moyen |
| Mécanicien / Mécanicienne de maintenance industrielle | Maintenance | moyen |
| Agent / Agente de prévention et de sécurité | Sécurité, défense, secours | moyen |
| Chef / Cheffe d'équipe en industrie | Industrie | moyen |
| Réceptionniste | Restauration, hôtellerie, loisirs | moyen |
| Monteur / Monteuse en structures métalliques | Bâtiment, travaux publics | moyen |
| Saliculteur / Salicultrice | Agriculture, nature, animaux | moyen |
| Toiletteur / Toiletteuse d'animaux | Agriculture, nature, animaux | moyen |

## P9: Seed commerce:vente + réponses vente

Seed: commerce:vente; diplôme bac2; inventaire 1552 compétences (1539 du seed); 1106 pistes surfacées.

**Before (v6):** 1. La relation client (continuité, 10 métiers, preuves 21, 5 réponses); 2. Vendre (continuité, 4 métiers, preuves 9, 1 réponses); 3. Bâtir une offre commerciale (continuité, 4 métiers, preuves 9, 2 réponses); 4. Travailler en équipe (continuité, 5 métiers, preuves 8, 3 réponses); 5. Travailler la matière (continuité, 3 métiers, preuves 13, 0 réponses).

**After (v7):** 5 directions.

### 1. La relation client

**Dans la continuité de votre parcours**: 2 des 10 métiers sont apportés par vos réponses. Preuves : 21 compétences distinctives partagées dans « Gérer la relation client, recueillir et analyser les besoins client »; 5 réponses différentes. 3 métiers rattachés par leur 2e capacité.

Vos réponses derrière cette direction :
- « Échanger avec des personnes, comprendre leurs demandes, gérer la relation. » (sf_numbers_people, 4 compétences partagées)
- « J'appelle, je clarifie, je gère la tension. » (g_conflict, 4 compétences partagées)
- « Je préfère expliquer à l'oral, montrer et répondre aux questions. » (sf_write_explain, 3 compétences partagées)
- « Ça me stimule si les échanges ont un objectif clair. » (g_group_energy, 3 compétences partagées)

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Vendeur / Vendeuse en équipement de la maison | Commerce et vente | moyen | +8 | Vendeur / Vendeuse en équipement de la maison ; Vendeur / Vendeuse en linge de maison ; Vendeur / Vendeuse en équipement du foyer | +32 |
| Vendeur / Vendeuse en prêt-à-porter | Commerce et vente | moyen | entrée (rang 156 sans réponses) | Vendeur / Vendeuse en prêt-à-porter ; Vendeur / Vendeuse en prêt-à-porter enfant ; Vendeur / Vendeuse en prêt-à-porter de luxe | +4 |
| Chargé / Chargée d'accueil | Secrétariat, assistance | moyen | entrée (rang 449 sans réponses) | Chargé / Chargée d'accueil ; Chargé / Chargée d'accueil et d'information ; Agent / Agente d'accueil | +10 |
| Ingénieur / Ingénieure d'affaires en industrie | Industrie | moyen | entrée (rang 172 sans réponses) | Ingénieur / Ingénieure d'affaires en industrie ; Ingénieur / Ingénieure de suivi d'affaires en industrie ; Ingénieur / Ingénieure de projet d'affaires en industrie | +11 |
| Conseiller / Conseillère en image personnelle | Commerce et vente | fort | −34 | Conseiller / Conseillère en image personnelle ; Conseiller / Conseillère beauté ; Conseiller / Conseillère minceur | +3 |
| Secrétaire technique | Secrétariat, assistance | moyen | entrée (rang 349 sans réponses) ✔ | Secrétaire technique ; Secrétaire technique bureau d'études ; Secrétaire technique de la construction | +4 |
| Chargé / Chargée de location d'engins et de matériel de chantier | Commerce et vente | moyen | −29 | Chargé(e) de location d'engins et de matériel de chantier | – |
| Conseiller / Conseillère clientèle à distance | Commerce et vente | moyen | entrée (rang 490 sans réponses) ✔ | Conseiller / Conseillère clientèle à distance ; Technicien / Technicienne de la vente à distance | +6 |
| Agent / Agente d'Escale Commerciale aéroportuaire (AEC) | Transport, logistique | moyen | entrée (rang 668 sans réponses) | Agent / Agente d'Escale Commerciale aéroportuaire (AEC) ; Agent / Agente d'escale aéroportuaire ; Agent / Agente de passage escale aéroportuaire | +3 |
| Coiffeur / Coiffeuse | Commerce et vente | moyen | −11 | Coiffeur / Coiffeuse ; Coiffeur / Coiffeuse dames ; Coiffeur / Coiffeuse mixte | +11 |

### 2. Vendre

**Dans la continuité de votre parcours**: 0 des 4 métiers sont apportés par vos réponses. Preuves : 9 compétences distinctives partagées dans « Vendre »; 1 réponse différente. 1 métier rattaché par leur 2e capacité.

Vos réponses derrière cette direction :
- « Convaincre, négocier ou lancer une conversation. » (sf_sell_fix, 1 compétence partagée)

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Vendeur / Vendeuse d'articles de sport et loisirs | Commerce et vente | moyen | +24 | Vendeur / Vendeuse d'articles de sport et loisirs ; Vendeur / Vendeuse en articles de sport ; Vendeur / Vendeuse en équipement de sport | +7 |
| Acheteur vendeur / Acheteuse vendeuse d'or, de métaux précieux | Commerce et vente | moyen | −4 | Acheteur(se) vendeur(se) d'or, de métaux précieux | – |
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

### 4. Travailler en équipe

**Dans la continuité de votre parcours**: 2 des 5 métiers sont apportés par vos réponses. Preuves : 8 compétences distinctives partagées dans « Collaborer et favoriser la collaboration »; 3 réponses différentes. 2 métiers rattachés par leur 2e capacité.

Vos réponses derrière cette direction :
- « Échanger avec des personnes, comprendre leurs demandes, gérer la relation. » (sf_numbers_people, 1 compétence partagée)
- « Je rassure d'abord, puis je fais avancer la demande. » (sf_client_issue, 1 compétence partagée)
- « J'appelle, je clarifie, je gère la tension. » (g_conflict, 1 compétence partagée)

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Secrétaire administratif / Secrétaire administrative de collectivité territoriale | Secrétariat, assistance | moyen | entrée (rang 238 sans réponses) ✔ | Secrétaire administratif(ve) de collectivité territoriale ; Agent administratif / Agente administrative de l'Etat ; Adjoint administratif / Adjointe administrative (guichet) | +5 |
| Assistant administratif / Assistante administrative | Secrétariat, assistance | moyen | entrée (rang 415 sans réponses) ✔ | Assistant administratif / Assistante administrative ; Assistant / Assistante de gestion administrative ; Assistant / Assistante chef de projet | +18 |
| Agent / Agente d'accueil social | Social, accompagnement | moyen | entrée (rang 460 sans réponses) | Agent / Agente d'accueil social ; Agent / Agente d'accueil et d'information sociale | +4 |
| Plagiste | Commerce et vente | fort | = | Plagiste | – |
| Adjoint / Adjointe de la direction en hôtellerie-restauration | Restauration, hôtellerie, loisirs | moyen | entrée (rang 50 sans réponses) | Adjoint / Adjointe de la direction en hôtellerie ; Assistant / Assistante de direction hôtellerie-restauration ; Assistant / Assistante à la direction d'un restaurant | +3 |

### 5. Travailler la matière

**Dans la continuité de votre parcours**: 0 des 3 métiers sont apportés par vos réponses. Preuves : 13 compétences distinctives partagées dans « Manipuler des produits, matières premières »; 0 réponse différente. 1 métier rattaché par leur 2e capacité.

Aucune réponse du quiz derrière cette direction : elle vient de votre parcours.

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Cordonnier / Cordonnière | Commerce et vente | moyen | = | Cordonnier / Cordonnière ; Cordonnier-bottier / Cordonnière-bottière ; Cordonnier réparateur / Cordonnière réparatrice | +4 |
| Fleuriste | Commerce et vente | moyen | entrée (rang 60 sans réponses) | Fleuriste ; Fleuriste-décorateur floral / Fleuriste-décoratrice florale | +1 |
| Coiffeur / Coiffeuse spectacle | Spectacle | moyen | −12 | Coiffeur / Coiffeuse spectacle ; Assistant coiffeur / Assistante coiffeuse spectacle ; Coiffeur-perruquier / Coiffeuse-perruquière spectacle | +7 |

### Autres pistes (14 affichées; 0 au signal faible, derrière un lien)

| Métier | Secteur | Signal |
|---|---|---|
| Responsable de service en établissement touristique | Restauration, hôtellerie, loisirs | moyen |
| Chargé / Chargée d'accueil et de services clientèle bancaire | Banque, assurance, immobilier | moyen |
| Maître / Maîtresse de cérémonie funéraire | Services funéraires | moyen |
| Enseignant / Enseignante de la conduite et de la sécurité routière | Enseignement, formation | moyen |
| Guichetier vendeur / Guichetière vendeuse | Banque, assurance, immobilier | moyen |
| Agent administratif / Agente administrative banque ou assurance | Banque, assurance, immobilier | moyen |
| Brocanteur / Brocanteuse | Commerce et vente | moyen |
| Toiletteur / Toiletteuse d'animaux | Agriculture, nature, animaux | moyen |
| Responsable de pressing | Commerce et vente | moyen |
| Tapissier / Tapissière d'ameublement | Artisanat d'art | moyen |
| Educateur sportif / Educatrice sportive | Restauration, hôtellerie, loisirs | moyen |
| Assistant administratif / Assistante administrative multilingue | Secrétariat, assistance | moyen |
| Conseiller commercial / Conseillère commerciale et relation client en assurances | Banque, assurance, immobilier | moyen |
| Chef / Cheffe de projet événementiel | Communication, médias | moyen |

## P10: Seed btp:second + réponses organisation

Seed: btp:second; diplôme bac2; inventaire 424 compétences (402 du seed); 1102 pistes surfacées.

**Before (v6):** 1. Construire, bâtir (continuité, 11 métiers, preuves 61, 0 réponses); 2. Gérer l'administratif (révélée, 10 métiers, preuves 4, 5 réponses); 3. Convaincre (révélée, 5 métiers, preuves 1, 3 réponses); 4. Travailler la matière (continuité, 3 métiers, preuves 7, 0 réponses); 5. Réagir à l'imprévu (révélée, 2 métiers, preuves 4, 3 réponses).

**Removed by the evidence bar:**
- Convaincre: 1 compétence distinctive partagée dans sa capacité (minimum 3). Ses 5 métiers vont dans Autres pistes.

**After (v7):** 4 directions.

### 1. Gérer l'administratif

**Révélée par vos réponses**: 11 des 11 métiers sont apportés par vos réponses. Preuves : 4 compétences distinctives partagées dans « Assurer la gestion administrative »; 5 réponses différentes. 4 métiers rattachés par leur 2e capacité.

Vos réponses derrière cette direction :
- « Organiser les étapes et coordonner les personnes. » (sf_hands_organise, 3 compétences partagées)
- « Je suis les statuts, les relances et les blocages. » (sf_project_followup, 3 compétences partagées)
- « Je commence par remettre de l'ordre. » (f_order_improv, 2 compétences partagées)
- « Je prends naturellement la responsabilité de faire avancer. » (g_lead_support, 2 compétences partagées)

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Chargé / Chargée d'accueil et de services clientèle bancaire | Banque, assurance, immobilier | moyen | entrée (rang 334 sans réponses) ✔ | Chargé / Chargée d'accueil et de services clientèle bancaire ; Assistant / Assistante service clientèle bancaire ; Conseiller / Conseillère accueil en agence bancaire | +2 |
| Ingénieur / Ingénieure de maintenance industrielle | Maintenance | moyen | entrée (rang 183 sans réponses) ✔ | Ingénieur / Ingénieure de maintenance industrielle ; Ingénieur / Ingénieure Maintenance Nucléaire ; Ingénieur(e) maintenance-fiabilisation industrielle | +19 |
| Assistant / Assistante de direction | Secrétariat, assistance | moyen | entrée (rang 495 sans réponses) ✔ | Assistant / Assistante de direction ; Assistant / Assistante de direction bilingue ; Assistant / Assistante de direction trilingue | +5 |
| Secrétaire administratif / Secrétaire administrative de collectivité territoriale | Secrétariat, assistance | moyen | entrée (rang 623 sans réponses) ✔ | Secrétaire administratif(ve) de collectivité territoriale ; Agent administratif / Agente administrative de l'Etat ; Adjoint administratif / Adjointe administrative (guichet) | +5 |
| Conseiller / Conseillère en organisation d'événementiel de particuliers | Communication, médias | moyen | entrée (rang 550 sans réponses) ✔ | Conseiller(ère) organisation d'événementiel de particuliers ; Conseiller / Conseillère en organisation de mariages ; Régisseur / Régisseuse d'évènementiel | +6 |
| Régisseur / Régisseuse de production | Spectacle | moyen | entrée (rang 332 sans réponses) ✔ | Régisseur / Régisseuse de production ; Régisseur / Régisseuse de plateau ; Régisseur / Régisseuse de tournée | +5 |
| Enseignant / Enseignante de la conduite et de la sécurité routière | Enseignement, formation | moyen | entrée (rang 599 sans réponses) ✔ | Enseignant(e) de la conduite et de la sécurité routière | +6 |
| Responsable de service en établissement touristique | Restauration, hôtellerie, loisirs | moyen | entrée (rang 110 sans réponses) ✔ | Responsable de service en établissement touristique ; Responsable de bar en établissement touristique ; Responsable de salle en établissement touristique | +6 |
| Directeur / Directrice artistique spectacle | Spectacle | moyen | entrée (rang 308 sans réponses) ✔ | Directeur / Directrice artistique spectacle ; Directeur / Directrice artistique spectacle musical ; Directeur artistique / Directrice artistique | +16 |
| Chargé / Chargée d'indemnisations en assurances | Banque, assurance, immobilier | moyen | entrée (rang 46 sans réponses) ✔ | Chargé / Chargée d'indemnisations en assurances | +2 |
| Assistant / Assistante styliste | Artisanat d'art | moyen | absente sans réponses ✔ | Assistant / Assistante styliste ; Assistant / Assistante de collection ; Assistant designer / Assistante designer | – |

### 2. Réagir à l'imprévu

*Aussi : Animer un groupe*

**Révélée par vos réponses**: 2 des 2 métiers sont apportés par vos réponses. Preuves : 4 compétences distinctives partagées dans « Agir face à l'imprévu »; 3 réponses différentes.

Vos réponses derrière cette direction :
- « Je pose une limite claire. » (g_boundaries, 3 compétences partagées)
- « Je prends naturellement la responsabilité de faire avancer. » (g_lead_support, 2 compétences partagées)
- « Je fais une première version, puis je corrige vite. » (f_ambiguous_instruction, 1 compétence partagée)

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Manager de proximité | Ressources humaines | moyen | entrée (rang 198 sans réponses) ✔ | Manager de proximité ; Team manager | +2 |
| Chef / Cheffe de projet événementiel | Communication, médias | moyen | entrée (rang 153 sans réponses) ✔ | Chef / Cheffe de projet événementiel ; Chargé / Chargée responsable de projet événementiel ; Chargé / Chargée de mission événementiel | +4 |

### 3. Construire, bâtir

**Dans la continuité de votre parcours**: 0 des 11 métiers sont apportés par vos réponses. Preuves : 61 compétences distinctives partagées dans « Construire »; 0 réponse différente.

Aucune réponse du quiz derrière cette direction : elle vient de votre parcours.

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Monteur / Monteuse de réseaux électriques | Bâtiment, travaux publics | fort | +6 | Monteur / Monteuse de réseaux électriques ; Monteur / Monteuse réseaux ; Monteur / Monteuse de lignes électriques | +23 |
| Electricien / Electricienne du bâtiment | Bâtiment, travaux publics | moyen | = | Electricien / Electricienne du bâtiment ; Electricien / Electricienne bâtiment tertiaire ; Artisan électricien / Artisane électricienne du bâtiment | +9 |
| Menuisier / Menuisière aluminium | Bâtiment, travaux publics | moyen | = | Menuisier / Menuisière aluminium ; Menuisier fabricant / Menuisière fabricante aluminium ; Monteur / Monteuse de menuiserie aluminium | +2 |
| Poseur / Poseuse en fermetures de bâtiment | Bâtiment, travaux publics | moyen | +7 | Poseur / Poseuse en fermetures de bâtiment ; Menuisier poseur / Menuisière poseuse de fermetures ; Poseur / Poseuse de clôtures | +21 |
| Plâtrier / Plâtrière | Bâtiment, travaux publics | fort | −5 | Plâtrier / Plâtrière ; Platrier / Platrière plaquiste ; Artisan plâtrier / Artisane plâtrière | +3 |
| Poseur / Poseuse de revêtements de sols | Bâtiment, travaux publics | moyen | −3 | Poseur / Poseuse de revêtements de sols ; Poseur / Poseuse de revêtements souples de sols ; Poseur / Poseuse de revêtements souples murs et sols | +13 |
| Carreleur / Carreleuse | Bâtiment, travaux publics | moyen | −11 | Carreleur / Carreleuse ; Carreleur / Carreleuse mosaïste ; Aide carreleur / Aide carreleuse | +10 |
| Electricien / Electricienne de maintenance | Maintenance | moyen | entrée (rang 53 sans réponses) | Electricien / Electricienne de maintenance ; Aide électricien / Aide électricienne de maintenance ; Electricien / Electricienne d'atelier de maintenance | +32 |
| Plombier / Plombière sanitaire | Bâtiment, travaux publics | moyen | −12 | Plombier / Plombière sanitaire ; Plombier / Plombière ; Aide plombier / Aide plombière | +8 |
| Poseur / Poseuse de véranda | Bâtiment, travaux publics | moyen | −12 | Poseur / Poseuse de vérandas ; Poseur installateur / Poseuse installatrice de carport ; Poseur installateur / Poseuse installatrice de pergola | – |
| Plaquiste | Bâtiment, travaux publics | moyen | −12 | Plaquiste ; Monteur / Monteuse plaquiste ; Jointeur / Jointeuse plaquiste | +11 |

### 4. Travailler la matière

**Dans la continuité de votre parcours**: 0 des 3 métiers sont apportés par vos réponses. Preuves : 7 compétences distinctives partagées dans « Manipuler des produits, matières premières »; 0 réponse différente.

Aucune réponse du quiz derrière cette direction : elle vient de votre parcours.

| Métier | Secteur | Signal | Sans vos réponses | Intitulés à copier | Plus d'intitulés |
|---|---|---|---|---|---|
| Peintre en bâtiment | Bâtiment, travaux publics | fort | −1 | Peintre en bâtiment ; Artisan / Artisane peintre en bâtiment ; Aide peintre | +15 |
| Agent / Agente d'encadrement en industrie du bois | Industrie | moyen | entrée (rang 218 sans réponses) | Agent / Agente d'encadrement en industrie du bois ; Agent / Agente de maîtrise en industrie du bois ; Agent / Agente de maîtrise en menuiserie | +15 |
| Façadier / Façadière itéiste | Bâtiment, travaux publics | moyen | −11 | Façadier / Façadière itéiste ; Façadier / Façadière ; Façadier / Façadière ravalement | +20 |

### Autres pistes (11 affichées; 2 au signal faible, derrière un lien)

| Métier | Secteur | Signal |
|---|---|---|
| Chef / Cheffe d'équipe en industrie | Industrie | moyen |
| Responsable d'agence transport routier de marchandises | Transport, logistique | moyen |
| Responsable d'équipe maintenance | Maintenance | moyen |
| Responsable entrepôt logistique | Transport, logistique | moyen |
| Responsable de site éco-industriel | Propreté, environnement | moyen |
| Chargé / Chargée d'affaires bancaires | Banque, assurance, immobilier | moyen |
| Laveur / Laveuse de vitres | Propreté, environnement | moyen |
| Responsable service clients | Marketing, ventes | moyen |
| Modeleur / Modeleuse | Industrie | moyen |
| Chef / Cheffe machiniste spectacle | Spectacle | moyen |
| Approvisionneur / Approvisionneuse logistique | Transport, logistique | moyen |

## Contrast: P4 vs P5, same seed (tech:code), different answers

| | P4 (analyse) | P5 (relation) |
|---|---|---|
| 1 | **Construire des logiciels** (continuité)<br>(parcours) | **Construire des logiciels** (continuité)<br>(parcours) |
| 2 | **Analyser des données** (continuité)<br>« J'ai besoin de comprendre ce qui se passe vraiment. »<br>« Vérifier, calculer, classer, appliquer des règles précises. » | **Développer une activité** (continuité)<br>(parcours) |
| 3 | **Animer un groupe** (continuité)<br>« Je commence par remettre de l'ordre. » |  |
| 4 | **Prévenir les risques** (continuité)<br>(parcours) |  |
| 5 | **Entretenir et réparer** (continuité)<br>« J'ai besoin de comprendre ce qui se passe vraiment. »<br>« Je cherche pourquoi il revient. » |  |

## Naming and sector flags

Capacities used as a name or subline whose name is flagged (all 66 personas):

- « Développer une stratégie commerciale et marketing »: absent du brouillon : libellé ROME gardé (10 directions)
- « Élaborer et appliquer un cadre juridique ou règlementaire »: absent du brouillon : libellé ROME gardé (8 directions)
- « Gérer des actifs, un patrimoine »: absent du brouillon : libellé ROME gardé (8 directions)
- « Animer des activités »: absent du brouillon : libellé ROME gardé (6 directions)
- « Contrôler la production »: absent du brouillon : libellé ROME gardé (5 directions)
- « Manutentionner, conditionner des produits »: absent du brouillon : libellé ROME gardé (4 directions)
- « Gérer, contrôler »: trop vague (signalé dans le brouillon) (4 directions)
- « Réaliser des actions de communication et évènements »: absent du brouillon : libellé ROME gardé (4 directions)
- « Améliorer la qualité de vie au travail »: absent du brouillon : libellé ROME gardé (3 directions)
- « Gérer un chantier »: absent du brouillon : libellé ROME gardé (3 directions)
- « Concevoir des supports vidéo ou graphiques »: absent du brouillon : libellé ROME gardé (3 directions)
- « Composer, mettre en scène »: absent du brouillon : libellé ROME gardé (3 directions)
- « Assurer un transport »: absent du brouillon : libellé ROME gardé (3 directions)
- « Modéliser, prototyper, inventer »: absent du brouillon : libellé ROME gardé (2 directions)
- « Accueillir, renseigner »: absent du brouillon : libellé ROME gardé (2 directions)
- « Négocier, rédiger des contrats »: absent du brouillon : libellé ROME gardé (2 directions)
- « Cultiver, produire »: absent du brouillon : libellé ROME gardé (2 directions)
- « Prendre soin d'un animal »: absent du brouillon : libellé ROME gardé (2 directions)
- « Réaliser une performance, représentation artistique »: absent du brouillon : libellé ROME gardé (1 direction)
- « Gérer des litiges, des contentieux »: absent du brouillon : libellé ROME gardé (1 direction)
- « Communiquer (niveau professionnel) »: absent du brouillon : libellé ROME gardé (1 direction)
- « Protéger les personnes et les biens »: absent du brouillon : libellé ROME gardé (1 direction)
- « Développer les nouvelles technologies »: absent du brouillon : libellé ROME gardé (1 direction)

Sector labels flagged (roles shown in directions or Autres pistes):

- K hors liste (Conception et mise en oeuvre des politiques publiques) : à revoir (11 rows)
- K hors liste (Contrôle public) : à revoir (6 rows)
- M hors liste (Achats) : à revoir (3 rows)

## Directions that appear for many personas

**the 10 report personas**: "Travailler la matière" 3/10, "Entretenir et réparer" 2/10, "Construire des logiciels" 2/10, "Réagir à l'imprévu" 2/10, "Gérer l'administratif" 2/10, "Travailler en équipe" 2/10.

**the wide set of 66**: "Travailler la matière" 13/66, "Prévenir les risques" 13/66, "Appliquer des procédés" 10/66, "Entretenir et réparer" 9/66, "Développer une stratégie commerciale et marketing" 9/66, "Construire des logiciels" 8/66.

Personas with fewer than 3 directions after the evidence bar: 11/66 (P1: 0, P2: 1, P5: 2, P8: 2, quiz relation: 0, quiz analyse: 1, quiz vente: 1, quiz organisation: 1, seed btp:second: 2, seed maintenance:vehicule: 2, seed hotellerie:cuisine: 1).

## Genericity: roles in the top 40 for more than 40 % of the wide set (66)

None. Most frequent: Chargé / Chargée d'accueil et de services clientèle bancaire (C1201) 16/66; Chef / Cheffe d'équipe en industrie (H2504) 13/66; Responsable de service en établissement touristique (G1403) 12/66; Enseignant / Enseignante de la conduite et de la sécurité routière (K2110) 11/66; Secrétaire administratif / Secrétaire administrative de collectivité territoriale (M1602) 11/66.

## Genericity: roles in the top 40 for more than 40 % of the personas who answered the quiz (15)

Carrying skills = the shared skills that contribute most rarity to the role across the personas where it is in the top 40. *In inventories* = how many of these 15 persona inventories hold the skill. *Comes from* = quiz clusters that contain it, and how many of the 51 seed depths inject it.

### Chargé / Chargée d'accueil et de services clientèle bancaire (C1201, Banque, assurance, immobilier)

In the top 40 for **14/15** (93 %): 8 quiz only, 6 seed and answers, 0 seed only. Median rank 5. ROME lists 50 skills for it. Personas: P1 (relation), P2 (analyse), P3 (terrain), P5 (relation), P6 (relation), P7 (relation), P8 (terrain), P9 (vente), P10 (organisation), quiz relation (relation), quiz analyse (analyse), quiz terrain (terrain), quiz vente (vente), quiz organisation (organisation).

| Carrying skill | idf | Share of its rarity | In inventories | Comes from |
|---|---|---|---|---|
| Gérer des réclamations et litiges (300345) | 3.2 | 7 % | 9/15 | quiz: gestion_conflit; 16 seed depths |
| Identifier, traiter une demande client (300363) | 3.4 | 7 % | 8/15 | quiz: contact; 13 seed depths |
| Rendre compte de son activité (300462) | 3.3 | 7 % | 9/15 | quiz: fiabilite; 19 seed depths |
| Conseiller, accompagner une personne (300014) | 3.6 | 6 % | 7/15 | quiz: pedagogie; 16 seed depths |
| Présenter et valoriser un produit ou un service (300374) | 3.1 | 6 % | 9/15 | quiz: vente, presentation; 18 seed depths |
| Respecter des règles, des consignes, normes et procédures opérationnelles (300448) | 2.8 | 6 % | 9/15 | quiz: rigueur, fiabilite; 24 seed depths |

### Responsable de service en établissement touristique (G1403, Restauration, hôtellerie, loisirs)

In the top 40 for **9/15** (60 %): 4 quiz only, 5 seed and answers, 0 seed only. Median rank 6. ROME lists 63 skills for it. Personas: P1 (relation), P5 (relation), P6 (relation), P7 (relation), P9 (vente), P10 (organisation), quiz relation (relation), quiz vente (vente), quiz organisation (organisation).

| Carrying skill | idf | Share of its rarity | In inventories | Comes from |
|---|---|---|---|---|
| Principes de la relation client (478215) | 4.6 | 11 % | 7/15 | quiz: relation_client; 6 seed depths |
| Prévenir et résoudre les conflits (300441) | 3.2 | 10 % | 9/15 | quiz: gestion_conflit, besoin_harmonie; 15 seed depths |
| Répondre aux attentes d'un client (300364) | 2.9 | 8 % | 9/15 | quiz: contact; 23 seed depths |
| Recueillir et analyser les besoins client (300366) | 3.0 | 7 % | 8/15 | quiz: contact; 21 seed depths |
| Techniques de communication orales, écrites et numériques (100541) | 2.2 | 6 % | 9/15 | quiz: relation_client; 18 seed depths |
| Management d'équipe (109185) | 4.3 | 4 % | 4/15 | 11 seed depths |

### Secrétaire administratif / Secrétaire administrative de collectivité territoriale (M1602, Secrétariat, assistance)

In the top 40 for **9/15** (60 %): 6 quiz only, 3 seed and answers, 0 seed only. Median rank 23. ROME lists 52 skills for it. Personas: P1 (relation), P2 (analyse), P6 (relation), P9 (vente), P10 (organisation), quiz relation (relation), quiz analyse (analyse), quiz vente (vente), quiz organisation (organisation).

| Carrying skill | idf | Share of its rarity | In inventories | Comes from |
|---|---|---|---|---|
| Répondre aux demandes d'information internes et externes (518355) | 6.5 | 17 % | 7/15 | quiz: relation_client; 1 seed depths |
| Gérer des réclamations et litiges (300345) | 3.2 | 12 % | 9/15 | quiz: gestion_conflit; 16 seed depths |
| Accueillir, orienter, renseigner un public (300361) | 2.8 | 7 % | 8/15 | quiz: relation_client, contact; 26 seed depths |
| Techniques de communication orales, écrites et numériques (100541) | 2.2 | 7 % | 9/15 | quiz: relation_client; 18 seed depths |
| Rédaction d'écrits professionnels (489964) | 5.8 | 6 % | 3/15 | quiz: documentation; 2 seed depths |
| Organiser un rétroplanning (123475) | 5.8 | 6 % | 2/15 | quiz: coordination; 3 seed depths |

### Ingénieur / Ingénieure d'affaires en industrie (H1102, Industrie)

In the top 40 for **9/15** (60 %): 5 quiz only, 4 seed and answers, 0 seed only. Median rank 37. ROME lists 75 skills for it. Personas: P1 (relation), P2 (analyse), P4 (analyse), P5 (relation), P7 (relation), P9 (vente), quiz relation (relation), quiz analyse (analyse), quiz vente (vente).

| Carrying skill | idf | Share of its rarity | In inventories | Comes from |
|---|---|---|---|---|
| Présenter et valoriser un produit ou un service (300374) | 3.1 | 8 % | 9/15 | quiz: vente, presentation; 18 seed depths |
| Représenter sa structure ou son service lors d'un événement ou auprès d'instances de décision (404536) | 3.5 | 7 % | 7/15 | quiz: presentation; 17 seed depths |
| Recueillir et analyser les besoins client (300366) | 3.0 | 7 % | 8/15 | quiz: contact; 21 seed depths |
| Structurer, synthétiser des informations (300458) | 3.3 | 7 % | 6/15 | quiz: synthese; 13 seed depths |
| Convaincre, négocier (300415) | 3.8 | 7 % | 5/15 | quiz: persuasion; 13 seed depths |
| Contrôler des indicateurs de performance, analyser et corriger des écarts (300322) | 3.4 | 6 % | 5/15 | quiz: detection_incoherence, reporting; 14 seed depths |

### Enseignant / Enseignante de la conduite et de la sécurité routière (K2110, Enseignement, formation)

In the top 40 for **8/15** (53 %): 3 quiz only, 5 seed and answers, 0 seed only. Median rank 13. ROME lists 82 skills for it. Personas: P1 (relation), P5 (relation), P6 (relation), P7 (relation), P9 (vente), P10 (organisation), quiz relation (relation), quiz vente (vente).

| Carrying skill | idf | Share of its rarity | In inventories | Comes from |
|---|---|---|---|---|
| Gérer une situation conflictuelle (300480) | 3.5 | 11 % | 9/15 | quiz: gestion_conflit; 10 seed depths |
| Techniques d'écoute active et de médiation (404565) | 4.6 | 9 % | 5/15 | quiz: besoin_harmonie; 7 seed depths |
| Recueillir et analyser les besoins client (300366) | 3.0 | 8 % | 8/15 | quiz: contact; 21 seed depths |
| Accueillir, orienter, renseigner un public (300361) | 2.8 | 8 % | 8/15 | quiz: relation_client, contact; 26 seed depths |
| Enseigner, développer des compétences (300022) | 2.4 | 7 % | 8/15 | quiz: transmission, pedagogie; 19 seed depths |
| Evaluer la qualité et la conformité d'une formation (300251) | 5.3 | 4 % | 2/15 | 3 seed depths |

### Conseiller / Conseillère en information médicale (D1405, Commerce et vente)

In the top 40 for **8/15** (53 %): 5 quiz only, 3 seed and answers, 0 seed only. Median rank 25. ROME lists 39 skills for it. Personas: P1 (relation), P2 (analyse), P5 (relation), P6 (relation), P7 (relation), quiz relation (relation), quiz analyse (analyse), quiz vente (vente).

| Carrying skill | idf | Share of its rarity | In inventories | Comes from |
|---|---|---|---|---|
| Techniques d'écoute active (107926) | 4.2 | 22 % | 10/15 | quiz: empathie; 10 seed depths |
| Présenter et valoriser un produit ou un service (300374) | 3.1 | 12 % | 9/15 | quiz: vente, presentation; 18 seed depths |
| Recueillir et analyser les besoins client (300366) | 3.0 | 12 % | 8/15 | quiz: contact; 21 seed depths |
| Répondre aux attentes d'un client (300364) | 2.9 | 12 % | 9/15 | quiz: contact; 23 seed depths |
| Rédiger un rapport, un compte rendu d'activité (300408) | 1.9 | 6 % | 8/15 | quiz: ecriture; 38 seed depths |
| Logiciels de gestion de base de données (100113) | 4.3 | 6 % | 3/15 | quiz: numerique; 9 seed depths |

### Chargé / Chargée d'affaires bancaires (C1203, Banque, assurance, immobilier)

In the top 40 for **8/15** (53 %): 5 quiz only, 3 seed and answers, 0 seed only. Median rank 16. ROME lists 54 skills for it. Personas: P2 (analyse), P3 (terrain), P4 (analyse), P8 (terrain), P10 (organisation), quiz analyse (analyse), quiz terrain (terrain), quiz organisation (organisation).

| Carrying skill | idf | Share of its rarity | In inventories | Comes from |
|---|---|---|---|---|
| Respecter des règles, des consignes, normes et procédures opérationnelles (300448) | 2.8 | 15 % | 9/15 | quiz: rigueur, fiabilite; 24 seed depths |
| Prendre une décision et l'expliquer (300459) | 4.1 | 14 % | 5/15 | quiz: decision_incertitude; 10 seed depths |
| Concevoir des outils de pilotage, indicateurs, tableaux de bord (300321) | 3.9 | 13 % | 6/15 | quiz: systemes, scalabilite, reporting; 8 seed depths |
| Faire preuve de sens des responsabilités (300461) | 2.0 | 11 % | 9/15 | quiz: fiabilite; 28 seed depths |
| Concevoir et gérer un projet (300488) | 2.4 | 8 % | 9/15 | quiz: organisation; 28 seed depths |
| Structurer, synthétiser des informations (300458) | 3.3 | 7 % | 6/15 | quiz: synthese; 13 seed depths |

### Conseiller / Conseillère clientèle à distance (D1408, Commerce et vente)

In the top 40 for **7/15** (47 %): 3 quiz only, 4 seed and answers, 0 seed only. Median rank 5. ROME lists 45 skills for it. Personas: P1 (relation), P5 (relation), P6 (relation), P7 (relation), P9 (vente), quiz relation (relation), quiz vente (vente).

| Carrying skill | idf | Share of its rarity | In inventories | Comes from |
|---|---|---|---|---|
| Répondre aux appels téléphoniques, mails, tchat et renseigner les clients (485132) | 5.4 | 15 % | 7/15 | quiz: relation_client; 1 seed depths |
| Proposer des solutions adaptées aux besoins spécifiques des clients (501073) | 4.8 | 13 % | 7/15 | quiz: relation_client; 6 seed depths |
| Principes de la relation client (478215) | 4.6 | 13 % | 7/15 | quiz: relation_client; 6 seed depths |
| Identifier, traiter une demande client (300363) | 3.4 | 9 % | 8/15 | quiz: contact; 13 seed depths |
| Présenter et valoriser un produit ou un service (300374) | 3.1 | 8 % | 9/15 | quiz: vente, presentation; 18 seed depths |
| Techniques de communication orales, écrites et numériques (100541) | 2.2 | 6 % | 9/15 | quiz: relation_client; 18 seed depths |

### Guichetier vendeur / Guichetière vendeuse (C1211, Banque, assurance, immobilier)

In the top 40 for **7/15** (47 %): 3 quiz only, 4 seed and answers, 0 seed only. Median rank 10. ROME lists 45 skills for it. Personas: P1 (relation), P5 (relation), P6 (relation), P7 (relation), P9 (vente), quiz relation (relation), quiz vente (vente).

| Carrying skill | idf | Share of its rarity | In inventories | Comes from |
|---|---|---|---|---|
| Principes de la relation client (478215) | 4.6 | 15 % | 7/15 | quiz: relation_client; 6 seed depths |
| Conseiller, accompagner une personne (300014) | 3.6 | 12 % | 7/15 | quiz: pedagogie; 16 seed depths |
| Identifier, traiter une demande client (300363) | 3.4 | 11 % | 8/15 | quiz: contact; 13 seed depths |
| Présenter et valoriser un produit ou un service (300374) | 3.1 | 10 % | 9/15 | quiz: vente, presentation; 18 seed depths |
| Accueillir, orienter, renseigner un public (300361) | 2.8 | 9 % | 8/15 | quiz: relation_client, contact; 26 seed depths |
| Techniques de gestion du stress (478065) | 3.5 | 5 % | 3/15 | 18 seed depths |

### Agent / Agente d'Escale Commerciale aéroportuaire (AEC) (N2201, Transport, logistique)

In the top 40 for **7/15** (47 %): 3 quiz only, 4 seed and answers, 0 seed only. Median rank 13. ROME lists 47 skills for it. Personas: P1 (relation), P5 (relation), P6 (relation), P7 (relation), P9 (vente), quiz relation (relation), quiz vente (vente).

| Carrying skill | idf | Share of its rarity | In inventories | Comes from |
|---|---|---|---|---|
| Identifier, traiter une demande client (300363) | 3.4 | 25 % | 8/15 | quiz: contact; 13 seed depths |
| Répondre aux attentes d'un client (300364) | 2.9 | 22 % | 9/15 | quiz: contact; 23 seed depths |
| Accueillir, orienter, renseigner un public (300361) | 2.8 | 21 % | 8/15 | quiz: relation_client, contact; 26 seed depths |
| Travailler en groupe, en réseau (300470) | 3.1 | 7 % | 4/15 | 19 seed depths |
| Utiliser les outils numériques (300426) | 1.9 | 6 % | 4/15 | 32 seed depths |
| Analyser les retours d'expérience pour améliorer les processus (483650) | 5.5 | 6 % | 2/15 | 4 seed depths |

### Agent administratif / Agente administrative banque ou assurance (C1401, Banque, assurance, immobilier)

In the top 40 for **7/15** (47 %): 3 quiz only, 4 seed and answers, 0 seed only. Median rank 18. ROME lists 55 skills for it. Personas: P1 (relation), P5 (relation), P6 (relation), P7 (relation), P9 (vente), quiz relation (relation), quiz vente (vente).

| Carrying skill | idf | Share of its rarity | In inventories | Comes from |
|---|---|---|---|---|
| Identifier, traiter une demande client (300363) | 3.4 | 11 % | 8/15 | quiz: contact; 13 seed depths |
| Gérer des réclamations et litiges (300345) | 3.2 | 10 % | 9/15 | quiz: gestion_conflit; 16 seed depths |
| Recueillir et analyser les besoins client (300366) | 3.0 | 9 % | 8/15 | quiz: contact; 21 seed depths |
| Accueillir, orienter, renseigner un public (300361) | 2.8 | 9 % | 8/15 | quiz: relation_client, contact; 26 seed depths |
| Réaliser la gestion administrative des contrats (117290) | 5.0 | 5 % | 2/15 | 6 seed depths |
| Contrôler et faire appliquer le respect de dispositions légales et réglementaires (300339) | 3.0 | 4 % | 4/15 | 21 seed depths |

### Conseiller / Conseillère technique agricole (A1304, Agriculture, nature, animaux)

In the top 40 for **7/15** (47 %): 5 quiz only, 2 seed and answers, 0 seed only. Median rank 22. ROME lists 61 skills for it. Personas: P1 (relation), P2 (analyse), P5 (relation), P7 (relation), quiz relation (relation), quiz analyse (analyse), quiz vente (vente).

| Carrying skill | idf | Share of its rarity | In inventories | Comes from |
|---|---|---|---|---|
| Techniques d'écoute active (107926) | 4.2 | 13 % | 10/15 | quiz: empathie; 10 seed depths |
| Analyser, résoudre un problème courant ou complexe (300082) | 4.9 | 13 % | 8/15 | quiz: analyse, diagnostic; 8 seed depths |
| Présenter et valoriser un produit ou un service (300374) | 3.1 | 7 % | 9/15 | quiz: vente, presentation; 18 seed depths |
| Recueillir et analyser les besoins client (300366) | 3.0 | 7 % | 8/15 | quiz: contact; 21 seed depths |
| Défendre un projet devant un comité de pilotage, des collaborateurs ou des partenaires (118943) | 4.4 | 6 % | 5/15 | quiz: assurance; 9 seed depths |
| Préparer et animer une réunion, un groupe de travail, un atelier (300469) | 2.6 | 6 % | 8/15 | quiz: presentation; 23 seed depths |

### Educateur sportif / Educatrice sportive (G1204, Restauration, hôtellerie, loisirs)

In the top 40 for **7/15** (47 %): 3 quiz only, 4 seed and answers, 0 seed only. Median rank 22. ROME lists 78 skills for it. Personas: P1 (relation), P5 (relation), P6 (relation), P7 (relation), P9 (vente), quiz relation (relation), quiz vente (vente).

| Carrying skill | idf | Share of its rarity | In inventories | Comes from |
|---|---|---|---|---|
| Accueillir, orienter, renseigner un public (300361) | 2.8 | 13 % | 8/15 | quiz: relation_client, contact; 26 seed depths |
| Enseigner, développer des compétences (300022) | 2.4 | 11 % | 8/15 | quiz: transmission, pedagogie; 19 seed depths |
| Techniques de communication orales, écrites et numériques (100541) | 2.2 | 10 % | 9/15 | quiz: relation_client; 18 seed depths |
| Mettre en oeuvre des actions de communication (300110) | 3.5 | 7 % | 3/15 | 15 seed depths |
| Construire des relations professionnelles durables avec les clients et les fournisseurs (116224) | 4.6 | 6 % | 3/15 | 7 seed depths |
| Assurer la gestion administrative d'une activité (124377) | 2.4 | 5 % | 3/15 | 30 seed depths |

### Secrétaire technique (M1605, Secrétariat, assistance)

In the top 40 for **7/15** (47 %): 5 quiz only, 2 seed and answers, 0 seed only. Median rank 24. ROME lists 75 skills for it. Personas: P1 (relation), P2 (analyse), P6 (relation), P9 (vente), quiz relation (relation), quiz analyse (analyse), quiz vente (vente).

| Carrying skill | idf | Share of its rarity | In inventories | Comes from |
|---|---|---|---|---|
| Répondre aux appels téléphoniques, mails, tchat et renseigner les clients (485132) | 5.4 | 18 % | 7/15 | quiz: relation_client; 1 seed depths |
| Accueillir, orienter, renseigner un public (300361) | 2.8 | 9 % | 8/15 | quiz: relation_client, contact; 26 seed depths |
| Techniques de communication orales, écrites et numériques (100541) | 2.2 | 7 % | 9/15 | quiz: relation_client; 18 seed depths |
| Techniques de reporting (479290) | 5.2 | 7 % | 3/15 | quiz: reporting; 4 seed depths |
| Classer des documents (121718) | 4.6 | 6 % | 3/15 | quiz: administration; 4 seed depths |
| Mettre à jour un dossier, une base de données (300431) | 3.0 | 6 % | 6/15 | quiz: gestion_donnees; 20 seed depths |

### Architecte d'intérieur (F1102, Bâtiment, travaux publics)

In the top 40 for **7/15** (47 %): 3 quiz only, 4 seed and answers, 0 seed only. Median rank 20. ROME lists 89 skills for it. Personas: P1 (relation), P5 (relation), P6 (relation), P7 (relation), P9 (vente), quiz relation (relation), quiz vente (vente).

| Carrying skill | idf | Share of its rarity | In inventories | Comes from |
|---|---|---|---|---|
| Identifier, traiter une demande client (300363) | 3.4 | 17 % | 8/15 | quiz: contact; 13 seed depths |
| Accueillir, orienter, renseigner un public (300361) | 2.8 | 14 % | 8/15 | quiz: relation_client, contact; 26 seed depths |
| Promouvoir une proposition, un projet (300418) | 4.0 | 11 % | 5/15 | quiz: persuasion; 14 seed depths |
| Elaborer, adapter une proposition commerciale (300377) | 3.8 | 8 % | 4/15 | quiz: vente; 10 seed depths |
| Coordonner l'intervention d'équipes pluridisciplinaires (300472) | 3.7 | 5 % | 3/15 | 13 seed depths |
| Gérer la relation avec les fournisseurs, sous-traitants, prestataires (300316) | 3.7 | 5 % | 3/15 | 15 seed depths |

### Architecte du bâtiment (F1101, Bâtiment, travaux publics)

In the top 40 for **7/15** (47 %): 3 quiz only, 4 seed and answers, 0 seed only. Median rank 31. ROME lists 65 skills for it. Personas: P1 (relation), P5 (relation), P6 (relation), P7 (relation), P9 (vente), quiz relation (relation), quiz vente (vente).

| Carrying skill | idf | Share of its rarity | In inventories | Comes from |
|---|---|---|---|---|
| Identifier, traiter une demande client (300363) | 3.4 | 16 % | 8/15 | quiz: contact; 13 seed depths |
| Répondre aux attentes d'un client (300364) | 2.9 | 13 % | 9/15 | quiz: contact; 23 seed depths |
| Promouvoir une proposition, un projet (300418) | 4.0 | 10 % | 5/15 | quiz: persuasion; 14 seed depths |
| Elaborer, adapter une proposition commerciale (300377) | 3.8 | 7 % | 4/15 | quiz: vente; 10 seed depths |
| Concevoir et gérer un projet (300488) | 2.4 | 6 % | 9/15 | quiz: organisation; 28 seed depths |
| Prospecter de nouveaux clients, de nouveaux marchés (300371) | 4.2 | 5 % | 2/15 | quiz: vente; 13 seed depths |

### Ingénieur / Ingénieure de maintenance industrielle (I1102, Maintenance)

In the top 40 for **7/15** (47 %): 5 quiz only, 2 seed and answers, 0 seed only. Median rank 10. ROME lists 75 skills for it. Personas: P2 (analyse), P3 (terrain), P4 (analyse), P10 (organisation), quiz analyse (analyse), quiz terrain (terrain), quiz organisation (organisation).

| Carrying skill | idf | Share of its rarity | In inventories | Comes from |
|---|---|---|---|---|
| Concevoir des supports de suivi et de gestion (300324) | 4.9 | 9 % | 6/15 | quiz: systemes; 7 seed depths |
| Prendre une décision et l'expliquer (300459) | 4.1 | 6 % | 5/15 | quiz: decision_incertitude; 10 seed depths |
| Organiser le travail d'une équipe (300436) | 3.2 | 6 % | 6/15 | quiz: organisation, leadership; 17 seed depths |
| Entretenir un équipement, une machine, une installation (300181) | 3.1 | 6 % | 7/15 | quiz: support; 14 seed depths |
| Faire preuve de sens des responsabilités (300461) | 2.0 | 5 % | 9/15 | quiz: fiabilite; 28 seed depths |
| Réaliser un diagnostic technique (300185) | 3.3 | 5 % | 6/15 | quiz: resolution; 14 seed depths |

### Chef / Cheffe d'équipe en industrie (H2504, Industrie)

In the top 40 for **7/15** (47 %): 5 quiz only, 2 seed and answers, 0 seed only. Median rank 18. ROME lists 75 skills for it. Personas: P2 (analyse), P3 (terrain), P8 (terrain), P10 (organisation), quiz analyse (analyse), quiz terrain (terrain), quiz organisation (organisation).

| Carrying skill | idf | Share of its rarity | In inventories | Comes from |
|---|---|---|---|---|
| Rendre compte de son activité (300462) | 3.3 | 12 % | 9/15 | quiz: fiabilite; 19 seed depths |
| Entretenir un équipement, une machine, une installation (300181) | 3.1 | 8 % | 7/15 | quiz: support; 14 seed depths |
| Elaborer des processus et des modes opératoires techniques (300146) | 3.6 | 7 % | 5/15 | quiz: systemes, scalabilite; 11 seed depths |
| Faire preuve de sens des responsabilités (300461) | 2.0 | 7 % | 9/15 | quiz: fiabilite; 28 seed depths |
| Préparer du matériel en prévision d'un travail (300152) | 3.4 | 7 % | 4/15 | quiz: terrain; 11 seed depths |
| Réaliser un diagnostic technique (300185) | 3.3 | 7 % | 6/15 | quiz: resolution; 14 seed depths |

## Honesty

Violations across all 66 personas: none.

