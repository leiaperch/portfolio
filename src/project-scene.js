// Scène 3D d'une page projet (Three.js), deux modes :
//   'orbit'   -> un modèle qui tourne, contrôlé à la souris (props, persos)
//   'explore' -> vue première personne, on se balade dans la scène (ZQSD/WASD + souris)
// Charge un glTF si `model` est fourni, sinon affiche un placeholder :
//   - orbit   -> torus knot chrome irisé
//   - explore -> un camp de nuit (feu, tentes, brume) pour montrer la balade
// Renvoie { dispose, mode, lock } (lock = entrer en mode balade, pour l'UI).

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export function createProjectScene(canvas, opts = {}) {
  const { mode = 'orbit', model = null, reducedMotion = false, onLockChange } = opts;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(mode === 'explore' ? 62 : 42, 1, 0.1, 200);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;

  function fitObject(obj, target = 2.2) {
    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    obj.position.sub(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    obj.scale.setScalar(target / maxDim);
  }

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  const disposables = [];
  const cleanups = [];
  let raf = 0;

  // ============================ MODE EXPLORE ============================
  if (mode === 'explore') {
    scene.fog = new THREE.FogExp2(0x5f5952, 0.028);
    camera.position.set(0, 1.6, 10);

    scene.add(new THREE.HemisphereLight(0x8a8478, 0x241f18, 0.65));
    const sun = new THREE.DirectionalLight(0xb9b0a0, 0.9);
    sun.position.set(-6, 10, 4);
    scene.add(sun);

    let campfire = null;
    let fireLight = null;

    function buildCamp() {
      const M = (c, r = 1) => new THREE.MeshStandardMaterial({ color: c, roughness: r });
      const mGround = M(0x2f2a22), mPlaza = M(0x4a4236), mPath = M(0x5a5044);
      const mWood = M(0x3a2a1a), mBeam = M(0x241a12), mPlaster = M(0x8a7f68, 0.95);
      const mRoof = M(0x4a3320), mTile = M(0x33302c), mCanvas = M(0xb3a888, 0.95),
        mCanvasG = M(0x555c42, 0.95), mStripe = M(0x7a3b34, 0.95);

      // --- sol : grand disque + place claire + chemins ---
      const ground = new THREE.Mesh(new THREE.CircleGeometry(45, 64), mGround);
      ground.rotation.x = -Math.PI / 2; scene.add(ground);
      const plaza = new THREE.Mesh(new THREE.CircleGeometry(13, 48), mPlaza);
      plaza.rotation.x = -Math.PI / 2; plaza.position.y = 0.01; scene.add(plaza);
      [-Math.PI / 2, Math.PI * 0.18, Math.PI * 0.85].forEach((a) => {
        const path = new THREE.Mesh(new THREE.PlaneGeometry(3, 26), mPath);
        path.rotation.x = -Math.PI / 2; path.rotation.z = a;
        path.position.set(Math.cos(a) * 9, 0.02, Math.sin(a) * 9);
        scene.add(path);
      });

      // --- helpers ---
      const tentGeo = (() => {
        const s = new THREE.Shape();
        s.moveTo(-1.4, 0); s.lineTo(1.4, 0); s.lineTo(0, 1.9); s.lineTo(-1.4, 0);
        return new THREE.ExtrudeGeometry(s, { depth: 3.2, bevelEnabled: false });
      })();
      const prism = (halfW, h, depth) => {
        const s = new THREE.Shape();
        s.moveTo(-halfW, 0); s.lineTo(halfW, 0); s.lineTo(0, h); s.lineTo(-halfW, 0);
        return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
      };
      function tent(x, z, rot, mat) {
        const m = new THREE.Mesh(tentGeo, mat); m.position.z = -1.6;
        const g = new THREE.Group(); g.add(m);
        g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g); return g;
      }
      function house(x, z, rot, w, d, h, chimney) {
        const g = new THREE.Group();
        const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mPlaster);
        body.position.y = h / 2; g.add(body);
        [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sz]) => {
          const beam = new THREE.Mesh(new THREE.BoxGeometry(0.16, h, 0.16), mBeam);
          beam.position.set((sx * w) / 2, h / 2, (sz * d) / 2); g.add(beam);
        });
        const roof = new THREE.Mesh(prism(w / 2 + 0.3, 1.3, d + 0.5), mRoof);
        roof.position.set(0, h, -(d + 0.5) / 2); g.add(roof);
        if (chimney) {
          const ch = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.6, 0.5), mTile);
          ch.position.set(w / 2 - 0.6, h + 1, 0); g.add(ch);
        }
        g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g); return g;
      }
      function tower(x, z) {
        const g = new THREE.Group();
        [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sz]) => {
          const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 4.6, 0.18), mWood);
          leg.position.set(sx * 0.7, 2.3, sz * 0.7); g.add(leg);
        });
        const platform = new THREE.Mesh(new THREE.BoxGeometry(2, 0.2, 2), mWood);
        platform.position.y = 4; g.add(platform);
        const roof = new THREE.Mesh(prism(1.2, 1, 2), mRoof);
        roof.position.set(0, 4.2, -1); g.add(roof);
        g.position.set(x, 0, z); scene.add(g); return g;
      }
      function stall(x, z, rot) {
        const g = new THREE.Group();
        [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sz]) => {
          const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2, 0.12), mWood);
          post.position.set(sx, 1, sz * 0.7); g.add(post);
        });
        const awning = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.08, 1.8), mStripe);
        awning.position.set(0, 2, 0); awning.rotation.x = 0.12; g.add(awning);
        const table = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 1.1), mWood);
        table.position.set(0, 0.95, 0); g.add(table);
        for (let i = 0; i < 4; i++) {
          const good = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), M(0xb5722e, 0.8));
          good.position.set(-0.9 + i * 0.55, 1.15, (Math.random() - 0.5) * 0.6); g.add(good);
        }
        g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g); return g;
      }
      function wagon(x, z, rot) {
        const g = new THREE.Group();
        const body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.3, 1.4), mWood);
        body.position.y = 1; g.add(body);
        const top = new THREE.Mesh(prism(1.4, 0.9, 2.6), mCanvas);
        top.rotation.y = Math.PI / 2; top.position.set(-1.3, 1.6, 0); g.add(top);
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
          const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.15, 12), mBeam);
          wheel.rotation.z = Math.PI / 2; wheel.position.set(sx, 0.5, sz * 0.7); g.add(wheel);
        });
        g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g); return g;
      }
      function deadTree(x, z) {
        const g = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 3, 6), mBeam);
        trunk.position.y = 1.5; g.add(trunk);
        for (let i = 0; i < 4; i++) {
          const br = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.09, 1.2, 5), mBeam);
          br.position.y = 1.6 + i * 0.35;
          br.rotation.z = (Math.random() - 0.5) * 1.6; br.rotation.y = Math.random() * 6.28;
          g.add(br);
        }
        g.position.set(x, 0, z); g.rotation.y = Math.random() * 6.28; scene.add(g); return g;
      }
      function horse(x, z, rot) {
        const g = new THREE.Group(); const mH = M(0xd8d2c4, 0.9);
        const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 0.6), mH); body.position.y = 1.1; g.add(body);
        const neck = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 0.4), mH);
        neck.position.set(0.8, 1.5, 0); neck.rotation.z = -0.5; g.add(neck);
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.35, 0.3), mH);
        head.position.set(1.2, 1.75, 0); g.add(head);
        [[-0.6, -0.2], [0.6, -0.2], [-0.6, 0.2], [0.6, 0.2]].forEach(([lx, lz]) => {
          const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1, 0.18), mH);
          leg.position.set(lx, 0.5, lz); g.add(leg);
        });
        g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g); return g;
      }

      // --- feu de camp ---
      fireLight = new THREE.PointLight(0xff7a2e, 34, 26, 2);
      fireLight.position.set(0, 1.2, 0); scene.add(fireLight);
      campfire = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xff8a3a, emissive: 0xff5a1e, emissiveIntensity: 3 }));
      campfire.position.set(0, 0.4, 0); scene.add(campfire);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * 6.28;
        const log = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.1, 6), mBeam);
        log.position.set(Math.cos(a) * 0.35, 0.12, Math.sin(a) * 0.35);
        log.rotation.set(Math.PI / 2, a, 0.4); scene.add(log);
      }

      // --- tentes (grappe ouest/sud) ---
      tent(-5, 2.5, 0.3, mCanvas); tent(-6.5, -0.5, -0.2, mCanvasG);
      tent(-4.5, -3, 0.6, mCanvas); tent(2.5, 5, 2.4, mCanvasG); tent(4.8, 4, 2.9, mCanvas);

      // --- maisons à colombages (est / nord-est) ---
      house(7, -0.5, -1.9, 3.6, 3, 2.6, true); // forge à cheminée
      house(6.5, -4.5, -2.4, 3, 2.6, 2.3, false);
      house(4.5, 6.5, 3.0, 3, 2.6, 2.3, false);

      // --- marché (sud) ---
      stall(-1.5, 8, Math.PI); stall(1.8, 8.3, Math.PI); stall(-4.5, 7, Math.PI * 0.9);

      // --- chariot marchand (ouest) ---
      wagon(-8, -3.5, 0.4);

      // --- enclos + chevaux (vers la porte) ---
      (function paddock() {
        const cx = -1, cz = -7, w = 5, d = 3.5;
        for (let i = 0; i <= 10; i++) {
          const px = -w / 2 + (i / 10) * w;
          [-d / 2, d / 2].forEach((pz) => {
            const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1, 5), mWood);
            p.position.set(cx + px, 0.5, cz + pz); scene.add(p);
          });
        }
        [-d / 2, d / 2].forEach((pz) => {
          const rail = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, 0.06), mWood);
          rail.position.set(cx, 0.7, cz + pz); scene.add(rail);
        });
        horse(cx - 1, cz, 0.6); horse(cx + 1.2, cz + 0.5, -0.8);
      })();

      // --- mannequins d'entraînement ---
      for (let i = 0; i < 3; i++) {
        const g = new THREE.Group();
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.7, 6), mWood);
        pole.position.y = 0.85; g.add(pole);
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.3), M(0x6a5a3a, 0.9));
        body.position.y = 1.4; g.add(body);
        const arms = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.15, 0.15), mWood);
        arms.position.y = 1.5; g.add(arms);
        g.position.set(8 + i * 1.2, 0, 2.5 - i * 0.6); scene.add(g);
      }

      // --- palissade (porte au nord = -Z) ---
      const PR = 14, stakes = 72;
      for (let i = 0; i < stakes; i++) {
        const a = (i / stakes) * Math.PI * 2;
        if (Math.sin(a) < -0.86 && Math.abs(Math.cos(a)) < 0.42) continue; // trou porte nord
        const h = 2.6 + Math.random() * 0.6;
        const stake = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, h, 6), mWood);
        stake.position.set(Math.cos(a) * PR, h / 2 - 0.15, Math.sin(a) * PR);
        stake.rotation.z = (Math.random() - 0.5) * 0.07;
        scene.add(stake);
      }
      tower(-3, -13.5); tower(3, -13.5);

      // --- arbres morts (dehors + quelques dedans) ---
      for (let i = 0; i < 14; i++) {
        const a = Math.random() * 6.28, r = 16 + Math.random() * 10;
        deadTree(Math.cos(a) * r, Math.sin(a) * r);
      }
      deadTree(-9, 5); deadTree(9, 6);

      // --- braises ---
      const emberGeo = new THREE.BufferGeometry();
      const cnt = 120, pos = new Float32Array(cnt * 3);
      for (let i = 0; i < cnt; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 1.4;
        pos[i * 3 + 1] = Math.random() * 4;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 1.4;
      }
      emberGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const embers = new THREE.Points(emberGeo,
        new THREE.PointsMaterial({ color: 0xff7a3a, size: 0.05, transparent: true, opacity: 0.9 }));
      scene.add(embers);
      return embers;
    }

    let embers = null;
    if (model) {
      new GLTFLoader().load(model, (g) => { scene.add(g.scene); }, undefined,
        (err) => { console.warn('glTF load failed, camp placeholder:', err); embers = buildCamp(); });
    } else {
      embers = buildCamp();
    }

    const controls = new PointerLockControls(camera, renderer.domElement);
    scene.add(controls.object);
    controls.addEventListener('lock', () => { manual = false; onLockChange?.(true); });
    controls.addEventListener('unlock', () => onLockChange?.(false));

    // Fallback si le Pointer Lock est refusé (iframe sandboxée, contexte non sécurisé…) :
    // on bascule en « clic-glissé pour regarder ».
    let manual = false, dragging = false;
    camera.rotation.order = 'YXZ';
    const onLockError = () => { if (!controls.isLocked) enableManual(); };
    document.addEventListener('pointerlockerror', onLockError);
    cleanups.push(() => document.removeEventListener('pointerlockerror', onLockError));

    function enableManual() {
      if (manual) return;
      manual = true;
      onLockChange?.(true);
      canvas.style.cursor = 'grab';
    }
    const onDown = () => { if (manual) { dragging = true; canvas.style.cursor = 'grabbing'; } };
    const onUp = () => { dragging = false; if (manual) canvas.style.cursor = 'grab'; };
    const onMove = (e) => {
      if (!manual || !dragging) return;
      camera.rotation.y -= e.movementX * 0.0026;
      camera.rotation.x = Math.max(-1.3, Math.min(1.3, camera.rotation.x - e.movementY * 0.0026));
    };
    canvas.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointermove', onMove);
    cleanups.push(() => {
      canvas.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointermove', onMove);
    });

    const keys = { f: false, b: false, l: false, r: false };
    const set = (code, v) => {
      if (code === 'KeyW' || code === 'ArrowUp') keys.f = v;
      else if (code === 'KeyS' || code === 'ArrowDown') keys.b = v;
      else if (code === 'KeyA' || code === 'ArrowLeft') keys.l = v;
      else if (code === 'KeyD' || code === 'ArrowRight') keys.r = v;
    };
    const onKeyDown = (e) => {
      if (e.code === 'Escape' && manual) { manual = false; dragging = false; canvas.style.cursor = 'default'; onLockChange?.(false); return; }
      set(e.code, true);
    };
    const onKeyUp = (e) => set(e.code, false);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    cleanups.push(() => { document.removeEventListener('keydown', onKeyDown); document.removeEventListener('keyup', onKeyUp); });

    resize();
    const clock = new THREE.Clock();
    const vel = new THREE.Vector3();
    const dir = new THREE.Vector3();

    const tick = () => {
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;

      // feu vacillant
      if (fireLight) fireLight.intensity = 34 + Math.sin(t * 12) * 4 + Math.sin(t * 27) * 3;
      if (embers) {
        const p = embers.geometry.attributes.position;
        for (let i = 0; i < p.count; i++) {
          let y = p.getY(i) + dt * 1.4;
          if (y > 4) y = 0;
          p.setY(i, y);
        }
        p.needsUpdate = true;
      }

      if (controls.isLocked || manual) {
        vel.x -= vel.x * 9 * dt;
        vel.z -= vel.z * 9 * dt;
        dir.z = Number(keys.f) - Number(keys.b);
        dir.x = Number(keys.r) - Number(keys.l);
        dir.normalize();
        const speed = 45;
        if (keys.f || keys.b) vel.z -= dir.z * speed * dt;
        if (keys.l || keys.r) vel.x -= dir.x * speed * dt;
        controls.moveRight(-vel.x * dt);
        controls.moveForward(-vel.z * dt);
        const p = camera.position;
        const rr = Math.hypot(p.x, p.z);
        if (rr > 16) { p.x *= 16 / rr; p.z *= 16 / rr; } // reste dans le camp
        if (rr < 1.3) { p.x *= 1.3 / rr; p.z *= 1.3 / rr; } // ne traverse pas le feu
        p.y = 1.6;
      } else if (!reducedMotion) {
        // panoramique lent tant qu'on n'est pas entré
        const a = t * 0.08;
        camera.position.x = Math.sin(a) * 9;
        camera.position.z = Math.cos(a) * 9;
        camera.position.y = 1.7;
        camera.lookAt(0, 1, 0);
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return {
      mode: 'explore',
      lock: () => controls.lock(),
      dispose() { cancelAnimationFrame(raf); ro.disconnect(); cleanups.forEach((c) => c()); controls.dispose();
        envTex.dispose(); pmrem.dispose(); disposeScene(scene); renderer.dispose(); },
    };
  }

  // ============================ MODE ORBIT ============================
  camera.position.set(0, 0.2, 4.2);

  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(3, 4, 3);
  scene.add(key);
  const coral = new THREE.PointLight(0xff5d73, 24, 20);
  coral.position.set(-3, -1, 2);
  scene.add(coral);
  const mint = new THREE.PointLight(0x6ff2c9, 20, 20);
  mint.position.set(3, -2, -2);
  scene.add(mint);

  const group = new THREE.Group();
  scene.add(group);
  let placeholder = null;
  function addPlaceholder() {
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0x9aa2b4, metalness: 1, roughness: 0.12, iridescence: 1, iridescenceIOR: 1.35, envMapIntensity: 1.2,
    });
    placeholder = new THREE.Mesh(new THREE.TorusKnotGeometry(0.85, 0.27, 240, 36), mat);
    group.add(placeholder);
  }
  if (model) {
    new GLTFLoader().load(model, (g) => { fitObject(g.scene); group.add(g.scene); }, undefined,
      (err) => { console.warn('glTF load failed, using placeholder:', err); addPlaceholder(); });
  } else {
    addPlaceholder();
  }

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 2.5;
  controls.maxDistance = 7;
  controls.autoRotate = !reducedMotion;
  controls.autoRotateSpeed = 1.1;

  resize();
  const tick = () => {
    controls.update();
    if (placeholder && !reducedMotion) placeholder.rotation.x += 0.002;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  return {
    mode: 'orbit',
    dispose() { cancelAnimationFrame(raf); ro.disconnect(); controls.dispose();
      envTex.dispose(); pmrem.dispose(); disposeScene(scene); renderer.dispose(); },
  };

  function disposeScene(s) {
    s.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
    });
  }
}
