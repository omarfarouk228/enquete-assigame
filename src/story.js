// Scénario d'« Enquête à Assigamé ». Données pures : lieux, personnages, indices, dialogues.
// Lomé, un samedi de novembre 2026. Le Grand marché (Assigamé), incendié en janvier 2013,
// est toujours en chantier : le commerce s'est installé dans les rues autour.
//
// Salutations en éwé et mina, en orthographe simplifiée, à faire relire par un locuteur :
// « Woézon » (bienvenue), « Akpé » (merci), « Efoa ? » (ça va ?), « Dada » (grande sœur, tante),
// « Fofo » (grand frère), « Yoo » (d'accord).

export const START = 9 * 60;        // 9 h 00
export const DEADLINE = 14 * 60;    // le car pour Cotonou part à 14 h
export const MOVE_COST = 20;        // minutes pour changer de lieu
export const TALK_COST = 10;        // minutes par conversation

export const LOCATIONS = {
  etal: { name: 'Rue du Commerce', sub: "L'étal de Dada Akossiwa, face au chantier du Grand marché", people: ['dada', 'mawuli'] },
  poisson: { name: 'Le coin du poisson fumé', sub: 'Trois foyers, des claies, la fumée qui pique les yeux', people: ['sena'] },
  carrefour: { name: 'Carrefour de la cathédrale', sub: 'Zémidjans, pousse-pousse et vendeurs ambulants', people: ['kodjo', 'komi'] },
  kiosque: { name: 'Kiosque de la rue de la Gare', sub: 'Mobile Money, recharges et paris sportifs', people: ['ayaovi'] },
  hotel: { name: 'Hôtel du front de mer', sub: 'Boulevard de la République, face à l’océan', people: ['dossou'], locked: 'adresse_dossou' },
};

export const PEOPLE = {
  dada: { name: 'Dada Akossiwa', role: 'Revendeuse de pagnes, ta tante', look: { skin: '#6a3f28', sex: 'f', age: 58, hair: 'wrap', wrap: '#c2401f', wrap2: '#f2b134', top: 'wax', topC: '#1f5aa8', topC2: '#f2b134', earrings: true } },
  mawuli: { name: 'Mawuli', role: "L'apprenti de Dada", look: { skin: '#4f2c1a', sex: 'm', age: 19, hair: 'short', top: 'tee', topC: '#e9e2cf', print: 'TOGO', beard: false } },
  sena: { name: 'Séna', role: 'Vendeuse de poisson fumé', look: { skin: '#5e3622', sex: 'f', age: 45, hair: 'wrap', wrap: '#2e6fb5', wrap2: '#f4efe4', top: 'blouse', topC: '#7b3fa0', earrings: true } },
  kodjo: { name: 'Fofo Kodjo', role: 'Zémidjan', look: { skin: '#45261a', sex: 'm', age: 34, hair: 'locks', top: 'shirt', topC: '#3d6b9e', beard: true, cap: false } },
  komi: { name: 'Komi', role: 'Pousseur de pousse-pousse', look: { skin: '#53301c', sex: 'm', age: 27, hair: 'short', top: 'jersey', topC: '#c8102e', topC2: '#ffffff', beard: false } },
  ayaovi: { name: 'Ayaovi', role: 'Gérant du kiosque', look: { skin: '#6e3d23', sex: 'm', age: 41, hair: 'bald', top: 'polo', topC: '#f2c230', glasses: true, beard: true } },
  dossou: { name: 'M. Dossou', role: 'Antiquaire de Cotonou', look: { skin: '#5a3420', sex: 'm', age: 55, hair: 'short', grey: true, top: 'boubou', topC: '#f4efe4', topC2: '#b08a4b', glasses: true, beard: false } },
};

