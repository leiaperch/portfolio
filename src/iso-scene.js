// Scène isométrique jouable pour « Fill Your Pockets » (canvas 2D).
// Petite prairie verte (herbe, chemin, rivière/pont, mare, arbres) avec les
// vrais sprites du jeu : héros animé qu'on déplace (ZQSD/WASD/flèches), Grog, coffre.

const BASE = 'games/fyp/';

const SHEET = {
  grass: 'grass.webp', path: 'path.webp', river: 'river.webp', bridge: 'bridge.webp', water: 'water.webp',
  tree: 'tree.webp', rock: 'rock.webp',
  idle_front: 'idle_front.webp', idle_side: 'idle_side.webp',
  coffre: 'coffre.webp', purse: 'purse.webp', ghit: 'ghit.webp', gdead: 'gdead.webp',
  wf: ['wf1.webp', 'wf2.webp', 'wf3.webp', 'wf4.webp'],
  wb: ['wb1.webp', 'wb2.webp', 'wb3.webp', 'wb4.webp', 'wb5.webp', 'wb6.webp'],
  wl: ['wl1.webp', 'wl2.webp', 'wl3.webp', 'wl4.webp', 'wl5.webp'],
  gw: ['gw0.webp', 'gw1.webp', 'gw2.webp', 'gw3.webp'],
  atk: ['atk0.webp', 'atk1.webp', 'atk2.webp'],
  fx: ['fx0.webp', 'fx1.webp', 'fx2.webp'],
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

  // ---- carte authorée : prairie verte, rivière + pont, chemin, mare ----
  const GRID = 7;
  const G = 'grass', P = 'path', R = 'river', B = 'bridge', A = 'water';
  const map = [
    [G, G, G, G, G, G, G],
    [R, R, R, B, R, R, R], // rivière traversée par un pont
    [G, G, G, P, G, G, G], // chemin qui descend vers l'avant
    [G, G, G, P, G, G, G],
    [G, G, G, P, G, G, G],
    [A, A, G, P, G, G, G], // mare
    [A, A, G, P, G, G, G],
  ];
  const deco = [
    { c: 5, r: 3, name: 'tree' }, { c: 1, r: 2, name: 'tree' }, { c: 1, r: 4, name: 'tree' },
    { c: 5, r: 5, name: 'rock' }, { c: 4, r: 2, name: 'rock' },
  ];
  const blocked = new Set(['river', 'water']); // le héros ne marche pas sur l'eau
  const walkable = (c, r) => {
    const ri = Math.round(r), ci = Math.round(c);
    if (ri < 0 || ci < 0 || ri >= GRID || ci >= GRID) return false;
    return !blocked.has(map[ri][ci]);
  };

  // ---- entités ----
  const hero = { c: 3, r: 4, face: 'front', moving: false, anim: 0, bob: 0, atk: 0, atkFace: 'front' };
  const grog = { c: 5, r: 4, t: 0, baseC: 5, baseR: 4, flip: false, anim: 0, state: 'walk', st: 0 };
  const chest = { c: 5, r: 2 };

  // pièces à ramasser (sur l'herbe/le pont), réapparaissent après collecte
  const coins = [[1, 3], [5, 6], [6, 4], [2, 0], [0, 5], [6, 1], [3, 0]]
    .map(([c, r]) => ({ c, r, alive: true, t: Math.random() * 6, rt: 0 }));
  let gold = 0, goldPop = 0;
  const fx = [];        // explosions {c,r,t}
  const floaters = [];  // textes flottants {c,r,t,txt}

  // direction écran d'une orientation (mêmes conventions que le déplacement)
  const faceVec = { front: [1, 1], back: [-1, -1], left: [-1, 1], right: [1, -1] };
  function startAttack() {
    if (!ready || hero.atk > 0) return;
    hero.atk = 0.4; hero.atkFace = hero.face;
    const [dc, dr] = faceVec[hero.face];
    fx.push({ c: hero.c + dc * 0.85, r: hero.r + dr * 0.85, t: 0 });
    if (grog.state === 'walk' && Math.hypot(grog.c - hero.c, grog.r - hero.r) < 1.4) {
      grog.state = 'hit'; grog.st = 0;
    }
  }

  const imgs = {};
  let ready = false;

  // ---- projection iso ----
  let TW = 92;                // largeur d'une tuile (px CSS), recalculée au resize
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
  const onKeyDown = (e) => {
    if (e.code === 'Space') { startAttack(); e.preventDefault(); return; }
    if (setKey(e.code, true)) e.preventDefault();
  };
  const onKeyUp = (e) => setKey(e.code, false);
  window.addEventListener('keydown', onKeyDown, { passive: false });
  window.addEventListener('keyup', onKeyUp);
  const onClick = () => startAttack();
  canvas.addEventListener('click', onClick);
  cleanups.push(() => {
    window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp);
    canvas.removeEventListener('click', onClick);
  });

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
    if (hero.atk > 0) { // attaque : joue atk0→2, oriente comme la marche latérale
      const prog = 1 - hero.atk / 0.4;
      const i = Math.min(imgs.atk.length - 1, Math.floor(prog * imgs.atk.length));
      return { img: imgs.atk[i], flip: hero.atkFace === 'left' };
    }
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
      if (hero.atk > 0) hero.atk = Math.max(0, hero.atk - dt);

      // --- déplacement héros (bloqué pendant l'attaque ; touches écran → diagonales iso) ---
      let dc = 0, dr = 0;
      if (hero.atk <= 0) {
        if (keys.up) { dc -= 1; dr -= 1; }
        if (keys.down) { dc += 1; dr += 1; }
        if (keys.left) { dc -= 1; dr += 1; }
        if (keys.right) { dc += 1; dr -= 1; }
      }
      hero.moving = dc !== 0 || dr !== 0;
      if (hero.moving) {
        const len = Math.hypot(dc, dr) || 1;
        const spd = 2.6 * dt;
        const nc = hero.c + (dc / len) * spd, nr = hero.r + (dr / len) * spd;
        // collision : bloque l'eau/rivière, glisse le long des berges
        if (walkable(nc, nr)) { hero.c = nc; hero.r = nr; }
        else if (walkable(nc, hero.r)) hero.c = nc;
        else if (walkable(hero.c, nr)) hero.r = nr;
        hero.c = Math.max(0.4, Math.min(GRID - 1.4, hero.c));
        hero.r = Math.max(0.4, Math.min(GRID - 1.4, hero.r));
        // orientation depuis le mouvement écran dominant
        const sx = dc - dr, sy = dc + dr; // dérivée écran
        if (Math.abs(sx) > Math.abs(sy)) hero.face = sx > 0 ? 'right' : 'left';
        else hero.face = sy > 0 ? 'front' : 'back';
        hero.anim += dt * 9;
      } else {
        hero.anim = 0;
      }
      hero.bob = hero.moving ? Math.sin(now / 90) * 2 : Math.sin(now / 500) * 1.2;

      // --- Grog : marche / touché / mort / réapparition ---
      grog.st += dt;
      if (grog.state === 'walk') {
        grog.t += dt;
        const gs = Math.sin(grog.t * 0.8) * 0.9; // patrouille horizontale (c et r opposés)
        grog.c = grog.baseC + gs; grog.r = grog.baseR - gs;
        grog.flip = Math.cos(grog.t * 0.8) > 0;
        grog.anim = (grog.anim + dt * 6) % imgs.gw.length;
      } else if (grog.state === 'hit') {
        if (grog.st > 0.4) { grog.state = 'dead'; grog.st = 0; gold += 5; goldPop = 1; floaters.push({ c: grog.c, r: grog.r, t: 0, txt: '+5' }); }
      } else if (grog.state === 'dead') {
        if (grog.st > 1.8) { grog.state = 'walk'; grog.st = 0; grog.t = 0; }
      }

      // --- pièces : collecte + réapparition ---
      for (const co of coins) {
        if (!co.alive) { co.rt += dt; if (co.rt > 4) { co.alive = true; co.t = 0; } continue; }
        co.t += dt;
        if (Math.hypot(co.c - hero.c, co.r - hero.r) < 0.55) {
          co.alive = false; co.rt = 0; gold += 1; goldPop = 1;
          floaters.push({ c: co.c, r: co.r, t: 0, txt: '+1' });
        }
      }

      // --- timers VFX / textes / pop du compteur ---
      for (let i = fx.length - 1; i >= 0; i--) { fx[i].t += dt; if (fx[i].t > 0.33) fx.splice(i, 1); }
      for (let i = floaters.length - 1; i >= 0; i--) { floaters[i].t += dt; if (floaters[i].t > 0.9) floaters.splice(i, 1); }
      goldPop = Math.max(0, goldPop - dt * 2.5);

      // --- rendu ---
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      // sol (arrière → avant)
      const sTile = TW / (imgs.grass.width);
      for (let s = 0; s <= 2 * (GRID - 1); s++) {
        for (let r = 0; r < GRID; r++) {
          const c = s - r; if (c < 0 || c >= GRID) continue;
          const p = iso(c, r);
          const img = imgs[map[r][c]] || imgs.grass;
          const w = img.width * sTile, h = img.height * sTile;
          ctx.drawImage(img, p.x - w / 2, p.y - TW / 4, w, h);
        }
      }

      // entités (arbres, pièces, VFX, perso) triées par profondeur (c+r)
      const ents = [];
      for (const d of deco) ents.push({ c: d.c, r: d.r, kind: 'deco', name: d.name });
      for (const co of coins) if (co.alive) ents.push({ c: co.c, r: co.r, kind: 'coin', ref: co });
      for (const f of fx) ents.push({ c: f.c, r: f.r, kind: 'fx', ref: f });
      ents.push({ c: chest.c, r: chest.r, kind: 'chest' });
      ents.push({ c: grog.c, r: grog.r, kind: 'grog' });
      ents.push({ c: hero.c, r: hero.r, kind: 'hero' });
      ents.sort((a, b) => (a.c + a.r) - (b.c + b.r));
      const charScale = sTile * 0.92;
      for (const e of ents) {
        const p = iso(e.c, e.r);
        const footY = p.y + TW / 8;
        if (e.kind === 'deco') drawSprite(imgs[e.name], p.x, footY, sTile, false);
        else if (e.kind === 'coin') drawSprite(imgs.purse, p.x, footY - TW * 0.1 + Math.sin(e.ref.t * 4) * TW * 0.05, sTile * 0.42, false);
        else if (e.kind === 'fx') { const fi = Math.min(imgs.fx.length - 1, Math.floor(e.ref.t / 0.33 * imgs.fx.length)); drawSprite(imgs.fx[fi], p.x, footY, charScale, false); }
        else if (e.kind === 'chest') drawSprite(imgs.coffre, p.x, footY, charScale * 0.8, false);
        else if (e.kind === 'grog') {
          let img = imgs.gw[Math.floor(grog.anim)] || imgs.gw[0], bob = Math.sin(grog.t * 6) * 1.5;
          if (grog.state === 'hit') { img = imgs.ghit; bob = 0; }
          else if (grog.state === 'dead') { img = imgs.gdead; bob = 0; }
          drawSprite(img, p.x, footY + bob, charScale * 0.9, grog.flip);
        }
        else {
          const { img, flip } = facingSprite();
          drawSprite(img, p.x, footY + hero.bob, charScale, flip);
        }
      }

      // textes flottants (+1 / +5)
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (const fl of floaters) {
        const p = iso(fl.c, fl.r); const a = 1 - fl.t / 0.9;
        ctx.font = `bold ${Math.round(TW * 0.28)}px system-ui, sans-serif`;
        ctx.lineWidth = 3; ctx.strokeStyle = `rgba(0,0,0,${0.5 * a})`; ctx.fillStyle = `rgba(255,216,74,${a})`;
        const ty = p.y - TW * 0.4 - fl.t * 34;
        ctx.strokeText(fl.txt, p.x, ty); ctx.fillText(fl.txt, p.x, ty);
      }

      // HUD : bourse d'or + total (fixe, coin haut-gauche) avec pop à la collecte
      const pop = 1 + goldPop * 0.35;
      const ih = 34 * pop, iw = imgs.purse.width / imgs.purse.height * ih;
      ctx.drawImage(imgs.purse, 14, 12, iw, ih);
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.font = `bold ${Math.round(22 * pop)}px system-ui, sans-serif`;
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.fillStyle = '#ffd84a';
      ctx.strokeText('× ' + gold, 14 + iw + 6, 12 + ih / 2);
      ctx.fillText('× ' + gold, 14 + iw + 6, 12 + ih / 2);
    }

    raf = requestAnimationFrame(frame);
  }

  // charge les assets puis démarre
  (async () => {
    const flat = ['grass', 'path', 'river', 'bridge', 'water', 'tree', 'rock', 'idle_front', 'idle_side', 'coffre', 'purse', 'ghit', 'gdead'];
    await Promise.all([
      ...flat.map(async (k) => { imgs[k] = await loadImg(SHEET[k]); }),
      (async () => { imgs.wf = await Promise.all(SHEET.wf.map(loadImg)); })(),
      (async () => { imgs.wb = await Promise.all(SHEET.wb.map(loadImg)); })(),
      (async () => { imgs.wl = await Promise.all(SHEET.wl.map(loadImg)); })(),
      (async () => { imgs.gw = await Promise.all(SHEET.gw.map(loadImg)); })(),
      (async () => { imgs.atk = await Promise.all(SHEET.atk.map(loadImg)); })(),
      (async () => { imgs.fx = await Promise.all(SHEET.fx.map(loadImg)); })(),
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
