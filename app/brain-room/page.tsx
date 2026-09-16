'use client';
import {ToolsSection} from '../components/WorldTools';
import {useCallback,useEffect,useRef,useState} from 'react';
import BrainWorld3D from './BrainWorld3D';
import BongoConsole from './BongoConsole';
import {useScreenMode} from '../lib/useScreenMode';
import type {BrainSubject} from './lib/creatures';
import './room.css';
function Joystick(){
 const center=useRef({x:0,y:0,id:-1});const [stick,setStick]=useState({x:0,y:0});
 const clear=()=>{center.current.id=-1;setStick({x:0,y:0});window.dispatchEvent(new CustomEvent('brain-stick',{detail:{x:0,z:0}}));};
 const move=(x:number,y:number)=>{let dx=(x-center.current.x)/42,dy=(y-center.current.y)/42;const length=Math.hypot(dx,dy);if(length>1){dx/=length;dy/=length;}setStick({x:dx*35,y:dy*35});window.dispatchEvent(new CustomEvent('brain-stick',{detail:{x:Math.abs(dx)>.1?dx:0,z:Math.abs(dy)>.1?dy:0}}));};
 return <div className="brain-joystick" role="group" aria-label="Movement joystick" onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);const b=e.currentTarget.getBoundingClientRect();center.current={x:b.left+b.width/2,y:b.top+b.height/2,id:e.pointerId};move(e.clientX,e.clientY);}} onPointerMove={e=>{if(center.current.id===e.pointerId)move(e.clientX,e.clientY);}} onPointerUp={clear} onPointerCancel={clear} onLostPointerCapture={clear}><i style={{transform:`translate(${stick.x}px,${stick.y}px)`}}/><span>MOVE</span></div>;
}
export default function BrainRoom(){
 const [subject,setSubject]=useState<BrainSubject>('pongo'),[pov,setPov]=useState(false),[ragdoll,setRagdoll]=useState(false),[reset,setReset]=useState(0),[spawn,setSpawn]=useState<'room'|'lab'|'field'|'garden'>('room');
 const [libraryOpen,setLibraryOpen]=useState(false);useEffect(()=>{const listener=(e:Event)=>setLibraryOpen(Boolean((e as CustomEvent).detail));window.addEventListener('trip-library-state',listener);return()=>window.removeEventListener('trip-library-state',listener);},[]);
 const [menu,setMenu]=useState(false),[consoleOpen,setConsoleOpen]=useState(false),[nearComputer,setNearComputer]=useState(false),[bongoUnlocked,setBongoUnlocked]=useState(false);
 useScreenMode(consoleOpen?'c':subject==='bongo'?'d':subject==='pongo'?'a':'b');
 useEffect(()=>{const arrival=new URLSearchParams(window.location.search).get('arrival');if(arrival==='lab'||arrival==='field'||arrival==='garden')setSpawn(arrival);},[]);
 const choose=useCallback((s:BrainSubject)=>{setSubject(s);setRagdoll(false);},[]);
 const close=useCallback(()=>setConsoleOpen(false),[]);
 const upload=useCallback(()=>{setBongoUnlocked(true);setSubject('bongo');setRagdoll(false);setConsoleOpen(false);},[]);
 const interact=useCallback(()=>setConsoleOpen(true),[]);
 const home=useCallback(()=>{setRagdoll(false);setSpawn('room');setReset(v=>v+1);},[]);
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.repeat||consoleOpen||(e.target as HTMLElement)?.closest('input,textarea,select'))return;if(e.code==='KeyR')setRagdoll(v=>!v);if(e.code==='KeyV')setPov(v=>!v);if(e.code==='KeyH')home();if(e.code==='Digit1')choose('pongo');if(e.code==='Digit2')choose('rat');if(e.code==='Digit3'&&bongoUnlocked)choose('bongo');if(e.code==='Escape')setMenu(v=>!v);};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[consoleOpen,bongoUnlocked,choose,home]);
 const touch=(pressed:boolean)=>window.dispatchEvent(new CustomEvent('brain-input',{detail:{code:'Space',pressed}}));
 const bongoAction=(action:'feed'|'beat')=>window.dispatchEvent(new CustomEvent('trip-bongo-action',{detail:{action}}));
 return <main className="brain-room cortex-game"><BrainWorld3D subject={subject} walkMode={pov} ragdoll={ragdoll} reset={reset} spawn={spawn} paused={consoleOpen||libraryOpen} onInteract={interact} onNearComputer={setNearComputer}/><div className="cortex-vignette" aria-hidden="true"/>
 <ToolsSection title="Brain world controls"><div id="brain-level-options" className="brain-options"><section><b>PLAY AS</b><div><button aria-pressed={subject==='pongo'} onClick={()=>choose('pongo')}>Pongo <kbd>1</kbd></button><button aria-pressed={subject==='rat'} onClick={()=>choose('rat')}>Lab rat <kbd>2</kbd></button>{bongoUnlocked&&<button aria-pressed={subject==='bongo'} onClick={()=>choose('bongo')}>Dr. Bongo <kbd>3</kbd></button>}</div></section><section><b>BODY & CAMERA</b><div><button aria-pressed={ragdoll} onClick={()=>setRagdoll(v=>!v)}>{ragdoll?'Stand up':'Ragdoll'} <kbd>R</kbd></button><button aria-pressed={pov} onClick={()=>setPov(v=>!v)}>{pov?'Follow camera':'First person'} <kbd>V</kbd></button><button onClick={home}>Back to room <kbd>H</kbd></button><a href="/assets-room">Assets room</a><button onClick={()=>{setSpawn('garden');setReset(v=>v+1);}}>Crystal library garden</button><button onClick={()=>window.dispatchEvent(new CustomEvent("brain-repair"))}>Restore walls & cows</button></div></section><section><b>BONGO</b><div><button disabled={!nearComputer} onClick={interact}>Use computer <kbd>E</kbd></button><button onClick={()=>bongoAction('feed')}>Feed banana</button><button onClick={()=>bongoAction('beat')}>Bonk Bongo</button><button onClick={()=>window.dispatchEvent(new Event("brain-laser"))}>Fire evil laser</button></div><small>Walk through the pasture’s north gate to the laboratory.</small></section><p>WASD / arrows move · Space jumps · Shift runs · Drag to look. Ragdolls can be grabbed and thrown.</p></div></ToolsSection>
 <ToolsSection category="spawn" title="Lab creatures"><div className="world-button-grid">{["baboon","gorilla","chimpanzee","yeti"].map(kind=><button key={kind} onClick={()=>window.dispatchEvent(new CustomEvent("trip-world-spawn",{detail:{kind},cancelable:true}))}>{kind}</button>)}</div></ToolsSection>
 <div className="brain-mobile-controls"><Joystick/><div className="brain-hand-controls"><button onClick={()=>window.dispatchEvent(new CustomEvent("brain-action",{detail:"pickup"}))}>Grab / drop</button><button onClick={()=>window.dispatchEvent(new CustomEvent("brain-action",{detail:"throw"}))}>Throw</button><button onClick={()=>window.dispatchEvent(new CustomEvent("brain-action",{detail:"hit"}))}>Hit</button></div><button className="brain-jump" onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);touch(true);}} onPointerUp={()=>touch(false)} onPointerCancel={()=>touch(false)} onLostPointerCapture={()=>touch(false)}>↑<span>JUMP</span></button></div>
 {nearComputer&&!consoleOpen&&<button className="brain-interact" onClick={interact}>Use Bongo’s computer <kbd>E</kbd></button>}{consoleOpen&&<BongoConsole onClose={close} onUpload={upload}/>}</main>;
}
