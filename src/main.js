// Enquête à Assigamé : boucle, scènes, chapitres, cinématiques, dialogues, carnet et déductions,
// plan dessiné, trajets avec événements et course en zem, poursuite, fouille, fins.
import { LOCATIONS, PEOPLE, CLUES, NODES, AGAIN, HOTSPOTS, DEDUCTION, EVENTS, ENDINGS, CHAPTERS, START, DEADLINE, DOSSOU_LEAVES, MOVE_COST, TALK_COST } from './story.js';
import { background, foreground, OVER, STAGE, crowd, drawCrowd } from './scenes.js';
import { drawFigure } from './figure.js';
import { drawPortrait } from './portrait.js';
import { zemRide, chase, roomSearch } from './minigames.js';
import { initAudio, setMuted, muted, setPlace, sfx, setEngine } from './audio.js';

const cv = document.getElementById('scene'), ctx = cv.getContext('2d');
const $ = (id) => document.getElementById(id);
const panel = $('panel');
let W = 0, H = 0, DPR = 1;
const SAVE = 'assigame.save.v2';

// ------------------------------------------------------------------ état
const fresh = () => ({ t: START, loc: 'etal', clues: [], flags: [], seen: [], talked: [], ended: null, chapter: 1, cards: [], events: [], crashes: 0, minis: {} });
let S = null;
const save = () => { try { localStorage.setItem(SAVE, JSON.stringify(S)); } catch { /* rien */ } };
const load = () => { try { return JSON.parse(localStorage.getItem(SAVE)); } catch { return null; } };
const has = (f) => Array.isArray(f) ? f.some(x => has(x)) : (S.flags.includes(f) || S.clues.includes(f));
const setFlag = (f) => { if (f && !S.flags.includes(f)) S.flags.push(f); };
const fmt = (m) => `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`;

// ------------------------------------------------------------------ rendu
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 1.5);
  W = Math.round(innerWidth * DPR); H = Math.round(innerHeight * DPR);
  cv.width = W; cv.height = H; people = null; C = null;
}
addEventListener('resize', resize);

let people = null, C = null, hover = null, t0 = performance.now(), lastT = t0;
let mini = null;            // séquence d'action en cours
let cine = null;            // cinématique en cours
let dlg = { who: null, expr: 'neutre', from: 'neutre', mixT: 1, talk: 0 };

function visiblePeople(loc) {
  return Object.entries(STAGE[loc] || {}).filter(([id]) => {
    if (loc === 'hotel' && id === 'dossou') return !has('dossou_parti');
    if (loc === 'gare' && id === 'dossou') return has('dossou_parti');
    if (loc === 'gare' && id === 'komi') return has('aveu_komi');
    return true;
  });
}
function layout(loc = S ? S.loc : 'etal') {
  C = crowd(loc, W, H);
  people = visiblePeople(loc).map(([id, [fx, sc]]) => ({ id, x: W * fx, sc, box: null }));
}

function drawLocation(loc, t, dt, zoom = 1, showPeople = true) {
  ctx.save();
  if (zoom !== 1) { ctx.translate(W / 2, H * 0.6); ctx.scale(zoom, zoom); ctx.translate(-W / 2, -H * 0.6); }
  ctx.drawImage(background(loc, W, H), 0, 0);
  if (!C || C.loc !== loc) C = crowd(loc, W, H);
  drawCrowd(ctx, C, W, H, dt, t);
  const fg = foreground(loc, W, H); if (fg) ctx.drawImage(fg, 0, 0);
  if (showPeople) {
    const ground = H * 0.97;
    for (const p of people || []) {
      const hpx = H * 0.5 * p.sc;
      p.box = drawFigure(ctx, p.id, PEOPLE[p.id].look, p.x, ground - (1 - p.sc) * H * 0.18, hpx, t, hover && hover.kind === 'p' && hover.id === p.id);
    }
  }
  const ov = OVER[loc] && foreground(OVER[loc], W, H); if (ov) ctx.drawImage(ov, 0, 0);
  ctx.restore();
  // lumière de la journée : fraîche à 9 h, dure et chaude à 13 h
  const k = S ? Math.min(1, Math.max(0, (S.t - START) / (DEADLINE - START))) : 0;
  ctx.save(); ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = `rgba(255,${Math.round(215 - k * 40)},${Math.round(150 - k * 60)},${0.15 + k * 0.2})`; ctx.fillRect(0, 0, W, H);
  ctx.restore();
  if (k < 0.3) { ctx.fillStyle = `rgba(120,160,210,${(0.3 - k) * 0.25})`; ctx.fillRect(0, 0, W, H); }
  const vg = ctx.createRadialGradient(W / 2, H * 0.5, H * 0.4, W / 2, H * 0.5, H * 1.1);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(10,15,20,0.5)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
}

