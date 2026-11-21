# Vocabulary reach: who the quiz can reach

Date: 2026-11-20. Branch `vocab-reach`. Measured on the live graph and today's
offers (`ROME_SOURCE=live OFFER_SOURCE=live`, zone 75). Offer counts move ranks:
re-run `scripts/reach-map.ts snap` after any offer refresh or after merging the
market-data branch.

**Question.** For every ROME domaine professionnel, can a person who does that
work reach its jobs through the quiz, (a) from their answers alone and (b) with
the matching seed niche? Unreachable = no job of the domain in the top 20.

## Method (`scripts/reach-map.ts`)

1. **Who answers.** One automatic answerer per domain. For each scored scene,
   each side is scored from the domain's own jobs, as a lift over all 1,923 jobs:
   how often the domain's fiches list the codes of the side's clusters, and how
   often the domain's major RIASEC letters include the side's letters. Mean of the
   two lifts. Both < 1 → « ni l'un ni l'autre »; ratio ≥ 1.5 → « plutôt »; ≥ 1.15
   → « un peu »; otherwise « les deux ». It reads fiches, never the ranking, so it
   cannot game a rank. `reach-map.ts sheet M16` prints the sheet it used.
2. **Rank.** Position in the `/results` display order (`sortForDisplay`), the
   order `persona-before-after.ts` calls top 10. No diploma, so no level demote.
3. **Seed niche.** The family depth whose prefixes cover most of the domain's
   jobs. 59 of the 110 domains have none.
4. **Check on the answerer.** Two hand-written answer sheets
   (`scripts/honest-personas.ts`): an HR assistant and a secretary.

The answerer answers like the *average* job of a domain. For M15 that average is
managerial (DRH, manager de proximité), so it reaches M15 through M1506 Manager de
proximité; the hand-written HR assistant is the better test for HR work.

## Result

Reachable from answers alone: **39 → 40 of 110** (gained C11, G15, I12, K16, M16;
lost J13 17→21, K25 17→23, N22 12→30 to the new secretariat vocabulary, N13 10→24
to the removal of « organiser un approvisionnement », which no answer evidences).
With the seed niche: 51 of the 51 domains that have one, before and after.

