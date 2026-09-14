float gardenHash(vec3 p) {
  p = fract(p * .1031); p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

float gardenNoise(vec3 p) {
  vec3 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(gardenHash(i), gardenHash(i+vec3(1,0,0)),f.x),
                 mix(gardenHash(i+vec3(0,1,0)),gardenHash(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(gardenHash(i+vec3(0,0,1)),gardenHash(i+vec3(1,0,1)),f.x),
                 mix(gardenHash(i+vec3(0,1,1)),gardenHash(i+vec3(1,1,1)),f.x),f.y),f.z);
}

// Screen-space surface gradient: relief changes lighting, not just color.
vec3 gardenBump(vec3 surface, vec3 n, float h) {
  vec3 dx=dFdx(surface), dy=dFdy(surface);
  vec3 r1=cross(dy,n), r2=cross(n,dx);
  float det=dot(dx,r1);
  return normalize(abs(det)*n-sign(det)*(dFdx(h)*r1+dFdy(h)*r2));
}
