import { createGarden } from "./garden.js";
import { createScene } from "./scene.js";

const { renderer, scene, camera, controls, frame, composer, resize } = createScene();
createGarden(scene);
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  resize();
});
document.getElementById("reset-view").addEventListener("click", frame);
renderer.setAnimationLoop(() => {
  controls.update();
  composer.render();
});
