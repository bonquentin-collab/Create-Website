// Image « Ma réforme de l'héritage » (1080 × 1350, format des réseaux), bouton « Répartir mes recettes »
// et formulaires de soutien. Les formulaires ne transmettent rien tant que l'outil de la campagne n'est pas branché.
import { md, nombre } from "./format.js";

let reforme = null;
let repartition = { pot: 0, usages: [], reste: 0 };

// Ce que prélève la réforme, en quelques mots.
function resume(reglages) {
  const n = reglages.niches;
  const taux = reglages.bareme.map((t) => Math.round(t.taux * 100));
  const l = [`Barème de ${Math.min(...taux)} à ${Math.max(...taux)} %`];
  l.push(reglages.abattement > 0 ? `abattement de ${nombre(reglages.abattement)} € par parent` : "pas d'abattement");
  if (n.tout) { l.push("toutes les transmissions imposées, sans aucune niche"); return l; }
  if (n.toutesTransmissions) l.push("tout ce qui est reçu dans la vie compté");
  if (n.assuranceVie === "bareme") l.push("assurance-vie au barème");
  if (n.demembrement === "supprimer") l.push("usufruit taxé");
  if (n.dutreil === "supprimer") l.push("pacte Dutreil supprimé");
  else if (n.dutreil === "resserrer") l.push("pacte Dutreil resserré");
  if (n.plusValues === "top1") l.push("plus-values du 1 % le plus riche imposées");
  else if (n.plusValues === "tous") l.push("plus-values imposées au décès");
  if (l.length === 2) l.push("niches inchangées");
  return l;
}

function lignes(ctx, texte, largeurMax) {
  const res = [];
  let ligne = "";
  for (const mot of texte.split(" ")) {
    const essai = ligne ? `${ligne} ${mot}` : mot;
    if (ligne && ctx.measureText(essai).width > largeurMax) { res.push(ligne); ligne = mot; } else ligne = essai;
  }
  if (ligne) res.push(ligne);
  return res;
}

function dessinerImage() {
  const c = document.createElement("canvas");
  c.width = 1080; c.height = 1350;
  const x = c.getContext("2d");
  const encre = "#170B3B", indigo = "#290F95", jaune = "#FFC93C", papier = "#FBF8F1", gris = "#5B5478", lavande = "#F7F3FC";
  const titre = "'Bricolage Grotesque', Arial, sans-serif", mono = "'DM Mono', ui-monospace, monospace";
  const G = 80, L = 920;
  const carte = (cx, cy, w, h, r, fond) => {
    x.beginPath(); x.roundRect(cx + 10, cy + 10, w, h, r); x.fillStyle = encre; x.fill();
    x.beginPath(); x.roundRect(cx, cy, w, h, r); x.fillStyle = fond; x.fill();
    x.lineWidth = 5; x.strokeStyle = encre; x.stroke();
  };
  const rubrique = (t, y) => { x.fillStyle = gris; x.font = `500 24px ${mono}`; x.fillText(t.toUpperCase(), G, y); };

  x.fillStyle = papier; x.fillRect(0, 0, 1080, 1350);
  x.font = `500 24px ${mono}`;
  const etiquette = "Ma réforme de l'héritage";
  const le = x.measureText(etiquette).width + 48;
  x.beginPath(); x.roundRect(G, 56, le, 52, 26); x.fillStyle = "#fff"; x.fill(); x.lineWidth = 4; x.strokeStyle = encre; x.stroke();
  x.fillStyle = encre; x.fillText(etiquette, G + 24, 90);
  x.font = `800 64px ${titre}`;
  let y = 186;
  for (const l of lignes(x, reforme.nom, L).slice(0, 2)) { x.fillText(l, G, y); y += 68; }

  const r = reforme.r, sup = r.supplement[0];
  const yc = y - 20;
  carte(G, yc, L, 190, 36, jaune);
  x.fillStyle = encre; x.font = `800 120px ${titre}`;
  const montant = md(sup, 0).replace(" Md€", "");
  x.fillText(montant, G + 36, yc + 128);
  const lm = x.measureText(montant).width;
  x.font = `600 32px ${titre}`;
  x.fillText("milliards d'euros", G + 60 + lm, yc + 86);
  x.fillText(sup < 0 ? "par an en moins" : "par an pour la collectivité", G + 60 + lm, yc + 126);
  x.font = `400 22px ${mono}`;
  x.fillText(`${md(r.cumul, 0)} de ${r.annees[0]} à ${r.annees.at(-1)} · ${nombre(Math.round(100 * r.parts.plus))} héritiers sur 100 paieraient plus`, G + 36, yc + 166);

  y = yc + 190 + 66;
  rubrique("Ce que je prélève", y); y += 46;
  x.fillStyle = encre; x.font = `600 28px ${titre}`;
  for (const l of lignes(x, resume(reforme.reglages).join(" · "), L).slice(0, 4)) { x.fillText(l, G, y); y += 40; }

  y += 30; rubrique("Ce que j'en fais", y); y += 22;
  const pot = repartition.pot || 0;
  const usages = [...(repartition.usages || [])].sort((a, b) => b.montant - a.montant);
  if (sup <= 0 || pot <= 0) {
    x.fillStyle = encre; x.font = `600 30px ${titre}`; y += 34;
    const t = sup < 0 ? `Rien à répartir : la réforme coûte ${md(-sup, 1).replace("+", "")} par an.` : "Rien à répartir : la réforme ne rapporte rien de plus.";
    for (const l of lignes(x, t, L)) { x.fillText(l, G, y); y += 42; }
  } else {
    x.save(); x.beginPath(); x.roundRect(G, y, L, 48, 14); x.clip(); x.fillStyle = lavande; x.fillRect(G, y, L, 48);
    let px = G;
    for (const u of usages) { const w = (L * u.montant) / pot; x.fillStyle = u.couleur; x.fillRect(px, y, Math.max(0, w - 3), 48); px += w; }
    x.restore(); x.beginPath(); x.roundRect(G, y, L, 48, 14); x.lineWidth = 5; x.strokeStyle = encre; x.stroke();
    y += 98;
    const items = usages.slice(0, 5).map((u) => ({ ...u }));
    if (repartition.reste > 0.05) items.push({ nom: "Non attribué", montant: repartition.reste, couleur: lavande, equivalent: "laissé dans le pot" });
    const col = L / 2;
    items.forEach((u, i) => {
      const ix = G + (i % 2) * col, iy = y + Math.floor(i / 2) * 108;
      x.beginPath(); x.roundRect(ix, iy - 20, 20, 20, 6); x.fillStyle = u.couleur; x.fill(); x.lineWidth = 3; x.strokeStyle = encre; x.stroke();
      x.fillStyle = encre; x.font = `800 26px ${titre}`; x.fillText(lignes(x, u.nom, col - 56)[0], ix + 32, iy);
      x.fillStyle = gris; x.font = `400 19px ${mono}`;
      lignes(x, `${nombre(u.montant, 1)} Md€ · ${u.equivalent}`, col - 56).slice(0, 2).forEach((l, k) => x.fillText(l, ix + 32, iy + 32 + k * 26));
    });
  }
  x.fillStyle = encre; x.fillRect(G, 1206, L, 5);
  x.fillStyle = indigo; x.font = `800 60px ${titre}`;
  x.fillText("L'héritage pour tous", G, 1290);
  return c.toDataURL("image/png");
}

