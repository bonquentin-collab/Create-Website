// Image « Ma réforme de l'héritage » (1080 × 1350, format des réseaux) et fenêtre de soutien.
// Les formulaires ne transmettent rien tant que l'outil de la campagne n'est pas branché.
import { md, pct, nombre } from "./format.js";

let reforme = null;
let repartition = [];

function dessinerImage() {
  const c = document.createElement("canvas");
  c.width = 1080; c.height = 1350;
  const x = c.getContext("2d");
  const encre = "#14284a", papier = "#f1f3ee", jaune = "#f2c200";
  x.fillStyle = encre; x.fillRect(0, 0, 1080, 1350);
  x.fillStyle = jaune; x.fillRect(0, 0, 1080, 18);
  x.fillStyle = papier; x.font = "600 34px 'Public Sans', Arial, sans-serif";
  x.fillText("Ma réforme de l'héritage", 80, 130);
  x.font = "92px Anton, Impact, sans-serif";
  const titre = reforme.nom;
  const mots = titre.split(" "); let ligne = "", y = 250;
  for (const m of mots) { const t = ligne ? `${ligne} ${m}` : m; if (x.measureText(t).width > 920) { x.fillText(ligne, 80, y); ligne = m; y += 100; } else ligne = t; }
  x.fillText(ligne, 80, y);
  const r = reforme.r;
  x.fillStyle = jaune; x.font = "190px Anton, Impact, sans-serif";
  x.fillText(md(r.supplement[0], 0).replace(" Md€", ""), 80, y + 240);
  x.fillStyle = papier; x.font = "600 38px 'Public Sans', Arial, sans-serif";
  x.fillText("milliards d'euros par an pour la collectivité", 80, y + 310);
  x.font = "400 32px 'Public Sans', Arial, sans-serif";
  x.fillText(`${md(r.cumul, 0)} de 2025 à 2040 · ${nombre(Math.round(100 * r.parts.plus))} héritiers sur 100 paieraient plus`, 80, y + 370);
  let yy = y + 460;
  if (repartition.length && r.supplement[0] > 0) {
    x.font = "600 32px 'Public Sans', Arial, sans-serif"; x.fillText("Et l'argent irait à :", 80, yy); yy += 56;
    x.font = "400 32px 'Public Sans', Arial, sans-serif";
    for (const u of repartition.slice(0, 5)) { x.fillText(`${u.nom} : ${pct(u.part)}`, 110, yy); yy += 48; }
  }
  x.fillStyle = jaune; x.fillRect(80, 1220, 920, 4);
  x.fillStyle = papier; x.font = "64px Anton, Impact, sans-serif";
  x.fillText("L'héritage, ça se décide", 80, 1300);
  return c.toDataURL("image/png");
}

export function monterPartage() {
  document.addEventListener("reforme", (e) => { reforme = e.detail; });
  document.addEventListener("repartition", (e) => { repartition = e.detail; });
  const dlg = document.getElementById("fenetre");
  document.getElementById("partager").addEventListener("click", async () => {
    await document.fonts?.ready;
    const url = dessinerImage();
    document.getElementById("apercu").src = url;
    const lien = document.getElementById("telecharger");
    lien.href = url;
    lien.click();
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
