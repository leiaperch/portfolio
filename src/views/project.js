// Vue « page projet » plein écran : hero 3D + titre, puis description et galerie.
// Construit le DOM à partir des données projet, monte la scène 3D et renvoie un
// cleanup qui dispose la scène et retire la vue.

import { projects, realms } from '../data/projects.js';
import { createProjectScene } from '../project-scene.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function renderProject(id, { onCursorRefresh } = {}) {
  const p = projects.find((x) => x.id === id);
  if (!p) return null;

  const idx = projects.indexOf(p);
  const num = String(idx + 1).padStart(2, '0');
  const next = projects[(idx + 1) % projects.length];

  const gallery = p.gallery?.length
    ? `<div class="pv-gallery">${p.gallery
        .map((src) => `<figure class="pv-shot"><img src="${src}" alt="${p.title}" loading="lazy" /></figure>`)
        .join('')}</div>`
    : '';

  const view = document.createElement('div');
  view.className = 'project-view';
  view.innerHTML = `
    <header class="pv-top">
      <a class="pv-back" href="#/" data-cursor="RETOUR">← Retour</a>
      <span class="pv-crumb">Royaume ${p.realm} — ${realms[p.realm]}</span>
    </header>

    <section class="pv-hero">
      <canvas class="pv-canvas"></canvas>
      <div class="pv-hero-txt">
        <div class="pv-num">${num} / ${String(projects.length).padStart(2, '0')}</div>
        <h1 class="pv-title">${p.title}</h1>
        <div class="pv-meta">${p.meta.join(' · ')} — ${p.year}</div>
      </div>
      <div class="pv-hint">Glisse pour tourner le modèle</div>
    </section>

    <section class="pv-body">
      <p class="pv-summary">${p.summary}</p>
      ${gallery}
    </section>

    <footer class="pv-foot">
      <a class="pv-next" href="#/p/${next.id}" data-cursor="SUIVANT">
        <span class="pv-next-lbl">Projet suivant</span>
        <span class="pv-next-name">${next.title} →</span>
      </a>
    </footer>
  `;

  document.body.appendChild(view);
  requestAnimationFrame(() => view.classList.add('in'));

  const scene = createProjectScene(view.querySelector('.pv-canvas'), {
    model: p.scene,
    reducedMotion,
  });

  onCursorRefresh?.();

  return {
    dispose() {
      scene.dispose();
      view.remove();
    },
  };
}
