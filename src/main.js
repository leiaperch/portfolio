import './style.css';
import { projects } from './data/projects.js';
import { initCursor } from './cursor.js';
import { initLiquid } from './hero-liquid.js';
import { initRouter } from './router.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- rôle en scramble ---------- */
function initScramble() {
  const el = document.getElementById('role');
  if (!el) return;
  const words = ['Graphiste', 'Game Designer', 'Créatrice 3D', 'Creative Dev', 'Worldbuilder'];
  const glyphs = '!<>-_\\/[]{}=+*·#01';
  let wi = 0;
  const scramble = (next) => {
    let frame = 0;
    const dur = 18, from = el.textContent, len = Math.max(from.length, next.length);
    clearInterval(el._iv);
    el._iv = setInterval(() => {
      let out = '';
      for (let i = 0; i < len; i++) {
        const p = (frame - i * 1.1) / dur;
        out += p < 0 ? (from[i] || '') : p < 1 ? glyphs[(Math.random() * glyphs.length) | 0] : (next[i] || '');
      }
      el.textContent = out;
      frame++;
      if (frame > len * 1.1 + dur) { clearInterval(el._iv); el.textContent = next; }
    }, 40);
  };
  if (!reducedMotion) setInterval(() => { wi = (wi + 1) % words.length; scramble(words[wi]); }, 2600);
}

/* ---------- liste des travaux ---------- */
function renderWorks() {
  const host = document.getElementById('works');
  if (!host) return;
  host.innerHTML = projects
    .map((p, i) => {
      const n = String(i + 1).padStart(2, '0');
      const meta = `${p.meta.join(' · ')}<br>${p.year}`;
      return `<a class="prow" data-cursor href="#/p/${p.id}">
        <span class="glow"></span>
        <span class="idx">${n}</span>
        <span class="pname">${p.title}</span>
        <span class="meta">${meta}</span>
      </a>`;
    })
    .join('');
}

/* ---------- ticker ---------- */
function renderTicker() {
  const track = document.getElementById('tick');
  if (!track) return;
  const items = ['Game Dev', 'Concept 3D', 'Blender', 'Unity', 'Creative Code', 'Level Design', 'Graphisme', 'Shaders'];
  const seq = items.map((t) => `${t} <b class="s">◆</b>`).join(' ');
  track.innerHTML = `${seq} ${seq} `;
}

/* ---------- boot ---------- */
renderWorks();
renderTicker();
initScramble();

const cursor = initCursor();
cursor.refresh?.();

const glCanvas = document.getElementById('gl');
initLiquid(glCanvas, {
  reducedMotion,
  onGrabStart: () => cursor.setGrabbing(true),
  onGrabEnd: () => cursor.setGrabbing(false),
});

// Navigation : landing <-> page projet plein écran
initRouter({
  onLanding: () => {
    glCanvas.style.display = '';
  },
  onProject: async (id) => {
    // On coupe le hero WebGL pendant la vue projet (économie GPU)
    glCanvas.style.display = 'none';
    // Three.js n'est chargé qu'ici : la landing reste ultra-légère.
    const { renderProject } = await import('./views/project.js');
    return renderProject(id, { onCursorRefresh: () => cursor.refresh?.() });
  },
});
