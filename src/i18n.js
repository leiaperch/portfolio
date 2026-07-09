// Mini-moteur i18n : dictionnaire FR/EN, langue persistée, abonnement aux
// changements. t(key) -> chaîne/tableau traduits ; tv(val) -> résout un champ
// bilingue { fr, en } (ou renvoie la valeur si c'est déjà une chaîne).

const dict = {
  fr: {
    nav_role: 'Développeuse créative',
    nav_works: 'Travaux',
    nav_contact: 'Contact',
    hero_tagline:
      "Jeune <b>passionnée de l'image</b>, je touche à tous les domaines mêlant <b>code et créativité</b> dans le but de donner vie à mes projets.",
    roles: ['Dev Web', 'Game Designer', 'Unity Programmer', 'Worldbuilder'],
    works_eyebrow: 'Travaux sélectionnés',
    ticker: ['Game Dev', 'Concept 3D', 'Blender', 'Unity', 'Creative Code', 'Level Design', 'Graphisme', 'Shaders'],
    footer_copy: '© 2026 — Léïa Percherancier',
    realm_I: 'Jeux & Mondes 3D',
    realm_II: 'Web & Interactif',
    realm_III: 'Outils & Systèmes',
    pv_back: '← Retour',
    pv_next_lbl: 'Projet suivant',
    pv_about: "L'univers",
    pv_features: "Ce que j'ai construit",
    pv_play: 'Jouer',
    pv_gallery: 'Aperçus',
    pv_gallery_soon: 'Captures du prototype à venir',
    pv_orbit_hint: 'Glisse pour tourner le modèle',
    pv_explore_verb: 'Explorer',
    pv_explore_keys: 'clic · ZQSD + souris',
    cur_view: 'VOIR',
    cur_back: 'RETOUR',
    cur_next: 'SUIVANT',
  },
  en: {
    nav_role: 'Creative Developer',
    nav_works: 'Work',
    nav_contact: 'Contact',
    hero_tagline:
      "A young <b>image enthusiast</b>, I work across every field where <b>code meets creativity</b> to bring my projects to life.",
    roles: ['Web Dev', 'Game Designer', 'Unity Programmer', 'Worldbuilder'],
    works_eyebrow: 'Selected work',
    ticker: ['Game Dev', '3D Concept', 'Blender', 'Unity', 'Creative Code', 'Level Design', 'Graphic Design', 'Shaders'],
    footer_copy: '© 2026 — Léïa Percherancier',
    realm_I: 'Games & 3D Worlds',
    realm_II: 'Web & Interactive',
    realm_III: 'Tools & Systems',
    pv_back: '← Back',
    pv_next_lbl: 'Next project',
    pv_about: 'The world',
    pv_features: 'What I built',
    pv_play: 'Play',
    pv_gallery: 'Glimpses',
    pv_gallery_soon: 'Prototype captures coming soon',
    pv_orbit_hint: 'Drag to rotate the model',
    pv_explore_verb: 'Explore',
    pv_explore_keys: 'click · WASD + mouse',
    cur_view: 'VIEW',
    cur_back: 'BACK',
    cur_next: 'NEXT',
  },
};

const listeners = new Set();
let lang = localStorage.getItem('lang') || (navigator.language?.startsWith('en') ? 'en' : 'fr');
document.documentElement.lang = lang;

export function getLang() {
  return lang;
}
export function setLang(l) {
  if (l === lang || !dict[l]) return;
  lang = l;
  localStorage.setItem('lang', l);
  document.documentElement.lang = l;
  listeners.forEach((fn) => fn(lang));
}
export function toggleLang() {
  setLang(lang === 'fr' ? 'en' : 'fr');
}
export function onLang(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
export function t(key) {
  return dict[lang][key] ?? dict.fr[key] ?? key;
}
// Résout un champ potentiellement bilingue { fr, en }
export function tv(val) {
  if (val && typeof val === 'object' && !Array.isArray(val)) return val[lang] ?? val.fr;
  return val;
}
