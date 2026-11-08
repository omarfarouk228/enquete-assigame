// Personnages en pied, de trois quarts, cohérents avec les portraits : même tête (headOnly),
// corps peint avec volumes (jambes, bassin, torse, bras articulés, mains avec doigts, sandales),
// vêtements (pagne et blouse en wax, tee-shirt, maillot, polo, chemise, boubou),
// poses (bras le long du corps, main sur la hanche, bras croisés, mains dans les poches,
// casque de zem sous le bras, montre consultée, derrière un comptoir) et animation de respiration.

import { shade, rgba } from './paint.js';
import { headOnly, pal, waxFill, softSpot } from './portrait.js';

const TAU = Math.PI * 2;
const SUN = [-0.6, -0.8];

// Membre : capsule effilée avec ombrage cylindrique
function limb(g, a, b, r0, r1, col, spec = 0.25) {
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const lit = (nx * SUN[0] + ny * SUN[1]) > 0 ? 1 : -1;
  const gr = g.createLinearGradient(a[0] + nx * r0 * lit, a[1] + ny * r0 * lit, a[0] - nx * r0 * lit, a[1] - ny * r0 * lit);
  gr.addColorStop(0, shade(col, 0.22)); gr.addColorStop(0.4, col); gr.addColorStop(0.85, shade(col, -0.4)); gr.addColorStop(1, shade(col, -0.25));
  g.fillStyle = gr;
  const a0 = Math.atan2(ny, nx);
  g.beginPath();
  g.arc(a[0], a[1], r0, a0, a0 + Math.PI);
  g.lineTo(b[0] - nx * r1, b[1] - ny * r1);
  g.arc(b[0], b[1], r1, a0 + Math.PI, a0 + TAU);
  g.closePath(); g.fill();
  if (spec > 0) {
    g.strokeStyle = `rgba(255,235,210,${spec})`; g.lineWidth = Math.max(1, r1 * 0.3); g.lineCap = 'round';
    g.beginPath(); g.moveTo(a[0] + nx * r0 * lit * 0.5 + dx * 0.1, a[1] + ny * r0 * lit * 0.5 + dy * 0.1); g.lineTo(a[0] + nx * r1 * lit * 0.5 + dx * 0.85, a[1] + ny * r1 * lit * 0.5 + dy * 0.85); g.stroke();
  }
}

// Main : paume, quatre doigts, pouce. dir : angle de la main (radians), curl : doigts repliés
function hand(g, x, y, s, dir, col, curl = 0.3, flip = 1) {
  const P = pal(col);
  g.save(); g.translate(x, y); g.rotate(dir); g.scale(flip, 1);
  const gr = g.createRadialGradient(-s * 0.2, -s * 0.2, 0, 0, 0, s * 1.1);
  gr.addColorStop(0, P.light); gr.addColorStop(0.6, col); gr.addColorStop(1, P.core);
  g.fillStyle = gr;
  g.beginPath(); g.ellipse(0, s * 0.1, s * 0.5, s * 0.62, 0, 0, TAU); g.fill();
  // doigts
  for (let i = 0; i < 4; i++) {
    const fx = -s * 0.36 + i * s * 0.24, len = s * (0.7 - Math.abs(i - 1.3) * 0.1) * (1 - curl * 0.55);
    const fg = g.createLinearGradient(fx - s * 0.1, 0, fx + s * 0.1, 0);
    fg.addColorStop(0, P.light); fg.addColorStop(0.5, col); fg.addColorStop(1, P.core);
    g.fillStyle = fg; g.lineCap = 'round';
    g.beginPath(); g.roundRect(fx - s * 0.1, s * 0.55, s * 0.2, len, s * 0.1); g.fill();
    if (curl > 0.5) { g.fillStyle = rgba(P.deep, 0.35); g.fillRect(fx - s * 0.1, s * 0.55 + len * 0.45, s * 0.2, s * 0.04); }
  }
  // pouce
  g.fillStyle = col; g.beginPath(); g.ellipse(-s * 0.5, s * 0.1, s * 0.16, s * 0.4, -0.5, 0, TAU); g.fill();
  g.strokeStyle = rgba(P.deep, 0.35); g.lineWidth = Math.max(1, s * 0.05);
  g.beginPath(); g.moveTo(-s * 0.3, s * 0.5); g.quadraticCurveTo(0, s * 0.62, s * 0.3, s * 0.5); g.stroke();
  g.restore();
}

