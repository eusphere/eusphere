import { createGarden } from "./garden.ts";
import { createScene } from "./scene.ts";
import { createPondReflection } from "./pond-reflection.ts";

const { renderer, scene, camera, controls, frame, composer, resize, updateCamera, setAmbientLevel } = createScene();
const { pond, reflectionExcluded } = createGarden(scene);
const reflection = createPondReflection(pond, scene, camera, reflectionExcluded);
let ambientLevel = 1;
let ambientReset: { elapsed: number; duration: number; from: number } | null = null;
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  resize();
});
const ambientSlider = document.getElementById("ambient-light");
function restoreDefaults() {
  frame();
  ambientReset = { elapsed: 0, duration: 1.8, from: ambientLevel };
  reflection.invalidate();
}
document.getElementById("reset-view").addEventListener("click", restoreDefaults);
ambientSlider.addEventListener("input", () => {
  const value = Number(ambientSlider.value);
  ambientReset = null;
  ambientLevel = value / 100;
  setAmbientLevel(ambientLevel);
  ambientSlider.style.setProperty("--level", `${value}%`);
  ambientSlider.setAttribute("aria-valuetext", `${value} percent`);
  reflection.invalidate();
});
let previousTime;
renderer.setAnimationLoop(time => {
  const delta = previousTime === undefined ? 0 : Math.min((time - previousTime) / 1000, .1);
  previousTime = time;
  updateCamera(delta);
  if (ambientReset) {
    ambientReset.elapsed += delta;
    const progress = Math.min(ambientReset.elapsed / ambientReset.duration, 1);
    const eased = progress ** 3 * (progress * (progress * 6 - 15) + 10);
    ambientLevel = ambientReset.from + (1 - ambientReset.from) * eased;
    const value = Math.round(ambientLevel * 100);
    ambientSlider.value = String(value);
    ambientSlider.style.setProperty("--level", `${value}%`);
    ambientSlider.setAttribute("aria-valuetext", `${value} percent`);
    setAmbientLevel(ambientLevel);
    if (progress === 1) ambientReset = null;
  }
  composer.render();
});
