// Personnages 3D (MakeHuman, squelette Quaternius, clips de capture de mouvement) posés sur les décors peints.
// Rendu dans un canevas WebGL transparent au-dessus du décor : lumière du jour, ombres de contact,
// plans de dialogue en gros plan avec le personnage qui parle.

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';

const BASE = import.meta.env.BASE_URL || './';
export const MODELS = `${BASE}models/`;
const FOV = 28, D = 7.2;

export class Stage3D {
  constructor(canvas) {
    const small = Math.min(window.innerWidth, window.innerHeight) < 700;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: !small, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1 : 1.5));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
    this.hemi = new THREE.HemisphereLight(0xdde8ff, 0xb08a5a, 0.75); this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xfff1d6, 2.2); this.sun.position.set(-5, 9, 6); this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048); this.sun.shadow.camera.left = -10; this.sun.shadow.camera.right = 10; this.sun.shadow.camera.top = 10; this.sun.shadow.camera.bottom = -10; this.sun.shadow.camera.far = 40; this.sun.shadow.bias = -0.0004; this.sun.shadow.normalBias = 0.02;
    this.scene.add(this.sun); this.scene.add(this.sun.target);
    // le sol invisible ne sert qu'à recevoir les ombres de contact
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ opacity: 0.32 }));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; this.scene.add(ground);
    this.loader = new GLTFLoader(); this.cache = new Map(); this.clips = null;
    this.people = []; this.mixers = []; this.t = 0; this.focusId = null; this.focusK = 0; this.talking = false; this.visible = true;
    this.resize(); window.addEventListener('resize', () => this.resize());
    this.canvas = canvas;
  }
  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this.W = w; this.H = h;
  }
  show(on) { this.canvas.hidden = !on; }

  async loadGltf(url) { if (!this.cache.has(url)) this.cache.set(url, this.loader.loadAsync(url)); return this.cache.get(url); }
  async ensureClips() { if (!this.clips) this.clips = (await this.loadGltf(`${MODELS}UAL_blender.glb`)).animations.filter(c => c.name !== 'A_TPose'); return this.clips; }

  // Place une distribution : [{ id, url, fx (0..1), sc (0.8..1), anim }]
  async setPeople(list) {
    for (const p of this.people) { this.scene.remove(p.group); const i = this.mixers.indexOf(p.mixer); if (i >= 0) this.mixers.splice(i, 1); }
    this.people = [];
    const gen = ++this.gen || (this.gen = 1);
    await this.ensureClips();
    const loaded = await Promise.all(list.map(async (it) => {
      try { return [it, await this.loadGltf(it.url)]; } catch (e) { console.warn('modèle 3D manquant', it.url); return [it, null]; }
    }));
    if (gen !== this.gen) return;
    for (const [it, gltf] of loaded) {
      if (!gltf) continue;
      const model = skeletonClone(gltf.scene);
      model.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; o.frustumCulled = false; o.geometry.computeVertexNormals(); o.material = o.material.clone(); if (o.material.map) { o.material.roughness = Math.min(0.75, o.material.roughness + 0.1); } } });
      const group = new THREE.Group(); group.add(model); this.scene.add(group);
      const z = -(1 - it.sc) * 7, dist = D - z;
      const width = 2 * dist * Math.tan(FOV / 2 * Math.PI / 180) * this.camera.aspect;
      group.position.set((it.fx - 0.5) * width, 0, z);
      model.rotation.y = it.face || 0.25 * (it.fx > 0.5 ? -1 : 1);   // légèrement tourné vers le centre
      const mixer = new THREE.AnimationMixer(model);
      const find = (n) => this.clips.find(c => c.name === n) || this.clips.find(c => c.name.toLowerCase().includes(n.toLowerCase()));
      const P = { id: it.id, group, model, mixer, current: null, base: it.anim || 'Idle_Loop',
        play: (name, fade = 0.35) => { const c = find(name); if (!c || P.current === c.name) return; const next = mixer.clipAction(c); next.reset().fadeIn(fade).play(); next.time = Math.random() * c.duration; if (P.current) mixer.clipAction(find(P.current)).fadeOut(fade); P.current = c.name; } };
      P.play(P.base, 0.01);
      this.mixers.push(mixer); this.people.push(P);
    }
  }

  // Gros plan de dialogue sur un personnage ; null pour revenir au plan large
  focus(id) { this.focusId = id; }
  setTalking(on) { this.talking = on; }
  setDaylight(k) {
    // k : 0 à 9 h (lumière fraîche), 1 à 14 h (lumière dure et chaude)
    this.sun.intensity = 1.9 + k * 0.9; this.sun.color.setRGB(1, 0.95 - k * 0.08, 0.84 - k * 0.16);
    this.hemi.intensity = 0.8 - k * 0.15;
  }

  update(dt) {
    this.t += dt;
    for (const m of this.mixers) m.update(dt);
    const F = this.people.find(p => p.id === this.focusId);
    this.focusK += ((F ? 1 : 0) - this.focusK) * Math.min(1, dt * 4);
    for (const p of this.people) {
      const want = p === F ? (this.talking ? 'Idle_Talking_Loop' : 'Idle_Loop') : p.base;
      p.play(want);
    }
    // plan large : caméra à hauteur d'homme, le sol au bas de l'écran ; gros plan : visage, de trois quarts, à gauche
    const hC = 0.94 * D * Math.tan(FOV / 2 * Math.PI / 180);
    const wide = { pos: new THREE.Vector3(0, hC, D), look: new THREE.Vector3(0, hC, 0), fov: FOV, off: 0 };
    let pos = wide.pos, look = wide.look, fov = wide.fov, off = 0;
    if (F && this.focusK > 0.001) {
      const head = F.model.getObjectByName('Head') || F.model.getObjectByName('head');
      const hp = new THREE.Vector3(); if (head) head.getWorldPosition(hp); else F.group.getWorldPosition(hp).add(new THREE.Vector3(0, 1.55, 0));
      hp.y += 0.06;
      const dir = new THREE.Vector3(-0.42, 0.08, 1).normalize().multiplyScalar(1.45);
      const cp = hp.clone().add(dir);
      pos = wide.pos.clone().lerp(cp, this.focusK); look = wide.look.clone().lerp(hp.clone().add(new THREE.Vector3(0, -0.12, 0)), this.focusK);
      fov = FOV + (24 - FOV) * this.focusK; off = 0.27 * this.focusK;
    }
    this.camera.position.copy(pos); this.camera.lookAt(look);
    if (Math.abs(this.camera.fov - fov) > 0.01) { this.camera.fov = fov; this.camera.updateProjectionMatrix(); }
    if (off > 0.001) this.camera.setViewOffset(this.W, this.H, off * this.W, 0, this.W, this.H); else if (this.camera.view && this.camera.view.enabled) this.camera.clearViewOffset();
    this.sun.target.position.set(0, 0, 0);
  }

  // Boîtes écran des personnages (pour le survol et le clic), en pixels CSS
  boxes() {
    const out = {};
    const v = new THREE.Vector3();
    for (const p of this.people) {
      const head = p.model.getObjectByName('Head') || p.model.getObjectByName('head');
      const top = new THREE.Vector3(); if (head) head.getWorldPosition(top); else p.group.getWorldPosition(top).add(new THREE.Vector3(0, 1.6, 0)); top.y += 0.2;
      const foot = new THREE.Vector3(); p.group.getWorldPosition(foot);
      v.copy(top).project(this.camera); const sx1 = (v.x + 1) / 2 * this.W, sy1 = (1 - v.y) / 2 * this.H;
      v.copy(foot).project(this.camera); const sx2 = (v.x + 1) / 2 * this.W, sy2 = (1 - v.y) / 2 * this.H;
      const hw = (sy2 - sy1) * 0.22;
      out[p.id] = { x0: Math.min(sx1, sx2) - hw, x1: Math.max(sx1, sx2) + hw, y0: sy1, y1: sy2, fx: sx2, fy: sy2, hw };
    }
    return out;
  }
  render() { if (this.visible) this.renderer.render(this.scene, this.camera); }
}
