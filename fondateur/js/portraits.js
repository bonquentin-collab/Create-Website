// Portraits des personnages : formes simples en SVG, une silhouette reconnaissable par personnage.
// Chaque portrait tient dans un viewBox 0 0 64 64.

const tete = (peau) => `<circle cx="32" cy="34" r="15" fill="${peau}"/>`;
const corps = (couleur) => `<path d="M10 64c2-12 11-17 22-17s20 5 22 17z" fill="${couleur}"/>`;
const yeux = `<circle cx="26.5" cy="34" r="1.6" fill="#15182c"/><circle cx="37.5" cy="34" r="1.6" fill="#15182c"/>`;
const sourire = `<path d="M27 40q5 4 10 0" stroke="#15182c" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
const lunettes = `<g fill="none" stroke="#15182c" stroke-width="1.6"><circle cx="26.5" cy="34" r="4.2"/><circle cx="37.5" cy="34" r="4.2"/><path d="M30.7 34h2.6"/></g>`;

export const PORTRAITS = {
  // Inès, la cofondatrice : cheveux courts bouclés, sweat vert.
  ines: `${corps('#1f8a6a')}${tete('#c98a62')}<path d="M17 32c-1-11 7-17 15-17s16 5 15 16c-3-5-8-7-15-7-6 0-11 2-15 8z" fill="#2b1d16"/><circle cx="18" cy="27" r="4" fill="#2b1d16"/><circle cx="46" cy="27" r="4" fill="#2b1d16"/>${yeux}${sourire}`,
  // Marc-Antoine, l'associé charmant du fonds flatteur : brushing, costume bleu nuit, dents blanches.
  marcantoine: `${corps('#1c2557')}<path d="M27 47l5 8 5-8z" fill="#fbfbf8"/>${tete('#efc39c')}<path d="M16 31c0-12 9-16 17-16 9 0 15 5 15 12-6-4-14-6-23-3-4 1-7 4-9 7z" fill="#c99a3b"/>${yeux}<path d="M26 39.5q6 5 12 0z" fill="#fbfbf8" stroke="#15182c" stroke-width="1.4"/>`,
  // Claire, l'investisseuse rigoureuse : carré noir, lunettes, veste grise.
  claire: `${corps('#5b6270')}${tete('#e9b98f')}<path d="M16 40V30c0-10 7-15 16-15s16 5 16 15v10h-5V28c-5 2-17 2-22 0v12z" fill="#15182c"/>${lunettes}${yeux}<path d="M28 41h8" stroke="#15182c" stroke-width="1.8" stroke-linecap="round"/>`,
  // Gérard, le business angel qui « a revendu sa boîte en 2014 » : chauve, barbe grise, polo saumon.
  gerard: `${corps('#e8846f')}${tete('#e7b48c')}<path d="M18 38c2 9 7 12 14 12s12-3 14-12c-4 4-9 5-14 5s-10-1-14-5z" fill="#b8b8b8"/><path d="M17 30c1-4 3-6 5-7M47 30c-1-4-3-6-5-7" stroke="#b8b8b8" stroke-width="3" stroke-linecap="round"/>${yeux}<path d="M28 42q4 2 8 0" stroke="#15182c" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
  // Maître Jean-Pierre, l'avocat qui facture à l'heure : cheveux poivre et sel, nœud papillon.
  avocat: `${corps('#2d2d33')}<path d="M26 50l6 3 6-3-6-3z" fill="#c22f3b"/>${tete('#dcae86')}<path d="M17 30c0-10 7-14 15-14s15 4 15 14c-2-3-4-5-6-6-6 2-14 2-18 0-3 1-5 3-6 6z" fill="#8c8c92"/>${lunettes}${yeux}${sourire}`,
  // Nadia, chargée d'affaires Bpifrance : chignon, foulard jaune.
  bpi: `${corps('#2a6fd6')}<path d="M22 50q10 6 20 0l-2 6q-8 4-16 0z" fill="#ffd23f"/>${tete('#a8714f')}<circle cx="32" cy="15" r="6" fill="#3a2418"/><path d="M17 33c0-10 6-15 15-15s15 5 15 15c-4-6-9-8-15-8s-11 2-15 8z" fill="#3a2418"/>${yeux}${sourire}`,
  // Votre mère, au téléphone : cheveux blancs, gilet mauve.
  mere: `${corps('#8d5fa8')}${tete('#efc6a4')}<path d="M16 34c-2-12 6-19 16-19s18 7 16 19c-2-6-4-9-6-10-6 3-15 3-20 0-3 1-5 4-6 10z" fill="#e9e9ef"/>${yeux}<path d="M28 41q4-2 8 0" stroke="#15182c" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
  // Théo, le CTO : bonnet, barbe, t-shirt noir.
  cto: `${corps('#25262b')}${tete('#d9a47c')}<path d="M18 37c1 10 7 14 14 14s13-4 14-14c-3 3-8 4-14 4s-11-1-14-4z" fill="#5a3a24"/><path d="M16 29c0-9 7-14 16-14s16 5 16 14z" fill="#e2452b"/><rect x="15" y="27" width="34" height="5" rx="2.5" fill="#b8341f"/>${yeux}`,
  // Le marché, personnage abstrait : un graphique qui parle.
  marche: `<rect x="6" y="10" width="52" height="44" rx="8" fill="#15182c"/><path d="M12 44l10-10 8 6 10-16 12 8" stroke="#ffe14d" stroke-width="3" fill="none" stroke-linejoin="round"/><circle cx="52" cy="32" r="3" fill="#ff8fc4"/>`,
};

export function portrait(id, taille = 64) {
  const contenu = PORTRAITS[id] ?? PORTRAITS.marche;
  return `<svg class="portrait" viewBox="0 0 64 64" width="${taille}" height="${taille}" aria-hidden="true">${contenu}</svg>`;
}
