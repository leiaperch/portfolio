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
    scene.fog = new THREE.FogExp2(0x0a0807, 0.05);
    camera.position.set(0, 1.6, 9);

    const hemi = new THREE.HemisphereLight(0x3a3128, 0x090705, 0.4);
    scene.add(hemi);

    let campfire = null;
    let fireLight = null;

    function buildCamp() {
      // sol
      const ground = new THREE.Mesh(
        new THREE.CircleGeometry(40, 64),
        new THREE.MeshStandardMaterial({ color: 0x11100c, roughness: 1, metalness: 0 })
      );
      ground.rotation.x = -Math.PI / 2;
      scene.add(ground);

      // feu de camp
      fireLight = new THREE.PointLight(0xff7a2e, 40, 30, 2);
      fireLight.position.set(0, 1.2, 0);
      scene.add(fireLight);
      campfire = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xff8a3a, emissive: 0xff5a1e, emissiveIntensity: 3 })
      );
      campfire.position.set(0, 0.4, 0);
      scene.add(campfire);
      // bûches
      const logMat = new THREE.MeshStandardMaterial({ color: 0x2a1d12, roughness: 1 });
      for (let i = 0; i < 5; i++) {
        const log = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.1, 8), logMat);
        log.position.set(Math.cos((i / 5) * 6.28) * 0.35, 0.12, Math.sin((i / 5) * 6.28) * 0.35);
        log.rotation.set(Math.PI / 2, (i / 5) * 6.28, 0.4);
        scene.add(log);
      }

      // tentes en cercle
      const clothMat = new THREE.MeshStandardMaterial({ color: 0x241f2c, roughness: 0.95 });
      const woodMat = new THREE.MeshStandardMaterial({ color: 0x1b1620, roughness: 1 });
      const N = 7;
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2;
        const R = 7;
        const g = new THREE.Group();
        const tent = new THREE.Mesh(new THREE.ConeGeometry(1.5, 2, 5), clothMat);
        tent.position.y = 1;
        const base = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.15, 5), woodMat);
        base.position.y = 0.07;
        g.add(tent, base);
        g.position.set(Math.cos(a) * R, 0, Math.sin(a) * R);
        g.rotation.y = -a;
        scene.add(g);
      }

      // caisses éparses
      const crateMat = new THREE.MeshStandardMaterial({ color: 0x2e2618, roughness: 0.9 });
      for (let i = 0; i < 8; i++) {
        const s = 0.5 + Math.random() * 0.4;
        const crate = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), crateMat);
        const a = Math.random() * 6.28, r = 2.5 + Math.random() * 6;
        crate.position.set(Math.cos(a) * r, s / 2, Math.sin(a) * r);
        crate.rotation.y = Math.random() * 6.28;
        scene.add(crate);
      }

      // palissade de pieux tout autour (porte au nord = -Z)
      const stakeMat = new THREE.MeshStandardMaterial({ color: 0x241a12, roughness: 1 });
      const PR = 15, stakes = 76;
      for (let i = 0; i < stakes; i++) {
        const a = (i / stakes) * Math.PI * 2;
        if (Math.abs(Math.sin(a) + 1) < 0.14 && Math.cos(a) > -0.4 && Math.cos(a) < 0.4) continue; // trou de porte au nord
        const h = 3 + Math.random() * 0.7;
        const stake = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.17, h, 6), stakeMat);
        stake.position.set(Math.cos(a) * PR, h / 2 - 0.2, Math.sin(a) * PR);
        stake.rotation.z = (Math.random() - 0.5) * 0.08;
        stake.rotation.x = (Math.random() - 0.5) * 0.05;
        scene.add(stake);
      }

      // deux tours de guet encadrant la porte nord
      const towerMat = new THREE.MeshStandardMaterial({ color: 0x1b140d, roughness: 1 });
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x241f2c, roughness: 0.95 });
      [-3.4, 3.4].forEach((tx) => {
        const g = new THREE.Group();
        const body = new THREE.Mesh(new THREE.BoxGeometry(1.7, 4.2, 1.7), towerMat);
        body.position.y = 2.1;
        const roof = new THREE.Mesh(new THREE.ConeGeometry(1.5, 1.3, 4), roofMat);
        roof.position.y = 4.85; roof.rotation.y = Math.PI / 4;
        g.add(body, roof);
        g.position.set(tx, 0, -15);
        scene.add(g);
      });

      // braises qui montent
      const emberGeo = new THREE.BufferGeometry();
      const cnt = 120, pos = new Float32Array(cnt * 3);
      for (let i = 0; i < cnt; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 1.4;
        pos[i * 3 + 1] = Math.random() * 4;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 1.4;
      }
      emberGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const embers = new THREE.Points(
        emberGeo,
        new THREE.PointsMaterial({ color: 0xff7a3a, size: 0.05, transparent: true, opacity: 0.9 })
      );
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