function frame(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
  const t = (now - t0) / 1000;
  if (mini) { const m = mini; m.update(dt); if (mini === m) m.draw(ctx); requestAnimationFrame(frame); return; }
  if (cine) {
    cine.t += dt;
    const k = Math.min(1, cine.t / cine.dur);
    if (!people) layout(cine.loc);
    drawLocation(cine.loc, t, dt, 1 + 0.08 * k, cine.people !== false);
    if (k >= 1 && !cine.done) { cine.done = true; const cb = cine.cb; endCine(); cb && cb(); }
    requestAnimationFrame(frame); return;
  }
  const loc = S ? S.loc : 'etal';
  if (!people) layout(loc);
  drawLocation(loc, t, dt);
  if (S && !panelOpen()) {
    for (const h of HOTSPOTS[loc] || []) {
      if (!hotspotOk(h)) continue;
      const x = h.x * W, y = h.y * H, seen = S.seen.includes(`${loc}:${h.id}`);
      const pulse = 0.5 + 0.5 * Math.sin(t * 3 + h.x * 10);
      ctx.strokeStyle = seen ? 'rgba(243,234,216,0.25)' : `rgba(255,214,120,${0.45 + pulse * 0.45})`;
      ctx.lineWidth = 2 * DPR;
      ctx.beginPath(); ctx.arc(x, y, (10 + pulse * 6) * DPR, 0, Math.PI * 2); ctx.stroke();
      if (!seen) { ctx.fillStyle = `rgba(255,214,120,${0.5 + pulse * 0.4})`; ctx.beginPath(); ctx.arc(x, y, 3 * DPR, 0, Math.PI * 2); ctx.fill(); }
      if (hover && hover.kind === 'h' && hover.id === h.id) { ctx.fillStyle = 'rgba(255,214,120,0.18)'; ctx.beginPath(); ctx.arc(x, y, h.r * Math.min(W, H) * 1.4, 0, Math.PI * 2); ctx.fill(); }
    }
  }
  if (!$('dlg').hidden && dlg.who) {
    dlg.mixT = Math.min(1, dlg.mixT + dt * 4);
    const talk = typing ? 1 : 0; dlg.talk += (talk - dlg.talk) * Math.min(1, dt * 10);
    const c = $('dlg-portrait'), g = c.getContext('2d');
    g.clearRect(0, 0, c.width, c.height);
    drawPortrait(g, c.width, c.height, PEOPLE[dlg.who].look, dlg.expr, t, { talk: dlg.talk, from: dlg.from, mixK: dlg.mixT, gaze: Math.sin(t * 0.5) * 0.3 });
  }
  requestAnimationFrame(frame);
}

// ------------------------------------------------------------------ cinématiques et cartes
function startCine(loc, caption, dur, cb, opts = {}) {
  panel.innerHTML = ''; $('hud').hidden = true;
  cine = { loc, t: 0, dur, cb, people: opts.people };
  people = null; C = null;
  const el = $('cine'); el.hidden = false; $('caption').textContent = caption;
  el.onclick = () => { if (cine && !cine.done) { cine.done = true; const f = cine.cb; endCine(); f && f(); } };
}
function endCine() { cine = null; $('cine').hidden = true; people = null; C = null; }
function chapterCard(n, cb) {
  const ch = CHAPTERS[n]; if (!ch) return cb && cb();
  if (!S.cards.includes(n)) S.cards.push(n); S.chapter = Math.max(S.chapter, n); save();
  const el = $('card'); el.hidden = false; $('card-kick').textContent = ch.sub; $('card-title').textContent = ch.title; $('card-sub').textContent = fmt(S.t);
  el.classList.remove('go'); void el.offsetWidth; el.classList.add('go'); sfx('card');
  setTimeout(() => { el.hidden = true; cb && cb(); }, 3400);
}

