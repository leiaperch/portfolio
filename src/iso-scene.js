// Scène isométrique jouable pour « Fill Your Pockets » (canvas 2D).
// Reconstitue une petite arène désert avec les vrais sprites du jeu :
// héros animé qu'on déplace (ZQSD/WASD/flèches), Grog, coffre, tuiles cubes.

const BASE = 'games/fyp/';

const SHEET = {
  tile: 'tile.webp', tile_deco: 'tile_deco.webp', tile_steps: 'tile_steps.webp', tile_crumbled: 'tile_crumbled.webp',
  idle_front: 'idle_front.webp', idle_side: 'idle_side.webp',
  coffre: 'coffre.webp', grog: 'grog.webp',
  wf: ['wf1.webp', 'wf2.webp', 'wf3.webp', 'wf4.webp'],
  wb: ['wb1.webp', 'wb2.webp', 'wb3.webp', 'wb4.webp', 'wb5.webp', 'wb6.webp'],
  wl: ['wl1.webp', 'wl2.webp', 'wl3.webp', 'wl4.webp', 'wl5.webp'],
};

function loadImg(src) {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = BASE + src;
  });
}

export function createIsoScene(canvas, { reducedMotion } = {}) {
  const ctx = canvas.getContext('2d', { alpha: true });
  let raf = 0, W = 0, H = 0, dpr = 1;
  const cleanups = [];

  // ---- carte : arène GRID×GRID, quelques tuiles décorées + accès ----
  const GRID = 7;
  const map = [];
  for (let r = 0; r < GRID; r++) {
    const row = [];
    for (let c = 0; c < GRID; c++) {
      const edge = r === 0 || c === 0 || r === GRID - 1 || c === GRID - 1;
      let t = 'tile';
      if (edge && (r + c) % 2 === 0) t = 'tile_crumbled';
      else if ((r === 3 && c === 3)) t = 'tile_deco';
      else if ((r + c) % 5 === 0) t = 'tile_deco';
      row.push(t);
    }
    map.push(row);
  }

  // ---- entités ----
  const hero = { c: 3, r: 3, face: 'front', moving: false, anim: 0, bob: 0 };
  const grog = { c: 1.4, r: 5, t: 0, baseC: 1.4, baseR: 5 };
  const chest = { c: 5, r: 1 };

  const imgs = {};
  let ready = false;

  // ---- projection iso ----
  let TW = 92;                // largeur d'une tuile (px CSS), recalculée au resize
  const topRatio = 0.5;       // hauteur du losange = TW * topRatio/... (calibré ci-dessous)
  let originX = 0, originY = 0;

  function iso(c, r) {
    return { x: originX + (c - r) * (TW / 2), y: originY + (c + r) * (TW / 4) };
  }

  // ---- entrées clavier ----
  const keys = { up: false, down: false, left: false, right: false };
  const setKey = (code, v) => {
    if (code === 'KeyW' || code === 'KeyZ' || code === 'ArrowUp') keys.up = v;
    else if (code === 'KeyS' || code === 'ArrowDown') keys.down = v;
    else if (code === 'KeyA' || code === 'KeyQ' || code === 'ArrowLeft') keys.left = v;
    else if (code === 'KeyD' || code === 'ArrowRight') keys.right = v;
    else return false;
    return true;
  };
  const onKeyDown = (e) => { if (setKey(e.code, true)) e.preventDefault(); };
  const onKeyUp = (e) => setKey(e.code, false);
  window.addEventListener('keydown', onKeyDown, { passive: false });
  window.addEventListener('keyup', onKeyUp);
  cleanups.push(() => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); });

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    W = Math.max(1, rect.width); H = Math.max(1, rect.height);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    // adapte la taille des tuiles pour que l'arène tienne dans le cadre
    TW = Math.max(52, Math.min(112, W / 9));
    // centre l'arène : le milieu de la grille au centre du canvas
    originX = 0; originY = 0;
    const mid = iso((GRID - 1) / 2, (GRID - 1) / 2);
    originX = W / 2 - mid.x;
    originY = H / 2 - mid.y - TW * 0.4;
  }

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  cleanups.push(() => ro.disconnect());

  // dessine un sprite ancré en bas-centre (pieds), échelle relative à TW
  function drawSprite(img, x, y, scale, flip) {
    if (!img) return;
    const w = img.width * scale, h = img.height * scale;
    ctx.save();
    ctx.translate(x, y);
    if (flip) ctx.scale(-1, 1);
    ctx.drawImage(img, -w / 2, -h, w, h);
    ctx.restore();
  }

  function facingSprite() {
    const f = hero.face;
    if (!hero.moving) {
      if (f === 'front') return { img: imgs.idle_front, flip: false };
      if (f === 'back') return { img: imgs.idle_side, flip: false };
      return { img: imgs.idle_side, flip: f === 'right' };
    }
    const i = Math.floor(hero.anim);
    if (f === 'front') return { img: imgs.wf[i % imgs.wf.length], flip: false };
    if (f === 'back') return { img: imgs.wb[i % imgs.wb.length], flip: false };
    return { img: imgs.wl[i % imgs.wl.length], flip: f === 'right' };
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05); last = now;

    if (ready) {
      // --- déplacement héros (les touches écran → diagonales iso) ---
      let dc = 0, dr = 0;
      if (keys.up) { dc -= 1; dr -= 1; }
      if (keys.down) { dc += 1; dr += 1; }
      if (keys.left) { dc -= 1; dr += 1; }
      if (keys.right) { dc += 1; dr -= 1; }
      hero.moving = dc !== 0 || dr !== 0;
      if (hero.moving) {
        const len = Math.hypot(dc, dr) || 1;
        const spd = 2.6 * dt;
        hero.c = Math.max(0.4, Math.min(GRID - 1.4, hero.c + (dc / len) * spd));
        hero.r = Math.max(0.4, Math.min(GRID - 1.4, hero.r + (dr / len) * spd));
        // orientation depuis le mouvement écran dominant
        const sx = dc - dr, sy = dc + dr; // dérivée écran
        if (Math.abs(sx) > Math.abs(sy)) hero.face = sx > 0 ? 'right' : 'left';
        else hero.face = sy > 0 ? 'front' : 'back';
        hero.anim += dt * 9;
      } else {
        hero.anim = 0;
      }
      hero.bob = hero.moving ? Math.sin(now / 90) * 2 : Math.sin(now / 500) * 1.2;
      grog.t += dt;
      grog.c = grog.baseC + Math.sin(grog.t * 0.8) * 0.5; // petit va-et-vient

      // --- rendu ---
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      // sol (arrière → avant)
      const sTile = TW / (imgs.tile.width);
      for (let s = 0; s <= 2 * (GRID - 1); s++) {
        for (let r = 0; r < GRID; r++) {
          const c = s - r; if (c < 0 || c >= GRID) continue;
          const p = iso(c, r);
          const img = imgs[map[r][c]] || imgs.tile;
          const w = img.width * sTile, h = img.height * sTile;
          ctx.drawImage(img, p.x - w / 2, p.y - TW / 4, w, h);
        }
      }

      // entités triées par profondeur (c+r), puis y
      const ents = [];
      ents.push({ c: chest.c, r: chest.r, kind: 'chest' });
      ents.push({ c: grog.c, r: grog.r, kind: 'grog' });
      ents.push({ c: hero.c, r: hero.r, kind: 'hero' });
      ents.sort((a, b) => (a.c + a.r) - (b.c + b.r));
      const charScale = (TW / imgs.tile.width) * 0.92;
      for (const e of ents) {
        const p = iso(e.c, e.r);
        const footY = p.y + TW / 8;
        if (e.kind === 'chest') drawSprite(imgs.coffre, p.x, footY, charScale * 0.8, false);
        else if (e.kind === 'grog') drawSprite(imgs.grog, p.x, footY + Math.sin(grog.t * 3) * 1.5, charScale * 0.9, false);
        else {
          const { img, flip } = facingSprite();
          drawSprite(img, p.x, footY + hero.bob, charScale, flip);
        }
      }
    }

    raf = requestAnimationFrame(frame);
  }

  // charge les assets puis démarre
  (async () => {
    const flat = ['tile', 'tile_deco', 'tile_steps', 'tile_crumbled', 'idle_front', 'idle_side', 'coffre', 'grog'];
    await Promise.all([
      ...flat.map(async (k) => { imgs[k] = await loadImg(SHEET[k]); }),
      (async () => { imgs.wf = await Promise.all(SHEET.wf.map(loadImg)); })(),
      (async () => { imgs.wb = await Promise.all(SHEET.wb.map(loadImg)); })(),
      (async () => { imgs.wl = await Promise.all(SHEET.wl.map(loadImg)); })(),
    ]);
    resize();
    ready = true;
  })();

  raf = requestAnimationFrame(frame);

  return {
    mode: 'iso',
    dispose() { cancelAnimationFrame(raf); cleanups.forEach((c) => c()); },
  };
}
