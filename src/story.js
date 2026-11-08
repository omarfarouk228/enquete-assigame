// Scénario d'« Enquête à Assigamé ». Données pures : chapitres, lieux, personnages, indices,
// dialogues, confrontations, points d'intérêt, déductions, événements de rue, fins.
// Lomé, un samedi de novembre 2026. Le Grand marché (Assigamé), incendié en janvier 2013, est
// toujours en chantier dans le jeu : le commerce s'est installé dans les rues autour.
//
// Salutations en éwé et mina, en orthographe simplifiée, à faire relire par un locuteur :
// « Woézon » (bienvenue), « Akpé » (merci), « Efoa ? » (ça va ?), « Dada » (grande sœur, tante),
// « Fofo » (grand frère), « Yoo » (d'accord).

export const START = 9 * 60;
export const DEADLINE = 14 * 60;
export const DOSSOU_LEAVES = 13 * 60 + 10; // après cette heure, il a quitté l'hôtel pour la gare
export const MOVE_COST = 20;
export const TALK_COST = 10;

export const CHAPTERS = {
  1: { title: 'L’étal vide', sub: 'Chapitre premier', loc: 'etal' },
  2: { title: 'Le carrefour', sub: 'Chapitre deuxième', loc: 'carrefour' },
  3: { title: 'Le front de mer', sub: 'Chapitre troisième', loc: 'hotel' },
  4: { title: 'La gare routière', sub: 'Dernier chapitre', loc: 'gare' },
};

export const LOCATIONS = {
  etal: { name: 'Rue du Commerce', sub: "L'étal de Dada Akossiwa, face au chantier du Grand marché", people: ['dada', 'mawuli'], far: false },
  poisson: { name: 'Le coin du poisson fumé', sub: 'Trois foyers, des claies, la fumée qui pique les yeux', people: ['sena'], far: false },
  carrefour: { name: 'Carrefour de la cathédrale', sub: 'Zémidjans, pousse-pousse et vendeurs ambulants', people: ['kodjo', 'komi'], far: false },
  kiosque: { name: 'Kiosque de la rue de la Gare', sub: 'Mobile Money, recharges et paris sportifs', people: ['ayaovi'], far: false },
  hotel: { name: 'Hôtel du front de mer', sub: 'Boulevard de la République, face à l’océan', people: ['dossou'], locked: 'adresse_dossou', far: true },
  gare: { name: 'Gare routière', sub: 'Les cars pour Cotonou et Lagos chargent les bagages', people: ['dossou', 'komi'], locked: 'dossou_parti', far: true },
};

export const PEOPLE = {
  kafui: { name: 'Kafui Lawson', role: 'Étudiante en journalisme', look: { skin: '#5b3a26', sex: 'f', age: 22, hair: 'wrap', wrap: '#c2401f', wrap2: '#e3a92f', top: 'blouse', topC: '#e3a92f', topC2: '#1f3f7a', earrings: true, pose: 'down', build: 0.9, face: { jaw: 0.92, chin: 1.0, eyes: 1.1, lips: 1.0, nose: 0.92, cheek: 0.95 } } },
  dada: { name: 'Dada Akossiwa', role: 'Revendeuse de pagnes, ta tante', look: { skin: '#6a3f28', sex: 'f', age: 58, hair: 'wrap', wrap: '#c2401f', wrap2: '#f2b134', top: 'wax', topC: '#1f5aa8', topC2: '#f2b134', earrings: true, pose: 'hip', build: 1.18, face: { jaw: 1.08, cheek: 1.15, lips: 1.1, nose: 1.05, eyes: 0.95 } } },
  mawuli: { name: 'Mawuli', role: "L'apprenti de Dada", look: { skin: '#4f2c1a', sex: 'm', age: 19, hair: 'short', top: 'tee', topC: '#e9e2cf', print: 'TOGO', beard: false, pose: 'pocket', build: 0.88, face: { jaw: 0.88, chin: 1.12, eyes: 1.08, lips: 0.95, nose: 0.92 } } },
  sena: { name: 'Séna', role: 'Vendeuse de poisson fumé', look: { skin: '#5e3622', sex: 'f', age: 45, hair: 'wrap', wrap: '#2e6fb5', wrap2: '#f4efe4', top: 'blouse', topC: '#7b3fa0', topC2: '#2e6fb5', earrings: true, pose: 'cross', build: 1.0, face: { jaw: 0.98, cheek: 1.0, lips: 0.95, nose: 0.95, eyes: 1.0, brow: 1.1 } } },
  kodjo: { name: 'Fofo Kodjo', role: 'Zémidjan', look: { skin: '#45261a', sex: 'm', age: 34, hair: 'locks', top: 'shirt', topC: '#3d6b9e', beard: true, pose: 'helmet', build: 1.0, face: { jaw: 1.1, brow: 1.25, nose: 1.1, lips: 1.0, eyes: 0.95 } } },
  komi: { name: 'Komi', role: 'Pousseur de pousse-pousse', look: { skin: '#53301c', sex: 'm', age: 27, hair: 'short', top: 'jersey', topC: '#c8102e', topC2: '#ffffff', beard: false, pose: 'cross', build: 1.14, face: { jaw: 1.12, chin: 0.9, eyes: 0.9, lips: 1.08, nose: 1.0, brow: 1.1 } } },
  ayaovi: { name: 'Ayaovi', role: 'Gérant du kiosque', look: { skin: '#6e3d23', sex: 'm', age: 41, hair: 'bald', top: 'polo', topC: '#f2c230', glasses: true, beard: true, pose: 'counter', build: 1.2, face: { jaw: 1.18, cheek: 1.18, nose: 1.1, lips: 1.0, eyes: 0.9 } } },
  dossou: { name: 'M. Dossou', role: 'Antiquaire de Cotonou', look: { skin: '#5a3420', sex: 'm', age: 55, hair: 'short', grey: true, top: 'boubou', topC: '#f4efe4', topC2: '#b08a4b', glasses: true, beard: false, pose: 'watch', build: 0.95, face: { jaw: 0.95, chin: 1.05, nose: 1.0, eyes: 0.95, lips: 0.9, cheek: 0.9 } } },
};

