// Vue « page projet » plein écran : hero 3D (orbit/exploration) + titre + techs,
// puis statut, univers, ce que j'ai construit et galerie. Textes bilingues
// re-rendus au changement de langue, bouton de langue dans l'en-tête.

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

  const overlay = isExplore
    ? `<div class="pv-scene-hint"><span class="pv-scene-verb"></span><span class="pv-scene-keys"></span></div>`
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
      <div class="pv-status"></div>
      <div class="pv-about-wrap"></div>
      <div class="pv-features-wrap"></div>
      <div class="pv-gallery-wrap"></div>
    </section>

    <footer class="pv-foot">
      <a class="pv-next" href="#/p/${next.id}" data-cursor>
        <span class="pv-next-lbl"></span>
        <span class="pv-next-name">${next.title} →</span>
      </a>
    </footer>
  `;

  function updateTexts() {
    const q = (s) => view.querySelector(s);
    const back = q('.pv-back'); back.textContent = t('pv_back'); back.dataset.cursor = t('cur_back');
    q('.pv-crumb').textContent = t('realm_' + p.realm);
    q('.pv-type').textContent = `${tv(p.type)} — ${p.year}`;
    q('.pv-summary').textContent = tv(p.summary);
    q('.pv-next-lbl').textContent = t('pv_next_lbl');
    q('.pv-next').dataset.cursor = t('cur_next');
    view.querySelector('.lang').dataset.lang = getLang();

    q('.pv-status').innerHTML = p.status ? `<b>●</b> ${tv(p.status)}` : '';

    q('.pv-about-wrap').innerHTML = p.about
      ? `<h3 class="pv-sec-h">${t('pv_about')}</h3>
         <div class="pv-about">${tv(p.about).map((par) => `<p>${par}</p>`).join('')}</div>`
      : '';

    q('.pv-features-wrap').innerHTML = p.features
      ? `<h3 class="pv-sec-h">${t('pv_features')}</h3>
         <div class="pv-features">${p.features
           .map((f) => `<div class="pv-feat"><h4>${tv(f.title)}</h4><p>${tv(f.text)}</p></div>`)
           .join('')}</div>`
      : '';

    const gw = q('.pv-gallery-wrap');
    if (p.gallery?.length) {
      const thumbs = p.gallery
        .map((src, i) => `<button class="pv-thumb${i === 0 ? ' active' : ''}" data-thumb="${src}" aria-label="Aperçu ${i + 1}"><img src="${src}" alt="" loading="lazy" /></button>`)
        .join('');
      gw.innerHTML = `<h3 class="pv-sec-h">${t('pv_gallery')}</h3>
        <div class="pv-gallery">
          <figure class="pv-feature"><img class="pv-feature-img" src="${p.gallery[0]}" alt="${p.title}" /></figure>
          ${p.gallery.length > 1 ? `<div class="pv-thumbs">${thumbs}</div>` : ''}
        </div>`;
    } else if (p.about) {
      gw.innerHTML = `<h3 class="pv-sec-h">${t('pv_gallery')}</h3>
        <p class="pv-empty">${t('pv_gallery_soon')}</p>`;
    } else {
      gw.innerHTML = '';
    }

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

  // galerie : clic sur une vignette → change l'image principale (délégation)
  view.addEventListener('click', (e) => {
    const thumb = e.target.closest('.pv-thumb');
    if (!thumb) return;
    const main = view.querySelector('.pv-feature-img');
    if (!main || !thumb.dataset.thumb) return;
    main.style.opacity = '0';
    const swap = () => { main.src = thumb.dataset.thumb; main.style.opacity = '1'; main.removeEventListener('transitionend', swap); };
    main.addEventListener('transitionend', swap);
    setTimeout(swap, 260); // fallback
    view.querySelectorAll('.pv-thumb').forEach((b) => b.classList.remove('active'));
    thumb.classList.add('active');
  });

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

  return {
    dispose() {
      offLang();
      scene.dispose();
      view.remove();
    },
  };
}
