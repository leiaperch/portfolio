// Hero « SILLON » — une piste qui défile à l'infini, vue de derrière le diamant
// de platine qui roule, en Three.js. La palette glisse d'un genre à l'autre
// (le concept du jeu : une piste = un genre). Obstacles, trous et portiques
// défilent en boucle ; la souris fait louvoyer le diamant.

import * as THREE from 'three';

// teintes de genres (HSL h) : futurebass rose, techno bleu, chiptune turquoise, house ambre
const HUES = [0.92, 0.60, 0.47, 0.09];

function shadedBox(top = 1, side = 0.7) {
  const g = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
  const sh = [side, side, top, side * 0.4, side * 1.05, side * 0.85];
  const col = [];
  for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) col.push(sh[f], sh[f], sh[f]);
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return g;
}
const frac = (x) => x - Math.floor(x);
const rnd = (n) => frac(Math.abs(Math.sin(n * 91.7) * 43758.5453));

export function createSillonHero(canvas, { reducedMotion = false } = {}) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); }
  catch (e) { canvas.style.background = 'linear-gradient(160deg,#2a1030,#05060a)'; return { dispose() {}, pause() {}, resume() {} }; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x120a18);
  scene.fog = new THREE.Fog(0x120a18, 18, 46);
  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 120);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x202030, 0.85));
  const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(3, 8, 6); scene.add(key);
  const rim = new THREE.PointLight(0xff77aa, 1.2, 30); rim.position.set(0, 3, 2); scene.add(rim);

  // --- construction de la piste (2 périodes identiques, défilement en boucle) ---
  const R = 44, C = 5, TW = 1.12, RD = 1.12, L = R * RD;
  const laneX = (c) => (c - (C - 1) / 2) * TW;
  const tileMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0.0 });
  const obstMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.1 });

  // motif déterministe par rangée (période R)
  const rows = [];
  for (let j = 0; j < R; j++) {
    const hole = rnd(j + 3) < 0.14 ? Math.floor(rnd(j + 9) * C) : -1;
    const obst = rnd(j + 5) < 0.16 ? Math.floor(rnd(j + 7) * C) : -1;
    const gate = j % 15 === 7;
    rows.push({ hole, obst: obst === hole ? -1 : obst, gate });
  }
  let nTile = 0, nObst = 0;
  for (const r of rows) { nTile += C - (r.hole >= 0 ? 1 : 0); if (r.obst >= 0) nObst++; if (r.gate) { nObst += 3; } }
  nTile *= 2; nObst *= 2;

  const tiles = new THREE.InstancedMesh(shadedBox(1, 0.72), tileMat, nTile);
  const obst = new THREE.InstancedMesh(shadedBox(1, 0.66), obstMat, nObst);
  const track = new THREE.Group(); track.add(tiles, obst); scene.add(track);

  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  let ti = 0, oi = 0;
  for (let period = 0; period < 2; period++) {
    for (let j = 0; j < R; j++) {
      const r = rows[j];
      const z = -(j + period * R) * RD;
      for (let c = 0; c < C; c++) {
        if (c === r.hole) continue;
        m.compose(p.set(laneX(c), 0, z), q, s.set(TW * 0.94, 0.2, RD * 0.94));
        tiles.setMatrixAt(ti++, m);
      }
      if (r.obst >= 0) {
        m.compose(p.set(laneX(r.obst), 0.1, z), q, s.set(TW * 0.7, 0.9 + rnd(j) * 0.6, RD * 0.7));
        obst.setMatrixAt(oi++, m);
      }
      if (r.gate) {
        const px = (C / 2) * TW + 0.1;
        m.compose(p.set(-px, 0.1, z), q, s.set(0.28, 2.6, 0.28)); obst.setMatrixAt(oi++, m);
        m.compose(p.set(px, 0.1, z), q, s.set(0.28, 2.6, 0.28)); obst.setMatrixAt(oi++, m);
        m.compose(p.set(0, 2.5, z), q, s.set(2 * px + 0.4, 0.28, 0.28)); obst.setMatrixAt(oi++, m);
      }
    }
  }
  tiles.instanceMatrix.needsUpdate = true; obst.instanceMatrix.needsUpdate = true;

  // --- le diamant de platine ---
  const gem = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.52, 0),
    new THREE.MeshStandardMaterial({ color: 0xf3f6ff, metalness: 0.55, roughness: 0.1, emissive: 0x3a4a6a, emissiveIntensity: 0.65, flatShading: true }),
  );
  gem.position.set(0, 0.66, 2.3); scene.add(gem);
  const gemShadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.46, 24).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 }),
  );
  gemShadow.position.set(0, 0.11, 2.3); scene.add(gemShadow);

  // --- interaction : la souris fait louvoyer le diamant ---
  let targetX = 0, curX = 0;
  const maxX = laneX(C - 1) * 0.9;
  const onMove = (e) => {
    const t = e.touches ? e.touches[0] : e;
    const rct = canvas.getBoundingClientRect();
    targetX = ((t.clientX - rct.left) / rct.width - 0.5) * 2 * maxX;
  };
  canvas.addEventListener('mousemove', onMove, { passive: true });
  canvas.addEventListener('touchmove', onMove, { passive: true });

  const resize = () => {
    const w = canvas.clientWidth || canvas.parentElement?.clientWidth || 800;
    const h = canvas.clientHeight || canvas.parentElement?.clientHeight || 500;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize); ro.observe(canvas);

  const cA = new THREE.Color(), cB = new THREE.Color(), cSky = new THREE.Color();
  function palette(time) {
    const f = frac(time * 0.05) * HUES.length;
    const i = Math.floor(f) % HUES.length, k = f - Math.floor(f);
    let h = HUES[i] + ((((HUES[(i + 1) % HUES.length] - HUES[i]) % 1) + 1.5) % 1 - 0.5) * (k * k * (3 - 2 * k));
    h = frac(h);
    tileMat.color.setHSL(h, 0.5, 0.56);
    obstMat.color.setHSL(frac(h + 0.5), 0.55, 0.5);
    cSky.setHSL(h, 0.45, 0.09); scene.background = cSky; scene.fog.color = cSky;
    rim.color.setHSL(h, 0.8, 0.6);
    gem.material.emissive.setHSL(h, 0.4, 0.28);
  }

  const t0 = performance.now();
  let raf = 0, wantRun = true, scroll = 0;
  const active = () => wantRun && !document.hidden;
  function frameBody(time, dt) {
    palette(time);
    scroll += (reducedMotion ? 0 : 7.2) * dt;
    track.position.z = scroll % L;
    // diamant : rebond + roulis + louvoiement
    curX += (targetX - curX) * 0.08;
    const bounce = reducedMotion ? 0 : Math.abs(Math.sin(time * 3.4)) * 0.32;
    gem.position.x = curX; gem.position.y = 0.66 + bounce;
    gem.rotation.y = time * 1.6; gem.rotation.x = time * 2.2;
    gemShadow.position.x = curX;
    gemShadow.scale.setScalar(1 - bounce * 0.8);
    rim.position.x = curX;
    camera.position.set(curX * 0.4, 2.85, 6.4);
    camera.lookAt(curX * 0.2, 0.55, 0.6);
    renderer.render(scene, camera);
  }
  let last = t0;
  function draw(now) {
    if (!active()) { raf = 0; return; }
    const time = reducedMotion ? 4 : (now - t0) / 1000;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    frameBody(time, dt);
    raf = requestAnimationFrame(draw);
  }
  const kick = () => { if (!raf && active()) { last = performance.now(); raf = requestAnimationFrame(draw); } };
  document.addEventListener('visibilitychange', kick);
  kick();

  return {
    pause() { wantRun = false; },
    resume() { wantRun = true; kick(); },
    dispose() {
      wantRun = false;
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('touchmove', onMove);
      document.removeEventListener('visibilitychange', kick);
      tiles.geometry.dispose(); obst.geometry.dispose(); tileMat.dispose(); obstMat.dispose();
      gem.geometry.dispose(); gem.material.dispose();
      renderer.dispose();
    },
  };
}