// ------------------------------------------------------------------ interactions
const panelOpen = () => !!panel.innerHTML || !$('dlg').hidden || !!mini || !!cine || !$('card').hidden;
function hotspotOk(h) { if (h.need && !has(h.need)) return false; if (h.needNot && has(h.needNot)) return false; return true; }
function pick(mx, my) {
  if (!S || panelOpen()) return null;
  for (const h of HOTSPOTS[S.loc] || []) {
    if (!hotspotOk(h)) continue;
    if (Math.hypot(mx - h.x * W, my - h.y * H) < Math.max(h.r * Math.min(W, H) * 1.4, 26 * DPR)) return { kind: 'h', id: h.id, h };
  }
  for (const p of [...(people || [])].reverse()) if (p.box && mx > p.box.x0 && mx < p.box.x1 && my > p.box.y0 && my < p.box.y1) return { kind: 'p', id: p.id };
  return null;
}
cv.addEventListener('pointermove', (e) => {
  if (mini) { if (mini.move) mini.move(e.clientX * DPR, e.clientY * DPR); return; }
  const hit = pick(e.clientX * DPR, e.clientY * DPR); hover = hit;
  const tip = $('tip');
  if (hit) { tip.hidden = false; tip.style.left = `${e.clientX}px`; tip.style.top = `${e.clientY}px`; tip.textContent = hit.kind === 'p' ? `${PEOPLE[hit.id].name} · parler` : hit.h.label; cv.style.cursor = 'pointer'; }
  else { tip.hidden = true; cv.style.cursor = 'default'; }
});
cv.addEventListener('pointerdown', (e) => { if (mini) { initAudio(); mini.tap(e.clientX * DPR, e.clientY * DPR); } });
cv.addEventListener('click', (e) => {
  if (mini) return;
  const hit = pick(e.clientX * DPR, e.clientY * DPR); if (!hit) return;
  $('tip').hidden = true; sfx('click');
  if (hit.kind === 'p') talk(hit.id); else examine(hit.h);
});
addEventListener('keydown', (e) => {
  if (e.code === 'KeyM') toggleSound();
  if (mini) { mini.key(e.code, true); if (e.code.startsWith('Arrow')) e.preventDefault(); return; }
  if (!S || S.ended) return;
  if (e.code === 'KeyC' && $('dlg').hidden && !cine) notes();
  if (e.code === 'KeyP' && $('dlg').hidden && !cine) map();
  if (e.code === 'Escape') { panel.innerHTML = ''; }
});
addEventListener('keyup', (e) => { if (mini) mini.key(e.code, false); });

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
  if (h.mini === 'search') return startSearch();
  S.seen.includes(`${S.loc}:${h.id}`) || S.seen.push(`${S.loc}:${h.id}`);
  panel.innerHTML = `<div class="paper"><div class="kick">${LOCATIONS[S.loc].name}</div><h2>${h.label}</h2><p>${h.text}</p><div class="row"><button class="btn" id="b-ok">Fermer</button></div></div>`;
  $('b-ok').onclick = () => { panel.innerHTML = ''; addClue(h.clue); };
  if (h.clue && !S.clues.includes(h.clue)) spend(5);
}

