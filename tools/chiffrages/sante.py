import sys
from commun import *
from verification import SANTE as VERIF, RETRAITES as VR
VS = {**index_verif(VR), **index_verif(VERIF)}
ALIAS = {"csgNorm": "taux_reduit", "assN": "ass", "assM": "ass", "repN": "rep_exonere", "repM": "rep_exonere"}

sr = P["sr"]; st = P["sante"]; csg = P["prel"]["csg"]; G = P["gel"]; N = P["ndv"]
wb = nouveau()
lisez_moi(wb, "Chiffrage de l'espace Santé", [
    ("Contenu",),
    "Leviers : CSG des pensions au taux normal alignée sur les salaires, cotisation maladie sur les pensions de base, bouclier santé ; recettes, coût, effet sur le déficit de la branche maladie, perdants et gagnants.",
    "Effort : taux d'effort pour la santé par niveau de vie, actifs et retraités (Drees, ER 1345, tableau C), et ce qu'ajoutent la CSG et la cotisation choisies.",
    "Bouclier : groupes de ménages classés par taux d'effort en primes et restes à charge (Drees, encadré 3), découpage des tops, profil linéaire et coût du plafond choisi.",
    "Sources : références de chaque donnée.",
    ("Vérification",),
    "Avec les réglages par défaut du site, les résultats sont ceux du site. Le coût du bouclier est calculé ici en forme exacte (intégrale d'un profil linéaire) ; le site l'approche par 200 points par groupe : écart négligeable (voir la feuille Bouclier).",
    ("Limites",),
    "Coût du bouclier : revenus supposés égaux entre groupes, ce qui le majore probablement ; aucun effet de comportement. Part de chaque niveau de vie soumise à chaque taux de CSG : estimation du site d'après les seuils de CSG.",
])

# ---------- Leviers ----------
l = feuille(wb, "Leviers", "Faire contribuer davantage les retraités qui le peuvent, protéger ceux pour qui la santé coûte le plus", None, [62, 18, 18, 56, 60])
ent = [("csg", "Aligner la CSG des pensions au taux normal sur celle des salaires", "Oui", None, ["Oui", "Non"]),
       ("cot", "Cotisation maladie sur les pensions de base (retraités au taux médian ou normal)", 0.01, PCT1, None),
       ("bou", "Créer un bouclier santé", "Oui", None, ["Oui", "Non"]),
       ("plaf", "Plafond d'effort en primes et restes à charge (% du revenu)", 10, '0.0', None),
       ("pen", "Votre pension brute mensuelle totale (€)", 2500, EUR, None),
       ("taux", "Votre taux de CSG", "normal", None, ["exonere", "reduit", "median", "normal"])]
e = {}
for i, (k, lib, v, fmt, opts) in enumerate(ent, start=4):
    texte(l, f"A{i}", lib, wrap=True); entree(l, f"B{i}", v, fmt)
    if opts: liste(l, f"B{i}", opts)
    e[k] = f"Leviers!$B${i}"
texte(l, "A10", "Paramètres", gras=True)
par = [("csgAct", "Taux de CSG sur les revenus d'activité", csg["activite"]["taux"], PCT1, "Code de la sécurité sociale, art. L136-8"),
       ("csgNorm", "Taux normal de CSG sur les pensions", [t for t in csg["retraites"]["taux"] if t["id"] == "normal"][0]["taux"], PCT1, csg["retraites"]["source"]),
       ("assN", "Assiette des pensions au taux normal (Md€)", csg["retraites"]["assiettes"]["normal"], NB1, "Estimation du site, calibrée sur les recettes de CSG 2025 (CCSS, mai 2026)"),
       ("assM", "Assiette des pensions au taux médian (Md€)", csg["retraites"]["assiettes"]["median"], NB1, "Idem"),
       ("base", "Part de la pension venant des régimes de base", G["partBase"], PCT1, G["ipp"]["source"]),
       ("partP", "Part des pensions dans le revenu des retraités", N["composition"]["partPensions"], PCT1, N["composition"]["source"]),
       ("ret", "Retraités de droit direct", G["retraites"]["valeur"], NB, G["retraites"]["source"]),
       ("repN", "Part des retraités au taux normal", csg["retraites"]["repartitionRetraites"]["normal"], PCT1, csg["retraites"]["repartitionRetraites"]["source"]),
       ("repM", "Part des retraités au taux médian", csg["retraites"]["repartitionRetraites"]["median"], PCT1, csg["retraites"]["repartitionRetraites"]["source"]),
       ("def", "Solde de la branche maladie du régime général, 2026 (Md€)", sr["deficitMaladie"]["valeur"], NB1, sr["deficitMaladie"]["source"]),
       ("cotC", "Cotisation maladie existante sur les complémentaires", sr["cotisationMaladie"]["complementaires"], PCT1, sr["cotisationMaladie"]["source"])]
