"use client";

import { useCallback, useMemo, useState } from "react";
import AssetRoom3D from "./AssetRoom3D";
import { ASSET_CATEGORIES, SITE_ASSETS, type AssetCategory } from "../lib/assetRegistry";
import "./assets-room.css";

const emit=(name:string,detail?:unknown)=>window.dispatchEvent(new CustomEvent(name,{detail}));

export default function AssetsRoomPage(){
  const [open,setOpen]=useState(true),[category,setCategory]=useState<AssetCategory>("CHARACTERS"),[selected,setSelected]=useState("goopy"),[count,setCount]=useState(0),[active,setActive]=useState("NONE");
  const assets=useMemo(()=>SITE_ASSETS.filter(asset=>asset.category===category),[category]);
  const item=SITE_ASSETS.find(asset=>asset.id===selected)??SITE_ASSETS[0];
  const onCount=useCallback((value:number)=>setCount(value),[]),onActive=useCallback((value:string)=>setActive(value),[]);
  const hold=(code:string)=>(event:React.PointerEvent<HTMLButtonElement>)=>{event.currentTarget.setPointerCapture(event.pointerId);emit("asset-room:key",{code,down:true});};
  const release=(code:string)=>()=>emit("asset-room:key",{code,down:false});
  return <main className="asset-room">
    <AssetRoom3D onCount={onCount} onActive={onActive}/>
    <a className="asset-room__back" href="/brain-room">← BRAIN ROOM</a>
    <header className="asset-room__title"><small>SHARED MODEL WORKSHOP</small><h1>ASSETS ROOM</h1><p>{count} ENTITIES · CONTROL: {active}</p></header>
    {!open&&<button className="asset-room__open" type="button" onClick={()=>setOpen(true)} aria-label="Open asset catalog">＋</button>}
    {open&&<aside className="asset-room__menu" aria-label="Site asset catalog">
      <button className="menu-close" type="button" onClick={()=>setOpen(false)} aria-label="Collapse asset catalog">×</button>
      <header><b>SPAWN LIBRARY</b><small>{SITE_ASSETS.length} SHARED ASSETS</small></header>
      <nav>{ASSET_CATEGORIES.map(name=><button type="button" className={category===name?"is-active":""} key={name} onClick={()=>{setCategory(name);const first=SITE_ASSETS.find(asset=>asset.category===name);if(first)setSelected(first.id);}}>{name}</button>)}</nav>
      <div className="asset-room__list">{assets.map(asset=><button type="button" key={asset.id} className={selected===asset.id?"is-active":""} onClick={()=>setSelected(asset.id)}><b>{asset.label}</b><small>{asset.source}</small></button>)}</div>
      <section className="asset-room__selected"><span>SELECTED</span><b>{item.label}</b><small>{item.source} · {item.builder}</small></section>
      <div className="asset-room__actions"><button type="button" onClick={()=>emit("asset-room:spawn",{id:item.id})}>DROP ONE</button>{item.category==="CHARACTERS"&&<button type="button" className="is-control" onClick={()=>emit("asset-room:spawn",{id:item.id,possess:true})}>DROP + CONTROL</button>}<button type="button" onClick={()=>SITE_ASSETS.forEach((asset,index)=>setTimeout(()=>emit("asset-room:spawn",{id:asset.id}),index*80))}>SPAWN ALL</button><button type="button" className="is-clear" onClick={()=>emit("asset-room:clear")}>CLEAR ROOM</button></div>
    </aside>}
    <div className="asset-room__help">DRAG ORBIT · WHEEL ZOOM · RIGHT DRAG PAN · WASD MOVE · SHIFT RUN · SPACE JUMP · F FIRE</div>
    <div className="asset-room__mobile" aria-label="Character controls"><div><button onPointerDown={hold("KeyW")} onPointerUp={release("KeyW")} onPointerCancel={release("KeyW")}>▲</button><button onPointerDown={hold("KeyA")} onPointerUp={release("KeyA")} onPointerCancel={release("KeyA")}>◀</button><button onPointerDown={hold("KeyS")} onPointerUp={release("KeyS")} onPointerCancel={release("KeyS")}>▼</button><button onPointerDown={hold("KeyD")} onPointerUp={release("KeyD")} onPointerCancel={release("KeyD")}>▶</button></div><button onPointerDown={hold("Space")} onPointerUp={release("Space")}>JUMP</button><button onPointerDown={hold("KeyF")} onPointerUp={release("KeyF")}>FIRE</button></div>
  </main>;
}
