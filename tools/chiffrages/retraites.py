import sys
from commun import *

pr = P["prel"]; csg = pr["csg"]; tva = pr["tva"]; M = P["macro"]; RT = P["retraites"]; G = P["gel"]; N = P["ndv"]; RD = P["rendement"]
wb = nouveau()
lisez_moi(wb, "Chiffrage de l'espace Retraites", [
    ("Contenu",),
    "Paramètres : données communes à toutes les réformes (CSG, TVA, emploi, salaires, pensions, composition des revenus), avec leurs sources.",
    "Une feuille par réforme de Retraites › Simuler : TVA sociale, CSG des retraités, Retraites sans impôts, Gel des hautes pensions, Plafond des pensions. Chaque feuille reprend les curseurs du site (cellules jaunes).",
    "Niveaux de vie : effet de chaque réforme sur le niveau de vie médian des actifs et des retraités, et cumul des réformes choisies (Oui/Non).",
    "Rendement : pensions reçues pour 100 000 € cotisés pour une génération, calé sur le TRI du COR (calcul trimestre par trimestre).",
    "Sources : références de chaque donnée.",
    ("Vérification",),
    "Avec les réglages par défaut du site, chaque résultat est identique à celui du site (écart inférieur à 0,01 Md€ ou à 1 €).",
    ("Limites",),
    "Ordres de grandeur, sans effets de comportement. Les hypothèses du site (assiettes de CSG par taux, distribution des pensions portée à 2026, composition des revenus) sont décrites à côté de chaque valeur.",
])

# ---------- Paramètres ----------
p = feuille(wb, "Paramètres", "Paramètres communs", "Données sourcées ; modifiables (texte bleu).", [58, 16, 90])
entete(p, 4, ["Paramètre", "Valeur", "Source"])
PR = {}
def par(cle, lib, v, fmt, src):
    r = 5 + len(PR)
    texte(p, f"A{r}", lib, wrap=True); entree(p, f"B{r}", v, fmt, cle=False); texte(p, f"C{r}", src, wrap=True)
    PR[cle] = f"Paramètres!$B${r}"
par("emploi", "Personnes en emploi", M["personnesEnEmploi"]["valeur"], NB, M["personnesEnEmploi"]["source"])
par("masse", "Masse salariale brute (Md€)", M["masseSalarialeBrute"]["valeur"] / 1e9, NB1, M["masseSalarialeBrute"]["source"])
par("ratio", "Ratio salaire net / brut", M["ratioNetSurBrut"]["valeur"], PCT1, M["ratioNetSurBrut"]["source"])
par("csgAct", "Taux de CSG sur les revenus d'activité", csg["activite"]["taux"], PCT1, "Code de la sécurité sociale, art. L136-8")
par("assiette", "Assiette de la CSG d'activité (part du brut)", csg["activite"]["assiette"], PCT2, "98,25 % du salaire brut")
par("point", "Valeur d'un point de CSG sur les revenus d'activité (Md€)", csg["activite"]["valeurPoint"], NB1, csg["activite"]["source"])
for t in csg["retraites"]["taux"]:
    par("taux_" + t["id"], f"CSG des retraités : {t['label']}", t["taux"], PCT1, csg["retraites"]["source"])
for k in ["normal", "median", "reduit"]:
    par("ass_" + k, f"Assiette des pensions au taux {k} (Md€, calibrée sur les recettes de CSG)", csg["retraites"]["assiettes"][k], NB1, "Estimation du site, calibrée sur les recettes de CSG 2025 (CCSS, mai 2026)")
for k, v in csg["retraites"]["repartitionRetraites"].items():
    if k != "source": par("rep_" + k, f"Part des retraités au taux {k}", v, PCT1, csg["retraites"]["repartitionRetraites"]["source"])
par("tvaNormal", "Rendement net d'un point de TVA, taux normal (Md€)", tva["pointNet"]["normal"], NB1, tva["pointNet"]["source"])
par("tvaTous", "Rendement net d'un point de TVA, tous les taux (Md€)", tva["pointNet"]["tousTaux"], NB1, tva["pointNet"]["source"])
par("ppaNormal", "Perte de pouvoir d'achat par point de TVA, taux normal", tva["pertePouvoirAchatParPoint"]["normal"], '0.000%', tva["pertePouvoirAchatParPoint"]["source"])
par("ppaTous", "Perte de pouvoir d'achat par point de TVA, tous les taux", tva["pertePouvoirAchatParPoint"]["tousTaux"], '0.000%', tva["pertePouvoirAchatParPoint"]["source"])
par("partPensions", "Part des pensions dans le revenu des ménages retraités", N["composition"]["partPensions"], PCT1, N["composition"]["source"])
par("partActivite", "Part des revenus d'activité dans le revenu des ménages actifs", N["composition"]["partActivite"], PCT1, N["composition"]["source"])
par("pensionsTotales", "Masse des pensions (Md€)", N["pensionsTotales"]["valeur"], NB1, N["pensionsTotales"]["source"])
par("depenses", "Dépenses de retraite 2025 (Md€)", RT["depenses"]["valeur"], NB1, RT["depenses"]["source"])
par("pensionMoy", "Pension moyenne nette de droit direct (€/mois)", RT["pensionMoyenneNette"]["valeur"], EUR, RT["pensionMoyenneNette"]["source"])

