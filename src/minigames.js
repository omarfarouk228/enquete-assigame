// Séquences d'action qui cassent la routine de l'enquête :
// - zem : course en zémidjan dans la circulation de Lomé (éviter nids-de-poule, taxis, charrettes) ;
// - chase : poursuite de Komi dans le marché (réflexes : la bonne direction au bon moment) ;
// - search : fouille de la chambre 12 avant le retour de M. Dossou (objets cachés, chronomètre).
// Chaque séquence est un objet { update(dt), draw(ctx), key(code, down), tap(x, y), done }.

import { rng, shade, rgba, lerp, clamp } from './paint.js';
import { moto, taxi, passer } from './scenes.js';
import { drawFigure } from './figure.js';
import { PEOPLE } from './story.js';

const TAU = Math.PI * 2;

function hud(ctx, W, H, DPR, title, sub, right) {
  ctx.save();
  ctx.fillStyle = 'rgba(20,32,43,0.72)'; ctx.beginPath(); ctx.roundRect(18 * DPR, 14 * DPR, W - 36 * DPR, 54 * DPR, 12 * DPR); ctx.fill();
  ctx.fillStyle = '#f3ead8'; ctx.font = `400 ${22 * DPR}px 'DM Serif Display', serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(title, 34 * DPR, 34 * DPR);
  ctx.fillStyle = '#d9ccb2'; ctx.font = `500 ${13 * DPR}px 'Inter', sans-serif`; ctx.fillText(sub, 34 * DPR, 54 * DPR);
  if (right) { ctx.textAlign = 'right'; ctx.fillStyle = '#e3a92f'; ctx.font = `400 ${26 * DPR}px 'DM Serif Display', serif`; ctx.fillText(right, W - 34 * DPR, 40 * DPR); }
  ctx.restore();
}
function bigText(ctx, W, H, DPR, txt, sub, col = '#f3ead8') {
  ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 30 * DPR;
  ctx.fillStyle = col; ctx.font = `400 ${Math.round(Math.min(W * 0.1, 96 * DPR))}px 'DM Serif Display', serif`; ctx.fillText(txt, W / 2, H * 0.42);
  if (sub) { ctx.fillStyle = '#f3ead8'; ctx.font = `600 ${16 * DPR}px 'Inter', sans-serif`; ctx.fillText(sub, W / 2, H * 0.42 + 60 * DPR); }
  ctx.restore();
}

// ------------------------------------------------------------------ course en zémidjan
export function zemRide(W, H, DPR, opts, onDone) {
  const r = rng(opts.seed || 3);
  const LANES = 3, laneY = (i) => H * (0.56 + i * 0.12);
  const S = { t: 0, dist: 0, lane: 1, laneF: 1, speed: 1, hits: 0, flash: 0, obstacles: [], next: 1.2, done: false, endT: 0, duration: opts.duration || 22, bgx: 0, intro: 2.2, state: 'intro' };
  const bld = []; let bx = 0; while (bx < W * 3) { const bw = W * (0.1 + r() * 0.14); bld.push({ x: bx, w: bw, h: H * (0.14 + r() * 0.22), col: ['#e2c48f', '#d9a7a0', '#cfd8c4', '#e8cf9a', '#bcd3d9', '#d7b7c9'][Math.floor(r() * 6)], sign: r() < 0.5 }); bx += bw + W * 0.01; }
  const trees = Array.from({ length: 12 }, () => ({ x: r() * W * 3, s: H * (0.12 + r() * 0.1) }));
  const spawn = () => {
    const kind = r() < 0.4 ? 'trou' : r() < 0.6 ? 'taxi' : r() < 0.8 ? 'charrette' : 'pieton';
    const lane = Math.floor(r() * LANES);
    S.obstacles.push({ kind, lane, x: W + 120 * DPR, hit: false, v: kind === 'taxi' ? 0.55 : kind === 'pieton' ? 0.0 : 1, ph: r() * 6 });
  };
  const me = () => ({ x: W * 0.22, y: laneY(S.laneF) });
  S.update = (dt) => {
    S.t += dt;
    if (S.state === 'intro') { if (S.t > S.intro) S.state = 'ride'; return; }
    if (S.state === 'end') { S.endT += dt; if (S.endT > 2.2 && !S.done) { S.done = true; onDone({ hits: S.hits }); } return; }
    const v = (W * 0.55) * S.speed;
    S.dist += v * dt; S.bgx += v * dt * 0.35;
    S.laneF += (S.lane - S.laneF) * Math.min(1, dt * 9);
    S.next -= dt; if (S.next <= 0) { spawn(); S.next = 0.55 + r() * 0.7; }
    const m = me();
    for (const o of S.obstacles) {
      o.x -= v * dt * (o.kind === 'taxi' ? 0.55 : 1);
      if (o.kind === 'pieton') { o.ph += dt; }
      if (!o.hit && Math.abs(o.x - m.x) < 46 * DPR && Math.abs(o.lane - S.laneF) < 0.5) { o.hit = true; S.hits++; S.flash = 1; S.speed = 0.35; if (opts.onHit) opts.onHit(); }
    }
    S.obstacles = S.obstacles.filter(o => o.x > -200 * DPR);
    S.speed += (1 - S.speed) * Math.min(1, dt * 1.2);
    S.flash = Math.max(0, S.flash - dt * 2);
    if (S.t - S.intro > S.duration) { S.state = 'end'; }
  };
  S.key = (code, down) => { if (!down || S.state !== 'ride') return; if (code === 'ArrowUp' || code === 'KeyW' || code === 'KeyZ') S.lane = Math.max(0, S.lane - 1); if (code === 'ArrowDown' || code === 'KeyS') S.lane = Math.min(LANES - 1, S.lane + 1); };
  S.tap = (x, y) => { if (S.state !== 'ride') return; if (y < H * 0.5) S.lane = Math.max(0, S.lane - 1); else S.lane = Math.min(LANES - 1, S.lane + 1); };
  S.draw = (ctx) => {
    const hz = H * 0.46;
    const sg = ctx.createLinearGradient(0, 0, 0, hz); sg.addColorStop(0, '#2f78c0'); sg.addColorStop(1, '#efe0c0'); ctx.fillStyle = sg; ctx.fillRect(0, 0, W, hz);
    // façades qui défilent (parallaxe)
    for (const b of bld) { const x = ((b.x - S.bgx * 0.6) % (W * 3) + W * 3) % (W * 3) - W; if (x > W || x + b.w < 0) continue; ctx.fillStyle = b.col; ctx.fillRect(x, hz - b.h, b.w, b.h); ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x + b.w * 0.85, hz - b.h, b.w * 0.15, b.h); ctx.fillStyle = '#2f6e5a'; for (let k = 0; k < Math.floor(b.w / (50 * DPR)); k++) ctx.fillRect(x + 14 * DPR + k * 50 * DPR, hz - b.h + 18 * DPR, 22 * DPR, 30 * DPR); ctx.fillStyle = '#231911'; ctx.fillRect(x + b.w * 0.1, hz - b.h * 0.4, b.w * 0.8, b.h * 0.4); if (b.sign) { ctx.fillStyle = '#f4efe4'; ctx.fillRect(x + b.w * 0.1, hz - b.h * 0.5, b.w * 0.8, b.h * 0.09); } ctx.fillStyle = '#9a958b'; ctx.fillRect(x - 4, hz - b.h * 0.42, b.w + 8, 6 * DPR); }
    for (const t of trees) { const x = ((t.x - S.bgx * 0.8) % (W * 3) + W * 3) % (W * 3) - W; if (x < -100 || x > W + 100) continue; ctx.fillStyle = '#4a3828'; ctx.fillRect(x - 3 * DPR, hz - t.s * 0.9, 6 * DPR, t.s * 0.9); ctx.fillStyle = '#2f5a22'; ctx.beginPath(); ctx.arc(x, hz - t.s, t.s * 0.45, 0, TAU); ctx.fill(); ctx.fillStyle = '#4e7d33'; ctx.beginPath(); ctx.arc(x - t.s * 0.15, hz - t.s * 1.1, t.s * 0.3, 0, TAU); ctx.fill(); }
    // trottoir, route, sable
    ctx.fillStyle = '#c9a77a'; ctx.fillRect(0, hz, W, H * 0.06);
    const rg = ctx.createLinearGradient(0, hz + H * 0.06, 0, H); rg.addColorStop(0, '#7a756d'); rg.addColorStop(1, '#4e4a44'); ctx.fillStyle = rg; ctx.fillRect(0, hz + H * 0.06, W, H);
    ctx.fillStyle = 'rgba(240,235,220,0.5)'; const dash = 80 * DPR; for (let i = 0; i < 2; i++) { const y = laneY(i) + H * 0.06; for (let x = -((S.dist) % (dash * 2)); x < W; x += dash * 2) ctx.fillRect(x, y, dash, 3 * DPR); }
    // obstacles
    const sorted = [...S.obstacles].sort((a, b) => a.lane - b.lane);
    const drawObs = (o) => {
      const y = laneY(o.lane) + 20 * DPR, s = H * 0.09;
      if (o.kind === 'trou') { ctx.fillStyle = '#2a2520'; ctx.beginPath(); ctx.ellipse(o.x, y, 34 * DPR, 12 * DPR, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(120,100,80,0.6)'; ctx.beginPath(); ctx.ellipse(o.x - 6 * DPR, y - 3 * DPR, 20 * DPR, 6 * DPR, 0, 0, TAU); ctx.fill(); }
      else if (o.kind === 'taxi') taxi(ctx, o.x, y, s * 1.1, 1);
      else if (o.kind === 'charrette') { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(o.x, y, s * 0.8, s * 0.1, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#8a6440'; ctx.fillRect(o.x - s * 0.6, y - s * 0.45, s * 1.1, s * 0.1); for (let i = 0; i < 4; i++) { ctx.fillStyle = ['#d9c9a8', '#f2b134', '#2e6fb5', '#c2401f'][i]; ctx.fillRect(o.x - s * 0.55 + i * s * 0.26, y - s * (0.7 + (i % 2) * 0.1), s * 0.24, s * (0.25 + (i % 2) * 0.1)); } ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(o.x - s * 0.2, y - s * 0.2, s * 0.22, 0, TAU); ctx.fill(); passer(ctx, o.x + s * 0.75, y + 4 * DPR, s * 1.3, 77, o.ph * 6); }
      else passer(ctx, o.x, y + 6 * DPR, s * 1.4, 88 + o.lane, o.ph * 7);
    };
    const m = me();
    for (const o of sorted) if (o.lane < S.laneF + 0.5) drawObs(o);
    // le zem : Kodjo conduit, Kafui derrière
    const bob = Math.sin(S.t * 18) * 1.5 * DPR * S.speed;
    moto(ctx, m.x, m.y + 20 * DPR + bob, H * 0.11, '#1a3a8a', '#3d6b9e', 1);
    // Kafui : passagère en robe jaune, foulard
    const s = H * 0.11; ctx.fillStyle = '#e3a92f'; ctx.beginPath(); ctx.roundRect(m.x - s * 0.5, m.y + 20 * DPR + bob - s * 1.0, s * 0.28, s * 0.55, s * 0.08); ctx.fill();
    ctx.fillStyle = '#5b3a26'; ctx.beginPath(); ctx.arc(m.x - s * 0.36, m.y + 20 * DPR + bob - s * 1.1, s * 0.1, 0, TAU); ctx.fill();
    ctx.fillStyle = '#c2401f'; ctx.beginPath(); ctx.ellipse(m.x - s * 0.36, m.y + 20 * DPR + bob - s * 1.17, s * 0.11, s * 0.07, 0, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = '#e3a92f'; ctx.lineWidth = s * 0.07; ctx.beginPath(); ctx.moveTo(m.x - s * 0.38, m.y + 20 * DPR + bob - s * 0.85); ctx.lineTo(m.x - s * 0.1, m.y + 20 * DPR + bob - s * 0.75); ctx.stroke();
    for (const o of sorted) if (o.lane >= S.laneF + 0.5) drawObs(o);
    // poussière derrière
    ctx.fillStyle = 'rgba(201,167,122,0.35)'; for (let i = 0; i < 5; i++) { const k = (S.t * 3 + i * 0.2) % 1; ctx.beginPath(); ctx.arc(m.x - s * 0.7 - k * 60 * DPR, m.y + 30 * DPR - k * 10 * DPR, (4 + k * 14) * DPR, 0, TAU); ctx.fill(); }
    if (S.flash > 0) { ctx.fillStyle = `rgba(200,60,40,${S.flash * 0.35})`; ctx.fillRect(0, 0, W, H); }
    const left = Math.max(0, S.duration - (S.t - S.intro));
    hud(ctx, W, H, DPR, opts.title || 'En zem avec Kodjo', 'Haut et bas (ou toucher le haut et le bas de l’écran) pour changer de file', S.state === 'ride' ? `${Math.ceil(left)} s · ${S.hits} choc${S.hits > 1 ? 's' : ''}` : '');
    if (S.state === 'intro') bigText(ctx, W, H, DPR, 'Accroche-toi', opts.sub || 'Évite les nids-de-poule, les taxis et les charrettes');
    if (S.state === 'end') bigText(ctx, W, H, DPR, S.hits === 0 ? 'Sans une égratignure' : S.hits <= 2 ? 'Arrivée' : 'Arrivée, secouée', S.hits === 0 ? 'Trajet express : 10 minutes' : `${10 + S.hits * 4} minutes de trajet`);
  };
  return S;
}

// ------------------------------------------------------------------ poursuite de Komi
export function chase(W, H, DPR, opts, onDone) {
  const r = rng(opts.seed || 9);
  const DIRS = ['ArrowLeft', 'ArrowUp', 'ArrowRight'];
  const LBL = { ArrowLeft: '←', ArrowUp: '↑', ArrowRight: '→' };
  const OBST = { ArrowLeft: 'Une bassine de poisson : à gauche !', ArrowUp: 'Un étal en travers : saute !', ArrowRight: 'Un pousse-pousse : à droite !' };
  const S = { t: 0, state: 'intro', intro: 2.2, prompts: 0, total: 7, miss: 0, ok: 0, cur: null, gap: 0, dist: 0.5, done: false, endT: 0, flash: 0, good: 0, bgx: 0, stalls: [] };
  for (let i = 0; i < 40; i++) S.stalls.push({ x: i * W * 0.14 + r() * W * 0.05, c1: ['#d4472e', '#f2b134', '#2e6fb5', '#1f8a5c'][Math.floor(r() * 4)], c2: ['#f4efe4', '#f2b134', '#e9e2cf'][Math.floor(r() * 3)], h: H * (0.12 + r() * 0.08), kind: Math.floor(r() * 3) });
  const newPrompt = () => { S.cur = { key: DIRS[Math.floor(r() * 3)], t: 0, dur: Math.max(0.75, 1.5 - S.prompts * 0.09), x: W * (0.55 + r() * 0.25) }; S.prompts++; };
  S.update = (dt) => {
    S.t += dt; S.flash = Math.max(0, S.flash - dt * 2); S.good = Math.max(0, S.good - dt * 2);
    if (S.state === 'intro') { if (S.t > S.intro) { S.state = 'run'; S.gap = 0.6; } return; }
    if (S.state === 'end') { S.endT += dt; if (S.endT > 2.4 && !S.done) { S.done = true; onDone({ caught: S.miss < 3 }); } return; }
    S.bgx += W * 0.5 * dt;
    if (S.cur) {
      S.cur.t += dt;
      if (S.cur.t > S.cur.dur) { S.miss++; S.dist = Math.min(1, S.dist + 0.18); S.flash = 1; S.cur = null; S.gap = 0.7; if (opts.onMiss) opts.onMiss(); }
    } else {
      S.gap -= dt;
      if (S.gap <= 0) { if (S.prompts >= S.total || S.miss >= 3) S.state = 'end'; else newPrompt(); }
    }
  };
  const answer = (code) => {
    if (S.state !== 'run' || !S.cur) return;
    if (code === S.cur.key) { S.ok++; S.dist = Math.max(0.05, S.dist - 0.12); S.good = 1; if (opts.onHit) opts.onHit(); }
    else { S.miss++; S.dist = Math.min(1, S.dist + 0.18); S.flash = 1; if (opts.onMiss) opts.onMiss(); }
    S.cur = null; S.gap = 0.55;
  };
  S.key = (code, down) => { if (down && DIRS.includes(code)) answer(code); };
  S.tap = (x, y) => { if (y > H * 0.78) answer(x < W / 3 ? 'ArrowLeft' : x < W * 2 / 3 ? 'ArrowUp' : 'ArrowRight'); };
  S.draw = (ctx) => {
    const hz = H * 0.5;
    const sg = ctx.createLinearGradient(0, 0, 0, hz); sg.addColorStop(0, '#2f78c0'); sg.addColorStop(1, '#efe0c0'); ctx.fillStyle = sg; ctx.fillRect(0, 0, W, hz);
    ctx.fillStyle = '#d9c7a8'; ctx.fillRect(0, hz * 0.55, W, hz * 0.45); ctx.fillStyle = 'rgba(0,0,0,0.08)'; for (let i = 0; i < 20; i++) ctx.fillRect(i * W / 20, hz * 0.55, 2, hz * 0.45);
    const gg = ctx.createLinearGradient(0, hz, 0, H); gg.addColorStop(0, '#c9a77a'); gg.addColorStop(1, '#a8845a'); ctx.fillStyle = gg; ctx.fillRect(0, hz, W, H - hz);
    // étals et parasols qui défilent
    for (const s of S.stalls) {
      const x = ((s.x - S.bgx) % (W * 5.6) + W * 5.6) % (W * 5.6) - W * 0.3; if (x < -200 || x > W + 200) continue;
      const y = hz + H * 0.08;
      ctx.fillStyle = 'rgba(20,10,0,0.25)'; ctx.beginPath(); ctx.ellipse(x + 20 * DPR, y + 2, W * 0.07, 8 * DPR, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#5a4330'; ctx.fillRect(x - W * 0.06, y - s.h * 0.4, W * 0.12, 5 * DPR); ctx.fillRect(x - W * 0.055, y - s.h * 0.4, 4 * DPR, s.h * 0.4); ctx.fillRect(x + W * 0.05, y - s.h * 0.4, 4 * DPR, s.h * 0.4);
      for (let k = 0; k < 6; k++) { ctx.fillStyle = k % 2 ? s.c1 : s.c2; ctx.fillRect(x - W * 0.055 + k * W * 0.018, y - s.h * 0.4 - 14 * DPR - (k % 3) * 6 * DPR, W * 0.016, 12 * DPR + (k % 3) * 6 * DPR); }
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - s.h * 1.9); ctx.stroke();
      for (let i = 0; i < 8; i++) { const a0 = i / 8 * Math.PI, a1 = (i + 1) / 8 * Math.PI; ctx.fillStyle = i % 2 ? s.c1 : s.c2; ctx.beginPath(); ctx.moveTo(x, y - s.h * 2.05); ctx.lineTo(x + Math.cos(a0) * s.h * 0.9, y - s.h * 1.7); ctx.lineTo(x + Math.cos(a1) * s.h * 0.9, y - s.h * 1.7); ctx.fill(); }
    }
    for (let i = 0; i < 9; i++) { const x = ((i * W * 0.17 + 40 - S.bgx * 0.9) % (W * 1.6) + W * 1.6) % (W * 1.6) - W * 0.3; passer(ctx, x, hz + H * 0.12, H * 0.2, 300 + i, S.t * 6 + i); }
    // Komi devant, Kafui derrière ; la distance se lit à l'écran
    const ky = H * 0.9, kx = W * (0.42 + S.dist * 0.4);
    const run = Math.sin(S.t * 14);
    ctx.save(); ctx.translate(0, Math.abs(run) * -6 * DPR);
    drawFigure(ctx, 'komi', { ...PEOPLE.komi.look, pose: 'run' }, kx, ky, H * 0.46, S.t + 0.3);
    ctx.restore();
    // Kafui qui court
    ctx.save(); ctx.translate(0, Math.abs(Math.sin(S.t * 13)) * -5 * DPR);
    drawFigure(ctx, 'kafui', { ...PEOPLE.kafui.look, pose: 'run' }, W * 0.22, ky, H * 0.44, S.t);
    ctx.restore();
    // invite : flèche avec anneau qui se vide
    if (S.cur) {
      const p = S.cur, k = 1 - p.t / p.dur, cx = p.x, cy = H * 0.45, R = 46 * DPR;
      ctx.fillStyle = 'rgba(20,32,43,0.8)'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
      ctx.strokeStyle = k > 0.35 ? '#e3a92f' : '#c0392b'; ctx.lineWidth = 7 * DPR; ctx.beginPath(); ctx.arc(cx, cy, R - 5 * DPR, -Math.PI / 2, -Math.PI / 2 + TAU * k); ctx.stroke();
      ctx.fillStyle = '#f3ead8'; ctx.font = `700 ${44 * DPR}px 'Inter', sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(LBL[p.key], cx, cy + 2 * DPR);
      ctx.fillStyle = 'rgba(20,32,43,0.8)'; const w = ctx.measureText(OBST[p.key]).width; ctx.font = `600 ${15 * DPR}px 'Inter', sans-serif`; const tw = ctx.measureText(OBST[p.key]).width + 24 * DPR; ctx.beginPath(); ctx.roundRect(cx - tw / 2, cy + R + 10 * DPR, tw, 30 * DPR, 8 * DPR); ctx.fill(); ctx.fillStyle = '#f3ead8'; ctx.fillText(OBST[p.key], cx, cy + R + 25 * DPR); void w;
    }
    // boutons tactiles
    ctx.fillStyle = 'rgba(20,32,43,0.35)'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.roundRect(i * W / 3 + 8 * DPR, H * 0.8, W / 3 - 16 * DPR, H * 0.18, 14 * DPR); ctx.fill(); }
    ctx.fillStyle = 'rgba(243,234,216,0.5)'; ctx.font = `700 ${34 * DPR}px 'Inter', sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ['←', '↑', '→'].forEach((l, i) => ctx.fillText(l, (i + 0.5) * W / 3, H * 0.89));
    if (S.flash > 0) { ctx.fillStyle = `rgba(200,60,40,${S.flash * 0.3})`; ctx.fillRect(0, 0, W, H); }
    if (S.good > 0) { ctx.fillStyle = `rgba(227,169,47,${S.good * 0.18})`; ctx.fillRect(0, 0, W, H); }
    hud(ctx, W, H, DPR, 'Rattraper Komi', 'Appuie sur la flèche affichée avant que l’anneau se vide', S.state === 'run' ? `${S.ok} / ${S.total} · ${S.miss} raté${S.miss > 1 ? 's' : ''}` : '');
    if (S.state === 'intro') bigText(ctx, W, H, DPR, 'Il s’enfuit !', 'Trois ratés, et il disparaît dans le marché');
    if (S.state === 'end') bigText(ctx, W, H, DPR, S.miss < 3 ? 'Attrapé !' : 'Perdu de vue', S.miss < 3 ? 'Tu l’agrippes par le maillot devant la pharmacie' : 'Il a filé entre les bassines');
  };
  return S;
}

// ------------------------------------------------------------------ fouille de la chambre 12
export function roomSearch(W, H, DPR, opts, onDone) {
  const LIMIT = opts.limit || 45;
  const S = { t: 0, state: 'intro', intro: 2.2, left: LIMIT, found: [], hover: null, done: false, endT: 0, steps: 0 };
  // objets : [id, x, y, w, h (fractions), label, cible ?, message]
  const OBJ = [
    { id: 'malle', x: 0.18, y: 0.86, w: 0.2, h: 0.08, label: 'Sous le lit', target: true, clue: 'malle_vue', msg: 'La malle verte ! Les poignées de cuir, l’étiquette « Lomé, 1974 » à moitié effacée.' },
    { id: 'recu', x: 0.69, y: 0.52, w: 0.1, h: 0.2, label: 'Le boubou sur la chaise', target: true, clue: 'recu', msg: 'Dans la poche : un reçu Mobile Money de 150 000 F à KOMI A., motif « transport ».' },
    { id: 'billet', x: 0.8, y: 0.47, w: 0.12, h: 0.05, label: 'Sur la table', target: true, clue: 'billet', msg: 'Un billet de car pour Cotonou, 14 h, avec supplément « bagage volumineux ».' },
    { id: 'valise', x: 0.5, y: 0.78, w: 0.14, h: 0.12, label: 'La valise', msg: 'Des chemises, un chargeur, un catalogue de vente aux enchères de textiles africains.' },
    { id: 'fenetre', x: 0.35, y: 0.18, w: 0.3, h: 0.3, label: 'La fenêtre', msg: 'La mer, et en bas, la terrasse : M. Dossou finit son café. Dépêche-toi.' },
    { id: 'ventilo', x: 0.08, y: 0.3, w: 0.1, h: 0.25, label: 'Le ventilateur', msg: 'Il brasse un air tiède qui sent le monoï et le vieux tissu.' },
    { id: 'lit', x: 0.1, y: 0.62, w: 0.36, h: 0.2, label: 'Le lit', msg: 'Un lit défait, une moustiquaire roulée. Rien dessus. Et dessous ?' },
    { id: 'tableau', x: 0.78, y: 0.14, w: 0.14, h: 0.16, label: 'Le tableau', msg: 'Une peinture naïve : des pirogues sur la plage de Lomé.' },
  ];
  const targets = OBJ.filter(o => o.target).length;
  S.update = (dt) => {
    S.t += dt;
    if (S.state === 'intro') { if (S.t > S.intro) S.state = 'search'; return; }
    if (S.state === 'end') { S.endT += dt; if (S.endT > 2.6 && !S.done) { S.done = true; onDone({ found: S.found.filter(id => OBJ.find(o => o.id === id).target), clues: S.found.map(id => OBJ.find(o => o.id === id).clue).filter(Boolean) }); } return; }
    S.left -= dt;
    if (S.left < 12 && Math.floor(S.left * 2) !== Math.floor((S.left + dt) * 2) && opts.onStep) opts.onStep();
    if (S.msgT > 0) S.msgT -= dt;
    if (S.left <= 0 || S.found.filter(id => OBJ.find(o => o.id === id).target).length >= targets) { S.state = 'end'; S.caught = S.left <= 0; }
  };
  const at = (x, y) => OBJ.find(o => x > o.x * W && x < (o.x + o.w) * W && y > o.y * H && y < (o.y + o.h) * H);
  S.move = (x, y) => { S.hover = at(x, y); };
  S.tap = (x, y) => {
    if (S.state !== 'search') return;
    const o = at(x, y); if (!o) return;
    if (!S.found.includes(o.id)) { S.found.push(o.id); if (o.target && opts.onFound) opts.onFound(); }
    S.msg = o.msg; S.msgT = 2.6;
  };
  S.key = () => {};
  S.draw = (ctx) => {
    // la chambre : murs crème, carrelage, fenêtre sur la mer, lit, chaise avec boubou, table, valise
    const wg = ctx.createLinearGradient(0, 0, W, 0); wg.addColorStop(0, '#efe5d2'); wg.addColorStop(1, '#d6c7ad'); ctx.fillStyle = wg; ctx.fillRect(0, 0, W, H * 0.6);
    for (let i = 0; i < 16; i++) for (let j = 0; j < 5; j++) { ctx.fillStyle = (i + j) % 2 ? '#cfc5b4' : '#e0d8ca'; ctx.fillRect(i * W / 16, H * 0.6 + j * H * 0.08, W / 16, H * 0.08); }
    ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(0, H * 0.6, W, 4 * DPR);
    // fenêtre
    const fx = W * 0.35, fy = H * 0.18, fw = W * 0.3, fh = H * 0.3;
    const sky = ctx.createLinearGradient(0, fy, 0, fy + fh); sky.addColorStop(0, '#2f78c0'); sky.addColorStop(0.5, '#9fd0ea'); sky.addColorStop(0.55, '#2c7faa'); sky.addColorStop(1, '#58b0c9'); ctx.fillStyle = sky; ctx.fillRect(fx, fy, fw, fh);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2; for (let i = 0; i < 6; i++) { const y = fy + fh * (0.6 + i * 0.07); ctx.beginPath(); ctx.moveTo(fx, y); ctx.quadraticCurveTo(fx + fw / 2, y - 4, fx + fw, y); ctx.stroke(); }
    ctx.fillStyle = '#f4efe4'; ctx.fillRect(fx - 10 * DPR, fy - 10 * DPR, fw + 20 * DPR, 10 * DPR); ctx.fillRect(fx - 10 * DPR, fy, 10 * DPR, fh + 10 * DPR); ctx.fillRect(fx + fw, fy, 10 * DPR, fh + 10 * DPR); ctx.fillRect(fx - 10 * DPR, fy + fh, fw + 20 * DPR, 10 * DPR); ctx.fillRect(fx + fw / 2 - 3 * DPR, fy, 6 * DPR, fh);
    // rideau
    ctx.fillStyle = '#c2401f'; ctx.fillRect(fx - 10 * DPR, fy - 10 * DPR, fw * 0.16, fh + 20 * DPR); ctx.fillStyle = 'rgba(0,0,0,0.15)'; for (let i = 0; i < 4; i++) ctx.fillRect(fx - 10 * DPR + i * fw * 0.04, fy, 3 * DPR, fh + 10 * DPR);
    // tableau
    ctx.fillStyle = '#5a4330'; ctx.fillRect(W * 0.78, H * 0.14, W * 0.14, H * 0.16); ctx.fillStyle = '#efe0c0'; ctx.fillRect(W * 0.79, H * 0.15, W * 0.12, H * 0.14); ctx.fillStyle = '#58b0c9'; ctx.fillRect(W * 0.79, H * 0.21, W * 0.12, H * 0.08); ctx.fillStyle = '#5a3a20'; ctx.fillRect(W * 0.81, H * 0.24, W * 0.03, H * 0.012); ctx.fillRect(W * 0.86, H * 0.25, W * 0.03, H * 0.012);
    // ventilateur sur pied
    ctx.fillStyle = '#cfcdc7'; ctx.fillRect(W * 0.125, H * 0.4, 6 * DPR, H * 0.22); ctx.beginPath(); ctx.ellipse(W * 0.128, H * 0.62, W * 0.04, 8 * DPR, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#9a9a9a'; ctx.lineWidth = 3 * DPR; ctx.beginPath(); ctx.arc(W * 0.128, H * 0.36, W * 0.045, 0, TAU); ctx.stroke();
    ctx.save(); ctx.translate(W * 0.128, H * 0.36); ctx.rotate(S.t * 20); ctx.fillStyle = 'rgba(120,120,120,0.6)'; for (let i = 0; i < 3; i++) { ctx.rotate(TAU / 3); ctx.beginPath(); ctx.ellipse(W * 0.02, 0, W * 0.02, W * 0.008, 0, 0, TAU); ctx.fill(); } ctx.restore();
    // lit
    ctx.fillStyle = '#8a6440'; ctx.fillRect(W * 0.1, H * 0.6, W * 0.36, H * 0.06); ctx.fillRect(W * 0.1, H * 0.86, W * 0.02, H * 0.08); ctx.fillRect(W * 0.44, H * 0.86, W * 0.02, H * 0.08);
    ctx.fillStyle = '#f4efe4'; ctx.beginPath(); ctx.roundRect(W * 0.1, H * 0.64, W * 0.36, H * 0.2, 8 * DPR); ctx.fill();
    ctx.fillStyle = '#1f5aa8'; ctx.beginPath(); ctx.roundRect(W * 0.1, H * 0.7, W * 0.36, H * 0.14, 8 * DPR); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.15)'; for (let i = 0; i < 5; i++) ctx.fillRect(W * 0.1, H * 0.72 + i * H * 0.025, W * 0.36, 2);
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.roundRect(W * 0.13, H * 0.62, W * 0.1, H * 0.06, 6 * DPR); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(W * 0.1, H * 0.84, W * 0.36, H * 0.1); // ombre sous le lit
    // la malle sous le lit (visible en partie)
    if (true) { ctx.fillStyle = '#2f6b3a'; ctx.fillRect(W * 0.2, H * 0.87, W * 0.16, H * 0.06); ctx.fillStyle = '#8a6440'; ctx.fillRect(W * 0.2, H * 0.895, W * 0.16, 3 * DPR); ctx.fillStyle = '#c9a44a'; ctx.fillRect(W * 0.27, H * 0.885, W * 0.02, H * 0.02); }
    // chaise et boubou
    ctx.fillStyle = '#6b4a2e'; ctx.fillRect(W * 0.68, H * 0.5, W * 0.12, H * 0.02); ctx.fillRect(W * 0.68, H * 0.52, 6 * DPR, H * 0.2); ctx.fillRect(W * 0.79, H * 0.52, 6 * DPR, H * 0.2); ctx.fillRect(W * 0.68, H * 0.62, W * 0.12, 4 * DPR);
    ctx.fillStyle = '#f4efe4'; ctx.beginPath(); ctx.moveTo(W * 0.69, H * 0.5); ctx.quadraticCurveTo(W * 0.66, H * 0.62, W * 0.7, H * 0.74); ctx.lineTo(W * 0.78, H * 0.72); ctx.quadraticCurveTo(W * 0.8, H * 0.6, W * 0.79, H * 0.5); ctx.fill();
    ctx.strokeStyle = '#b08a4b'; ctx.lineWidth = 3 * DPR; ctx.beginPath(); ctx.moveTo(W * 0.71, H * 0.52); ctx.quadraticCurveTo(W * 0.74, H * 0.6, W * 0.77, H * 0.52); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(W * 0.72, H * 0.6, W * 0.04, H * 0.06);
    // table de nuit avec billet et lampe
    ctx.fillStyle = '#8a6440'; ctx.fillRect(W * 0.82, H * 0.5, W * 0.12, H * 0.02); ctx.fillRect(W * 0.83, H * 0.52, 5 * DPR, H * 0.18); ctx.fillRect(W * 0.925, H * 0.52, 5 * DPR, H * 0.18);
    ctx.fillStyle = '#f4efe4'; ctx.save(); ctx.translate(W * 0.84, H * 0.49); ctx.rotate(-0.15); ctx.fillRect(0, 0, W * 0.06, H * 0.025); ctx.fillStyle = '#1d3f6e'; ctx.fillRect(4, 4, W * 0.04, 2); ctx.fillRect(4, 9, W * 0.03, 2); ctx.restore();
    ctx.fillStyle = '#e3a92f'; ctx.beginPath(); ctx.moveTo(W * 0.88, H * 0.42); ctx.lineTo(W * 0.92, H * 0.42); ctx.lineTo(W * 0.935, H * 0.5); ctx.lineTo(W * 0.865, H * 0.5); ctx.fill();
    // valise ouverte
    ctx.fillStyle = '#3a3a3a'; ctx.beginPath(); ctx.roundRect(W * 0.5, H * 0.8, W * 0.14, H * 0.1, 6 * DPR); ctx.fill(); ctx.fillStyle = '#2a2a2a'; ctx.beginPath(); ctx.roundRect(W * 0.5, H * 0.7, W * 0.14, H * 0.1, 6 * DPR); ctx.fill();
    for (let i = 0; i < 4; i++) { ctx.fillStyle = ['#f4efe4', '#3d6b9e', '#e9e2cf', '#7b3fa0'][i]; ctx.fillRect(W * 0.51 + i * W * 0.03, H * 0.82, W * 0.03, H * 0.06); }
    // survol et objets trouvés
    for (const o of OBJ) {
      const found = S.found.includes(o.id);
      if (S.hover === o && S.state === 'search') { ctx.strokeStyle = 'rgba(227,169,47,0.95)'; ctx.lineWidth = 3 * DPR; ctx.setLineDash([8 * DPR, 6 * DPR]); ctx.strokeRect(o.x * W, o.y * H, o.w * W, o.h * H); ctx.setLineDash([]); ctx.fillStyle = 'rgba(20,32,43,0.8)'; ctx.font = `600 ${14 * DPR}px 'Inter', sans-serif`; const tw = ctx.measureText(o.label).width + 20 * DPR; ctx.beginPath(); ctx.roundRect(o.x * W, o.y * H - 30 * DPR, tw, 26 * DPR, 6 * DPR); ctx.fill(); ctx.fillStyle = '#f3ead8'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(o.label, o.x * W + 10 * DPR, o.y * H - 17 * DPR); }
      if (found && o.target) { ctx.fillStyle = '#e3a92f'; ctx.beginPath(); ctx.arc((o.x + o.w) * W - 10 * DPR, o.y * H + 10 * DPR, 10 * DPR, 0, TAU); ctx.fill(); ctx.fillStyle = '#14202b'; ctx.font = `700 ${14 * DPR}px 'Inter', sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('✓', (o.x + o.w) * W - 10 * DPR, o.y * H + 11 * DPR); }
    }
    if (S.msgT > 0 && S.msg) { ctx.fillStyle = 'rgba(243,234,216,0.96)'; ctx.beginPath(); ctx.roundRect(W * 0.2, H * 0.9, W * 0.6, 44 * DPR, 10 * DPR); ctx.fill(); ctx.fillStyle = '#1d1a17'; ctx.font = `500 ${15 * DPR}px 'Inter', sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(S.msg, W / 2, H * 0.9 + 22 * DPR); }
    const nf = S.found.filter(id => OBJ.find(o => o.id === id).target).length;
    hud(ctx, W, H, DPR, 'Chambre 12', 'Clique sur les objets. Trois preuves à trouver avant le retour de M. Dossou', S.state === 'search' ? `${Math.ceil(Math.max(0, S.left))} s · ${nf} / ${targets}` : '');
    if (S.state === 'search' && S.left < 12) { ctx.fillStyle = `rgba(192,57,43,${0.12 + 0.1 * Math.sin(S.t * 8)})`; ctx.fillRect(0, 0, W, H); }
    if (S.state === 'intro') bigText(ctx, W, H, DPR, 'La porte n’est pas fermée', 'Il remonte dans moins d’une minute');
    if (S.state === 'end') bigText(ctx, W, H, DPR, S.caught ? 'Des pas dans l’escalier' : 'Tout est là', S.caught ? `Tu ressors juste à temps, avec ${nf} preuve${nf > 1 ? 's' : ''}` : 'Tu redescends sans bruit, les preuves en poche');
  };
  return S;
}
export { clamp, lerp, shade, rgba };
