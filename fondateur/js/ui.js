// Interface du jeu : la situation, les cartes de choix, la table des offres et les fenêtres pédagogiques.
import { nouvellePartie, partVous, runway, jauges, feve } from './etat.js';
import { piocher, jouer, apercu, decrypter, options, agirLevee, composerTour, SEUIL_SUIVEUR } from './moteur.js';
import { cascade } from './captable.js';
import { contenus, lignesTermSheet, ACCROCHES, ISSUES_NEGO, semaines } from './contenus/fr/index.js';
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

let e;
let carte;
let prof = stock.lire('dilution-prof') === '1';
let selection = []; // offres choisies pendant une levée, le chef de file en premier
let appris = stock.lire('dilution-glisse') === '1'; // le joueur a déjà tiré une carte : plus besoin d'aide
let voirChoix = false; // « Afficher les choix » demandé pour la carte en cours

const points = (x) => `${x > 0 ? '+' : '−'}${pct(Math.abs(x)).replace(' %', '')} pt`;
const texteRiche = (t) => (typeof t === 'function' ? t(e) : t ?? '')
  .replace(/\[\[([a-z]+)\|([^\]]+)\]\]/g, '<button type="button" class="terme" data-terme="$1">$2</button>');
const libelle = (l) => (typeof l === 'function' ? l(e) : l);

// ───────── Démarrage ─────────

function demarrer() {
  e = nouvellePartie();
  contenus.debut(e);
  construireJauges();
  suivante();
}

