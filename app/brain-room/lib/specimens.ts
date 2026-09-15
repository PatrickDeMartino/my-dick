import {batchParts} from './batch-parts';
import * as T from 'three';
import {furMaterial} from './surface';
import {textTexture} from './lab-art';
export type SpecimenKind='baboon'|'gorilla'|'chimpanzee'|'yeti';
export function makeSpecimen(kind:SpecimenKind,index:number){
 const root=new T.Group();root.name=kind+' neural study chair';
 const config={baboon:{fur:0x826345,skin:0x765043,w:.42,h:.65,head:.41},gorilla:{fur:0x292b32,skin:0x45454d,w:.69,h:.72,head:.49},chimpanzee:{fur:0x403329,skin:0xba9986,w:.43,h:.64,head:.42},yeti:{fur:0xe1e9ed,skin:0x8eacbd,w:.68,h:.82,head:.53}}[kind];
 const fur=furMaterial(config.fur),skin=new T.MeshStandardMaterial({color:config.skin,roughness:.8}),eye=new T.MeshPhysicalMaterial({color:0x10121a,roughness:.14,clearcoat:1}),pale=new T.MeshStandardMaterial({color:0xe3d6b5});
 const steel=new T.MeshStandardMaterial({color:0x596c73,metalness:.75,roughness:.36}),cushion=new T.MeshStandardMaterial({color:0x273438,roughness:.95}),strap=new T.MeshStandardMaterial({color:0x83482a,roughness:.8});
 const sphere=new T.SphereGeometry(1,40,28);const animal=new T.Group();animal.name=kind+" test subject";root.add(animal);
 const part=(parent:T.Object3D,m:T.Material,p:number[],s:number[])=>{const o=new T.Mesh(sphere,m);o.position.set(p[0],p[1],p[2]);o.scale.set(s[0],s[1],s[2]);o.castShadow=o.receiveShadow=true;parent.add(o);return o;};
 const box=(p:number[],s:number[],m:T.Material)=>{const o=new T.Mesh(new T.BoxGeometry(s[0],s[1],s[2]),m);o.position.set(p[0],p[1],p[2]);o.castShadow=o.receiveShadow=true;root.add(o);return o;};
 const base=new T.Mesh(new T.CylinderGeometry(1.16,1.3,.19,6),steel);base.position.y=.095;root.add(base);
 box([0,.53,0],[.28,.9,.28],steel);box([0,.98,0],[1.5,.22,1.28],cushion);box([0,1.78,-.5],[1.52,1.7,.23],cushion);
 for(const side of [-1,1]){box([side*.81,1.32,0],[.18,.19,1.5],steel);box([side*.79,.82,.44],[.11,1,.12],steel);}
 const body=new T.Group();animal.add(body);part(body,fur,[0,1.58,-.08],[config.w,config.h,.37]);part(body,skin,[0,1.6,.266],[config.w*.66,config.h*.58,.055]);
 const head=new T.Group();head.position.set(0,2.26+(kind==='yeti'?.2:0),0);animal.add(head);
 const skull=new T.Mesh(new T.SphereGeometry(1,32,22,0,Math.PI*2,.96,Math.PI-.96),fur);skull.scale.set(config.head,config.head*1.05,config.head*.91);head.add(skull);
 part(head,skin,[0,-.07,.28],[config.head*.76,.27,.15]);
 if(kind==='baboon'){
   part(head,skin,[0,-.12,.5],[.17,.18,.37]);part(head,skin,[0,-.16,.78],[.15,.08,.09]);
   for(const side of [-1,1]){part(head,fur,[side*.36,-.01,-.08],[.17,.34,.27]);part(head,eye,[side*.065,-.12,.856],[.033,.021,.01]);}
 }else{
   part(head,skin,[0,-.19,.38],[config.head*.65,.13,.15]);part(head,eye,[0,-.08,.452],[.115,.069,.033]);
   for(const side of [-1,1])part(head,eye,[side*.038,-.085,.48],[.024,.014,.018]);
 }
 for(const side of [-1,1]){
   const ex=side*(kind==='gorilla'?.18:.15);part(head,pale,[ex,.026,.35],[.077,.069,.034]);part(head,eye,[ex,.016,.381],[.039,.045,.018]);part(head,pale,[ex-.014,.035,.396],[.012,.012,.007]);
   part(head,fur,[ex,.11,.345],[.14,kind==='gorilla'?.065:.035,.055]);
   part(head,skin,[side*config.head,-.04,0],[kind==='chimpanzee'?.15:.09,.16,.065]);part(head,fur,[side*(config.head+.014),-.01,-.032],[kind==='chimpanzee'?.16:.11,.18,.046]);
   const joints=Array.from({length:6},(_,i)=>{const g=new T.Group();g.name=(side<0?'left':'right')+' '+['upper arm','forearm','hand','thigh','shin','foot'][i];animal.add(g);return g;});
   part(joints[0],fur,[side*(config.w+.1),1.68,.03],[.19,.35,.19]);part(joints[1],fur,[side*.68,1.4,.35],[.145,.14,.46]);part(joints[2],skin,[side*.68,1.39,.72],[.155,.09,.2]);
   for(let i=0;i<4;i++)part(joints[2],skin,[side*.68+(i-1.5)*.063,1.37,.87],[.026,.03,.1]);
   part(joints[3],fur,[side*.31,.93,.43],[.24,.22,.47]);part(joints[4],fur,[side*.36,.56,.74],[.145,.35,.15]);part(joints[5],skin,[side*.36,.26,.91],[.21,.105,.32]);
   for(let i=0;i<3;i++)part(joints[5],skin,[side*.36+(i-1)*.12,.25,1.16],[.065,.068,.115]);
   box([side*.68,1.42,.46],[.32,.05,.18],strap);box([side*.36,.5,.895],[.32,.16,.045],strap);
 }
 // Restraints cross the chest and buckle at the sternum, with no gore.
 for(const side of [-1,1]){const belt=box([side*.15,1.57,.31],[.105,1.08,.052],strap);belt.rotation.z=side*.48;}
 box([0,1.55,.36],[.19,.18,.05],steel);
 const brain=new T.MeshPhysicalMaterial({color:0xe2a4ad,roughness:.48,clearcoat:.32});
 if(typeof document!=='undefined'){brain.map=new T.TextureLoader().load('/brain-room/cortex.png');brain.map.colorSpace=T.SRGBColorSpace;brain.bumpMap=brain.map;brain.bumpScale=.018;}
 const dome=new T.Group();dome.position.y=.21;head.add(dome);
 for(const side of [-1,1]){
   part(dome,brain,[side*.14,.07,0],[config.head*.62,.26,config.head*.79]);
   for(let row=0;row<8;row++){
     const pts=Array.from({length:17},(_,k)=>{const a=k/16*Math.PI;const z=(row/7-.5)*config.head*1.24;return new T.Vector3(side*.14+Math.cos(a)*config.head*.53,.08+Math.sin(a)*.23*Math.sqrt(Math.max(.15,1-(z/(config.head*.85))**2)),z+Math.sin(k*.9+row*1.7)*.021);});
     dome.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),22,.026,8,false),brain));
   }
 }
 const collar=new T.Mesh(new T.TorusGeometry(config.head*.87,.027,8,40),steel);collar.rotation.x=Math.PI/2;collar.position.y=.23;head.add(collar);
 for(let i=0;i<5;i++){const chip=box([-.45+i*.22,2.98+(kind==='yeti'?.2:0),-.63],[.11,.06,.12],steel);chip.rotation.z=(i-2)*.1;}
 if(kind==='yeti')for(let i=0;i<24;i++){const a=i/24*Math.PI*2;part(head,fur,[Math.cos(a)*.48,-.11+Math.sin(a)*.25,-.09],[.08,.19,.1]).rotation.z=-a;}
 if(kind==='gorilla')part(body,fur,[0,1.93,-.22],[.65,.35,.31]);
 const label=new T.Mesh(new T.PlaneGeometry(1.6,.8),new T.MeshBasicMaterial({map:textTexture([`0${index+1} / ${kind.toUpperCase()}`,'NEURAL STUDY / LINKED'],'#abeedc','#15272e')}));label.position.set(0,.62,1.02);label.rotation.x=-.1;root.add(label);
 root.userData={head,body,animal};batchParts(root);return root;
}
