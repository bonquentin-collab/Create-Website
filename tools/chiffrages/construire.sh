#!/bin/sh
# Régénère les classeurs Excel de chiffrage (site/chiffrages/*.xlsx) à partir des paramètres du site.
# Prérequis : node, python3 avec openpyxl. Pour remplir les valeurs calculées, recalculer ensuite avec LibreOffice
# (le paquet libreoffice-calc est nécessaire), par exemple : soffice --headless --convert-to xlsx --outdir … fichier.xlsx
set -e
cd "$(dirname "$0")"
node parametres.mjs > parametres.json
for f in heritage:Chiffrage_Heritage retraites:Chiffrage_Retraites sante:Chiffrage_Sante bilan:Chiffrage_Bilan; do
  python3 "${f%%:*}.py" "../../site/chiffrages/${f##*:}.xlsx"
done
rm parametres.json
echo "Classeurs écrits dans site/chiffrages/"