entete(l, 11, ["Paramètre", "Valeur", "Type", "Comment c'est calculé", "Source"])
for i, (k, lib, v, fmt, src) in enumerate(par, start=12):
    texte(l, f"A{i}", lib, wrap=True); entree(l, f"B{i}", v, fmt, cle=False); texte(l, f"E{i}", src, wrap=True)
    colonnes_verif(l, i, VS.get(ALIAS.get(k, k)), "C", "D")
    e[k] = f"Leviers!$B${i}"
r0 = 25
texte(l, f"A{r0-1}", "Résultats", gras=True)
res = [
    ("rcsg", "Recettes de la CSG alignée (Md€)", f'=IF({e["csg"]}="Oui",{e["assN"]}*({e["csgAct"]}-{e["csgNorm"]}),0)', MD2, False),
    ("rcot", "Recettes de la cotisation maladie (Md€)", f'={e["cot"]}*({e["assM"]}+{e["assN"]})*{e["base"]}', MD2, False),
    ("rtot", "Ce que les retraités versent en plus (Md€)", f"=B{r0}+B{r0+1}", MD2, True),
    ("cout", "Coût du bouclier (Md€)", f'=IF({e["bou"]}="Oui",Bouclier!$C$44,0)', MD2, True),
    ("net", "Effet net pour l'Assurance maladie (Md€)", f"=B{r0+2}-B{r0+3}", MD2, True),
    ("pdef", "Part du déficit 2026 comblée", f"=IF(B{r0+4}>0,B{r0+4}/ABS({e['def']}),0)", PCT1, False),
    ("menages", "Ménages protégés par le bouclier", f'=IF({e["bou"]}="Oui",Bouclier!$C$45,0)', NB, False),
    ("pret", "Part de l'aide pour des ménages de retraités", f'=IF({e["bou"]}="Oui",Bouclier!$C$46,0)', PCT1, False),
    ("pmod", "… dont retraités modestes", f'=IF({e["bou"]}="Oui",Bouclier!$C$47,0)', PCT1, False),
    ("perd", "Retraités qui paient plus", f'=MAX(IF({e["csg"]}="Oui",{e["repN"]},0),IF({e["cot"]}>0,{e["repN"]}+{e["repM"]},0))*{e["ret"]}', NB, False),
    ("solde", "Solde pour les retraités : versé en plus, net de ce que le bouclier leur rend (Md€)", f"=B{r0+2}-B{r0+3}*B{r0+7}", MD2, True),
    ("perte", "Votre perte (€ brut par mois)", f'={e["pen"]}*(IF(AND({e["csg"]}="Oui",{e["taux"]}="normal"),{e["csgAct"]}-{e["csgNorm"]},0)+IF(OR({e["taux"]}="median",{e["taux"]}="normal"),{e["cot"]}*{e["base"]},0))', EUR2, True),
]
for i, (k, lib, f, fmt, cle) in enumerate(res, start=r0):
    texte(l, f"A{i}", lib, wrap=True); formule(l, f"B{i}", f, fmt, gras=cle, res=cle, lien="Bouclier" in f)

# ---------- Effort ----------
ef = feuille(wb, "Effort", "Taux d'effort pour la santé, avant et après (en % du revenu)", "Drees, ER 1345, tableau complémentaire C (Ines-Omar 2019) ; ajout de la réforme : estimation du site.", [22, 30, 11, 11, 11, 11, 13, 13, 13])
entete(ef, 4, ["Niveau de vie", "Champ", "Sécurité sociale", "Primes", "Restes à charge", "Total avant", "Part exposée au taux normal", "Part exposée au taux médian ou normal", "Ajout de la réforme (points)"])
eff = st["effort"]; ex = sr["exposition"]
x = 5
lignes_ret = []
for i, nv in enumerate(eff["niveaux"]):
    for champ, gr in [("Actifs en emploi", eff["actifs"]), ("Retraités", eff["retraites"])]:
        texte(ef, f"A{x}", nv["label"]); texte(ef, f"B{x}", f"{champ} ({nv['aide']})", wrap=True)
        entree(ef, f"C{x}", gr["amo"][i], '0.00', cle=False); entree(ef, f"D{x}", gr["primes"][i], '0.00', cle=False); entree(ef, f"E{x}", gr["reste"][i], '0.00', cle=False)
        formule(ef, f"F{x}", f"=SUM(C{x}:E{x})", '0.00')
        if champ == "Retraités":
            entree(ef, f"G{x}", ex["tauxNormal"][i], PCT1); entree(ef, f"H{x}", ex["tauxMedianOuNormal"][i], PCT1)
            formule(ef, f"I{x}", f'=100*{e["partP"]}*(IF({e["csg"]}="Oui",{e["csgAct"]}-{e["csgNorm"]},0)*G{x}+{e["cot"]}*{e["base"]}*H{x})', '0.00')
            lignes_ret.append(x)
        else:
            formule(ef, f"I{x}", "=0", '0.00')
        x += 1
