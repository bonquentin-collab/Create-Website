// Santé › Simuler : mieux répartir l'effort de financement de la santé entre âges. Données vérifiées en septembre 2026.
// Les valeurs marquées `estimation` sont des calculs ou des hypothèses du site.

export const santeReformes = {
  // Déficit de la branche maladie du régime général, prévision 2026.
  deficitMaladie: {
    valeur: -13.8,
    source: "Commission des comptes de la sécurité sociale, rapport de mai 2026",
    url: "https://www.securite-sociale.fr/files/live/sites/SSFR/files/medias/CCSS/2026/CCSS%20mai%202026_assembl%C3%A9_V2.pdf",
  },

  // Cotisation maladie des retraités : 1 % sur les pensions complémentaires (Agirc-Arrco, Ircantec) pour les retraités
  // au taux médian ou normal de CSG. Jusqu'en 1998, les pensions de base en supportaient une aussi, remplacée par la CSG.
  cotisationMaladie: {
    complementaires: 0.01,
    source: "Question écrite n° 161 à l'Assemblée nationale, 8 octobre 2024 ; service-public.gouv.fr (prélèvements sur les pensions)",
    url: "https://questions.assemblee-nationale.fr/q17/17-161QE.htm",
    // Part des retraités au taux médian ou normal (Cnav, fin 2024), voir params/prelevements.js.
  },

  // Part de la pension brute dans le revenu des retraités, par niveau de vie, touchée par chaque levier (estimation du
  // site à partir des seuils de CSG 2025 : le taux normal commence vers 2 400 € de pension brute pour une personne
  // seule, le taux médian vers 1 550 €). Ordre des niveaux : très modestes → très aisés (Drees, ER 1345).
  exposition: {
    tauxNormal: [0, 0, 0.5, 1, 1],
    tauxMedianOuNormal: [0, 0.6, 1, 1, 1],
    estimation: true,
  },

  // Taux d'effort en primes de complémentaire et restes à charge (en % du revenu disponible après financement de
  // l'assurance maladie obligatoire), par dixième de ménages classés selon ce taux d'effort, 2019 ; composition des
  // groupes (situation de la personne la plus âgée, niveau de vie modeste = moins de 90 % du médian).
  effortPrive: {
    source: "Drees, Études et Résultats n° 1345, juillet 2025, encadré 3 et tableaux complémentaires A et G (Ines-Omar 2019)",
    url: "https://drees.solidarites-sante.gouv.fr/publications-communique-de-presse/250828_ER_depenses-de-sante",
    annee: 2019,
    // [label, part des ménages dans le groupe (cumulée dans les tops), taux d'effort moyen en %, retraités modestes %,
    //  retraités médians à aisés %]
    dixiemes: [
      ["D1", 0.28, 9.02, 4.21],
      ["D2", 1.21, 5.57, 4.37],
      ["D3", 1.85, 3.15, 7.63],
      ["D4", 2.46, 2.49, 12.68],
      ["D5", 3.07, 3.39, 20.18],
      ["D6", 3.75, 5.41, 27.75],
      ["D7", 4.58, 9.84, 36.95],
      ["D8", 5.68, 21.99, 42.03],
      ["D9", 7.33, 36.04, 38.1],
      ["D10", 12.68, 53.65, 26.84],
    ],
    tops: [
      ["Top 5 %", 0.05, 15.82, 56.21, 23.99],
      ["Top 2 %", 0.02, 21.2, 59.2, 18.28],
      ["Top 1 %", 0.01, 26.87, 58.76, 14.43],
    ],
    moyenne: 4.29,
    // Primes et restes à charge moyens par ménage, 2019, en euros (tableau A, ensemble) : 1 021 + 387.
    depenseMoyenneMenage: 1408,
  },

  // 63,4 millions de personnes dans le champ (Insee, ERFS 2019), 2,2 personnes par ménage : environ 28,8 millions de
  // ménages.
  menages: { valeur: 28.8e6, source: "Insee Première n° 1875, 2021 (champ de 63,4 millions de personnes)", url: "https://www.insee.fr/fr/statistiques/5431993", estimation: true },

  // Passage de 2019 à 2024 : dépenses de soins payées par les complémentaires et les ménages, 44,3 Md€ en 2019,
  // 52,5 Md€ en 2024 (Drees, comptes de la santé).
  evolution2019_2024: (32.52 + 19.96) / (26.74 + 17.52),

  // ----- Gros consommateurs de soins -----

  // Franchises médicales (1 € par boîte et par acte paramédical, 4 € par transport) et participations forfaitaires
  // (2 € par consultation ou acte), plafonnées chacune à 70 € par an depuis le 1er octobre 2026 (50 € avant).
  // Exonérés : moins de 18 ans, bénéficiaires de la C2S, femmes enceintes à partir du 6e mois.
  franchises: {
    plafondActuel: 140,
    plafondAvant: 100,
    source: "Décret n° 2026-858 du 11 septembre 2026 (service-public.gouv.fr, 16 septembre 2026)",
    url: "https://www.service-public.gouv.fr/particuliers/actualites/A17166",
    // Modèle du site : montant de franchises « dû » avant plafond, par personne, de loi log-normale de dispersion
    // `sigma` ; sa moyenne par âge est calée sur les franchises observées en 2023 (Drees, voir params/sante.js), alors
    // plafonnées à 100 € au total, avec des montants unitaires deux fois plus faibles (doublés en 2024).
    sigma: 1.4,
    multiplicateur2023: 2,
    plafond2023: 100,
    estimation: true,
    // Points de contrôle officiels, que le modèle retrouve à 5 % près :
    controles: [
      { libelle: "Doubler montants et plafonds (100 € + 100 €), par rapport aux règles de 2025", valeur: 2.3, source: "CCSS, mai 2026, fiche 2.2 (mesure du PLFSS 2026 abandonnée)" },
      { libelle: "Doubler les seuls plafonds (100 € + 100 €), par rapport aux règles de 2025", valeur: 0.75, source: "Annonce du gouvernement, juillet 2026 (Public Sénat, Caducée)" },
    ],
  },

  // Ticket modérateur des consultations de médecins et sages-femmes : 30 % du tarif. Le relever à 40 % transférait
  // 1,1 Md€ aux complémentaires (PLFSS 2025, mesure abandonnée). Les patients en ALD, en invalidité, les femmes
  // enceintes et les bénéficiaires de la C2S restent exonérés.
  ticketModerateur: {
    tauxActuel: 0.3,
    rendementParPoint: 0.11,
    source: "PLFSS 2025, mesure de transfert du ticket modérateur des consultations (1,1 Md€ pour 10 points), citée par Previssima et Public Sénat",
    url: "https://www.publicsenat.fr/actualites/sante/consultations-medicales-la-ministre-de-la-sante-tempere-sur-la-hausse-du-ticket-moderateur",
    // Déjà décidé pour 2027 : 4 décrets du 21 août 2026 (n° 2026-809 à 812) relèvent le ticket modérateur des soins
    // dentaires, dispositifs médicaux, médicaments à service médical rendu modéré et transports, environ 1,5 Md€
    // transférés aux complémentaires (ALD et C2S épargnées).
    decrets2027: { valeur: 1.5, source: "JORF du 22 août 2026, décrets n° 2026-809 à 2026-812 ; montant : presse spécialisée (SPAC Actuaires, Caducée)", url: "https://www.legifrance.gouv.fr/jorf/jo/2026/08/22/0195" },
  },

  // Affections de longue durée : mesures du PLFSS 2026 abandonnées au Parlement (rendement annuel, Md€).
  ald: {
    source: "CCSS, mai 2026, fiche 2.2 (mesures d'économies abandonnées en LFSS 2026)",
    url: "https://www.securite-sociale.fr/files/live/sites/SSFR/files/medias/CCSS/2026/CCSS%20mai%202026_assembl%C3%A9_V2.pdf",
    mesures: [
      { id: "cures", libelle: "Cures thermales des patients en ALD remboursées comme pour tous", valeur: 0.2 },
      { id: "non-exonerantes", libelle: "Suppression des ALD « non exonérantes »", valeur: 0.1 },
    ],
  },

  // Dépassements d'honoraires : 4,5 Md€ en 2024, dont 37 à 40 % remboursés par les complémentaires ; 5 % de la
  // population sans complémentaire. La mission recommande de les plafonner.
  depassements: {
    total: 4.5,
    partComplementaires: 0.385,
    source: "Rapport de la mission Rousset-Monnet sur les dépassements d'honoraires, octobre 2025",
    url: "https://www.apmnews.com/documents/202510231649030.rapport_consolide_depassements_dhonoraires_VF_compressed.pdf",
  },

  // ----- Complémentaires santé -----

  // Taxe de solidarité additionnelle (TSA) : 13,27 % des primes des contrats responsables (20,27 % sinon), 6,56 Md€ en
  // 2025. Valeur d'un point : 6,56 / 13,27 ≈ 0,49 Md€ (estimation du site, un peu forte car une partie des contrats
  // est taxée à 20,27 %).
  tsa: {
    taux: 0.1327,
    recettes2025: 6.558,
    source: "Code de la sécurité sociale, art. L862-4 ; recettes : CCSS, mai 2026 (impôts et taxes affectés)",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000042698839",
    // Contribution exceptionnelle de 2,05 % des complémentaires en 2026 (1,0 Md€), déjà votée (LFSS 2026).
    exceptionnelle2026: 1.0,
  },

  // Protection sociale complémentaire d'entreprise (santé et prévoyance) : contributions des employeurs exemptées de
  // cotisations, soumises à un forfait social de 8 % (entreprises d'au moins 11 salariés). Prévision 2026 : 24,3 Md€
  // exemptés, soit 7,2 Md€ de cotisations brutes et 5,6 Md€ nettes (après forfait social et CSG).
  entreprise: {
    assiette: 24.3,
    coutNet: 5.6,
    forfaitSocial: 0.08,
    source: "PLFSS 2026, annexe 4, tableau 9 (coût des exemptions d'assiette)",
    url: "https://www.assemblee-nationale.fr/dyn/contenu/visualisation/1088679/file/PLFSS2026-Annexe4-20251014-183718-59-11_avec%20couverture-2.pdf",
  },

  // Part des primes de complémentaire dans la population (pour répartir une hausse des primes par âge) : prime
  // individuelle mensuelle de 36 € à 20 ans, 142 € à 85 ans (voir params/sante.js), interpolée.
  sansComplementaire: 0.05,
};