export const CLUES = {
  roues: { name: 'Traces de roues étroites', desc: 'Deux sillons fins et parallèles dans le sable devant l’étal. Trop étroits pour un tricycle : plutôt les roues d’un pousse-pousse.' },
  raphia: { name: 'Bout de corde bleue', desc: 'Une corde en plastique bleu tressé, coupée net, accrochée au pied de la table. Les pousseurs du carrefour attachent leurs charges avec la même.' },
  cadenas: { name: 'Cadenas intact', desc: 'Le cadenas n’a pas été forcé : il était ouvert, posé sur la table. Quelqu’un l’a oublié ouvert, ou avait la clé.' },
  foyer: { name: 'Foyer encore chaud', desc: 'Sous la claie de Séna, la braise rougeoie encore. Un foyer de poisson fumé s’allume bien avant 7 h.' },
  temoin_kodjo: { name: 'Le témoignage de Kodjo', desc: 'Vers 5 h 30, Kodjo a vu un pousse-pousse chargé d’une malle verte filer vers le boulevard du 13 Janvier. Le pousseur portait un maillot rouge.' },
  ticket: { name: 'Ticket de paris de 5 h 41', desc: 'Un ticket imprimé au kiosque de la rue de la Gare à 5 h 41, au nom de Mawuli. Il ne pouvait pas être devant l’étal à cette heure-là.' },
  transfert: { name: 'Transfert de 150 000 F', desc: 'À 6 h 12, un retrait de 150 000 F CFA au kiosque, par « KOMI A. ». L’envoi vient d’un numéro béninois (+229).' },
  maillot: { name: 'Le maillot rouge de Komi', desc: 'Komi porte un maillot de foot rouge, et une corde bleue pend de son pousse-pousse.' },
  deduction: { name: 'Le fil de l’affaire', desc: 'Un pousse-pousse a emporté la malle à l’aube. Le pousseur, c’est Komi. Et c’est un homme de Cotonou qui paie.' },
  carte: { name: 'Carte de visite de M. Dossou', desc: '« Dossou, antiquités textiles, Cotonou ». Au dos, au stylo : « Hôtel du front de mer, ch. 12, départ samedi 14 h ».' },
  aveu_komi: { name: 'Les aveux de Komi', desc: 'Komi a transporté la malle à l’aube pour un monsieur de Cotonou, qui l’a payé par Mobile Money. La malle est à l’hôtel du front de mer, chambre 12.' },
  malle_vue: { name: 'La malle, de tes yeux', desc: 'La malle verte de la grand-mère : tu l’as vue. Sous le lit de la chambre 12, ou dans la soute du car.' },
  recu: { name: 'Reçu de 150 000 F', desc: 'Dans la poche du boubou : un reçu Mobile Money de 150 000 F à KOMI A., motif « transport ». Ce n’est pas un achat à la propriétaire.' },
  billet: { name: 'Billet de car 14 h', desc: 'Un billet pour le car de 14 h vers Cotonou, au nom de Dossou, avec un supplément « bagage volumineux ».' },
  malle: { name: 'La malle de la Benz', desc: 'La malle verte de la grand-mère, avec ses douze pièces de wax de 1974. Retrouvée.' },
};

