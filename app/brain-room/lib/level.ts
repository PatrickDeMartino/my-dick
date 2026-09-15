import {cortexShell,brainEnvelope,makeDreamTree} from './cortex-shell';
import {BreakableWalls} from './breakables';
import * as T from 'three';
import {makeLab} from './laboratory';
import {makeDreamscape} from './dreamscape';
import { makeHerd } from './cows';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export type Solid = { center: T.Vector3; half: T.Vector3 };
export const ROOM_FLOOR = 3;
export const WINDOW = { x: -6, z: 0, halfWidth: 1.8, sill: 3.55, top: 8.4 };
export const SPAWN = new T.Vector3(1, ROOM_FLOOR + .22, 2.5);

export function makeLevel(options:{lightweight?:boolean}={}) {
  const root = new T.Group(); root.name = 'Brain Room and Cow Meadow';
  const room = new T.Group(); room.name = 'Sculpted human brain room'; root.add(room);
  const solids: Solid[] = [];
  let seed = 1771;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const mat = (color: number, roughness = .85) => new T.MeshStandardMaterial({ color, roughness });
  const flesh = new T.MeshPhysicalMaterial({ color: 0xe8c7bc, roughness: .43, clearcoat: .32, clearcoatRoughness: .3, sheen:.18, sheenColor:new T.Color(0xef9c94) });
  flesh.name='Cortex tissue';
  const darkFlesh = flesh.clone();darkFlesh.name='Cortex recesses';darkFlesh.color.setHex(0x8e6968);
  if(typeof document!=='undefined'){
    const cortex=new T.TextureLoader().load('/brain-room/cortex.png');cortex.colorSpace=T.SRGBColorSpace;cortex.wrapS=cortex.wrapT=T.RepeatWrapping;cortex.anisotropy=4;
    flesh.map=cortex;flesh.bumpMap=cortex;flesh.bumpScale=.045;
    const backing=new T.TextureLoader().load('/brain-room/cortex.png');backing.colorSpace=T.SRGBColorSpace;backing.wrapS=backing.wrapT=T.RepeatWrapping;backing.anisotropy=4;backing.repeat.set(2.7,1.8);
    darkFlesh.map=backing;darkFlesh.bumpMap=backing;darkFlesh.bumpScale=.11;
  }
  const wood = mat(0x49302b);
  const paleWood = mat(0xae8a63);
  const mesh = (g: T.BufferGeometry, m: T.Material, p: number[], parent: T.Object3D = root) => {
    const o = new T.Mesh(g, m); o.position.set(p[0], p[1], p[2]); o.castShadow = true; o.receiveShadow = true; parent.add(o); return o;
  };
  const box = (p: number[], s: number[], m: T.Material, parent: T.Object3D = root, solid = false) => {
    const o = mesh(new T.BoxGeometry(s[0], s[1], s[2]), m, p, parent);
    if (solid) solids.push({ center: o.position.clone(), half: new T.Vector3(s[0]/2, s[1]/2, s[2]/2) });
    return o;
  };
  // The window is a real gap in both the mesh and the physical wall.
  box([0, 2.72, 0], [12.7, .56, 12.7], darkFlesh, room, true);
  box([0, 6.5, -6], [12.6, 7, .55], darkFlesh, room, true);
  box([0, 6.5, 6], [12.6, 7, .55], darkFlesh, room, true);
  box([6, 6.5, 0], [.55, 7, 12.6], darkFlesh, room, true);
  box([-6, 6.5, -3.9], [.55, 7, 4.2], darkFlesh, room, true);
  box([-6, 6.5, 3.9], [.55, 7, 4.2], darkFlesh, room, true);
  box([-6, 3.2, 0], [.65, .7, 3.6], darkFlesh, room, true);
  box([-6, 9.2, 0], [.55, 1.6, 3.6], darkFlesh, room, true);
  box([0, 10, 0], [12.6, .45, 12.6], darkFlesh, room, true);
  const folds: T.BufferGeometry[] = [];
  const exterior=cortexShell(brainEnvelope,{count:options.lightweight?180:650,radius:.07,detail:options.lightweight?16:54,segments:options.lightweight?18:38,radial:options.lightweight?6:10,skip:p=>p.x<-.78&&Math.abs(p.z)<.36&&p.y>-.65&&p.y<.66});exterior.position.set(0,6.3,0);exterior.scale.set(6.2,4.8,6);room.add(exterior);
  function foldSurface(width: number, height: number, origin: T.Vector3, u: T.Vector3, v: T.Vector3, normal: T.Vector3, skip?: (x: number,y:number)=>boolean) {
    const spacing=options.lightweight?.76:.39;
    const nx=Math.floor(width/spacing),ny=Math.floor(height/spacing),used=new Uint8Array(nx*ny);
    const xy=(id:number)=>({x:-width/2+(id%nx+.5)*width/nx,y:-height/2+(Math.floor(id/nx)+.5)*height/ny});
    for(let i=0;i<used.length;i++){const p=xy(i);if(skip?.(p.x,p.y))used[i]=1;}
    const order=Array.from({length:used.length},(_,i)=>i);for(let i=order.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
    for(const start of order){if(used[start])continue;let id=start;const points:T.Vector3[]=[];const limit=12+Math.floor(random()*28);
      for(let step=0;step<limit;step++){
        used[id]=1;const {x,y}=xy(id);points.push(origin.clone().addScaledVector(u,x+(random()-.5)*spacing*.32).addScaledVector(v,y+Math.sin(x*1.3+y*.4)*.065+(random()-.5)*spacing*.3).addScaledVector(normal,.065+random()*.05));
        const row=Math.floor(id/nx),col=id%nx;const neighbors:number[]=[];
        for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=col+dx,yy=row+dy;if(xx>=0&&xx<nx&&yy>=0&&yy<ny&&!used[yy*nx+xx])neighbors.push(yy*nx+xx);}
        if(!neighbors.length)break;id=neighbors[Math.floor(random()*neighbors.length)];
      }
      const radius=options.lightweight?.18:.187;
      if(points.length>1){const curve=new T.CatmullRomCurve3(points,false,'centripetal');const tube=new T.TubeGeometry(curve,Math.max(5,(points.length-1)*(options.lightweight?2:8)),radius,options.lightweight?5:14,false);const uv=tube.getAttribute('uv');for(let k=0;k<uv.count;k++)uv.setX(k,uv.getX(k)*curve.getLength()/2.5);folds.push(tube);}
      for(const point of points.length===1?points:[points[0],points[points.length-1]]){const cap=new T.SphereGeometry(radius,options.lightweight?6:10,options.lightweight?4:8);cap.translate(point.x,point.y,point.z);folds.push(cap);}
    }
  }
  foldSurface(11.8,6.6,new T.Vector3(0,6.5,-5.69),new T.Vector3(1,0,0),new T.Vector3(0,1,0),new T.Vector3(0,0,1));
  foldSurface(11.8,6.6,new T.Vector3(0,6.5,5.69),new T.Vector3(1,0,0),new T.Vector3(0,1,0),new T.Vector3(0,0,-1));
  foldSurface(11.8,6.6,new T.Vector3(5.69,6.5,0),new T.Vector3(0,0,1),new T.Vector3(0,1,0),new T.Vector3(-1,0,0));
  foldSurface(11.8,6.6,new T.Vector3(-5.69,6.5,0),new T.Vector3(0,0,1),new T.Vector3(0,1,0),new T.Vector3(1,0,0),(z,y)=>Math.abs(z)<2 && y+6.5>3.4 && y+6.5<8.55);
  foldSurface(11.8,11.8,new T.Vector3(0,3.02,0),new T.Vector3(1,0,0),new T.Vector3(0,0,1),new T.Vector3(0,1,0));
  foldSurface(11.8,11.8,new T.Vector3(0,9.72,0),new T.Vector3(1,0,0),new T.Vector3(0,0,1),new T.Vector3(0,-1,0));
  // Rounded arch lip, with no transparent image or fake view blocking the exit.
  const arch: T.Vector3[] = [new T.Vector3(-5.65,3.5,-1.82), new T.Vector3(-5.65,7.25,-1.82)];
  for(let i=0;i<=20;i++){const a=Math.PI-i/20*Math.PI;arch.push(new T.Vector3(-5.65,7.25+Math.sin(a)*1.05,Math.cos(a)*1.82));}
  arch.push(new T.Vector3(-5.65,3.5,1.82));
  folds.push(new T.TubeGeometry(new T.CatmullRomCurve3(arch),80,.23,10,false));
  const merged = mergeGeometries(folds); folds.forEach(g=>g.dispose());
  if(merged){const cortex=mesh(merged,flesh,[0,0,0],room);cortex.name='Raised cortical gyri — walls, floor, ceiling and arch';}

  const bag = new T.Group(); bag.name='Brain armchair'; bag.position.set(3.1,3.15,-3.1); room.add(bag);
  const puff = mesh(new T.SphereGeometry(1,32,20),flesh,[0,.4,0],bag);puff.scale.set(1.5,.55,1.35);
  const chairFolds:T.BufferGeometry[]=[];
  for(let j=0;j<23;j++){
    const a=-.15+j/22*(Math.PI+ .3);
    const points=Array.from({length:16},(_,i)=>{const b=i/15*Math.PI;return new T.Vector3(Math.cos(a)*(1.3+.13*Math.sin(i*1.8)),.4+Math.sin(b)*(.65+Math.sin(a)*.8),Math.sin(a)*-1.05+Math.cos(b)*.22);});
    chairFolds.push(new T.TubeGeometry(new T.CatmullRomCurve3(points),24,.13,8,false));
  }
  const chairGeo=mergeGeometries(chairFolds);chairFolds.forEach(g=>g.dispose());if(chairGeo)mesh(chairGeo,flesh,[0,0,0],bag);
  solids.push({center:new T.Vector3(3.1,3.5,-3.1),half:new T.Vector3(1.4,.5,1.15)});
  const ottoman=mesh(new T.SphereGeometry(1,32,18),flesh,[-1.3,3.5,1],room);ottoman.scale.set(1,.45,.85);ottoman.name='Brain ottoman';
  for(let i=0;i<24;i++){const a=i/24*Math.PI*2; const points=Array.from({length:14},(_,k)=>{const b=k/13*Math.PI;return new T.Vector3(-1.3+Math.cos(a)*Math.sin(b),3.5+Math.cos(b)*.45,1+Math.sin(a+.06*Math.sin(k*1.9))*Math.sin(b)*.85);});mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),28,.115,10,false),flesh,[0,0,0],room);}
  solids.push({center:new T.Vector3(-1.3,3.4,1),half:new T.Vector3(.95,.42,.8)});
  mesh(new T.CylinderGeometry(.95,.95,.13,40),wood,[-2.65,4.3,-3.65],room).name='Reading table';
  for(const x of [-.6,.6])for(const z of [-.5,.5])mesh(new T.CylinderGeometry(.055,.08,1.2,8),wood,[-2.65+x,3.65,-3.65+z],room);
  solids.push({center:new T.Vector3(-2.65,3.7,-3.65),half:new T.Vector3(.9,.65,.9)});
  for(let i=0;i<3;i++)box([-2.3,4.42+i*.12,-3.8],[.55,.105,.43],mat([0x886957,0x453942,0xb49d7c][i]),room);
  mesh(new T.CylinderGeometry(.24,.27,.13,24),wood,[-3.03,4.44,-3.55],room);
  mesh(new T.SphereGeometry(.29,24,16),new T.MeshStandardMaterial({color:0xffe7b2,emissive:0xffbc73,emissiveIntensity:2.4}),[-3.03,4.8,-3.55],room).name='Warm globe lamp';
  const lamp = new T.PointLight(0xffbe85,42,12,2);lamp.position.set(-3.03,4.9,-3.4);room.add(lamp);
  // Framed branching neuron, made of geometry so the exported room remains self-contained.
  box([5.35,6.4,-2.5],[.16,2.75,2.05],wood,room);
  box([5.24,6.4,-2.5],[.05,2.42,1.72],mat(0x17131f),room);
  const neuronMat=new T.MeshBasicMaterial({color:0xe597cf});
  for(let i=0;i<16;i++){const a=i/16*Math.PI*2;const pts=Array.from({length:7},(_,k)=>new T.Vector3(5.18,6.4+Math.sin(a)*k*.16+(random()-.5)*.14,-2.5+Math.cos(a)*k*.12+(random()-.5)*.14));mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),16,.009,4,false),neuronMat,[0,0,0],room);}

  // Original reference, framed at its full 900:506 aspect ratio.
  const painting=new T.Group();painting.name='Original brain room reference — framed';painting.position.set(2.4,6.6,-5.28);room.add(painting);
  const artMaterial=new T.MeshStandardMaterial({color:0xffffff,roughness:.95});artMaterial.name='Reference painting';
  if(typeof document!=='undefined'){artMaterial.map=new T.TextureLoader().load('/brain-room/reference-art.jpg');artMaterial.map.colorSpace=T.SRGBColorSpace;}
  const art=mesh(new T.PlaneGeometry(3.2,3.2*506/900),artMaterial,[0,0,.07],painting);art.name='Brain room reference artwork';
  box([0,0,0],[3.5,2.1,.1],wood,painting);
  const trim=new T.MeshStandardMaterial({color:0xb69254,metalness:.65,roughness:.3});
  for(const x of [-1.66,1.66])box([x,0,.1],[.14,2.05,.15],wood,painting);
  for(const y of [-.965,.965])box([0,y,.1],[3.45,.14,.15],wood,painting);
  for(const x of [-1.615,1.615])box([x,0,.15],[.018,1.83,.025],trim,painting);
  for(const y of [-.911,.911])box([0,y,.15],[3.24,.018,.025],trim,painting);

  const grass=mat(0x758454); const land=box([0,-.35,0],[180,.7,180],grass,root,true);land.name='Walkable meadow';
  const dirt=mat(0xae9772);box([-13,.005,0],[14,.02,3.1],dirt);
  // Steps let either character return through the same window.
  for(let i=0;i<6;i++)box([-10.9+i*.8,(i+1)*.275,0],[.83,(i+1)*.55,3],paleWood,root,true);
  const fence= new T.Group();fence.name='Pasture fence';root.add(fence);
  for(let z=-34;z<=34;z+=3.4){for(const x of [-48,21]){box([x, .8,z],[.14,1.6,.14],paleWood,fence);for(const y of [.55,1.1])box([x,y,z+1.7],[.1,.1,3.4],paleWood,fence);}}
  for(let x=-48;x<=21;x+=3.4)for(const z of [-34,34]){if(z===-34&&x>-18&&x<-8)continue;box([x,.8,z],[.14,1.6,.14],paleWood,fence);for(const y of [.55,1.1])box([x+1.7,y,z],[3.4,.1,.1],paleWood,fence);}
  for(const [x,z,sx,sz] of [[-48,0,.15,68],[21,0,.15,68],[-33,-34,30,.15],[6,-34,30,.15],[-13.5,34,69,.15]])solids.push({center:new T.Vector3(x,.65,z),half:new T.Vector3(sx/2,.65,sz/2)});
  const barn=new T.Group();barn.name='Red meadow barn';root.add(barn);
  const barnWalls=new BreakableWalls(solids,barn);const barnMat=mat(0x9e4e48);barnWalls.add([-37,2.5,-20],[.3,5,8],barnMat);barnWalls.add([-27,2.5,-20],[.3,5,8],barnMat);barnWalls.add([-32,2.5,-24],[10,5,.3],barnMat);barnWalls.add([-35.3,2.5,-16],[3.4,5,.3],barnMat);barnWalls.add([-28.7,2.5,-16],[3.4,5,.3],barnMat);barnWalls.add([-32,4.4,-16],[3.2,1.2,.3],barnMat);
  const roof=mesh(new T.CylinderGeometry(0,7.2,3,4,1),mat(0x443a48),[-32,6.5,-20],barn);roof.rotation.y=Math.PI/4;roof.scale.z=.8;
  barnWalls.add([-32,1.8,-15.94],[3,3.6,.16],mat(0x492e31));
  for(const x of [-1.7,1.7])box([-32+x,1.85,-15.85],[.14,3.7,.1],mat(0xead6b7),barn);
  box([-32,3.68,-15.85],[3.55,.16,.1],mat(0xead6b7),barn);
  // Thin quartz clusters, mostly green, with occasional spectral colours.
  const shaft=new T.CylinderGeometry(.065,.09,.48,5);const point=new T.ConeGeometry(.065,.22,5);point.translate(0,.35,0);
  const crystalGeo=mergeGeometries([shaft,point])!;shaft.dispose();point.dispose();
  const crystalMat=new T.MeshStandardMaterial({color:0xffffff,metalness:.28,roughness:.23,emissive:0x83ff9b,emissiveIntensity:.3});
  const crystalWind={value:0};crystalMat.onBeforeCompile=shader=>{shader.uniforms.windTime=crystalWind;shader.vertexShader='uniform float windTime;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n transformed.x+=sin(windTime*.7+instanceMatrix[3].x*.6+instanceMatrix[3].z*.4)*pow(max(0.,position.y+.24),2.)*.055;');};
  const blades=new T.InstancedMesh(crystalGeo,crystalMat,2200),dummy=new T.Object3D();const crystalColors=[0x71eaa3,0x3fba78,0x98ff78,0x54e8c8,0xae7fff,0xf791d5,0xf9c871];
  for(let i=0;i<2200;i++){if(i%4===0){dummy.userData.x=-66+random()*114;dummy.userData.z=-78+random()*135;}let x=dummy.userData.x+(random()-.5)*.6,z=dummy.userData.z+(random()-.5)*.6;
    if((Math.abs(x)<7&&Math.abs(z)<7)||(x>-29&&x<5&&z<-43)||(Math.abs(x+12)<3&&z<-28))x=35+random()*15;
    const scale=.45+random()*1.2;dummy.position.set(x,.25*scale,z);dummy.rotation.set((random()-.5)*.3,random()*6.28,(random()-.5)*.4);dummy.scale.set(.7,scale,.7);dummy.updateMatrix();blades.setMatrixAt(i,dummy.matrix);blades.setColorAt(i,new T.Color(crystalColors[random()<.8?Math.floor(random()*3):3+Math.floor(random()*4)]));}root.add(blades);
  const flowers=new T.InstancedMesh(new T.IcosahedronGeometry(.065,0),mat(0xf4d9ac),340);
  for(let i=0;i<340;i++){dummy.position.set(-45+random()*60,.32,-31+random()*62);dummy.scale.setScalar(1);dummy.rotation.set(0,0,0);dummy.updateMatrix();flowers.setMatrixAt(i,dummy.matrix);}root.add(flowers);
  const trees:T.Group[]=[];for(let i=0;i<20;i++){const x=-58+random()*90,z=(i%2?1:-1)*(24+random()*22);if((x<-39&&z<0)||(x>-31&&x<8&&z<-36))continue;const tree=makeDreamTree(i);tree.position.set(x,0,z);root.add(tree);trees.push(tree);}
  for(let i=0;i<24;i++){const a=i/24*Math.PI*2;const mountain=mesh(new T.ConeGeometry(15+random()*12,13+random()*23,6),mat(i%2?0x8b7d99:0xa394a6),[Math.cos(a)*95,-2,Math.sin(a)*95]);mountain.rotation.y=random()*6.28;}
  const cows=makeHerd(random);cows.forEach(cow=>root.add(cow.root));
  const lab=makeLab(solids);root.add(lab.root);
  const dreamscape=makeDreamscape();root.add(dreamscape.root);
  return {root,room,solids,cows,lamp,lab,dreamscape,barnWalls,updateAmbience:(time:number)=>{trees.forEach((tree,i)=>{tree.rotation.z=Math.sin(time*.4+i)*.012;tree.rotation.x=Math.sin(time*.31+i*2)*.009;});exterior.scale.y=4.8+Math.sin(time*.43)*.015;crystalWind.value=time;}};
}

