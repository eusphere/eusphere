import { createGarden } from "./garden.js";
import { createScene } from "./scene.js";
import { createPondReflection } from "./pond-reflection.js";

const { renderer, scene, camera, controls, frame, composer, resize, updateCamera, setAmbientLevel } = createScene();
const { pond, reflectionExcluded } = createGarden(scene);
const reflection = createPondReflection(pond, scene, camera, reflectionExcluded);
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  resize();
});
document.getElementById("reset-view").addEventListener("click", frame);
const ambientSlider = document.getElementById("ambient-light");
ambientSlider.addEventListener("input", () => {
  const value = Number(ambientSlider.value);
  setAmbientLevel(value / 100);
  ambientSlider.style.setProperty("--level", `${value}%`);
  ambientSlider.setAttribute("aria-valuetext", `${value} percent`);
  reflection.invalidate();
});
let previousTime;
renderer.setAnimationLoop(time => {
  const delta = previousTime === undefined ? 0 : Math.min((time - previousTime) / 1000, .1);
  previousTime = time;
  updateCamera(delta);
  composer.render();
});
