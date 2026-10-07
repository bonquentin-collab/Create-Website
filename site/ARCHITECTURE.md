# Architecture du site

Site statique, sans étape de compilation ni dépendance : HTML, CSS et modules JavaScript natifs.
On le publie tel quel (GitHub Pages) et on le teste avec `node --test`.

```
site/
├── index.html                  page héritage ; chaque section active porte data-module="…"
├── retraites.html              page retraites : TVA sociale, CSG des retraités, financement des retraites
├── styles/
│   ├── tokens.css              couleurs, polices, espacements (clair et sombre) ; voir DESIGN.md
│   ├── base.css                éléments de base
│   └── composants.css          un bloc par composant
└── js/
    ├── main.js                 relie chaque data-module à son module d'interface
    ├── engine/                 calculs purs, sans DOM, testés
    │   ├── bareme.js           barèmes progressifs
    │   ├── succession.js       impôt d'un héritier : droit actuel, barème sur la vie entière
    │   ├── repartition.js      répartition d'une enveloppe, effet sur un budget, lien de partage
    │   ├── retraites.js        retraites financées par des ressources propres : trou, pensions, cotisations
    │   ├── prelevements.js     TVA sociale, taux et alignement de la CSG des retraités
    │   ├── niveau-de-vie.js    effets des réformes sur le niveau de vie d'un actif et d'un retraité
    │   └── format.js           nombres et euros à la française
    ├── params/                 paramètres sourcés
    │   ├── droit-actuel.js     CGI : barème, abattements, assurance-vie
    │   ├── macro.js            Insee : emploi, masse salariale
    │   ├── budgets.js          destinations possibles et budget actuel de chacune (PLF/PLFSS 2025)
    │   ├── retraites.js        ressources des retraites 2025 par nature (COR 2026), pensions, controverse
    │   ├── prelevements.js     TVA et CSG : taux, rendements, effets sur les prix (Trésor, CCSS, Insee)
    │   ├── niveau-de-vie.js    niveaux de vie médians 1996-2024 et par âge (Insee), composition des revenus (COR)
    │   └── logement.js         besoins selon l'âge : loyers imputés, propriétaires, endettement, épargne
    ├── reforms/                une réforme par fichier, plus le registre index.js
    │   └── igs-jean-jaures.js  données de l'étude (barème, piliers, recettes 2025-2040)
    ├── redistribution/
    │   ├── scenarios.js        façons de verser aux actifs la part qui leur revient
    │   └── repartitions.js     répartitions toutes faites (celle de l'étude, tout aux salaires…)
    └── ui/                     un module par section ou onglet, plus les graphiques SVG
        └── composants/
            └── repartiteur.js  répartiteur réutilisable (salaires ou services publics) : il sert aux
                                recettes de l'IGS et à l'argent public libéré sur la page retraites
```

## Règles

- **Le calcul ne touche jamais au DOM.** Tout ce qui est dans `engine/`, `params/`, `reforms/` et
  `redistribution/` s'importe dans Node et se teste dans `tests/`.
- **Chaque chiffre porte sa source**, dans le fichier de données qui le contient.
- **Ce qui ne vient pas de l'étude est signalé** (`extension: true` pour les scénarios, texte « variante du simulateur »).

## Ajouter…

**Une réforme** : créer `js/reforms/ma-reforme.js` sur le modèle d'`igs-jean-jaures.js` (source, barème,
recettes), l'inscrire dans `js/reforms/index.js` avec sa fonction `calculer(situation)`. Si elle ne suit pas
un barème sur la vie entière, écrire sa fonction dans `engine/succession.js` et la tester.

**Un service public** (culture, sport, défense…) : ajouter un objet au tableau de `js/params/budgets.js`,
avec son budget actuel et sa source. L'outil « Ma répartition » affiche automatiquement son curseur et sa jauge.

**Une réforme qui doit apparaître sur le graphique des niveaux de vie** : dans son module d'onglet, appeler
`publier(id, { label, actifs, retraites })` de `js/ui/etat-reformes.js` avec l'effet en part du revenu
disponible (calculé dans `engine/niveau-de-vie.js`). La section « niveaux de vie » la liste d'elle-même.

**Une nouvelle page** : copier `retraites.html` (en-tête, pied, styles et `js/main.js` sont partagés),
poser ses sections avec `data-module`, inscrire les modules dans `main.js` et ajouter le lien dans la
navigation des autres pages.

**Une répartition toute faite** : ajouter un objet à `js/redistribution/repartitions.js` (parts relatives).

