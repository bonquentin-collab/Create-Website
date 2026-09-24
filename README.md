# La grande transmission

Simulateur citoyen sur l'héritage et la redistribution vers les actifs. Il part de l'impôt sur les grandes
successions (IGS) proposé par la Fondation Jean-Jaurès en novembre 2024 et répond à deux questions :

- **Mon héritage** : combien paierais-je avec le droit actuel, et avec la réforme ?
- **Mon salaire**, en deux onglets. D'abord le gain direct sur le salaire si une part des recettes allait
  aux actifs. Ensuite **salaire ou services publics** : chacun répartit les recettes entre le salaire net des actifs et des services publics
  (école, hôpital, recherche, transition écologique, logement, justice), comparés à leur budget actuel.
  La répartition se partage par un lien. L'étude, elle, affecte les recettes à la transition écologique,
  à la recherche et à l'éducation : le reste est une variante du simulateur.

Site en ligne : https://bonquentin-collab.github.io/Create-Website/

## Travailler sur le site

- Lancer en local : `npm run serve`, puis ouvrir http://localhost:8000 (Python requis)
- Tests du moteur de calcul : `npm test` (Node 20 ou plus récent, aucune installation)
- Système visuel : [`DESIGN.md`](DESIGN.md)
- Architecture et ajout de fonctionnalités (réformes, scénarios, sections) : [`site/ARCHITECTURE.md`](site/ARCHITECTURE.md)

## Déploiement

Le workflow `.github/workflows/site.yml` lance les tests sur chaque pull request et publie le dossier `site/`
sur GitHub Pages à chaque push sur `main`. À activer une fois : Settings, puis Pages, puis Source « GitHub Actions ».

## Sources

- Fondation Jean-Jaurès, [« Face à la grande transmission, l'impôt sur les grandes successions »](https://www.jean-jaures.org/publication/face-a-la-grande-transmission-limpot-sur-les-grandes-successions/), novembre 2024
- Code général des impôts, art. 777, 779 et 990 I
- Insee : emploi fin 2024, Comptes de la Nation 2024 (salaires bruts)
- Budgets de référence : PLF 2025, crédits de paiement par mission ([données ouvertes de Bercy](https://data.economie.gouv.fr/explore/dataset/plf25-depenses-2025-selon-destination/)) ; PLFSS 2025, Ondam « établissements de santé »
