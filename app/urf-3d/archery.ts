import {Vector3} from 'three';
import {gravityAcceleration} from '../world/physics';
export const SHOT_GRAVITY=-1.55;
export const shotGravity=()=>SHOT_GRAVITY*gravityAcceleration()/9.81;
export const SHOT_STEP=1/240;
export const PLANET_CENTER=new Vector3(1.12,.23,-.5);
export function launchVelocity(origin:Vector3,target:Vector3,charge:number){
  const speed=2.4+3.2*Math.max(0,Math.min(1,charge));
  const flight=Math.max(.16,origin.distanceTo(target)/speed*(1.6-.3*charge));
  const v=target.clone().sub(origin).divideScalar(flight);
  // Compensate the fixed-step semi-implicit gravity used by both preview and flight.
  v.y-=.5*shotGravity()*(flight+SHOT_STEP);
  return v;
}
export function sphereContact(from:Vector3,to:Vector3,center:Vector3,radius:number){
  const direction=to.clone().sub(from),offset=from.clone().sub(center);
  const a=direction.lengthSq(),b=2*offset.dot(direction),c=offset.lengthSq()-radius*radius;
  if(a<1e-14)return null;
  const discriminant=b*b-4*a*c;if(discriminant<0)return null;
  const t=(-b-Math.sqrt(discriminant))/(2*a);
  return t>=0&&t<=1?from.clone().addScaledVector(direction,t):null;
}
export function predictFlight(origin:Vector3,velocity:Vector3,center:Vector3,radius:number,contact?:(from:Vector3,to:Vector3)=>Vector3|null){
  const p=origin.clone(),v=velocity.clone(),points=[p.clone()];let hit:Vector3|null=null;
  for(let i=0;i<1680;i++){
    const before=p.clone();v.y+=shotGravity()*SHOT_STEP;p.addScaledVector(v,SHOT_STEP);
    hit=contact?contact(before,p):sphereContact(before,p,center,radius);if(hit){points.push(hit);break;}
    if(i%12===0)points.push(p.clone());if(p.length()>14)break;
  }
  return {points,hit};
}

/** Swept radial relief collision, shared by aiming preview and live arrows. */
export function reliefContact(from:Vector3,to:Vector3,center:Vector3,surfaceRadius:(direction:Vector3)=>number){
 const gap=(p:Vector3)=>{const d=p.clone().sub(center);return d.length()-surfaceRadius(d.normalize());};const a=gap(from),b=gap(to);if(a<=0||b>0)return null;let lo=0,hi=1;for(let i=0;i<12;i++){const mid=(lo+hi)*.5;if(gap(from.clone().lerp(to,mid))>0)lo=mid;else hi=mid;}return from.clone().lerp(to,hi);
}
