# Quiz — Full Spec (5 categories)

Locked format from the approved template. French-facing, soft-lean relief-scenes, "les deux / ni l'un ni l'autre" always open, deterministic hidden mapping. Tune mappings against real-world testing + the live ROME graph (P5) — these are the v1 starting weights, not final.

Answer model (every scene): `plutôt A / un peu A / un peu B / plutôt B` + `les deux` + `ni l'un ni l'autre`.
- plutôt = full weight, un peu = half weight, les deux = half to BOTH sides, ni l'un = nothing (mild low-fit signal, tie-break only).

Mapping notation: `cluster +N (RIASEC)`. Clusters defined in §6 below.

---

## Category 1 — « Comment tu fonctionnes » (5 scenes)
Intro: *On commence par toi, pas par les métiers. Choisis ce qui te ressemble. Pas de bonne réponse.*

**1.1 order vs improvisation** — arrives on a chaotic project.
A. soulagement, un truc à remettre d'aplomb → `systemes +2 (C/I)`
B. avancer au feeling, structurer plus tard → `adaptabilite +2 (R/E)`

**1.2 surface vs depth** — given a plausible explanation for a problem.
A. ça suffit, tu avances → `execution +1`
B. ça te gratte, tu creuses le vrai mécanisme → `analyse +2 (I)` `detection_incoherence +2`

**1.3 leverage vs completeness** — ten tasks, no time for all.
A. celle qui change le plus, tant pis pour le reste → `leverage +2 (E/I)` `priorisation +1`
B. tout proprement dans l'ordre → `rigueur +2 (C)`

**1.4 decide-on-incomplete vs wait** — must decide, info incomplete/fuzzy.
A. tu tranches, t'ajustes après → `decision_incertitude +2 (E)` `autonomie +1`
B. tu attends d'y voir clair → `besoin_clarte +1 (C)`

**1.5 build-to-scale vs do-the-task** — one-off request.
A. tu construis un système réutilisable → `systemes +2 (C/I)` `scalabilite +2`
B. tu fais le truc simple et tu passes → `execution +1` `pragmatisme +1`

---

## Category 2 — « Ce que tu sais déjà faire » (3 scenes)
Intro: *Maintenant le concret. Ce que tu as vraiment fait, même si ça te paraît banal.*
Note: this is the evidence layer — answers are "ça me parle / je l'ai fait" leans, multi-select tolerant. Maps to the hard-skill clusters that bridge into ROME directly.

**2.1 numbers/rules vs people/contact** — which workday feels easy.
A. vérifier, calculer, respecter des règles précises → `rigueur +2 (C)` `gestion_donnees +2`
B. parler aux gens, gérer leurs demandes → `contact +2 (S)` `relation_client +2`

**2.2 hands/making vs organising/coordinating** — what you reach for.
A. faire de tes mains, un service rapide, un résultat concret → `terrain +2 (R)` `food +1`
B. organiser, planifier, coordonner les autres → `organisation +2 (C/E)`

**2.3 sell/convince vs fix/operate** — where you're at ease.
A. convaincre, négocier, ouvrir une conversation → `vente +2 (E)` `persuasion +1`
B. réparer, faire tourner, résoudre un problème technique → `resolution +2 (R/I)` `support +1`

---

## Category 3 — « Toi avec les gens » (3 scenes)
Intro: *Comment tu es avec les autres, au travail. Pas ta personnalité entière, juste au boulot.*

**3.1 conflict comfort** — three unhappy clients to call back.
A. ça va, tu décroches, tu gères → `contact +2 (S)` `gestion_conflit +1`
B. tu préfères éviter, ça te coûte → `besoin_calme +1`

**3.2 lead vs support** — a shift/team needs running.
A. tu prends le lead naturellement → `leadership +2 (E)`
B. tu préfères bien tenir ton poste → `fiabilite +1 (C)`

**3.3 teach vs do** — someone doesn't get it.
A. tu expliques, tu transmets, ça te plaît → `transmission +2 (S)` `pedagogie +1`
B. tu fais à leur place, plus rapide → `execution +1`

---

