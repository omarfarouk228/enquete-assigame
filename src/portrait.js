// Portraits peints de trois quarts (tournés vers la droite), entièrement tracés au canvas.
// Chaque personnage a sa géométrie de visage (look.face), ses vêtements, sa coiffure.
// Lumière en haut à gauche, ombre propre à droite, lumière de rebond chaude venue du sol.
// Expressions : neutre, sourire, colere, inquiet, surpris, triste. Animation : respiration, clignements, bouche qui parle.

import { shade, rgba, rng } from './paint.js';

const TAU = Math.PI * 2;

export function pal(skin) {
  return { base: skin, light: shade(skin, 0.3), hi: shade(skin, 0.52), core: shade(skin, -0.42), deep: shade(skin, -0.62), lip: shade(skin, -0.3), lipLight: shade(skin, -0.02), bounce: shade(skin, -0.12) };
}
function ell(g, x, y, rx, ry, rot = 0) { g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, TAU); }
export function softSpot(g, x, y, r, col, a) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, rgba(col, a)); gr.addColorStop(1, rgba(col, 0));
  g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
}

// Motif wax pour les tissus (cercles concentriques, feuilles, anneaux)
export function waxFill(g, x, y, w, h, c1, c2, seed) {
  const r = rng(seed);
  const kind = seed % 3;
  g.save();
  g.fillStyle = c1; g.fillRect(x, y, w, h);
  const s = w / (kind === 2 ? 9 : 7);
  for (let i = -1; i < w / s + 2; i++) for (let j = -1; j < h / s + 2; j++) {
    const cx = x + i * s + (j % 2) * s / 2, cy = y + j * s;
    if (kind === 0) {
      g.fillStyle = c2; ell(g, cx, cy, s * 0.36, s * 0.36); g.fill();
      g.fillStyle = c1; ell(g, cx, cy, s * 0.2, s * 0.2); g.fill();
      g.fillStyle = shade(c2, -0.3); ell(g, cx, cy, s * 0.08, s * 0.08); g.fill();
    } else if (kind === 1) {
      g.fillStyle = c2; g.beginPath(); g.moveTo(cx, cy - s * 0.4); g.quadraticCurveTo(cx + s * 0.38, cy, cx, cy + s * 0.4); g.quadraticCurveTo(cx - s * 0.38, cy, cx, cy - s * 0.4); g.fill();
      g.strokeStyle = shade(c2, -0.35); g.lineWidth = s * 0.05; g.beginPath(); g.moveTo(cx, cy - s * 0.3); g.lineTo(cx, cy + s * 0.3); g.stroke();
    } else {
      g.strokeStyle = c2; g.lineWidth = s * 0.12; g.beginPath(); g.arc(cx, cy, s * 0.32, 0, TAU); g.stroke();
      g.fillStyle = shade(c2, -0.2); ell(g, cx, cy, s * 0.1, s * 0.1); g.fill();
    }
    if (r() < 0.3) { g.fillStyle = rgba('#000000', 0.08); ell(g, cx + s * 0.3, cy + s * 0.3, s * 0.06, s * 0.06); g.fill(); }
  }
  g.fillStyle = 'rgba(0,0,0,0.05)';
  for (let i = 0; i < w * h / 180; i++) g.fillRect(x + r() * w, y + r() * h, 1.5, 1.5);
  g.restore();
}

export const EXPR = {
  neutre: { brow: 0, browIn: 0, open: 1, smile: 0, mouthOpen: 0 },
  sourire: { brow: 0.1, browIn: 0, open: 0.82, smile: 1, mouthOpen: 0.35 },
  colere: { brow: -0.5, browIn: 1, open: 0.8, smile: -0.6, mouthOpen: 0.1 },
  inquiet: { brow: 0.5, browIn: -0.7, open: 1.1, smile: -0.3, mouthOpen: 0.05 },
  surpris: { brow: 0.9, browIn: -0.2, open: 1.3, smile: 0, mouthOpen: 0.7 },
  triste: { brow: 0.3, browIn: -0.9, open: 0.7, smile: -0.5, mouthOpen: 0 },
};
function mixExpr(a, b, k) { const o = {}; for (const key in a) o[key] = a[key] + (b[key] - a[key]) * k; return o; }

