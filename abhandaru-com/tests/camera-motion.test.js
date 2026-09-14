import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createCameraMotion} from '../src/camera-motion.js';

function fixture(options) {
  const camera=new THREE.PerspectiveCamera(36,1.5,.1,120);
  const controls=new THREE.EventDispatcher();
  controls.target=new THREE.Vector3(0,.7,0);
  controls.update=()=>{};
  const motion=createCameraMotion(camera,controls,options);
  return {camera,controls,motion};
}

test('reset is gradual, stays outside the garden, and reaches home before orbit resumes',()=>{
  const {camera,controls,motion}=fixture();
  const home=camera.position.clone();
  camera.position.set(-12,7,-10);
  const start=camera.position.clone();
  motion.reset();assert.ok(camera.position.equals(start));assert.equal(controls.autoRotate,false);
  motion.update(.9);
  assert.ok(camera.position.distanceTo(start)>1);
  assert.ok(camera.position.distanceTo(home)>1);
  assert.ok(camera.position.distanceTo(controls.target)>9);
  motion.update(.9);
  assert.ok(camera.position.distanceTo(home)<1e-10);
  assert.equal(controls.autoRotate,true);
  motion.dispose();
});

test('interaction interrupts the reset at its current position',()=>{
  const {camera,controls,motion}=fixture();
  camera.position.set(-12,7,-10);motion.reset();motion.update(.5);
  const interrupted=camera.position.clone();
  controls.dispatchEvent({type:'start'});motion.update(1);
  assert.ok(camera.position.equals(interrupted));
  assert.equal(controls.enableDamping,true);motion.dispose();
});

test('reduced motion disables orbit and resets without animation',()=>{
  const {camera,controls,motion}=fixture({reducedMotion:true});
  const home=camera.position.clone();camera.position.set(-12,7,-10);
  motion.reset();assert.ok(camera.position.equals(home));
  assert.equal(controls.autoRotate,false);motion.dispose();
});
