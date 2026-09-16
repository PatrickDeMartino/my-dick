import {gravityAcceleration} from '../../world/physics';
import * as T from 'three';
import { collide, type Solid } from './level';
type Node = { object:T.Object3D; p:T.Vector3; previous:T.Vector3; original:T.Vector3; quaternion:T.Quaternion; radius:number; neighbor:number };
/** Fixed-step position-based articulated bodies with distance joints and collisions. */
export class Ragdoll {
  nodes:Node[]=[];
  links:{a:number;b:number;length:number}[]=[];
  root=new T.Group();
  grabbed:number|null=null;
  target=new T.Vector3();
  constructor(creature:T.Group, scene:T.Scene, impulse:T.Vector3) {
    scene.add(this.root);creature.updateMatrixWorld(true);
    const pieces:T.Object3D[]=[];
    creature.traverse(o=>{if(o instanceof T.Group && o!==creature && o.children.some(c=>c instanceof T.Mesh))pieces.push(o);});
    pieces.reverse().forEach(o=>this.root.attach(o));
    [...creature.children].forEach(o=>this.root.attach(o));
    [...this.root.children].forEach(object=>{
      const bounds=new T.Box3().setFromObject(object);if(bounds.isEmpty())return;
      const center=bounds.getCenter(new T.Vector3());
      const pivot=new T.Group();this.root.add(pivot);pivot.position.copy(center);pivot.attach(object);
      const size=bounds.getSize(new T.Vector3());const radius=T.MathUtils.clamp(Math.min(size.x,size.y,size.z)*.45,.045,.38);
      this.nodes.push({object:pivot,p:center.clone(),previous:center.clone().addScaledVector(impulse,-1/60),original:center.clone(),quaternion:pivot.quaternion.clone(),radius,neighbor:0});
    });
    const connected=new Set([0]);
    while(connected.size<this.nodes.length){let best=Infinity,a=0,b=0;for(const i of connected)for(let j=0;j<this.nodes.length;j++)if(!connected.has(j)){const d=this.nodes[i].p.distanceTo(this.nodes[j].p);if(d<best){best=d;a=i;b=j;}}this.links.push({a,b,length:best});this.nodes[b].neighbor=a;connected.add(b);}
    if(this.nodes.length>1)this.nodes[0].neighbor=1;
    for(let a=0;a<this.nodes.length;a++)for(let b=a+1;b<this.nodes.length;b++){const length=this.nodes[a].p.distanceTo(this.nodes[b].p);if(length<.38&&!this.links.some(l=>l.a===a&&l.b===b))this.links.push({a,b,length});}
    creature.visible=false;
  }
  step(dt:number, solids:Solid[]) {
    for(const n of this.nodes){const v=n.p.clone().sub(n.previous).multiplyScalar(.985);n.previous.copy(n.p);n.p.add(v);n.p.y-=gravityAcceleration()*dt*dt;}
    for(let pass=0;pass<9;pass++){
      for(const l of this.links){const a=this.nodes[l.a],b=this.nodes[l.b],delta=b.p.clone().sub(a.p),d=delta.length();if(d>.0001){delta.multiplyScalar((d-l.length)/d*.5);if(l.a!==this.grabbed)a.p.add(delta);if(l.b!==this.grabbed)b.p.sub(delta);}}
      if(this.grabbed!==null)this.nodes[this.grabbed].p.lerp(this.target,.8);
      for(const n of this.nodes){const v=n.p.clone().sub(n.previous);const onGround=collide(n.p,n.radius,solids,v,.14);if(onGround){v.x*=.88;v.z*=.88;}n.previous.copy(n.p).sub(v);}
    }
    for(const n of this.nodes){n.object.position.copy(n.p);const other=this.nodes[n.neighbor];const rest=other.original.clone().sub(n.original).normalize(),now=other.p.clone().sub(n.p).normalize();if(rest.lengthSq()>.1&&now.lengthSq()>.1)n.object.quaternion.setFromUnitVectors(rest,now).multiply(n.quaternion);}
  }
  center(){return this.nodes[0]?.p.clone()??new T.Vector3();}
  release(){this.grabbed=null;}
}
