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

## Camembert des dépenses publiques

Le répartiteur (`ui/composants/repartiteur.js`) affiche sous ses curseurs deux anneaux « aujourd'hui → avec vos
choix » (`ui/graphiques/camembert.js`). Les postes et leurs montants sont dans `params/depenses.js` (COFOG 2024,
pensions des fonctionnaires rendues à l'éducation et à la défense) ; le calcul est dans `engine/depenses.js`.
Une destination du répartiteur abonde un poste via son champ `poste` (`params/budgets.js`). Une page peut aussi
faire baisser les pensions avec `repartiteur.definirBaissePensions(taux)` (page retraites).
Sur les deux pages, le camembert est dessiné dans une section visible à part (`#depenses`, `<div data-depenses>`),
via l'option `zoneDepenses` du répartiteur ; sans cette option, il se place sous les curseurs.
