// Enquête à Assigamé : boucle, scènes, dialogues, carnet, plan, fins.
import { LOCATIONS, PEOPLE, CLUES, NODES, HOTSPOTS, START, DEADLINE, MOVE_COST, TALK_COST, hasClue } from './story.js';
import { background, foreground, STAGE, drawFigure, crowd, drawCrowd } from './scenes.js';
import { drawPortrait } from './portrait.js';
import { initAudio, setMuted, muted, setPlace, sfx } from './audio.js';

const cv = document.getElementById('scene'), ctx = cv.getContext('2d');
const $ = (id) => document.getElementById(id);
const panel = $('panel');
let W = 0, H = 0, DPR = 1;
const SAVE = 'assigame.save.v1';

// ------------------------------------------------------------------ état
const fresh = () => ({ t: START, loc: 'etal', clues: [], flags: [], seen: [], talked: [], ended: null });
let S = null;
const save = () => { try { localStorage.setItem(SAVE, JSON.stringify(S)); } catch { /* rien */ } };
const load = () => { try { return JSON.parse(localStorage.getItem(SAVE)); } catch { return null; } };
const has = (f) => S.flags.includes(f) || S.clues.includes(f);
const fmt = (m) => `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`;

// ------------------------------------------------------------------ rendu
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 1.5);
  W = Math.round(innerWidth * DPR); H = Math.round(innerHeight * DPR);
  cv.width = W; cv.height = H; people = null;
}
addEventListener('resize', resize);

let people = null, passers = null, hover = null, t0 = performance.now(), lastT = t0;
function layout() {
  const loc = S ? S.loc : 'etal';
  passers = crowd(loc, W, H);
  people = Object.entries(STAGE[loc] || {}).map(([id, [fx, sc]]) => ({ id, x: W * fx, sc, box: null }));
}

function frame(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
  const t = (now - t0) / 1000;
  const loc = S ? S.loc : 'etal';
  if (!people) layout();
  ctx.drawImage(background(loc, W, H), 0, 0);
  // passants à l'arrière
  drawCrowd(ctx, passers, W, dt, t);
  const fg = foreground(loc, W, H); if (fg) ctx.drawImage(fg, 0, 0);
  // personnages
  const ground = H * 0.97;
  for (const p of people) {
    const hpx = H * 0.5 * p.sc;
    p.box = drawFigure(ctx, p.id, PEOPLE[p.id].look, p.x, ground - (1 - p.sc) * H * 0.18, hpx, t, hover && hover.kind === 'p' && hover.id === p.id);
  }
  // points d'intérêt : petit éclat qui pulse tant qu'on ne les a pas examinés
  if (S && !panelOpen()) {
    for (const h of HOTSPOTS[loc] || []) {
      if (h.need && !has(h.need)) continue;
      const x = h.x * W, y = h.y * H, seen = S.seen.includes(`${loc}:${h.id}`);
      const pulse = 0.5 + 0.5 * Math.sin(t * 3 + h.x * 10);
      ctx.strokeStyle = seen ? 'rgba(243,234,216,0.25)' : `rgba(255,214,120,${0.45 + pulse * 0.45})`;
      ctx.lineWidth = 2 * DPR;
      ctx.beginPath(); ctx.arc(x, y, (10 + pulse * 6) * DPR, 0, Math.PI * 2); ctx.stroke();
      if (hover && hover.kind === 'h' && hover.id === h.id) { ctx.fillStyle = 'rgba(255,214,120,0.18)'; ctx.beginPath(); ctx.arc(x, y, h.r * Math.min(W, H) * 1.4, 0, Math.PI * 2); ctx.fill(); }
    }
  }
  // lumière chaude et vignette
  ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = 'rgba(255,200,120,0.18)'; ctx.fillRect(0, 0, W, H); ctx.restore();
  const vg = ctx.createRadialGradient(W / 2, H * 0.5, H * 0.4, W / 2, H * 0.5, H * 1.1);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(10,15,20,0.5)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  requestAnimationFrame(frame);
}

