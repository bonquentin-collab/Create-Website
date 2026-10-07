import sys
from commun import *
from verification import BILAN as VERIF

csg = P["prel"]["csg"]; tva = P["prel"]["tva"]; G = P["gel"]; N = P["ndv"]; M = P["macro"]; sr = P["sr"]
taux = {t["id"]: t["taux"] for t in csg["retraites"]["taux"]}
wb = nouveau()
lisez_moi(wb, "Bilan : toutes les mesures, sans double compte", [
    ("Contenu",),
    "Bilan : un scénario d'exemple qui combine des mesures des trois espaces (TVA sociale, CSG des retraités, gel des pensions, mesures santé, IGS…). Chaque recette n'a qu'un usage (affectation unique) et les effets croisés entre mesures sont chiffrés.",
    "Reportez dans les cellules jaunes les montants affichés par chaque simulateur du site (ou par les classeurs Héritage, Retraites et Santé), puis choisissez à quelle mesure va la hausse de CSG des pensions au taux normal.",
    ("Effets croisés chiffrés",),
    "1. La TVA sociale baisse la CSG des actifs : l'alignement de la CSG des retraités « sur les actifs » vise un taux plus bas, jusqu'à ne plus rien rapporter.",
    "2. Gel, plafond ou baisse des pensions : moins de pensions soumises à la CSG et à la cotisation maladie, donc moins de recettes pour les mesures qui les relèvent.",
    "3. Une CSG plus basse pour les actifs fait remonter leur impôt sur le revenu (12,5 % du montant, miroir de l'IPP) ; une CSG plus haute pour les retraités le fait baisser d'autant.",
    "4. La hausse des prix due à la TVA est rendue aux retraités l'année suivante par la revalorisation des pensions : un coût pour les caisses de retraite.",
    ("Limites",),
    "Niveaux de vie : calcul additif simplifié (le site cumule les effets mesure par mesure). Pas d'effet de comportement, ni d'effet de la TVA sur la dépense de santé.",
])

ws = feuille(wb, "Bilan", "Bilan de vos choix : affectation unique et effets croisés", "Scénario d'exemple : TVA sociale de 1 point, CSG des retraités au taux normal affectée à la santé, gel des pensions au-delà de 2 500 €, leviers santé par défaut.", [60, 16, 14, 16, 16, 16, 16])
ent = [
    ("tva", "TVA sociale : points de TVA au taux normal", 1, '0.0', None),
    ("csgR", "Retraites › CSG des retraités : alignement retenu ?", "Oui", None, ["Oui", "Non"]),
    ("portee", "… portée", "normal", None, ["normal", "median-normal"]),
    ("csgS", "Santé : alignement de la CSG des pensions au taux normal retenu ?", "Oui", None, ["Oui", "Non"]),
    ("aff", "Si les deux le retiennent, la hausse du taux normal va à…", "Santé", None, ["Santé", "Retraites"]),
    ("cot", "Santé : recettes de la cotisation maladie sur les pensions de base (Md€)", 2.07, MD2, None),
    ("autres", "Santé : autres leviers, recettes (Md€)", 0, MD2, None),
    ("bou", "Santé : coût du bouclier (Md€)", 3.37, MD2, None),
    ("gel", "Retraites › Gel : économie brute sur les pensions (Md€)", 2.3, MD2, None),
    ("plaf", "Retraites › Plafond : économie brute (Md€)", 0, MD2, None),
    ("plafA", "… part reversée aux actifs", 1, PCT1, None),
    ("baisse", "Retraites › Sans impôts : baisse uniforme des pensions", 0, PCT1, None),
    ("retire", "… ressources publiques libérées (Md€)", 0, MD2, None),
    ("retireA", "… part reversée aux actifs", 0, PCT1, None),
    ("abat", "Retraites › Abattement de 10 % : recettes (Md€)", 0, MD2, None),
    ("igs", "Héritage › IGS : recettes annuelles moyennes (Md€)", 0, MD2, None),
    ("igsA", "… part reversée aux actifs", 0, PCT1, None),
]
e = {}
texte(ws, "A3", "Vos mesures (à reporter depuis le site)", gras=True)
for i, (k, lib, v, fmt, opts) in enumerate(ent, start=4):
    texte(ws, f"A{i}", lib, wrap=True); entree(ws, f"B{i}", v, fmt)
    if opts: liste(ws, f"B{i}", opts)
    e[k] = f"$B${i}"
