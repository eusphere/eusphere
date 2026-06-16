import * as THREE from "https://esm.sh/three@0.166.1";
import { OrbitControls } from "https://esm.sh/three@0.166.1/examples/jsm/controls/OrbitControls.js";

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
scene.fog = new THREE.Fog("#f4f2ee", 220, 980);

const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  3000
);
camera.position.set(70, 70, 0);
camera.lookAt(0, 0, 0);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 0, 0);
controls.minDistance = 30;
controls.maxDistance = 260;
controls.maxPolarAngle = Math.PI * 0.49;
controls.update();

const ambientLight = new THREE.AmbientLight(0xf5f0e8, 0.55);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xfffbf2, 1.0);
directionalLight.position.set(120, 180, 80);
scene.add(directionalLight);

const FIELD_RADIUS = 1400;
const geometry = new THREE.CircleGeometry(FIELD_RADIUS, 512);
geometry.rotateX(-Math.PI / 2);

const material = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uLightDir: { value: new THREE.Vector3(0.5, 1.0, 0.35).normalize() },
    uGrassA: { value: new THREE.Color("#4d7d41") },
    uGrassB: { value: new THREE.Color("#628f4e") },
    uGrassC: { value: new THREE.Color("#7ba75f") },
    uHorizonColor: { value: new THREE.Color("#f4f2ee") },
    uFieldRadius: { value: FIELD_RADIUS },
  },
  vertexShader: `
    uniform float uTime;
    varying vec3 vWorldPos;
    varying float vBreeze;

    void main() {
      vec3 p = position;
      float waveA = sin((p.x * 0.018) + (uTime * 0.9));
      float waveB = cos((p.z * 0.015) + (uTime * 0.72));
      float waveC = sin((p.x + p.z) * 0.008 + (uTime * 0.6));
      float breeze = (waveA * 0.52 + waveB * 0.32 + waveC * 0.16);
      p.y += breeze * 2.8;

      vec4 worldPos = modelMatrix * vec4(p, 1.0);
      vWorldPos = worldPos.xyz;
      vBreeze = breeze;

      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  fragmentShader: `
    uniform vec3 uLightDir;
    uniform vec3 uGrassA;
    uniform vec3 uGrassB;
    uniform vec3 uGrassC;
    uniform vec3 uHorizonColor;
    uniform float uFieldRadius;

    varying vec3 vWorldPos;
    varying float vBreeze;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);

      float a = hash(i + vec2(0.0, 0.0));
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));

      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }

    void main() {
      vec2 uv = vWorldPos.xz * 0.025;
      float n1 = noise(uv);
      float n2 = noise(uv * 2.3 + vec2(5.1, 1.7));
      float n3 = noise(uv * 5.7 + vec2(13.7, 9.3));
      float mask = clamp(n1 * 0.6 + n2 * 0.3 + n3 * 0.1, 0.0, 1.0);
      float windBands = sin((vWorldPos.x * 0.035) + (vWorldPos.z * 0.02) + (vBreeze * 4.0));
      float movingHighlight = smoothstep(0.35, 0.95, windBands) * 0.16;

      vec3 grassMix = mix(uGrassA, uGrassB, mask);
      grassMix = mix(grassMix, uGrassC, smoothstep(0.55, 0.95, n2));

      vec3 derivedNormal = normalize(cross(dFdx(vWorldPos), dFdy(vWorldPos)));
      float light = max(dot(derivedNormal, normalize(uLightDir)), 0.0);
      float softShade = 0.55 + (light * 0.45);
      float breezeTint = 0.06 * vBreeze;

      vec3 color = grassMix * softShade;
      color += vec3(0.02, 0.03, 0.01) + breezeTint + movingHighlight;

      float radial = length(vWorldPos.xz);
      float edgeFade = smoothstep(uFieldRadius * 0.72, uFieldRadius * 0.98, radial);
      color = mix(color, uHorizonColor, edgeFade);

      gl_FragColor = vec4(color, 1.0);
    }
  `,
});

const field = new THREE.Mesh(geometry, material);
field.receiveShadow = false;
scene.add(field);

const clock = new THREE.Clock();

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener("resize", onResize);

function animate() {
  material.uniforms.uTime.value = clock.getElapsedTime();
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
