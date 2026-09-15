import * as T from 'three';
import {furMaterial} from './surface';
import {makeDrBongo} from './bongo';
export type BrainSubject='pongo'|'rat'|'bongo'|null;
function ellipsoid(parent:T.Object3D,mat:T.Material,p:number[],s:number[]){const o=new T.Mesh(new T.SphereGeometry(1,40,28),mat);o.position.set(p[0],p[1],p[2]);o.scale.set(s[0],s[1],s[2]);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
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
 if(kind==='rat')return makeRat();if(kind==='bongo')return makeDrBongo();
 const root=new T.Group();root.name='Pongo — lanky banana bean';
 const fur=furMaterial(0xa65525),skin=new T.MeshStandardMaterial({color:0x9c7352,roughness:.86}),face=new T.MeshStandardMaterial({color:0xc49e71,roughness:.83}),dark=new T.MeshPhysicalMaterial({color:0x21150f,roughness:.2}),white=new T.MeshStandardMaterial({color:0xffe5b0});
 const profile=[new T.Vector2(0,.28),new T.Vector2(.22,.35),new T.Vector2(.36,.65),new T.Vector2(.35,1.05),new T.Vector2(.31,1.5),new T.Vector2(.30,1.95),new T.Vector2(.29,2.26),new T.Vector2(.21,2.49),new T.Vector2(0,2.59)];
 const geometry=new T.LatheGeometry(new T.SplineCurve(profile).getPoints(64),64);const pos=geometry.getAttribute('position');for(let i=0;i<pos.count;i++){const y=pos.getY(i);pos.setZ(i,pos.getZ(i)*.86+.12*Math.sin(y*1.2));}geometry.computeVertexNormals();
 const torso=new T.Mesh(geometry,fur);torso.castShadow=torso.receiveShadow=true;root.add(torso);
 ellipsoid(root,skin,[0,1.29,.345],[.2,.67,.035]);
 const head=joint(root,[0,2.15,.05],'Dopey face');ellipsoid(head,face,[0,-.02,.255],[.265,.3,.087]);
 for(const side of [-1,1]){
  ellipsoid(head,dark,[side*.13,.061,.348],[.095,.107,.085]);ellipsoid(head,white,[side*.13-.025,.098,.418],[.023,.028,.014]);ellipsoid(head,white,[side*.13+.022,.033,.423],[.008,.009,.006]);
  ellipsoid(head,fur,[side*.12,.16,.33],[.105,.024,.035]).rotation.z=side*.09;
  ellipsoid(head,skin,[side*.29,-.01,.045],[.066,.105,.055]);
  ellipsoid(head,fur,[side*.256,-.17,.22],[.064,.19,.07]).rotation.z=side*.14;
 }
 ellipsoid(head,skin,[0,-.079,.357],[.108,.065,.087]);for(const side of [-1,1])ellipsoid(head,dark,[side*.043,-.096,.432],[.023,.012,.008]);
 const grin=tube(head,dark,[new T.Vector3(-.17,-.18,.32),new T.Vector3(-.06,-.21,.344),new T.Vector3(.09,-.21,.343),new T.Vector3(.18,-.16,.32)],.016);
 ellipsoid(head,white,[.065,-.204,.351],[.032,.031,.008]);ellipsoid(head,skin,[0,-.26,.265],[.14,.055,.066]);
 for(let i=0;i<5;i++)ellipsoid(root,fur,[(i-2)*.066,2.51+Math.sin(i)*.025,.035],[.038,.13,.038]).rotation.z=(i-2)*-.17;
 const tongue:T.Group[]=[],tongueVelocity:number[]=[];let tongueParent:T.Object3D=head;const tongueMat=new T.MeshPhysicalMaterial({color:0xee879e,roughness:.36,clearcoat:.6});for(let i=0;i<6;i++){const bone=joint(tongueParent,i===0?[.035,-.19,.36]:[0,-.026,.018],'Floppy tongue '+i);ellipsoid(bone,tongueMat,[0,-.012,.008],[.041-i*.003,.025,.018]);tongue.push(bone);tongueVelocity.push(0);tongueParent=bone;}
 const limbs:T.Group[]=[];
 for(const side of [-1,1]){
  const shoulder=joint(root,[side*.32,1.83,.035],'Shoulder');ellipsoid(shoulder,fur,[side*.04,-.4,0],[.115,.45,.115]);
  const elbow=joint(shoulder,[side*.04,-.8,0],'Elbow');ellipsoid(elbow,fur,[0,-.35,0],[.095,.4,.095]);ellipsoid(elbow,skin,[0,-.75,.05],[.13,.12,.1]);
  for(let i=0;i<4;i++)ellipsoid(elbow,skin,[(i-1.5)*.048,-.84,.10],[.022,.095,.03]);
  const hip=joint(root,[side*.18,.78,0],'Short hip');ellipsoid(hip,fur,[0,-.17,0],[.115,.22,.12]);const knee=joint(hip,[0,-.34,0],'Knee');ellipsoid(knee,fur,[0,-.13,.012],[.085,.18,.085]);ellipsoid(knee,skin,[0,-.285,.105],[.12,.065,.21]);
  for(let i=0;i<3;i++)ellipsoid(knee,skin,[(i-1)*.059,-.29,.285],[.028,.04,.06]);limbs.push(shoulder,elbow,hip,knee);
 }
 root.scale.setScalar(.67);root.userData={kind,torso,head,limbs,tongue,tongueVelocity,walk:0,vy:0};return root;
}
export function animateCreature(root:T.Group,time:number,moving:boolean,dt:number){
  const {kind,limbs,head,tail,ears}=root.userData,blend=1-Math.exp(-dt*14),phase=time*(kind==='rat'?11:6),s=Math.sin(phase);
  if(kind==='pongo'||kind==='bongo'){
    // Paired knuckle/crutch bound: both arms plant together, short legs follow.
    for(let side=0;side<2;side++){const index=side*4,targets=moving?[s*.48,-.2-Math.max(0,-s)*.4,-s*.27,.16+Math.max(0,s)*.2]:[.02,-.12,0,.1];for(let i=0;i<4;i++)limbs[index+i].rotation.x=T.MathUtils.lerp(limbs[index+i].rotation.x,targets[i],blend);limbs[index].rotation.z=side===0?-.11:.11;}
    if(root.userData.tongue)root.userData.tongue.forEach((bone:T.Group,i:number)=>{const target=Math.sin(time*(moving?9:2.4)-i*.7)*(moving?.35:.055);root.userData.tongueVelocity[i]+=((target-bone.rotation.x)*48-root.userData.tongueVelocity[i]*7)*dt;bone.rotation.x+=root.userData.tongueVelocity[i]*dt;bone.rotation.z=Math.sin(time*2.6-i*.8)*.08;});
    head.rotation.z=Math.sin(time*1.7)*.045;head.rotation.x=moving?Math.sin(phase)*.065:Math.sin(time)*.025;
  }else{
    limbs.forEach((l:T.Group,i:number)=>l.rotation.x=T.MathUtils.lerp(l.rotation.x,moving?Math.sin(phase+[0,Math.PI,Math.PI,0][i])*.35:0,blend));
    tail.forEach((bone:T.Group,i:number)=>{bone.rotation.y=Math.sin(time*3-i*.4)*(.08+i*.011);bone.rotation.x=.025+Math.sin(time*2-i*.31)*.025;});ears.forEach((ear:T.Group,i:number)=>ear.rotation.z=Math.sin(time*4+i*2)*.065);head.rotation.y=Math.sin(time*1.6)*.06;
  }
}
