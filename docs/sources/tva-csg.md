# French VAT (TVA) and CSG parameters for a citizen simulator: sourced research note

Research date: 24 Sept 2026. The latest official data available are 2025 execution figures (CCSS, May 2026) and the PLF 2026 annexes. PLF/PLFSS 2027 had not been published at the time of research.

Conventions:
- "Md€" means billions of euros.
- **[OWN ESTIMATE]** marks anything I computed myself. Each of these comes with its calculation.
- Quotes are verbatim in French. They come from PDFs I downloaded and parsed, or from pages I fetched.
- Where only a secondary source or a search snippet was reachable, the row is flagged **(secondary)** or **(not directly verified)**.
- ccomptes.fr (Cour des comptes / CPO), urssaf.fr, boss.gouv.fr and the DREES PDFs returned 503 errors or reset the connection throughout the session. Cour des comptes and CPO documents therefore could not be verified directly.

---

## A. TVA (VAT)

### A1. Rates (metropolitan France)

| Label | Value | Year | Source | URL | Page | Verbatim quote |
|---|---|---|---|---|---|---|
| Taux normal | 20 % | 2025–2026 | Annexe PLF 2026, *Évaluation des voies et moyens*, tome I (DGFiP/DB), Oct 2025 | https://www.assemblee-nationale.fr/dyn/contenu/visualisation/1087930/file/PLF%202026%20-%20V%26M%20TI%20-%20Evaluations%20des%20recettes.pdf | methodological box "Taxe sur la valeur ajoutée nette", ~p.32 | « le taux normal à 20 % s'applique par défaut » |
| Taux intermédiaire | 10 % | idem | idem | idem | idem | « le taux intermédiaire à 10 % s'applique notamment à la restauration sur place et à emporter (hors alcool), les transports, la rénovation immobilière, les médicaments non remboursables… » |
| Taux réduit | 5.5 % | idem | idem | idem | idem | « le taux réduit à 5,5 % concerne essentiellement les produits alimentaires, mais, aussi, les livres, la rénovation thermique et les places de cinéma » |
| Taux particulier / super-réduit | 2.1 % | idem | idem | idem | idem | « le taux super-réduit à 2,1 % porte sur un nombre limité de produits, principalement les mé[dicaments remboursables]… » |
| Structure of the base | ~3/5 household consumption | recent average | idem | idem | idem | « la TVA repose pour environ trois cinquièmes sur les dépenses de consommation des ménages et, pour le reste, sur l'investissement (…) et les consommations intermédiaires non déductibles (pour un cinquième chacun environ) » |

All four rates are confirmed. They are cross-checked with entreprendre.service-public.gouv.fr F23567 (verified 18 June 2025), which lists 20 / 10 / 5.5 / 2.1 %.

### A2. Total VAT revenue

