# Dilution, le jeu du fondateur

Un jeu de cartes à deux choix (glisser à gauche ou à droite) sur le parcours d'un fondateur de startup. Vous levez des
fonds, signez des term sheets, recrutez, survivez aux crises… et découvrez à la vente ce que vous touchez vraiment.

Le sujet central est la dilution qu'on ne voit pas venir : un BSA AIR qui ne change rien le jour de la signature, un pool
BSPCE créé avant la levée, une anti-dilution qui se réveille pendant une crise, une préférence de liquidation
participative qui passe devant vos actions à la vente.

En ligne : https://bonquentin-collab.github.io/Create-Website/fondateur/

## Ce que le joueur voit

- **Quatre jauges** (Trésorerie, Équipe, Produit, Investisseurs) : si l'une tombe à zéro, la partie s'arrête.
- **La galette** : votre part du capital. La fève indique qui contrôle le board. Avant un choix, un point annonce les
  jauges qui vont bouger, mais seule la dilution visible (l'argent du nouvel investisseur) est annoncée sur la galette.
- **Les outils pédagogiques**, pour qui veut comprendre :
  - « Décrypter cette offre » : ce que dit chaque clause, le calcul pas à pas (pré-money effective, prix par action,
    conversion du BSA AIR, anti-dilution, part réelle contre règle de trois) et ce que vous toucheriez à la vente ;
  - « Pourquoi ? » sous la carte et le journal : chaque variation de votre part avec son explication ;
  - le lexique : définition simple, exemple chiffré et piège pour chaque terme, cliquable depuis les cartes ;
  - le mode prof : surligne les clauses piégeuses et signale toute la dilution, même différée ;
  - l'écran de fin : ce que vous pensiez toucher, ce que vous touchez, le film de la dilution et la cascade.

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `index.html` | la page du jeu |
| `css/style.css`, `css/jeu.css` | système visuel (feutre bleu, papier, surligneurs, galette) |
| `js/captable.js` | moteur de cap table, sans DOM : levées, pool, anti-dilution, BSA AIR, cascade |
| `js/etat.js` | état d'une partie et petits outils (jauges, journal, dilution expliquée) |
| `js/moteur.js` | règles : mois qui passent, levées et offres, ventes, fins, aperçus, décryptage |
| `js/cadres/` | cadres nationaux (`fr.js`) : noms des instruments, usages, financements locaux |
| `js/contenus/fr/` | cartes, personnages, textes, lexique et mise en forme en français |
| `js/ui.js` | interface : rendu, glisser, fenêtres pédagogiques |
| `js/portraits.js`, `js/galette.js`, `js/icones.js` | dessins en SVG |
| `maquettes/` | maquettes d'intention (HTML et captures) |

## Ajouter un autre pays

Le moteur ne manipule que des notions neutres (`convertible`, `stockOptions`, préférences…). Pour un cadre européen ou
un autre pays :

1. copier `js/cadres/fr.js` (par exemple en `de.js`) et l'enregistrer dans `js/cadres/index.js` ;
2. créer `js/contenus/<langue>/` sur le modèle de `contenus/fr/` (cartes universelles traduites, cartes propres au pays,
   lexique avec les noms locaux : VSOP, Wandeldarlehen…) ;
3. importer ces contenus dans `js/ui.js` à la place de `contenus/fr/`.

## Simplifications assumées

Chiffres stylisés ; séries d'actions de préférence traitées pari passu ; pool BSPCE compté comme entièrement
attribué ; pas de fiscalité ; un seul fondateur joueur. Ce jeu n'est ni un conseil juridique ni un conseil financier.

## Tests

`npm test` à la racine du dépôt : calculs de la cap table (levées, pool, BSA AIR, anti-dilution, cascade) et 300
parties jouées au hasard (aucune erreur, chaque partie se termine, la cascade distribue exactement le prix de vente).

Rien n'est envoyé : tout se calcule dans le navigateur. Seuls le mode prof et le meilleur score sont gardés dans le
`localStorage` du visiteur.