**Une façon de verser la part des actifs** (prime d'activité, ciblage des bas salaires, etc.) : ajouter un
objet au tableau de `js/redistribution/scenarios.js`. L'interface le liste automatiquement.

**Une section** : écrire `js/ui/ma-section.js` qui exporte `monter(element, contexte)`, l'inscrire dans
`main.js`, puis poser `<section data-module="ma-section">` dans `index.html`.

**Un calcul complexe** (microsimulation, OpenFisca, données Insee détaillées) : le faire tourner hors du
navigateur (script Python, par exemple dans `analysis/`), exporter le résultat en JSON dans
`site/data/`, puis le charger depuis un module avec `fetch`. Le site reste statique.

## Commandes

```sh
npm test            # tests du moteur (Node ≥ 20, aucune installation)
npm run serve       # http://localhost:8000
```

## Pages et navigation

Deux espaces, trois pages chacun, plus un accueil :

| Page | Espace | Rôle |
|---|---|---|
| `index.html` | accueil | deux cartes : Héritage, Retraites |
| `heritage.html` / `retraites.html` | Comprendre | contexte, chiffres, graphiques sans réglage |
| `heritage-simuler.html` / `retraites-simuler.html` | Simuler | rappel chiffré, simulateurs, effets (niveaux de vie, camembert) |
| `heritage-methode.html` / `retraites-methode.html` | Méthode | sources et limites |
| `sante.html`, `sante-simuler.html`, `sante-methode.html` | Santé | contexte santé ; Simuler : leviers sur les retraités et bouclier santé |

Chaque page déclare `<body data-espace="…" data-page="comprendre|simuler|methode">` ; l'en-tête
(`ui/entete.js`, `data-module="entete"`) en déduit l'interrupteur Héritage | Retraites et la sous-navigation,
et redirige les anciennes ancres (`index.html#repartition`, `retraites.html#gel`…) vers la bonne page.
Règle : un contenu sans réglage va dans « Comprendre » ; un contenu qui réagit aux choix va dans « Simuler »,
précédé d'un rappel de contexte court (`section.rappel`). Pour ajouter une page à un espace : l'inscrire dans
`ESPACES` (entete.js) et copier l'en-tête d'une page existante.

## Camembert des dépenses publiques

Le répartiteur (`ui/composants/repartiteur.js`) affiche sous ses curseurs deux anneaux « aujourd'hui → avec vos
choix » (`ui/graphiques/camembert.js`). Les postes et leurs montants sont dans `params/depenses.js` (COFOG 2024,
pensions des fonctionnaires rendues à l'éducation et à la défense) ; le calcul est dans `engine/depenses.js`.
Une destination du répartiteur abonde un poste via son champ `poste` (`params/budgets.js`). Une page peut aussi
faire baisser les pensions avec `repartiteur.definirBaissePensions(taux)` (page retraites).
Sur les deux pages, le camembert est dessiné dans une section visible à part (`#depenses`, `<div data-depenses>`),
via l'option `zoneDepenses` du répartiteur ; sans cette option, il se place sous les curseurs.

## Gel des hautes pensions (onglet 4 de la page retraites)

`params/gel-pensions.js` (distribution Drees EIR 2020, facteur de passage à 2026, contexte), `engine/gel-pensions.js`
(`auDessusDuSeuil`, `economieGel`, `perteMensuelle`, `trajectoireEconomie`, `valeurTrimestre`), `ui/gel-pensions.js`.
Calage IPP (`gel.ipp`) : pension de base = deux tiers du total, économie nette des finances publiques ×0,78, option
« futurs retraités » (baisse du taux d'annuité à la liquidation) contre érosion de 3 %/an (`gel.sortieAnnuelle`). L'économie est reversée aux actifs en
baisse de CSG et publiée dans le registre des réformes (`publier("gel", …)`) pour le graphique des niveaux de vie.
Quand la Drees publiera l'EIR 2024, remplacer `tranches` et ramener `facteur2026` près de 1.

## Santé par âge (page Retraites › Comprendre)

`params/sante.js` (financeurs Drees 2024, dépense par âge Drees 2023, prélèvements par âge Insee 2019),
`engine/sante.js` (`financementSanteParAge`, `concentration`), `ui/sante-age.js`. Le financement par âge est une
estimation du site : prélèvements de chaque âge × part de la santé dans l'ensemble des prélèvements.

## Rendement des cotisations par génération (Retraites › Comprendre)

`params/rendement.js` (TRI du COR par génération et par profil, durées de carrière et de retraite, part des
ressources hors cotisations 1987-2025), `engine/rendement.js` (`recuPour100000`, calé sur le TRI du COR),
`ui/rendement-generations.js` (curseur d'actualisation, option impôts, barres avec ligne d'équilibre).

## Plafond des pensions (onglet 5 de Retraites › Simuler)

`engine/plafond.js` (`economiePlafond`, `pertePlafond`, sur la distribution des pensions de `params/gel-pensions.js`),
`ui/plafond-pensions.js` : l'économie alimente un répartiteur (préfixe `pl`, lien `#plafond`) et le graphique des
niveaux de vie (`publier("plafond", …)`).

## Santé › Simuler : qui doit payer pour la santé

`params/sante-reformes.js` (déficit maladie 2026, exposition des niveaux de vie aux taux de CSG, effort en primes et
restes à charge par dixième Drees ER 1345), `engine/sante-reformes.js` (`groupesEffort`, `coutBouclier`,
`recettesRetraites`, `effortAjouteRetraites`, `perteRetraiteSante`), `ui/sante-reformes.js` (module `sante-reformes`).
Le coût du bouclier suppose des revenus égaux entre groupes (majorant) et un effort linéaire dans chaque groupe.

Gros consommateurs et complémentaires (même module) : `leviersUsagers` (franchises et participations, ticket
modérateur des consultations, ALD, dépassements d'honoraires, TSA et TSA induite, forfait social des contrats
d'entreprise ; chaque levier dit ce que gagne l'Assurance maladie et qui paie : patients, primes, employeurs,
médecins, avec une répartition par âge) et `effortAjouteUsagers` (points d'effort par niveau de vie). Franchises :
`franchisesParAge`, modèle log-normal par âge (`calerFranchises`, `moyennePlafonnee`) calé sur les franchises
observées en 2023 et contrôlé par deux chiffrages officiels (test dédié). Le bouclier est recalculé sur les efforts
relevés par ces leviers.

## Bilan : toutes les mesures, sans double compte (bilan.html)

`ui/etat-bilan.js` : mémoire commune (localStorage `bilan-mesures-v1`). `enregistrerMesure(id, { espace, label, lien,
reglages, net, usages, usagePrincipal, ressources, effet, details })` ; `publier()` de `etat-reformes.js` l'appelle
quand on lui passe `bilan`, la page Santé et l'Héritage (`ui/repartition.js`, mesure `igs`) l'appellent directement.
`memoriserFormulaire(form, cle, idMesure)` garde les réglages d'une visite à l'autre et marque la mesure comme
réglée (retenue par défaut dans le Bilan). Ressources (affectation unique) : `csg-pensions-normal`,
`csg-pensions-median`, `tva`, `igs` ; `detenteur()` dit quelle mesure garde une ressource (choix de l'utilisateur,
sinon la première réglée). `ui/avis-ressource.js` affiche l'avis « déjà utilisée ailleurs » et le bouton de
réaffectation dans les simulateurs (Santé, Retraites › CSG). `engine/bilan.js` (`calculerBilan`, pur, testé) :
recettes recalculées après affectation, effets croisés (taux visé par l'alignement après TVA sociale, assiette des
pensions réduite par gel / plafond / baisse, retour d'impôt sur la baisse de CSG des actifs, impôt perdu sur la CSG
santé, revalorisation des pensions après TVA), solde par usage et niveaux de vie cumulés. `ui/bilan.js` : la page.
Pour ajouter une mesure au Bilan : l'enregistrer avec ses `usages` (actifs, services, maladie, autres) et, si elle
partage une recette avec une autre, la même clé de `ressources`.

## Chiffrage de l'IGS (Héritage › Comprendre, repris par Simuler)

`params/igs-chiffrage.js` (hypothèses du classeur de l'étude et scénario « Actualisé 2026 » : PIB Insee 2025, DMTG
Voies et moyens PLF 2026, patrimoine Insee-BdF 2024, PFU 31,4 %), `engine/igs-chiffrage.js` (`chiffrerIgs` : flux
successoral, pilier 1, pilier 2, taux effectifs ; reproduit le classeur à 0,01 Md€ près, voir le test),
`ui/etat-heritage.js` (scénario et hypothèses modifiées mémorisés dans `localStorage`, `appliquerChiffrage` remplace
`reforme.recettes` et `reforme.contexte` au démarrage dans `main.js`), `ui/reforme.js` (bascule et curseurs),
`ui/methode-chiffrage.js` (tableau des hypothèses sur la page Méthode).

## Classeurs Excel de chiffrage (site/chiffrages/)

Un classeur par espace (Héritage, Retraites, Santé), téléchargeable depuis chaque page Méthode. Ils sont générés par
`tools/chiffrages/construire.sh` à partir des paramètres du site (`parametres.mjs` exporte `site/js/params` en JSON,
puis `heritage.py`, `retraites.py`, `sante.py` écrivent les formules avec openpyxl). Après une modification des
paramètres ou des moteurs, mettre à jour le script de l'espace concerné, relancer `construire.sh`, recalculer avec
LibreOffice et vérifier que les résultats par défaut sont ceux du site. `tools/chiffrages/verification.py` est le registre
de vérification (type, calcul, source, statut de chaque chiffre saisi) : il remplit la feuille « Vérification » et les
colonnes « Type » et « Comment c'est calculé » ; le tenir à jour quand un chiffre change.

## Calage sur l'IPP, note n° 129 (Retraites › Simuler et Méthode)

`params/ipp-retraites.js` (les neuf scénarios du tableau 1, profils, abattement de 10 %, effet net de la CSG).
CSG : assiettes de `params/prelevements.js` calées sur 1,5 et 4,2 Md€ nets, options `normal` et `median-normal`
(`alignementCsg` renvoie aussi `net`). Gel : `gel.facteur` (distribution portée à 2027) et `gel.profilBase` (part de
base selon la pension, `partDeBase`, `baseAuDessusDuSeuil`) redonnent les quatre chiffrages de l'IPP (test dédié).
Abattement : `engine/abattement.js`, `ui/abattement-pensions.js` (onglet 6). Encadré « à rendement égal » :
`ui/comparaison-ipp.js` ; tableau et détails du calage : `ui/methode-ipp.js`. Dans les onglets, le gain net est
reversé aux actifs (`effetCsgRetraites(recettes, ctx, verse)`).
