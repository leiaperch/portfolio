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
      space: true,
      fleet: [
        'models/forlorn/ships/l-chasseur.glb',
        'models/forlorn/ships/l-fregate.glb',
        'models/forlorn/ships/l-croiseur.glb',
        'models/forlorn/ships/l-destroyer.glb',
        'models/forlorn/ships/l-pretorien.glb',
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
    realm: 'II',
    type: { fr: 'Visual Novel', en: 'Visual Novel' },
    tech: ['inkjs', 'JavaScript', 'HTML/CSS'],
    year: '2025',
    mode: 'embed',
    scene: null,
    embed: 'https://leiaperch.github.io/THE_CLUB/',
    status: { fr: 'Jouable en ligne', en: 'Playable online' },
    summary: {
      fr: 'Visual novel cyberpunk jouable directement dans le navigateur, propulsé par inkjs, The Club propose une expérence dans le monde de Hexapolis, une cité autoritaire et futuriste intimement liée à la sombre histoire du heros. ',
      en: 'A cyberpunk visual novel playable right in the browser, powered by inkjs, The Club propose an experience in Hexapolis, an authoriatarian futuristic city linked to the dark past of our hero',
    },
    about: {
      fr: [
        'The Club est un visual novel cyberpunk : membre d’un club clandestin, on dialogue et on choisit — chaque décision infléchit l’histoire et les relations.',
        'Version web codée en JavaScript avec le moteur narratif inkjs (script Ink compilé en JSON), déployée automatiquement sur GitHub Pages. Écriture, personnages et DA réalisés par moi-même.',
      ],
      en: [
        'The Club is a cyberpunk visual novel: as a member of an underground club, you talk and choose — every decision bends the story and its relationships.',
        'A web version coded in JavaScript with the inkjs narrative engine (Ink script compiled to JSON), auto-deployed to GitHub Pages. Writing, characters and art direction by me.',
      ],
    },
    cover: 'images/the-club/main-thread.jpg',
    gallery: [
      'images/the-club/main-thread.jpg',
      'images/the-club/hub.jpg',
      'images/the-club/ivy.jpg',
      'images/the-club/nox.jpg',
    ],
  },
  {
    id: 'kaldrith',
    title: 'Kaldrith',
    realm: 'I',
    type: { fr: 'Rogue-like 2D · Donjon', en: '2D dungeon roguelike' },
    tech: ['Unity 6', 'URP 2D', 'C#', 'Pixel Art'],
    year: '2024',
    mode: 'dungeon',
    scene: { dungeon: true },
    embed: null,
    status: { fr: 'En développement · Solo', en: 'In development · Solo' },
    summary: {
      fr: 'Rogue-like 2D de donjon sur le thème de la corruption : on incarne le dernier prêtre qui s’enfonce dans des salles générées, face à quatre factions d’ennemis. Développé sous Unity 6 (URP 2D, New Input System).',
      en: 'A 2D dungeon roguelike on the theme of corruption: you play the last priest delving through generated rooms against four enemy factions. Built in Unity 6 (2D URP, New Input System).',
    },
    about: {
      fr: [
        'Kaldrith est un rogue-like 2D top-down : le dernier prêtre traverse un donjon rongé par la corruption, affrontant quatre factions — les Fixes, les Proliférants, les Écarlates et les Errants — pour reconquérir les fragments de la Trinité.',
        'Le donjon ci-dessus est jouable avec mes vrais assets : balade le prêtre (ZQSD / flèches) d’une salle à l’autre en franchissant les portes, frappe les chevaliers de pierre (faction Fixes) à la dague (Espace / clic) — tes trois cœurs en HUD — dans des salles éclairées aux brasiers, avec coffre et autel. Développé sous Unity 6 (URP 2D, New Input System, un seul assembly).',
      ],
      en: [
        'Kaldrith is a top-down 2D roguelike: the last priest crosses a dungeon eaten by corruption, facing four factions — the Fixed, the Proliferants, the Scarlets and the Wanderers — to reclaim the fragments of the Trinity.',
        'The dungeon above is playable with my real assets: walk the priest (WASD / arrows) from room to room through the doors, strike the stone knights (Fixed faction) with the dagger (Space / click) — three hearts in the HUD — across torchlit rooms with a chest and an altar. Built in Unity 6 (2D URP, New Input System, single assembly).',
      ],
    },
    cover: null,
    gallery: [],
  },
  {
    id: 'setubal-vr',
    title: 'Galerie Setúbal',
    realm: 'I',
    type: { fr: 'Expérience VR · Scène 3D', en: 'VR experience · 3D scene' },
    tech: ['Unity XR', 'Adobe Aero', 'Blender', 'Photogrammétrie'],
    year: '2023',
    mode: 'explore',
    scene: {
      gallery: true,
      statues: [
        'models/internship/man.glb',
        'models/internship/bicycle.glb',
        'models/internship/birds.glb',
        'models/internship/choco.glb',
        'models/internship/parque.glb',
      ],
    },
    embed: null,
    status: { fr: 'Stage · Setúbal (Portugal)', en: 'Internship · Setúbal (Portugal)' },
    summary: {
      fr: 'Scène 3D en réalité virtuelle réalisée en stage à Setúbal (Portugal) : un scan photogrammétrique du Parque do Bonfim, transformé en environnement VR sous Unity XR.',
      en: 'A virtual-reality 3D scene made during my internship in Setúbal (Portugal): a photogrammetry scan of Parque do Bonfim turned into a VR environment in Unity XR.',
    },
    about: {
      fr: [
        'Pendant mon stage à Setúbal, j’ai scanné un lieu réel — le Parque do Bonfim — en photogrammétrie (Scaniverse), nettoyé le maillage sous Blender, puis monté une expérience immersive sous Unity XR et Adobe Aero (réalité augmentée / virtuelle, interactions).',
        'La galerie ci-dessus rejoue l’exposition en 3D : on s’y balade librement (ZQSD + souris) parmi mes pièces — le scan du parc et les éléments modélisés (personnage, vélo, oiseaux, un choco frito…).',
      ],
      en: [
        'During my internship in Setúbal, I photogrammetry-scanned a real place — Parque do Bonfim — with Scaniverse, cleaned the mesh in Blender, then built an immersive experience in Unity XR and Adobe Aero (augmented / virtual reality, interactions).',
        'The gallery above replays the exhibition in 3D: walk freely (WASD + mouse) among my pieces — the park scan and the modelled elements (a character, a bicycle, birds, a choco frito…).',
      ],
    },
    video: 'videos/mercado-aero.mp4',
    poster: 'images/internship/mercado-aero.jpg',
    mediaCaption: {
      fr: "Expérience Adobe Aero « Mercado » : le panneau d'azulejos du Mercado do Livramento, animé et posé en réalité augmentée sur le mur.",
      en: 'Adobe Aero experience “Mercado”: the Mercado do Livramento azulejo panel, animated and placed in augmented reality on the wall.',
    },
    cover: null,
    gallery: ['images/internship/mercado-base.jpg'],
  },
  {
    id: 'fill-your-pockets',
    title: 'Fill Your Pockets',
    realm: 'I',
    type: { fr: 'Rogue-like isométrique 2.5D', en: 'Isometric 2.5D roguelike' },
    tech: ['Unity', 'URP 2D', 'C#', 'Game Art'],
    year: '2023',
    mode: 'iso',
    scene: { iso: true },
    embed: null,
    status: { fr: 'Projet d’équipe · Stage · Setúbal', en: 'Team project · Internship · Setúbal' },
    summary: {
      fr: 'Rogue-like isométrique en 2.5D inspiré de Dofus, réalisé en équipe pendant mon stage à Setúbal : on traverse deux niveaux générés, on combat et on remplit ses poches d’or. Direction artistique et sprites dessinés à la main par moi.',
      en: 'An isometric 2.5D roguelike inspired by Dofus, built with a team during my internship in Setúbal: cross two generated levels, fight and fill your pockets with gold. Art direction and hand-drawn sprites by me.',
    },
    about: {
      fr: [
        'Fill Your Pockets est un rogue-like isométrique 2.5D à la Dofus : deux niveaux, un héros qui explore, ramasse l’or, affronte des Grogs et déjoue des pièges avant la sortie. J’y ai porté la direction artistique — héros, ennemis, coffres et tuiles désert, tout est dessiné main.',
        'La scène ci-dessus rejoue une prairie avec mes vrais sprites : déplace le héros (ZQSD / flèches), ramasse les bourses d’or, ouvre le coffre et frappe le Grog (Espace / clic) sur l’herbe, le chemin et le pont, le long de la rivière et de la mare. Côté équipe, développé sous Unity (URP 2D, C#) pendant le stage.',
      ],
      en: [
        'Fill Your Pockets is an isometric 2.5D roguelike à la Dofus: two levels, a hero who explores, grabs gold, fights Grogs and dodges traps before the exit. I led the art direction — hero, enemies, chests and desert tiles, all hand-drawn.',
        'The scene above replays a meadow with my real sprites: move the hero (WASD / arrows), grab the gold purses, open the chest and hit the Grog (Space / click) across grass, the path and the bridge, along the river and pond. As a team, built in Unity (2D URP, C#) during the internship.',
      ],
    },
    cover: null,
    gallery: [],
  },
];