def gainCsg(sal, pts):  # gain mensuel d'un salarié pour une baisse de CSG de pts points
    return f"({sal}/{PR['ratio']})*{PR['assiette']}*({pts}/100)"
def gainNet(pts):  # hausse du salaire net en part
    return f"({PR['assiette']}*{pts}/100/{PR['ratio']})"

def entrees(ws, lignes, debut=4):
    refs = {}
    for i, (cle, lib, v, fmt, opts) in enumerate(lignes, start=debut):
        texte(ws, f"A{i}", lib, wrap=True); entree(ws, f"B{i}", v, fmt)
        if opts: liste(ws, f"B{i}", opts)
        refs[cle] = f"$B${i}"
    return refs
def resultats(ws, lignes, debut, col="A", colv="B"):
    refs = {}
    for i, (cle, lib, f, fmt, cle_res) in enumerate(lignes, start=debut):
        texte(ws, f"{col}{i}", lib, wrap=True); formule(ws, f"{colv}{i}", f, fmt, gras=cle_res, res=cle_res)
        refs[cle] = f"${colv}${i}"
    return refs
EFFETS = {}

# ---------- TVA sociale ----------
t = feuille(wb, "TVA sociale", "TVA sociale : une hausse de TVA dont toute la recette baisse la CSG des actifs", None, [60, 18, 50])
e = entrees(t, [("pts", "Hausse de la TVA (points)", 2, "0.0", None), ("cible", "Taux concernés", "Taux normal", None, ["Taux normal", "Tous les taux"]),
                ("rep", "Part de la hausse répercutée dans les prix", 1, PCT1, None), ("sal", "Salaire net mensuel (€)", 2100, EUR, None), ("pen", "Pension nette mensuelle (€)", 1541, EUR, None)])
r = resultats(t, [
    ("rec", "Recettes (Md€)", f'={e["pts"]}*IF({e["cible"]}="Taux normal",{PR["tvaNormal"]},{PR["tvaTous"]})', MD, False),
    ("baisse", "Baisse de CSG des actifs (points)", f'=MIN({PR["csgAct"]}*100,B10/{PR["point"]})', '0.00', True),
    ("prix", "Hausse des prix (part du revenu)", f'={e["pts"]}*IF({e["cible"]}="Taux normal",{PR["ppaNormal"]},{PR["ppaTous"]})*{e["rep"]}', PCT2, False),
    ("gain", "Actif : gain sur la paie (€/mois)", "=" + gainCsg(e["sal"], "B11"), EUR2, False),
    ("cout", "Actif : hausse des prix (€/mois)", f'={e["sal"]}*B12', EUR2, False),
    ("solde", "Actif : solde (€/mois)", "=B13-B14", EUR2, True),
    ("ret", "Retraité : perte la première année (€/mois)", f'={e["pen"]}*B12', EUR2, True),
    ("ea", "Effet sur le niveau de vie des actifs", f'={PR["partActivite"]}*{gainNet("B11")}-B12', PCT2, False),
    ("er", "Effet sur le niveau de vie des retraités", "=-B12", PCT2, False),
], 10)
EFFETS["TVA sociale"] = ("'TVA sociale'!B17", "'TVA sociale'!B18")

# ---------- CSG des retraités ----------
c = feuille(wb, "CSG retraités", "CSG des retraités alignée sur celle des actifs (9,2 %), recette reversée aux actifs", None, [60, 18, 14, 14, 14, 14])
e = entrees(c, [("portee", "Retraités concernés", "Taux normal seulement", None, ["Taux normal seulement", "Tous ceux qui paient la CSG"]),
                ("pen", "Votre pension brute mensuelle (€)", 1800, EUR, None), ("taux", "Votre taux de CSG actuel", "normal", None, ["exonere", "reduit", "median", "normal"]),
                ("sal", "Salaire net mensuel d'un actif (€)", 2100, EUR, None)])
