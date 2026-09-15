import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';
import * as T from 'three';
const output=new URL('../work/urf-check/',import.meta.url);await fs.mkdir(output,{recursive:true});
for(const name of ['archery','launch-island','grok/alien','grok/weapons','grok/characters','grok/outline']){
  const source=await fs.readFile(new URL(`../app/urf-3d/${name}.ts`,import.meta.url),'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText.replace(/from "\.\/(characters|weapons|outline)"/g,'from "./$1.mjs"');
  await fs.mkdir(new URL(name.includes('/')?'grok/':'./',output),{recursive:true});await fs.writeFile(new URL(`${name}.mjs`,output),code);
}
const {launchVelocity,predictFlight,sphereContact,PLANET_CENTER,SHOT_STEP,SHOT_GRAVITY}=await import('../work/urf-check/archery.mjs');
const {buildLaunchIsland}=await import('../work/urf-check/launch-island.mjs');
const {createAlien}=await import('../work/urf-check/grok/alien.mjs');
const origin=new T.Vector3(-1.25,.38,1.65),radius=1.012;
let checks=0;
for(const offset of [new T.Vector3(),new T.Vector3(.9,-.4,.7)]){
 const center=PLANET_CENTER.clone().add(offset);
 for(const direction of [new T.Vector3(-.55,0,.84),new T.Vector3(0,.7,.72),new T.Vector3(.25,-.3,.92)])for(const charge of [0,.5,1]){
  const target=center.clone().addScaledVector(direction.normalize(),radius),velocity=launchVelocity(origin,target,charge);
  const predicted=predictFlight(origin,velocity,center,radius);assert(predicted.hit,'reachable target has a predicted impact');
  for(const fps of [24,30,60,144]){
   const p=origin.clone(),v=velocity.clone();let hit=null;
   for(let frame=0;frame<fps*7&&!hit;frame++){let remaining=1/fps;while(remaining>1e-5&&!hit){const dt=Math.min(remaining,SHOT_STEP);remaining-=dt;const before=p.clone();v.y+=SHOT_GRAVITY*dt;p.addScaledVector(v,dt);hit=sphereContact(before,p,center,radius);}}
   assert(hit,'actual arrow must hit');assert(hit.distanceTo(predicted.hit)<.012,'preview must agree with actual impact at every frame rate');checks++;
  }
 }
}
assert.equal(sphereContact(new T.Vector3(-2,2,0),new T.Vector3(2,2,0),new T.Vector3(),1),null,'a miss must not select land');
assert(sphereContact(new T.Vector3(-4,0,0),new T.Vector3(4,0,0),new T.Vector3(),1)?.distanceTo(new T.Vector3(-1,0,0))<1e-6,'fast arrows must not tunnel through planet');
const planet=new T.Group();planet.position.copy(PLANET_CENTER);planet.rotation.set(.4,-1.1,.3);planet.updateMatrixWorld();
const local=new T.Vector3(.4,.5,.6).normalize();const world=planet.localToWorld(local.clone());assert(planet.worldToLocal(world).distanceTo(local)<1e-8,'translated and rotated land coordinates round-trip');
const island=buildLaunchIsland();const box=new T.Box3().setFromObject(island.group);assert(box.min.y<-.8&&box.max.y>.65,'island has deep rock and tall mushrooms');let meshes=0;island.group.traverse(o=>{if(o instanceof T.Mesh)meshes++;});assert(meshes<70,'island batches spiral tiles');
for(const kind of ['zix','pip','vex']){const rig=createAlien(kind);assert(rig.bow.root.name==='bow');assert(rig.armL&&rig.armR&&rig.forearmL&&rig.forearmR);assert(rig.bow.root.children.some(o=>o instanceof T.Line),'game bow includes string');assert(rig.bow.root.children.some(o=>o instanceof T.Group),'game bow includes nocked arrow');}
console.log(`${checks} trajectory/frame-rate checks passed; misses, tunneling, transformed coordinates, island geometry and all 3 game rigs passed.`);
