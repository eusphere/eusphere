import * as THREE from 'three';

export function createCameraMotion(camera, controls, { reducedMotion = false } = {}) {
  let transition = null;
  const homeTarget = new THREE.Vector3(0, .7, 0);
  const orbitSpeed = .06; // About 16 minutes 40 seconds per revolution.
  controls.autoRotateSpeed = orbitSpeed;

  function home() {
    const distance = 15 / Math.min(1, camera.aspect);
    controls.maxDistance = Math.max(25, distance * 1.5);
    return new THREE.Vector3(distance * .44, distance * .55, distance * .79);
  }
  function resume() {
    transition = null;
    controls.enableDamping = true;
    controls.autoRotate = !reducedMotion;
  }
  function reset({ immediate = false } = {}) {
    const startPosition = camera.position.clone();
    const startTarget = controls.target.clone();
    const destination = home();
    // Drain residual drag/zoom damping without displaying its intermediate pose.
    controls.autoRotate = false;
    controls.enableDamping = false;
    controls.update(0);
    camera.position.copy(startPosition);
    controls.target.copy(startTarget);
    controls.update(0);
    if (immediate || reducedMotion) {
      camera.position.copy(destination);
      controls.target.copy(homeTarget);
      controls.update(0);
      resume();
      return;
    }
    const from = new THREE.Spherical().setFromVector3(startPosition.clone().sub(startTarget));
    const to = new THREE.Spherical().setFromVector3(destination.sub(homeTarget));
    // Take the shorter arc; a straight-line lerp could pass through the garden.
    to.theta = from.theta + Math.atan2(Math.sin(to.theta-from.theta), Math.cos(to.theta-from.theta));
    transition = { from, to, startTarget, elapsed: 0, duration: 1.8 };
  }
  function update(deltaSeconds) {
    if (!transition) {
      controls.update(deltaSeconds);
      return;
    }
    const t = transition;
    t.elapsed += deltaSeconds;
    const fraction = Math.min(t.elapsed / t.duration, 1);
    const ease = fraction ** 3 * (fraction * (fraction * 6 - 15) + 10);
    const spherical = new THREE.Spherical(
      THREE.MathUtils.lerp(t.from.radius,t.to.radius,ease),
      THREE.MathUtils.lerp(t.from.phi,t.to.phi,ease),
      THREE.MathUtils.lerp(t.from.theta,t.to.theta,ease),
    );
    controls.target.copy(t.startTarget).lerp(homeTarget,ease);
    camera.position.setFromSpherical(spherical).add(controls.target);
    controls.update(0);
    if (fraction === 1) resume();
  }
  // A new drag/zoom takes over immediately, rather than fighting the reset.
  controls.addEventListener('start', resume);
  reset({ immediate: true });
  return {
    reset: () => reset(),
    update,
    dispose() { controls.removeEventListener('start',resume); },
  };
}