entete(c, 9, ["Taux", "Taux actuel", "Assiette (Md€)", "Concerné", "Nouveau taux", "Recette (Md€)"])
ids = ["exonere", "reduit", "median", "normal"]
for i, k in enumerate(ids, start=10):
    texte(c, f"A{i}", k); formule(c, f"B{i}", f"={PR['taux_' + k]}", PCT1, lien=True)
    formule(c, f"C{i}", f"={PR['ass_' + k]}" if k != "exonere" else "=0", NB1, lien=k != "exonere")
    formule(c, f"D{i}", f'=IF({e["portee"]}="Taux normal seulement",IF(A{i}="normal",1,0),IF(A{i}="exonere",0,1))', "0")
    formule(c, f"E{i}", f'=IF(D{i}=1,{PR["csgAct"]},B{i})', PCT1)
    formule(c, f"F{i}", f"=D{i}*C{i}*({PR['csgAct']}-B{i})", NB3)
r = resultats(c, [
    ("rec", "Recettes (Md€)", "=SUM(F10:F13)", MD2, True),
    ("baisse", "Baisse de CSG des actifs (points)", f"=B15/{PR['point']}", '0.000', False),
    ("gain", "Gain d'un actif (€/mois)", "=" + gainCsg(e["sal"], "B16"), EUR2, False),
    ("perte", "Perte de votre pension (€/mois)", f'={e["pen"]}*MAX(0,INDEX(E10:E13,MATCH({e["taux"]},A10:A13,0))-INDEX(B10:B13,MATCH({e["taux"]},A10:A13,0)))', EUR2, True),
    ("ea", "Effet sur le niveau de vie des actifs", f'={PR["partActivite"]}*{gainNet("B16")}', PCT2, False),
    ("er", "Effet sur le niveau de vie des retraités", f'=-{PR["partPensions"]}*B15/{PR["pensionsTotales"]}', PCT2, False),
], 15)
EFFETS["CSG des retraités"] = ("'CSG retraités'!B19", "'CSG retraités'!B20")

# ---------- Retraites sans impôts ----------
f = feuille(wb, "Sans impôts", "Retraites financées par leurs seules ressources « logiques »", "Gardée = 1 : la ressource continue de financer les retraites. Les ressources « fixes » sont toujours gardées.", [70, 14, 10, 10, 14])
e = entrees(f, [("part", "Part du trou comblée par une baisse des pensions (le reste : hausse des cotisations)", 0.5, PCT1, None),
                ("pen", "Pension nette mensuelle (€)", 1541, EUR, None), ("sal", "Salaire net mensuel (€)", 2100, EUR, None),
                ("vers", "Argent public libéré reversé aux actifs (Md€ par an)", 0, MD, None)])
entete(f, 9, ["Ressource (COR 2026, tableau 2.2)", "Montant (Md€)", "Fixe", "Gardée (1/0)", "Retirée (Md€)"])
for i, rs in enumerate(RT["ressources"], start=10):
    texte(f, f"A{i}", rs["label"], wrap=True); entree(f, f"B{i}", rs["montant"], NB1, cle=False)
    entree(f, f"C{i}", 1 if rs.get("fixe") else 0, "0", cle=False)
    if rs.get("fixe"): formule(f, f"D{i}", "=1", "0")
    else: entree(f, f"D{i}", 1 if rs.get("logique") else 0, "0")
    formule(f, f"E{i}", f"=IF(OR(C{i}=1,D{i}=1),0,B{i})", NB1)
z = 9 + len(RT["ressources"])
r = resultats(f, [
    ("retire", "Ressources retirées : le trou à combler (Md€)", f"=SUM(E10:E{z})", MD, True),
    ("pp", "Comblé par la baisse des pensions (Md€)", f"=B{z+2}*{e['part']}", MD, False),
    ("pc", "Comblé par la hausse des cotisations (Md€)", f"=B{z+2}-B{z+3}", MD, False),
    ("bp", "Baisse des pensions", f"=B{z+3}/{PR['depenses']}", PCT2, True),
    ("hc", "Hausse des cotisations (points de salaire brut)", f"=B{z+4}/{PR['masse']}", PCT2, True),
    ("pa", "Pension après (€/mois)", f"={e['pen']}*(1-B{z+5})", EUR2, False),
    ("ps", "Perte sur le salaire (€/mois)", f"={e['sal']}/{PR['ratio']}*B{z+6}", EUR2, False),
    ("ea", "Effet sur le niveau de vie des actifs", f"={PR['partActivite']}*(-B{z+6}/{PR['ratio']}+{e['vers']}/({PR['masse']}*{PR['ratio']}))", PCT2, False),
    ("er", "Effet sur le niveau de vie des retraités", f"=-{PR['partPensions']}*B{z+5}", PCT2, False),
], z + 2)
EFFETS["Retraites sans impôts"] = (f"'Sans impôts'!B{z+9}", f"'Sans impôts'!B{z+10}")

