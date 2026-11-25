// Interface du jeu : rendu, glisser-déposer des cartes, fenêtres pédagogiques.
import { nouvellePartie, partVous, runway, jauges, feve } from './etat.js';
import { piocher, jouer, apercu, decrypter } from './moteur.js';
import { cascade } from './captable.js';
import { contenus, lignesTermSheet } from './contenus/fr/index.js';
import { terme } from './contenus/fr/lexique.js';
import { euros, eurosPrecis, pct, nombre, mois } from './contenus/fr/format.js';
import { portrait } from './portraits.js';
import { ICONES } from './icones.js';
import { galette } from './galette.js';

const $ = (id) => document.getElementById(id);
const stock = {
  lire(k) { try { return localStorage.getItem(k); } catch { return null; } },
  ecrire(k, v) { try { localStorage.setItem(k, v); } catch { /* navigation privée */ } },
};
const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;

let e;
let carte;
let prof = stock.lire('dilution-prof') === '1';
let occupe = false;
let derniereEntreeVue = 0;

const points = (x) => `${x > 0 ? '+' : '−'}${pct(Math.abs(x)).replace(' %', '')} pt`;
const texteRiche = (t) => (typeof t === 'function' ? t(e) : t ?? '')
  .replace(/\[\[([a-z]+)\|([^\]]+)\]\]/g, '<button type="button" class="terme" data-terme="$1">$2</button>');
const libelle = (l) => (typeof l === 'function' ? l(e) : l);

// ───────── Démarrage ─────────

function demarrer() {
  e = nouvellePartie();
  contenus.debut(e);
  derniereEntreeVue = 0;
  construireJauges();
  suivante();
}

function suivante() {
  carte = piocher(e, contenus, Math.random);
  occupe = false;
  rendre();
  if (e.fin) afficherFin();
}

// ───────── Jauges ─────────

const NOMS_JAUGES = [['tresorerie', 'Trésorerie'], ['equipe', 'Équipe'], ['produit', 'Produit'], ['investisseurs', 'Investisseurs']];

function construireJauges() {
  $('jauges').innerHTML = `${NOMS_JAUGES.map(([k, n]) => `
    <div class="jauge" data-jauge="${k}" role="meter" aria-label="${n}" aria-valuemin="0" aria-valuemax="100">
      <i class="apercu"></i>${ICONES[k]}
      <div class="tube"><i></i></div><span class="nom">${n}</span>
    </div>`).join('')}
    <button type="button" class="jauge-galette" id="galette" title="Votre part du capital. La fève indique qui contrôle le board.">
      <i class="apercu"></i><span class="dessin"></span>
      <span><span class="chiffre" id="part"></span><span class="legende">votre part<br>de la galette</span></span>
    </button>`;
  $('galette').addEventListener('click', ouvrirJournal);
}

function rendreJauges() {
  const g = jauges(e);
  for (const [k] of NOMS_JAUGES) {
    const el = document.querySelector(`[data-jauge="${k}"]`);
    el.querySelector('.tube i').style.height = `${g[k]}%`;
    el.classList.toggle('basse', g[k] < 22);
    el.setAttribute('aria-valuenow', Math.round(g[k]));
  }
  const parts = ordreTable().map((d) => ({ id: d.id, categorie: d.categorie, pct: d.actions / totalActions() }));
  $('galette').querySelector('.dessin').innerHTML = galette(parts, { taille: innerWidth < 900 ? 52 : 92, feve: feve(e) === 'investisseurs' ? 'investisseurs' : 'vous' });
  const p = $('part');
  const nouveau = pct(partVous(e));
  if (p.textContent && p.textContent !== nouveau && !reduit) { p.classList.remove('bouge'); void p.offsetWidth; p.classList.add('bouge'); }
  p.textContent = nouveau;
}

