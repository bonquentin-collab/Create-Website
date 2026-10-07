// Page Bilan : toutes les mesures réglées dans les trois espaces, retenues ou non, l'usage de chaque euro (affectation
// unique), les effets croisés entre mesures expliqués, et l'effet cumulé sur les niveaux de vie.

import { h, remplir } from "./dom.js";
import { euros, milliards, pourcent } from "../engine/format.js";
import { calculerBilan, USAGES } from "../engine/bilan.js";
import { lireBilan, retenir, affecter, effacerBilan, surMajBilan, estRetenue } from "./etat-bilan.js";
import { csg } from "../params/prelevements.js";
import { macro } from "../params/macro.js";
import { niveauDeVie } from "../params/niveau-de-vie.js";
import { santeReformes as sr } from "../params/sante-reformes.js";
import { tableDonnees } from "./graphiques/colonnes.js";

const ESPACES = [
  { id: "heritage", label: "Héritage", lien: "heritage-simuler.html" },
  { id: "retraites", label: "Retraites", lien: "retraites-simuler.html" },
  { id: "sante", label: "Santé", lien: "sante-simuler.html" },
];
const RESSOURCES = {
  "csg-pensions-normal": "La hausse de CSG des pensions au taux normal (alignement sur 9,2 %)",
  "csg-pensions-median": "La hausse de CSG des pensions au taux médian",
  tva: "La hausse de TVA",
  igs: "Les recettes de l'impôt sur les grandes successions",
};
const signeMd = (v) => (Math.abs(v) < 0.05 ? "0" : `${v >= 0 ? "+" : "−"}${milliards(Math.abs(v))}`);
const signePct = (v) => `${v >= 0 ? "+" : "−"}${pourcent(Math.abs(v))}`;

