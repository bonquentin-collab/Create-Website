// Modèle de chiffrage de l'IGS, repris du classeur de l'étude (onglets Flux successoral, Pilier 1, Pilier 2).
// Fonction pure : scénario (valeurs connues) + hypothèses → séries annuelles en Md€.

/**
 * @param {object} scenario  params/igs-chiffrage.js › scenarios.x (pib, dmtg, patrimoine)
 * @param {object} h         { croissancePib, fluxCible, rendementTop1, partPV, pfu }
 * @param {object} c         params/igs-chiffrage.js › chiffrage
 */
export function chiffrerIgs(scenario, h, c) {
  const { flux, pilier1: p1, pilier2: p2 } = c;
  const derniere = Math.max(...Object.keys(scenario.pib).map(Number));
  const pib = (a) => (a <= derniere ? scenario.pib[a] : scenario.pib[derniere] * (1 + h.croissancePib) ** (a - derniere));
  const partFlux = (a) => flux.part0 + ((h.fluxCible - flux.part0) * (a - flux.annee0)) / (flux.anneeCible - flux.annee0);
  const fluxDe = (a) => partFlux(a) * pib(a);
  const derniereDmtg = Math.max(...Object.keys(scenario.dmtg).map(Number));
  const dmtg = (a) => (a <= derniereDmtg ? scenario.dmtg[a] : (scenario.dmtg[derniereDmtg] * fluxDe(a)) / fluxDe(derniereDmtg));
  const patrimoineTop1 = (a) => p2.partTop1.valeur * scenario.patrimoine[p2.anneeReference] * (1 + h.rendementTop1) ** (a - p2.anneeReference);

  const annees = [];
  const serie = { pib: [], flux: [], dmtg: [], pilier1: [], pilier2: [], assiettePV: [] };
  for (let a = c.annees.debut, i = 0; a <= c.annees.fin; a++, i++) {
    annees.push(a);
    serie.pib.push(pib(a));
    serie.flux.push(fluxDe(a));
    serie.dmtg.push(dmtg(a));
    serie.pilier1.push((p1.recettes2021 * fluxDe(a)) / fluxDe(flux.annee0));
    const assiette = patrimoineTop1(a) * p2.mortalite[i] * h.partPV;
    serie.assiettePV.push(assiette);
    serie.pilier2.push(assiette * h.pfu * p2.abattement * (1 - p2.dmtgDeduits));
  }
  const somme = (t) => t.reduce((s, v) => s + v, 0);
  const cumul = somme(serie.pilier1) + somme(serie.pilier2);
  const fin = annees.length - 1;
  const dernierPatrimoine = Math.max(...Object.keys(scenario.patrimoine).map(Number));
  const patrimoineGeneral = scenario.patrimoine[dernierPatrimoine] * (1 + p2.croissanceGenerale) ** (c.annees.fin - dernierPatrimoine);
  return {
    annees,
    ...serie,
    cumul,
    moyenne: cumul / annees.length,
    cumulFlux: somme(serie.flux),
    premiereAnnee: serie.pilier1[0] + serie.pilier2[0],
    tauxEffectifActuel: serie.dmtg[0] / serie.flux[0],
    tauxEffectifApres: (serie.dmtg[0] + serie.pilier1[0] + serie.pilier2[0]) / serie.flux[0],
    partTop1Fin: patrimoineTop1(c.annees.fin) / patrimoineGeneral,
    derniereAnnee: annees[fin],
  };
}
