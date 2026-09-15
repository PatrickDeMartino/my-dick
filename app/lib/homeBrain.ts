import {cortexShell,type BrainSurface} from '../brain-room/lib/cortex-shell';
import {makeLivingSkin,WORM_COLORS,type LivingSkin} from '../brain-room/lib/living-skin';
import * as THREE from 'three';
import {FBXLoader} from 'three/examples/jsm/loaders/FBXLoader.js';
type Lobe = { center: THREE.Vector3; axes: THREE.Vector3 };
const lobes: Lobe[] = [
  ...[-1, 1].map(side => ({ center: new THREE.Vector3(side * .52, .12, -.04), axes: new THREE.Vector3(.9676, 1.2036, 1.3924) })),
  ...[-1, 1].map(side => ({ center: new THREE.Vector3(side * .72, -.48, .3), axes: new THREE.Vector3(.546, .434, .714) })),
  { center: new THREE.Vector3(0, -.88, -.72), axes: new THREE.Vector3(.798, .406, .476) },
];
export function brainSurface(direction: THREE.Vector3) {
  let distance = 0, chosen = lobes[0];
  for (const lobe of lobes) {
    const d = direction.clone().divide(lobe.axes), c = lobe.center.clone().divide(lobe.axes);
    const a = d.dot(d), b = d.dot(c), discriminant = b * b - a * (c.dot(c) - 1);
    if (discriminant < 0) continue;
    const t = (b + Math.sqrt(discriminant)) / a;
    if (t > distance) { distance = t; chosen = lobe; }
  }
  const point = direction.clone().multiplyScalar(distance);
  return { point, normal: point.clone().sub(chosen.center).divide(chosen.axes).divide(chosen.axes).normalize() };
}


