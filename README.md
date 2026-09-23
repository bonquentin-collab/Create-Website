# La grande transmission

Simulateur citoyen sur l'héritage et la redistribution vers les actifs. Il part de l'impôt sur les grandes
successions (IGS) proposé par la Fondation Jean-Jaurès en novembre 2024 et répond à deux questions :

- **Mon héritage** : combien paierais-je avec le droit actuel, et avec la réforme ?
- **Mon salaire** : que gagnerais-je si une part des recettes était reversée aux actifs ? Cette partie est une
  variante du simulateur : l'étude, elle, affecte les recettes à la transition écologique, à la recherche et à l'éducation.

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
