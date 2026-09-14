import * as THREE from "three";

import noise from "./shaders/noise.glsl?raw";
import lilyVeinSource from "./shaders/lily-veins.glsl?raw";
import barkReliefSource from "./shaders/bark-relief.glsl?raw";

export function mossMaterial(foliage = false) {
  const material = new THREE.MeshStandardMaterial({color:0xffffff, roughness:1, envMapIntensity:.06, side:foliage ? THREE.DoubleSide : THREE.FrontSide});
  material.onBeforeCompile = shader => {
    shader.vertexShader = "varying vec3 vMossPosition; varying float vMossTip;\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>
      vec4 mossPosition = vec4(position,1.0);
      #ifdef USE_INSTANCING
      mossPosition = instanceMatrix * mossPosition;
      #endif
      vMossPosition = (modelMatrix * mossPosition).xyz;
      vMossTip = position.y;
    `);
    shader.fragmentShader = "varying vec3 vMossPosition; varying float vMossTip;\n" + noise + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>", `#include <color_fragment>
      float mossGrain = gardenNoise(vMossPosition * 95.0);
      float mossClumps = gardenNoise(vMossPosition * 26.0);
      diffuseColor.rgb *= mix(.55, 1.2, mossGrain) * mix(.75,1.1,mossClumps);
      ${foliage ? "diffuseColor.rgb *= mix(.42, 1.18, smoothstep(0.0,1.0,vMossTip));" : "diffuseColor.rgb *= .72;"}
    `);
    if (!foliage) shader.fragmentShader = shader.fragmentShader.replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
      float relief = .014 * gardenNoise(vMossPosition*95.0) + .009 * gardenNoise(vMossPosition*35.0);
      normal = gardenBump(-vViewPosition,normal,relief);
    `);
  };
  material.customProgramCacheKey = () => `moss-relief-${foliage}`;
  return material;
}

export function lilyMaterial() {
  const material = new THREE.MeshStandardMaterial({color:0x718b36, roughness:.48, envMapIntensity:.35, side:THREE.DoubleSide});
  material.onBeforeCompile = shader => {
    shader.vertexShader = "varying vec2 vLily;\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvLily = position.xz;");
    shader.fragmentShader = "varying vec2 vLily;\n" + noise + lilyVeinSource + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>", `#include <color_fragment>
      float radius=length(vLily), veins=lilyVeins(vLily);
      float mottle=gardenNoise(vec3(vLily*18.0,2.0));
      diffuseColor.rgb *= mix(.76,1.14,mottle);
      diffuseColor.rgb = mix(diffuseColor.rgb,diffuseColor.rgb*vec3(1.24,1.16,.7),veins*.6);
      diffuseColor.rgb *= mix(1.0,.62,smoothstep(.85,1.03,radius));
    `);
    shader.fragmentShader = shader.fragmentShader.replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
      normal=gardenBump(-vViewPosition,normal,lilyVeins(vLily)*.0013);
    `);
  };
  material.customProgramCacheKey = () => "lily-veins-v1";
  return material;
}

export function barkMaterial() {
  const material=new THREE.MeshStandardMaterial({color:0x655039,roughness:.96,envMapIntensity:.08});
  material.onBeforeCompile=shader=>{
    shader.vertexShader="varying vec2 vBark;\n"+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace("#include <begin_vertex>","#include <begin_vertex>\nvBark=uv;");
    shader.fragmentShader="varying vec2 vBark;\n"+noise+barkReliefSource+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace("#include <color_fragment>",`#include <color_fragment>
      float relief=barkRelief(vBark);
      diffuseColor.rgb*=mix(.6,1.25,relief)*mix(.8,1.1,gardenNoise(vec3(vBark*24.0,0.0)));
    `);
    shader.fragmentShader=shader.fragmentShader.replace("#include <normal_fragment_maps>",`#include <normal_fragment_maps>
      normal=gardenBump(-vViewPosition,normal,.005*barkRelief(vBark));
    `);
  };
  material.customProgramCacheKey=()=>"fibrous-bark-v1";
  return material;
}

// World-space detail keeps grain the same size across differently scaled stones.
export function earthMaterial(kind) {
  const rock=kind === 'rock';
  const material=new THREE.MeshStandardMaterial({color:rock ? 0x64665b : 0x504434,roughness:.93,envMapIntensity:.16});
  material.onBeforeCompile=shader=>{
    shader.vertexShader='varying vec3 vEarth;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      vec4 earth=vec4(position,1.0);
      #ifdef USE_INSTANCING
      earth=instanceMatrix*earth;
      #endif
      vEarth=(modelMatrix*earth).xyz;
    `);
    shader.fragmentShader='varying vec3 vEarth;\n'+noise+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float macro=gardenNoise(vEarth*${rock ? '6.0' : '8.0'});
      float grain=gardenNoise(vEarth*${rock ? '65.0' : '100.0'});
      diffuseColor.rgb*=mix(.65,1.28,macro)*mix(.8,1.14,grain);
      ${rock ? `float flecks=smoothstep(.73,.88,grain);
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.24,.23,.19),flecks*.28);
        float damp=1.0-smoothstep(.14,.45,vEarth.y);` : `
        float bank=length((vEarth.xz-vec2(.55,.55))/vec2(2.22,1.53));
        float damp=(1.0-smoothstep(1.02,1.3,bank))*(1.0-smoothstep(.2,.5,vEarth.y));`}
      diffuseColor.rgb*=mix(1.0,.58,damp);
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
      roughnessFactor=mix(.96,.67,damp);
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
      float relief=${rock ? '.028*gardenNoise(vEarth*13.0)+.009*gardenNoise(vEarth*65.0)' : '.014*gardenNoise(vEarth*38.0)+.008*gardenNoise(vEarth*100.0)'};
      normal=gardenBump(-vViewPosition,normal,relief);
    `);
  };
  material.customProgramCacheKey=()=>`earth-relief-${kind}`;
  return material;
}

export function waterMaterial() {
  const material=new THREE.MeshPhysicalMaterial({color:0x294f40,metalness:0,roughness:.16,ior:1.333,clearcoat:1,clearcoatRoughness:.12,envMapIntensity:3});
  material.onBeforeCompile=shader=>{
    shader.vertexShader='varying vec3 vWater;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvWater=(modelMatrix*vec4(position,1.0)).xyz;');
    shader.fragmentShader='varying vec3 vWater;\n'+noise+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      vec2 basin=(vWater.xz-vec2(.55,.55))/vec2(2.22,1.53);
      float angle=atan(basin.y,basin.x);
      float bank=length(basin)/(1.0+.07*sin(angle*3.0)+.035*cos(angle*5.0));
      float shallows=smoothstep(.64,1.0,bank);
      float silt=gardenNoise(vWater*22.0);
      diffuseColor.rgb=mix(vec3(.009,.027,.022),vec3(.045,.069,.035)*mix(.75,1.2,silt),shallows);
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
      float ripple=.006*gardenNoise(vec3(vWater.x*9.0,0.0,vWater.z*16.0))
                   +.002*gardenNoise(vec3(vWater.x*32.0,3.0,vWater.z*25.0));
      normal=gardenBump(-vViewPosition,normal,ripple);
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <clearcoat_normal_fragment_maps>','#include <clearcoat_normal_fragment_maps>\nclearcoatNormal=normal;');
  };
  material.customProgramCacheKey=()=> 'pond-depth-ripples-v1';
  return material;
}
