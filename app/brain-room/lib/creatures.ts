import * as T from 'three';
import {furMaterial} from './surface';
export type BrainSubject='pongo'|'rat'|null;
function ellipsoid(parent:T.Object3D,mat:T.Material,p:number[],s:number[]){const o=new T.Mesh(new T.SphereGeometry(1,28,20),mat);o.position.set(p[0],p[1],p[2]);o.scale.set(s[0],s[1],s[2]);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
function joint(parent:T.Object3D,p:number[],name:string){const o=new T.Group();o.name=name;o.position.set(p[0],p[1],p[2]);parent.add(o);return o;}
function tube(parent:T.Object3D,mat:T.Material,points:T.Vector3[],radius:number){const o=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),24,radius,7,false),mat);parent.add(o);return o;}
function makeRat(){
  const root=new T.Group();root.name='Lab rat — curious little marshmallow';
  const fur=furMaterial(0xf2eee5),pink=new T.MeshStandardMaterial({color:0xeaa5b0,roughness:.58}),inner=new T.MeshStandardMaterial({color:0xc8798c,roughness:.65}),black=new T.MeshPhysicalMaterial({color:0x1b121b,roughness:.13,clearcoat:1}),white=new T.MeshBasicMaterial({color:0xffffff});
  const torso=ellipsoid(root,fur,[0,.18,0],[.16,.131,.24]);
  const head=joint(root,[0,.2,.22],'Head');ellipsoid(head,fur,[0,0,0],[.105,.1,.105]);
  ellipsoid(head,fur,[0,-.025,.08],[.065,.056,.074]);ellipsoid(head,pink,[0,-.027,.14],[.038,.024,.026]).name='Oval pink nose';
  const ears:T.Group[]=[];
  for(const side of [-1,1]){
    const ear=joint(head,[side*.087,.073,-.025],'Cupped ear');ear.rotation.y=side*.4;
    ellipsoid(ear,fur,[0,0,0],[.069,.081,.021]);ellipsoid(ear,pink,[0,.001,.014],[.057,.067,.014]);ellipsoid(ear,inner,[side*.008,-.025,.025],[.021,.024,.008]);ears.push(ear);
    ellipsoid(head,black,[side*.071,.024,.075],[.029,.035,.027]);ellipsoid(head,white,[side*.071-.007,.034,.097],[.009,.011,.005]);ellipsoid(head,white,[side*.071+.009,.012,.098],[.003,.004,.002]);
    for(let i=0;i<4;i++)tube(head,new T.MeshStandardMaterial({color:0xb3a0a0,roughness:.75}),[new T.Vector3(side*.027,-.029+i*.004,.118),new T.Vector3(side*.087,-.016+(i-1.5)*.017,.13),new T.Vector3(side*(.17+i*.008),-.02+(i-1.5)*.024,.10-i*.016)],.0012);
  }
  const limbs:T.Group[]=[];
  for(const x of [-.12,.12])for(const z of [-.13,.13]){
    const leg=joint(root,[x,.13,z],'Paw joint');ellipsoid(leg,fur,[0,-.035,0],[.027,.054,.027]);ellipsoid(leg,pink,[0,-.085,.024],[.029,.014,.044]);
    for(let i=0;i<3;i++)ellipsoid(leg,pink,[(i-1)*.012,-.085,.058],[.005,.007,.015]);limbs.push(leg);
  }
  const tail:T.Group[]=[];let parent:T.Object3D=root;
  for(let i=0;i<12;i++){const bone=joint(parent,i===0?[0,.12,-.20]:[0,0,-.037],`Tail joint ${i}`);ellipsoid(bone,pink,[0,0,-.02],[.012*(1-i/14),.012*(1-i/14),.023]);tail.push(bone);parent=bone;}
  root.scale.setScalar(2.4);root.userData={kind:'rat',torso,head,limbs,tail,ears,walk:0,vy:0};return root;
}
export function makeBrainCreature(kind:Exclude<BrainSubject,null>){
  if(kind==='rat')return makeRat();
  const root=new T.Group();root.name='Pongo — peanut orangutan';
  const fur=furMaterial(0xb55a27),skin=new T.MeshStandardMaterial({color:0x875342,roughness:.82}),face=new T.MeshStandardMaterial({color:0xbf9070,roughness:.8}),dark=new T.MeshPhysicalMaterial({color:0x23130f,roughness:.2,clearcoat:.55}),white=new T.MeshStandardMaterial({color:0xffe9cd});
  const torso=ellipsoid(root,fur,[0,1.19,0],[.59,1.02,.46]);ellipsoid(root,fur,[0,.81,.035],[.61,.56,.49]);ellipsoid(root,skin,[0,1.13,.42],[.33,.64,.055]);
  const head=joint(root,[0,2.03,.02],'Pill head');ellipsoid(head,fur,[0,0,0],[.49,.66,.43]);ellipsoid(head,face,[0,-.07,.335],[.38,.42,.12]);
  for(const side of [-1,1]){
    ellipsoid(head,skin,[side*.345,-.11,.31],[.16,.23,.14]);ellipsoid(head,white,[side*.163,.08,.437],[.105,.117,.038]);ellipsoid(head,dark,[side*.174,.066,.47],[.053,.065,.025]);ellipsoid(head,white,[side*.174-.018,.092,.49],[.015,.018,.007]);
    ellipsoid(head,fur,[side*.165,.211,.414],[.145,.037,.049]).rotation.z=side*.12;ellipsoid(head,skin,[side*.45,.025,.03],[.082,.14,.075]);
  }
  ellipsoid(head,skin,[0,-.102,.469],[.144,.077,.09]);for(const side of [-1,1])ellipsoid(head,dark,[side*.052,-.114,.546],[.026,.014,.009]);
  ellipsoid(head,dark,[0,-.259,.443],[.105,.08,.032]);ellipsoid(head,face,[0,-.28,.458],[.112,.029,.023]);for(const side of [-1,1])ellipsoid(head,white,[side*.035,-.219,.468],[.032,.028,.013]);
  for(let i=0;i<7;i++)ellipsoid(head,fur,[(i-3)*.065,.58+Math.sin(i)*.02,-.005],[.046,.15,.045]).rotation.z=(i-3)*-.1;
  const limbs:T.Group[]=[];
  for(const side of [-1,1]){
    const shoulder=joint(root,[side*.53,1.77,0],side<0?'Left shoulder':'Right shoulder');ellipsoid(shoulder,fur,[side*.05,-.4,0],[.17,.47,.17]);
    const elbow=joint(shoulder,[side*.06,-.81,0],'Elbow');ellipsoid(elbow,fur,[0,-.35,.01],[.13,.4,.13]);ellipsoid(elbow,skin,[0,-.76,.05],[.16,.16,.13]);
    for(let i=0;i<4;i++)ellipsoid(elbow,skin,[(i-1.5)*.058,-.85,.11],[.028,.105,.035]);
    const hip=joint(root,[side*.29,.79,0],'Short leg hip');ellipsoid(hip,fur,[0,-.17,0],[.16,.22,.17]);
    const knee=joint(hip,[0,-.34,0],'Knee');ellipsoid(knee,fur,[0,-.13,.012],[.115,.18,.12]);ellipsoid(knee,skin,[0,-.285,.105],[.15,.075,.225]);
    for(let i=0;i<4;i++)ellipsoid(knee,skin,[(i-1.5)*.06,-.29,.29],[.031,.047,.069]);limbs.push(shoulder,elbow,hip,knee);
  }
  root.scale.setScalar(.62);root.userData={kind,torso,head,limbs,walk:0,vy:0};return root;
}
export function animateCreature(root:T.Group,time:number,moving:boolean,dt:number){
  const {kind,limbs,head,tail,ears}=root.userData,blend=1-Math.exp(-dt*14),phase=time*(kind==='pongo'?6:11),s=Math.sin(phase);
  if(kind==='pongo'){
    // Paired knuckle/crutch bound: both arms plant together, short legs follow.
    for(let side=0;side<2;side++){const index=side*4,targets=moving?[s*.48,-.2-Math.max(0,-s)*.4,-s*.27,.16+Math.max(0,s)*.2]:[.02,-.12,0,.1];for(let i=0;i<4;i++)limbs[index+i].rotation.x=T.MathUtils.lerp(limbs[index+i].rotation.x,targets[i],blend);limbs[index].rotation.z=side===0?-.11:.11;}
    head.rotation.z=Math.sin(time*1.7)*.045;head.rotation.x=moving?Math.sin(phase)*.065:Math.sin(time)*.025;
  }else{
    limbs.forEach((l:T.Group,i:number)=>l.rotation.x=T.MathUtils.lerp(l.rotation.x,moving?Math.sin(phase+[0,Math.PI,Math.PI,0][i])*.35:0,blend));
    tail.forEach((bone:T.Group,i:number)=>{bone.rotation.y=Math.sin(time*3-i*.4)*(.08+i*.011);bone.rotation.x=.025+Math.sin(time*2-i*.31)*.025;});ears.forEach((ear:T.Group,i:number)=>ear.rotation.z=Math.sin(time*4+i*2)*.065);head.rotation.y=Math.sin(time*1.6)*.06;
  }
}
