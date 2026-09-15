import * as T from 'three';
import type {Solid} from './level';
export type WallPiece={mesh:T.Mesh;solid:Solid;center:T.Vector3;dead:boolean;batch:T.InstancedMesh;index:number};
export class BreakableWalls{
 pieces:WallPiece[]=[];
 constructor(public solids:Solid[],public parent:T.Group){}
 add(position:number[],size:number[],material:T.Material,worldOffset=new T.Vector3()){
  const thinX=size[0]<size[2],width=thinX?size[2]:size[0],height=size[1],columns=Math.max(1,Math.ceil(width/1.15)),rows=Math.max(1,Math.ceil(height/1.05)),w=width/columns,h=height/rows;
  const batch=new T.InstancedMesh(new T.BoxGeometry(1,1,1),material,columns*rows);batch.castShadow=batch.receiveShadow=true;this.parent.add(batch);const dummy=new T.Object3D();
  for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){const s=thinX?[size[0],h,w]:[w,h,size[2]];const p=new T.Vector3(...position as [number,number,number]);p.y+=(row+.5)*h-height/2;if(thinX)p.z+=(col+.5)*w-width/2;else p.x+=(col+.5)*w-width/2;const mesh=new T.Mesh(new T.BoxGeometry(...s as [number,number,number]),material);mesh.position.copy(p);mesh.castShadow=mesh.receiveShadow=true;dummy.position.copy(p);dummy.scale.set(...s as [number,number,number]);dummy.updateMatrix();batch.setMatrixAt(row*columns+col,dummy.matrix);const center=p.clone().add(worldOffset);const solid={center,half:new T.Vector3(...s as [number,number,number]).multiplyScalar(.5)};this.solids.push(solid);this.pieces.push({mesh,solid,center,dead:false,batch,index:row*columns+col});}
 }
 hit(point:T.Vector3,radius:number,energy:number){if(energy<6)return [];const impact=this.pieces.find(p=>!p.dead&&Math.abs(point.x-p.center.x)<p.solid.half.x+radius&&Math.abs(point.y-p.center.y)<p.solid.half.y+radius&&Math.abs(point.z-p.center.z)<p.solid.half.z+radius);if(!impact)return [];const removed:WallPiece[]=[];for(const p of this.pieces){if(p.dead||p.center.distanceTo(impact.center)>1.9)continue;p.dead=true;p.mesh.visible=false;p.batch.setMatrixAt(p.index,new T.Matrix4().makeScale(0,0,0));p.batch.instanceMatrix.needsUpdate=true;const i=this.solids.indexOf(p.solid);if(i>=0)this.solids.splice(i,1);removed.push(p);}return removed;}
 repair(){for(const p of this.pieces)if(p.dead){p.dead=false;p.mesh.visible=true;const m=new T.Matrix4().compose(p.mesh.position,new T.Quaternion(),p.solid.half.clone().multiplyScalar(2));p.batch.setMatrixAt(p.index,m);p.batch.instanceMatrix.needsUpdate=true;this.solids.push(p.solid);}}
}
