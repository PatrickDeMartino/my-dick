"use client";
import {ToolsSection} from '../components/WorldTools';
import { useScreenMode } from "../lib/useScreenMode";

import { useCallback, useMemo, useState } from "react";
import AssetRoom3D, { type AssetMode } from "./AssetRoom3D";
import { ASSET_CATEGORIES, SITE_ASSETS, type AssetCategory } from "../lib/assetRegistry";
import "./assets-room.css";

type Catalog = "ALL" | AssetCategory;
type SelectedEntity = {id:number;name:string;mode:AssetMode;scale:number}|null;
const emit=(name:string,detail?:unknown)=>window.dispatchEvent(new CustomEvent(name,{detail}));

export default function AssetsRoomPage(){
 const [open,setOpen]=useState(true),[category,setCategory]=useState<Catalog>("ALL"),[chosen,setChosen]=useState("goopy"),[count,setCount]=useState(0),[active,setActive]=useState("NONE"),[entity,setEntity]=useState<SelectedEntity>(null),[scale,setScale]=useState(1),[ammo,setAmmo]=useState("pepsi");
 useScreenMode(entity ? ({display:"a",ragdoll:"b",function:"c"}[entity.mode]) : "");
 const assets=useMemo(()=>SITE_ASSETS.filter(a=>category==="ALL"||a.category===category).sort((a,b)=>a.label.localeCompare(b.label)),[category]);
 const item=SITE_ASSETS.find(a=>a.id===chosen)??SITE_ASSETS[0];const onCount=useCallback((n:number)=>setCount(n),[]),onActive=useCallback((s:string)=>setActive(s),[]),onSelected=useCallback((s:SelectedEntity)=>{setEntity(s);if(s)setScale(Number(s.scale.toFixed(2)))},[]);
 const setMode=(mode:AssetMode)=>emit("asset-room:set-mode",{mode});const setEntityScale=(value:number)=>{setScale(value);emit("asset-room:set-scale",{scale:value})};
 const hold=(code:string)=>(e:React.PointerEvent<HTMLButtonElement>)=>{e.currentTarget.setPointerCapture(e.pointerId);emit("asset-room:key",{code,down:true})};const release=(code:string)=>()=>emit("asset-room:key",{code,down:false});
 return <main className="asset-room"><AssetRoom3D onCount={onCount} onActive={onActive} onSelected={onSelected}/><a className="asset-room__back" href="/brain-room">← BRAIN ROOM</a>
  <header className="asset-room__title"><small>SITE-WIDE WORLD RULEBOOK</small><h1>ASSETS ROOM</h1><p>{count} ENTITIES · CONTROL: {active}</p></header>
  <ToolsSection category="spawn" title="Site asset catalog"><div className="asset-room__menu"><header><b>SPAWN LIBRARY</b><small>{SITE_ASSETS.length} SHARED ASSETS</small></header>
   <nav>{(["ALL",...ASSET_CATEGORIES] as Catalog[]).map(name=><button type="button" className={category===name?"is-active":""} key={name} onClick={()=>setCategory(name)}>{name}</button>)}</nav>
   <div className="asset-room__list">{assets.map(a=><button type="button" key={a.id} className={chosen===a.id?"is-active":""} onClick={()=>setChosen(a.id)}><b>{a.label}</b><small>{a.source}</small></button>)}</div>
   <section className="asset-room__selected"><span>LIBRARY SELECTION</span><b>{item.label}</b><small>{item.source} · {item.builder}</small><button type="button" onClick={()=>emit("asset-room:spawn",{id:item.id,mode:"display"})}>SPAWN DISPLAY</button></section>
</div></ToolsSection><ToolsSection title="Selected asset"><div className="asset-room__menu"><section className="asset-room__inspector"><span>LIVE ENTITY</span><b>{entity?.name??"CLICK A MODEL"}</b><div className="asset-room__modes">{(["display","ragdoll","function"] as AssetMode[]).map(m=><button type="button" key={m} disabled={!entity} className={entity?.mode===m?"is-active":""} onClick={()=>setMode(m)}>{m.toUpperCase()}</button>)}</div><label>SIZE <output>{scale.toFixed(2)}×</output><input type="range" min="0.25" max="3" step="0.05" value={scale} disabled={!entity} onChange={e=>setEntityScale(Number(e.target.value))}/></label></section>
   <section className="asset-room__ammo"><span>PROJECTILE</span>{["pepsi","yoohoo","monster","rat-meat"].map(id=><button key={id} type="button" className={ammo===id?"is-active":""} onClick={()=>{setAmmo(id);emit("asset-room:set-ammo",{id})}}>{id.replace("-"," ").toUpperCase()}</button>)}</section>
   <div className="asset-room__actions"><button type="button" onClick={()=>SITE_ASSETS.forEach((a,i)=>setTimeout(()=>emit("asset-room:spawn",{id:a.id,mode:"display"}),i*60))}>SPAWN ALL</button><button type="button" className="is-clear" onClick={()=>emit("asset-room:clear")}>CLEAR ROOM</button></div>
  </div></ToolsSection>
  <div className="asset-room__help">CLICK MODEL TO EDIT · DISPLAY / RAGDOLL / FUNCTION · WASD MOVE · E PICK UP · F FIRE · SPACE JUMP/FLY</div>
  <div className="asset-room__mobile" aria-label="Character controls"><div><button onPointerDown={hold("KeyW")} onPointerUp={release("KeyW")}>▲</button><button onPointerDown={hold("KeyA")} onPointerUp={release("KeyA")}>◀</button><button onPointerDown={hold("KeyS")} onPointerUp={release("KeyS")}>▼</button><button onPointerDown={hold("KeyD")} onPointerUp={release("KeyD")}>▶</button></div><button onPointerDown={hold("Space")} onPointerUp={release("Space")}>JUMP</button><button onPointerDown={hold("KeyE")} onPointerUp={release("KeyE")}>GRAB</button><button onPointerDown={hold("KeyF")} onPointerUp={release("KeyF")}>FIRE</button></div>
 </main>;
}