export const CLUES = {
  roues: { name: 'Traces de roues étroites', desc: 'Deux sillons fins et parallèles dans le sable devant l’étal. Trop étroits pour un tricycle : plutôt les roues d’un pousse-pousse.' },
  raphia: { name: 'Bout de corde bleue', desc: 'Une corde en plastique bleu tressé, coupée net, accrochée au pied de la table. Les pousseurs du carrefour attachent leurs charges avec la même.' },
  foyer: { name: 'Foyer encore chaud', desc: 'Sous la claie de Séna, la braise rougeoie encore. Un foyer de poisson fumé s’allume bien avant 7 h.' },
  temoin_kodjo: { name: 'Le témoignage de Kodjo', desc: 'Vers 5 h 30, Kodjo a vu un pousse-pousse chargé d’une malle verte filer vers le boulevard du 13 Janvier. Le pousseur portait un maillot rouge.' },
  ticket: { name: 'Ticket de paris de 5 h 41', desc: 'Un ticket imprimé au kiosque de la rue de la Gare à 5 h 41, au nom de Mawuli. Il ne pouvait pas être devant l’étal à cette heure-là.' },
  transfert: { name: 'Transfert de 150 000 F', desc: 'À 6 h 12, un retrait de 150 000 F CFA au kiosque, par « KOMI A. ». L’envoi vient d’un numéro béninois (+229).' },
  maillot: { name: 'Le maillot rouge de Komi', desc: 'Komi porte un maillot de foot rouge, et une corde bleue pend de son pousse-pousse.' },
  carte: { name: 'Carte de visite de M. Dossou', desc: '« Dossou, antiquités textiles, Cotonou ». Au dos, au stylo : « Hôtel du front de mer, ch. 12, départ samedi 14 h ».' },
  aveu_komi: { name: 'Les aveux de Komi', desc: 'Komi a transporté la malle à l’aube pour un monsieur de Cotonou, qui l’a payé par Mobile Money. La malle est à l’hôtel du front de mer.' },
  malle: { name: 'La malle de la Benz', desc: 'La malle verte de la grand-mère, avec ses douze pièces de wax de 1974. Retrouvée dans la chambre 12.' },
};

export const ITEMS = { adresse_dossou: 'Adresse de M. Dossou' };

