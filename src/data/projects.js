// Source unique de vérité pour les projets.
// `realm` = royaume (I Jeux & Mondes 3D · II Web & Interactif · III Outils & Systèmes).
// `scene` sera branché plus tard sur une vraie scène 3D (modèle Blender / Three.js).

export const projects = [
  {
    id: 'forlorn-stars',
    title: 'Forlorn Stars',
    realm: 'I',
    meta: ['Unity', 'TPS', '3D'],
    year: '2023',
    summary:
      'TPS spatial réalisé à EPITA Toulouse, en équipe de 4, sur 6 mois. Unity, Blender et scripts C#, développement quasi autonome.',
    cover: 'images/main_image_forlorn_stars.PNG',
    gallery: ['images/Forlorn1.png', 'images/Forlorn2.png', 'images/forlorn3.png', 'images/forlorn4.png'],
    scene: null,
  },
  {
    id: 'valmyr',
    title: 'Cendres de Valmyr',
    realm: 'I',
    meta: ['Action-RPG', 'Open World'],
    year: '2026',
    summary:
      'Action-RPG open world 3D dark fantasy en solo (Unity 6). Worldbuilding, level design et prototypage d’un univers complet.',
    cover: null,
    gallery: [],
    scene: null,
  },
  {
    id: 'kaldrith',
    title: 'Kaldrith',
    realm: 'I',
    meta: ['Unity 6', 'URP 2D'],
    year: '—',
    summary: 'Projet de jeu Unity 6 en URP 2D.',
    cover: null,
    gallery: [],
    scene: null,
  },
  {
    id: 'terraverse',
    title: 'Terraverse',
    realm: 'II',
    meta: ['Web', 'HTML/CSS'],
    year: '2024',
    summary:
      'Site vitrine pour une entreprise de réalité virtuelle, inspiré des studios type Virtual Room. HTML/CSS sans framework.',
    cover: 'images/main_image_html.PNG',
    gallery: ['images/TerraVerse1.PNG', 'images/TerraVerse2.PNG', 'images/TerraVerse3.PNG'],
    scene: null,
  },
  {
    id: 'pixel-war',
    title: 'Pixel War',
    realm: 'II',
    meta: ['JavaScript', 'Canvas', 'API'],
    year: '2024',
    summary:
      'Reproduction du « Pixel War » de Reddit : interface HTML/CSS sans framework consommant une API documentée en JavaScript.',
    cover: 'images/main_image_pixel.PNG',
    gallery: ['images/main_image_pixel.PNG'],
    scene: null,
  },
];

export const realms = {
  I: 'Jeux & Mondes 3D',
  II: 'Web & Interactif',
  III: 'Outils & Systèmes',
};
