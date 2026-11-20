# Skill groups: skills copied from one job's fiche

Date: 2026-11-20. Source: `config/clusters.ts`, `config/quiz.ts` (quiz `fuller-40q-v1`).

**Question.** A skill group (cluster) turns quiz answers into ROME skills. Some skills
were copied from one job's fiche and annotated with that job's code. A skill like that
pulls its source job up for anyone whose answers feed the group, even when no answer
says anything about that skill. Each annotated skill is checked against the answers
that feed its group.

**Result.** 34 annotated skills in 3 groups. Two groups (`paie`, `food`) are fed by no
quiz answer at all, so their skills never reach an inventory through the quiz. They
only reach one through the seed step. `relation_client` is the only live case.

Verdicts:
- **evidenced**: a feeding answer says it.
- **weak**: an answer is close, but the skill says more than the answer.
- **not evidenced**: no feeding answer says anything like it.

Changed in this pass (decision 2026-11-20): the two sales skills only. Every other
verdict below is reported, not acted on.

## relation_client — fed by 3 answers

| Answer | Weight | Option text |
|---|---|---|
| `sf_numbers_people` B | ×2 | « Échanger avec des personnes, comprendre leurs demandes, gérer la relation. » |
| `sf_client_issue` B | ×2 | « Je rassure d'abord, puis je fais avancer la demande. » |
| `g_conflict` A | ×1 | « J'appelle, je clarifie, je gère la tension. » |

| Code | From | Skill | Verdict | Status |
|---|---|---|---|---|
| 121862 | D1408 | Techniques de vente par téléphone | not evidenced (no answer mentions selling) | **removed** |
| 100381 | D1408 | Argumentation commerciale | not evidenced | **removed** |
| 478215 | D1408 | Principes de la relation client | evidenced: « gérer la relation » | kept |
| 501073 | D1408 | Proposer des solutions adaptées aux besoins clients | evidenced: « comprendre leurs demandes » + « je fais avancer la demande » | kept |
| 122327 | M1704 | Recueillir l'avis et les remarques d'un client | weak: « comprendre leurs demandes » is about requests, not feedback | kept, flagged |
| 124094 | M1704 | Traiter les demandes de support technique | not evidenced: no answer mentions anything technical | kept, flagged |
| 100541 | M1704 | Techniques de communication orales, écrites et numériques | evidenced: « échanger », « j'appelle » | kept |
| 300184 | M1810 | Apporter une assistance technique aux équipes | not evidenced (technical, internal teams) | kept, flagged |
| 109971 | M1810 | Diagnostiquer la nature/origine des incidents | not evidenced here (a separate `diagnostic` group covers that answer) | kept, flagged |
| 101901 | G1803 | Accueillir le client et l'installer | not evidenced: restaurant seating | kept, flagged |
| 104324 | G1803 | Prendre une commande client | not evidenced: sales and catering | kept, flagged |
| 300556 | G1803 | Conseiller le client dans ses choix | weak: advising on purchases ≠ understanding a request | kept, flagged |
| 403015 | G1803 | Garantir la satisfaction du client | evidenced: « je rassure … je fais avancer la demande » | kept |
| 300361 | M1607 | Accueillir, orienter, renseigner un public | evidenced: « échanger … comprendre leurs demandes » | kept |
| 485132 | M1607 | Répondre aux appels téléphoniques, mails, tchat et renseigner les clients | evidenced: « j'appelle », « comprendre leurs demandes » | kept |
| 518355 | M1607 | Répondre aux demandes d'information internes et externes | evidenced: « comprendre leurs demandes » | kept |

Flagged and not evidenced: 124094, 300184, 109971, 101901, 104324. Weak: 122327, 300556.
Removing them would move ranking for every client-relations profile, so each one needs a
before/after and a decision.

## paie — fed by no quiz answer

9 annotated skills (M1203 ×2, M1501 ×4, M1607 ×3). No scene maps to `paie`, so this
group never enters an inventory through the quiz. HR and payroll reach the engine only
through the seed step (`admin:rh`, `admin:compta`). See the HR diagnosis in the
2026-11-20 report.

## food — fed by no quiz answer

9 annotated skills (G1602 ×5, G1803 ×4). Same situation: catering reaches the engine
only through the seed step (`hotellerie:*`).

## Every group — evidence rule applied (second pass, 2026-11-20)

Rule (decision 2026-11-20): a skill stays in a group only if an answer feeding that
group evidences it. How a verdict is read, so the line is the same in every group:

- **evidenced**: a feeding answer names the act the skill names.
- **weak**: a feeding answer names the act, but the skill ties it to an object or
  setting no answer names (metal, wood, a product, a production, a patient…). Kept,
  listed here for a decision.
- **not evidenced**: no feeding answer names the act at all. Removed.

This is the same line the relation_client pass drew: « conseiller le client dans
ses choix de plats » (advise, narrowed to food) was weak; « prendre une commande »
(an act no answer names) was not evidenced.

### Removed (not evidenced)