function montrerApercu(cote) {
  const zone = $('jauges');
  zone.querySelectorAll('.apercu').forEach((a) => a.classList.remove('on', 'petit'));
  if (!cote || !carte) return;
  const a = apercu(e, carte, cote);
  for (const [k] of NOMS_JAUGES) {
    if (!a[k]) continue;
    const dot = zone.querySelector(`[data-jauge="${k}"] .apercu`);
    dot.classList.add('on');
    if (a[k] === 1) dot.classList.add('petit');
  }
  const montrerPart = a.part || (prof && (Math.abs(a.partReelle) > 0.0005 || a.differee));
  if (montrerPart) $('galette').querySelector('.apercu').classList.add('on');
}

// ───────── Colonne de droite ─────────

const totalActions = () => e.table.reduce((s, d) => s + d.actions, 0);
function ordreTable() {
  const rang = (d) => (d.id === 'vous' ? 0 : d.categorie === 'fondateur' ? 1 : d.categorie === 'esop' ? 2 : 3);
  return [...e.table].filter((d) => d.actions > 0).sort((a, b) => rang(a) - rang(b) || b.actions - a.actions);
}
const couleur = (d) => (d.id === 'vous' ? 'var(--galette)' : d.categorie === 'fondateur' ? 'var(--galette-2)' : d.categorie === 'esop' ? 'var(--part-esop)' : 'var(--part-inv)');

function decrirePref(p) {
  return `préférence ${String(p.multiple).replace('.', ',')}x ${p.participatif ? (p.plafond ? `participative (plafond ${p.plafond}x)` : 'participative') : 'non participative'} sur ${euros(p.investi)}`;
}

function rendreTable() {
  const T = totalActions();
  $('captable').innerHTML = ordreTable().map((d) => `
    <li class="${d.id === 'vous' ? 'vous' : ''}"><i class="pastille" style="background:${couleur(d)}"></i>
      <span>${d.nom}${d.pref ? `<span class="pref">${decrirePref(d.pref)}</span>` : ''}</span>
      <span class="pct">${pct(d.actions / T)}</span></li>`).join('')
    + e.notes.map((n) => `
    <li class="attente"><i class="pastille" style="background:var(--part-inv)"></i>
      <span>${n.nom}<span class="pref">${euros(n.montant)} en attente de conversion${n.plafondValo ? `, plafond ${euros(n.plafondValo)}` : ''}</span></span>
      <span class="pct">0,0 %</span></li>`).join('');

  const r = runway(e);
  $('kpis').innerHTML = [
    ['Trésorerie', euros(e.tresorerie)],
    ['Runway', mois(r)],
    ['MRR', euros(e.mrr)],
    ['Burn mensuel', euros(e.burn + (e.dette?.mensualite ?? 0))],
    ...(e.derniere ? [['Dernière post-money', euros(e.derniere.postMoney)]] : []),
    ...(e.encaisse ? [['Déjà encaissé', euros(e.encaisse)]] : []),
  ].map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');

  const b = e.board;
  const f = feve(e);
  $('board').innerHTML = `${'<i class="siege f"></i>'.repeat(b.fondateurs)}${'<i class="siege i"></i>'.repeat(b.investisseurs)}${'<i class="siege n"></i>'.repeat(b.independants)}
    <span>&nbsp;${f === 'vous' ? 'la fève est à vous : vous contrôlez le board' : f === 'partage' ? "égalité : l'indépendant fait la majorité" : 'les investisseurs ont la majorité du board'}</span>`;
}

// ───────── La carte ─────────

function etapeEnCours() {
  if (e.levee) return `Levée ${contenus.cadre.etapes[e.levee.etapeCible]} en cours`;
  return e.etape === 0 ? 'Pré-seed' : `Après la ${contenus.cadre.etapes[e.etape]}`;
}