p0 = 4 + len(ent) + 1
texte(ws, f"A{p0}", "Paramètres", gras=True)
VI = index_verif(VERIF)
par = [
    ("ptTva", "Rendement d'un point de TVA au taux normal (Md€)", tva["pointNet"]["normal"], MD, "tva_point"),
    ("perte", "Perte de pouvoir d'achat moyenne par point de TVA", tva["pertePouvoirAchatParPoint"]["normal"], PCT2, "perte_tva"),
    ("vp", "Valeur d'un point de CSG des actifs (Md€)", csg["activite"]["valeurPoint"], MD, "valeur_point"),
    ("tAct", "Taux de CSG des actifs", csg["activite"]["taux"], PCT1, None),
    ("tNorm", "Taux normal de CSG des pensions", taux["normal"], PCT1, None),
    ("tMed", "Taux médian de CSG des pensions", taux["median"], PCT1, None),
    ("aN", "Assiette des pensions au taux normal (Md€)", csg["retraites"]["assiettes"]["normal"], MD, "ass"),
    ("aM", "Assiette des pensions au taux médian (Md€)", csg["retraites"]["assiettes"]["median"], MD, "ass"),
    ("en", "Part de la CSG gardée après impôt sur le revenu", csg["retraites"]["effetNet"], PCT1, "effet_net"),
    ("enGel", "Gain net / économie brute d'un gel ou d'un plafond (IPP)", G["ipp"]["effetNet"], PCT1, None),
    ("pens", "Masse des pensions (Md€)", N["pensionsTotales"]["valeur"], MD, "pensions"),
    ("pP", "Part des pensions dans le revenu des retraités", N["composition"]["partPensions"], PCT1, None),
    ("pA", "Part des salaires dans le revenu des actifs", N["composition"]["partActivite"], PCT1, None),
    ("mn", "Salaires nets (Md€)", M["masseSalarialeBrute"]["valeur"] / 1e9 * M["ratioNetSurBrut"]["valeur"], MD, None),
    ("def", "Solde de la branche maladie 2026 (Md€)", sr["deficitMaladie"]["valeur"], MD, None),
]
entete(ws, p0 + 1, ["Paramètre", "Valeur", "Type", "Comment c'est calculé"])
for i, (k, lib, v, fmt, cv) in enumerate(par, start=p0 + 2):
    texte(ws, f"A{i}", lib, wrap=True); entree(ws, f"B{i}", v, fmt, cle=False)
    colonnes_verif(ws, i, VI.get(cv), "C", "D")
    e[k] = f"$B${i}"