export const NODES = {
  dada_0: { who: 'dada', text: "Kafui ! Akpé, tu es venue. On m'a volé la malle de ta grand-mère. Les douze pagnes de 1974, ceux qu'elle avait achetés au port quand elle était Nana Benz. Ce matin, à 6 h, la malle n'était plus là.", choices: [
    { t: 'Qui avait accès à l’étal ?', go: 'dada_acces' },
    { t: 'Que valent ces pagnes ?', go: 'dada_valeur' },
    { t: 'Je vais trouver la malle, Dada.', go: null },
  ] },
  dada_acces: { who: 'dada', text: "Mawuli, mon apprenti, a la clé du cadenas. C'est lui ! Il traîne, il joue aux paris, il me doit de l'argent. Je l'ai attrapé ce matin, il dit qu'il dormait chez sa mère à Bè.", choices: [
    { t: 'Et les voisines ?', go: 'dada_voisines' },
    { t: 'Je vais lui parler.', go: null },
    { t: 'Tu as raison, Dada : c’est Mawuli.', go: 'fin_faux', needNot: 'mawuli_innocent' },
  ] },
  dada_voisines: { who: 'dada', text: "Séna, la vendeuse de poisson fumé, en face. Elle me jalouse depuis des années. Et puis le carrefour : les zems, les pousseurs. Tout le monde passe ici avant le jour.", choices: [{ t: 'Akpé, Dada.', go: null }] },
  dada_valeur: { who: 'dada', text: "Pour moi, ils n'ont pas de prix. Mais un homme de Cotonou est passé la semaine dernière. Il voulait les acheter. Il disait que les collectionneurs paient très cher les vrais wax des années 70. J'ai refusé.", choices: [
    { t: 'Comment s’appelait-il ?', go: 'dada_homme' },
    { t: 'Je comprends.', go: null },
  ] },
  dada_homme: { who: 'dada', text: "Il ne l'a pas dit. Un monsieur en grand boubou blanc, avec des lunettes. Il parlait beaucoup du car de Cotonou, du samedi.", set: 'piste_cotonou', choices: [{ t: 'Un samedi… aujourd’hui.', go: null }] },
  dada_again: { who: 'dada', text: "Alors, ma fille ? Tu avances ? Le soleil monte, et moi je ne vends rien, je n'ai que des larmes à montrer aux clientes.", choices: [
    { t: 'Parle-moi encore de l’homme de Cotonou.', go: 'dada_homme', needNot: 'piste_cotonou' },
    { t: 'J’ai une piste, Dada. Patience.', go: null },
    { t: 'C’est Mawuli, j’en suis sûre.', go: 'fin_faux', needNot: 'mawuli_innocent' },
  ] },
  fin_faux: { who: 'dada', text: "Je le savais ! Je l'envoie au commissariat. … Mais Kafui, s'il n'avait rien fait ? La malle, elle, n'est toujours pas là.", choices: [{ t: 'Attendre la suite…', go: null, end: 'faux' }] },
  dada_fin: { who: 'dada', text: "Ma malle ! Kafui, ma fille… La grand-mère serait fière de toi. Ce soir, tout le marché saura ce que tu as fait.", choices: [{ t: 'Akpé, Dada.', go: null }] },

  mawuli_0: { who: 'mawuli', text: "Kafui, je te jure, ce n'est pas moi. Dada crie partout que je suis un voleur. J'étais chez ma mère à Bè, je dormais.", choices: [
    { t: 'Tu dormais à Bè à 5 h 30 ?', go: 'mawuli_conf' },
    { t: 'Tu as vu quelque chose en arrivant ?', go: 'mawuli_vu' },
    { t: 'On verra.', go: null },
  ] },
  mawuli_vu: { who: 'mawuli', text: "Le cadenas n'était pas cassé, il était ouvert, posé sur la table. Et il y avait des traces dans le sable. Moi, j'ai la clé, alors forcément…", clue: 'cadenas', choices: [{ t: 'Le cadenas était ouvert…', go: null }] },
  mawuli_conf: { who: 'mawuli', confront: { claim: "Je dormais chez ma mère à Bè, toute la nuit, jusqu'à 7 h.", clue: 'ticket', ok: 'mawuli_aveu', ko: "Mawuli hausse les épaules. « Ça ne prouve rien. »" } },
  mawuli_aveu: { who: 'mawuli', text: "…Bon. J'étais au kiosque de la rue de la Gare, pour le match de la nuit. Je n'ai rien dit à Dada parce qu'elle déteste les paris. Mais je n'ai pas touché à la malle. Et le cadenas… je l'avais oublié ouvert hier soir. C'est ma faute.", set: 'mawuli_innocent', choices: [{ t: 'Je te crois.', go: null }] },
  mawuli_again: { who: 'mawuli', text: "Tu as trouvé quelque chose ? Dada ne me regarde plus. Si tu veux, je garde l'étal pendant que tu cherches.", choices: [
    { t: 'Tu dormais à Bè à 5 h 30 ?', go: 'mawuli_conf', needNot: 'mawuli_innocent' },
    { t: 'Reste là, Mawuli.', go: null },
  ] },

  sena_0: { who: 'sena', text: "Woézon, ma fille. Efoa ? Tu viens pour la malle de ta tante, hein. Toute la rue ne parle que de ça.", choices: [
    { t: 'À quelle heure es-tu arrivée ?', go: 'sena_conf' },
    { t: 'Tu t’entends bien avec Dada ?', go: 'sena_dada' },
    { t: 'Je repasserai.', go: null },
  ] },
  sena_dada: { who: 'sena', text: "Ta tante et moi, on se dispute pour la place depuis 2013, depuis l'incendie du Grand marché. Mais voler une vieille femme ? Jamais. Je vends mon poisson, c'est tout.", choices: [{ t: 'Yoo.', go: null }] },
  sena_conf: { who: 'sena', confront: { claim: "Je suis arrivée à 7 h, comme tous les jours. Je n'ai rien vu.", clue: 'foyer', ok: 'sena_aveu', ko: "Séna retourne ses poissons sans te regarder. « Je t'ai dit ce que je sais. »" } },
  sena_aveu: { who: 'sena', text: "…Tu as de bons yeux. J'étais là avant 5 h, pour le feu. J'ai vu Komi, le pousseur du carrefour, charger une malle verte. Il m'a regardée longtemps. Je lui dois de l'argent, j'ai eu peur. Ne dis pas que ça vient de moi.", set: 'sena_vu', choices: [{ t: 'Akpé, Séna. Je ne dirai rien.', go: null }] },
  sena_again: { who: 'sena', text: "Tiens, prends un chinchard pour la route, ma fille. Et fais attention à Komi : il court vite quand il a peur.", choices: [
    { t: 'À quelle heure es-tu arrivée, vraiment ?', go: 'sena_conf', needNot: 'sena_vu' },
    { t: 'Akpé, Séna.', go: null },
  ] },

  kodjo_0: { who: 'kodjo', text: "Petite sœur ! Tu montes ? Bè, Tokoin, Adidogomé, je t'emmène partout. Ah, tu enquêtes ? La malle de Dada Akossiwa ?", choices: [
    { t: 'Tu étais au carrefour ce matin ?', go: 'kodjo_vu' },
    { t: 'Tu connais les pousseurs ?', go: 'kodjo_pousseurs', need: ['roues', 'raphia', 'sena_vu'] },
    { t: 'Plus tard, Fofo.', go: null },
  ] },
  kodjo_vu: { who: 'kodjo', text: "Je prends ma première course à 5 h. Vers 5 h 30, j'ai croisé un pousse-pousse qui filait vers le boulevard du 13 Janvier. Une malle verte dessus, bien attachée. Le pousseur avait un maillot rouge. À cette heure-là, ça m'a étonné.", clue: 'temoin_kodjo', choices: [{ t: 'Un maillot rouge… Akpé.', go: 'kodjo_pousseurs' }] },
  kodjo_pousseurs: { who: 'kodjo', text: "Les pousseurs attendent là-bas, sous le manguier. Ils attachent tout avec de la corde bleue, celle qu'on achète au rouleau. Komi, avec son maillot rouge, il est toujours le premier levé.", set: 'komi_nomme', choices: [{ t: 'Komi…', go: null }] },
  kodjo_again: { who: 'kodjo', text: "Quand tu veux aller loin, le front de mer ou la gare, je t'emmène. Accroche-toi bien, je connais les raccourcis.", set: 'kodjo_ami', choices: [
    { t: 'Tu étais au carrefour ce matin ?', go: 'kodjo_vu', needNot: 'temoin_kodjo' },
    { t: 'Akpé, Fofo.', go: null },
  ] },

  komi_0: { who: 'komi', text: "Quoi ? Je travaille, moi. Tu veux transporter quelque chose ? Sinon laisse-moi.", choices: [
    { t: 'Tu as transporté une malle ce matin ?', go: 'komi_conf' },
    { t: 'Rien, pardon.', go: null },
  ] },
  komi_conf: { who: 'komi', confront: { claim: "Ce matin ? Rien du tout. Je suis arrivé à 8 h, mon pousse-pousse était vide.", clue: ['transfert', 'temoin_kodjo', 'raphia', 'deduction', 'maillot'], ok: 'komi_fuite', ko: "Komi crache par terre. « Tu n'as rien contre moi. »" } },
  komi_fuite: { who: 'komi', text: "Komi regarde l'indice, regarde la rue… et lâche les bras de son pousse-pousse. Il part en courant vers le marché !", choices: [{ t: 'Le rattraper !', go: null, mini: 'chase' }] },
  komi_rattrape: { who: 'komi', confront: { claim: "Lâche-moi ! Une malle verte, un maillot rouge… Il y a cent pousseurs à Lomé. Et l'argent, d'où je l'aurais eu ?", clue: ['transfert', 'deduction'], ok: 'komi_aveu', ko: "« Tu vois ? Tu n'as rien. » Il se dégage et retourne sous le manguier, essoufflé." } },
  komi_echappe: { who: 'komi', text: "Tu l'as perdu dans la foule, entre les bassines et les étals. Un quart d'heure plus tard, il est de retour sous le manguier, l'air de rien, mais il te surveille du coin de l'œil.", set: 'komi_fled', choices: [{ t: 'On recommence.', go: null }] },
  komi_aveu: { who: 'komi', text: "…Il m'a dit que c'était une vieille malle sans valeur, que la dame était d'accord. Un monsieur de Cotonou, en boubou blanc. Il m'a envoyé 150 000 par Mobile Money. J'ai porté la malle à son hôtel, sur le front de mer. Chambre 12. Il part à 14 h.", clue: 'aveu_komi', set: 'adresse_dossou', choices: [{ t: 'Viens avec moi, Komi.', go: null }] },
  komi_again: { who: 'komi', text: "Je t'ai tout dit. Si tu le trouves, dis-lui que je veux pas d'ennuis. J'ai une petite fille, moi.", choices: [
    { t: 'Tu as transporté une malle ce matin ?', go: 'komi_conf', needNot: 'aveu_komi' },
    { t: 'On verra, Komi.', go: null },
  ] },
  komi_gare: { who: 'komi', text: "Il est là, le monsieur. Il attend que le chauffeur charge sa malle dans la soute. Fais vite, Kafui, le car va partir.", choices: [{ t: 'Merci, Komi.', go: null }] },

  ayaovi_0: { who: 'ayaovi', text: "Bonjour. Recharge, transfert, paris ? Fais vite, il y a la queue.", choices: [
    { t: 'Mawuli était ici cette nuit ?', go: 'ayaovi_mawuli' },
    { t: 'Quelqu’un a retiré une grosse somme ce matin ?', go: 'ayaovi_refus' },
    { t: 'Merci.', go: null },
  ] },
  ayaovi_mawuli: { who: 'ayaovi', text: "Le petit de Dada Akossiwa ? Il était là toute la nuit pour le match, il a joué à 5 h 41. Tiens, il a oublié son ticket sur le comptoir.", clue: 'ticket', choices: [{ t: 'Akpé, Ayaovi. Et les retraits de ce matin ?', go: 'ayaovi_refus' }, { t: 'Akpé.', go: null }] },
  ayaovi_refus: { who: 'ayaovi', text: "Les transferts des clients, c'est confidentiel. Je ne montre pas mon registre à n'importe qui.", choices: [
    { t: 'Un pousseur au maillot rouge, ça te dit quelque chose ?', go: 'ayaovi_komi', need: ['temoin_kodjo', 'maillot', 'sena_vu'] },
    { t: 'Dada Akossiwa est ruinée si on ne retrouve pas sa malle.', go: 'ayaovi_dada', need: 'piste_cotonou' },
    { t: 'Je comprends.', go: null },
  ] },
  ayaovi_komi: { who: 'ayaovi', text: "Komi ? Il est venu à 6 h 12, tout excité. Retrait de 150 000. Moi je n'ai rien dit, hein. Mais l'envoi venait d'un numéro du Bénin.", clue: 'transfert', choices: [{ t: 'Du Bénin…', go: null }] },
  ayaovi_dada: { who: 'ayaovi', text: "Dada Akossiwa ? Elle m'a fait crédit quand j'ai ouvert le kiosque. … Bon. À 6 h 12, un certain KOMI A. a retiré 150 000 F, envoyés d'un numéro +229. Tu ne tiens pas ça de moi.", clue: 'transfert', choices: [{ t: 'Akpé. Je ne dirai rien.', go: null }] },
  ayaovi_again: { who: 'ayaovi', text: "Encore toi ? Je t'ai dit ce que je pouvais. Allez, la queue avance.", choices: [
    { t: 'Mawuli était ici cette nuit ?', go: 'ayaovi_mawuli', needNot: 'ticket' },
    { t: 'Un pousseur au maillot rouge…', go: 'ayaovi_komi', need: ['temoin_kodjo', 'maillot', 'sena_vu'], needNot: 'transfert' },
    { t: 'Dada Akossiwa est ruinée…', go: 'ayaovi_dada', need: 'piste_cotonou', needNot: 'transfert' },
    { t: 'Merci quand même.', go: null },
  ] },

  dossou_0: { who: 'dossou', text: "Mademoiselle ? Je suis pressé, mon car part bientôt. Que voulez-vous ?", choices: [
    { t: 'Vous êtes antiquaire ?', go: 'dossou_carte' },
    { t: 'Vous avez une malle verte dans votre chambre.', go: 'dossou_conf' },
  ] },
  dossou_carte: { who: 'dossou', text: "Antiquités textiles, oui. Je chine des wax anciens pour des collectionneurs en Europe. Voici ma carte. Si vous avez de vieux pagnes, je paie bien.", clue: 'carte', choices: [{ t: 'Justement, parlons d’une malle verte.', go: 'dossou_conf' }, { t: 'Je reviendrai.', go: null }] },
  dossou_conf: { who: 'dossou', confront: { claim: "Une malle ? Je l'ai achetée honnêtement, à son propriétaire. J'ai le reçu.", clue: ['recu', 'aveu_komi', 'malle_vue'], ok: 'dossou_aveu', ko: "M. Dossou consulte sa montre. « Je n'ai pas de temps à perdre. »" } },
  dossou_aveu: { who: 'dossou', text: "…Ce pousseur parle trop. Écoutez, mademoiselle, rien n'est perdu. Je vous rends la malle, et nous oublions cette histoire. Je peux même vous dédommager…", choices: [
    { t: 'Appeler le commissariat central.', go: 'fin_police' },
    { t: 'Reprendre la malle et le laisser partir.', go: 'fin_malle' },
  ] },
  dossou_gare: { who: 'dossou', text: "Encore vous ? Mademoiselle, le car part dans quelques minutes. Que voulez-vous à la fin ?", choices: [{ t: 'La malle verte dans la soute : elle est à ma tante.', go: 'dossou_conf' }] },
  fin_police: { who: 'dossou', text: "Deux policiers du commissariat central arrivent un quart d'heure plus tard. M. Dossou ne prendra pas le car de 14 h. La malle verte est là, les douze pagnes intacts.", clue: 'malle', choices: [{ t: 'Rapporter la malle à Dada.', go: null, end: 'police' }] },
  fin_malle: { who: 'dossou', text: "M. Dossou te tend la malle sans un mot et file vers la gare routière. Les douze pagnes sont intacts. Mais l'homme ira chiner ailleurs.", clue: 'malle', choices: [{ t: 'Rapporter la malle à Dada.', go: null, end: 'malle' }] },
};

