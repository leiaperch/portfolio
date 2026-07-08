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
    tech: ['Unity 6', 'URP', 'C#', 'Blender', 'World Design'],
    year: '2026',
    mode: 'orbit',
    scene: {
      fbx: 'models/valmyr/grimoire/grimoire.fbx',
      base: 'models/valmyr/grimoire/base.webp',
      normal: 'models/valmyr/grimoire/normal.webp',
      orm: 'models/valmyr/grimoire/orm.webp',
    },
    embed: null,
    status: {
      fr: 'Prototype jouable · Solo · En cours',
      en: 'Playable prototype · Solo · In progress',
    },
    summary: {
      fr: "Action-RPG narratif en monde ouvert, dark fantasy, que je développe seule sous Unity 6 — un prototype jouable où l'on explore les Marches de Cendre d'un royaume rongé par la Flétrissure.",
      en: 'A solo-built narrative open-world dark-fantasy action-RPG (Unity 6) — a playable prototype exploring the Ash Marches of a kingdom consumed by the Blight.',
    },
    about: {
      fr: [
        "Valmyr est un royaume tombé sous la Flétrissure, une malédiction qui relève les morts. On y débarque dans les Marches de Cendre : une plaine brûlée traversée par un Pont Brisé et hantée par les goules. On y déniche des artefacts oubliés — comme ce grimoire des Veilleurs, présenté ici en 3D.",
        "L'objectif est une vertical slice : une zone cohérente et jouable de bout en bout — exploration, combat, escalade, dialogues et quêtes — avant d'étendre le monde. Je porte le projet en solo, du game design au level design jusqu'à la direction artistique.",
      ],
      en: [
        'Valmyr is a kingdom fallen to the Blight, a curse that raises the dead. You arrive in the Ash Marches: a scorched plain crossed by a Broken Bridge and haunted by ghouls. You unearth forgotten artefacts there — like this Watchers’ grimoire, shown here in 3D.',
        'The goal is a vertical slice: one coherent, end-to-end playable zone — exploration, combat, climbing, dialogue and quests — before expanding the world. I run the project solo, from game design and level design to art direction.',
      ],
    },
    features: [
      {
        title: { fr: 'Combat & sorts', en: 'Combat & spells' },
        text: {
          fr: "Mêlée à la Falcille de Grisval et trois sorts — Flamme, Givre, Foudre — avec VFX, temps de recharge et barre d'action.",
          en: 'Melee with the Falcille de Grisval plus three spells — Fire, Frost, Lightning — with VFX, cooldowns and an action bar.',
        },
      },
      {
        title: { fr: 'Escalade', en: 'Climbing' },
        text: {
          fr: 'Escalade des ruines : accroche, montée, déplacement latéral et sortie par saut ou mantle, avec animations dédiées.',
          en: 'Climb the ruins: grab, ascend, strafe and exit by jump or mantle, with dedicated animations.',
        },
      },
      {
        title: { fr: 'PNJ, dialogues & quêtes', en: 'NPCs, dialogue & quests' },
        text: {
          fr: "Un camp peuplé de PNJ animés qui dialoguent et confient des quêtes, sur un bus d'événements et un journal auto-généré.",
          en: 'A camp of animated NPCs who talk and hand out quests, driven by an event bus and an auto-built journal.',
        },
      },
      {
        title: { fr: 'Direction artistique', en: 'Art direction' },
        text: {
          fr: 'Ambiance cendre et braises : brouillard, post-process ACES, ruines, palissade et feu de camp au cœur du refuge.',
          en: 'Ash-and-ember mood: fog, ACES post-processing, ruins, palisade and a campfire at the heart of the refuge.',
        },
      },
      {
        title: { fr: 'IA & caméra', en: 'AI & camera' },
        text: {
          fr: 'Caméra 3e personne custom (orbite, anti-clip) et goules à machine à états qui traquent le joueur du pont à la plaine.',
          en: 'Custom third-person camera (orbit, anti-clip) and state-machine ghouls that hunt you from the bridge to the plain.',
        },
      },
    ],
    cover: 'images/valmyr/camp-01-aerial.jpg',
    gallery: [
      'images/valmyr/camp-01-aerial.jpg',
      'images/valmyr/camp-04-porte.jpg',
      'images/valmyr/camp-02-place.jpg',
      'images/valmyr/camp-03-marche.jpg',
      'images/valmyr/camp-05-feu.jpg',
    ],
  },
  {
    id: 'forlorn-stars',
    title: 'Forlorn Stars',
    realm: 'I',
    type: { fr: 'TPS spatial', en: 'Space TPS' },
    tech: ['Unity', 'C#', 'Blender'],
    year: '2023',
    mode: 'orbit',
    scene: {
      skybox: [
        'models/forlorn/skybox/px.webp', 'models/forlorn/skybox/nx.webp',
        'models/forlorn/skybox/py.webp', 'models/forlorn/skybox/ny.webp',
        'models/forlorn/skybox/pz.webp', 'models/forlorn/skybox/nz.webp',
      ],
      fleet: [
        'models/forlorn/ships/a-chasseur.glb',
        'models/forlorn/ships/a-corvette.glb',
        'models/forlorn/ships/a-fregate.glb',
        'models/forlorn/ships/a-croiseur.glb',
        'models/forlorn/ships/a-destroyer.glb',
        'models/forlorn/ships/a-pretorien.glb',
      ],
    },
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
