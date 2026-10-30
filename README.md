# La Compagnie

RPG de vie en pixel art, dans l’univers de la Terre du Milieu. Les cours de L1, les courses, le ménage, le sport, les projets et l’administratif deviennent des quêtes. Chaque rituel oublié coûte des PV et fait monter l’Ombre (mode hardcore).

Ossature d’interface reprise d’**EXISTENCES** (`~/Desktop/EXISTENCES-V1-2026-10-29`) : cartes de choix à lettre, parchemin de conséquences avec étiquettes d’effets, trophées à progression, objets classés par rareté, frise du journal, export/import vérifié.

## Lancer

```sh
npm install
npm run dev        # http://localhost:5173
npm test           # tests du moteur
npm run build      # build PWA dans dist/
npm run icons      # régénère les icônes pixel
```

## Structure

- `engine/` : moteur pur et testé (XP, butin déterministe, clôture des journées et sanctions, hauts faits, Voyage).
- `src/pixel/` : sprites dessinés en code (avatars, objets, boss, carte de la Terre du Milieu).
- `src/screens/` : Création, Camp, Quêtes (rituels, quêtes, corvées, Grandes Quêtes, Fac, Provisions), Carte, Auberge, Héros.
- `src/persist.ts` : sauvegarde IndexedDB, export/import JSON avec empreinte.

## Règles hardcore

La journée se clôt à 4 h (réglable). Rituel oublié : −5 à −25 PV. Quête en retard : −5 PV par nuit. Corvée en retard de plus de 2 jours : −8 PV par nuit. Épreuve sans préparation la veille : −20 PV. À 0 PV, tu tombes : −30 % d’or, un objet non légendaire perdu, barre de niveau remise à zéro. À 100 d’Ombre, un Nazgûl te traque : il faut 7 journées parfaites pour le repousser.

Garde-fous : 2 Haltes par mois, un repos de 7 jours maximum tous les 30 jours, des potions à l’Auberge. Réglages › Horloge de test permet de simuler le passage des jours.

## Données

Tout reste sur l’appareil (IndexedDB). Pour l’utiliser sur iPhone, il faut héberger `dist/` en statique (Cloudflare Pages, GitHub Pages…), puis passer par Safari › Partager › Sur l’écran d’accueil. Pour passer d’un appareil à l’autre : export puis import.

Visuels entièrement originaux : aucune image, logo ou police officielle de l’œuvre de Tolkien.
