// Décors peints des lieux de l'enquête (Lomé, en plein jour, novembre).
// Chaque lieu est peint une fois hors écran ; les personnages, la foule et les effets s'animent par-dessus.

import { rng, fbm1, mix, rgba, shade, canvas, grain, lerp } from './paint.js';
import { portrait } from './portrait.js';

const TAU = Math.PI * 2;
const SKY = { top: '#3f86c8', mid: '#9cc9e6', low: '#f3e4c4' };

function sky(g, w, h, horizon) {
  const gr = g.createLinearGradient(0, 0, 0, horizon);
  gr.addColorStop(0, SKY.top); gr.addColorStop(0.6, SKY.mid); gr.addColorStop(1, SKY.low);
  g.fillStyle = gr; g.fillRect(0, 0, w, horizon + 2);
  const r = rng(5);
  g.fillStyle = 'rgba(255,255,255,0.55)';
  for (let i = 0; i < 6; i++) {
    const cx = r() * w, cy = horizon * (0.15 + r() * 0.4), cw = w * (0.08 + r() * 0.12);
    for (let k = 0; k < 12; k++) { g.beginPath(); g.ellipse(cx + (r() - 0.5) * cw, cy + (r() - 0.5) * cw * 0.12, cw * (0.15 + r() * 0.2), cw * 0.08, 0, 0, TAU); g.fill(); }
  }
}

