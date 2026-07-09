// Scène donjon 2D top-down pour « Kaldrith » (canvas 2D).
// Salle en tuiles (tileset du jeu) où l'on balade « le dernier prêtre »
// (ZQSD/WASD/flèches), avec brasiers, coffre, autel de corruption et un
// chevalier de pierre (faction Fixes) qui rôde.

const BASE = 'games/kaldrith/';
const TS = 16; // taille native d'une tuile dans le tileset

function loadImg(src) {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = BASE + src;
  });
}

export function createDungeonScene(canvas, { reducedMotion } = {}) {
  const ctx = canvas.getContext('2d', { alpha: true });
  let raf = 0, W = 0, H = 0, dpr = 1;
  const cleanups = [];

  // ---- salle authorée (tuiles [col,row] du tileset) ----
  const COLS = 13, ROWS = 9;
  const WALL = [10, 0], DOOR = [10, 1];
  const FLOORS = [[0, 0], [0, 0], [0, 0], [0, 2]]; // brun + gravats épars
  let seed = 11;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const floor = [];
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) {
      const border = r === 0 || c === 0 || r === ROWS - 1 || c === COLS - 1;
      row.push(border ? WALL : FLOORS[Math.floor(rnd() * FLOORS.length)]);
    }
    floor.push(row);
  }
  // props (dessinés par-dessus le sol)
  const overlays = [
    { c: 6, r: 0, t: DOOR },
    { c: 3, r: 0, t: [7, 0] }, { c: 9, r: 0, t: [8, 0] }, // murs à visage
    { c: 4, r: 1, t: [5, 2] }, { c: 8, r: 1, t: [5, 2] }, // brasiers
    { c: 2, r: 6, t: [6, 4] },                            // coffre
    { c: 10, r: 6, t: [8, 2] },                           // autel de corruption
  ];
  const braziers = [{ c: 4, r: 1 }, { c: 8, r: 1 }];
  // cases infranchissables : bordure + props solides intérieurs
  const blocked = new Set();
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++)
    if (r === 0 || c === 0 || r === ROWS - 1 || c === COLS - 1) blocked.add(c + ',' + r);
  [[4, 1], [8, 1], [2, 6], [10, 6]].forEach(([c, r]) => blocked.add(c + ',' + r));
  const walkable = (c, r) => {
    const ci = Math.floor(c), ri = Math.floor(r);
    if (ci < 0 || ri < 0 || ci >= COLS || ri >= ROWS) return false;
    return !blocked.has(ci + ',' + ri);
  };

  // ---- entités (coords en cases, centrées) ----
  const hero = { c: 6.5, r: 4.5, flip: false, moving: false, anim: 0 };
  const foe = { c: 9.5, r: 5.5, dx: -1, dy: 0, t: 0, anim: 0, flip: true };

  const imgs = {};
  let ready = false;

  // ---- rendu / caméra ----
  let Z = 40, ox = 0, oy = 0;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    W = Math.max(1, rect.width); H = Math.max(1, rect.height);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    Z = Math.floor(Math.min(W / COLS, H / (ROWS + 0.5))); // +0.5 : marge pour la hauteur des persos
    ox = Math.round((W - COLS * Z) / 2);
    oy = Math.round((H - ROWS * Z) / 2);
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  cleanups.push(() => ro.disconnect());

  // ---- entrées ----
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

  function blit(t, x, y) { ctx.drawImage(imgs.tiles, t[0] * TS, t[1] * TS, TS, TS, x, y, Z, Z); }
  // sprite ancré bas-centre à (sx, sy)
  function drawChar(img, sx, sy, h, flip) {
    if (!img) return;
    const w = img.width / img.height * h;
    ctx.save(); ctx.translate(sx, sy); if (flip) ctx.scale(-1, 1);
    ctx.drawImage(img, -w / 2, -h, w, h); ctx.restore();
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05); last = now;

    if (ready) {
      // --- déplacement héros (top-down) ---
      let dx = 0, dy = 0;
      if (keys.up) dy -= 1; if (keys.down) dy += 1;
      if (keys.left) dx -= 1; if (keys.right) dx += 1;
      hero.moving = dx !== 0 || dy !== 0;
      if (hero.moving) {
        const len = Math.hypot(dx, dy) || 1, spd = 4.2 * dt;
        const nc = hero.c + (dx / len) * spd, nr = hero.r + (dy / len) * spd;
        if (walkable(nc, hero.r)) hero.c = nc;
        if (walkable(hero.c, nr)) hero.r = nr;
        if (dx) hero.flip = dx > 0;
        hero.anim += dt * 6;
      } else {
        hero.anim += dt * 2.2; // respiration à l'arrêt
      }

      // --- ennemi qui rôde ---
      foe.t += dt; foe.anim += dt * 5;
      const spd = 1.7 * dt;
      const fc = foe.c + foe.dx * spd, fr = foe.r + foe.dy * spd;
      if (walkable(fc, fr) && foe.t < 2.4) { foe.c = fc; foe.r = fr; if (foe.dx) foe.flip = foe.dx > 0; }
      else { // change de direction
        foe.t = 0;
        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]].filter(([a, b]) => walkable(foe.c + a * 0.6, foe.r + b * 0.6));
        const d = dirs[Math.floor(rnd() * dirs.length)] || [-foe.dx, -foe.dy];
        foe.dx = d[0]; foe.dy = d[1];
      }

      // --- rendu ---
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.imageSmoothingEnabled = false;
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) blit(floor[r][c], ox + c * Z, oy + r * Z);
      for (const o of overlays) blit(o.t, ox + o.c * Z, oy + o.r * Z);

      // persos (triés par r pour la profondeur)
      ctx.imageSmoothingEnabled = true;
      const chars = [
        { c: hero.c, r: hero.r, kind: 'hero' },
        { c: foe.c, r: foe.r, kind: 'foe' },
      ].sort((a, b) => a.r - b.r);
      for (const ch of chars) {
        const sx = ox + ch.c * Z, sy = oy + (ch.r + 0.35) * Z;
        if (ch.kind === 'hero') {
          const i = Math.floor(hero.anim) % imgs.p.length;
          drawChar(imgs.p[i], sx, sy, Z * 2.3, hero.flip);
        } else {
          const i = Math.floor(foe.anim) % imgs.e.length;
          drawChar(imgs.e[i], sx, sy, Z * 1.7, foe.flip);
        }
      }

      // --- lumière : halo vacillant des brasiers + vignette ---
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const b of braziers) {
        const bx = ox + (b.c + 0.5) * Z, by = oy + (b.r + 0.6) * Z;
        const flick = 0.5 + 0.12 * Math.sin(now / 90 + b.c) + 0.08 * Math.sin(now / 37 + b.c);
        const g = ctx.createRadialGradient(bx, by, 0, bx, by, Z * 3.2);
        g.addColorStop(0, `rgba(255,150,60,${0.45 * flick})`);
        g.addColorStop(0.5, `rgba(255,110,40,${0.16 * flick})`);
        g.addColorStop(1, 'rgba(255,110,40,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }
      ctx.restore();
      // vignette sombre (ambiance donjon)
      const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.28, W / 2, H / 2, Math.max(W, H) * 0.62);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    }

    raf = requestAnimationFrame(frame);
  }

  (async () => {
    imgs.tiles = await loadImg('tiles.webp');
    imgs.p = await Promise.all([0, 1, 2, 3, 4].map((i) => loadImg('p' + i + '.webp')));
    imgs.e = await Promise.all([0, 1, 2, 3].map((i) => loadImg('e' + i + '.webp')));
    resize();
    ready = true;
  })();

  raf = requestAnimationFrame(frame);

  return {
    mode: 'dungeon',
    dispose() { cancelAnimationFrame(raf); cleanups.forEach((c) => c()); },
  };
}
