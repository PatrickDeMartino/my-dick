import * as T from 'three';
import type {SiteAsset} from '../lib/assetRegistry';
import {makeBrainCreature,animateCreature} from '../brain-room/lib/creatures';
import {makeLooseProp,animateLoose} from '../brain-room/lib/loose-props';
import {makeSpecimen,type SpecimenKind} from '../brain-room/lib/specimens';
import {makeHerd,stepCow} from '../brain-room/lib/cows';
import {makeHomeBrain} from '../lib/homeBrain';
import {makeEvilLaser} from '../brain-room/lib/evil-laser';
import {makeDreamTree} from '../brain-room/lib/cortex-shell';
import {fixture} from './models/fixtures';
import {makeJungleTree,makeCrystalCluster} from './models/home';
import {buildProp} from '../lib/props3d';
import {createAlien,updateAlien} from '../urf-3d/grok/alien';
import * as weapons from '../urf-3d/grok/weapons';
export type ModelHandle={root:T.Group;update?:(time:number,dt:number,moving:boolean)=>void;dispose?:()=>void};
export async function buildAsset(asset:SiteAsset):Promise<ModelHandle>{let root:T.Group;let update:ModelHandle['update'],dispose:ModelHandle['dispose'];const model=asset.model||'';
 if(asset.builder==='image'){root=new T.Group();const texture=await new T.TextureLoader().loadAsync(asset.url!);texture.colorSpace=T.SRGBColorSpace;const ratio=texture.image.width/texture.image.height;const mesh=new T.Mesh(new T.PlaneGeometry(Math.min(4,2*ratio),Math.min(4,2*ratio)/ratio),new T.MeshStandardMaterial({map:texture,side:T.DoubleSide,transparent:true,roughness:.65}));root.add(mesh);}
 else if(asset.builder==='alien'){const rig=createAlien(asset.character!);root=rig.root;update=(time,dt,moving)=>updateAlien(rig,{dt,speed:moving?3:0,grounded:true,vy:0,justLanded:false,justShot:false,attract:false,time,weapon:'revolver',firing:false,aimPitch:0,reload:0,revLoaded:6});}
 else if(asset.builder==='shared-prop')root=buildProp(T,asset.prop!);
 else if(asset.builder==='sandbox'){const key=asset.sandbox;const map:Record<string,()=>T.Group>={ak47:()=>weapons.makeAK47().root,revolver:()=>weapons.makeRevolver().root,bow:()=>weapons.makeBow().root,arrow:weapons.makeArrowMesh,vehicle:weapons.makeUrfRoverProp,jetpack:weapons.makeJetpackProp,biplane:weapons.makePenguinBiplaneProp,penguin:()=>buildProp(T,'penguin'),bongo:()=>makeBrainCreature('bongo')};const value=map[key||''];root=value?value():makeLooseProp(key||'rock');}
 else if(model.startsWith('sandbox-old:')){const {makeSandboxProp}=await import('./models/legacy-sandbox');root=makeSandboxProp(model.slice(12) as 'bongo');}
 else if(model.startsWith('hex:')){const {makeHexAsset}=await import('./models/hex-legacy');const handle=makeHexAsset(model.slice(4));root=handle.root;update=handle.update;}
 else if(model.startsWith('brain:')){root=makeBrainCreature(model.slice(6) as 'pongo');update=(t,dt,m)=>animateCreature(root,t,m,dt);}
 else if(model.startsWith('book:')){root=fixture('book');root.userData.bookId=model.slice(5);}
 else if(model.startsWith('fixture:'))root=fixture(model.slice(8));
 else if(model.startsWith('loose:')){root=makeLooseProp(model.slice(6));update=(t,dt,m)=>animateLoose(root,t,dt,m?3:1);}
 else if(model.startsWith('specimen:')||model.startsWith('chair:')){const chair=makeSpecimen(model.split(':')[1] as SpecimenKind,0);if(model.startsWith('chair:'))root=chair;else {root=chair.userData.animal;root.removeFromParent();const limbs:T.Object3D[]=[];root.traverse(o=>{if(/upper arm|forearm|thigh|shin|foot|hand/.test(o.name)){const center=new T.Box3().setFromObject(o).getCenter(new T.Vector3());o.children.forEach(child=>child.position.sub(center));o.position.copy(center);limbs.push(o);}});update=(t,dt,m)=>{limbs.forEach((o,i)=>o.rotation.x=Math.sin(t*6+i%2*Math.PI)*(m?.28:.025));chair.userData.head.rotation.y=Math.sin(t*.7)*.07;};}}
 else if(model==='cow'){const herd=makeHerd(()=>.5,1),cow=herd[0];root=cow.root;root.position.set(0,0,0);cow.origin.set(0,0,0);update=(t,dt,m)=>{const pos=root.position.clone();stepCow(cow,t,m?dt:0);root.position.copy(pos);};}
 else if(model==='living-brain'){const brain=makeHomeBrain(()=>{});root=brain.root;update=(_t,dt)=>brain.update(dt);dispose=brain.dispose;}
 else if(model==='evil-laser'){const laser=makeEvilLaser();root=laser.root;root.position.set(0,0,0);root.userData.fire=laser.trigger;update=(_t,dt)=>{laser.update(dt);};}
 else if(model.startsWith('legacy:')){const legacy=await import('./models/legacy-brain');const make=legacy[model.slice(7) as keyof typeof legacy] as (t:typeof T)=>T.Group;root=make(T);}
 else if(model.startsWith('town:')){const town=await import('./models/town');const id=model.slice(5);root=id==='penguin'?town.buildPenguin():id==='telescope-metal'?town.buildTelescope(true):town.buildBuildingModel(id,false);}
 else if(model==='home:tree')root=makeJungleTree(1);
 else if(model==='home:crystal')root=makeCrystalCluster(3);
 else if(model==='dream-tree')root=makeDreamTree(4);
 else if(model==='island'){const {buildLaunchIsland}=await import('../urf-3d/launch-island');root=buildLaunchIsland().group;}
 else if(model==='mushroom'){const {makeDreamscape}=await import('../brain-room/lib/dreamscape');const sky=makeDreamscape({mushroomOnly:true});root=sky.root;root.removeFromParent();root.position.set(0,0,0);update=(t)=>sky.update(t);dispose=sky.dispose;}
 else if(model==='urf-globe'){const {makeDreamscape}=await import('../brain-room/lib/dreamscape');const sky=makeDreamscape();root=sky.planet;root.removeFromParent();root.position.set(0,0,0);update=t=>sky.update(t);dispose=sky.dispose;}
 else if(model.startsWith('selector:')){const g=await import('../urf-3d/globe3d');const id=model.slice(9);root=id==='alien'?g.buildAlien(T).group:id==='moon'?g.buildMoon(T).group:id==='ufo'?g.buildUfo(T).group:id==='meteor'?g.buildMeteorTrail(T):id==='satellite'?g.buildSatellite(T).group:g.buildSatelliteUpgrade(T,id as 'thrusters') as T.Group;root.scale.setScalar(id==='alien'?1:5);}
 else if(model==='computer'){const {makeLab}=await import('../brain-room/lib/laboratory');root=makeLab([]).mainframe;root.removeFromParent();}
 else if(model.startsWith('furniture:')){const {makeLevel}=await import('../brain-room/lib/level');const level=makeLevel({lightweight:true,catalog:true});root=level.catalogParts[model.slice(10)];level.disposeBrainLife();level.dreamscape.dispose();}
 else if(model.startsWith('pickup:')){const map={mag:weapons.makeMagPickup,round:weapons.makeBulletMesh,banana:weapons.makeBananaPickup,monster:weapons.makeMonsterCanPickup,pepsi:weapons.makePepsiAmmoPickup,goldcan:weapons.makeGoldRatMeatPickup};const object=map[model.slice(7) as keyof typeof map]();root=new T.Group();root.add(object);}
 else if(model.startsWith('level:')){const {makeLevel}=await import('../brain-room/lib/level');const level=makeLevel({lightweight:true});root=model==='level:lab'?level.lab.root:level.root.getObjectByName('Red meadow barn') as T.Group;root.removeFromParent();const center=new T.Box3().setFromObject(root).getCenter(new T.Vector3());root.position.sub(center);level.disposeBrainLife();level.dreamscape.dispose();}
 else if(model.startsWith('fbx:')){const {FBXLoader}=await import('three/examples/jsm/loaders/FBXLoader.js');root=await new FBXLoader().loadAsync(model.slice(4));const size=new T.Box3().setFromObject(root).getSize(new T.Vector3());root.scale.setScalar(2.3/Math.max(size.x,size.y,size.z));}
 else if(model.startsWith('glb:')){const {GLTFLoader}=await import('three/examples/jsm/loaders/GLTFLoader.js');root=(await new GLTFLoader().loadAsync(model.slice(4))).scene;}
 else throw new Error('Unknown asset builder: '+asset.id);
 root.name=asset.label;root.scale.multiplyScalar(asset.scale??1);root.updateMatrixWorld(true);const customDispose=dispose;const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>();root.traverse(o=>{if(o instanceof T.Mesh){geometries.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));}});dispose=()=>{customDispose?.();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());};return {root,update,dispose};
}
