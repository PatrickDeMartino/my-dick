import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';
import * as T from 'three';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';

await import('./compile-expansion.mjs');
const {makeLevel,collide}=await import('../work/expansion-check/brain-room/lib/level.mjs');
const {makeBrainCreature}=await import('../work/expansion-check/brain-room/lib/creatures.mjs');
const {Ragdoll}=await import('../work/expansion-check/brain-room/lib/ragdoll.mjs');
const level=makeLevel();
assert.equal(level.cows.length,8);
assert(level.solids.length>15);
const blocked=new T.Vector3(-5.8,5,3),open=new T.Vector3(-6,5,0);
collide(blocked,.3,level.solids);assert(blocked.x>-5.5,'side wall must block passage');
collide(open,.3,level.solids);assert.equal(open.x,-6,'window must be physically open');
const floor=new T.Vector3(0,2.96,0),velocity=new T.Vector3(0,-4,0);
assert(collide(floor,.3,level.solids,velocity));assert(floor.y>=3.29);assert(velocity.y>=0);

for(const kind of ['pongo','rat','bongo']){
  const creature=makeBrainCreature(kind);const bounds=new T.Box3().setFromObject(creature);const height=bounds.max.y-bounds.min.y;
  // Simulate the actual capsule falling and jumping from the room through the arch.
  const p=new T.Vector3(-4.6,3.301,0),v=new T.Vector3(-3.4,7.8,0);let crossed=false;
  for(let i=0;i<180;i++){v.y-=18/60;p.addScaledVector(v,1/60);collide(p,.3,level.solids,v);for(const y of [height*.42,height*.76]){const upper=p.clone();upper.y+=y;const before=upper.clone();collide(upper,.3,level.solids,v);p.add(upper.sub(before));}if(p.x<-6.6)crossed=true;v.x=-3.4;}
  assert(crossed,`${kind} must pass through the window`);assert(p.y<1,`${kind} must land in meadow`);
  const scene=new T.Scene();scene.add(creature);creature.position.set(0,6,0);
  const rag=new Ragdoll(creature,scene,new T.Vector3(2,3,0));assert(rag.nodes.length>=6);
  for(let i=0;i<480;i++)rag.step(1/60,level.solids);
  for(const n of rag.nodes){assert(Number.isFinite(n.p.y));assert(n.p.y>2.8,'ragdoll must stay above room floor');}
  for(const l of rag.links)assert(Math.abs(rag.nodes[l.a].p.distanceTo(rag.nodes[l.b].p)-l.length)<.25,'articulated joints must stay connected');
  rag.grabbed=0;rag.target.copy(rag.nodes[0].p).add(new T.Vector3(1,2,0));for(let i=0;i<60;i++)rag.step(1/60,level.solids);assert(rag.nodes[0].p.distanceTo(rag.target)<.3);rag.release();
  console.log(`${kind}: window jump, meadow landing, ragdoll drop, joints and grab passed`);
}
if(process.argv.includes('--export')){
  // Three's exporter uses FileReader even for a geometry-only binary glTF.
  globalThis.FileReader=class{result;onloadend;readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}readAsDataURL(blob){blob.arrayBuffer().then(result=>{this.result=`data:${blob.type};base64,${Buffer.from(result).toString('base64')}`;this.onloadend?.();});}};
  const exporter=new GLTFExporter();
  const binary=await exporter.parseAsync(makeLevel({lightweight:true}).room,{binary:true,onlyVisible:true});
  assert(binary instanceof ArrayBuffer);const file=new URL('../public/brain-room/brain-room.glb',import.meta.url);await fs.writeFile(file,Buffer.from(binary));
  const bytes=await fs.readFile(file);assert.equal(bytes.readUInt32LE(0),0x46546c67);assert.equal(bytes.readUInt32LE(8),bytes.length);
  console.log(`Exported reusable brain room GLB: ${(bytes.length/1024/1024).toFixed(1)} MB`);
}
console.log('Brain level checks passed');