function corpsCarte() {
  if (carte.type === 'offre') {
    const o = carte.offre;
    const lignes = lignesTermSheet(o).map((l) => `<tr><th>${l.cle}</th><td>${prof && l.piege ? `<span class="piege">${l.val}</span>` : l.val}</td></tr>`).join('');
    return `<p class="ts-titre">Term sheet, strictement confidentielle</p>
      <p class="ts-fonds">${o.nom}${o.negociee ? ' <span class="ts-petit">après négociation</span>' : ''}</p>
      <table class="ts">${lignes}</table><p class="ts-petit">${texteRiche(carte.texte)}</p>`;
  }
  if (carte.type === 'sortie') {
    return `<p class="ts-titre">Offre de rachat${carte.sortie.acquihire ? ' (acqui-hire)' : ''}</p><p class="prix-sortie">${euros(carte.sortie.prix)}</p><p>${texteRiche(carte.texte)}</p>`;
  }
  return `<p>${texteRiche(carte.texte)}</p>`;
}

function rendre() {
  $('calendrier').innerHTML = `<strong>Mois ${e.mois}</strong>${etapeEnCours()}`;
  rendreJauges();
  rendreTable();
  if (!carte) return;
  const r = contenus.roles[carte.qui] ?? contenus.roles.marche;
  $('qui').innerHTML = `${portrait(carte.qui, 58)}<div><strong>${r.nom}</strong><span>${r.role}</span></div>`;
  const el = $('carte');
  // La nouvelle carte apparaît directement au centre, sans revenir de là où l'ancienne est partie.
  el.className = `carte sans-transition${carte.info ? ' info' : ''}`;
  el.style.transform = '';
  el.style.opacity = '';
  void el.offsetWidth;
  el.classList.remove('sans-transition');
  const g = libelle(carte.g.label);
  const d = libelle(carte.d.label);
  el.innerHTML = `<div class="bandeau-choix gauche">${g}</div><div class="bandeau-choix droite">${d}</div><div class="contenu">${corpsCarte()}</div>`;
  $('btn-g').innerHTML = carte.info ? '' : `<kbd>←</kbd> ${g}`;
  $('btn-d').innerHTML = carte.info ? `${d} <kbd>→</kbd>` : `${d} <kbd>→</kbd>`;
  $('btn-g').hidden = !!carte.info;

  const outils = [];
  if (carte.type === 'offre') outils.push('<button class="outil" type="button" data-action="decrypter">Décrypter cette offre</button>');
  if (carte.type === 'sortie') outils.push('<button class="outil" type="button" data-action="sortie">Qui toucherait quoi ?</button>');
  if (carte.calcul) outils.push('<button class="outil" type="button" data-action="calcul">Voir le calcul</button>');
  $('outils').innerHTML = outils.join('');
  rendrePourquoi();
  montrerApercu(null);
}

// Le ruban « Pourquoi ? » : la dernière variation de votre part.
function rendrePourquoi() {
  const entrees = e.journal.filter((j) => j.type === 'dilution' && Math.abs(j.apres - j.avant) > 0.0005);
  const z = $('pourquoi');
  if (!entrees.length) { z.hidden = true; return; }
  const j = entrees[entrees.length - 1];
  const delta = j.apres - j.avant;
  z.hidden = false;
  z.innerHTML = `<b class="${delta > 0 ? 'hausse' : ''}">${points(delta)}</b><span>${j.titre}. <span class="lien" role="button" tabindex="0">Pourquoi ?</span></span>`;
  z.onclick = () => (j.calcul ? ouvrirCalcul(j.calcul, j) : ouvrirJournal());
}

// ───────── Choisir ─────────

function choisir(cote) {
  if (occupe || !carte || e.fin) return;
  if (carte.info) cote = 'droite';
  occupe = true;
  const el = $('carte');
  const sens = cote === 'gauche' ? -1 : 1;
  el.classList.add('sortie-anim');
  el.style.transform = `translateX(${sens * 520}px) rotate(${sens * 18}deg)`;
  el.style.opacity = '0';
  setTimeout(() => {
    el.classList.remove('sortie-anim');
    jouer(e, carte, cote, Math.random);
    suivante();
  }, reduit ? 0 : 260);
}

