'use client';
import {useEffect,useRef,useState} from 'react';
import {usePathname} from 'next/navigation';
import * as T from 'three';
import {WorldSimulation} from '../world/WorldSimulation';
export default function LooseObjects(){const ref=useRef<HTMLDivElement>(null),path=usePathname(),[active,setActive]=useState(false),[grab,setGrab]=useState(false);
 useEffect(()=>{const mount=ref.current;if(!mount)return;let renderer:T.WebGLRenderer|null=null,world:WorldSimulation|null=null,scene:T.Scene,camera:T.PerspectiveCamera;
 const resize=()=>{if(!renderer)return;camera.aspect=mount.clientWidth/Math.max(1,mount.clientHeight);camera.updateProjectionMatrix();renderer.setSize(mount.clientWidth,mount.clientHeight);};
 const init=()=>{if(renderer)return;renderer=new T.WebGLRenderer({alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.toneMapping=T.ACESFilmicToneMapping;mount.appendChild(renderer.domElement);scene=new T.Scene();camera=new T.PerspectiveCamera(48,1,.05,200);camera.position.set(0,4,12);camera.lookAt(0,1,0);scene.add(new T.HemisphereLight(0xe8d6ff,0x68468b,3));const light=new T.DirectionalLight(0xffe9bb,4);light.position.set(3,6,5);scene.add(light);world=new WorldSimulation(scene,camera,renderer.domElement,{ground:-1,bounds:15,spawnPoint:()=>new T.Vector3((Math.random()-.5)*4,3,0)});resize();const clock=new T.Clock();renderer.setAnimationLoop(()=>{world!.update(Math.min(clock.getDelta(),.05));world!.followCamera();renderer!.render(scene,camera);});};
 const spawn=(event:Event)=>{const e=event as CustomEvent<{kind:string}>;if(world)setActive(true);queueMicrotask(()=>{if(e.defaultPrevented)return;try{init();setActive(true);void world!.spawn(e.detail.kind);}catch(error){console.error('World stage failed',error);}});};
 const select=(e:Event)=>setGrab(Boolean((e as CustomEvent).detail.selecting));
 const clear=()=>setActive(false);window.addEventListener('trip-world-spawn',spawn);window.addEventListener('trip-physics-settings',select);window.addEventListener('trip-world-clear',clear);window.addEventListener('resize',resize);
 return()=>{world?.dispose();renderer?.setAnimationLoop(null);renderer?.dispose();renderer?.domElement.remove();window.removeEventListener('trip-world-spawn',spawn);window.removeEventListener('trip-physics-settings',select);window.removeEventListener('trip-world-clear',clear);window.removeEventListener('resize',resize);setActive(false);};},[path]);
 return <><div ref={ref} className="world-object-layer" style={{pointerEvents:active&&grab?'auto':'none'}}/>{active&&<button className="world-object-grab" onClick={()=>setGrab(v=>!v)}>{grab?'Return to page':'Interact with spawned models'}</button>}</>;
}