export function monter(racine) {
  const zoneChoix = h("div");
  const zoneConflits = h("div", { "aria-live": "polite" });
  const zoneChiffres = h("dl", { class: "comparatif comparatif--bilan", "aria-live": "polite" });
  const zoneSolde = h("div");
  const zoneEffets = h("div");
  const zoneNiveaux = h("div");
  const boutonEffacer = h("button", { type: "button", class: "lien-bouton" }, "Effacer tous mes choix");
  boutonEffacer.addEventListener("click", () => {
    if (confirm("Effacer les mesures enregistrées dans le Bilan ? Les réglages des simulateurs sont gardés.")) effacerBilan();
  });

  racine.replaceChildren(
    h(
      "div",
      { class: "texte" },
      h(
        "p",
        {},
        "Chaque simulateur du site enregistre ici, dans votre navigateur, ce que vous y avez réglé. Le Bilan additionne vos mesures en évitant les doubles comptes : une même recette ne peut servir qu'une fois, et quand une mesure en modifie une autre (une TVA sociale qui baisse la CSG des actifs change ce que rapporte l'aligner pour les retraités, par exemple), l'effet est chiffré et expliqué.",
      ),
    ),
    h("h2", { class: "titre-section" }, "Vos choix"),
    zoneChoix,
    zoneConflits,
    h("h2", { class: "titre-section" }, "Ce que rapportent vos mesures, et à quoi sert chaque euro"),
    zoneChiffres,
    zoneSolde,
    h("h2", { class: "titre-section" }, "Les effets croisés entre vos mesures"),
    zoneEffets,
    h("h2", { class: "titre-section" }, "Sur les niveaux de vie"),
    zoneNiveaux,
    h(
      "p",
      { class: "note" },
      "Ordres de grandeur, sans effets de comportement. Les calculs sont détaillés dans le classeur ",
      h("a", { href: "chiffrages/Chiffrage_Bilan.xlsx" }, "Chiffrage_Bilan.xlsx"),
      " et dans les pages Méthode de chaque espace. ",
      boutonEffacer,
    ),
  );

  const ctx = {
    csg,
    pensionsTotales: niveauDeVie.pensionsTotales.valeur,
    composition: niveauDeVie.composition,
    masseNette: (macro.masseSalarialeBrute.valeur / 1e9) * macro.ratioNetSurBrut.valeur,
    ratioNetSurBrut: macro.ratioNetSurBrut.valeur,
    effetNetCsg: csg.retraites.effetNet,
  };

  const rendu = () => {
    const etat = lireBilan();
    const b = calculerBilan(etat, ctx);
    const mesures = Object.values(etat.mesures);

    // ----- Vos choix -----
    remplir(
      zoneChoix,
      mesures.length
        ? ESPACES.map((e) => {
            const ms = mesures.filter((m) => m.espace === e.id);
            return h(
              "section",
              { class: "bilan-espace" },
              h("h3", {}, e.label),
              ms.length
                ? h(
                    "ul",
                    { class: "bilan-mesures" },
                    ms.map((m) => {
                      const ligne = b.lignes.find((l) => l.mesure.id === m.id);
                      const caseRetenir = h("input", { type: "checkbox", checked: estRetenue(etat, m.id) });
                      caseRetenir.addEventListener("change", () => retenir(m.id, caseRetenir.checked));
                      return h(
                        "li",
                        { class: `bilan-mesure${estRetenue(etat, m.id) ? "" : " bilan-mesure--ecartee"}` },
                        h("label", { class: "case-a-cocher" }, caseRetenir, h("span", { class: "bilan-mesure__titre" }, m.label)),
                        h("span", { class: "bilan-mesure__montant" }, ligne ? signeMd(ligne.net) : "non retenue"),
                        m.reglages?.length ? h("ul", { class: "bilan-mesure__reglages" }, m.reglages.map((r) => h("li", {}, r))) : null,
                        h("a", { href: m.lien, class: "bilan-mesure__lien" }, "Modifier"),
                      );
                    }),
                  )
                : h("p", { class: "aide" }, "Rien de réglé pour l'instant. ", h("a", { href: e.lien }, `Ouvrir ${e.label} › Simuler`), "."),
            );
          })
        : h("p", { class: "texte" }, "Aucune mesure enregistrée. Commencez par ", h("a", { href: "heritage-simuler.html" }, "Héritage"), ", ", h("a", { href: "retraites-simuler.html" }, "Retraites"), " ou ", h("a", { href: "sante-simuler.html" }, "Santé"), " › Simuler : chaque réglage s'ajoute ici."),
    );

    // ----- Conflits : affectation unique -----
    remplir(
      zoneConflits,
      b.conflits.map((c) =>
        h(
          "fieldset",
          { class: "champ avis" },
          h("legend", {}, `${RESSOURCES[c.ressource] ?? c.ressource} est utilisée par deux mesures. À laquelle l'affecter ?`),
          h(
            "div",
            { class: "choix choix--colonne" },
            c.candidates.map((id) => {
              const radio = h("input", { type: "radio", name: `aff-${c.ressource}`, value: id, checked: id === c.detenteur });
              radio.addEventListener("change", () => affecter(c.ressource, id));
              return h("label", {}, radio, etat.mesures[id].label);
            }),
          ),
          h("p", { class: "aide" }, "L'autre mesure est comptée sans cette recette."),
        ),
      ),
    );

    // ----- Chiffres clés -----
    const maladie = b.totaux.maladie;
    // Tout ce qui est rendu aux actifs, TVA sociale comprise, converti en points de CSG.
    const baisseCsgActifs = b.totaux.actifs / csg.activite.valeurPoint;
    remplir(
      zoneChiffres,
      chiffre("Mobilisé par vos mesures", signeMd(b.total), "par an, effets croisés compris"),
      chiffre("Déficit de l'Assurance maladie", maladie > 0 ? `−${pourcent(Math.min(1, maladie / Math.abs(sr.deficitMaladie.valeur)))}` : "inchangé", `sur ${milliards(Math.abs(sr.deficitMaladie.valeur))} en 2026`),
      chiffre("Rendu aux actifs", milliards(Math.max(0, b.totaux.actifs)), baisseCsgActifs > 0.05 ? `soit environ ${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(baisseCsgActifs)} point de CSG en moins` : "aucune baisse de CSG"),
    );

    // ----- Solde par usage -----
    const entetes = ["Mesure", "Gain net", ...USAGES.map((u) => u.label)];
    const lignes = b.lignes.map((l) => [l.mesure.label + (l.perdues.length ? " (sans la recette affectée ailleurs)" : ""), signeMd(l.net), ...USAGES.map((u) => signeMd(l.usages[u.id] ?? 0))]);
    const croises = b.effets.filter((e) => e.montant);
    for (const e of croises) lignes.push([`Effet croisé : ${e.titre.toLowerCase()}`, signeMd(e.montant), ...USAGES.map((u) => (u.id === "autres" ? signeMd(e.montant) : ""))]);
    lignes.push(["Total", signeMd(b.total), ...USAGES.map((u) => signeMd(b.totaux[u.id]))]);
    remplir(zoneSolde);
    if (b.lignes.length) {
      const conteneur = h("div", { class: "defilement" });
      zoneSolde.append(conteneur);
      tableDonnees(conteneur, entetes, lignes);
      conteneur.querySelector("table")?.classList.add("table-bilan");
      zoneSolde.append(
        h("p", { class: "note" }, "Chaque euro n'a qu'un usage : celui choisi dans le simulateur de la mesure (répartiteur, baisse de CSG, Assurance maladie). « Autres comptes publics » : ce que les effets croisés ajoutent ou retirent au budget de l'État et des caisses de retraite."),
      );
    } else zoneSolde.append(h("p", { class: "aide" }, "Aucune mesure retenue."));

    // ----- Effets croisés -----
    remplir(
      zoneEffets,
      b.effets.length
        ? h("ul", { class: "bilan-effets" }, b.effets.map((e) => h("li", {}, h("strong", {}, e.titre), e.montant ? h("span", { class: "bilan-effets__montant" }, ` (${signeMd(e.montant)} par an)`) : null, h("p", {}, e.texte))))
        : h("p", { class: "aide" }, "Aucun effet croisé entre les mesures retenues. Il en apparaît par exemple si vous combinez une TVA sociale avec un alignement de la CSG des retraités, ou un gel des pensions avec une hausse de leur CSG."),
    );

    // ----- Niveaux de vie -----
    const { cumul, effets: nv, apresRevalorisation } = b.niveauxDeVie;
    const derniere = niveauDeVie.series.emploi.length - 1;
    const emploi = niveauDeVie.series.emploi[derniere];
    const ret = niveauDeVie.series.retraites[derniere];
    const ratio = (ea, er) => (ret * (1 + er)) / (emploi * (1 + ea));
    remplir(
      zoneNiveaux,
      h(
        "dl",
        { class: "comparatif comparatif--bilan" },
        chiffre("Personne en emploi médiane", euros((emploi * (1 + cumul.actifs)) / 12), `par mois, ${signePct(cumul.actifs)}`),
        chiffre("Retraité médian", euros((ret * (1 + cumul.retraites)) / 12), `par mois, ${signePct(cumul.retraites)} la première année`),
        chiffre("Niveau de vie des retraités / en emploi", `${pourcent(ratio(0, 0))} → ${pourcent(ratio(cumul.actifs, cumul.retraites))}`, apresRevalorisation ? `${pourcent(ratio(cumul.actifs, apresRevalorisation.retraites))} une fois la TVA rendue par la revalorisation` : "niveau de vie médian 2024, Insee"),
      ),
      nv.length
        ? (() => {
            const t = h("div");
            tableDonnees(t, ["Mesure", "Actifs", "Retraités"], [...nv.map((e) => [e.label, signePct(e.actifs), signePct(e.retraites)]), ["Cumul", signePct(cumul.actifs), signePct(cumul.retraites)]]);
            return h("details", { class: "table-donnees", open: true }, h("summary", {}, "Détail par mesure"), t);
          })()
        : null,
      h(
        "p",
        { class: "note" },
        "Effets en part du revenu disponible, cumulés les uns sur les autres. Même méthode que la page Retraites : un effet sur les salaires ou les pensions est pondéré par leur poids dans le revenu des ménages (84 % et 78 %, Insee). Ce que paient les héritiers, les médecins et les complémentaires n'y figure pas, faute de pouvoir le rattacher à un groupe.",
      ),
    );
  };

  surMajBilan(rendu);
  rendu();
}

function chiffre(titre, valeur, detail) {
  return h("div", {}, h("dt", {}, titre), h("dd", {}, valeur, h("span", { class: "sous" }, detail)));
}
