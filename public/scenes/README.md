# Scènes explorables

Deux façons de laisser les visiteurs **se balader dans une scène** :

## Option A — glTF léger + balade Three.js (recommandé, léger)

Exporte **seulement l'environnement à visiter** (ex : le camp de Valmyr, pas tout le jeu) en `.glb`, dépose-le dans `public/models/`, puis dans `src/data/projects.js` :

```js
mode: 'explore',
scene: 'models/valmyr-camp.glb',
```

La page charge ta scène et on s'y balade en vue première personne (ZQSD + souris). C'est **beaucoup plus léger** qu'un build complet — idéal quand le projet Unity entier est trop lourd.

Astuce export : ne garde que la géométrie du décor, réduis/atlas les textures, applique les modificateurs. Vise < 15 Mo.

## Option B — build Unity WebGL (la vraie scène jouable)

Pour rejouer la scène telle quelle (physique, scripts, éclairage Unity) :

1. Dans Unity : *File → Build Settings → WebGL*, ne mets **que la scène du camp** dans la liste.
2. *Player Settings* : compression **Gzip** (ou Brotli si ton host le sert), désactive le splash si tu peux.
3. Build → ça produit un dossier (`index.html`, `Build/`, `TemplateData/`).
4. Copie-le ici, ex : `public/scenes/valmyr/` (avec son `index.html`).
5. Dans `src/data/projects.js` :

```js
embed: 'scenes/valmyr/index.html',
```

La page intègre le build en plein écran. Attention au poids (souvent 20–60 Mo) : réserve ça à une ou deux scènes vitrines.
