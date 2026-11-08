// Ambiance sonore synthétisée : rumeur du marché, motos, klaxons, vagues, musique.
// Bouton « son » : coupe tout (mémorisé dans localStorage).

let ac = null, master = null, bed = null, bedF = null, sea = null, music = null, timer = null, place = 'etal';
const KEY = 'assigame.mute';
export let muted = (() => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } })();

function noiseBuf(sec, color = 'pink') {
  const len = ac.sampleRate * sec, b = ac.createBuffer(2, len, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1;
      if (color === 'brown') { b0 = 0.995 * b0 + w * 0.06; d[i] = b0; }
      else { b0 = 0.997 * b0 + w * 0.029; b1 = 0.985 * b1 + w * 0.032; b2 = 0.95 * b2 + w * 0.048; d[i] = (b0 + b1 + b2) * 0.3; } } }
  return b;
}

export function initAudio() {
  if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  ac = new AC();
  master = ac.createGain(); master.gain.value = muted ? 0 : 0.8; master.connect(ac.destination);
  const s1 = ac.createBufferSource(); s1.buffer = noiseBuf(4); s1.loop = true;
  bedF = ac.createBiquadFilter(); bedF.type = 'bandpass'; bedF.frequency.value = 900; bedF.Q.value = 0.7;
  bed = ac.createGain(); bed.gain.value = 0.3; s1.connect(bedF); bedF.connect(bed); bed.connect(master); s1.start();
  const s2 = ac.createBufferSource(); s2.buffer = noiseBuf(6, 'brown'); s2.loop = true;
  const sf = ac.createBiquadFilter(); sf.type = 'lowpass'; sf.frequency.value = 700;
  sea = ac.createGain(); sea.gain.value = 0; s2.connect(sf); sf.connect(sea); sea.connect(master); s2.start();
  music = ac.createGain(); music.gain.value = 0.22; music.connect(master);
  startLoops();
}

export function setMuted(m) {
  muted = m; try { localStorage.setItem(KEY, m ? '1' : '0'); } catch { /* rien */ }
  if (master) master.gain.setTargetAtTime(m ? 0 : 0.8, ac.currentTime, 0.05);
}

export function setPlace(p) {
  place = p; if (!ac) return;
  const t = ac.currentTime;
  bed.gain.setTargetAtTime(p === 'hotel' ? 0.06 : p === 'menu' ? 0.12 : 0.32, t, 0.6);
  sea.gain.setTargetAtTime(p === 'hotel' ? 0.5 : 0, t, 0.6);
  music.gain.setTargetAtTime(p === 'menu' ? 0.32 : p === 'dialogue' ? 0.12 : 0.18, t, 0.6);
}

