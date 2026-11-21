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