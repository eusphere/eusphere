import { createGarden } from "./garden.js";
import { createScene } from "./scene.js";
import { createPondReflection } from "./pond-reflection.js";

const { renderer, scene, camera, controls, frame, composer, resize, updateCamera } = createScene();
const { pond, reflectionExcluded } = createGarden(scene);
createPondReflection(pond, scene, camera, reflectionExcluded);
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  resize();
});
document.getElementById("reset-view").addEventListener("click", frame);
let previousTime;
renderer.setAnimationLoop(time => {
  const delta = previousTime === undefined ? 0 : Math.min((time - previousTime) / 1000, .1);
  previousTime = time;
  updateCamera(delta);
  composer.render();
});
