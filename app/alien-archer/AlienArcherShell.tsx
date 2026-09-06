"use client";

import Link from "next/link";
import { useRef, useState } from "react";

const SPAWNS = [
  ["vehicle","VEHICLE"],["jetpack","JET PACK"],["ak47","AK-47"],["revolver","REVOLVER"],["bow","BOW"],["arrow","ARROW"],
  ["rat-meat","RAT MEAT · MIX"],["rat-meat-silver","RAT MEAT · SILVER"],["rat-meat-gold","RAT MEAT · GOLD"],["yoohoo","YOO-HOO CAN"],
  ["biplane","PENGUIN BIPLANE"],["penguin","PENGUIN RAGDOLL"],["bongo","BONGO RAGDOLL"],
] as const;
const ALIENS = [["zix","ZIX"],["pip","PIP"],["vex","VEX"]] as const;

export default function AlienArcherShell() {
  const frame = useRef<HTMLIFrameElement>(null);
  const [open,setOpen] = useState(false);
  const send = (kind:string) => frame.current?.contentWindow?.postMessage({type:"urf-spawn",kind},window.location.origin);
  return (
    <main className="alien-archer-screen">
      <Link className="alien-archer-back" href="/urf-3d">← VOID SELECT</Link>
      <button type="button" className="spawn-shit-toggle" onClick={()=>setOpen(v=>!v)} aria-expanded={open}>SPAWN SHIT</button>
      {open && (
        <aside className="spawn-shit-menu" aria-label="Spawn sandbox objects">
          <b>DROP INTO PHYSICS</b>
          <div>{SPAWNS.map(([id,label])=><button type="button" key={id} onClick={()=>send(id)}>{label}</button>)}</div>
          <b>SWAP ALIEN</b>
          <div>{ALIENS.map(([id,label])=><button type="button" key={id} onClick={()=>send(id)}>{label}</button>)}</div>
        </aside>
      )}
      <iframe ref={frame} className="alien-archer-frame" src="/alien-archer-game/index.html" title="Alien Archer physics sandbox" allow="fullscreen; autoplay; pointer-lock" />
    </main>
  );
}