export const AGAIN = { dada: 'dada_again', mawuli: 'mawuli_again', sena: 'sena_again', kodjo: 'kodjo_again', komi: 'komi_again', ayaovi: 'ayaovi_again', dossou: 'dossou_0' };

export const HOTSPOTS = {
  etal: [
    { id: 'roues', x: 0.38, y: 0.86, r: 0.05, label: 'Le sable devant l’étal', clue: 'roues', text: 'Deux sillons fins, parallèles, qui partent de l’étal vers la rue. Ce n’est pas un tricycle, plutôt un pousse-pousse. Ils filent vers l’ouest, vers le carrefour.' },
    { id: 'raphia', x: 0.58, y: 0.76, r: 0.035, label: 'Le pied de la table', clue: 'raphia', text: 'Un bout de corde bleue, coupée net, accrochée au pied de la table. La charge a été attachée vite, et mal.' },
    { id: 'place', x: 0.6, y: 0.6, r: 0.05, label: 'L’emplacement de la malle', clue: 'cadenas', text: 'Un rectangle plus clair sur la nappe, là où la malle restait toute l’année. Le cadenas est posé à côté, ouvert, sans trace de pince.' },
    { id: 'chantier', x: 0.5, y: 0.3, r: 0.12, label: 'Le chantier du Grand marché', text: 'Le Grand marché a brûlé dans la nuit du 11 au 12 janvier 2013. Depuis, la reconstruction avance par à-coups, et les commerçantes se sont installées dans les rues autour. Dada dit qu’elle y aura sa place « quand les grues partiront ».' },
  ],
  poisson: [
    { id: 'foyer', x: 0.3, y: 0.82, r: 0.05, label: 'Le foyer sous la claie', clue: 'foyer', text: 'La braise est encore rouge et la cendre est épaisse. Ce feu a été allumé bien avant 7 h.' },
    { id: 'claie', x: 0.58, y: 0.62, r: 0.06, label: 'Les claies de poisson', text: 'Des chinchards et des sardinelles fumés, dorés et serrés sur les claies. L’odeur te prend à la gorge et te rappelle les dimanches chez la grand-mère.' },
    { id: 'bassines', x: 0.16, y: 0.92, r: 0.05, label: 'Les bassines', text: 'Des bassines en aluminium et en plastique, encore humides. Séna est arrivée tôt : l’eau n’a pas eu le temps de sécher.' },
  ],
  carrefour: [
    { id: 'cathedrale', x: 0.24, y: 0.3, r: 0.1, label: 'La cathédrale du Sacré-Cœur', text: 'Les deux flèches de la cathédrale de Lomé, construite à l’époque allemande, dominent le carrefour. Les cloches sonnent les heures : elles te rappellent que le temps passe.' },
    { id: 'pousse', x: 0.66, y: 0.9, r: 0.06, label: 'Le pousse-pousse de Komi', clue: 'maillot', need: 'komi_nomme', text: 'Une corde bleue pend du pousse-pousse, coupée net au même endroit que celle de l’étal. Et son propriétaire porte un maillot rouge.' },
    { id: 'feu', x: 0.62, y: 0.45, r: 0.05, label: 'Le feu tricolore', text: 'Il clignote à l’orange depuis des semaines. Les zémidjans passent sans ralentir, comme d’habitude.' },
  ],
  kiosque: [
    { id: 'affiche', x: 0.7, y: 0.5, r: 0.07, label: 'Les affiches', text: 'Recharges, transferts, retraits, paris sur les matchs de la nuit : le kiosque ne dort jamais vraiment. Le match de cette nuit : un club anglais contre un club espagnol, coup d’envoi à 4 h, heure de Lomé.' },
    { id: 'file', x: 0.22, y: 0.8, r: 0.07, label: 'La file d’attente', text: 'Des étudiants, une mère avec un bébé au dos, un chauffeur de taxi. Tout le monde attend son tour pour envoyer ou retirer de l’argent.' },
  ],
  hotel: [
    { id: 'mer', x: 0.5, y: 0.25, r: 0.15, label: "L'océan", text: 'Les vagues du golfe de Guinée cognent la plage. Au loin, des pirogues. Un vent chaud soulève le sable sur le boulevard.' },
    { id: 'chambre', x: 0.86, y: 0.38, r: 0.09, label: 'Monter à la chambre 12', need: 'adresse_dossou', needNot: 'chambre_fouillee', text: 'M. Dossou est à la terrasse, le dos tourné. La porte de la chambre 12 n’est pas fermée à clé. Tu as quelques instants avant qu’il remonte.', mini: 'search' },
    { id: 'reception', x: 0.75, y: 0.75, r: 0.06, label: 'La réception', text: 'Le réceptionniste confirme : M. Dossou, chambre 12, règle sa note et part pour la gare routière en début d’après-midi. « Un monsieur très pressé. »' },
  ],
  gare: [
    { id: 'car', x: 0.45, y: 0.52, r: 0.12, label: 'Le car pour Cotonou', text: 'Le chauffeur charge les derniers bagages. Dans la soute, entre des sacs de riz et des bidons, un coin de malle verte dépasse.', clue: 'malle_vue' },
    { id: 'buvette', x: 0.1, y: 0.6, r: 0.07, label: 'La buvette', text: 'Des chauffeurs boivent un café au lait concentré en attendant l’heure. La radio donne les nouvelles en mina.' },
  ],
};

