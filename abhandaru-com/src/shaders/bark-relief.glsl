float barkRelief(vec2 p) {
  float warp=gardenNoise(vec3(p.x*9.0,p.y*7.0,2.0));
  float ridges=gardenNoise(vec3(p.x*8.0,p.y*95.0+warp*4.0,1.0));
  float fine=gardenNoise(vec3(p.x*24.0,p.y*230.0+warp*8.0,3.0));
  return ridges*.7+fine*.3;
}