function suivante() {
  carte = piocher(e, contenus, Math.random);
  selection = [];
  voirChoix = false;
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
    <button type="button" class="jauge-galette" id="galette" title="Votre part du capital. La fève indique qui contrôle le board. Cliquez pour le tableau de bord.">
      <i class="apercu"></i><span class="dessin"></span>
      <span><span class="chiffre" id="part"></span><span class="legende">votre part<br>de la galette</span></span>
    </button>`;
  $('galette').addEventListener('click', ouvrirTableau);
}

const totalActions = () => e.table.reduce((s, d) => s + d.actions, 0);
function ordreTable() {
  const rang = (d) => (d.id === 'vous' ? 0 : d.categorie === 'fondateur' ? 1 : d.categorie === 'esop' ? 2 : 3);
  return [...e.table].filter((d) => d.actions > 0).sort((a, b) => rang(a) - rang(b) || b.actions - a.actions);
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
  $('galette').querySelector('.dessin').innerHTML = galette(parts, { taille: innerWidth < 900 ? 52 : 84, feve: feve(e) === 'investisseurs' ? 'investisseurs' : 'vous' });
  const p = $('part');
  const nouveau = pct(partVous(e));
  if (p.textContent && p.textContent !== nouveau) { p.classList.remove('bouge'); void p.offsetWidth; p.classList.add('bouge'); }
  p.textContent = nouveau;
}

function montrerApercu(index) {
  const zone = $('jauges');
  zone.querySelectorAll('.apercu').forEach((a) => a.classList.remove('on', 'petit'));
  if (index === null || !carte || carte.type === 'levee') return;
  const a = apercu(e, carte, index);
  for (const [k] of NOMS_JAUGES) {
    if (!a[k]) continue;
    const dot = zone.querySelector(`[data-jauge="${k}"] .apercu`);
    dot.classList.add('on');
    if (a[k] === 1) dot.classList.add('petit');
  }
  if (a.part || (prof && (Math.abs(a.partReelle) > 0.0005 || a.differee))) $('galette').querySelector('.apercu').classList.add('on');
}

// ───────── Rendu de la situation ─────────

function etapeEnCours() {
  if (e.levee) return `Levée ${contenus.cadre.etapes[e.levee.etapeCible]} en cours`;
  return e.etape === 0 ? 'Pré-seed' : `Après la ${contenus.cadre.etapes[e.etape]}`;
}

function corpsCarte() {
  const cause = carte.cause ? `<p class="cause">Suite de votre choix : ${carte.cause.charAt(0).toLowerCase()}${carte.cause.slice(1)}.</p>` : '';
  return cause + corpsSansCause();
}

function corpsSansCause() {
  if (carte.type === 'sortie') {
    return `<p class="ts-titre">Offre de rachat${carte.sortie.acquihire ? ' (acqui-hire)' : ''}</p><p class="prix-sortie">${euros(carte.sortie.prix)}</p><p>${texteRiche(carte.texte)}</p>`;
  }
  return `<p>${texteRiche(carte.texte)}</p>`;
}

function rendre() {
  $('calendrier').innerHTML = `<strong>Mois ${e.mois}</strong>${etapeEnCours()}`;
  rendreJauges();
  if (!carte) return;
  const r = contenus.roles[carte.qui] ?? contenus.roles.marche;
  $('qui').innerHTML = `${portrait(carte.qui, 52)}<div><strong>${r.nom}</strong><span>${r.role}</span></div>`;
  const el = $('carte');
  // La nouvelle carte apparaît directement au centre, sans revenir de là où l'ancienne est partie.
  el.className = `carte${carte.info ? ' info' : ''}`;
  el.style.transition = 'none';
  el.style.transform = '';
  el.style.opacity = '';
  void el.offsetWidth;
  el.style.transition = '';
  el.classList.add('entre');
  // La carte se tire : à gauche la première option, vers le haut l'option du milieu, à droite la dernière.
  const opts = carte.type === 'levee' ? [] : options(carte);
  const sens = sensOptions(opts.length, carte.info);
  const glissable = opts.length > 0;
  el.classList.toggle('glissable', glissable);
  el.classList.toggle('trois', opts.length === 3);
  const bandeau = (cote, fleche) => (sens[cote] !== undefined ? `<div class="bandeau-choix ${cote}" aria-hidden="true">${cote === 'gauche' ? `${fleche} ` : ''}${libelle(opts[sens[cote]].label)}${cote !== 'gauche' ? ` ${fleche}` : ''}</div>` : '');
  const indice = glissable && !appris
    ? `<p class="indice" aria-hidden="true">${opts.length === 1 ? `Tirez la carte vers la droite pour continuer.` : `Tirez la carte${['gauche', 'haut', 'droite'].filter((c) => sens[c] !== undefined).map((c) => ` ${({ gauche: 'à gauche', haut: 'vers le haut', droite: 'à droite' })[c]} pour « ${libelle(opts[sens[c]].label)} »`).join(',')}.`}</p>`
    : '';
  el.innerHTML = (glissable ? bandeau('gauche', '←') + bandeau('haut', '↑') + bandeau('droite', '→') : '') + corpsCarte() + indice;
  $('options').className = carte.type === 'levee' ? 'options levee' : 'options';
  if (carte.type === 'levee') rendreLevee();
  else {
    const fleches = Object.fromEntries(Object.entries(sens).map(([c, i]) => [i, ({ gauche: '←', haut: '↑', droite: '→' })[c]]));
    $('options').innerHTML = opts.map((o, i) => `<button type="button" class="option${opts.length === 1 ? ' seule' : ''}" data-choix="${i}"><kbd>${fleches[i] ?? i + 1}</kbd>${libelle(o.label)}</button>`).join('');
    // Une fois le geste appris, les choix ne s'affichent que sur demande.
    $('options').classList.toggle('masque', appris && !voirChoix);
  }

  const outils = [];
  if (appris && carte.type !== 'levee' && !voirChoix) outils.push('<button class="lien-discret" type="button" data-action="voir-choix">Afficher les choix</button>');
  if (carte.type === 'sortie') outils.push('<button class="outil" type="button" data-action="sortie">Qui toucherait quoi ?</button>');
  if (carte.calcul) outils.push('<button class="outil" type="button" data-action="calcul">Voir le calcul</button>');
  $('outils').innerHTML = outils.join('');
  rendrePourquoi();
  montrerApercu(null);
}

// ───────── La table des offres ─────────

function statutOffre(o) {
  const i = selection.indexOf(o.id);
  if (i === 0) return { badge: 'Chef de file' };
  if (i > 0) {
    const chef = e.levee.offres.find((x) => x.id === selection[0]);
    return chef.preMoney <= o.preMoney * SEUIL_SUIVEUR ? { badge: 'Suit le chef de file' } : { badge: 'Ne suivra pas : trop cher', non: true };
  }
  return null;
}

function rendreLevee() {
  const dernier = e.levee.messages[e.levee.messages.length - 1];
  const nego = dernier ? `<p class="nego">${ISSUES_NEGO[dernier.issue](dernier.nom)}${dernier.semaines ? ` (${semaines(dernier.semaines)} de discussions)` : ''}${e.levee.semaines ? ` Ce mois-ci, ${semaines(e.levee.semaines)} déjà passées à négocier.` : ''}</p>` : '';
  const cartes = e.levee.offres.map((o) => {
    const st = statutOffre(o);
    const lignes = lignesTermSheet(o).map((l) => `<tr><th>${l.cle}</th><td>${prof && l.piege ? `<span class="piege">${l.val}</span>` : l.val}</td></tr>`).join('');
    const r = contenus.roles[o.perso];
    return `<article class="offre${st ? ' choisie' : ''}${st?.non ? ' refuse' : ''}">
      ${st ? `<span class="badge${st.non ? ' non' : ''}">${st.badge}</span>` : ''}
      <div class="tete">${portrait(o.perso, 40)}<div><strong>${o.nom}</strong><span>${r.nom}${o.negociee ? ', après négociation' : ''}${o.dernierMot ? ', dernier mot' : ''}</span></div></div>
      <table class="ts">${lignes}</table>
      <p class="citation">${ACCROCHES[o.profil]}</p>
      <div class="actions">
        <button type="button" class="prendre" data-offre="${o.id}">${st ? 'Retirer' : selection.length ? 'Ajouter au tour' : 'Choisir comme chef de file'}</button>
        <button type="button" data-negocier="${o.id}" ${o.dernierMot ? 'disabled title="Le fonds a donné son dernier mot"' : ''}>Négocier</button>
        <button type="button" data-decrypter="${o.id}">Décrypter</button>
        <button type="button" data-ecarter="${o.id}" title="Retirer cette offre de la table, sans perdre de temps">Écarter</button>
      </div>
    </article>`;
  }).join('');

  let recap = '<p>Choisissez un fonds chef de file : il fixe la valorisation et les conditions. Les fonds ajoutés ensuite suivent au même prix avec un ticket réduit, s’ils ne trouvent pas le prix trop élevé.</p>';
  if (selection.length) {
    const c = composerTour(e, selection);
    const d = decrypter(e, c.tour);
    const post = c.tour.preMoney + c.tour.montant;
    recap = `<dl>
      <div><dt>Vous levez</dt><dd>${euros(c.tour.montant)}</dd></div>
      <div><dt>Valorisation pré-money</dt><dd>${euros(c.tour.preMoney)}</dd></div>
      <div><dt>Post-money annoncée</dt><dd>${euros(post)}</dd></div>
      <div><dt>Part des nouveaux fonds (annoncée)</dt><dd>${pct(c.tour.montant / post)}</dd></div>
      <div><dt>Runway après la levée</dt><dd>${mois((e.tresorerie + c.tour.montant) / Math.max(1, e.burn * 1.3 - e.mrr))}</dd></div>
      ${prof ? `<div><dt>Votre part réelle après (mode prof)</dt><dd class="prof">${pct(d.apres)}</dd></div>` : ''}
    </dl>
    ${c.refus.length ? `<p>${c.refus.map((o) => o.nom).join(' et ')} ne suivr${c.refus.length > 1 ? 'ont' : 'a'} pas : le chef de file valorise trop haut pour ${c.refus.length > 1 ? 'eux' : 'lui'}.</p>` : ''}`;
  }
  $('options').innerHTML = `${nego}<div class="offres">${cartes}</div>
    <div class="recap">${recap}
      <div class="boutons">
        <button type="button" class="signer" data-signer ${selection.length ? '' : 'disabled'}>${selection.length > 1 ? `Signer avec ${selection.length} fonds` : 'Signer'}</button>
        ${selection.length ? '<button type="button" class="refuser" data-decrypter-tour>Décrypter ce tour</button>' : ''}
        <button type="button" class="refuser" data-refuser title="${runway(e) < 4 ? `Sans levée, il vous reste ${mois(runway(e))} : il faudra couper fort dans les dépenses.` : 'Sans levée, il faudra réduire les dépenses ou trouver un pont.'}">Refuser toutes les offres</button>
      </div>
    </div>`;
}

// Le ruban « Pourquoi ? » : la dernière variation de votre part.
function rendrePourquoi() {
  const entrees = e.journal.filter((j) => j.type === 'dilution' && Math.abs(j.apres - j.avant) > 0.0005);
  const z = $('pourquoi');
  if (!entrees.length) { z.hidden = true; return; }
  const j = entrees[entrees.length - 1];
  const delta = j.apres - j.avant;
  z.hidden = false;
  z.className = 'pourquoi';
  z.innerHTML = `<b class="${delta > 0 ? 'hausse' : ''}">${points(delta)}</b> <span>${j.titre}. <span class="lien">Pourquoi ?</span></span>`;
  z.onclick = () => (j.calcul ? ouvrirCalcul(j.calcul, j) : ouvrirJournal());
}

// ───────── Choisir ─────────

function choisir(index) {
  if (!carte || e.fin || carte.type === 'levee') return;
  if (index >= options(carte).length) return;
  jouer(e, carte, index, Math.random);
  suivante();
}

// Tirer la carte : le bandeau du choix apparaît, et au-delà du seuil le choix est validé.
function brancherGlisser() {
  const el = $('carte');
  const SEUIL = 90;
  let x0 = null; let y0 = 0; let dx = 0; let dy = 0; let axe = null; let deplace = false;
  const sens = () => sensOptions(options(carte).length, carte.info);
  const cote = () => {
    if (axe === 'x') return Math.abs(dx) > 20 ? (dx < 0 ? 'gauche' : 'droite') : null;
    if (axe === 'y') return dy < -20 ? 'haut' : null;
    return null;
  };
  const remettre = () => {
    el.classList.remove('tire');
    el.style.transform = '';
    el.querySelectorAll('.bandeau-choix').forEach((b) => { b.style.opacity = 0; });
    montrerApercu(null);
  };
  el.addEventListener('pointerdown', (ev) => {
    const bouton = ev.target.closest('button');
    if (!el.classList.contains('glissable') || (bouton && !bouton.classList.contains('terme')) || ev.button > 0) return;
    x0 = ev.clientX; y0 = ev.clientY; dx = 0; dy = 0; axe = null; deplace = false;
  });
  el.addEventListener('pointermove', (ev) => {
    if (x0 === null) return;
    const ddx = ev.clientX - x0;
    const ddy = ev.clientY - y0;
    const s = sens();
    if (axe === null && Math.hypot(ddx, ddy) > 8) {
      if (Math.abs(ddx) > Math.abs(ddy)) axe = 'x';
      else if (ddy < 0 && s.haut !== undefined) axe = 'y';
      else { x0 = null; return; } // geste vers le bas, ou vertical sans option du haut : la page défile
      deplace = true;
      el.setPointerCapture(ev.pointerId);
      el.classList.add('tire');
    }
    if (!axe) return;
    if (axe === 'x') {
      dx = s.gauche === undefined ? Math.max(0, ddx) : ddx;
      // La carte suit le doigt avec un peu de résistance : elle reste lisible à l'écran.
      el.style.transform = `translateX(${dx * 0.55}px) rotate(${dx / 40}deg)`;
    } else {
      dy = Math.min(0, ddy);
      el.style.transform = `translateY(${dy * 0.5}px)`;
    }
    const c = cote();
    el.querySelectorAll('.bandeau-choix').forEach((b) => {
      const k = b.classList.contains('gauche') ? 'gauche' : b.classList.contains('haut') ? 'haut' : 'droite';
      const force = k === 'gauche' ? -dx : k === 'droite' ? dx : -dy;
      b.style.opacity = c === k ? Math.min(1, force / 60) : 0;
    });
    montrerApercu(c ? s[c] : null);
  });
  const lacher = () => {
    if (x0 === null) return;
    x0 = null;
    if (!axe) return;
    const force = axe === 'x' ? Math.abs(dx) : -dy;
    const c = cote();
    if (force > SEUIL && c && sens()[c] !== undefined) {
      const index = sens()[c];
      el.classList.remove('tire');
      el.classList.add('part');
      el.style.transform = c === 'haut' ? 'translateY(-60%)' : `translateX(${c === 'gauche' ? -120 : 120}%) rotate(${c === 'gauche' ? -14 : 14}deg)`;
      el.style.opacity = '0';
      if (!appris) { appris = true; stock.ecrire('dilution-glisse', '1'); }
      setTimeout(() => { el.classList.remove('part'); choisir(index); }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 220);
    } else remettre();
  };
  el.addEventListener('pointerup', lacher);
  el.addEventListener('pointercancel', () => { x0 = null; remettre(); });
  // Un geste parti d'un mot du lexique ne doit pas ouvrir le lexique en plus.
  el.addEventListener('click', (ev) => { if (deplace) { ev.stopPropagation(); ev.preventDefault(); deplace = false; } }, true);
}

function actionLevee(action) {
  const garde = action.type === 'signer' || action.type === 'refuser' ? [] : selection;
  agirLevee(e, action, Math.random);
  suivante();
  if (carte?.type === 'levee') {
    selection = garde.filter((id) => e.levee.offres.some((o) => o.id === id));
    rendreLevee();
  }
}

// Quelle direction pour quelle option : gauche la première, haut celle du milieu, droite la dernière.
function sensOptions(n) {
  if (n === 1) return { droite: 0 };
  if (n === 2) return { gauche: 0, droite: 1 };
  if (n === 3) return { gauche: 0, haut: 1, droite: 2 };
  return {};
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
  const etapes = [];
  const participants = o.participants ?? [{ nom: o.nom, montant: o.montant }];
  etapes.push(`<b>Avant la levée.</b> L'entreprise compte ${nombre(d.actionsAvant)} actions. Vous en détenez ${pct(d.avant)}.`);
  if (d.ajoutPool > 0 && o.poolPreMoney) {
    etapes.push(`<b>Le pool BSPCE est créé avant la levée.</b> Pour qu'il pèse ${pct(o.poolCible, 0)} après la levée, on crée ${nombre(d.ajoutPool)} actions. Seuls les actionnaires actuels en paient le prix.
      <div class="formule">pré-money effective = ${euros(o.preMoney)} − valeur du pool ${euros(d.valeurPool)} = <span class="piege">${euros(d.preMoneyEffective)}</span></div>`);
  }
  etapes.push(`<b>Le prix par action.</b>
    <div class="formule">${euros(o.preMoney)} ÷ ${nombre(d.actionsAvant + (o.poolPreMoney ? d.ajoutPool : 0))} actions = <span class="surligne">${eurosPrecis(d.prix)} par action</span></div>`);
  etapes.push(`<b>Les actions des fonds.</b>${participants.length > 1 ? ` ${participants[0].nom} mène le tour ; les autres suivent au même prix.` : ''}
    ${participants.map((p) => `<div class="formule">${p.nom} : ${euros(p.montant)} ÷ ${eurosPrecis(d.prix)} = ${nombre(p.montant / d.prix)} actions</div>`).join('')}
    <div class="formule"><em>ensemble : ${pct(d.partInvestisseur)} du capital après la levée</em></div>`);
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
  const qui = (d.offre.participants?.length ?? 1) > 1 ? 'les fonds du tour' : d.offre.nom;
  return `<div class="defile"><table class="compare"><thead><tr><th>Prix de vente</th><th>Votre % × prix</th><th>Ce que vous touchez</th><th>Ce que touchent ${qui}</th></tr></thead><tbody>
    ${d.scenarios.map((s) => `<tr><td>${euros(s.prix)}</td><td>${euros(s.naif)}</td><td class="${s.reel < s.naif * 0.97 ? 'ecart' : ''}">${euros(s.reel)}</td><td>${euros(s.investisseur)} <span class="note">(${s.modeInvestisseur})</span></td></tr>`).join('')}
  </tbody></table></div>
  <p class="note" style="margin-top:14px">« Votre % × prix » est ce qu'on imagine en regardant la cap table. La cascade réelle sert d'abord les préférences de liquidation.</p>`;
}

