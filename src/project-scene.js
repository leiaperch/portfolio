// Scène 3D réutilisable pour une page projet (Three.js).
// Charge un modèle glTF si fourni, sinon affiche un placeholder chrome irisé.
// Éclairage studio via RoomEnvironment (beaux reflets métal), contrôles orbit,
// rotation auto. Renvoie { dispose } pour tout nettoyer à la sortie de la page.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export function createProjectScene(canvas, { model = null, reducedMotion = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0.2, 4.2);

  // Environnement studio pour les reflets (pas de fichier externe requis)
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;

  // Accents lumineux aux couleurs de la DA
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(3, 4, 3);
  scene.add(key);
  const coral = new THREE.PointLight(0xff5d73, 24, 20);
  coral.position.set(-3, -1, 2);
  scene.add(coral);
  const mint = new THREE.PointLight(0x6ff2c9, 20, 20);
  mint.position.set(3, -2, -2);
  scene.add(mint);

  // Objet affiché (placeholder par défaut)
  const group = new THREE.Group();
  scene.add(group);

  let placeholder = null;
  function addPlaceholder() {
    const geo = new THREE.TorusKnotGeometry(0.85, 0.27, 240, 36);
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0x9aa2b4, metalness: 1, roughness: 0.12,
      iridescence: 1, iridescenceIOR: 1.35, envMapIntensity: 1.2,
    });
    placeholder = new THREE.Mesh(geo, mat);
    group.add(placeholder);
  }

  function fitObject(obj) {
    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    obj.position.sub(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    obj.scale.setScalar(2.2 / maxDim);
  }

  if (model) {
    new GLTFLoader().load(
      model,
      (gltf) => {
        const root = gltf.scene;
        fitObject(root);
        group.add(root);
      },
      undefined,
      (err) => { console.warn('glTF load failed, using placeholder:', err); addPlaceholder(); }
    );
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

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  let raf = 0;
  const tick = () => {
    controls.update();
    if (placeholder && !reducedMotion) placeholder.rotation.x += 0.002;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  return {
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      envTex.dispose();
      pmrem.dispose();
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach((m) => m.dispose());
        }
      });
      renderer.dispose();
    },
  };
}
