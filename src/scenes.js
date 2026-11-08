// Décors peints de Lomé (novembre, début de l'harmattan, lumière dure).
// Trois calques par lieu : fond (peint une fois), animation (véhicules, fumée, vagues, passants),
// calque avant (étals, foyers, comptoirs : devant les passants, derrière les personnages principaux).
// Soleil en haut à gauche : les ombres portées filent vers la droite.

import { rng, fbm1, rgba, shade, canvas, grain, lerp, mix } from './paint.js';
import { waxFill } from './portrait.js';

const TAU = Math.PI * 2;
const SKY = { top: '#2f78c0', mid: '#8fc0e2', low: '#efe0c0' };
const CLOTH = ['#d4472e', '#f2b134', '#2e6fb5', '#f4efe4', '#1f8a5c', '#7b3fa0', '#e86f9a', '#2b2b30', '#e9e2cf', '#3d9fd1', '#f08a24'];
const SKIN = ['#4a2c1c', '#5a3622', '#3b2418', '#6a4128'];

// ------------------------------------------------------------------ éléments communs
function sky(g, w, h, hz) {
  const gr = g.createLinearGradient(0, 0, 0, hz);
  gr.addColorStop(0, SKY.top); gr.addColorStop(0.55, SKY.mid); gr.addColorStop(1, SKY.low);
  g.fillStyle = gr; g.fillRect(0, 0, w, hz + 2);
  const glow = g.createRadialGradient(w * 0.12, hz * 0.1, 0, w * 0.12, hz * 0.1, w * 0.5);
  glow.addColorStop(0, 'rgba(255,240,210,0.7)'); glow.addColorStop(1, 'rgba(255,240,210,0)');
  g.fillStyle = glow; g.fillRect(0, 0, w, hz);
  const r = rng(5);
  for (let i = 0; i < 7; i++) {
    const cx = r() * w, cy = hz * (0.12 + r() * 0.45), cw = w * (0.07 + r() * 0.1);
    for (let k = 0; k < 16; k++) {
      const px = cx + (r() - 0.5) * cw, py = cy + (r() - 0.5) * cw * 0.15, pr = cw * (0.1 + r() * 0.16);
      const cg = g.createRadialGradient(px - pr * 0.3, py - pr * 0.4, pr * 0.1, px, py, pr);
      cg.addColorStop(0, 'rgba(255,255,255,0.95)'); cg.addColorStop(0.7, 'rgba(235,235,240,0.7)'); cg.addColorStop(1, 'rgba(200,205,215,0)');
      g.fillStyle = cg; g.beginPath(); g.arc(px, py, pr, 0, TAU); g.fill();
    }
  }
}
function plaster(g, x, y, w, h, col, r) {
  const gr = g.createLinearGradient(x, 0, x + w, 0);
  gr.addColorStop(0, shade(col, 0.12)); gr.addColorStop(0.6, col); gr.addColorStop(1, shade(col, -0.18));
  g.fillStyle = gr; g.fillRect(x, y, w, h);
  for (let i = 0; i < w * h / 900; i++) { g.fillStyle = rgba(r() < 0.5 ? '#000000' : '#ffffff', 0.03 + r() * 0.04); g.fillRect(x + r() * w, y + r() * h, 2 + r() * 6, 1 + r() * 3); }
  for (let i = 0; i < 8; i++) { g.fillStyle = rgba('#3b2a1a', 0.05 + r() * 0.07); g.fillRect(x + r() * w, y, 2 + r() * 5, h * (0.15 + r() * 0.6)); }
  g.fillStyle = rgba('#6b4a2a', 0.25); g.fillRect(x, y + h - h * 0.07, w, h * 0.07); // soubassement sali
}
function shutter(g, x, y, w, h, col) {
  g.fillStyle = shade(col, -0.35); g.fillRect(x - 3, y - 3, w + 6, h + 6);
  g.fillStyle = col; g.fillRect(x, y, w, h);
  g.fillStyle = 'rgba(0,0,0,0.28)'; for (let s = 0; s < h; s += Math.max(4, h / 9)) g.fillRect(x, y + s, w, Math.max(1.5, h / 28));
  g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x, y, w * 0.08, h);
}
function balcony(g, x, y, w, col) {
  g.fillStyle = shade(col, -0.25); g.fillRect(x - 6, y, w + 12, 7);
  g.strokeStyle = '#2c2c2c'; g.lineWidth = 1.6;
  for (let i = 0; i <= w; i += 9) { g.beginPath(); g.moveTo(x + i, y); g.lineTo(x + i, y - 26); g.stroke(); }
  g.lineWidth = 3; g.beginPath(); g.moveTo(x - 4, y - 26); g.lineTo(x + w + 4, y - 26); g.stroke();
  // linge qui sèche
  const c = CLOTH[Math.floor((x * 7) % CLOTH.length)];
  g.fillStyle = c; g.fillRect(x + w * 0.3, y - 25, w * 0.18, 20); g.fillStyle = CLOTH[Math.floor((x * 3) % CLOTH.length)]; g.fillRect(x + w * 0.55, y - 25, w * 0.12, 16);
}
function acUnit(g, x, y, s) { g.fillStyle = '#d8d4cc'; g.fillRect(x, y, s, s * 0.7); g.fillStyle = '#8a8680'; for (let i = 0; i < 5; i++) g.fillRect(x + s * 0.1, y + s * 0.12 + i * s * 0.1, s * 0.8, s * 0.03); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x, y + s * 0.7, s, s * 0.08); }
function dish(g, x, y, s) { g.fillStyle = '#cfcdc7'; g.beginPath(); g.ellipse(x, y, s * 0.5, s * 0.6, -0.4, 0, TAU); g.fill(); g.strokeStyle = '#555'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + s * 0.5, y + s * 0.3); g.stroke(); }
function paintedSign(g, x, y, w, h, txt, bg, fg, sub) {
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x + 4, y + 4, w, h);
  g.fillStyle = bg; g.fillRect(x, y, w, h);
  g.strokeStyle = fg; g.lineWidth = 2; g.strokeRect(x + 4, y + 4, w - 8, h - 8);
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  // la taille de police descend jusqu'à ce que le texte tienne dans le cadre
  let fs = Math.round(h * (sub ? 0.36 : 0.5));
  do { g.font = `800 ${fs}px 'Archivo', sans-serif`; fs -= 1; } while (g.measureText(txt).width > w * 0.86 && fs > 6);
  g.fillText(txt, x + w / 2, y + h * (sub ? 0.38 : 0.52));
  if (sub) { let f2 = Math.round(h * 0.2); do { g.font = `600 ${f2}px 'Inter', sans-serif`; f2 -= 1; } while (g.measureText(sub).width > w * 0.86 && f2 > 5); g.fillText(sub, x + w / 2, y + h * 0.74); }
}
// Façade complète : étages, boutique au rez-de-chaussée, auvent, enseigne, détails
function facade(g, x, y, w, h, col, r, o = {}) {
  const floors = o.floors || 2, fh = h / floors;
  plaster(g, x, y - h, w, h, col, r);
  // bandeaux entre étages
  g.fillStyle = 'rgba(0,0,0,0.18)'; for (let f = 1; f < floors; f++) g.fillRect(x, y - h + f * fh, w, 4);
  const nwin = Math.max(2, Math.round(w / (fh * 0.55)));
  for (let f = 0; f < floors - 1; f++) {
    const fy = y - h + f * fh + fh * 0.22;
    for (let k = 0; k < nwin; k++) {
      const wx = x + w * 0.07 + k * (w * 0.86 / nwin) + w * 0.86 / nwin * 0.15, ww = w * 0.86 / nwin * 0.6, wh = fh * 0.5;
      shutter(g, wx, fy, ww, wh, o.shutter || '#2f6e5a');
      if (o.balcony && k % 2 === 0) balcony(g, wx - ww * 0.1, fy + wh + 4, ww * 1.2, col);
    }
  }
  if (o.ac) acUnit(g, x + w * 0.78, y - h + fh * 0.3, fh * 0.28);
  if (o.dish) dish(g, x + w * 0.12, y - h + 10, fh * 0.35);
  // rez-de-chaussée : boutique ouverte sombre, marchandises
  const gy = y - fh * 0.92, gh = fh * 0.92;
  g.fillStyle = '#231911'; g.fillRect(x + w * 0.08, gy, w * 0.84, gh);
  const inner = g.createLinearGradient(0, gy, 0, gy + gh); inner.addColorStop(0, 'rgba(0,0,0,0.6)'); inner.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = inner; g.fillRect(x + w * 0.08, gy, w * 0.84, gh);
  for (let sh = 0; sh < 3; sh++) { // étagères
    const sy = gy + gh * (0.25 + sh * 0.22);
    g.fillStyle = '#5a4330'; g.fillRect(x + w * 0.1, sy, w * 0.8, 3);
    for (let i = 0; i < 9; i++) { g.fillStyle = CLOTH[Math.floor(r() * CLOTH.length)]; g.fillRect(x + w * 0.12 + i * w * 0.085, sy - gh * (0.08 + r() * 0.08), w * 0.06, gh * (0.08 + r() * 0.08)); }
  }
  // piliers
  g.fillStyle = shade(col, -0.1); g.fillRect(x, gy, w * 0.08, gh); g.fillRect(x + w * 0.92, gy, w * 0.08, gh);
  // auvent : tôle ou tissu rayé
  if (o.awning === 'cloth') {
    for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? (o.awningC || '#d4472e') : '#f4efe4'; g.beginPath(); g.moveTo(x - 8 + (w + 16) * i / 8, gy); g.lineTo(x - 8 + (w + 16) * (i + 1) / 8, gy); g.lineTo(x - 20 + (w + 40) * (i + 1) / 8, gy + 26); g.lineTo(x - 20 + (w + 40) * i / 8, gy + 26); g.fill(); }
    g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(x - 20, gy + 26, w + 40, 4);
  } else {
    g.fillStyle = '#9a958b'; g.beginPath(); g.moveTo(x - 6, gy + 4); g.lineTo(x + w + 6, gy + 4); g.lineTo(x + w + 18, gy + 28); g.lineTo(x - 18, gy + 28); g.fill();
    g.strokeStyle = 'rgba(80,50,30,0.45)'; g.lineWidth = 1; for (let i = 0; i < w / 7; i++) { g.beginPath(); g.moveTo(x + i * 7, gy + 4); g.lineTo(x + i * 7 - 4, gy + 28); g.stroke(); }
    g.fillStyle = 'rgba(160,60,20,0.25)'; for (let i = 0; i < 6; i++) g.fillRect(x + r() * w, gy + 6 + r() * 18, 10 + r() * 20, 3);
  }
  // ombre de l'auvent sur la façade et le sol
  g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(x, gy + 28, w, 10);
  if (o.sign) paintedSign(g, x + w * 0.08, gy - fh * 0.2, w * 0.84, fh * 0.17, o.sign, o.signBg || '#f4efe4', o.signFg || '#1f3f7a', o.signSub);
  // ombre portée du bâtiment sur le sol, vers la droite
  const sg = g.createLinearGradient(x + w, y, x + w + w * 0.35, y);
  sg.addColorStop(0, 'rgba(20,10,0,0.3)'); sg.addColorStop(1, 'rgba(20,10,0,0)');
  g.fillStyle = sg; g.fillRect(x + w, y - 2, w * 0.35, 30);
}
function pole(g, x, y, h) {
  g.fillStyle = '#4a3f33'; g.fillRect(x - 3, y - h, 6, h);
  g.fillStyle = '#2c2c2c'; g.fillRect(x - 16, y - h + 8, 32, 3);
  g.fillStyle = '#e6e2d8'; for (const k of [-12, 0, 12]) { g.beginPath(); g.arc(x + k, y - h + 6, 3, 0, TAU); g.fill(); }
}
function wires(g, x0, x1, y, sag = 14) {
  g.strokeStyle = 'rgba(30,30,30,0.75)'; g.lineWidth = 1.2;
  for (const k of [0, 5, 10]) { g.beginPath(); g.moveTo(x0, y + k); g.quadraticCurveTo((x0 + x1) / 2, y + k + sag, x1, y + k); g.stroke(); }
}
function treeShadow(g, x, y, rx, ry) { const sg = g.createRadialGradient(x, y, 0, x, y, rx); sg.addColorStop(0, 'rgba(20,20,10,0.4)'); sg.addColorStop(1, 'rgba(20,20,10,0)'); g.fillStyle = sg; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); }
function tree(g, x, y, s, r, kind = 'manguier') {
  treeShadow(g, x + s * 0.9, y + s * 0.02, s * 1.2, s * 0.18);
  g.strokeStyle = '#4a3828'; g.lineCap = 'round'; g.lineWidth = s * 0.1;
  g.beginPath(); g.moveTo(x, y); g.lineTo(x + s * 0.03, y - s * 0.6); g.stroke();
  g.lineWidth = s * 0.05; g.beginPath(); g.moveTo(x + s * 0.02, y - s * 0.5); g.lineTo(x - s * 0.3, y - s * 0.85); g.moveTo(x + s * 0.03, y - s * 0.55); g.lineTo(x + s * 0.32, y - s * 0.9); g.stroke();
  const col = kind === 'neem' ? '#4e7d33' : '#2f5a22';
  const masses = []; for (let i = 0; i < 6; i++) { const a = r() * TAU, d = Math.sqrt(r()) * 0.55; masses.push([x + Math.cos(a) * s * 0.75 * d, y - s * 1.05 + Math.sin(a) * s * 0.4 * d, s * (0.28 + r() * 0.16)]); }
  for (const [px, py, pr] of masses) { g.fillStyle = shade(col, -0.45); g.beginPath(); g.arc(px, py + pr * 0.1, pr, 0, TAU); g.fill(); }
  for (let i = 0; i < 420; i++) {
    const M = masses[Math.floor(r() * masses.length)], a = r() * TAU, d = Math.sqrt(r());
    const px = M[0] + Math.cos(a) * M[2] * d, py = M[1] + Math.sin(a) * M[2] * d;
    const k = Math.max(0, Math.min(1, 0.5 + ((M[0] - px) + (M[1] - py)) / (M[2] * 2.2)));
    g.fillStyle = k > 0.7 ? shade(col, 0.25) : k > 0.45 ? col : k > 0.25 ? shade(col, -0.2) : shade(col, -0.38);
    const tr = M[2] * (0.08 + r() * 0.1); g.beginPath(); g.ellipse(px, py, tr * (1 + r() * 0.6), tr, r() * Math.PI, 0, TAU); g.fill();
  }
}
function palm(g, x, y, s, sway = 0) {
  treeShadow(g, x + s * 0.7, y, s * 0.9, s * 0.12);
  g.strokeStyle = '#6b5a45'; g.lineWidth = s * 0.06; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + s * 0.18, y - s * 0.6, x + s * 0.08 + sway * s * 0.1, y - s * 1.25); g.stroke();
  g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 1; for (let i = 0; i < 12; i++) { const t = i / 12; g.beginPath(); g.moveTo(x + s * 0.16 * t - s * 0.03, y - t * s * 1.2); g.lineTo(x + s * 0.16 * t + s * 0.03, y - t * s * 1.2 - 2); g.stroke(); }
  const top = [x + s * 0.08 + sway * s * 0.1, y - s * 1.25];
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * TAU + sway * 0.1, L = s * (0.55 + (i % 3) * 0.08);
    const ex = top[0] + Math.cos(a) * L, ey = top[1] - s * 0.15 + Math.abs(Math.sin(a)) * L * 0.35 + sway * s * 0.05;
    g.strokeStyle = i % 2 ? '#3e6b2a' : '#4e7d33'; g.lineWidth = s * 0.045;
    g.beginPath(); g.moveTo(top[0], top[1]); g.quadraticCurveTo(top[0] + Math.cos(a) * L * 0.5, top[1] - s * 0.25, ex, ey); g.stroke();
    // folioles
    g.lineWidth = s * 0.012; for (let k = 1; k < 9; k++) { const t = k / 9, px = top[0] + Math.cos(a) * L * t * 0.95, py = top[1] - s * 0.25 * (1 - t) * t * 4 * 0.5 + (ey - top[1]) * t; g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.cos(a + 1.3) * s * 0.07, py + s * 0.08); g.moveTo(px, py); g.lineTo(px + Math.cos(a - 1.3) * s * 0.07, py + s * 0.08); g.stroke(); }
  }
  g.fillStyle = '#8a6a2a'; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(top[0] + (i - 2) * s * 0.03, top[1] + s * 0.03, s * 0.025, 0, TAU); g.fill(); }
}
export function parasol(g, x, y, s, c1, c2) {
  const R = s * 0.62, apex = [x, y - s * 1.12], n = 10;
  // ombre au sol
  const sg = g.createRadialGradient(x + R * 0.5, y, 0, x + R * 0.5, y, R * 1.1); sg.addColorStop(0, 'rgba(20,10,0,0.32)'); sg.addColorStop(1, 'rgba(20,10,0,0)');
  g.fillStyle = sg; g.beginPath(); g.ellipse(x + R * 0.5, y + s * 0.02, R * 1.1, R * 0.2, 0, 0, TAU); g.fill();
  g.strokeStyle = '#3a3a3a'; g.lineWidth = s * 0.025; g.beginPath(); g.moveTo(x, y); g.lineTo(x, apex[1]); g.stroke();
  const rim = (a) => [x + Math.cos(a) * R, y - s * 0.86 + Math.sin(a) * R * 0.16];
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI, a1 = ((i + 1) / n) * Math.PI, p0 = rim(a0), p1 = rim(a1);
    const lit = 0.5 + 0.5 * Math.cos((a0 + a1) / 2 + 0.6);
    g.fillStyle = shade(i % 2 ? c1 : c2, -0.3 + lit * 0.35);
    g.beginPath(); g.moveTo(apex[0], apex[1]); g.lineTo(p0[0], p0[1]); g.quadraticCurveTo((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 + s * 0.03, p1[0], p1[1]); g.closePath(); g.fill();
  }
  g.fillStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.moveTo(apex[0], apex[1]); g.lineTo(rim(2.4)[0], rim(2.4)[1]); g.lineTo(rim(2.9)[0], rim(2.9)[1]); g.fill();
}
// Pile de pagnes pliés (motif wax réel), sur une table ; pagnes suspendus derrière
let waxTiles = null;
function waxTile(i) {
  if (!waxTiles) { waxTiles = []; const pairs = [['#c2401f', '#f2b134'], ['#1f5aa8', '#e9e2cf'], ['#1f8a5c', '#f2b134'], ['#7b3fa0', '#f08a24'], ['#2b2b30', '#d4472e'], ['#f2b134', '#1f5aa8'], ['#e86f9a', '#2b2b30'], ['#3d9fd1', '#f4efe4']]; pairs.forEach(([a, b], k) => { const c = canvas(64, 64); waxFill(c.getContext('2d'), 0, 0, 64, 64, a, b, k); waxTiles.push(c); }); }
  return waxTiles[i % waxTiles.length];
}
export function pagneStall(g, x, y, w, s, r, o = {}) {
  // ombre de la table
  g.fillStyle = 'rgba(20,10,0,0.28)'; g.fillRect(x + s * 0.08, y - s * 0.02, w, s * 0.05);
  // pagnes suspendus sur une corde derrière
  if (o.hang !== false) {
    g.strokeStyle = '#333'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x - s * 0.05, y - s * 1.05); g.lineTo(x + w + s * 0.05, y - s * 1.0); g.stroke();
    for (let i = 0; i < Math.floor(w / (s * 0.3)); i++) {
      const px = x + s * 0.02 + i * s * 0.3, ph = s * (0.45 + r() * 0.1), pw = s * 0.26;
      g.save(); g.beginPath(); g.moveTo(px, y - s * 1.04); g.lineTo(px + pw, y - s * 1.03); g.lineTo(px + pw * 1.04, y - s * 1.03 + ph); g.lineTo(px - pw * 0.04, y - s * 1.04 + ph); g.closePath(); g.clip();
      g.drawImage(waxTile(i + (o.seed || 0)), px - 4, y - s * 1.05, pw + 8, ph + 4);
      const fg = g.createLinearGradient(px, 0, px + pw, 0); fg.addColorStop(0, 'rgba(255,255,255,0.15)'); fg.addColorStop(0.5, 'rgba(0,0,0,0)'); fg.addColorStop(1, 'rgba(0,0,0,0.3)');
      g.fillStyle = fg; g.fillRect(px - 4, y - s * 1.05, pw + 8, ph + 4);
      g.strokeStyle = 'rgba(0,0,0,0.15)'; g.lineWidth = 1; for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(px + pw * k / 4, y - s * 1.04); g.lineTo(px + pw * k / 4 + 3, y - s * 1.04 + ph); g.stroke(); }
      g.restore();
      g.fillStyle = '#d8c7a0'; g.fillRect(px + pw * 0.2, y - s * 1.07, 4, 6); g.fillRect(px + pw * 0.8, y - s * 1.07, 4, 6);
    }
  }
  // table : plateau et pieds, nappe
  g.fillStyle = '#5a4330'; g.fillRect(x, y - s * 0.44, w, s * 0.05);
  g.fillStyle = '#3f2e20'; for (const k of [0.03, 0.5, 0.94]) g.fillRect(x + w * k, y - s * 0.4, s * 0.04, s * 0.4);
  g.fillStyle = o.cloth || '#e9e2cf'; g.fillRect(x - 2, y - s * 0.46, w + 4, s * 0.04);
  // piles
  if (o.empty) return;
  const n = Math.floor(w / (s * 0.24));
  for (let p = 0; p < n; p++) {
    const px = x + s * 0.03 + p * s * 0.24, pw = s * 0.2, lay = 4 + Math.floor(r() * 5), lh = s * 0.05;
    for (let k = 0; k < lay; k++) {
      const py = y - s * 0.46 - (k + 1) * lh, ox = (r() - 0.5) * 3;
      g.save(); g.beginPath(); g.rect(px + ox, py, pw, lh); g.clip();
      g.drawImage(waxTile(p * 3 + k + (o.seed || 0)), px + ox - 8, py - 20 + k * 7, pw + 16, 64);
      g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(px + ox, py, pw, 2);
      g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(px + ox, py + lh - 2, pw, 2);
      g.restore();
      // bord plié : bande claire
      g.fillStyle = 'rgba(255,250,240,0.35)'; g.fillRect(px + ox, py + lh * 0.45, pw, 1);
    }
    if (r() < 0.4) { g.fillStyle = '#d8c7a0'; g.fillRect(px + 2, y - s * 0.46 - lay * lh - 8, pw * 0.5, 7); g.fillStyle = '#222'; g.fillRect(px + 5, y - s * 0.46 - lay * lh - 6, pw * 0.3, 2); }
  }
}
function basin(g, x, y, s, col) { g.fillStyle = shade(col, -0.3); g.beginPath(); g.ellipse(x, y, s, s * 0.3, 0, 0, TAU); g.fill(); g.fillStyle = col; g.beginPath(); g.moveTo(x - s, y); g.lineTo(x - s * 0.8, y - s * 0.6); g.lineTo(x + s * 0.8, y - s * 0.6); g.lineTo(x + s, y); g.fill(); g.fillStyle = shade(col, 0.2); g.beginPath(); g.ellipse(x, y - s * 0.6, s * 0.8, s * 0.22, 0, 0, TAU); g.fill(); }
function moto(g, x, y, s, col, rider, dir = 1) {
  g.save(); g.translate(x, y); g.scale(dir, 1);
  g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(0, 0, s * 0.7, s * 0.08, 0, 0, TAU); g.fill();
  for (const k of [-0.42, 0.42]) { g.fillStyle = '#1a1a1a'; g.beginPath(); g.arc(k * s, -s * 0.2, s * 0.2, 0, TAU); g.fill(); g.fillStyle = '#8a8a8a'; g.beginPath(); g.arc(k * s, -s * 0.2, s * 0.08, 0, TAU); g.fill(); }
  g.fillStyle = col; g.beginPath(); g.moveTo(-s * 0.5, -s * 0.35); g.lineTo(s * 0.1, -s * 0.4); g.lineTo(s * 0.35, -s * 0.62); g.lineTo(s * 0.5, -s * 0.6); g.lineTo(s * 0.4, -s * 0.3); g.lineTo(-s * 0.3, -s * 0.25); g.fill();
  g.fillStyle = '#222'; g.fillRect(-s * 0.45, -s * 0.47, s * 0.45, s * 0.08);
  g.strokeStyle = '#999'; g.lineWidth = s * 0.03; g.beginPath(); g.moveTo(s * 0.4, -s * 0.62); g.lineTo(s * 0.32, -s * 0.8); g.lineTo(s * 0.18, -s * 0.82); g.stroke();
  g.fillStyle = '#ddd'; g.beginPath(); g.arc(s * 0.45, -s * 0.5, s * 0.05, 0, TAU); g.fill();
  if (rider) {
    g.fillStyle = rider; g.beginPath(); g.roundRect(-s * 0.24, -s * 1.05, s * 0.3, s * 0.58, s * 0.08); g.fill();
    g.fillStyle = '#2c3442'; g.fillRect(-s * 0.2, -s * 0.5, s * 0.22, s * 0.3);
    g.fillStyle = '#3b2418'; g.beginPath(); g.arc(-s * 0.06, -s * 1.15, s * 0.1, 0, TAU); g.fill();
    g.fillStyle = '#f2c230'; g.beginPath(); g.arc(-s * 0.06, -s * 1.17, s * 0.11, Math.PI, 0); g.fill(); // casque jaune
    g.strokeStyle = rider; g.lineWidth = s * 0.08; g.beginPath(); g.moveTo(-s * 0.1, -s * 0.9); g.lineTo(s * 0.2, -s * 0.78); g.stroke();
    g.strokeStyle = '#3b2418'; g.lineWidth = s * 0.06; g.beginPath(); g.moveTo(s * 0.2, -s * 0.78); g.lineTo(s * 0.3, -s * 0.8); g.stroke();
  }
  g.restore();
}
function taxi(g, x, y, s, dir = 1) {
  g.save(); g.translate(x, y); g.scale(dir, 1);
  g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(0, 0, s * 1.05, s * 0.1, 0, 0, TAU); g.fill();
  const body = g.createLinearGradient(0, -s * 0.9, 0, 0); body.addColorStop(0, '#f6f0e4'); body.addColorStop(1, '#c9c0ad');
  g.fillStyle = body; g.beginPath(); g.moveTo(-s, -s * 0.2); g.lineTo(-s * 0.95, -s * 0.5); g.lineTo(-s * 0.55, -s * 0.55); g.lineTo(-s * 0.35, -s * 0.85); g.lineTo(s * 0.4, -s * 0.85); g.lineTo(s * 0.7, -s * 0.55); g.lineTo(s * 1.0, -s * 0.48); g.lineTo(s, -s * 0.2); g.closePath(); g.fill();
  g.fillStyle = '#e8b43a'; g.fillRect(-s * 0.95, -s * 0.46, s * 1.95, s * 0.1); // bande jaune des taxis de Lomé
  g.fillStyle = '#2a3340'; g.beginPath(); g.moveTo(-s * 0.5, -s * 0.56); g.lineTo(-s * 0.32, -s * 0.8); g.lineTo(s * 0.36, -s * 0.8); g.lineTo(s * 0.62, -s * 0.56); g.fill();
  g.fillStyle = '#1a1a1a'; for (const k of [-0.6, 0.6]) { g.beginPath(); g.arc(k * s, -s * 0.18, s * 0.2, 0, TAU); g.fill(); g.fillStyle = '#999'; g.beginPath(); g.arc(k * s, -s * 0.18, s * 0.08, 0, TAU); g.fill(); g.fillStyle = '#1a1a1a'; }
  g.fillStyle = '#e8b43a'; g.fillRect(-s * 0.15, -s * 0.98, s * 0.3, s * 0.12);
  g.restore();
}
function pushcart(g, x, y, s, loaded) {
  g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(x, y, s * 0.8, s * 0.08, 0, 0, TAU); g.fill();
  g.fillStyle = '#8a6440'; g.fillRect(x - s * 0.6, y - s * 0.42, s * 1.0, s * 0.08);
  g.fillStyle = '#6b4a2e'; for (let i = 0; i < 5; i++) g.fillRect(x - s * 0.58 + i * s * 0.2, y - s * 0.5, s * 0.16, s * 0.08);
  g.strokeStyle = '#6b4a2e'; g.lineWidth = s * 0.04; g.beginPath(); g.moveTo(x + s * 0.4, y - s * 0.38); g.lineTo(x + s * 0.95, y - s * 0.5); g.stroke();
  g.fillStyle = '#222'; g.beginPath(); g.arc(x - s * 0.15, y - s * 0.22, s * 0.22, 0, TAU); g.fill();
  g.strokeStyle = '#888'; g.lineWidth = s * 0.015; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; g.beginPath(); g.moveTo(x - s * 0.15, y - s * 0.22); g.lineTo(x - s * 0.15 + Math.cos(a) * s * 0.2, y - s * 0.22 + Math.sin(a) * s * 0.2); g.stroke(); }
  g.strokeStyle = '#2e7fd1'; g.lineWidth = s * 0.02; g.beginPath(); g.moveTo(x - s * 0.55, y - s * 0.42); g.quadraticCurveTo(x - s * 0.6, y - s * 0.2, x - s * 0.5, y - s * 0.1); g.stroke();
  if (loaded) { g.fillStyle = '#d9c9a8'; g.fillRect(x - s * 0.5, y - s * 0.72, s * 0.5, s * 0.3); g.fillStyle = '#b8a888'; g.fillRect(x - s * 0.5, y - s * 0.72, s * 0.5, s * 0.04); }
}
function passer(g, x, y, h, seed, frame = 0, load = false) {
  const r = rng(seed);
  const skin = SKIN[Math.floor(r() * SKIN.length)], top = CLOTH[Math.floor(r() * CLOTH.length)], bot = r() < 0.5 ? CLOTH[Math.floor(r() * CLOTH.length)] : '#2c3442';
  const woman = r() < 0.55, w = h * 0.26, step = Math.sin(frame) * h * 0.05;
  g.fillStyle = 'rgba(20,10,0,0.25)'; g.beginPath(); g.ellipse(x + h * 0.05, y, h * 0.14, h * 0.025, 0, 0, TAU); g.fill();
  g.fillStyle = bot;
  if (woman) { g.beginPath(); g.moveTo(x - w * 0.45, y - h * 0.46); g.lineTo(x - w * 0.4, y); g.lineTo(x + w * 0.4, y); g.lineTo(x + w * 0.45, y - h * 0.46); g.fill(); }
  else { g.fillRect(x - w * 0.38 + step * 0.3, y - h * 0.46, w * 0.33, h * 0.46); g.fillStyle = shade(bot, -0.2); g.fillRect(x + w * 0.05 - step * 0.3, y - h * 0.46, w * 0.33, h * 0.46); }
  const tg = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0); tg.addColorStop(0, shade(top, 0.15)); tg.addColorStop(1, shade(top, -0.3));
  g.fillStyle = tg; g.beginPath(); g.roundRect(x - w / 2, y - h * 0.8, w, h * 0.38, w * 0.2); g.fill();
  g.strokeStyle = skin; g.lineWidth = h * 0.05; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x - w * 0.45, y - h * 0.74); g.lineTo(x - w * 0.55 - step * 0.2, y - h * 0.45); g.stroke();
  g.beginPath(); g.moveTo(x + w * 0.45, y - h * 0.74); g.lineTo(x + w * 0.55 + step * 0.2, y - h * 0.45); g.stroke();
  g.fillStyle = skin; g.beginPath(); g.arc(x, y - h * 0.88, h * 0.075, 0, TAU); g.fill();
  g.fillStyle = '#120a06'; g.beginPath(); g.arc(x, y - h * 0.9, h * 0.075, Math.PI, 0); g.fill();
  if (woman && r() < 0.6) { g.fillStyle = CLOTH[Math.floor(r() * CLOTH.length)]; g.beginPath(); g.ellipse(x, y - h * 0.93, h * 0.09, h * 0.06, 0, Math.PI, 0); g.fill(); }
  if (load || (woman && r() < 0.35)) { basin(g, x, y - h * 0.96, h * 0.15, ['#c9ccc9', '#2e6fb5', '#d4472e', '#f2b134'][Math.floor(r() * 4)]); }
}
function road(g, w, y0, y1, r, o = {}) {
  const gg = g.createLinearGradient(0, y0, 0, y1); gg.addColorStop(0, o.light || '#7a756d'); gg.addColorStop(1, o.dark || '#4e4a44');
  g.fillStyle = gg; g.fillRect(0, y0, w, y1 - y0);
  for (let i = 0; i < 400; i++) { const y = y0 + r() * (y1 - y0); g.fillStyle = rgba(r() < 0.5 ? '#000000' : '#ffffff', 0.04 + r() * 0.05); g.fillRect(r() * w, y, 4 + r() * 30 * (y - y0) / (y1 - y0), 1 + (y - y0) / (y1 - y0) * 3); }
  // nids-de-poule, rapiéçages
  for (let i = 0; i < 4; i++) { const x = r() * w, y = lerp(y0, y1, 0.3 + r() * 0.6); g.fillStyle = 'rgba(30,25,20,0.45)'; g.beginPath(); g.ellipse(x, y, 20 + r() * 30, 6 + r() * 6, 0, 0, TAU); g.fill(); }
  if (o.center) { g.fillStyle = 'rgba(240,235,220,0.55)'; for (let i = 0; i < 10; i++) g.fillRect(w * 0.02 + i * w * 0.1, (y0 + y1) / 2, w * 0.05, 3); }
}
function sand(g, w, y0, y1, r, col1 = '#c9a77a', col2 = '#a8845a') {
  const gg = g.createLinearGradient(0, y0, 0, y1); gg.addColorStop(0, col1); gg.addColorStop(1, col2);
  g.fillStyle = gg; g.fillRect(0, y0, w, y1 - y0);
  for (let i = 0; i < 1200; i++) { const y = y0 + r() * (y1 - y0), k = (y - y0) / (y1 - y0); g.fillStyle = rgba(r() < 0.5 ? '#5a3a20' : '#f0dcb8', 0.08 + r() * 0.1); g.fillRect(r() * w, y, 1 + k * 5, 1 + k * 2); }
  // détritus légers, sachets
  for (let i = 0; i < 10; i++) { g.fillStyle = ['rgba(40,40,40,0.5)', 'rgba(240,240,240,0.6)', 'rgba(60,120,200,0.5)'][Math.floor(r() * 3)]; g.fillRect(r() * w, y0 + r() * (y1 - y0), 4 + r() * 6, 2 + r() * 3); }
}
function gutter(g, w, y) { g.fillStyle = '#8c877c'; g.fillRect(0, y, w, 10); g.fillStyle = 'rgba(0,0,0,0.35)'; for (let x = 0; x < w; x += 46) g.fillRect(x, y + 2, 2, 6); g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(0, y + 10, w, 3); }

