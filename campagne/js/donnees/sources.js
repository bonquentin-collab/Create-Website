// Données du site « L'héritage, ça se décide ». Chaque valeur porte sa source ; vérifiées en octobre 2026.
// Les lectures de graphiques sont signalées (précision ± 1 point ou ± 5 %).

const annees = Array.from({ length: 16 }, (_, i) => 2025 + i);

// Flux successoral annuel (donations + successions), Md€ courants. Fondation Jean-Jaurès (2024), tableau 1,
// d'après le CAE (15 % du PIB en 2021, 23 % en 2050).
export const flux = {
  annees,
  valeurs: [464, 476, 489, 502, 516, 529, 543, 557, 571, 585, 600, 615, 630, 645, 661, 677],
  total: 9059,
  source: "Fondation Jean-Jaurès, « Face à la grande transmission, l'impôt sur les grandes successions », novembre 2024, tableau 1",
  url: "https://www.jean-jaures.org/publication/face-a-la-grande-transmission-limpot-sur-les-grandes-successions/",
};

// Droits de mutation à titre gratuit (successions + donations), Md€. DGFiP ; Voies et moyens, PLF 2026.
export const droitsPercus = { 2024: 20.9, 2025: 20.7, source: "Évaluation des voies et moyens, PLF 2026, tome I" };

// Faits démographiques et patrimoniaux.
export const faits = {
  deces: { 2014: 559_293, 2022: 673_637, source: "Cour des comptes, Les droits de succession, septembre 2024" },
  declarations2022: { total: 354_443, payantes: 165_595, source: "Cour des comptes, 2024, tableau 7 (données DGFiP)" },
  ageHeritage: { aujourdhui: 50, en2035: 55, source: "Cour des comptes, 2024, d'après France Stratégie ; CAE, note n° 69" },
  patrimoineRevenu: { 1970: 3, 2020: 6, source: "CAE, note n° 69, 2021 : patrimoine = 300 % du revenu national en 1970, 600 % en 2020" },
  // Indice des prix des logements anciens, France métropolitaine, CVS, base 100 en 2015 (Insee, idbank 010567059) :
  // 47,8 au 1er trimestre 2000, 127,3 au 4e trimestre 2025. Prix à la consommation (IPCH, Eurostat) : 78,23 en 2000, 124,43 en 2025.
  logement: { 2000: 47.8, 2025: 127.3, source: "Insee, indice des prix des logements anciens (série 010567059)", url: "https://www.insee.fr/fr/statistiques/serie/010567059" },
  prix: { 2000: 78.23, 2025: 124.43, source: "Eurostat, indice des prix à la consommation harmonisé, France" },
  partHeritee: { 1970: 0.35, 2020: 0.6, source: "CAE, note n° 69, 2021" },
};

// Flux successoral en % du revenu national, France. Piketty, Le Capital au XXIe siècle, annexe technique,
// tableau S11.1 (série Bt/Yt, d'après Piketty 2011, QJE, tableau A4) ; projection : scénario central.
export const piketty = {
  observe: [[1820, 20.3], [1830, 20.8], [1840, 21.1], [1850, 20.0], [1860, 20.2], [1870, 22.3], [1880, 24.4], [1890, 23.9],
    [1900, 24.1], [1910, 22.7], [1920, 9.8], [1930, 11.0], [1940, 9.8], [1950, 4.4], [1960, 5.9], [1970, 6.2], [1980, 6.4],
    [1990, 7.7], [2000, 11.4], [2010, 14.5]],
  projection: [[2010, 14.5], [2020, 14.1], [2030, 14.6], [2040, 15.7], [2050, 16.0]],
  source: "Thomas Piketty, Le Capital au XXIe siècle (2013), annexe technique, tableau S11.1",
  url: "http://piketty.pse.ens.fr/fr/capital21c",
};

// Part du patrimoine net des ménages, 1er trimestre 2026 (%). BCE et Banque de France, comptes distributionnels de
// patrimoine (série DWA, France). D1 à D5 ne sont publiés qu'ensemble.
export const patrimoine = {
  groupes: [
    { id: "b50", label: "La moitié la moins dotée", court: "50 % du bas", part: 4.96 },
    { id: "d6", label: "6e dixième", court: "6e", part: 5.03 },
    { id: "d7", label: "7e dixième", court: "7e", part: 7.5 },
    { id: "d8", label: "8e dixième", court: "8e", part: 10.85 },
    { id: "d9", label: "9e dixième", court: "9e", part: 17.03 },
    { id: "d10", label: "Les 10 % les plus riches", court: "10 % du haut", part: 54.64 },
  ],
  top5: 40.84,
  total: 13_959,
  periode: "1er trimestre 2026",
  source: "BCE et Banque de France, comptes distributionnels de patrimoine des ménages (DWA)",
  url: "https://data.ecb.europa.eu/data/datasets/DWA",
};

