import * as T from 'three';
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
    const backing=cortex.clone();backing.repeat.set(2.7,1.8);backing.needsUpdate=true;
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
  function foldSurface(width: number, height: number, origin: T.Vector3, u: T.Vector3, v: T.Vector3, normal: T.Vector3, skip?: (x: number,y:number)=>boolean) {
    const spacing = options.lightweight ? .94 : .59;
    for (let ix = 0; ix < width/spacing; ix++) for (let iy = 0; iy < height/spacing; iy++) {
      const x = -width/2 + (ix+.5)*spacing, y = -height/2 + (iy+.5)*spacing;
      if (skip?.(x,y)) continue;
      const angle = Math.sin(x*.8)*.8+Math.cos(y*.9)*1.2+(random()-.5)*.4, phase = random()*6.28;
      const points = Array.from({length: 10}, (_, k) => {
        const a = (k/9-.5)*.73, b = Math.sin(k/9*Math.PI*2+phase)*.18;
        return origin.clone().addScaledVector(u,x+a*Math.cos(angle)-b*Math.sin(angle)).addScaledVector(v,y+a*Math.sin(angle)+b*Math.cos(angle)).addScaledVector(normal,.06+Math.sin(k/9*Math.PI)*.065);
      });
      const radius=.173+random()*.025;
      const fold=new T.TubeGeometry(new T.CatmullRomCurve3(points),options.lightweight?8:18,radius,options.lightweight?6:10,false);
      // Broader, tightly packed gyri with rounded ends instead of open tubes.
      folds.push(fold);
      for(const point of [points[0],points[points.length-1]]){const cap=new T.SphereGeometry(radius,options.lightweight?6:10,options.lightweight?4:8);cap.translate(point.x,point.y,point.z);folds.push(cap);}
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
  for(let x=-48;x<=21;x+=3.4)for(const z of [-34,34]){box([x,.8,z],[.14,1.6,.14],paleWood,fence);for(const y of [.55,1.1])box([x+1.7,y,z],[3.4,.1,.1],paleWood,fence);}
  for(const [x,z,sx,sz] of [[-48,0,.15,68],[21,0,.15,68],[-13.5,-34,69,.15],[-13.5,34,69,.15]])solids.push({center:new T.Vector3(x,.65,z),half:new T.Vector3(sx/2,.65,sz/2)});
  const barn=new T.Group();barn.name='Red meadow barn';root.add(barn);
  box([-32,2.5,-20],[10,5,8],mat(0x9e4e48),barn,true);
  const roof=mesh(new T.CylinderGeometry(0,7.2,3,4,1),mat(0x443a48),[-32,6.5,-20],barn);roof.rotation.y=Math.PI/4;roof.scale.z=.8;
  box([-32,1.8,-15.94],[3,3.6,.08],mat(0x492e31),barn);
  for(const x of [-1.7,1.7])box([-32+x,1.85,-15.85],[.14,3.7,.1],mat(0xead6b7),barn);
  box([-32,3.68,-15.85],[3.55,.16,.1],mat(0xead6b7),barn);
  // Batched grass blades and flowers keep the pasture light enough for a browser.
  const bladeGeo=new T.ConeGeometry(.075,.55,3);const blades=new T.InstancedMesh(bladeGeo,mat(0x657a48),2600);const dummy=new T.Object3D();
  for(let i=0;i<2600;i++){let x=-46+random()*65,z=-32+random()*64;if((Math.abs(x)<7&&Math.abs(z)<7)||(x>-20&&x<-5&&Math.abs(z)<2))z+=10;dummy.position.set(x,.18,z);dummy.rotation.set(0,random()*6.28,(random()-.5)*.35);dummy.scale.setScalar(.6+random());dummy.updateMatrix();blades.setMatrixAt(i,dummy.matrix);}root.add(blades);
  const flowers=new T.InstancedMesh(new T.IcosahedronGeometry(.065,0),mat(0xf4d9ac),340);
  for(let i=0;i<340;i++){dummy.position.set(-45+random()*60,.32,-31+random()*62);dummy.scale.setScalar(1);dummy.rotation.set(0,0,0);dummy.updateMatrix();flowers.setMatrixAt(i,dummy.matrix);}root.add(flowers);
  for(let i=0;i<20;i++){const x=-58+random()*90,z=(i%2?1:-1)*(24+random()*22);if(x<-39&&z<0)continue;const tree=new T.Group();tree.position.set(x,0,z);root.add(tree);mesh(new T.CylinderGeometry(.13,.3,3.6,7),wood,[0,1.8,0],tree);for(let j=0;j<3;j++){const leaf=mesh(new T.IcosahedronGeometry(1.7,1),mat([0x566a49,0x748350,0x87945e][j]),[(j-1)*.75,3.6+j*.5,0],tree);leaf.scale.y=.8;}}
  for(let i=0;i<24;i++){const a=i/24*Math.PI*2;const mountain=mesh(new T.ConeGeometry(15+random()*12,13+random()*23,6),mat(i%2?0x8b7d99:0xa394a6),[Math.cos(a)*95,-2,Math.sin(a)*95]);mountain.rotation.y=random()*6.28;}
  const cows=makeHerd(random);cows.forEach(cow=>root.add(cow.root));
  return {root,room,solids,cows,lamp};
}

/** Resolve a sphere against the same boxes that describe the visible level. */
export function collide(position:T.Vector3, radius:number, solids:Solid[], velocity?:T.Vector3, bounce=0) {
  let grounded=false;
  for(const s of solids){
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