# ---------- distribution des pensions (commune Gel / Plafond) ----------
def distribution(ws, l0, seuil, facteur, sommet):
    entete(ws, l0, ["De (€ 2020)", "À (€ 2020)", "Part (%)", "De (€ 2026)", "À (€ 2026)", "Contribution à la moyenne", "Part au-dessus du seuil", "Masse au-dessus", "Masse au-delà du seuil"])
    tr = G["distribution2020"]["tranches"]
    for i, (de, a, pct) in enumerate(tr):
        x = l0 + 1 + i
        entree(ws, f"A{x}", de, NB, cle=False); entree(ws, f"C{x}", pct, '0.00', cle=False)
        formule(ws, f"D{x}", f"=A{x}*{facteur}", NB)
        if a is None:
            texte(ws, f"B{x}", "et plus")
            formule(ws, f"E{x}", f"={sommet}*{facteur}", NB)  # point moyen de la dernière tranche
            formule(ws, f"F{x}", f"=C{x}/100*E{x}", NB1)
            formule(ws, f"G{x}", f"=IF(E{x}>{seuil},C{x}/100,0)", '0.0000')
            formule(ws, f"H{x}", f"=IF(E{x}>{seuil},C{x}/100*E{x},0)", NB1)
            formule(ws, f"I{x}", f"=IF(E{x}>{seuil},C{x}/100*(E{x}-{seuil}),0)", NB1)
        else:
            entree(ws, f"B{x}", a, NB, cle=False)
            formule(ws, f"E{x}", f"=B{x}*{facteur}", NB)
            formule(ws, f"F{x}", f"=C{x}/100*(D{x}+E{x})/2", NB1)
            q = f"(C{x}/100*(E{x}-MAX(D{x},{seuil}))/(E{x}-D{x}))"
            formule(ws, f"G{x}", f"=IF(E{x}<={seuil},0,{q})", '0.0000')
            formule(ws, f"H{x}", f"=IF(E{x}<={seuil},0,{q}*(MAX(D{x},{seuil})+E{x})/2)", NB1)
            formule(ws, f"I{x}", f"=IF(E{x}<={seuil},0,{q}*(MAX(D{x},{seuil})+E{x})/2-{q}*{seuil})", NB1)
    zz = l0 + len(tr)
    tot = zz + 1
    texte(ws, f"A{tot}", "Total (par retraité, €/mois)", gras=True)
    for col in "FGHI":
        formule(ws, f"{col}{tot}", f"=SUM({col}{l0+1}:{col}{zz})", '0.0000' if col == "G" else NB1, gras=True)
    return tot

# ---------- Gel ----------
g = feuille(wb, "Gel", "Gel de la revalorisation des pensions au-delà d'un seuil", "Calé sur l'IPP (2026) : pension de base = deux tiers, économie nette des finances publiques, taux d'annuité.", [58, 16, 12, 12, 12, 14, 14, 14, 14])
e = entrees(g, [("seuil", "Seuil de pension totale brute (€/mois)", 2000, EUR, None), ("taux", "Revalorisation non versée", G["revalorisation2026"], PCT1, None),
                ("mode", "Ce qui n'est pas revalorisé", "Toute la pension", None, ["Toute la pension", "Seulement au-delà du seuil"]),
                ("base", "Part de la pension venant des régimes de base", G["partBase"], PCT1, None),
                ("futurs", "Appliquer aussi aux futurs retraités (taux d'annuité)", "Non", None, ["Oui", "Non"]),
                ("pen", "Votre pension brute mensuelle totale (€)", 2500, EUR, None), ("sal", "Salaire net d'un actif (€/mois)", 2100, EUR, None)])
