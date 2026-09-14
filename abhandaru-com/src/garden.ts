import * as THREE from "three";
import { mossMaterial, lilyMaterial, barkMaterial, earthMaterial, waterMaterial } from "./materials.ts";

// Seeded placement makes the composition repeatable across reloads.
let seed = 2718;
function random() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
const between = (a, b) => a + random() * (b - a);
const dummy = new THREE.Object3D();
const up = new THREE.Vector3(0, 1, 0);

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
  const soil = earthMaterial("soil");
  const moss = mossMaterial();
  const stone = earthMaterial("rock");
  const bark = barkMaterial();
  mesh(scene, terrain(), soil);
  const rockGeometry = new THREE.IcosahedronGeometry(1, 1);
  const cushionGeometry = new THREE.SphereGeometry(1, 12, 8);
  const cushionPositions = cushionGeometry.attributes.position;
  for (let i=0;i<cushionPositions.count;i++) {
    const v=new THREE.Vector3().fromBufferAttribute(cushionPositions,i);
    v.multiplyScalar(1 + .09*Math.sin(v.x*13+v.z*9)*Math.sin(v.y*17-v.x*7));
    cushionPositions.setXYZ(i,v.x,v.y,v.z);
  }
  cushionGeometry.computeVertexNormals();
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
    const sy = s * between(0.35, 0.6);
    cushions.push(transform(x, y, z, s, sy, s * .85, undefined, color));
    addMossTufts(tufts, new THREE.Vector3(x,y,z), s, sy, s*.85, color);

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
    v.multiplyScalar(0.75 + 0.3 * Math.sin(t * Math.PI) + .045 * Math.sin((i % 13) / 12 * Math.PI * 8 + t * 13)).add(center);
    positions.setXYZ(i,v.x,v.y,v.z);
  }
  root.computeVertexNormals(); mesh(scene,root,bark);
  for (let i = 0; i < 240; i++) {
    const t = between(.02,.98), p = curve.getPointAt(t), s = between(.065,.16);
    p.y += .23; p.z += between(-.15,.15);
    cushions.push(transform(p.x,p.y,p.z,s,s*.55,s,undefined,new THREE.Color(0x657c32)));
    addMossTufts(tufts,p,s,s*.55,s,new THREE.Color(0x7a913e));
  }
  for (let i=0;i<5;i++) {
    const p = curve.getPointAt(i < 3 ? .05 : .94);
    const end = new THREE.Vector3(p.x + between(-.8,.8),.25,p.z + between(.35,.95));
    const path = new THREE.CatmullRomCurve3([p,p.clone().lerp(end,.5).add(new THREE.Vector3(0,.05,0)),end]);
    mesh(scene,new THREE.TubeGeometry(path,12,.085,7,false),bark);
  }
  addUpperBranches(scene, bark, curve);
  instances(scene,cushionGeometry,moss,cushions);
  const mossSprigs = instances(scene,mossTuftGeometry(),mossMaterial(true),tufts);

  // A single calm surface; Fresnel and tiny static ripples, no simulation.
  const pondShape = new THREE.Shape();
  for(let i=0;i<=128;i++) { const p=inner(i/128*Math.PI*2); if(i===0) pondShape.moveTo(p[0],-p[1]); else pondShape.lineTo(p[0],-p[1]); }
  const water = waterMaterial();
  const pond=mesh(scene,new THREE.ShapeGeometry(pondShape,32),water,[0,.145,0]);
  pond.rotation.x=-Math.PI/2; pond.castShadow=false;
  const padMaterial = lilyMaterial();
  const padGeometry=lilyGeometry();
  [[-.55,1.1,.26],[-.1,1.5,.22],[.15,.93,.3],[.65,1.25,.2],[-.9,.7,.18],[.6,.6,.16],[1.05,1.5,.23],
   [-.65,.3,.21],[-.28,.4,.16],[1.8,.15,.27],[2.12,.5,.18],[1.55,-.05,.18],[.9,1.95,.16],[-.45,1.78,.15]].forEach(([x,z,s])=>{
    const pad=mesh(scene,padGeometry,padMaterial,[x,.169+random()*.008,z],[s,s,s*.85]);
    pad.rotation.y=random()*6;
  });
  addBamboo(scene);
  addFerns(scene);
  return { pond, reflectionExcluded: [mossSprigs] };
}

