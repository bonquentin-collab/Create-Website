// Avis « déjà utilisé ailleurs » : quand une même recette (ex. l'alignement de la CSG des pensions au taux normal)
// est mobilisée par deux mesures retenues, une seule la garde (affectation unique). Affiche qui la détient et
// propose de la réaffecter. Se met à jour quand le Bilan change, y compris depuis une autre page.

import { h, remplir } from "./dom.js";
import { lireBilan, detenteur, affecter, surMajBilan } from "./etat-bilan.js";

function bouton(texte, action) {
  const b = h("button", { type: "button", class: "lien-bouton" }, texte);
  b.addEventListener("click", action);
  return b;
}

/**
 * @param {HTMLElement} zone
 * @param {{ ressource:string, moi:string, quoi:string, ailleurs:Object<string,{texte:string, lien:string}>,
 *           surChange?:()=>void, actif?:()=>boolean }} options
 * `actif` : la page mobilise-t-elle la recette en ce moment (levier coché) ?
 * `ailleurs` : pour chaque mesure concurrente, ce qu'elle fait de la recette et le lien vers sa page.
 * Renvoie `tient()` : vrai si la mesure `moi` garde la recette (ou si personne ne la lui dispute).
 */
export function avisRessource(zone, { ressource, moi, quoi, ailleurs, surChange, actif = () => true }) {
  const etatRessource = () => {
    const etat = lireBilan();
    const { detenteur: d, candidates } = detenteur(etat, ressource);
    const autres = candidates.filter((c) => c !== moi && ailleurs[c]);
    // La page mobilise la recette dès que le levier est actif, même avant d'être retenue dans le Bilan :
    // la mesure déjà retenue ailleurs la garde alors.
    return { d: candidates.includes(moi) ? d : autres[0], autres, enConcurrence: actif() && autres.length > 0 };
  };

  const rendu = () => {
    const { d, autres, enConcurrence } = etatRessource();
    if (!enConcurrence) {
      remplir(zone);
      zone.hidden = true;
      return;
    }
    zone.hidden = false;
    const autre = autres[0];
    const garde = d === moi;
    remplir(
      zone,
      h(
        "p",
        {},
        garde
          ? `${quoi} est aussi réglé ailleurs : ${ailleurs[autre].texte}. Une recette ne sert qu'une fois : elle est comptée ici, et plus là-bas.`
          : `${quoi} sert déjà ailleurs : ${ailleurs[autre].texte}. Une recette ne sert qu'une fois : elle n'est pas comptée ici.`,
      ),
      h(
        "p",
        {},
        bouton(garde ? "La laisser à l'autre mesure" : "L'affecter ici", () => affecter(ressource, garde ? autre : moi)),
        " ",
        h("a", { href: ailleurs[autre].lien }, "Voir l'autre mesure"),
        " · ",
        h("a", { href: "bilan.html" }, "Bilan"),
      ),
    );
  };

  // Ne relancer la page que si le détenteur change : chaque rendu de page réenregistre sa mesure, ce qui
  // déclenche lui-même une mise à jour du Bilan.
  let signature = "";
  const signer = () => {
    const { d, autres, enConcurrence } = etatRessource();
    return `${d}|${autres.join(",")}|${enConcurrence}`;
  };
  surMajBilan(() => {
    const nouvelle = signer();
    if (nouvelle === signature) return;
    signature = nouvelle;
    rendu();
    surChange?.();
  });
  signature = signer();
  rendu();
  return {
    tient: () => {
      const { d, enConcurrence } = etatRessource();
      return !enConcurrence || d === moi;
    },
    maj: () => {
      signature = signer();
      rendu();
    },
  };
}
