// Scène donjon 2D top-down pour « Kaldrith » (canvas 2D).
// Plusieurs salles reliées par des portes, où l'on balade « le dernier prêtre »
// (ZQSD/WASD/flèches) — combat à la dague (Espace/clic) contre des chevaliers de
// pierre (faction Fixes), PV en cœurs. Vrais assets du jeu, rendu pixel cohérent.

const BASE = 'games/kaldrith/';
const TS = 16; // taille native d'une tuile

// tuiles [col,row] du tileset
const TILE = {
  wall: [10, 0], door: [10, 1], floorA: [0, 0], floorB: [0, 2],
  brazier: [5, 2], chest: [6, 4], altar: [8, 2], skull: [7, 0], rune: [8, 0],
};

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

  const COLS = 13, ROWS = 9;
  const midC = COLS >> 1, midR = ROWS >> 1;
  const OPP = { n: 's', s: 'n', e: 'w', w: 'e' };

  // définition des salles (graphe de portes réciproques + props + spawns)
  const ROOMS = [
    { doors: { n: 1 }, props: [[4, 1, 'brazier'], [8, 1, 'brazier'], [2, 6, 'chest'], [3, 0, 'skull'], [9, 0, 'rune']], enemies: [[9, 5]] },
    { doors: { s: 0, e: 2 }, props: [[6, 4, 'brazier'], [3, 0, 'skull'], [9, 0, 'skull']], enemies: [[3, 3], [10, 6]] },
    { doors: { w: 1 }, props: [[6, 5, 'altar'], [3, 2, 'brazier'], [9, 2, 'brazier'], [6, 0, 'skull']], enemies: [[4, 6], [9, 5]] },
  ];

  const doorCell = (s) => s === 'n' ? [midC, 0] : s === 's' ? [midC, ROWS - 1] : s === 'e' ? [COLS - 1, midR] : [0, midR];
  const entryCell = (s) => s === 'n' ? [midC, 1] : s === 's' ? [midC, ROWS - 2] : s === 'e' ? [COLS - 2, midR] : [1, midR];

  // état vivant de la salle courante
  let curRoom = 0, floor = [], overlays = [], blocked = new Set(), doors = [], braziers = [], enemies = [];
  const hero = { c: midC + 0.5, r: midR + 0.5, fx: 0, fy: 1, flip: false, moving: false, anim: 0, atk: 0, atkHit: false, hp: 3, invuln: 0, dead: 0 };

  function makeEnemy(c, r) { return { c: c + 0.5, r: r + 0.5, hp: 2, anim: Math.random() * 4, flip: false, flash: 0, kx: 0, ky: 0, dying: 0 }; }

  function loadRoom(idx, entrySide) {
    curRoom = idx;
    const def = ROOMS[idx];
    let seed = 1000 + idx * 97;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    floor = []; blocked = new Set(); doors = []; overlays = []; braziers = [];
    for (let r = 0; r < ROWS; r++) {
      const row = [];
      for (let c = 0; c < COLS; c++) {
        const border = r === 0 || c === 0 || r === ROWS - 1 || c === COLS - 1;
        if (border) blocked.add(c + ',' + r);
        row.push(border ? TILE.wall : (rnd() < 0.28 ? TILE.floorB : TILE.floorA));
      }
      floor.push(row);
    }
    // portes : ouvre la case (sol franchissable) + overlay porte
    for (const s in def.doors) {
      const [dc, dr] = doorCell(s);
      floor[dr][dc] = TILE.floorA; blocked.delete(dc + ',' + dr);
      overlays.push({ c: dc, r: dr, t: TILE.door });
      doors.push({ c: dc, r: dr, side: s, to: def.doors[s] });
    }
    // props (bloquants sauf accents de mur, déjà sur bordure)
    for (const [c, r, kind] of def.props) {
      overlays.push({ c, r, t: TILE[kind] });
      if (kind === 'brazier' || kind === 'chest' || kind === 'altar') blocked.add(c + ',' + r);
      if (kind === 'brazier') braziers.push({ c, r });
    }
    enemies = def.enemies.map(([c, r]) => makeEnemy(c, r));
    const [ec, er] = entryCell(entrySide || 's');
    hero.c = ec + 0.5; hero.r = er + 0.5;
  }

  const walkable = (c, r) => {
    const ci = Math.floor(c), ri = Math.floor(r);
    if (ci < 0 || ri < 0 || ci >= COLS || ri >= ROWS) return false;
    return !blocked.has(ci + ',' + ri);
  };

  const imgs = {};
  let ready = false;
  let trans = 0, transTo = null, transSide = null; // transition de salle (fondu)

  // ---- caméra ----
  let Z = 40, ox = 0, oy = 0;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    W = Math.max(1, rect.width); H = Math.max(1, rect.height);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    Z = Math.floor(Math.min(W / COLS, H / (ROWS + 0.5)));
    ox = Math.round((W - COLS * Z) / 2); oy = Math.round((H - ROWS * Z) / 2);
  }
  const ro = new ResizeObserver(resize); ro.observe(canvas);
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
  function attack() { if (ready && !trans && hero.atk <= 0 && hero.dead <= 0) { hero.atk = 0.32; hero.atkHit = false; } }
  const onKeyDown = (e) => {
    if (e.code === 'Space') { attack(); e.preventDefault(); return; }
    if (setKey(e.code, true)) e.preventDefault();
  };
  const onKeyUp = (e) => setKey(e.code, false);
  window.addEventListener('keydown', onKeyDown, { passive: false });
  window.addEventListener('keyup', onKeyUp);
  const onClick = () => attack();
  canvas.addEventListener('click', onClick);
  cleanups.push(() => {
    window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp);
    canvas.removeEventListener('click', onClick);
  });

  function blit(t, x, y) { ctx.drawImage(imgs.tiles, t[0] * TS, t[1] * TS, TS, TS, x, y, Z, Z); }
  function drawChar(img, sx, sy, h, flip) {
    if (!img) return;
    const w = img.width / img.height * h;
    ctx.save(); ctx.translate(sx, sy); if (flip) ctx.scale(-1, 1);
    ctx.drawImage(img, -w / 2, -h, w, h); ctx.restore();
  }
  // petit cœur pixel (HUD PV)
  function heart(x, y, s, full) {
    ctx.fillStyle = full ? '#e6394a' : '#3a2030';
    const P = [[1, 0], [2, 0], [4, 0], [5, 0], [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [2, 4], [3, 4], [4, 4], [3, 5]];
    for (const [px, py] of P) ctx.fillRect(x + px * s, y + py * s, s, s);
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05); last = now;

    if (ready) {
      // ---- transition de salle ----
      if (trans) {
        trans -= dt;
        if (trans <= 0.3 && transTo !== null) { loadRoom(transTo, transSide); transTo = null; }
        if (trans <= 0) trans = 0;
      }

      const busy = trans > 0 || hero.dead > 0;

      // ---- attaque ----
      if (hero.atk > 0) {
        hero.atk = Math.max(0, hero.atk - dt);
        if (!hero.atkHit && hero.atk < 0.22) { // frappe au milieu de l'anim
          hero.atkHit = true;
          const hx = hero.c + hero.fx * 0.5, hy = hero.r + hero.fy * 0.5; // zone large autour/devant
          for (const e of enemies) {
            if (e.dying) continue;
            if (Math.hypot(e.c - hx, e.r - hy) < 1.3) {
              e.hp -= 1; e.flash = 0.22; e.kx = hero.fx * 0.5; e.ky = hero.fy * 0.5;
              if (e.hp <= 0) e.dying = 0.45;
            }
          }
        }
      }

      // ---- déplacement héros ----
      let dx = 0, dy = 0;
      if (!busy && hero.atk <= 0) {
        if (keys.up) dy -= 1; if (keys.down) dy += 1;
        if (keys.left) dx -= 1; if (keys.right) dx += 1;
      }
      hero.moving = dx !== 0 || dy !== 0;
      if (hero.moving) {
        const len = Math.hypot(dx, dy), spd = 4.2 * dt;
        const ux = dx / len, uy = dy / len;
        if (walkable(hero.c + ux * spd, hero.r)) hero.c += ux * spd;
        if (walkable(hero.c, hero.r + uy * spd)) hero.r += uy * spd;
        hero.fx = ux; hero.fy = uy; if (dx) hero.flip = dx > 0;
        hero.anim += dt * 6;
        // porte ? → transition
        if (!trans) for (const d of doors) if (Math.floor(hero.c) === d.c && Math.floor(hero.r) === d.r) {
          trans = 0.6; transTo = d.to; transSide = OPP[d.side];
        }
      } else hero.anim += dt * 2.2;
      if (hero.invuln > 0) hero.invuln = Math.max(0, hero.invuln - dt);

      // ---- ennemis : poursuite + contact + mort ----
      for (const e of enemies) {
        if (e.dying) { e.dying -= dt; continue; }
        e.anim += dt * 5;
        if (Math.abs(e.kx) > 0.001 || Math.abs(e.ky) > 0.001) { // recul
          if (walkable(e.c + e.kx, e.r)) e.c += e.kx; if (walkable(e.c, e.r + e.ky)) e.r += e.ky;
          e.kx *= 0.8; e.ky *= 0.8;
        }
        if (e.flash > 0) e.flash -= dt;
        const dcx = hero.c - e.c, dcy = hero.r - e.r, dist = Math.hypot(dcx, dcy);
        if (!busy && dist < 6 && dist > 0.6) { // chasse
          const sp = 1.6 * dt, ux = dcx / dist, uy = dcy / dist;
          if (walkable(e.c + ux * sp, e.r)) e.c += ux * sp;
          if (walkable(e.c, e.r + uy * sp)) e.r += uy * sp;
          e.flip = ux > 0;
        }
        if (!busy && dist < 0.75 && hero.invuln <= 0) { // touche le héros
          hero.hp -= 1; hero.invuln = 1.1;
          const ux = (hero.c - e.c) / (dist || 1), uy = (hero.r - e.r) / (dist || 1);
          if (walkable(hero.c + ux * 0.6, hero.r)) hero.c += ux * 0.6;
          if (walkable(hero.c, hero.r + uy * 0.6)) hero.r += uy * 0.6;
          if (hero.hp <= 0) hero.dead = 1.1;
        }
      }
      for (let i = enemies.length - 1; i >= 0; i--) if (enemies[i].dying !== 0 && enemies[i].dying <= 0) enemies.splice(i, 1);

      // ---- mort du héros → reset de la salle ----
      if (hero.dead > 0) { hero.dead -= dt; if (hero.dead <= 0) { const rc = curRoom; loadRoom(rc, null); hero.c = midC + 0.5; hero.r = midR + 0.5; hero.hp = 3; hero.invuln = 1.2; } }

      // ================= RENDU =================
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.imageSmoothingEnabled = false;
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) blit(floor[r][c], ox + c * Z, oy + r * Z);
      for (const o of overlays) blit(o.t, ox + o.c * Z, oy + o.r * Z);

      // grade « dark fantasy » : assombrit + teinte prune le sol (multiply)
      ctx.save(); ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = '#4a3a55'; ctx.fillRect(ox, oy, COLS * Z, ROWS * Z);
      ctx.restore();

      // persos triés par profondeur (r)
      const list = enemies.map((e) => ({ e, r: e.r })).concat([{ e: hero, r: hero.r, hero: true }]).sort((a, b) => a.r - b.r);
      for (const it of list) {
        const e = it.e; const sx = ox + e.c * Z, sy = oy + (e.r + 0.35) * Z;
        if (it.hero) {
          if (hero.invuln > 0 && Math.floor(now / 70) % 2) continue; // clignote invulnérable
          const i = Math.floor(hero.anim) % imgs.p.length;
          const lunge = hero.atk > 0 ? Math.sin((1 - hero.atk / 0.32) * Math.PI) * Z * 0.35 : 0;
          drawChar(imgs.p[i], sx + hero.fx * lunge, sy + hero.fy * lunge, Z * 1.7, hero.flip);
        } else {
          if (e.flash > 0 && Math.floor(now / 55) % 2) continue; // clignote touché
          const scale = e.dying ? Math.max(0, e.dying / 0.45) : 1;
          const i = Math.floor(e.anim) % imgs.e.length;
          drawChar(imgs.e[i], sx, sy, Z * 1.95 * scale, e.flip);
        }
      }

      // coup de dague : croissant d'acier balayé devant le héros
      if (hero.atk > 0) {
        const prog = 1 - hero.atk / 0.32;               // 0 → 1
        const alpha = Math.sin(prog * Math.PI);          // apparaît puis s'efface
        const hx = ox + (hero.c + hero.fx * 0.5) * Z, hy = oy + (hero.r + hero.fy * 0.5) * Z - Z * 0.35;
        const base = Math.atan2(hero.fy, hero.fx || (hero.flip ? 0.001 : -0.001));
        const a = base + (prog - 0.5) * 2.0;             // balaye l'arc
        const R = Z * 0.9;
        ctx.save(); ctx.translate(hx, hy); ctx.lineCap = 'round'; ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = `rgba(150,190,255,${0.4 * alpha})`; ctx.lineWidth = Z * 0.36;
        ctx.beginPath(); ctx.arc(0, 0, R, a - 0.42, a + 0.42); ctx.stroke();
        ctx.strokeStyle = `rgba(255,255,255,${0.95 * alpha})`; ctx.lineWidth = Z * 0.13;
        ctx.beginPath(); ctx.arc(0, 0, R, a - 0.5, a + 0.5); ctx.stroke();
        ctx.restore();
      }

      // ---- lumière brasiers + vignette ----
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const b of braziers) {
        const bx = ox + (b.c + 0.5) * Z, by = oy + (b.r + 0.6) * Z;
        const fl = 0.5 + 0.12 * Math.sin(now / 90 + b.c) + 0.08 * Math.sin(now / 37 + b.c);
        const g = ctx.createRadialGradient(bx, by, 0, bx, by, Z * 3.2);
        g.addColorStop(0, `rgba(255,150,60,${0.45 * fl})`); g.addColorStop(0.5, `rgba(255,110,40,${0.15 * fl})`); g.addColorStop(1, 'rgba(255,110,40,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }
      ctx.restore();
      const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.28, W / 2, H / 2, Math.max(W, H) * 0.62);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);

      // ---- HUD : cœurs de PV ----
      const hs = Math.max(2, Math.round(Z / 12));
      for (let i = 0; i < 3; i++) heart(14 + i * (7 * hs + 5), 14, hs, i < hero.hp);

      // fondu de transition + game over
      if (trans) { const a = trans > 0.3 ? (0.6 - trans) / 0.3 : trans / 0.3; ctx.fillStyle = `rgba(0,0,0,${Math.min(1, a)})`; ctx.fillRect(0, 0, W, H); }
      if (hero.dead > 0) { ctx.fillStyle = `rgba(20,0,10,${0.5 * (1 - hero.dead / 1.1) + 0.2})`; ctx.fillRect(0, 0, W, H); }
    }

    raf = requestAnimationFrame(frame);
  }

  (async () => {
    imgs.tiles = await loadImg('tiles.webp');
    imgs.p = await Promise.all([0, 1, 2, 3, 4].map((i) => loadImg('p' + i + '.webp')));
    imgs.e = await Promise.all([0, 1, 2, 3].map((i) => loadImg('e' + i + '.webp')));
    loadRoom(0, null); hero.c = midC + 0.5; hero.r = midR + 0.5;
    resize();
    ready = true;
  })();

  raf = requestAnimationFrame(frame);

  return {
    mode: 'dungeon',
    dispose() { cancelAnimationFrame(raf); cleanups.forEach((c) => c()); },
  };
}