pg = [("ret", "Retraités de droit direct", G["retraites"]["valeur"], NB, G["retraites"]["source"]), ("fac", "Passage des euros 2020 aux pensions 2026", G["facteur2026"], '0.00', "Estimation du site (COR, figure 3.25 ; revalorisations 2025-2026)"),
      ("som", "Pension moyenne de la tranche ouverte « 4 500 € et plus » (€ 2020)", G["distribution2020"]["sommet"], NB, "Estimation du site, cohérente avec la pension moyenne totale fin 2020"),
      ("net", "Économie nette / économie des régimes (finances publiques)", G["ipp"]["effetNet"], PCT1, G["ipp"]["source"] + " : « environ 20 % à 25 % » de moins"),
      ("sortie", "Sortie annuelle des retraités actuels (décès)", G["sortieAnnuelle"], PCT1, G["deces"]["source"]), ("an", "Horizon (années après 2026)", 10, "0", "2036"),
      ("tp", "Taux plein", G["ipp"]["tauxPlein"], PCT1, "Régime général"), ("tr", "Trimestres requis", G["ipp"]["trimestresRequis"], "0", "Générations nées à partir de 1965"),
      ("prel", "Prélèvements sur une pension au taux normal (CSG, CRDS, Casa)", G["prelevementsTauxNormal"], PCT1, "8,3 % + 0,5 % + 0,3 %"),
      ("epa", "Taux d'épargne des ménages de 70 ans ou plus", G["epargne"]["plus70"], PCT1, G["epargne"]["source"])]
for i, (cle, lib, v, fmt, src) in enumerate(pg, start=12):
    texte(g, f"A{i}", lib, wrap=True); entree(g, f"B{i}", v, fmt, cle=False); texte(g, f"C{i}", src); e[cle] = f"$B${i}"
L = 50
tot = distribution(g, L, e["seuil"], e["fac"], e["som"])
res = [
    ("part", "Part des retraités au-dessus du seuil", f"=G{tot}", PCT1, False),
    ("conc", "Retraités concernés", f"=G{tot}*{e['ret']}", NB, False),
    ("eco", "Économie des régimes, première année (Md€)", f'={e["ret"]}*12*IF({e["mode"]}="Toute la pension",H{tot},I{tot})*{e["base"]}*{e["taux"]}/1E9', MD2, True),
    ("ecoNet", "Gain net pour les finances publiques (Md€)", f"=B26*{e['net']}", MD2, False),
    ("traj", "Économie la dernière année de l'horizon (Md€)", f'=IF({e["futurs"]}="Oui",B26,B26*(1-{e["sortie"]})^{e["an"]})', MD2, True),
    ("cumul", "Cumul sur l'horizon, première année comprise (Md€)", f'=IF({e["futurs"]}="Oui",B26*({e["an"]}+1),B26*(1-(1-{e["sortie"]})^({e["an"]}+1))/{e["sortie"]})', MD, False),
    ("perte", "Votre perte (€ brut par mois)", f'=IF({e["pen"]}<={e["seuil"]},0,IF({e["mode"]}="Toute la pension",{e["pen"]},{e["pen"]}-{e["seuil"]})*{e["base"]}*{e["taux"]})', EUR2, True),
    ("trAv", "Valeur d'un trimestre aujourd'hui (part du salaire de référence)", f"={e['tp']}/{e['tr']}", '0.000%', False),
    ("trAp", "Valeur d'un trimestre pour un futur retraité concerné", f'=IF({e["mode"]}="Toute la pension",B31*(1-{e["taux"]}),IF({e["pen"]}>{e["seuil"]},B31*(1-{e["taux"]}*({e["pen"]}-{e["seuil"]})/{e["pen"]}),"sous le seuil"))', '0.000%', False),
    ("baisse", "Baisse de CSG des actifs (points)", f"=B26/{PR['point']}", '0.000', False),
    ("gain", "Gain d'un actif (€/mois)", "=" + gainCsg(e["sal"], "B33"), EUR2, False),
    ("pn", "Votre perte nette (€/mois)", f"=B30*(1-{e['prel']})", EUR2, False),
    ("ep", "Épargne mensuelle à cette pension (€)", f"={e['pen']}*(1-{e['prel']})*{e['epa']}", EUR, False),
    ("pe", "La perte en part de cette épargne", "=IF(B36>0,B35/B36,0)", PCT1, False),
    ("ea", "Effet sur le niveau de vie des actifs", f"={PR['partActivite']}*{gainNet('B33')}", PCT2, False),
    ("er", "Effet sur le niveau de vie des retraités", f"=-{PR['partPensions']}*B26/{PR['pensionsTotales']}", PCT2, False),
    ("mt", "Masse totale des pensions (Md€, contrôle)", f"={e['ret']}*12*F{tot}/1E9", MD, False),
]
resultats(g, res, 24)
texte(g, "A23", "Résultats", gras=True); texte(g, f"A{L-1}", "Distribution des pensions totales brutes (Drees, EIR 2020, tableau 5), portée à 2026", gras=True)
EFFETS["Gel des hautes pensions"] = ("Gel!B38", "Gel!B39")

