// Curseur custom : point rapide + anneau qui traîne (lerp), inversion des
// couleurs en mix-blend-mode. Grossit en « VOIR » sur les liens [data-cursor].
// Renvoie des handles pour que le hero puisse basculer l'anneau en mode « grab ».

export function initCursor() {
  if (window.matchMedia('(pointer:coarse)').matches) {
    return { setGrabbing() {} };
  }
  const dot = document.querySelector('.cur-dot');
  const ring = document.querySelector('.cur-ring');
  const label = document.getElementById('curlbl');
  if (!dot || !ring) return { setGrabbing() {} };

  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let rx = mx, ry = my;

  window.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`;
  }, { passive: true });

  let raf = 0;
  const loop = () => {
    if (document.hidden) { raf = 0; return; }
    rx += (mx - rx) * 0.2;
    ry += (my - ry) * 0.2;
    ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
    raf = requestAnimationFrame(loop);
  };
  const kick = () => { if (!raf && !document.hidden) raf = requestAnimationFrame(loop); };
  document.addEventListener('visibilitychange', kick);
  kick();

  const bindHovers = () => {
    document.querySelectorAll('[data-cursor]').forEach((el) => {
      if (el.dataset.cursorBound) return;
      el.dataset.cursorBound = '1';
      el.addEventListener('mouseenter', () => {
        if (label) label.textContent = el.dataset.cursor || 'VOIR';
        ring.classList.add('big');
      });
      el.addEventListener('mouseleave', () => ring.classList.remove('big'));
    });
  };
  bindHovers();

  // À la navigation (ex. clic « ← Retour »), l'élément survolé disparaît sans
  // déclencher mouseleave → l'anneau restait bloqué en « gros/RETOUR ». On réinitialise.
  window.addEventListener('hashchange', () => ring.classList.remove('big', 'grabbing'));

  return {
    // Rebinder après un rendu dynamique (ex: liste projets injectée)
    refresh: bindHovers,
    setGrabbing(on) {
      ring.classList.toggle('grabbing', on);
      if (on) ring.classList.remove('big');
    },
  };
}