// Dialogues. Un nœud : { who, text, choices: [{ t, go, need?, needNot?, set?, clue?, cost? }] }
// Une confrontation : { confront: { claim, clue, ok, ko } } — présenter le bon indice contredit la déclaration.
export const NODES = {
  // ---------------------------------------------------------------- Dada
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
  fin_faux: { who: 'dada', text: "Je le savais ! Je l'envoie au commissariat. … Mais Kafui, s'il n'avait rien fait ? La malle, elle, n'est toujours pas là.", choices: [{ t: 'Attendre la suite…', go: null, end: 'faux' }] },
  dada_fin: { who: 'dada', text: "Ma malle ! Kafui, ma fille… La grand-mère serait fière de toi. Ce soir, tout le marché saura ce que tu as fait.", choices: [{ t: 'Akpé, Dada.', go: null }] },

  // ---------------------------------------------------------------- Mawuli
  mawuli_0: { who: 'mawuli', text: "Kafui, je te jure, ce n'est pas moi. Dada crie partout que je suis un voleur. J'étais chez ma mère à Bè, je dormais.", choices: [
    { t: 'Tu dormais à Bè à 5 h 30 ?', go: 'mawuli_conf' },
    { t: 'Tu as vu quelque chose en arrivant ?', go: 'mawuli_vu' },
    { t: 'On verra.', go: null },
  ] },
  mawuli_vu: { who: 'mawuli', text: "Le cadenas n'était pas cassé, il était ouvert, posé sur la table. Et il y avait des traces dans le sable. Moi, j'ai la clé, alors forcément…", choices: [{ t: 'Le cadenas était ouvert…', go: null, set: 'cadenas' }] },
  mawuli_conf: { who: 'mawuli', confront: {
    claim: "Je dormais chez ma mère à Bè, toute la nuit, jusqu'à 7 h.",
    clue: 'ticket',
    ok: 'mawuli_aveu',
    ko: "Mawuli hausse les épaules. « Ça ne prouve rien. »",
  } },
  mawuli_aveu: { who: 'mawuli', text: "…Bon. J'étais au kiosque de la rue de la Gare, pour le match de la nuit. Je n'ai rien dit à Dada parce qu'elle déteste les paris. Mais je n'ai pas touché à la malle. Et le cadenas… je l'avais oublié ouvert hier soir. C'est ma faute.", set: 'mawuli_innocent', choices: [{ t: 'Je te crois.', go: null }] },

  // ---------------------------------------------------------------- Séna
  sena_0: { who: 'sena', text: "Woézon, ma fille. Efoa ? Tu viens pour la malle de ta tante, hein. Toute la rue ne parle que de ça.", choices: [
    { t: 'À quelle heure es-tu arrivée ?', go: 'sena_conf' },
    { t: 'Tu t’entends bien avec Dada ?', go: 'sena_dada' },
    { t: 'Je repasserai.', go: null },
  ] },
  sena_dada: { who: 'sena', text: "Ta tante et moi, on se dispute pour la place depuis 2013, depuis l'incendie du Grand marché. Mais voler une vieille femme ? Jamais. Je vends mon poisson, c'est tout.", choices: [{ t: 'Yoo.', go: null }] },
  sena_conf: { who: 'sena', confront: {
    claim: "Je suis arrivée à 7 h, comme tous les jours. Je n'ai rien vu.",
    clue: 'foyer',
    ok: 'sena_aveu',
    ko: "Séna retourne ses poissons sans te regarder. « Je t'ai dit ce que je sais. »",
  } },
  sena_aveu: { who: 'sena', text: "…Tu as de bons yeux. J'étais là avant 5 h, pour le feu. J'ai vu Komi, le pousseur du carrefour, charger une malle verte. Il m'a regardée longtemps. Je lui dois de l'argent, j'ai eu peur. Ne dis pas que ça vient de moi.", set: 'sena_vu', choices: [{ t: 'Akpé, Séna. Je ne dirai rien.', go: null }] },

  // ---------------------------------------------------------------- Kodjo
  kodjo_0: { who: 'kodjo', text: "Petite sœur ! Tu montes ? Bè, Tokoin, Adidogomé, je t'emmène partout. Ah, tu enquêtes ? La malle de Dada Akossiwa ?", choices: [
    { t: 'Tu étais au carrefour ce matin ?', go: 'kodjo_vu' },
    { t: 'Tu connais les pousseurs ?', go: 'kodjo_pousseurs', need: 'roues' },
    { t: 'Plus tard, Fofo.', go: null },
  ] },
  kodjo_vu: { who: 'kodjo', text: "Je prends ma première course à 5 h. Vers 5 h 30, j'ai croisé un pousse-pousse qui filait vers le boulevard du 13 Janvier. Une malle verte dessus, bien attachée. Le pousseur avait un maillot rouge. À cette heure-là, ça m'a étonné.", clue: 'temoin_kodjo', choices: [{ t: 'Un maillot rouge… Akpé.', go: null }] },
  kodjo_pousseurs: { who: 'kodjo', text: "Ils attendent là-bas, sous le manguier, avec leurs pousse-pousse. Ils attachent tout avec de la corde bleue, celle qu'on achète au rouleau. Komi, avec son maillot rouge, il est toujours le premier levé.", choices: [{ t: 'Komi…', go: null, set: 'komi_nomme' }] },

  // ---------------------------------------------------------------- Komi
  komi_0: { who: 'komi', text: "Quoi ? Je travaille, moi. Tu veux transporter quelque chose ? Sinon laisse-moi.", choices: [
    { t: 'Tu as transporté une malle ce matin ?', go: 'komi_conf' },
    { t: 'Rien, pardon.', go: null },
  ] },
  komi_conf: { who: 'komi', confront: {
    claim: "Ce matin ? Rien du tout. Je suis arrivé à 8 h, mon pousse-pousse était vide.",
    clue: ['transfert', 'temoin_kodjo', 'raphia'],
    ok: 'komi_presse',
    ko: "Komi crache par terre. « Tu n'as rien contre moi. »",
  } },
  komi_presse: { who: 'komi', confront: {
    claim: "Une malle verte, un maillot rouge… Il y a cent pousseurs à Lomé. Et l'argent, d'où je l'aurais eu ?",
    clue: 'transfert',
    ok: 'komi_aveu',
    ko: "« Tu vois ? Tu n'as rien. » Il saisit les bras de son pousse-pousse.",
  } },
  komi_aveu: { who: 'komi', text: "…Il m'a dit que c'était une vieille malle sans valeur, que la dame était d'accord. Un monsieur de Cotonou, en boubou blanc. Il m'a envoyé 150 000 par Mobile Money. J'ai porté la malle à son hôtel, sur le front de mer. Chambre 12. Il part à 14 h.", clue: 'aveu_komi', set: 'adresse_dossou', choices: [{ t: 'Viens avec moi, Komi.', go: null }] },

  // ---------------------------------------------------------------- Ayaovi
  ayaovi_0: { who: 'ayaovi', text: "Bonjour. Recharge, transfert, paris ? Fais vite, il y a la queue.", choices: [
    { t: 'Mawuli était ici cette nuit ?', go: 'ayaovi_mawuli' },
    { t: 'Quelqu’un a retiré une grosse somme ce matin ?', go: 'ayaovi_refus' },
    { t: 'Merci.', go: null },
  ] },
  ayaovi_mawuli: { who: 'ayaovi', text: "Le petit de Dada Akossiwa ? Il était là toute la nuit pour le match, il a joué à 5 h 41. Tiens, il a oublié son ticket sur le comptoir.", clue: 'ticket', choices: [{ t: 'Akpé, Ayaovi.', go: null }] },
  ayaovi_refus: { who: 'ayaovi', text: "Les transferts des clients, c'est confidentiel. Je ne montre pas mon registre à n'importe qui.", choices: [
    { t: 'Un pousseur au maillot rouge, ça te dit quelque chose ?', go: 'ayaovi_komi', need: 'temoin_kodjo' },
    { t: 'Dada Akossiwa est ruinée si on ne retrouve pas sa malle.', go: 'ayaovi_dada', need: 'piste_cotonou' },
    { t: 'Je comprends.', go: null },
  ] },
  ayaovi_komi: { who: 'ayaovi', text: "Komi ? Il est venu à 6 h 12, tout excité. Retrait de 150 000. Moi je n'ai rien dit, hein. Mais l'envoi venait d'un numéro du Bénin.", clue: 'transfert', choices: [{ t: 'Du Bénin…', go: null }] },
  ayaovi_dada: { who: 'ayaovi', text: "Dada Akossiwa ? Elle m'a fait crédit quand j'ai ouvert le kiosque. … Bon. À 6 h 12, un certain KOMI A. a retiré 150 000 F, envoyés d'un numéro +229. Tu ne tiens pas ça de moi.", clue: 'transfert', choices: [{ t: 'Akpé. Je ne dirai rien.', go: null }] },

  // ---------------------------------------------------------------- Dossou
  dossou_0: { who: 'dossou', text: "Mademoiselle ? Je suis pressé, mon car part bientôt. Que voulez-vous ?", choices: [
    { t: 'Vous êtes antiquaire ?', go: 'dossou_carte' },
    { t: 'Vous avez une malle verte dans votre chambre.', go: 'dossou_conf' },
  ] },
  dossou_carte: { who: 'dossou', text: "Antiquités textiles, oui. Je chine des wax anciens pour des collectionneurs en Europe. Voici ma carte. Si vous avez de vieux pagnes, je paie bien.", clue: 'carte', choices: [{ t: 'Je vois.', go: null }] },
  dossou_conf: { who: 'dossou', confront: {
    claim: "Une malle ? Je l'ai achetée honnêtement, à son propriétaire. J'ai le reçu.",
    clue: ['aveu_komi', 'transfert'],
    ok: 'dossou_aveu',
    ko: "M. Dossou consulte sa montre. « Je n'ai pas de temps à perdre. »",
  } },
  dossou_aveu: { who: 'dossou', text: "…Ce pousseur parle trop. Écoutez, mademoiselle, rien n'est perdu. Je vous rends la malle, et nous oublions cette histoire. Je peux même vous dédommager…", choices: [
    { t: 'Appeler le commissariat central.', go: 'fin_police', set: 'fin_police' },
    { t: 'Reprendre la malle et le laisser partir.', go: 'fin_malle', set: 'fin_malle' },
  ] },
  fin_police: { who: 'dossou', text: "Deux policiers du commissariat central arrivent un quart d'heure plus tard. M. Dossou ne prendra pas le car de 14 h. La malle verte est là, sous le lit, les douze pagnes intacts.", clue: 'malle', choices: [{ t: 'Rapporter la malle à Dada.', go: null, end: 'police' }] },
  fin_malle: { who: 'dossou', text: "M. Dossou te tend la malle sans un mot et file vers la gare routière. Les douze pagnes sont intacts. Mais l'homme ira chiner ailleurs.", clue: 'malle', choices: [{ t: 'Rapporter la malle à Dada.', go: null, end: 'malle' }] },
};

