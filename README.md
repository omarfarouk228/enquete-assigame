# Enquête à Assigamé

Jeu d'enquête en point-and-click, dans le navigateur (PC et mobile). Lomé, un samedi de 2026, autour du chantier du Grand marché (Assigamé). La malle verte de Dada Akossiwa, douze wax de 1974 hérités de sa grand-mère, une Nana Benz, a disparu à l'aube. Tu es Kafui Lawson, étudiante en journalisme et nièce de Dada : tu as jusqu'au car de 14 h pour Cotonou pour la retrouver.

**Jouer : https://omarfarouk228.github.io/enquete-assigame/**

## Le jeu

- **Quatre chapitres** : l'étal vide (rue du Commerce, poisson fumé, kiosque), le carrefour, le front de mer et son hôtel, et la gare routière si l'on arrive trop tard à l'hôtel.
- **Enquêter** : parler aux témoins, examiner les lieux, noter les indices dans le **carnet**, se déplacer sur le **plan** dessiné. Les **confrontations** demandent la bonne preuve : une mauvaise preuve coûte du temps et de la crédibilité.
- **Le tableau de déduction** : trois questions pour faire le point ; juste, il donne le fil de l'affaire ; faux, il coûte dix minutes.
- **Trois séquences d'action** : la course en zémidjan (trois files, nids-de-poule, taxis, charrettes, piétons), la poursuite de Komi dans les allées (la bonne flèche avant que l'anneau se vide), la fouille de la chambre 12 en 45 secondes.
- **Le temps** : de 9 h à 14 h. Trajet 20 minutes, zem 10 minutes plus les chocs, conversation 10, indice 5, mauvaise preuve 5, mauvaise déduction 10, poursuite ratée 15, fouille 10. La lumière du jour change avec l'heure.
- **Quatre fins** et quatre rangs : Fine limière (au commissariat avant midi avec presque tous les indices), Reporter de terrain, Bonne nièce, Stagiaire. Accuser Mawuli à tort ou rater le car compte aussi.
- La rue vit : passants, motos et taxis, fumée des foyers, vagues et mouettes au front de mer, événements de rue pendant les trajets.

## Commandes

Tout se joue au clic ou au doigt : les personnages et les points d'intérêt s'allument au survol. Clavier : **C** le carnet, **P** le plan, **M** le son, **Échap** ferme le panneau. Séquences : flèches haut et bas pour changer de file en zem, flèches gauche, haut, droite pendant la poursuite ; sur mobile, zones tactiles en bas de l'écran. La partie est sauvegardée automatiquement.

## Technique

- [Vite](https://vite.dev) et JavaScript, sans moteur de jeu. Interface en HTML et CSS (carnet d'enquête, DM Serif Display, Inter, Caveat).
- **Personnages en 3D** avec [Three.js](https://threejs.org), posés devant les décors peints : huit personnages habillés, aux visages et aux corps différents, générés avec [MakeHuman](http://www.makehumancommunity.org) (MPFB2 dans Blender, actifs CC0) et animés par les clips de la [Universal Animation Library de Quaternius](https://quaternius.com) (CC0). Ombres de contact, lumière qui suit l'heure, gros plan de trois quarts pendant les dialogues avec animation de parole. `?2d` dans l'adresse rend les personnages peints.
- **Décors peints en Canvas 2D** : six lieux avec calque avant, calque par-dessus les personnages et animation par image.
- **Tout le scénario en données** (`src/story.js`) : chapitres, lieux, personnages, indices, nœuds de dialogue, confrontations, tableau de déduction, fins. Un test vérifie que les références sont valides et que la meilleure fin reste atteignable.
- Sons et ambiances en Web Audio : rue, moteur du zem, chocs, pas, cartes du carnet.
- Mobile : zones tactiles pour les séquences, résolution 3D réduite sous 700 px.

```bash
npm install
npm run dev      # http://localhost:5176 (laisser le terminal ouvert)
npm run build
npm test         # cohérence du scénario
```

Chaque push sur `main` est déployé sur GitHub Pages. Pages de test : `scenes.html` (décors), `figures.html` (personnages peints).

| Fichier | Rôle |
| --- | --- |
| `src/main.js` | Boucle, cinématiques, cartes de chapitre, dialogues, carnet, plan, tableau de déduction, trajets, fins, sauvegarde |
| `src/story.js` | Scénario : chapitres, lieux, personnages, indices, dialogues, confrontations, fins |
| `src/stage3d.js` | Scène Three.js transparente au-dessus des décors : lumière, ombres, placement, gros plan |
| `src/scenes.js` | Six décors peints et leur animation |
| `src/minigames.js` | Course en zem, poursuite, fouille |
| `src/portrait.js`, `src/figure.js` | Portraits et personnages peints (rendu de repli) |
| `src/audio.js` | Sons et ambiances |
| `public/models/` | Huit personnages (GLB) et la bibliothèque de clips |
| `tests/` | Cohérence du scénario |

## Sources et réalisme

Grand marché de Lomé : incendie de janvier 2013, reconstruction encore en chantier en 2023 (quatre niveaux, 2 400 places), nouvel incendie et effondrement en octobre 2025. Le jeu montre un chantier ; l'état réel du marché en 2026 est à vérifier. Lomé à Cotonou par Hillacondji, boulevard du 13 Janvier, front de mer, zémidjans, pousse-pousse, Mobile Money sans marque. Les personnages, les commerces, l'hôtel et les événements sont fictifs. Les salutations éwé et mina sont en orthographe simplifiée et restent à faire relire.

## Crédits

Jeu original. Personnages générés avec MakeHuman (actifs CC0) ; animations Quaternius (CC0). Code © Omar Farouk. Tous droits réservés sauf mention contraire.