# ---------- Plafond ----------
pl = feuille(wb, "Plafond", "Plafond des pensions : aucune pension totale au-delà d'un montant choisi", None, [58, 16, 12, 12, 12, 14, 14, 14, 14])
e = entrees(pl, [("plaf", "Plafond de la pension totale brute (€/mois)", 4000, EUR, None), ("pen", "Votre pension brute mensuelle (€)", 5000, EUR, None),
                 ("vers", "Part de l'économie versée aux actifs (salaires)", 0, PCT1, None)])
e["ret"] = "Gel!$B$12"; e["fac"] = "Gel!$B$13"; e["som"] = "Gel!$B$14"
texte(pl, "A8", "Retraités, facteur 2020 → 2026 et tranche ouverte : repris de la feuille Gel.", italique=True)
L = 30
tot = distribution(pl, L, e["plaf"], e["fac"], e["som"])
resultats(pl, [
    ("part", "Part des retraités au-dessus du plafond", f"=G{tot}", PCT1, False),
    ("conc", "Retraités concernés", f"=G{tot}*{e['ret']}", NB, False),
    ("eco", "Économie annuelle (Md€)", f"={e['ret']}*12*I{tot}/1E9", MD2, True),
    ("pc", "En part de l'ensemble des pensions", f"=B13/({e['ret']}*12*F{tot}/1E9)", PCT1, False),
    ("net", "Gain net pour les finances publiques (Md€)", "=B13*Gel!$B$15", MD2, False),
    ("perte", "Votre perte (€ brut par mois)", f"=MAX(0,{e['pen']}-{e['plaf']})", EUR, True),
    ("ea", "Effet sur le niveau de vie des actifs", f"={PR['partActivite']}*(B13*{e['vers']}/({PR['masse']}*{PR['ratio']}))", PCT2, False),
    ("er", "Effet sur le niveau de vie des retraités", f"=-{PR['partPensions']}*B13/{PR['pensionsTotales']}", PCT2, False),
], 11)
texte(pl, "A10", "Résultats", gras=True); texte(pl, f"A{L-1}", "Distribution des pensions (même source que la feuille Gel)", gras=True)
EFFETS["Plafond des pensions"] = ("Plafond!B17", "Plafond!B18")

# ---------- Niveaux de vie ----------
n = feuille(wb, "Niveaux de vie", "Retraités et actifs : niveau de vie médian, et effet des réformes choisies", "Effets cumulés multiplicativement ; hypothèse : l'effet « actifs » s'applique aux personnes en emploi, l'effet « retraités » aux retraités.", [34, 12, 16, 16, 14, 14])
entete(n, 4, ["Réforme", "Inclure", "Effet actifs", "Effet retraités", "Facteur actifs", "Facteur retraités"])
for i, (nom, (ea, er)) in enumerate(EFFETS.items(), start=5):
    texte(n, f"A{i}", nom); entree(n, f"B{i}", "Oui"); liste(n, f"B{i}", ["Oui", "Non"])
    formule(n, f"C{i}", "=" + ea, PCT2, lien=True); formule(n, f"D{i}", "=" + er, PCT2, lien=True)
    formule(n, f"E{i}", f'=IF(B{i}="Oui",1+C{i},1)', '0.0000'); formule(n, f"F{i}", f'=IF(B{i}="Oui",1+D{i},1)', '0.0000')