function addBamboo(scene) {
  const stems=[],nodes=[],leaves=[],tips=[];
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
    const tipEnd=end.clone().add(new THREE.Vector3(lean+between(-.15,.15),between(.2,.38),between(-.12,.12)));
    tips.push(segment(end,tipEnd,r*.65));
    for(let k=0;k<7;k++) {
      const at=end.clone().lerp(tipEnd,k/7);
      const angle=between(0,Math.PI*2), direction=new THREE.Vector3(Math.cos(angle),between(-.2,.75),Math.sin(angle)).normalize();
      const rotation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,-1),direction);
      leaves.push(transform(at.x,at.y,at.z,between(.2,.32),1,between(.2,.4)*(1-k*.06),rotation));
    }
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
  instances(scene,new THREE.CylinderGeometry(.62,1,1,7),green,stems);
  instances(scene,new THREE.CylinderGeometry(.025,1,1,6),green,tips);
  instances(scene,new THREE.CylinderGeometry(1,1,1,7),nodeMaterial,nodes);
  instances(scene,leaf,leafMaterial,leaves);
}
function addFerns(scene) {
  const leaves=[],stems=[];
  const material=new THREE.MeshStandardMaterial({color:0x4f7838,roughness:.9,envMapIntensity:.12,side:THREE.DoubleSide});
  [[-2.8,1.25],[-3,-1.15],[-.8,-1.75],[2.8,-.8],[2.9,1.3],[-1.9,2.2],[-3.55,.5]].forEach(([x,z])=>{
    const y=height(x,z)+.06, count=Math.floor(between(7,11)), phase=between(0,6.28);
    for(let f=0;f<count;f++) {
      const a=phase+f/count*Math.PI*2+between(-.35,.35),len=between(.45,1.05);
      const lift=between(.3,.75), bend=between(-.4,.4), droop=between(.05,.3);
      const origin=new THREE.Vector3(x+between(-.06,.06),y,z+between(-.06,.06));
      const frond=new THREE.CatmullRomCurve3([
        origin,
        origin.clone().add(new THREE.Vector3(Math.cos(a)*len*.25,lift*len,Math.sin(a)*len*.25)),
        origin.clone().add(new THREE.Vector3(Math.cos(a+bend)*len*.7,lift*len*.85,Math.sin(a+bend)*len*.7)),
        origin.clone().add(new THREE.Vector3(Math.cos(a+bend)*len,(lift*.4-droop)*len,Math.sin(a+bend)*len))
      ]);
      let previous=origin;
      for(let j=1;j<=12;j++) {
        const t=j/12, p=frond.getPoint(t);
        stems.push(segment(previous,p,.005));previous=p;
        for(const side of [-1,1]) {
          if(random()<.07) continue;
          const at=Math.min(.99,Math.max(.06,t+between(-.025,.025)));
          const leafStart=frond.getPoint(at), tangent=frond.getTangent(at);
          const outward=new THREE.Vector3(-tangent.z,0,tangent.x).normalize().multiplyScalar(side);
          const direction=outward.multiplyScalar(between(.75,1.1)).addScaledVector(tangent,between(.25,.7));
          direction.y+=between(-.4,.2);direction.normalize();
          const rotation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,-1),direction);
          const size=(Math.sin(Math.pow(t,.65)*Math.PI)*.25+.025)*len*between(.75,1.15);
          leaves.push(transform(leafStart.x,leafStart.y,leafStart.z,size*between(.65,.95),1,size,rotation));
        }
      }
    }
  });
  instances(scene,new THREE.CylinderGeometry(.7,1,1,4),material,stems);
  instances(scene,leafGeometry(),material,leaves);
}

