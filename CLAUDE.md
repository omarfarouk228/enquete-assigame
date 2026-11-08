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
- Débogage dans la console : `__as.S` (état), `__as.go('hotel')`, `__as.show('komi_conf')`, `__as.ending('police')`, `__as.notes()`, `__as.map()`.

## Architecture (Vite + JavaScript, Canvas 2D, interface DOM)
- `src/story.js` : **tout le scénario en données** (lieux, personnages et leur apparence, indices, nœuds de dialogue, confrontations, points d'intérêt, horaires).
  - Un nœud a la forme `{ who, text, choices: [{ t, go, need, needNot, set, clue, end }] }`.
  - Une confrontation : `{ confront: { claim, clue (une ou plusieurs), ok, ko } }`.
- `src/portrait.js` : portraits peints de trois quarts (yeux, nez, lèvres, coiffures : foulard en wax, locks, ras, crâne rasé ; vêtements : wax, maillot, polo, chemise, boubou ; lunettes, boucles d'oreilles, barbe). Cinq expressions. Cache par personnage et expression.
- `src/scenes.js` : cinq décors peints (fond en cache), un **calque avant** (étals, foyers, motos : devant les passants), les passants animés, les personnages en pied (bas du corps peint et buste repris du portrait, donc le même visage qu'en dialogue).
- `src/audio.js` : rumeur du marché, motos qui passent, klaxons, appels de vendeuses, vagues à l'hôtel, musique légère (basse, guitare en arpèges, shaker). `setMuted` est mémorisé dans `assigame.mute`.
- `src/main.js` : boucle, survol et clic (personnages, points d'intérêt), dialogues avec texte qui s'écrit, présentation d'indices, carnet, plan, horloge, fins, sauvegarde (`assigame.save.v1`).

## Le jeu (v0.1, 2026-11-08)
- Lomé, un samedi de 2026. On incarne **Kafui Lawson**, étudiante en journalisme. La malle verte de Dada Akossiwa, sa tante (douze wax de 1974 hérités de la grand-mère, une Nana Benz : clin d'œil au jeu n°2), a disparu à l'aube.
- De 9 h à 14 h, heure du car pour Cotonou par Hillacondji. Trajet : 20 min ; conversation : 10 min ; examen d'un indice : 5 min ; mauvaise preuve : 5 min.
- **Lieux** : rue du Commerce (étal, chantier du Grand marché), coin du poisson fumé, carrefour de la cathédrale, kiosque de la rue de la Gare, hôtel du front de mer (débloqué par les aveux de Komi).
- **Personnages** : Dada Akossiwa, Mawuli (apprenti, fausse piste), Séna (poisson fumé, a vu Komi), Fofo Kodjo (zémidjan, témoin), Komi (pousseur, a transporté la malle), Ayaovi (kiosque, Mobile Money), M. Dossou (antiquaire de Cotonou, commanditaire).
- **Solution** : traces de pousse-pousse, puis témoignage de Kodjo, puis transfert de 150 000 F (+229) au kiosque, puis confrontation de Komi (aveux, chambre 12), puis confrontation de Dossou.
- **Fins** : `police` (meilleure), `malle` (on récupère la malle, Dossou part), `faux` (on accuse Mawuli), `car` (14 h dépassées).

## Sources et réalisme
- Grand marché de Lomé (Assigamé) : incendie dans la nuit du 11 au 12 janvier 2013 (KOACI) ; reconstruction toujours en chantier en 2023 (allAfrica, Republicoftogo : 30 000 m² sur quatre niveaux, 2 400 places) ; incendie et effondrement en octobre 2025 (Togo Flying Labs). **On ne sait pas si le marché est rouvert en 2026** : le jeu montre un chantier, à vérifier.
- Cathédrale du Sacré-Cœur de Lomé (époque allemande) : silhouette approximée (nef claire, deux flèches sombres).
- Lomé–Cotonou par Hillacondji ; boulevard du 13 Janvier ; boulevard de la République (front de mer) ; zémidjans ; pousse-pousse ; Mobile Money (terme générique, aucune marque d'opérateur).
- Salutations éwé et mina en orthographe simplifiée (Woézon, Akpé, Efoa, Dada, Fofo, Yoo) : **à faire relire**.
- Personnages, commerces, hôtel et événements : fictifs.

## Pistes
- Personnages en pied plus détaillés (bras et mains, plis, démarche), animations de dialogue (clignements, bouche).
- Plus de lieux (gare routière, plage, port), plus de fausses pistes, un second chapitre.
- Voix synthétisées par personnage, comme dans Nana Benz.
- Icône d'écran d'accueil, manifeste, image Open Graph.