z = 4 + len(EFFETS)
an = N["annees"]; k = len(an) - 1
resultats(n, [
    ("ca", "Effet cumulé, actifs", f"=PRODUCT(E5:E{z})-1", PCT2, True),
    ("cr", "Effet cumulé, retraités", f"=PRODUCT(F5:F{z})-1", PCT2, True),
], z + 2)
texte(n, f"A{z+5}", f"Niveaux de vie médians {an[-1]} (€ 2024 par an)", gras=True)
entete(n, z + 6, ["", "Avant", "Après", "Par mois avant", "Par mois après"])
texte(n, f"A{z+7}", "Personnes en emploi"); entree(n, f"B{z+7}", N["series"]["emploi"][k], EUR, cle=False)
formule(n, f"C{z+7}", f"=B{z+7}*(1+B{z+2})", EUR); formule(n, f"D{z+7}", f"=B{z+7}/12", EUR); formule(n, f"E{z+7}", f"=C{z+7}/12", EUR)
texte(n, f"A{z+8}", "Retraités"); entree(n, f"B{z+8}", N["series"]["retraites"][k], EUR, cle=False)
formule(n, f"C{z+8}", f"=B{z+8}*(1+B{z+3})", EUR); formule(n, f"D{z+8}", f"=B{z+8}/12", EUR); formule(n, f"E{z+8}", f"=C{z+8}/12", EUR)
texte(n, f"A{z+9}", "Retraités / en emploi", gras=True); formule(n, f"B{z+9}", f"=B{z+8}/B{z+7}", PCT1, gras=True, res=True); formule(n, f"C{z+9}", f"=C{z+8}/C{z+7}", PCT1, gras=True, res=True)
h0 = z + 12
texte(n, f"A{h0-1}", "Série 1996-2024 (Insee, ERFS, € constants 2024, médianes annuelles)", gras=True)
entete(n, h0, ["Année", "Ensemble", "Retraités", "En emploi", "Retraités / en emploi"])
for i, a in enumerate(an):
    x = h0 + 1 + i
    entree(n, f"A{x}", a, "0", cle=False)
    entree(n, f"B{x}", N["series"]["ensemble"][i], NB, cle=False); entree(n, f"C{x}", N["series"]["retraites"][i], NB, cle=False); entree(n, f"D{x}", N["series"]["emploi"][i], NB, cle=False)
    formule(n, f"E{x}", f"=C{x}/D{x}", PCT1)

# ---------- Rendement ----------
w = feuille(wb, "Rendement", "Pensions reçues pour 100 000 € cotisés, selon la génération", "Modèle du site calé sur le TRI du COR (cas type non-cadre, carrière complète), trimestre par trimestre. Valeurs actualisées en plus de l'évolution des salaires.", [48, 14, 12, 12, 12, 12, 12, 4, 12, 12, 12, 12, 12, 12])
gens = RD["generations"]
e = entrees(w, [("gen", "Génération (année de naissance)", 1960, "0", [str(x["annee"]) for x in gens]), ("r", "Taux d'actualisation (en plus des salaires)", 0, PCT2, None),
                ("dec", "Décrochage annuel des pensions par rapport aux salaires", RD["decrochagePension"], PCT1, None), ("imp", "Compter aussi les impôts affectés aux retraites", "Non", None, ["Oui", "Non"])])
w["B4"].value = 1960
dv = DataValidation(type="list", formula1='"' + ",".join(str(x["annee"]) for x in gens) + '"'); w.add_data_validation(dv); dv.add(w["B4"])
w.data_validations.dataValidation = [d for d in w.data_validations.dataValidation if "B4" not in str(d.sqref) or d is dv]
entete(w, 10, ["Génération", "TRI (COR)", "Durée de retraite", "Espérance de vie à 60 ans", "Durée de carrière"])
for i, gg in enumerate(gens, start=11):
    entree(w, f"A{i}", gg["annee"], "0", cle=False); entree(w, f"B{i}", gg["tri"], PCT2, cle=False)
    entree(w, f"C{i}", gg["dureeRetraite"], '0.00', cle=False); entree(w, f"D{i}", gg["esperanceA60"], '0.00', cle=False); entree(w, f"E{i}", gg["dureeCarriere"], '0.00', cle=False)
gz = 10 + len(gens)
look = lambda col: f"INDEX({col}$11:{col}${gz},MATCH({e['gen']},$A$11:$A${gz},0))"
# impôts : tables d'interpolation
ih = RD["impots"]["partHorsCotisations"]; iq = RD["impots"]["partPayeeParRetraites"]
texte(w, "I9", "Part des ressources hors cotisations (COR)", gras=True)
entete(w, 10, ["Année", "Part"], col=9)
for i, (an_, v) in enumerate(sorted(ih.items(), key=lambda x: int(x[0])), start=11):
    entree(w, f"I{i}", int(an_), "0", cle=False); entree(w, f"J{i}", v, PCT2, cle=False)
iz = 10 + len(ih)
texte(w, "L9", "Part payée par les retraités", gras=True)
entete(w, 10, ["Année", "Part"], col=12)
for i, (an_, v) in enumerate(sorted(iq.items(), key=lambda x: int(x[0])), start=11):
    entree(w, f"L{i}", int(an_), "0", cle=False); entree(w, f"M{i}", v, PCT2, cle=False)
qz = 10 + len(iq)
def interp(y, kc, vc, z0, z1):
    K = f"${kc}${z0}:${kc}${z1}"; V = f"${vc}${z0}:${vc}${z1}"
    i = f"MATCH({y},{K},1)"
    return (f"IF({y}<=${kc}${z0},${vc}${z0},IF({y}>=${kc}${z1},${vc}${z1},"
            f"INDEX({V},{i})+(INDEX({V},{i}+1)-INDEX({V},{i}))*({y}-INDEX({K},{i}))/(INDEX({K},{i}+1)-INDEX({K},{i}))))")