function tone(t, f, dur, vol, type = 'sine', dest = master, attack = 0.005) {
  const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = f;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.05); return o;
}
function motoPass(t) {
  const o = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter(), p = ac.createStereoPanner ? ac.createStereoPanner() : null;
  o.type = 'sawtooth'; const base = 70 + Math.random() * 40, dur = 2.5 + Math.random() * 2;
  o.frequency.setValueAtTime(base * 1.15, t); o.frequency.linearRampToValueAtTime(base * 0.85, t + dur);
  f.type = 'lowpass'; f.frequency.value = 900;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + dur * 0.45); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(f); f.connect(g);
  if (p) { const dir = Math.random() < 0.5 ? -1 : 1; p.pan.setValueAtTime(-dir, t); p.pan.linearRampToValueAtTime(dir, t + dur); g.connect(p); p.connect(master); } else g.connect(master);
  o.start(t); o.stop(t + dur + 0.1);
}
function horn(t) { const f = 380 + Math.random() * 120; tone(t, f, 0.18, 0.03, 'square'); tone(t + 0.22, f, 0.12, 0.025, 'square'); }
function voiceCall(t) { // appel de vendeuse, voix stylisée
  const f0 = 260 + Math.random() * 120;
  for (let i = 0; i < 3; i++) {
    const o = ac.createOscillator(), g = ac.createGain(), bp = ac.createBiquadFilter(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(f0 * [1, 1.12, 0.9][i], t + i * 0.22); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 4;
    g.gain.setValueAtTime(0.0001, t + i * 0.22); g.gain.exponentialRampToValueAtTime(0.018, t + i * 0.22 + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.22 + 0.2);
    o.connect(bp); bp.connect(g); g.connect(master); o.start(t + i * 0.22); o.stop(t + i * 0.22 + 0.25);
  }
}

// Musique : groove léger (basse, guitare en arpèges, shaker), timbres génériques
function startLoops() {
  let next = ac.currentTime + 0.2, step = 0;
  const bpm = 104, sp = 60 / bpm / 4;
  const chords = [[57, 61, 64], [54, 57, 61], [50, 54, 57], [52, 56, 59]];
  timer = setInterval(() => {
    while (next < ac.currentTime + 0.3) {
      const bar = Math.floor(step / 16) % 4, i = step % 16, ch = chords[bar];
      if ([0, 6, 10].includes(i)) tone(next, 440 * Math.pow(2, (ch[0] - 24 - 69) / 12), 0.35, 0.18, 'triangle', music);
      if (i % 2 === 0) { const n = ch[(i / 2) % 3] + (i % 8 === 4 ? 12 : 0); tone(next, 440 * Math.pow(2, (n - 69) / 12), 0.22, 0.05, 'triangle', music); }
      if (i % 2 === 1) { const len = 0.04 * ac.sampleRate, b = ac.createBuffer(1, len, ac.sampleRate), d = b.getChannelData(0); for (let k = 0; k < len; k++) d[k] = (Math.random() * 2 - 1) * (1 - k / len); const s = ac.createBufferSource(); s.buffer = b; const f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 6000; const g = ac.createGain(); g.gain.value = 0.05; s.connect(f); f.connect(g); g.connect(music); s.start(next); }
      next += sp; step++;
    }
    if (place !== 'menu' && place !== 'hotel' && Math.random() < 0.02) motoPass(ac.currentTime + 0.1);
    if (place !== 'hotel' && Math.random() < 0.008) horn(ac.currentTime + 0.1);
    if (place !== 'hotel' && place !== 'menu' && Math.random() < 0.01) voiceCall(ac.currentTime + 0.1);
  }, 80);
}

let engine = null;
export function setEngine(on) {
  if (!ac) return;
  if (on && !engine) {
    const o = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.value = 95; f.type = 'lowpass'; f.frequency.value = 700;
    const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = 11; lg.gain.value = 9; lfo.connect(lg); lg.connect(o.frequency);
    g.gain.setValueAtTime(0.0001, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.06, ac.currentTime + 0.4);
    o.connect(f); f.connect(g); g.connect(master); o.start(); lfo.start(); engine = { o, g, lfo };
  } else if (!on && engine) { const e = engine; engine = null; e.g.gain.setTargetAtTime(0.0001, ac.currentTime, 0.25); setTimeout(() => { e.o.stop(); e.lfo.stop(); }, 900); }
}
export function sfx(kind) {
  if (!ac) return; const t = ac.currentTime;
  if (kind === 'crash') { const len = 0.3 * ac.sampleRate, b = ac.createBuffer(1, len, ac.sampleRate), d = b.getChannelData(0); for (let k = 0; k < len; k++) d[k] = (Math.random() * 2 - 1) * Math.pow(1 - k / len, 2); const s = ac.createBufferSource(); s.buffer = b; const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900; const g = ac.createGain(); g.gain.value = 0.35; s.connect(f); f.connect(g); g.connect(master); s.start(t); tone(t, 90, 0.3, 0.2, 'triangle'); return; }
  if (kind === 'step') { const len = 0.05 * ac.sampleRate, b = ac.createBuffer(1, len, ac.sampleRate), d = b.getChannelData(0); for (let k = 0; k < len; k++) d[k] = (Math.random() * 2 - 1) * (1 - k / len); const s = ac.createBufferSource(); s.buffer = b; const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500; const g = ac.createGain(); g.gain.value = 0.25; s.connect(f); f.connect(g); g.connect(master); s.start(t); return; }
  if (kind === 'tick') { tone(t, 1200, 0.05, 0.05, 'square'); return; }
  if (kind === 'found') { tone(t, 659, 0.2, 0.07, 'triangle'); tone(t + 0.12, 988, 0.35, 0.07, 'triangle'); return; }
  if (kind === 'card') { tone(t, 220, 1.2, 0.08, 'sine'); tone(t + 0.05, 330, 1.4, 0.05, 'sine'); tone(t + 0.1, 440, 1.6, 0.04, 'triangle'); return; }
  if (kind === 'good') { [523, 659, 784].forEach((f, i) => tone(t + i * 0.07, f, 0.35, 0.06, 'triangle')); return; }
  if (kind === 'clue') { tone(t, 784, 0.25, 0.08, 'triangle'); tone(t + 0.1, 1175, 0.4, 0.07, 'triangle'); }
  else if (kind === 'click') tone(t, 600, 0.06, 0.03, 'triangle');
  else if (kind === 'wrong') { tone(t, 220, 0.25, 0.06, 'square'); tone(t + 0.15, 165, 0.35, 0.05, 'square'); }
  else if (kind === 'reveal') { [523, 659, 784, 1046].forEach((f, i) => tone(t + i * 0.09, f, 0.5, 0.06, 'triangle')); }
  else if (kind === 'move') { const len = 0.25 * ac.sampleRate, b = ac.createBuffer(1, len, ac.sampleRate), d = b.getChannelData(0); for (let k = 0; k < len; k++) d[k] = (Math.random() * 2 - 1) * Math.sin(Math.PI * k / len) * 0.5; const s = ac.createBufferSource(); s.buffer = b; const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1200; const g = ac.createGain(); g.gain.value = 0.08; s.connect(f); f.connect(g); g.connect(master); s.start(t); }
}