entete(ef, x + 1, ["Niveau de vie", "", "Actifs", "Retraités avant", "Retraités après", "Écart actifs − retraités avant", "Écart après"])
for i, nv in enumerate(eff["niveaux"]):
    y = x + 2 + i; ra = lignes_ret[i]; aa = ra - 1
    texte(ef, f"A{y}", nv["label"])
    formule(ef, f"C{y}", f"=F{aa}", '0.00'); formule(ef, f"D{y}", f"=F{ra}", '0.00'); formule(ef, f"E{y}", f"=F{ra}+I{ra}", '0.00', gras=True, res=True)
    formule(ef, f"F{y}", f"=C{y}-D{y}", '0.00'); formule(ef, f"G{y}", f"=C{y}-E{y}", '0.00')
texte(ef, f"A{x+8}", "Exposition : part de la pension brute des retraités de chaque niveau de vie touchée par chaque levier, estimée d'après les seuils de CSG 2025 (taux normal vers 2 400 € de pension brute pour une personne seule, taux médian vers 1 550 €).", italique=True)

# ---------- Bouclier ----------
b = feuille(wb, "Bouclier", "Bouclier santé : coût et bénéficiaires", "Primes de complémentaire et restes à charge en % du revenu disponible après financement de l'AMO, ménages classés selon ce taux (Drees, ER 1345, encadré 3 et tableau G, 2019).", [22, 10, 12, 14, 14, 12, 12, 12, 12, 14, 14, 14, 14])
texte(b, "A4", "Données publiées", gras=True)
entete(b, 5, ["Groupe", "Part des ménages", "Taux d'effort moyen (%)", "Retraités modestes (%)", "Retraités médians à aisés (%)"])
dz = sr["effortPrive"]["dixiemes"]; tops = sr["effortPrive"]["tops"]
pub = [(d[0], 0.1, d[1], d[2], d[3]) for d in dz] + [(t[0], t[1], t[2], t[3], t[4]) for t in tops]
for i, (lab, part, eft, rm, ra) in enumerate(pub, start=6):
    texte(b, f"A{i}", lab); entree(b, f"B{i}", part, PCT1, cle=False); entree(b, f"C{i}", eft, '0.00', cle=False)
    entree(b, f"D{i}", rm, '0.00', cle=False); entree(b, f"E{i}", ra, '0.00', cle=False)
# lignes : D1..D9 = 6..14 ; D10 = 15 ; top5 = 16 ; top2 = 17 ; top1 = 18
texte(b, "A21", "Groupes disjoints et profil linéaire (bords choisis pour conserver la moyenne de chaque groupe)", gras=True)
entete(b, 22, ["Groupe", "Part", "Effort moyen", "Retraités modestes", "Retraités médians à aisés", "Bord gauche", "Bord droit", "Bas", "Haut", "Effort au-delà du plafond", "Ménages bénéficiaires (part)"])
labels = [d[0] for d in dz[:9]] + ["90 à 95 %", "95 à 98 %", "98 à 99 %", "1 % le plus exposé"]
plaf = e["plaf"]
for i, lab in enumerate(labels):
    y = 23 + i
    texte(b, f"A{y}", lab)
    if i < 9:
        s = 6 + i
        formule(b, f"B{y}", f"=B{s}", PCT1); formule(b, f"C{y}", f"=C{s}", '0.00'); formule(b, f"D{y}", f"=D{s}/100", PCT1); formule(b, f"E{y}", f"=E{s}/100", PCT1)
    elif i < 12:
        s, t = 15 + (i - 9), 16 + (i - 9)
        formule(b, f"B{y}", f"=B{s}-B{t}", PCT1)
        for col, dv in [("C", ""), ("D", "/100"), ("E", "/100")]:
            formule(b, f"{col}{y}", f"=({col}{s}*B{s}-{col}{t}*B{t})/(B{s}-B{t}){dv}", '0.00' if col == "C" else PCT1)
    else:
        formule(b, f"B{y}", "=B18", PCT1); formule(b, f"C{y}", "=C18", '0.00'); formule(b, f"D{y}", "=D18/100", PCT1); formule(b, f"E{y}", "=E18/100", PCT1)
    formule(b, f"F{y}", "=0" if i == 0 else f"=G{y-1}", '0.00')
    formule(b, f"G{y}", f"=MAX(0,2*C{y}-F{y})", '0.00')
    formule(b, f"H{y}", f"=MIN(F{y},G{y})", '0.00'); formule(b, f"I{y}", f"=MAX(F{y},G{y})", '0.00')
    formule(b, f"J{y}", f"=IF(I{y}<={plaf},0,IF(H{y}>={plaf},B{y}*((F{y}+G{y})/2-{plaf}),B{y}*(I{y}-{plaf})/(I{y}-H{y})*(I{y}-{plaf})/2))", '0.0000')
    formule(b, f"K{y}", f"=IF(I{y}<={plaf},0,IF(H{y}>={plaf},B{y},B{y}*(I{y}-{plaf})/(I{y}-H{y})))", '0.0000')
