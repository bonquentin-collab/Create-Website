// Section « Et l'argent, on en fait quoi ? » : répartition des recettes 2025 de la réforme entre cinq usages.
import { usages } from "../donnees/sources.js";
import { md, nombre } from "./format.js";

const COULEURS = ["#2f6b4f", "#2f5da8", "#7a4fa0", "#5b6472", "#b07400"]; // texte blanc lisible sur chaque teinte
const ICONES = {
  ecologie: '<path d="M8 32c0-14 10-22 24-24-2 14-10 24-24 24z"/><path d="M8 32 22 18"/>',
  recherche: '<circle cx="17" cy="17" r="9"/><path d="m24 24 9 9"/><path d="M13 17h8M17 13v8"/>',
  education: '<path d="M4 15 20 8l16 7-16 7z"/><path d="M10 18v8c4 3 16 3 20 0v-8"/><path d="M36 15v10"/>',
  defense: '<path d="M20 5 8 10v9c0 8 5 13 12 16 7-3 12-8 12-16v-9z"/>',
  csg: '<rect x="6" y="9" width="28" height="22" rx="2"/><path d="M6 15h28"/><path d="M13 23h6M24 21l4 4 4-4"/>',
};

export function monterRecettes() {
  const parts = Object.fromEntries(usages.map((u) => [u.id, 20]));
  let total = 0;
  const liste = document.getElementById("usages");
  liste.innerHTML = usages.map((u, i) => `
    <div class="usage">
      <svg viewBox="0 0 40 40" aria-hidden="true" style="stroke:${COULEURS[i]}">${ICONES[u.id]}</svg>
      <label for="u-${u.id}">${u.nom}<small>${u.note}</small></label>
      <input type="range" id="u-${u.id}" min="0" max="100" step="5" value="${parts[u.id]}">
      <p class="equivalent" id="q-${u.id}"></p>
    </div>`).join("");
  usages.forEach((u) => document.getElementById(`u-${u.id}`).addEventListener("input", (e) => { parts[u.id] = Number(e.target.value); maj(); }));

  function maj() {
    const somme = Object.values(parts).reduce((a, b) => a + b, 0) || 1;
    document.getElementById("u-total").textContent = total > 0 ? `${md(total)}` : "aucune recette en plus";
    document.getElementById("repartition").innerHTML = usages.map((u, i) => parts[u.id] > 0
      ? `<span style="flex-grow:${parts[u.id]};background:${COULEURS[i]}">${Math.round((100 * parts[u.id]) / somme) >= 10 ? `${Math.round((100 * parts[u.id]) / somme)} %` : ""}</span>` : "").join("");
    usages.forEach((u) => {
      const m = Math.max(0, total) * parts[u.id] / somme;
      const q = document.getElementById(`q-${u.id}`);
      if (total <= 0) { q.textContent = "Votre réforme ne dégage pas de recettes en plus."; return; }
      q.innerHTML = u.pointCsg
        ? `<b>${nombre(m, 1)} Md€</b>, soit ${nombre(m / u.pointCsg, 1)} point de CSG en moins sur les salaires`
        : `<b>${nombre(m, 1)} Md€</b>, soit +${nombre((100 * m) / u.budget)} % ${u.unite}`;
    });
    document.dispatchEvent(new CustomEvent("repartition", { detail: usages.filter((u) => parts[u.id] > 0).map((u) => ({ nom: u.nom, part: parts[u.id] / somme })) }));
  }

  document.addEventListener("reforme", (e) => { total = e.detail.r.supplement[0]; maj(); });
  maj();
}
