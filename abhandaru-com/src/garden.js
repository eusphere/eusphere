import * as THREE from "three";

// Seeded placement makes the composition repeatable across reloads.
let seed = 2718;
function random() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
const between = (a, b) => a + random() * (b - a);
const dummy = new THREE.Object3D();
const up = new THREE.Vector3(0, 1, 0);

// Keep Three's lighting/shadows, adding only inexpensive material variation.
function organicMaterial(color, scale, strength = 0.18) {
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.95, envMapIntensity: 0.15 });
  material.onBeforeCompile = shader => {
    shader.vertexShader = "varying vec3 vOrganicPosition;\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvOrganicPosition = position;");
    shader.fragmentShader = "varying vec3 vOrganicPosition;\n" + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>", `#include <color_fragment>
      float grain = sin(vOrganicPosition.x * ${scale.toFixed(1)} + sin(vOrganicPosition.z * 19.0)) * sin(vOrganicPosition.y * 31.0 + vOrganicPosition.z * 23.0);
      diffuseColor.rgb *= 1.0 + grain * ${strength.toFixed(2)};
    `);
  };
  material.customProgramCacheKey = () => `${scale}-${strength}`;
  return material;
}
function mesh(scene, geometry, material, position, scale) {
  const item = new THREE.Mesh(geometry, material);
  if (position) item.position.set(...position);
  if (scale) item.scale.set(...scale);
  item.castShadow = true;
  item.receiveShadow = true;
  scene.add(item);
  return item;
}
function instances(scene, geometry, material, transforms) {
  const item = new THREE.InstancedMesh(geometry, material, transforms.length);
  transforms.forEach((t, i) => {
    dummy.position.copy(t.position);
    dummy.scale.copy(t.scale);
    dummy.quaternion.copy(t.quaternion || new THREE.Quaternion());
    dummy.updateMatrix();
    item.setMatrixAt(i, dummy.matrix);
    if (t.color) item.setColorAt(i, t.color);
  });
  item.castShadow = true;
  item.receiveShadow = true;
  item.instanceMatrix.needsUpdate = true;
  scene.add(item);
  return item;
}
function transform(x, y, z, sx, sy, sz, quaternion, color) {
  return { position: new THREE.Vector3(x, y, z), scale: new THREE.Vector3(sx, sy, sz), quaternion, color };
}
function segment(a, b, width) {
  return { position: a.clone().add(b).multiplyScalar(0.5), scale: new THREE.Vector3(width, a.distanceTo(b), width), quaternion: new THREE.Quaternion().setFromUnitVectors(up, b.clone().sub(a).normalize()) };
}
const pondX = 0.55, pondZ = 0.55;
function inner(a) { const r = 1 + 0.07 * Math.sin(a * 3) + 0.035 * Math.cos(a * 5); return [pondX + Math.cos(a) * 2.22 * r, pondZ + Math.sin(a) * 1.53 * r]; }
function outer(a) { const r = 1 + 0.035 * Math.sin(a * 5) + 0.025 * Math.cos(a * 9); return [Math.cos(a) * 4.5 * r, Math.sin(a) * 3.35 * r]; }
function height(x, z) { return 0.28 + 0.1 * Math.sin(x * 2 + z) * Math.cos(z * 2.2) + 0.28 * Math.exp(-((x + 1.5) ** 2 + (z + 1.5) ** 2) / 3); }
function terrain() {
  const vertices = [], indices = [];
  const steps = 128, rings = 16;
  for (let j = 0; j <= rings; j++) {
    const t = j / rings;
    for (let i = 0; i <= steps; i++) {
      const a = i / steps * Math.PI * 2;
      const p = inner(a), q = outer(a);
      const x = p[0] * (1 - t) + q[0] * t, z = p[1] * (1 - t) + q[1] * t;
      vertices.push(x, 0.13 * (1 - t) + height(x, z) * t, z);
      if (j < rings && i < steps) { const k = j * (steps + 1) + i; indices.push(k, k + 1, k + steps + 1, k + 1, k + steps + 2, k + steps + 1); }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}
function leafGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0); shape.quadraticCurveTo(0.33, 0.42, 0, 1); shape.quadraticCurveTo(-0.25, 0.42, 0, 0);
  const geometry = new THREE.ShapeGeometry(shape, 5);
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

export function createGarden(scene) {
  seed = 2718;
  const soil = organicMaterial(0x504434, 45, 0.2);
  const moss = organicMaterial(0xffffff, 65, 0.17);
  const stone = organicMaterial(0x64665b, 17, 0.16);
  const bark = organicMaterial(0x655039, 65, 0.28);
  mesh(scene, terrain(), soil);
  const rockGeometry = new THREE.IcosahedronGeometry(1, 1);
  const cushionGeometry = new THREE.SphereGeometry(1, 8, 5);
  const rocks = [], cushions = [], tufts = [];
  // Exposed earth edge: a shallow, irregular shelf, not a floating island.
  for (let i = 0; i < 110; i++) {
    const a = i / 110 * Math.PI * 2, p = outer(a);
    rocks.push(transform(p[0] * 0.96, -0.02, p[1] * 0.96, between(0.22, 0.43), between(0.18, 0.3), between(0.22, 0.42), new THREE.Quaternion().setFromEuler(new THREE.Euler(random(), random(), random()))));
  }
  const base = mesh(scene, new THREE.CylinderGeometry(1, 0.97, 0.36, 96), soil, [0, -0.1, 0], [4.33, 1, 3.2]);
  base.castShadow = true;
  for (let i = 0; i < 850; i++) {
    const a = random() * Math.PI * 2, t = between(0.08, 0.98), p = inner(a), q = outer(a);
    const x = p[0] * (1 - t) + q[0] * t, z = p[1] * (1 - t) + q[1] * t;
    // Keep a small quiet bank on the front-right for future additions.
    if (x > 2.5 && z > 0.1 && random() < 0.85) continue;
    const y = 0.13 * (1 - t) + height(x, z) * t;
    const s = between(0.1, 0.32);
    const color = new THREE.Color().setHSL(between(0.19, 0.24), between(0.35, 0.52), between(0.25, 0.39), THREE.SRGBColorSpace);
    cushions.push(transform(x, y, z, s, s * between(0.35, 0.7), s * 0.85, undefined, color));
    for (let j = 0; j < 9; j++) {
      const angle = random() * Math.PI * 2, r = Math.sqrt(random()) * s * 0.8;
      tufts.push(transform(x + Math.cos(angle) * r, y + s * 0.42 * Math.sqrt(1 - (r / s) ** 2), z + Math.sin(angle) * r, 0.025, between(0.025, 0.065), 0.025, undefined, color));
    }
  }
  [[-2.5, 0.3, 1.6, .65], [2.05, .36, -.78, .65], [1.05, .34, -1.1, .5], [-1.6, .3, -.8, .45], [3.1, .3, 1.9, .35]].forEach(([x,y,z,s]) => {
    rocks.push(transform(x,y,z,s,s*.7,s*.7,new THREE.Quaternion().setFromEuler(new THREE.Euler(.2,x,.3))));
  });
  instances(scene, rockGeometry, stone, rocks);

  // A curved, tapered centerpiece with branching roots; all generated locally.
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-3.35,.32,.25), new THREE.Vector3(-2.7,.95,-.2), new THREE.Vector3(-2.2,1.8,-.65), new THREE.Vector3(-1.4,2.1,-.95), new THREE.Vector3(-.65,1.4,-1.25), new THREE.Vector3(.1,.45,-1.5)
  ]);
  const root = new THREE.TubeGeometry(curve, 64, .3, 12, false);
  const positions = root.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const t = Math.floor(i / 13) / 64, center = curve.getPointAt(t);
    const v = new THREE.Vector3().fromBufferAttribute(positions,i).sub(center);
    v.multiplyScalar(0.75 + 0.3 * Math.sin(t * Math.PI) + .1 * Math.sin(i * 2.3)).add(center);
    positions.setXYZ(i,v.x,v.y,v.z);
  }
  root.computeVertexNormals(); mesh(scene,root,bark);
  for (let i = 0; i < 240; i++) {
    const t = between(.02,.98), p = curve.getPointAt(t), s = between(.065,.16);
    p.y += .23; p.z += between(-.15,.15);
    cushions.push(transform(p.x,p.y,p.z,s,s*.55,s,undefined,new THREE.Color(0x657c32)));
    for (let j=0;j<4;j++) tufts.push(transform(p.x+between(-s,s),p.y+s*.45,p.z+between(-s,s),.024,.05,.024,undefined,new THREE.Color(0x7a913e)));
  }
  for (let i=0;i<5;i++) {
    const p = curve.getPointAt(i < 3 ? .05 : .94);
    const end = new THREE.Vector3(p.x + between(-.8,.8),.25,p.z + between(.35,.95));
    const path = new THREE.CatmullRomCurve3([p,p.clone().lerp(end,.5).add(new THREE.Vector3(0,.05,0)),end]);
    mesh(scene,new THREE.TubeGeometry(path,12,.085,7,false),bark);
  }
  instances(scene,cushionGeometry,moss,cushions);
  instances(scene,new THREE.IcosahedronGeometry(1,0),moss,tufts);

  // A single calm surface; Fresnel and tiny static ripples, no simulation.
  const pondShape = new THREE.Shape();
  for(let i=0;i<=128;i++) { const p=inner(i/128*Math.PI*2); if(i===0) pondShape.moveTo(p[0],-p[1]); else pondShape.lineTo(p[0],-p[1]); }
  const water = new THREE.MeshPhysicalMaterial({color:0x294f40,metalness:.28,roughness:.19,clearcoat:1,clearcoatRoughness:.12,envMapIntensity:.8});
  water.onBeforeCompile = shader => {
    shader.vertexShader = "varying vec3 vPond;\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>","#include <begin_vertex>\nvPond = position;");
    shader.fragmentShader = "varying vec3 vPond;\n" + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace("#include <normal_fragment_maps>",`#include <normal_fragment_maps>
      normal = normalize(normal + vec3(sin(vPond.x * 24.0 + vPond.y * 16.0) * .018, cos(vPond.y * 32.0) * .018, 0.0));`);
  };
  const pond=mesh(scene,new THREE.ShapeGeometry(pondShape,32),water,[0,.145,0]);
  pond.rotation.x=-Math.PI/2; pond.castShadow=false;
  const padMaterial = new THREE.MeshStandardMaterial({color:0x779342,roughness:.62,side:THREE.DoubleSide});
  const padShape=new THREE.Shape();
  padShape.moveTo(0,0); for(let i=0;i<=40;i++){const a=.17+i/40*(Math.PI*2-.34);padShape.lineTo(Math.cos(a),Math.sin(a));} padShape.lineTo(0,0);
  const padGeometry=new THREE.ShapeGeometry(padShape,16); padGeometry.rotateX(-Math.PI/2);
  [[-.55,1.1,.26],[-.1,1.5,.22],[.15,.93,.3],[.65,1.25,.2],[-.9,.7,.18],[.6,.6,.16],[1.05,1.5,.23]].forEach(([x,z,s])=>{
    const pad=mesh(scene,padGeometry,padMaterial,[x,.164+random()*.008,z],[s,1,s*.85]);pad.rotation.y=random()*6;
  });
  addBamboo(scene);
  addFerns(scene);
}

function addBamboo(scene) {
  const stems=[],nodes=[],leaves=[];
  const leaf=leafGeometry();
  const green=new THREE.MeshStandardMaterial({color:0x728244,roughness:.8});
  const nodeMaterial=new THREE.MeshStandardMaterial({color:0xabb074,roughness:.9});
  const leafMaterial=new THREE.MeshStandardMaterial({color:0x6d873c,roughness:.85,side:THREE.DoubleSide});
  // Short, dense grove, with gaps and varied heights rather than a wall.
  for(let i=0;i<32;i++) {
    const x=between(.1,2.6),z=between(-2.55,-1.65),y=height(x,z);
    const h=between(1.15,2.3),r=between(.028,.05),lean=between(-.16,.16);
    const start=new THREE.Vector3(x,y,z),end=new THREE.Vector3(x+lean,y+h,z+.06);
    stems.push(segment(start,end,r));
    for(let j=1;j<6;j++) {
      const p=start.clone().lerp(end,j/6);
      nodes.push(transform(p.x,p.y,p.z,r*1.18,.025,r*1.18));
      if(j<3) continue;
      const angle=between(0,Math.PI*2), branchEnd=p.clone().add(new THREE.Vector3(Math.cos(angle)*.4,.13,Math.sin(angle)*.4));
      stems.push(segment(p,branchEnd,.009));
      for(let k=0;k<5;k++) {
        const l=p.clone().lerp(branchEnd,(k+1)/5);
        const rot=new THREE.Quaternion().setFromEuler(new THREE.Euler(between(-.5,.5),angle+(k%2?-.8:.8),between(-.3,.3)));
        leaves.push(transform(l.x,l.y,l.z,between(.3,.48),1,between(.25,.46),rot));
      }
    }
  }
  instances(scene,new THREE.CylinderGeometry(1,1,1,7),green,stems);
  instances(scene,new THREE.CylinderGeometry(1,1,1,7),nodeMaterial,nodes);
  instances(scene,leaf,leafMaterial,leaves);
}
function addFerns(scene) {
  const leaves=[],stems=[];
  const material=new THREE.MeshStandardMaterial({color:0x4f7838,roughness:.9,side:THREE.DoubleSide});
  [[-2.8,1.25],[-3,-1.15],[-.8,-1.75],[2.8,-.8],[2.9,1.3],[-1.9,2.2],[-3.55,.5]].forEach(([x,z])=>{
    const y=height(x,z)+.06;
    for(let f=0;f<8;f++) {
      const a=f/8*Math.PI*2+random()*.3,len=between(.55,.95);
      let previous=new THREE.Vector3(x,y,z);
      for(let j=1;j<=10;j++) {
        const t=j/10;
        const p=new THREE.Vector3(x+Math.cos(a)*t*len,y+Math.sin(t*Math.PI*.8)*len*.55,z+Math.sin(a)*t*len);
        stems.push(segment(previous,p,.007)); previous=p;
        for(const side of [-1,1]) {
          const size=(1-t)*.28+.035;
          const rotation=new THREE.Quaternion().setFromEuler(new THREE.Euler(-.1,-a+side*1.0+Math.PI/2,side*.15));
          leaves.push(transform(p.x,p.y,p.z,size*.85,1,size,rotation));
        }
      }
    }
  });
  instances(scene,new THREE.CylinderGeometry(1,1,1,4),material,stems);
  instances(scene,leafGeometry(),material,leaves);
}
