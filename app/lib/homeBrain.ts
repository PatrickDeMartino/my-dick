import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";

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

type TrailPoint = { point: THREE.Vector3; normal: THREE.Vector3 };
type Crawler = {
  group: THREE.Group; segments: THREE.Mesh[]; direction: THREE.Vector3; heading: THREE.Vector3; target: THREE.Vector3;
  history: TrailPoint[]; age: number; turnAt: number; speed: number; spacing: number; radius: number; monkey: boolean;
  bornAt: number; eatenUntil: number; entry: THREE.Group; exit: THREE.Group; entryDirection: THREE.Vector3; exitDirection: THREE.Vector3;
  spine?: { positions: THREE.Vector3[]; normals: THREE.Vector3[]; tangents: THREE.Vector3[]; time: { value: number }; look: { value: THREE.Vector2 } };
};
const randomDirection = () => new THREE.Vector3().randomDirection();
const smooth = (a:number,b:number,x:number) => THREE.MathUtils.smoothstep(x,a,b);

function brainTexture() {
  const canvas=document.createElement("canvas"); canvas.width=1024; canvas.height=512;
  const ctx=canvas.getContext("2d")!;
  const base=ctx.createLinearGradient(0,0,0,512);base.addColorStop(0,"#ffbadb");base.addColorStop(.48,"#d96b9f");base.addColorStop(1,"#8e345f");ctx.fillStyle=base;ctx.fillRect(0,0,1024,512);
  let seed=7831;const rnd=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
  for(let i=0;i<230;i++){
    const x=rnd()*1024,y=rnd()*512,length=22+rnd()*100,wave=6+rnd()*18;
    ctx.beginPath();ctx.moveTo(x,y);
    for(let j=1;j<=8;j++){const t=j/8;ctx.lineTo(x+length*t,y+Math.sin(t*Math.PI*(1+rnd()*3)+rnd())*wave);}
    ctx.lineCap="round";ctx.lineJoin="round";ctx.strokeStyle=i%3?"rgba(105,20,62,.42)":"rgba(255,212,230,.42)";ctx.lineWidth=2+rnd()*7;ctx.stroke();
    ctx.strokeStyle="rgba(75,8,43,.22)";ctx.lineWidth=1;ctx.stroke();
  }
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(1.6,1.15);texture.anisotropy=8;return texture;
}

function makeHole(color:number) {
  const group=new THREE.Group();group.visible=false;
  const well=new THREE.Mesh(new THREE.CircleGeometry(.14,24),new THREE.MeshBasicMaterial({color:0x13000c,transparent:true,opacity:.96,side:THREE.DoubleSide}));
  const rim=new THREE.Mesh(new THREE.TorusGeometry(.14,.035,8,28),new THREE.MeshPhysicalMaterial({color,roughness:.65,clearcoat:.25}));
  group.add(well,rim);return group;
}

