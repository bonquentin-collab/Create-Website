# EU Funding Gateway

Guichet unique **non officiel** des financements européens accessibles aujourd’hui :

| Périmètre | Source | Mode |
|---|---|---|
| Subventions en gestion directe (Horizon Europe, Digital Europe, LIFE, CEF, Erasmus+, EU4Health, EDF…) | API de recherche du portail *Funding & Tenders* (SEDIA) | Flux live |
| Financement en cascade (aides redistribuées à des tiers par des projets européens) | SEDIA | Flux live |
| Action extérieure (appels à propositions INTPA / NEAR) | SEDIA | Flux live |
| Marchés publics des institutions de l’UE | SEDIA | Flux live |
| Fonds de cohésion 2021-2027 (FEDER, FSE+, FC, FTJ, Interreg, FEAMPA, FAMI, FSI, IGFV), 27 États membres | Cohesion Open Data (Socrata, jeu `hgyj-gyin`) | Catalogue |
| Instruments financiers (InvestEU, BEI, FEI, EIC, instruments des fonds de cohésion) | Catalogue éditorial relu (`tools/financements-ue/catalog/instruments.json`) | Catalogue |

Le site est statique (HTML, CSS et modules ES, sans étape de build). Il est publié sous `/financements-ue/` par le workflow du dépôt, qui collecte aussi les données chaque jour.

En ligne : https://bonquentin-collab.github.io/Create-Website/financements-ue/

## Démarrer

Depuis la racine du dépôt :

```bash
node tools/financements-ue/run.mjs                      # collecte toutes les sources → financements-ue/data/*.json (≈ 40 s)
python3 -m http.server 8080 --directory financements-ue # http://localhost:8080
npm test                                                # tous les tests du dépôt, dont tests/financements-ue-*.test.mjs
```

Node ≥ 20 suffit. Le projet n’a aucune dépendance npm.

## Architecture

```
tools/financements-ue/
    run.mjs                  orchestrateur : exécute les adaptateurs, écrit financements-ue/data/, calcule le diff
    adapters/index.mjs       registre des sources (point d’extension)
    adapters/sedia.mjs       portail Funding & Tenders (4 adaptateurs : grants, cascade, external, tenders)
    adapters/cohesion.mjs    programmes de cohésion 2021-2027 par État membre
    adapters/instruments.mjs catalogue des instruments financiers
    catalog/instruments.json contenu éditorial relu
    lib/schema.mjs           schéma normalisé « Opportunity » et validation
financements-ue/             site publié
    index.html
    data/                    meta.json, opportunities.json, cohesion.json, instruments.json (générés)
    assets/js/config.mjs     configuration runtime (base des données, polling, SSE)
    assets/js/data/source.mjs  couche d’accès aux données (StaticJsonSource)
    assets/js/views/         explorateur, calendrier, tableau de bord, fonds régionaux, instruments, sources, détail
tests/financements-ue-*.test.mjs
```

### Flux de données

```
 sources publiques ──► adaptateurs ──► schéma normalisé ──► financements-ue/data/*.json ──► DataSource ──► vues
   (SEDIA, Cohesion       (run.mjs, quotidien        (validation, diff,          (polling meta.json
    Open Data, catalogue)  via GitHub Actions)        résilience)                 ou SSE plus tard)
```

- **Requalification des statuts.** Le portail laisse « ouverts » des appels dont la date limite est passée. Chaque enregistrement est requalifié : il est retiré quand toutes ses dates limites sont passées, ou quand il n’a pas de date limite et date de plus d’un an. Les avis de préinformation (`-PIN`) passent en « à venir ».
- **Résilience.** Une source en échec ne vide jamais les données : ses enregistrements précédents sont conservés et marqués `stale` dans `meta.json`. Une chute brutale du volume (< 20 % du précédent) est traitée comme un échec.
- **Fraîcheur.** `meta.json` contient l’heure de génération, l’état et le volume de chaque source, et le diff avec la collecte précédente (ajouts et retraits). Chaque opportunité porte un `firstSeen`, qui alimente le badge « Nouveau ».

