// La galette : la part de chaque détenteur en parts de gâteau. La fève marque qui contrôle le board.

const COULEURS = {
  vous: 'var(--galette)',
  fondateur: 'var(--galette-2)',
  esop: 'var(--part-esop)',
  investisseur: 'var(--part-inv)',
};

function arc(cx, cy, r, a0, a1) {
  const p = (a) => [cx + r * Math.sin(a), cy - r * Math.cos(a)];
  const [x0, y0] = p(a0);
  const [x1, y1] = p(a1);
  const grand = a1 - a0 > Math.PI ? 1 : 0;
  return `M${cx} ${cy}L${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 ${grand} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}Z`;
}

/**
 * parts : [{ id, categorie, pct }] dans l'ordre d'affichage (vous en premier).
 * feve : 'vous' | 'investisseurs' — qui contrôle le board.
 */
export function galette(parts, { taille = 120, feve = 'vous' } = {}) {
  const c = 60;
  const r = 52;
  let a = 0;
  let tranches = '';
  let angleVous = null;
  let angleInv = null;
  for (const p of parts) {
    if (p.pct <= 0) continue;
    const a1 = a + p.pct * 2 * Math.PI;
    const couleur = p.id === 'vous' ? COULEURS.vous : COULEURS[p.categorie] ?? COULEURS.investisseur;
    tranches += `<path d="${p.pct >= 0.9999 ? `M${c} ${c - r}A${r} ${r} 0 1 1 ${c - 0.01} ${c - r}Z` : arc(c, c, r, a, a1)}" fill="${couleur}" stroke="var(--galette-bord)" stroke-width="1.5"/>`;
    if (p.id === 'vous') angleVous = (a + a1) / 2;
    else if (p.categorie === 'investisseur' && angleInv === null) angleInv = (a + a1) / 2;
    a = a1;
  }
  const angle = feve === 'vous' ? angleVous : angleInv ?? angleVous;
  const fx = c + 30 * Math.sin(angle ?? 0);
  const fy = c - 30 * Math.cos(angle ?? 0);
  const feveSvg = `<g class="feve" transform="translate(${fx.toFixed(1)} ${fy.toFixed(1)})"><ellipse rx="7" ry="5.5" fill="var(--feve)" stroke="var(--encre)" stroke-width="1.5"/><path d="M-3 -1q3 -3 6 0" stroke="var(--encre)" stroke-width="1.2" fill="none"/></g>`;
  return `<svg class="galette" viewBox="0 0 120 120" width="${taille}" height="${taille}" role="img" aria-label="Répartition du capital">
    <circle cx="60" cy="60" r="57" fill="var(--galette-croute)"/>
    ${tranches}
    ${feveSvg}
  </svg>`;
}