// Small three-dimensional leafy sprigs break up the moss silhouette.
function mossTuftGeometry() {
  const vertices=[];
  for(let j=0;j<3;j++) {
    const a=j*Math.PI*2/3;
    const side=new THREE.Vector3(Math.cos(a),0,Math.sin(a));
    const tip=new THREE.Vector3(Math.sin(a)*.16,1,Math.cos(a)*.16);
    const left=side.clone().multiplyScalar(.26).add(new THREE.Vector3(0,.45,0));
    const right=side.clone().multiplyScalar(-.26).add(new THREE.Vector3(0,.45,0));
    vertices.push(0,0,0,...left.toArray(),...tip.toArray(),0,0,0,...tip.toArray(),...right.toArray());
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));
  geometry.computeVertexNormals();return geometry;
}
function addMossTufts(tufts, center, sx, sy, sz, color) {
  const count=Math.ceil(sx*sz*1000);
  for(let j=0;j<count;j++) {
    const a=between(0,Math.PI*2), r=Math.sqrt(random())*.98;
    const x=Math.cos(a)*r, z=Math.sin(a)*r, y=Math.sqrt(1-r*r);
    const n=new THREE.Vector3(x*.4,y,z*.4).normalize();
    const rotation=new THREE.Quaternion().setFromUnitVectors(up,n);
    rotation.multiply(new THREE.Quaternion().setFromAxisAngle(up,between(0,Math.PI*2)));
    tufts.push(transform(center.x+x*sx,center.y+y*sy,center.z+z*sz,between(.025,.05),between(.025,.075),between(.025,.05),rotation,color));
  }
}
function taperedBranch(scene, material, points, radius) {
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  const geometry=new THREE.TubeGeometry(curve,24,radius,8,false);
  const positions=geometry.attributes.position;
  for(let i=0;i<positions.count;i++) {
    const t=Math.floor(i/9)/24, center=curve.getPointAt(t);
    const point=new THREE.Vector3().fromBufferAttribute(positions,i);
    point.sub(center).multiplyScalar(Math.pow(1-t,0.85)*.98+.02).add(center);
    positions.setXYZ(i,point.x,point.y,point.z);
  }
  geometry.computeVertexNormals();mesh(scene,geometry,material);
}
function addUpperBranches(scene, material, curve) {
  const first=curve.getPointAt(.34).toArray(), second=curve.getPointAt(.62).toArray();
  taperedBranch(scene,material,[first,[-2.48,2.0,-.65],[-2.98,2.36,-.7],[-3.3,2.47,-1.0]],.15);
  taperedBranch(scene,material,[[-2.72,2.18,-.67],[-2.84,2.58,-.7],[-2.72,2.79,-.8]],.07);
  taperedBranch(scene,material,[second,[-1.02,2.27,-1.14],[-.92,2.61,-1.68],[-.55,2.8,-1.95]],.12);
  taperedBranch(scene,material,[[-.96,2.48,-1.48],[-1.3,2.75,-1.85],[-1.27,2.94,-1.94]],.05);
}
function lilyGeometry() {
  const vertices=[0,0,0],indices=[];
  const rings=6, steps=48;
  for(let r=1;r<=rings;r++) {
    const radius=r/rings;
    for(let i=0;i<=steps;i++) {
      const a=.13+i/steps*(Math.PI*2-.26);
      const edge=1+.024*Math.sin(a*9)+.012*Math.cos(a*17);
      vertices.push(Math.cos(a)*radius*edge,.035*radius**3+.012*Math.sin(a*3)*radius**2,Math.sin(a)*radius*edge);
      const k=1+(r-1)*(steps+1)+i;
      if(i<steps) {
        if(r===1) indices.push(0,k+1,k);
        else indices.push(k,k-steps-1,k+1,k+1,k-steps-1,k-steps);
      }
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));
  geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}
