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
const ambientSlider = document.getElementById("ambient-light");
function restoreDefaults() {
  frame();
  ambientSlider.value = "100";
  ambientSlider.style.setProperty("--level", "100%");
  ambientSlider.setAttribute("aria-valuetext", "100 percent");
  setAmbientLevel(1);
  reflection.invalidate();
}
document.getElementById("reset-view").addEventListener("click", restoreDefaults);
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