// ------------------------------------------------------------------ lieux (fond)
export const SCENES = {
  etal(g, w, h) {
    const r = rng(11), hz = h * 0.55;
    sky(g, w, h, hz);
    // chantier du Grand marché : grande structure de béton brut, grue, échafaudages, palissade
    const bx = w * 0.17, bw = w * 0.66, bh = h * 0.38;
    plaster(g, bx, hz - bh, bw, bh, '#cfc8ba', r);
    g.fillStyle = '#b3ab9c'; for (let f = 0; f < 4; f++) g.fillRect(bx, hz - bh + f * bh * 0.25, bw, bh * 0.03);
    for (let c = 0; c < 13; c++) { g.fillStyle = '#8a8375'; g.fillRect(bx + c * bw * 0.083, hz - bh, bw * 0.012, bh); }
    for (let c = 0; c < 12; c++) for (let f = 0; f < 4; f++) { g.fillStyle = f === 3 ? '#4a4540' : 'rgba(40,40,45,0.5)'; g.fillRect(bx + bw * 0.016 + c * bw * 0.083, hz - bh * 0.96 + f * bh * 0.25, bw * 0.06, bh * 0.17); }
    // échafaudages et filets
    g.strokeStyle = '#c9c9c9'; g.lineWidth = 2; for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(bx + bw * 0.6 + i * bw * 0.045, hz); g.lineTo(bx + bw * 0.6 + i * bw * 0.045, hz - bh * 0.78); g.stroke(); }
    for (let f = 0; f < 5; f++) { g.beginPath(); g.moveTo(bx + bw * 0.6, hz - f * bh * 0.19); g.lineTo(bx + bw * 0.96, hz - f * bh * 0.19); g.stroke(); }
    g.fillStyle = 'rgba(40,120,80,0.35)'; g.fillRect(bx + bw * 0.6, hz - bh * 0.78, bw * 0.36, bh * 0.6);
    // grue
    g.strokeStyle = '#e0a021'; g.lineWidth = 7; g.beginPath(); g.moveTo(w * 0.7, hz - bh); g.lineTo(w * 0.7, hz - h * 0.66); g.stroke();
    g.lineWidth = 5; g.beginPath(); g.moveTo(w * 0.3, hz - h * 0.63); g.lineTo(w * 0.82, hz - h * 0.64); g.stroke();
    g.lineWidth = 1.5; for (let i = 0; i < 14; i++) { g.beginPath(); g.moveTo(w * 0.3 + i * w * 0.037, hz - h * 0.63); g.lineTo(w * 0.3 + (i + 0.5) * w * 0.037, hz - h * 0.65); g.lineTo(w * 0.3 + (i + 1) * w * 0.037, hz - h * 0.63); g.stroke(); }
    g.beginPath(); g.moveTo(w * 0.7, hz - h * 0.66); g.lineTo(w * 0.3, hz - h * 0.63); g.moveTo(w * 0.7, hz - h * 0.66); g.lineTo(w * 0.82, hz - h * 0.64); g.stroke();
    g.beginPath(); g.moveTo(w * 0.42, hz - h * 0.63); g.lineTo(w * 0.42, hz - h * 0.47); g.stroke(); g.fillStyle = '#777'; g.fillRect(w * 0.405, hz - h * 0.47, w * 0.03, h * 0.03);
    // palissade de tôle bleue avec affiches
    g.fillStyle = '#2a63a8'; g.fillRect(0, hz - h * 0.075, w, h * 0.075);
    g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 1; for (let i = 0; i < w; i += 14) { g.beginPath(); g.moveTo(i, hz - h * 0.075); g.lineTo(i, hz); g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(0, hz - h * 0.075, w, 3);
    g.fillStyle = '#f4efe4'; g.font = `800 ${Math.round(h * 0.022)}px 'Archivo', sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('CHANTIER · RECONSTRUCTION DU GRAND MARCHÉ', w * 0.5, hz - h * 0.038);
    for (let i = 0; i < 5; i++) { const px = w * (0.05 + i * 0.22); g.fillStyle = ['#f2b134', '#f4efe4', '#d4472e'][i % 3]; g.fillRect(px, hz - h * 0.068, w * 0.06, h * 0.05); g.fillStyle = '#222'; g.fillRect(px + 6, hz - h * 0.06, w * 0.04, 3); g.fillRect(px + 6, hz - h * 0.05, w * 0.03, 3); }
    // façades de la rue du Commerce
    facade(g, -w * 0.02, hz + h * 0.02, w * 0.2, h * 0.36, '#e2c48f', r, { floors: 2, sign: 'ALIMENTATION', signSub: 'GÉNÉRALE', signFg: '#a0261b', balcony: true, ac: true });
    facade(g, w * 0.84, hz + h * 0.02, w * 0.2, h * 0.4, '#d9a7a0', r, { floors: 3, sign: 'TISSUS', signSub: 'WAX · BAZIN · BRODERIE', signFg: '#1f3f7a', awning: 'cloth', awningC: '#1f5aa8', dish: true });
    pole(g, w * 0.2, hz + h * 0.02, h * 0.42); pole(g, w * 0.82, hz + h * 0.02, h * 0.42); wires(g, w * 0.2, w * 0.82, hz - h * 0.4, 18);
    sand(g, w, hz, h, r);
    gutter(g, w, hz + h * 0.01);
    // traces de roues étroites dans le sable
    g.strokeStyle = 'rgba(70,45,25,0.5)'; g.lineWidth = 3.5;
    for (const off of [0, 16]) { g.beginPath(); g.moveTo(w * 0.33 + off, h * 0.99); g.bezierCurveTo(w * 0.36 + off, h * 0.88, w * 0.42 + off, h * 0.84, w * 0.46 + off, h * 0.8); g.stroke(); }
    g.strokeStyle = 'rgba(255,230,200,0.35)'; g.lineWidth = 1.2; for (const off of [-2, 14]) { g.beginPath(); g.moveTo(w * 0.33 + off, h * 0.99); g.bezierCurveTo(w * 0.36 + off, h * 0.88, w * 0.42 + off, h * 0.84, w * 0.46 + off, h * 0.8); g.stroke(); }
    g.strokeStyle = '#2e7fd1'; g.lineWidth = 3; g.beginPath(); g.moveTo(w * 0.575, h * 0.79); g.quadraticCurveTo(w * 0.59, h * 0.76, w * 0.6, h * 0.79); g.stroke();
  },

  poisson(g, w, h) {
    const r = rng(23), hz = h * 0.52;
    sky(g, w, h, hz);
    facade(g, -w * 0.02, hz + h * 0.02, w * 0.36, h * 0.42, '#cfd8c4', r, { floors: 3, sign: 'PHARMACIE', signSub: 'DU MARCHÉ', signBg: '#1f8a5c', signFg: '#ffffff', balcony: true, ac: true });
    facade(g, w * 0.34, hz + h * 0.02, w * 0.34, h * 0.36, '#e8cf9a', r, { floors: 2, sign: 'QUINCAILLERIE', signFg: '#2b2b30', awning: 'cloth', awningC: '#f08a24' });
    facade(g, w * 0.68, hz + h * 0.02, w * 0.36, h * 0.46, '#d7b7c9', r, { floors: 3, dish: true, balcony: true, sign: 'COUTURE', signSub: 'HOMMES · DAMES', signFg: '#7b3fa0' });
    pole(g, w * 0.33, hz + h * 0.02, h * 0.46); wires(g, -20, w * 0.33, hz - h * 0.44, 16); wires(g, w * 0.33, w + 20, hz - h * 0.44, 20);
    sand(g, w, hz, h, r, '#bf9d70', '#94734c');
    gutter(g, w, hz + h * 0.01);
    // bassines, balance, caisses
    basin(g, w * 0.12, h * 0.9, h * 0.06, '#c9ccc9'); basin(g, w * 0.2, h * 0.93, h * 0.07, '#2e6fb5');
    g.fillStyle = '#8a6a3c'; g.fillRect(w * 0.9, h * 0.8, w * 0.07, h * 0.1); g.fillStyle = '#6a4a2a'; for (let i = 0; i < 4; i++) g.fillRect(w * 0.9, h * 0.8 + i * h * 0.025, w * 0.07, 2);
  },

  carrefour(g, w, h) {
    const r = rng(37), hz = h * 0.56;
    sky(g, w, h, hz);
    // cathédrale du Sacré-Cœur (silhouette approchée : nef claire, deux tours à flèches sombres, rosace)
    const cx = w * 0.24, base = hz + h * 0.01;
    plaster(g, cx - w * 0.13, base - h * 0.32, w * 0.26, h * 0.32, '#efe4cf', r);
    for (const k of [-1, 1]) {
      const tx = cx + k * w * 0.085;
      plaster(g, tx - w * 0.032, base - h * 0.5, w * 0.064, h * 0.5, '#e8dcc2', r);
      g.fillStyle = '#4e5257'; g.beginPath(); g.moveTo(tx - w * 0.038, base - h * 0.5); g.lineTo(tx, base - h * 0.72); g.lineTo(tx + w * 0.038, base - h * 0.5); g.fill();
      g.fillStyle = '#33373c'; g.beginPath(); g.moveTo(tx, base - h * 0.72); g.lineTo(tx + w * 0.038, base - h * 0.5); g.lineTo(tx + w * 0.012, base - h * 0.5); g.fill();
      g.strokeStyle = '#c9b48f'; g.lineWidth = 2; g.beginPath(); g.moveTo(tx, base - h * 0.76); g.lineTo(tx, base - h * 0.71); g.moveTo(tx - 6, base - h * 0.745); g.lineTo(tx + 6, base - h * 0.745); g.stroke();
      for (let f = 0; f < 3; f++) { g.fillStyle = '#4a3a2c'; g.beginPath(); g.arc(tx, base - h * (0.4 - f * 0.1), w * 0.011, Math.PI, 0); g.fill(); g.fillRect(tx - w * 0.011, base - h * (0.4 - f * 0.1), w * 0.022, h * 0.05); g.fillStyle = 'rgba(0,0,0,0.4)'; for (let s = 0; s < 4; s++) g.fillRect(tx - w * 0.011, base - h * (0.4 - f * 0.1) + s * h * 0.012, w * 0.022, 2); }
    }
    g.fillStyle = '#4e5257'; g.beginPath(); g.moveTo(cx - w * 0.05, base - h * 0.32); g.lineTo(cx, base - h * 0.41); g.lineTo(cx + w * 0.05, base - h * 0.32); g.fill();
    g.strokeStyle = '#8a7a60'; g.lineWidth = 3; g.beginPath(); g.arc(cx, base - h * 0.22, w * 0.024, 0, TAU); g.stroke(); g.lineWidth = 1.5; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; g.beginPath(); g.moveTo(cx, base - h * 0.22); g.lineTo(cx + Math.cos(a) * w * 0.024, base - h * 0.22 + Math.sin(a) * w * 0.024); g.stroke(); }
    g.fillStyle = '#4a3a2c'; g.beginPath(); g.arc(cx, base - h * 0.1, w * 0.028, Math.PI, 0); g.fill(); g.fillRect(cx - w * 0.028, base - h * 0.1, w * 0.056, h * 0.1);
    g.fillStyle = '#d8ccb0'; for (let i = 0; i < 4; i++) g.fillRect(cx - w * 0.07 - i * 4, base - 4 - i * 4, w * 0.14 + i * 8, 4);
    facade(g, w * 0.45, hz + h * 0.02, w * 0.28, h * 0.36, '#f0d6a0', r, { floors: 2, sign: 'BAR LE CARREFOUR', signSub: 'BIÈRE BIEN FRAÎCHE', signFg: '#a0261b', awning: 'cloth', awningC: '#d4472e', balcony: true });
    facade(g, w * 0.73, hz + h * 0.02, w * 0.3, h * 0.4, '#bcd3d9', r, { floors: 3, ac: true, dish: true, sign: 'PRESSING', signFg: '#1f5aa8' });
    pole(g, w * 0.44, hz + h * 0.02, h * 0.44); wires(g, w * 0.1, w * 0.44, hz - h * 0.42, 20); wires(g, w * 0.44, w, hz - h * 0.42, 24);
    road(g, w, hz, h * 0.86, r, { center: true });
    sand(g, w, h * 0.86, h, r);
    gutter(g, w, h * 0.85);
    // feu tricolore, panneau
    g.fillStyle = '#333'; g.fillRect(w * 0.62, hz - h * 0.2, 5, h * 0.21); g.fillRect(w * 0.6, hz - h * 0.2, 14, h * 0.07);
    g.fillStyle = '#c62828'; g.beginPath(); g.arc(w * 0.605 + 7, hz - h * 0.19 + 6, 4, 0, TAU); g.fill(); g.fillStyle = '#2e7d32'; g.beginPath(); g.arc(w * 0.605 + 7, hz - h * 0.14, 4, 0, TAU); g.fill();
    // manguier des pousseurs
    tree(g, w * 0.88, hz + h * 0.02, h * 0.42, r);
  },

  kiosque(g, w, h) {
    const r = rng(41), hz = h * 0.55;
    sky(g, w, h, hz);
    facade(g, -w * 0.02, hz + h * 0.02, w * 0.3, h * 0.38, '#e3d3b0', r, { floors: 2, sign: 'COIFFURE', signSub: 'TRESSES · DÉFRISAGE', signFg: '#7b3fa0', awning: 'cloth', awningC: '#7b3fa0', balcony: true });
    facade(g, w * 0.27, hz + h * 0.02, w * 0.5, h * 0.34, '#d9c7a8', r, { floors: 2, shutter: '#8a4a3a', ac: true });
    facade(g, w * 0.76, hz + h * 0.02, w * 0.28, h * 0.42, '#cfe0c6', r, { floors: 3, dish: true, sign: 'CYBER', signSub: 'PHOTOCOPIE · IMPRESSION', signFg: '#1f8a5c' });
    pole(g, w * 0.26, hz + h * 0.02, h * 0.4); pole(g, w * 0.77, hz + h * 0.02, h * 0.4); wires(g, w * 0.26, w * 0.77, hz - h * 0.38, 16);
    sand(g, w, hz, h, r, '#c4a275', '#9a7850');
    gutter(g, w, hz + h * 0.01);
    tree(g, w * 0.08, hz + h * 0.08, h * 0.3, r, 'neem');
  },

  hotel(g, w, h) {
    const r = rng(53), hz = h * 0.42;
    sky(g, w, h, hz);
    // mer, peinte en bandes (les vagues s'animent par-dessus)
    const sg = g.createLinearGradient(0, hz, 0, h * 0.62); sg.addColorStop(0, '#1f5f8e'); sg.addColorStop(0.5, '#2c7faa'); sg.addColorStop(1, '#58b0c9');
    g.fillStyle = sg; g.fillRect(0, hz, w, h * 0.22);
    for (const px of [0.2, 0.62]) { g.fillStyle = '#5a3a20'; g.beginPath(); g.moveTo(w * px, hz + h * 0.06); g.quadraticCurveTo(w * px + 30, hz + h * 0.075, w * px + 60, hz + h * 0.06); g.lineTo(w * px + 52, hz + h * 0.07); g.lineTo(w * px + 8, hz + h * 0.07); g.fill(); g.fillStyle = '#f2b134'; g.fillRect(w * px + 20, hz + h * 0.045, 4, h * 0.02); }
    sand(g, w, h * 0.62, h * 0.72, r, '#efe0bd', '#d8c39a');
    road(g, w, h * 0.72, h * 0.8, r, { center: true });
    // terrasse carrelée
    for (let i = 0; i < 16; i++) for (let j = 0; j < 4; j++) { g.fillStyle = (i + j) % 2 ? '#cfc5b4' : '#e0d8ca'; g.fillRect(i * w / 16, h * 0.8 + j * h * 0.05, w / 16, h * 0.05); }
    g.fillStyle = 'rgba(0,0,0,0.08)'; for (let j = 0; j < 4; j++) g.fillRect(0, h * 0.8 + j * h * 0.05, w, 1);
    // hôtel : façade blanche, balcons, auvent, enseigne
    plaster(g, w * 0.68, h * 0.14, w * 0.34, h * 0.66, '#f2ece0', r);
    for (let f = 0; f < 5; f++) for (let k = 0; k < 4; k++) {
      const wx = w * 0.7 + k * w * 0.078, wy = h * 0.18 + f * h * 0.105;
      g.fillStyle = '#6f9fbd'; g.fillRect(wx, wy, w * 0.052, h * 0.065); g.fillStyle = 'rgba(255,255,255,0.4)'; g.fillRect(wx, wy, w * 0.015, h * 0.065);
      g.strokeStyle = '#3a3a3a'; g.lineWidth = 1.2; for (let b = 0; b <= 6; b++) { g.beginPath(); g.moveTo(wx - 4 + b * (w * 0.06 / 6), wy + h * 0.065); g.lineTo(wx - 4 + b * (w * 0.06 / 6), wy + h * 0.04); g.stroke(); }
      g.fillStyle = '#e6dfd0'; g.fillRect(wx - 6, wy + h * 0.065, w * 0.064, 4);
    }
    g.fillStyle = '#1d3f6e'; g.fillRect(w * 0.68, h * 0.72, w * 0.34, h * 0.06);
    g.fillStyle = '#fff'; g.font = `700 ${Math.round(h * 0.03)}px 'DM Serif Display', serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('HÔTEL DU FRONT DE MER', w * 0.85, h * 0.75);
    g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(w * 0.68, h * 0.78, w * 0.34, 8);
    // chaises en plastique blanches autour d'une table
    const chair = (x, y, s) => { g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(x + s * 0.3, y, s * 0.6, s * 0.1, 0, 0, TAU); g.fill(); const cg = g.createLinearGradient(x - s * 0.4, 0, x + s * 0.4, 0); cg.addColorStop(0, '#ffffff'); cg.addColorStop(1, '#cfc8b8'); g.fillStyle = cg; g.beginPath(); g.roundRect(x - s * 0.4, y - s * 0.55, s * 0.8, s * 0.12, s * 0.04); g.fill(); g.beginPath(); g.roundRect(x - s * 0.38, y - s * 1.15, s * 0.6, s * 0.62, s * 0.08); g.fill(); g.fillStyle = 'rgba(0,0,0,0.12)'; for (let i = 0; i < 4; i++) g.fillRect(x - s * 0.3 + i * s * 0.14, y - s * 1.05, s * 0.03, s * 0.45); g.fillStyle = '#e6e0d2'; for (const k of [-0.36, 0.3]) g.fillRect(x + k * s, y - s * 0.45, s * 0.05, s * 0.45); };
    g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(w * 0.5, h * 0.9, w * 0.05, h * 0.02, 0, 0, TAU); g.fill(); g.fillRect(w * 0.497, h * 0.9, w * 0.006, h * 0.07);
    chair(w * 0.44, h * 0.96, h * 0.1); chair(w * 0.57, h * 0.95, h * 0.1);
  },

  gare(g, w, h) {
    const r = rng(67), hz = h * 0.5;
    sky(g, w, h, hz);
    facade(g, -w * 0.02, hz + h * 0.02, w * 0.26, h * 0.32, '#e8d4a8', r, { floors: 2, sign: 'BUVETTE', signSub: 'LA ROUTIÈRE', signFg: '#a0261b', awning: 'cloth', awningC: '#1f8a5c' });
    // hangar de la gare : toit de tôle sur poteaux, guichet
    g.fillStyle = '#8f8a80'; g.beginPath(); g.moveTo(w * 0.24, hz - h * 0.22); g.lineTo(w * 1.02, hz - h * 0.26); g.lineTo(w * 1.02, hz - h * 0.2); g.lineTo(w * 0.24, hz - h * 0.16); g.fill();
    g.strokeStyle = 'rgba(80,50,30,0.4)'; for (let i = 0; i < 60; i++) { g.beginPath(); g.moveTo(w * 0.24 + i * w * 0.013, hz - h * 0.22); g.lineTo(w * 0.24 + i * w * 0.013, hz - h * 0.16); g.stroke(); }
    g.fillStyle = '#5a5248'; for (let i = 0; i < 7; i++) g.fillRect(w * (0.26 + i * 0.12), hz - h * 0.18, 8, h * 0.2);
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(w * 0.24, hz - h * 0.16, w * 0.78, h * 0.18);
    paintedSign(g, w * 0.28, hz - h * 0.31, w * 0.46, h * 0.08, 'GARE ROUTIÈRE', '#f4efe4', '#1d3f6e', 'DÉPARTS COTONOU · LAGOS');
    // cars : grands bus avec bagages sur le toit
    const bus = (x, y, s, col, dest) => {
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x - s * 0.1, y - s * 0.03, s * 2.3, s * 0.08);
      const bg = g.createLinearGradient(0, y - s * 0.9, 0, y); bg.addColorStop(0, shade(col, 0.2)); bg.addColorStop(0.5, col); bg.addColorStop(1, shade(col, -0.35));
      g.fillStyle = bg; g.beginPath(); g.roundRect(x, y - s * 0.85, s * 2.1, s * 0.78, s * 0.08); g.fill();
      g.fillStyle = '#2a3340'; for (let i = 0; i < 6; i++) g.fillRect(x + s * 0.12 + i * s * 0.33, y - s * 0.75, s * 0.26, s * 0.3);
      g.fillStyle = 'rgba(255,255,255,0.25)'; for (let i = 0; i < 6; i++) g.fillRect(x + s * 0.12 + i * s * 0.33, y - s * 0.75, s * 0.06, s * 0.3);
      g.fillStyle = '#1a1a1a'; for (const k of [0.35, 1.7]) { g.beginPath(); g.arc(x + s * k, y - s * 0.02, s * 0.14, 0, TAU); g.fill(); g.fillStyle = '#999'; g.beginPath(); g.arc(x + s * k, y - s * 0.02, s * 0.06, 0, TAU); g.fill(); g.fillStyle = '#1a1a1a'; }
      // bagages sur le toit, sous une bâche et des cordes
      for (let i = 0; i < 9; i++) { g.fillStyle = ['#d9c9a8', '#2e6fb5', '#c2401f', '#444', '#f2b134'][i % 5]; g.fillRect(x + s * 0.1 + i * s * 0.21, y - s * (0.92 + (i % 3) * 0.05), s * 0.2, s * (0.08 + (i % 3) * 0.05)); }
      g.strokeStyle = '#333'; g.lineWidth = 1.5; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(x + s * 0.1 + i * s * 0.45, y - s * 1.05); g.lineTo(x + s * 0.2 + i * s * 0.45, y - s * 0.85); g.stroke(); }
      g.fillStyle = '#f4efe4'; g.fillRect(x + s * 0.3, y - s * 0.6, s * 0.7, s * 0.1); g.fillStyle = '#1d3f6e'; g.font = `800 ${Math.round(s * 0.08)}px 'Archivo', sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(dest, x + s * 0.65, y - s * 0.55);
    };
    bus(w * 0.3, hz + h * 0.12, h * 0.26, '#2f6db0', 'COTONOU');
    bus(w * 0.68, hz + h * 0.1, h * 0.24, '#d4472e', 'LAGOS');
    sand(g, w, hz, h, r, '#bfa072', '#937049');
    // sacs, bidons, bagages au sol
    for (let i = 0; i < 8; i++) { const x = w * (0.1 + r() * 0.8), y = h * (0.86 + r() * 0.1), s = h * 0.03; g.fillStyle = ['#d9c9a8', '#f2b134', '#2e6fb5', '#444'][i % 4]; g.fillRect(x, y - s, s * 1.4, s); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x, y - 2, s * 1.4, 3); }
  },
};

// ------------------------------------------------------------------ calque avant
export const FRONT = {
  etal(g, w, h) {
    const r = rng(12), hz = h * 0.55;
    pagneStall(g, w * 0.01, hz + h * 0.2, w * 0.2, h * 0.32, r, { seed: 2 });
    parasol(g, w * 0.11, hz + h * 0.2, h * 0.34, '#d4472e', '#f4efe4');
    pagneStall(g, w * 0.78, hz + h * 0.21, w * 0.21, h * 0.32, r, { seed: 5 });
    parasol(g, w * 0.88, hz + h * 0.21, h * 0.35, '#1f8a5c', '#f2b134');
    pagneStall(g, w * 0.3, hz + h * 0.27, w * 0.4, h * 0.4, r, { seed: 0, cloth: '#f2b134' });
    parasol(g, w * 0.5, hz + h * 0.27, h * 0.46, '#f2b134', '#1f5aa8');
    g.fillStyle = 'rgba(255,245,220,0.35)'; g.fillRect(w * 0.55, hz + h * 0.27 - h * 0.4 * 0.46 - h * 0.012, w * 0.1, h * 0.012);
    g.strokeStyle = 'rgba(40,25,10,0.4)'; g.lineWidth = 1.5; g.strokeRect(w * 0.55, hz + h * 0.27 - h * 0.4 * 0.46 - h * 0.012, w * 0.1, h * 0.012);
  },
  poisson(g, w, h) {
    const hz = h * 0.52;
    for (const [fx, fs] of [[0.3, 1], [0.58, 0.92], [0.82, 0.82]]) {
      const x = w * fx, y = h * (0.86 - (1 - fs) * 0.2), s = h * 0.34 * fs;
      g.fillStyle = 'rgba(20,10,0,0.3)'; g.beginPath(); g.ellipse(x + s * 0.3, y + s * 0.02, s * 0.9, s * 0.14, 0, 0, TAU); g.fill();
      // foyer en banco (terre), noirci
      const fg = g.createLinearGradient(x - s * 0.6, 0, x + s * 0.6, 0); fg.addColorStop(0, '#9a5e38'); fg.addColorStop(0.6, '#7a4a2a'); fg.addColorStop(1, '#4a2c18');
      g.fillStyle = fg; g.beginPath(); g.moveTo(x - s * 0.6, y); g.lineTo(x - s * 0.55, y - s * 0.42); g.lineTo(x + s * 0.55, y - s * 0.42); g.lineTo(x + s * 0.6, y); g.fill();
      g.fillStyle = 'rgba(0,0,0,0.45)'; g.beginPath(); g.ellipse(x, y - s * 0.22, s * 0.3, s * 0.14, 0, 0, TAU); g.fill();
      const bg = g.createRadialGradient(x, y - s * 0.2, 0, x, y - s * 0.2, s * 0.26); bg.addColorStop(0, 'rgba(255,140,40,0.95)'); bg.addColorStop(0.5, 'rgba(230,80,20,0.6)'); bg.addColorStop(1, 'rgba(200,60,20,0)');
      g.fillStyle = bg; g.beginPath(); g.ellipse(x, y - s * 0.2, s * 0.26, s * 0.1, 0, 0, TAU); g.fill();
      // claie en bois et poissons fumés dorés
      g.fillStyle = '#6b4a2e'; g.fillRect(x - s * 0.64, y - s * 0.47, s * 1.28, s * 0.05);
      g.strokeStyle = '#8a6a3c'; g.lineWidth = 2; for (let i = 0; i < 10; i++) { g.beginPath(); g.moveTo(x - s * 0.6 + i * s * 0.13, y - s * 0.47); g.lineTo(x - s * 0.6 + i * s * 0.13, y - s * 0.68); g.stroke(); }
      for (let i = 0; i < 9; i++) for (let j = 0; j < 2; j++) {
        const px = x - s * 0.55 + i * s * 0.13 + j * s * 0.03, py = y - s * 0.52 - j * s * 0.06;
        const fgr = g.createLinearGradient(px, py - s * 0.03, px + s * 0.11, py + s * 0.03); fgr.addColorStop(0, '#e0a040'); fgr.addColorStop(0.6, '#b8722a'); fgr.addColorStop(1, '#6a3e14');
        g.fillStyle = fgr; g.beginPath(); g.ellipse(px + s * 0.055, py, s * 0.06, s * 0.02, 0.15, 0, TAU); g.fill();
        g.fillStyle = '#4a2a10'; g.beginPath(); g.moveTo(px + s * 0.11, py); g.lineTo(px + s * 0.135, py - s * 0.018); g.lineTo(px + s * 0.135, py + s * 0.018); g.fill();
        g.fillStyle = '#1a0a05'; g.beginPath(); g.arc(px + s * 0.02, py - s * 0.004, s * 0.005, 0, TAU); g.fill();
      }
    }
    parasol(g, w * 0.14, hz + h * 0.3, h * 0.3, '#2e6fb5', '#f4efe4');
  },
  carrefour(g, w, h) {
    for (let i = 0; i < 5; i++) moto(g, w * (0.06 + i * 0.075), h * 0.9, h * 0.15, ['#b71c1c', '#1a1a1a', '#0d47a1', '#5d4037', '#424242'][i], i % 2 ? '#3d6b9e' : null);
    pushcart(g, w * 0.64, h * 0.95, h * 0.22, false);
    pushcart(g, w * 0.93, h * 0.97, h * 0.2, true);
  },
  kiosque(g, w, h) {
    const kx = w * 0.32, kw = w * 0.42, ky = h * 0.86, kh = h * 0.5;
    g.fillStyle = 'rgba(20,10,0,0.3)'; g.fillRect(kx + 10, ky - 6, kw + 30, 14);
    const kg = g.createLinearGradient(kx, 0, kx + kw, 0); kg.addColorStop(0, '#f2c23a'); kg.addColorStop(1, '#c9931a');
    g.fillStyle = kg; g.fillRect(kx, ky - kh, kw, kh);
    g.strokeStyle = 'rgba(0,0,0,0.15)'; for (let i = 0; i < kw; i += 10) { g.beginPath(); g.moveTo(kx + i, ky - kh); g.lineTo(kx + i, ky); g.stroke(); }
    g.fillStyle = 'rgba(120,60,20,0.3)'; for (let i = 0; i < 8; i++) g.fillRect(kx + (i * 97) % kw, ky - kh * 0.3 + (i * 31) % (kh * 0.3), 10, 14);
    g.fillStyle = '#1d3f6e'; g.fillRect(kx, ky - kh, kw, kh * 0.18);
    g.fillStyle = '#ffffff'; g.font = `800 ${Math.round(h * 0.04)}px 'Archivo', sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('MOBILE MONEY · RECHARGES', kx + kw / 2, ky - kh * 0.91);
    // comptoir grillagé, intérieur avec étagères et le gérant (dessiné par main.js derrière)
    g.fillStyle = '#2a1d14'; g.fillRect(kx + kw * 0.08, ky - kh * 0.72, kw * 0.55, kh * 0.42);
    g.fillStyle = '#5a4330'; for (let s = 0; s < 3; s++) g.fillRect(kx + kw * 0.1, ky - kh * (0.7 - s * 0.12), kw * 0.5, 3);
    g.fillStyle = '#f4efe4'; for (let i = 0; i < 12; i++) { g.fillStyle = ['#f4efe4', '#2e7d32', '#c62828', '#1f5aa8'][i % 4]; g.fillRect(kx + kw * 0.12 + (i % 6) * kw * 0.08, ky - kh * (0.74 - Math.floor(i / 6) * 0.12), kw * 0.05, kh * 0.04); }
  },
  kiosque_front(g, w, h) {
    const kx = w * 0.32, kw = w * 0.42, ky = h * 0.86, kh = h * 0.5;
    g.strokeStyle = 'rgba(200,200,200,0.9)'; g.lineWidth = 1.5; for (let i = 0; i < 16; i++) { g.beginPath(); g.moveTo(kx + kw * 0.08 + i * kw * 0.035, ky - kh * 0.72); g.lineTo(kx + kw * 0.08 + i * kw * 0.035, ky - kh * 0.3); g.stroke(); }
    for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(kx + kw * 0.08, ky - kh * 0.72 + i * kh * 0.08); g.lineTo(kx + kw * 0.63, ky - kh * 0.72 + i * kh * 0.08); g.stroke(); }
    g.fillStyle = '#8a6440'; g.fillRect(kx + kw * 0.05, ky - kh * 0.3, kw * 0.62, kh * 0.05); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(kx + kw * 0.05, ky - kh * 0.25, kw * 0.62, 4);
    for (const [ax, ay, c, t] of [[0.72, 0.6, '#c62828', 'PARIS'], [0.86, 0.58, '#ffffff', 'TARIFS'], [0.79, 0.42, '#2e7d32', 'RETRAIT']]) {
      g.fillStyle = c; g.fillRect(kx + kw * ax - kw * 0.06, ky - kh * ay, kw * 0.12, kh * 0.14);
      g.fillStyle = c === '#ffffff' ? '#1d3f6e' : '#ffffff'; g.font = `800 ${Math.round(h * 0.018)}px 'Archivo', sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, kx + kw * ax, ky - kh * (ay - 0.07));
    }
    parasol(g, w * 0.86, h * 0.88, h * 0.3, '#d4472e', '#f2b134');
  },
  hotel(g, w, h) { parasol(g, w * 0.5, h * 0.92, h * 0.28, '#f4efe4', '#1d3f6e'); },
  gare(g, w, h) { const r = rng(5); for (let i = 0; i < 6; i++) { const x = w * (0.05 + i * 0.17), y = h * (0.95 + (i % 2) * 0.02), s = h * 0.05; g.fillStyle = ['#d9c9a8', '#f2b134', '#2e6fb5', '#444', '#c2401f', '#e9e2cf'][i]; g.fillRect(x, y - s, s * 1.5, s); g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(x, y - s, s * 1.5, 3); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x, y - 3, s * 1.5, 3); void r; } },
};

// Position des personnages par lieu : [x relatif, échelle]
export const STAGE = {
  etal: { dada: [0.5, 1.0], mawuli: [0.74, 0.96] },
  poisson: { sena: [0.46, 1.0] },
  carrefour: { kodjo: [0.42, 0.96], komi: [0.76, 1.0] },
  kiosque: { ayaovi: [0.46, 0.86] },
  hotel: { dossou: [0.36, 1.0] },
  gare: { dossou: [0.52, 1.0], komi: [0.2, 0.96] },
};
// Lieux où un calque passe devant le personnage (le comptoir du kiosque)
export const OVER = { kiosque: 'kiosque_front' };

const cacheBG = new Map(), cacheFG = new Map();
export function background(loc, w, h) {
  const k = `${loc}|${w}x${h}`;
  if (!cacheBG.has(k)) { const c = canvas(w, h), g = c.getContext('2d'); SCENES[loc](g, w, h); g.drawImage(grain(), 0, 0, w, h); cacheBG.set(k, c); }
  return cacheBG.get(k);
}
export function foreground(key, w, h) {
  if (!FRONT[key]) return null;
  const k = `${key}|${w}x${h}`;
  if (!cacheFG.has(k)) { const c = canvas(w, h); FRONT[key](c.getContext('2d'), w, h); cacheFG.set(k, c); }
  return cacheFG.get(k);
}

// ------------------------------------------------------------------ animation
export function crowd(loc, w, h) {
  const r = rng(loc.length * 97);
  const n = loc === 'hotel' ? 4 : loc === 'gare' ? 16 : 12;
  const list = Array.from({ length: n }, (_, i) => ({ x: r() * w, y: loc === 'hotel' ? h * (0.78 + r() * 0.02) : loc === 'gare' ? h * (0.72 + r() * 0.1) : h * (0.6 + r() * 0.05), hgt: h * (0.15 + r() * 0.04), v: (r() < 0.5 ? -1 : 1) * (10 + r() * 28), seed: 900 + i, load: r() < 0.3 }));
  return { list, vehicles: [], smoke: [], next: 1 + r() * 3, loc };
}
export function drawCrowd(g, C, w, h, dt, t) {
  for (const p of C.list) { p.x += p.v * dt; if (p.x < -60) p.x = w + 60; if (p.x > w + 60) p.x = -60; passer(g, p.x, p.y, p.hgt, p.seed, t * 6 + p.seed, p.load); }
  // véhicules qui passent (sur la route des lieux qui en ont une)
  const roads = { carrefour: [h * 0.7, h * 0.82], hotel: [h * 0.745, h * 0.79], etal: [h * 0.62, h * 0.66], kiosque: [h * 0.62, h * 0.66], gare: [h * 0.6, h * 0.64] };
  const R = roads[C.loc];
  if (R) {
    C.next -= dt;
    if (C.next <= 0) { C.next = 2 + Math.random() * 5; const dir = Math.random() < 0.5 ? 1 : -1; const kind = Math.random() < 0.65 ? 'moto' : 'taxi'; C.vehicles.push({ kind, dir, x: dir > 0 ? -120 : w + 120, y: lerp(R[0], R[1], Math.random()), v: (kind === 'moto' ? 180 : 130) * (0.8 + Math.random() * 0.5), col: ['#b71c1c', '#0d47a1', '#1a1a1a', '#5d4037'][Math.floor(Math.random() * 4)] }); }
    for (const v of C.vehicles) { v.x += v.v * v.dir * dt; const s = h * (C.loc === 'carrefour' ? 0.17 : 0.11) * (0.8 + (v.y - R[0]) / (R[1] - R[0]) * 0.4); if (v.kind === 'moto') moto(g, v.x, v.y, s, v.col, '#3d6b9e', v.dir); else taxi(g, v.x, v.y, s, v.dir); }
    C.vehicles = C.vehicles.filter(v => v.x > -200 && v.x < w + 200);
  }
  // fumée des foyers
  if (C.loc === 'poisson') {
    for (const [fx, fs] of [[0.3, 1], [0.58, 0.92], [0.82, 0.82]]) if (Math.random() < 0.5) C.smoke.push({ x: w * fx + (Math.random() - 0.5) * h * 0.08, y: h * (0.86 - (1 - fs) * 0.2) - h * 0.34 * fs * 0.6, r: h * 0.012, life: 0, max: 3 + Math.random() * 2, vx: 10 + Math.random() * 15 });
    for (const p of C.smoke) { p.life += dt; p.y -= dt * h * 0.05; p.x += p.vx * dt; p.r += dt * h * 0.018; const a = Math.max(0, 1 - p.life / p.max) * 0.22; const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r); gr.addColorStop(0, `rgba(230,225,215,${a})`); gr.addColorStop(1, 'rgba(230,225,215,0)'); g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, p.r, 0, TAU); g.fill(); }
    C.smoke = C.smoke.filter(p => p.life < p.max);
  }
  // vagues et palmiers du front de mer
  if (C.loc === 'hotel') {
    const hz = h * 0.42;
    for (let i = 0; i < 7; i++) { const ph = (t * 0.25 + i * 0.14) % 1, y = hz + h * 0.2 * ph, a = Math.sin(ph * Math.PI) * 0.6; g.strokeStyle = `rgba(255,255,255,${a})`; g.lineWidth = 1 + ph * 3; g.beginPath(); for (let x = 0; x <= w; x += 24) g.lineTo(x, y + Math.sin(x * 0.02 + t * 2 + i) * 3 * ph); g.stroke(); }
    const foam = g.createLinearGradient(0, h * 0.6, 0, h * 0.64); foam.addColorStop(0, 'rgba(255,255,255,0)'); foam.addColorStop(1, `rgba(255,255,255,${0.4 + 0.3 * Math.sin(t * 0.8)})`);
    g.fillStyle = foam; g.fillRect(0, h * 0.6, w, h * 0.04);
    for (const [px, s] of [[0.06, 0.46], [0.3, 0.42], [0.95, 0.5]]) palm(g, w * px, h * 0.8, h * s, Math.sin(t * 0.9 + px * 10) * 0.6);
    // mouettes
    g.strokeStyle = 'rgba(40,40,40,0.6)'; g.lineWidth = 1.5; for (let i = 0; i < 4; i++) { const x = ((t * 12 + i * 300) % (w + 200)) - 100, y = h * (0.1 + i * 0.05) + Math.sin(t * 2 + i) * 6; g.beginPath(); g.moveTo(x - 7, y); g.quadraticCurveTo(x - 3, y - 4, x, y); g.quadraticCurveTo(x + 3, y - 4, x + 7, y); g.stroke(); }
  }
  if (C.loc === 'kiosque') {
    // voyant de l'enseigne qui clignote
    g.fillStyle = Math.sin(t * 4) > 0 ? '#2ecc71' : '#145a32'; g.beginPath(); g.arc(w * 0.335, h * 0.86 - h * 0.5 * 0.91, 5, 0, TAU); g.fill();
  }
}
export { passer, moto, taxi, mix, lerp, fbm1 };
