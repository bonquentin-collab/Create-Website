# L'héritage, ça se décide

Site de campagne sur la taxation des héritages, à part du site principal (`site/`), publié sous `/campagne/`.
Une seule page (`index.html`) et une annexe (`methode.html`), sans compilation ni dépendance.

```
campagne/
├── index.html, methode.html
├── styles/campagne.css        jetons de couleur (clair et sombre), mise en page
├── chiffrages/                classeur Excel (tools/chiffrages/campagne.py)
└── js/
    ├── main.js                relie les sections
    ├── donnees/sources.js     toutes les données, chacune avec sa source
    ├── moteur/                modèle calé sur le CAE et scénarios (calcul pur, testé dans tests/campagne.test.mjs)
    └── ui/                    graphiques, pédagogie, simulateur, recettes, image à partager
```

Tester : `npm test`. Voir en local : `python3 -m http.server 8000 --directory campagne`.
Les formulaires (soutien, envoi par mail) ne transmettent rien tant que l'outil de la campagne n'est pas branché.
