// Mémoire commune aux trois espaces, pour la page Bilan : chaque mesure réglée dans un simulateur y enregistre ce
// qu'elle rapporte, à quoi sert l'argent, les ressources qu'elle mobilise et ses effets sur les niveaux de vie.
// Stockée dans le navigateur (localStorage) ; sans stockage, chaque page fonctionne seule et le Bilan reste vide.
//
//   enregistrerMesure("sante-csg", { espace, label, lien, reglages, net, usages, ressources, effet, details });
//   lireBilan() → { mesures: { id: mesure }, affectations: { ressource: idMesure }, retenues: { id: bool } }
//
// Une ressource (ex. « csg-pensions-normal », la hausse de CSG des pensions au taux normal) ne peut servir qu'une
// fois : si deux mesures retenues la mobilisent, `affectations` dit laquelle la garde (affectation unique).

const CLE = "bilan-mesures-v1";
const EVENEMENT = "bilan:maj";
const VIDE = () => ({ mesures: {}, affectations: {}, retenues: {}, touchees: {} });

export function lireBilan() {
  try {
    const e = JSON.parse(localStorage.getItem(CLE) ?? "null");
    if (e && typeof e === "object") return { ...VIDE(), ...e };
  } catch {
    // stockage indisponible ou illisible
  }
  return VIDE();
}

function ecrire(etat) {
  try {
    localStorage.setItem(CLE, JSON.stringify(etat));
  } catch {
    // sans stockage, le Bilan ne voit pas cette mesure
  }
  document.dispatchEvent(new CustomEvent(EVENEMENT));
}

/** Enregistre (ou remplace) une mesure, avec la date de mise à jour. */
export function enregistrerMesure(id, mesure) {
  const etat = lireBilan();
  etat.mesures[id] = { id, ...mesure, premiereFois: etat.mesures[id]?.premiereFois ?? Date.now(), majLe: Date.now() };
  ecrire(etat);
}

/** Note que l'utilisateur a réglé cette mesure : le Bilan la retient alors par défaut. */
export function marquerTouchee(id) {
  const etat = lireBilan();
  if (etat.touchees[id]) return;
  etat.touchees[id] = true;
  ecrire(etat);
}

/** Retenir ou écarter une mesure dans le Bilan. */
export function retenir(id, oui) {
  const etat = lireBilan();
  etat.retenues[id] = oui;
  ecrire(etat);
}

/** Donne une ressource à une mesure (affectation unique). */
export function affecter(ressource, idMesure) {
  const etat = lireBilan();
  etat.affectations[ressource] = idMesure;
  etat.retenues[idMesure] = true;
  ecrire(etat);
}

export function effacerBilan() {
  ecrire(VIDE());
}

export function surMajBilan(rappel) {
  document.addEventListener(EVENEMENT, rappel);
  // Une autre page ouverte en parallèle a modifié le Bilan.
  window.addEventListener("storage", (e) => e.key === CLE && rappel());
}

export { estRetenue, detenteur } from "../engine/bilan.js";

// ----- Réglages des formulaires -----
// Les simulateurs gardent leurs réglages d'une visite à l'autre, pour que le Bilan et la page restent d'accord.

const CLE_FORM = "reglages-v1";

function lireReglages() {
  try {
    return JSON.parse(localStorage.getItem(CLE_FORM) ?? "{}") ?? {};
  } catch {
    return {};
  }
}

/**
 * Restaure les valeurs mémorisées des champs nommés de `form`, puis les enregistre à chaque saisie et signale la
 * mesure `idMesure` comme réglée. À appeler après la construction du formulaire, avant le premier rendu.
 */
export function memoriserFormulaire(form, cle, idMesure = cle) {
  const memo = lireReglages()[cle];
  if (memo) {
    for (const champ of form.elements) {
      if (!champ.name || !(champ.name in memo)) continue;
      const v = memo[champ.name];
      if (champ.type === "checkbox") champ.checked = Array.isArray(v) ? v.includes(champ.value) : v === true;
      else if (champ.type === "radio") champ.checked = champ.value === v;
      else champ.value = v;
    }
  }
  const enregistrer = (e) => {
    if (!e.target?.name) return;
    const valeurs = {};
    for (const champ of form.elements) {
      if (!champ.name) continue;
      if (champ.type === "checkbox") {
        const memes = [...form.elements].filter((c) => c.name === champ.name && c.type === "checkbox");
        valeurs[champ.name] = memes.length > 1 ? memes.filter((c) => c.checked).map((c) => c.value) : champ.checked;
      } else if (champ.type === "radio") {
        if (champ.checked) valeurs[champ.name] = champ.value;
      } else valeurs[champ.name] = champ.value;
    }
    try {
      const tout = lireReglages();
      tout[cle] = valeurs;
      localStorage.setItem(CLE_FORM, JSON.stringify(tout));
    } catch {
      // sans stockage, les réglages valent pour la visite
    }
    marquerTouchee(idMesure);
  };
  form.addEventListener("input", enregistrer);
  form.addEventListener("change", enregistrer);
}

/** Usages d'une enveloppe répartie par le répartiteur ({ actifs, idService… } en Md€) ; le non-réparti reste au
 *  budget de l'État (« autres »). */
export function usagesRepartition(repartition, enveloppe) {
  const actifs = repartition.actifs ?? 0;
  const services = Object.entries(repartition).reduce((t, [k, v]) => t + (k === "actifs" ? 0 : v), 0);
  return { actifs, services, autres: Math.max(0, enveloppe - actifs - services) };
}