let decryptage = null; // { tour, titre } affiché dans la fenêtre Décrypter

function ouvrirDecrypter(onglet = 'signez') {
  const { tour, titre } = decryptage;
  const d = decrypter(e, tour);
  const lignes = lignesTermSheet(tour).map((l) => {
    const t = l.terme ? terme(l.terme) : null;
    return `<div class="${l.piege ? 'piege-ligne' : ''}"><dt>${l.cle} : ${l.val}</dt>${t ? `<dd class="explique">${t.definition} ${l.piege ? `<b>Le piège :</b> ${t.piege}` : ''} <button type="button" class="lien" data-terme="${t.id}">Lexique</button></dd>` : ''}</div>`;
  }).join('');
  const contenu = { signez: `<dl class="lignes-ts">${lignes}</dl>`, calcul: etapesCalcul(d), vente: tableauVente(d) }[onglet];
  ouvrir(`<h2>${titre}</h2>
    <p class="sous">Ce que la term sheet annonce, et ce qu'elle fait vraiment à votre part : ${pct(d.avant)} → ${pct(d.apres)}.</p>
    <div class="onglets" role="tablist">
      ${[['signez', 'Ce que vous signez'], ['calcul', 'Le calcul'], ['vente', 'À la vente']].map(([k, n]) => `<button role="tab" type="button" data-onglet="${k}" aria-selected="${k === onglet}">${n}</button>`).join('')}
    </div>${contenu}`);
}

