import {batchParts} from './batch-parts';
import * as T from 'three';
import type {Solid} from './level';
import {makeSpecimen,type SpecimenKind} from './specimens';
import {makeDrBongo} from './bongo';
import {textTexture,screenTexture} from './lab-art';
export const LAB_CENTER=new T.Vector3(-12,0,-57);
export const LAB_ENTRY=new T.Vector3(-12,.48,-61);
export const COMPUTER_POINT=new T.Vector3(-12,.5,-64);
export function makeLab(solids:Solid[]){
 const root=new T.Group();root.name='Bongo laboratory warehouse';root.position.copy(LAB_CENTER);
 const metal=new T.MeshStandardMaterial({color:0x35434c,metalness:.55,roughness:.48}),plaster=new T.MeshStandardMaterial({color:0x9fa9a8,roughness:.91}),dark=new T.MeshStandardMaterial({color:0x18242a,roughness:.6}),orange=new T.MeshStandardMaterial({color:0xe08a37,emissive:0xb34c0a,emissiveIntensity:.3});
 const glow=new T.MeshBasicMaterial({color:0xa7f1e4});
 const box=(p:number[],s:number[],m:T.Material,solid=false)=>{const mesh=new T.Mesh(new T.BoxGeometry(...s as [number,number,number]),m);mesh.position.set(...p as [number,number,number]);mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);if(solid)solids.push({center:mesh.position.clone().add(LAB_CENTER),half:new T.Vector3(...s as [number,number,number]).multiplyScalar(.5)});return mesh;};
 box([0,.04,0],[32,.16,26],new T.MeshStandardMaterial({color:0x64716e,roughness:.88}),true);
 box([-16,5,0],[.45,10,26],plaster,true);box([16,5,0],[.45,10,26],plaster,true);box([0,5,-13],[32,10,.45],plaster,true);
 box([-9.6,5,13],[12.8,10,.45],plaster,true);box([9.6,5,13],[12.8,10,.45],plaster,true);box([0,8,13],[6.4,4,.45],plaster,true);
 box([0,10.2,0],[33,.45,27],metal,true);
 for(const x of [-14,-7,0,7,14])box([x,9.8,0],[.18,.34,26],metal);
 for(const z of [-10,0,10]){box([0,9.1,z],[29,.12,.12],metal);box([0,8.99,z],[18,.08,.13],glow);const light=new T.PointLight(0xb9e4d9,110,22,2);light.position.set(0,7.6,z);root.add(light);}
 for(const x of [-15.6,15.6])for(const z of [-11,0,11])box([x,5,z],[.3,10,.3],metal);
 // Hexagonal floor inlays and a clear orange route to the computer.
 const hexGeo=new T.CylinderGeometry(1.08,1.08,.015,6),hexMat=new T.MeshStandardMaterial({color:0x526360,roughness:.9});
 const tiles=new T.InstancedMesh(hexGeo,hexMat,190);let n=0;const dummy=new T.Object3D();
 for(let r=-6;r<=6;r++)for(let c=-7;c<=7;c++){if(n>=190)break;dummy.position.set(c*2.05+(r%2)*1.025,.13,r*1.7);dummy.updateMatrix();tiles.setMatrixAt(n++,dummy.matrix);}tiles.count=n;root.add(tiles);
 for(const x of [-2.9,2.9])box([x,.155,0],[.07,.025,24],orange);
 const sign=(lines:string[],p:number[],w:number,h:number,rotation=0)=>{const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:textTexture(lines)}));m.position.set(...p as [number,number,number]);m.rotation.y=rotation;root.add(m);return m;};
 sign(['BONGO / NEURAL RESEARCH','ENTER THROUGH THE CENTRAL BAY'],[0,7.4,13.27],8,3);
 const equations=[['NEURAL DYNAMICS','i h dψ/dt = Hψ','∇²φ = 4πGρ','E = mc²','S = k log Ω'],['COGNITION / FIELD NOTES','y = σ(Wx + b)','dV/dt = (I - gV)/C','Σ p(x) = 1','BANANAS → BIG IDEAS'],['QUANTUM MONKEY THEORY','∮ B · dl = μ₀I','F = ma','e^(iπ) + 1 = 0','DO NOT LICK THE ELECTRODES']];
 for(let i=0;i<3;i++){box([-15.66,4.6,-8+i*8],[.1,3.6,6.4],metal);sign(equations[i],[-15.58,4.6,-8+i*8],6,3.2,Math.PI/2);}
 const artMat=new T.MeshStandardMaterial({roughness:1});if(typeof document!=='undefined'){artMat.map=new T.TextureLoader().load('/brain-room/primate-studies.png');artMat.map.colorSpace=T.SRGBColorSpace;}
 for(const z of [-6,5]){box([15.65,5.2,z],[.13,3.6,7],metal);const art=new T.Mesh(new T.PlaneGeometry(6.6,3.3),artMat);art.position.set(15.56,5.2,z);art.rotation.y=-Math.PI/2;root.add(art);}
 const specimens:T.Group[]=[];(['baboon','gorilla','chimpanzee','yeti'] as SpecimenKind[]).forEach((kind,i)=>{const specimen=makeSpecimen(kind,i);specimen.position.set(i<2?-10:10,.14,i%2?-1.5:6.2);specimen.rotation.y=i<2?Math.PI/2:-Math.PI/2;root.add(specimen);specimens.push(specimen);solids.push({center:specimen.position.clone().add(LAB_CENTER).add(new T.Vector3(0,.8,0)),half:new T.Vector3(1.3,.9,1.3)});});
 // Mainframe: glassy CRT, smiling face, keyboards, switches and server towers.
 box([0,2.8,-10],[7.2,5.2,1.7],dark,true);box([0,3.25,-9.1],[6.3,3.5,.16],metal);
 const screen=new T.Mesh(new T.PlaneGeometry(5.8,2.9),new T.MeshBasicMaterial({map:screenTexture()}));screen.position.set(0,3.35,-8.98);root.add(screen);
 box([0,1.2,-7.9],[7,.3,2.3],metal,true);box([0,1.38,-7.45],[2.8,.1,.75],dark);
 const keyGeo=new T.BoxGeometry(.14,.07,.12),keys=new T.InstancedMesh(keyGeo,new T.MeshStandardMaterial({color:0xb8c4ac,roughness:.7}),72);n=0;
 for(let r=0;r<4;r++)for(let c=0;c<18;c++){dummy.position.set((c-8.5)*.146,1.47,-7.15-r*.145);dummy.updateMatrix();keys.setMatrixAt(n++,dummy.matrix);}root.add(keys);
 for(const x of [-6,6]){box([x,2.4,-10],[2.5,4.7,2.1],metal,true);for(let j=0;j<9;j++){box([x,.5+j*.45,-8.92],[2.1,.3,.035],dark);for(let k=0;k<4;k++)box([x-.8+k*.16,.5+j*.45,-8.89],[.055,.055,.035],j%3===0?orange:glow);}}
 const computerHitbox=box([0,1.65,-7.5],[3.2,1.1,1],new T.MeshBasicMaterial({visible:false}));computerHitbox.name='Bongo keyboard interaction';
 const bongo=makeDrBongo();bongo.position.set(4,.5,-6.6);bongo.rotation.y=-.3;root.add(bongo);
 sign(['DR. BONGO','NEURAL LINK / ONLINE'],[0,6.5,-12.68],9,2.2);
 batchParts(root,[bongo,screen,computerHitbox]);return {root,bongo,screen,specimens,computerHitbox};
}
