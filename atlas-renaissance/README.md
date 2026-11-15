# Atlas de la Renaissance peinte

Carte interactive de 41 œuvres de la Renaissance (Italie et Nord), avec frise chronologique, et douze tableaux
« expliqués » à explorer sur leur reproduction : zones détourées, lampe d'exploration, « qui est qui », calques
d'analyse (composition, lumière, regards et gestes), jeu, trois niveaux de lecture (Découverte, Approfondi,
Expert) et dossier technique par œuvre. Chaque paragraphe cite ses sources.

En ligne : https://bonquentin-collab.github.io/Create-Website/atlas-renaissance/

## Fichiers

- `index.html` : page autonome (HTML, CSS et JavaScript dans un seul fichier). Seules dépendances externes :
  d3 7.9.0 (cdnjs) et les polices EB Garamond et Source Sans 3 (Google Fonts).
- `img/` : reproductions redimensionnées. Pour chaque tableau, `<id>.jpg` (pleine définition),
  `<id>_s.jpg` (vignette) et `<id>_b.jpg` (version floutée et désaturée servant de fond).

La progression, le niveau de lecture choisi et les scores du jeu sont gardés dans le navigateur de chaque visiteur
(`localStorage`), rien n'est envoyé ailleurs.

## Crédits des reproductions

Fichiers issus de Wikimedia Commons, redimensionnés.

| Fichier | Œuvre | Fichier d'origine | Statut |
| --- | --- | --- | --- |
| `arnolfini` | Jan van Eyck, *Les Époux Arnolfini* | « Van Eyck - Arnolfini Portrait » | domaine public |
| `cene` | Léonard de Vinci, *La Cène* | « The Last Supper - Leonardo Da Vinci - High Resolution 32x16 » | domaine public |
| `delices` | Jérôme Bosch, *Le Jardin des délices* | « The Garden of Earthly Delights by Bosch High Resolution » | domaine public |
| `doni` | Michel-Ange, *Tondo Doni* | « Tondo Doni, por Miguel Ángel » | domaine public |
| `ecole` | Raphaël, *L'École d'Athènes* | « Raphael School of Athens » | domaine public |
| `hermine` | Léonard de Vinci, *La Dame à l'hermine* | « The Lady with an Ermine » | domaine public |
| `joconde` | Léonard de Vinci, *La Joconde* | « Mona Lisa, by Leonardo da Vinci, from C2RMF retouched » | domaine public |
| `printemps` | Botticelli, *Le Printemps* | « Botticelli-primavera » | domaine public |
| `sixtine` | Michel-Ange, voûte de la chapelle Sixtine | [« CAPPELLA SISTINA Ceiling »](https://commons.wikimedia.org/wiki/File:CAPPELLA_SISTINA_Ceiling.jpg) | photographie sous CC BY-SA 3.0, auteur indiqué sur la page du fichier |
| `transfiguration` | Raphaël, *La Transfiguration* | [« Transfigurazione (Raffaello) September 2015-1a »](https://commons.wikimedia.org/wiki/File:Transfigurazione_(Raffaello)_September_2015-1a.jpg) | photographie sous CC BY-SA 4.0, auteur indiqué sur la page du fichier |
| `urbin` | Titien, *La Vénus d'Urbin* | « Tiziano - Venere di Urbino - Google Art Project » | domaine public |
| `venus` | Botticelli, *La Naissance de Vénus* | « Sandro Botticelli - La nascita di Venere - Google Art Project - edited » | domaine public |

Les licences des deux photographies sous CC BY-SA ont été relevées dans des métadonnées tierces : à vérifier sur
les pages Commons liées. Les versions redimensionnées, vignettes et fonds floutés de ces deux fichiers restent
sous la même licence.

## Méthode

Les zones ont été tracées à la main, puis affinées par un détourage automatique (Segment Anything, ViT-B) et
contrôlées à l'œil : elles restent indicatives. Les repères et les calques sont posés à la main d'après les textes
cités. Le détail des sources et des limites figure dans la section « Méthode et limites » de la page.
