# abhandaru.com

A static, frontend-only Three.js scene, built with Vite and deployed to S3/CloudFront.
This is one tenant in the Eusphere monorepo; it has its own package and build.
There is no application server, database, React runtime, or runtime asset service.

## Development

Requires Node >=20; CI uses Node 22. Yarn and `yarn.lock` are the deployment path.

```bash
cd abhandaru-com
yarn install --frozen-lockfile
yarn dev
```

Open the URL Vite prints, usually `http://localhost:5173`. Drag to orbit,
scroll/pinch to zoom, and use **Reset view** to restore the framing. Panning and
automatic rotation are disabled. Initial framing accounts for portrait screens;
resizing updates the projection, but does not automatically reset the user's view.

## Build and deployment

```bash
yarn build
yarn preview
```

Vite bundles `src/main.js` into **`static/index.js`**, which is tracked in Git and
referenced by `index.html`. Edit source files, then rebuild the bundle; do not
hand-edit the generated JavaScript. The build preserves the other static assets.
The preview command serves the built site on port 4173.

Development uses a Vite alias for `/static/index.js` plus middleware that serves
`static/`. If edits appear stale, rebuild and reload; check whether the browser
is receiving the source entry or the generated bundle before debugging the scene.

`release/prod.sh` installs with `yarn install --frozen-lockfile`, builds, uploads
`index.html` and `static/` to S3, and invalidates CloudFront. GitHub Actions runs
this through `Deploy-Abhandaru` in `.github/workflows/merge.yml`.
**Pushing changes on `main` can trigger production deployment.** There is no
staging deployment documented for this repository.

## Design intent and review context

The former grassland was replaced with a small Japanese-inspired garden. The
reference was a tactile, richly moss-covered curved piece of weathered wood on
a muted studio background. It established the desired natural material fidelity,
not a requirement to reproduce its website UI.

The composition is a miniature, tabletop-scale island: an exposed stone/earth
base, a moss-covered root arch, an open pond with lily pads, compact bamboo, and
ferns. The arch frames the pond; bamboo supplies height without enclosing it. An
open bank on the front-right leaves room for a future accent. This remains a
procedural interpretation of the concept, not a photorealistic asset recreation.

Preferences established during review:

- Keep the feeling lush, earthy, and dominated by natural elements.
- Use warm, soft light, but retain deep shade and readable dark areas. Earlier
  versions were too evenly lit; more ambient illumination is not the goal.
- Preserve the current fibrous tree texture, which was specifically approved.
- Preserve the rock-base composition and muted stage palette. Surface detail
  was requested without replacing those shapes or the overall presentation.
- Bamboo should be short and dense with leafy, tapered tips, not cut-off poles.
  Its apparent height uniformity is a known issue explicitly left for later.
- Ferns should have irregular bends, lengths, and leaflet spacing rather than
  perfectly radial, matching fronds. They are part of the intended woodland feel;
  the scene is not meant as a botanically exact reconstruction.
- Prefer hand-written shaders and small meshes. A more detailed centerpiece
  mesh or selective imported textures would be acceptable if needed.
- Random variation across refreshes is allowed, but is not required.

The longer-term direction is a restrained harmony of technology and nature
(solarpunk). No technology props have been selected or implemented. Composition,
lighting, and materials come before plant/water animation.

## Source map

- `src/main.js`: assembles the garden, updates controls, renders the composer,
  handles resizing, and wires the reset button.
- `src/scene.js`: renderer, camera, OrbitControls, lighting, studio stage,
  environment, shadows, ambient occlusion, and final color output.
- `src/garden.js`: procedural terrain, rock shelf, root and branches, moss,
  pond, fourteen lily pads, bamboo, and ferns; includes instancing helpers.
- `src/materials.js`: procedural moss, bark, lily veins, rock/soil relief,
  and water materials. Shader patches retain Three.js lighting and shadows.
- `static/index.css` and `index.html`: full-window canvas and minimal controls.
- `src/grass.js`, `src/ground.js`, and `src/constants.js`: legacy grassland files;
  they remain in the repository but are not imported by the current entry point.

## Geometry and materials

Placement is currently repeatable: `createGarden` resets a seeded generator to
2718. Randomness is used for natural variation within that repeatable layout.
Changing random calls can affect later placements, so compare the whole scene
when adjusting one generator.

Repeated moss, stones, bamboo, and fern parts use `InstancedMesh`. Moss consists
of irregular cushions with fine three-dimensional leafy sprigs, not just a green
color pattern. Its shader adds grain, relief, and darker sprig bases. Root and
branch tubes taper, and their UVs drive longitudinal bark grain. Lily pads have
slightly cupped geometry, uneven rims, veins, and mottling.

Rock and soil shaders use world-space noise for consistent grain scale, normal
perturbation for surface relief, and darker, less rough damp regions. These are
procedural appearance cues, not displaced high-resolution surfaces or a moisture
simulation. There are no downloaded textures or models.

Water is one opaque physical-material surface with static ripple normals and a
shoreline-to-center color gradient. The shallows and depth are visual cues; there
is no actual water volume, refraction, underwater scene, or fluid simulation.
Lighting comes partly from a generated `RoomEnvironment`; its highlights do
**not** reflect the garden objects themselves.

## Rendering decisions and pitfalls

- ACES tone mapping and sRGB conversion happen through `OutputPass` after scene
  composition. Avoid applying tone mapping a second time in custom shaders.
- A warm directional key, low hemisphere fill, and restrained environment light
  establish contrast. VSM shadows soften the cast shadows.
- Shadow maps are cached because geometry and lights are static. If future code
  moves plants, lights, or props, explicitly refresh the shadows or reconsider
  `renderer.shadowMap.autoUpdate = false`.
- A 16-sample SSAO pass supplies contact depth between overlapping forms. AO
  renders at CSS resolution; main-render pixel ratio is capped at 1.75.
- The stage fades to the exact backdrop color before clipping. AO fades out
  beyond the garden, and final-output dithering reduces gradient banding. These
  address a previously visible aliased horizon; verify low orbit angles if
  changing the floor, fog, camera range, or postprocessing.
- The render loop still runs continuously for damped controls. Cached shadows
  do not make the whole renderer demand-driven.
- Shader patches target the current Three.js shader chunks. A Three.js upgrade
  needs browser validation, not just a successful JavaScript build.

## Deferred work and validation

True garden reflections in the pond are explicitly deferred to a separate future
change. The proposed starting point is a 512×512 mirrored-camera render, updated
when the camera moves, with tiny moss sprigs omitted and no repeated SSAO pass.
This is a proposal, not an implemented feature or measured performance promise.
Reflection cost and mobile performance still need to be measured.

Other deferred work includes less uniform bamboo heights, animation, and a small
technology accent. Preserve the approved tree material while iterating elsewhere.

Recent checks covered the production build, finite geometry/instance transforms,
browser shader errors, close-up materials, orbit/reset controls, low-angle stage
views, and portrait framing. There is no automated visual regression suite or
real-device performance baseline. A narrow desktop viewport is not a mobile GPU
test. Vite reports a bundle-size warning above 500 kB uncompressed; the current
bundle is approximately 146 kB gzipped, including Three.js and postprocessing.

For scene changes, build and inspect both the default composition and close-up/
low-angle views. Check browser shader logs: GLSL compilation failures may only
appear at runtime. Documentation-only changes do not require a scene rebuild.
