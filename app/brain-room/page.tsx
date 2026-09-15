"use client";
import {useEffect,useState} from 'react';
import BrainWorld3D from './BrainWorld3D';
import {useScreenMode} from '../lib/useScreenMode';
import './room.css';
export default function BrainRoom(){
  const [subject,setSubject]=useState<'pongo'|'rat'>('pongo');
  const [pov,setPov]=useState(false),[ragdoll,setRagdoll]=useState(false),[reset,setReset]=useState(0);
  useScreenMode(subject==='pongo'?'a':'b');
  useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.repeat||(e.target as HTMLElement)?.closest('input,textarea,select'))return;if(e.code==='KeyR')setRagdoll(v=>!v);if(e.code==='KeyV')setPov(v=>!v);if(e.code==='KeyH'){setRagdoll(false);setReset(v=>v+1);}if(e.code==='Digit1'){setSubject('pongo');setRagdoll(false);}if(e.code==='Digit2'){setSubject('rat');setRagdoll(false);}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[]);
  const touch=(code:string,pressed:boolean)=>window.dispatchEvent(new CustomEvent('brain-input',{detail:{code,pressed}}));
  const choose=(s:'pongo'|'rat')=>{setSubject(s);setRagdoll(false);};
  return <main className="brain-room cortex-game">
    <BrainWorld3D subject={subject} walkMode={pov} ragdoll={ragdoll} reset={reset}/>
    <div className="cortex-vignette" aria-hidden="true"/>
    <header className="cortex-header"><a href="/" className="cortex-home">↖ HOME</a><div><p>TRIPTOTROPIC / A LIVING PLACE</p><h1>The brain room<span> & the meadow</span></h1></div><a href="/bongo" className="cortex-lab">BONGO LAB ↗</a></header>
    <aside className="cortex-note"><span>01 / THROUGH THE WINDOW</span><p>There’s a whole world<br/>outside your head.</p><small>Jump through the arch into the cow field.<br/>Take the wooden steps to come back.</small></aside>
    <footer className="cortex-dock">
      <div className="cortex-subjects" aria-label="Playable characters">
        <button aria-pressed={subject==='pongo'} onClick={()=>choose('pongo')}><img src="/media/dr-bongo-model-icon-v1.png" alt=""/><span><small>01 / PRIMATE</small><b>Pongo</b></span></button>
        <button aria-pressed={subject==='rat'} onClick={()=>choose('rat')}><img src="/media/lab-rat-ragdoll-v2.png" alt=""/><span><small>02 / RODENT</small><b>Lab rat</b></span></button>
      </div>
      <div className="cortex-actions"><button aria-pressed={ragdoll} onClick={()=>setRagdoll(v=>!v)}>{ragdoll?'Stand up':'Ragdoll'} <kbd>R</kbd></button><button aria-pressed={pov} onClick={()=>setPov(v=>!v)}>{pov?'Follow camera':'First person'} <kbd>V</kbd></button><button onClick={()=>{setRagdoll(false);setReset(v=>v+1);}}>Back to room <kbd>H</kbd></button></div>
      <p className="cortex-keys">{ragdoll?'Drag the body to lift it. Release to throw.':'WASD / arrows · Move     Shift · Run     Space · Jump     Drag · Look'}</p>
    </footer>
    <div className="cortex-touch" aria-label="Touch movement">{[['KeyW','↑'],['KeyA','←'],['KeyS','↓'],['KeyD','→'],['Space','Jump']].map(([code,label])=><button key={code} aria-label={label==='Jump'?'Jump':`Move ${label}`} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);touch(code,true);}} onPointerUp={()=>touch(code,false)} onPointerCancel={()=>touch(code,false)}>{label}</button>)}</div>
  </main>;
}
