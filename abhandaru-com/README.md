# abhandaru.com

Source code and assets for [abhandaru.com](https://abhandaru.com) are here.

## Development

The scene lives in `src/` and is bundled into `static/index.js` with Vite.

```bash
cd abhandaru-com
yarn install
yarn dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Production build

```bash
yarn build
```

This writes the bundled app to `static/index.js`. `index.html` still references `/static/index.js`, so production deploys stay the same.

## Deploy

`release/prod.sh` runs `yarn install --frozen-lockfile` and `yarn build` before uploading `index.html` and `static/` to S3.

GitHub Actions (`Deploy-Abhandaru` in `.github/workflows/merge.yml`) sets up Node 22 with Yarn cache, then runs the same release script.

## Garden scene

`src/garden.js` builds a deterministic miniature garden from procedural geometry:
mosspatches and tufts, a curved root, a pond with lily pads, compact bamboo, and
fern clusters. Repeated plants and stones use instanced meshes. Material shader
patches retain Three.js lighting and shadows while adding surface variation.
There are no downloaded textures, models, or runtime asset services.

`src/scene.js` owns the warm lighting, environment, camera, and OrbitControls.
Drag to orbit, scroll/pinch to zoom, and use **Reset view** to restore the framing.
Plant and water animation is intentionally deferred. This is a procedural first
pass; the root and moss can later receive more detailed art assets.

### Surface and lighting detail

`src/materials.js` contains the procedural moss relief, fibrous bark, and lily-pad
vein shaders. Moss uses instanced leafy sprigs above irregular cushions; bamboo
ends in tapered leafy shoots, and fern fronds vary in curvature and leaflet spacing.
The pond now has fourteen slightly cupped lily pads.

Lighting combines a warm key with restrained ambient fill and a 16-sample SSAO
pass for contact depth. AO renders at CSS resolution; static shadow maps are
cached while orbiting. OutputPass applies tone mapping once after composition.
No external textures or models are required. Initial framing adapts to portrait
screens, and the rock shelf and stage retain their original geometry and colors.

The studio floor fades into the backdrop before the camera clips it. Distant
contact shading is suppressed and the final gradient is dithered to avoid bands.
Rock and soil materials use world-space grain, surface relief, and damp-edge
roughness. Water uses static ripple normals and a shoreline color gradient as
depth cues; garden reflections and animated water remain deferred.