export function makeHomeBrain(onCreatureReady: () => void) {
  const root=new THREE.Group(), texture=brainTexture();
  const matter=new THREE.MeshPhysicalMaterial({map:texture,bumpMap:texture,bumpScale:.055,color:0xffa4ce,emissive:0x411028,emissiveIntensity:.16,roughness:.68,clearcoat:.25});
  for(const lobe of lobes){const mesh=new THREE.Mesh(new THREE.SphereGeometry(1,64,44),matter);mesh.position.copy(lobe.center);mesh.scale.copy(lobe.axes);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);}
  const stem=new THREE.Mesh(new THREE.CapsuleGeometry(.19,.72,10,20),matter);stem.position.set(.06,-1.42,-.46);stem.rotation.z=-.11;root.add(stem);root.rotation.z=-.08;
  const colors=[0x78ffe4,0xffed69,0x9bff67,0xff7ecb,0x83a8ff],crawlers:Crawler[]=[];
  const eyeMaterial=new THREE.MeshBasicMaterial({color:0x16051b});let worldAge=0;
  function addCrawler(monkey=false, floorSpawn=false){
    const index=crawlers.length,count=monkey?32:7+(index*7)%15,group=new THREE.Group(),segments:THREE.Mesh[]=[];
    const color=colors[index%colors.length],material=new THREE.MeshPhysicalMaterial({color,emissive:color,emissiveIntensity:.3,roughness:.34,clearcoat:.75});
    if(!monkey){
      for(let j=0;j<count;j++){const mesh=new THREE.Mesh(new THREE.SphereGeometry(.075*(1-.46*j/count),14,10),material);mesh.castShadow=true;segments.push(mesh);group.add(mesh);}
      for(const side of [-1,1]){const eye=new THREE.Mesh(new THREE.SphereGeometry(.014,8,6),eyeMaterial);eye.position.set(side*.028,.025,.071);segments[0].add(eye);}
    }else material.dispose();
    const direction=randomDirection(),entry=makeHole(0xc45f91),exit=makeHole(0xe07bad);root.add(entry,exit);
    const crawler:Crawler={group,segments,direction,heading:randomDirection().projectOnPlane(direction).normalize(),target:randomDirection(),history:[],age:floorSpawn?0:index*1.93,turnAt:0,speed:monkey?.215:.23+(index%3)*.04,spacing:monkey?.075:.067,radius:monkey?.17:.06,monkey,bornAt:floorSpawn?worldAge:worldAge-99,eatenUntil:0,entry,exit,entryDirection:direction.clone(),exitDirection:randomDirection()};
    const surface=brainSurface(direction),floor=new THREE.Vector3((Math.random()-.5)*4.2,-2.25,(Math.random()-.5)*2.4);
    for(let j=0;j<190;j++){const p=floorSpawn?floor.clone().add(new THREE.Vector3(0,0,j*.003)):surface.point.clone().addScaledVector(surface.normal,crawler.radius);crawler.history.push({point:p,normal:floorSpawn?new THREE.Vector3(0,1,0):surface.normal.clone()});}
    crawlers.push(crawler);root.add(group);return crawler;
  }
  for(let i=0;i<9;i++)addCrawler();const monkey=addCrawler(true);

  let disposed=false;
  const manager=new THREE.LoadingManager();manager.onLoad=()=>{if(!disposed)onCreatureReady();};manager.onError=manager.onLoad;
  new FBXLoader(manager).load("/models/monkey-centipede.fbx",model=>{
    if(disposed){disposeObject(model);return;}model.updateMatrixWorld(true);
    const bounds=new THREE.Box3().setFromObject(model),center=bounds.getCenter(new THREE.Vector3()),scale=2.1/bounds.getSize(new THREE.Vector3()).z;
    const positions=Array.from({length:32},()=>new THREE.Vector3()),normals=positions.map(()=>new THREE.Vector3(0,1,0)),tangents=positions.map(()=>new THREE.Vector3(0,0,1)),time={value:0},look={value:new THREE.Vector2()};
    monkey.spine={positions,normals,tangents,time,look};
    model.traverse(object=>{
      if(!(object instanceof THREE.Mesh))return;
      const geometry=object.geometry.clone().applyMatrix4(object.matrixWorld);geometry.translate(-center.x,-bounds.min.y,-center.z);geometry.scale(scale,scale*.72,scale);
      const fur=new THREE.MeshStandardMaterial({color:0x6b4934,roughness:.92});
      fur.onBeforeCompile=shader=>{
        shader.uniforms.trailP={value:positions};shader.uniforms.trailN={value:normals};shader.uniforms.trailT={value:tangents};shader.uniforms.crawlTime=time;shader.uniforms.headLook=look;
        shader.vertexShader=`uniform vec3 trailP[32];uniform vec3 trailN[32];uniform vec3 trailT[32];uniform float crawlTime;uniform vec2 headLook;\n`+shader.vertexShader;
        shader.vertexShader=shader.vertexShader.replace("#include <beginnormal_vertex>",`float trailIndex=clamp((1.05-position.z)/2.1*31.0,0.0,30.999);int ti=int(floor(trailIndex));float blend=fract(trailIndex);vec3 n=normalize(mix(trailN[ti],trailN[ti+1],blend));vec3 t=normalize(mix(trailT[ti],trailT[ti+1],blend));vec3 side=normalize(cross(n,t));n=normalize(cross(t,side));mat3 basis=mat3(side,n,t);vec3 objectNormal=basis*normal;`);
        shader.vertexShader=shader.vertexShader.replace("#include <begin_vertex>",`vec3 local=position;float head=smoothstep(.52,1.02,-position.z);local.xy*=1.0+head*.30;local.x+=head*headLook.x*.13;local.y+=head*headLook.y*.09;float feet=1.0-smoothstep(.04,.24,position.y);float stepWave=max(0.0,sin(crawlTime*8.0+trailIndex*1.42+sign(position.x)*3.14159));local.y+=feet*stepWave*.075;local.x+=feet*sin(crawlTime*8.0+trailIndex*1.42)*.025;vec3 transformed=mix(trailP[ti],trailP[ti+1],blend)+basis*vec3(local.x,local.y-.075,0.0);`);
        shader.fragmentShader=shader.fragmentShader.replace("#include <color_fragment>",`#include <color_fragment>\nfloat furGrain=fract(sin(dot(vViewPosition,vec3(167.1,311.7,74.7)))*43758.5453);diffuseColor.rgb*=.78+.32*furGrain;`);
      };
      const mesh=new THREE.Mesh(geometry,fur);mesh.frustumCulled=false;mesh.castShadow=true;monkey.group.add(mesh);
    });disposeObject(model);
  },undefined,()=>{console.warn("Monkey-centipede model could not load.");onCreatureReady();});

  function placeHole(hole:THREE.Group,direction:THREE.Vector3,amount:number,monkeyHole:boolean){
    const s=brainSurface(direction);hole.position.copy(s.point).addScaledVector(s.normal,.015);hole.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),s.normal);hole.visible=amount>.01;hole.scale.setScalar(amount*(monkeyHole?1.7:1));hole.rotation.z+=.025;
  }
  function step(dt:number){
    worldAge+=dt;
    for(const crawler of crawlers){
      crawler.age+=dt;
      if(crawler.eatenUntil>worldAge){crawler.group.visible=false;continue;}else if(!crawler.group.visible){crawler.group.visible=true;crawler.bornAt=worldAge;crawler.age=0;}
      const approach=Math.min(1,(worldAge-crawler.bornAt)/4.2);
      if(crawler.monkey){
        const prey=crawlers.filter(c=>!c.monkey&&c.eatenUntil<=worldAge).sort((a,b)=>crawler.direction.angleTo(a.direction)-crawler.direction.angleTo(b.direction))[0];
        if(prey&&crawler.age%13>7){crawler.target.copy(prey.direction);if(crawler.direction.angleTo(prey.direction)<.11&&crawler.age%13>10){prey.eatenUntil=worldAge+6;prey.group.scale.setScalar(.01);}}
      }
      if(crawler.age>=crawler.turnAt){if(!crawler.monkey||crawler.age%13<=7)crawler.target.copy(randomDirection());crawler.turnAt=crawler.age+2.5+Math.random()*3.5;}
      const desired=crawler.target.clone().projectOnPlane(crawler.direction).normalize();
      for(const other of crawlers){if(other===crawler||other.eatenUntil>worldAge)continue;const away=crawler.direction.clone().sub(other.direction),distance=away.length();if(distance<.25&&distance>.001)desired.addScaledVector(away.projectOnPlane(crawler.direction).normalize(),(.25-distance)*5);}
      crawler.heading.lerp(desired.normalize(),1-Math.exp(-dt*(crawler.monkey?2.1:1.45))).projectOnPlane(crawler.direction).normalize();crawler.direction.addScaledVector(crawler.heading,crawler.speed*dt).normalize();
      const surface=brainSurface(crawler.direction),cycle=crawler.age%23;
      if(cycle<.04){crawler.entryDirection.copy(crawler.direction);crawler.exitDirection.copy(randomDirection());}
      const entering=smooth(10,12,cycle),exiting=smooth(16,19,cycle),depth=cycle<16?entering:1-exiting;
      const entryOpen=smooth(9.4,10.3,cycle)*(1-smooth(13.2,14.2,cycle)),exitOpen=smooth(15.3,16.2,cycle)*(1-smooth(20,21.2,cycle));
      placeHole(crawler.entry,crawler.entryDirection,entryOpen,crawler.monkey);placeHole(crawler.exit,crawler.exitDirection,exitOpen,crawler.monkey);
      if(cycle>16)crawler.direction.lerp(crawler.exitDirection,.055).normalize();
      let point=surface.point.addScaledVector(surface.normal,crawler.radius-depth*(crawler.monkey?.72:.43));
      let normal=surface.normal;
      if(approach<1){const floor=crawler.history[0].point.clone();const lift=surface.point.clone().addScaledVector(surface.normal,crawler.radius+.15);point=floor.lerp(lift,smooth(0,1,approach));point.y+=Math.sin(approach*Math.PI)*.65;normal=new THREE.Vector3(0,1,0).lerp(surface.normal,approach).normalize();placeHole(crawler.entry,crawler.direction,smooth(.66,.98,approach),crawler.monkey);}
      if(point.distanceTo(crawler.history[0].point)>.009){crawler.history.unshift({point,normal:normal.clone()});if(crawler.history.length>360)crawler.history.pop();}
      crawler.group.scale.lerp(new THREE.Vector3(1,1,1),.08);
    }
  }
  function sample(crawler:Crawler,distance:number):TrailPoint{
    for(let j=1;j<crawler.history.length;j++){const a=crawler.history[j-1],b=crawler.history[j],length=a.point.distanceTo(b.point);if(distance<=length){const t=length?distance/length:0;return{point:a.point.clone().lerp(b.point,t),normal:a.normal.clone().lerp(b.normal,t).normalize()};}distance-=length;}return crawler.history[crawler.history.length-1];
  }
  let accumulator=0;
  return {root,spawnWorm(){addCrawler(false,true);},update(dt:number){
    accumulator+=Math.min(dt,.1);while(accumulator>=1/60){step(1/60);accumulator-=1/60;}
    for(const crawler of crawlers){if(!crawler.group.visible)continue;const count=crawler.monkey?32:crawler.segments.length;
      for(let j=0;j<count;j++){const distance=j*(crawler.monkey?2.1/31:crawler.spacing),{point,normal}=sample(crawler,distance),previous=sample(crawler,Math.max(0,distance-.025)).point,next=sample(crawler,distance+.025).point,tangent=previous.clone().sub(next).normalize(),side=new THREE.Vector3().crossVectors(normal,tangent).normalize(),up=new THREE.Vector3().crossVectors(tangent,side).normalize();
        if(crawler.monkey&&crawler.spine){crawler.spine.positions[j].copy(point);crawler.spine.normals[j].copy(up);crawler.spine.tangents[j].copy(tangent);crawler.spine.time.value=crawler.age;if(j===0)crawler.spine.look.value.set(Math.sin(crawler.age*.9),Math.sin(crawler.age*1.37)*.7);}
        else if(!crawler.monkey){const bead=crawler.segments[j];bead.position.copy(point);bead.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(side,up,tangent));bead.scale.setScalar(1+Math.sin(crawler.age*7-j*.55)*.06);}
      }
    }
  },dispose(){disposed=true;disposeObject(root);texture.dispose();}};
}
function disposeObject(root:THREE.Object3D){const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();root.traverse(object=>{if(object instanceof THREE.Mesh){geometries.add(object.geometry);(Array.isArray(object.material)?object.material:[object.material]).forEach(m=>materials.add(m));}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}
