# Niveau de vie des retraités vs actifs (France): sourced data for a chart

Compiled 25 Sept 2026. Every number below comes from a file or PDF I downloaded and parsed (xlsx read cell by cell, PDFs text-extracted). Anything I computed myself is marked **[calcul propre]** and the formula is shown.

**Headline finding.** Insee released ERFS **2024** data on 9 July 2026, so the latest year is **2024**, not 2023. In 2024 the median standard of living of retirees (26 830 €) is 100.3 % of the whole population's median (26 740 €) and 89.9 % of the median for people in employment (29 860 €). The COR's official indicator (mean standard of living of retirees ÷ whole population) is 100.2 % in 2023. The COR projects it to reach 103.2 % in 2025–2026, then fall to 95.1 % in 2050 and 90.3 % in 2070 (June 2026 report, reference scenario).

---

## 0. Sources used (full references)

| Code | Title | Publisher / date | URL | Where the data is |
|---|---|---|---|---|
| **INSEE-ACT** | « Niveau de vie selon le statut d'activité » (Chiffres-clés, données annuelles de 1996 à 2024) | Insee, paru le 09/07/2026 | https://www.insee.fr/fr/statistiques/2415628 ; xlsx: https://www.insee.fr/fr/statistiques/fichier/2415628/reve-niv-vie-individu-activite.xlsx | Sheet « Figure 1 » (median), « Figure 2 » (mean), in 2024 constant euros |
| **INSEE-AGE** | « Niveau de vie selon l'âge » (Chiffres-clés, 1996 à 2024) | Insee, 09/07/2026 | https://www.insee.fr/fr/statistiques/2416878 ; xlsx: https://www.insee.fr/fr/statistiques/fichier/2416878/reve-niv-vie-individu-age.xlsx | Sheet « Figure 1 » (median), « Figure 2 » (mean), in 2024 constant euros |
| **IP2117** | « Niveau de vie et pauvreté en 2024 – Les niveaux de vie augmentent sans freiner les inégalités », Insee Première n° 2117 (C. Rieg, A. Rousset) | Insee, 09/07/2026 | https://www.insee.fr/fr/statistiques/9019316 ; xlsx: https://www.insee.fr/fr/statistiques/fichier/9019316/ip2117.xlsx | Figure 4; Tableau complémentaire 1 and 2 (retropolated series without breaks, 1996–2024) |
| **FPS25** | « Niveaux de vie », fiche of *France, portrait social*, édition 2025 | Insee Références, 18/11/2025 | https://www.insee.fr/fr/statistiques/8612538 ; xlsx: https://www.insee.fr/fr/statistiques/fichier/8612538/FPORSOC25-F17.xlsx | Figures 1–3 (2023, current euros) |
| **RPM24** | *Les revenus et le patrimoine des ménages*, édition 2024, fiches 1.12 « Niveau de vie et pauvreté des adultes selon l'âge » and 1.15 « Niveau de vie et pauvreté selon l'activité » | Insee Références, 2024 | https://www.insee.fr/fr/statistiques/fichier/7941393/RPM2024-F12.xlsx ; https://www.insee.fr/fr/statistiques/fichier/7941399/RPM2024-F15.xlsx | Data for 2021 |
| **COR26** | *Évolutions et perspectives des retraites en France – Rapport annuel du COR, juin 2026* | Conseil d'orientation des retraites, 11/06/2026 | PDF: https://www.cor-retraites.fr/sites/default/files/2026-06/RA_2026_def.pdf ; data: https://www.cor-retraites.fr/sites/default/files/2026-06/Donn%C3%A9es_RA2026_P3_2.xlsx and https://www.cor-retraites.fr/sites/default/files/2026-06/Donn%C3%A9es_RA2026_synth%C3%A8se_0.xlsx | Partie 3, chapitre 2 (PDF pp. 145–157, printed pp. 143–155); chapitre 3 (Tableau 3.4, PDF p. 170) |
| **COR25** | Rapport annuel du COR, juin 2025 (figure data file) | COR, 2025 | https://www.cor-retraites.fr/sites/default/files/2025-10/Donn%C3%A9es_RA2025_P3.xlsx | Sheets « Fig 3.11 », « Fig 3.30 », « Fig 3.34 » |
| **OECD-PaG25** | *Pensions at a Glance 2025: OECD and G20 Indicators*, ch. 7 « Incomes of older people » | OECD, Nov. 2025 | https://www.oecd.org/content/dam/oecd/en/publications/reports/2025/11/pensions-at-a-glance-2025_76510fe4/e40274c1-en.pdf (StatLink https://stat.link/crov86) | Table 7.1 (PDF p. 211, printed p. 209); key results on printed p. 208 |
| **CHECKNEWS** | « La France est-elle le pays où les retraités gagnent le plus par rapport aux actifs, comme l'indique un graphique du "Financial Times" ? » (Libération CheckNews, republished on De Facto) | 17/09/2025 | https://defacto-observatoire.fr/Medias/CheckNews/Fact-checks/La-France-est-elle-le-pays-ou-les-retraites-gagnent-le-plus-par-rapport-aux-actifs-comme-l-indique-un-graphique-du-Financial-Times/ | Describes the FT chart; Burn-Murdoch's own explanation |
| **FT** | J. Burn-Murdoch, « France and Britain are in thrall to pensioners » | Financial Times, 13/09/2025 | https://www.ft.com/content/d419bd2d-a6ba-44a5-a93a-1276f3e5d2d7 | **Not reachable**: 403 bot-protection page. Described below from secondary sources. |

