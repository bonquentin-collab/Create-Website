# Dilution, le jeu du fondateur

Un jeu de cartes sur le parcours d'un fondateur de startup : chaque mois, une situation qu'on tire à gauche, à droite
ou, quand il y a une option intermédiaire, vers le haut. Les choix sont expliqués la première fois, puis la carte suffit
(« Afficher les choix » et les flèches du clavier restent disponibles). Vous levez des fonds, choisissez vos investisseurs, recrutez, survivez aux crises… et découvrez à la vente ce que
vous touchez vraiment.

Le sujet central est la dilution qu'on ne voit pas venir : un BSA AIR qui ne change rien le jour de la signature, un pool
BSPCE créé avant la levée, une anti-dilution qui se réveille pendant une crise, une préférence de liquidation
participative qui passe devant vos actions à la vente.

En ligne : https://bonquentin-collab.github.io/Create-Website/fondateur/

## Ce que le joueur voit

- **Les levées** : toutes les offres arrivent ensemble sur une table (fonds « propre », fonds flatteur, corporate,
  club d'angels, fonds de croissance), avec des valorisations proches du marché français (Seed de 2 à 9 M€ de
  pré-money, Série A de 8 à 40 M€…). On choisit un **chef de file**, qui fixe la valorisation et les conditions, et
  éventuellement des fonds qui le **suivent** au même prix avec un ticket réduit. Un suiveur dont l'offre est plus de
  15 % sous la valorisation du chef de file refuse de suivre. Négocier une offre prend une à trois semaines ; écarter
  une offre ne prend pas de temps. Le texte rappelle la trésorerie restante, et quand elle est courte, qu'on n'a pas
  vraiment le choix.
- **Les conséquences** : une trentaine de cartes ne sortent jamais au hasard. Un choix les programme et elles reviennent
  quelques mois plus tard, avec un rappel du choix d'origine (« Suite de votre choix : … ») : le grand compte devient
  exigeant, la pub coûte de plus en plus cher, le fonds flatteur veut caser son neveu, la banque invoque ses covenants,
  le ratchet se rappelle à vous pendant la crise… Les liens choix → conséquence sont dans `js/contenus/fr/suites.js`.
- **Les dilemmes** (`js/contenus/fr/dilemmes.js`) : des choix sans bonne réponse évidente, où l'option la plus
  tentante coûte cher plus tard. Quitter la boîte pour un géant américain avant la fin de son vesting, hypothéquer son
  appartement, céder la place à un « CEO expérimenté », donner 5 % au CTO, protéger un commercial accusé de
  harcèlement, payer une rançon, déclarer 100 % de R&D pour la JEI, accepter un down round de ses propres
  investisseurs… Chacun programme ses conséquences.
- **La difficulté** : le produit s'use face à la concurrence, l'équipe se fatigue et la confiance s'érode chaque mois.
  En simulation (200 parties par profil), un joueur au hasard atteint une vente dans environ 30 % des cas, un joueur
  attentif dans environ 85 %.
- **Quatre jauges** (Trésorerie, Équipe, Produit, Investisseurs) : si l'une tombe à zéro, la partie s'arrête.
- **La galette** : votre part du capital. La fève indique qui contrôle le board. Au survol d'une carte de choix, un
  point annonce les jauges qui vont bouger ; sur la galette, seule la dilution visible est annoncée.
- **Le tableau de bord**, ouvert à la demande : cap table, chiffres (trésorerie, runway, MRR, burn) et board.
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
| `js/contenus/fr/` | cartes, dilemmes (`dilemmes.js`), cartes de conséquences (`suites.js`), personnages, textes, lexique et mise en forme en français |
| `js/ui.js` | interface : situation, cartes de choix, table des offres, fenêtres pédagogiques |
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
