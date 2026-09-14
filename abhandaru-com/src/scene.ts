import * as THREE from "three";
import { createCameraMotion } from "./camera-motion.ts";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { SSAOPass } from "three/examples/jsm/postprocessing/SSAOPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export function createScene() {
  const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("scene"), antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  // Lighting and geometry are static; orbiting does not require fresh shadow maps.
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#8b8d7c");
  scene.fog = new THREE.Fog("#8b8d7c", 55, 100);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.03);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.17;
  room.dispose();
  pmrem.dispose();
  const camera = new THREE.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.1, 120);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.7, 0);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 9;
  controls.maxDistance = 25;
  controls.minPolarAngle = Math.PI / 6;
  controls.maxPolarAngle = Math.PI / 2.25;
  const motion = createCameraMotion(camera, controls, {
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  });
  const frame = motion.reset;
  const ambient = new THREE.HemisphereLight(0xfff5dc, 0x394331, 0.3);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xffe2b3, 3.1);
  sun.position.set(-6, 7, 1);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 0.5, far: 25 });
  sun.shadow.normalBias = 0.015;
  sun.shadow.bias = -0.00015;
  sun.shadow.radius = 5;
  sun.shadow.blurSamples = 8;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xe2eadc, 0.1);
  fill.position.set(5, 4, -5);
  scene.add(fill);
  const stageMaterial=new THREE.MeshStandardMaterial({color:0x8b8d7c,roughness:1,fog:false});
  stageMaterial.onBeforeCompile=shader=>{
    shader.uniforms.stageBackground={value:scene.background};
    shader.vertexShader='varying vec2 vStage;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvStage=(modelMatrix*vec4(position,1.0)).xz;');
    shader.fragmentShader='varying vec2 vStage; uniform vec3 stageBackground;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>', `
      outgoingLight=mix(outgoingLight,stageBackground,smoothstep(12.0,35.0,length(vStage)));
      #include <opaque_fragment>
    `);
  };
  // The stage fades to the exact backdrop color well before the camera clips it.
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000),stageMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.3;
  floor.receiveShadow = true;
  scene.add(floor);
  // Contact shading adds depth between moss, stones and roots without crushing highlights.
  const target = new THREE.WebGLRenderTarget(window.innerWidth,window.innerHeight,{type:THREE.HalfFloatType,samples:2});
  const composer = new EffectComposer(renderer,target);
  composer.addPass(new RenderPass(scene,camera));
  const occlusion = new SSAOPass(scene,camera,window.innerWidth,window.innerHeight,16);
  occlusion.kernelRadius = .32;
  occlusion.minDistance = .00015;
  occlusion.maxDistance = .012;
  occlusion.ssaoMaterial.uniforms.gardenCameraWorld={value:camera.matrixWorld};
  occlusion.ssaoMaterial.fragmentShader='uniform mat4 gardenCameraWorld;\n'+occlusion.ssaoMaterial.fragmentShader;
  occlusion.ssaoMaterial.fragmentShader=occlusion.ssaoMaterial.fragmentShader.replace(
    'gl_FragColor = vec4( vec3( 1.0 - occlusion ), 1.0 );',
    `vec3 world=(gardenCameraWorld*vec4(viewPosition,1.0)).xyz;
     occlusion*=1.0-smoothstep(7.0,12.0,length(world.xz));
     gl_FragColor=vec4(vec3(1.0-occlusion),1.0);`
  );
  composer.addPass(occlusion);
  const output=new OutputPass();
  // Sub-pixel dithering prevents visible bands in the smooth studio gradient.
  const end=output.material.fragmentShader.lastIndexOf('}');
  output.material.fragmentShader=output.material.fragmentShader.slice(0,end)+`
    float grain=fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))));
    gl_FragColor.rgb+=(grain-.5)/255.0;
  }`;
  composer.addPass(output);
  function resize() {
    composer.setSize(window.innerWidth,window.innerHeight);
    // AO needs less resolution than the main image; limit its fill cost on retina displays.
    occlusion.setSize(window.innerWidth,window.innerHeight);
  }
  resize();
  function setAmbientLevel(level) {
    const amount = THREE.MathUtils.clamp(level, 0, 1);
    ambient.intensity = .3 * amount;
    fill.intensity = .1 * amount;
    scene.environmentIntensity = .17 * amount;
  }
  return { renderer, scene, camera, controls, frame, composer, resize, updateCamera: motion.update, setAmbientLevel };
}
