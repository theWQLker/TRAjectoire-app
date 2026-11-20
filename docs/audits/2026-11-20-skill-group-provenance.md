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
