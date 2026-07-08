// Source unique de vérité pour les projets.
// realm  : royaume (I Jeux & Mondes 3D · II Web & Interactif · III Outils & Systèmes)
// type   : nature du projet — bilingue { fr, en }
// tech   : technologies (chips ; termes conservés tels quels)
// mode   : 'orbit'   -> modèle 3D qui tourne · 'explore' -> balade 1re personne
// scene  : chemin glTF dans public/ (ex 'models/x.glb') sinon null -> placeholder
// embed  : chemin build Unity WebGL dans public/ (ex 'scenes/valmyr/index.html') sinon null
// summary: description — bilingue { fr, en }

export const projects = [
  {
    id: 'valmyr',
    title: 'Cendres de Valmyr',
    realm: 'I',
    type: { fr: 'Action-RPG · Open World', en: 'Action-RPG · Open World' },
    tech: ['Unity 6', 'C#', 'Blender', 'World Design'],
    year: '2026',
    mode: 'explore',
    scene: null,
    embed: null,
    summary: {
      fr: 'Action-RPG open world 3D dark fantasy développé en solo (Unity 6). Worldbuilding, level design et direction artistique d’un univers complet — ici, balade-toi dans le camp.',
      en: 'A solo-developed 3D dark-fantasy open-world action-RPG (Unity 6). Worldbuilding, level design and art direction of a full universe — here, wander through the camp.',
    },
    cover: null,
    gallery: [],
  },
  {
    id: 'forlorn-stars',
    title: 'Forlorn Stars',
    realm: 'I',
    type: { fr: 'TPS spatial', en: 'Space TPS' },
    tech: ['Unity', 'C#', 'Blender'],
    year: '2023',
    mode: 'orbit',
    scene: null,
    embed: null,
    summary: {
      fr: 'TPS spatial réalisé à EPITA Toulouse, en équipe de 4, sur 6 mois. Développement quasi autonome sous Unity, modélisation Blender et scripts C#.',
      en: 'A space third-person shooter built at EPITA Toulouse by a team of 4 over 6 months. Largely self-directed development in Unity, Blender modelling and C# scripting.',
    },
    cover: 'images/main_image_forlorn_stars.PNG',
    gallery: ['images/Forlorn1.png', 'images/Forlorn2.png', 'images/forlorn3.png', 'images/forlorn4.png'],
  },
  {
    id: 'the-club',
    title: 'The Club',
    realm: 'I',
    type: { fr: 'Jeu narratif', en: 'Narrative game' },
    tech: ['Unity', 'C#', 'Ink'],
    year: '2025',
    mode: 'orbit',
    scene: null,
    embed: null,
    summary: {
      fr: 'Jeu narratif construit sous Unity avec le moteur de dialogues Ink — écriture interactive, embranchements et mise en scène.',
      en: 'A narrative game built in Unity with the Ink dialogue engine — interactive writing, branching and staging.',
    },
    cover: null,
    gallery: [],
  },
  {
    id: 'kaldrith',
    title: 'Kaldrith',
    realm: 'I',
    type: { fr: 'Jeu 2D', en: '2D game' },
    tech: ['Unity 6', 'URP 2D', 'C#'],
    year: '—',
    mode: 'orbit',
    scene: null,
    embed: null,
    summary: {
      fr: 'Projet de jeu Unity 6 en URP 2D.',
      en: 'A Unity 6 game project in 2D URP.',
    },
    cover: null,
    gallery: [],
  },
  {
    id: 'pixel-war',
    title: 'Pixel War',
    realm: 'II',
    type: { fr: 'Web temps réel', en: 'Real-time web' },
    tech: ['JavaScript', 'Canvas', 'API REST'],
    year: '2024',
    mode: 'orbit',
    scene: null,
    embed: null,
    summary: {
      fr: 'Reproduction du « Pixel War » de Reddit : interface HTML/CSS sans framework consommant une API documentée en JavaScript.',
      en: "A remake of Reddit's Pixel War: a framework-free HTML/CSS interface consuming a documented API in JavaScript.",
    },
    cover: 'images/main_image_pixel.PNG',
    gallery: ['images/main_image_pixel.PNG'],
  },
];