| Group | Code | Skill | Why |
|---|---|---|---|
| gestion_donnees | 300452 | Collecter et analyser des données | « vérifier, calculer, classer » / « je nettoie, je range » neither collect nor analyse (kept in `investigation`, where « je reconstruis le chemin » collects) |
| organisation | 300261 | Organiser et contrôler un approvisionnement | no answer speaks of supplies or purchasing |
| support | 300019 | Accompagner l'appropriation d'un outil par ses utilisateurs | no answer speaks of helping users take up a tool |
| decision_incertitude | 300474 | Alerter, demander un appui ou un arbitrage | the feeding answers say the opposite (« je décide ») |
| priorisation | 300435 | Optimiser les effectifs, l'allocation des ressources | the answer is about one's own tasks |
| pedagogie | 300024 | Concevoir des supports de formation | the feeding answers are oral explanation |
| iteration | 101315 | Analyse de données expérimentales | « une première version, puis je corrige » analyses nothing |
| creation | 122452 | Promouvoir une oeuvre | making is not promoting |
| apprentissage | 300383 | Réaliser une veille de marché, concurrentielle | learning a subject is not watching a market |

### Weak (kept, for a decision)

| Group | Code | Skill | Answer that comes close |
|---|---|---|---|
| relation_client | 122327 | Recueillir l'avis et les remarques d'un client | « comprendre leurs demandes » (requests, not feedback) |
| relation_client | 300556 | Conseiller le client dans ses choix de boissons ou plats | « comprendre leurs demandes » (food) |
| terrain | 300210 | Transformer une matière première | « faire avec mes mains » |
| terrain | 300152 | Préparer du matériel en prévision d'un travail | « faire avec mes mains » |
| organisation | 300488 | Concevoir et gérer un projet | « organiser les étapes » (concevoir is more) |
| vente | 300368 300371 300374 300377 | Vendre / prospecter / présenter un produit / proposition commerciale | « convaincre, négocier, lancer une conversation » never says sell |
| persuasion | 300413 | Prendre la parole en public | « convaincre » (public is more) |
| systemes | 300321 | Concevoir des outils de pilotage, tableaux de bord | « une solution réutilisable » |
| systemes, scalabilite | 300146 | Elaborer des processus et modes opératoires techniques | « remettre de l'ordre », « réutilisable » (techniques is more) |
| rigueur | 300446 | Respecter les règles QHSSE | « appliquer des règles précises » (health-safety) |
| decision_incertitude | 300353 | Evaluer une situation à risques | « je décide » |
| autonomie | 300483 | Organiser son travail selon les priorités | « je décide, puis j'ajuste » |
| detection_incoherence | 300253 300256 300322 | Contrôler conformité des données / d'un livrable / indicateurs | « je repère les détails qui peuvent bloquer » |
| priorisation | 300464 | Gérer un planning | « celle qui aura le plus d'impact » |
| leadership | 300434 | Déléguer, responsabiliser | « je prends la responsabilité » |
| fiabilite | 300462 | Rendre compte de son activité | « je fais bien ma partie » |
| pedagogie | 300014 | Conseiller, accompagner une personne | « j'explique jusqu'à ce qu'il soit autonome » |
| ecriture | 300188 | Rédiger un cahier des charges, des spécifications techniques | « écrire clairement » |
| presentation | 300469 300374 404536 | Animer une réunion / présenter un produit / représenter sa structure | « expliquer à l'oral » |
| creation | 102531 120869 108930 | Infographie / logiciels vidéo / espace scénique | « visuel, vidéo, mise en scène » in the prompt |
| manuel | 300210 300231 121501 403004 | Transformer la matière / tailler / assembler du métal / façonner du bois sur CN | « faire avec mes mains » |
| technique | 300170 498240 121612 | Machines du bois / maintenance préventive / installations électriques | « réparer, faire fonctionner » |
| investigation | 404187 300067 | Rechercher des données scientifiques / exploiter des données | « je reconstruis le chemin » |
| diagnostic | 120790 | Identifier les anomalies d'une **production** | « je reconstruis le chemin » (client issue, logs) |
| reporting | 479290 484319 300321 300322 480403 | reporting, KPI, tableaux de bord, reporting financier | « ce que les données montrent » |
| qualite | 300255 | Contrôler la qualité et la conformité d'un **produit** | « je repère les détails », « je rends fiable » (a file) |
| qualite | 124842 402085 | Données qualité / conformité des processus de **production** | « un processus compliqué … les détails qui peuvent bloquer » |
| empathie | 404513 107907 300035 | Accompagner un patient / une famille / l'autonomie | « je rassure », « j'aide » |
| besoin_harmonie | 300036 498298 404565 | médiation | « j'aide quand même pour éviter la tension » |
| apprentissage | 300081 | Veille technique | « les bases, les mots et les règles » |
| planification | 300174 | Elaborer et planifier un programme de **production** | « organiser les étapes », « je suis les statuts » (a dossier) |
| numerique | 100113 485267 | Logiciels de base de données / de gestion de stock | « je règle les étapes, les statuts, les champs » |
| assurance | 118943 | Défendre un projet devant un comité | « droit au sujet avec des faits » |

The four **production** codes (120790, 300174, 300255, 402085) matter most: they put
Chef d'équipe en industrie (H2504) and the industrial planning jobs (H1401, H1402,
H1407) at the top for a secretary or an HR assistant. Their effect is measured in the
vocabulary-reach report.