// ------------------------------------------------------------------ dialogues
function talk(id) {
  const first = !S.talked.includes(id);
  if (first) S.talked.push(id);
  spend(TALK_COST);
  let start = first ? `${id}_0` : AGAIN[id];
  if (id === 'dada' && has('malle')) start = 'dada_fin';
  if (S.loc === 'gare' && id === 'dossou') start = 'dossou_gare';
  if (S.loc === 'gare' && id === 'komi') start = 'komi_gare';
  setPlace('dialogue');
  show(start);
}
function setExpr(e) { if (e !== dlg.expr) { dlg.from = dlg.expr; dlg.expr = e; dlg.mixT = 0; } }
function exprFor(node) {
  if (node.confront) return 'colere';
  const t = node.text || '';
  if (/^…|…Bon|…Tu as|…Ce pousseur|…Il m'a|C'est ma faute|j'ai eu peur|petite fille/.test(t)) return 'inquiet';
  if (/Ma malle !|Petite sœur|Woézon|Akpé, tu es venue|Tiens, prends/.test(t)) return 'sourire';
  if (/Lâche-moi|Quoi \?|Encore toi|Encore vous|crache/.test(t)) return 'colere';
  if (/ne dit plus rien|larmes|ruinée/.test(t)) return 'triste';
  if (/\?$/.test(t.trim()) && t.length < 110) return 'surpris';
  return 'neutre';
}
let typing = null;
function typeText(el, html) {
  clearInterval(typing);
  let i = 0; el.innerHTML = '';
  typing = setInterval(() => { i += 2; el.innerHTML = html.slice(0, i); if (i >= html.length) { clearInterval(typing); typing = null; } }, 14);
  el.onclick = () => { clearInterval(typing); typing = null; el.innerHTML = html; };
}
function show(key) {
  const node = NODES[key];
  if (!node) { closeDlg(); return; }
  const who = node.who;
  if (dlg.who !== who) { dlg.who = who; dlg.expr = 'neutre'; dlg.from = 'neutre'; dlg.mixT = 1; }
  $('dlg').hidden = false;
  $('dlg-name').textContent = PEOPLE[who].name; $('dlg-role').textContent = PEOPLE[who].role;
  setExpr(exprFor(node));
  if (node.clue) addClue(node.clue);
  if (node.set) setFlag(node.set);
  const box = $('dlg-choices'); box.innerHTML = '';
  if (node.confront) {
    typeText($('dlg-text'), `<q>${node.confront.claim}</q>`);
    const b1 = document.createElement('button'); b1.className = 'hot'; b1.textContent = 'Présenter un indice'; b1.onclick = () => presentClue(node.confront);
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
      if (c.set) setFlag(c.set);
      if (c.clue) addClue(c.clue);
      save();
      if (c.end) { closeDlg(); return ending(c.end); }
      if (c.mini === 'chase') { closeDlg(); return startChase(); }
      if (c.go) show(c.go); else closeDlg();
    };
    box.appendChild(b);
  }
}
function presentClue(Cf) {
  const box = $('dlg-choices'); box.innerHTML = '';
  if (!S.clues.length) { box.innerHTML = '<p>Ton carnet est vide. Cherche d’abord des indices.</p>'; const b = document.createElement('button'); b.textContent = 'Revenir'; b.onclick = closeDlg; box.appendChild(b); return; }
  const grid = document.createElement('div'); grid.className = 'clue-pick';
  for (const id of S.clues) {
    const b = document.createElement('button'); b.textContent = CLUES[id].name; b.title = CLUES[id].desc;
    b.onclick = () => {
      const ok = Array.isArray(Cf.clue) ? Cf.clue.includes(id) : Cf.clue === id;
      if (ok) { sfx('reveal'); setExpr('inquiet'); show(Cf.ok); }
      else { sfx('wrong'); spend(5); setExpr('colere'); $('dlg-text').innerHTML = Cf.ko; const back = document.createElement('button'); back.textContent = 'Réfléchir encore'; back.onclick = () => presentClue(Cf); const q = document.createElement('button'); q.textContent = 'Partir'; q.onclick = closeDlg; box.innerHTML = ''; box.append(back, q); }
    };
    grid.appendChild(b);
  }
  box.appendChild(grid);
  const q = document.createElement('button'); q.textContent = 'Annuler'; q.onclick = closeDlg; box.appendChild(q);
}
function closeDlg() { clearInterval(typing); typing = null; $('dlg').hidden = true; dlg.who = null; if (S && !S.ended) setPlace(S.loc); hud(); save(); }

// ------------------------------------------------------------------ séquences d'action
function runMini(m) { mini = m; panel.innerHTML = ''; $('hud').hidden = true; $('tip').hidden = true; }
function endMini() { mini = null; setEngine(false); if (S && !S.ended) $('hud').hidden = false; people = null; C = null; }

function startChase() {
  runMini(chase(W, H, DPR, { onHit: () => sfx('good'), onMiss: () => sfx('wrong') }, (res) => {
    endMini();
    S.minis.chase = (S.minis.chase || 0) + 1; save();
    if (res.caught) { setPlace('dialogue'); dlg.who = null; show('komi_rattrape'); }
    else { spend(15); setPlace('dialogue'); dlg.who = null; show('komi_echappe'); }
  }));
}
function startSearch() {
  runMini(roomSearch(W, H, DPR, { onFound: () => sfx('found'), onStep: () => sfx('step') }, (res) => {
    endMini();
    setFlag('chambre_fouillee'); spend(10);
    for (const c of res.clues) addClue(c);
    S.minis.search = res.found.length; save();
    if (res.found.length === 0) toast('Rien trouvé', 'Il faudra faire parler M. Dossou autrement');
  }));
}
function startZem(dest, after) {
  setEngine(true);
  runMini(zemRide(W, H, DPR, { title: `En zem vers ${LOCATIONS[dest].name}`, onHit: () => sfx('crash') }, (res) => {
    endMini();
    S.crashes += res.hits; S.minis.zem = (S.minis.zem || 0) + 1;
    after(10 + res.hits * 4);
  }));
}