function sandal(g, x, y, s, dir, dark = '#1a1a1a') {
  g.fillStyle = dark; g.beginPath(); g.ellipse(x + dir * s * 0.1, y, s * 0.5, s * 0.16, dir * 0.1, 0, TAU); g.fill();
  g.fillStyle = '#6a4a2a'; g.beginPath(); g.ellipse(x + dir * s * 0.08, y - s * 0.04, s * 0.42, s * 0.11, dir * 0.1, 0, TAU); g.fill();
  g.strokeStyle = '#1a1a1a'; g.lineWidth = Math.max(1, s * 0.05);
  g.beginPath(); g.moveTo(x - s * 0.15, y - s * 0.12); g.quadraticCurveTo(x + dir * s * 0.15, y - s * 0.3, x + dir * s * 0.35, y - s * 0.08); g.stroke();
}

// Pied nu couleur peau, orteils
function foot(g, x, y, s, dir, col) {
  const P = pal(col);
  const gr = g.createLinearGradient(x, y - s * 0.3, x, y);
  gr.addColorStop(0, P.light); gr.addColorStop(1, P.core);
  g.fillStyle = gr; g.beginPath(); g.ellipse(x + dir * s * 0.15, y - s * 0.08, s * 0.5, s * 0.18, 0, 0, TAU); g.fill();
}