cal = 30
resultats(w, [
    ("tri", "TRI de la génération (COR)", "=" + look("B"), PCT2, False),
    ("dep", "Âge de départ", f"=60+{look('D')}-{look('C')}", '0.00', False),
    ("deb", "Âge de début de carrière", f"=B{cal+1}-{look('E')}", '0.00', False),
    ("fin", "Âge de fin de retraite", f"=B{cal+1}+{look('C')}", '0.00', False),
    ("k", "Calage : pension / cotisation (au TRI du COR)", "=SUM(D60:D259)/SUM(I60:I259)", '0.0000', False),
    ("res", "Pensions reçues pour 100 000 € cotisés (valeur actualisée)", "=100000*B34*SUM(J60:J259)/SUM(E60:E259)", EUR, True),
], cal)
texte(w, "A29", "Calendrier et résultat", gras=True)
texte(w, "A57", "Grille trimestrielle (pas de 0,25 an ; une ligne compte si l'âge est dans la période)", gras=True)
entete(w, 59, ["Cotisation : âge", "Compte", "Mult. impôts", "Poids au TRI", "Poids actualisé", "", "Pension : âge", "Compte", "Poids au TRI", "Poids actualisé", "", "Mult. impôts"])
for j in range(200):
    x = 60 + j
    formule(w, f"A{x}", f"=$B${cal+2}+0.125+{j}*0.25", '0.000')
    formule(w, f"B{x}", f"=IF(A{x}<$B${cal+1},1,0)", "0")
    yy = f"({e['gen']}+A{x})"
    ext = interp(yy, "I", "J", 11, iz); q = interp(yy, "L", "M", 11, qz)
    formule(w, f"C{x}", f'=IF({e["imp"]}="Oui",1+(({ext})-({q}))/(1-({ext})),1)', '0.0000')
    formule(w, f"D{x}", f"=B{x}*(1+$B${cal})^(-A{x})", '0.0000')
    formule(w, f"E{x}", f"=B{x}*C{x}*(1+{e['r']})^(-A{x})", '0.0000')
    formule(w, f"G{x}", f"=$B${cal+1}+0.125+{j}*0.25", '0.000')
    formule(w, f"H{x}", f"=IF(G{x}<$B${cal+3},1,0)", "0")
    formule(w, f"I{x}", f"=H{x}*(1-{e['dec']})^(G{x}-$B${cal+1})*(1+$B${cal})^(-G{x})", '0.0000')
    yy2 = f"({e['gen']}+G{x})"
    q2 = interp(yy2, "L", "M", 11, qz)
    formule(w, f"L{x}", f'=IF({e["imp"]}="Oui",1-({q2}),1)', '0.0000')
    formule(w, f"J{x}", f"=H{x}*(1-{e['dec']})^(G{x}-$B${cal+1})*L{x}*(1+{e['r']})^(-G{x})", '0.0000')

sources(wb, [
    ("Financement et dépenses des retraites", RT["depenses"]["source"], RT["depenses"]["url"]),
    ("CSG, barème des retraités", csg["retraites"]["source"], csg["retraites"]["url"]),
    ("Recettes de CSG d'activité", csg["activite"]["source"], csg["activite"]["url"]),
    ("TVA : rendement et effet sur les prix", tva["pointNet"]["source"], tva["pointNet"]["url"]),
    ("Distribution des pensions", G["distribution2020"]["source"], G["distribution2020"]["url"]),
    ("Retraités", G["retraites"]["source"], G["retraites"]["url"]),
    ("Sous-indexation, taux d'annuité", G["ipp"]["source"], G["ipp"]["url"]),
    ("Décès", G["deces"]["source"], G["deces"]["url"]),
    ("Épargne des ménages", G["epargne"]["source"], G["epargne"]["url"]),
    ("Niveaux de vie", N["source"], N["url"]),
    ("Composition des revenus", N["composition"]["source"], None),
    ("Rendement par génération", RD["source"], RD["url"]),
    ("Impôts affectés aux retraites", RD["impots"]["source"], RD["impots"]["url"]),
    ("Emploi, salaires", M["personnesEnEmploi"]["source"] + " ; " + M["masseSalarialeBrute"]["source"], M["masseSalarialeBrute"]["url"]),
])
police_partout(wb)
wb.move_sheet("Lisez-moi", offset=-len(wb.sheetnames))
wb.save(sys.argv[1])
