import * as THREE from "three";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";

// Reuse Three's mirrored camera and oblique clipping plane, but keep our physical
// water material. The helper is never added to the scene or rendered as a mesh.
export function createPondReflection(pond, scene, viewCamera, excluded = [], {
  resolution = 1024,
  maxFps = 20,
  now = () => performance.now(),
} = {}) {
  const captureInterval = 1000 / maxFps;
  let lastCaptureTime = -Infinity;
  const mirror = new Reflector(pond.geometry, {
    textureWidth: resolution,
    textureHeight: resolution,
    multisample: 0,
    clipBias: .001,
  });
  const uniforms = {
    gardenReflection: { value: mirror.getRenderTarget().texture },
    gardenReflectionMatrix: mirror.material.uniforms.textureMatrix,
    gardenReflectionReady: { value: 0 },
    gardenReflectionTexel: { value: 1 / resolution },
  };
  const material = pond.material;
  const originalSurface = {
    envMapIntensity: material.envMapIntensity,
    roughness: material.roughness,
    clearcoatRoughness: material.clearcoatRoughness,
  };
  // The pond now has its own reflected environment. Keep the generic studio
  // highlights restrained so they do not wash out the garden reflection.
  material.envMapIntensity = .45;
  material.roughness = .24;
  material.clearcoatRoughness = .22;
  const compileWater = material.onBeforeCompile;
  const waterCacheKey = material.customProgramCacheKey();
  const previousBeforeRender = pond.onBeforeRender;
  const cameraWorld = new THREE.Matrix4();
  const projection = new THREE.Matrix4();
  const pondWorld = new THREE.Matrix4();
  let dirty = true;
  let capturing = false;
  let captures = 0;
  let disposed = false;

  material.onBeforeCompile = (shader, renderer) => {
    compileWater.call(material, shader, renderer);
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = 'uniform mat4 gardenReflectionMatrix; varying vec4 vGardenReflection;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      vGardenReflection = gardenReflectionMatrix * vec4(position,1.0);
    `);
    shader.fragmentShader = `
      uniform sampler2D gardenReflection;
      uniform float gardenReflectionReady;
      uniform float gardenReflectionTexel;
      varying vec4 vGardenReflection;
    ` + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
      vec2 mirrorUv = vGardenReflection.xy / max(vGardenReflection.w,.0001);
      vec2 rippleOffset = vec2(
        gardenNoise(vec3(vWater.xz*12.0,1.0)),
        gardenNoise(vec3(vWater.zx*15.0,7.0))
      ) - .5;
      mirrorUv += rippleOffset * .004;
      float mirrorInside = step(0.0,mirrorUv.x)*step(mirrorUv.x,1.0)
                         *step(0.0,mirrorUv.y)*step(mirrorUv.y,1.0)
                         *step(.0001,vGardenReflection.w);
      vec2 blur = vec2(gardenReflectionTexel*.8,0.0);
      vec3 reflection = texture2D(gardenReflection,mirrorUv).rgb*.4;
      reflection += texture2D(gardenReflection,mirrorUv+blur.xy).rgb*.15;
      reflection += texture2D(gardenReflection,mirrorUv-blur.xy).rgb*.15;
      reflection += texture2D(gardenReflection,mirrorUv+blur.yx).rgb*.15;
      reflection += texture2D(gardenReflection,mirrorUv-blur.yx).rgb*.15;
      float grazing = pow(1.0-clamp(dot(normal,normalize(vViewPosition)),0.0,1.0),3.0);
      float reflectionWeight = (.28+.5*grazing)*(1.0-.45*shallows);
      // Both inputs are linear HDR; OutputPass handles the final tone mapping.
      outgoingLight = mix(outgoingLight,reflection*vec3(.88,.96,.91),
                         reflectionWeight*gardenReflectionReady*mirrorInside);
      #include <opaque_fragment>
    `);
  };
  material.customProgramCacheKey = () => `${waterCacheKey}-garden-reflection-v1`;
  material.needsUpdate = true;

  pond.onBeforeRender = function(renderer, renderScene, camera, ...args) {
    previousBeforeRender.call(this, renderer, renderScene, camera, ...args);
    // SSAO uses an override material; it must never trigger another scene render.
    if (disposed || capturing || camera !== viewCamera || renderScene.overrideMaterial) return;
    if (!dirty && cameraWorld.equals(camera.matrixWorld)
        && projection.equals(camera.projectionMatrix) && pondWorld.equals(pond.matrixWorld)) return;

    const captureTime = now();
    // Reuse the captured texture AND its matching projection between updates.
    // Explicit invalidations and projection/plane changes are never delayed.
    if (!dirty && projection.equals(camera.projectionMatrix)
        && pondWorld.equals(pond.matrixWorld)
        && captureTime - lastCaptureTime < captureInterval) return;

    mirror.matrixWorld.copy(pond.matrixWorld);
    const hidden = [pond, ...excluded];
    const visibility = hidden.map(object => object.visible);
    const target = renderer.getRenderTarget();
    const xrEnabled = renderer.xr.enabled;
    const shadowUpdate = renderer.shadowMap.autoUpdate;
    capturing = true;
    try {
      hidden.forEach(object => { object.visible = false; });
      // Called during the main color pass, after its full-scene shadows exist.
      // This is a direct render: no repeated SSAO or output processing.
      mirror.onBeforeRender(renderer, scene, camera);
      uniforms.gardenReflectionReady.value = 1;
      cameraWorld.copy(camera.matrixWorld);
      projection.copy(camera.projectionMatrix);
      pondWorld.copy(pond.matrixWorld);
      dirty = false;
      lastCaptureTime = captureTime;
      captures += 1;
    } finally {
      hidden.forEach((object,i) => { object.visible = visibility[i]; });
      renderer.xr.enabled = xrEnabled;
      renderer.shadowMap.autoUpdate = shadowUpdate;
      renderer.setRenderTarget(target);
      capturing = false;
    }
  };

  return {
    // Future moving geometry/light changes must invalidate this cached image.
    invalidate() { dirty = true; },
    get captures() { return captures; },
    dispose() {
      if (disposed) return;
      disposed = true;
      pond.onBeforeRender = previousBeforeRender;
      material.onBeforeCompile = compileWater;
      Object.assign(material, originalSurface);
      material.customProgramCacheKey = () => waterCacheKey;
      material.needsUpdate = true;
      mirror.dispose();
    },
  };
}
