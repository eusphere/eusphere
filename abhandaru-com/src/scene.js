import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { FIELD_RADIUS, FOV } from "./constants.js";

export function createScene() {
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

  return { renderer, scene, camera, controls };
}
