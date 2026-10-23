// Section « Et l'argent, on en fait quoi ? » : le pot (recettes en plus de 2025, Md€) est réparti entre cinq usages.
// Au départ tout reste à attribuer ; un usage ne peut pas recevoir plus que ce qui reste dans le pot.
import { usages } from "../donnees/sources.js";
import { nombre } from "./format.js";

const COULEURS = ["#2f6b4f", "#2f5da8", "#7a4fa0", "#5b6472", "#b07400"]; // texte blanc lisible sur chaque teinte
const ICONES = {
  ecologie: '<path d="M8 32c0-14 10-22 24-24-2 14-10 24-24 24z"/><path d="M8 32 22 18"/>',
  recherche: '<circle cx="17" cy="17" r="9"/><path d="m24 24 9 9"/><path d="M13 17h8M17 13v8"/>',
  education: '<path d="M4 15 20 8l16 7-16 7z"/><path d="M10 18v8c4 3 16 3 20 0v-8"/><path d="M36 15v10"/>',
  defense: '<path d="M20 5 8 10v9c0 8 5 13 12 16 7-3 12-8 12-16v-9z"/>',
  csg: '<rect x="6" y="9" width="28" height="22" rx="2"/><path d="M6 15h28"/><path d="M13 23h6M24 21l4 4 4-4"/>',
};
const PAS = 0.1;
const arrondi = (x) => Math.round(x / PAS) * PAS;

export function monterRecettes() {
  const montants = Object.fromEntries(usages.map((u) => [u.id, 0]));
  let pot = 0;
  const $ = (id) => document.getElementById(id);
  const attribue = () => usages.reduce((a, u) => a + montants[u.id], 0);
  const reste = () => Math.max(0, pot - attribue());

  $("usages").innerHTML = usages.map((u, i) => `
    <div class="usage">
      <svg viewBox="0 0 40 40" aria-hidden="true" style="stroke:${COULEURS[i]}">${ICONES[u.id]}</svg>
      <label for="u-${u.id}">${u.nom}<small>${u.note}</small></label>
      <div class="usage-reglage">
        <input type="range" id="u-${u.id}" min="0" max="1" step="${PAS}" value="0" aria-describedby="q-${u.id}">
        <span class="usage-montant"><input type="number" id="n-${u.id}" min="0" step="${PAS}" value="0" aria-label="${u.nom}, en milliards d'euros"> Md€</span>
      </div>
      <p class="equivalent" id="q-${u.id}"></p>
    </div>`).join("");

  let minuteur;
  const alerte = (texte) => {
    const a = $("pot-alerte");
    a.textContent = texte; a.hidden = !texte;
    clearTimeout(minuteur);
    if (texte) minuteur = setTimeout(() => { a.hidden = true; }, 3500);
  };

  // Demande d'un montant pour un usage : bornée par ce qui reste dans le pot.
  function demander(id, voulu) {
    const disponible = pot - (attribue() - montants[id]);
    const accorde = arrondi(Math.max(0, Math.min(voulu, disponible)));
    const nom = usages.find((u) => u.id === id).nom;
    if (voulu > disponible + 1e-9) alerte(pot > 0
      ? `Plafond atteint : il ne restait que ${nombre(Math.max(0, disponible), 1)} Md€ dans le pot pour « ${nom} ». Retirez de l'argent à un autre usage pour en donner plus.`
      : "Votre réforme ne rapporte rien de plus : il n'y a rien à répartir.");
    montants[id] = accorde;
    maj();
  }

  usages.forEach((u) => {
    $(`u-${u.id}`).addEventListener("input", (e) => demander(u.id, Number(e.target.value)));
    $(`n-${u.id}`).addEventListener("change", (e) => demander(u.id, Number(e.target.value) || 0));
  });
  $("pot-vider").addEventListener("click", () => { usages.forEach((u) => { montants[u.id] = 0; }); alerte(""); maj(); });

  function maj() {
    const total = attribue();
    $("pot-total").textContent = pot > 0 ? `${nombre(pot, 1)} Md€` : "0 Md€";
    $("pot-attribue").textContent = `${nombre(total, 1)} Md€`;
    $("pot-reste").textContent = `${nombre(reste(), 1)} Md€`;
    $("pot-vider").disabled = total === 0;
    // Jauge : une part par usage, puis le reste (hachuré).
    const segments = usages.map((u, i) => montants[u.id] > 0
      ? `<span style="flex-grow:${montants[u.id]};background:${COULEURS[i]}" title="${u.nom} : ${nombre(montants[u.id], 1)} Md€">${montants[u.id] / Math.max(pot, 1e-9) >= 0.12 ? `${nombre(montants[u.id], 1)}` : ""}</span>` : "");
    if (reste() > 0.05 || total === 0) segments.push(`<span class="reste" style="flex-grow:${Math.max(reste(), 0.001)}">${pot > 0 ? `Reste ${nombre(reste(), 1)} Md€` : "Pas de recettes en plus"}</span>`);
    $("repartition").innerHTML = segments.join("");
    $("repartition").setAttribute("aria-label", `Pot de ${nombre(pot, 1)} Md€ : ${nombre(total, 1)} attribués, ${nombre(reste(), 1)} restants.`);
    usages.forEach((u) => {
      const m = montants[u.id];
      const curseur = $(`u-${u.id}`), saisie = $(`n-${u.id}`);
      curseur.max = String(Math.max(pot, PAS)); curseur.value = String(m); curseur.disabled = pot <= 0;
      curseur.style.setProperty("--plafond", `${pot > 0 ? (100 * (m + reste())) / pot : 0}%`);
      saisie.value = nombre(m, 1).replace(",", ".").replace(/\s/g, ""); saisie.max = String(Math.max(pot, 0)); saisie.disabled = pot <= 0;
      const q = $(`q-${u.id}`);
      if (pot <= 0) q.textContent = "Votre réforme ne dégage pas de recettes en plus.";
      else if (m === 0) q.textContent = "Rien d'attribué pour l'instant.";
      else q.innerHTML = u.pointCsg
        ? `soit ${nombre(m / u.pointCsg, 1)} point de CSG en moins sur les salaires`
        : `soit +${nombre((100 * m) / u.budget)} % ${u.unite}`;
    });
    document.dispatchEvent(new CustomEvent("repartition", { detail: { pot, reste: reste(), usages: usages.filter((u) => montants[u.id] > 0).map((u) => ({ nom: u.nom, montant: montants[u.id] })) } }));
  }

  // Nouveau pot à chaque réglage de la réforme : si l'on a déjà trop attribué, tout est réduit dans la même proportion.
  document.addEventListener("reforme", (e) => {
    pot = arrondi(Math.max(0, e.detail.r.supplement[0]));
    const total = attribue();
    if (total > pot && total > 0) usages.forEach((u) => { montants[u.id] = arrondi((montants[u.id] * pot) / total); });
    while (attribue() > pot + 1e-9) { const u = usages.find((x) => montants[x.id] > 0); montants[u.id] = arrondi(montants[u.id] - PAS); }
    maj();
  });
  maj();
}
