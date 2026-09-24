# Financement du système de retraite français : données sourcées pour un simulateur

*Recherche effectuée le 24/09/2026. Les pages PDF citées sont les pages physiques du PDF, avec le numéro imprimé entre parenthèses.*

## 0. À lire d'abord

- **Une année plus récente que 2024 est disponible.** Le COR a publié son rapport annuel de **juin 2026** (11/06/2026), qui porte sur les comptes **2025**. Les deux années sont données ci-dessous :
  - 2025 : rapport COR 2026 ;
  - 2024 : rapport COR 2025.
- **Année recommandée pour le simulateur : 2025**, avec une réserve. En 2025, les régimes SNCF, RATP et mines, qui sont en extinction, ont été « intégrés financièrement » au régime général. L'État a versé à la Cnav une « contribution publique » de 5,0 Md€ pour les équilibrer. Le COR est ambigu sur la ligne où il range ce versement (voir §6, point 3). La ventilation 2024 ne pose pas ce problème et est fournie en variante.
- **Le COR a téléchargé et lu en entier : rapports 2025 et 2026 (PDF), note Beaufret/Fondapol, CAE Focus n°121, pages Fipeco, fiches REPSS de la Sécurité sociale.**
- **Plusieurs sources n'ont pas pu être lues directement** :
  - Le site de la DREES renvoyait « empty reply » en curl et 503 en WebFetch. Il en allait de même pour le PDF du 20/02/2025 de la Cour des comptes et pour le rapport d'activité du FSV.
  - Les chiffres DREES et Cour des comptes ci-dessous viennent donc d'intermédiaires qui les citent mot pour mot. Ils sont marqués **[secondaire]** et doivent être vérifiés dans le PDF d'origine avant publication.

---

## 1. Dépenses de retraite (ensemble des régimes obligatoires, base + complémentaires, y compris FSV, hors RAFP)

| Indicateur | Valeur | Année | Source | Page / table | Citation mot pour mot |
|---|---|---|---|---|---|
| Dépenses brutes de retraite | **422,2 Md€** | 2025 | COR, *Évolutions et perspectives des retraites en France*, rapport annuel juin 2026 — https://www.cor-retraites.fr/sites/default/files/2026-06/RA_2026_def.pdf | PDF p.67 (p.65) | « En 2025, les dépenses brutes du système de retraite s'élèvent à 422,2 milliards d'euros (Md€), soit 14,1 % du PIB » |
| Dépenses en % du PIB | **14,1 %** du PIB ; 24,3 % des dépenses publiques | 2025 | idem | PDF p.11 (p.9) | « En 2025, les dépenses de retraite représentent 422 milliards d'euros, soit 14,1 % du PIB et 24,3 % de l'ensemble des dépenses publiques. » |
| dont prestations de base + complémentaires (hors Aspa) | 401 Md€ : droit direct 361 Md€ (12,1 % du PIB), droit dérivé 39 Md€ (1,3 % du PIB) | 2025 | idem | PDF p.67 (p.65) | « 401 Md€ sont consacrés aux prestations de retraite de base et complémentaire (hors Aspa), dont 361 Md€ aux pensions de droit direct de retraite (soit 12,1 % du PIB) et 39 Md€ aux pensions de droit dérivé » |
| Dépenses nettes de prélèvements (CSG, CRDS, Casa, maladie) | 394 Md€ (13,2 % du PIB) | 2025 | idem | PDF p.67 (p.65) | « les dépenses nettes de prélèvements du système de retraite s'élevaient à 394 milliards d'euros en 2025, soit 13,2 % du PIB » |
| Dépenses brutes de retraite | **406,9 Md€ ; 13,9 % du PIB** | 2024 | COR, rapport annuel juin 2025 — https://www.cor-retraites.fr/sites/default/files/2025-06/RA_2025_def_publi.pdf | PDF p.57 (p.53) | « En 2024, les dépenses brutes du système de retraite s'élèvent à 406,9 milliards d'euros, soit 13,9 % du PIB » |
| dont droit direct / droit dérivé | 349 Md€ (12,0 % du PIB) / 39 Md€ (1,3 % du PIB) ; 388 Md€ de prestations hors Aspa | 2024 | idem | PDF p.57 (p.53) | « 388 milliards d'euros étaient consacrés aux prestations de retraite de base et complémentaire (hors Aspa), dont 349 Mds€ aux pensions de droit direct » |
| Dépenses nettes | 378 Md€ (12,9 % du PIB) | 2024 | idem | PDF p.58 (p.54) | « s'élevaient à 378 milliards d'euros en 2024, soit 12,9 % du PIB » |
| Pensions de vieillesse-survie (Comptes de la protection sociale, périmètre différent) | 370 Md€ ; 13,1 % du PIB | 2023 | DREES, *Les retraités et les retraites*, édition 2025 (31/07/2025) — **[secondaire]**, cité par Miroir Social : https://www.miroirsocial.com/participatif/un-nouvel-eclairage-sur-les-retraites-et-les-retraites-ledition-2025-de-louvrage-de-la | Vue d'ensemble (non vérifié) | « les pensions de vieillesse et de survie représentent 370milliards d'euros, soit 13,1% du produit intérieur brut » |