// Dessin complet. pose : 'down' | 'hip' | 'cross' | 'pocket' | 'helmet' | 'watch' | 'counter'
// Retourne la boîte cliquable.
export function drawFigure(g, id, look, x, groundY, hpx, t = 0, hover = false, pose = look.pose || 'down') {
  const skin = look.skin, P = pal(skin);
  const female = look.sex === 'f';
  const B = look.build || 1;
  const u = hpx / 100;                       // unité : 1 % de la hauteur
  const breath = Math.sin(t * 1.5 + x * 0.01) * 0.4 * u;
  const sway = Math.sin(t * 0.7 + x * 0.02) * 0.5 * u;
  // repères verticaux (depuis le sol)
  const Y = (k) => groundY - k * u;
  const hipY = Y(50) + breath * 0.3, waistY = Y(58) + breath * 0.5, shoulderY = Y(80) + breath, chinY = Y(84.5) + breath;
  const shoulderW = (female ? 9.6 : 11) * u * B, hipW = (female ? 11 : 9.8) * u * B, waistW = (female ? 8 : 8.8) * u * B;
  const cx = x + sway;
  const topC = look.topC || '#e9e2cf', topC2 = look.topC2 || '#f2b134';
  const bottomC = female ? (look.top === 'wax' ? topC : topC2) : (look.top === 'boubou' ? '#e9e2cf' : look.top === 'jersey' ? '#1d2b3a' : '#2c3442');

  // ---------------------------------------------------------- ombres au sol
  g.fillStyle = 'rgba(25,12,4,0.35)';
  g.beginPath(); g.ellipse(x + 1.5 * u, groundY + 0.3 * u, 13 * u * B, 2.2 * u, 0, 0, TAU); g.fill();
  // ombre portée allongée vers la droite (soleil à gauche)
  const sh = g.createLinearGradient(x, groundY, x + 40 * u, groundY);
  sh.addColorStop(0, 'rgba(25,12,4,0.32)'); sh.addColorStop(1, 'rgba(25,12,4,0)');
  g.fillStyle = sh; g.beginPath(); g.moveTo(x - 6 * u, groundY); g.lineTo(x + 6 * u, groundY); g.lineTo(x + 42 * u, groundY - 12 * u); g.lineTo(x + 34 * u, groundY - 13 * u); g.closePath(); g.fill();

  const counter = pose === 'counter', run = pose === 'run';
  const ph = run ? Math.sin(t * 13) : 0, ph2 = run ? Math.sin(t * 13 + Math.PI) : 0;
  // ---------------------------------------------------------- jambes
  const legFar = [cx - 3.5 * u, hipY + 2 * u], legNear = [cx + 3.5 * u, hipY + 2 * u];
  const kneeFar = run ? [cx - 3 * u + ph2 * 9 * u, Y(27) + Math.max(0, ph2) * 8 * u] : [cx - 3.2 * u, Y(27)];
  const kneeNear = run ? [cx + 4 * u + ph * 9 * u, Y(27) + Math.max(0, ph) * 8 * u] : [cx + 4.2 * u, Y(27)];
  const ankFar = run ? [cx - 4 * u + ph2 * 14 * u - 4 * u, Y(4) - Math.max(0, -ph2) * 16 * u] : [cx - 3.6 * u, Y(4)];
  const ankNear = run ? [cx + 4 * u + ph * 14 * u - 4 * u, Y(4) - Math.max(0, -ph) * 16 * u] : [cx + 4.6 * u, Y(4)];
  if (!counter) {
    if (female && run) {
      limb(g, legFar, kneeFar, 4.6 * u * B, 3.6 * u, shade(skin, -0.25), 0.08);
      limb(g, kneeFar, ankFar, 3.6 * u, 2.6 * u, shade(skin, -0.28), 0.05);
      sandal(g, ankFar[0], ankFar[1] + 2.5 * u, 6 * u, 1, '#2a1f17');
      limb(g, legNear, kneeNear, 4.8 * u * B, 3.8 * u, skin, 0.2);
      limb(g, kneeNear, ankNear, 3.8 * u, 2.7 * u, shade(skin, -0.05), 0.15);
      sandal(g, ankNear[0], ankNear[1] + 2.5 * u, 6.5 * u, 1);
      // jupe courte qui vole
      g.fillStyle = bottomC; g.beginPath(); g.moveTo(cx - hipW * 1.05, hipY - 2 * u); g.quadraticCurveTo(cx - hipW * 1.4 - ph * 3 * u, Y(38), cx - hipW * 1.3 - ph * 4 * u, Y(32)); g.lineTo(cx + hipW * 1.25 - ph * 2 * u, Y(31)); g.quadraticCurveTo(cx + hipW * 1.3, Y(40), cx + hipW * 1.1, hipY - 2 * u); g.closePath(); g.fill();
      g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.moveTo(cx + hipW * 0.2, hipY); g.lineTo(cx + hipW * 1.25 - ph * 2 * u, Y(31)); g.lineTo(cx + hipW * 1.1, hipY - 2 * u); g.fill();
    } else if (female) {
      // pagne long : volume en cloche, plis, motif
      const wrap = () => { g.beginPath(); g.moveTo(cx - hipW * 1.05, hipY - 2 * u); g.quadraticCurveTo(cx - hipW * 1.35, Y(25), cx - hipW * 1.1, Y(3)); g.lineTo(cx + hipW * 1.15, Y(2.5)); g.quadraticCurveTo(cx + hipW * 1.45, Y(25), cx + hipW * 1.1, hipY - 2 * u); g.closePath(); };
      g.save(); wrap(); g.clip();
      if (look.top === 'wax' || look.hair === 'wrap') waxFill(g, cx - hipW * 1.6, hipY - 4 * u, hipW * 3.2, Y(2) - hipY + 6 * u, bottomC, look.top === 'wax' ? topC2 : look.wrap2 || '#f4efe4', 11 + (id.length % 3));
      else { g.fillStyle = bottomC; g.fillRect(cx - hipW * 2, hipY - 4 * u, hipW * 4, 60 * u); }
      const lg = g.createLinearGradient(cx - hipW * 1.3, 0, cx + hipW * 1.4, 0);
      lg.addColorStop(0, 'rgba(255,255,255,0.2)'); lg.addColorStop(0.4, 'rgba(255,255,255,0)'); lg.addColorStop(0.75, 'rgba(0,0,0,0.2)'); lg.addColorStop(1, 'rgba(0,0,0,0.45)');
      g.fillStyle = lg; g.fillRect(cx - hipW * 2, hipY - 4 * u, hipW * 4, 60 * u);
      g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 0.8 * u;
      for (const k of [-0.6, -0.1, 0.45, 0.85]) { g.beginPath(); g.moveTo(cx + hipW * k, hipY + 4 * u); g.quadraticCurveTo(cx + hipW * (k * 1.1), Y(25), cx + hipW * (k * 1.2), Y(3)); g.stroke(); }
      g.restore();
      // ourlet
      g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 0.6 * u; g.beginPath(); g.moveTo(cx - hipW * 1.1, Y(3)); g.quadraticCurveTo(cx, Y(1.5), cx + hipW * 1.15, Y(2.5)); g.stroke();
      sandal(g, cx - 3 * u, Y(1.2), 7 * u, 1); sandal(g, cx + 5 * u, Y(0.8), 7 * u, 1);
    } else {
      // pantalon : deux jambes avec genou, plis
      const trouser = look.top === 'boubou' ? '#efe7d6' : bottomC;
      limb(g, legFar, kneeFar, 5.2 * u * B, 4.2 * u, shade(trouser, -0.15), 0.08);
      limb(g, kneeFar, ankFar, 4.2 * u, 3.3 * u, shade(trouser, -0.2), 0.05);
      sandal(g, ankFar[0] + 0.5 * u, Y(1.2), 7 * u, 1, '#2a1f17');
      limb(g, legNear, kneeNear, 5.6 * u * B, 4.5 * u, trouser, 0.1);
      limb(g, kneeNear, ankNear, 4.5 * u, 3.4 * u, shade(trouser, -0.05), 0.08);
      g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 0.7 * u;
      g.beginPath(); g.moveTo(kneeNear[0] - 2 * u, kneeNear[1]); g.quadraticCurveTo(kneeNear[0] + 1 * u, kneeNear[1] + 2 * u, kneeNear[0] + 3 * u, kneeNear[1] - 1 * u); g.stroke();
      if (look.top === 'jersey') { foot(g, ankFar[0], Y(1), 7 * u, 1, skin); sandal(g, ankFar[0] + 0.5 * u, Y(1.0), 7 * u, 1, '#3a3a3a'); }
      sandal(g, ankNear[0] + 0.6 * u, Y(0.8), 7.5 * u, 1, look.top === 'boubou' ? '#5a3a1a' : '#1a1a1a');
      // bassin / ceinture
      g.fillStyle = shade(trouser, -0.1); g.beginPath(); g.ellipse(cx, hipY + 1 * u, hipW * 1.05, 5 * u, 0, 0, TAU); g.fill();
      g.fillStyle = look.top === 'boubou' ? trouser : '#3a2b1c'; g.fillRect(cx - hipW * 1.02, hipY - 2.5 * u, hipW * 2.08, 2.2 * u);
    }
  }

  // ---------------------------------------------------------- torse et vêtement
  const torsoPath = () => {
    g.beginPath();
    g.moveTo(cx - shoulderW, shoulderY + 1 * u);
    g.quadraticCurveTo(cx - shoulderW * 1.02, shoulderY + 9 * u, cx - waistW * 1.05, waistY);
    g.quadraticCurveTo(cx - hipW * 1.02, hipY - 6 * u, cx - hipW * 1.0, hipY + (counter ? 20 : 3) * u);
    g.lineTo(cx + hipW * 1.05, hipY + (counter ? 20 : 3) * u);
    g.quadraticCurveTo(cx + hipW * 1.06, hipY - 6 * u, cx + waistW * 1.08, waistY);
    g.quadraticCurveTo(cx + shoulderW * 1.06, shoulderY + 9 * u, cx + shoulderW * 1.02, shoulderY + 1 * u);
    g.quadraticCurveTo(cx + 2 * u, shoulderY - 1.5 * u, cx - shoulderW, shoulderY + 1 * u);
    g.closePath();
  };
  const long = look.top === 'boubou';
  const drawGarment = () => {
    g.save();
    if (long) {
      g.beginPath(); g.moveTo(cx - shoulderW, shoulderY + 1 * u); g.quadraticCurveTo(cx - shoulderW * 1.3, Y(45), cx - shoulderW * 1.5, Y(22)); g.lineTo(cx + shoulderW * 1.6, Y(21)); g.quadraticCurveTo(cx + shoulderW * 1.35, Y(45), cx + shoulderW * 1.02, shoulderY + 1 * u); g.quadraticCurveTo(cx + 2 * u, shoulderY - 2.5 * u, cx - shoulderW, shoulderY + 1 * u); g.closePath();
    } else torsoPath();
    g.clip();
    if (look.top === 'wax') waxFill(g, cx - shoulderW * 1.2, shoulderY - 4 * u, shoulderW * 2.4, hipY - shoulderY + 12 * u, topC, topC2, 7);
    else {
      g.fillStyle = topC; g.fillRect(cx - shoulderW * 1.7, shoulderY - 4 * u, shoulderW * 3.4, 70 * u);
      if (look.top === 'jersey') { g.fillStyle = topC2; g.fillRect(cx - shoulderW * 1.7, shoulderY - 4 * u, shoulderW * 0.9, 70 * u); g.fillRect(cx + shoulderW * 0.75, shoulderY - 4 * u, shoulderW, 70 * u); g.fillStyle = 'rgba(255,255,255,0.9)'; g.font = `700 ${9 * u}px 'Archivo', sans-serif`; g.textAlign = 'center'; g.fillText('9', cx + 2 * u, waistY + 3 * u); }
      if (look.top === 'tee' && look.print) { g.fillStyle = 'rgba(31,90,168,0.85)'; g.font = `800 ${5.5 * u}px 'Archivo', sans-serif`; g.textAlign = 'center'; g.fillText(look.print, cx + 1.5 * u, shoulderY + 12 * u); }
      if (look.top === 'boubou') { g.strokeStyle = topC2; g.lineWidth = 1.2 * u; g.beginPath(); g.moveTo(cx - 5 * u, shoulderY + 1 * u); g.quadraticCurveTo(cx + 1 * u, shoulderY + 22 * u, cx + 6 * u, shoulderY + 1 * u); g.stroke(); g.lineWidth = 0.5 * u; for (let i = 0; i < 7; i++) { const a = i / 6; g.beginPath(); g.arc(cx - 4.5 * u + a * 10 * u, shoulderY + 4 * u + Math.sin(a * Math.PI) * 14 * u, 1.3 * u, 0, TAU); g.stroke(); } }
      if (look.top === 'blouse') { g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 0.5 * u; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(cx - 6 * u + i * 2.4 * u, shoulderY + 3 * u); g.lineTo(cx - 7 * u + i * 2.4 * u, hipY); g.stroke(); } }
    }
    // volume du tissu et plis
    const tg = g.createLinearGradient(cx - shoulderW, 0, cx + shoulderW, 0);
    tg.addColorStop(0, 'rgba(255,255,255,0.2)'); tg.addColorStop(0.42, 'rgba(255,255,255,0)'); tg.addColorStop(0.72, 'rgba(0,0,0,0.2)'); tg.addColorStop(1, 'rgba(0,0,0,0.42)');
    g.fillStyle = tg; g.fillRect(cx - shoulderW * 1.7, shoulderY - 4 * u, shoulderW * 3.4, 70 * u);
    g.strokeStyle = 'rgba(0,0,0,0.15)'; g.lineWidth = 0.7 * u;
    for (const k of [-0.5, 0.3, 0.7]) { g.beginPath(); g.moveTo(cx + shoulderW * k, shoulderY + 6 * u); g.quadraticCurveTo(cx + shoulderW * (k + 0.05), waistY, cx + waistW * k * 1.1, hipY + 2 * u); g.stroke(); }
    // ombre du menton sur la poitrine
    softSpot(g, cx + 2 * u, shoulderY + 3 * u, 7 * u, '#000000', 0.25);
    g.restore();
    // col
    if (look.top === 'polo' || look.top === 'shirt') {
      g.fillStyle = shade(topC, -0.14);
      g.beginPath(); g.moveTo(cx - 5.5 * u, shoulderY - 1 * u); g.lineTo(cx - 1 * u, shoulderY + 7 * u); g.lineTo(cx - 7.5 * u, shoulderY + 4 * u); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(cx + 6 * u, shoulderY - 1 * u); g.lineTo(cx + 1.5 * u, shoulderY + 7 * u); g.lineTo(cx + 8.5 * u, shoulderY + 4 * u); g.closePath(); g.fill();
      g.fillStyle = 'rgba(0,0,0,0.5)'; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(cx + 0.5 * u, shoulderY + 9 * u + i * 5 * u, 0.7 * u, 0, TAU); g.fill(); }
    } else if (!long) { g.strokeStyle = shade(topC, -0.25); g.lineWidth = 1.3 * u; g.beginPath(); g.moveTo(cx - 5 * u, shoulderY - 0.5 * u); g.quadraticCurveTo(cx + 0.5 * u, shoulderY + 4 * u, cx + 6 * u, shoulderY - 0.5 * u); g.stroke(); }
  };

  // ---------------------------------------------------------- bras selon la pose
  const shF = [cx - shoulderW * 0.85, shoulderY + 2.5 * u], shN = [cx + shoulderW * 0.9, shoulderY + 2.5 * u];
  const UA = 17 * u, FA = 15 * u, rU = 2.9 * u * B, rF = 2.4 * u * B;
  const sleeve = look.top === 'tee' || look.top === 'jersey' || look.top === 'polo' || look.top === 'shirt' || look.top === 'blouse' || look.top === 'wax' || long;
  const sleeveLen = look.top === 'shirt' || long ? 1 : look.top === 'blouse' || look.top === 'wax' ? 0.6 : 0.4;
  const arm = (sh, elbow, wrist, near, handDir, curl, hidden) => {
    const sk = near ? skin : shade(skin, -0.22);
    limb(g, sh, elbow, rU, rU * 0.85, sk, near ? 0.25 : 0.1);
    if (!hidden) limb(g, elbow, wrist, rF, rF * 0.8, sk, near ? 0.2 : 0.08);
    if (sleeve) {
      const e = [sh[0] + (elbow[0] - sh[0]) * sleeveLen, sh[1] + (elbow[1] - sh[1]) * sleeveLen];
      limb(g, sh, e, rU * 1.1, rU * 1.0, near ? topC : shade(topC, -0.2), 0);
      if (long) { const e2 = [elbow[0] + (wrist[0] - elbow[0]) * 0.75, elbow[1] + (wrist[1] - elbow[1]) * 0.75]; limb(g, elbow, e2, rF * 1.6, rF * 2.2, near ? topC : shade(topC, -0.2), 0); }
    }
    if (!hidden) hand(g, wrist[0], wrist[1], 3.2 * u * B, handDir, sk, curl, 1);
  };
  const armDown = (sh, near, k = 1) => { const e = [sh[0] + k * 1.5 * u, sh[1] + UA]; const w = [e[0] + k * 1.2 * u, e[1] + FA]; return [e, w]; };

  // ordre : bras lointain, torse, bras proche, tête
  let far, near;
  switch (pose) {
    case 'hip': { // main proche sur la hanche, bras lointain le long du corps
      far = armDown(shF, false, -1);
      near = [[shN[0] + 9 * u, shN[1] + 12 * u], [cx + hipW * 0.95, hipY - 1 * u]];
      break; }
    case 'cross': {
      far = [[shF[0] - 4 * u, shF[1] + 14 * u], [cx + 6 * u, shoulderY + 16 * u]];
      near = [[shN[0] + 5 * u, shN[1] + 14 * u], [cx - 5 * u, shoulderY + 14 * u]];
      break; }
    case 'pocket': {
      far = [[shF[0] - 1 * u, shF[1] + UA], [cx - hipW * 0.6, hipY + 1 * u]];
      near = [[shN[0] + 1.5 * u, shN[1] + UA], [cx + hipW * 0.65, hipY + 1 * u]];
      break; }
    case 'helmet': { // casque de zem sous le bras lointain
      far = [[shF[0] - 3 * u, shF[1] + 14 * u], [cx - shoulderW * 0.4, waistY + 2 * u]];
      near = armDown(shN, true, 1);
      break; }
    case 'watch': { // regarde sa montre
      far = armDown(shF, false, -1);
      near = [[shN[0] + 3 * u, shN[1] + UA], [cx + 1 * u, shoulderY + 14 * u]];
      break; }
    case 'counter': {
      far = [[shF[0] - 3 * u, shF[1] + 14 * u], [cx - 4 * u, hipY + 2 * u]];
      near = [[shN[0] + 4 * u, shN[1] + 14 * u], [cx + 8 * u, hipY + 1 * u]];
      break; }
    case 'run': {
      far = [[shF[0] - 2 * u + ph * 6 * u, shF[1] + 13 * u], [shF[0] + 6 * u + ph * 12 * u, shF[1] + 8 * u + Math.abs(ph) * 4 * u]];
      near = [[shN[0] - 1 * u - ph * 6 * u, shN[1] + 13 * u], [shN[0] + 7 * u - ph * 12 * u, shN[1] + 8 * u + Math.abs(ph) * 4 * u]];
      break; }
    default: { far = armDown(shF, false, -1); near = armDown(shN, true, 1); }
  }
  arm(shF, far[0], far[1], false, pose === 'cross' ? 1.4 : pose === 'helmet' ? 0.2 : 0.1, pose === 'pocket' || pose === 'cross');
  if (pose === 'helmet') { // casque
    const hx_ = cx - shoulderW * 0.45, hy_ = waistY - 1 * u;
    const hg = g.createRadialGradient(hx_ - 2 * u, hy_ - 3 * u, 1 * u, hx_, hy_, 7 * u);
    hg.addColorStop(0, '#f6f0e4'); hg.addColorStop(0.6, '#d8cfbd'); hg.addColorStop(1, '#8a8070');
    g.fillStyle = hg; g.beginPath(); g.arc(hx_, hy_, 6.5 * u, Math.PI, 0); g.lineTo(hx_ + 6.5 * u, hy_ + 3 * u); g.lineTo(hx_ - 6.5 * u, hy_ + 3 * u); g.closePath(); g.fill();
    g.fillStyle = '#2a2a2a'; g.fillRect(hx_ - 6.5 * u, hy_ + 1.5 * u, 13 * u, 1.6 * u);
    g.fillStyle = '#e3a92f'; g.fillRect(hx_ - 5 * u, hy_ - 2 * u, 10 * u, 1.2 * u);
  }
  drawGarment();
  if (pose === 'cross') { // avant-bras proches croisés devant
    const sk = skin;
    limb(g, [cx + 6 * u, shoulderY + 16 * u], [cx - 7 * u, shoulderY + 13 * u], rF, rF * 0.85, shade(sk, -0.15), 0.12);
    hand(g, cx - 7.5 * u, shoulderY + 13 * u, 3 * u * B, 1.9, shade(sk, -0.1), 0.6, 1);
    limb(g, near[0], [cx - 4 * u, shoulderY + 15.5 * u], rF, rF * 0.85, sk, 0.2);
    limb(g, shN, near[0], rU, rU * 0.85, sk, 0.25);
    if (sleeve) limb(g, shN, [shN[0] + (near[0][0] - shN[0]) * sleeveLen, shN[1] + (near[0][1] - shN[1]) * sleeveLen], rU * 1.18, rU * 1.05, topC, 0);
    hand(g, cx + 7 * u, shoulderY + 15 * u, 3.2 * u * B, 1.3, sk, 0.6, 1);
  } else if (pose === 'pocket') {
    limb(g, shN, near[0], rU, rU * 0.85, skin, 0.25);
    limb(g, near[0], [near[1][0], near[1][1] - 1 * u], rF, rF * 0.8, skin, 0.15);
    if (sleeve) limb(g, shN, [shN[0] + (near[0][0] - shN[0]) * sleeveLen, shN[1] + (near[0][1] - shN[1]) * sleeveLen], rU * 1.18, rU * 1.05, topC, 0);
    g.fillStyle = shade(bottomC, -0.05); g.beginPath(); g.ellipse(near[1][0], hipY + 2 * u, 4 * u, 3 * u, 0, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 0.6 * u; g.beginPath(); g.moveTo(near[1][0] - 3.5 * u, hipY + 0.5 * u); g.lineTo(near[1][0] + 3 * u, hipY + 1.5 * u); g.stroke();
  } else if (pose === 'watch') {
    arm(shN, near[0], near[1], true, -1.2, 0.5, false);
    g.fillStyle = '#2a2a2a'; g.beginPath(); g.arc(near[1][0] + 1 * u, near[1][1] - 1.5 * u, 1.6 * u, 0, TAU); g.fill();
    g.fillStyle = '#e8e4d8'; g.beginPath(); g.arc(near[1][0] + 1 * u, near[1][1] - 1.5 * u, 1.1 * u, 0, TAU); g.fill();
  } else if (pose === 'hip') {
    arm(shN, near[0], near[1], true, 2.4, 0.5, false);
  } else if (pose === 'counter') {
    arm(shN, near[0], near[1], true, 1.2, 0.3, false);
  } else {
    arm(shN, near[0], near[1], true, pose === 'helmet' ? 0.1 : run ? 1.2 : 0.05, run ? 0.9 : 0.25, false);
  }
  // ---------------------------------------------------------- tête
  const H = headOnly(id, look);
  // le visage du portrait (sommet des cheveux → menton) fait environ 310 px ; on lui donne 14,5 unités
  const hs = (16 * u) / 310;
  g.drawImage(H, cx - 260 * hs + 0.6 * u + (run ? 2.5 * u : 0), shoulderY - 493 * hs + 1.2 * u + (run ? Math.abs(ph) * 0.8 * u : 0), H.width * hs, H.height * hs);

  if (hover) {
    g.strokeStyle = 'rgba(255,214,120,0.95)'; g.lineWidth = 2.5; g.setLineDash([6, 6]);
    g.beginPath(); g.ellipse(x, groundY + 0.3 * u, 14 * u, 2.6 * u, 0, 0, TAU); g.stroke(); g.setLineDash([]);
  }
  void chinY; void P;
  return { x0: cx - shoulderW * 1.6, x1: cx + shoulderW * 1.6, y0: shoulderY - 22 * u, y1: groundY };
}