// Façade de Lomé : murs enduits, peinture passée, auvents de tôle, enseignes peintes
function facade(g, x, y, w, h, col, r, opts = {}) {
  const gr = g.createLinearGradient(x, 0, x + w, 0);
  gr.addColorStop(0, shade(col, 0.1)); gr.addColorStop(1, shade(col, -0.15));
  g.fillStyle = gr; g.fillRect(x, y - h, w, h);
  // salissures et coulures de pluie
  for (let i = 0; i < 20; i++) { g.fillStyle = rgba('#3b2a1a', 0.05 + r() * 0.06); g.fillRect(x + r() * w, y - h + r() * h * 0.2, 2 + r() * 6, h * (0.1 + r() * 0.5)); }
  // étage : fenêtres à persiennes, balcon
  const floors = opts.floors || 2;
  for (let f = 1; f < floors; f++) {
    const fy = y - h + (h / floors) * (f - 1) + h * 0.08;
    for (let k = 0; k < Math.max(2, Math.floor(w / (h * 0.28))); k++) {
      const wx = x + w * 0.08 + k * (w * 0.84 / Math.max(2, Math.floor(w / (h * 0.28)))), ww = h * 0.13, wh = h / floors * 0.55;
      g.fillStyle = shade(opts.shutter || '#2f6e5a', -0.1); g.fillRect(wx, fy, ww, wh);
      g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 1;
      for (let s = 0; s < 8; s++) { g.beginPath(); g.moveTo(wx, fy + s * wh / 8); g.lineTo(wx + ww, fy + s * wh / 8); g.stroke(); }
    }
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x, fy + h / floors * 0.62, w, 4);
  }
  // rez-de-chaussée : boutique ouverte, sombre
  const gy = y - h / floors * 0.9;
  g.fillStyle = '#2a1d14'; g.fillRect(x + w * 0.1, gy, w * 0.8, h / floors * 0.9);
  for (let i = 0; i < 14; i++) { g.fillStyle = ['#d4472e', '#f2b134', '#2e6fb5', '#1f8a5c', '#e9e2cf'][Math.floor(r() * 5)]; g.fillRect(x + w * 0.12 + r() * w * 0.7, gy + h / floors * (0.2 + r() * 0.5), 6 + r() * 14, 8 + r() * 16); }
  // auvent de tôle
  g.fillStyle = '#8f8a80';
  g.beginPath(); g.moveTo(x - 6, gy + 6); g.lineTo(x + w + 6, gy + 6); g.lineTo(x + w + 18, gy + 28); g.lineTo(x - 18, gy + 28); g.fill();
  g.strokeStyle = 'rgba(80,50,30,0.4)'; for (let i = 0; i < w / 8; i++) { g.beginPath(); g.moveTo(x + i * 8, gy + 6); g.lineTo(x + i * 8 - 4, gy + 28); g.stroke(); }
  // enseigne peinte
  if (opts.sign) {
    g.fillStyle = opts.signBg || '#f4efe4'; g.fillRect(x + w * 0.1, gy - h * 0.12, w * 0.8, h * 0.1);
    g.fillStyle = opts.signFg || '#1f3f7a'; g.font = `800 ${Math.round(h * 0.06)}px 'Archivo', sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(opts.sign, x + w / 2, gy - h * 0.07);
  }
}

function parasol(g, x, y, s, c1, c2) {
  const R = s * 0.62, apex = [x, y - s * 1.12], n = 10;
  g.strokeStyle = '#3a3a3a'; g.lineWidth = s * 0.025; g.beginPath(); g.moveTo(x, y); g.lineTo(x, apex[1]); g.stroke();
  const rim = (a) => [x + Math.cos(a) * R, y - s * 0.86 + Math.sin(a) * R * 0.16];
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI, a1 = ((i + 1) / n) * Math.PI;
    const p0 = rim(a0), p1 = rim(a1);
    const lit = 0.5 + 0.5 * Math.cos((a0 + a1) / 2 + 0.6);
    g.fillStyle = shade(i % 2 ? c1 : c2, -0.3 + lit * 0.35);
    g.beginPath(); g.moveTo(apex[0], apex[1]); g.lineTo(p0[0], p0[1]); g.quadraticCurveTo((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 + s * 0.03, p1[0], p1[1]); g.closePath(); g.fill();
  }
  g.fillStyle = 'rgba(0,0,0,0.12)'; g.beginPath(); g.ellipse(x, y + s * 0.02, R * 0.8, R * 0.08, 0, 0, TAU); g.fill();
}

// Table d'étal avec piles de pagnes pliés
function pagneStall(g, x, y, w, s, r, empty = false) {
  g.fillStyle = '#6b4a2e'; g.fillRect(x, y - s * 0.42, w, s * 0.05);
  g.fillStyle = '#4a321f'; for (const k of [0.04, 0.92]) g.fillRect(x + w * k, y - s * 0.38, s * 0.04, s * 0.38);
  if (empty) return;
  const cols = [['#c2401f', '#f2b134'], ['#1f5aa8', '#e9e2cf'], ['#1f8a5c', '#f2b134'], ['#7b3fa0', '#f08a24'], ['#2b2b30', '#d4472e'], ['#f2b134', '#1f5aa8']];
  for (let p = 0; p < Math.floor(w / (s * 0.22)); p++) {
    const px = x + s * 0.04 + p * s * 0.22;
    for (let k = 0; k < 5 + Math.floor(r() * 4); k++) {
      const [a, b] = cols[Math.floor(r() * cols.length)];
      const py = y - s * 0.47 - k * s * 0.045;
      g.fillStyle = a; g.fillRect(px, py, s * 0.2, s * 0.042);
      g.fillStyle = b; for (let d = 0; d < 5; d++) { g.beginPath(); g.arc(px + s * 0.02 + d * s * 0.04, py + s * 0.021, s * 0.01, 0, TAU); g.fill(); }
      g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(px, py + s * 0.034, s * 0.2, s * 0.008);
    }
  }
}

function moto(g, x, y, s, col, rider) {
  g.fillStyle = '#1a1a1a';
  for (const k of [-0.42, 0.42]) { g.beginPath(); g.arc(x + k * s, y - s * 0.2, s * 0.2, 0, TAU); g.fill(); g.fillStyle = '#777'; g.beginPath(); g.arc(x + k * s, y - s * 0.2, s * 0.07, 0, TAU); g.fill(); g.fillStyle = '#1a1a1a'; }
  g.fillStyle = col; g.beginPath(); g.moveTo(x - s * 0.5, y - s * 0.35); g.lineTo(x + s * 0.1, y - s * 0.4); g.lineTo(x + s * 0.35, y - s * 0.62); g.lineTo(x + s * 0.5, y - s * 0.6); g.lineTo(x + s * 0.4, y - s * 0.3); g.lineTo(x - s * 0.3, y - s * 0.25); g.fill();
  g.fillStyle = '#222'; g.fillRect(x - s * 0.45, y - s * 0.47, s * 0.45, s * 0.08);
  g.strokeStyle = '#999'; g.lineWidth = s * 0.03; g.beginPath(); g.moveTo(x + s * 0.4, y - s * 0.62); g.lineTo(x + s * 0.32, y - s * 0.8); g.lineTo(x + s * 0.18, y - s * 0.82); g.stroke();
  if (rider) {
    g.fillStyle = rider; g.fillRect(x - s * 0.22, y - s * 1.05, s * 0.26, s * 0.55);
    g.fillStyle = '#3b2418'; g.beginPath(); g.arc(x - s * 0.08, y - s * 1.15, s * 0.1, 0, TAU); g.fill();
    g.strokeStyle = '#2c3442'; g.lineWidth = s * 0.09; g.beginPath(); g.moveTo(x - s * 0.1, y - s * 0.5); g.lineTo(x + s * 0.15, y - s * 0.45); g.lineTo(x + s * 0.12, y - s * 0.25); g.stroke();
  }
}

// Pousse-pousse en bois à deux roues, avec sa corde bleue
function pushcart(g, x, y, s, loaded) {
  g.fillStyle = '#8a6440'; g.fillRect(x - s * 0.6, y - s * 0.42, s * 1.0, s * 0.08);
  g.strokeStyle = '#6b4a2e'; g.lineWidth = s * 0.04; g.beginPath(); g.moveTo(x + s * 0.4, y - s * 0.38); g.lineTo(x + s * 0.95, y - s * 0.5); g.stroke();
  g.fillStyle = '#222'; g.beginPath(); g.arc(x - s * 0.15, y - s * 0.22, s * 0.22, 0, TAU); g.fill();
  g.strokeStyle = '#888'; g.lineWidth = s * 0.015; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; g.beginPath(); g.moveTo(x - s * 0.15, y - s * 0.22); g.lineTo(x - s * 0.15 + Math.cos(a) * s * 0.2, y - s * 0.22 + Math.sin(a) * s * 0.2); g.stroke(); }
  g.strokeStyle = '#2e7fd1'; g.lineWidth = s * 0.02; g.beginPath(); g.moveTo(x - s * 0.55, y - s * 0.42); g.quadraticCurveTo(x - s * 0.6, y - s * 0.2, x - s * 0.5, y - s * 0.1); g.stroke();
  if (loaded) { g.fillStyle = '#d9c9a8'; g.fillRect(x - s * 0.5, y - s * 0.72, s * 0.5, s * 0.3); }
}

function palm(g, x, y, s) {
  g.strokeStyle = '#6b5a45'; g.lineWidth = s * 0.05;
  g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + s * 0.15, y - s * 0.6, x + s * 0.05, y - s * 1.2); g.stroke();
  g.strokeStyle = '#3e6b2a'; g.lineWidth = s * 0.04;
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU;
    g.beginPath(); g.moveTo(x + s * 0.05, y - s * 1.2);
    g.quadraticCurveTo(x + Math.cos(a) * s * 0.35, y - s * 1.35 + Math.sin(a) * s * 0.08, x + Math.cos(a) * s * 0.6, y - s * 1.05 + Math.abs(Math.sin(a)) * s * 0.2); g.stroke();
  }
}

const CLOTH = ['#d4472e', '#f2b134', '#2e6fb5', '#f4efe4', '#1f8a5c', '#7b3fa0', '#e86f9a', '#2b2b30', '#e9e2cf', '#3d9fd1', '#f08a24'];
const SKIN = ['#4a2c1c', '#5a3622', '#3b2418', '#6a4128'];
function passer(g, x, y, h, seed, frame = 0, load = false) {
  const r = rng(seed);
  const skin = SKIN[Math.floor(r() * SKIN.length)], top = CLOTH[Math.floor(r() * CLOTH.length)], bot = r() < 0.5 ? CLOTH[Math.floor(r() * CLOTH.length)] : '#2c3442';
  const woman = r() < 0.55, w = h * 0.26;
  const step = Math.sin(frame) * h * 0.05;
  g.fillStyle = bot;
  if (woman) { g.beginPath(); g.moveTo(x - w * 0.45, y - h * 0.46); g.lineTo(x - w * 0.38, y); g.lineTo(x + w * 0.38, y); g.lineTo(x + w * 0.45, y - h * 0.46); g.fill(); }
  else { g.fillRect(x - w * 0.38 + step * 0.3, y - h * 0.46, w * 0.33, h * 0.46); g.fillRect(x + w * 0.05 - step * 0.3, y - h * 0.46, w * 0.33, h * 0.46); }
  const tg = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0); tg.addColorStop(0, shade(top, 0.15)); tg.addColorStop(1, shade(top, -0.3));
  g.fillStyle = tg; g.beginPath(); g.roundRect(x - w / 2, y - h * 0.8, w, h * 0.38, w * 0.2); g.fill();
  g.strokeStyle = skin; g.lineWidth = h * 0.055; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x - w * 0.45, y - h * 0.74); g.lineTo(x - w * 0.55 - step * 0.2, y - h * 0.45); g.stroke();
  g.beginPath(); g.moveTo(x + w * 0.45, y - h * 0.74); g.lineTo(x + w * 0.55 + step * 0.2, y - h * 0.45); g.stroke();
  g.fillStyle = skin; g.beginPath(); g.arc(x, y - h * 0.88, h * 0.075, 0, TAU); g.fill();
  if (woman && r() < 0.6) { g.fillStyle = CLOTH[Math.floor(r() * CLOTH.length)]; g.beginPath(); g.ellipse(x, y - h * 0.93, h * 0.09, h * 0.055, 0, Math.PI, 0); g.fill(); }
  if (load || (woman && r() < 0.35)) { // charge sur la tête : bassine
    g.fillStyle = ['#c9ccc9', '#2e6fb5', '#d4472e'][Math.floor(r() * 3)]; g.beginPath(); g.ellipse(x, y - h * 0.99, h * 0.16, h * 0.04, 0, 0, TAU); g.fill();
    g.fillStyle = '#f2b134'; g.beginPath(); g.ellipse(x, y - h * 1.02, h * 0.12, h * 0.04, 0, Math.PI, 0); g.fill();
  }
}

// ------------------------------------------------------------------ lieux
export const SCENES = {
  etal(g, w, h) {
    const r = rng(11), hz = h * 0.55;
    sky(g, w, h, hz);
    // chantier du Grand marché : grande structure de béton, grue, palissade
    g.fillStyle = '#c9c2b4'; g.fillRect(w * 0.18, hz - h * 0.36, w * 0.64, h * 0.36);
    g.fillStyle = '#b1a998';
    for (let f = 0; f < 4; f++) g.fillRect(w * 0.18, hz - h * 0.36 + f * h * 0.09, w * 0.64, h * 0.012);
    g.fillStyle = '#7b7568'; for (let c = 0; c < 12; c++) g.fillRect(w * 0.2 + c * w * 0.053, hz - h * 0.36, w * 0.012, h * 0.36);
    g.fillStyle = 'rgba(40,40,40,0.35)'; for (let c = 0; c < 11; c++) for (let f = 0; f < 4; f++) g.fillRect(w * 0.214 + c * w * 0.053, hz - h * 0.345 + f * h * 0.09, w * 0.038, h * 0.07);
    // grue
    g.strokeStyle = '#e0a021'; g.lineWidth = 6;
    g.beginPath(); g.moveTo(w * 0.7, hz - h * 0.36); g.lineTo(w * 0.7, hz - h * 0.62); g.lineTo(w * 0.34, hz - h * 0.6); g.moveTo(w * 0.7, hz - h * 0.62); g.lineTo(w * 0.8, hz - h * 0.6); g.stroke();
    g.lineWidth = 2; g.beginPath(); g.moveTo(w * 0.45, hz - h * 0.6); g.lineTo(w * 0.45, hz - h * 0.45); g.stroke();
    // palissade de tôle bleue
    g.fillStyle = '#2f6db0'; g.fillRect(0, hz - h * 0.07, w, h * 0.07);
    g.strokeStyle = 'rgba(0,0,0,0.2)'; for (let i = 0; i < w; i += 14) { g.beginPath(); g.moveTo(i, hz - h * 0.07); g.lineTo(i, hz); g.stroke(); }
    g.fillStyle = '#f4efe4'; g.font = `800 ${Math.round(h * 0.022)}px 'Archivo', sans-serif`; g.textAlign = 'center'; g.fillText('CHANTIER · RECONSTRUCTION DU GRAND MARCHÉ', w * 0.5, hz - h * 0.025);
    // façades latérales de la rue du Commerce
    facade(g, -w * 0.02, hz + h * 0.02, w * 0.2, h * 0.34, '#e2c48f', r, { floors: 2, sign: 'ALIMENTATION', signFg: '#a0261b' });
    facade(g, w * 0.84, hz + h * 0.02, w * 0.2, h * 0.36, '#d9a7a0', r, { floors: 2, sign: 'TISSUS', signFg: '#1f3f7a' });
    // chaussée de sable et goudron
    const gg = g.createLinearGradient(0, hz, 0, h);
    gg.addColorStop(0, '#c9a77a'); gg.addColorStop(1, '#a8845a');
    g.fillStyle = gg; g.fillRect(0, hz, w, h - hz);
    g.fillStyle = 'rgba(60,40,25,0.15)'; for (let i = 0; i < 900; i++) { const y = hz + r() * (h - hz); g.fillRect(r() * w, y, 2 + (y - hz) / h * 6, 1 + (y - hz) / h * 2); }
    g.strokeStyle = '#2e7fd1'; g.lineWidth = 3; g.beginPath(); g.moveTo(w * 0.575, h * 0.79); g.quadraticCurveTo(w * 0.59, h * 0.76, w * 0.6, h * 0.79); g.stroke();
  },

  poisson(g, w, h) {
    const r = rng(23), hz = h * 0.52;
    sky(g, w, h, hz);
    facade(g, -w * 0.02, hz + h * 0.02, w * 0.36, h * 0.4, '#cfd8c4', r, { floors: 3, sign: 'PHARMACIE', signBg: '#1f8a5c', signFg: '#ffffff' });
    facade(g, w * 0.34, hz + h * 0.02, w * 0.34, h * 0.36, '#e8cf9a', r, { floors: 2, sign: 'QUINCAILLERIE', signFg: '#2b2b30' });
    facade(g, w * 0.68, hz + h * 0.02, w * 0.36, h * 0.42, '#d7b7c9', r, { floors: 3 });
    const gg = g.createLinearGradient(0, hz, 0, h); gg.addColorStop(0, '#bf9d70'); gg.addColorStop(1, '#94734c');
    g.fillStyle = gg; g.fillRect(0, hz, w, h - hz);
    for (let i = 0; i < 8; i++) passer(g, r() * w, hz + h * (0.05 + r() * 0.05), h * 0.2, 300 + i);
  },

  carrefour(g, w, h) {
    const r = rng(37), hz = h * 0.56;
    sky(g, w, h, hz);
    // cathédrale du Sacré-Cœur : nef claire, deux flèches sombres (approximation)
    const cx = w * 0.24, base = hz + h * 0.01;
    g.fillStyle = '#efe4cf'; g.fillRect(cx - w * 0.12, base - h * 0.3, w * 0.24, h * 0.3);
    for (const k of [-1, 1]) {
      const tx = cx + k * w * 0.075;
      g.fillStyle = '#e8dcc2'; g.fillRect(tx - w * 0.03, base - h * 0.44, w * 0.06, h * 0.44);
      g.fillStyle = '#5c5f63'; g.beginPath(); g.moveTo(tx - w * 0.034, base - h * 0.44); g.lineTo(tx, base - h * 0.62); g.lineTo(tx + w * 0.034, base - h * 0.44); g.fill();
      g.fillStyle = '#3b3f45'; g.beginPath(); g.moveTo(tx, base - h * 0.62); g.lineTo(tx + w * 0.034, base - h * 0.44); g.lineTo(tx + w * 0.012, base - h * 0.44); g.fill();
      g.fillStyle = '#4a3a2c'; g.beginPath(); g.arc(tx, base - h * 0.36, w * 0.012, Math.PI, 0); g.fillRect(tx - w * 0.012, base - h * 0.36, w * 0.024, h * 0.05); g.fill();
    }
    g.fillStyle = '#5c5f63'; g.beginPath(); g.moveTo(cx - w * 0.045, base - h * 0.3); g.lineTo(cx, base - h * 0.38); g.lineTo(cx + w * 0.045, base - h * 0.3); g.fill();
    g.fillStyle = '#4a3a2c'; g.beginPath(); g.arc(cx, base - h * 0.12, w * 0.025, Math.PI, 0); g.fillRect(cx - w * 0.025, base - h * 0.12, w * 0.05, h * 0.12); g.fill();
    g.strokeStyle = '#c9b48f'; g.lineWidth = 2; g.beginPath(); g.arc(cx, base - h * 0.22, w * 0.018, 0, TAU); g.stroke();
    facade(g, w * 0.45, hz + h * 0.02, w * 0.28, h * 0.34, '#f0d6a0', r, { floors: 2, sign: 'BAR LE CARREFOUR', signFg: '#a0261b' });
    facade(g, w * 0.73, hz + h * 0.02, w * 0.3, h * 0.38, '#bcd3d9', r, { floors: 3 });
    // goudron, marquages, manguier
    const gg = g.createLinearGradient(0, hz, 0, h); gg.addColorStop(0, '#6f6a63'); gg.addColorStop(1, '#4b4741');
    g.fillStyle = gg; g.fillRect(0, hz, w, h - hz);
    g.fillStyle = '#c9a77a'; g.fillRect(0, h * 0.86, w, h * 0.14);
    g.fillStyle = 'rgba(240,235,220,0.6)'; for (let i = 0; i < 8; i++) g.fillRect(w * 0.05 + i * w * 0.12, h * 0.71, w * 0.06, h * 0.008);
    // manguier où attendent les pousseurs
    g.fillStyle = '#4a3a2c'; g.fillRect(w * 0.86, hz - h * 0.05, w * 0.02, h * 0.38);
    for (let i = 0; i < 260; i++) { const a = r() * TAU, d = Math.sqrt(r()); g.fillStyle = [ '#2f5a22', '#3e6b2a', '#24461a', '#4e7d33'][Math.floor(r() * 4)]; g.beginPath(); g.ellipse(w * 0.87 + Math.cos(a) * w * 0.12 * d, hz - h * 0.12 + Math.sin(a) * h * 0.12 * d, 9, 6, r() * 3, 0, TAU); g.fill(); }
  },

  kiosque(g, w, h) {
    const r = rng(41), hz = h * 0.55;
    sky(g, w, h, hz);
    facade(g, -w * 0.02, hz + h * 0.02, w * 0.3, h * 0.36, '#e3d3b0', r, { floors: 2, sign: 'COIFFURE', signFg: '#7b3fa0' });
    facade(g, w * 0.78, hz + h * 0.02, w * 0.26, h * 0.4, '#cfe0c6', r, { floors: 3 });
    const gg = g.createLinearGradient(0, hz, 0, h); gg.addColorStop(0, '#c4a275'); gg.addColorStop(1, '#9a7850');
    g.fillStyle = gg; g.fillRect(0, hz, w, h - hz);
    // le kiosque : conteneur peint, comptoir grillagé, affiches
    const kx = w * 0.32, kw = w * 0.42, ky = h * 0.85, kh = h * 0.5;
    g.fillStyle = '#e8b43a'; g.fillRect(kx, ky - kh, kw, kh);
    g.strokeStyle = 'rgba(0,0,0,0.15)'; for (let i = 0; i < kw; i += 10) { g.beginPath(); g.moveTo(kx + i, ky - kh); g.lineTo(kx + i, ky); g.stroke(); }
    g.fillStyle = '#1d3f6e'; g.fillRect(kx, ky - kh, kw, kh * 0.18);
    g.fillStyle = '#ffffff'; g.font = `800 ${Math.round(h * 0.04)}px 'Archivo', sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('MOBILE MONEY · RECHARGES', kx + kw / 2, ky - kh * 0.91);
    g.fillStyle = '#2a1d14'; g.fillRect(kx + kw * 0.08, ky - kh * 0.72, kw * 0.55, kh * 0.42);
    g.strokeStyle = '#9a9a9a'; g.lineWidth = 1.5; for (let i = 0; i < 16; i++) { g.beginPath(); g.moveTo(kx + kw * 0.08 + i * kw * 0.035, ky - kh * 0.72); g.lineTo(kx + kw * 0.08 + i * kw * 0.035, ky - kh * 0.3); g.stroke(); }
    g.fillStyle = '#8a6440'; g.fillRect(kx + kw * 0.05, ky - kh * 0.3, kw * 0.62, kh * 0.05);
    // affiches de paris et tarifs
    for (const [ax, ay, c, t] of [[0.72, 0.6, '#c62828', 'PARIS'], [0.86, 0.58, '#ffffff', 'TARIFS'], [0.79, 0.42, '#2e7d32', 'RETRAIT']]) {
      g.fillStyle = c; g.fillRect(kx + kw * ax - kw * 0.06, ky - kh * ay, kw * 0.12, kh * 0.14);
      g.fillStyle = c === '#ffffff' ? '#1d3f6e' : '#ffffff'; g.font = `800 ${Math.round(h * 0.018)}px 'Archivo', sans-serif`; g.fillText(t, kx + kw * ax, ky - kh * (ay - 0.07));
    }
    // file d'attente
    for (let i = 0; i < 4; i++) passer(g, kx - w * 0.05 - i * w * 0.06, h * 0.9, h * 0.32, 500 + i);
    parasol(g, w * 0.84, h * 0.86, h * 0.3, '#d4472e', '#f2b134');
  },

  hotel(g, w, h) {
    const r = rng(53), hz = h * 0.42;
    sky(g, w, h, hz);
    // océan, vagues, pirogues
    const sg = g.createLinearGradient(0, hz, 0, h * 0.62); sg.addColorStop(0, '#2c6e9b'); sg.addColorStop(1, '#4fa3c4');
    g.fillStyle = sg; g.fillRect(0, hz, w, h * 0.22);
    g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 2;
    for (let i = 0; i < 26; i++) { const y = hz + r() * h * 0.2, x = r() * w; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 20, y - 3, x + 40, y); g.stroke(); }
    for (const px of [0.2, 0.62]) { g.fillStyle = '#5a3a20'; g.beginPath(); g.moveTo(w * px, hz + h * 0.06); g.quadraticCurveTo(w * px + 30, hz + h * 0.075, w * px + 60, hz + h * 0.06); g.lineTo(w * px + 52, hz + h * 0.07); g.lineTo(w * px + 8, hz + h * 0.07); g.fill(); }
    // plage et écume
    g.fillStyle = '#e8d3a8'; g.fillRect(0, h * 0.62, w, h * 0.1);
    g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); for (let x = 0; x <= w; x += 20) g.lineTo(x, h * 0.62 + Math.sin(x * 0.03) * 4); g.lineTo(w, h * 0.6); g.lineTo(0, h * 0.6); g.fill();
    // boulevard et terrasse de l'hôtel
    g.fillStyle = '#5b5852'; g.fillRect(0, h * 0.72, w, h * 0.08);
    g.fillStyle = 'rgba(240,235,220,0.6)'; for (let i = 0; i < 9; i++) g.fillRect(i * w * 0.12, h * 0.76, w * 0.05, 3);
    g.fillStyle = '#d8cfc0'; g.fillRect(0, h * 0.8, w, h * 0.2);
    for (let i = 0; i < 14; i++) for (let j = 0; j < 3; j++) { g.fillStyle = (i + j) % 2 ? '#cfc5b4' : '#e0d8ca'; g.fillRect(i * w / 14, h * 0.8 + j * h * 0.067, w / 14, h * 0.067); }
    for (const px of [0.06, 0.3, 0.94]) palm(g, w * px, h * 0.8, h * 0.45);
    // façade de l'hôtel à droite
    g.fillStyle = '#f2ece0'; g.fillRect(w * 0.7, h * 0.18, w * 0.32, h * 0.62);
    for (let f = 0; f < 5; f++) for (let k = 0; k < 4; k++) { g.fillStyle = '#7fa9c2'; g.fillRect(w * 0.72 + k * w * 0.075, h * 0.22 + f * h * 0.1, w * 0.05, h * 0.06); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(w * 0.72 + k * w * 0.075, h * 0.22 + f * h * 0.1, w * 0.015, h * 0.06); }
    g.fillStyle = '#1d3f6e'; g.fillRect(w * 0.72, h * 0.72, w * 0.28, h * 0.05);
    g.fillStyle = '#fff'; g.font = `700 ${Math.round(h * 0.03)}px 'Archivo', sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('HÔTEL', w * 0.86, h * 0.745);
    // parasols de la terrasse
    parasol(g, w * 0.5, h * 0.9, h * 0.28, '#f4efe4', '#1d3f6e');
  },
};


// Calques avant (devant les passants, derrière les personnages principaux)
export const FRONT = {
  etal(g, w, h) {
    const r = rng(12), hz = h * 0.55;
    parasol(g, w * 0.11, hz + h * 0.2, h * 0.26, '#d4472e', '#f4efe4');
    pagneStall(g, w * 0.01, hz + h * 0.2, w * 0.2, h * 0.32, r);
    parasol(g, w * 0.88, hz + h * 0.21, h * 0.27, '#1f8a5c', '#f2b134');
    pagneStall(g, w * 0.78, hz + h * 0.21, w * 0.21, h * 0.32, r);
    parasol(g, w * 0.5, hz + h * 0.27, h * 0.36, '#f2b134', '#1f5aa8');
    pagneStall(g, w * 0.3, hz + h * 0.27, w * 0.4, h * 0.4, r);
    // emplacement vide de la malle
    g.fillStyle = 'rgba(40,25,10,0.3)'; g.fillRect(w * 0.55, hz + h * 0.27 - h * 0.4 * 0.42 - h * 0.012, w * 0.1, h * 0.012);
  },
  poisson(g, w, h) {
    const hz = h * 0.52;
    for (const [fx, fs] of [[0.32, 1], [0.58, 0.9], [0.8, 0.8]]) {
      const x = w * fx, y = h * (0.84 - (1 - fs) * 0.2), s = h * 0.32 * fs;
      g.fillStyle = '#7a4a2a'; g.beginPath(); g.ellipse(x, y, s * 0.6, s * 0.16, 0, 0, TAU); g.fill();
      g.fillStyle = '#5a321b'; g.fillRect(x - s * 0.55, y - s * 0.4, s * 1.1, s * 0.4);
      g.fillStyle = '#8a6a3c'; g.fillRect(x - s * 0.62, y - s * 0.46, s * 1.24, s * 0.06);
      for (let i = 0; i < 9; i++) for (let j = 0; j < 2; j++) {
        const px = x - s * 0.52 + i * s * 0.13, py = y - s * 0.5 - j * s * 0.05;
        const fg = g.createLinearGradient(px, py, px + s * 0.1, py); fg.addColorStop(0, '#c98a2c'); fg.addColorStop(1, '#7a4b16');
        g.fillStyle = fg; g.beginPath(); g.ellipse(px + s * 0.05, py, s * 0.055, s * 0.018, 0.1, 0, TAU); g.fill();
      }
      const bg = g.createRadialGradient(x, y - s * 0.12, 0, x, y - s * 0.12, s * 0.3);
      bg.addColorStop(0, 'rgba(255,120,40,0.85)'); bg.addColorStop(1, 'rgba(255,80,20,0)');
      g.fillStyle = bg; g.fillRect(x - s * 0.4, y - s * 0.4, s * 0.8, s * 0.4);
    }
    parasol(g, w * 0.14, hz + h * 0.3, h * 0.3, '#2e6fb5', '#f4efe4');
  },
  carrefour(g, w, h) {
    for (let i = 0; i < 5; i++) moto(g, w * (0.06 + i * 0.075), h * 0.9, h * 0.15, ['#b71c1c', '#1a1a1a', '#0d47a1', '#5d4037', '#424242'][i], i % 2 ? '#3d6b9e' : null);
    pushcart(g, w * 0.64, h * 0.95, h * 0.22, false);
    pushcart(g, w * 0.93, h * 0.97, h * 0.2, true);
  },
};

// Position des personnages par lieu (fraction de largeur, hauteur relative)
export const STAGE = {
  etal: { dada: [0.5, 1.0], mawuli: [0.72, 0.95] },
  poisson: { sena: [0.46, 1.0] },
  carrefour: { kodjo: [0.42, 0.95], komi: [0.76, 1.0] },
  kiosque: { ayaovi: [0.46, 0.9] },
  hotel: { dossou: [0.36, 1.0] },
};

// Personnage en pied : bas du corps peint, buste repris du portrait (même visage qu'en dialogue)
export function drawFigure(g, id, look, x, groundY, hpx, t = 0, hover = false) {
  const P = portrait(id, look, 'neutre');
  const f = hpx / 2050;                      // échelle portrait → personnage
  const pw = P.width * f, ph = P.height * f;
  const top = groundY - hpx - 0.06 * hpx;
  const shoulderY = top + P.height * 0.77 * f;
  const female = look.sex === 'f';
  const bob = Math.sin(t * 1.4 + x) * hpx * 0.004;
  // ombre
  g.fillStyle = 'rgba(30,15,5,0.35)'; g.beginPath(); g.ellipse(x + hpx * 0.06, groundY, hpx * 0.17, hpx * 0.025, 0, 0, TAU); g.fill();
  // jambes / pagne
  const hipY = top + hpx * 0.5;
  const legC = female ? (look.topC2 || shade(look.topC || '#444', -0.2)) : '#2c3442';
  if (female) {
    const gr = g.createLinearGradient(x - hpx * 0.1, 0, x + hpx * 0.1, 0); gr.addColorStop(0, shade(legC, 0.1)); gr.addColorStop(1, shade(legC, -0.3));
    g.fillStyle = gr; g.beginPath(); g.moveTo(x - hpx * 0.11, hipY - hpx * 0.05); g.lineTo(x - hpx * 0.1, groundY - hpx * 0.03); g.lineTo(x + hpx * 0.1, groundY - hpx * 0.03); g.lineTo(x + hpx * 0.11, hipY - hpx * 0.05); g.fill();
  } else {
    for (const k of [-1, 1]) {
      const gr = g.createLinearGradient(x + k * hpx * 0.06 - hpx * 0.04, 0, x + k * hpx * 0.06 + hpx * 0.04, 0); gr.addColorStop(0, shade(legC, 0.15)); gr.addColorStop(1, shade(legC, -0.3));
      g.fillStyle = gr; g.beginPath(); g.moveTo(x + k * hpx * 0.005, hipY - hpx * 0.04); g.lineTo(x + k * hpx * 0.1, hipY - hpx * 0.04); g.lineTo(x + k * hpx * 0.085, groundY - hpx * 0.03); g.lineTo(x + k * hpx * 0.02, groundY - hpx * 0.03); g.fill();
    }
  }
  // sandales
  g.fillStyle = '#1a1a1a'; for (const k of [-1, 1]) { g.beginPath(); g.ellipse(x + k * hpx * 0.055, groundY - hpx * 0.012, hpx * 0.045, hpx * 0.015, 0, 0, TAU); g.fill(); }
  // tronc sous le buste
  const topC = look.top === 'wax' ? (look.topC || '#1f5aa8') : (look.topC || '#ddd');
  const tg = g.createLinearGradient(x - hpx * 0.14, 0, x + hpx * 0.14, 0); tg.addColorStop(0, shade(topC, 0.1)); tg.addColorStop(1, shade(topC, -0.35));
  g.fillStyle = tg; g.beginPath(); g.roundRect(x - hpx * 0.13, shoulderY, hpx * 0.26, hipY - shoulderY + hpx * 0.02, hpx * 0.04); g.fill();
  // bras
  g.strokeStyle = shade(look.skin, -0.1); g.lineWidth = hpx * 0.05; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x - hpx * 0.14, shoulderY + hpx * 0.04); g.quadraticCurveTo(x - hpx * 0.17, hipY - hpx * 0.1, x - hpx * 0.15, hipY + hpx * 0.02 + bob); g.stroke();
  g.beginPath(); g.moveTo(x + hpx * 0.14, shoulderY + hpx * 0.04); g.quadraticCurveTo(x + hpx * 0.17, hipY - hpx * 0.1, x + hpx * 0.15, hipY + hpx * 0.02 - bob); g.stroke();
  g.strokeStyle = topC; g.lineWidth = hpx * 0.06;
  g.beginPath(); g.moveTo(x - hpx * 0.13, shoulderY + hpx * 0.03); g.lineTo(x - hpx * 0.155, shoulderY + hpx * 0.12); g.stroke();
  g.beginPath(); g.moveTo(x + hpx * 0.13, shoulderY + hpx * 0.03); g.lineTo(x + hpx * 0.155, shoulderY + hpx * 0.12); g.stroke();
  // buste (portrait)
  g.drawImage(P, x - pw / 2, top + bob, pw, ph);
  if (hover) {
    g.strokeStyle = 'rgba(255,214,120,0.9)'; g.lineWidth = 3; g.setLineDash([6, 6]);
    g.beginPath(); g.ellipse(x, groundY, hpx * 0.22, hpx * 0.04, 0, 0, TAU); g.stroke(); g.setLineDash([]);
  }
  return { x0: x - hpx * 0.18, x1: x + hpx * 0.18, y0: top + ph * 0.1, y1: groundY };
}

// Rendu complet d'un lieu (fond en cache)
const cacheBG = new Map();
export function background(loc, w, h) {
  const k = `${loc}|${w}x${h}`;
  if (!cacheBG.has(k)) {
    const c = canvas(w, h), g = c.getContext('2d');
    SCENES[loc](g, w, h);
    g.drawImage(grain(), 0, 0, w, h);
    cacheBG.set(k, c);
  }
  return cacheBG.get(k);
}

const cacheFG = new Map();
export function foreground(loc, w, h) {
  if (!FRONT[loc]) return null;
  const k = `${loc}|${w}x${h}`;
  if (!cacheFG.has(k)) { const c = canvas(w, h); FRONT[loc](c.getContext('2d'), w, h); cacheFG.set(k, c); }
  return cacheFG.get(k);
}

// Foule animée de passants au premier plan / arrière-plan
export function crowd(loc, w, h) {
  const r = rng(loc.length * 97);
  return Array.from({ length: loc === 'hotel' ? 4 : 12 }, (_, i) => ({ x: r() * w, y: loc === 'hotel' ? h * (0.78 + r() * 0.02) : h * (0.6 + r() * 0.05), hgt: h * (0.15 + r() * 0.04), v: (r() < 0.5 ? -1 : 1) * (12 + r() * 30), seed: 900 + i, load: r() < 0.25 }));
}
export function drawCrowd(g, list, w, dt, t) {
  for (const p of list) {
    p.x += p.v * dt; if (p.x < -60) p.x = w + 60; if (p.x > w + 60) p.x = -60;
    passer(g, p.x, p.y, p.hgt, p.seed, t * 6 + p.seed, p.load);
  }
}
export { mix, lerp, fbm1, palm };
