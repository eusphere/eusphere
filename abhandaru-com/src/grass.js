import * as THREE from "three";
import { FIELD_RADIUS, GRASS_COLORS, GRASS_COUNT } from "./constants.js";

export function createGrass(scene, camera) {
  const bladeGeometry = new THREE.PlaneGeometry(0.32, 2.2, 1, 4);
  bladeGeometry.translate(0, 0.9, 0);

  const phase = new Float32Array(GRASS_COUNT);
  const bend = new Float32Array(GRASS_COUNT);
  const tone = new Float32Array(GRASS_COUNT);

  bladeGeometry.setAttribute("aPhase", new THREE.InstancedBufferAttribute(phase, 1));
  bladeGeometry.setAttribute("aBend", new THREE.InstancedBufferAttribute(bend, 1));
  bladeGeometry.setAttribute("aTone", new THREE.InstancedBufferAttribute(tone, 1));

  const grassMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uLightDir: { value: new THREE.Vector3(0.5, 1.0, 0.35).normalize() },
      uWindDir: { value: new THREE.Vector2(0.93, 0.37).normalize() },
      uCameraPos: { value: camera.position.clone() },
      uColorBase: { value: new THREE.Color(GRASS_COLORS.BASE) },
      uColorMid: { value: new THREE.Color(GRASS_COLORS.MID) },
      uColorTip: { value: new THREE.Color(GRASS_COLORS.TIP) },
    },
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false,
    vertexShader: `
      uniform float uTime;
      uniform vec2 uWindDir;
      uniform vec3 uCameraPos;
      attribute float aPhase;
      attribute float aBend;
      attribute float aTone;

      varying vec2 vUv;
      varying float vTone;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      varying float vFacing;

      void main() {
        vUv = uv;
        vTone = aTone;

        vec3 p = position;
        float rootMask = pow(uv.y, 1.55);
        float gustA = sin((uTime * 2.9) + aPhase + (instanceMatrix[3][0] * 0.05));
        float gustB = cos((uTime * 2.2) + (instanceMatrix[3][2] * 0.04) + (aPhase * 0.7));
        float sway = (gustA * 0.7 + gustB * 0.3) * 0.34 * aBend;
        p.x += sway * rootMask;

        vec4 worldPos = modelMatrix * instanceMatrix * vec4(p, 1.0);
        vec2 windDir = normalize(uWindDir);
        worldPos.x += windDir.x * sway * rootMask * 1.2;
        worldPos.z += windDir.y * sway * rootMask * 1.2;
        vWorldPos = worldPos.xyz;
        vec3 worldNormal = normalize(mat3(modelMatrix * instanceMatrix) * normal);
        vWorldNormal = worldNormal;
        vec3 viewDir = normalize(uCameraPos - worldPos.xyz);
        vFacing = 1.0 - abs(dot(viewDir, worldNormal));
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform vec3 uLightDir;
      uniform vec3 uColorBase;
      uniform vec3 uColorMid;
      uniform vec3 uColorTip;

      varying vec2 vUv;
      varying float vTone;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      varying float vFacing;

      void main() {
        float center = abs(vUv.x - 0.5);
        float width = mix(0.48, 0.04, vUv.y);
        width += (1.0 - vFacing) * 0.22;
        float edge = 1.0 - smoothstep(width - 0.13, width, center);
        if (edge < 0.02) discard;

        vec3 color = mix(uColorBase, uColorMid, vUv.y);
        color = mix(color, uColorTip, smoothstep(0.55, 1.0, vUv.y));
        color *= (0.9 + (vTone * 0.2));

        float lambert = max(dot(normalize(vWorldNormal), normalize(uLightDir)), 0.0);
        float light = 0.58 + (lambert * 0.35);
        color *= light;

        float radialDistance = length(vWorldPos.xz);
        float distanceFade = smoothstep(1050.0, 1450.0, radialDistance);
        color = mix(color, vec3(0.957, 0.949, 0.933), distanceFade);

        float distanceAlpha = 1.0 - smoothstep(780.0, 1380.0, radialDistance);
        float alpha = pow(edge, 1.35) * mix(1.0, 0.18, 1.0 - distanceAlpha);
        gl_FragColor = vec4(color, alpha);
      }
    `,
  });

  const grass = new THREE.InstancedMesh(bladeGeometry, grassMaterial, GRASS_COUNT);
  grass.instanceMatrix.setUsage(THREE.StaticDrawUsage);

  const dummy = new THREE.Object3D();
  for (let i = 0; i < GRASS_COUNT; i += 1) {
    const r = Math.pow(Math.random(), 1.55) * (FIELD_RADIUS - 24);
    const theta = Math.random() * Math.PI * 2;
    const x = Math.cos(theta) * r;
    const z = Math.sin(theta) * r;
    const yaw = Math.random() * Math.PI;
    const scale = 0.65 + Math.random() * 1.35;

    dummy.position.set(x, 0, z);
    dummy.rotation.set(0, yaw, 0);
    dummy.scale.set(scale, scale * (0.9 + Math.random() * 0.5), scale);
    dummy.updateMatrix();
    grass.setMatrixAt(i, dummy.matrix);

    phase[i] = Math.random() * Math.PI * 2;
    bend[i] = 0.6 + Math.random() * 0.8;
    tone[i] = Math.random();
  }

  grass.instanceMatrix.needsUpdate = true;
  grass.frustumCulled = false;
  scene.add(grass);

  return grassMaterial;
}
