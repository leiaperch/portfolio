// Hero « NEXUS 2049 » — métropole d'îlot stylisée, vivante et évolutive, en
// Three.js. La ville respire, des vagues de données (densité, végétation,
// énergie, pollution) balayent les quartiers en continu, la caméra orbite
// lentement et le clic-glissé la fait pivoter. Écho direct du simulateur.

import * as THREE from 'three';

// palettes des couches de données de NEXUS
const LAYERS = [
  [0.36, 0.60, 1.05], // densité — bleu
  [0.34, 0.82, 0.52], // végétation — vert
  [1.05, 0.72, 0.32], // énergie — ambre
  [1.05, 0.42, 0.36], // pollution — rouge
];
const WARM = [1.0, 0.82, 0.55]; // lueur de fenêtres, nuit

// géométrie boîte avec faux ombrage par sommet (base posée au sol)
function shadedBox() {
  const g = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
  const shade = [0.6, 0.52, 1.0, 0.22, 0.74, 0.46]; // +X -X +Y -Y +Z -Z
  const col = [];
  for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) col.push(shade[f], shade[f], shade[f]);
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return g;
}
function shadedCone() {
  const g = new THREE.ConeGeometry(0.5, 1, 6).translate(0, 0.5, 0);
  const p = g.attributes.position, col = [];
  for (let i = 0; i < p.count; i++) col.push(0.55 + 0.5 * p.getY(i)); // pointe plus claire
  g.setAttribute('color', new THREE.Float32BufferAttribute(col.flatMap((c) => [c * 0.5, c, c * 0.6]), 3));
  return g;
}

// bruit déterministe simple
const frac = (x) => x - Math.floor(x);
const rnd = (n) => frac(Math.abs(Math.sin(n * 127.1) * 43758.5453));