## Vers le temps réel

La structure est prête ; il suffit de changer le transport :

1. **Collecte plus fréquente.** Modifier le `cron` du workflow (par exemple `0 * * * *`). Les onglets ouverts détectent la nouvelle version via `meta.json` (polling toutes les 10 min, configurable dans `config.mjs`) et se mettent à jour sans rechargement, avec une notification du nombre de nouvelles opportunités.
2. **Backend API.** Servir les mêmes documents (`meta`, `opportunities`, `cohesion`, `instruments`) depuis une API et pointer `config.DATA_BASE` vers elle. Les adaptateurs de `tools/financements-ue/` peuvent tourner tels quels dans un worker (ils n’écrivent que des tableaux d’objets normalisés).
3. **Push.** Définir `config.LIVE_STREAM_URL` sur un endpoint Server-Sent Events qui émet `{"type":"update"}`. `StaticJsonSource` abandonne alors le polling et recharge à chaque événement.
4. **Alertes e-mail et comptes.** Ces fonctions demandent un backend (stockage des abonnements). Le diff de `meta.json` et `firstSeen` fournissent déjà la matière (« nouveaux appels correspondant à mes filtres »). Les filtres sont sérialisés dans l’URL (`#/?nature=grant&programme=…`) et peuvent servir directement de définition d’alerte.

## Ajouter une source

Exemple : les appels FEDER d’une région, un portail national ou TED.

1. Créer `tools/financements-ue/adapters/ma-source.mjs` qui exporte un objet `{ id, label, description, output: 'opportunities', mode: 'live', homepage, run }`.
2. `run({ log, today, outputs })` renvoie `{ items, stats }`, où chaque item respecte le schéma documenté dans `tools/financements-ue/lib/schema.mjs` (`kind`, `status`, `title`, `deadline`, `url`…).
3. L’ajouter au tableau `adapters` de `tools/financements-ue/adapters/index.mjs`.

Le front n’a rien à changer : filtres, calendrier, tableau de bord et page Sources prennent la nouvelle source en compte automatiquement. Pour une nouvelle *nature* de financement, ajouter son libellé dans `KINDS` (schéma) et `KIND_LABELS` (`financements-ue/assets/js/lib/format.mjs`).

## Déploiement

Le workflow du dépôt (`.github/workflows/site.yml`) :

- lance tous les tests sur chaque pull request ;
- collecte les données chaque jour à 05:17 UTC (ou à la demande via *Run workflow*) et commite `financements-ue/data/` sur `main` ;
- publie le site principal, `/campagne/` et `/financements-ue/` sur GitHub Pages.

## Design

Direction « institutionnel épuré », volontairement distincte de l’identité visuelle officielle de l’UE pour éviter toute confusion.

- Une seule famille, Public Sans, avec chiffres tabulaires pour les montants et les dates.
- Papier bleu-gris froid, encre marine, bleu d’État pour l’action.
- Vert, ambre et rouge réservés aux statuts (ouvert, à venir, clôture imminente), toujours accompagnés d’un libellé.
- Élément signature : la frise des clôtures sur 26 semaines, cliquable pour filtrer par semaine.
- Graphiques à série unique, couleur validée (contraste et bande de luminosité) en clair et en sombre, avec une vue tableau pour chaque graphique.

## Limites connues

- Les montants sont indicatifs : budget d’un topic, valeur estimée d’un marché, enveloppe d’un programme. Certains budgets Horizon Europe mutualisés entre plusieurs topics ne sont comptés que sur le premier.
- Les appels des programmes de cohésion sont publiés par chaque autorité de gestion (plusieurs centaines de sites) ; ils ne sont pas encore collectés. Le site renvoie vers les programmes et l’annuaire des autorités.
- Le catalogue des instruments financiers est éditorial : il est à relire à chaque révision des programmes (champ `reviewed`).
