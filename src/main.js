import './style.css';
import { projects } from './data/projects.js';
import { initCursor } from './cursor.js';
import { initLiquid } from './hero-liquid.js';
import { initRouter } from './router.js';
import { t, tv, getLang, toggleLang, onLang } from './i18n.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- rôle qui défile (scramble) ---------- */
let rolesTimer = null;
function startRoles() {
  const el = document.getElementById('role');
  if (!el) return;
  const words = t('roles');
  const glyphs = '!<>-_\\/[]{}=+*·#01';
  let wi = 0;
  el.textContent = words[0];
  clearInterval(rolesTimer);
  clearInterval(el._iv);
  if (reducedMotion) return;
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
  rolesTimer = setInterval(() => { wi = (wi + 1) % words.length; scramble(words[wi]); }, 2600);
}

/* ---------- liste des travaux ---------- */
function renderWorks() {
  const host = document.getElementById('works');
  if (!host) return;
  const view = t('cur_view');
  host.innerHTML = projects
    .map((p, i) => {
      const n = String(i + 1).padStart(2, '0');
      const chips = p.tech.map((x) => `<span class="chip"><span class="chip-dot"></span>${x}</span>`).join('');
      return `<a class="prow" data-cursor="${view}" href="#/p/${p.id}">
        <span class="glow"></span>
        <span class="idx">${n}</span>
        <span class="pname">${p.title}</span>
        <span class="meta">
          <span class="prow-type">${tv(p.type)}<span class="prow-year">${p.year}</span></span>
          <span class="prow-tech">${chips}</span>
        </span>
      </a>`;
    })
    .join('');
}

/* ---------- ticker ---------- */
function renderTicker() {
  const track = document.getElementById('tick');
  if (!track) return;
  const seq = t('ticker').map((x) => `${x} <b class="s">◆</b>`).join(' ');
  track.innerHTML = `${seq} ${seq} `;
}

/* ---------- textes statiques de la landing ---------- */
function applyLanding() {
  const set = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  set('nav-works', t('nav_works'));
  set('nav-contact', t('nav_contact'));
  set('works-eyebrow', t('works_eyebrow'));
  set('contact-eyebrow', t('contact_eyebrow'));
  set('contact-btn-lbl', t('contact_btn'));
  set('footer-copy', t('footer_copy'));
  const tag = document.getElementById('tagline');
  if (tag) tag.innerHTML = t('hero_tagline');
  // libellés du curseur traduits
  document.querySelectorAll('#nav-works, #nav-contact, .foot a').forEach((el) => (el.dataset.cursor = t('cur_view')));
  // état du bouton de langue
  const lt = document.getElementById('lang-toggle');
  if (lt) lt.dataset.lang = getLang();
}

/* ---------- taille du nom adaptative ---------- */
function fitHeroName() {
  const l1 = document.querySelector('.l1 i');
  const l2 = document.querySelector('.l2 i');
  const hero = document.querySelector('.hero');
  if (!l1 || !l2 || !hero) return;
  const cs = getComputedStyle(hero);
  const avail = hero.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const probe = 200;
  [l1, l2].forEach((el) => (el.style.fontSize = probe + 'px'));
  const w = Math.max(l1.getBoundingClientRect().width, l2.getBoundingClientRect().width);
  const size = Math.max(34, Math.min((probe * avail) / w, 168));
  [l1, l2].forEach((el) => (el.style.fontSize = size + 'px'));
}

/* ---------- boot ---------- */
const cursor = initCursor();

function renderAll() {
  applyLanding();
  renderWorks();
  renderTicker();
  cursor.refresh?.();
}
renderAll();
startRoles();
fitHeroName();

document.getElementById('lang-toggle')?.addEventListener('click', toggleLang);
onLang(() => { renderAll(); startRoles(); });

window.addEventListener('resize', fitHeroName);
if (document.fonts?.ready) document.fonts.ready.then(fitHeroName);

const glCanvas = document.getElementById('gl');
initLiquid(glCanvas, {
  reducedMotion,
  onGrabStart: () => cursor.setGrabbing(true),
  onGrabEnd: () => cursor.setGrabbing(false),
});

/* ---------- navigation landing <-> page projet ---------- */
initRouter({
  onLanding: () => { glCanvas.style.display = ''; },
  onProject: async (id) => {
    glCanvas.style.display = 'none';
    const { renderProject } = await import('./views/project.js');
    return renderProject(id, { onCursorRefresh: () => cursor.refresh?.() });
  },
});