| Target | Before | After |
|---|---|---|
| M16 from answers (answerer) | 21 ✗ | **2** (M1602) |
| M16 from answers (hand-written secretary) | 21 ✗ (M1607) | **2** (M1602), M1607 #6 |
| M16 with seed (secretary) | 2 | 2 (M1605), M1607 #5 |
| M15 from answers (answerer) | 2 (M1506 only) | 2 (M1506 only; M1501 #165) |
| M15 from answers (hand-written HR assistant) | 96 ✗ | **177 ✗**: no answer names HR work |
| M15 with seed (HR assistant) | 2 (M1506) | 3 (M1506), M1507 #7 |

**Not reachable without new questions or new seed niches** (70 domains from
answers alone). 44 of them (458 of 1,923 jobs) have no seed niche either, so no
path reaches them at all today: A11 A15 B11 B12 B13 B14 B15 B17 C13 C14 D11 D13
F13 F14 F15 G11 G13 G14 H12 H13 H21 H23 H24 H31 H32 H34 I15 J11 J12 K11 K15 K18
K19 K22 K23 K26 L11 L14 M11 N21 N22 N31 N32 N43. The largest: H12 (46 jobs), J11
(42), H24 (27), K23 (26), D11 (20). The other 26 are reachable only through their
seed niche.

For the unreachable domains, no existing answer names their work: a search of
every answer's wording against every skill concentrated in each domain found no
skill an answer evidences (the search matched word stems between answer and skill
labels, on skills where ≥40% of the carrying jobs sit in the domain; every hit was
a coincidence such as « règles » in « règles de circulation »).

## Full map

| Domain | Jobs | Niche | (a) answers before | (a) after | (b) +seed before | (b) after | Best job (a) after |
|---|---|---|---|---|---|---|---|
| A11 | 2 | — | 39 ✗ | 29 ✗ | n/a | n/a | A1101 Conducteur / Conductrice d'engins agrico |
| A12 | 21 | agriculture:foret | 146 ✗ | 179 ✗ | 2 | 2 | A1207 Chef / Cheffe d'équipe de travaux de mil |
| A13 | 25 | agriculture:paysage | 13 | 13 | 1 | 1 | A1302 Agent / Agente de diagnostic et de contr |
| A14 | 47 | agriculture:culture | 20 | 15 | 1 | 1 | A1417 Saliculteur / Salicultrice |
| A15 | 12 | — | 50 ✗ | 52 ✗ | n/a | n/a | A1503 Toiletteur / Toiletteuse d'animaux |
| B11 | 4 | — | 31 ✗ | 30 ✗ | n/a | n/a | B1104 Artiste peintre |
| B12 | 1 | — | — | — | n/a | n/a |  |
| B13 | 4 | — | 32 ✗ | 26 ✗ | n/a | n/a | B1302 Décorateur / Décoratrice d'objets d'art |
| B14 | 4 | — | 563 ✗ | 591 ✗ | n/a | n/a | B1403 Restaurateur / Restauratrice de livres a |
| B15 | 5 | — | 438 ✗ | 425 ✗ | n/a | n/a | B1503 Facteur / Factrice d'instruments à vent |
| B16 | 18 | artisanat:art | 57 ✗ | 52 ✗ | 1 | 1 | B1605 Bijoutier / Bijoutière |
| B17 | 2 | — | 197 ✗ | 194 ✗ | n/a | n/a | B1701 Taxidermiste |
| B18 | 16 | artisanat:art | 15 | 9 | 4 | 4 | B1804 Brodeur / Brodeuse |
| C11 | 30 | banque:banque | 35 ✗ | 15 | 1 | 1 | C1106 Expert / Experte risques en assurances |
| C12 | 17 | banque:assurance | 1 | 1 | 1 | 1 | C1201 Chargé / Chargée d'accueil et de service |
| C13 | 6 | — | 128 ✗ | 124 ✗ | n/a | n/a | C1302 Gestionnaire des opérations sur les marc |
| C14 | 3 | — | 32 ✗ | 38 ✗ | n/a | n/a | C1401 Agent administratif / Agente administrat |
| C15 | 8 | banque:immo | 236 ✗ | 208 ✗ | 2 | 2 | C1501 Gestionnaire de copropriété |
| D11 | 20 | — | 32 ✗ | 50 ✗ | n/a | n/a | D1104 Pâtissier / Pâtissière |
| D12 | 54 | commerce:vente | 3 | 3 | 1 | 1 | D1211 Vendeur / Vendeuse d'articles de sport e |
| D13 | 5 | — | 855 ✗ | 894 ✗ | n/a | n/a | D1305 Responsable de magasin cycles |
| D14 | 44 | commerce:commercial | 13 | 12 | 2 | 2 | D1408 Conseiller / Conseillère clientèle à dis |
| D15 | 17 | commerce:caisse | 45 ✗ | 34 ✗ | 1 | 1 | D1502 Chef / Cheffe de rayon produits alimenta |
| E11 | 34 | communication:comm | 51 ✗ | 62 ✗ | 2 | 2 | E1106 Journaliste |
| E12 | 14 | communication:design | 4 | 2 | 1 | 1 | E1206 UX - UI Designer |
| E13 | 16 | communication:audiovisuel | 17 | 16 | 1 | 1 | E1313 Agent / Agente d'encadrement en industri |
| E14 | 15 | communication:audiovisuel | 55 ✗ | 44 ✗ | 2 | 1 | E1401 Chef / Cheffe de publicité |
| F11 | 46 | btp:conduite | 7 | 6 | 1 | 1 | F1105 Géologue |
| F12 | 12 | btp:conduite | 157 ✗ | 123 ✗ | 11 | 10 | F1203 Chef / Cheffe de carrière |
| F13 | 3 | — | 271 ✗ | 252 ✗ | n/a | n/a | F1301 Grutier / Grutière |
| F14 | 4 | — | 39 ✗ | 28 ✗ | n/a | n/a | F1402 Boutefeu |
| F15 | 6 | — | 26 ✗ | 23 ✗ | n/a | n/a | F1502 Monteur / Monteuse en structures métalli |
| F16 | 30 | btp:second | 7 | 8 | 1 | 1 | F1613 Etancheur / Etancheuse |
| F17 | 13 | btp:gros | 7 | 7 | 1 | 1 | F1701 Coffreur / Coffreuse |
| G11 | 8 | — | 397 ✗ | 336 ✗ | n/a | n/a | G1101 Agent / Agente d'accueil touristique |
| G12 | 49 | hotellerie:accueil | 14 | 14 | 1 | 1 | G1202 Animateur / Animatrice d'atelier artisti |
| G13 | 8 | — | 78 ✗ | 154 ✗ | n/a | n/a | G1302 Yield manager |
| G14 | 18 | — | 48 ✗ | 25 ✗ | n/a | n/a | G1403 Responsable de service en établissement  |
| G15 | 4 | — | 21 ✗ | 17 | n/a | n/a | G1502 Employé / Employée d'hôtel |
| G16 | 13 | hotellerie:cuisine | 17 | 11 | 1 | 1 | G1602 Commis / Commise de cuisine |
| G17 | 9 | — | 18 | 16 | n/a | n/a | G1703 Réceptionniste |
| G18 | 10 | hotellerie:salle | 4 | 20 | 1 | 1 | G1803 Serveur / Serveuse en restauration |
| H11 | 9 | — | 7 | 6 | n/a | n/a | H1102 Ingénieur / Ingénieure d'affaires en ind |
| H12 | 46 | — | 29 ✗ | 52 ✗ | n/a | n/a | H1210 Technicien / Technicienne R&D |
| H13 | 13 | — | 74 ✗ | 82 ✗ | n/a | n/a | H1301 Inspecteur / Inspectrice de conformité |
| H14 | 10 | — | 1 | 1 | n/a | n/a | H1402 Ingénieur / Ingénieure méthodes et proce |
| H15 | 35 | industrie:qualite | 119 ✗ | 122 ✗ | 1 | 1 | H1506 Contrôleur / Contrôleuse technique en mé |
| H21 | 9 | — | 593 ✗ | 577 ✗ | n/a | n/a | H2104 Fromager industriel / Fromagère industri |
| H22 | 20 | — | 3 | 3 | n/a | n/a | H2201 Assembleur / Assembleuse d'ouvrages en b |
| H23 | 4 | — | 272 ✗ | 236 ✗ | n/a | n/a | H2302 Conducteur / Conductrice de procédé de f |
| H24 | 27 | — | 187 ✗ | 178 ✗ | n/a | n/a | H2412 Patronnier / Patronnière |
| H25 | 16 | — | 1 | 2 | n/a | n/a | H2504 Chef / Cheffe d'équipe en industrie |
| H26 | 8 | — | 3 | 4 | n/a | n/a | H2603 Opérateur / Opératrice sur machines auto |
| H27 | 16 | — | 1 | 2 | n/a | n/a | H2701 Technicien / Technicienne d'exploitation |
| H28 | 11 | industrie:production | 43 ✗ | 35 ✗ | 3 | 3 | H2805 Technicien / Technicienne de l'industrie |
| H29 | 25 | industrie:montage | 1 | 1 | 1 | 1 | H2905 Cisailleur / Cisailleuse en métallurgie |
| H31 | 6 | — | — | — | n/a | n/a |  |
| H32 | 5 | — | 312 ✗ | 223 ✗ | n/a | n/a | H3204 Opérateur / Opératrice de production des |
| H33 | 9 | industrie:production | 16 | 14 | 1 | 2 | H3309 Préparateur / Préparatrice de mélange en |
| H34 | 11 | — | 177 ✗ | 161 ✗ | n/a | n/a | H3402 Opérateur / Opératrice de traitement de  |
| I11 | 23 | — | 6 | 5 | n/a | n/a | I1102 Ingénieur / Ingénieure de maintenance in |
| I12 | 12 | maintenance:batiment | 21 ✗ | 18 | 1 | 1 | I1210 Agent de maintenance qualifié / Agente d |
| I13 | 36 | maintenance:indus | 4 | 3 | 1 | 1 | I1310 Mécanicien / Mécanicienne de maintenance |
| I14 | 11 | tech:support | 48 ✗ | 43 ✗ | 1 | 1 | I1401 Technicien / Technicienne de maintenance |
| I15 | 14 | — | 432 ✗ | 403 ✗ | n/a | n/a | I1501 Opérateur / Opératrice cordiste |
| I16 | 38 | maintenance:vehicule | 27 ✗ | 33 ✗ | 1 | 1 | I1605 Mécanicien / Mécanicienne en mécanique m |
| J11 | 42 | — | 72 ✗ | 60 ✗ | n/a | n/a | J1102 Médecin généraliste |
| J12 | 4 | — | 130 ✗ | 130 ✗ | n/a | n/a | J1201 Biologiste médical / Biologiste médicale |
| J13 | 12 | sante:medico | 17 | 21 ✗ | 1 | 1 | J1301 Agent / Agente de service hospitalier (A |
| J14 | 16 | sante:reeduc | 46 ✗ | 141 ✗ | 1 | 1 | J1405 Opticien / Opticienne |
| J15 | 12 | sante:soin | 27 ✗ | 23 ✗ | 1 | 1 | J1506 Infirmier / Infirmière en soins généraux |
| K11 | 14 | — | 48 ✗ | 36 ✗ | n/a | n/a | K1104 Psychologue |
| K12 | 31 | services:social | 14 | 7 | 1 | 1 | K1225 Conseiller / Conseillère en économie soc |
| K13 | 14 | services:domicile | 75 ✗ | 54 ✗ | 1 | 1 | K1305 Technicien / Technicienne d'Intervention |
| K14 | 27 | — | 13 | 8 | n/a | n/a | K1416 Directeur / Directrice des services péni |
| K15 | 15 | — | 66 ✗ | 64 ✗ | n/a | n/a | K1502 Inspecteur / Inspectrice du travail |
| K16 | 14 | — | 34 ✗ | 14 | n/a | n/a | K1601 Documentaliste |
| K17 | 48 | services:securite | 435 ✗ | 423 ✗ | 3 | 3 | K1705 Secouriste |
| K18 | 17 | — | 54 ✗ | 33 ✗ | n/a | n/a | K1801 Conseiller / Conseillère en insertion pr |
| K19 | 18 | — | 219 ✗ | 107 ✗ | n/a | n/a | K1902 Clerc de notaire |
| K21 | 48 | services:enseignement | 2 | 2 | 1 | 1 | K2110 Enseignant / Enseignante de la conduite  |
| K22 | 5 | — | 24 ✗ | 38 ✗ | n/a | n/a | K2202 Laveur / Laveuse de vitres |
| K23 | 26 | — | 92 ✗ | 77 ✗ | n/a | n/a | K2301 Agent / Agente d'exploitation des réseau |
| K24 | 21 | — | 8 | 11 | n/a | n/a | K2402 Ingénieur / Ingénieure de recherche scie |
| K25 | 15 | services:securite | 17 | 23 ✗ | 1 | 1 | K2502 Responsable sécurité de site |
| K26 | 6 | — | 43 ✗ | 34 ✗ | n/a | n/a | K2602 Conseiller / Conseillère funéraire |
| L11 | 4 | — | 140 ✗ | 136 ✗ | n/a | n/a | L1104 Animateur / Animatrice événementiel |
| L12 | 16 | artisanat:creation | 3 | 18 | 2 | 2 | L1204 Artiste de cirque |
| L13 | 21 | artisanat:creation | 10 | 18 | 1 | 1 | L1304 Assistant réalisateur / Assistante réali |
| L14 | 3 | — | 140 ✗ | 107 ✗ | n/a | n/a | L1401 Sportif professionnel / Sportive profess |
| L15 | 28 | artisanat:spectacle | 28 ✗ | 47 ✗ | 1 | 1 | L1507 Monteur / Monteuse vidéo |
| M11 | 2 | — | 121 ✗ | 193 ✗ | n/a | n/a | M1101 Acheteur / Acheteuse |
| M12 | 28 | admin:compta | 93 ✗ | 181 ✗ | 2 | 2 | M1202 Auditeur comptable et financier / Auditr |
| M13 | 6 | — | 10 | 9 | n/a | n/a | M1301 Dirigeant / Dirigeante d'entreprise priv |
| M14 | 35 | tech:data | 26 ✗ | 48 ✗ | 2 | 2 | M1402 Responsable en organisation en entrepris |
| M15 | 12 | admin:rh | 2 | 2 | 2 | 2 | M1506 Manager de proximité |
| M16 | 21 | admin:secretariat | 21 ✗ | 2 | 2 | 2 | M1602 Secrétaire administratif / Secrétaire ad |
| M17 | 22 | — | 9 | 8 | n/a | n/a | M1707 Responsable du développement commercial |
| M18 | 96 | tech:code | 26 ✗ | 33 ✗ | 2 | 2 | M1802 Expert / Experte systèmes et réseaux inf |
| N11 | 16 | transport:entrepot | 163 ✗ | 140 ✗ | 1 | 1 | N1101 Cariste |
| N12 | 10 | transport:exploitation | 55 ✗ | 50 ✗ | 4 | 4 | N1209 Technicien / Technicienne logistique |
| N13 | 8 | transport:exploitation | 10 | 24 ✗ | 1 | 1 | N1303 Approvisionneur / Approvisionneuse logis |
| N21 | 4 | — | 58 ✗ | 30 ✗ | n/a | n/a | N2101 Personnel Navigant Commercial (PNC) |
| N22 | 13 | — | 12 | 30 ✗ | n/a | n/a | N2203 Agent / Agente d'opérations sur piste |
| N31 | 18 | — | 85 ✗ | 73 ✗ | n/a | n/a | N3103 Matelot de la navigation fluviale |
| N32 | 11 | — | 482 ✗ | 441 ✗ | n/a | n/a | N3206 Assistant / Assistante d'exploitation de |
| N41 | 35 | transport:conduite | 81 ✗ | 76 ✗ | 2 | 2 | N4103 Conducteur / Conductrice de bus |
| N42 | 6 | — | 4 | 3 | n/a | n/a | N4201 Responsable d'agence transport routier d |
| N43 | 6 | — | 118 ✗ | 101 ✗ | n/a | n/a | N4302 Agent / Agente de contrôle du réseau fer |
| N44 | 6 | transport:conduite | 32 ✗ | 30 ✗ | 1 | 1 | N4401 Aiguilleur / Aiguilleure du rail |
## Round 2 (decisions 2026-11-21)

Changes on `vocab-reach`: the six weak skills removed; `sf_commercial_signal`
replaced by the HR / accounts scene « Deux dossiers attendent sur ton bureau. »
(A « Je prends celui du personnel : embauches, contrats, absences, paie. », B « Je
prends celui des comptes : factures, paiements, trésorerie. »); RH and secretariat
niches widened to ROME 4.0 (M151x, M161x, M162x). The four new niches (D11, K23,
H12, K19) sit on branch `vocab-reach-niches` until the family-presence gate is
extended to 48 depths.

Method change: on a field scene (both sides name a field of work, today only
`sf_people_accounts`) the answerer reads skills only, not RIASEC. Every other scene
is answered as before. Under that rule M15 picks the personnel side, M12 / M16 /
G14 / D15 the accounts side, every other domain « ni l'un ni l'autre ».

| Target | 2026-11-20 end | 2026-11-21 |
|---|---|---|
| M15 from answers (hand-written HR assistant) | 177 ✗ | **4** (M1501) |
| M15 from answers (rebuilt Master's-HR) | 32 ✗ | **3** (M1501) |
| M15 with seed (HR assistant) | 3 (M1506) | **2** (M1501) |
| M16 from answers (secretary) | 2 | 2 |
| Reachable from answers alone | 40 / 110 | 39 / 110 (G18 20 → 83: lost « conseiller le client dans ses choix de plats », a weak skill) |
| Reachable with a seed niche | 51 / 51 | 51 / 51; 55 / 55 with the four new niches |

### Domains no path reaches, by cached offers

The offer cache covers département 75 only (16,789 offers). With the four new
niches, 40 domains have neither an answer nor a niche that reaches them:

| Domain | Jobs | Offers (75) |
|---|---|---|
| J11 | 42 | 487 |
| J12 | 4 | 108 |
| G14 | 18 | 94 |
| D13 | 5 | 90 |
| K18 | 17 | 80 |
| C13 | 6 | 69 |
| M11 | 2 | 68 |
| K11 | 14 | 66 |
| H13 | 13 | 44 |
| K22 | 5 | 42 |
| G13 | 8 | 39 |
| F13 | 3 | 24 |
| F15 | 6 | 20 |
| H24 | 27 | 15 |
| K26 | 6 | 14 |
| I15 | 14 | 13 |
| B13 | 4 | 12 |
| N22 | 13 | 12 |
| N43 | 6 | 12 |
| A11 | 2 | 10 |
| A15 | 12 | 9 |
| C14 | 3 | 9 |
| F14 | 4 | 9 |
| G11 | 8 | 9 |
| K15 | 15 | 6 |
| N21 | 4 | 5 |
| H34 | 11 | 4 |
| B11 | 4 | 3 |
| B17 | 2 | 3 |
| H21 | 9 | 3 |
| B15 | 5 | 2 |
| H23 | 4 | 2 |
| H32 | 5 | 2 |
| L11 | 4 | 2 |
| N31 | 18 | 2 |
| N32 | 11 | 2 |
| B14 | 4 | 1 |
| L14 | 3 | 1 |
| B12 | 1 | 0 |
| H31 | 6 | 0 |

### Full map, round 2

| Domain | Jobs | (a) answers 11-20 | (a) 11-21 | (b) +seed 11-20 | (b) 11-21 | (b) with new niches |
|---|---|---|---|---|---|---|
| A11 | 2 | 29 ✗ | 27 ✗ | n/a | n/a | n/a |
| A12 | 21 | 179 ✗ | 179 ✗ | 2 | 2 | 2 |
| A13 | 25 | 13 | 12 | 1 | 1 | 1 |
| A14 | 47 | 15 | 13 | 1 | 1 | 1 |
| A15 | 12 | 52 ✗ | 50 ✗ | n/a | n/a | n/a |
| B11 | 4 | 30 ✗ | 30 ✗ | n/a | n/a | n/a |
| B12 | 1 | — | — | n/a | n/a | n/a |
| B13 | 4 | 26 ✗ | 26 ✗ | n/a | n/a | n/a |
| B14 | 4 | 591 ✗ | 588 ✗ | n/a | n/a | n/a |
| B15 | 5 | 425 ✗ | 416 ✗ | n/a | n/a | n/a |
| B16 | 18 | 52 ✗ | 52 ✗ | 1 | 1 | 1 |
| B17 | 2 | 194 ✗ | 194 ✗ | n/a | n/a | n/a |
| B18 | 16 | 9 | 12 | 4 | 4 | 4 |
| C11 | 30 | 15 | 15 | 1 | 1 | 1 |
| C12 | 17 | 1 | 1 | 1 | 1 | 1 |
| C13 | 6 | 124 ✗ | 124 ✗ | n/a | n/a | n/a |
| C14 | 3 | 38 ✗ | 35 ✗ | n/a | n/a | n/a |
| C15 | 8 | 208 ✗ | 202 ✗ | 2 | 2 | 2 |
| D11 | 20 | 50 ✗ | 48 ✗ | n/a | n/a | 1 |
| D12 | 54 | 3 | 6 | 1 | 1 | 1 |
| D13 | 5 | 894 ✗ | 862 ✗ | n/a | n/a | n/a |
| D14 | 44 | 12 | 11 | 2 | 2 | 2 |
| D15 | 17 | 34 ✗ | 35 ✗ | 1 | 1 | 1 |
| E11 | 34 | 62 ✗ | 45 ✗ | 2 | 1 | 1 |
| E12 | 14 | 2 | 2 | 1 | 1 | 1 |
| E13 | 16 | 16 | 18 | 1 | 1 | 1 |
| E14 | 15 | 44 ✗ | 42 ✗ | 1 | 1 | 1 |
| F11 | 46 | 6 | 5 | 1 | 1 | 1 |
| F12 | 12 | 123 ✗ | 211 ✗ | 10 | 10 | 10 |
| F13 | 3 | 252 ✗ | 250 ✗ | n/a | n/a | n/a |
| F14 | 4 | 28 ✗ | 28 ✗ | n/a | n/a | n/a |
| F15 | 6 | 23 ✗ | 22 ✗ | n/a | n/a | n/a |
| F16 | 30 | 8 | 8 | 1 | 1 | 1 |
| F17 | 13 | 7 | 6 | 1 | 1 | 1 |
| G11 | 8 | 336 ✗ | 327 ✗ | n/a | n/a | n/a |
| G12 | 49 | 14 | 13 | 1 | 1 | 1 |
| G13 | 8 | 154 ✗ | 105 ✗ | n/a | n/a | n/a |
| G14 | 18 | 25 ✗ | 23 ✗ | n/a | n/a | n/a |
| G15 | 4 | 17 | 15 | n/a | n/a | n/a |
| G16 | 13 | 11 | 11 | 1 | 1 | 1 |
| G17 | 9 | 16 | 18 | n/a | n/a | n/a |
| G18 | 10 | 20 | 83 ✗ | 1 | 1 | 1 |
| H11 | 9 | 6 | 5 | n/a | n/a | n/a |
| H12 | 46 | 52 ✗ | 38 ✗ | n/a | n/a | 1 |
| H13 | 13 | 82 ✗ | 79 ✗ | n/a | n/a | n/a |
| H14 | 10 | 1 | 1 | n/a | n/a | n/a |
| H15 | 35 | 122 ✗ | 123 ✗ | 1 | 1 | 1 |
| H21 | 9 | 577 ✗ | 729 ✗ | n/a | n/a | n/a |
| H22 | 20 | 3 | 2 | n/a | n/a | n/a |
| H23 | 4 | 236 ✗ | 164 ✗ | n/a | n/a | n/a |
| H24 | 27 | 178 ✗ | 179 ✗ | n/a | n/a | n/a |
| H25 | 16 | 2 | 5 | n/a | n/a | n/a |
| H26 | 8 | 4 | 3 | n/a | n/a | n/a |
| H27 | 16 | 2 | 1 | n/a | n/a | n/a |
| H28 | 11 | 35 ✗ | 39 ✗ | 3 | 2 | 2 |
| H29 | 25 | 1 | 1 | 1 | 1 | 1 |
| H31 | 6 | — | — | n/a | n/a | n/a |
| H32 | 5 | 223 ✗ | 269 ✗ | n/a | n/a | n/a |
| H33 | 9 | 14 | 14 | 2 | 1 | 1 |
| H34 | 11 | 161 ✗ | 161 ✗ | n/a | n/a | n/a |
| I11 | 23 | 5 | 5 | n/a | n/a | n/a |
| I12 | 12 | 18 | 19 | 1 | 1 | 1 |
| I13 | 36 | 3 | 3 | 1 | 1 | 1 |
| I14 | 11 | 43 ✗ | 44 ✗ | 1 | 1 | 1 |
| I15 | 14 | 403 ✗ | 401 ✗ | n/a | n/a | n/a |
| I16 | 38 | 33 ✗ | 38 ✗ | 1 | 1 | 1 |
| J11 | 42 | 60 ✗ | 57 ✗ | n/a | n/a | n/a |
| J12 | 4 | 130 ✗ | 123 ✗ | n/a | n/a | n/a |
| J13 | 12 | 21 ✗ | 23 ✗ | 1 | 1 | 1 |
| J14 | 16 | 141 ✗ | 139 ✗ | 1 | 1 | 1 |
| J15 | 12 | 23 ✗ | 26 ✗ | 1 | 1 | 1 |
| K11 | 14 | 36 ✗ | 36 ✗ | n/a | n/a | n/a |
| K12 | 31 | 7 | 7 | 1 | 1 | 1 |
| K13 | 14 | 54 ✗ | 53 ✗ | 1 | 1 | 1 |
| K14 | 27 | 8 | 8 | n/a | n/a | n/a |
| K15 | 15 | 64 ✗ | 60 ✗ | n/a | n/a | n/a |
| K16 | 14 | 14 | 11 | n/a | n/a | n/a |
| K17 | 48 | 423 ✗ | 424 ✗ | 3 | 3 | 3 |
| K18 | 17 | 33 ✗ | 30 ✗ | n/a | n/a | n/a |
| K19 | 18 | 107 ✗ | 102 ✗ | n/a | n/a | 1 |
| K21 | 48 | 2 | 2 | 1 | 1 | 1 |
| K22 | 5 | 38 ✗ | 28 ✗ | n/a | n/a | n/a |
| K23 | 26 | 77 ✗ | 77 ✗ | n/a | n/a | 1 |
| K24 | 21 | 11 | 11 | n/a | n/a | n/a |
| K25 | 15 | 23 ✗ | 21 ✗ | 1 | 1 | 1 |
| K26 | 6 | 34 ✗ | 28 ✗ | n/a | n/a | n/a |
| L11 | 4 | 136 ✗ | 132 ✗ | n/a | n/a | n/a |
| L12 | 16 | 18 | 18 | 2 | 2 | 2 |
| L13 | 21 | 17 | 17 | 1 | 1 | 1 |
| L14 | 3 | 107 ✗ | 104 ✗ | n/a | n/a | n/a |
| L15 | 28 | 47 ✗ | 43 ✗ | 1 | 1 | 1 |
| M11 | 2 | 193 ✗ | 183 ✗ | n/a | n/a | n/a |
| M12 | 28 | 181 ✗ | 104 ✗ | 2 | 2 | 2 |
| M13 | 6 | 9 | 8 | n/a | n/a | n/a |
| M14 | 35 | 48 ✗ | 47 ✗ | 2 | 2 | 2 |
| M15 | 12 | 2 | 2 | 2 | 2 | 2 |
| M16 | 21 | 2 | 2 | 2 | 2 | 2 |
| M17 | 22 | 8 | 8 | n/a | n/a | n/a |
| M18 | 96 | 33 ✗ | 30 ✗ | 2 | 2 | 2 |
| N11 | 16 | 140 ✗ | 140 ✗ | 1 | 1 | 1 |
| N12 | 10 | 50 ✗ | 52 ✗ | 4 | 5 | 5 |
| N13 | 8 | 24 ✗ | 25 ✗ | 1 | 1 | 1 |
| N21 | 4 | 30 ✗ | 61 ✗ | n/a | n/a | n/a |
| N22 | 13 | 30 ✗ | 29 ✗ | n/a | n/a | n/a |
| N31 | 18 | 73 ✗ | 98 ✗ | n/a | n/a | n/a |
| N32 | 11 | 441 ✗ | 429 ✗ | n/a | n/a | n/a |
| N41 | 35 | 76 ✗ | 71 ✗ | 2 | 2 | 2 |
| N42 | 6 | 3 | 4 | n/a | n/a | n/a |
| N43 | 6 | 101 ✗ | 104 ✗ | n/a | n/a | n/a |
| N44 | 6 | 30 ✗ | 27 ✗ | 1 | 1 | 1 |
## Round 3 (decisions 2026-11-21, measured 2026-11-22 on the tree merged with trajectoire-ui)

- Niches are explicit job lists (`build-families.ts`), read by the family-presence
  gate, the reach map and the persona sweep from `config/families.ts`. The gate's
  denominator is the number of configured niches and one miss exits 1.
- RH drops M1506 Manager de proximité. Secretariat drops M1603 facteur, M1610
  intendant du sport, M1615 distributeur de prospectus, M1617 médecin DIM, M1618
  agent de liaison courrier, M1619 approvisionneur, M1620 assistant marketing.
- Three more niches: D13 (commerce:magasin), G14 (hotellerie:direction), K18
  (services:territoire). With the four of round 2, seven domains gained a path;
  each is #1 with its seed and no other persona's top 10 moved.
- Jobs the old prefixes would pull in on today's graph but the lists leave out
  until someone adds them: L1321, K1231, K2515.

Reachable from answers alone: 39 / 110 (unchanged). With a seed niche: 58 / 58.
37 domains still have no path; by cached offers (75): J11 487, J12 108 (both
waiting for the 9-zone data), C13 69, M11 68, K11 66, H13 44, K22 42, G13 39,
then 24 or fewer.

### Niche job lists

| Niche | Label | Jobs | Seed skills | Member jobs |
|---|---|---|---|---|
| tech:code | Développer / coder | 39 | 1058 | M1801 M1802 M1803 M1804 M1805 M1806 M1807 M1808 M1809 M1820 M1821 M1822 M1823 M1824 M1825 M1826 M1827 M1828 M1829 M1840 M1841 M1842 M1843 M1844 M1845 M1846 M1847 M1848 M1849 M1850 M1851 M1852 M1853 M1854 M1855 M1856 M1857 M1858 M1859 |
| tech:sysadmin | Systèmes & réseaux | 10 | 356 | M1810 M1811 M1812 M1813 M1814 M1815 M1816 M1817 M1818 M1819 |
| tech:support | Support / dépannage info | 9 | 377 | I1401 I1402 I1403 I1404 I1405 I1406 I1407 I1408 I1409 |
| tech:data | Données / data | 19 | 717 | M1401 M1402 M1403 M1404 M1405 M1406 M1407 M1408 M1409 M1830 M1831 M1832 M1833 M1834 M1835 M1836 M1837 M1838 M1839 |
| sante:soin | Soin / aide-soignant·e | 12 | 355 | J1501 J1502 J1503 J1504 J1505 J1506 J1507 J1508 J1509 J1510 J1511 J1512 |
| sante:medico | Médico-technique | 9 | 333 | J1301 J1302 J1303 J1304 J1305 J1306 J1307 J1308 J1309 |
| sante:reeduc | Rééducation / paramédical | 16 | 594 | J1401 J1402 J1403 J1404 J1405 J1406 J1407 J1408 J1409 J1410 J1411 J1412 J1413 J1414 J1415 J1416 |
| btp:gros | Gros œuvre / maçonnerie | 9 | 359 | F1701 F1702 F1703 F1704 F1705 F1706 F1707 F1708 F1709 |
| btp:second | Second œuvre / finitions | 9 | 402 | F1601 F1602 F1603 F1604 F1605 F1606 F1607 F1608 F1609 |
| btp:conduite | Conduite & encadrement chantier | 18 | 826 | F1101 F1102 F1103 F1104 F1105 F1106 F1107 F1108 F1109 F1201 F1202 F1203 F1204 F1205 F1206 F1207 F1208 F1209 |
| maintenance:indus | Maintenance industrielle | 9 | 332 | I1301 I1302 I1303 I1304 I1305 I1306 I1307 I1308 I1309 |
| maintenance:vehicule | Mécanique véhicules | 9 | 519 | I1601 I1602 I1603 I1604 I1605 I1606 I1607 I1608 I1609 |
| maintenance:batiment | Maintenance bâtiment | 9 | 317 | I1201 I1202 I1203 I1204 I1205 I1206 I1207 I1208 I1209 |
| commerce:vente | Vente / conseil client | 54 | 1539 | D1201 D1202 D1203 D1204 D1205 D1206 D1207 D1208 D1209 D1210 D1211 D1212 D1213 D1214 D1215 D1216 D1217 D1218 D1219 D1220 D1221 D1222 D1223 D1224 D1225 D1226 D1227 D1228 D1229 D1230 D1231 D1232 D1233 D1234 D1235 D1236 D1237 D1238 D1239 D1240 D1241 D1242 D1243 D1244 D1245 D1246 D1247 D1248 D1249 D1250 D1251 D1252 D1253 D1254 |
| commerce:caisse | Caisse / mise en rayon | 17 | 555 | D1501 D1502 D1503 D1504 D1505 D1506 D1507 D1508 D1509 D1510 D1511 D1512 D1513 D1514 D1515 D1516 D1517 |
| commerce:commercial | Commercial / négociation | 44 | 1375 | D1401 D1402 D1403 D1404 D1405 D1406 D1407 D1408 D1409 D1410 D1411 D1412 D1413 D1414 D1415 D1416 D1417 D1418 D1419 D1420 D1421 D1422 D1423 D1424 D1425 D1426 D1427 D1428 D1429 D1430 D1431 D1432 D1433 D1434 D1435 D1436 D1437 D1438 D1439 D1440 D1441 D1442 D1443 D1444 |
| commerce:alimentaire | Métiers de bouche / commerce alimentaire | 20 | 550 | D1101 D1102 D1103 D1104 D1105 D1106 D1107 D1108 D1109 D1110 D1111 D1112 D1113 D1114 D1115 D1116 D1117 D1118 D1119 D1120 |
| commerce:magasin | Gestion de magasin / point de vente | 5 | 290 | D1301 D1302 D1303 D1304 D1305 |
| industrie:production | Conduite de production | 20 | 542 | H2801 H2802 H2803 H2804 H2805 H2806 H2807 H2808 H2809 H2810 H2811 H3301 H3302 H3303 H3304 H3305 H3306 H3307 H3308 H3309 |
| industrie:qualite | Qualité / méthodes | 35 | 1074 | H1501 H1502 H1503 H1504 H1505 H1506 H1507 H1508 H1509 H1510 H1511 H1512 H1513 H1514 H1515 H1516 H1517 H1518 H1519 H1520 H1521 H1522 H1523 H1524 H1525 H1526 H1527 H1528 H1529 H1530 H1531 H1532 H1533 H1534 H1535 |
| industrie:montage | Montage / assemblage | 25 | 730 | H2901 H2902 H2903 H2904 H2905 H2906 H2907 H2908 H2909 H2910 H2911 H2912 H2913 H2914 H2915 H2916 H2917 H2918 H2919 H2920 H2921 H2922 H2923 H2924 H2925 |
| industrie:etudes | Études, R&D, bureau d'études | 46 | 1530 | H1201 H1202 H1203 H1204 H1205 H1206 H1207 H1208 H1209 H1210 H1211 H1212 H1213 H1214 H1215 H1216 H1217 H1218 H1219 H1220 H1221 H1222 H1223 H1224 H1225 H1226 H1227 H1228 H1229 H1230 H1231 H1232 H1233 H1234 H1235 H1236 H1237 H1238 H1239 H1240 H1241 H1242 H1243 H1244 H1245 H1246 |
| hotellerie:cuisine | Cuisine | 13 | 372 | G1601 G1602 G1603 G1604 G1605 G1606 G1607 G1608 G1609 G1610 G1611 G1612 G1613 |
| hotellerie:salle | Service en salle | 10 | 300 | G1801 G1802 G1803 G1804 G1805 G1806 G1807 G1808 G1809 G1810 |
| hotellerie:accueil | Accueil / hébergement | 49 | 1327 | G1201 G1202 G1203 G1204 G1205 G1206 G1207 G1208 G1209 G1210 G1211 G1212 G1213 G1214 G1215 G1216 G1217 G1218 G1219 G1220 G1221 G1222 G1223 G1224 G1225 G1226 G1227 G1228 G1229 G1230 G1231 G1232 G1233 G1234 G1235 G1236 G1237 G1238 G1239 G1240 G1241 G1242 G1243 G1244 G1245 G1246 G1247 G1248 G1249 |
| hotellerie:direction | Direction d'établissement (hôtel, restaurant, loisirs) | 18 | 603 | G1401 G1402 G1403 G1404 G1405 G1406 G1407 G1408 G1409 G1410 G1411 G1412 G1413 G1414 G1415 G1416 G1417 G1418 |
| admin:secretariat | Secrétariat / assistanat | 14 | 387 | M1601 M1602 M1604 M1605 M1606 M1607 M1608 M1609 M1611 M1612 M1613 M1614 M1616 M1621 |
| admin:compta | Comptabilité / paie | 9 | 275 | M1201 M1202 M1203 M1204 M1205 M1206 M1207 M1208 M1209 |
| admin:rh | Ressources humaines | 11 | 393 | M1501 M1502 M1503 M1504 M1505 M1507 M1508 M1509 M1510 M1511 M1512 |
| admin:juridique | Droit / juridique | 18 | 601 | K1901 K1902 K1903 K1904 K1905 K1906 K1907 K1908 K1909 K1910 K1911 K1912 K1913 K1914 K1915 K1916 K1923 K1924 |
| agriculture:culture | Culture / élevage | 47 | 1214 | A1401 A1402 A1403 A1404 A1405 A1406 A1407 A1408 A1409 A1410 A1411 A1412 A1413 A1414 A1415 A1416 A1417 A1418 A1419 A1420 A1421 A1422 A1423 A1424 A1425 A1426 A1427 A1428 A1429 A1430 A1431 A1432 A1433 A1434 A1435 A1436 A1437 A1438 A1439 A1440 A1441 A1442 A1443 A1444 A1445 A1446 A1447 |
| agriculture:paysage | Paysage / espaces verts | 25 | 946 | A1301 A1302 A1303 A1304 A1305 A1306 A1307 A1308 A1309 A1310 A1311 A1312 A1313 A1314 A1315 A1316 A1317 A1318 A1319 A1320 A1321 A1322 A1323 A1324 A1325 |
| agriculture:foret | Forêt / nature | 21 | 838 | A1201 A1202 A1203 A1204 A1205 A1206 A1207 A1208 A1209 A1210 A1211 A1212 A1213 A1214 A1215 A1216 A1217 A1218 A1219 A1220 A1221 |
| artisanat:art | Artisanat d'art | 34 | 1091 | B1601 B1602 B1603 B1604 B1605 B1606 B1607 B1608 B1609 B1610 B1611 B1612 B1613 B1614 B1615 B1616 B1617 B1618 B1801 B1802 B1803 B1804 B1805 B1806 B1807 B1808 B1809 B1810 B1811 B1812 B1813 B1814 B1815 B1816 |
| artisanat:spectacle | Spectacle / technique | 28 | 1041 | L1501 L1502 L1503 L1504 L1505 L1506 L1507 L1508 L1509 L1510 L1511 L1512 L1513 L1514 L1515 L1516 L1517 L1518 L1519 L1520 L1521 L1522 L1523 L1524 L1525 L1526 L1527 L1528 |
| artisanat:creation | Création / interprétation | 36 | 1008 | L1201 L1202 L1203 L1204 L1205 L1206 L1207 L1208 L1209 L1210 L1211 L1212 L1213 L1214 L1215 L1216 L1301 L1302 L1303 L1304 L1305 L1306 L1307 L1308 L1309 L1310 L1311 L1312 L1313 L1314 L1315 L1316 L1317 L1318 L1319 L1320 |
| banque:banque | Banque / clientèle | 30 | 658 | C1101 C1102 C1103 C1104 C1105 C1106 C1107 C1108 C1109 C1110 C1111 C1112 C1113 C1114 C1115 C1116 C1117 C1118 C1119 C1120 C1121 C1122 C1123 C1124 C1125 C1126 C1127 C1128 C1129 C1130 |
| banque:assurance | Assurance | 17 | 409 | C1201 C1202 C1203 C1204 C1205 C1206 C1207 C1208 C1209 C1210 C1211 C1212 C1213 C1214 C1215 C1216 C1217 |
| banque:immo | Immobilier | 8 | 298 | C1501 C1502 C1503 C1504 C1505 C1506 C1507 C1508 |
| communication:comm | Communication / relations publiques | 34 | 1090 | E1101 E1102 E1103 E1104 E1105 E1106 E1107 E1108 E1109 E1110 E1111 E1112 E1113 E1114 E1115 E1116 E1117 E1118 E1119 E1120 E1121 E1122 E1123 E1124 E1125 E1126 E1127 E1128 E1129 E1130 E1131 E1132 E1133 E1134 |
| communication:design | Design / création visuelle | 14 | 586 | E1201 E1202 E1203 E1204 E1205 E1206 E1207 E1208 E1209 E1210 E1211 E1212 E1213 E1214 |
| communication:audiovisuel | Audiovisuel / multimédia | 31 | 1024 | E1301 E1302 E1303 E1304 E1305 E1306 E1307 E1308 E1309 E1310 E1311 E1312 E1313 E1314 E1315 E1316 E1401 E1402 E1403 E1404 E1405 E1406 E1407 E1408 E1409 E1410 E1411 E1412 E1413 E1414 E1415 |
| services:social | Action sociale / éducative | 30 | 916 | K1201 K1202 K1203 K1204 K1205 K1206 K1207 K1208 K1209 K1210 K1211 K1212 K1213 K1214 K1215 K1216 K1217 K1218 K1219 K1220 K1221 K1222 K1223 K1224 K1225 K1226 K1227 K1228 K1229 K1230 |
| services:domicile | Aide à domicile / à la personne | 14 | 362 | K1301 K1302 K1303 K1304 K1305 K1306 K1307 K1308 K1309 K1310 K1311 K1312 K1313 K1314 |
| services:securite | Sécurité / défense | 62 | 1504 | K1701 K1702 K1703 K1704 K1705 K1706 K1707 K1708 K1709 K1710 K1711 K1712 K1713 K1714 K1715 K1716 K1717 K1718 K1719 K1720 K1721 K1722 K1723 K1724 K1725 K1726 K1727 K1728 K1729 K1730 K1731 K1732 K1733 K1734 K1735 K1736 K1737 K1738 K1739 K1740 K1741 K1742 K1743 K1744 K1745 K1746 K1747 K1748 K2501 K2502 K2503 K2504 K2505 K2506 K2507 K2508 K2509 K2510 K2511 K2512 K2513 K2514 |
| services:enseignement | Enseignement / formation | 48 | 1574 | K2101 K2102 K2103 K2104 K2105 K2106 K2107 K2108 K2109 K2110 K2111 K2112 K2113 K2114 K2115 K2116 K2117 K2118 K2119 K2120 K2121 K2122 K2123 K2124 K2125 K2126 K2127 K2128 K2129 K2130 K2131 K2132 K2133 K2134 K2135 K2136 K2137 K2138 K2139 K2140 K2141 K2142 K2143 K2144 K2145 K2146 K2147 K2148 |
| services:proprete | Propreté urbaine / déchets | 26 | 714 | K2301 K2302 K2303 K2304 K2305 K2306 K2307 K2308 K2309 K2310 K2311 K2312 K2313 K2314 K2315 K2316 K2317 K2318 K2319 K2320 K2321 K2322 K2323 K2324 K2325 K2326 |
| services:territoire | Développement local, emploi, insertion | 17 | 613 | K1801 K1802 K1803 K1804 K1805 K1806 K1807 K1808 K1809 K1810 K1811 K1812 K1813 K1814 K1815 K1816 K1817 |
| transport:conduite | Conduite / livraison | 41 | 999 | N4101 N4102 N4103 N4104 N4105 N4106 N4107 N4108 N4109 N4110 N4111 N4112 N4113 N4114 N4115 N4116 N4117 N4118 N4119 N4120 N4121 N4122 N4123 N4124 N4125 N4126 N4127 N4128 N4129 N4130 N4131 N4132 N4133 N4134 N4135 N4401 N4402 N4403 N4404 N4405 N4406 |
| transport:entrepot | Entrepôt / manutention | 16 | 540 | N1101 N1102 N1103 N1104 N1105 N1106 N1107 N1108 N1109 N1110 N1111 N1112 N1113 N1114 N1115 N1116 |
| transport:exploitation | Exploitation / planification | 18 | 738 | N1201 N1202 N1203 N1204 N1205 N1206 N1207 N1208 N1209 N1210 N1301 N1302 N1303 N1304 N1305 N1306 N1307 N1308 |
### Full map, round 3

| Domain | Jobs | Niche now | (a) answers 11-21 | (a) 11-22 merged | (b) +seed 11-21 | (b) 11-22 merged |
|---|---|---|---|---|---|---|
| A11 | 2 | — | 27 ✗ | 27 ✗ | n/a | n/a |
| A12 | 21 | agriculture:foret | 179 ✗ | 179 ✗ | 2 | 2 |
| A13 | 25 | agriculture:paysage | 12 | 12 | 1 | 1 |
| A14 | 47 | agriculture:culture | 13 | 13 | 1 | 1 |
| A15 | 12 | — | 50 ✗ | 50 ✗ | n/a | n/a |
| B11 | 4 | — | 30 ✗ | 30 ✗ | n/a | n/a |
| B12 | 1 | — | — | — | n/a | n/a |
| B13 | 4 | — | 26 ✗ | 26 ✗ | n/a | n/a |
| B14 | 4 | — | 588 ✗ | 588 ✗ | n/a | n/a |
| B15 | 5 | — | 416 ✗ | 416 ✗ | n/a | n/a |
| B16 | 18 | artisanat:art | 52 ✗ | 52 ✗ | 1 | 1 |
| B17 | 2 | — | 194 ✗ | 194 ✗ | n/a | n/a |
| B18 | 16 | artisanat:art | 12 | 12 | 4 | 4 |
| C11 | 30 | banque:banque | 15 | 15 | 1 | 1 |
| C12 | 17 | banque:assurance | 1 | 1 | 1 | 1 |
| C13 | 6 | — | 124 ✗ | 124 ✗ | n/a | n/a |
| C14 | 3 | — | 35 ✗ | 35 ✗ | n/a | n/a |
| C15 | 8 | banque:immo | 202 ✗ | 202 ✗ | 2 | 2 |
| D11 | 20 | commerce:alimentaire | 48 ✗ | 48 ✗ | n/a | 1 |
| D12 | 54 | commerce:vente | 6 | 6 | 1 | 1 |
| D13 | 5 | commerce:magasin | 862 ✗ | 862 ✗ | n/a | 1 |
| D14 | 44 | commerce:commercial | 11 | 11 | 2 | 2 |
| D15 | 17 | commerce:caisse | 35 ✗ | 35 ✗ | 1 | 1 |
| E11 | 34 | communication:comm | 45 ✗ | 45 ✗ | 1 | 1 |
| E12 | 14 | communication:design | 2 | 2 | 1 | 1 |
| E13 | 16 | communication:audiovisuel | 18 | 18 | 1 | 1 |
| E14 | 15 | communication:audiovisuel | 42 ✗ | 42 ✗ | 1 | 1 |
| F11 | 46 | btp:conduite | 5 | 5 | 1 | 1 |
| F12 | 12 | btp:conduite | 211 ✗ | 211 ✗ | 10 | 10 |
| F13 | 3 | — | 250 ✗ | 250 ✗ | n/a | n/a |
| F14 | 4 | — | 28 ✗ | 28 ✗ | n/a | n/a |
| F15 | 6 | — | 22 ✗ | 22 ✗ | n/a | n/a |
| F16 | 30 | btp:second | 8 | 8 | 1 | 1 |
| F17 | 13 | btp:gros | 6 | 6 | 1 | 1 |
| G11 | 8 | — | 327 ✗ | 327 ✗ | n/a | n/a |
| G12 | 49 | hotellerie:accueil | 13 | 13 | 1 | 1 |
| G13 | 8 | — | 105 ✗ | 105 ✗ | n/a | n/a |
| G14 | 18 | hotellerie:direction | 23 ✗ | 23 ✗ | n/a | 1 |
| G15 | 4 | — | 15 | 15 | n/a | n/a |
| G16 | 13 | hotellerie:cuisine | 11 | 11 | 1 | 1 |
| G17 | 9 | — | 18 | 18 | n/a | n/a |
| G18 | 10 | hotellerie:salle | 83 ✗ | 83 ✗ | 1 | 1 |
| H11 | 9 | — | 5 | 5 | n/a | n/a |
| H12 | 46 | industrie:etudes | 38 ✗ | 38 ✗ | n/a | 1 |
| H13 | 13 | — | 79 ✗ | 79 ✗ | n/a | n/a |
| H14 | 10 | — | 1 | 1 | n/a | n/a |
| H15 | 35 | industrie:qualite | 123 ✗ | 123 ✗ | 1 | 1 |
| H21 | 9 | — | 729 ✗ | 729 ✗ | n/a | n/a |
| H22 | 20 | — | 2 | 2 | n/a | n/a |
| H23 | 4 | — | 164 ✗ | 164 ✗ | n/a | n/a |
| H24 | 27 | — | 179 ✗ | 179 ✗ | n/a | n/a |
| H25 | 16 | — | 5 | 5 | n/a | n/a |
| H26 | 8 | — | 3 | 3 | n/a | n/a |
| H27 | 16 | — | 1 | 1 | n/a | n/a |
| H28 | 11 | industrie:production | 39 ✗ | 39 ✗ | 2 | 2 |
| H29 | 25 | industrie:montage | 1 | 1 | 1 | 1 |
| H31 | 6 | — | — | — | n/a | n/a |
| H32 | 5 | — | 269 ✗ | 269 ✗ | n/a | n/a |
| H33 | 9 | industrie:production | 14 | 14 | 1 | 1 |
| H34 | 11 | — | 161 ✗ | 161 ✗ | n/a | n/a |
| I11 | 23 | — | 5 | 5 | n/a | n/a |
| I12 | 12 | maintenance:batiment | 19 | 19 | 1 | 1 |
| I13 | 36 | maintenance:indus | 3 | 3 | 1 | 1 |
| I14 | 11 | tech:support | 44 ✗ | 44 ✗ | 1 | 1 |
| I15 | 14 | — | 401 ✗ | 401 ✗ | n/a | n/a |
| I16 | 38 | maintenance:vehicule | 38 ✗ | 38 ✗ | 1 | 1 |
| J11 | 42 | — | 57 ✗ | 57 ✗ | n/a | n/a |
| J12 | 4 | — | 123 ✗ | 123 ✗ | n/a | n/a |
| J13 | 12 | sante:medico | 23 ✗ | 23 ✗ | 1 | 1 |
| J14 | 16 | sante:reeduc | 139 ✗ | 139 ✗ | 1 | 1 |
| J15 | 12 | sante:soin | 26 ✗ | 26 ✗ | 1 | 1 |
| K11 | 14 | — | 36 ✗ | 36 ✗ | n/a | n/a |
| K12 | 31 | services:social | 7 | 7 | 1 | 1 |
| K13 | 14 | services:domicile | 53 ✗ | 53 ✗ | 1 | 1 |
| K14 | 27 | — | 8 | 8 | n/a | n/a |
| K15 | 15 | — | 60 ✗ | 60 ✗ | n/a | n/a |
| K16 | 14 | — | 11 | 11 | n/a | n/a |
| K17 | 48 | services:securite | 424 ✗ | 424 ✗ | 3 | 3 |
| K18 | 17 | services:territoire | 30 ✗ | 30 ✗ | n/a | 1 |
| K19 | 18 | admin:juridique | 102 ✗ | 102 ✗ | n/a | 1 |
| K21 | 48 | services:enseignement | 2 | 2 | 1 | 1 |
| K22 | 5 | — | 28 ✗ | 28 ✗ | n/a | n/a |
| K23 | 26 | services:proprete | 77 ✗ | 77 ✗ | n/a | 1 |
| K24 | 21 | — | 11 | 11 | n/a | n/a |
| K25 | 15 | services:securite | 21 ✗ | 21 ✗ | 1 | 1 |
| K26 | 6 | — | 28 ✗ | 28 ✗ | n/a | n/a |
| L11 | 4 | — | 132 ✗ | 132 ✗ | n/a | n/a |
| L12 | 16 | artisanat:creation | 18 | 18 | 2 | 2 |
| L13 | 21 | artisanat:creation | 17 | 17 | 1 | 1 |
| L14 | 3 | — | 104 ✗ | 104 ✗ | n/a | n/a |
| L15 | 28 | artisanat:spectacle | 43 ✗ | 43 ✗ | 1 | 1 |
| M11 | 2 | — | 183 ✗ | 183 ✗ | n/a | n/a |
| M12 | 28 | admin:compta | 104 ✗ | 104 ✗ | 2 | 2 |
| M13 | 6 | — | 8 | 8 | n/a | n/a |
| M14 | 35 | tech:data | 47 ✗ | 47 ✗ | 2 | 2 |
| M15 | 12 | admin:rh | 2 | 2 | 2 | 2 |
| M16 | 21 | admin:secretariat | 2 | 2 | 2 | 2 |
| M17 | 22 | — | 8 | 8 | n/a | n/a |
| M18 | 96 | tech:code | 30 ✗ | 30 ✗ | 2 | 2 |
| N11 | 16 | transport:entrepot | 140 ✗ | 140 ✗ | 1 | 1 |
| N12 | 10 | transport:exploitation | 52 ✗ | 52 ✗ | 5 | 5 |
| N13 | 8 | transport:exploitation | 25 ✗ | 25 ✗ | 1 | 1 |
| N21 | 4 | — | 61 ✗ | 61 ✗ | n/a | n/a |
| N22 | 13 | — | 29 ✗ | 29 ✗ | n/a | n/a |
| N31 | 18 | — | 98 ✗ | 98 ✗ | n/a | n/a |
| N32 | 11 | — | 429 ✗ | 429 ✗ | n/a | n/a |
| N41 | 35 | transport:conduite | 71 ✗ | 71 ✗ | 2 | 2 |
| N42 | 6 | — | 4 | 4 | n/a | n/a |
| N43 | 6 | — | 104 ✗ | 104 ✗ | n/a | n/a |
| N44 | 6 | transport:conduite | 27 ✗ | 27 ✗ | 1 | 1 |