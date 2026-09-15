import * as T from 'three';
export type Elevation=(lon:number,lat:number)=>number;
export function gridSample(data:ArrayLike<number>,width:number,height:number,lon:number,lat:number,stride=1){
 const x=((lon+180)%360+360)%360/360*width,y=T.MathUtils.clamp((90-lat)/180*(height-1),0,height-1),ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
 const at=(a:number,b:number)=>data[(b*width+(a+width)%width)*stride]||0;
 return T.MathUtils.lerp(T.MathUtils.lerp(at(ix,iy),at(ix+1,iy),fx),T.MathUtils.lerp(at(ix,Math.min(height-1,iy+1)),at(ix+1,Math.min(height-1,iy+1)),fx),fy);
}
export async function loadElevation():Promise<Elevation>{
 if(typeof document==='undefined')return ()=>0;
 try{const img=new Image();img.src='/urf-data/elevation.jpg';await img.decode();const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=1024;const ctx=canvas.getContext('2d',{willReadFrequently:true})!;ctx.drawImage(img,0,0,2048,1024);const data=ctx.getImageData(0,0,2048,1024).data;return (lon,lat)=>gridSample(data,2048,1024,lon,lat,4)/255;}catch{return ()=>0;}
}
export function organicTerrain(mask:{isLand:Elevation;isIce:Elevation}|{isLand:(x:number,y:number)=>boolean;isIce:(x:number,y:number)=>boolean},elevation:Elevation,radius:number,warp?:Float32Array,detail=96){
 const ico=new T.IcosahedronGeometry(1,detail),src=ico.getAttribute('position'),positions:number[]=[],colors:number[]=[],coords:number[]=[];
 const point=new T.Vector3(),center=new T.Vector3();
 for(let i=0;i<src.count;i+=3){center.set(0,0,0);for(let j=0;j<3;j++)center.add(point.fromBufferAttribute(src,i+j));center.normalize();const lon=Math.atan2(center.x,center.z)*180/Math.PI,lat=Math.asin(center.y)*180/Math.PI;if(!mask.isLand(lon,lat))continue;
  for(let j=0;j<3;j++){point.fromBufferAttribute(src,i+j).normalize();const x=Math.atan2(point.x,point.z)*180/Math.PI,y=Math.asin(point.y)*180/Math.PI,ice=mask.isIce(x,y),h=elevation(x,y),sculpt=warp?gridSample(warp,480,240,x,y):0;const r=Math.max(radius+.003,radius+.009+h*.135+sculpt);positions.push(point.x*r,point.y*r,point.z*r);coords.push(x,y);
   const c=new T.Color();if(ice)c.set('#c8eef1');else{c.set('#397c61').lerp(new T.Color('#a9ab70'),T.MathUtils.smoothstep(h,.05,.45));c.lerp(new T.Color('#bcb6a1'),T.MathUtils.smoothstep(h,.35,.72));c.lerp(new T.Color('#eee6d7'),T.MathUtils.smoothstep(h,.75,1));}colors.push(c.r,c.g,c.b);
  }
 }
 ico.dispose();const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();return {geometry,coords};
}
export function retroLandMaterial(radius:number){return new T.ShaderMaterial({uniforms:{radius:{value:radius+.007},time:{value:0}},vertexShader:'uniform float radius;varying float shade;varying float latitude;void main(){vec3 p=normalize(position);latitude=p.y;shade=(modelViewMatrix*vec4(p,0.)).y*.5+.5;gl_Position=projectionMatrix*modelViewMatrix*vec4(p*radius,1.);}',fragmentShader:'uniform float time;varying float shade;varying float latitude;void main(){float y=clamp(1.-shade+sin(time*.15)*.025,0.,1.);vec3 c=mix(vec3(.945,.784,.431),vec3(.455,.667,.384),smoothstep(0.,.34,y));c=mix(c,vec3(.212,.467,.416),smoothstep(.34,.7,y));c=mix(c,vec3(.094,.247,.263),smoothstep(.7,1.,y));if(abs(latitude)>.94)c=vec3(.784,.933,.945);gl_FragColor=vec4(c,1.);}',side:T.DoubleSide});}
export function makeCityLights(cities:{lon:number;lat:number;population:number}[],elevation:Elevation,radius:number){
 const pos:number[]=[],colors:number[]=[];for(const city of cities){const n=Math.min(20,3+Math.round(Math.sqrt(city.population/300000)*2));for(let i=0;i<n;i++){const a=i*2.39996,spread=i===0?0:Math.sqrt(i)*.07,lon=city.lon+Math.cos(a)*spread/Math.max(.3,Math.cos(city.lat*Math.PI/180)),lat=city.lat+Math.sin(a)*spread;const x=lon*Math.PI/180,y=lat*Math.PI/180,r=radius+.013+elevation(lon,lat)*.135;pos.push(Math.cos(y)*Math.sin(x)*r,Math.sin(y)*r,Math.cos(y)*Math.cos(x)*r);colors.push(1,.65+i/n*.25,.28);}}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(pos,3));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));const mat=new T.ShaderMaterial({transparent:true,depthWrite:false,vertexColors:true,uniforms:{retro:{value:0},radius:{value:radius+.012}},vertexShader:'uniform float retro;uniform float radius;varying vec3 c;void main(){c=color;vec3 p=mix(position,normalize(position)*radius,retro);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);gl_PointSize=4.;}',fragmentShader:'varying vec3 c;void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;gl_FragColor=vec4(c,pow(1.-r,1.4));}'});return new T.Points(geometry,mat);
}