| Label | Value | Unit | Year | Source | URL | Page/table | Verbatim quote |
|---|---|---|---|---|---|---|---|
| TVA brute totale (budgetary accounting) | 289.2 / 288.2 / 294.6 | Md€ | 2024 exec. / 2025 forecast / 2026 forecast | PLF 2026 Voies et moyens t. I | URL above | p.33, VAT table | « TVA brute totale (en comptabilité budgétaire) 289,2 288,2 294,6 » |
| Remboursements & dégrèvements | −78.5 / −78.2 / −79.3 | Md€ | idem | idem | idem | idem | « Remboursements et dégrèvements -78,5 -78,2 -79,3 » |
| **TVA nette totale** | **210.7 / 210.0 / 215.4** | Md€ | 2024 exec. / 2025 f. / 2026 f. | idem | idem | idem | « TVA nette totale (en comptabilité budgétaire) 210,7 210,0 215,4 » |
| of which transfers to Sécurité sociale | 57.9 / 56.4 / 54.8 | Md€ | idem | idem | idem | idem | « Transferts à la sécurité sociale -57,9 -56,4 -54,8 » |
| of which transfers to collectivités | 52.1 / 52.7 / 47.5 | Md€ | idem | idem | idem | idem | « Transferts aux collectivités territoriales -52,1 -52,7 -47,5 » |
| of which audiovisuel public | 4.0 / 4.0 / 3.9 | Md€ | idem | idem | idem | idem | « Compensation audiovisuel public -4,0 -4,0 -3,9 » |
| TVA nette État | 96.8 / 96.9 / 109.1 | Md€ | idem | idem | idem | idem | « TVA nette État (en comptabilité budgétaire) 96,8 96,9 109,1 » |
| 2025 outturn, State share vs revised forecast | +1.6 | Md€ | 2025 | Ministère de l'Économie, press release "Solde budgétaire de l'État de l'année 2025", 30 Jan 2026 | https://presse.economie.gouv.fr/solde-budgetaire-de-letat-de-lannee-2025/ | text | « les recettes de TVA nette revenant à l'Etat sont également supérieures à la prévision établie en LFG (+ 1,6 milliards d'euros) » |
| Net VAT, all public administrations (secondary) | 208 (2024), 209 (2025) | Md€ | 2024–2025 | FIPECO (F. Ecalle), fiche "La taxe sur la valeur ajoutée", updated 15 June 2026 | https://www.fipeco.fr/fiche/La-taxe-sur-la-valeur-ajout%C3%A9e | text | « Son rendement, net des remboursements, s'est élevé à 209 Md€ en 2025 (208 Md€ en 2024) pour l'ensemble des administrations publiques » |

**Inconsistency flag:** the official budgetary figure (210.7 Md€ for 2024) and FIPECO (208 Md€) differ by about 2–3 Md€. The two use different accounting (budgetary versus national-accounts/APU). For the simulator I use the PLF 2026 budgetary figure, about 210 Md€ for 2025.

### A3. Yield of +1 VAT point (official: DG Trésor, Trésor-Éco n° 371, Sept 2025)

Source: M. Gesta, « Analyse de la composition des recettes de TVA », *Trésor-Éco* n° 371, DG Trésor, Sept 2025. PDF: https://www.tresor.economie.gouv.fr/Articles/c462ac7f-76db-4c33-9bb3-dcc6886ed898/files/f4d0d1ac-fc61-4cf3-ab3f-094385b218bd (landing page https://www.tresor.economie.gouv.fr/Articles/2025/09/25/analyse-de-la-composition-des-recettes-de-tva)

| Label | Value (Md€, 2025) | Page/table | Verbatim quote |
|---|---|---|---|
| +1 pt on all rates, **gross** | 13.7 | p.4, Tableau 1 | « Le point TVA brut total est estimé à 13,7 Md€ en 2025 » |
| +1 pt normal rate 20 %, gross | 8.9 | p.4, Tableau 1 | « Brut 2025 (Md€) 13,7 0,4 2,4 1,9 8,9 » (columns: Ensemble, 2,1 %, 5,5 %, 10 %, 20 %) |
| +1 pt 10 % rate, gross | 1.9 | idem | idem |
| +1 pt 5.5 % rate, gross | 2.4 | idem | idem |
| +1 pt 2.1 % rate, gross | 0.4 | idem | idem |
| +1 pt on all rates, **net** (net of VAT paid by public administrations) | **11.4** | p.1 and p.5, Tableau 2 | « le rendement net d'une variation d'un point de tous les taux de TVA est estimé à 11,4 Md€ en 2025 » |
| **+1 pt normal rate, net** | **7.5** | p.5, Tableau 2 | « Net 2025 (Md€) 11,4 0,4 2,0 1,6 7,5 » |
| +1 pt 10 % / 5.5 % / 2.1 %, net | 1.6 / 2.0 / 0.4 | idem | idem |
| Nature of the estimate | static | p.4 | « Il s'agit d'un chiffrage statique, c'est-à-dire dans l'hypothèse où les comportements des consommateurs seraient inchangés » |

Historical reference: the 2012 "TVA sociale" (Fillon government).

| Label | Value | Year | Source | URL | Verbatim quote |
|---|---|---|---|---|---|
| Normal rate raised 19.6 % → 21.2 % (+1.6 pt), full-year yield | 10.6 Md€ | 2013 (full year) | Sénat, Rapport n° 390 (2011-2012) t. I, N. Bricq, PLFR 2012, 21 Feb 2012 | https://www.senat.fr/rap/l11-390-1/l11-390-1_mono.html | « Le passage du taux normal de TVA de 19,6 % à 21,2 % (10,6 milliards d'euros en année pleine) » ; « Le Gouvernement évalue le produit correspondant à 10,6 milliards d'euros en 2013 » |
| Implied value of 1 pt of the normal rate in 2012 | 6–7 Md€ | 2012 | idem | idem | « une augmentation de 1,6 point du taux normal de TVA correspond à des recettes supplémentaires de 9,6 à 11,2 milliards d'euros selon que la valeur du point de taux normal est de 6 ou 7 milliards d'euros » |
| Package financed | 13.2 Md€ cut in employer contributions (TVA 10.6 + prélèvement social capital 2.6) | 2012 | idem | idem | « Cette diminution de 13,2 milliards d'euros des cotisations patronales serait intégralement compensée par une augmentation du taux normal de TVA et, dans une moindre mesure, du prélèvement social sur les revenus du capital » |
| Legal text | CGI art. 278: « 19,60 % » → « 21,20 % » | 2012 | Projet de LFR 2012, AN n° 4423, art. 1er V.A | https://www.assemblee-nationale.fr/13/pdf/projets/pl4423.pdf | « À la fin de l'article 278, le taux : « 19,60 % » est remplacé par le taux : « 21,20 % » » |

The increase was repealed by the second LFR 2012 before it took effect.

**[OWN ESTIMATE]** 10.6 / 1.6 = 6.6 Md€ per point of the normal rate in 2013. That compares with 8.9 Md€ gross / 7.5 Md€ net per point in 2025 (Trésor). The 2012 figure was most likely gross.

Other secondary sources relay the same Trésor numbers: FIPECO gives 8.9 / 1.9 / 2.4 / 0.4 Md€ and "près de 14 Md€" for all rates, with a net of 11.5 Md€, a rounding difference from Trésor's 11.4.

### A4. Price pass-through and purchasing-power effects of VAT increases

| Label | Value | Source | URL | Page | Verbatim quote |
|---|---|---|---|---|---|
| Static inflation impact of +1.6 pt on the normal rate | +0.6 pt CPI (upper bound); +0.5 pt "réaliste" | Sénat Rapport n° 390 (Bricq), 2012 | https://www.senat.fr/rap/l11-390-1/l11-390-1_mono.html | section VI "Un supplément d'inflation de l'ordre de 0,5 point ?" | « la TVA repose seulement sur 60 % de la consommation, et le taux normal de TVA seulement sur 45 % de la consommation (…) une augmentation de 1,6 point du taux normal de TVA augmente l'inflation de « seulement » 0,6 point » ; « Votre rapporteure générale juge plus réaliste de tabler, avec la majorité des économistes, sur un supplément d'inflation de l'ordre de 0,5 point » |
| German 2007 VAT hike (+3 pts) | almost fully passed through (Cour des comptes citing Bundesbank) | idem | idem | idem | « l'augmentation du taux normal de la TVA de 3 points au 1er janvier 2007 s'est quasiment totalement répercutée dans les prix » |
| **Insee microsimulation: +3 pts on normal rate (20→23 %)** | +1.1 pt inflation in year N; niveau de vie −0.6 % after 3 years; D1 −1.4 %, D10 −0.5 %; 55 % of the initial shock offset by indexation | Insee Analyses n° 43, M. André & A.-L. Biotteau, 11 Feb 2019 | https://www.insee.fr/fr/statistiques/3713290 | text | « Elle est suivie d'une hausse de l'inflation de 1,1 point cette même année » ; « Les effets différés compensent 55 % du choc initial » ; « les revenus de remplacement et certains revenus du patrimoine s'ajustent complètement au choc d'inflation en N+1 » ; « l'indexation des prestations ne rattrape pas totalement la hausse de la TVA et des dépenses de loyer » |
| Insee: yield of the +3 pt scenario (household field only) | 11.7 Md€ | idem | idem | idem | « génère un surplus de recettes fiscales de 11,7 milliards d'euros cette même année sur le champ des ménages ordinaires de France métropolitaine » |
| Past French VAT increases: immediate pass-through | ~75 % | Insee Note de conjoncture, Dec 2013, relayed by MoneyVox **(secondary)** | https://www.moneyvox.fr/actu/42527/la-hausse-de-tva-et-le-cice-au-1er-janvier-un-impact-oppose-sur-inflation | text | « les précédentes hausses des taux de TVA n'ont été en moyenne répercutées sur le consommateur que « de l'ordre de 75% » immédiatement » ; the Jan 2014 hike (19.6→20, 7→10) would add « +0,5 point » if fully passed through, and Insee retained « +0,4 point » |
| Asymmetry: VAT cuts are passed on less | restaurant VAT cut of 2009 passed on only 30–45 % | FIPECO citing IPP / Insee (Lafféter & Sillard 2014) **(secondary)** | FIPECO URL above | text | « la baisse de la TVA sur la restauration en 2009 n'a été répercutée dans les prix à la consommation qu'à hauteur de 30 à 45 % » |
| **Trésor: +1 pt on all rates, purchasing-power loss** | −0.5 % on average; Q1 −0.7 %, Q5 −0.4 % (100 % pass-through assumed) | Trésor-Éco n° 371, 2025 | Trésor PDF above | p.5 and Graphique 4 p.6 | « les ménages du premier cinquième de niveau de vie verraient le pouvoir d'achat de leur revenu disponible diminuer d'en moyenne 0,7 % contre 0,4 % pour ceux du dernier cinquième (0,5 % pour l'ensemble des ménages) » |
| Why the loss is below 1 % per point | — | idem | idem | p.5, note 8 | « l'élasticité est plus faible du fait que la TVA s'applique au prix hors taxe (…) et (…) qu'un peu plus d'un tiers de la consommation des ménages n'est pas soumis à TVA » |
| Incidence on the budgetary yield | Q1 bears 12 % of the yield, Q5 bears 31 % | idem | idem | p.5 | « 12 % du rendement porterait sur le premier cinquième de la distribution des ménages contre 31 % pour le cinquième le plus aisé » |
| Offsetting indexation | minima sociaux and Smic indexation dampen the effect | idem | idem | p.5 | « Cet effet plus marqué dans le bas de la distribution serait toutefois nettement atténué par les mécanismes de revalorisation des minima sociaux et du Smic sur l'inflation » |

**Retirees versus workers.** I found no official study that isolates the VAT pass-through by status. The mechanism is documented in two places:
- Insee (2019) assumes replacement incomes, including pensions, are fully indexed on inflation in N+1. Pensions are revalued each January on CPI excluding tobacco under CSS art. L161-25. Retirees therefore bear the price shock for about one year and are then compensated, unless revaluation is frozen or under-indexed.
- Wage earners are compensated only through wage bargaining or the Smic.

In a TVA-sociale package, workers also receive a net-wage gain if employee contributions are cut, while retirees receive no offset. The 2012 package cut *employer* contributions only.

**Inconsistency flag:** Insee's 11.7 Md€ for +3 pts is about 3.9 Md€ per point. That is well below Trésor's 8.9 Md€ gross per point. Insee covers only ordinary households' consumption in metropolitan France, in the first year and at 2019 levels. Trésor covers all payers, including non-deductible business and public-sector purchases and investment, at 2025 levels. Use Trésor for budget yields.

### A5. VAT effort rate by income (VAT as % of disposable income)

| Label | Value | Year of data | Source | URL | Verbatim quote |
|---|---|---|---|---|---|
| D1 vs D10 | 12 % vs 5 % | ~2019 (Insee Ines/BdF) | Insee Analyses n° 43 (2019) | https://www.insee.fr/fr/statistiques/3713290 | « les 10 % des personnes les plus modestes consacrent 12 % de leur revenu disponible à cette taxe, contre 5 % pour les 10 % les plus aisées » |
| D1 vs D10 | 14 % vs 8 % | 2012 | IPP (Bozio et al. 2012, *Fiscalité et redistribution en France 1997-2012*), via FIPECO **(secondary)** | FIPECO URL above | « cette part est de 14 % pour le 1er décile de niveau de vie et de 8 % pour le 10ème décile » |
| D1 vs D10 | 12.5 % vs 4.7 % | 2014 | CPO, Note n° 6 « La TVA est-elle un impôt juste ? », Sept 2023 **(search snippet only, not directly verified: ccomptes.fr was down)** | https://www.ccomptes.fr/sites/default/files/2023-10/20230928-TVA-est-elle-impot-juste.pdf | (snippet) "12,5 % du revenu disponible pour le premier décile contre 4,7 % pour le dernier décile en 2014" |
| Lifecycle caveat | about half as regressive over the lifecycle | Georges-Kot (2015), cited in Trésor-Éco 371 p.5 | Trésor PDF | « selon l'Insee, la TVA serait moitié moins régressive sur l'ensemble de la vie que sur une année particulière » |

---

## B. CSG (contribution sociale généralisée)

### B1. Rates and thresholds

| Label | Value | Year | Source | URL | Verbatim quote |
|---|---|---|---|---|---|
| CSG on activity income | 9.2 % | in force | CSS art. L136-8 I (version in force since 27 June 2026) | https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000053278668 | « 9,2 % pour la contribution sociale mentionnée à l'article L. 136-1 » |
| of which deductible from IR | 6.8 pts (non-deductible 2.4) | in force | CGI art. 154 quinquies I (Légifrance, paraphrased by the fetch tool) and impots.gouv IR 2026 brochure | https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000047288608 ; https://www.impots.gouv.fr/www2/fichiers/documentation/brochure/ir_2026/pdf_som/12-charges_ded_rev_225a236.pdf | Brochure: « La CSG déductible s'élève à 544 € (8 000 € × 6,8 %) ». Légifrance: deductible « à hauteur de 6,8 points » for activity income; 3.8 / 4.2 / 5.9 pts for the 3.8 / 6.6 / 8.3 % rates |
| CRDS | 0.5 % (activity and replacement) | in force | CNRACL juridique (pensions 2025); CCSS May 2026 | see below | « Le taux de la CRDS est fixé à 0,5% » |
| Pensions: taux normal | 8.3 % (5.9 deductible) | in force | CSS L136-8 II; CNRACL | Légifrance above; https://www.juris-cnracl.retraites.fr/paiement-suivi-de-la-pension/le-paiement-de-la-pension/cotisations-sociales/csg/crds/casa/csg/crds/casa-taux-et-seuils-pour-les-pensions-dues-en-2025 | « Le taux normal de CSG est fixé à 8,3%, dont 5,9% sont déductibles » |
| Pensions: taux médian | 6.6 % (4.2 deductible) | in force | idem (CSS L136-8 III bis) | idem | « Le taux médian est fixé à 6,6% dont 4,2% sont déductibles » |
| Pensions: taux réduit | 3.8 % (all deductible) | in force | idem (CSS L136-8 III) | idem | « Le taux réduit est de 3,8%, totalement déductible » |
| CASA | 0.3 % (médian and normal rates only) | in force | idem; CNAV Recueil | idem | « Le taux est fixé à 0,3% » |
| Unemployment benefits and IJ | 6.2 % | in force | CSS L136-8 II | Légifrance above | (fetch summary) unemployment allowances and daily sickness/maternity/AT indemnities: 6.2 % |
| Capital income (patrimoine/placements) | 10.6 % from 2026 (was 9.2 %); total prélèvements sociaux 18.6 % | 2026 | CSS L136-8 I; service-public F2329 (verified 30 June 2026) | https://www.service-public.gouv.fr/particuliers/vosdroits/F2329 | « 10,6 % pour les contributions sociales mentionnées aux articles L. 136-6 et L. 136-7 » |
| **Assiette on activity income** | 98.25 % of gross (abattement 1.75 % up to 4 PASS; 100 % above) | in force since 2020 version | CSS art. L136-2 I | https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000042683568 | « les revenus bruts suivants bénéficient d'une réduction représentative de frais professionnels fixée à 1,75 % pour leur montant inférieur à quatre fois la valeur du plafond » |
| PASS | 47,100 € (2025); 48,060 € (2026) | 2025–26 | Arrêté du 22 déc. 2025 (JORF 23/12/2025), via Lefebvre-Dalloz/URSSAF **(secondary relay)** | https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000053143451 | "48 060 € (au lieu de 47 100 €)" |

**Pension thresholds (RFR, 1 part, metropolitan France).** The RFR used is that of year N−2.

| Rate | 2025 (RFR 2023) | 2026 (RFR 2024) |
|---|---|---|
| Exonération (0 %, no CRDS/CASA) | RFR ≤ 12,817 € | RFR ≤ 13,048 € |
| Taux réduit 3.8 % (+CRDS 0.5, no CASA) | 12,818 – 16,755 € | 13,049 – 17,057 € |
| Taux médian 6.6 % (+CRDS 0.5 + CASA 0.3) | 16,756 – 26,004 € | 17,058 – 26,471/26,472 € |
| Taux normal 8.3 % (+CRDS 0.5 + CASA 0.3) | ≥ 26,004 € | > 26,472 € |

Sources for the thresholds:
- 2025: CNRACL juridique, published 17 Dec 2024, URL above: « RFR de l'année N-2 Égal ou Supérieur à 26 004 € » for the normal rate, and exonération ≤ 12,817 €.
- 2026: service-public.gouv.fr F2971, verified 1 June 2026, https://www.service-public.gouv.fr/particuliers/vosdroits/F2971 : « Pour 2026, le taux appliqué dépend des revenus indiqués sur la déclaration 2025 des revenus de 2024 ».
- 2026 cross-check: l'Assurance retraite, 9 Jan 2026, https://www.lassuranceretraite.fr/portail-info/hors-menu/actualites-nationales/retraite/2026/prelevements-sociaux-2025.html : « RFR < à 13 048€ », « RFR situé entre 17 058€ et 26 471€ », « RFR > à 26 472€ ». It also gives +3,484 € per additional half-part for the exonération threshold, and notes that the thresholds were raised by 1.8 %.

Two rule details:
- **Two-year smoothing rule.** The CNAV Recueil statistique says the smoothing mechanism « conditionne l'application des taux médian et fort au dépassement du seuil les deux années précédentes ».
- **Minor inconsistency.** The boundary is 26,471 € versus 26,472 € (1 € rounding) across official pages. The 2025 boundaries are also cited as 12,817/12,818 € and 26,003/26,004 € by secondary sites.

### B2. Assiette: confirmed

The assiette is 98.25 % of gross salary: the 1.75 % abattement applies to the part of income below 4 PASS (188,400 € in 2025; 192,240 € in 2026). Above 4 PASS the assiette is 100 %. Source: CSS L136-2 I, quoted above. Insee's series title also says so: « Taux de la contribution sociale généralisée (CSG) (part salariale) : sur 98,25% du salaire brut » (https://www.insee.fr/fr/statistiques/serie/001641564).

### B3. CSG revenue by assiette (all recipients: branches, FSV, CADES, Unédic)

Source: *Les Comptes de la Sécurité sociale – Rapport à la CCSS*, May 2026 (résultats 2025, prévisions 2026), fiche 1.3 « La CSG », p.52–53, Tableau 1 « Rendement de la CSG par assiette, tous affectataires » (M€). PDF: https://www.securite-sociale.fr/files/live/sites/SSFR/files/medias/CCSS/2026/CCSS%20mai%202026_assembl%C3%A9_V2.pdf

| Assiette | 2024 (M€) | 2025 (M€) | 2026 forecast (M€) |
|---|---|---|---|
| Revenus d'activité | 108,175 | **110,670** | 107,502 |
| of which secteur privé | 72,183 | 73,673 | 75,047 |
| of which secteur public | 19,833 | 19,998 | 20,268 |
| of which indépendants | 12,189 | 12,756 | 8,413 (assiette reform) |
| of which other (agricultural etc.) | 3,970 | 4,243 | 3,773 |
| Revenus de remplacement | 27,353 | **28,259** | 29,208 |
| of which retraites | 24,812 | **25,439** | 26,335 |
| of which chômage + activité partielle | 561 | 560 | 568 |
| of which invalidité + IJ | 1,838 | 2,043 | 2,083 |
| of which other | 142 | 218 | 222 |
| Revenus du capital | 17,627 | 17,590 | 18,800 |
| Jeux | 646 | 687 | 711 |
| **CSG brute** | **153,800** | **157,207** | 156,221 |

Verbatim quotes:
- « Son montant a atteint 157,2 Md€ pour l'ensemble de ses attributaires (branches famille, maladie et autonomie, FSV, Cades et Unédic) »
- « La CSG sur les revenus de remplacement est assise en 2025 à 90% sur les pensions versées par les régimes d'assurance vieillesse (de base et complémentaires), à 7,2% sur les pensions d'invalidité et les indemnités journalières et à 2,0% sur les indemnités d'assurance chômage »

**Inconsistency flag:** the same CCSS report shows « CSG 128 196 → 131 001 » (M€, 2024 → 2025) in its overview table (p.~10). That table covers only the régimes obligatoires de base + FSV and excludes CADES and Unédic shares. Use 157.2 Md€ for "total CSG".

### B4. Yield of 1 point of CSG

| Label | Value | Year | Source | URL | Verbatim quote / computation |
|---|---|---|---|---|---|
| **1 pt of CSG, all assiettes (official)** | **17.9 Md€** (17.6 in 2024) | 2025 | DSS, REPSS "Financement", indicator 1.4.1 « Valeur du point de CSG… » | https://evaluation.securite-sociale.fr/home/financement/1-4-1-valeur-du-point-de-csg-et.html | « La valeur d'un point de contribution sociale généralisée (CSG) (…) enregistrée en 2025 est de 17,9 Md€ (…) après 17,6 Md€ en 2024 ». Method: « rapportant le rendement constaté augmenté des montants d'exonérations aux taux en vigueur » |
| Share of CSG yield by assiette | activité 67.1 %, remplacement 21.8 %, capital 10.7 %, jeux 0.5 % | 2025 | idem | idem | « les revenus d'activité représentent 67,1 % de son rendement, le reste étant assis sur les revenus de remplacement (21,8 %), les revenus du patrimoine et de placement (10,7 %) et les revenus des jeux (0,5 %) » |
| **1 pt on activity income** | **≈ 12.0 Md€** | 2025 | **[OWN ESTIMATE]** from CCSS Tableau 1 | — | 110,670 M€ / 9.2 = 12,029 M€ |
| 1 pt on capital income | ≈ 1.9 Md€ | 2025 | **[OWN ESTIMATE]** | — | 17,590 / 9.2 = 1,912 M€ |
| 1 pt on replacement income (residual of the official 17.9) | ≈ 3.9 Md€ | 2025 | **[OWN ESTIMATE]** | — | 17.9 − 12.0 − 1.9 − ~0.1 (jeux) ≈ 3.9 Md€. This includes chômage and IJ, and may include exonérations depending on the DSS method |
| **+1 pt on pensions (all taxed rates: 3.8→4.8, 6.6→7.6, 8.3→9.3)** | **≈ 3.4–3.7 Md€** | 2025 | **[OWN ESTIMATE]**, calibration below | — | taxable pension base 339–373 Md€ × 1 % |

Calibration of the pension base:

- **Input 1: CSG on retraites (all regimes), 2025.** 25,439 M€ (CCSS).
- **Input 2: CNAV régime général, 2024.** Source: *Recueil statistique du régime général, données 2024*, fiche 1.6, p.63, https://www.statistiques-recherche.lassuranceretraite.fr/app/uploads/2025/09/1.6-Les-prelevements-obligatoires-sur-les-retraites.pdf
  - CSG taux fort 4,540.9 M€ → base 54.7 Md€
  - médian 2,936.7 M€ → base 44.5 Md€
  - faible 895.4 M€ → base 23.6 Md€
  - Taxed base 122.8 Md€; CRDS 618.9 M€ / 0.5 % = 123.8 Md€, which is consistent.
  - Mass shares: fort 44.6 %, médian 36.2 %, faible 19.2 %. Average rate 6.82 %.
- **Input 3: all regimes, 2018–2019.** The 2018 +1.7 pt on the normal rate yielded 4.5 Md€, giving a normal-rate base of about 265 Md€. The 2019 median-rate carve-out cost 1.3 Md€ / 1.7 pt, giving a base of about 76 Md€. That implies a fort:médian mass ratio of about 72:28 across all regimes. The ratio is higher than CNAV-only because complementary and public-service pensions skew toward higher incomes.
- **Scenario A (all regimes, preferred).**
  - Taxed-base shares: fort 66 %, médian 26 %, faible 8 %. Average rate 7.50 %.
  - Taxed base = 25,439 / 0.0750 = 339 Md€, of which 225 Md€ is at the normal rate.
  - Check: total pensions 2025 = 401 Md€ (COR, June 2026: « 401 Md€ sont consacrés aux prestations de retraite de base et complémentaire (hors Aspa) »). That leaves about 62 Md€ exempt or non-resident, which is plausible.
- **Scenario B (CNAV structure applied to all pensions).**
  - Average rate 6.82 %. Taxed base 373 Md€, of which 166 Md€ is at the normal rate.
  - Leaves only 28 Md€ exempt, which is less plausible.

Triangulation: +1 pt on all taxed pensions ≈ 3.4 (A) to 3.7 (B) Md€, consistent with the ≈3.9 Md€ residual above, which also includes chômage and IJ.

### B5. Revenue from aligning retirees' CSG on 9.2 %

| Scenario | Estimate | Source / computation |
|---|---|---|
| Historical: 2018 +1.7 pt on the normal pension rate (6.6 → 8.3 %), about 60 % of retirees; exempt and reduced-rate retirees excluded | **4.5 Md€** | Sénat, commission des affaires sociales press release, 8 Nov 2017, https://www.senat.fr/presse/cp20171108a.html : « 4,5 milliards de prélèvements supplémentaires sur les retraités ». Total 2018 +1.7 pt, all assiettes: 22.5 Md€ (Sénat rapport n° 77 (2017-2018) t. II, https://www.senat.fr/rap/l17-077-2/l17-077-218.html : « Le produit de cette augmentation s'élève à 22,5 milliards ») |
| Historical: 2019 taux médian 6.6 % (partial reversal) | cost 1.3 Md€ (social finances), cited elsewhere as 1.5 Md€ (public finances); 3.8 M households / ~5 M retirees | AN Rapport n° 1547 (O. Véran), 19 Dec 2018, https://www.assemblee-nationale.fr/dyn/opendata/RAPPANR5L15B1547.html : « Le coût pour les finances sociales est estimé à 1,3 milliard d'euros » ; « seuls 30 % des foyers fiscaux avec un retraité auront un taux de CSG de 8,3 % » ; « 40 % des retraités les plus modestes en avaient été exonérés d'emblée » |
| **Align taux normal only (8.3 → 9.2 %, +0.9 pt)** | **≈ 1.5–2.0 Md€/yr (2025 base), central 2.0** | **[OWN ESTIMATE]** 0.9 % × 225 Md€ (A) = 2.02 Md€; 0.9 % × 166 Md€ (B) = 1.50 Md€. Consistent with the press figure « près de 2 milliards d'euros » (Le Figaro, 23 July 2026, relayed by secondary sites; **no primary official source found**) |
| Align all taxed retirees (3.8 / 6.6 / 8.3 → 9.2 %, exempt stay exempt) | **≈ 5.8 Md€ (A); up to ≈ 8.9 Md€ (B)** | **[OWN ESTIMATE]** A: 0.9 %×225 + 2.6 %×87 + 5.4 %×27 = 2.02 + 2.27 + 1.46 = 5.75 Md€ |
| Remove the médian rate (6.6 → 8.3 %) | ≈ 1.5 Md€ | **[OWN ESTIMATE]** 1.7 % × 87 Md€ (A). The 2019 cost of creating it was 1.3 Md€ |

Caveats:
- These are static, gross figures.
- CSG is partly deductible from income tax. With the deductible share unchanged, the IR base is unaffected. If deductibility were raised with the rate, IR revenue would fall slightly.
- Pension revaluation or behavioural effects are not modelled.
- The Cour des comptes (Feb 2025 retraites report) and COR might contain official chiffrages. ccomptes.fr was unreachable, so I could not verify them.

### B6. Distribution of retirees across CSG rates

Source: CNAV, *Recueil statistique du régime général – données 2024*, fiche 1.6, p.61–62 (régime général retirees at 31/12/2024). URL above.

| Rate | Retirees (31/12/2024) | Share |
|---|---|---|
| Taux fort 8.3 % | 4,413,344 | 29 % |
| Taux médian 6.6 % | 4,132,030 | 27 % |
| Taux faible 3.8 % | 2,355,926 | 15 % |
| Exonérés (low income or resident abroad) | 4,487,719 | 29 % |

Verbatim: « 4,4 millions sont assujettis au taux fort (29 % des retraités), 4,1 millions sont assujettis au taux médian (27 %) et 2,4 millions au taux faible (15 %). Enfin, 4,5 millions de retraités (29 %) sont exonérés de CSG, en raison de ressources trop faibles ou d'une domiciliation à l'étranger. »

Trend: the taux fort count fell 4 % in 2024 because the thresholds were indexed on 2024 inflation (+5.3 %) while RFR 2022 pensions rose 3.1 %. CCSS notes the opposite effect for 2026.

Caveats:
- These are CNAV head-counts. Weighted by pension mass across all regimes, the normal rate's share is much higher: about 66 % of the taxed base in Scenario A. The 2018 AN report says about 30 % of *fiscal households* with a retiree are at 8.3 %.
- I found no DREES all-regime distribution. The DREES PDFs were unreachable.

---

## Summary of inconsistencies
1. **VAT total:** 210.7 Md€ (PLF 2026, budgetary, 2024) versus 208 Md€ (FIPECO, 2024). The difference is the accounting basis.
2. **VAT point, net all rates:** 11.4 (Trésor) versus 11.5 (FIPECO). This is rounding; use Trésor.
3. **VAT point, household field:** Insee 2019 gives about 3.9 Md€/pt (households only, first year) versus Trésor 8.9 Md€ gross. The perimeters differ.
4. **Value of the normal-rate point over time:** 6–7 Md€ (2012) → 8.9 gross / 7.5 net (2025).
5. **Total CSG:** 157.2 Md€ (all recipients) versus 131.0 Md€ (base regimes + FSV only).
6. **Cost of the 2019 median rate:** 1.3 Md€ (social finances) versus 1.5 Md€ (public finances), both in the same AN report.
7. **2026 threshold for the normal rate:** 26,471 € versus 26,472 € (1 € boundary convention).
8. **Retiree distribution:** CNAV head-counts (29 % at the normal rate) versus households (30 %) versus mass-weighted (about 2/3 of the taxed base at the normal rate; own estimate).

---

## Parameters ready for a simulator (single consistent set, base year 2025)

```yaml
tva:
  taux: {normal: 0.20, intermediaire: 0.10, reduit: 0.055, particulier: 0.021}
  recettes_nettes_totales_2025_Md: 210.0      # PLF 2026 VM t.I (2024 exec: 210.7)
  recettes_nettes_etat_2025_Md: 96.9
  point_brut_Md:  {tous_taux: 13.7, normal: 8.9, intermediaire: 1.9, reduit: 2.4, particulier: 0.4}  # Trésor-Éco 371
  point_net_Md:   {tous_taux: 11.4, normal: 7.5, intermediaire: 1.6, reduit: 2.0, particulier: 0.4}  # net of VAT paid by APU -> use for budget balance
  effet_prix:
    hausse_prix_conso_par_point_taux_normal_pct: 0.375   # OWN ESTIMATE: Sénat 2012 static 0.6 pt CPI for +1.6 pt -> 0.375 pt per pt, 100% pass-through
    taux_repercussion_court_terme: 0.75                  # Insee (Dec 2013), past French hikes
    perte_pouvoir_achat_par_point_tous_taux_pct: {moyenne: 0.5, Q1: 0.7, Q5: 0.4}  # Trésor-Éco 371
  taux_effort_revenu_disponible: {D1: 0.12, D10: 0.05}   # Insee Analyses 43 (2019)
  pensions_indexees_inflation_lag_ans: 1                 # CSS L161-25; Insee 2019 assumption

csg:
  activite: {taux: 0.092, deductible: 0.068, crds: 0.005, assiette: 0.9825, abattement_plafond_PASS: 4}
  PASS: {2025: 47100, 2026: 48060}
  retraites:
    taux:       {exonere: 0.0, reduit: 0.038, median: 0.066, normal: 0.083}
    deductible: {reduit: 0.038, median: 0.042, normal: 0.059}
    crds: 0.005        # not for exempt
    casa: 0.003        # median and normal only
    seuils_RFR_1part: # upper bounds; RFR of N-2; median/normal require threshold crossed 2 consecutive years
      2025: {exonere: 12817, reduit: 16755, median: 26004}
      2026: {exonere: 13048, reduit: 17057, median: 26472}
  chomage_ij_taux: 0.062
  capital_taux_2026: 0.106
  recettes_2025_Md: {total: 157.2, activite: 110.67, remplacement: 28.26, retraites: 25.44, capital: 17.59, jeux: 0.69}
  valeur_point_Md:
    toutes_assiettes: 17.9                # DSS REPSS 2025 (official)
    activite: 12.0                        # OWN ESTIMATE 110.67/9.2
    retraites_tous_taux_assujettis: 3.4   # OWN ESTIMATE (range 3.4-3.7)
  alignement_retraites_9_2:
    taux_normal_seul_Md: 2.0              # OWN ESTIMATE (range 1.5-2.0)
    tous_assujettis_Md: 5.8               # OWN ESTIMATE (upper range ~8.9 under CNAV structure)
  repartition_retraites_CNAV_2024: {exonere: 0.29, reduit: 0.15, median: 0.27, normal: 0.29}
  base_imposable_pensions_2025_Md: {normal: 225, median: 87, reduit: 27}   # OWN ESTIMATE, Scenario A
```
