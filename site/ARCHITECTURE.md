# Architecture du site

Site statique, sans étape de compilation ni dépendance : HTML, CSS et modules JavaScript natifs.
On le publie tel quel (GitHub Pages) et on le teste avec `node --test`.

```
site/
├── index.html                  structure de la page ; chaque section active porte data-module="…"
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
    │   └── format.js           nombres et euros à la française
    ├── params/                 paramètres sourcés
    │   ├── droit-actuel.js     CGI : barème, abattements, assurance-vie
    │   ├── macro.js            Insee : emploi, masse salariale
    │   └── budgets.js          destinations possibles et budget actuel de chacune (PLF/PLFSS 2025)
    ├── reforms/                une réforme par fichier, plus le registre index.js
    │   └── igs-jean-jaures.js  données de l'étude (barème, piliers, recettes 2025-2040)
    ├── redistribution/
    │   ├── scenarios.js        façons de verser aux actifs la part qui leur revient
    │   └── repartitions.js     répartitions toutes faites (celle de l'étude, tout aux salaires…)
    └── ui/                     un module par section ou onglet (simulateur-salaire, repartition,
                                onglets…), plus les graphiques SVG
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