## 2. Ressources par nature — tableau du COR (Tableau 2.2)

### 2.1 Année 2025 — COR, rapport juin 2026, Tableau 2.2 « Structure des ressources du système de retraite en 2025 (y compris produits financiers) », PDF p.89 (p.87)

La source indiquée sous le tableau est : « rapport à la CCSS 2025, calculs SG-COR ».

| Ligne (libellé du COR) | Md€ | % |
|---|---|---|
| **Cotisations hors contribution d'équilibre** | **277,0** | **65,6 %** |
| – Cotisations non-salariés | 14,5 | 3,4 % |
| – Cotisations salariés | 100,9 | 23,9 % |
| – Cotisations employeurs (hors opérateurs de l'État) | 154,6 | 36,6 % |
| – Cotisations des opérateurs de l'État | 7,1 | 1,7 % |
| **Contributions d'équilibre (dont cotisations imputées au sens de la CN)** | **49,3** | **11,7 %** |
| **Subventions équilibre** | **7,7** | **1,8 %** |
| **ITAF et CSG** | **64,7** | **15,3 %** |
| – CSG | 21,9 | 5,2 % |
| – ITAF sur revenus d'activité (forfait social et taxe sur les salaires) | 17,9 | 4,2 % |
| – ITAF sur la consommation (dont transferts de TVA à l'Agirc-Arrco) | 17,4 | 4,1 % |
| – Autres ITAF | 7,4 | 1,8 % |
| **Transferts externes** | **16,5** | **3,9 %** |
| – dont CNAF | 11,2 | 2,7 % |
| – dont Unédic | 3,9 | 0,9 % |
| – Autres transferts externes | 1,3 | 0,3 % |
| Produits financiers | 5,6 | 1,3 % |
| Autres produits | 1,4 | 0,3 % |
| **TOTAL ressources** | **422,2** | **100 %** |

Autres passages du rapport sur ces ressources :
- Ressources hors produits financiers, PDF p.87 (p.85) : « En 2025, les ressources du système de retraite se sont élevées à 416,6 milliards d'euros hors produits financiers, et 422,2 milliards d'euros y compris produits financiers. »
- Ressources en % du PIB, PDF p.82 (p.80) : « les ressources du système de retraite représentaient 13,9 % du PIB en 2025 ».
- Commentaire du tableau, PDF p.88 (p.86) : « 65,6 % de ces ressources proviennent des cotisations sociales (277,0 milliards d'euros) en 2025 et 11,7 % (49,3 milliards d'euros) de la contribution de l'État en tant qu'employeur au régime de la fonction publique de l'État (FPE). Le reste des ressources est constitué : 1/ d'impôts et taxes affectés (Itaf), dont la CSG et des transferts de TVA en provenance de l'Urssaf à l'Agirc-Arrco en compensation des allègements de cotisations sur les bas salaires et de l'intégration financière des régimes spéciaux en fermeture, à hauteur de 64,7 milliards d'euros (15,3 %) et 2/ d'autres ressources qui proviennent des subventions d'équilibre des autres régimes spéciaux (1,8 %) et de transferts d'organismes tiers tels que l'assurance chômage ou la branche famille de la sécurité sociale (3,9 %) et 3/ d'autres ressources telles que les produits de financiers (1,3 %). »
- Solde, PDF p.93 (p.91) : « En 2025, le solde du système de retraite (régimes de base et régimes complémentaires) était déficitaire de 5,1 milliards d'euros (- 0,2 % du PIB), hors charges et produits financiers. En intégrant ces derniers, le système demeure déficitaire à hauteur de 1,3 milliard d'euros (Md€). »

### 2.2 Année 2024 — COR, rapport juin 2025, Tableau 2.2, PDF p.78 (p.74)

La source indiquée sous le tableau est : « rapport à la CCSS 2024, calculs SG-COR ».

| Ligne | Md€ | % |
|---|---|---|
| Cotisations hors contribution d'équilibre | **269,3** | 65,1 % |
| – non-salariés / salariés / employeurs (hors opérateurs) / opérateurs de l'État | 14,1 / 99,0 / 149,4 / 6,9 | 3,4 / 23,9 / 36,1 / 1,7 % |
| Contributions d'équilibre (dont cotisations imputées au sens de la CN) | **48,2** | 11,7 % |
| Subventions équilibre | **8,0** | 1,9 % |
| ITAF et CSG | **62,2** | 15,0 % |
| – CSG / ITAF revenus d'activité / ITAF consommation / autres ITAF | 21,7 / 16,1 / 17,2 / 7,1 | 5,3 / 3,9 / 4,2 / 1,7 % |
| Transferts externes | **16,4** | 4,0 % |
| – CNAF / Unédic / autres | 11,3 / 3,9 / 1,1 | 2,7 / 1,0 / 0,3 % |
| Produits financiers | 8,6 | 2,1 % |
| Autres produits | 0,9 | 0,2 % |
| **TOTAL** | **413,5** | 100 % |

Le solde 2024 est donné PDF p.83 (p.79) : « En 2024, le système de retraite était déficitaire de 1,7 milliard d'euros en ne tenant pas compte des charges et produits financiers […] En les réintégrant, le système de retraite reste toutefois en excédent de l'ordre de 4,1 milliards d'euros ».

### 2.3 FSV, CNAF, Unédic, et la contribution de l'État à la SNCF, la RATP et aux mines

- **Le FSV est inclus dans le périmètre consolidé du COR** (« Champ : ensemble des régimes […] y compris FSV, hors RAFP »). Ses versements aux régimes (validation des périodes de chômage, Aspa, etc.) sont donc des flux internes, qui n'apparaissent pas dans le tableau. Son financement externe (CSG, prélèvements sur le capital, etc.) figure dans la ligne ITAF. **Il ne faut pas ajouter les transferts du FSV aux ITAF : ce serait compter deux fois.**
- Ordres de grandeur du FSV (à titre indicatif, source REPSS « 1.5. Dépenses du Fonds de solidarité vieillesse », DSS-CCSS mai 2026, https://evaluation.securite-sociale.fr/home/retraite/1-4-depenses-du-fonds-de-solidar.html) :
  - « La prise en charge des cotisations s'est élevée à 16,1 Md€ » en 2025 ;
  - « les charges du FSV ont progressé de 5,7% en 2025 (soit +1,1 Md€ par rapport à 2024) » ;
  - « Pour son dernier exercice avant le transfert de ses missions à la CNAV » : le FSV est intégré à la Cnav depuis 2026 (COR 2026, note 15).
  - Pour 2024, un extrait trouvé par recherche web **[secondaire, non vérifié]** donne 15 324 M€ de prises en charge de validations, dont 12 651 M€ au titre du chômage (régimes de base).
- CNAF (droits liés aux enfants, AVPF) et Unédic (points Agirc-Arrco pour le chômage indemnisé) : c'est la ligne « Transferts externes » du COR (voir §2.1).
- Contribution de l'État pour la SNCF, la RATP et les mines en 2025 (REPSS « 1.4 », même site, https://evaluation.securite-sociale.fr/home/retraite/1-3-contribution-des-cotisations.html) : « la contribution publique de 5,0 Md€ reçue de l'État et destinée à équilibrer les régimes des mines, de la RATP et de la SNCF, dans le cadre de leur nouveau schéma de financement ».

## 3. « Un tiers des retraites financé par l'impôt / l'argent public » : qui le dit, comment c'est calculé

| Auteur | Chiffre | Année des données | Méthode | Référence et citation |
|---|---|---|---|---|
| **COR lui-même** (synthèse) | 277 Md€ sur 417 Md€, soit « près des deux tiers » en cotisations ; donc environ 1/3 d'autres ressources | 2025 | Il retranche les cotisations effectives des ressources hors produits financiers. Le reste regroupe : la contribution d'équilibre de l'État au régime de la FPE, les subventions d'équilibre aux régimes spéciaux, les ITAF (y compris CSG et TVA) et les transferts CNAF/Unédic. | COR 2026, PDF p.17 (p.15) : « sur les 417 milliards d'euros de ressources du système de retraite en 2025 (hors produits financiers), seuls 277 milliards d'euros – soit près des deux tiers – proviennent des cotisations assises sur les revenus d'activité (secteur privé et agents publics). Le reste correspond à des transferts de l'État ou d'autres organismes publics (Cnaf, Unédic). » Même formule pour 2024 : COR 2025, PDF p.17 (p.13), « seuls 269 milliards d'euros, soit près des 2/3 ». |
| **Fipeco (François Ecalle)**, fiche « La situation et les perspectives des régimes de retraite », 30/06/2026 — https://www.fipeco.fr/fiche/La-situation-et-les-perspectives-des-r%C3%A9gimes-de-retraite | 1/3 = impôts affectés + subventions d'équilibre. Il ajoute que la cotisation de l'État employeur est en réalité une subvention. | 2025 (COR 2026) | Il reprend la structure du COR. En plus, il qualifie la contribution employeur de l'État (taux de 82 % pour les civils) de « subvention d'équilibre financée par des impôts ». Il rappelle que le COR présentait autrefois une « subvention globale de 2,0 % du PIB ». | « les ressources des régimes de retraite ne sont constituées de cotisations que pour les deux tiers. Le tiers restant provient d'impots affectes et de subventions d'equilibre de l'Etat au regime de retraite de ses agents et a d'autres regimes speciaux. » ; « celles de l'Etat employeur dont le taux (82 % pour les personnels civils) est ajuste pour equilibrer les retraites de ses agents et qui constituent en realite une subvention d'equilibre financee par des impots. » |
| Fipeco, « Les retraites des fonctionnaires », 16/09/2025 — https://www.fipeco.fr/fiche/Les-retraites-des-fonctionnaires | Contribution de l'État employeur : 45,6 Md€ en 2024 (chiffre de la Cour des comptes) | 2024 | La contribution de l'État employeur est traitée comme une subvention. | « cette cotisation, qui ressemble a une subvention d'equilibre, est comptabilisee en ressource du CAS et en depenses du budget general (45,6 Md€ en 2024 selon la Cour des comptes). » Taux : « 74,28 % en 2024 et 78,28 % en 2025 pour les civils ; 126,07 % pour les militaires ». |
| **Jean-Pascal Beaufret** (IGF honoraire), Fondapol, *Contribution à la mission flash de clarification du financement des retraites*, février 2025 — https://www.fondapol.org/app/uploads/2025/02/259_beaufret_fr_2025-02-10_w.pdf | Cotisations « à 28 % » : 64 % ; impôts : 13-14 % ; « subventions » : **20 %**, soit 78 Md€ en 2023 et 83 Md€ en 2024 (prévision). Le « besoin de financement » des retraites serait de **-69 Md€ en 2023 et -81 Md€ en 2024**. | 2023, 2024p | Il plafonne la notion de cotisation au taux privé de droit commun (≈ 28 % salarié + employeur). Tout ce qui dépasse est une « surcotisation » : État PCMR 36,5 / 39,2 Md€, opérateurs 4,5 / 4,7, employeurs CNRACL 8,3 / 8,8. S'y ajoutent les subventions d'équilibre aux régimes spéciaux (8,1 / 8,4), la compensation des allègements ciblés (4,6 / 4,7) et les transferts CNAF/CNAM/Unédic/Urssaf (15,8 / 16,8). Les impôts affectés (ITAF) sont comptés comme ressources propres, et non comme subventions. | Tableau 1, PDF p.17 (p.15) : « Cotisations hors surcotisations (à 28 %) 256 64 % 267 / Impôts transférés 54 13 % 57 / … / SUBVENTIONS (surcotisations et transferts divers) 78 20 % 83 ». Tableau 3, PDF p.19 (p.17) : « TOTAL DES SUBVENTIONS REÇUES 77,8 82,6 ». Et : « 64 % des subventions soit 53 Mds d'euros en 2024 n'apparaissent pas de manière explicite, car elles prennent la forme de surcotisations des employeurs publics. » |
| **Fondation IFRAP** (Sandrine Gorreri), « 21 % des ressources de notre système de retraites sont de discrètes subventions », 13/06/2023 — https://www.ifrap.org/retraite/21-des-ressources-de-notre-systeme-de-retraites-sont-de-discretes-subventions | 71 Md€ = 21 % des dépenses 2021 (345 Md€) | 2021 | Même logique que Beaufret. D'après le résumé de l'article : 45 Md€ de subvention implicite FPE, 7 Md€ pour les régimes spéciaux, 14,1 Md€ d'autres branches (ces composantes ne font pas 71, l'article complet n'a pas été vérifié). | « Les dépenses des régimes de retraites sont couvertes par des cotisations ou impôts affectés dédiés aux retraites pour 274 Mds € […] Le solde de 71 Mds € soit 21 % des dépenses, est couvert par des subventions de l'Etat et des administrations sociales. » |
| IFRAP, 24/02/2025 — https://www.ifrap.org/retraite/retraites-la-cour-des-comptes-face-ses-contradictions | Subvention d'équilibre implicite aux fonctionnaires : 52,9 Md€ ; subventions aux régimes spéciaux : 7,8 Md€ | 2024 | Écart entre les taux employeurs publics (≈ 85 % État civil, 42 % CNRACL, 137 % militaires, selon l'IFRAP) et le taux privé. | Extrait par WebFetch **[à vérifier]**. |
| Premier ministre F. Bayrou, déclaration de politique générale (janvier 2025) | « déficit caché » de 55 Md€ | — | Chiffre rattaché par Beaufret à sa propre méthode. | Beaufret, note 9, PDF p.19 : « L'écart entre le chiffre de 55 Mds d'euros cité par le Premier ministre dans sa déclaration de politique générale et le chiffre de 69 Mds d'euros au titre de l'année 2023 de la présente note semble lié aux subventions des autres régimes sociaux. » |
| **Cour des comptes**, *Situation financière et perspectives du système de retraites*, 20/02/2025 **[secondaire : PDF inaccessible, citations reprises dans l'article IFRAP du 25/02/2025]** | Contribution de l'État au régime PCMR : 45,1 Md€ (2023). La Cour cite, sans la reprendre à son compte, l'estimation de 42 Md€ de « surcotisations » (dont 35 Md€ pour l'État) calculée au taux employeur du régime général (16,46 %). | 2023 | La Cour ne retient pas la thèse de la surcotisation. Elle souligne l'assiette hors primes, la double nature base + complémentaire du régime et sa démographie. | « Cette contribution constitue à la fois la cotisation employeur de l'État, la prise en charge de dépenses de solidarité et un éventuel financement d'équilibre. » ; « Certaines analyses considèrent que le taux de cotisations employeurs du régime général (16,46%) constitue une référence […] Ce raisonnement aboutit à isoler un montant de 42 Md€ de surcotisations en 2023, dont 35 Md€ pour l'État » ; « Rapporté à la rémunération totale, le taux de cotisation est de l'ordre de 58 % pour les fonctionnaires civils et de 80% pour les militaires. » PDF : https://www.ccomptes.fr/sites/default/files/2025-02/20250220-Situation-financiere-et-perspectives-du-systeme-de%20retraites_0.pdf |

Institut Montaigne : aucune source chiffrée propre n'a été trouvée dans le temps imparti. Cette piste n'a pas été vérifiée.

### Contre-arguments : la contribution de l'État serait une vraie cotisation employeur, ou le « déficit caché » serait une question de convention

1. **COR 2026**, PDF p.85-86 (p.83-84). Le COR retient le cadre légal (LOLF art. 20-21, LFI 2006 art. 51 sur le CAS Pensions) : « toute affectation de ressources au-delà des cotisations réelles peut être discutée » et « le choix retenu […] reste sans effet sur le solde global des finances publiques ». Il ajoute :
   - « le taux implicite appliqué aux fonctionnaires de l'État […] ne résulte pas d'une générosité plus importante du régime public ». Selon la DREES (2022), les règles du privé auraient donné des pensions supérieures de 1,5 % aux fonctionnaires sédentaires nés en 1958.
   - Le ratio démographique du régime FPE est de **1,29 cotisant par retraité en 2020, contre 2,05 tous régimes** (IPP).
   - La compensation démographique n'a apporté au régime FPE que 0,5 Md€ en 2021, alors qu'un calcul tenant compte de sa démographie réelle aurait conduit à près de 11 Md€ (d'après la Cour des comptes, RALFSS 2024).
   - Les soultes de France Télécom (5,7 Md€) et de La Poste (2 Md€) ont été consommées comme recettes budgétaires.
   - Le régime FPE finance lui-même l'invalidité et la solidarité (majorations pour enfants, départs anticipés).
2. **IPP**, P. Aubert, M. Pedrono, M. Tô et T. Tochev, « Retraites des fonctionnaires d'État : faut-il changer la convention comptable ? », 30/06/2025, cité par le COR 2026, PDF p.87 (p.85). Le taux employeur d'équilibre hors démographie, hors invalidité et hors départs catégoriels serait de **34,7 %** en 2020, au lieu de 74,28 % affiché à l'époque. Les dépenses liées au déséquilibre démographique et à la solidarité représenteraient 1,1 % du PIB, soit 25,8 Md€.
3. **CAE**, Focus n°121, Hélène Paris, septembre 2025, « Retraites des fonctionnaires d'État : pas de déficit caché mais un coût salarial surévalué » — https://cae-eco.fr/static/pdf/Focus_121_pension_2509123.pdf
   - PDF p.3 : « Il ne s'agit pas ici de prétendre qu'il y aurait un déficit « caché » du système des retraites […] c'est avant tout une question de tuyauterie budgétaire ».
   - Découpage proposé pour 2023, PDF p.7-8 : programme 741 = 39,6 Md€ (civils) + 10,8 Md€ (militaires). Au taux de 34,7 %, la vraie cotisation employeur serait de 18,5 + 3,0 = **21,5 Md€**. Le reste, **28,9 Md€**, serait un transfert du budget général (solidarité + équilibrage).
   - Le Focus propose une borne basse de 25,44 %, calculée au taux privé sur une assiette corrigée des primes.

---

## 4. Retraités, pensions moyennes, cotisants

| Indicateur | Valeur | Année | Source | Page | Citation mot pour mot |
|---|---|---|---|---|---|
| Retraités de droit direct (tous régimes, résidant en France ou à l'étranger) | **17,2 millions** | fin 2023 | DREES, *Les retraités et les retraites*, éd. 2025 (31/07/2025) — https://drees.solidarites-sante.gouv.fr/publications-communique-de-presse-documents-de-reference/250731_PANORAMAS-retraites **[secondaire, via Miroir Social]** | Vue d'ensemble | « Fin 2023, 17,2millions de personnes vivant en France ou à l'étranger perçoivent une pension de retraite de droit direct d'au moins un régime français, soit 200000personnes de plus que fin 2022. » |
| Bénéficiaires d'une seule pension de réversion ; total des retraités | + 884 000 ; total **18,08 M** | fin 2023 | DREES éd. 2025, fiche 05 **[secondaire : extrait de moteur de recherche, non vérifié]** | Fiche 05 | « 884 000 personnes percevant une pension de droit dérivé […] et uniquement cette pension, soit un total de 18,08 millions de retraités » |
| Pension moyenne de droit direct, **brute** | **1 666 €/mois** | fin 2023 | DREES éd. 2025 **[secondaire]** | Vue d'ensemble / fiche 05 | « le montant mensuel moyen de la pension de droit direct des retraités résidant en France s'établit à 1666euros bruts » |
| Pension moyenne de droit direct, **nette** | **1 541 €/mois** | fin 2023 | idem | idem | « et à 1541euros après prélèvements sociaux » |
| Pension moyenne y compris réversion (**nette**, voir la remarque ci-dessous) | **1 692 €/mois** | fin 2023 | idem | idem | « (1692euros en ajoutant l'éventuelle pension de réversion des retraitées et retraités veuves ou veufs) » ; L'Opinion (24/08/2026) écrit « 1 692 euros net » |
| Pension brute de droit direct : femmes / hommes | 1 306 € / 2 089 € | 2023 | DREES éd. 2025 **[secondaire, L'Opinion]** | — | « 2 089 euros brut contre 1 306 euros brut » |
| Retraités de droit direct | 17,3 M (dont 16,4 M résidant en France) ; pension brute moyenne 1 705 € | fin 2024 | DREES, « Effectifs de retraités et montants des pensions versées : mise à disposition des données 2024 » **[secondaire : extrait de moteur de recherche, non vérifié]** | — | — |
| Retraités de droit direct (données COR) | **17,4 M** (valeur estimée) | 2025 | COR 2026 | PDF p.75 (p.73) | « Il passerait ainsi de 17,4 millions en 2025 à 22,1 millions en 2070. » (note 62 : « Les derniers chiffres disponibles sont ceux de 2024. Les chiffres 2025 sont estimés. ») |
| **Cotisants** | **30,6 millions** | 2025 | COR 2026 | PDF p.75 (p.73) | « Le nombre de cotisants, évalué à 30,6 millions en 2025 » (note 63 : emploi total de la comptabilité nationale) |
| Cotisants (données COR 2025) | 30,4 M ; retraités de droit direct 17,1 M | 2023 | COR 2025 | PDF p.67 (p.63) | « Le nombre de cotisants, évalué à 30,4 millions en 2023 […] de 17,1 millions en 2023 » |
| Rapport cotisants / retraités | **1,8** | 2025 | COR 2026 | PDF p.74 (p.72) | « passant de 2,1 à 1,8 en 2025 » ; 1,3 en 2070 |
| Pension moyenne / revenu d'activité moyen | 54,6 % | 2025 | COR 2026 | PDF p.74 (p.72) | « qui passerait de 54,6 % en 2025 à 45,3 % en 2070 » |

Remarque sur les 1 692 € : dans la phrase de la DREES, la parenthèse suit le montant **net** (1 541 €). C'est donc très probablement un montant net, et le chiffre est cohérent avec environ 39 Md€ de réversion. À confirmer dans la fiche 05 de la DREES.

## 5. Distribution des pensions

**[Secondaire]** : les chiffres ci-dessous viennent de L'Opinion, N. Tacchi, 24/08/2026, repris par https://metahodos.fr/2026/09/14/107549/, qui les attribue à la DREES. Les données sont de fin 2023. Le champ exact (pension de droit direct brute, résidents) n'a pas été vérifié.

- « Le montant médian d'une pension s'établit ainsi à environ **1 400 euros brut**. »
- « Un tiers des retraités perçoivent une pension inférieure ou égale à 1 000 euros brut, tandis que trois retraités sur dix touchent plus de 2 000 euros, deux sur dix gagnent plus de 2 300 euros, 8 % plus de 3 000 euros et, enfin, 1 % des retraités perçoivent une pension supérieure à 5 150 euros par mois. »
- Retraités à carrière complète : « pension médiane s'élève à environ 1 600 euros brut, un tiers gagne plus de 2 000 euros, 11 % […] 3 000 euros ou plus, et 4 % […] 4 000 euros ou plus. »

Source à consulter pour vérifier : DREES éd. 2025, fiche 05 « Le niveau des pensions », https://drees.solidarites-sante.gouv.fr/sites/default/files/2025-07/Fiche%2005%20-%20Le%20niveau%20des%20pensions.pdf (inaccessible depuis cet environnement, erreur 503).

---

## 6. Ventilation prête pour un simulateur

### Variante recommandée : 2025, source unique COR juin 2026, Tableau 2.2 (PDF p.89) et solde PDF p.93

| Catégorie | Contenu (lignes COR) | Md€ | % du total hors produits financiers (416,6) |
|---|---|---|---|
| **(a) Cotisations effectives** (privé + indépendants + agents publics + employeurs publics hors État) | non-salariés 14,5 + salariés 100,9 + employeurs hors opérateurs 154,6 + opérateurs de l'État 7,1. Inclut les cotisations employeurs CNRACL (collectivités, hôpitaux) et la part salariale des fonctionnaires d'État. | **277,0** | 66,5 % |
| **(b) Contribution employeur de l'État + subventions d'équilibre** | contributions d'équilibre FPE (CAS Pensions, civils + militaires) 49,3 + subventions d'équilibre 7,7 | **57,0** | 13,7 % |
| **(c) Impôts et taxes affectés** | CSG 21,9 + forfait social / taxe sur les salaires 17,9 + TVA et autres taxes sur la consommation 17,4 + autres ITAF 7,4. Inclut le financement du FSV. | **64,7** | 15,5 % |
| **(d) Transferts d'autres organismes** | CNAF 11,2 + Unédic 3,9 + autres 1,3. Le FSV est consolidé, donc pas de ligne séparée. | **16,5** | 4,0 % |
| **(e) Autres produits** (hors financiers) | autres produits | **1,4** | 0,3 % |
| **Total des ressources hors produits financiers** | | **416,6** | 100 % |
| (e bis) Produits financiers | | 5,6 | — |
| **Total des ressources y compris produits financiers** | | **422,2** | — |
| **Déficit** (hors charges et produits financiers) | | **5,1** (-0,2 % du PIB) | — |
| Charges implicites hors frais financiers = 416,6 + 5,1 | | 421,7 | — |
| Dépenses brutes publiées | | 422,2 (14,1 % du PIB) | — |

Variante (b') à la manière de Beaufret ou d'IFRAP : on déplace les **cotisations des opérateurs de l'État (7,1 Md€)** de (a) vers (b). On obtient alors (a) = 269,9 et (b) = 64,1. Le COR lui-même, dans la note 7 de sa synthèse, décrit ses 277 Md€ comme « hors contribution d'équilibre et cotisations employeurs des opérateurs de l'État » (voir l'incohérence n°1).

Calcul de l'argent public (b) + (c) + (d), **estimation de l'auteur à partir du tableau COR** : (49,3 + 7,7 + 64,7 + 16,5) / 416,6 = **33,2 %**. On retrouve le « tiers ». Avec la variante (b'), on obtient 34,9 %.

### Variante 2024 (COR juin 2025, Tableau 2.2, PDF p.78)

| Catégorie | Contenu | Md€ |
|---|---|---|
| (a) | 14,1 + 99,0 + 149,4 + 6,9 | 269,3 |
| (b) | 48,2 + 8,0 | 56,2 |
| (c) | 21,7 + 16,1 + 17,2 + 7,1 | 62,2 |
| (d) | 11,3 + 3,9 + 1,1 | 16,4 |
| (e) Autres produits | | 0,9 |
| Total hors produits financiers | | **404,9** (le texte dit « 405 ») |
| Produits financiers | | 8,6 |
| Total y compris produits financiers | | 413,5 |
| Déficit hors produits financiers | | 1,7 |
| Dépenses brutes | | 406,9 |

### Montants par sous-régime, pour détailler (b)

- **Contribution de l'État employeur au CAS Pensions** :
  - 45,1 Md€ en 2023, selon la convention CCSS (Cour des comptes, février 2025, **[secondaire]**) ;
  - 45,6 Md€ en 2024 (Cour des comptes, cité par Fipeco) ;
  - programme 741 « État et opérateurs », exécution 2023 : 39,6 (civils) + 10,8 (militaires) = 50,4 Md€ (CAE Focus 121, PDF p.7).
- **Taux** : pensions civiles 74,28 % (2014-2024), 78,28 % (2025), 82,4 % selon le COR 2026 pour 2026 ; militaires 126,07 % ; CNRACL 31,65 % en 2024, jusqu'à 43,65 % en 2028.
- **Subventions d'équilibre aux régimes spéciaux** : 8,0 Md€ en 2024 d'après le COR, ou 8,1 / 8,4 Md€ en 2023 / 2024p d'après Beaufret (SNCF, RATP, mines, marins, ouvriers de l'État, etc.). En 2025, l'État a versé 5,0 Md€ à la Cnav pour la SNCF, la RATP et les mines (REPSS 1.4).

## 7. Incohérences relevées entre sources ou à l'intérieur d'une même source

1. **COR 2026, périmètre des « 277 Md€ »** : le Tableau 2.2 inclut les 7,1 Md€ de cotisations des opérateurs de l'État dans les 277,0 Md€. La note 7 de la synthèse (PDF p.17) dit pourtant « Hors contribution d'équilibre et cotisations employeurs des opérateurs de l'État ». Le même flou existe dans le rapport 2025 : la synthèse attribue les 269 Md€ aux « cotisations sur les acteurs du secteur privé et les cotisations salariales des agents publics », alors que le total inclut les cotisations employeurs CNRACL et celles des opérateurs.
2. **Soldes qui ne bouclent pas** :
   - 2025 : 416,6 - 422,2 = -5,6, alors que le COR publie -5,1. En incluant les produits financiers, 422,2 - 422,2 = 0, alors que le COR publie -1,3.
   - 2024 : 404,9 - 406,9 = -2,0, alors que le COR publie -1,7.
   - L'écart d'environ 0,3 à 0,5 Md€ vient probablement de différences de périmètre entre « dépenses brutes » et charges du compte (charges financières, gestion). Pour le simulateur, retenir **ressources hors produits financiers + déficit = 421,7 Md€ (2025)** afin que le compte soit équilibré, et signaler l'écart.
3. **Contribution SNCF / RATP / mines 2025** :
   - Le texte du COR range « l'intégration financière des régimes spéciaux en fermeture » dans les ITAF (PDF p.88).
   - La note 90 (PDF p.90) la range dans les subventions d'équilibre (« Y compris la subvention versée à la Cnav en 2025… »).
   - Le montant de 7,7 Md€, proche des 8,0 Md€ de 2024, laisse penser qu'elle est dans les subventions. **Ceci est une déduction de l'auteur, non confirmée.**
4. **Ressources 2024** : le tableau donne 405 Md€ hors produits financiers, mais la note 70 du COR 2025 (PDF p.83) dit : « Une fois les comptes 2024 définitifs connus, les ressources se sont élevées à 407 Md€ ».
5. **Contribution de l'État au régime FPE**, selon la source :
   - COR : 48,2 Md€ (2024), 49,3 Md€ (2025) ;
   - Cour des comptes (via Fipeco) : 45,6 Md€ (2024) ;
   - Cour des comptes : 45,1 Md€ (2023) ;
   - CAE, programme 741 : 50,4 Md€ (2023, y compris les opérateurs) ;
   - Beaufret, surcotisation État seule : 39,2 Md€ (2024p).
   - Ces écarts reflètent des périmètres différents : avec ou sans opérateurs, avec ou sans ATI et ouvriers de l'État, cotisation totale ou seulement la part au-dessus du taux privé. Ils ne sont pas directement comparables.
6. **Taux de référence du privé utilisé pour calculer la « surcotisation »** :
   - 28 % (salarié + employeur) pour Beaufret ;
   - 16,46 % (employeur, régime général) dans l'estimation citée par la Cour ;
   - 16,67 % en 2026 selon le COR ;
   - 34,7 % pour l'IPP ;
   - 25,44 % en borne basse pour le CAE.
   - Selon le taux retenu, la subvention implicite de l'État va d'environ 28,9 Md€ (CAE, 2023) à environ 35-39 Md€ (Cour / Beaufret).
7. **Dépenses 2023** : la DREES donne 370 Md€ (13,1 % du PIB, comptes de la protection sociale, fonction vieillesse-survie). Le COR donne un ordre de grandeur de 389 Md€ en 2023, chiffre de Beaufret calé sur la CCSS. Les périmètres diffèrent : ne pas mélanger les deux sources dans le simulateur.
8. **DREES** : les 17,2 M de fin 2023 correspondent aux retraités de droit direct (France + étranger). Les 17,1 M du COR 2025 (2023) viennent du modèle Ancètre. Le COR 2026 donne 17,4 M pour 2025 (estimation).

## 8. Sources consultées directement (texte intégral lu)

- COR, rapport annuel juin 2026 : https://www.cor-retraites.fr/sites/default/files/2026-06/RA_2026_def.pdf
- COR, rapport annuel juin 2025 : https://www.cor-retraites.fr/sites/default/files/2025-06/RA_2025_def_publi.pdf
- J.-P. Beaufret, Fondapol, février 2025 : https://www.fondapol.org/app/uploads/2025/02/259_beaufret_fr_2025-02-10_w.pdf
- CAE, Focus n°121, septembre 2025 : https://cae-eco.fr/static/pdf/Focus_121_pension_2509123.pdf
- Fipeco, fiche « La situation et les perspectives des régimes de retraite » (30/06/2026) et fiche « Les retraites des fonctionnaires » (16/09/2025)
- REPSS Retraite, fiches 1.4 et 1.5 (DSS, données CCSS mai 2026) : https://evaluation.securite-sociale.fr/home/retraite/
- Secondaires, pour la DREES et la Cour des comptes :
  - Miroir Social (résumé de la DREES éd. 2025) ;
  - L'Opinion via metahodos.fr (24/08/2026) ;
  - IFRAP (13/06/2023, 24/02/2025, 25/02/2025, ce dernier via metahodos.fr/2025/02/26/87912/).

**À vérifier avant mise en ligne** :
- DREES éd. 2025, *Vue d'ensemble* et fiche 05 : chiffres 1 666 / 1 541 / 1 692 €, 17,2 M, médiane, distribution ;
- Cour des comptes, 20/02/2025 : 45,1 Md€ et 42 / 35 Md€ ;
- FSV, rapport d'activité 2024 : 15,3 Md€ et 12,7 Md€.

Ces sites étaient inaccessibles depuis l'environnement de recherche.