c0 = p0 + 2 + len(par) + 1
texte(ws, f"A{c0}", "Effets croisés", gras=True)
calc = [
    ("recTva", "Recettes de la TVA sociale (Md€), rendues aux actifs en baisse de CSG", f"={e['tva']}*{e['ptTva']}", MD2),
    ("baisseTva", "Baisse de CSG des actifs due à la TVA sociale (points)", f"=B{{recTva}}/{e['vp']}", '0.00'),
    ("cible", "Taux visé par l'alignement des retraités (taux des actifs après TVA sociale)", f"={e['tAct']}-B{{baisseTva}}/100", PCT2),
    ("aN2", "Assiette au taux normal après gel, plafond et baisse des pensions (Md€)", f"=MAX(0,{e['aN']}*(1-{e['baisse']})-{e['gel']}-{e['plaf']})", MD),
    ("aM2", "Assiette au taux médian après baisse des pensions (Md€)", f"={e['aM']}*(1-{e['baisse']})", MD),
    ("algN", "Alignement du taux normal : recette brute (Md€)", f"=B{{aN2}}*MAX(0,B{{cible}}-{e['tNorm']})", MD2),
    ("algM", "Alignement du taux médian : recette brute (Md€)", f"=B{{aM2}}*MAX(0,B{{cible}}-{e['tMed']})", MD2),
    ("algNsans", "Pour comparaison : alignement du taux normal sans effet croisé (Md€)", f"={e['aN']}*({e['tAct']}-{e['tNorm']})", MD2),
    ("santeTient", "La santé garde la hausse du taux normal ?", f'=IF({e["csgS"]}<>"Oui","Non",IF(OR({e["csgR"]}<>"Oui",{e["aff"]}="Santé"),"Oui","Non"))', None),
    ("retTient", "Les retraites gardent la hausse du taux normal ?", f'=IF({e["csgR"]}<>"Oui","Non",IF(B{{santeTient}}="Oui","Non","Oui"))', None),
    ("csgRnet", "Retraites › CSG : recette nette rendue aux actifs (Md€)", f'=IF({e["csgR"]}="Oui",(IF(B{{retTient}}="Oui",B{{algN}},0)+IF({e["portee"]}="median-normal",B{{algM}},0))*{e["en"]},0)', MD2),
    ("csgS", "Santé : CSG versée à l'Assurance maladie (Md€)", f'=IF(B{{santeTient}}="Oui",B{{algN}},0)', MD2),
    ("cot2", "Santé : cotisation maladie après baisse de l'assiette (Md€)", f"={e['cot']}*(B{{aN2}}+B{{aM2}})/({e['aN']}+{e['aM']})", MD2),
    ("santeNet", "Santé : gain net pour l'Assurance maladie (Md€)", f"=B{{csgS}}+B{{cot2}}+{e['autres']}-{e['bou']}", MD2),
    ("irSante", "Impôt sur le revenu perdu par l'État sur la CSG santé (Md€)", f"=-B{{csgS}}*(1-{e['en']})", MD2),
    ("gelNet", "Gel : gain net rendu aux actifs (Md€)", f"={e['gel']}*{e['enGel']}", MD2),
    ("plafNet", "Plafond : gain net (Md€)", f"={e['plaf']}*{e['enGel']}", MD2),
    ("actifs", "Total rendu aux actifs (Md€)", f"=B{{recTva}}+B{{csgRnet}}+B{{gelNet}}+B{{plafNet}}*{e['plafA']}+{e['retire']}*{e['retireA']}+{e['abat']}+{e['igs']}*{e['igsA']}", MD2),
    ("services", "Total aux services publics (Md€)", f"=B{{plafNet}}*(1-{e['plafA']})+{e['retire']}*(1-{e['retireA']})+{e['igs']}*(1-{e['igsA']})", MD2),
    ("irActifs", "Retour d'impôt sur le revenu des actifs (Md€)", f"=B{{actifs}}*(1-{e['en']})", MD2),
    ("revalo", "Revalorisation des pensions après la TVA sociale (Md€, à partir de la 2e année)", f"=-{e['tva']}*{e['perte']}*{e['pens']}", MD2),
    ("autresC", "Autres comptes publics : effets croisés (Md€)", "=B{irActifs}+B{revalo}+B{irSante}", MD2),
    ("total", "Total mobilisé, effets croisés compris (Md€)", "=B{actifs}+B{services}+B{santeNet}+B{autresC}", MD2),
    ("pdef", "Part du déficit de l'Assurance maladie comblée", f"=IF(B{{santeNet}}>0,MIN(1,B{{santeNet}}/ABS({e['def']})),0)", PCT1),
    ("ptsCsg", "Baisse totale de la CSG des actifs (points)", f"=B{{actifs}}/{e['vp']}", '0.00'),
    ("nvA", "Niveau de vie des actifs (approximation additive)", f"={e['pA']}*B{{actifs}}*{e['en']}/{e['mn']}-{e['tva']}*{e['perte']}", PCT2),
    ("nvR", "Niveau de vie des retraités, première année (approximation additive)", f"=-{e['pP']}*((B{{csgRnet}}/{e['en']})+B{{csgS}}+B{{cot2}}+{e['gel']}+{e['plaf']}+{e['baisse']}*{e['pens']})/{e['pens']}-{e['tva']}*{e['perte']}", PCT2),
]
lignes = {k: c0 + 1 + i for i, (k, *_r) in enumerate(calc)}
for k, lib, f, fmt in calc:
    r = lignes[k]
    texte(ws, f"A{r}", lib, wrap=True)
    cle = k in ("santeNet", "actifs", "total", "pdef", "nvA", "nvR", "algN")
    formule(ws, f"B{r}", f.format(**lignes) if "{" in f else f, fmt, gras=cle, res=cle)

