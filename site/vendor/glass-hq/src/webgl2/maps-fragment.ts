export default `#version 300 es
// Faithful GLSL ES port of ../gpu/maps.wgsl at upstream 9f5bfc7.
precision highp float;
precision highp int;
uniform sampler2D outlines;
uniform vec4 shapes[96];
uniform int shapeCount;
uniform float atlasHeight;
out vec4 result;
float sat(float x) { return clamp(x,0.0,1.0); }
vec3 field(vec2 size, bool symmetric, int start, int count, vec2 point) {
  vec2 p=(symmetric?vec2(abs(point.x),-abs(point.y)):point)+size*0.5;
  float distance2=1e20;
  vec2 delta=vec2(0), outward=vec2(0,-1);
  for(int i=start;i<start+count;i++) {
    vec4 segment=texelFetch(outlines,ivec2(i%64,i/64),0);
    vec2 edge=segment.zw-segment.xy;
    vec2 nearest=segment.xy+edge*sat(dot(p-segment.xy,edge)/dot(edge,edge));
    vec2 v=p-nearest;
    float d2=dot(v,v);
    if(d2<distance2){distance2=d2;delta=v;outward=normalize(vec2(edge.y,-edge.x));}
  }
  float direction=dot(delta,outward)>=0.0?1.0:-1.0;
  float distance=sqrt(distance2);
  vec2 normal=distance>0.00001?delta*direction/max(distance,0.00001):outward;
  return vec3(distance*direction,symmetric?vec2(normal.x,-normal.y)*sign(point):normal);
}
void main() {
  // WebGPU's fragment positions are top-down; convert exactly once here.
  vec2 position=vec2(gl_FragCoord.x,atlasHeight-gl_FragCoord.y);
  int index=0;
  for(int k=1;k<shapeCount;k++)if(position.y>=shapes[k*3].z)index=k;
  vec4 a=shapes[index*3],b=shapes[index*3+1],c=shapes[index*3+2];
  vec2 size=a.xy;
  float row=a.z,rows=a.w,columns=b.x,dpr=b.y,dark=b.z;
  float band=position.y-row;
  int plane=min(int(band/rows),1);
  vec2 local=vec2(position.x/columns,(band-float(plane)*rows)/rows);
  vec2 point=local*(size+4.0)-(size+4.0)*0.5;
  vec3 f=field(size,b.w!=0.0,int(c.x),int(c.y),point);
  float d=f.x;vec2 n=f.yz;
  float aa=max(fwidth(d),1.0/dpr);
  if(position.x>=columns){result=vec4(0);return;}
  float coverage=sat(0.5-d/aa);
  float depth=sat(-d*0.05);
  float edge=1.0-sat(sqrt((2.0-depth)*depth));
  if(plane==0){result=vec4(vec2(0.5)-n*edge*0.5,0.5,coverage);return;}
  float spread=1.08;
  float directional=pow(sat((abs(n.y)-cos(spread))/(1.0-cos(spread))),1.25);
  float diffuseDir=pow(sat((abs(n.y)-cos(spread*0.65))/(1.0-cos(spread*0.65))),1.25);
  float stroke=sat((d+0.9)/aa+0.5)*sat(0.5-d/aa);
  float specular=directional*stroke;
  specular=specular/(1.0+0.5*(1.0-specular));
  float diffuse=diffuseDir*0.18*pow(1.0-sat(-d/4.5),2.0)*coverage;
  float highlight=sat(specular*mix(1.0,0.82,dark)+diffuse*mix(1.0,0.40,dark));
  float adjusted=d-0.5;
  float falloff=1.0-sat(-adjusted/0.5);
  float ramp=mix(falloff>0.0?1.0:0.0,falloff,0.75);
  float outline=ramp*sat((adjusted+0.5)/aa+0.5)*sat(-adjusted/aa+0.5);
  float sideSpread=0.98;
  vec2 weights=clamp((vec2(n.x,-n.x)-cos(sideSpread))/(1.0-cos(sideSpread)),vec2(0),vec2(1))*outline;
  float shade=dot(weights/(vec2(1)+0.4*(vec2(1)-weights)),vec2(1))*mix(0.48,0.60,dark);
  float alpha=highlight+shade*(1.0-highlight);
  float light=mix(1.0,0.82,dark)*highlight/max(alpha,0.00001);
  result=vec4(vec3(light),alpha);
}
`;
