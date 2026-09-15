import assert from 'node:assert/strict';
import * as T from 'three';
import fs from 'node:fs/promises';
await import('./brain-level.mjs');
const {makeBrainCreature,animateCreature}=await import('../work/expansion-check/brain-room/lib/creatures.mjs');
const {makeHerd,stepCow}=await import('../work/expansion-check/brain-room/lib/cows.mjs');
const pongo=makeBrainCreature('pongo');
for(let i=0;i<120;i++)animateCreature(pongo,i/60,true,1/60);
assert.equal(pongo.userData.limbs[0].rotation.x,pongo.userData.limbs[4].rotation.x,'Pongo arms move together');
assert.equal(pongo.userData.limbs[2].rotation.x,pongo.userData.limbs[6].rotation.x,'Pongo legs move together');
const rat=makeBrainCreature('rat');animateCreature(rat,2,true,1/60);assert(rat.userData.tail.length>=10);assert(rat.userData.tail[0].rotation.y!==rat.userData.tail[8].rotation.y);
const cows=makeHerd(()=>.4),cow=cows[0];
for(let i=0;i<1200;i++){
 stepCow(cow,i/60,1/60);cow.root.updateMatrixWorld(true);
 for(const knee of cow.knees){const hoof=knee.localToWorld(new T.Vector3(0,-.43,.035));assert(hoof.y>-.015,'cow hooves stay above meadow');assert(hoof.y<.3,'walking feet remain near ground');}
 for(const tail of cow.tail)assert(Number.isFinite(tail.rotation.z)&&Math.abs(tail.rotation.z)<.8,'spring tails remain bounded');
}
const glb=await fs.readFile(new URL('../public/brain-room/brain-room.glb',import.meta.url));assert.equal(glb.readUInt32LE(8),glb.length);
const doc=JSON.parse(glb.subarray(20,20+glb.readUInt32LE(12)).toString());
assert.equal(doc.images.length,2);for(const m of doc.materials.filter(m=>['Cortex tissue','Cortex recesses','Reference painting'].includes(m.name)))assert(m.pbrMetallicRoughness.baseColorTexture);
for(const view of doc.bufferViews)assert(view.byteOffset+view.byteLength<=doc.buffers[0].byteLength);
console.log('Paired Pongo gait, flexible rat tail, 1,200 cow joint steps and embedded brain model textures passed.');