type TrailPoint={point:THREE.Vector3;normal:THREE.Vector3;offset:number};
type Crawler={group:THREE.Group;direction:THREE.Vector3;heading:THREE.Vector3;target:THREE.Vector3;history:TrailPoint[];age:number;turnAt:number;speed:number;spacing:number;radius:number;monkey:boolean;entryDirection:THREE.Vector3;exitDirection:THREE.Vector3;lastCycle:number;length:number;thickness:number;geometry?:THREE.BufferGeometry;head?:THREE.Group;tail?:THREE.Mesh;spine?:{positions:THREE.Vector3[];normals:THREE.Vector3[];tangents:THREE.Vector3[];time:{value:number};look:{value:THREE.Vector2}}};
export function makeHomeBrain(onCreatureReady:()=>void,options:{surface?:BrainSurface;skin?:LivingSkin;shell?:boolean;unit?:number;count?:number;surfaceLift?:number;center?:THREE.Vector3;valid?:(d:THREE.Vector3)=>boolean}={}){
 const root=new THREE.Group(),surface=options.surface||brainSurface,skin=options.skin||makeLivingSkin(.045,5),unit=options.unit??1,center=options.center||new THREE.Vector3();let disposed=false,worldAge=0;
 if(options.shell!==false){const shell=cortexShell(surface,{count:650,radius:.07});shell.traverse(o=>{if(o instanceof THREE.Mesh)skin.apply(o);});root.add(shell);const stem=new THREE.Mesh(new THREE.CapsuleGeometry(.19,.72,10,20),new THREE.MeshPhysicalMaterial({color:0xc67f9e,roughness:.5,clearcoat:.35}));stem.position.set(.06,-1.42,-.46);stem.rotation.z=-.11;root.add(stem);root.rotation.z=-.08;}
 const crawlers:Crawler[]=[];const eyeMat=new THREE.MeshPhysicalMaterial({color:0x160b21,roughness:.15,clearcoat:1});
 const randomDirection=()=>{const d=new THREE.Vector3();for(let i=0;i<80;i++){d.randomDirection();if(!options.valid||options.valid(d))break;}return d;};
 function addCrawler(monkey=false,emerging=false){if(crawlers.length>=12)return;const index=crawlers.length,group=new THREE.Group(),thickness=(.05+(index%5)*.008)*unit,count=10+(index*3)%7,length=monkey?2.1*unit:count*thickness*1.45,direction=randomDirection();
 const crawler:Crawler={group,direction,heading:randomDirection().projectOnPlane(direction).normalize(),target:randomDirection(),history:[],age:emerging?20:index*3.17,turnAt:0,speed:monkey?.21:.24+(index%3)*.035,spacing:thickness*1.45,radius:(monkey?.075*unit:thickness)+(options.surfaceLift??.085),monkey,entryDirection:direction.clone(),exitDirection:direction.clone(),lastCycle:emerging?19.9:0,length,thickness};
 if(!monkey){const color=WORM_COLORS[Math.floor(Math.random()*WORM_COLORS.length)],mat=new THREE.MeshPhysicalMaterial({color,vertexColors:true,roughness:.43,clearcoat:.7,sheen:.3});const rings=48,sides=12,positions=new Float32Array((rings+1)*(sides+1)*3),normals=new Float32Array(positions.length),colors=new Float32Array(positions.length),indices:number[]=[];
 for(let j=0;j<=rings;j++)for(let i=0;i<=sides;i++){const n=j*(sides+1)+i,c=.88+.12*(.5+.5*Math.cos(j*Math.PI));colors.set([c,c,c],n*3);if(j<rings&&i<sides)indices.push(n,n+sides+1,n+1,n+1,n+sides+1,n+sides+2);}const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));geometry.setAttribute('normal',new THREE.BufferAttribute(normals,3).setUsage(THREE.DynamicDrawUsage));geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));geometry.setIndex(indices);crawler.geometry=geometry;const mesh=new THREE.Mesh(geometry,mat);mesh.castShadow=true;mesh.frustumCulled=false;group.add(mesh);
 const tipMat=mat.clone();tipMat.vertexColors=false;const head=new THREE.Group(),cap=new THREE.Mesh(new THREE.SphereGeometry(thickness,20,14),tipMat);head.add(cap);crawler.head=head;group.add(head);for(const side of [-1,1]){const eye=new THREE.Mesh(new THREE.SphereGeometry(thickness*.19,12,8),eyeMat);eye.position.set(side*thickness*.48,thickness*.54,thickness*.63);head.add(eye);}crawler.tail=new THREE.Mesh(cap.geometry,tipMat);group.add(crawler.tail);}
 for(let i=0;i<180;i++){const d=direction.clone().addScaledVector(crawler.heading,-i/179*length/Math.max(.5,surface(direction).point.distanceTo(center))).normalize(),s=surface(emerging?direction:d);crawler.history.push({point:s.point.clone(),normal:s.normal.clone(),offset:emerging?-unit*.55:crawler.radius});}crawlers.push(crawler);root.add(group);return crawler;}
 for(let i=0;i<(options.count??8);i++)addCrawler();const monkey=addCrawler(true)!;
  const manager=new THREE.LoadingManager();manager.onLoad=()=>{if(!disposed)onCreatureReady();};manager.onError=manager.onLoad;
  if(typeof document!=='undefined')new FBXLoader(manager).load("/models/monkey-centipede.fbx",model=>{
    if(disposed){disposeObject(model);return;}model.updateMatrixWorld(true);
    const bounds=new THREE.Box3().setFromObject(model),center=bounds.getCenter(new THREE.Vector3()),scale=2.1/bounds.getSize(new THREE.Vector3()).z;
    const positions=Array.from({length:32},()=>new THREE.Vector3()),normals=positions.map(()=>new THREE.Vector3(0,1,0)),tangents=positions.map(()=>new THREE.Vector3(0,0,1)),time={value:0},look={value:new THREE.Vector2()};
    monkey.spine={positions,normals,tangents,time,look};
    model.traverse(object=>{
      if(!(object instanceof THREE.Mesh))return;
      const geometry=object.geometry.clone().applyMatrix4(object.matrixWorld);geometry.translate(-center.x,-bounds.min.y,-center.z);geometry.scale(scale,scale*.72,scale);
      const fur=new THREE.MeshStandardMaterial({color:0x6b4934,roughness:.92});
      fur.onBeforeCompile=shader=>{
        shader.uniforms.trailP={value:positions};shader.uniforms.trailN={value:normals};shader.uniforms.trailT={value:tangents};shader.uniforms.crawlTime=time;shader.uniforms.headLook=look;shader.uniforms.creatureUnit={value:unit};
        shader.vertexShader=`uniform float creatureUnit;uniform vec3 trailP[32];uniform vec3 trailN[32];uniform vec3 trailT[32];uniform float crawlTime;uniform vec2 headLook;\n`+shader.vertexShader;
        shader.vertexShader=shader.vertexShader.replace("#include <beginnormal_vertex>",`float trailIndex=clamp((1.05-position.z)/2.1*31.0,0.0,30.999);int ti=int(floor(trailIndex));float blend=fract(trailIndex);vec3 n=normalize(mix(trailN[ti],trailN[ti+1],blend));vec3 t=normalize(mix(trailT[ti],trailT[ti+1],blend));vec3 side=normalize(cross(n,t));n=normalize(cross(t,side));mat3 basis=mat3(side,n,t);vec3 objectNormal=basis*normal;`);
        shader.vertexShader=shader.vertexShader.replace("#include <begin_vertex>",`vec3 local=position;float head=smoothstep(.52,1.02,-position.z);local.xy*=1.0+head*.30;local.x+=head*headLook.x*.13;local.y+=head*headLook.y*.09;float feet=1.0-smoothstep(.04,.24,position.y);float stepWave=max(0.0,sin(crawlTime*8.0+trailIndex*1.42+sign(position.x)*3.14159));local.y+=feet*stepWave*.075;local.x+=feet*sin(crawlTime*8.0+trailIndex*1.42)*.025;vec3 transformed=mix(trailP[ti],trailP[ti+1],blend)+basis*vec3(local.x,local.y-.075,0.0)*creatureUnit;`);
        shader.fragmentShader=shader.fragmentShader.replace("#include <color_fragment>",`#include <color_fragment>\nfloat furGrain=fract(sin(dot(vViewPosition,vec3(167.1,311.7,74.7)))*43758.5453);diffuseColor.rgb*=.78+.32*furGrain;`);
      };
      const mesh=new THREE.Mesh(geometry,fur);mesh.frustumCulled=false;mesh.castShadow=true;monkey.group.add(mesh);
    });disposeObject(model);
  },undefined,()=>{console.warn("Monkey-centipede model could not load.");onCreatureReady();});


 const smooth=THREE.MathUtils.smoothstep;
 function record(c:Crawler,offset:number){const s=surface(c.direction);c.history.unshift({point:s.point,normal:s.normal,offset});if(c.history.length>600)c.history.pop();}
 function tick(dt:number){worldAge+=dt;skin.time.value=worldAge;skin.clear();for(const [index,c] of crawlers.entries()){c.age+=dt;const cycle=c.age%30;
 if(cycle>=12&&c.lastCycle<12){c.entryDirection.copy(c.direction);c.exitDirection.copy(randomDirection());}
 if(cycle>=20&&c.lastCycle<20){c.direction.copy(c.exitDirection);c.history.length=0;for(let j=0;j<180;j++)record(c,-unit*.6);}
 const entryOpen=smooth(cycle,11.7,13)*(1-smooth(cycle,18.2,19)),exitOpen=smooth(cycle,19.3,20.3)*(1-smooth(cycle,25.5,27));
 const entry=surface(c.entryDirection),exit=surface(c.exitDirection),opening=c.monkey?.34*unit:c.thickness*1.9;skin.opening(index*2,entry.point,entry.normal,opening*entryOpen);skin.opening(index*2+1,exit.point,exit.normal,opening*exitOpen);
 c.group.visible=cycle<18.7||cycle>=20;
 if(cycle<12||cycle>=24){if(c.age>=c.turnAt){c.target.copy(randomDirection());c.turnAt=c.age+2+Math.random()*3;}const desired=c.target.clone().projectOnPlane(c.direction).normalize();for(const other of crawlers){if(other===c||!other.group.visible)continue;const away=c.direction.clone().sub(other.direction),distance=away.length();if(distance>.001&&distance<.19*unit)desired.addScaledVector(away.projectOnPlane(c.direction).normalize(),(.19*unit-distance)*7);}c.heading.lerp(desired.normalize(),1-Math.exp(-dt*1.7)).projectOnPlane(c.direction).normalize();const side=new THREE.Vector3().crossVectors(c.direction,c.heading);const next=c.direction.clone().addScaledVector(c.heading,c.speed*dt).addScaledVector(side,Math.sin(c.age*4.5+index)*c.speed*dt*.35).normalize();if(!options.valid||options.valid(next))c.direction.copy(next);else{c.target.copy(randomDirection());c.heading.negate();}}
 else if(cycle<18.7)c.direction.lerp(c.entryDirection,1-Math.exp(-dt*3)).normalize();
 const depth=cycle<20?smooth(cycle,13,17):1-smooth(cycle,20,24);const offset=c.radius-depth*(c.radius+unit*.58);record(c,offset);c.lastCycle=cycle;}}
 function sample(c:Crawler,distance:number):TrailPoint{for(let j=1;j<c.history.length;j++){const a=c.history[j-1],b=c.history[j],length=a.point.distanceTo(b.point)+Math.abs(a.offset-b.offset);if(distance<=length){const t=length?distance/length:0;return{point:a.point.clone().lerp(b.point,t),normal:a.normal.clone().lerp(b.normal,t).normalize(),offset:THREE.MathUtils.lerp(a.offset,b.offset,t)};}distance-=length;}return c.history[c.history.length-1];}
 function contact(record:TrailPoint){const d=record.point.clone().sub(center).normalize(),base=surface(d),live=skin.sample(base.point,base.normal);live.point.addScaledVector(live.normal,record.offset);return live;}
 let accumulator=0;
 return {root,skin,crawlers,spawnWorm(){return addCrawler(false,true);},update(dt:number){accumulator+=Math.min(dt,.1);while(accumulator>=1/60){tick(1/60);accumulator-=1/60;}for(const c of crawlers){if(!c.group.visible)continue;const count=c.monkey?32:49,points=Array.from({length:count},(_,j)=>{const trail=sample(c,j*c.length/(count-1));if(!c.monkey){const side=new THREE.Vector3().crossVectors(trail.normal,c.heading).normalize(),wiggle=Math.sin(c.age*4-j*.3)*Math.sin(j/(count-1)*Math.PI)*c.thickness*1.65;trail.point=trail.point.clone().addScaledVector(side,wiggle);}return contact(trail);});
 for(let j=0;j<count;j++){const {point,normal}=points[j],previous=points[Math.max(0,j-1)].point,next=points[Math.min(count-1,j+1)].point,tangent=previous.clone().sub(next);if(tangent.lengthSq()<1e-7)tangent.copy(c.heading);tangent.normalize();const side=new THREE.Vector3().crossVectors(normal,tangent).normalize(),up=new THREE.Vector3().crossVectors(tangent,side).normalize();
 if(c.monkey&&c.spine){c.spine.positions[j].copy(point);c.spine.normals[j].copy(up);c.spine.tangents[j].copy(tangent);c.spine.time.value=c.age;c.spine.look.value.set(Math.sin(c.age*.9),Math.sin(c.age*1.37)*.7);}
 else if(c.geometry){const p=c.geometry.getAttribute('position'),n=c.geometry.getAttribute('normal');for(let k=0;k<=12;k++){const a=k/12*Math.PI*2,radial=side.clone().multiplyScalar(Math.cos(a)).addScaledVector(up,Math.sin(a));const v=point.clone().addScaledVector(radial,c.thickness);p.setXYZ(j*13+k,v.x,v.y,v.z);n.setXYZ(j*13+k,radial.x,radial.y,radial.z);}if(j===0){c.head!.position.copy(point);c.head!.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(side,up,tangent));}if(j===count-1)c.tail!.position.copy(point);p.needsUpdate=n.needsUpdate=true;}}
 }},dispose(){disposed=true;disposeObject(root);}};
}
function disposeObject(root:THREE.Object3D){const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();root.traverse(object=>{if(object instanceof THREE.Mesh){geometries.add(object.geometry);(Array.isArray(object.material)?object.material:[object.material]).forEach(m=>materials.add(m));}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}
