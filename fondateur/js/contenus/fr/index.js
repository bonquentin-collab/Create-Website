// Contenus français : cartes, cartes générées (levées, ventes), textes de fin, lexique.
import cadreFr from '../../cadres/fr.js';
import { CARTES, ROLES } from './cartes.js';
import { LEXIQUE } from './lexique.js';
import { euros, pct, mois } from './format.js';
import { vendre, valoMarche, runway, partVous } from '../../moteur.js';
import { bouger, noter } from '../../etat.js';
import { preferencesTotales } from '../../captable.js';

export const ACCROCHES = {
  propre: "« J'ai lu vos chiffres deux fois. Offre standard, sans surprise. Je lis aussi les annexes. »",
  flatteur: "« Tu es le meilleur fondateur que j'ai vu cette année. La valo la plus haute du marché, crois-moi. On signe ce soir ? »",
  corporate: "« Notre groupe croit énormément en vous. De l'argent et des synergies. La préemption ? Une formalité. »",
  croissance: "« On aime les boîtes qui scalent. Préférence un peu participative, mais plafonnée : très standard. »",
  angels: "« Petit ticket, pas de siège, pas de chichis. On suit volontiers un fonds, on ne mène pas. »",
};
export const ISSUES_NEGO = {
  mieux: (n) => `${n} fait un geste : une clause s'améliore.`,
  pareil: (n) => `${n} ne bouge pas : « C'est notre dernier mot. »`,
  retrait: (n) => `${n} se retire : « Ce n'est pas vous, c'est notre thèse d'investissement. »`,
};

const info = (qui, texte, label = 'Continuer', extra = {}) => ({
  qui, texte, info: true, sansTemps: true,
  g: { label, effet: () => {} }, d: { label, effet: () => {} }, ...extra,
});

// Lignes de la term sheet, avec le niveau de risque de chaque clause (pour le mode prof).
export function lignesTermSheet(o) {
  const pref = `${String(o.multiple).replace('.', ',')}x, ${o.participatif ? (o.plafond ? `participative, plafonnée à ${o.plafond}x` : 'participative') : 'non participative'}`;
  const autres = o.autres.map((a) => ({ drag: 'Drag-along (sortie forcée)', preemption: 'Droit de préemption sur la vente' })[a]);
  return [
    { cle: 'Montant', val: euros(o.montant) },
    { cle: 'Valorisation pré-money', val: euros(o.preMoney), terme: 'premoney' },
    { cle: 'Préférence de liquidation', val: pref, terme: o.participatif ? 'participative' : 'preference', piege: o.participatif || o.multiple > 1 },
    { cle: 'Anti-dilution', val: o.antiDilution === 'ratchet' ? 'Ratchet total' : 'Moyenne pondérée large', terme: o.antiDilution === 'ratchet' ? 'ratchet' : 'moyenne', piege: o.antiDilution === 'ratchet' },
    { cle: 'Pool BSPCE', val: o.poolCible ? `${pct(o.poolCible, 0)} après la levée, créé ${o.poolPreMoney ? 'avant la levée' : 'après la levée'}` : 'Pas de nouveau pool', terme: o.poolPreMoney ? 'shuffle' : 'bspce', piege: o.poolPreMoney && o.poolCible >= 0.15 },
    { cle: 'Board', val: o.sieges ? `${o.sieges} siège${o.sieges > 1 ? 's' : ''} investisseur${o.sieges > 1 ? 's' : ''}${o.independant ? ' et 1 indépendant' : ''}` : 'Aucun siège', terme: 'board', piege: o.sieges >= 2 },
    ...(autres.length ? [{ cle: 'Autres clauses', val: autres.join(', '), terme: o.autres[0] === 'drag' ? 'drag' : 'preemption', piege: true }] : []),
  ];
}

function carteSortie(c, e) {
  const s = c.sortie;
  const pctVous = partVous(e);
  return {
    type: 'sortie', qui: 'avocat', sortie: s,
    texte: s.acquihire
      ? `« ${s.acheteur} propose de racheter l'entreprise pour ${euros(s.prix)}, surtout pour récupérer l'équipe. Vous détenez ${pct(pctVous)}. Avant de rêver, regardons les préférences : il y en a pour ${euros(preferencesTotales(e.table))}. »`
      : `« ${s.acheteur} propose de racheter 100 % de l'entreprise pour ${euros(s.prix)}. Vous détenez ${pct(pctVous)}, soit ${euros(pctVous * s.prix)} sur le papier. Sur le papier. »`,
    g: {
      label: 'Refuser',
      effet: (et, rng) => {
        if (et.drapeaux.drag && s.prix >= preferencesTotales(et.table) * 1.2 && rng() < 0.5) {
          et.file.unshift({ special: 'drag', sortie: s });
        } else bouger(et, { investisseurs: -6 });
      },
    },
    d: { label: 'Vendre', effet: (et) => vendre(et, s) },
  };
}