function brancherGlisser() {
  const el = $('carte');
  let x0 = null;
  let dx = 0;
  el.addEventListener('pointerdown', (ev) => {
    if (occupe || ev.target.closest('button') || ev.button > 0) return;
    x0 = ev.clientX; dx = 0;
    el.setPointerCapture(ev.pointerId);
    el.classList.add('drag');
  });
  el.addEventListener('pointermove', (ev) => {
    if (x0 === null) return;
    dx = ev.clientX - x0;
    if (carte?.info) dx = Math.max(0, dx);
    el.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`;
    const g = el.querySelector('.bandeau-choix.gauche');
    const d = el.querySelector('.bandeau-choix.droite');
    g.style.opacity = dx < 0 ? Math.min(0.95, -dx / 90) : 0;
    d.style.opacity = dx > 0 ? Math.min(0.95, dx / 90) : 0;
    montrerApercu(Math.abs(dx) > 24 ? (dx < 0 ? 'gauche' : 'droite') : null);
  });
  const fin = () => {
    if (x0 === null) return;
    x0 = null;
    el.classList.remove('drag');
    if (Math.abs(dx) > 110) choisir(dx < 0 ? 'gauche' : 'droite');
    else {
      el.style.transform = '';
      el.querySelectorAll('.bandeau-choix').forEach((b) => { b.style.opacity = 0; });
      montrerApercu(null);
    }
  };
  el.addEventListener('pointerup', fin);
  el.addEventListener('pointercancel', fin);

  for (const [id, cote] of [['btn-g', 'gauche'], ['btn-d', 'droite']]) {
    const b = $(id);
    b.addEventListener('click', () => choisir(cote));
    b.addEventListener('pointerenter', () => montrerApercu(cote));
    b.addEventListener('focus', () => montrerApercu(cote));
    b.addEventListener('pointerleave', () => montrerApercu(null));
    b.addEventListener('blur', () => montrerApercu(null));
  }
  addEventListener('keydown', (ev) => {
    if ($('fenetre').open || ev.altKey || ev.ctrlKey || ev.metaKey) return;
    if (ev.key === 'ArrowLeft' && !carte?.info) choisir('gauche');
    if (ev.key === 'ArrowRight') choisir('droite');
  });
}

// ───────── Fenêtres ─────────

function ouvrir(html, { large = false } = {}) {
  const f = $('fenetre');
  f.classList.toggle('large', large);
  $('fenetre-contenu').innerHTML = html;
  if (!f.open) f.showModal();
  f.querySelector('.fenetre-corps').scrollTop = 0;
}

function etapesCalcul(d) {
  const o = d.offre;
  const nouvelles = o.montant / d.prix;
  const etapes = [];
  etapes.push(`<b>Avant la levée.</b> L'entreprise compte ${nombre(d.actionsAvant)} actions. Vous en détenez ${pct(d.avant)}.`);
  if (d.ajoutPool > 0 && o.poolPreMoney) {
    etapes.push(`<b>Le pool BSPCE est créé avant la levée.</b> Pour qu'il pèse ${pct(o.poolCible, 0)} après la levée, on crée ${nombre(d.ajoutPool)} actions. Seuls les actionnaires actuels en paient le prix.
      <div class="formule">pré-money effective = ${euros(o.preMoney)} − valeur du pool ${euros(d.valeurPool)} = <span class="piege">${euros(d.preMoneyEffective)}</span></div>`);
  }
  etapes.push(`<b>Le prix par action.</b>
    <div class="formule">${euros(o.preMoney)} ÷ ${nombre(d.actionsAvant + (o.poolPreMoney ? d.ajoutPool : 0))} actions = <span class="surligne">${eurosPrecis(d.prix)} par action</span></div>`);
  etapes.push(`<b>Les actions du fonds.</b>
    <div class="formule">${euros(o.montant)} ÷ ${eurosPrecis(d.prix)} = ${nombre(nouvelles)} actions <em>soit ${pct(d.partInvestisseur)} du capital après la levée</em></div>`);
  for (const c of d.conversions) {
    const parPlafond = c.prixPlafond !== null && c.prixPlafond < c.prixDecote;
    etapes.push(`<b>${c.nom} se convertit.</b> Prix décoté : ${eurosPrecis(d.prix)} × ${pct(1 - c.decote, 0)} = ${eurosPrecis(c.prixDecote)}.${c.prixPlafond !== null ? ` Prix plafond : ${euros(c.plafondValo)} ÷ ${nombre(d.actionsAvant)} actions = ${eurosPrecis(c.prixPlafond)}.` : ''} On retient le plus bas${parPlafond ? ', le plafond' : ', la décote'}.
      <div class="formule">${euros(c.montant)} ÷ ${eurosPrecis(c.prix)} = <span class="piege">${nombre(c.actions)} actions</span>${parPlafond ? ` <em>${(c.prixDecote / c.prix).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} fois plus qu'avec la seule décote</em>` : ''}</div>`);
  }
  for (const a of d.ajustements) {
    etapes.push(`<b>L'anti-dilution de ${a.nom} se déclenche</b> (${a.mode === 'ratchet' ? 'ratchet total' : 'moyenne pondérée'}) : le prix baisse par rapport à sa levée, il reçoit gratuitement des actions en plus.
      <div class="formule"><span class="piege">+ ${nombre(a.actionsAjoutees)} actions</span> <em>payées par tous les autres actionnaires</em></div>`);
  }
  etapes.push(`<b>Votre part.</b>
    <div class="formule">${pct(d.avant)} <em>avant</em> → <span class="surligne">${pct(d.apres)}</span> <em>après. Une règle de trois sur ${euros(o.montant)} pour ${euros(o.preMoney + o.montant)} post-money promettait ${pct(d.partNaive)}.</em></div>`);
  return `<ol class="etapes">${etapes.map((x) => `<li><div>${x}</div></li>`).join('')}</ol>`;
}

function tableauVente(d) {
  return `<table class="compare"><thead><tr><th>Prix de vente</th><th>Votre % × prix</th><th>Ce que vous touchez</th><th>Ce que touche ${d.offre.nom}</th></tr></thead><tbody>
    ${d.scenarios.map((s) => `<tr><td>${euros(s.prix)}</td><td>${euros(s.naif)}</td><td class="${s.reel < s.naif * 0.97 ? 'ecart' : ''}">${euros(s.reel)}</td><td>${euros(s.investisseur)} <span class="note">(${s.modeInvestisseur})</span></td></tr>`).join('')}
  </tbody></table>
  <p class="note" style="margin-top:14px">« Votre % × prix » est ce qu'on imagine en regardant la cap table. La cascade réelle sert d'abord les préférences de liquidation.</p>`;
}

function ouvrirDecrypter(onglet = 'signez') {
  const d = decrypter(e, carte.offre);
  const lignes = lignesTermSheet(carte.offre).map((l) => {
    const t = l.terme ? terme(l.terme) : null;
    return `<div class="${l.piege ? 'piege-ligne' : ''}"><dt>${l.cle} : ${l.val}</dt>${t ? `<dd class="explique">${t.definition} ${l.piege ? `<b>Le piège :</b> ${t.piege}` : ''} <button type="button" class="lien" data-terme="${t.id}">Lexique</button></dd>` : ''}</div>`;
  }).join('');
  const contenu = { signez: `<dl class="lignes-ts">${lignes}</dl>`, calcul: etapesCalcul(d), vente: tableauVente(d) }[onglet];
  ouvrir(`<h2>Décrypter l'offre de ${carte.offre.nom}</h2>
    <p class="sous">Ce que la term sheet annonce, et ce qu'elle fait vraiment à votre part : ${pct(d.avant)} → ${pct(d.apres)}.</p>
    <div class="onglets" role="tablist">
      ${[['signez', 'Ce que vous signez'], ['calcul', 'Le calcul'], ['vente', 'À la vente']].map(([k, n]) => `<button role="tab" type="button" data-onglet="${k}" aria-selected="${k === onglet}">${n}</button>`).join('')}
    </div>${contenu}`);
}

function ouvrirCalcul(calcul, entree) {
  ouvrir(`<h2>${entree?.titre ?? 'Le calcul'}</h2><p class="sous">Mois ${entree?.mois ?? e.mois}. Le calcul pas à pas, avec vos chiffres.</p>${etapesCalcul(calcul)}
    <h3 style="font:800 18px var(--titre);margin:18px 0 10px">Et à la vente ?</h3>${tableauVente(calcul)}`);
}

function tableauCascade(prix) {
  const c = cascade(e.table, prix).filter((x) => x.montant > 0 || x.pct > 0).sort((a, b) => b.montant - a.montant);
  return `<table class="compare"><thead><tr><th>Actionnaire</th><th>% du capital</th><th>Mode</th><th>Touche</th></tr></thead><tbody>
    ${c.map((x) => `<tr><td>${x.id === 'vous' ? '<b>Vous</b>' : x.nom}</td><td>${pct(x.pct)}</td><td>${x.mode}</td><td>${euros(x.montant)}</td></tr>`).join('')}</tbody></table>`;
}

function ouvrirSortie() {
  const s = carte.sortie;
  const v = cascade(e.table, s.prix).find((x) => x.id === 'vous');
  ouvrir(`<h2>Si vous vendez à ${s.acheteur} pour ${euros(s.prix)}</h2>
    <p class="sous">Vous détenez ${pct(v.pct)}, soit ${euros(v.pct * s.prix)} sur le papier. La cascade de liquidation vous donne <b>${euros(v.montant)}</b>.</p>
    ${tableauCascade(s.prix)}
    <p class="note" style="margin-top:14px">Chaque investisseur choisit le plus avantageux pour lui : récupérer sa préférence, ou convertir en actions ordinaires et prendre son pourcentage. <button type="button" class="lien" data-terme="cascade">Lexique : la cascade</button></p>`);
}

function ouvrirJournal() {
  const entrees = [...e.journal].reverse();
  ouvrir(`<h2>Journal</h2><p class="sous">Tout ce qui a changé votre part, et les clauses que vous avez signées.</p>
    ${entrees.length ? `<ul class="journal">${entrees.map((j, i) => {
      const delta = j.type === 'dilution' ? j.apres - j.avant : 0;
      return `<li><span class="m">Mois ${j.mois}</span><div><b>${j.titre}${j.cachee ? '<span class="etiquette-cachee">dilution à venir</span>' : ''}</b>${j.texte ? `<span>${j.texte}</span>` : ''}
        ${j.calcul ? ` <button type="button" class="lien" data-journal="${e.journal.length - 1 - i}">Voir le calcul</button>` : ''}
        ${j.terme ? ` <button type="button" class="lien" data-terme="${j.terme}">Lexique</button>` : ''}</div>
        <span class="delta ${delta < 0 ? 'baisse' : delta > 0 ? 'hausse' : ''}">${Math.abs(delta) > 0.0005 ? points(delta) : ''}</span></li>`;
    }).join('')}</ul>` : '<p>Rien encore. Signez quelque chose.</p>'}`);
}

function ouvrirLexique(id = 'dilution') {
  const t = terme(id) ?? contenus.lexique[0];
  const frise = t.frise ? `<div class="frise-vesting"><span style="flex:12;background:var(--stabilo-rose)">cliff : 0 %</span><span style="flex:36;background:linear-gradient(90deg,var(--stabilo),var(--galette))">puis 1/48 par mois jusqu'à 100 %</span></div>` : '';
  ouvrir(`<h2>Lexique</h2><p class="sous">Les mots des term sheets, expliqués simplement.</p>
    <nav class="lexique-nav">${contenus.lexique.map((x) => `<button type="button" data-terme="${x.id}" aria-current="${x.id === t.id}">${x.terme}</button>`).join('')}</nav>
    <div class="definition"><h3>${t.terme}</h3><p>${t.definition}</p>${frise}<p class="ex"><b>Exemple :</b> ${t.exemple}</p><p class="piege-texte"><b>Le piège :</b> ${t.piege}</p></div>`);
}

// ───────── Écran de fin ─────────

function film() {
  const h = e.historique;
  const W = 440; const H = 200; const g = 40; const max = Math.max(...h.map((x) => x.part), 0.01);
  const X = (m) => g + ((W - g - 10) * m) / Math.max(1, e.mois);
  const Y = (p) => 20 + (150 * (1 - p / max));
  let d = `M${X(0)} ${Y(h[0].part)}`;
  for (const pt of h.slice(1)) d += `H${X(pt.mois).toFixed(1)}V${Y(pt.part).toFixed(1)}`;
  const marques = e.journal.map((j, i) => ({ j, i })).filter(({ j }) => j.type === 'dilution' && Math.abs(j.apres - j.avant) > 0.002);
  const grad = [0, max / 2, max].map((p) => `<path d="M${g} ${Y(p)}H${W - 10}" stroke="var(--trait)"/><text x="0" y="${Y(p) + 4}">${pct(p, 0)}</text>`).join('');
  return `<svg class="film" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Votre part du capital au fil des mois">${grad}
    <path d="${d}H${X(e.mois)}" stroke="var(--galette-croute)" stroke-width="3" fill="none"/>
    ${marques.map(({ j, i }) => `<g class="point" tabindex="0" role="button" data-journal="${i}" aria-label="${j.titre}"><circle cx="${X(j.mois)}" cy="${Y(j.apres)}" r="6" fill="var(--papier)" stroke="var(--encre)" stroke-width="2"/><title>${j.titre} : ${points(j.apres - j.avant)}</title></g>`).join('')}
    <text x="${g}" y="${H - 4}">mois 0</text><text x="${W - 60}" y="${H - 4}">mois ${e.mois}</text></svg>`;
}

function afficherFin() {
  const f = e.fin;
  const t = contenus.fins[f.type]({ ...f, mois: e.mois });
  const pctVous = partVous(e);
  const vente = f.prix > 0;
  const c = vente ? [...f.cascade].filter((x) => x.montant > 0).sort((a, b) => b.montant - a.montant) : [];
  const max = c[0]?.montant || 1;
  const clauses = e.journal.filter((j) => j.type === 'clause' || (j.type === 'dilution' && j.calcul));
  const record = Number(stock.lire('dilution-record') || 0);
  if (f.reel > record) stock.ecrire('dilution-record', String(Math.round(f.reel)));
  ouvrir(`<div class="fin">
    <h2>${t.titre}</h2><p style="color:var(--encre-douce)">${t.texte}</p>
    <div class="verdict">
      <div class="${vente && f.reel < (pctVous * f.prix + f.encaisse) * 0.97 ? 'naif' : ''}"><span class="montant">${euros(vente ? pctVous * f.prix + f.encaisse : 0)}</span><p>${vente ? `Ce que vous pensiez toucher : ${pct(pctVous)} de ${euros(f.prix)}${f.encaisse ? ', plus votre vente secondaire' : ''}.` : 'Ce que valent vos actions.'}</p></div>
      <div><span class="montant">${euros(f.reel)}</span><p>${vente ? (f.reel < (pctVous * f.prix + f.encaisse) * 0.97 ? `Ce que vous touchez vraiment, après ${euros(f.preferences)} de préférences de liquidation.` : `Ce que vous touchez vraiment. À ce prix, les investisseurs ont préféré convertir leurs ${euros(f.preferences)} de préférences : pas d'écart, cette fois.`) : f.encaisse ? 'Seule votre vente secondaire vous reste.' : 'Rien. Mais vous avez appris ce qu’est une préférence de liquidation.'}${record && f.reel > record ? ' Nouveau record !' : ''}</p></div>
    </div>
    <div class="fin-grille">
      <div><h3>Le film de la dilution</h3>${film()}<p class="note">Cliquez sur un point pour revoir le calcul de chaque chute.</p></div>
      <div>${vente ? `<h3>Qui touche quoi sur ${euros(f.prix)}</h3><div class="cascade">${c.map((x) => `
        <div class="ligne"><span>${x.id === 'vous' ? '<b>Vous</b>' : x.nom}</span><i class="barre ${x.id === 'vous' ? 'vous' : x.categorie === 'esop' ? 'esop' : ''}" style="width:${Math.max(2, (x.montant / max) * 100)}%;${x.categorie === 'fondateur' && x.id !== 'vous' ? 'background:var(--galette-2)' : ''}"></i><span class="val">${euros(x.montant)}</span>${x.mode !== 'ordinaire' ? `<span class="mode">${x.mode}</span>` : ''}</div>`).join('')}</div>` : `<h3>La table au moment de la fin</h3>${tableauCascade(0).replace(/<th>Mode<\/th><th>Touche<\/th>/, '<th>Mode</th><th>Touche</th>')}`}</div>
    </div>
    <div class="clauses"><h3>Ce que vous avez signé</h3>${clauses.length ? `<ul>${clauses.map((j) => `<li>Mois ${j.mois} : ${j.titre}</li>`).join('')}</ul>` : '<p>Rien du tout. Prudent.</p>'}</div>
    <p class="actions"><button class="bouton-plein" type="button" data-action="rejouer">Rejouer</button><button class="outil discret" type="button" data-action="journal">Ouvrir le journal complet</button></p>
  </div>`, { large: true });
}

// ───────── Délégation des clics ─────────

document.addEventListener('click', (ev) => {
  const t = ev.target.closest('[data-terme],[data-action],[data-onglet],[data-journal],[data-fermer]');
  if (!t) return;
  if (t.dataset.fermer !== undefined) { $('fenetre').close(); return; }
  if (t.dataset.terme) ouvrirLexique(t.dataset.terme);
  else if (t.dataset.onglet) ouvrirDecrypter(t.dataset.onglet);
  else if (t.dataset.journal) {
    const j = e.journal[Number(t.dataset.journal)];
    if (j.calcul) ouvrirCalcul(j.calcul, j); else ouvrirJournal();
  } else if (t.dataset.action === 'decrypter') ouvrirDecrypter();
  else if (t.dataset.action === 'sortie') ouvrirSortie();
  else if (t.dataset.action === 'calcul') ouvrirCalcul(carte.calcul, { titre: 'Le calcul de cette levée', mois: e.mois });
  else if (t.dataset.action === 'journal') ouvrirJournal();
  else if (t.dataset.action === 'rejouer') { $('fenetre').close(); demarrer(); }
});
document.addEventListener('keydown', (ev) => {
  if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches('.film .point, .pourquoi .lien')) { ev.preventDefault(); ev.target.click(); }
});
$('fenetre').addEventListener('click', (ev) => { if (ev.target === $('fenetre')) $('fenetre').close(); });
$('fenetre').addEventListener('close', () => { if (e?.fin && !$('fenetre').dataset.rejoue) { /* la partie reste affichée, on peut rouvrir la fin */ } });

$('btn-journal').addEventListener('click', () => (e.fin ? afficherFin() : ouvrirJournal()));
$('btn-lexique').addEventListener('click', () => ouvrirLexique('dilution'));
const btnProf = $('btn-prof');
btnProf.setAttribute('aria-pressed', String(prof));
btnProf.addEventListener('click', () => {
  prof = !prof;
  btnProf.setAttribute('aria-pressed', String(prof));
  stock.ecrire('dilution-prof', prof ? '1' : '0');
  rendre();
});
addEventListener('resize', () => rendreJauges());

brancherGlisser();
demarrer();

// Accès pour les tests de bout en bout.
window.__dilution = { etat: () => e, carte: () => carte, choisir };
