# Quiz options that state a context or a preference but inject skills

Date: 2026-11-22. Tree: `vocab-reach` after d162bf5.

**Rule (decision 2026-11-22).** An option that states a work context or a preference
feeds the lean (cluster scores) and the interest profile (RIASEC) only, never
competence codes. Mechanism: `contextOnly: true` on the option's `maps`
(`config/quiz.ts`); `buildInventory` then counts its clusters for the lean but not
for code injection. Weights stay as they are.

**Applied:** `f_energy_context` B « Dans l'action, avec du mouvement et des
échanges. » (adaptabilite ×2, terrain ×1, contact ×1: 11 skills). Nothing else is
changed: the list below waits for a decision.

**How an option is read here.** *Context or preference*: the option says where the
person likes to work, what gives or takes their energy, or what they need before
acting. *Evidence*: the option says what the person does in the scene. Options of
the second kind stay as they are, even when phrased « je préfère ».

Skills each cluster injects:

| Cluster | Skills |
|---|---|
| analyse | 300456 Analyser une situation et produire un diagnostic · 300082 Analyser, résoudre un problème · 300067 Analyser, exploiter, structurer des données |
| autonomie | 300460 Faire preuve d'autonomie · 300483 Organiser son travail selon les priorités |
| contact | 300361 Accueillir, orienter, renseigner un public · 300363 Identifier, traiter une demande client · 300364 Répondre aux attentes d'un client · 300366 Recueillir et analyser les besoins client |
| rigueur | 300490 Rigueur et précision · 300448 Respecter des règles et procédures · 300446 Respecter les règles QHSSE |
| fiabilite | 300461 Sens des responsabilités · 300462 Rendre compte de son activité · 300448 Respecter des règles et procédures |
| documentation | 489964 Rédaction d'écrits professionnels |

## Clear cases (same pattern as the decided one)

| Scene / option | Text | Clusters → skills injected | Why it is context, not a skill |
|---|---|---|---|
| f_energy_context / A | « Au calme, avec du temps pour me concentrer. » | analyse ×2, autonomie ×1 → 5 | The twin of the decided option: the scene asks « Dans quel cadre tu réfléchis le mieux ? ». A setting, not an act. |
| g_group_energy / A | « Ça me stimule si les échanges ont un objectif clair. » | contact ×2 → 4 | What gives energy. Liking purposeful exchanges does not show reception or client-handling skills. |
| g_group_energy / B | « Ça me fatigue, même quand les gens sont corrects. » | autonomie ×1, analyse ×1 → 5 | What takes energy. Being tired by interaction is not evidence of analysis or autonomy. |

Measured in memory (not committed): marking these three as context-only takes
answers-only reach from 40 to **41 / 110** (N22 27 → 19) and loses no domain.

## Borderline (a preference, but tied to how the person acts)

| Scene / option | Text | Clusters → skills injected | For context | For evidence |
|---|---|---|---|---|
| f_decide_wait / B | « J'attends d'avoir plus d'éléments. » | rigueur ×1 → 3 | A need before acting. | Waiting for facts is a careful way of working. |
| g_status_authority / B | « Je préfère avoir un script ou une validation avant. » | rigueur ×1 → 3 | A need for cover before speaking. | Preparing, following a script is procedural rigour. |
| g_lead_support / B | « Je préfère tenir mon rôle correctement. » | fiabilite ×2, rigueur ×1 → 5 | A role preference. | Doing one's role well is reliability. |
| sf_create_express / B | « Pas vraiment. Je préfère livrer ce qui est demandé. » | fiabilite ×1 → 3 | Mostly a « no » to creating. | « Livrer ce qui est demandé » is delivery on a brief. |
| sf_project_followup / B | « Je fais bien ma partie et j'attends la suite. » | fiabilite ×2 → 3 | A preference to stay in one's lane. | Doing one's part well. |
| f_surface_depth / B | « J'ai besoin de comprendre ce qui se passe vraiment. » | analyse ×2, detection_incoherence ×2, diagnostic ×1 → 6 | Phrased as a need. | The scene is about checking an explanation: the answer is an analytic act. |
| g_conflict / B | « Je préfère préparer une réponse écrite ou un cadre clair. » | documentation ×1 → 1 | Phrased as a preference. | It names an act: writing the reply. |
| sf_write_explain / A and B | « Je préfère écrire clairement… » / « Je préfère expliquer à l'oral… » | ecriture, synthese, documentation / presentation, pedagogie, contact → 5 / 9 | Phrased as preferences. | In « Ce que tu sais déjà faire », each names the act (write, explain orally). |

Adding the first four borderline options to the three clear ones gives the same
41 / 110 in memory: they change the order inside the top 20 but no domain's reach.

My recommendation: mark the three clear cases; leave the borderline ones, whose
skills are generic soft skills (rigueur, fiabilité) that barely rank anything.

## Not flagged

Every other option that injects skills states an act in its scene (« je
reconstruis le chemin », « je règle les étapes », « j'appelle, je clarifie »…). The
contraintes and argent scenes inject nothing.

## Side finding (evidence, not context)

`f_ambiguous_instruction` / A « Je pose des questions avant de commencer. » feeds
`documentation` ×1, whose only skill is 489964 Rédaction d'écrits professionnels.
Asking questions is not writing. The skill stays evidenced by other answers that
feed the same group (« écrire clairement », « une réponse écrite »), so the
evidence rule holds group by group, but this one answer adds a writing skill on
its own. Listed for the same decision.
