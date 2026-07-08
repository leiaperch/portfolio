# Modèles 3D des projets

Dépose ici les modèles de tes projets au format **glTF binaire** (`.glb` de préférence, ou `.gltf` + ressources).

## Comment brancher un modèle

1. Exporte depuis Blender/Unity en `.glb` (glTF 2.0). Vise un fichier léger (< 5–10 Mo) : applique les modificateurs, réduis les textures si besoin.
2. Place-le ici, ex : `public/models/forlorn.glb`.
3. Dans `src/data/projects.js`, renseigne le champ `scene` du projet :

   ```js
   scene: 'models/forlorn.glb',
   ```

4. C'est tout — la page projet chargera le modèle à la place du placeholder chrome, avec éclairage studio, reflets et rotation à la souris.

## Conseils export

- **Origine centrée** : la scène recentre et met à l'échelle automatiquement, mais un pivot propre aide.
- **Matériaux PBR** (metalness/roughness) : ils profitent des reflets d'environnement.
- **Emissive** possible pour des effets lumineux (néons, cristaux…).