export function monterPartage() {
  const partager = document.getElementById("partager");
  const repartir = document.getElementById("repartir");
  const majRepartir = () => {
    const pot = repartition.pot || 0;
    repartir.hidden = !(reforme && reforme.r.supplement[0] > 0 && pot > 0);
    repartir.textContent = `Répartir mes ${md(pot, 1).replace("+", "")}`;
  };
  document.addEventListener("reforme", (e) => { reforme = e.detail; majRepartir(); });
  document.addEventListener("repartition", (e) => { repartition = e.detail; majRepartir(); });

  repartir.addEventListener("click", () => {
    const doux = matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    document.getElementById("recettes").scrollIntoView({ behavior: doux, block: "start" });
    setTimeout(() => document.querySelector("#usages input[type=range]:not(:disabled)")?.focus({ preventScroll: true }), 400);
  });

  const dlg = document.getElementById("fenetre");
  partager.addEventListener("click", async () => {
    await document.fonts?.ready;
    const url = dessinerImage();
    document.getElementById("apercu").src = url;
    document.getElementById("telecharger").href = url;
    dlg.showModal();
  });
  document.getElementById("fermer").addEventListener("click", () => dlg.close());
  document.getElementById("f-fenetre").addEventListener("submit", (e) => {
    e.preventDefault();
    const mail = document.getElementById("p-mail");
    const conf = document.getElementById("p-confirmation");
    conf.hidden = false;
    conf.textContent = mail.checkValidity() && mail.value
      ? "Merci. L'envoi par mail et la signature seront actifs au lancement de la campagne : rien n'a encore été transmis."
      : "Indiquez une adresse mail valide.";
  });
  document.getElementById("f-engager").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target, conf = document.getElementById("e-confirmation");
    conf.hidden = false;
    conf.textContent = f.checkValidity()
      ? "Merci. Les signatures seront enregistrées au lancement de la campagne : rien n'a encore été transmis."
      : "Vérifiez votre prénom, votre adresse mail et votre code postal (5 chiffres).";
  });
}