/** Resolve a sphere against the same boxes that describe the visible level. */
export function collide(position:T.Vector3, radius:number, solids:Solid[], velocity?:T.Vector3, bounce=0) {
  let grounded=false;
  for(const s of solids){
    if(Math.abs(position.x-s.center.x)>s.half.x+radius||Math.abs(position.y-s.center.y)>s.half.y+radius||Math.abs(position.z-s.center.z)>s.half.z+radius)continue;
    const local=position.clone().sub(s.center);const closest=local.clone().clamp(s.half.clone().negate(),s.half);
    const normal=local.clone().sub(closest);const d=normal.length();
    if(d>=radius)continue;
    let penetration=radius-d;
    if(d>.00001)normal.divideScalar(d);else{
      const gaps=[s.half.x-Math.abs(local.x),s.half.y-Math.abs(local.y),s.half.z-Math.abs(local.z)];const axis=gaps.indexOf(Math.min(...gaps));normal.set(0,0,0);normal.setComponent(axis,Math.sign(local.getComponent(axis))||1);penetration=radius+gaps[axis];
    }
    position.addScaledVector(normal,penetration+.0001);if(normal.y>.5)grounded=true;
    if(velocity){const toward=velocity.dot(normal);if(toward<0)velocity.addScaledVector(normal,-toward*(1+bounce));}
  }
  return grounded;
}