// Héritages reçus sur toute la vie, par tranche d'héritiers d'une même génération (CAE, 2021).
// a : montant net moyen reçu (€, lecture des graphiques 32 et 33 du Focus n° 77, ± 5 %) ;
// tauxEco / tauxDeclare : droits payés / héritage économique total, puis / héritage déclaré au fisc
// (note n° 69, graphique 2, lecture ± 1 point).
export const heritiers = {
  tranches: [
    { id: "P0-10", p: 0.1, a: 0, tauxEco: 0, tauxDeclare: 0 },
    { id: "P10-20", p: 0.1, a: 15_000, tauxEco: 0, tauxDeclare: 0 },
    { id: "P20-30", p: 0.1, a: 45_000, tauxEco: 0, tauxDeclare: 0 },
    { id: "P30-40", p: 0.1, a: 65_000, tauxEco: 0, tauxDeclare: 0 },
    { id: "P40-50", p: 0.1, a: 65_000, tauxEco: 0, tauxDeclare: 0 },
    { id: "P50-60", p: 0.1, a: 70_000, tauxEco: 0, tauxDeclare: 0 },
    { id: "P60-70", p: 0.1, a: 80_000, tauxEco: 0.01, tauxDeclare: 0.016 },
    { id: "P70-80", p: 0.1, a: 165_000, tauxEco: 0.012, tauxDeclare: 0.026 },
    { id: "P80-90", p: 0.1, a: 290_000, tauxEco: 0.021, tauxDeclare: 0.047 },
    { id: "P90-95", p: 0.05, a: 480_000, tauxEco: 0.04, tauxDeclare: 0.098 },
    { id: "P95-99", p: 0.04, a: 1_050_000, tauxEco: 0.064, tauxDeclare: 0.164 },
    { id: "P99-99,5", p: 0.005, a: 2_500_000, tauxEco: 0.07, tauxDeclare: 0.198 },
    { id: "P99,5-99,9", p: 0.004, a: 4_000_000, tauxEco: 0.083, tauxDeclare: 0.223 },
    { id: "P99,9-100", p: 0.001, a: 12_900_000, tauxEco: 0.099, tauxDeclare: 0.31 },
  ],
  // Part déclarée au fisc quand aucun droit n'est payé (le CAE estime que 35 à 40 % du flux échappe aux sources fiscales).
  partDeclareeSansDroits: 0.6,
  // Recettes des droits dans le système actuel, à l'époque des données du CAE (Md€).
  recettesActuelles: 15,
  faits: { mediane: 70_000, top1: 4_200_000, top01: 13_000_000 },
  source: "Conseil d'analyse économique, « Repenser l'héritage », note n° 69 et Focus n° 77, décembre 2021",
  url: "https://www.cae-eco.fr/repenser-lheritage",
};