// ------------------------------------------------------------------ interactions
const panelOpen = () => !!panel.innerHTML || !$('dlg').hidden;
function pick(mx, my) {
  if (!S || panelOpen()) return null;
  for (const h of HOTSPOTS[S.loc] || []) {
    if (h.need && !has(h.need)) continue;
    if (Math.hypot(mx - h.x * W, my - h.y * H) < Math.max(h.r * Math.min(W, H) * 1.4, 26 * DPR)) return { kind: 'h', id: h.id, h };
  }
  for (const p of [...(people || [])].reverse()) if (p.box && mx > p.box.x0 && mx < p.box.x1 && my > p.box.y0 && my < p.box.y1) return { kind: 'p', id: p.id };
  return null;
}
cv.addEventListener('pointermove', (e) => {
  const hit = pick(e.clientX * DPR, e.clientY * DPR); hover = hit;
  const tip = $('tip');
  if (hit) { tip.hidden = false; tip.style.left = `${e.clientX}px`; tip.style.top = `${e.clientY}px`; tip.textContent = hit.kind === 'p' ? `${PEOPLE[hit.id].name} · parler` : hit.h.label; cv.style.cursor = 'pointer'; }
  else { tip.hidden = true; cv.style.cursor = 'default'; }
});
cv.addEventListener('click', (e) => {
  const hit = pick(e.clientX * DPR, e.clientY * DPR); if (!hit) return;
  $('tip').hidden = true; sfx('click');
  if (hit.kind === 'p') talk(hit.id); else examine(hit.h);
});
addEventListener('keydown', (e) => {
  if (e.code === 'KeyM') toggleSound();
  if (!S || S.ended) return;
  if (e.code === 'KeyC' && $('dlg').hidden) notes();
  if (e.code === 'KeyP' && $('dlg').hidden) map();
  if (e.code === 'Escape') { panel.innerHTML = ''; }
});

function toast(big, small) {
  const el = $('toast'); el.hidden = false; el.innerHTML = `${small ? `<small>${small}</small>` : ''}${big}`;
  el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
  clearTimeout(toast.tm); toast.tm = setTimeout(() => { el.hidden = true; }, 2600);
}

function addClue(id) {
  if (!id || S.clues.includes(id)) return;
  S.clues.push(id); sfx('clue'); toast(CLUES[id].name, 'Nouvel indice dans le carnet');
  hud(); save();
}
function spend(min) {
  S.t += min; hud(); save();
  if (S.t >= DEADLINE && !S.ended) setTimeout(() => ending('car'), 600);
}

function examine(h) {
  S.seen.includes(`${S.loc}:${h.id}`) || S.seen.push(`${S.loc}:${h.id}`);
  panel.innerHTML = `<div class="paper"><div class="kick">${LOCATIONS[S.loc].name}</div><h2>${h.label}</h2><p>${h.text}</p><div class="row"><button class="btn" id="b-ok">Fermer</button></div></div>`;
  $('b-ok').onclick = () => { panel.innerHTML = ''; addClue(h.clue); };
  if (h.clue && !S.clues.includes(h.clue)) spend(5);
}

// ------------------------------------------------------------------ dialogues
let dlgWho = null;
function talk(id) {
  if (!S.talked.includes(id)) S.talked.push(id);
  spend(TALK_COST);
  let start = `${id}_0`;
  if (id === 'dada' && has('malle')) start = 'dada_fin';
  setPlace('dialogue');
  show(start);
}

