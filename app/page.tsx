"use client";

import {ToolsSection} from "./components/WorldTools";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useScreenMode } from "./lib/useScreenMode";
import HomeGlobe from "./components/HomeGlobe";
import HomeRoom3D, { setHomeSpatial, spawnHomeCan } from "./components/HomeRoom3D";

const smokePuffs = Array.from({ length: 7 }, (_, index) => index);
type HomeObject = "globe" | "brain" | "camera";
type Spatial = { x:number; y:number; z:number; scale:number };
const HOME_DEFAULTS: Record<HomeObject,Spatial> = { globe:{x:0,y:0,z:0,scale:.5}, brain:{x:0,y:0,z:0,scale:1}, camera:{x:0,y:.2,z:0,scale:1} };

export default function LandingPage() {
  const [homeEditTarget,setHomeEditTarget] = useState<HomeObject>("brain");
  const [homeSpatial,setHomeSpatialState] = useState(HOME_DEFAULTS);
  const [toolsOpen,setToolsOpen] = useState(true);
  const [cubeOpen,setCubeOpen] = useState(false);

  const [pongoActive,setPongoActive] = useState(false);
  useEffect(() => { const onMode = (event: Event) => setPongoActive((event as CustomEvent).detail); window.addEventListener("trip-pongo-mode",onMode); return () => window.removeEventListener("trip-pongo-mode",onMode); },[]);
  useScreenMode((pongoActive ? "a" : "") + (cubeOpen ? "b" + ({brain:1,globe:2,camera:3}[homeEditTarget]) : ""));
  useEffect(()=>{ setHomeSpatial("brain",homeSpatial.brain); },[homeSpatial.brain]);
  useEffect(()=>{ setHomeSpatial("camera",homeSpatial.camera); },[homeSpatial.camera]);
  const updateSpatial=(key:keyof Spatial,value:number)=>setHomeSpatialState(current=>({...current,[homeEditTarget]:{...current[homeEditTarget],[key]:value}}));
  const globeTransform=homeSpatial.globe;

  return (
    <main className="choice-landing" aria-label="Choose where your journey begins">
      <HomeRoom3D />
      <div className="choice-world-stage" aria-label="Choose between Planet Urf and Dr. Bongo">
        <button
          className="choice-object choice-object-earth"
          type="button"
          data-portal="earth"
          aria-label="Enter Planet Urf"
          onClick={() => window.location.assign("/urf-3d")}
          style={{ transform:`translate3d(calc(-6.505% + ${globeTransform.x*90+2.9}px),${-globeTransform.y*78}px,0) scale(${globeTransform.scale*(1+globeTransform.z*.18)})` }}
        >
          <span className="choice-object-visual choice-object-visual--globe" aria-hidden="true">
            <HomeGlobe onActivate={() => window.location.assign("/urf-3d")} />
          </span>
          <span className="choice-smoke" aria-hidden="true">
            {smokePuffs.map((puff) => <i key={puff} />)}
          </span>
          <span className="choice-object-label">
            <strong>Planet Urf</strong>
          </span>
        </button>

        <div
          className="choice-object choice-object-brain"
          data-portal="brain"
          aria-hidden="true"
        >
          <span className="choice-smoke" aria-hidden="true">
            {smokePuffs.map((puff) => <i key={puff} />)}
          </span>
          <span className="choice-object-label">
            <strong>that fucking other thing</strong>
            <small>Enter the unknown</small>
          </span>
        </div>
      </div>
      <div className="choice-vignette" aria-hidden="true" />

      <ToolsSection category="spawn" title="Home creatures"><div className="world-button-grid"><button onClick={()=>spawnHomeCan("WORMS")}>Worms</button><button onClick={()=>spawnHomeCan("PONGO")}>Pongo mode</button></div></ToolsSection>
      <ToolsSection title="Home objects & camera"><aside className="home-cube-menu" aria-label="Home room spatial controls">
        <button type="button" className="menu-close" aria-label="Collapse cube controls" onClick={()=>setCubeOpen(false)}>×</button>
        <header><b>⬛ CUBE</b><small>{homeEditTarget === "camera" ? "ORBIT · PAN · ZOOM" : homeEditTarget === "globe" ? "OBJECT SPACE" : "XYZ SPACE"}</small></header>
        <div className="home-cube-menu__targets">
          {(["brain","globe","camera"] as HomeObject[]).map(target=><button type="button" key={target} className={homeEditTarget===target?"is-active":""} onClick={()=>setHomeEditTarget(target)}>{target.toUpperCase()}</button>)}
        </div>
        {(["x","y","z","scale"] as (keyof Spatial)[]).map(axis=><label key={axis}><span>{homeEditTarget==="camera"?({x:"YAW",y:"PITCH",z:"ROLL",scale:"ZOOM"} as const)[axis]:axis==="scale"?"SIZE":axis.toUpperCase()}</span><input type="range" min={axis==="scale"?.25:homeEditTarget==="camera"&&axis==="y"?-1.1:-3.14} max={axis==="scale"?2.2:homeEditTarget==="camera"&&axis==="y"?1.1:3.14} step={axis==="scale"?.05:.05} value={homeSpatial[homeEditTarget][axis]} onChange={event=>updateSpatial(axis,Number(event.target.value))}/><b>{homeSpatial[homeEditTarget][axis].toFixed(2)}</b></label>)}
        <button type="button" className="home-cube-menu__reset" onClick={()=>setHomeSpatialState(current=>({...current,[homeEditTarget]:{...HOME_DEFAULTS[homeEditTarget]}}))}>RESET {homeEditTarget.toUpperCase()}</button>
      </aside></ToolsSection>
      <p className="home-camera-hint">DRAG ROTATE · RIGHT-DRAG PAN · SCROLL ZOOM · PONGO: WASD + SPACE</p>

      <a
        className="choice-kicker"
        href="/anubis"
        aria-label="Enter the Anubis television room"
      >
        <span>youtube bot farm</span>
      </a>

      <Link
        className="guide-orb"
        href="/map"
        aria-label="Open the ship's chart of the whole labyrinth, guided by a friendly alien"
      >
        <span className="guide-orb__face" aria-hidden="true">👽</span>
        <span className="guide-orb__label">ship&apos;s chart</span>
      </Link>
    </main>
  );
}