// ------------------------------------------------------------------ carnet, déductions, plan
function notes() {
  const all = Object.keys(CLUES);
  const canDeduce = S.clues.length >= 3 && !has('deduction') && !has('aveu_komi');
  panel.innerHTML = `<div class="paper"><div class="kick">Carnet de Kafui · chapitre ${S.chapter}</div><h2>Ce que je sais</h2>
    <p class="dim">Présente un indice quand quelqu'un affirme quelque chose de faux. Quand tu as assez d'éléments, fais le point pour relier les fils.</p>
    <div class="clues">${all.map((id, i) => S.clues.includes(id) ? `<div class="clue" style="--r:${(i % 3 - 1) * 0.8}deg"><b>${CLUES[id].name}</b><span>${CLUES[id].desc}</span></div>` : `<div class="clue empty"><b>?</b><span>Indice à découvrir.</span></div>`).join('')}</div>
    <h3 class="h3">Personnes rencontrées</h3>
    <div class="people">${S.talked.map(id => `<span>${PEOPLE[id].name} · ${PEOPLE[id].role}</span>`).join('') || '<span>Personne encore.</span>'}</div>
    <div class="row">${canDeduce ? '<button class="btn" id="b-ded" style="background:var(--red)">Faire le point</button>' : ''}<button class="btn ghost" id="b-x">Fermer</button></div></div>`;
  $('b-x').onclick = () => { panel.innerHTML = ''; };
  if (canDeduce) $('b-ded').onclick = deduction;
}
const HINT_NAMES = { piste_cotonou: 'l’homme de Cotonou', sena_vu: 'ce que Séna a vu', komi_nomme: 'le nom de Komi' };
function deduction() {
  const pick = [null, null, null];
  const render = () => {
    panel.innerHTML = `<div class="paper"><div class="kick">Faire le point</div><h2>Relier les fils</h2>
      <p class="dim">Pour chaque question, choisis la réponse que tes indices soutiennent. Une mauvaise déduction coûte dix minutes.</p>
      ${DEDUCTION.map((d, i) => `<div class="ded"><b>${d.q}</b><div class="opts">${d.options.map((o, k) => `<button class="opt ${pick[i] === k ? 'sel' : ''}" data-q="${i}" data-k="${k}">${o}</button>`).join('')}</div><small>${d.hint.filter(h => has(h)).map(h => CLUES[h] ? CLUES[h].name : HINT_NAMES[h] || h).join(' · ') || 'Aucun indice encore'}</small></div>`).join('')}
      <div class="row"><button class="btn ghost" id="b-x">Plus tard</button><button class="btn" id="b-ok" ${pick.every(p => p !== null) ? '' : 'disabled style="opacity:.5"'}>Conclure</button></div></div>`;
    for (const b of panel.querySelectorAll('.opt')) b.onclick = () => { pick[+b.dataset.q] = +b.dataset.k; render(); };
    $('b-x').onclick = notes;
    if (pick.every(p => p !== null)) $('b-ok').onclick = () => {
      const ok = DEDUCTION.every((d, i) => pick[i] === d.ok);
      if (ok) { panel.innerHTML = ''; sfx('reveal'); addClue('deduction'); toast('Le fil est clair', 'Komi, un pousse-pousse, un commanditaire à Cotonou'); }
      else { sfx('wrong'); spend(10); toast('Quelque chose cloche', 'Relis tes indices'); pick.fill(null); render(); }
    };
  };
  render();
}

