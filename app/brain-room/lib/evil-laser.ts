import * as T from 'three';
import {batchParts} from './batch-parts';
import {textTexture} from './lab-art';
/** Bongo's oversized coil cannon. Charge, discharge and cooldown are time-based. */
export function makeEvilLaser(){
 const root=new T.Group();root.name='Bongo Evil Science — Cortex Eraser';root.position.set(5,0,2);
 const steel=new T.MeshStandardMaterial({color:0x273139,metalness:.85,roughness:.3}),chrome=new T.MeshStandardMaterial({color:0xa5b8bc,metalness:.9,roughness:.22}),purple=new T.MeshStandardMaterial({color:0x462859,metalness:.65,roughness:.35}),yellow=new T.MeshStandardMaterial({color:0xffbc27,roughness:.55});
 const coreMat=new T.MeshStandardMaterial({color:0xb0ff79,emissive:0x6aff16,emissiveIntensity:.8,metalness:.2,roughness:.2});
 const add=(g:T.BufferGeometry,m:T.Material,p:number[],parent:T.Object3D=root)=>{const o=new T.Mesh(g,m);o.position.set(...p as [number,number,number]);o.castShadow=o.receiveShadow=true;parent.add(o);return o;};
 add(new T.CylinderGeometry(1.6,1.9,.45,12),steel,[0,.3,0]);add(new T.CylinderGeometry(1.2,1.45,.2,32),chrome,[0,.63,0]);add(new T.BoxGeometry(1.3,1.8,1.4),purple,[0,1.55,0]);
 for(const x of [-1,1]){add(new T.BoxGeometry(.3,2.3,1.3),steel,[x,1.9,0]);for(const y of [.9,1.35,1.8])add(new T.BoxGeometry(.32,.13,1.34),yellow,[x,y,0]);const pivot=add(new T.CylinderGeometry(.46,.46,.36,32),chrome,[x,2.8,0]);pivot.rotation.z=Math.PI/2;}
 const barrel=new T.Group();barrel.position.set(0,2.8,0);root.add(barrel);
 const tube=(r:number,l:number,z:number,m:T.Material)=>{const o=add(new T.CylinderGeometry(r,r,l,32,1,true),m,[0,0,z],barrel);o.rotation.x=Math.PI/2;return o;};
 tube(.52,4.5,1.15,steel);tube(.27,4.55,1.18,coreMat);const coils:T.Mesh[]=[];
 for(let i=0;i<9;i++){const ring=add(new T.TorusGeometry(.66,.095,12,40),i%2?chrome:coreMat,[0,0,-.7+i*.43],barrel);coils.push(ring);for(const a of [0,Math.PI/2,Math.PI,Math.PI*1.5]){const fin=add(new T.BoxGeometry(.16,.2,.3),purple,[Math.cos(a)*.76,Math.sin(a)*.76,-.7+i*.43],barrel);fin.rotation.z=a;}}
 tube(.83,.42,3.35,chrome);tube(.59,.47,3.36,steel);add(new T.TorusGeometry(.6,.08,12,40),coreMat,[0,0,3.61],barrel);
 for(const x of [-1.65,1.65]){add(new T.CapsuleGeometry(.36,1.65,10,24),purple,[x,1.65,-1.15]);add(new T.TorusGeometry(.37,.045,8,24),chrome,[x,1.65,-.79]);const path=new T.CatmullRomCurve3([new T.Vector3(x,.8,-1.15),new T.Vector3(x*1.4,.4,-1.8),new T.Vector3(x*.6,.45,-2),new T.Vector3(0,2.8,-1.2)]);add(new T.TubeGeometry(path,40,.09,10,false),steel,[0,0,0]);}
 const consoleBox=add(new T.BoxGeometry(1.4,1.4,.8),steel,[-2.3,.85,1.2]);consoleBox.rotation.y=-.3;
 const button=add(new T.CylinderGeometry(.23,.23,.1,24),new T.MeshStandardMaterial({color:0xff4035,emissive:0xff1800,emissiveIntensity:.7}),[-2.3,1.62,1.2]);button.name='Fire laser button';
 const label=add(new T.PlaneGeometry(2.8,.95),new T.MeshBasicMaterial({map:textTexture(['CORTEX ERASER','EVIL SCIENCE / FIRE'])}),[0,1.5,1.03]);
 const light=new T.PointLight(0x91ff48,0,12,2);light.position.set(0,2.8,3.4);root.add(light);
 const beamMat=new T.MeshBasicMaterial({color:0xaaff73,transparent:true,opacity:.8,depthWrite:false,blending:T.AdditiveBlending});const beam=add(new T.CylinderGeometry(.12,.12,55,20,1,true),beamMat,[0,0,31.15],barrel);beam.rotation.x=Math.PI/2;beam.visible=false;
 const halo=add(new T.SphereGeometry(.65,24,16),new T.MeshBasicMaterial({color:0xc3ff86,transparent:true,opacity:.7,blending:T.AdditiveBlending,depthWrite:false}),[0,0,3.6],barrel);halo.visible=false;
 const hitbox=add(new T.BoxGeometry(5,4,6),new T.MeshBasicMaterial({visible:false}),[0,2,1]);hitbox.name='Charge Cortex Eraser';
 batchParts(root,[barrel,button,label,hitbox]);let age=-1,fired=false;
 return {root,hitbox,get state(){return age<0?'ready':age<1.8?'charging':age<2.25?'firing':'cooling';},trigger(){if(age>=0)return false;age=0;fired=false;return true;},update(dt:number){let shot:T.Ray|null=null;if(age>=0){age+=Math.min(dt,.1);if(age>=1.8&&!fired){fired=true;root.updateWorldMatrix(true,true);shot=new T.Ray(barrel.localToWorld(new T.Vector3(0,0,3.65)),new T.Vector3(0,0,1).transformDirection(barrel.matrixWorld));}if(age>4.5)age=-1;}const charge=age<0?0:age<1.8?age/1.8:age<2.25?1:Math.max(0,1-(age-2.25)/1.2);coreMat.emissiveIntensity=.8+charge*5;light.intensity=charge*95;halo.visible=charge>.15;halo.scale.setScalar(.3+charge*.7);beam.visible=age>=1.8&&age<2.25;beamMat.opacity=.6+.2*Math.sin(age*70);barrel.position.z=age>=1.8&&age<2.7?-.25*Math.exp(-(age-1.8)*6):0;coils.forEach((c,i)=>{c.rotation.z+=dt*(.15+charge*2)*(i%2?1:-1);});return shot;}};
}
