float lilyVeins(vec2 p) {
  float r=length(p), angle=atan(p.y,p.x);
  float spokes=abs(sin(angle*11.0 + .18*sin(r*12.0)))*r;
  float vein=1.0-smoothstep(.008,.021,spokes);
  float branches=1.0-smoothstep(.018,.06,abs(sin(r*55.0+angle*14.0)));
  return max(vein,branches*.28)*smoothstep(.025,.15,r);
}