const MAP_POS = { etal: [0.47, 0.42], poisson: [0.33, 0.52], carrefour: [0.2, 0.3], kiosque: [0.68, 0.3], hotel: [0.58, 0.8], gare: [0.86, 0.5] };
function drawMap(c) {
  const g = c.getContext('2d'), w = c.width, h = c.height;
  g.fillStyle = '#efe6d3'; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(31,90,168,0.06)'; for (let i = 0; i < h; i += 22) g.fillRect(0, i, w, 1);
  const sea = g.createLinearGradient(0, h * 0.86, 0, h); sea.addColorStop(0, '#9fcfe4'); sea.addColorStop(1, '#4f9cc4'); g.fillStyle = sea; g.fillRect(0, h * 0.86, w, h * 0.14);
  g.strokeStyle = 'rgba(255,255,255,0.7)'; for (let i = 0; i < 6; i++) { g.beginPath(); for (let x = 0; x < w; x += 20) g.lineTo(x, h * (0.89 + i * 0.02) + Math.sin(x * 0.05 + i) * 2); g.stroke(); }
  g.fillStyle = '#efdfb8'; g.fillRect(0, h * 0.84, w, h * 0.03);
  g.fillStyle = '#d9cdb4'; g.fillRect(0, h * 0.74, w, h * 0.07);
  g.fillStyle = '#e3d7bf'; for (const y of [0.2, 0.4, 0.58]) g.fillRect(0, h * y, w, h * 0.045);
  for (const x of [0.12, 0.28, 0.42, 0.56, 0.76]) g.fillRect(w * x, 0, w * 0.035, h * 0.78);
  g.fillStyle = 'rgba(0,0,0,0.08)'; for (let i = 0; i < 40; i++) g.fillRect((i * 97) % w, (i * 53) % (h * 0.72), 8 + (i % 4) * 6, 6 + (i % 3) * 5);
  g.fillStyle = '#bfb6a3'; g.fillRect(w * 0.45, h * 0.46, w * 0.1, h * 0.1); g.strokeStyle = '#8a8070'; g.setLineDash([4, 3]); g.strokeRect(w * 0.45, h * 0.46, w * 0.1, h * 0.1); g.setLineDash([]);
  g.fillStyle = '#5c5f63'; g.beginPath(); g.moveTo(w * 0.16, h * 0.36); g.lineTo(w * 0.19, h * 0.33); g.lineTo(w * 0.22, h * 0.36); g.fill(); g.fillRect(w * 0.165, h * 0.36, w * 0.05, h * 0.04);
  g.fillStyle = '#1d1a17'; g.font = `600 11px 'Inter', sans-serif`; g.textAlign = 'center';
  g.fillText('CHANTIER DU GRAND MARCHÉ', w * 0.5, h * 0.62); g.fillText('OCÉAN ATLANTIQUE', w * 0.5, h * 0.96); g.fillText('BOULEVARD DE LA RÉPUBLIQUE', w * 0.5, h * 0.79);
  g.save(); g.translate(w * 0.14, h * 0.5); g.rotate(-Math.PI / 2); g.fillText('RUE DU COMMERCE', 0, 0); g.restore();
  g.font = `italic 14px 'DM Serif Display', serif`; g.textAlign = 'left'; g.fillText('Lomé · quartier du Grand marché', 14, 20);
  g.strokeStyle = '#1d1a17'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(w - 30, 44); g.lineTo(w - 30, 12); g.stroke(); g.beginPath(); g.moveTo(w - 30, 12); g.lineTo(w - 36, 22); g.lineTo(w - 24, 22); g.closePath(); g.fill(); g.font = '700 11px Inter'; g.textAlign = 'center'; g.fillText('N', w - 30, 56);
}
function map() {
  panel.innerHTML = `<div class="paper wide"><div class="kick">Plan du quartier</div><h2>Où aller ?</h2>
    <p class="dim">Un trajet à pied prend ${MOVE_COST} minutes. Pour le front de mer et la gare, il faut un zémidjan.</p>
    <div class="mapwrap"><canvas id="mapc" width="900" height="460"></canvas>
      ${Object.entries(LOCATIONS).map(([id, L]) => { const locked = L.locked && !has(L.locked); const [x, y] = MAP_POS[id]; return `<button class="pin ${id === S.loc ? 'here' : ''} ${locked ? 'locked' : ''}" data-id="${id}" style="left:${x * 100}%;top:${y * 100}%" ${locked ? 'disabled' : ''}><i></i><b>${locked ? '?' : L.name}</b><span>${locked ? 'Il te manque une adresse.' : id === S.loc ? 'Tu es ici' : L.far ? 'Zémidjan' : `${MOVE_COST} min à pied`}</span></button>`; }).join('')}
    </div>
    <div class="row"><button class="btn ghost" id="b-x">Fermer</button></div></div>`;
  drawMap($('mapc'));
  for (const b of panel.querySelectorAll('.pin')) b.onclick = () => { if (b.dataset.id !== S.loc) go(b.dataset.id); else panel.innerHTML = ''; };
  $('b-x').onclick = () => { panel.innerHTML = ''; };
}

