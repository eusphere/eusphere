import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createPondReflection } from '../src/pond-reflection.js';
import { waterMaterial } from '../src/materials.js';

function fixture() {
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(36,1.5,.1,120);
  camera.position.set(3,5,9);camera.lookAt(0,0,0);camera.updateMatrixWorld();
  const pond=new THREE.Mesh(new THREE.PlaneGeometry(4,3),waterMaterial());
  pond.rotation.x=-Math.PI/2;pond.position.y=.145;
  const sprigs=new THREE.Object3D(), alreadyHidden=new THREE.Object3D();
  alreadyHidden.visible=false;
  scene.add(pond,sprigs,alreadyHidden);scene.updateMatrixWorld(true);
  let time=0;
  const reflection=createPondReflection(pond,scene,camera,[sprigs,alreadyHidden],{now:()=>time});
  const originalTarget={name:'composer'};
  let currentTarget=originalTarget, renders=0, fail=false;
  const renderer={
    xr:{enabled:false},shadowMap:{autoUpdate:false},autoClear:true,
    state:{buffers:{depth:{setMask(){}}},viewport(){}},
    getRenderTarget:()=>currentTarget,
    setRenderTarget:target=>{currentTarget=target;},
    render(renderScene,virtualCamera){
      assert.equal(renderScene,scene);
      assert.notEqual(virtualCamera,camera);
      assert.equal(pond.visible,false);
      assert.equal(sprigs.visible,false);
      assert.equal(alreadyHidden.visible,false);
      assert.equal(currentTarget.width,1024);
      assert.equal(currentTarget.height,1024);
      assert.equal(renderer.shadowMap.autoUpdate,false);
      renders++;
      if(fail) throw Error('capture failure');
    },
  };
  return {scene,camera,pond,sprigs,alreadyHidden,reflection,renderer,originalTarget,
    advance(ms){time+=ms;},get renders(){return renders;},set fail(value){fail=value;},
    capture(){pond.onBeforeRender(renderer,scene,camera);},
  };
}

test('captures once at rest, then refreshes for camera, projection and explicit scene changes',()=>{
  const f=fixture();
  f.capture();f.capture();f.capture();
  assert.equal(f.renders,1);
  f.camera.position.x+=1;f.camera.updateMatrixWorld();f.advance(50);f.capture();
  assert.equal(f.renders,2);
  f.camera.aspect=.5;f.camera.updateProjectionMatrix();f.capture();
  assert.equal(f.renders,3);
  f.pond.position.y+=.01;f.scene.updateMatrixWorld(true);f.capture();
  assert.equal(f.renders,4);
  f.reflection.invalidate();f.capture();
  assert.equal(f.renders,5);
  assert.equal(f.reflection.captures,5);
  assert.equal(f.pond.visible,true);assert.equal(f.sprigs.visible,true);
  assert.equal(f.alreadyHidden.visible,false);
  assert.equal(f.renderer.getRenderTarget(),f.originalTarget);
  f.reflection.dispose();f.reflection.dispose();
});

test('normal/depth override and secondary cameras do not capture reflections',()=>{
  const f=fixture();
  f.scene.overrideMaterial=new THREE.MeshNormalMaterial();f.capture();
  assert.equal(f.renders,0);
  f.scene.overrideMaterial.dispose();f.scene.overrideMaterial=null;
  f.pond.onBeforeRender(f.renderer,f.scene,new THREE.PerspectiveCamera());
  assert.equal(f.renders,0);
  f.capture();assert.equal(f.renders,1);
  f.reflection.dispose();f.capture();assert.equal(f.renders,1);
});

test('failed captures restore scene visibility and render target, and can be retried',()=>{
  const f=fixture();f.fail=true;
  assert.throws(()=>f.capture(),/capture failure/);
  assert.equal(f.pond.visible,true);assert.equal(f.sprigs.visible,true);
  assert.equal(f.alreadyHidden.visible,false);
  assert.equal(f.renderer.getRenderTarget(),f.originalTarget);
  assert.equal(f.reflection.captures,0);
  f.fail=false;f.capture();assert.equal(f.reflection.captures,1);
  f.reflection.dispose();
});


test('camera-only refreshes are capped at 20 Hz while invalidations remain immediate',()=>{
  const f=fixture();f.capture();
  f.camera.position.x+=.01;f.camera.updateMatrixWorld();
  f.advance(16);f.capture();assert.equal(f.renders,1);
  f.advance(34);f.capture();assert.equal(f.renders,2);
  f.advance(10);f.reflection.invalidate();f.capture();assert.equal(f.renders,3);
  f.reflection.dispose();
});