// opts : { talk (0..1), headOnly, from (expression précédente), mixK (0..1), gaze (-1..1) }
export function drawPortrait(g, W, H, look, expr = 'neutre', t = 0, opts = {}) {
  const P = pal(look.skin);
  const F = Object.assign({ jaw: 1, chin: 1, nose: 1, lips: 1, eyes: 1, brow: 1, cheek: 1 }, look.face || {});
  const cx = W * 0.5, s = W / 430;
  const headY = H * 0.41, hw = 112 * s, hh = 142 * s;
  const female = look.sex === 'f';
  const old = (look.age || 30) > 45;
  const bl = (t * 0.23 + (look.skin.charCodeAt(2) || 0) * 0.37) % 1;
  const blink = bl > 0.955 ? Math.max(0.1, 1 - Math.sin((bl - 0.955) / 0.045 * Math.PI)) : 1;
  let E = EXPR[expr] || EXPR.neutre;
  if (opts.from && opts.mixK < 1) E = mixExpr(EXPR[opts.from] || EXPR.neutre, E, opts.mixK);
  const talk = opts.talk ? Math.max(0, Math.sin(t * 15) * 0.5 + 0.5 * Math.sin(t * 23)) * opts.talk : 0;
  const breath = Math.sin(t * 1.6) * 1.2 * s;
  const headTilt = opts.talk ? Math.sin(t * 2.1) * 0.012 : 0;

  const shY = H * 0.77 + breath;
  const shW = (female ? 215 : 245) * s * (look.build || 1);
  const neckW = (female ? 50 : 60) * s * (0.9 + (look.build || 1) * 0.1);
  const ng = g.createLinearGradient(cx - neckW, 0, cx + neckW, 0);
  ng.addColorStop(0, P.light); ng.addColorStop(0.5, P.base); ng.addColorStop(1, P.core);
  g.fillStyle = ng;
  if (!opts.headOnly) {
    g.beginPath(); g.moveTo(cx - neckW * 0.9, headY + hh * 0.55); g.lineTo(cx - neckW * 1.1, shY - 20 * s); g.lineTo(cx + neckW * 1.25, shY - 20 * s); g.lineTo(cx + neckW * 0.95, headY + hh * 0.5); g.closePath(); g.fill();
    g.fillStyle = rgba(P.deep, 0.45); ell(g, cx + 8 * s, headY + hh * 0.62, neckW * 1.05, 18 * s); g.fill();
    g.strokeStyle = rgba(P.light, 0.35); g.lineWidth = 3 * s; g.beginPath(); g.moveTo(cx - neckW * 0.5, headY + hh * 0.66); g.lineTo(cx - neckW * 0.9, shY - 22 * s); g.stroke();
    drawBust(g, W, H, look, cx, shY, shW, neckW, s);
  } else {
    g.beginPath(); g.moveTo(cx - neckW * 0.85, headY + hh * 0.55); g.lineTo(cx - neckW * 0.95, H); g.lineTo(cx + neckW * 1.15, H); g.lineTo(cx + neckW * 0.9, headY + hh * 0.5); g.closePath(); g.fill();
    g.fillStyle = rgba(P.deep, 0.45); ell(g, cx + 8 * s, headY + hh * 0.62, neckW, 18 * s); g.fill();
  }

  g.save();
  g.translate(cx, headY); g.rotate(headTilt); g.translate(-cx, -headY);
  const hx = cx + 6 * s, hy = headY;
  const JW = F.jaw, CH = F.chin, CK = F.cheek;
  if (look.hair === 'locks') {
    for (let i = 0; i < 16; i++) {
      const a = -0.3 + i * 0.09, x0 = hx - hw * 0.9 + i * hw * 0.12;
      const lg = g.createLinearGradient(x0, hy - hh * 0.6, x0 + 10 * s, hy + hh * 0.9);
      lg.addColorStop(0, '#24170f'); lg.addColorStop(1, '#0e0805');
      g.strokeStyle = lg; g.lineWidth = 15 * s; g.lineCap = 'round';
      g.beginPath(); g.moveTo(x0, hy - hh * 0.5); g.quadraticCurveTo(x0 - 18 * s + a * 30 * s, hy + hh * 0.3, x0 - 10 * s + i * 1.5 * s, hy + hh * (0.75 + (i % 3) * 0.08)); g.stroke();
      g.strokeStyle = 'rgba(120,90,60,0.25)'; g.lineWidth = 4 * s; g.beginPath(); g.moveTo(x0 - 3 * s, hy - hh * 0.45); g.quadraticCurveTo(x0 - 18 * s + a * 30 * s, hy + hh * 0.25, x0 - 12 * s + i * 1.5 * s, hy + hh * 0.6); g.stroke();
    }
  }
  const earX = hx - hw * 0.86, earY = hy + hh * 0.04;
  g.fillStyle = P.core; ell(g, earX, earY, 18 * s, 30 * s, -0.15); g.fill();
  g.fillStyle = P.base; ell(g, earX + 2 * s, earY - 1 * s, 13 * s, 24 * s, -0.15); g.fill();
  g.strokeStyle = rgba(P.deep, 0.7); g.lineWidth = 2.5 * s; g.beginPath(); g.ellipse(earX + 3 * s, earY, 7 * s, 15 * s, -0.15, -1.6, 1.4); g.stroke();
  if (look.earrings) { g.strokeStyle = '#e8b84a'; g.lineWidth = 3.5 * s; g.beginPath(); g.arc(earX + 2 * s, earY + 36 * s, 11 * s, 0, TAU); g.stroke(); softSpot(g, earX - 4 * s, earY + 28 * s, 6 * s, '#ffffff', 0.7); }

  const face = () => {
    g.beginPath();
    g.moveTo(hx - hw * 0.92, hy - hh * 0.15);
    g.bezierCurveTo(hx - hw * 0.98, hy - hh * 0.85, hx + hw * 0.55, hy - hh * 1.02, hx + hw * 0.9, hy - hh * 0.42);
    g.bezierCurveTo(hx + hw * 1.0, hy - hh * 0.18, hx + hw * 0.96, hy + hh * 0.02, hx + hw * 0.98 * CK, hy + hh * 0.12);
    g.bezierCurveTo(hx + hw * 0.98 * CK, hy + hh * 0.32, hx + hw * 0.86 * JW, hy + hh * 0.56, hx + hw * 0.55 * JW, hy + hh * 0.7 * CH);
    g.bezierCurveTo(hx + hw * 0.32, hy + hh * 0.8 * CH, hx + hw * 0.05, hy + hh * 0.8 * CH, hx - hw * 0.25, hy + hh * 0.62 * CH);
    g.bezierCurveTo(hx - hw * 0.6 * JW, hy + hh * 0.45, hx - hw * 0.82 * JW, hy + hh * 0.2, hx - hw * 0.92, hy - hh * 0.15);
    g.closePath();
  };
  face();
  const fg = g.createRadialGradient(hx - hw * 0.15, hy - hh * 0.25, hw * 0.1, hx + hw * 0.1, hy + hh * 0.05, hw * 1.15);
  fg.addColorStop(0, P.light); fg.addColorStop(0.45, P.base); fg.addColorStop(0.82, P.core); fg.addColorStop(1, P.deep);
  g.fillStyle = fg; g.fill();
  g.save(); face(); g.clip();
  const sg = g.createLinearGradient(hx + hw * 0.3, 0, hx + hw * 1.0, 0);
  sg.addColorStop(0, rgba(P.deep, 0)); sg.addColorStop(1, rgba(P.deep, 0.55));
  g.fillStyle = sg; g.fillRect(hx, hy - hh, hw, hh * 2);
  softSpot(g, hx + hw * 0.3, hy + hh * 0.72, hw * 0.4, '#c98a5e', 0.2);
  softSpot(g, hx + hw * 0.18, hy - hh * 0.42, hw * 0.45, '#fff1dc', 0.22);
  softSpot(g, hx - hw * 0.28, hy + hh * 0.12, hw * 0.32 * CK, '#ffe3c6', 0.22);
  softSpot(g, hx + hw * 0.62, hy + hh * 0.1, hw * 0.2, '#ffe3c6', 0.12);
  softSpot(g, hx + hw * 0.18, hy + hh * 0.62 * CH, hw * 0.18, '#ffe3c6', 0.16);
  softSpot(g, hx - hw * 0.12, hy - hh * 0.02, hw * 0.24, P.deep, 0.32);
  softSpot(g, hx + hw * 0.5, hy - hh * 0.02, hw * 0.2, P.deep, 0.32);
  if (old) {
    g.strokeStyle = rgba(P.deep, 0.35); g.lineWidth = 2 * s;
    for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(hx - hw * 0.25, hy - hh * (0.42 + i * 0.08)); g.quadraticCurveTo(hx + hw * 0.2, hy - hh * (0.46 + i * 0.08), hx + hw * 0.62, hy - hh * (0.4 + i * 0.08)); g.stroke(); }
    g.beginPath(); g.moveTo(hx - hw * 0.5, hy - hh * 0.02); g.lineTo(hx - hw * 0.62, hy - hh * 0.06); g.moveTo(hx - hw * 0.5, hy + hh * 0.02); g.lineTo(hx - hw * 0.62, hy + hh * 0.06); g.stroke();
    softSpot(g, hx - hw * 0.12, hy + hh * 0.1, hw * 0.2, P.deep, 0.2);
  }
  g.strokeStyle = rgba(P.deep, old ? 0.5 : 0.28); g.lineWidth = 2.5 * s;
  g.beginPath(); g.moveTo(hx + hw * 0.02, hy + hh * 0.22); g.quadraticCurveTo(hx - hw * 0.12, hy + hh * 0.36, hx - hw * 0.04 - E.smile * 6 * s, hy + hh * 0.48); g.stroke();
  if (CK < 0.97) softSpot(g, hx - hw * 0.2, hy + hh * 0.3, hw * 0.25, P.deep, 0.25);
  g.restore();

  const eyY = hy - hh * 0.02;
  const eye = (ex, ey, sc, far) => {
    const ew = 30 * s * sc * F.eyes, eh = 13 * s * sc * E.open * blink * F.eyes;
    g.fillStyle = rgba(P.deep, 0.5); ell(g, ex, ey - eh * 0.6, ew * 1.15, eh * 1.3); g.fill();
    g.save();
    g.beginPath(); g.moveTo(ex - ew, ey); g.quadraticCurveTo(ex - ew * 0.1, ey - eh * 1.6, ex + ew, ey - eh * 0.1); g.quadraticCurveTo(ex, ey + eh * 1.1, ex - ew, ey); g.closePath();
    g.fillStyle = '#efe4d6'; g.fill(); g.clip();
    const gz = opts.gaze || 0;
    const ix = ex + ew * (far ? 0.25 : 0.18) + gz * ew * 0.2, iy = ey - eh * 0.15;
    const ig = g.createRadialGradient(ix, iy, 0, ix, iy, ew * 0.5);
    ig.addColorStop(0, '#5a3418'); ig.addColorStop(0.7, '#2c170b'); ig.addColorStop(1, '#120904');
    g.fillStyle = ig; ell(g, ix, iy, ew * 0.48, ew * 0.48); g.fill();
    g.fillStyle = '#050302'; ell(g, ix, iy, ew * 0.2, ew * 0.2); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(ex - ew, ey - eh * 2, ew * 2, eh * 0.9);
    g.restore();
    g.fillStyle = 'rgba(255,255,255,0.9)'; ell(g, ix - ew * 0.15, iy - ew * 0.15, ew * 0.1, ew * 0.1); g.fill();
    g.strokeStyle = '#120804'; g.lineWidth = 3.4 * s * sc; g.lineCap = 'round';
    g.beginPath(); g.moveTo(ex - ew * 1.02, ey + 1 * s); g.quadraticCurveTo(ex - ew * 0.1, ey - eh * 1.7, ex + ew * 1.02, ey - eh * 0.15); g.stroke();
    g.strokeStyle = rgba(P.deep, 0.6); g.lineWidth = 1.6 * s;
    g.beginPath(); g.moveTo(ex - ew * 0.8, ey + eh * 0.35); g.quadraticCurveTo(ex, ey + eh * 1.15, ex + ew * 0.9, ey + eh * 0.1); g.stroke();
    g.strokeStyle = rgba(P.deep, 0.45); g.lineWidth = 2 * s;
    g.beginPath(); g.moveTo(ex - ew * 0.8, ey - eh * 1.1); g.quadraticCurveTo(ex, ey - eh * 2.3 - 4 * s, ex + ew * 0.85, ey - eh * 1.0); g.stroke();
  };
  eye(hx - hw * 0.14, eyY, 1, false);
  eye(hx + hw * 0.55, eyY - 2 * s, 0.78, true);
  const brow = (bx, by, len, sc, side) => {
    const lift = E.brow * 10 * s, inn = E.browIn * 9 * s;
    g.strokeStyle = look.grey ? '#8a7d72' : '#120804'; g.lineCap = 'round';
    g.lineWidth = (female ? 5 : 7.5) * s * sc * F.brow;
    g.beginPath();
    const x0 = bx - len / 2, x1 = bx + len / 2, near = side === 'near';
    g.moveTo(x0, by - lift + (near ? -inn * 0.2 : inn));
    g.quadraticCurveTo(bx, by - lift - 9 * s * sc, x1, by - lift + (near ? inn : -inn * 0.2));
    g.stroke();
  };
  brow(hx - hw * 0.14, eyY - 32 * s, 66 * s, 1, 'near');
  brow(hx + hw * 0.56, eyY - 33 * s, 46 * s, 0.85, 'far');

  const NS = F.nose;
  const nx = hx + hw * 0.24, ny = hy + hh * 0.26;
  const ag = g.createLinearGradient(nx - 18 * s, 0, nx + 18 * s, 0);
  ag.addColorStop(0, rgba(P.hi, 0)); ag.addColorStop(0.5, rgba(P.hi, 0.35)); ag.addColorStop(1, rgba(P.hi, 0));
  g.fillStyle = ag; g.beginPath(); g.moveTo(nx - 6 * s, hy - hh * 0.04); g.lineTo(nx + 8 * s, hy - hh * 0.04); g.lineTo(nx + 14 * s * NS, ny - 8 * s); g.lineTo(nx - 8 * s * NS, ny - 8 * s); g.fill();
  g.fillStyle = rgba(P.deep, 0.4);
  g.beginPath(); g.moveTo(nx + 10 * s, hy - hh * 0.02); g.quadraticCurveTo(nx + 30 * s * NS, ny - 10 * s, nx + 28 * s * NS, ny + 8 * s); g.lineTo(nx + 14 * s, ny + 4 * s); g.closePath(); g.fill();
  g.fillStyle = P.base; ell(g, nx + 2 * s, ny, 30 * s * NS, 20 * s * NS); g.fill();
  softSpot(g, nx + 4 * s, ny - 6 * s, 14 * s * NS, '#fff0dc', 0.4);
  g.fillStyle = shade(look.skin, -0.12); ell(g, nx - 22 * s * NS, ny + 3 * s, 15 * s * NS, 14 * s * NS); g.fill();
  g.strokeStyle = rgba(P.deep, 0.3); g.lineWidth = 1.8 * s;
  g.beginPath(); g.arc(nx - 22 * s * NS, ny + 3 * s, 12 * s * NS, 1.6, 3.4); g.stroke();
  g.fillStyle = '#1a0b05'; ell(g, nx - 10 * s * NS, ny + 12 * s, 9 * s * NS, 4.5 * s, 0.2); g.fill(); ell(g, nx + 18 * s * NS, ny + 12 * s, 6 * s, 3.5 * s, -0.2); g.fill();

  const LS = F.lips;
  const mx = hx + hw * 0.2, my = hy + hh * 0.48 * (0.9 + CH * 0.1);
  const mw = 46 * s, sm = E.smile * 8 * s, op = (E.mouthOpen + talk * 0.6) * 14 * s;
  g.fillStyle = P.lip;
  g.beginPath(); g.moveTo(mx - mw, my - sm * 0.5); g.quadraticCurveTo(mx - mw * 0.4, my - 13 * s * LS, mx, my - 9 * s * LS); g.quadraticCurveTo(mx + mw * 0.3, my - 13 * s * LS, mx + mw * 0.78, my - sm * 0.5); g.quadraticCurveTo(mx, my + 1 * s, mx - mw, my - sm * 0.5); g.fill();
  if (op > 1) {
    g.fillStyle = '#2a0e08'; g.beginPath(); g.moveTo(mx - mw * 0.9, my - sm * 0.5); g.quadraticCurveTo(mx, my + op * 1.4, mx + mw * 0.72, my - sm * 0.5); g.quadraticCurveTo(mx, my + 2 * s, mx - mw * 0.9, my - sm * 0.5); g.fill();
    g.fillStyle = '#efe6da'; g.beginPath(); g.moveTo(mx - mw * 0.7, my - sm * 0.3 + 1 * s); g.quadraticCurveTo(mx, my + Math.min(op * 0.55, 9 * s), mx + mw * 0.55, my - sm * 0.3 + 1 * s); g.quadraticCurveTo(mx, my + 2 * s, mx - mw * 0.7, my - sm * 0.3 + 1 * s); g.fill();
  }
  const lg2 = g.createLinearGradient(0, my, 0, my + 20 * s + op);
  lg2.addColorStop(0, P.lipLight); lg2.addColorStop(1, P.lip);
  g.fillStyle = lg2;
  g.beginPath(); g.moveTo(mx - mw * 0.85, my - sm * 0.5 + op * 0.2); g.quadraticCurveTo(mx, my + 20 * s * LS + op, mx + mw * 0.7, my - sm * 0.5 + op * 0.2); g.quadraticCurveTo(mx, my + 3 * s + op, mx - mw * 0.85, my - sm * 0.5 + op * 0.2); g.fill();
  softSpot(g, mx - 6 * s, my + 9 * s * LS + op, 9 * s, '#ffffff', 0.25);
  g.strokeStyle = 'rgba(25,8,3,0.75)'; g.lineWidth = 2.2 * s;
  g.beginPath(); g.moveTo(mx - mw, my - sm * 0.5); g.quadraticCurveTo(mx, my + 2 * s + (E.smile < 0 ? 4 * s : 0) + op * 0.1, mx + mw * 0.78, my - sm * 0.5); g.stroke();
  if (E.smile > 0.5) { g.strokeStyle = rgba(P.deep, 0.5); g.beginPath(); g.arc(mx - mw - 4 * s, my - sm, 7 * s, -0.6, 1.2); g.stroke(); }

  if (look.beard) {
    g.save(); face(); g.clip();
    const r = rng(look.skin.length * 13);
    g.fillStyle = look.grey ? 'rgba(170,160,150,0.5)' : 'rgba(15,8,4,0.55)';
    for (let i = 0; i < 900; i++) {
      const a = r() * Math.PI, d = 0.55 + r() * 0.35;
      const x = hx + hw * 0.1 + Math.cos(a) * hw * 0.85 * d * (r() < 0.5 ? 1 : -0.9), y = hy + hh * 0.3 + Math.sin(a) * hh * 0.5 * d;
      if (y < my - 16 * s && Math.abs(x - mx) < mw * 0.9 && y > my - 30 * s) { g.fillRect(x, y, 2 * s, 2 * s); continue; }
      if (y > my - 6 * s) g.fillRect(x, y, 2 * s, 2.2 * s);
    }
    g.restore();
  }

  const hairCol = look.grey ? '#4a443f' : '#120a06';
  if (look.hair === 'short' || look.hair === 'locks') {
    g.save();
    g.beginPath();
    g.moveTo(hx - hw * 0.95, hy - hh * 0.05);
    g.bezierCurveTo(hx - hw * 1.05, hy - hh * 0.95, hx + hw * 0.6, hy - hh * 1.12, hx + hw * 0.92, hy - hh * 0.42);
    g.bezierCurveTo(hx + hw * 0.6, hy - hh * 0.62, hx + hw * 0.1, hy - hh * 0.62, hx - hw * 0.35, hy - hh * 0.5);
    g.quadraticCurveTo(hx - hw * 0.7, hy - hh * 0.4, hx - hw * 0.72, hy - hh * 0.05);
    g.closePath();
    g.fillStyle = hairCol; g.fill(); g.clip();
    const r = rng(9);
    for (let i = 0; i < 700; i++) { g.fillStyle = r() < 0.5 ? 'rgba(90,70,55,0.35)' : 'rgba(0,0,0,0.4)'; g.beginPath(); g.arc(hx - hw + r() * hw * 2, hy - hh * 1.1 + r() * hh, 2.2 * s, 0, TAU); g.fill(); }
    softSpot(g, hx - hw * 0.2, hy - hh * 0.8, hw * 0.5, '#b39882', 0.25);
    if (look.grey) { g.fillStyle = 'rgba(220,210,200,0.5)'; for (let i = 0; i < 300; i++) g.fillRect(hx - hw + r() * hw * 2, hy - hh * 1.1 + r() * hh, 2 * s, 2 * s); }
    g.restore();
  } else if (look.hair === 'bald') {
    softSpot(g, hx - hw * 0.1, hy - hh * 0.72, hw * 0.35, '#fff3e3', 0.5);
  } else if (look.hair === 'wrap') {
    const c1 = look.wrap || '#c2401f', c2 = look.wrap2 || '#f2b134';
    const path = () => {
      g.beginPath();
      g.moveTo(hx - hw * 1.02, hy - hh * 0.1);
      g.bezierCurveTo(hx - hw * 1.3, hy - hh * 1.2, hx + hw * 0.4, hy - hh * 1.65, hx + hw * 1.08, hy - hh * 0.95);
      g.bezierCurveTo(hx + hw * 1.25, hy - hh * 0.62, hx + hw * 1.0, hy - hh * 0.42, hx + hw * 0.86, hy - hh * 0.36);
      g.bezierCurveTo(hx + hw * 0.4, hy - hh * 0.58, hx - hw * 0.3, hy - hh * 0.6, hx - hw * 0.78, hy - hh * 0.25);
      g.closePath();
    };
    g.save(); path(); g.clip();
    waxFill(g, hx - hw * 1.4, hy - hh * 1.7, hw * 2.8, hh * 1.8, c1, c2, 3 + (c1.charCodeAt(1) % 3));
    const wg = g.createRadialGradient(hx - hw * 0.3, hy - hh * 1.1, hw * 0.1, hx, hy - hh * 0.8, hw * 1.6);
    wg.addColorStop(0, 'rgba(255,255,255,0.25)'); wg.addColorStop(0.6, 'rgba(0,0,0,0)'); wg.addColorStop(1, 'rgba(0,0,0,0.45)');
    g.fillStyle = wg; g.fillRect(hx - hw * 1.5, hy - hh * 1.8, hw * 3, hh * 2);
    g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 5 * s;
    for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(hx - hw * 0.9 + i * hw * 0.3, hy - hh * 0.3); g.quadraticCurveTo(hx - hw * 0.6 + i * hw * 0.28, hy - hh * 1.0, hx + hw * 0.6, hy - hh * (1.35 - i * 0.04)); g.stroke(); }
    g.restore();
    g.fillStyle = shade(c1, -0.1); ell(g, hx + hw * 0.55, hy - hh * 1.38, hw * 0.35, hh * 0.18, -0.4); g.fill();
    g.fillStyle = shade(c1, -0.35); ell(g, hx + hw * 0.55, hy - hh * 1.36, hw * 0.12, hh * 0.1, -0.4); g.fill();
  }

  if (look.glasses) {
    g.strokeStyle = '#1a1410'; g.lineWidth = 4.5 * s;
    g.beginPath(); g.roundRect(hx - hw * 0.14 - 40 * s, eyY - 24 * s, 80 * s, 46 * s, 12 * s); g.stroke();
    g.beginPath(); g.roundRect(hx + hw * 0.55 - 27 * s, eyY - 25 * s, 56 * s, 44 * s, 11 * s); g.stroke();
    g.beginPath(); g.moveTo(hx - hw * 0.14 + 40 * s, eyY - 8 * s); g.lineTo(hx + hw * 0.55 - 27 * s, eyY - 8 * s); g.stroke();
    g.beginPath(); g.moveTo(hx - hw * 0.14 - 40 * s, eyY - 10 * s); g.lineTo(earX + 10 * s, earY - 12 * s); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.moveTo(hx - hw * 0.14 - 30 * s, eyY + 16 * s); g.lineTo(hx - hw * 0.14 + 4 * s, eyY - 22 * s); g.lineTo(hx - hw * 0.14 + 22 * s, eyY - 22 * s); g.lineTo(hx - hw * 0.14 - 12 * s, eyY + 16 * s); g.fill();
  }
  g.save(); face(); g.clip();
  g.strokeStyle = 'rgba(255,214,160,0.35)'; g.lineWidth = 6 * s;
  g.beginPath(); g.moveTo(hx - hw * 0.92, hy - hh * 0.15); g.bezierCurveTo(hx - hw * 0.82 * JW, hy + hh * 0.2, hx - hw * 0.6 * JW, hy + hh * 0.45, hx - hw * 0.25, hy + hh * 0.62 * CH); g.stroke();
  g.restore();
  g.restore();
}