function ouvrirCalcul(calcul, entree) {
  ouvrir(`<h2>${entree?.titre ?? 'Le calcul'}</h2><p class="sous">Mois ${entree?.mois ?? e.mois}. Le calcul pas à pas, avec vos chiffres.</p>${etapesCalcul(calcul)}
    <h3>Et à la vente ?</h3>${tableauVente(calcul)}`);
}

function tableauCascade(prix) {
  const c = cascade(e.table, prix).filter((x) => x.montant > 0 || x.pct > 0).sort((a, b) => b.montant - a.montant);
  return `<div class="defile"><table class="compare"><thead><tr><th>Actionnaire</th><th>% du capital</th><th>Mode</th><th>Touche</th></tr></thead><tbody>
    ${c.map((x) => `<tr><td>${x.id === 'vous' ? '<b>Vous</b>' : x.nom}</td><td>${pct(x.pct)}</td><td>${x.mode}</td><td>${euros(x.montant)}</td></tr>`).join('')}</tbody></table></div>`;
}

function ouvrirSortie() {
  const s = carte.sortie;
  const v = cascade(e.table, s.prix).find((x) => x.id === 'vous');
  ouvrir(`<h2>Si vous vendez à ${s.acheteur} pour ${euros(s.prix)}</h2>
    <p class="sous">Vous détenez ${pct(v.pct)}, soit ${euros(v.pct * s.prix)} sur le papier. La cascade de liquidation vous donne <b>${euros(v.montant)}</b>.</p>
    ${tableauCascade(s.prix)}
    <p class="note" style="margin-top:14px">Chaque investisseur choisit le plus avantageux pour lui : récupérer sa préférence, ou convertir en actions ordinaires et prendre son pourcentage. <button type="button" class="lien" data-terme="cascade">Lexique : la cascade</button></p>`);
}