// Hotspots des lieux (positions en fraction de l'écran)
export const HOTSPOTS = {
  etal: [
    { id: 'roues', x: 0.38, y: 0.86, r: 0.05, label: 'Le sable devant l’étal', clue: 'roues', text: 'Deux sillons fins, parallèles. Ce n’est pas un tricycle, plutôt un pousse-pousse.' },
    { id: 'raphia', x: 0.58, y: 0.76, r: 0.035, label: 'Le pied de la table', clue: 'raphia', text: 'Un bout de corde bleue, coupée net, accrochée au pied de la table.' },
    { id: 'chantier', x: 0.5, y: 0.32, r: 0.12, label: 'Le chantier du Grand marché', text: 'Le Grand marché a brûlé dans la nuit du 11 au 12 janvier 2013. Depuis, la reconstruction avance, et les commerçantes se sont installées dans les rues autour.' },
  ],
  poisson: [
    { id: 'foyer', x: 0.36, y: 0.8, r: 0.05, label: 'Le foyer sous la claie', clue: 'foyer', text: 'La braise est encore rouge. Ce feu a été allumé bien avant 7 h.' },
    { id: 'claie', x: 0.6, y: 0.62, r: 0.06, label: 'Les claies de poisson', text: 'Des chinchards et des sardinelles fumés, dorés et serrés sur les claies.' },
  ],
  carrefour: [
    { id: 'cathedrale', x: 0.24, y: 0.3, r: 0.1, label: 'La cathédrale du Sacré-Cœur', text: 'Les deux flèches de la cathédrale de Lomé, construite à l’époque allemande, dominent le carrefour.' },
    { id: 'pousse', x: 0.73, y: 0.76, r: 0.06, label: 'Le pousse-pousse de Komi', clue: 'maillot', need: 'komi_nomme', text: 'Une corde bleue pend du pousse-pousse, et son propriétaire porte un maillot rouge.' },
  ],
  kiosque: [
    { id: 'affiche', x: 0.7, y: 0.38, r: 0.07, label: 'Les affiches', text: 'Recharges, transferts, retraits, paris sur les matchs de la nuit : le kiosque ne dort jamais vraiment.' },
  ],
  hotel: [
    { id: 'mer', x: 0.5, y: 0.25, r: 0.15, label: "L'océan", text: 'Les vagues du golfe de Guinée cognent la plage. Au loin, des pirogues.' },
  ],
};

export function hasClue(state, c) {
  if (Array.isArray(c)) return c.some(x => state.clues.includes(x));
  return state.clues.includes(c);
}