function drawBust(g, W, H, look, cx, shY, shW, neckW, s) {
  const top = look.topC || '#e9e2cf';
  const torso = () => {
    g.beginPath();
    g.moveTo(cx - shW, H + 4); g.quadraticCurveTo(cx - shW * 1.02, shY + 18 * s, cx - shW * 0.72, shY - 6 * s);
    g.quadraticCurveTo(cx - neckW * 1.4, shY - 22 * s, cx, shY - 18 * s);
    g.quadraticCurveTo(cx + neckW * 1.6, shY - 22 * s, cx + shW * 0.76, shY - 4 * s);
    g.quadraticCurveTo(cx + shW * 1.04, shY + 20 * s, cx + shW, H + 4); g.closePath();
  };
  g.save(); torso(); g.clip();
  if (look.top === 'wax') waxFill(g, cx - shW, shY - 30 * s, shW * 2, H - shY + 40 * s, top, look.topC2 || '#f2b134', 7);
  else {
    g.fillStyle = top; g.fillRect(cx - shW - 4, shY - 40 * s, shW * 2 + 8, H);
    if (look.top === 'jersey') {
      g.fillStyle = look.topC2 || '#fff';
      g.fillRect(cx - shW, shY - 30 * s, shW * 0.32, H); g.fillRect(cx + shW * 0.68, shY - 30 * s, shW * 0.4, H);
      g.fillStyle = rgba('#ffffff', 0.9); g.font = `700 ${46 * s}px 'Archivo', sans-serif`; g.textAlign = 'center'; g.fillText('9', cx + 30 * s, H - 18 * s);
    }
    if (look.top === 'tee' && look.print) { g.fillStyle = rgba('#1f5aa8', 0.85); g.font = `800 ${34 * s}px 'Archivo', sans-serif`; g.textAlign = 'center'; g.fillText(look.print, cx + 18 * s, shY + 92 * s); }
    if (look.top === 'boubou') {
      g.strokeStyle = look.topC2 || '#b08a4b'; g.lineWidth = 6 * s;
      g.beginPath(); g.moveTo(cx - neckW * 1.2, shY - 16 * s); g.quadraticCurveTo(cx + 6 * s, shY + 110 * s, cx + neckW * 1.4, shY - 16 * s); g.stroke();
      g.lineWidth = 2 * s; for (let i = 0; i < 9; i++) { const a = i / 8; g.beginPath(); g.arc(cx - neckW + a * neckW * 2.4, shY + 20 * s + Math.sin(a * Math.PI) * 70 * s, 6 * s, 0, TAU); g.stroke(); }
    }
    if (look.top === 'blouse') { g.strokeStyle = rgba('#ffffff', 0.35); g.lineWidth = 2 * s; for (let i = 0; i < 7; i++) { g.beginPath(); g.moveTo(cx - 40 * s + i * 13 * s, shY + 10 * s); g.lineTo(cx - 44 * s + i * 13 * s, H); g.stroke(); } }
  }
  const tg = g.createLinearGradient(cx - shW, 0, cx + shW, 0);
  tg.addColorStop(0, 'rgba(255,255,255,0.18)'); tg.addColorStop(0.45, 'rgba(255,255,255,0)'); tg.addColorStop(0.75, 'rgba(0,0,0,0.18)'); tg.addColorStop(1, 'rgba(0,0,0,0.42)');
  g.fillStyle = tg; g.fillRect(cx - shW - 4, shY - 40 * s, shW * 2 + 8, H);
  g.strokeStyle = 'rgba(0,0,0,0.16)'; g.lineWidth = 3 * s;
  for (const k of [-0.55, 0.35, 0.7]) { g.beginPath(); g.moveTo(cx + shW * k, shY + 30 * s); g.quadraticCurveTo(cx + shW * (k + 0.06), shY + 120 * s, cx + shW * (k - 0.03), H); g.stroke(); }
  g.restore();
  if (look.top === 'polo' || look.top === 'shirt') {
    g.fillStyle = shade(top, -0.12);
    g.beginPath(); g.moveTo(cx - neckW * 1.25, shY - 22 * s); g.lineTo(cx - neckW * 0.2, shY + 40 * s); g.lineTo(cx - neckW * 1.7, shY + 8 * s); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(cx + neckW * 1.35, shY - 22 * s); g.lineTo(cx + neckW * 0.3, shY + 40 * s); g.lineTo(cx + neckW * 1.85, shY + 8 * s); g.closePath(); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.5)'; for (let i = 0; i < 2; i++) { ell(g, cx + 4 * s, shY + 50 * s + i * 36 * s, 3.5 * s, 3.5 * s); g.fill(); }
  } else if (look.top !== 'boubou') {
    g.strokeStyle = shade(top, -0.25); g.lineWidth = 7 * s;
    g.beginPath(); g.moveTo(cx - neckW * 1.15, shY - 18 * s); g.quadraticCurveTo(cx + 4 * s, shY + 22 * s, cx + neckW * 1.3, shY - 18 * s); g.stroke();
  }
}

const cache = new Map();
export function portrait(id, look, expr = 'neutre', W = 520, H = 640) {
  const k = `${id}|${expr}|${W}`;
  if (!cache.has(k)) { const c = document.createElement('canvas'); c.width = W; c.height = H; drawPortrait(c.getContext('2d'), W, H, look, expr, 0); cache.set(k, c); }
  return cache.get(k);
}
// Tête et cou seuls (pour les personnages en pied) : le cou descend jusqu'au bas de l'image
export function headOnly(id, look, expr = 'neutre') {
  const k = `head|${id}|${expr}`;
  if (!cache.has(k)) { const c = document.createElement('canvas'); c.width = 520; c.height = 560; drawPortrait(c.getContext('2d'), 520, 640, look, expr, 0, { headOnly: true }); cache.set(k, c); }
  return cache.get(k);
}
