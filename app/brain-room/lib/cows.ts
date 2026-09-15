import * as T from 'three';
import {cowHide} from './surface';
export type Cow={root:T.Group;legs:T.Bone[];knees:T.Bone[];tail:T.Bone[];head:T.Bone;ears:T.Bone[];spring:number[];phase:number;origin:T.Vector3;travel:number;stride:number};
export function makeHerd(random:()=>number){
  const hide=cowHide(),white=new T.MeshStandardMaterial({color:0xeee7d7,roughness:.85}),black=new T.MeshStandardMaterial({color:0x242126,roughness:.65}),pink=new T.MeshStandardMaterial({color:0xd99a99,roughness:.7}),horn=new T.MeshStandardMaterial({color:0xd3bd99,roughness:.7});
  const sphere=new T.SphereGeometry(1,36,24);
  const part=(parent:T.Object3D,m:T.Material,p:number[],s:number[])=>{const mesh=new T.Mesh(sphere,m);mesh.position.set(p[0],p[1],p[2]);mesh.scale.set(s[0],s[1],s[2]);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;};
  const bone=(parent:T.Object3D,p:number[],name:string)=>{const b=new T.Bone();b.position.set(p[0],p[1],p[2]);b.name=name;parent.add(b);return b;};
  const cows:Cow[]=[];
  for(let i=0;i<8;i++){
    const root=new T.Group();root.name=`Pasture cow ${i+1}`;root.position.set(-17-random()*23,0,-10+random()*27);
    part(root,hide,[0,1.16,0],[.63,.61,1.13]);part(root,hide,[0,1.33,.8],[.37,.45,.46]);
    const head=bone(root,[0,1.42,1.06],'Neck and head');part(head,hide,[0,0,.12],[.3,.39,.34]);part(head,pink,[0,-.15,.4],[.3,.18,.18]);
    const ears:T.Bone[]=[];
    for(const side of [-1,1]){
      part(head,black,[side*.245,.09,.3],[.06,.067,.047]);part(head,white,[side*.25,.11,.338],[.017,.018,.008]);part(head,black,[side*.14,-.12,.55],[.048,.025,.016]);
      const ear=bone(head,[side*.29,.23,.01],'Ear');ear.rotation.z=-side*.2;part(ear,hide,[side*.12,0,0],[.22,.073,.12]);part(ear,pink,[side*.13,.031,.045],[.15,.024,.067]);ears.push(ear);
      const tip=new T.Mesh(new T.ConeGeometry(.062,.29,12),horn);tip.position.set(side*.19,.45,.025);tip.rotation.z=-side*.35;head.add(tip);
    }
    const legs:T.Bone[]=[],knees:T.Bone[]=[];
    for(const x of [-.4,.4])for(const z of [-.69,.69]){
      const hip=bone(root,[x,.94,z],'Hip');part(hip,hide,[0,-.19,0],[.105,.25,.115]);
      const knee=bone(hip,[0,-.42,0],'Knee');part(knee,white,[0,-.19,0],[.075,.25,.075]);
      for(const side of [-1,1])part(knee,black,[side*.041,-.43,.035],[.041,.065,.12]);legs.push(hip);knees.push(knee);
    }
    part(root,pink,[0,.64,-.38],[.21,.15,.25]);for(const x of [-.09,.09])for(const z of [-.48,-.28])part(root,pink,[x,.51,z],[.032,.08,.032]);
    const tail:T.Bone[]=[];let parent:T.Object3D=root;
    for(let j=0;j<6;j++){const b=bone(parent,j===0?[0,1.36,-1.08]:[0,-.15,-.025],`Tail bone ${j}`);part(b,j===5?black:white,[0,-.078,-.013],j===5?[.065,.14,.06]:[.025,.1,.025]);tail.push(b);parent=b;}
    cows.push({root,legs,knees,tail,head,ears,spring:Array(6).fill(0),phase:random()*6.28,origin:root.position.clone(),travel:0,stride:0});
  }
  return cows;
}
export function stepCow(cow:Cow,time:number,dt:number){
  const graze=Math.sin(time*.18+cow.phase)>.86;
  if(!graze){cow.travel+=dt*.12;cow.stride+=dt*3.2;}
  const a=cow.travel+cow.phase;
  cow.root.position.set(cow.origin.x+Math.cos(a)*3.2,0,cow.origin.z+Math.sin(a)*2.4);
  cow.root.rotation.y=Math.atan2(-Math.sin(a)*3.2,Math.cos(a)*2.4);
  cow.head.rotation.x=T.MathUtils.damp(cow.head.rotation.x,graze?.78:.04+Math.sin(cow.stride)*.025,7,dt);
  cow.legs.forEach((hip,i)=>{
    const phase=cow.stride+[0,Math.PI,Math.PI,0][i],footZ=graze?0:Math.cos(phase)*.24;
    const footY=.065+(graze?0:Math.max(0,Math.sin(phase))*.16),dy=.94-footY;
    const length=T.MathUtils.clamp(Math.hypot(footZ,dy),.15,.858);
    const knee=Math.PI-Math.acos(T.MathUtils.clamp((.42*.42+.44*.44-length*length)/(2*.42*.44),-1,1));
    hip.rotation.x=-Math.atan2(footZ,dy)-Math.acos(T.MathUtils.clamp((.42*.42+length*length-.44*.44)/(2*.42*length),-1,1));
    cow.knees[i].rotation.x=knee;
  });
  cow.tail.forEach((bone,i)=>{
    const target=.11*Math.sin(time*2.2+cow.phase-i*.45)+(i===0?.13:0);
    cow.spring[i]+=((target-bone.rotation.z)*28-cow.spring[i]*7)*dt;
    bone.rotation.z+=cow.spring[i]*dt;bone.rotation.x=.07+Math.sin(time*1.5-i*.4)*.035;
  });
  cow.ears.forEach((ear,i)=>ear.rotation.x=Math.sin(time*2.4+cow.phase+i)*.12);
}