const couleur = (d) => (d.id === 'vous' ? 'var(--galette)' : d.categorie === 'fondateur' ? 'var(--galette-2)' : d.categorie === 'esop' ? 'var(--part-esop)' : 'var(--part-inv)');
const decrirePref = (p) => `préférence ${String(p.multiple).replace('.', ',')}x ${p.participatif ? (p.plafond ? `participative (plafond ${p.plafond}x)` : 'participative') : 'non participative'} sur ${euros(p.investi)}`;

function ouvrirTableau() {
  const T = totalActions();
  const captable = ordreTable().map((d) => `
    <li class="${d.id === 'vous' ? 'vous' : ''}"><i class="pastille" style="background:${couleur(d)}"></i>
      <span>${d.nom}${d.pref ? `<span class="pref">${decrirePref(d.pref)}</span>` : ''}</span><span class="pct">${pct(d.actions / T)}</span></li>`).join('')
    + e.notes.map((n) => `<li><i class="pastille" style="background:var(--part-inv)"></i>
      <span>${n.nom}<span class="pref">${euros(n.montant)} en attente de conversion${n.plafondValo ? `, plafond ${euros(n.plafondValo)}` : ''}</span></span><span class="pct">0,0 %</span></li>`).join('');
  const kpis = [
    ['Trésorerie', euros(e.tresorerie)], ['Runway', mois(runway(e))], ['MRR', euros(e.mrr)],
    ['Burn mensuel', euros(e.burn + (e.dette?.mensualite ?? 0))],
    ...(e.derniere ? [['Dernière post-money', euros(e.derniere.postMoney)]] : []),
    ...(e.encaisse ? [['Déjà encaissé', euros(e.encaisse)]] : []),
  ].map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
  const b = e.board;
  const f = feve(e);
  ouvrir(`<h2>Tableau de bord</h2><p class="sous">Mois ${e.mois}, ${etapeEnCours().toLowerCase()}.</p>
    <div class="tableau">
      <section><h3>La table de capitalisation</h3><ul class="captable">${captable}</ul></section>
      <section><h3>Les chiffres</h3><dl class="kpis">${kpis}</dl>
        <h3>Le board</h3><div class="board">${'<i class="siege f"></i>'.repeat(b.fondateurs)}${'<i class="siege i"></i>'.repeat(b.investisseurs)}${'<i class="siege n"></i>'.repeat(b.independants)}
        <span>&nbsp;${f === 'vous' ? 'la fève est à vous : vous contrôlez le board' : f === 'partage' ? "égalité : l'indépendant fait la majorité" : 'les investisseurs ont la majorité du board'}</span></div>
      </section>
    </div>`);
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
  const naif = pctVous * f.prix + f.encaisse;
  const ecart = vente && f.reel < naif * 0.97;
  const c = vente ? [...f.cascade].filter((x) => x.montant > 0).sort((a, b) => b.montant - a.montant) : [];
  const max = c[0]?.montant || 1;
  const clauses = e.journal.filter((j) => j.type === 'clause' || (j.type === 'dilution' && j.calcul));
  const record = Number(stock.lire('dilution-record') || 0);
  if (f.reel > record) stock.ecrire('dilution-record', String(Math.round(f.reel)));
  ouvrir(`<div class="fin">
    <h2>${t.titre}</h2><p style="color:var(--encre-douce)">${t.texte}</p>
    <div class="verdict">
      <div class="${ecart ? 'naif' : ''}"><span class="montant">${euros(vente ? naif : 0)}</span><p>${vente ? `Ce que vous pensiez toucher : ${pct(pctVous)} de ${euros(f.prix)}${f.encaisse ? ', plus votre vente secondaire' : ''}.` : 'Ce que valent vos actions.'}</p></div>
      <div><span class="montant">${euros(f.reel)}</span><p>${vente ? (ecart ? `Ce que vous touchez vraiment, après ${euros(f.preferences)} de préférences de liquidation.` : `Ce que vous touchez vraiment. À ce prix, les investisseurs ont préféré convertir leurs ${euros(f.preferences)} de préférences : pas d'écart, cette fois.`) : f.encaisse ? 'Seule votre vente secondaire vous reste.' : 'Rien. Mais vous savez maintenant ce qu’est une préférence de liquidation.'}${record && f.reel > record ? ' Nouveau record !' : ''}</p></div>
    </div>
    <div class="fin-grille">
      <div><h3>Le film de la dilution</h3>${film()}<p class="note">Cliquez sur un point pour revoir le calcul de chaque chute.</p></div>
      <div>${vente ? `<h3>Qui touche quoi sur ${euros(f.prix)}</h3><div class="cascade">${c.map((x) => `
        <div class="ligne"><span>${x.id === 'vous' ? '<b>Vous</b>' : x.nom}</span><i class="barre ${x.id === 'vous' ? 'vous' : x.categorie === 'esop' ? 'esop' : ''}" style="width:${Math.max(2, (x.montant / max) * 100)}%;${x.categorie === 'fondateur' && x.id !== 'vous' ? 'background:var(--galette-2)' : ''}"></i><span class="val">${euros(x.montant)}</span>${x.mode !== 'ordinaire' ? `<span class="mode">${x.mode}</span>` : ''}</div>`).join('')}</div>` : `<h3>La table au moment de la fin</h3>${tableauCascade(0)}`}</div>
    </div>
    <div class="clauses"><h3>Ce que vous avez signé</h3>${clauses.length ? `<ul>${clauses.map((j) => `<li>Mois ${j.mois} : ${j.titre}</li>`).join('')}</ul>` : '<p>Rien du tout. Prudent.</p>'}</div>
    <p class="actions"><button class="bouton-plein" type="button" data-action="rejouer">Rejouer</button><button class="outil discret" type="button" data-action="journal">Ouvrir le journal complet</button></p>
  </div>`, { large: true });
}

// ───────── Délégation des clics et du clavier ─────────

document.addEventListener('click', (ev) => {
  const t = ev.target.closest('[data-terme],[data-action],[data-onglet],[data-journal],[data-fermer],[data-choix],[data-offre],[data-negocier],[data-decrypter],[data-decrypter-tour],[data-signer],[data-refuser],[data-ecarter]');
  if (!t) return;
  const ds = t.dataset;
  if (ds.fermer !== undefined) $('fenetre').close();
  else if (ds.choix !== undefined) choisir(Number(ds.choix));
  else if (ds.terme) ouvrirLexique(ds.terme);
  else if (ds.onglet) ouvrirDecrypter(ds.onglet);
  else if (ds.journal) {
    const j = e.journal[Number(ds.journal)];
    if (j.calcul) ouvrirCalcul(j.calcul, j); else ouvrirJournal();
  } else if (ds.offre) {
    selection = selection.includes(ds.offre) ? selection.filter((x) => x !== ds.offre) : [...selection, ds.offre];
    rendreLevee();
  } else if (ds.negocier) actionLevee({ type: 'negocier', id: ds.negocier });
  else if (ds.ecarter) { selection = selection.filter((x) => x !== ds.ecarter); actionLevee({ type: 'ecarter', id: ds.ecarter }); }
  else if (ds.decrypter) {
    const o = e.levee.offres.find((x) => x.id === ds.decrypter);
    decryptage = { tour: o, titre: `Décrypter l'offre de ${o.nom}` };
    ouvrirDecrypter();
  } else if (ds.decrypterTour !== undefined) {
    const c = composerTour(e, selection);
    decryptage = { tour: c.tour, titre: c.tour.participants.length > 1 ? `Décrypter le tour mené par ${c.chef.nom}` : `Décrypter l'offre de ${c.chef.nom}` };
    ouvrirDecrypter();
  } else if (ds.signer !== undefined) { if (selection.length) actionLevee({ type: 'signer', ids: selection }); }
  else if (ds.refuser !== undefined) actionLevee({ type: 'refuser' });
  else if (ds.action === 'voir-choix') { voirChoix = true; $('options').classList.remove('masque'); t.remove(); $('options').querySelector('button')?.focus(); }
  else if (ds.action === 'sortie') ouvrirSortie();
  else if (ds.action === 'calcul') ouvrirCalcul(carte.calcul, { titre: 'Le calcul de cette levée', mois: e.mois });
  else if (ds.action === 'journal') ouvrirJournal();
  else if (ds.action === 'rejouer') { $('fenetre').close(); demarrer(); }
});

