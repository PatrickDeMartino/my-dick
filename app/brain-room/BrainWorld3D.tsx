"use client";
import { useEffect, useRef, useState } from 'react';
import * as T from 'three';
import { makeBrainCreature, type BrainSubject } from './lib/creatures';
import { makeLevel, collide, SPAWN } from './lib/level';
import { Ragdoll } from './lib/ragdoll';
export { makeBrainCreature } from './lib/creatures';
export type { BrainSubject } from './lib/creatures';
type Controls={subject:BrainSubject;walkMode:boolean;ragdoll:boolean;reset:number};
export default function BrainWorld3D(props:Controls) {
  const mountRef=useRef<HTMLDivElement>(null);
  const settings=useRef(props);settings.current=props;
  const [error,setError]=useState('');
  useEffect(()=>{
    const mount=mountRef.current;if(!mount)return;
    let renderer:T.WebGLRenderer;
    try{renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});}catch{setError('This device could not start 3D graphics. Enable hardware acceleration and reload.');return;}
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
    renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
    mount.appendChild(renderer.domElement);
    const scene=new T.Scene();scene.background=new T.Color(0xcfacc1);scene.fog=new T.Fog(0xcfacc1,40,130);
    const level=makeLevel();scene.add(level.root);
    scene.add(new T.HemisphereLight(0xffe5dd,0x786656,1.15));
    const sun=new T.DirectionalLight(0xffd5a0,2.6);sun.position.set(-32,28,9);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-45;sun.shadow.camera.right=25;sun.shadow.camera.top=30;sun.shadow.camera.bottom=-30;sun.shadow.normalBias=.035;scene.add(sun);
    const windowGlow=new T.PointLight(0xe2bde9,24,16,2);windowGlow.position.set(-6,7,0);scene.add(windowGlow);
    const skySun=new T.Mesh(new T.SphereGeometry(5,24,16),new T.MeshBasicMaterial({color:0xffe3b4}));skySun.position.set(-75,22,10);scene.add(skySun);
    const camera=new T.PerspectiveCamera(62,1,.06,220);camera.position.set(3.8,6.5,4.3);
    const player={p:SPAWN.clone(),v:new T.Vector3(),grounded:false};const radius=.3;
    let current:BrainSubject=null,creature:T.Group|null=null,rag:Ragdoll|null=null,minY=0,height=1.5;
    let reset=settings.current.reset,yaw=.5,pitch=.22,dragging=false,lastX=0,lastY=0,walk=0,active=true;
    const keys=new Set<string>();const mouse=new T.Vector2(),ray=new T.Raycaster();let grabPlane:T.Plane|null=null;
    const disposeObject=(object:T.Object3D)=>{const gs=new Set<T.BufferGeometry>(),ms=new Set<T.Material>();object.traverse(o=>{if(o instanceof T.Mesh){gs.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>ms.add(m));}});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());object.removeFromParent();};
    function updateCreature(next:BrainSubject,at=player.p.clone()){
      if(rag){disposeObject(rag.root);rag=null;}if(creature)disposeObject(creature);
      creature=next?makeBrainCreature(next):null;current=next;
      if(creature){const bounds=new T.Box3().setFromObject(creature);minY=bounds.min.y;height=bounds.max.y-bounds.min.y;scene.add(creature);player.p.copy(at);player.v.set(0,0,0);creature.position.copy(at);creature.position.y+=.16-radius-minY;}
    }
    const keydown=(event:KeyboardEvent)=>{if((event.target as HTMLElement)?.closest('input,textarea,select'))return;if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','ShiftLeft'].includes(event.code)){event.preventDefault();keys.add(event.code);}if(event.code==='Space'&&player.grounded&&!rag){player.v.y=7.8;player.grounded=false;}};
    const keyup=(e:KeyboardEvent)=>keys.delete(e.code);
    const blur=()=>{keys.clear();dragging=false;rag?.release();};
    const touchInput=(e:Event)=>{const {code,pressed}= (e as CustomEvent<{code:string;pressed:boolean}>).detail;if(pressed){keys.add(code);if(code==='Space'&&player.grounded&&!rag){player.v.y=7.8;player.grounded=false;}}else keys.delete(code);};
    const locate=(e:PointerEvent)=>{const b=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-b.left)/b.width*2-1,-(e.clientY-b.top)/b.height*2+1);ray.setFromCamera(mouse,camera);};
    const down=(e:PointerEvent)=>{renderer.domElement.setPointerCapture(e.pointerId);lastX=e.clientX;lastY=e.clientY;locate(e);if(rag){const hit=ray.intersectObject(rag.root,true)[0];if(hit){let nearest=0,best=Infinity;rag.nodes.forEach((n,i)=>{const d=n.p.distanceTo(hit.point);if(d<best){best=d;nearest=i;}});rag.grabbed=nearest;rag.target.copy(rag.nodes[nearest].p);grabPlane=new T.Plane().setFromNormalAndCoplanarPoint(camera.getWorldDirection(new T.Vector3()),rag.target);return;}}dragging=true;};
    const move=(e:PointerEvent)=>{if(rag&&rag.grabbed!==null&&grabPlane){locate(e);const target=ray.ray.intersectPlane(grabPlane,new T.Vector3());if(target)rag.target.copy(target);return;}if(dragging){yaw-=(e.clientX-lastX)*.005;pitch=T.MathUtils.clamp(pitch+(e.clientY-lastY)*.003,-.3,1);lastX=e.clientX;lastY=e.clientY;}};
    const up=()=>{dragging=false;rag?.release();grabPlane=null;};const visibility=()=>{active=!document.hidden;blur();};
    window.addEventListener('keydown',keydown);window.addEventListener('keyup',keyup);window.addEventListener('blur',blur);window.addEventListener('brain-input',touchInput);document.addEventListener('visibilitychange',visibility);
    const canvas=renderer.domElement;canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
    const resize=()=>{const w=Math.max(mount.clientWidth,1),h=Math.max(mount.clientHeight,1);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(mount);resize();
    const clock=new T.Clock();let frame=0,accumulator=0,time=0;
    const cameraRay=new T.Raycaster();const colliderMeshes:T.Mesh[]=[];
    for(const s of level.solids){const m=new T.Mesh(new T.BoxGeometry(s.half.x*2,s.half.y*2,s.half.z*2),new T.MeshBasicMaterial({side:T.DoubleSide}));m.position.copy(s.center);m.updateMatrixWorld();colliderMeshes.push(m);}
    const animate=()=>{
      frame=requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.05);if(!active)return;time+=dt;const state=settings.current;
      if(state.subject!==current)updateCreature(state.subject,rag?rag.center():player.p);
      if(state.reset!==reset){reset=state.reset;updateCreature(state.subject,SPAWN.clone());yaw=.5;pitch=.22;}
      if(creature&&state.ragdoll&&!rag){creature.updateMatrixWorld(true);rag=new Ragdoll(creature,scene,player.v.clone().add(new T.Vector3(0,3,0)));}
      if(rag&&!state.ragdoll){const p=rag.center();p.y+=.35;updateCreature(state.subject,p);}
      accumulator=Math.min(accumulator+dt,.1);
      while(accumulator>=1/60){const step=1/60;accumulator-=step;
        if(rag)rag.step(step,level.solids);
        else if(creature){
          let x=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));
          let z=Number(keys.has('KeyS')||keys.has('ArrowDown'))-Number(keys.has('KeyW')||keys.has('ArrowUp'));
          const length=Math.hypot(x,z)||1;x/=length;z/=length;const speed=keys.has('ShiftLeft')?5.5:3.4;
          player.v.x=(x*Math.cos(yaw)+z*Math.sin(yaw))*speed;player.v.z=(-x*Math.sin(yaw)+z*Math.cos(yaw))*speed;player.v.y-=18*step;
          player.p.addScaledVector(player.v,step);player.grounded=collide(player.p,radius,level.solids,player.v);
          for(const y of [height*.42,height*.76]){const upper=player.p.clone();upper.y+=y;const before=upper.clone();collide(upper,radius,level.solids,player.v);player.p.add(upper.sub(before));}
          player.p.x=T.MathUtils.clamp(player.p.x,-80,80);player.p.z=T.MathUtils.clamp(player.p.z,-80,80);if(player.p.y<-10)player.p.copy(SPAWN);
          creature.position.copy(player.p);creature.position.y+=.16-radius-minY;
          if(Math.abs(x)+Math.abs(z)>.05){creature.rotation.y=Math.atan2(player.v.x,player.v.z);walk+=step*9;(creature.userData.limbs as T.Group[]).forEach((limb,i)=>{limb.rotation.x=Math.sin(walk+i*Math.PI*.7)*.35;});}
          else (creature.userData.limbs as T.Group[]).forEach(l=>l.rotation.x*=.82);
        }
      }
      for(const cow of level.cows){const a=time*.065+cow.phase;cow.root.position.set(cow.origin.x+Math.cos(a)*3.2,0,cow.origin.z+Math.sin(a)*2.4);cow.root.rotation.y=Math.atan2(-Math.sin(a)*3.2,Math.cos(a)*2.4);cow.legs.forEach((l,i)=>l.rotation.x=Math.sin(time*2.3+i*Math.PI)*.18);}
      let focus:T.Vector3,desired:T.Vector3;
      if(creature){focus=rag?rag.center():player.p.clone().add(new T.Vector3(0,height*.58,0));
        if(state.walkMode&&!rag){desired=player.p.clone().add(new T.Vector3(0,height*.85,0));focus=desired.clone().add(new T.Vector3(-Math.sin(yaw)*Math.cos(pitch),-Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)));creature.visible=false;}
        else{creature.visible=!rag;desired=focus.clone().add(new T.Vector3(Math.sin(yaw)*4,1.3+pitch*3,Math.cos(yaw)*4));const dir=desired.clone().sub(focus);const distance=dir.length();cameraRay.set(focus,dir.normalize());cameraRay.far=distance;const hit=cameraRay.intersectObjects(colliderMeshes,false)[0];if(hit)desired.copy(focus).addScaledVector(dir,Math.max(.2,hit.distance-.2));}
      }else{focus=new T.Vector3(-.7,5.2,-2);desired=new T.Vector3(Math.sin(yaw)*4,6+pitch*3,Math.cos(yaw)*4);}
      camera.position.lerp(desired,1-Math.exp(-dt*12));camera.lookAt(focus);
      const location=mount.querySelector('[data-location]');if(location){const p=rag?rag.center():player.p;const text=p.x< -6.3||Math.abs(p.z)>6.4||p.x>6.4?'COW MEADOW':'BRAIN ROOM';if(location.textContent!==text)location.textContent=text;}
      renderer.render(scene,camera);
    };animate();
    return()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('keydown',keydown);window.removeEventListener('keyup',keyup);window.removeEventListener('blur',blur);window.removeEventListener('brain-input',touchInput);document.removeEventListener('visibilitychange',visibility);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);disposeObject(scene);colliderMeshes.forEach(disposeObject);renderer.dispose();canvas.remove();};
  },[]);
  return <div ref={mountRef} className="brain-world-3d" aria-label="Playable 3D brain room and outdoor cow meadow"><span className="cortex-location" data-location>BRAIN ROOM</span>{error&&<p className="cortex-error" role="alert">{error}</p>}</div>;
}
