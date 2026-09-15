import fs from 'node:fs/promises';
// Embed source artwork into the headlessly exported room model.
const path=new URL('../public/brain-room/brain-room.glb',import.meta.url);
const source=await fs.readFile(path),jsonLength=source.readUInt32LE(12);
const doc=JSON.parse(source.subarray(20,20+jsonLength).toString('utf8'));
let bin=Buffer.from(source.subarray(28+jsonLength));
const pad=(buf,fill=0)=>Buffer.concat([buf,Buffer.alloc((4-buf.length%4)%4,fill)]);
doc.images??=[];doc.textures??=[];doc.samplers??=[];
const sampler=doc.samplers.length;doc.samplers.push({magFilter:9729,minFilter:9987,wrapS:10497,wrapT:10497});
for(const [file,mime,names] of [['cortex.png','image/png',['Cortex tissue','Cortex recesses']],['reference-art.jpg','image/jpeg',['Reference painting']]]){
  const bytes=await fs.readFile(new URL('../public/brain-room/'+file,import.meta.url));
  const view=doc.bufferViews.length;doc.bufferViews.push({buffer:0,byteOffset:bin.length,byteLength:bytes.length});bin=Buffer.concat([bin,pad(bytes)]);
  const image=doc.images.length;doc.images.push({bufferView:view,mimeType:mime});
  const texture=doc.textures.length;doc.textures.push({source:image,sampler});
  for(const material of doc.materials){if(names.includes(material.name))material.pbrMetallicRoughness.baseColorTexture={index:texture};}
}
doc.buffers[0].byteLength=bin.length;
const json=pad(Buffer.from(JSON.stringify(doc)),32),header=Buffer.alloc(20),binHeader=Buffer.alloc(8);
header.writeUInt32LE(0x46546c67,0);header.writeUInt32LE(2,4);header.writeUInt32LE(28+json.length+bin.length,8);header.writeUInt32LE(json.length,12);header.writeUInt32LE(0x4e4f534a,16);binHeader.writeUInt32LE(bin.length,0);binHeader.writeUInt32LE(0x004e4942,4);
await fs.writeFile(path,Buffer.concat([header,json,binHeader,bin]));
console.log('Brain room model embeds cortex texture and original framed artwork.');