u0 = c0 + len(calc) + 3
texte(ws, f"A{u0-1}", "À quoi sert chaque euro (affectation unique)", gras=True)
entete(ws, u0, ["Mesure", "Gain net", "Actifs", "Services publics", "Assurance maladie", "Autres comptes publics"])
L = lignes
usages = [
    ("TVA sociale", f"=B{L['recTva']}", f"=B{L['recTva']}", "=0", "=0", "=0"),
    ("Retraites › CSG des retraités", f"=B{L['csgRnet']}", f"=B{L['csgRnet']}", "=0", "=0", "=0"),
    ("Retraites › Gel", f"=B{L['gelNet']}", f"=B{L['gelNet']}", "=0", "=0", "=0"),
    ("Retraites › Plafond", f"=B{L['plafNet']}", f"=B{L['plafNet']}*{e['plafA']}", f"=B{L['plafNet']}*(1-{e['plafA']})", "=0", "=0"),
    ("Retraites › Sans impôts", f"={e['retire']}", f"={e['retire']}*{e['retireA']}", f"={e['retire']}*(1-{e['retireA']})", "=0", "=0"),
    ("Retraites › Abattement", f"={e['abat']}", f"={e['abat']}", "=0", "=0", "=0"),
    ("Héritage › IGS", f"={e['igs']}", f"={e['igs']}*{e['igsA']}", f"={e['igs']}*(1-{e['igsA']})", "=0", "=0"),
    ("Santé", f"=B{L['santeNet']}", "=0", "=0", f"=B{L['santeNet']}", "=0"),
    ("Effets croisés (impôt sur le revenu, revalorisation)", f"=B{L['autresC']}", "=0", "=0", "=0", f"=B{L['autresC']}"),
]
for i, (lib, *fs) in enumerate(usages, start=u0 + 1):
    texte(ws, f"A{i}", lib)
    for col, f in zip("BCDEF", fs): formule(ws, f"{col}{i}", f, MD2)
t = u0 + 1 + len(usages)
texte(ws, f"A{t}", "Total", gras=True)
for col in "BCDEF": formule(ws, f"{col}{t}", f"=SUM({col}{u0+1}:{col}{t-1})", MD2, gras=True, res=True)

sources(wb, [
    ("TVA : rendement et perte de pouvoir d'achat", tva["pointNet"]["source"], tva["pointNet"]["url"]),
    ("CSG des actifs, déficit maladie", csg["activite"]["source"], csg["activite"]["url"]),
    ("Assiettes de CSG des pensions, rendement net", "IPP, note n° 129 (2026)", "https://www.ipp.eu/publication/comment-mettre-a-contribution-les-retraites-pour-le-redressement-des-finances-publiques/"),
    ("Masse des pensions, composition des revenus", N["pensionsTotales"]["source"], None),
    ("Mesures de chaque espace", "Classeurs Chiffrage_Heritage, Chiffrage_Retraites et Chiffrage_Sante", None),
])
verification(wb, VERIF)
police_partout(wb)
wb.move_sheet("Lisez-moi", offset=-len(wb.sheetnames))
wb.save(sys.argv[1])
