import assert from 'node:assert/strict';
import test from 'node:test';
import { createShuffle, safeMedia, tikTokId } from '../public/anubis-room/social-core.js';
await import('./compile-expansion.mjs');const {brainSurface}=await import('../work/expansion-check/lib/homeBrain.mjs');
import { Vector3 } from 'three';

test('shuffle visits all posts once and avoids bag-boundary repeats',()=>{
  const items=[{id:1},{id:2},{id:3}]; const next=createShuffle(items,()=>.4);
  const first=Array.from({length:3},next),second=Array.from({length:3},next);
  assert.equal(new Set(first).size,3);assert.equal(new Set(second).size,3);assert.notEqual(first[2],second[0]);
  assert.equal(createShuffle([])(),null);assert.equal(createShuffle([items[0]])(),items[0]);
});
test('feed accepts HTTPS or site assets and rejects executable URLs',()=>{
  assert.equal(safeMedia('javascript:alert(1)'),null);assert.equal(safeMedia('//bad.test/file'),null);assert.equal(safeMedia('/media/clip.mp4'),'/media/clip.mp4');
  assert.equal(tikTokId('https://www.tiktok.com/@patrick.demartino/video/123456789'),'123456789');assert.equal(tikTokId('https://evil.test/video/123456789'),null);
});
test('brain contact points and normals stay finite over the entire sphere',()=>{
  for(let i=0;i<500;i++) {
    const y=1-2*(i+.5)/500,a=i*2.399963229728653;
    const direction=new Vector3(Math.sqrt(1-y*y)*Math.cos(a),y,Math.sqrt(1-y*y)*Math.sin(a));
    const {point,normal}=brainSurface(direction);
    assert.ok(point.length()>.8&&point.length()<2);assert.ok(Math.abs(normal.length()-1)<1e-6);assert.ok(normal.dot(direction)>0);
    assert.ok(point.clone().normalize().distanceTo(direction)<1e-6);
  }
});