**Unreachable sources.** DREES *Les retraités et les retraites 2025*, fiche 09 « Le niveau de vie des retraités » (https://drees.solidarites-sante.gouv.fr/sites/default/files/2025-07/Fiche%2009%20-%20Le%20niveau%20de%20vie%20des%20retrait%C3%A9s.pdf) could not be fetched: curl got « Empty reply from server », WebFetch got HTTP 503, and the Wayback Machine failed TLS. None of its numbers are used here. The COR 2026 series already includes the DREES retropolation (COR26 footnote 148).

**Definition shared by all Insee/COR figures.** Niveau de vie = revenu disponible du ménage ÷ nombre d'unités de consommation, using the modified OECD scale (1 / 0,5 / 0,3). Scope: France métropolitaine, personnes en logement ordinaire, ménages whose declared income is ≥ 0 and whose reference person is not a student. Activity status is measured in the ILO (BIT) sense in Q4 (FPS25 note). The Insee « retraités » group is therefore BIT-inactive retirees. People combining work and pension are counted as « en emploi » (COR26 Tableau 3.4: « retraités inactifs au sens BIT (hors cumul emploi-retraite) »).

---

## 1. Annual series: median standard of living by activity status, 1996–2024

### 1a. Insee Chiffres-clés (INSEE-ACT), median, annual euros, **2024 constant euros**

Source: INSEE-ACT, sheet « Figure 1 », title « Niveau de vie médian selon le statut d'activité », unit « en euros 2024 constants ». Reading note, verbatim: « Lecture : en 2024, le niveau de vie médian des salariés de 18 ans ou plus est de 29 940 euros. » Sources line: « Insee-DGI, enquêtes Revenus fiscaux et sociaux rétropolées de 1996 à 2004 ; Insee-DGFiP-Cnaf-Cnav-CCMSA, enquêtes Revenus fiscaux et sociaux 2005 à 2024. »

The deflator is not stated in the file, which only says « euros 2024 constants ». IP2117 converts current to constant euros with consumer-price inflation (« l'inflation est en net reflux (+2,0 % en moyenne annuelle après +4,9 % en 2023 et +5,2 % en 2022) »). The last column of the table is the ratio of means from sheet « Figure 2 ». All ratio columns are **[calcul propre]**: ratio = group ÷ ensemble × 100.

| Year (Insee column) | Ensemble | Retraités | Actifs en emploi | Actifs 18+ (emploi + chômage) | Retraités / Ensemble (%) | En emploi / Ensemble (%) | Retraités / En emploi (%) | Mean retraités / mean ensemble (%) |
|---|---|---|---|---|---|---|---|---|
| 1996 | 20 670 | 21 280 | 23 080 | 22 140 | 103.0 | 111.7 | 92.2 | 102.7 |
| 1997 | 20 700 | 21 010 | 23 300 | 22 330 | 101.5 | 112.6 | 90.2 | 102.0 |
| 1998 | 21 130 | 21 350 | 23 800 | 22 810 | 101.0 | 112.6 | 89.7 | 101.8 |
| 1999 | 21 440 | 21 850 | 23 930 | 23 140 | 101.9 | 111.6 | 91.3 | 104.3 |
| 2000 | 21 830 | 22 030 | 24 290 | 23 560 | 100.9 | 111.3 | 90.7 | 103.0 |
| 2001 | 22 370 | 22 420 | 24 920 | 24 240 | 100.2 | 111.4 | 90.0 | 101.8 |
| 2002 | 22 960 | 22 690 | 25 620 | 24 840 | 98.8 | 111.6 | 88.6 | 100.9 |
| 2003 | 22 900 | 22 610 | 25 500 | 24 770 | 98.7 | 111.4 | 88.7 | 101.7 |
| 2004 | 22 780 | 22 580 | 25 430 | 24 680 | 99.1 | 111.6 | 88.8 | 101.6 |
| 2005 | 23 190 | 22 830 | 25 810 | 25 080 | 98.4 | 111.3 | 88.5 | 101.7 |
| 2006 | 23 520 | 23 670 | 25 980 | 25 390 | 100.6 | 110.5 | 91.1 | 103.9 |
| 2007 | 24 010 | 23 970 | 26 680 | 26 020 | 99.8 | 111.1 | 89.8 | 102.2 |
| 2008 | 24 420 | 24 140 | 26 940 | 26 300 | 98.9 | 110.3 | 89.6 | 101.9 |
| 2009 | 24 490 | 24 430 | 27 260 | 26 440 | 99.8 | 111.3 | 89.6 | 101.9 |
| 2010 (old method) | 24 380 | 24 170 | 27 270 | 26 380 | 99.1 | 111.9 | 88.6 | 101.6 |
| 2010² (new method) | 24 220 | 24 020 | 27 070 | 26 150 | 99.2 | 111.8 | 88.7 | 102.4 |
| 2011 | 24 220 | 24 160 | 27 040 | 26 150 | 99.8 | 111.6 | 89.3 | 102.0 |
| 2012 (old method) | 23 980 | 24 240 | 26 780 | 25 830 | 101.1 | 111.7 | 90.5 | 103.2 |
| 2012³ (new method) | 24 200 | 24 990 | 26 950 | 26 000 | 103.3 | 111.4 | 92.7 | 104.1 |
| 2013 | 24 180 | 25 060 | 26 760 | 25 920 | 103.6 | 110.7 | 93.6 | 106.4 |
| 2014 | 24 230 | 25 040 | 26 750 | 25 870 | 103.3 | 110.4 | 93.6 | 104.9 |
| 2015 | 24 320 | 25 260 | 26 960 | 26 110 | 103.9 | 110.9 | 93.7 | 104.7 |
| 2016 | 24 550 | 25 720 | 27 180 | 26 270 | 104.8 | 110.7 | 94.6 | 104.9 |
| 2017 | 24 650 | 25 880 | 27 140 | 26 300 | 105.0 | 110.1 | 95.4 | 103.7 |
| 2018 | 24 690 | 25 350 | 27 470 | 26 660 | 102.7 | 111.3 | 92.3 | 100.9 |
| 2019 | 25 340 | 25 740 | 28 110 | 27 390 | 101.6 | 110.9 | 91.6 | 100.8 |
| 2020⁴ (old chain, fragile) | 25 820 | 26 330 | 28 790 | 28 090 | 102.0 | 111.5 | 91.5 | 100.5 |
| 2020⁴⁵ (new ERFS chain) | 26 160 | 26 380 | 29 050 | 28 440 | 100.8 | 111.0 | 90.8 | 99.0 |
| 2021 | 26 070 | 26 080 | 29 110 | 28 500 | 100.0 | 111.7 | 89.6 | 98.0 |
| 2022 | 26 030 | 25 610 | 29 230 | 28 630 | 98.4 | 112.3 | 87.6 | 97.1 |
| 2023 | 26 280 | 25 920 | 29 320 | 28 660 | 98.6 | 111.6 | 88.4 | 99.4 |
| 2024 | 26 740 | 26 830 | 29 860 | 29 240 | 100.3 | 111.7 | 89.9 | 100.2 |

INSEE-ACT footnotes, verbatim:
- ¹ « Le mode de calcul de la variable activité au sens du BIT a été modifié plusieurs fois au cours de la période observée, ce qui explique certaines évolutions heurtées, par exemple entre 2002 et 2003. »
- ² « À partir de 2010, les estimations de revenus financiers mobilisent l'enquête Patrimoine 2010. »
- ³ « Cette série a été recalculée à partir des données de l'année 2012 en cohérence avec les modifications méthodologiques intervenues sur les données de l'année 2013. Par ailleurs, à partir de 2012, les estimations de revenus financiers mobilisent l'enquête Patrimoine 2014-2015. »
- ⁴ « Le point 2020 présente des fragilités liées aux difficultés de production en 2020. »
- ⁵ « À partir de 2020, cette série est calculée avec une chaîne de production de l'ERFS rénovée s'appuyant sur la nouvelle Enquête Emploi. »
- ⁶ (autres inactifs) « Les chiffres relatifs aux "autres individus inactifs (dont étudiants)" ne sont pas comparables entre 2022 et 2023. »

The latest two years are cross-checked against IP2117, Figure 4 « Niveau de vie et taux de pauvreté selon le statut d'activité, en 2023 et 2024 », median in 2024 constant euros. For 2024: Personnes en emploi 29 860; Salariés 29 940; Indépendants 28 860; Chômeurs 19 540; **Retraités 26 830**; Ensemble 26 740. For 2023: Retraités 25 920; Ensemble 26 280. These are identical to INSEE-ACT. Verbatim quote: « En 2024, le niveau de vie médian des retraités […] augmente de 3,5 % en euros constants, contre +1,8 % pour l'ensemble de la population (figure 4). Le niveau de vie médian des retraités en logement ordinaire dépasse ainsi légèrement en 2024 celui de l'ensemble de la population. »

### 1b. 2023 medians in current euros (FPS25, Figure 2), a consistency check

FPS25 « Figure 2 – Distribution du niveau de vie annuel et indicateurs d'inégalités selon l'activité en 2023 », euros 2023:

| Group | D1 | Median | D9 | Mean |
|---|---|---|---|---|
| Actifs 18+ | 15 260 | 28 100 | 50 690 | 32 320 |
| En emploi | 16 320 | 28 740 | 51 290 | 33 150 |
| Chômage | 9 740 | 18 670 | 36 560 | 22 020 |
| **Retraités** | 15 040 | **25 420** | 44 800 | 29 440 |
| **Ensemble** | 13 460 | **25 760** | 46 960 | 29 620 |

The 2023→2024-euro factor implied by the ensemble median is 26 280 / 25 760 = 1.0202 **[calcul propre]**. It converts retirees' 25 420 into 25 933, consistent with the 25 920 in INSEE-ACT.

COR26 uses the same 2023 medians expressed monthly. Tableau 3.4 (PDF p. 170): médiane retraités **2 118 €/mois**, actifs y compris chômeurs 2 338, ensemble 2 147. Ratios printed: retraités/actifs 91 %, retraités/ensemble 99 %. Text quote: « En 2023, le niveau de vie médian des retraités est égal à 2 118 euros par mois et par unité de consommation ». Check: 2 118 × 12 = 25 416 ≈ 25 420 **[calcul propre]**.

### 1c. Break-free whole-population median, 1996–2024 (IP2117, Tableau complémentaire 2)

« Niveau de vie médian (D5) », after redistribution, in 2024 constant euros. The table note says: « Les données de 1996 à 2020 sont rétropolées pour permettre une comparaison temporelle et peuvent donc différer des séries longues diffusées par ailleurs sur www.insee.fr avec des ru[ptures] ».

| 1996 | 1997 | 1998 | 1999 | 2000 | 2001 | 2002 | 2003 | 2004 | 2005 | 2006 | 2007 | 2008 | 2009 | 2010 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 21 000 | 21 030 | 21 470 | 21 780 | 22 180 | 22 730 | 23 320 | 23 260 | 23 140 | 23 550 | 23 900 | 24 400 | 24 800 | 24 880 | 24 770 |

| 2011 | 2012 | 2013 | 2014 | 2015 | 2016 | 2017 | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 24 760 | 24 520 | 24 500 | 24 550 | 24 640 | 24 870 | 24 970 | 25 020 | 25 680 | 26 160 | 26 070 | 26 030 | 26 280 | 26 740 |

Insee publishes this break-free retropolation only for the whole population. For retirees and workers the only published annual median series is INSEE-ACT, which contains breaks.

### 1d. COR: mean standard of living of retirees ÷ whole population, 1970–2023 (observed)

COR26, Figure 3.13, « Niveau de vie relatif des retraités (niveau de vie moyen des retraités rapporté à celui de l'ensemble de la population) observé et projeté dans le scénario de référence ». PDF p. 156 (printed p. 154). Data: Données_RA2026_P3 xlsx, sheet « Fig 3.13 », and the same series in Données_RA2026_synthèse, sheet « Niveau de vie relatif ». Values are in %, read from the xlsx (stored as ratios) and multiplied by 100.

| 1970 | 1975 | 1979 | 1984 | 1990 | 1996 | 1997 | 1998 | 1999 | 2000 | 2001 | 2002 | 2003 | 2004 | 2005 | 2006 | 2007 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 70.5 | 76.1 | 80.0 | 85.1 | 89.1 | 102.3 | 101.9 | 103.0 | 103.6 | 102.4 | 101.4 | 101.3 | 101.7 | 101.6 | 102.8 | 103.0 | 102.0 |

| 2008 | 2009 | 2010 | 2011 | 2012 | 2013 | 2014 | 2015 | 2016 | 2017 | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 101.8 | 102.1 | 102.2 | 102.6 | 104.3 | 104.7 | 103.9 | 103.9 | 103.4 | 101.3 | 99.9 | 99.9 | 99.4 | 98.7 | 97.7 | **100.2** |

Verbatim quotes from COR26:
- p. 154 (printed 152): « En 2023, le niveau de vie des retraités représente 100,2 % de celui de l'ensemble de la population après être passé par un maximum à 104 % vers 2013-2014 »
- Footnote 148: « La série a été rétropolée par la Drees pour intégrer le changement de méthodologie de l'enquête ERFS en 2021. »
- Figure note: « les anciennes enquêtes Revenus fiscaux étaient effectuées environ tous les cinq ans de 1970 à 1996. Le revenu mesuré dans ces anciennes enquêtes n'est pas directement comparable au revenu mesuré dans les enquêtes réalisées à partir de 1996, d'où la rupture de série en 1996. […] Les séries ont été rétropolées à l'aide de la Drees de 1996 à 2019 pour intégrer le changement de méthodologie de 2021. »

Mean levels for 2023 come from COR26 Figure 3.10 (PDF p. 149), « niveau de vie mensuel moyen […] en 2023 »:

| Group | €/month |
|---|---|
| Actifs 18+ | 2 693 |
| Actifs occupés | 2 762.5 |
| Chômeurs | 1 835 |
| Retraités* | 2 473 |
| Autres inactifs | 1 917.5 |
| Enfants < 18 | 2 216 |
| Ensemble | 2 468 |

\* « définition des retraités excluant les bénéficiaires des seules pensions d'invalidité ».

Quote: « avec 2 763 euros mensuels, les personnes en emploi ont un niveau de vie supérieur de 12 % à celui de l'ensemble de la population ».

Imputed rents, from COR26 Figure 3.9 (PDF p. 148). Including net imputed rents, retirees stand at 106.5 % and actifs at 107.2 % of the whole population. This is a SG-COR estimate based on ERFS 2021: « Le niveau de vie avec loyers imputés a été estimé par le SG-COR à partir des données de ERFS 2021 ».

---

## 2. Median standard of living by age group

### 2a. Insee, 1996, 2000, 2010, 2019 and 2024 (INSEE-AGE, sheet « Figure 1 », « Niveau de vie médian selon l'âge », euros 2024 constants)

Reading note, verbatim: « Lecture : en 2024, le niveau de vie médian des personnes de moins de 18 ans est de 23 820 euros. » The ratio columns are **[calcul propre]**: age group ÷ Ensemble × 100. The 2010 value is from the pre-break column, to stay comparable with 1996–2009. The post-break 2010¹ values are: <18: 22 120; 18–29: 23 090; 30–39: 25 150; 40–49: 24 850; 50–64: 27 310; 65–74: 24 640; 75+: 22 410; Ensemble: 24 220.

| Age group | 1996 | 2000 | 2010 | 2019 | 2024 | % of ens. 1996 | % 2000 | % 2010 | % 2019 | % 2024 |
|---|---|---|---|---|---|---|---|---|---|---|
| Moins de 18 ans | 18 760 | 19 860 | 22 240 | 22 800 | 23 820 | 90.8 | 91.0 | 91.2 | 90.0 | 89.1 |
| 18–29 ans | 19 350 | 20 660 | 23 180 | 24 050 | 25 860 | 93.6 | 94.6 | 95.1 | 94.9 | 96.7 |
| 30–39 ans | 20 860 | 22 150 | 25 370 | 25 910 | 27 610 | 100.9 | 101.5 | 104.1 | 102.2 | 103.3 |
| 40–49 ans | 22 290 | 23 290 | 24 900 | 25 870 | 27 280 | 107.8 | 106.7 | 102.1 | 102.1 | 102.0 |
| 50–64 ans | 23 580 | 25 310 | 27 610 | 28 120 | 29 590 | 114.1 | 115.9 | 113.2 | 111.0 | 110.7 |
| 65–74 ans | 21 620 | 22 120 | 24 880 | 26 700 | 27 340 | 104.6 | 101.3 | 102.1 | 105.4 | 102.2 |
| 75 ans et plus | 20 420 | 20 910 | 22 350 | 24 820 | 26 480 | 98.8 | 95.8 | 91.7 | 97.9 | 99.0 |
| **Ensemble** | 20 670 | 21 830 | 24 380 | 25 340 | 26 740 | 100 | 100 | 100 | 100 | 100 |

The full annual series 1996–2024 for all seven groups is in the same sheet. It carries the same breaks: 2010¹, 2012², and 2020³ / 2020³⁴.

### 2b. Insee 2023 detail (FPS25, Figure 3, euros 2023)

| Age | D1 | Median | D9 | Mean |
|---|---|---|---|---|
| < 18 | 12 170 | 23 220 | 42 690 | 26 590 |
| 18–29 | 12 760 | 24 940 | 43 070 | 27 320 |
| 30–39 | 13 800 | 26 580 | 46 580 | 29 750 |
| 40–49 | 13 840 | 26 800 | 47 900 | 30 300 |
| 50–64 | 13 950 | 28 010 | 53 900 | 32 960 |
| **65+** | 15 040 | **25 590** | 46 060 | 30 340 |
| Ensemble | 13 460 | 25 760 | 46 960 | 29 620 |

The 65+ median is 99.3 % of the whole population's median **[calcul propre]**: 25 590 / 25 760.

### 2c. Finer 5-year age groups, 2023, MEANS not medians (COR26 Figure 3.11, PDF p. 150)

Title: « Niveau de vie mensuel moyen selon l'âge (hors loyers imputés) en 2023 », €/month, euros 2023. Source: Insee ERFS 2023. The COR publishes no medians for these 5-year groups.

| Age | Ensemble | dont actifs BIT | dont retraités(1) | Population (thousands) |
|---|---|---|---|---|
| 0–4 | 2 253 | – | – | 3 173 |
| 5–9 | 2 250 | – | – | 3 651 |
| 10–14 | 2 214 | – | – | 4 044 |
| 15–19 | 2 137 | 1 973 | – | 3 728 |
| 20–24 | 2 206 | 2 228 | – | 3 218 |
| 25–29 | 2 380 | 2 448 | – | 3 525 |
| 30–34 | 2 453 | 2 568 | – | 3 848 |
| 35–39 | 2 504 | 2 606 | – | 4 064 |
| 40–44 | 2 486 | 2 605 | – | 4 141 |
| 45–49 | 2 565 | 2 677 | – | 3 996 |
| 50–54 | 2 647 | 2 796 | 1 900 | 4 332 |
| 55–59 | 2 816 | 3 010 | 2 215 | 4 226 |
| 60–64 | 2 783 | 3 242 | 2 567 | 4 036 |
| 65–69 | 2 620 | 3 599 | 2 502 | 3 784 |
| 70–74 | 2 510 | 3 390 | 2 480 | 3 536 |
| 75–79 | 2 665 | – | 2 566 | 2 828 |
| 80–84 | 2 383 | – | 2 380 | 1 699 |
| 85+ | 2 301 | – | 2 312 | 1 857 |
| Tous âges | 2 468 | 2 688 | 2 473 | – |

Quote: « Lecture : en 2023, le niveau de vie moyen de l'ensemble des 50-54 ans est de 2 647 euros mensuels, alors qu'il s'élève à 2 796 euros pour les actifs de 50-54 ans et à 1 900 euros pour les retraités du même âge. »

(1) « retraités hors bénéficiaires des seules pensions d'invalidité ». A dash (–) means the cell is empty in the xlsx (not published or n.s.).

### 2d. RPM24 fiche 1.12 (2021), adults only, with 18–24 and 25–29 split

Figure 1, annual euros 2021. Medians: 18–24 21 590; 25–29 23 500; 30–39 23 640; 40–49 23 660; 50–64 25 850; 65+ 23 240; all 18+ 23 820. The fiche also has the mean by age, 1996–2021, in 2021 euros (Figure 3; groups <18, 18–29, 30–49, 50–64, 65+).

---

## 3. COR projections: relative standard of living of retirees (mean retirees ÷ mean whole population)

COR26, Figure 3.13 (PDF p. 156) and Données_RA2026_P3 xlsx, sheet « Fig 3.13 », row « Scénario de référence ». Scenario definition, verbatim: « hypothèses démographiques centrales de l'Insee (poursuite des gains d'espérance de vie, fécondité de 1,45 enfant par femme et solde migratoire net de 150 000 personnes par an), croissance annuelle de la productivité horaire du travail de 0,7 % et taux de chômage de 7,0 % (à partir de 2040). » The model is Insee Destinie.

| Year | Reference scenario (prod. 0.7 %, unemp. 7 %) | Prod. 1.0 % | Prod. 0.4 % | Unemp. 5 % | Unemp. 10 % |
|---|---|---|---|---|---|
| 2023 (last observed) | **100.2** | 100.2 | 100.2 | 100.2 | 100.2 |
| 2024 | 102.3 | – | – | – | – |
| 2025 | 103.2 | 103.2 | 103.2 | 103.2 | 103.2 |
| 2026 | 103.2 | – | – | – | – |
| 2030 | **102.2** | 102.1 | 102.1 | 102.2 | 102.0 |
| 2040 | **96.9** | 96.0 | 97.6 | 96.1 | 97.9 |
| 2045 | 96.3 | – | – | – | – |
| 2050 | **95.1** | 93.0 | 97.0 | 94.3 | 96.0 |
| 2060 | 93.2 | 90.2 | 95.9 | 92.3 | 93.9 |
| 2070 | **90.3** | 86.6 | 93.3 | 88.8 | 91.3 |

The variants come from the same xlsx: « Fig 3.37 » (productivity) and « Fig 3.33 » (unemployment). There is also a variant for civil-service pay (« Fig 3.39 »): if civil-service pay grows like everyone else's, the values are 2030 102.3, 2040 98.1, 2050 96.9, 2070 91.8. The full year-by-year path 2024–2070 is in the xlsx.

Verbatim quotes, COR26:
- p. 155 (printed 153): « La pension relative diminuerait donc en projection et le niveau de vie relatif des retraités s'établirait à 90,3 % en 2070. Cet indicateur retrouverait dès lors des valeurs comparables à celles qu'il avait connues au début des années 1990. »
- Same page: « il passerait de 100,2 % en 2023 à 103,2 % en 2025 et 2026 avant de commencer à diminuer de nouveau. »
- Figure 3.13 reading note: « En projection, il devrait atteindre 96,3 % en 2045. »

For comparison, the previous vintage (COR25, xlsx sheet « Fig 3.11 », reference scenario with fertility 1.8 and net migration 70 000):

| Year | COR25 value |
|---|---|
| 2022 (last observed) | 97.0 |
| 2023 (projected) | 95.9 |
| 2024 | 97.9 |
| 2030 | 97.0 |
| 2040 | 92.7 |
| 2050 | 90.3 |
| 2060 | 88.4 |
| 2070 | 87.5 |

---

## 4. Composition of household disposable income

### 4a. COR26 Figure 3.8 (PDF p. 147), 2023, mean € per household per month (not per UC)

Title: « Composition du revenu disponible des ménages retraités, des ménages actifs et de l'ensemble de la population en 2023 ». A « ménage retraité (actif) » is one whose reference person is retired (active). Source: Insee ERFS 2023. Values are from the xlsx sheet « Fig 3.8 ».

| Component | Retraités | Actifs | Ensemble |
|---|---|---|---|
| Revenus d'activité | 138 | 4 245 | 2 733 |
| Pensions | 2 641 | 213 | 999 |
| Revenus du patrimoine | 555 | 383 | 424 |
| Prestations sociales (hors retraite et chômage) | 59 | 209 | 190 |
| Impôts directs | −120 | −284 | −218 |
| Prélèvements sociaux (CSG, CRDS…) | −294 | −503 | −413 |
| **Revenu disponible** | **2 978** | **4 263** | **3 715** |

Reading note, verbatim: « en 2023, les ménages dont la personne de référence est retraitée ont un revenu total mensuel de 2 978 euros, composé de 2 641 euros de pension, 138 euros de revenus d'activité, 555 euros de revenus du patrimoine et 59 euros d'autres prestations, desquels viennent se déduire 120 euros d'impôts et 294 euros de prélèvements sociaux. » On the actifs' earnings the text says (p. 145): « les revenus d'activité (y compris les allocations chômage) pour les actifs ».

Shares, **[calcul propre]**. Gross income = activité + pensions + patrimoine + prestations. Each share is component ÷ gross income, or component ÷ disposable income. The components are gross of CSG, so shares of disposable income add up to more than 100 %.

| Share | Retraités | Actifs | Ensemble |
|---|---|---|---|
| Pensions, % of gross income | **77.8 %** | 4.2 % | 23.0 % |
| Pensions, % of disposable income | **88.7 %** | 5.0 % | 26.9 % |
| Revenus d'activité, % of gross income | 4.1 % | **84.1 %** | 62.9 % |
| Revenus d'activité, % of disposable income | 4.6 % | **99.6 %** | 73.6 % |
| Revenus du patrimoine, % of gross income | **16.4 %** | 7.6 % | 9.8 % |
| Revenus du patrimoine, % of disposable income | **18.6 %** | 9.0 % | 11.4 % |
| Taxes + social levies, % of disposable income | −13.9 % | −18.5 % | −17.0 % |

Household size, verbatim: « un ménage retraité compte en moyenne 1,5 personne », and « les ménages retraités comptent pour 1,2 unité de consommation (UC) et les ménages actifs pour 1,6 ». Disposable income per household is 80.2 % (retirees) and 114.7 % (actifs) of the whole population.

### 4b. RPM24 fiche 1.12, Tableau complémentaire (2021), per person, annual €, niveau de vie components by age

| Age | Activité | Chômage | Pensions | Patrimoine | Prestations | Impôts | Niveau de vie moyen |
|---|---|---|---|---|---|---|---|
| 65+ | 2 730 | 120 | 23 550 | 3 920 | 490 | −4 140 | 26 670 |
| 30–39 | 26 280 | 1 170 | 460 | 1 170 | 1 930 | −4 490 | 26 520 |
| 40–49 | 26 900 | 910 | 560 | 1 860 | 1 780 | −5 020 | 26 990 |
| 50–64 | 25 480 | 1 010 | 5 400 | 3 250 | 1 180 | −6 080 | 30 250 |

Shares, **[calcul propre]**:
- 65+: pensions 76.4 % of gross income (88.3 % of niveau de vie); patrimoine 12.7 % of gross (14.7 % of niveau de vie); activité 8.9 % of gross.
- 30–39: activité 84.7 % of gross.
- 40–49: activité 84.0 % of gross.

### 4c. OECD (international framing)

OECD-PaG25, printed p. 208, verbatim: « The countries where over-65s are most reliant on public transfers are Austria, Belgium, Finland, France and Luxembourg: around 80% of their incomes come from that source. » OECD averages for over-65s: public transfers 56 %, private occupational 7 %, work 27 %, capital about 10 % (Figure 7.1, gross equivalised household income). The exact French split is only in the Figure 7.1 StatLink (https://stat.link/zx5sen), which I could not download because oecd.org is behind bot protection.

---

## 5. The Financial Times chart and OECD comparators

### 5a. What the FT chart plots, as far as verifiable

**Article.** John Burn-Murdoch, « France and Britain are in thrall to pensioners », *Financial Times*, 13 September 2025, https://www.ft.com/content/d419bd2d-a6ba-44a5-a93a-1276f3e5d2d7. I could not open the FT page (403 bot check), so this description relies on secondary sources, quoted verbatim.

**Chart 1: over-65s' income relative to the working-age population, by country.** From CHECKNEWS (17/09/2025):
- Title and design: « les retraités français ("pensionners"), selon le titre, apparaissent en effet en tête des pays étudiés, étant les seuls à afficher un niveau de revenus supérieur à la population en âge de travailler ».
- Subtitle: « Selon le sous-titre, ces données correspondent en réalité au niveau de revenu relatif, "Relative income level", des plus de 65 ans (et non pas seulement des retraités) par rapport à celui de la population en âge de travailler ("working age"). En légende, il est fait référence à des chiffres de l'OCDE et à un institut luxembourgeois sur les revenus. »
- Method, as Burn-Murdoch explained it to CheckNews: data « issues de [sa] propre analyse originale des microdonnées de l'étude luxembourgeoise sur les revenus ». He accounts for incomes and taxes, and « le revenu moyen du ménage est attribué de manière égale à la tranche d'âge de chaque membre du ménage ».
- Year: « L'auteur ajoute – fait important – que les données pour la France datent de 2020. »
- CheckNews's interpretation: the comparison group is the working-age population (« incluant donc les étudiants, les chômeurs... »), not workers only.

Country values, from Fortune (16/09/2025, https://fortune.com/2025/09/16/france-retirees-higher-income-workers-american-pensioners-cost-of-living-crisis) and Pension Policy International, which reports on the same « Financial Times analysis of a recent Luxembourg Income Study »:
- France: « currently earn around 2% more than working adults ». The Institut Presaje article on French retirees (https://www.institut-presaje.com/articles/retraites-francaises/) cites 101 %.
- « American pensioners earn about a sixth less in relative income compared to employed adults, U.K. retirees bring in about a fifth less, and retired Australians face the largest disparity, with a third less in income. »
- The full country list and exact values could not be verified.

**Chart 2: cumulative real income growth, 1970–2020.** Same secondary source, verbatim: « In the five decades between 1970 and 2020, the cumulative increase in median income for working-aged French citizens between the ages of 18 and 64 rose by about 100%, while it increased by more than 160% for the nation's retirees. » So the metric is the cumulative % change in real median income, working-age 18–64 vs 65+, for France (and the UK, per the article's framing), with LIS data points from 1970 to 2020.

**Still unverified** (open the FT page manually to confirm):
- whether the income is equivalised (square-root or modified OECD scale) or per capita; Burn-Murdoch's « attribué de manière égale » wording is ambiguous;
- whether it uses the mean or the median;
- the exact countries shown;
- the exact axis labels.

**For a French equivalent from official data**, the closest official analogues are:
- (a) Insee median of retirees ÷ median of actifs en emploi: 89.9 % in 2024;
- (b) Insee 65+ median ÷ ensemble: 99.3 % in 2023;
- (c) OECD over-65s ÷ total population (table below).

None of these is exactly « 65+ vs 18–64 ». Insee does not publish an 18–64 aggregate. Its age groups (18–29, 30–39, 40–49, 50–64) cannot be merged into a median without microdata.

### 5b. OECD « Incomes of older people »

OECD-PaG25, Table 7.1, « Incomes of older people, 2022 or latest available year – Average income by age group and gender in percentage of average income of total population ». PDF p. 211. Source: OECD Income Distribution Database, June 2025 version. Measure: mean equivalised disposable income, square-root scale.

| | Over 65, all | Change since 2000 (pp) | Men | Women | 66–75 | Over 75 |
|---|---|---|---|---|---|---|
| **France (2022)** | **94.3** | −3.6 | 99.0 | 90.6 | 97.7 | 89.9 |
| **OECD average** | **86.6** | +5.3 | 91.9 | 82.5 | 91.5 | 79.9 |
| Italy | 98.8 | | | | | |
| Spain | 96.7 | | | | | |
| United States (2023) | 94.5 | | | | | |
| Canada (2023) | 93.7 | | | | | |
| Germany (2021) | 86.6 | | | | | |
| United Kingdom (2023) | 84.0 | | | | | |
| Australia (2020) | 73.8 | | | | | |

Quote: « The average income of people over 65 was equal to 87% of that of the total population on average across OECD countries in the latest year available (Table 7.1). »

A newer OECD vintage is reported by COR26, Figure 3.B (PDF p. 151), sourced to « base de données sur la distribution des revenus de l'OCDE, janvier 2026 », « 2023 ou dernière année connue ». Values from the xlsx sheet « Fig 3.B »:

| Country | 65+ | 66–75 | 75+ |
|---|---|---|---|
| **France** | **98.7 %** | 101.6 % | 95.1 % |
| Italy | 99.5 % | | |
| Spain | 98.5 % | | |
| United States | 94.5 % | | |
| Canada | 93.7 % | | |
| Sweden | 88.9 % | | |
| Germany (2022) | 88.1 % | | |
| Japan (2021) | 84.0 % | | |
| United Kingdom | 84.0 % | | |
| Netherlands | 81.3 % | | |
| Belgium | 78.3 % | | |

The COR synthèse xlsx (sheet « Niv_Vie_OCDE ») also has Korea (2022) 68.2 %, Denmark (2022) 79.8 %, Finland 86.9 %, Romania 87.4 % and Poland 88.2 %.

CheckNews also cites an OECD value of 99.8 % for France in 2019. I did not verify this in an OECD file.

---

## 6. Inconsistencies, series breaks and caveats

1. **ERFS breaks** (INSEE-ACT and INSEE-AGE footnotes):
   - 1996: start of the ERFS series, retropolated 1996–2004. The COR treats 1996 as a break with the older Revenus fiscaux surveys of 1970–1990.
   - 2010: financial income imputed from the Patrimoine 2010 survey.
   - 2012: recalculation plus Patrimoine 2014-2015.
   - 2020: fragile Covid year, then the renovated ERFS chain based on the new Enquête Emploi.
   - 2002/2003: changes in how BIT activity status is coded.
   - 2022/2023: « autres inactifs » not comparable.
   - The 2012 break matters most for retirees. Their median ratio jumps from 101.1 % to 103.3 % on the same year, because better imputation of financial income benefits retirees, who hold more financial assets. Any chart crossing 2012 should mark it.
2. **Retropolated vs chiffres-clés levels (whole population).** IP2117's break-free median differs from INSEE-ACT before 2020. Examples: 1996 21 000 vs 20 670; 2019 25 680 vs 25 340 (2024 €). From 2020 onwards they coincide.
3. **COR mean ratio vs Insee mean ratio.** For 2023, COR says 100.2 %. The ratio of Insee means is 99.4 % (30 030 / 30 210) **[calcul propre]**. Likely causes: the COR excludes invalidity-only pensioners from « retraités », and it uses the DREES retropolation. COR figures are also per month in current euros, Insee's per year in 2024 euros.
4. **Mean vs median.** COR's official indicator uses **means**. Insee chiffres-clés give both. The median ratio is lower than the mean ratio in 2023 (98.6 % vs 99.4 %) and about equal in 2024 (100.3 % vs 100.2 %). The COR's median ratio (Tableau 3.4, 99 %) is retirees ÷ ensemble in monthly € 2023.
5. **Revisions between COR vintages.**
   - COR25 had 2022 = 97.0 % and 1996 = 101.7 %. COR26 has 97.7 % and 102.3 %: the whole history was revised up by about 0.5–0.7 pt.
   - COR25 *projected* 95.9 % for 2023; COR26 *observes* 100.2 %.
   - The 2070 projection rises from 87.5 % (COR25) to 90.3 % (COR26), partly because demographic assumptions changed (fertility 1.8 → 1.45, net migration 70 000 → 150 000).
6. **Jump 2022 → 2023.** The ratio moves from 97.7 % to 100.2 % (COR) and from 97.1 % to 99.4 % (Insee means). The COR attributes 2023–2025 gains to pension revaluations that follow inflation with a lag. The possible role of the 2023 Enquête Emploi reclassification (footnote 6) is not documented for retirees. This is my hypothesis, not verified.
7. **COR text vs data.** The text says « un maximum à 104 % vers 2013-2014 »; the xlsx shows 104.7 (2013) and 103.9 (2014).
8. **Typo in RPM24 fiche 1.15.** The reading note says « le niveau de vie médian des actifs en emploi de 18 ans ou plus est de 29 870 euros », but 29 870 is in the « Moyenne » column. The median is 25 850 (2021 €).
9. **OECD vintages differ.** France is 94.3 % (2022; PaG 2025, IDD June 2025), 98.7 % (2023; IDD January 2026, via COR26) and 99.8 % (2019, per CheckNews, unverified). The OECD measure is the **mean**, **65+** (not retirees), **square-root scale**, relative to the **total population**. Insee's is the modified OECD scale, by activity status.
10. **FT France data is 2020**, the fragile ERFS year, and is taken from LIS microdata. The chart compares 65+ with the working-age population, not with workers, and the income concept is not fully documented.
11. **Deflator.** The Insee files state only « euros 2024 constants ». IP2117 refers to average annual consumer-price inflation (+2.0 % in 2024, +4.9 % in 2023, +5.2 % in 2022). The exact index (IPC ensemble des ménages, including or excluding tobacco) is not stated in the downloaded files.
12. **Coverage.** Insee/COR figures cover metropolitan France, ordinary housing only. Retirees in nursing homes (EHPAD) are excluded, which biases the 80+ group.
13. **DREES 2025 panorama** was unreachable (see §0). No DREES figure is used directly.

---

## 7. Data ready for a chart

### (i) One consistent annual series, 1996–2024 (INSEE-ACT medians, € 2024 constants)

**Rule [my choice]:** in break years, use the post-break value: 2010², 2012³ and 2020⁴⁵ (new ERFS chain). Mark visible breaks at 2010, 2012 and 2020. Ratios are **[calcul propre]**.

| Year | Ensemble | Retraités | En emploi | Retraités / Ens. (%) | En emploi / Ens. (%) | Retraités / En emploi (%) | Break flag |
|---|---|---|---|---|---|---|---|
| 1996 | 20 670 | 21 280 | 23 080 | 103.0 | 111.7 | 92.2 | series start |
| 1997 | 20 700 | 21 010 | 23 300 | 101.5 | 112.6 | 90.2 | |
| 1998 | 21 130 | 21 350 | 23 800 | 101.0 | 112.6 | 89.7 | |
| 1999 | 21 440 | 21 850 | 23 930 | 101.9 | 111.6 | 91.3 | |
| 2000 | 21 830 | 22 030 | 24 290 | 100.9 | 111.3 | 90.7 | |
| 2001 | 22 370 | 22 420 | 24 920 | 100.2 | 111.4 | 90.0 | |
| 2002 | 22 960 | 22 690 | 25 620 | 98.8 | 111.6 | 88.6 | |
| 2003 | 22 900 | 22 610 | 25 500 | 98.7 | 111.4 | 88.7 | BIT coding change |
| 2004 | 22 780 | 22 580 | 25 430 | 99.1 | 111.6 | 88.8 | |
| 2005 | 23 190 | 22 830 | 25 810 | 98.4 | 111.3 | 88.5 | |
| 2006 | 23 520 | 23 670 | 25 980 | 100.6 | 110.5 | 91.1 | |
| 2007 | 24 010 | 23 970 | 26 680 | 99.8 | 111.1 | 89.8 | |
| 2008 | 24 420 | 24 140 | 26 940 | 98.9 | 110.3 | 89.6 | |
| 2009 | 24 490 | 24 430 | 27 260 | 99.8 | 111.3 | 89.6 | |
| 2010 | 24 220 | 24 020 | 27 070 | 99.2 | 111.8 | 88.7 | break (Patrimoine 2010) |
| 2011 | 24 220 | 24 160 | 27 040 | 99.8 | 111.6 | 89.3 | |
| 2012 | 24 200 | 24 990 | 26 950 | 103.3 | 111.4 | 92.7 | break (Patrimoine 2014-15) |
| 2013 | 24 180 | 25 060 | 26 760 | 103.6 | 110.7 | 93.6 | |
| 2014 | 24 230 | 25 040 | 26 750 | 103.3 | 110.4 | 93.6 | |
| 2015 | 24 320 | 25 260 | 26 960 | 103.9 | 110.9 | 93.7 | |
| 2016 | 24 550 | 25 720 | 27 180 | 104.8 | 110.7 | 94.6 | |
| 2017 | 24 650 | 25 880 | 27 140 | 105.0 | 110.1 | 95.4 | |
| 2018 | 24 690 | 25 350 | 27 470 | 102.7 | 111.3 | 92.3 | |
| 2019 | 25 340 | 25 740 | 28 110 | 101.6 | 110.9 | 91.6 | |
| 2020 | 26 160 | 26 380 | 29 050 | 100.8 | 111.0 | 90.8 | break (new ERFS chain; fragile year) |
| 2021 | 26 070 | 26 080 | 29 110 | 100.0 | 111.7 | 89.6 | |
| 2022 | 26 030 | 25 610 | 29 230 | 98.4 | 112.3 | 87.6 | |
| 2023 | 26 280 | 25 920 | 29 320 | 98.6 | 111.6 | 88.4 | |
| 2024 | 26 740 | 26 830 | 29 860 | 100.3 | 111.7 | 89.9 | latest |

For monthly values, divide by 12. For example, the 2024 retiree median is about 2 236 €/month and the in-employment median about 2 488 €/month **[calcul propre]**.

**Recommended long-run companion series** (official, break-corrected, 1970–2070): the COR mean ratio of retirees ÷ population. Use §1d for 1970–2023 and §3 for 2024–2070, reference scenario. Show 1970–1990 as sparse survey points (1970, 1975, 1979, 1984, 1990), with a break before 1996.

### (ii) Median by age group (INSEE-AGE, € 2024 constants)

| Age | 1996 | 2024 | 2024 as % of ensemble | Real change 1996–2024 **[calcul propre]** |
|---|---|---|---|---|
| < 18 | 18 760 | 23 820 | 89.1 | +27.0 % |
| 18–29 | 19 350 | 25 860 | 96.7 | +33.6 % |
| 30–39 | 20 860 | 27 610 | 103.3 | +32.4 % |
| 40–49 | 22 290 | 27 280 | 102.0 | +22.4 % |
| 50–64 | 23 580 | 29 590 | 110.7 | +25.5 % |
| 65–74 | 21 620 | 27 340 | 102.2 | +26.5 % |
| 75+ | 20 420 | 26 480 | 99.0 | +29.7 % |
| Ensemble | 20 670 | 26 740 | 100 | +29.4 % |

The real change crosses the 2010, 2012 and 2020 breaks, so treat it as indicative. Intermediate years (2000, 2010, 2019) are in §2a.

### (iii) COR projections (June 2026, reference scenario; mean retirees ÷ mean population, %)

| 2023 (obs.) | 2025 | 2030 | 2040 | 2050 | 2060 | 2070 |
|---|---|---|---|---|---|---|
| 100.2 | 103.2 | 102.2 | 96.9 | 95.1 | 93.2 | 90.3 |

The range across variants in 2070 runs from 86.6 % (productivity 1.0 %) to 93.3 % (productivity 0.4 %).

### (iv) Income composition, 2023 (COR26 Fig. 3.8; shares **[calcul propre]**)

| | Retiree households | Active households |
|---|---|---|
| Pensions, % of gross income | 77.8 % | 4.2 % |
| Pensions, % of disposable income | 88.7 % | 5.0 % |
| Earnings, % of gross income (actifs incl. unemployment benefits) | 4.1 % | 84.1 % |
| Earnings, % of disposable income | 4.6 % | 99.6 % |
| Property income, % of gross income | 16.4 % | 7.6 % |
| Property income, % of disposable income | 18.6 % | 9.0 % |
| Other benefits, % of gross income | 1.7 % | 4.1 % |
| Disposable income, €/household/month | 2 978 | 4 263 |
| Niveau de vie, €/UC/month (mean) | 2 473 | 2 693 |
| Niveau de vie as % of population (mean) | 100.2 % | 109.1 % |

Cross-check by age (RPM24, 2021, per person): among people aged 65+, pensions are 76.4 % of gross income and property income 12.7 %. Among people aged 30–39, earnings are 84.7 % of gross income.
