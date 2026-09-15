import * as T from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
/** Batch stationary sibling meshes while keeping animated joints as groups. */
export function batchParts(root:T.Object3D,keep:T.Object3D[]=[]){
 for(const child of [...root.children])if(child instanceof T.Group&&!keep.includes(child))batchParts(child,keep);
 const buckets=new Map<T.Material,T.Mesh[]>();
 for(const child of root.children)if(child instanceof T.Mesh&&!(child instanceof T.InstancedMesh)&&!Array.isArray(child.material)&&child.material.visible&&!keep.includes(child)){const list=buckets.get(child.material)||[];list.push(child);buckets.set(child.material,list);}
 for(const [material,meshes] of buckets){if(meshes.length<2)continue;const geos=meshes.map(m=>{m.updateMatrix();const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();g.applyMatrix4(m.matrix);return g;});const geometry=mergeGeometries(geos);geos.forEach(g=>g.dispose());if(!geometry)continue;const joined=new T.Mesh(geometry,material);joined.castShadow=meshes.some(m=>m.castShadow);joined.receiveShadow=meshes.some(m=>m.receiveShadow);meshes.forEach(m=>root.remove(m));root.add(joined);}
}
