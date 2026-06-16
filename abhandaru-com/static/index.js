import * as THREE from "https://esm.sh/three@0.166.1";
import { OrbitControls } from "https://esm.sh/three@0.166.1/examples/jsm/controls/OrbitControls.js";

const FOV = 90;
const FIELD_RADIUS = 400;
const GRASS_COUNT = 80000;
const BASE_DISC_COLORS = {
  DARK: "#345e2f",
  MID: "#3f6f37",
  SOFT: "#4e7e43",
};
const BASE_DISC_VARIATION = {
  MACRO_SCALE: 0.0048,
  MICRO_SCALE: 0.038,
  DETAIL_SCALE: 0.11,
  MACRO_WEIGHT: 0.58,
  MICRO_WEIGHT: 0.3,
  DETAIL_WEIGHT: 0.12,
};
const GRASS_COLORS = {
  BASE: "#4d7d41",
  MID: "#6a9954",
  TIP: "#87b86a",
};

const canvas = document.getElementById("scene");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color("#f4f2ee");
scene.fog = new THREE.Fog(
  "#f4f2ee",
  FIELD_RADIUS * 0.4,
  FIELD_RADIUS * 1.92
);

const camera = new THREE.PerspectiveCamera(
  FOV,
  window.innerWidth / window.innerHeight,
  0.1,
  3000
);
camera.position.set(50, 10, 0);
camera.lookAt(0, 0, 0);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.1;
controls.target.set(0, 0, 0);
controls.minDistance = 30;
controls.maxDistance = 120;
controls.minPolarAngle = Math.PI / 6;
controls.maxPolarAngle = Math.PI * 0.4;
controls.update();

const ambientLight = new THREE.AmbientLight(0xf5f0e8, 0.55);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xfffbf2, 1.0);
directionalLight.position.set(120, 180, 80);
scene.add(directionalLight);

const groundMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uLightDir: { value: new THREE.Vector3(0.5, 1.0, 0.35).normalize() },
    uColorDark: { value: new THREE.Color(BASE_DISC_COLORS.DARK) },
    uColorMid: { value: new THREE.Color(BASE_DISC_COLORS.MID) },
    uColorSoft: { value: new THREE.Color(BASE_DISC_COLORS.SOFT) },
    uFogColor: { value: new THREE.Color("#f4f2ee") },
    uFieldRadius: { value: FIELD_RADIUS },
  },
  vertexShader: `
    varying vec3 vWorldPos;

    void main() {
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPos = worldPos.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  fragmentShader: `
    uniform vec3 uLightDir;
    uniform vec3 uColorDark;
    uniform vec3 uColorMid;
    uniform vec3 uColorSoft;
    uniform vec3 uFogColor;
    uniform float uFieldRadius;

    varying vec3 vWorldPos;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }

    float fbm(vec2 p) {
      float f = 0.0;
      float amp = 0.5;
      for (int i = 0; i < 5; i++) {
        f += amp * noise(p);
        p *= 2.03;
        amp *= 0.5;
      }
      return f;
    }

    void main() {
      vec2 p = vWorldPos.xz;
      float macro = fbm(p * ${BASE_DISC_VARIATION.MACRO_SCALE.toFixed(4)});
      float micro = fbm(p * ${BASE_DISC_VARIATION.MICRO_SCALE.toFixed(3)} + vec2(17.0, 9.0));
      float detail = noise(p * ${BASE_DISC_VARIATION.DETAIL_SCALE.toFixed(2)} + vec2(31.2, 4.7));
      float patches = clamp(
        macro * ${BASE_DISC_VARIATION.MACRO_WEIGHT.toFixed(2)} +
        micro * ${BASE_DISC_VARIATION.MICRO_WEIGHT.toFixed(2)} +
        detail * ${BASE_DISC_VARIATION.DETAIL_WEIGHT.toFixed(2)},
        0.0,
        1.0
      );
      float broadSweep = fbm((p + vec2(90.0, -35.0)) * 0.0018);

      vec3 color = mix(uColorDark, uColorMid, patches);
      color = mix(color, uColorSoft, smoothstep(0.52, 0.95, micro));
      color *= mix(0.9, 1.07, broadSweep);

      float lambert = max(dot(vec3(0.0, 1.0, 0.0), normalize(uLightDir)), 0.0);
      color *= (0.78 + lambert * 0.22);

      float radial = length(p);
      float edgeFade = smoothstep(uFieldRadius * 0.72, uFieldRadius * 0.98, radial);
      color = mix(color, uFogColor, edgeFade);

      gl_FragColor = vec4(color, 1.0);
    }
  `,
});

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(FIELD_RADIUS, 256),
  groundMaterial
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.02;
scene.add(ground);

const bladeGeometry = new THREE.PlaneGeometry(0.32, 2.2, 1, 4);
bladeGeometry.translate(0, 0.9, 0);

const phase = new Float32Array(GRASS_COUNT);
const bend = new Float32Array(GRASS_COUNT);
const tone = new Float32Array(GRASS_COUNT);

bladeGeometry.setAttribute("aPhase", new THREE.InstancedBufferAttribute(phase, 1));
bladeGeometry.setAttribute("aBend", new THREE.InstancedBufferAttribute(bend, 1));
bladeGeometry.setAttribute("aTone", new THREE.InstancedBufferAttribute(tone, 1));

const grassMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uLightDir: { value: new THREE.Vector3(0.5, 1.0, 0.35).normalize() },
    uWindDir: { value: new THREE.Vector2(0.93, 0.37).normalize() },
    uCameraPos: { value: camera.position.clone() },
    uColorBase: { value: new THREE.Color(GRASS_COLORS.BASE) },
    uColorMid: { value: new THREE.Color(GRASS_COLORS.MID) },
    uColorTip: { value: new THREE.Color(GRASS_COLORS.TIP) },
  },
  side: THREE.DoubleSide,
  transparent: true,
  depthWrite: false,
  vertexShader: `
    uniform float uTime;
    uniform vec2 uWindDir;
    uniform vec3 uCameraPos;
    attribute float aPhase;
    attribute float aBend;
    attribute float aTone;

    varying vec2 vUv;
    varying float vTone;
    varying vec3 vWorldPos;
    varying vec3 vWorldNormal;
    varying float vFacing;

    void main() {
      vUv = uv;
      vTone = aTone;

      vec3 p = position;
      float rootMask = pow(uv.y, 1.55);
      float gustA = sin((uTime * 2.9) + aPhase + (instanceMatrix[3][0] * 0.05));
      float gustB = cos((uTime * 2.2) + (instanceMatrix[3][2] * 0.04) + (aPhase * 0.7));
      float sway = (gustA * 0.7 + gustB * 0.3) * 0.34 * aBend;
      p.x += sway * rootMask;

      vec4 worldPos = modelMatrix * instanceMatrix * vec4(p, 1.0);
      vec2 windDir = normalize(uWindDir);
      worldPos.x += windDir.x * sway * rootMask * 1.2;
      worldPos.z += windDir.y * sway * rootMask * 1.2;
      vWorldPos = worldPos.xyz;
      vec3 worldNormal = normalize(mat3(modelMatrix * instanceMatrix) * normal);
      vWorldNormal = worldNormal;
      vec3 viewDir = normalize(uCameraPos - worldPos.xyz);
      vFacing = 1.0 - abs(dot(viewDir, worldNormal));
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  fragmentShader: `
    uniform vec3 uLightDir;
    uniform vec3 uColorBase;
    uniform vec3 uColorMid;
    uniform vec3 uColorTip;

    varying vec2 vUv;
    varying float vTone;
    varying vec3 vWorldPos;
    varying vec3 vWorldNormal;
    varying float vFacing;

    void main() {
      float center = abs(vUv.x - 0.5);
      float width = mix(0.48, 0.04, vUv.y);
      width += (1.0 - vFacing) * 0.22;
      float edge = 1.0 - smoothstep(width - 0.13, width, center);
      if (edge < 0.02) discard;

      vec3 color = mix(uColorBase, uColorMid, vUv.y);
      color = mix(color, uColorTip, smoothstep(0.55, 1.0, vUv.y));
      color *= (0.9 + (vTone * 0.2));

      float lambert = max(dot(normalize(vWorldNormal), normalize(uLightDir)), 0.0);
      float light = 0.58 + (lambert * 0.35);
      color *= light;

      float radialDistance = length(vWorldPos.xz);
      float distanceFade = smoothstep(1050.0, 1450.0, radialDistance);
      color = mix(color, vec3(0.957, 0.949, 0.933), distanceFade);

      float distanceAlpha = 1.0 - smoothstep(780.0, 1380.0, radialDistance);
      float alpha = pow(edge, 1.35) * mix(1.0, 0.18, 1.0 - distanceAlpha);
      gl_FragColor = vec4(color, alpha);
    }
  `,
});

const grass = new THREE.InstancedMesh(bladeGeometry, grassMaterial, GRASS_COUNT);
grass.instanceMatrix.setUsage(THREE.StaticDrawUsage);

const dummy = new THREE.Object3D();
for (let i = 0; i < GRASS_COUNT; i += 1) {
  // Static radial clustering: dense near center, sparse toward edge.
  const r = Math.pow(Math.random(), 1.55) * (FIELD_RADIUS - 24);
  const theta = Math.random() * Math.PI * 2;
  const x = Math.cos(theta) * r;
  const z = Math.sin(theta) * r;
  // Randomize card orientation around vertical axis to avoid synchronized
  // disappearing at specific camera angles.
  const yaw = Math.random() * Math.PI;
  const scale = 0.65 + Math.random() * 1.35;

  dummy.position.set(x, 0, z);
  dummy.rotation.set(0, yaw, 0);
  dummy.scale.set(scale, scale * (0.9 + Math.random() * 0.5), scale);
  dummy.updateMatrix();
  grass.setMatrixAt(i, dummy.matrix);

  phase[i] = Math.random() * Math.PI * 2;
  bend[i] = 0.6 + Math.random() * 0.8;
  tone[i] = Math.random();
}

grass.instanceMatrix.needsUpdate = true;
grass.frustumCulled = false;
scene.add(grass);

const clock = new THREE.Clock();

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener("resize", onResize);

function animate() {
  grassMaterial.uniforms.uTime.value = clock.getElapsedTime();
  grassMaterial.uniforms.uCameraPos.value.copy(camera.position);
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