export const DEDUCTION = [
  { q: 'Qu’est-ce qui a emporté la malle à l’aube ?', options: ['Un tricycle de livraison', 'Un pousse-pousse', 'Une moto avec un porte-bagages'], ok: 1, hint: ['roues', 'temoin_kodjo', 'raphia'] },
  { q: 'Qui l’a poussé ?', options: ['Mawuli, l’apprenti', 'Komi, le pousseur au maillot rouge', 'Un inconnu de passage'], ok: 1, hint: ['temoin_kodjo', 'maillot', 'sena_vu', 'komi_nomme'] },
  { q: 'Qui a payé pour ça ?', options: ['Séna, par jalousie', 'Un homme de Cotonou, collectionneur', 'Personne : un vol d’occasion'], ok: 1, hint: ['transfert', 'piste_cotonou', 'carte'] },
];

export const EVENTS = [
  { id: 'pure_water', title: 'Pure water', text: 'Une vendeuse te tend un sachet d’eau glacée. « Cent francs, ma sœur, il fait chaud. » Tu bois d’un trait : la journée sera longue.', cost: 0 },
  { id: 'embouteillage', title: 'Embouteillage', text: 'Un camion de sable s’est mis en travers au carrefour. Zémidjans et taxis klaxonnent, rien ne bouge. Tu perds cinq minutes.', cost: 5 },
  { id: 'sms', title: 'Message de Dada', text: '« Kafui, tu avances ? Les clientes demandent. Je prie. » Tu réponds : « Bientôt, Dada. »', cost: 0 },
  { id: 'controle', title: 'Contrôle de police', text: 'Des policiers arrêtent les motos sans casque. Ton zem fait un détour par les ruelles de sable. Cinq minutes de plus.', cost: 5 },
  { id: 'camarade', title: 'Une camarade de fac', text: 'Essi, de ton amphi, te hèle : « Tu cherches un pousse-pousse ? J’en ai vu un chargé filer vers le front de mer, ce matin, très tôt. » Tu notes.', cost: 0, set: 'rumeur_mer' },
  { id: 'cloches', title: 'Les cloches', text: 'La cathédrale sonne. Chaque coup te rappelle l’heure du car. Tu presses le pas.', cost: 0 },
  { id: 'raccourci', title: 'Raccourci de Kodjo', text: '« Petite sœur ! Monte, je te dépose. » Kodjo file par les ruelles : tu gagnes dix minutes.', cost: -10, need: 'kodjo_ami' },
];