export function createNexusHero(canvas, { reducedMotion = false } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  } catch (e) {
    canvas.style.background = 'radial-gradient(70% 70% at 50% 40%,#141b2a,#05060a)';
    return { dispose() {}, pause() {}, resume() {} };
  }
  const DPR = Math.min(window.devicePixelRatio || 1, 1.6);
  renderer.setPixelRatio(DPR);

  const scene = new THREE.Scene();
  const BG = new THREE.Color(0x080a10);
  scene.background = BG;
  scene.fog = new THREE.FogExp2(0x080a10, 0.019);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 300);

  // --- île + eau ---
  const RCITY = 17;
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(RCITY + 22, 64).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x070b14 }),
  );
  water.position.y = -0.02; scene.add(water);
  const island = new THREE.Mesh(
    new THREE.CircleGeometry(RCITY + 3, 64).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x0d1220 }),
  );
  scene.add(island);

  // périphériques (anneaux fins)
  for (const r of [6.5, 11, 15.5]) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(r - 0.06, r + 0.06, 96).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x223049, transparent: true, opacity: 0.5 }),
    );
    ring.position.y = 0.015; scene.add(ring);
  }

  // --- semis d'immeubles / arbres sur une grille jitterée ---
  const build = [], trees = [];
  const STEP = 1.35;
  for (let gx = -RCITY; gx <= RCITY; gx += STEP) {
    for (let gz = -RCITY; gz <= RCITY; gz += STEP) {
      const seed = gx * 73.1 + gz * 19.7 + 500;
      const jx = gx + (rnd(seed) - 0.5) * 0.9;
      const jz = gz + (rnd(seed + 1) - 0.5) * 0.9;
      const d = Math.hypot(jx, jz);
      const envelope = RCITY * (0.82 + 0.18 * Math.sin(Math.atan2(jz, jx) * 3 + 1)); // côte irrégulière
      if (d > envelope) continue;
      const near = 1 - d / RCITY; // 1 au centre
      if (rnd(seed + 2) < 0.16 + 0.22 * (1 - near)) {
        // arbre (plus fréquent en périphérie)
        trees.push({ x: jx, z: jz, s: 0.5 + rnd(seed + 3) * 0.7 });
      } else {
        const w = 0.55 + rnd(seed + 4) * 0.5;
        const dp = 0.55 + rnd(seed + 5) * 0.5;
        const hMax = 0.6 + Math.pow(near, 1.7) * 7.5 * (0.5 + rnd(seed + 6));
        build.push({ x: jx, z: jz, w, dp, h: hMax, a: Math.atan2(jz, jx), r: d, ph: rnd(seed + 7) * 6.28, fl: rnd(seed + 8) });
      }
    }
  }

  const bMesh = new THREE.InstancedMesh(shadedBox(), new THREE.MeshBasicMaterial({ vertexColors: true }), build.length);
  bMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(bMesh);
  const tMesh = new THREE.InstancedMesh(shadedCone(), new THREE.MeshBasicMaterial({ vertexColors: true }), trees.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), pos = new THREE.Vector3();
  trees.forEach((t, i) => {
    m.compose(pos.set(t.x, 0, t.z), q, sc.set(t.s, t.s * 1.6, t.s));
    tMesh.setMatrixAt(i, m);
  });
  tMesh.instanceMatrix.needsUpdate = true;
  scene.add(tMesh);

  // couleur d'un immeuble à l'instant t (mélange couche de données + lueur chaude)
  const col = new THREE.Color();
  function paint(o, time) {
    const t = time * 0.05;
    const sector = frac(o.a / (2 * Math.PI) + t) * LAYERS.length;
    const idx = Math.floor(sector) % LAYERS.length;
    const nx = (idx + 1) % LAYERS.length;
    let f = sector - Math.floor(sector); f = f * f * (3 - 2 * f);
    const la = LAYERS[idx], lb = LAYERS[nx];
    const lr = la[0] + (lb[0] - la[0]) * f, lg = la[1] + (lb[1] - la[1]) * f, lbv = la[2] + (lb[2] - la[2]) * f;
    // vague radiale + scintillement de fenêtres
    const pulse = 0.5 + 0.5 * Math.sin(o.r * 0.5 - time * 1.1 + o.a * 2);
    const flick = 0.8 + 0.2 * Math.sin(time * 3 + o.ph * 9) * (o.fl > 0.6 ? 1 : 0.3);
    const k = 0.3 + 0.58 * pulse;
    return col.setRGB(
      (WARM[0] * flick) * (1 - k) + lr * k,
      (WARM[1] * flick) * (1 - k) + lg * k,
      (WARM[2] * flick) * (1 - k) + lbv * k,
    );
  }

  // --- interaction ---
  let yaw = 0.6, vyaw = 0, down = false, lx = 0;
  const onDown = (e) => { down = true; lx = (e.touches ? e.touches[0] : e).clientX; canvas.classList.add('grabbing'); };
  const onMove = (e) => { if (!down) return; const x = (e.touches ? e.touches[0] : e).clientX; vyaw += (x - lx) * 0.005; lx = x; };
  const onUp = () => { down = false; canvas.classList.remove('grabbing'); };
  canvas.addEventListener('mousedown', onDown);
  window.addEventListener('mousemove', onMove, { passive: true });
  window.addEventListener('mouseup', onUp);
  canvas.addEventListener('touchstart', onDown, { passive: true });
  canvas.addEventListener('touchmove', onMove, { passive: true });
  window.addEventListener('touchend', onUp);

  const resize = () => {
    const w = canvas.clientWidth || canvas.parentElement?.clientWidth || 800;
    const h = canvas.clientHeight || canvas.parentElement?.clientHeight || 500;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize); ro.observe(canvas);

  const t0 = performance.now();
  let raf = 0, wantRun = true;
  const active = () => wantRun && !document.hidden;
  function frameBody(time) {
    const cr = 29, cy = 14.5;
    camera.position.set(Math.sin(yaw) * cr, cy, Math.cos(yaw) * cr);
    camera.lookAt(0, 1.8, 0);
    for (let i = 0; i < build.length; i++) {
      const o = build[i];
      const breathe = reducedMotion ? 1 : 1 + 0.05 * Math.sin(time * 0.7 + o.ph);
      m.compose(pos.set(o.x, 0, o.z), q, sc.set(o.w, o.h * breathe, o.dp));
      bMesh.setMatrixAt(i, m);
      bMesh.setColorAt(i, paint(o, time));
    }
    bMesh.instanceMatrix.needsUpdate = true;
    if (bMesh.instanceColor) bMesh.instanceColor.needsUpdate = true;
    renderer.render(scene, camera);
  }
  function draw(now) {
    if (!active()) { raf = 0; return; }
    const time = reducedMotion ? 6 : (now - t0) / 1000;
    yaw += vyaw; vyaw *= 0.92;
    if (!down && !reducedMotion) yaw += 0.0016;
    frameBody(time);
    raf = requestAnimationFrame(draw);
  }
  const kick = () => { if (!raf && active()) raf = requestAnimationFrame(draw); };
  document.addEventListener('visibilitychange', kick);
  kick();

  return {
    pause() { wantRun = false; },
    resume() { wantRun = true; kick(); },
    dispose() {
      wantRun = false;
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      canvas.removeEventListener('touchstart', onDown);
      canvas.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
      document.removeEventListener('visibilitychange', kick);
      bMesh.geometry.dispose(); bMesh.material.dispose();
      tMesh.geometry.dispose(); tMesh.material.dispose();
      renderer.dispose();
    },
  };
}