// ------------------------------------------------------------------ trajets
function go(loc) {
  panel.innerHTML = ''; sfx('move');
  const far = LOCATIONS[loc].far || LOCATIONS[S.loc].far;
  if (far) return startZem(loc, (min) => arrive(loc, min));
  const pool = EVENTS.filter(e => !S.events.includes(e.id) && (!e.need || has(e.need)));
  if (pool.length && Math.random() < 0.38) {
    const ev = pool[Math.floor(Math.random() * pool.length)];
    S.events.push(ev.id); if (ev.set) setFlag(ev.set);
    panel.innerHTML = `<div class="paper"><div class="kick">En chemin</div><h2>${ev.title}</h2><p>${ev.text}</p><div class="row"><button class="btn" id="b-ok">Continuer</button></div></div>`;
    $('b-ok').onclick = () => { panel.innerHTML = ''; arrive(loc, MOVE_COST + ev.cost); };
    return;
  }
  arrive(loc, MOVE_COST);
}
function arrive(loc, min) {
  S.loc = loc; people = null; C = null; setPlace(loc);
  spend(Math.max(5, min));
  if (S.ended) return;
  if (loc === 'hotel' && S.t >= DOSSOU_LEAVES && !has('dossou_parti')) {
    setFlag('dossou_parti'); people = null;
    const after = () => { panel.innerHTML = `<div class="paper"><div class="kick">${fmt(S.t)} · réception</div><h2>Il vient de partir</h2><p>« M. Dossou ? Il a réglé sa note il y a un quart d'heure, avec une grosse malle verte. Il a pris un taxi pour la gare routière, côté Bénin. » Le car part à 14 h. Il reste une chance.</p><div class="row"><button class="btn" id="b-ok">Au plan</button></div></div>`; $('b-ok').onclick = map; };
    return chapterIf(loc, after);
  }
  chapterIf(loc, () => toast(LOCATIONS[loc].name, fmt(S.t)));
}
const CINE_TEXT = { carrefour: 'Le carrefour de la cathédrale. Les zémidjans attendent le client, les pousseurs somnolent sous le manguier.', hotel: 'Le front de mer. Les vagues, les palmiers, et un hôtel où un homme pressé finit son café.', gare: 'La gare routière. Les cars de Cotonou chargent les bagages. Le temps se compte en minutes.' };
function chapterIf(loc, cb) {
  const n = Object.keys(CHAPTERS).map(Number).find(k => CHAPTERS[k].loc === loc && !S.cards.includes(k));
  if (n && n > 1) startCine(loc, CINE_TEXT[loc] || '', 4.5, () => chapterCard(n, () => { $('hud').hidden = false; cb && cb(); }));
  else cb && cb();
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
const floatBtn = document.createElement('button'); floatBtn.id = 'b-sound-float'; floatBtn.setAttribute('aria-label', 'Couper le son'); document.body.appendChild(floatBtn);
function soundIcon() { const html = muted ? ICON_OFF : ICON_ON; $('b-sound').innerHTML = html; floatBtn.innerHTML = html; floatBtn.classList.toggle('off', muted); }
function toggleSound() { initAudio(); setMuted(!muted); soundIcon(); }
$('b-sound').onclick = toggleSound; floatBtn.onclick = toggleSound; soundIcon();

// ------------------------------------------------------------------ écrans
function title() {
  const saved = load();
  $('hud').hidden = true; floatBtn.hidden = false; mini = null; cine = null; $('cine').hidden = true;
  S = S || fresh(); S.loc = S.loc || 'etal'; people = null; C = null;
  panel.innerHTML = `<div class="title"><div class="kick">Lomé · samedi · 2026</div><h1>Enquête à <em>Assigamé</em></h1>
    <p>Autour du chantier du Grand marché, la malle de wax anciens de Dada Akossiwa a disparu avant l'aube. Tu as jusqu'au car de 14 h pour la retrouver. Trois chapitres, une course en zem, une poursuite, une chambre à fouiller.</p>
    <div class="row" style="justify-content:center">${saved && !saved.ended ? '<button class="btn" id="b-c">Continuer l’enquête</button>' : ''}<button class="btn ${saved && !saved.ended ? 'ghost-light' : ''}" id="b-n">Nouvelle enquête</button></div>
    <p style="font-size:13px;opacity:.8;margin-top:22px">Clic pour examiner et parler · C : carnet · P : plan · M : son</p></div>`;
  $('b-n').onclick = () => { initAudio(); S = fresh(); save(); intro(); };
  if (saved && !saved.ended) $('b-c').onclick = () => { initAudio(); S = saved; start(); };
}
function intro() {
  setPlace('menu');
  startCine('etal', 'Samedi, 8 h 47. Un message vocal de Dada Akossiwa : « Kafui, viens vite. On a pris la malle de ta grand-mère. »', 6, () => {
    panel.innerHTML = `<div class="paper"><div class="kick">Samedi, 8 h 55 · rue du Commerce</div><h2>« Kafui, viens vite ! »</h2>
      <p>Tu t'appelles <b>Kafui Lawson</b>, étudiante en journalisme à l'université de Lomé. Ta tante, Dada Akossiwa, vend des pagnes rue du Commerce, face au chantier du Grand marché qui a brûlé en 2013.</p>
      <p>Cette nuit, quelqu'un a pris sa malle verte : douze pièces de wax de 1974, héritées de ta grand-mère, qui fut une Nana Benz. Un homme de Cotonou voulait les lui acheter la semaine dernière. Le car pour Cotonou part à <b>14 h</b>.</p>
      <p class="dim">Clique sur les gens pour parler, sur les éclats dorés pour examiner. Quand quelqu'un ment, présente l'indice qui le contredit. Quand tu as assez d'indices, fais le point dans ton carnet.</p>
      <div class="row"><button class="btn" id="b-go">Commencer</button></div></div>`;
    $('b-go').onclick = () => { panel.innerHTML = ''; chapterCard(1, start); };
  }, { people: true });
}
function start() {
  panel.innerHTML = ''; $('hud').hidden = false; floatBtn.hidden = true;
  people = null; C = null; setPlace(S.loc); hud();
}
function rank() {
  const found = S.clues.length, total = Object.keys(CLUES).length;
  const early = S.t <= 12 * 60;
  if (S.ended === 'police' && found >= total - 2 && early) return 'Fine limière';
  if (S.ended === 'police') return 'Reporter de terrain';
  if (S.ended === 'malle') return 'Bonne nièce';
  return 'Stagiaire';
}
function ending(kind) {
  if (S.ended) return;
  S.ended = kind; save();
  const E = ENDINGS[kind];
  closeDlg(); mini = null; setEngine(false);
  setPlace('menu');
  if (E.good) sfx('reveal'); else sfx('wrong');
  $('hud').hidden = true; floatBtn.hidden = false;
  const found = S.clues.length, total = Object.keys(CLUES).length;
  const loc = kind === 'car' ? 'gare' : 'etal';
  S.loc = loc; people = null; C = null;
  startCine(loc, E.good ? 'Le soir tombe sur la rue du Commerce. Les douze pagnes de 1974 sont de retour sur l’étal.' : kind === 'car' ? 'Le car de 14 h s’éloigne dans la poussière, avec une malle verte dans la soute.' : 'Le soir, la rue du Commerce ne parle que de l’erreur de la nièce de Dada Akossiwa.', 5, () => {
    panel.innerHTML = `<div class="paper"><div class="kick">${E.k}</div><h2>${E.h}</h2><p>${E.p}</p>
      <div class="score"><div><label>Heure</label><b>${fmt(Math.min(S.t, DEADLINE))}</b></div><div><label>Indices</label><b>${found} / ${total}</b></div><div><label>Chocs en zem</label><b>${S.crashes}</b></div><div><label>Rang</label><b>${rank()}</b></div></div>
      ${E.best ? '<p class="dim">C’est la meilleure fin. Pour le rang « Fine limière », termine avant midi avec presque tous les indices.</p>' : '<p class="dim">Il existe une meilleure fin : faire arrêter le commanditaire.</p>'}
      <div class="row"><button class="btn ghost" id="b-t">Menu</button><button class="btn" id="b-r">Recommencer l’enquête</button></div></div>`;
    $('b-r').onclick = () => { S = fresh(); save(); intro(); };
    $('b-t').onclick = () => { S = null; title(); };
  }, { people: false });
}

// ------------------------------------------------------------------ démarrage
$('b-notes').onclick = () => { sfx('click'); notes(); };
$('b-map').onclick = () => { sfx('click'); map(); };
addEventListener('pointerdown', () => initAudio(), { once: true });
resize();
title();
requestAnimationFrame(frame);
window.__as = { get S() { return S; }, set S(v) { S = v; people = null; C = null; hud(); }, show, go, arrive, ending, notes, map, start, startChase, startSearch, startZem, chapterCard, deduction, get mini() { return mini; } };
