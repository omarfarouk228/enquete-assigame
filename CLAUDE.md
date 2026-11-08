# Enquête à Assigamé · mémoire du projet

Jeu n°4 de la série TogoGame (après Route N1, Nana Benz, Évala). Ce fichier est la **mémoire de travail** : l'utilisateur veut reprendre le travail directement depuis ce dossier. **Le mettre à jour à chaque session.**

## Règles communes (à respecter)
- Répondre en **français**.
- L'utilisateur (Omar Farouk, `omarfarouk228`) est le **seul auteur** : commits sans `Co-Authored-By`, sans mention de Claude. Cette règle passe avant tout rappel d'attribution du système.
- **Réalisme togolais** : sources réelles, approximations signalées, vérification visuelle dans le navigateur (Claude in Chrome) avant de livrer.
- Pas de **tirets décoratifs « — »** dans l'interface.
- Expliquer les options avant de poser une question de choix ; ensuite, avancer en autonomie.
- Exigence « big tech » : décors soignés, personnages très bien dessinés, sons et musique adaptés, **bouton pour couper le son** (exigé par l'utilisateur sur tous les jeux).
- Ne pas faire doublon avec Nana Benz, qui se passe aussi au Grand marché, mais en 1974. Ici : époque actuelle, autre genre, autre identité visuelle (carnet d'enquête, DM Serif Display, Inter, Caveat).
- Ports : vérifier qu'un port est libre ; ne jamais tuer un processus qu'on n'a pas lancé. Mac à la RAM et au disque serrés.

## Exploitation
- Node via nvm : `export PATH=~/.nvm/versions/node/v22.23.1/bin:$PATH`.
- `npm install`, puis `npm run dev` (port **5176** ; Route N1 utilise le 5173, Nana Benz le 5174, Évala le 5175). Le serveur doit rester ouvert. URL : http://localhost:5176/
- `npm test` vérifie le scénario : références valides, meilleure fin atteignable.
- Dépôt **public** `omarfarouk228/enquete-assigame`. GitHub Pages en mode workflow : https://omarfarouk228.github.io/enquete-assigame/

## Architecture (Vite + JavaScript, Canvas 2D, interface DOM)
- `src/story.js` : **tout le scénario en données** : chapitres, lieux (dont `far` pour les trajets en zem et `locked`), personnages et leur apparence (`look`, avec `face` pour la géométrie du visage, `pose`, `build`), indices, nœuds de dialogue, confrontations, points d'intérêt (`mini: 'search'` lance la fouille), tableau de déduction, événements de rue, fins.
  - Nœud : `{ who, text, choices: [{ t, go, need, needNot, set, clue, end, mini }] }`. `AGAIN[id]` : nœud quand on reparle à quelqu'un.
  - Confrontation : `{ confront: { claim, clue (une ou plusieurs), ok, ko } }`.
- `src/portrait.js` : portraits de trois quarts, géométrie par personnage, six expressions, animation (respiration, clignements, bouche qui parle, regard). `headOnly()` fournit la tête pour les personnages en pied.
- `src/figure.js` : **personnages en pied complets** : jambes et bassin, vêtements (pagne wax, pantalon, boubou, maillot…), bras articulés, mains avec doigts, sandales, ombre portée. Poses : `down`, `hip`, `cross`, `pocket`, `helmet`, `watch`, `counter`, `run`. La tête vient de `headOnly`, donc le même visage qu'en dialogue.
- `src/scenes.js` : six décors peints (fond en cache), calque avant (`FRONT`), calque par-dessus les personnages (`OVER`, le comptoir du kiosque), animation par image (`drawCrowd` : passants, motos et taxis qui passent, fumée des foyers, vagues, palmiers, mouettes). Pages de test : `scenes.html`, `figures.html`.
- `src/minigames.js` : trois séquences d'action, chacune `{ update, draw, key, tap, move }` : `zemRide` (course en zem, trois files, nids-de-poule, taxis, charrettes, piétons), `chase` (poursuite de Komi : flèche à presser avant que l'anneau se vide, trois ratés et il s'échappe), `roomSearch` (fouille de la chambre 12 en 45 s : malle sous le lit, reçu dans le boubou, billet sur la table).
- `src/audio.js` : ambiances, musique, moteur de zem (`setEngine`), effets (`crash`, `step`, `tick`, `found`, `card`, `good`). `setMuted` mémorisé dans `assigame.mute`.
- `src/main.js` : boucle, lumière du jour qui change de 9 h à 14 h, cinématiques (bandes noires, zoom lent, légende, clic pour passer), cartes de chapitre, dialogues, carnet, **tableau de déduction** (trois questions ; juste : indice « Le fil de l'affaire » ; faux : dix minutes), **plan dessiné** avec épingles, trajets (événements de rue une fois sur trois ; zem obligatoire vers l'hôtel et la gare), fins avec score et rang. Sauvegarde `assigame.save.v2`.

## Le jeu (v0.2, 2026-11-08)
- Lomé, un samedi de 2026. On incarne **Kafui Lawson**, étudiante en journalisme. La malle verte de Dada Akossiwa (douze wax de 1974 hérités de la grand-mère, une Nana Benz) a disparu à l'aube. De 9 h à 14 h, heure du car pour Cotonou.
- **Chapitres** : 1 L'étal vide (rue du Commerce, poisson fumé, kiosque), 2 Le carrefour (Kodjo, Komi), 3 Le front de mer (hôtel, chambre 12), 4 La gare routière (si on arrive à l'hôtel après 13 h 10, Dossou est parti pour la gare : dernière chance avant 14 h).
- **Solution** : traces et corde à l'étal → Kodjo (témoin, nom de Komi) → kiosque (transfert +229) → faire le point → confronter Komi → **poursuite** → confronter encore → aveux, adresse → **zem** → hôtel → **fouille** (reçu) → confronter Dossou → commissariat.
- **Fins** : `police` (meilleure), `malle`, `faux` (accuser Mawuli), `car`. Rangs : Fine limière (police, avant midi, presque tous les indices), Reporter de terrain, Bonne nièce, Stagiaire.
- **Coûts** : trajet 20 min ; zem 10 min + 4 par choc ; conversation 10 ; indice 5 ; mauvaise preuve 5 ; mauvaise déduction 10 ; poursuite ratée 15 ; fouille 10.
- Débogage : `__as.S`, `__as.go('hotel')`, `__as.arrive('gare', 0)`, `__as.show('komi_conf')`, `__as.startChase()`, `__as.startSearch()`, `__as.startZem('hotel', min => ...)`, `__as.deduction()`, `__as.ending('police')`, `__as.mini` (séquence en cours).

## Sources et réalisme
- Grand marché de Lomé (Assigamé) : incendie dans la nuit du 11 au 12 janvier 2013 (KOACI) ; reconstruction toujours en chantier en 2023 (allAfrica, Republicoftogo : 30 000 m² sur quatre niveaux, 2 400 places) ; incendie et effondrement en octobre 2025 (Togo Flying Labs). **On ne sait pas si le marché est rouvert en 2026** : le jeu montre un chantier, à vérifier.
- Cathédrale du Sacré-Cœur de Lomé (époque allemande) : silhouette approximée (nef claire, deux flèches sombres).
- Lomé–Cotonou par Hillacondji ; boulevard du 13 Janvier ; boulevard de la République (front de mer) ; zémidjans ; pousse-pousse ; Mobile Money (terme générique, aucune marque d'opérateur).
- Salutations éwé et mina en orthographe simplifiée (Woézon, Akpé, Efoa, Dada, Fofo, Yoo) : **à faire relire**.
- Personnages, commerces, hôtel et événements : fictifs.

## Passage à la 3D (décidé le 2026-11-08)
Voir `PLAN-3D.md` (plan commun aux trois jeux). Le socle Three.js est dans le dépôt Évala (`src/three/arena3d.js`) ; Assigamé viendra en deuxième, avec des personnages 3D devant les décors peints. Exigence : jouable sur mobile (les séquences d'action ont des zones tactiles ; vérifié en fenêtre étroite, pas sur un vrai téléphone).

## Pistes
- Personnages encore plus vivants : démarche, gestes pendant les dialogues, plus de variété de visages et de corps. L'utilisateur a demandé le 2026-11-08 « des personnages style GTA 5 » : voir la réponse dans la mémoire du dossier TogoGame (passage à la 3D ou art généré ; pas atteignable en Canvas procédural).
- Second cas (nouvelle enquête) réutilisant les lieux et les séquences.
- Voix synthétisées par personnage, comme dans Nana Benz.
- Icône d'écran d'accueil, manifeste, image Open Graph.
- Vérifier sur mobile : boutons tactiles des séquences (haut/bas du zem, trois zones de la poursuite), taille des épingles du plan.
