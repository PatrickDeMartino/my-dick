import {geoEquirectangular,geoPath} from 'd3-geo';
import {organicTerrain,loadElevation} from '../../urf-3d/organic-terrain';
import * as T from 'three';
import {buildLaunchIsland,cosmicOcean} from '../../urf-3d/launch-island';
import {createAlien} from '../../urf-3d/grok/alien';
export function makeDreamscape(options:{mushroomOnly?:boolean}={}){
 const root=new T.Group();root.name='Crystal hinterland and orbital sky';
 const mushroomMat=new T.ShaderMaterial({side:T.DoubleSide,uniforms:{time:{value:0}},vertexShader:'uniform float time;varying vec3 p;void main(){p=position;vec3 q=position;q.y+=sin(time*.45+length(position.xz)*.7)*.06;gl_Position=projectionMatrix*modelViewMatrix*vec4(q,1.);}',fragmentShader:'varying vec3 p;uniform float time;void main(){float a=atan(p.z,p.x),r=length(p.xz);float v=sin(a*7.+r*3.-time*.5+sin(p.y*4.+time)*2.);vec3 col=.5+.5*cos(vec3(0.,2.1,4.2)+v*3.+r*.6+time*.15);gl_FragColor=vec4(col*.85+.1,1.);}'});
 const mushrooms:T.Group[]=[];
 for(const [x,z,h,r] of [[51,-42,8,4.7],[44,-64,11,6],[-50,-62,9,5],[-62,-38,6,3.5],[19,-76,6.5,4],[53,-19,8,4.5]]){
  const group=new T.Group();group.position.set(x,0,z);root.add(group);mushrooms.push(group);
  const stemCurve=new T.CatmullRomCurve3([new T.Vector3(),new T.Vector3(-h*.05,h*.35,.15),new T.Vector3(h*.03,h*.7,-.15),new T.Vector3(h*.07,h,0)]);const stem=new T.Mesh(new T.TubeGeometry(stemCurve,48,.5,20,false),new T.MeshStandardMaterial({color:0xb2b0ba,roughness:.75}));group.add(stem);
  const cap=new T.Mesh(new T.SphereGeometry(r,72,40,0,Math.PI*2,0,Math.PI*.55),mushroomMat);const vertices=cap.geometry.getAttribute("position");for(let i=0;i<vertices.count;i++){const x=vertices.getX(i),z=vertices.getZ(i),a=Math.atan2(z,x);vertices.setY(i,vertices.getY(i)+(Math.sin(a*5+r)*.14+Math.cos(a*3)*.19)*Math.hypot(x,z)/r);vertices.setX(i,x*(1+Math.sin(a*3+r)*.055));}cap.geometry.computeVertexNormals();cap.position.set(h*.07,h,0);cap.scale.y=.55;group.add(cap);
  const gills=new T.Mesh(new T.ConeGeometry(r*.95,.65,48,1,true),new T.MeshStandardMaterial({color:0xba83df,emissive:0x913ebd,emissiveIntensity:.25,side:T.DoubleSide}));gills.position.set(h*.07,h-.25,0);group.add(gills);
 }
 if(options.mushroomOnly){const mushroom=mushrooms[0];mushroom.removeFromParent();return {root:mushroom,planet:new T.Group(),satellites:[] as T.Group[],dispose:()=>{},update:(time:number)=>{mushroomMat.uniforms.time.value=time;mushroom.rotation.z=Math.sin(time*.35)*.015;}};}
 const sky=new T.Group();sky.name='Urf and its archer beyond the atmosphere';sky.position.set(58,64,-150);sky.scale.setScalar(16);root.add(sky);
 const world=new T.Group();world.position.x=1.3;sky.add(world);
 const ocean=cosmicOcean();world.add(new T.Mesh(new T.SphereGeometry(1.25,48,32),ocean));
 // A smaller instance of the actual geographic Urf globe in the far sky.
 let disposed=false;
 if(typeof document!=='undefined')Promise.all([fetch('/ne-110m-land.geojson').then(r=>r.json()),loadElevation()]).then(([data,elevation])=>{
  if(disposed)return;const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#fff';const path=geoPath(geoEquirectangular().scale(1024/(Math.PI*2)).translate([512,256]),ctx);ctx.beginPath();path(data);ctx.fill();const pixels=ctx.getImageData(0,0,1024,512).data;
  const mask={isLand:(lon:number,lat:number)=>pixels[(Math.min(511,Math.floor((90-lat)/180*512))*1024+Math.min(1023,Math.floor((lon+180)/360*1024)))*4+3]>100,isIce:(_lon:number,lat:number)=>Math.abs(lat)>72};
  const {geometry}=organicTerrain(mask,elevation,1.25,undefined,34);world.add(new T.Mesh(geometry,new T.MeshStandardMaterial({vertexColors:true,roughness:.85,flatShading:true,fog:false})));
 }).catch(()=>{});
 const island=buildLaunchIsland();island.group.position.set(-1.9,-.65,0);island.group.scale.setScalar(.7);sky.add(island.group);
 const alien=createAlien('zix');alien.root.scale.setScalar(.47);alien.root.position.set(-1.9,-.65,0);alien.root.rotation.y=Math.PI/2;alien.ak.root.visible=false;alien.revolver.root.visible=false;alien.gunMount.visible=false;alien.root.add(alien.bow.root);alien.bow.root.position.set(.45,1.25,.13);alien.armL.rotation.z=-1.1;alien.armR.rotation.x=-1;sky.add(alien.root);
 sky.traverse(o=>{if(o instanceof T.Mesh){for(const m of Array.isArray(o.material)?o.material:[o.material])m.fog=false;}});
 const satellites:T.Group[]=[];const metal=new T.MeshStandardMaterial({color:0xa1bfca,metalness:.8,roughness:.3}),panel=new T.MeshStandardMaterial({color:0x213d86,metalness:.55,roughness:.35});
 for(let i=0;i<2;i++){const sat=new T.Group();const body=new T.Mesh(new T.BoxGeometry(1.2,.8,.8),metal);sat.add(body);for(const side of [-1,1]){const wing=new T.Mesh(new T.BoxGeometry(2.2,.05,1.6),panel);wing.position.x=side*1.7;sat.add(wing);}const dish=new T.Mesh(new T.SphereGeometry(.6,16,12,0,Math.PI*2,0,Math.PI/2),metal);dish.position.y=.5;sat.add(dish);root.add(sat);satellites.push(sat);}
 return {root,planet:world,satellites,dispose:()=>{disposed=true;},update:(time:number)=>{mushroomMat.uniforms.time.value=time;ocean.uniforms.time.value=time;world.rotation.set(time*.025,time*.05,.2);mushrooms.forEach((m,i)=>m.rotation.z=Math.sin(time*.35+i)*.015);satellites.forEach((s,i)=>{const a=time*.05+i*Math.PI;s.position.set(Math.cos(a)*90,38+Math.sin(a*.7)*12,Math.sin(a)*85-20);s.rotation.set(.2,a,.2);});}};
}
