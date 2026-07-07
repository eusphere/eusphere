import * as THREE from "three";
import { createGrass } from "./grass.js";
import { createGround } from "./ground.js";
import { createScene } from "./scene.js";

const { renderer, scene, camera, controls } = createScene();
createGround(scene);
const grassMaterial = createGrass(scene, camera);

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
