// Vue « page projet » plein écran : hero 3D (orbit ou exploration) + titre + techs,
// puis description et galerie. Textes bilingues (re-rendus au changement de langue),
// avec bouton de langue dans l'en-tête. Renvoie un cleanup qui dispose tout.

import { projects } from '../data/projects.js';
import { createProjectScene } from '../project-scene.js';
import { t, tv, getLang, toggleLang, onLang } from '../i18n.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const chips = (tech) =>
  tech.map((x) => `<span class="chip"><span class="chip-dot"></span>${x}</span>`).join('');

export function renderProject(id, { onCursorRefresh } = {}) {
  const p = projects.find((x) => x.id === id);
  if (!p) return null;

  const idx = projects.indexOf(p);
  const num = String(idx + 1).padStart(2, '0');
  const next = projects[(idx + 1) % projects.length];
  const isExplore = p.mode === 'explore';

  const gallery = p.gallery?.length
    ? `<div class="pv-gallery">${p.gallery
        .map((src) => `<figure class="pv-shot"><img src="${src}" alt="${p.title}" loading="lazy" /></figure>`)
        .join('')}</div>`
    : '';

  const overlay = isExplore
    ? `<div class="pv-scene-hint" id="pv-scene-hint">
         <span class="pv-scene-verb"></span>
         <span class="pv-scene-keys"></span>
       </div>`
    : `<div class="pv-hint"></div>`;

  const view = document.createElement('div');
  view.className = 'project-view';
  view.innerHTML = `
    <header class="pv-top">
      <a class="pv-back" href="#/" data-cursor></a>
      <div class="pv-top-r">
        <button class="lang" data-lang="${getLang()}" aria-label="Changer de langue">
          <span data-l="fr">FR</span><span class="sep">/</span><span data-l="en">EN</span>
        </button>
        <span class="pv-crumb"></span>
      </div>
    </header>

    <section class="pv-hero ${isExplore ? 'is-explore' : ''}">
      <canvas class="pv-canvas"></canvas>
      <div class="pv-hero-txt">
        <div class="pv-num">${num} / ${String(projects.length).padStart(2, '0')}</div>
        <h1 class="pv-title">${p.title}</h1>
        <div class="pv-type"></div>
        <div class="pv-tech">${chips(p.tech)}</div>
      </div>
      ${overlay}
    </section>

    <section class="pv-body">
      <p class="pv-summary"></p>
      ${gallery}
    </section>

    <footer class="pv-foot">
      <a class="pv-next" href="#/p/${next.id}" data-cursor>
        <span class="pv-next-lbl"></span>
        <span class="pv-next-name">${next.title} →</span>
      </a>
    </footer>
  `;

  // Applique/rafraîchit tous les textes traduisibles
  function updateTexts() {
    const q = (s) => view.querySelector(s);
    const back = q('.pv-back'); back.textContent = t('pv_back'); back.dataset.cursor = t('cur_back');
    q('.pv-crumb').textContent = `${t('pv_realm')} ${p.realm} — ${t('realm_' + p.realm)}`;
    q('.pv-type').textContent = `${tv(p.type)} — ${p.year}`;
    q('.pv-summary').textContent = tv(p.summary);
    q('.pv-next-lbl').textContent = t('pv_next_lbl');
    q('.pv-next').dataset.cursor = t('cur_next');
    view.querySelector('.lang').dataset.lang = getLang();
    if (isExplore) {
      q('.pv-scene-verb').textContent = t('pv_explore_verb');
      q('.pv-scene-keys').textContent = t('pv_explore_keys');
    } else {
      q('.pv-hint').textContent = t('pv_orbit_hint');
    }
    onCursorRefresh?.();
  }

  document.body.appendChild(view);
  updateTexts();
  requestAnimationFrame(() => view.classList.add('in'));

  const offLang = onLang(updateTexts);
  view.querySelector('.lang').addEventListener('click', toggleLang);

  let exploring = false;
  const scene = createProjectScene(view.querySelector('.pv-canvas'), {
    mode: p.mode,
    model: p.scene,
    reducedMotion,
    onLockChange: (locked) => {
      exploring = locked;
      view.classList.toggle('exploring', locked);
    },
  });

  if (isExplore) {
    view.querySelector('.pv-canvas')?.addEventListener('click', () => {
      if (!exploring) scene.lock?.();
    });
  }

  onCursorRefresh?.();

  return {
    dispose() {
      offLang();
      scene.dispose();
      view.remove();
    },
  };
}
