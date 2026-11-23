# Parked quiz scenes (cut 2026-11-23, round 4)

Cut from the quiz on the `directions` branch because nothing in the engine read
what they stored (data minimisation, the same rule that removed the c_urgency and
ar_situation quick-picks in round 3). Traced through `src/`: the engine reads
`constraints.tensions.ceiling` (which no scene ever set), the diploma, the zones,
`financial_inputs.training_investment` and the old salary floor, nothing else. None of
these scenes carried a skill cluster or an interest letter.

Kept: `ar_learning_investment` (its side A switches the level demote off), moved
into « Vos contraintes réelles ».

Old sessions still load: the ids are retired answer keys (no error, no effect, not
stored again). If one of these comes back, it needs an engine reader first, then the
scene. Text below is exactly what users saw, with what each side stored.

## Vos contraintes réelles (`contraintes`)

Chapter intro (removed, it promised an effect the answers never had):

> Maintenant, on regarde votre réalité. Ces réponses ne disent pas ce que vous valez. Elles servent à éviter des pistes incompatibles avec votre vie actuelle.

### `c_hours`

**Pour vos horaires, qu'est-ce qui vous convient le mieux ?**

- A: « Des horaires fixes et prévisibles. » → stored `tension:hours` = `fixed`
- B: « Des horaires souples, même le soir ou le week-end. » → stored `tension:hours` = `flexible`

### `c_mobility`

**Pour les déplacements, qu'est-ce qui est possible pour vous ?**

- A: « Uniquement proche de chez moi. » → stored `tension:mobility` = `local`
- B: « Je peux changer de zone, voire déménager. » → stored `tension:mobility` = `mobile`

### `c_timeline`

**Votre délai.**

- A: « J'ai besoin de travailler rapidement. » → stored `urgency` = `now`
- B: « J'explore et je peux construire sur plusieurs mois. » → stored `urgency` = `exploring`

### `c_remote_presence`

**Pour le lieu de travail, qu'est-ce qui vous convient ?**

- A: « Un lieu clair, avec une équipe présente. » → stored `tension:workplace` = `onsite_preferred`
- B: « Je peux travailler à distance ou en hybride sans perdre le fil. » → stored `tension:workplace` = `remote_ok`

### `c_physical`

**Pour l'effort physique et le terrain.**

- A: « Je veux limiter l'effort physique. » → stored `tension:physical` = `limit_physical_load`
- B: « Bouger, porter ou me déplacer ne me dérange pas. » → stored `tension:physical` = `physical_ok`

### `c_social_energy`

**Si le poste impose du contact toute la journée.**

- A: « Je dois limiter les échanges continus. » → stored `tension:social_density` = `low_density_needed`
- B: « Je peux gérer beaucoup d'interactions. » → stored `tension:social_density` = `high_density_ok`

### `c_training_length`

**Avant d'être opérationnel.**

- A: « Je cherche une option accessible rapidement. » → stored `tension:training` = `short_path`
- B: « Je peux suivre une formation plus longue si le résultat est clair. » → stored `tension:training` = `longer_path_ok`

## Argent et autonomie (`argent`)

Chapter intro (removed, it promised an effect the answers never had):

> Dernière partie. Ces réponses ne changent pas vos preuves. Elles servent à comprendre votre besoin de sécurité, votre envie d'autonomie et votre trajectoire financière.

### `ar_security_upside`

**Vous devez choisir entre deux offres.**

- A: « Une offre stable et prévisible, avec un revenu connu. » → stored `financial_inputs.appetit_risque` = `low`
- B: « Une offre moins sûre, mais avec plus de potentiel. » → stored `financial_inputs.appetit_risque` = `high`

### `ar_employee_own`

**Dans cinq ans, vous vous voyez plutôt...**

- A: « Avec un bon poste dans une organisation solide. » → stored `financial_inputs.pull_autonomie` = `low`
- B: « Avec mon propre projet, même si c'est plus difficile. » → stored `financial_inputs.pull_autonomie` = `high`

### `ar_income_floor_growth`

**Vous choisissez entre deux trajectoires.**

- A: « Un revenu correct assez vite. » → stored `financial_inputs.income_priority` = `floor_now`
- B: « Un démarrage plus lent, mais une meilleure progression possible. » → stored `financial_inputs.income_priority` = `growth_later`

### `ar_commission_fixed`

**Quel mode de rémunération vous convient le mieux ?**

- A: « Un fixe clair, avec peu de surprises. » → stored `financial_inputs.variable_pay` = `avoid`
- B: « Une part variable, commission ou prime, si je peux influencer le résultat. » → stored `financial_inputs.variable_pay` = `open`

### `ar_side_project`

**En dehors de votre travail principal.**

- A: « Je préfère séparer travail et vie personnelle. » → stored `financial_inputs.side_project` = `no`
- B: « Je peux construire un projet à côté si ça ouvre une porte. » → stored `financial_inputs.side_project` = `yes`

## Quick-pick `ar_salaire_min` (replaced by `c_accept_lower`)

**Quel salaire minimum net accepteriez-vous ?**

Help: « Si vous acceptez moins de 1 800 € net, les métiers sous votre niveau de diplôme gardent leur place dans la liste. Les autres montants ne changent pas vos résultats. »

- `lt1500` « Moins de 1 500 € net » → `<1500`
- `1500_1800` « 1 500 – 1 800 € net » → `1500-1800`
- `1800_2200` « 1 800 – 2 200 € net » → `1800-2200`
- `2200_2700` « 2 200 – 2 700 € net » → `2200-2700`
- `gt2700` « Plus de 2 700 € net » → `>2700`