export const contenus = {
  cadre: cadreFr,
  cartes: CARTES,
  roles: ROLES,
  lexique: LEXIQUE,
  debut(e) {
    e.file.push({ id: 'pacte-vesting' }, { id: 'bsa-air' });
  },
  special(c, e) {
    switch (c.special) {
      case 'levee':
        if (!e.levee) return null;
        return {
          type: 'levee', qui: 'claire', sansTemps: true, options: [],
          texte: `Il vous reste ${mois(runway(e))} de trésorerie. Levée ${cadreFr.etapes[e.levee.etapeCible]} : choisissez un fonds chef de file, et éventuellement des fonds qui le suivent au même prix. Chaque négociation prend un mois.`,
        };
      case 'echecLevee': {
        if (!e.levee) return null;
        e.levee.offres = [];
        const avecInvestisseurs = e.table.some((d) => d.categorie === 'investisseur' && d.pref);
        return {
          qui: avecInvestisseurs ? 'claire' : 'mere',
          texte: avecInvestisseurs
            ? "« Aucun fonds ne signe. Vos investisseurs actuels peuvent faire un pont : un BSA AIR avec 25 % de décote, converti à la prochaine levée. Sinon, il faut couper les dépenses. »"
            : "« Personne n'a voulu de ta start-up ? Ton père et moi pouvons te prêter 50 000 €. Ou alors tu réduis les frais, comme tout le monde. »",
          g: { label: 'Couper le burn de 40 %', effet: (et) => { et.burn *= 0.6; bouger(et, { equipe: -22, produit: -8 }); et.levee = null; et.drapeaux.moisEchecLevee = et.mois; } },
          d: {
            label: avecInvestisseurs ? 'Accepter le pont' : "Accepter l'aide familiale",
            effet: (et) => {
              if (avecInvestisseurs) {
                const montant = Math.round(et.burn * 8 / 50_000) * 50_000;
                et.notes.push({ id: `pont-${et.mois}`, nom: 'Pont des investisseurs (BSA AIR)', montant, decote: 0.25, plafondValo: null });
                et.tresorerie += montant;
                noter(et, { type: 'clause', titre: `Pont de ${euros(montant)} en BSA AIR, décote 25 %`, texte: 'Rien ne bouge aujourd’hui. À la prochaine levée, il se convertira avec 25 % de réduction sur le prix.', terme: 'bsaair', cachee: true });
              } else {
                et.tresorerie += 50_000;
                bouger(et, { equipe: -5 });
              }
              et.levee = null;
              et.drapeaux.moisEchecLevee = et.mois;
            },
          },
        };
      }
      case 'bilanLevee': {
        const cl = c.calcul;
        return info(cl.offre.perso, `C'est signé : ${euros(cl.offre.montant)} sur un compte en banque. Votre part passe à ${pct(partVous(e))}. Une simple règle de trois promettait ${pct(cl.partNaive)}.${cl.conversions.length ? ` Le BSA AIR s'est converti au passage.` : ''}${cl.ajustements.length ? " Et l'anti-dilution des anciens investisseurs s'est déclenchée." : ''}`, 'Au travail', { calcul: cl });
      }
      case 'sortie':
        return carteSortie(c, e);
      case 'drag':
        return info('marcantoine', `« Désolé, mais le board a voté. Avec le drag-along, tu vends à ${c.sortie.acheteur}, que tu le veuilles ou non. »`, 'Vendre, donc', {
          g: { label: 'Vendre, donc', effet: (et) => vendre(et, c.sortie, 'drag') },
          d: { label: 'Vendre, donc', effet: (et) => vendre(et, c.sortie, 'drag') },
          sansTemps: true,
        });
      case 'liquidite': {
        const s = { prix: Math.round(valoMarche(e, Math.max(1, e.etape)) / 1e5) * 1e5, acheteur: 'un fonds de rachat' };
        return info('claire', `Neuf ans. Les fonds doivent rendre l'argent à leurs propres investisseurs : l'entreprise est vendue à ${s.acheteur} pour ${euros(s.prix)}.`, 'Signer la vente', {
          g: { label: 'Signer la vente', effet: (et) => vendre(et, s, 'liquidite') },
          d: { label: 'Signer la vente', effet: (et) => vendre(et, s, 'liquidite') },
        });
      }
      default:
        return null;
    }
  },
  fins: {
    vente: (f) => ({ titre: `Mois ${f.mois} : vous vendez à ${f.acheteur} pour ${euros(f.prix)}`, texte: 'Une sortie. Reste à savoir pour qui.' }),
    drag: (f) => ({ titre: `Mois ${f.mois} : le board vous fait vendre à ${f.acheteur}`, texte: "Le drag-along a joué : les investisseurs ont décidé pour vous." }),
    liquidite: (f) => ({ titre: `Mois ${f.mois} : vente forcée pour ${euros(f.prix)}`, texte: "Les fonds avaient une date de fin. Vous, pas vraiment." }),
    faillite: (f) => ({ titre: `Mois ${f.mois} : liquidation judiciaire`, texte: "Plus un euro en banque. Vos actions ne valent plus rien, les préférences non plus, pour une fois tout le monde est à égalité." }),
    equipe: (f) => ({ titre: `Mois ${f.mois} : l'équipe démissionne`, texte: "Un vendredi, tout le monde envoie sa lettre en même temps. Ils ont créé une coopérative." }),
    produit: (f) => ({ titre: `Mois ${f.mois} : votre produit est dépassé`, texte: "Plus personne ne s'en sert. Même votre mère est passée chez le concurrent." }),
    revoque: (f) => ({ titre: `Mois ${f.mois} : le board vous remplace`, texte: "Les investisseurs ont la majorité du board. Ils nomment un « CEO expérimenté ». Vous gardez vos actions, mais plus votre entreprise." }),
  },
};