// Composition des héritages exonérés (part de l'héritage économique), profils par tranche (hypothèses du site),
// mis à l'échelle pour reproduire le coût de chaque niche estimé par le CAE (note n° 69, graphique 3).
export const niches = {
  profils: {
    assuranceVie: [0.1, 0.1, 0.1, 0.1, 0.1, 0.15, 0.15, 0.15, 0.15, 0.18, 0.18, 0.12, 0.12, 0.06],
    dutreil: [0, 0, 0, 0, 0, 0, 0.005, 0.005, 0.005, 0.01, 0.02, 0.04, 0.1, 0.3],
    demembrement: [0, 0, 0, 0, 0, 0, 0, 0, 0.02, 0.05, 0.05, 0.08, 0.08, 0.08],
  },
  // Coût d'intégration au barème actuel (Md€, CAE 2021) : cibles du calage.
  cibles: { assuranceVie: 5, demembrement: 2.8, dutreilResserre: 1.4 },
  fiches: [
    { id: "dutreil", nom: "Pacte Dutreil", article: "CGI, art. 787 B et 787 C",
      principe: "75 % de la valeur des parts d'une entreprise transmise sont exonérés, sans plafond.",
      cout: "4,85 Md€", periode: "en 2024", detail: "Jusqu'à 5,7 Md€ en comptant les dossiers non repérés ; Bercy affichait 500 M€.",
      source: "Institut des politiques publiques, rapport n° 62, novembre 2025", url: "https://www.ipp.eu/" },
    { id: "assuranceVie", nom: "Assurance-vie", article: "CGI, art. 990 I et 757 B",
      principe: "Hors succession : 152 500 € exonérés par bénéficiaire, puis 20 % et 31,25 %, loin du barème.",
      cout: "4 à 5 Md€", periode: "par an", detail: "44 Md€ transmis par assurance-vie en 2019.",
      source: "CAE, note n° 69, 2021", url: "https://www.cae-eco.fr/repenser-lheritage" },
    { id: "demembrement", nom: "Démembrement", article: "CGI, art. 669 et 1133",
      principe: "On donne la nue-propriété, taxée à prix réduit ; l'usufruit revient sans impôt au décès.",
      cout: "2 à 3 Md€", periode: "par an", detail: "Une donation à 65 ans n'est taxée que sur 60 % de la valeur.",
      source: "CAE, note n° 69, 2021", url: "https://www.cae-eco.fr/repenser-lheritage" },
    { id: "abattement", nom: "Abattement de 100 000 €", article: "CGI, art. 779",
      principe: "Par enfant et par parent, renouvelable tous les 15 ans par donation.",
      cout: "100 000 €", periode: "exonérés par enfant et par parent", detail: "C'est ce qui exonère la plupart des héritages modestes.",
      source: "Code général des impôts", url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000025062418" },
    { id: "pvl", nom: "Plus-values effacées", article: "CGI, art. 150-0 A",
      principe: "Au décès, les plus-values accumulées disparaissent : l'héritier repart de la valeur du jour.",
      cout: "6,6 Md€", periode: "en 2025, pour le 1 % le plus riche", detail: "Elles ne sont jamais imposées.",
      source: "Fondation Jean-Jaurès, 2024, tableau 8", url: "https://www.jean-jaures.org/publication/face-a-la-grande-transmission-limpot-sur-les-grandes-successions/" },
  ],
};

// Plus-values latentes transmises par le 1 % le plus riche, imposées au PFU (pilier 2 de l'IGS), Md€ courants.
// Fondation Jean-Jaurès (2024), tableau 8. « Pour tous » : hypothèse du site, le top 1 % détenant la moitié des
// plus-values latentes transmises (hors résidence principale, exonérée).
export const plusValues = {
  top1: [6.62, 6.95, 7.3, 7.67, 8.05, 8.45, 8.87, 9.36, 9.86, 10.39, 10.95, 11.54, 12.16, 12.86, 13.54, 14.26],
  partTop1: 0.5,
};

// Barèmes. Droit actuel en ligne directe (CGI art. 777), abattement 100 000 € (art. 779).
// IGS : Fondation Jean-Jaurès 2024, tableau 6 (d'après le CAE, 2021), sur ce qui est reçu dans toute la vie.
export const baremes = {
  actuel: [
    { jusqua: 8_072, taux: 0.05 }, { jusqua: 12_109, taux: 0.1 }, { jusqua: 15_932, taux: 0.15 },
    { jusqua: 552_324, taux: 0.2 }, { jusqua: 902_838, taux: 0.3 }, { jusqua: 1_805_677, taux: 0.4 },
    { jusqua: Infinity, taux: 0.45 },
  ],
  igs: [
    { jusqua: 200_000, taux: 0 }, { jusqua: 800_000, taux: 0.05 }, { jusqua: 1_200_000, taux: 0.15 },
    { jusqua: 2_000_000, taux: 0.25 }, { jusqua: 4_000_000, taux: 0.35 }, { jusqua: 6_000_000, taux: 0.45 },
    { jusqua: Infinity, taux: 0.5 },
  ],
};

// Usages possibles des recettes : budget de référence (Md€).
export const usages = [
  { id: "ecologie", nom: "Transition écologique", note: "Mission « Écologie, développement et mobilité durables »", budget: 20.5,
    unite: "du budget de l'écologie", source: "PLF 2025, crédits de paiement" },
  { id: "recherche", nom: "Recherche", note: "Mission « Recherche et enseignement supérieur »", budget: 31.29,
    unite: "du budget de la recherche et de l'université", source: "PLF 2025, crédits de paiement" },
  { id: "education", nom: "Éducation", note: "Mission « Enseignement scolaire »", budget: 88.82,
    unite: "du budget de l'école", source: "PLF 2025, crédits de paiement" },
  { id: "defense", nom: "Défense", note: "Mission « Défense »", budget: 50.5,
    unite: "du budget des armées", source: "Loi de programmation militaire 2024-2030, marche 2025" },
  { id: "csg", nom: "Baisse de la CSG", note: "Sur les salaires et revenus d'activité", pointCsg: 12.03,
    source: "CCSS, mai 2026 : 110,7 Md€ pour 9,2 points" },
];

export const citations = {
  cae: { texte: "Pour parvenir tout en haut de la distribution des niveaux de vie, il devient quasiment impératif d'avoir la chance d'hériter.",
    source: "Conseil d'analyse économique, note n° 69, 2021", url: "https://www.cae-eco.fr/repenser-lheritage" },
  mirabeau: { texte: "Mirabeau soutient que la propriété n'est légitime que du vivant de celui qui l'a acquise, mais qu'à sa mort, sa propriété sans titulaire s'interrompt, ce qui rend pleinement légitime le droit de l'État à déterminer la façon dont elle peut être transmise.",
    source: "Pierre Crétois, « Les inégalités, de père en fils », La Vie des idées, janvier 2026, à propos de Mélanie Plouviez, L'injustice en héritage (La Découverte, 2025)",
    url: "https://laviedesidees.fr/Les-inegalites-de-pere-en-fils" },
};
