# DESIGN.md : système visuel du site « La grande transmission »

Ce fichier est le contrat de design du site (`site/`). Toute évolution de l'interface doit s'y conformer ou le
mettre à jour. Il a été établi avec la méthode du plugin `frontend-design` de Claude Code (plan, relecture
contre le brief, construction, auto-critique sur captures d'écran). Le format s'inspire des `DESIGN.md`
portables du projet open-design.

## Brief

- **Sujet** : la « grande transmission » (9 059 Md€ transmis entre 2025 et 2040) et l'impôt sur les grandes
  successions proposé par la Fondation Jean-Jaurès (novembre 2024).
- **Public** : tout le monde, sans connaissance fiscale préalable. Lisibilité avant tout.
- **Fonction principale** : répondre à « qu'est-ce que ça change pour moi ? », pour mon héritage et, si les
  recettes allaient aux actifs, pour mon salaire.
- **Ton** : neutre tendant vers le militant. Les chiffres sont sourcés et prudents. Le cadrage des titres,
  lui, assume une question politique (« Et si cet argent revenait à celles et ceux qui travaillent ? »).

## Direction : le formulaire administratif, tamponné

Le monde du sujet, c'est la déclaration de succession, le formulaire Cerfa, l'acte notarié. Le site en
reprend le papier vert-de-gris, l'encre bleu-noir et les cases de saisie encadrées. Le verdict du simulateur
est posé comme un **tampon** légèrement de travers. C'est le seul élément appuyé de la page : tout le reste
reste calme.

## Couleurs (`site/styles/tokens.css`)

| Jeton | Clair | Sombre | Rôle |
|---|---|---|---|
| `--papier` | `#eef2ec` | `#141b2d` | fond, papier de formulaire |
| `--papier-case` | `#f8faf6` | `#1b2338` | cases de saisie, panneaux de résultat |
| `--encre` | `#17223b` | `#e8ecf3` | texte principal, bleu-noir d'encre |
| `--tampon` | `#b3261e` | `#f07368` | ce que paient les plus grandes successions |
| `--actifs` | `#16735a` | `#4cc29d` | ce qui revient aux actifs, les baisses d'impôt, et l'argent ajouté à un budget |
| `--trame` | `#c9d2c7` | `#34405a` | filets, bordures |

Séries des graphiques, validées avec `dataviz/validate_palette.js` (séparation daltonisme, contraste,
luminosité) : clair `#3a67b5`, `#1a8c6c`, `#c8372d` ; sombre `#5e86d6`, `#2a9d7b`, `#e0584a`.
Le bleu représente toujours le droit actuel ou le pilier 1, le rouge le top 1 % ou le pilier 2, le vert les actifs
et, dans les jauges de budget, la somme ajoutée par la répartition (le budget actuel est en gris neutre).

## Typographie

- **Archivo** (axe de largeur 62 à 125) pour les titres et les chiffres. Condensée (`wdth` 68) pour l'affiche
  d'ouverture, élargie (`wdth` 118 à 125) pour la marque et le tampon.
- **Atkinson Hyperlegible Next** pour le texte courant. Conçue pour les lecteurs malvoyants, elle sert le
  « par tout le monde ».
- Longueur de ligne ≤ 68 caractères (`--largeur-texte`).

## Mise en page

```
┌ en-tête collant : marque ─────────────── navigation ── thème ┐
│                                                              │
│ AFFICHE CONDENSÉE, 4 LIGNES, ALIGNÉE À GAUCHE                │
│ chapeau                                                      │
│ [██ 8 €][██████ 37 €][██████████████ 55 €]  ruban            │
├──────────────────────────────────────────────────────────────┤
│ La réforme : texte, 3 chiffres, 3 piliers, colonnes 2025-2040│
├──────────────────────────────────────────────────────────────┤
│ Mon héritage   [formulaire]        [résultat collant+tampon] │
│                courbe « taux moyen selon le montant reçu »   │
├──────────────────────────────────────────────────────────────┤
│ Mon salaire, deux onglets (intercalaires de dossier) :       │
│  1. Mon gain sur le salaire [formulaire] [résultat+tampon]   │
│  2. Salaire ou services publics [curseurs + jauges] [bilan]  │
│     (mobile : bandeau « reste à répartir » collé en bas)     │
├──────────────────────────────────────────────────────────────┤
│ Méthode : 3 colonnes (étude / simulateur / limites)          │
└──────────────────────────────────────────────────────────────┘
```

Tout est aligné à gauche. Sur mobile, une seule colonne et la navigation disparaît.

### Page retraites

Même système. L'ouverture reprend le ruban « sur 100 € » : vert pour les cotisations, bleu pour l'État,
rouge pour les impôts, gris pour le reste. Trois onglets (TVA sociale, CSG des retraités, retraites sans
impôts) ; le dernier enchaîne sur le répartiteur de l'argent public libéré. Vient ensuite « Retraités et
actifs : qui vit le mieux ? », inspiré du graphique du Financial Times : vert pour les personnes en emploi,
bleu pour les retraités, gris discret pour l'ensemble. L'état « après réforme » est toujours un anneau creux,
sur les courbes comme sur les barres ; l'état passé (1996) un point plein noir.

## Principes

1. **Un seul élément appuyé** : le tampon. On n'ajoute pas d'autre effet visuel fort.
2. **La numérotation est réservée aux vraies séquences**. Les piliers 1, 2, 3 sont ceux de l'étude.
3. **Onglets** : des intercalaires de dossier, l'onglet actif prolonge la feuille. Le premier onglet
   reste le simulateur de salaire, le plus direct ; le second élargit le choix aux services publics.
4. **Mouvement** : un seul déroulé à l'ouverture (le ruban), et la frappe du tampon quand le verdict change.
   Les deux respectent `prefers-reduced-motion`.
5. **Ce qu'on évite** : étiquettes en capitales, mots isolés en couleur dans un titre, flèches ajoutées aux
   liens, cartes identiques avec ombre partout, fond crème et accent terracotta.
6. **Graphiques** : un seul axe, traits de 2 px, colonnes ≤ 24 px, légende dès deux séries, infobulle au
   survol et au clavier, et **toujours** une table de données jumelle.
7. **Honnêteté** : toute hypothèse qui ne vient pas de l'étude est signalée comme « variante du simulateur ».
8. **Socle d'accessibilité** : focus visible, contraste AA, thème sombre, lien d'évitement, calcul local
   sans envoi de données.