function drawDlgPortrait(id, expr) {
  const c = $('dlg-portrait'), g = c.getContext('2d');
  g.clearRect(0, 0, c.width, c.height);
  drawPortrait(g, c.width, c.height, PEOPLE[id].look, expr, performance.now() / 1000);
}
function exprFor(node) {
  if (node.confront) return 'colere';
  const t = node.text || '';
  if (/aveu|…Bon|…Tu as|…Ce pousseur|…Il m'a/.test(t)) return 'inquiet';
  if (/!/.test(t) && /Akpé|Woézon|Petite sœur|Ma malle/.test(t)) return 'sourire';
  if (/\?/.test(t) && t.length < 90) return 'surpris';
  return 'neutre';
}

let typing = null;
function typeText(el, html) {
  clearInterval(typing);
  const plain = html; let i = 0;
  el.innerHTML = '';
  typing = setInterval(() => { i += 2; el.innerHTML = plain.slice(0, i); if (i >= plain.length) clearInterval(typing); }, 14);
  el.onclick = () => { clearInterval(typing); el.innerHTML = plain; };
}

function show(key) {
  const node = NODES[key];
  if (!node) { closeDlg(); return; }
  const who = node.who; dlgWho = who;
  $('dlg').hidden = false;
  $('dlg-name').textContent = PEOPLE[who].name; $('dlg-role').textContent = PEOPLE[who].role;
  drawDlgPortrait(who, exprFor(node));
  if (node.clue) addClue(node.clue);
  if (node.set && !S.flags.includes(node.set)) S.flags.push(node.set);
  const box = $('dlg-choices'); box.innerHTML = '';
  if (node.confront) {
    const C = node.confront;
    typeText($('dlg-text'), `<q>${C.claim}</q>`);
    const b1 = document.createElement('button'); b1.className = 'hot'; b1.textContent = 'Présenter un indice'; b1.onclick = () => presentClue(C);
    const b2 = document.createElement('button'); b2.textContent = 'Laisser tomber pour l’instant'; b2.onclick = closeDlg;
    box.append(b1, b2);
    return;
  }
  typeText($('dlg-text'), node.text);
  for (const c of node.choices || []) {
    if (c.need && !has(c.need)) continue;
    if (c.needNot && has(c.needNot)) continue;
    const b = document.createElement('button'); b.textContent = c.t;
    b.onclick = () => {
      sfx('click');
      if (c.set && !S.flags.includes(c.set)) S.flags.push(c.set);
      if (c.clue) addClue(c.clue);
      save();
      if (c.end) { closeDlg(); return ending(c.end); }
      if (c.go) show(c.go); else closeDlg();
    };
    box.appendChild(b);
  }
}

function presentClue(C) {
  const box = $('dlg-choices'); box.innerHTML = '';
  if (!S.clues.length) { box.innerHTML = '<p>Ton carnet est vide. Cherche d’abord des indices.</p>'; const b = document.createElement('button'); b.textContent = 'Revenir'; b.onclick = closeDlg; box.appendChild(b); return; }
  const grid = document.createElement('div'); grid.className = 'clue-pick';
  for (const id of S.clues) {
    const b = document.createElement('button'); b.textContent = CLUES[id].name; b.title = CLUES[id].desc;
    b.onclick = () => {
      const ok = Array.isArray(C.clue) ? C.clue.includes(id) : C.clue === id;
      if (ok) { sfx('reveal'); show(C.ok); }
      else { sfx('wrong'); spend(5); $('dlg-text').innerHTML = C.ko; drawDlgPortrait(dlgWho, 'colere'); const back = document.createElement('button'); back.textContent = 'Réfléchir encore'; back.onclick = () => presentClue(C); const q = document.createElement('button'); q.textContent = 'Partir'; q.onclick = closeDlg; box.innerHTML = ''; box.append(back, q); }
    };
    grid.appendChild(b);
  }
  box.appendChild(grid);
  const q = document.createElement('button'); q.textContent = 'Annuler'; q.onclick = closeDlg; box.appendChild(q);
}

function closeDlg() { clearInterval(typing); $('dlg').hidden = true; setPlace(S.loc); hud(); save(); }

// ------------------------------------------------------------------ carnet, plan
function notes() {
  const all = Object.keys(CLUES);
  panel.innerHTML = `<div class="paper"><div class="kick">Carnet de Kafui</div><h2>Ce que je sais</h2>
    <p class="dim">Présente un indice quand quelqu'un affirme quelque chose de faux. Les indices se trouvent en examinant les lieux et en interrogeant les gens.</p>
    <div class="clues">${all.map((id, i) => S.clues.includes(id) ? `<div class="clue" style="--r:${(i % 3 - 1) * 0.8}deg"><b>${CLUES[id].name}</b><span>${CLUES[id].desc}</span></div>` : `<div class="clue empty"><b>?</b><span>Indice à découvrir.</span></div>`).join('')}</div>
    <h3 style="font-family:var(--serif);font-weight:400;font-size:24px;margin:22px 0 4px">Personnes rencontrées</h3>
    <div class="people">${S.talked.map(id => `<span>${PEOPLE[id].name} · ${PEOPLE[id].role}</span>`).join('') || '<span>Personne encore.</span>'}</div>
    <div class="row"><button class="btn" id="b-x">Fermer</button></div></div>`;
  $('b-x').onclick = () => { panel.innerHTML = ''; };
}

function map() {
  panel.innerHTML = `<div class="paper"><div class="kick">Plan du quartier</div><h2>Où aller ?</h2>
    <p class="dim">Chaque trajet prend ${MOVE_COST} minutes, à pied dans la foule ou à l'arrière d'un zémidjan.</p>
    <div class="map">${Object.entries(LOCATIONS).map(([id, L]) => {
      const locked = L.locked && !has(L.locked);
      return `<button data-id="${id}" class="${id === S.loc ? 'here' : ''}" ${locked ? 'disabled' : ''}><b>${locked ? 'Lieu inconnu' : L.name}</b><span>${locked ? 'Il te manque une adresse.' : id === S.loc ? 'Tu es ici.' : L.sub}</span></button>`;
    }).join('')}</div>
    <div class="row"><button class="btn ghost" id="b-x">Fermer</button></div></div>`;
  for (const b of panel.querySelectorAll('.map button')) b.onclick = () => { if (b.dataset.id !== S.loc) go(b.dataset.id); else panel.innerHTML = ''; };
  $('b-x').onclick = () => { panel.innerHTML = ''; };
}

function go(loc) {
  panel.innerHTML = ''; sfx('move');
  S.loc = loc; people = null; setPlace(loc);
  spend(MOVE_COST);
  toast(LOCATIONS[loc].name, fmt(S.t));
}

function hud() {
  if (!S) return;
  $('h-place').textContent = LOCATIONS[S.loc].name; $('h-sub').textContent = LOCATIONS[S.loc].sub;
  $('h-time').textContent = fmt(Math.min(S.t, DEADLINE));
  $('h-tbar').style.width = `${Math.min(100, (S.t - START) / (DEADLINE - START) * 100)}%`;
  document.querySelector('.clock').classList.toggle('late', DEADLINE - S.t <= 60);
  $('n-count').textContent = S.clues.length;
}

// ------------------------------------------------------------------ son
const ICON_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/></svg>';
const ICON_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';
function soundIcon() { const html = muted ? ICON_OFF : ICON_ON; $('b-sound').innerHTML = html; const f = $('b-sound-float'); if (f) f.innerHTML = html; }
function toggleSound() { initAudio(); setMuted(!muted); soundIcon(); }
$('b-sound').onclick = toggleSound;
const floatBtn = document.createElement('button'); floatBtn.id = 'b-sound-float'; floatBtn.setAttribute('aria-label', 'Couper le son'); floatBtn.onclick = toggleSound; document.body.appendChild(floatBtn);
soundIcon();

// ------------------------------------------------------------------ écrans
function title() {
  const saved = load();
  $('hud').hidden = true; floatBtn.hidden = false;
  panel.innerHTML = `<div class="title"><div class="kick">Lomé · samedi · 2026</div><h1>Enquête à <em>Assigamé</em></h1>
    <p>Autour du chantier du Grand marché, la malle de wax anciens de Dada Akossiwa a disparu avant l'aube. Tu as jusqu'au car de 14 h pour la retrouver.</p>
    <div class="row" style="justify-content:center">${saved && !saved.ended ? '<button class="btn" id="b-c">Continuer l’enquête</button>' : ''}<button class="btn" id="b-n" ${saved && !saved.ended ? 'style="background:transparent;color:var(--paper);border:1px solid rgba(243,234,216,.4)"' : ''}>Nouvelle enquête</button></div>
    <p style="font-size:13px;opacity:.8;margin-top:22px">Clic pour examiner et parler · C : carnet · P : plan · M : son</p></div>`;
  $('b-n').onclick = () => { initAudio(); S = fresh(); save(); intro(); };
  if (saved && !saved.ended) $('b-c').onclick = () => { initAudio(); S = saved; start(); };
}

function intro() {
  setPlace('menu');
  panel.innerHTML = `<div class="paper"><div class="kick">Samedi, 8 h 47 · message vocal de Dada Akossiwa</div><h2>« Kafui, viens vite ! »</h2>
    <p>Tu t'appelles <b>Kafui Lawson</b>, étudiante en journalisme à l'université de Lomé. Ta tante, Dada Akossiwa, vend des pagnes rue du Commerce, face au chantier du Grand marché qui a brûlé en 2013.</p>
    <p>Cette nuit, quelqu'un a pris sa malle verte : douze pièces de wax de 1974, héritées de ta grand-mère, qui fut une Nana Benz. Un homme de Cotonou voulait les lui acheter la semaine dernière. Le car pour Cotonou part à <b>14 h</b>.</p>
    <p class="dim">Clique sur les gens pour parler, sur les éclats dorés pour examiner. Quand quelqu'un ment, présente l'indice qui le contredit.</p>
    <div class="row"><button class="btn" id="b-go">Aller rue du Commerce</button></div></div>`;
  $('b-go').onclick = start;
}

function start() {
  panel.innerHTML = ''; $('hud').hidden = false; floatBtn.hidden = true;
  people = null; setPlace(S.loc); hud();
}

const ENDINGS = {
  police: { k: 'Fin · justice', h: 'La malle revient à la maison', p: "Le commissariat central retient M. Dossou. Komi, qui a parlé, s'en tire avec un avertissement et rembourse les 150 000 F. Au coucher du soleil, toute la rue du Commerce vient voir les douze pagnes de 1974. Dada Akossiwa les déplie un par un en racontant la grand-mère, le port, la Benz." },
  malle: { k: 'Fin · la malle', h: 'Les pagnes sont sauvés', p: "Dada Akossiwa serre la malle contre elle. Les douze pagnes sont là. M. Dossou, lui, a passé la frontière à Hillacondji ; il chinera ailleurs. « Tu as bien fait, ma fille. Mais un voleur libre reste un voleur. »" },
  faux: { k: 'Fin · fausse piste', h: 'Un innocent accusé', p: "Mawuli passe la journée au commissariat. Le soir, un ticket de paris prouve qu'il était au kiosque à l'heure du vol. La malle, elle, a pris le car de 14 h pour Cotonou. Dada Akossiwa ne dit plus rien." },
  car: { k: 'Fin · 14 h', h: 'Le car est parti', p: "À la gare routière, le car de Cotonou s'éloigne dans la poussière. Quelque part dans la soute, une malle verte. Il fallait aller plus vite, ou écouter mieux." },
};
function ending(kind) {
  if (S.ended) return;
  S.ended = kind; save();
  const E = ENDINGS[kind];
  const good = kind === 'police' || kind === 'malle';
  setPlace('menu');
  if (good) sfx('reveal'); else sfx('wrong');
  $('hud').hidden = true; floatBtn.hidden = false;
  const found = S.clues.length, total = Object.keys(CLUES).length;
  panel.innerHTML = `<div class="paper"><div class="kick">${E.k}</div><h2>${E.h}</h2><p>${E.p}</p>
    <p class="dim">Heure : ${fmt(Math.min(S.t, DEADLINE))} · indices trouvés : ${found} sur ${total}${kind === 'police' ? ' · meilleure fin' : ''}.</p>
    <div class="row"><button class="btn ghost" id="b-t">Menu</button><button class="btn" id="b-r">Recommencer l’enquête</button></div></div>`;
  $('b-r').onclick = () => { S = fresh(); save(); intro(); };
  $('b-t').onclick = title;
}

// ------------------------------------------------------------------ démarrage
$('b-notes').onclick = () => { sfx('click'); notes(); };
$('b-map').onclick = () => { sfx('click'); map(); };
addEventListener('pointerdown', () => initAudio(), { once: true });
resize();
title();
requestAnimationFrame(frame);
window.__as = { get S() { return S; }, set S(v) { S = v; }, show, go, ending, notes, map, start };
void hasClue;