## Category 4 — « Tes contraintes réelles » (3 scenes)
Intro: *Le réel maintenant. Ce qui limite ou cadre ton choix. Sois honnête, c'est ce qui rend les résultats utiles.*
Note: maps to tension/constraint signals, not clusters — feeds filtering + the honest fork.

**4.1 hours** — A. horaires fixes, prévisibles `tension:hours=fixed` · B. je peux flexer, soirs/week-ends `tension:hours=flexible`
**4.2 mobility** — A. local only `tension:mobility=local` · B. je bouge / déménage `tension:mobility=mobile`
**4.3 timeline** — A. il me faut du boulot maintenant `urgency=now` · B. j'explore, j'ai le temps `urgency=exploring`
Plus quick picks (not scenes): département (75/92/93/94…), diplôme (aucun/CAP/Bac/Bac+2/Bac+3+).

---

## Category 5 — « Argent & autonomie » (3 scenes)
Intro: *Dernier volet. Ça ne change pas ce que tu sais faire, mais ça oriente vers ce qui te conviendrait vraiment.*
**PREMIUM HOOK: these answers are captured and stored now. The financial model that USES them is Phase 2 / paid. Build captures inputs, models nothing.**

**5.1 security vs upside** — two job offers.
A. stable, prévisible, je sais ce que je gagne → `appetit_risque=low (C)`
B. moins sûr mais ça peut monter plus haut → `appetit_risque=high (E)`

**5.2 employee vs own-thing** — picture five years out.
A. un bon poste, dans une boîte solide → `pull_autonomie=low`
B. mon propre truc, même si c'est plus dur → `pull_autonomie=high (E)`

**5.3 floor** — quick input, not a scene: salaire minimum acceptable (tranches) + situation actuelle (en poste / au chômage / étudiant / indépendant). `captured for financial model, Phase 2`

---

## §6 — Cluster vocabulary required (THE REAL WORK)

These clusters must exist in `clusters.ts`, each mapped to RIASEC letters AND to real ROME competency codes so the leap-graph can bridge them. **v1 starting set — validate ROME-code mappings against the live 532-métier graph in P5.** A cluster with no real ROME codes surfaces nothing.

**Transversal / meta (from Cat 1 & 3):**
`systemes, analyse, leverage, rigueur, adaptabilite, decision_incertitude, autonomie, detection_incoherence, scalabilite, execution, priorisation, pragmatisme, besoin_clarte, leadership, fiabilite, transmission, pedagogie, gestion_conflit, besoin_calme`

**Hard-skill (from Cat 2 — these bridge directly to ROME métiers):**
`paie, relation_client, food (existing); gestion_donnees, contact, terrain, organisation, vente, persuasion, resolution, support, organisation`

**Signals (not clusters — stored on inventory):**
`tension:{hours,mobility,ceiling,physicality}, urgency, departement, diploma, appetit_risque, pull_autonomie, salaire_min, situation_actuelle`

### Mapping discipline
- Each transversal cluster → 1-3 RIASEC letters + a candidate list of ROME competence codes whose presence indicates that meta-skill. (e.g. `systemes` → codes for "organiser/structurer/concevoir un process".)
- Hard-skill clusters already have or directly map to ROME codes (paie etc.).
- **P5 task: replace candidate ROME-code lists with verified codes from the live referential.** Until then, transversal clusters lean on RIASEC + the strongest few codes.

---

## §7 — Build notes for Claude Code
- All scenes/leans/mappings → `/config/quiz.ts` as data, extend the existing structure (categories array, each with scenes, each scene with A/B + weighted maps + les-deux/ni-l'un handling).
- Expand `/config/clusters.ts` with §6 clusters (RIASEC + candidate ROME codes, flagged for P5 verification).
- `buildInventory` already exists — extend it to: accumulate weighted cluster scores (handle un-peu=0.5, les-deux=split, ni-l'un=0), collect RIASEC tallies, store Cat-4 constraints + Cat-5 financial inputs on the Inventory.
- Category gating: user can stop after any category → partial inventory → partial results. Each category writes progressively.
- Cat-5 financial inputs stored on `quiz_sessions.inventory` (or a `financial_inputs` jsonb) but consumed by NOTHING in the MVP — Phase 2 premium reads them.