export const ENDINGS = {
  police: { k: 'Fin · justice', h: 'La malle revient à la maison', p: "Le commissariat central retient M. Dossou. Komi, qui a parlé, s'en tire avec un avertissement et rembourse les 150 000 F. Au coucher du soleil, toute la rue du Commerce vient voir les douze pagnes de 1974. Dada Akossiwa les déplie un par un en racontant la grand-mère, le port, la Benz.", good: true, best: true },
  malle: { k: 'Fin · la malle', h: 'Les pagnes sont sauvés', p: "Dada Akossiwa serre la malle contre elle. Les douze pagnes sont là. M. Dossou, lui, a passé la frontière à Hillacondji ; il chinera ailleurs. « Tu as bien fait, ma fille. Mais un voleur libre reste un voleur. »", good: true },
  faux: { k: 'Fin · fausse piste', h: 'Un innocent accusé', p: "Mawuli passe la journée au commissariat. Le soir, un ticket de paris prouve qu'il était au kiosque à l'heure du vol. La malle, elle, a pris le car de 14 h pour Cotonou. Dada Akossiwa ne dit plus rien." },
  car: { k: 'Fin · 14 h', h: 'Le car est parti', p: "À la gare routière, le car de Cotonou s'éloigne dans la poussière. Quelque part dans la soute, une malle verte. Il fallait aller plus vite, ou écouter mieux." },
};

export function hasClue(state, c) {
  if (Array.isArray(c)) return c.some(x => state.clues.includes(x) || state.flags.includes(x));
  return state.clues.includes(c) || state.flags.includes(c);
}
