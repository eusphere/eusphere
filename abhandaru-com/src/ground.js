import * as THREE from "three";
import {
  BASE_DISC_COLORS,
  BASE_DISC_VARIATION,
  FIELD_RADIUS,
} from "./constants.js";

export function createGround(scene) {
  const groundMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uLightDir: { value: new THREE.Vector3(0.5, 1.0, 0.35).normalize() },
      uColorDark: { value: new THREE.Color(BASE_DISC_COLORS.DARK) },
      uColorMid: { value: new THREE.Color(BASE_DISC_COLORS.MID) },
      uColorSoft: { value: new THREE.Color(BASE_DISC_COLORS.SOFT) },
      uFogColor: { value: new THREE.Color("#f4f2ee") },
      uFieldRadius: { value: FIELD_RADIUS },
    },
    vertexShader: `
      varying vec3 vWorldPos;

      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform vec3 uLightDir;
      uniform vec3 uColorDark;
      uniform vec3 uColorMid;
      uniform vec3 uColorSoft;
      uniform vec3 uFogColor;
      uniform float uFieldRadius;

      varying vec3 vWorldPos;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
      }

      float fbm(vec2 p) {
        float f = 0.0;
        float amp = 0.5;
        for (int i = 0; i < 5; i++) {
          f += amp * noise(p);
          p *= 2.03;
          amp *= 0.5;
        }
        return f;
      }

      void main() {
        vec2 p = vWorldPos.xz;
        float macro = fbm(p * ${BASE_DISC_VARIATION.MACRO_SCALE.toFixed(4)});
        float micro = fbm(p * ${BASE_DISC_VARIATION.MICRO_SCALE.toFixed(3)} + vec2(17.0, 9.0));
        float detail = noise(p * ${BASE_DISC_VARIATION.DETAIL_SCALE.toFixed(2)} + vec2(31.2, 4.7));
        float patches = clamp(
          macro * ${BASE_DISC_VARIATION.MACRO_WEIGHT.toFixed(2)} +
          micro * ${BASE_DISC_VARIATION.MICRO_WEIGHT.toFixed(2)} +
          detail * ${BASE_DISC_VARIATION.DETAIL_WEIGHT.toFixed(2)},
          0.0,
          1.0
        );
        float broadSweep = fbm((p + vec2(90.0, -35.0)) * 0.0018);

        vec3 color = mix(uColorDark, uColorMid, patches);
        color = mix(color, uColorSoft, smoothstep(0.52, 0.95, micro));
        color *= mix(0.9, 1.07, broadSweep);

        float lambert = max(dot(vec3(0.0, 1.0, 0.0), normalize(uLightDir)), 0.0);
        color *= (0.78 + lambert * 0.22);

        float radial = length(p);
        float edgeFade = smoothstep(uFieldRadius * 0.72, uFieldRadius * 0.98, radial);
        color = mix(color, uFogColor, edgeFade);

        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(FIELD_RADIUS, 256),
    groundMaterial
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  scene.add(ground);
}
