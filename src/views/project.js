// Vue « page projet » plein écran : hero 3D (orbit/exploration) + titre + techs,
// puis statut, univers, ce que j'ai construit et galerie. Textes bilingues
// re-rendus au changement de langue, bouton de langue dans l'en-tête.

import { projects } from '../data/projects.js';
import { createProjectScene } from '../project-scene.js';
import { createIsoScene } from '../iso-scene.js';
import { createDungeonScene } from '../dungeon-scene.js';
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
  const isIso = p.mode === 'iso';
  const isDungeon = p.mode === 'dungeon';
  const is3D = p.mode === 'orbit' || p.mode === 'explore';
  const hasCanvas = is3D || isIso || isDungeon;
  const isEmbed = p.mode === 'embed';

  const overlay = (isExplore || isIso || isDungeon)
    ? `<div class="pv-scene-hint"><span class="pv-scene-verb"></span><span class="pv-scene-keys"></span></div>`
    : is3D
      ? `<div class="pv-hint"></div>`
      : isEmbed
        ? `<div class="pv-embed-cta">
             <button class="pv-play" data-embed="${p.embed}" data-cursor="JOUER"><span class="pv-play-lbl"></span></button>
             <a class="pv-fs" href="${p.embed}" target="_blank" rel="noopener" data-cursor>↗ ${tv({ fr: 'nouvel onglet', en: 'new tab' })}</a>
           </div>`
        : (p.play ? `<a class="pv-play" href="${p.play}" target="_blank" rel="noopener" data-cursor="JOUER"><span class="pv-play-lbl"></span></a>` : '');

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

    <section class="pv-hero ${isExplore || isIso || isDungeon ? 'is-explore' : ''} ${isIso || isDungeon ? 'is-iso' : ''} ${hasCanvas ? '' : 'is-cover'}">
      ${hasCanvas ? '<canvas class="pv-canvas"></canvas>' : `<div class="pv-hero-cover"><img src="${p.cover}" alt="${p.title}" /></div>`}
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
    if (p.video) {
      const stills = (p.gallery || [])
        .map((src) => `<figure class="pv-still"><img src="${src}" alt="" loading="lazy" /></figure>`)
        .join('');
      gw.innerHTML = `<h3 class="pv-sec-h">${t('pv_gallery')}</h3>
        <div class="pv-gallery pv-gallery-media">
          <figure class="pv-feature pv-feature-video">
            <video class="pv-feature-vid" src="${p.video}" ${p.poster ? `poster="${p.poster}"` : ''} muted loop autoplay playsinline preload="metadata" controls></video>
          </figure>
          ${p.mediaCaption ? `<figcaption class="pv-media-cap">${tv(p.mediaCaption)}</figcaption>` : ''}
          ${stills ? `<div class="pv-stills">${stills}</div>` : ''}
        </div>`;
    } else if (p.gallery?.length) {
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

    if (isExplore || isIso || isDungeon) {
      const pfx = isDungeon ? 'pv_dungeon' : isIso ? 'pv_iso' : 'pv_explore';
      q('.pv-scene-verb').textContent = t(pfx + '_verb');
      q('.pv-scene-keys').textContent = t(pfx + '_keys');
    } else if (is3D) {
      q('.pv-hint').textContent = t('pv_orbit_hint');
    }
    const playLbl = q('.pv-play-lbl'); if (playLbl) playLbl.textContent = '▶ ' + t('pv_play');
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
  let scene = null;
  if (isDungeon) {
    scene = createDungeonScene(view.querySelector('.pv-canvas'), { reducedMotion });
  } else if (isIso) {
    scene = createIsoScene(view.querySelector('.pv-canvas'), { reducedMotion });
  } else if (is3D) {
    scene = createProjectScene(view.querySelector('.pv-canvas'), {
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
  }

  // jeu web déployé : clic « Jouer » → charge l'iframe jouable en place
  view.querySelector('.pv-play[data-embed]')?.addEventListener('click', (e) => {
    const url = e.currentTarget.dataset.embed;
    const cover = view.querySelector('.pv-hero-cover');
    if (!cover) return;
    const frame = document.createElement('iframe');
    frame.className = 'pv-embed-frame';
    frame.src = url;
    frame.setAttribute('allow', 'fullscreen; autoplay');
    frame.title = p.title;
    cover.replaceWith(frame);
    view.classList.add('playing');
  });

  return {
    dispose() {
      offLang();
      scene?.dispose();
      view.remove();
    },
  };
}
