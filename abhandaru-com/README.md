# abhandaru.com

A static, frontend-only Three.js TypeScript scene, built with Vite and deployed to S3/CloudFront.
This is one tenant in the Eusphere monorepo; it has its own package and build.
There is no application server, database, React runtime, or runtime asset service.

## Development

Requires Node >=20; CI uses Node 22. Yarn and `yarn.lock` are the deployment path.
All application and test sources use `.ts`; Vite transpiles the app, while Node's
native type stripping runs the tests.

```bash
cd abhandaru-com
yarn install --frozen-lockfile
yarn dev
```

Open the URL Vite prints, usually `http://localhost:5173`. Drag to orbit,
scroll/pinch to zoom, and use **Reset** for a gentle 1.8-second return home.
Panning is disabled. A very slow default orbit takes about 16 minutes 40 seconds
per turn; manual interaction interrupts a reset. Reduced-motion preferences
disable auto-orbit and use an immediate reset. Initial framing accounts for portrait screens;
resizing updates the projection, but does not automatically reset the user's view.

## Build and deployment

```bash
yarn build
yarn preview
```

Vite bundles `src/main.ts` into **`static/index.js`**, which is tracked in Git and
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

- `src/main.ts`: assembles the garden, updates controls, renders the composer,
  handles resizing, and wires the reset button.
- `src/camera-motion.ts`: time-based slow orbit and interruptible spherical reset.
- `src/scene.ts`: renderer, camera, OrbitControls, lighting, studio stage,
  environment, shadows, ambient occlusion, and final color output.
- `src/garden.ts`: procedural terrain, rock shelf, root and branches, moss,
  pond, fourteen lily pads, bamboo, and ferns; includes instancing helpers.
- `src/pond-reflection.ts`: cached mirrored-camera capture and water compositing.
- `src/materials.ts`: procedural moss, bark, lily veins, rock/soil relief,
  and water materials. Shader patches retain Three.js lighting and shadows.
- `static/index.css` and `index.html`: full-window canvas and minimal controls.
- `src/grass.ts`, `src/ground.ts`, and `src/constants.ts`: legacy grassland files;
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
Lighting comes partly from a generated `RoomEnvironment`. The pond additionally
reflects the actual garden through the planar reflection described below.

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

The pond now uses a 1024×1024 half-float reflection target, driven by Three.js's
`Reflector` mirrored camera and oblique clipping plane. The helper is not added
as another visible surface: its texture is blended into the physical water in
linear color, with a softened sample, subtle static distortion, and stronger
reflection at grazing angles. Generic environment highlights are restrained so
they do not overpower the reflected garden.

Captures occur in the main color pass, after full-scene shadow maps exist. They
reuse those shadows, omit fine moss sprigs (but retain moss cushions), and skip
SSAO and output processing. The pond is hidden during capture to avoid recursion.
Camera-driven updates are capped at 20 Hz; projection, pond-transform, and
explicit invalidations refresh immediately. Unchanged views reuse the image.
Auto-orbit keeps the cache refreshing, unlike a stationary camera. Between
captures, the texture and its captured projection matrix stay paired. The normal/depth override pass does not trigger captures. Moving other
objects or lights requires calling `invalidate()` on the returned reflection
controller. The rest of the scene still renders continuously.

Run `npm test` (or `node --test tests/*.test.ts`) for reflection cache invalidation, rate limiting,
pass exclusion, failure recovery, and camera reset/interruption tests. These use a renderer stub to validate the
capture lifecycle; they do not measure GPU performance. Browser checks cover
shader compilation and reflection behavior while orbiting. Real-device/mobile
performance and an adaptive reflection resolution policy remain unmeasured.

Other deferred work includes less uniform bamboo heights, animation, and a small
technology accent. Preserve the approved tree material while iterating elsewhere.

Recent checks covered the production build, finite geometry/instance transforms,
browser shader errors, close-up materials, orbit/reset controls, low-angle stage
views, and portrait framing. There is no automated visual regression suite or
real-device performance baseline. A narrow desktop viewport is not a mobile GPU
test. Vite reports a bundle-size warning above 500 kB uncompressed; the current
bundle is approximately 149 kB gzipped, including Three.js and postprocessing.

For scene changes, build and inspect both the default composition and close-up/
low-angle views. Check browser shader logs: GLSL compilation failures may only
appear at runtime. Documentation-only changes do not require a scene rebuild.

### Reflection resolution tradeoffs

1024×1024 has four times the pixels of 512×512. Its RGBA half-float color target
uses 8 MiB rather than 2 MiB, plus a depth buffer and driver overhead. Geometry
and draw-call counts per capture are unchanged; fragment shading and bandwidth
increase, so total capture time does not necessarily scale by exactly four.
2048×2048 would quadruple the pixels again (32 MiB for color alone), with smaller
visual returns on this pond and more mobile GPU pressure. Resolution and maximum
capture frequency are options on `createPondReflection`.

The 20 Hz limit trades slightly less current reflections during quick drags for
lower capture cost. The main camera/render loop is not capped to that rate.
Automatic orbit means caching no longer eliminates reflection rendering while
idle; static shadows, excluded fine moss sprigs, and skipped postprocessing still
reduce each capture's cost. Actual frame-time and device testing are still needed.

### Bottom controls

The controls sit in a translucent, blurred glass pill with a compact mobile
layout. The Ambient slider scales hemisphere light, fill light, and environment
intensity from zero to their authored defaults; the directional sun stays fixed.
Lighting changes invalidate the cached pond reflection. The slider defaults to
100% on reload and supports native keyboard input. Reset changes the camera only,
leaving the chosen ambient level in place.