z = 22 + len(labels)
texte(b, f"A{z+1}", "Total", gras=True)
formule(b, f"B{z+1}", f"=SUM(B23:B{z})", PCT1); formule(b, f"C{z+1}", f"=SUMPRODUCT(B23:B{z},C23:C{z})", '0.00')
formule(b, f"J{z+1}", f"=SUM(J23:J{z})", '0.0000', gras=True); formule(b, f"K{z+1}", f"=SUM(K23:K{z})", '0.0000', gras=True)
P0 = z + 3
texte(b, f"A{P0}", "Paramètres et résultats", gras=True)
pb = [("Taux d'effort moyen publié, ensemble (%)", sr["effortPrive"]["moyenne"], '0.00', "Drees, encadré 3"),
      ("Primes et restes à charge moyens par ménage, 2019 (€)", sr["effortPrive"]["depenseMoyenneMenage"], EUR, "Drees, tableau A : 1 021 € + 387 €"),
      ("Ménages (champ de l'enquête)", sr["menages"]["valeur"], NB, sr["menages"]["source"] + " ; 2,2 personnes par ménage"),
      ("Évolution 2019 → 2024 des dépenses payées par les complémentaires et les ménages", sr["evolution2019_2024"], '0.000', "Drees, comptes de la santé : 44,3 Md€ en 2019, 52,5 Md€ en 2024")]
CALC_PB = ["Moyenne publiée des taux d'effort des dix dixièmes.", "1 021 € de primes + 387 € de restes à charge.", "63,4 millions de personnes ÷ 2,2 personnes par ménage.", "(32,52 + 19,96) ÷ (26,74 + 17,52) Md€."]
for i, (lib, v, fmt, src) in enumerate(pb, start=P0 + 1):
    texte(b, f"A{i}", lib); b.merge_cells(f"A{i}:B{i}"); entree(b, f"C{i}", v, fmt, cle=False); texte(b, f"D{i}", src)
    texte(b, f"I{i}", CALC_PB[i - P0 - 1], italique=True)
rb = [("Primes et restes à charge, 2024 (Md€)", f"=C{P0+2}*C{P0+3}*C{P0+4}/1E9", MD),
      ("Bouclier : coût (Md€)", f"=J{z+1}/C{P0+1}*C{P0+5}", MD2),
      ("Bouclier : ménages bénéficiaires", f"=K{z+1}*C{P0+3}", NB),
      ("Part de l'aide pour des ménages de retraités", f"=IF(J{z+1}>0,SUMPRODUCT(J23:J{z},D23:D{z}+E23:E{z})/J{z+1},0)", PCT1),
      ("… dont retraités modestes", f"=IF(J{z+1}>0,SUMPRODUCT(J23:J{z},D23:D{z})/J{z+1},0)", PCT1)]
for i, (lib, f, fmt) in enumerate(rb, start=P0 + 5):
    texte(b, f"A{i}", lib); b.merge_cells(f"A{i}:B{i}"); formule(b, f"C{i}", f, fmt, gras=i > P0 + 5, res=i > P0 + 5)
texte(b, f"A{P0+11}", "Coût = (effort au-delà du plafond) ÷ (effort moyen) × dépense totale, en supposant des revenus égaux entre groupes (majorant probable : les ménages les plus exposés sont souvent modestes). Profil linéaire dans chaque groupe, intégré exactement ; le site l'approche par 200 points par groupe.", italique=True)

sources(wb, [
    ("Taux d'effort, bouclier", sr["effortPrive"]["source"], sr["effortPrive"]["url"]),
    ("Taux d'effort par niveau de vie", eff["source"], eff["url"]),
    ("Déficit de la branche maladie", sr["deficitMaladie"]["source"], sr["deficitMaladie"]["url"]),
    ("Cotisation maladie sur les complémentaires", sr["cotisationMaladie"]["source"], sr["cotisationMaladie"]["url"]),
    ("Ménages", sr["menages"]["source"], sr["menages"]["url"]),
    ("CSG des retraités", csg["retraites"]["source"], csg["retraites"]["url"]),
    ("Part des pensions de base", G["ipp"]["source"], G["ipp"]["url"]),
    ("Composition des revenus", N["composition"]["source"], None),
])
verification(wb, VERIF)
police_partout(wb)
wb.move_sheet("Lisez-moi", offset=-len(wb.sheetnames))
wb.save(sys.argv[1])
