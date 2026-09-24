// Outil « Ma répartition » : chacun répartit les recettes de la réforme entre les salaires des actifs
// et des services publics, comparés à leur budget actuel. La répartition se partage par un lien.

import { h, remplir, surChangement, formaterALaSortie, rejouer } from "./dom.js";
import { euros, ecartEuros, milliards, pourcent, lireMontant, nombre } from "../engine/format.js";
import { fixerMontant, depuisParts, reechelonner, totalReparti, effetService, encoder, decoder } from "../engine/repartition.js";
import { destinations } from "../params/budgets.js";
import { repartitions } from "../redistribution/repartitions.js";
import { scenarios, trouverScenario } from "../redistribution/scenarios.js";
import { macro } from "../params/macro.js";

const MOYENNE = "moyenne";
const PAS = 0.1;

export function monter(racine, { reforme }) {
  const { recettes } = reforme;
  const formPostes = racine.querySelector("[data-postes]");
  const selectAnnee = racine.querySelector("[data-annees]");
  const bilan = racine.querySelector("[data-bilan]");
  const blocSalaire = racine.querySelector("[data-votre-salaire]");
  const sortieGain = racine.querySelector("[data-gain-salaire]");
  const champSalaire = racine.querySelector("#r-salaire");
  const messagePartage = racine.querySelector("[data-partage-message]");

  // Enveloppe arrondie au pas des curseurs, pour que « tout réparti » corresponde au montant affiché.
  const enveloppeDe = (annee) => {
    const totalAnnee = (i) => recettes.series.reduce((t, s) => t + s.valeurs[i], 0);
    const brut =
      annee === MOYENNE
        ? recettes.annees.reduce((t, _, i) => t + totalAnnee(i), 0) / recettes.annees.length
        : totalAnnee(recettes.annees.indexOf(Number(annee)));
    return Math.round(brut / PAS) * PAS;
  };

  // État : année, répartition { id: Md€ }, mode de versement aux actifs.
  const lu = lireLien();
  let annee = lu.annee && (lu.annee === MOYENNE || recettes.annees.includes(Number(lu.annee))) ? lu.annee : MOYENNE;
  let enveloppe = enveloppeDe(annee);
  let repartition = lu.repartition
    ? depuisParts(lu.repartition, Math.min(enveloppe, totalReparti(lu.repartition)))
    : depuisParts(repartitions[0].parts, enveloppe);
  let mode = scenarios[0].id;

  selectAnnee.replaceChildren(
    h("option", { value: MOYENNE }, `Moyenne ${recettes.annees[0]}-${recettes.annees.at(-1)}`),
    ...recettes.annees.map((a) => h("option", { value: String(a) }, String(a))),
  );
  selectAnnee.value = annee;

  racine.querySelector("[data-modeles]").replaceChildren(
    ...repartitions.map((m) => h("button", { type: "button", class: "puce", "data-modele": m.id, title: m.note ?? false }, m.label)),
  );

  racine.querySelector("[data-modes-versement]").replaceChildren(
    ...scenarios.map((sc) =>
      h("label", {}, h("input", { type: "radio", name: "mode", value: sc.id, checked: sc.id === mode }), sc.label),
    ),
  );
  formaterALaSortie(champSalaire, lireMontant, nombre);

  // Une ligne par destination : curseur, montant, effet sur le budget.
  const lignes = new Map();
  formPostes.replaceChildren(
    ...destinations.map((d) => {
      const id = `r-${d.id}`;
      const curseur = h("input", { type: "range", id, name: d.id, min: 0, step: PAS, "aria-describedby": `${id}-effet` });
      const sortie = h("output", { for: id, class: "poste__montant" });
      const effet = h("p", { class: "poste__effet", id: `${id}-effet` });
      const jauge =
        d.type === "service"
          ? h("div", { class: "jauge", "aria-hidden": "true" }, h("span", { class: "jauge__actuel" }), h("span", { class: "jauge__ajout" }))
          : null;
      const el = h(
        "div",
        { class: `poste${d.type === "actifs" ? " poste--actifs" : ""}` },
        h("div", { class: "poste__tete" }, h("label", { for: id }, d.label), sortie),
        h("p", { class: "poste__resume" }, d.resume),
        curseur,
        jauge,
        effet,
      );
      lignes.set(d.id, { d, curseur, sortie, effet, jauge, el });
      return el;
    }),
  );
  // Le détail « votre salaire » vit dans la ligne des actifs, sous son curseur.
  lignes.get("actifs")?.el.append(blocSalaire);
  // Rappel du reste à répartir, collé en bas de l'écran sur mobile (masqué sur grand écran).
  const resteFlottant = h("p", { class: "reste-flottant", "aria-hidden": "true" });
  formPostes.append(resteFlottant);

  // Échelle commune des jauges : le plus gros budget plus l'enveloppe entière.
  const echelle = () => Math.max(...destinations.filter((d) => d.type === "service").map((d) => d.budget)) + enveloppe;

  const rendu = ({ frapper = false } = {}) => {
    const total = totalReparti(repartition);
    const reste = Math.max(0, enveloppe - total);
    const max = echelle();

    for (const { d, curseur, sortie, effet, jauge } of lignes.values()) {
      const montant = repartition[d.id] ?? 0;
      curseur.max = enveloppe.toFixed(1);
      curseur.value = montant;
      sortie.textContent = milliards(montant);
      if (d.type === "service") {
        const e = effetService(d.budget, montant);
        jauge.firstChild.style.width = `${(d.budget / max) * 100}%`;
        jauge.lastChild.style.width = `${(montant / max) * 100}%`;
        effet.textContent =
          montant > 0
            ? `Budget actuel ${milliards(d.budget)}, soit +${pourcent(e.hausse)} avec votre choix.`
            : `Budget actuel ${milliards(d.budget)}.`;
      } else {
        const { mensuel } = trouverScenario("dividende").calculer({ recettes: montant * 1e9, macro });
        effet.textContent = montant > 0 ? `Soit ${ecartEuros(mensuel)} par mois pour chaque actif, en moyenne.` : "Rien pour l'instant.";
      }
    }

    const complet = reste < PAS - 1e-9;
    const tampon = h(
      "p",
      { class: `tampon ${complet ? "tampon--actifs" : "tampon--neutre"}` },
      complet ? "Tout est réparti" : `Reste ${milliards(reste)}`,
    );
    const periode = annee === MOYENNE ? "En moyenne chaque année" : `En ${annee}`;
    const choisis = destinations.filter((d) => (repartition[d.id] ?? 0) > 0);
    remplir(
      bilan,
      tampon,
      h("p", { class: "resultat__phrase" }, `${periode}, l'impôt rapporterait ${milliards(enveloppe)}. Vous en avez réparti ${milliards(total)}.`),
      choisis.length
        ? h(
            "ul",
            { class: "bilan" },
            choisis.map((d) => {
              const m = repartition[d.id];
              const detail =
                d.type === "service"
                  ? `+${pourcent(effetService(d.budget, m).hausse)} de budget`
                  : `${ecartEuros(trouverScenario("dividende").calculer({ recettes: m * 1e9, macro }).mensuel)} par mois et par actif`;
              return h("li", {}, h("span", {}, d.label), h("span", { class: "bilan__valeur" }, `${milliards(m)}, ${detail}`));
            }),
          )
        : h("p", { class: "resultat__detail" }, "Déplacez un curseur ou choisissez une répartition toute faite."),
      reste >= PAS - 1e-9 ? h("p", { class: "resultat__detail" }, "La somme non répartie n'est affectée à rien dans ce simulateur.") : null,
    );
    if (frapper) rejouer(tampon);
    resteFlottant.textContent = complet ? `Tout est réparti : ${milliards(enveloppe)}` : `Reste ${milliards(reste)} à répartir sur ${milliards(enveloppe)}`;
    resteFlottant.classList.toggle("reste-flottant--complet", complet);

    const partActifs = repartition.actifs ?? 0;
    blocSalaire.hidden = partActifs <= 0;
    if (partActifs > 0) {
      const scenario = trouverScenario(mode);
      const salaire = lireMontant(champSalaire.value);
      const { mensuel, annuel } = scenario.calculer({ recettes: partActifs * 1e9, profil: { salaireNetMensuel: salaire }, macro });
      remplir(
        sortieGain,
        h("p", { class: "gain" }, ecartEuros(mensuel), h("span", { class: "gain__unite" }, " par mois pour vous")),
        h("p", { class: "resultat__phrase" }, `Soit ${euros(annuel)} par an` + (salaire > 0 ? `, ${pourcent(mensuel / salaire)} de votre salaire net.` : ".")),
        h("p", { class: "resultat__detail" }, `${scenario.description} Variante du simulateur : l'étude ne propose pas de reverser les recettes aux actifs.`),
      );
    }
  };

  const etatComplet = () => enveloppe - totalReparti(repartition) < PAS - 1e-9;

  formPostes.addEventListener("input", (e) => {
    const id = e.target.name;
    if (!lignes.has(id)) return;
    const avant = etatComplet();
    repartition = fixerMontant(repartition, id, Number(e.target.value), enveloppe);
    rendu({ frapper: avant !== etatComplet() });
  });
  formPostes.addEventListener("submit", (e) => e.preventDefault());

  racine.querySelector("[data-modeles]").addEventListener("click", (e) => {
    const bouton = e.target.closest("[data-modele]");
    if (!bouton) return;
    const modele = repartitions.find((m) => m.id === bouton.dataset.modele);
    repartition = depuisParts(modele.parts, enveloppe);
    rendu({ frapper: true });
  });

  selectAnnee.addEventListener("change", () => {
    const nouvelle = enveloppeDe(selectAnnee.value);
    repartition = reechelonner(repartition, enveloppe, nouvelle);
    annee = selectAnnee.value;
    enveloppe = nouvelle;
    rendu();
  });

  surChangement(blocSalaire, () => {
    mode = blocSalaire.querySelector('input[name="mode"]:checked')?.value ?? mode;
    rendu();
  });

  racine.querySelector("[data-partager]").addEventListener("click", async () => {
    const url = new URL(location.href);
    url.hash = `repartition=${encoder(repartition)}&annee=${annee}`;
    try {
      await navigator.clipboard.writeText(url.href);
      messagePartage.textContent = "Lien copié. Toute personne qui l'ouvre verra votre répartition.";
    } catch {
      messagePartage.textContent = url.href;
    }
    history.replaceState(null, "", url.hash);
  });

  rendu();
}

/** Lit une répartition partagée dans l'adresse : #repartition=ecole-5_actifs-10&annee=2030 */
function lireLien() {
  const params = new URLSearchParams(location.hash.slice(1));
  const texte = params.get("repartition");
  const repartition = texte ? decoder(texte, destinations.map((d) => d.id)) : null;
  return { repartition: repartition && totalReparti(repartition) > 0 ? repartition : null, annee: params.get("annee") };
}
