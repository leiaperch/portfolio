// Vue « page projet » plein écran : hero 3D (orbit/exploration/iso/donjon) +
// titre + techs, puis statut, univers, ce que j'ai construit et galerie. Textes
// bilingues re-rendus au changement de langue. Construction 100 % createElement
// (aucun innerHTML sur des éléments live).

import { projects } from '../data/projects.js';
import { createProjectScene } from '../project-scene.js';
import { createIsoScene } from '../iso-scene.js';
import { createDungeonScene } from '../dungeon-scene.js';
import { t, tv, getLang, toggleLang, onLang } from '../i18n.js';
import { el, clear } from '../dom.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const chip = (x) => el('span', { class: 'chip' }, el('span', { class: 'chip-dot' }), x);

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

  // références des nœuds à traduire / mettre à jour
  const r = {};

  // --- overlay du hero selon le mode ---
  let overlay = null;
  if (isExplore || isIso || isDungeon) {
    r.sceneVerb = el('span', { class: 'pv-scene-verb' });
    r.sceneKeys = el('span', { class: 'pv-scene-keys' });
    overlay = el('div', { class: 'pv-scene-hint' }, r.sceneVerb, r.sceneKeys);
  } else if (is3D) {
    r.hint = el('div', { class: 'pv-hint' });
    overlay = r.hint;
  } else if (isEmbed) {
    r.playLbl = el('span', { class: 'pv-play-lbl' });
    r.embedBtn = el('button', { class: 'pv-play', dataset: { embed: p.embed, cursor: 'JOUER' } }, r.playLbl);
    overlay = el('div', { class: 'pv-embed-cta' }, r.embedBtn,
      el('a', { class: 'pv-fs', href: p.embed, target: '_blank', rel: 'noopener', dataset: { cursor: '' } },
        '↗ ' + tv({ fr: 'nouvel onglet', en: 'new tab' })));
  } else if (p.play) {
    r.playLbl = el('span', { class: 'pv-play-lbl' });
    overlay = el('a', { class: 'pv-play', href: p.play, target: '_blank', rel: 'noopener', dataset: { cursor: 'JOUER' } }, r.playLbl);
  }

  const heroMedia = hasCanvas
    ? el('canvas', { class: 'pv-canvas' })
    : el('div', { class: 'pv-hero-cover' }, el('img', { src: p.cover, alt: p.title }));

  r.back = el('a', { class: 'pv-back', href: '#/', dataset: { cursor: '' } });
  r.lang = el('button', { class: 'lang', dataset: { lang: getLang() }, 'aria-label': 'Changer de langue' },
    el('span', { 'data-l': 'fr', text: 'FR' }), el('span', { class: 'sep', text: '/' }), el('span', { 'data-l': 'en', text: 'EN' }));
  r.crumb = el('span', { class: 'pv-crumb' });
  r.type = el('div', { class: 'pv-type' });
  r.summary = el('p', { class: 'pv-summary' });
  r.status = el('div', { class: 'pv-status' });
  r.aboutWrap = el('div', { class: 'pv-about-wrap' });
  r.featWrap = el('div', { class: 'pv-features-wrap' });
  r.galWrap = el('div', { class: 'pv-gallery-wrap' });
  r.nextLbl = el('span', { class: 'pv-next-lbl' });
  r.next = el('a', { class: 'pv-next', href: `#/p/${next.id}`, dataset: { cursor: '' } },
    r.nextLbl, el('span', { class: 'pv-next-name', text: `${next.title} →` }));

  const heroClass = ['pv-hero', (isExplore || isIso || isDungeon) && 'is-explore', (isIso || isDungeon) && 'is-iso', !hasCanvas && 'is-cover']
    .filter(Boolean).join(' ');

  const view = el('div', { class: 'project-view' },
    el('header', { class: 'pv-top' }, r.back, el('div', { class: 'pv-top-r' }, r.lang, r.crumb)),
    el('section', { class: heroClass },
      heroMedia,
      el('div', { class: 'pv-hero-txt' },
        el('div', { class: 'pv-num', text: `${num} / ${String(projects.length).padStart(2, '0')}` }),
        el('h1', { class: 'pv-title', text: p.title }),
        r.type,
        el('div', { class: 'pv-tech' }, p.tech.map(chip)),
      ),
      overlay,
    ),
    el('section', { class: 'pv-body' }, r.summary, r.status, r.aboutWrap, r.featWrap, r.galWrap),
    el('footer', { class: 'pv-foot' }, r.next),
  );

  function renderGallery() {
    clear(r.galWrap);
    if (p.video) {
      r.galWrap.append(
        el('h3', { class: 'pv-sec-h', text: t('pv_gallery') }),
        el('div', { class: 'pv-gallery pv-gallery-media' },
          el('figure', { class: 'pv-feature pv-feature-video' },
            el('video', { class: 'pv-feature-vid', src: p.video, poster: p.poster, muted: true, loop: true, autoplay: true, playsinline: true, preload: 'metadata', controls: true })),
          p.mediaCaption && el('figcaption', { class: 'pv-media-cap', text: tv(p.mediaCaption) }),
          p.gallery?.length && el('div', { class: 'pv-stills' },
            p.gallery.map((src) => el('figure', { class: 'pv-still' }, el('img', { src, alt: '', loading: 'lazy' })))),
        ),
      );
    } else if (p.gallery?.length) {
      r.galWrap.append(
        el('h3', { class: 'pv-sec-h', text: t('pv_gallery') }),
        el('div', { class: 'pv-gallery' },
          el('figure', { class: 'pv-feature' }, el('img', { class: 'pv-feature-img', src: p.gallery[0], alt: p.title })),
          p.gallery.length > 1 && el('div', { class: 'pv-thumbs' },
            p.gallery.map((src, i) => el('button', { class: 'pv-thumb' + (i === 0 ? ' active' : ''), dataset: { thumb: src }, 'aria-label': `Aperçu ${i + 1}` },
              el('img', { src, alt: '', loading: 'lazy' })))),
        ),
      );
    } else if (p.about) {
      r.galWrap.append(el('h3', { class: 'pv-sec-h', text: t('pv_gallery') }), el('p', { class: 'pv-empty', text: t('pv_gallery_soon') }));
    }
  }

  function updateTexts() {
    r.back.textContent = t('pv_back'); r.back.dataset.cursor = t('cur_back');
    r.crumb.textContent = t('realm_' + p.realm);
    r.type.textContent = `${tv(p.type)} — ${p.year}`;
    r.summary.textContent = tv(p.summary);
    r.nextLbl.textContent = t('pv_next_lbl'); r.next.dataset.cursor = t('cur_next');
    r.lang.dataset.lang = getLang();

    clear(r.status);
    if (p.status) r.status.append(el('b', { text: '●' }), ' ' + tv(p.status));

    clear(r.aboutWrap);
    if (p.about) r.aboutWrap.append(
      el('h3', { class: 'pv-sec-h', text: t('pv_about') }),
      el('div', { class: 'pv-about' }, tv(p.about).map((par) => el('p', { text: par }))),
    );

    clear(r.featWrap);
    if (p.features) r.featWrap.append(
      el('h3', { class: 'pv-sec-h', text: t('pv_features') }),
      el('div', { class: 'pv-features' }, p.features.map((f) =>
        el('div', { class: 'pv-feat' }, el('h4', { text: tv(f.title) }), el('p', { text: tv(f.text) })))),
    );

    renderGallery();

    if (r.sceneVerb) {
      const pfx = isDungeon ? 'pv_dungeon' : isIso ? 'pv_iso' : 'pv_explore';
      r.sceneVerb.textContent = t(pfx + '_verb');
      r.sceneKeys.textContent = t(pfx + '_keys');
    } else if (r.hint) r.hint.textContent = t('pv_orbit_hint');
    if (r.playLbl) r.playLbl.textContent = '▶ ' + t('pv_play');
    onCursorRefresh?.();
  }

  document.body.appendChild(view);
  updateTexts();
  requestAnimationFrame(() => view.classList.add('in'));

  const offLang = onLang(updateTexts);
  r.lang.addEventListener('click', toggleLang);

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
  const canvas = () => view.querySelector('.pv-canvas');
  if (isDungeon) {
    scene = createDungeonScene(canvas(), { reducedMotion });
  } else if (isIso) {
    scene = createIsoScene(canvas(), { reducedMotion });
  } else if (is3D) {
    scene = createProjectScene(canvas(), {
      mode: p.mode,
      model: p.scene,
      reducedMotion,
      onLockChange: (locked) => { exploring = locked; view.classList.toggle('exploring', locked); },
    });
    if (isExplore) canvas()?.addEventListener('click', () => { if (!exploring) scene.lock?.(); });
  }

  // jeu web déployé : clic « Jouer » → charge l'iframe jouable en place
  r.embedBtn?.addEventListener('click', () => {
    const cover = view.querySelector('.pv-hero-cover');
    if (!cover) return;
    const frame = el('iframe', { class: 'pv-embed-frame', src: p.embed, allow: 'fullscreen; autoplay', title: p.title });
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
