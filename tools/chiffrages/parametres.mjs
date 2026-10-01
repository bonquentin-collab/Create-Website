const base = new URL("../../site/js/", import.meta.url).href;
const mods = {
  droit: ["params/droit-actuel.js","droitActuel"], igs: ["reforms/igs-jean-jaures.js","igsJeanJaures"], chiffrage: ["params/igs-chiffrage.js","chiffrage"],
  macro: ["params/macro.js","macro"], prel: ["params/prelevements.js",null], retraites: ["params/retraites.js","retraites"], gel: ["params/gel-pensions.js","gel"],
  ndv: ["params/niveau-de-vie.js","niveauDeVie"], ipp129: ["params/ipp-retraites.js","ipp129"], rendement: ["params/rendement.js","rendement"], sante: ["params/sante.js","sante"], sr: ["params/sante-reformes.js","santeReformes"],
};
const out = {};
for (const [k,[f,n]] of Object.entries(mods)) { const m = await import(base+f); out[k] = n ? m[n] : m; }
console.log(JSON.stringify(out, (k,v)=> v===Infinity ? "Infinity" : v, 1));