// Aperçu des jauges au survol ou au focus d'une carte de choix.
for (const ev of ['pointerover', 'focusin']) {
  $('options').addEventListener(ev, (x) => { const b = x.target.closest('[data-choix]'); montrerApercu(b ? Number(b.dataset.choix) : null); });
}
$('options').addEventListener('pointerleave', () => montrerApercu(null));
$('options').addEventListener('focusout', () => montrerApercu(null));

addEventListener('keydown', (ev) => {
  if (ev.key === 'Enter' || ev.key === ' ') {
    if (ev.target.matches('.film .point')) { ev.preventDefault(); ev.target.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
    return;
  }
  if ($('fenetre').open || ev.altKey || ev.ctrlKey || ev.metaKey || ev.target.matches('input, textarea')) return;
  if (/^[1-9]$/.test(ev.key)) choisir(Number(ev.key) - 1);
  const direction = { ArrowLeft: 'gauche', ArrowUp: 'haut', ArrowRight: 'droite' }[ev.key];
  if (direction && carte && carte.type !== 'levee') {
    const i = sensOptions(options(carte).length, carte.info)[direction];
    if (i !== undefined) { ev.preventDefault(); choisir(i); }
  }
});
$('fenetre').addEventListener('click', (ev) => { if (ev.target === $('fenetre')) $('fenetre').close(); });

$('btn-tableau').addEventListener('click', ouvrirTableau);
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
window.__dilution = { etat: () => e, carte: () => carte, choisir, actionLevee, selection: () => selection };
